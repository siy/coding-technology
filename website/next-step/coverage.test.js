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
  'substrate:streaming': ['volume-plus-replay-to-streaming'],
  'read_write:separated': ['volume-plus-shape-to-separated'],
  'state:event-sourced': ['replay-to-event-sourced'],
  'topology:multiple deployables': ['cadence-divergence-to-multiple'],
  'persistence:distributed shared': ['unique-container-distributed-shared'],
  'persistence:sharded': ['partitionable-write-volume-to-sharded'],
  'persistence:per-component': ['scope-excluded-divergence'],
  'persistence:polyglot': ['scope-excluded-divergence'],
};

// Values LEDGER.md prices that NO derivation has ever forced.
//
// This is a different kind of gap from a missing rule, and the distinction is the point.
// The other nine values were reached by writing a rule for a pressure some run actually
// produced. For these two, no run in the corpus, no worked example in the book, and no
// blind derivation has ever produced the forcing pressure — so a rule here would not be
// implementing the method, it would be inventing a demand and then obeying it. The
// engine's standing discipline is that no axis moves without a citing pressure; these
// stay unreached until a real system supplies one.
const UNFORCED = {
  'topology:unified runtime':
    'strongly-coupled cores plus uncertainty about future topology. No run has produced this pressure: the systems in the corpus all knew their topology, and the one product in this class is the author\'s own, which the book discloses precisely so no derivation leans on it.',
  'topology:serverless':
    'spiky, low-duty-cycle workloads plus a minimal ops budget. No run has produced this pressure: every corpus system carries sustained load, which is the condition serverless prices badly.',
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

test('every value with a pressedBy list is either implemented or listed as unforced', () => {
  const unaccounted = pressableValues()
    .filter(v => !IMPLEMENTED[v] && !UNFORCED[v]);
  assert.deepEqual(unaccounted, [],
    'a ledger value gained a pressedBy and nobody decided whether a rule reaches it');
});

test('coverage is 9 of 11 pressable values', () => {
  assert.equal(Object.keys(IMPLEMENTED).length, 9);
  assert.equal(Object.keys(UNFORCED).length, 2);
  assert.equal(Object.keys(IMPLEMENTED).length + Object.keys(UNFORCED).length,
    pressableValues().length);
});

test('separated is two conditions, and staleness is not one of them', () => {
  // Corrected 2026-08-03. The ledger used to demand own-tight-SLO AND own-scale-shape
  // AND tolerable-staleness together — a rule neither the book nor either graded blind
  // run used. Companies House separates a public-search path whose staleness answer is
  // UNKNOWN and which carries no path-level target, and the grader called it a HIT.
  // Staleness is the price of the move, checked at resolve, not a condition for it.
  const entry = CONTAINMENT.read_write.separated;
  assert.equal(entry.pressedBy.length, 2);
  assert.match(entry.pressedBy[0], /divergence/);
  assert.match(entry.pressedBy[1], /volume/);
  assert.ok(!entry.pressedBy.some(p => /staleness/.test(p)),
    'staleness belongs in the costs column, where it already was');
  assert.ok(entry.costs.some(c => /stalen/i.test(c)));
});

test('null values are not pressed toward — they are where you start', () => {
  assert.equal(CONTAINMENT.topology['single deployable'].pressedBy.length, 3);
  assert.equal(CONTAINMENT.substrate.direct.pressedBy.length, 3);
  // These describe when the null position HOLDS, not a move toward it.
  assert.equal(CONTAINMENT.read_write.unified.pressedBy, undefined);
  assert.equal(CONTAINMENT.state['current-state'].pressedBy, undefined);
  assert.equal(CONTAINMENT.persistence['single shared'].pressedBy, undefined);
});
