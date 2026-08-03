// shopify.test.js — the fifth golden run.
//
// The other four sheets exercise the null vector, the rung stop, the mechanism note and
// the blind-run halts. This one exists for the value none of them reach — `sharded` — and
// for three refusals that only appear at this scale.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { parseToml, check } from './engine.js';
import { derive } from './derive.js';
import { SHOPIFY } from './corpus/shopify.expected.js';

const TOML = readFileSync(new URL('./corpus/shopify.toml', import.meta.url), 'utf8');
const parsed = parseToml(TOML);
const sheet = parsed.sheet;

test('the Shopify sheet parses and passes the entry gate clean', () => {
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(check(sheet, parsed.lines).findings, [],
    'a published-answers sheet must clear the gate without special pleading');
});

test('the recorded vector is reproduced on every axis', () => {
  const result = derive(sheet);
  for (const [axis, want] of Object.entries(SHOPIFY.vector)) {
    const got = result.vector[axis].map(v => ({ value: v.value, scope: v.scope,
      ...(v.moved === undefined ? {} : { moved: v.moved }) }));
    assert.deepEqual(got, want, `${axis} must match the recorded run`);
  }
});

test('sharded is reached — the value no other run in the corpus touches', () => {
  const result = derive(sheet);
  const p = result.pressures.find(x => x.toward === 'sharded');
  assert.ok(p, 'this sheet is the corpus entry for sharded');
  assert.equal(p.scope, 'data-class:shop-data');
  assert.match(p.because, /shop/, 'the key that earns the move must be named');
});

// --- the three refusals ---

test('F21 at the top of the range: 1000+ developers move no axis', () => {
  const result = derive(sheet);
  assert.deepEqual(result.vector.topology,
    [{ value: 'single deployable', scope: 'system', moved: false }],
    'team size alone must never press topology');
  assert.deepEqual(result.pressures.filter(p => p.axis === 'topology'), []);
});

test('11 TB/s of read volume stops at replicas, because the model has not diverged', () => {
  const result = derive(sheet);
  assert.deepEqual(result.pressures.filter(p => p.toward === 'separated'), [],
    'volume alone must never reach the projections rung');
  assert.ok(result.inert.some(i => /cache, coalescing, replicas/.test(i.because || '')),
    'the run must say where the climb stopped');
});

test('the flash-sale drop is contention: it moves nothing, and cannot be sharded away', () => {
  const result = derive(sheet);
  assert.ok(!result.pressures.some(p => p.scope === 'path:checkout'),
    'the most dramatic number on the sheet must move no axis');
  assert.ok(result.inert.some(i => /second copy does not help/.test(i.because || '')),
    'contention is recorded inert, not discarded');
});

test('recovery is design-out for the reservation and compensation for the money', () => {
  const result = derive(sheet);
  const by = Object.fromEntries(result.recovery.map(r => [r.operation, r.value]));
  assert.equal(by['reserve-inventory'], 'design-out',
    'the hold makes the double-sell unconstructible');
  assert.equal(by['capture-payment'], 'compensate',
    'money has defined inverses: refund, void');
  assert.deepEqual(result.judgmentPoints, [], 'the run resolved every recovery answer');
});

test('the run halts on nothing', () => {
  assert.deepEqual(derive(sheet).halts, []);
});
