// derive.test.js — run with: node --test website/next-step/
//
// These pin what derive does AND what it refuses. The refusals matter more: press must
// report the ledger gap rather than invent containment, and a recovery tie must come
// back as a judgment point rather than a decision.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { derive, deriveRecovery, press, prune } from './derive.js';
import { parseToml } from './engine.js';
import { NULL_VECTOR } from './ledger.js';

const sheetOf = toml => parseToml(toml).sheet;

const HEAD = `schema_version = "0.1"
[meta]
system = "s"
era = "2020-2024"
mode = "greenfield"
`;

// --- Step 0: the null vector ---

test('derivation starts from the null vector, scoped at system', () => {
  const result = derive(sheetOf(HEAD));
  assert.equal(result.start, 'null vector');
  for (const [axis, value] of Object.entries(NULL_VECTOR)) {
    assert.deepEqual(result.vector[axis], [{ value, scope: 'system', moved: false }],
      `${axis} should hold its null value at system scope`);
  }
});

test('a living system starts from its current vector, not the null vector', () => {
  const result = derive(sheetOf(`${HEAD.replace('greenfield', 'living')}
[current_vector]
topology = [{ value = "multiple deployables", scope = "system" }]
`));
  assert.equal(result.mode, 'living');
  assert.equal(result.start, 'current_vector');
});

// --- Step 2: prune ---

test('an explicit mandate strike removes the value and records what struck it', () => {
  const result = prune(sheetOf(`${HEAD}
[[answers.q6]]
scope = "data-class:cards"
kind = "mandate"
statement = "card data may not leave the EU"
strikes = ["persistence:distributed shared"]
`));
  assert.ok(!result.board.persistence.includes('distributed shared'));
  assert.equal(result.strikes.length, 1);
  assert.equal(result.strikes[0].axis, 'persistence');
  assert.match(result.strikes[0].by, /card data may not leave the EU/);
});

test('prune never infers a strike from prose — only explicit strikes count', () => {
  const result = prune(sheetOf(`${HEAD}
[[answers.q6]]
scope = "data-class:cards"
kind = "mandate"
statement = "card data may never be stored in a distributed shared store, ever"
`));
  assert.deepEqual(result.strikes, [], 'a strike must be declared, not read out of prose');
  assert.ok(result.board.persistence.includes('distributed shared'));
});

test('a strike naming an unknown axis or value is rejected, not silently applied', () => {
  const result = prune(sheetOf(`${HEAD}
[[answers.q6]]
kind = "mandate"
strikes = ["nonsense:value", "persistence:no such value"]
`));
  assert.equal(result.rejected.length, 2);
  assert.equal(result.strikes.length, 0);
});

test('an axis pruned empty is a contradiction halt', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q6]]
kind = "mandate"
strikes = ["read_write:unified", "read_write:separated"]
`));
  const halt = result.halts.find(h => h.kind === 'contradiction');
  assert.ok(halt);
  assert.deepEqual(halt.axes, ['read_write']);
  assert.equal(result.exitCode, 2);
});

// --- Step 4: recovery, from domain shape only ---

test('reshapeable derives design-out, and it is checked first', () => {
  const { decided } = deriveRecovery(sheetOf(`${HEAD}
[[domain_shape]]
operation = "accept-filing"
inverse = "refund"
decays = true
reshapeable = ["append-only"]
`));
  assert.equal(decided[0].value, 'design-out',
    'design-out wins even when an inverse and decay are also present');
  assert.match(decided[0].forcedBy, /append-only/);
});

test('an inverse alone derives compensate', () => {
  const { decided } = deriveRecovery(sheetOf(`${HEAD}
[[domain_shape]]
operation = "charge-card"
inverse = "refund"
decays = false
reshapeable = ["none"]
`));
  assert.equal(decided[0].value, 'compensate');
});

test('decay alone derives degrade-and-continue', () => {
  const { decided } = deriveRecovery(sheetOf(`${HEAD}
