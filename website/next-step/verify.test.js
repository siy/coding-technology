// verify.test.js — the exit gate's arithmetic, and its refusals.
//
// The refusals matter more than the sums: a gate that invents a missing floor agrees
// with itself. Every "UNVERIFIED" below is tested behavior, not documentation.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  latencyDecomposition,
  tailComposition,
  envelopeComposition,
  availabilityMultiplication,
  mechanismBill,
  verify,
} from './verify.js';

// ---------- latency decomposition ----------

test('latency decomposition: sequential hops add', () => {
  const [r] = latencyDecomposition(
    [{ path: 'path:search', hops: [{ name: 'lb', p50_ms: 1 }, { name: 'db', p50_ms: 5 }] }],
    { 'path:search': 200 },
  );
  assert.equal(r.floor, 6);
  assert.equal(r.verdict, 'OK');
});

test('latency decomposition: parallel branches cost their max, not their sum', () => {
  const [r] = latencyDecomposition(
    [{
      path: 'path:fan',
      hops: [
        { name: 'lb', p50_ms: 1 },
        { name: 'a', p50_ms: 20, parallel: 'g1' },
        { name: 'b', p50_ms: 30, parallel: 'g1' },
      ],
    }],
    { 'path:fan': 200 },
  );
  assert.equal(r.floor, 31, 'sequential 1 + max(20,30)');
});

test('latency decomposition: floors above target is a wrong vector, not a tuning problem', () => {
  const [r] = latencyDecomposition(
    [{ path: 'path:x', hops: [{ name: 'cross-region', p50_ms: 150 }, { name: 'quorum', p50_ms: 120 }] }],
    { 'path:x': 200 },
  );
  assert.equal(r.verdict, 'WRONG_VECTOR');
});

test('latency decomposition: target within 2x of floor is pressing', () => {
  const [r] = latencyDecomposition(
    [{ path: 'path:x', hops: [{ name: 'h', p50_ms: 120 }] }],
    { 'path:x': 200 },
  );
  assert.equal(r.verdict, 'PRESSING');
});

test('REFUSAL: a missing floor is UNVERIFIED, never a default', () => {
  const [r] = latencyDecomposition(
    [{ path: 'path:x', hops: [{ name: 'lb', p50_ms: 1 }, { name: 'mystery' }] }],
    { 'path:x': 200 },
  );
  assert.equal(r.verdict, 'UNVERIFIED');
  assert.match(r.because, /mystery/);
  assert.equal(r.floor, undefined, 'no floor is computed from a partial path');
});

test('REFUSAL: a path with no stated target is UNVERIFIED', () => {
  const [r] = latencyDecomposition([{ path: 'path:x', hops: [{ name: 'lb', p50_ms: 1 }] }], {});
  assert.equal(r.verdict, 'UNVERIFIED');
  assert.match(r.because, /no target/);
});

// ---------- tail composition ----------

test('tail composition: five steps at 1% slow give ~5% chain-slow, not 1%', () => {
  const [r] = tailComposition([{
    name: 'chain', steps: Array.from({ length: 5 }, () => ({ slow_fraction: 0.01 })),
  }]);
  assert.equal(r.kind, 'series');
  assert.ok(r.chainSlowFraction >= 0.049 && r.chainSlowFraction < 0.05,
    `expected ~0.049, got ${r.chainSlowFraction}`);
});

test('tail composition: 100-way fan-out at P99 harvests ~63% of requests', () => {
  const [r] = tailComposition([{ name: 'fan', fanout: 100, per_shard_slow_fraction: 0.01 }]);
  assert.equal(r.kind, 'fan-out');
  assert.ok(r.chainSlowFraction > 0.63 && r.chainSlowFraction < 0.64,
    `expected ~0.634, got ${r.chainSlowFraction}`);
});

test('tail composition carries the correlation caveat as a bound', () => {
  const [r] = tailComposition([{ name: 'c', steps: [{ slow_fraction: 0.01 }] }]);
  assert.match(r.caveat, /bound/);
});

test('REFUSAL: fan-out without a per-shard fraction is UNVERIFIED', () => {
  const [r] = tailComposition([{ name: 'fan', fanout: 100 }]);
  assert.equal(r.verdict, 'UNVERIFIED');
});

// ---------- envelope composition ----------

test('envelope composition: uncorrelated peaks do not add', () => {
  const [r] = envelopeComposition([{
    name: 's',
    parts: [
      { name: 'a', steady: 100, peak: 500 },
      { name: 'b', steady: 100, peak: 400 },
    ],
  }]);
  assert.equal(r.steady, 200);
  assert.equal(r.peak, 600, 'steady 200 + largest single surge 400');
});

