// coverage.test.js — how much of the ledger the press rules actually implement.
//
// LEDGER.md gives every axis value a `pressedBy` list. A press rule exists for some of
// them and not others, and the gap is worth measuring rather than discovering by a
// derivation quietly not moving an axis it should have.
//
// This file asserts the CURRENT coverage. When a rule lands, the expected set changes
// and this test is the reminder to update the corpus with it.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CONTAINMENT } from './ledger.js';

// Values a press rule can currently reach, with the rule that reaches them.
const IMPLEMENTED = {
  'substrate:event-based': ['burst-to-event-based', 'fanout-to-event-based'],
  'read_write:separated': ['volume-plus-shape-to-separated'],
  'state:event-sourced': ['replay-to-event-sourced'],
  'topology:multiple deployables': ['cadence-divergence-to-multiple'],
  'persistence:distributed shared': ['unique-container-distributed-shared'],
  'persistence:per-component': ['scope-excluded-divergence'],
  'persistence:polyglot': ['scope-excluded-divergence'],
};

// Values LEDGER.md prices and no rule can reach yet. Each needs a rule, and most need a
// sheet field to carry the fact the rule would read.
const UNREACHED = {
  'topology:unified runtime':
    'strongly-coupled cores plus topology uncertainty — no field carries either fact',
  'topology:serverless':
    'spiky, low-duty-cycle workloads plus a minimal ops budget — Q5 has no duty-cycle field',
  'substrate:streaming':
    'the one data class whose volume earns a partitioned log; replay-from-position',
  'persistence:sharded':
    'write volume past one node WITH a natural partition key — no field carries the key',
};

// The null values carry a pressedBy too, but theirs describes when the null HOLDS, not
// a move toward it. Nothing presses toward where you already start.
const NULLS = ['topology:single deployable', 'substrate:direct'];

function pressableValues() {
  const out = [];
  for (const [axis, values] of Object.entries(CONTAINMENT)) {
    for (const [value, entry] of Object.entries(values)) {
      const key = `${axis}:${value}`;
      if (entry.pressedBy && !NULLS.includes(key)) out.push(key);
    }
  }
  return out;
}

test('every value with a pressedBy list is either implemented or listed as unreached', () => {
  const unaccounted = pressableValues()
    .filter(v => !IMPLEMENTED[v] && !UNREACHED[v]);
  assert.deepEqual(unaccounted, [],
    'a ledger value gained a pressedBy and nobody decided whether a rule reaches it');
});

test('coverage is 7 of 11 pressable values', () => {
  assert.equal(Object.keys(IMPLEMENTED).length, 7);
  assert.equal(Object.keys(UNREACHED).length, 4);
  assert.equal(Object.keys(IMPLEMENTED).length + Object.keys(UNREACHED).length,
    pressableValues().length);
});

test('separated is under-implemented against its three conditions', () => {
  // LEDGER.md:121 requires own tight SLO AND own scale shape AND tolerable staleness.
  // volume-plus-shape-to-separated reads the shape divergence only, so it can move the
  // axis on a path that carries no SLO of its own and tolerates no staleness.
  const entry = CONTAINMENT.read_write.separated;
  assert.equal(entry.pressedBy.length, 3);
  assert.match(entry.pressedBy[0], /own tight SLO/);
  assert.match(entry.pressedBy[2], /tolerable staleness/);
});

test('null values are not pressed toward — they are where you start', () => {
  assert.equal(CONTAINMENT.topology['single deployable'].pressedBy.length, 3);
  assert.equal(CONTAINMENT.substrate.direct.pressedBy.length, 3);
  // These describe when the null position HOLDS, not a move toward it.
  assert.equal(CONTAINMENT.read_write.unified.pressedBy, undefined);
  assert.equal(CONTAINMENT.state['current-state'].pressedBy, undefined);
  assert.equal(CONTAINMENT.persistence['single shared'].pressedBy, undefined);
});