[[domain_shape]]
operation = "refresh-recommendations"
inverse = "none"
decays = true
reshapeable = ["none"]
`));
  assert.equal(decided[0].value, 'degrade-and-continue');
  assert.match(decided[0].note, /bounded and visible/);
});

test('inverse AND decay is a tie: emitted as a judgment point, never resolved', () => {
  const { decided, judgmentPoints } = deriveRecovery(sheetOf(`${HEAD}
[[domain_shape]]
operation = "reserve-seat"
inverse = "release-seat"
decays = true
reshapeable = ["none"]
`));
  assert.deepEqual(decided, [], 'a tie must not be decided');
  assert.equal(judgmentPoints.length, 1);
  assert.equal(judgmentPoints[0].kind, 'recovery-tie');
  assert.deepEqual(judgmentPoints[0].options, ['compensate', 'degrade-and-continue']);
  assert.match(judgmentPoints[0].message, /business preference/);
});

test('no inverse, no decay, not reshapeable: no rule decides it', () => {
  const { decided, judgmentPoints } = deriveRecovery(sheetOf(`${HEAD}
[[domain_shape]]
operation = "send-statutory-notice"
inverse = "none"
decays = false
reshapeable = ["none"]
`));
  assert.deepEqual(decided, []);
  assert.equal(judgmentPoints[0].kind, 'recovery-unforced');
});

test('a halt outranks pending judgment points, and does not swallow them', () => {
  // Spec §5 ranks halts (2) above pending judgment points (3). Force a real halt.
  const result = derive(sheetOf(`${HEAD}
[[answers.q6]]
kind = "mandate"
strikes = ["read_write:unified", "read_write:separated"]

[[domain_shape]]
operation = "reserve-seat"
inverse = "release-seat"
decays = true
reshapeable = ["none"]
`));
  assert.equal(result.exitCode, 2);
  assert.ok(result.halts.some(h => h.kind === 'contradiction'));
  assert.equal(result.judgmentPoints.length, 1,
    'the recovery tie must still be reported alongside the halt');
});

// --- Step 3: press must report the gap, not guess ---

test('every axis value carries a ledger entry', () => {
  const result = press(sheetOf(HEAD));
  assert.equal(result.ran, true);
  // LEDGER.md v0.2 prices all six axes, every value. An earlier version of ledger.js was
  // reconstructed from chapter prose and reported four values unpriced; they were priced
  // all along, in book-arch-meta/LEDGER.md.
  assert.deepEqual(result.unpriced, []);
});

test('no unexplored-territory halt while the ledger is complete', () => {
  const result = derive(sheetOf(HEAD));
  assert.ok(!result.halts.some(h => h.kind === 'unexplored-territory'));
});

test('pending judgment points give exit code 3 once nothing halts', () => {
  const result = derive(sheetOf(`${HEAD}
[[domain_shape]]
operation = "reserve-seat"
inverse = "release-seat"
decays = true
reshapeable = ["none"]
`));
  // Reachable now that the ledger no longer forces a halt on every run.
  assert.deepEqual(result.halts, []);
  assert.equal(result.judgmentPoints.length, 1);
  assert.equal(result.exitCode, 3);
});

test('same-shape read volume is inert: the read chain contains it below the axis move', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q5]]
scope = "path:search"
statement = "500k req/s peak"
shape = "volume"
read_model = "same"
`));
  assert.deepEqual(result.vector.read_write, [{ value: 'unified', scope: 'system', moved: false }],
    'volume alone must not reach the projections rung');
  assert.ok(result.inert.some(i => /cache, coalescing, replicas/.test(i.because || '')));
});

test('derive resolves no judgment point and picks no product', () => {
  const result = derive(sheetOf(`${HEAD}
[[domain_shape]]
operation = "reserve-seat"
inverse = "release-seat"
decays = true
reshapeable = ["none"]
`));
  assert.equal(result.recovery.length, 0);
  assert.equal(result.judgmentPoints.length, 1);
  assert.equal(JSON.stringify(result).includes('postgres'), false);
});