test('envelope composition: correlated peaks add', () => {
  const [r] = envelopeComposition([{
    name: 's',
    parts: [
      { name: 'a', steady: 100, peak: 500, correlated: true },
      { name: 'b', steady: 100, peak: 400, correlated: true },
    ],
  }]);
  assert.equal(r.peak, 900);
  assert.deepEqual(r.correlatedParts, ['a', 'b']);
});

test('REFUSAL: a part missing steady or peak is UNVERIFIED', () => {
  const [r] = envelopeComposition([{ name: 's', parts: [{ name: 'a', steady: 100 }] }]);
  assert.equal(r.verdict, 'UNVERIFIED');
});

// ---------- availability multiplication ----------

test('availability: five 99.99% parts in series land at ~99.95%', () => {
  const [r] = availabilityMultiplication([{
    name: 'chain', parts: Array.from({ length: 5 }, () => ({ availability: 0.9999 })),
  }]);
  assert.ok(r.availability >= 0.9995 && r.availability < 0.99951,
    `expected ~0.99950, got ${r.availability}`);
});

test('availability: a series chain under its target is reported as missed', () => {
  const [r] = availabilityMultiplication([{
    name: 'chain', target: 0.999,
    parts: [{ availability: 0.999 }, { availability: 0.999 }],
  }]);
  assert.equal(r.verdict, 'TARGET_MISSED');
});

test('REFUSAL: parallel arithmetic is refused when independence is not earned', () => {
  const [r] = availabilityMultiplication([{
    name: 'pair', arrangement: 'parallel',
    parts: [{ availability: 0.99 }, { availability: 0.99 }],
    shared: ['deploy pipeline', 'TLS certs'],
  }]);
  assert.equal(r.verdict, 'INDEPENDENCE_UNEARNED');
  assert.equal(r.availability, undefined, 'no number is produced for unearned independence');
  assert.match(r.because, /deploy pipeline/);
});

test('availability: parallel is computed only with independence declared', () => {
  const [r] = availabilityMultiplication([{
    name: 'pair', arrangement: 'parallel',
    parts: [{ availability: 0.99 }, { availability: 0.99 }],
  }]);
  assert.equal(r.verdict, 'COMPUTED');
  assert.ok(r.availability > 0.9998);
});

// ---------- mechanism bill ----------

test('mechanism bill: the null vector stands up nothing', () => {
  const r = mechanismBill(
    { topology: 'single deployable', substrate: 'direct', read_write: 'unified',
      state: 'current-state', persistence: 'single shared' },
    { operators: 4 },
  );
  assert.equal(r.count, 0);
  assert.equal(r.verdict, 'OK');
});

test('mechanism bill: a platform vector against a small team fails before anything is built', () => {
  const r = mechanismBill(
    { topology: 'multiple deployables', substrate: 'streaming', read_write: 'separated',
      state: 'event-sourced', persistence: 'polyglot' },
    { operators: 4 },
  );
  assert.equal(r.verdict, 'ENVELOPE_EXCEEDED');
  assert.ok(r.count > 4);
});

test('mechanism bill counts scoped positions, not just bare strings', () => {
  const r = mechanismBill({ substrate: [{ value: 'event-based', scope: 'system' }] }, { operators: 9 });
  assert.equal(r.count, 2, 'broker + idempotent consumers');
});

test('REFUSAL: no operator count means the bill has no envelope to meet', () => {
  const r = mechanismBill({ substrate: 'event-based' }, {});
  assert.equal(r.verdict, 'UNVERIFIED');
});

// ---------- the gate ----------

test('verify runs all five rules and separates failures from unverified', () => {
  const out = verify({
    verification: {
      targets: { 'path:x': 200 },
      floors: [{ path: 'path:x', hops: [{ name: 'h', p50_ms: 300 }] }],
      envelope: { operators: 2 },
    },
  }, { substrate: 'event-based' });

  const rules = new Set(out.results.map(r => r.rule));
  assert.ok(rules.has('latency decomposition'));
  assert.ok(rules.has('mechanism bill'));
  assert.equal(out.passed, false);
  assert.ok(out.failures.some(f => f.verdict === 'WRONG_VECTOR'));
});

test('an empty verification section verifies nothing and says so', () => {
  const out = verify({}, {});
  assert.equal(out.complete, false, 'no inputs means nothing was verified');
  assert.ok(out.unverified.length > 0);
});

test('every result cites its card', () => {
  const out = verify({
    verification: {
      targets: { 'path:x': 200 },
      floors: [{ path: 'path:x', hops: [{ name: 'h', p50_ms: 10 }] }],
      envelope: { operators: 2 },
    },
  }, {});
  for (const r of out.results) assert.equal(r.card, 'Card 6');
});

test('derive wires verify in, and reports "not attempted" rather than "clean"', async () => {
  const { derive } = await import('./derive.js');
  const out = derive({ answers: {} });
  assert.equal(out.verification.notAttempted, true);
  assert.equal(out.verification.passed, false,
    'a sheet with no verification inputs must never read as passing');
});
