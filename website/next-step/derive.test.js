// derive.test.js — run with: node --test website/next-step/
//
// These pin what derive does AND what it refuses. The refusals matter more: press must
// report the ledger gap rather than invent containment, and a recovery tie must come
// back as a judgment point rather than a decision.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { derive, deriveRecovery, press, prune } from './derive.js';
import { parseToml } from './engine.js';
import { NULL_VECTOR, unpricedAxes } from './ledger.js';

const sheetOf = toml => parseToml(toml).sheet;

const HEAD = `schema_version = "0.1"
[meta]
system = "s"
era = "2020-2024"
mode = "greenfield"
`;

// --- Step 0: the null vector ---

test('derivation starts from the null vector', () => {
  const result = derive(sheetOf(HEAD));
  assert.deepEqual(result.vector, NULL_VECTOR);
  assert.equal(result.vector.topology, 'single deployable');
  assert.equal(result.vector.persistence, 'single shared');
  assert.equal(result.start, 'null vector');
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
  const result = derive(sheetOf(`${HEAD}
[[domain_shape]]
operation = "reserve-seat"
inverse = "release-seat"
decays = true
reshapeable = ["none"]
`));
  // Spec §5 ranks halts (2) above pending judgment points (3), and press being blocked
  // is itself a halt — so every derive returns 2 until the ledger is filled. Exit 3
  // becomes reachable then. What must hold now: the halt does not hide the tie.
  assert.equal(result.exitCode, 2);
  assert.ok(result.halts.some(h => h.kind === 'unexplored-territory'));
  assert.equal(result.judgmentPoints.length, 1,
    'the recovery tie must still be reported alongside the halt');
});

// --- Step 3: press must report the gap, not guess ---

test('press does not run, and says why', () => {
  const result = press();
  assert.equal(result.ran, false);
  assert.deepEqual(result.pressures, []);
  assert.equal(result.halt.kind, 'unexplored-territory');
  assert.match(result.halt.message, /ledger cannot price this/);
});

test('the ledger gap names every axis it cannot price', () => {
  const axes = unpricedAxes();
  assert.ok(axes.length > 0, 'the ledger is currently empty by design');
  assert.ok(!axes.includes('recovery'), 'recovery derives from domain shape, not the ledger');
  for (const axis of ['topology', 'substrate', 'read_write', 'state', 'persistence']) {
    assert.ok(axes.includes(axis), `${axis} should be reported unpriced`);
  }
});

test('derive never reports a moved axis while press is blocked', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q5]]
scope = "path:search"
statement = "500k req/s peak"
shape = "volume"
`));
  assert.equal(result.pressRan, false);
  assert.deepEqual(result.vector, NULL_VECTOR,
    'no axis may move without a ledger entry justifying it');
  assert.ok(result.halts.some(h => h.kind === 'unexplored-territory'));
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