// --- separated: two conditions, and staleness as a cost ---

const SEP_HEAD = `${HEAD}
[[answers.q5]]
scope = "path:report"
statement = "heavy reporting reads"
`;

test('separated needs volume too: a divergent model on a quiet path is a schema opinion', () => {
  const result = derive(sheetOf(`${SEP_HEAD}shape = "burst"
read_model = "diverges"
status = "answered"
`));
  assert.deepEqual(result.pressures.filter(p => p.toward === 'separated'), [],
    'divergence without volume must not buy projection machinery');
  assert.ok(result.inert.some(i => /divergence alone does not earn/.test(i.because || '')));
});

test('separated is refused where the path is contracted strict — the price cannot be paid', () => {
  const result = derive(sheetOf(`${SEP_HEAD}shape = "volume"
read_model = "diverges"
status = "answered"

[[answers.q4]]
scope = "path:report"
statement = "strict on this path"
contract = "strict"
status = "answered"
`));
  assert.deepEqual(result.pressures.filter(p => p.toward === 'separated'), [],
    'separation is paid for in staleness; a strict scope cannot pay');
  assert.ok(result.inert.some(i => /price cannot be paid/.test(i.because || '')));
});

test('volume plus a divergent model does press separated', () => {
  const result = derive(sheetOf(`${SEP_HEAD}shape = "volume"
read_model = "diverges"
status = "answered"
`));
  const p = result.pressures.find(x => x.toward === 'separated');
  assert.ok(p, 'both conditions met, so the top rung is reached');
  assert.equal(p.scope, 'path:report');
});

// --- sharded and streaming: two conditions each ---

test('write volume past one node WITH a natural key presses sharded', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q5]]
scope = "data-class:orders"
statement = "write volume past a single node"
shape = "volume"
exceeds_single_node = true
partition_key = "shop_id"
status = "answered"
`));
  const p = result.pressures.find(x => x.toward === 'sharded');
  assert.ok(p);
  assert.match(p.because, /shop_id/);
});

test('REFUSAL: write volume past one node with NO key is a cost problem, not an axis move', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q5]]
scope = "data-class:orders"
statement = "write volume past a single node, nothing to partition on"
shape = "volume"
exceeds_single_node = true
status = "answered"
`));
  assert.deepEqual(result.pressures.filter(p => p.toward === 'sharded'), []);
  assert.ok(result.inert.some(i => /nothing to shard along/.test(i.because || '')));
});

test('REFUSAL: sharding a contention problem buys hardware and keeps the melt', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q5]]
scope = "data-class:seats"
statement = "one row, many claimants"
shape = "contention"
exceeds_single_node = true
partition_key = "seat_id"
status = "answered"
`));
  assert.deepEqual(result.pressures.filter(p => p.toward === 'sharded'), [],
    'a partition key must not rescue a contention row');
  assert.ok(result.inert.some(i => /keeps the melt/.test(i.because || '')));
});

test('volume plus replay-from-position on one data class presses streaming', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q5]]
scope = "data-class:telemetry"
statement = "continuous high-volume feed, consumers replay from a position"
shape = "volume"
replay_from_position = true
status = "answered"
`));
  const p = result.pressures.find(x => x.toward === 'streaming');
  assert.ok(p);
  assert.equal(p.scope, 'data-class:telemetry', 'applied at the earning class, nowhere else');
});

test('REFUSAL: replay-from-position without the volume stays on the event substrate', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q5]]
scope = "data-class:telemetry"
statement = "replay wanted, but bursty rather than sustained"
shape = "burst"
replay_from_position = true
status = "answered"
`));
  assert.deepEqual(result.pressures.filter(p => p.toward === 'streaming'), []);
  assert.ok(result.inert.some(i => /already contains this/.test(i.because || '')));
});
