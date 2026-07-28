// golden.test.js — the published runs as acceptance tests.
//
// `NEXT-STEP-SPEC.md:196`: "derive must reproduce each derivation's recorded moves. A
// divergence is either an engine bug or a book bug; both are findings."
//
// Tests here are split in two. The first group asserts what the engine reproduces today
// and must keep reproducing. The second group documents, as executable notes, what it
// cannot yet reproduce and why — so the gap is visible in test output rather than in a
// comment someone has to find.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

import { derive, deriveRecovery } from './derive.js';
import { checkSheet, parseToml } from './engine.js';
import { COMPANIES_HOUSE } from './corpus/companies-house.expected.js';

const here = dirname(fileURLToPath(import.meta.url));
const TOML = readFileSync(join(here, 'corpus', 'companies-house.toml'), 'utf-8');
const sheet = parseToml(TOML).sheet;

test('the corpus sheet parses with no TOML errors', () => {
  assert.deepEqual(parseToml(TOML).errors, []);
  assert.equal(sheet.meta.system, 'companies-house');
  assert.equal(sheet.domain_shape.length, 9);
});

// --- Recovery: fully reproducible, and the strongest evidence the rules are right ---

test('recovery reproduces all nine recorded decisions', () => {
  const { decided, judgmentPoints } = deriveRecovery(sheet);
  assert.deepEqual(judgmentPoints, [], 'the run recorded no recovery tie');

  const got = Object.fromEntries(decided.map(d => [d.operation, d.value]));
  const want = Object.fromEntries(
    COMPANIES_HOUSE.vector.recovery.map(r => [r.scope.split(':')[1], r.value]));

  assert.deepEqual(got, want);
  assert.equal(Object.keys(got).length, 9);
});

test('design-out is chosen for every append-only operation, and checked first', () => {
  const { decided } = deriveRecovery(sheet);
  const designOut = decided.filter(d => d.value === 'design-out').map(d => d.operation);
  assert.deepEqual(designOut.sort(), [
    'accept-filing', 'correct-filing-rp04', 'dissolve-company', 'incorporate-company',
  ]);
});

test('the two operations with a real inverse compensate; the three that decay degrade', () => {
  const { decided } = deriveRecovery(sheet);
  const by = value => decided.filter(d => d.value === value).map(d => d.operation).sort();
  assert.deepEqual(by('compensate'), ['court-rectification', 'eccta-post-hoc-removal']);
  assert.deepEqual(by('degrade-and-continue'),
    ['bulk-export', 'eccta-query-filing', 'idv-backfill']);
});

// --- Prune: no explicit strikes in this run, and that is itself correct ---

test('no value is pruned: this run records no mandate that strikes a value', () => {
  const result = derive(sheet);
  assert.deepEqual(result.strikes, []);
  assert.deepEqual(result.rejectedStrikes, []);
  // The GDPR row is relief, not a strike: "the exemption removes the pressure it would
  // otherwise create". An engine that pruned on it would be wrong.
  assert.deepEqual(result.halts.filter(h => h.kind === 'contradiction'), []);
});

// --- The recorded moves ---

test('the three recorded axis moves reproduce exactly, with no extras', () => {
  const result = derive(sheet);
  const moved = [];
  for (const [axis, entries] of Object.entries(result.vector)) {
    if (axis === 'recovery') continue;
    for (const e of entries) if (e.moved) moved.push(`${axis}:${e.value}@${e.scope}`);
  }
  assert.deepEqual(moved.sort(), [
    'persistence:per-component@data-class:roe',
    'read_write:separated@path:bulk-data-export',
    'read_write:separated@path:public-search',
    'substrate:event-based@path:accounts-filing',
  ]);
});

test('each move cites the mechanism the transcript names', () => {
  const result = derive(sheet);
  const mech = {};
  for (const [axis, entries] of Object.entries(result.vector)) {
    if (axis === 'recovery') continue;
    for (const e of entries) if (e.moved) mech[`${axis}@${e.scope}`] = e.mechanism;
  }
  assert.equal(mech['substrate@path:accounts-filing'], 'queue');
  assert.equal(mech['read_write@path:public-search'], 'projection pipeline');
  assert.equal(mech['persistence@data-class:roe'], 'store');
});

test('the separated move is recorded as a combination, not a single-row press', () => {
  const result = derive(sheet);
  const sep = result.vector.read_write.find(e => e.scope === 'path:public-search');
  assert.equal(sep.combination, true,
    'neither read volume nor shape divergence forces separated alone');
});

test('the ROE move is recorded as scope exclusion before hardening', () => {
  const result = derive(sheet);
  const roe = result.vector.persistence.find(e => e.scope === 'data-class:roe');
  assert.equal(roe.scopeExclusion, true);
  // The core store must not move with it.
  assert.ok(result.vector.persistence.some(
    e => e.value === 'single shared' && e.scope === 'system' && !e.moved));
});

test('the positions the run held stay held', () => {
  const result = derive(sheet);
  // Audit tempts event-sourcing and must not get it: no replay demand exists.
  assert.deepEqual(result.vector.state, [{ value: 'current-state', scope: 'system', moved: false }]);
  // Headcount presses cadence divergence only, and Q7 states none.
  assert.deepEqual(result.vector.topology,
    [{ value: 'single deployable', scope: 'system', moved: false }]);
  // The core read path is contained by the chain below the axis move.
  assert.ok(result.vector.read_write.some(
    e => e.value === 'unified' && e.scope === 'system' && !e.moved));
});

test('the two filing paths do NOT earn projections', () => {
  const result = derive(sheet);
  const scopes = result.vector.read_write.filter(e => e.moved).map(e => e.scope);
  assert.ok(!scopes.includes('path:accounts-filing'),
    'an earlier rule spread one redaction mandate across every path — unforced cost');
  assert.ok(!scopes.includes('path:confirmation-statement-filing'));
});

test('the loss-budget UNKNOWN blocks distributed shared rather than forcing it', () => {
  const result = derive(sheet);
  const block = result.blocked.find(b => b.value === 'distributed shared');
  assert.ok(block);
  assert.match(block.because, /UNKNOWN/);
});

test('PENDING: topology and state remain unpriced by the ledger', () => {
  const result = derive(sheet);
  const halt = result.halts.find(h => h.kind === 'unexplored-territory');
  assert.deepEqual(halt.axes.sort(), ['state', 'topology']);
});

// --- A disagreement between the method as stated and the method as practiced ---

test('FINDING: the published sheet answers Q2 at system scope, which the gate refuses', () => {
  const { findings } = checkSheet(TOML);
  const q2 = findings.filter(f => String(f.row).startsWith('answers.q2'));

  // Card 1 demands Q2 "per operation"; the published run carries the department's
  // system-wide 99.5% availability target and separately records per-operation
  // criticality as UNKNOWN. The gate flags the system-scoped row.
  assert.equal(q2.length, 1);
  assert.equal(q2[0].code, 'UNSCOPED');

  // This is a real disagreement, not an engine bug, and it cuts both ways:
  // answer-sheet.md:47 warns that "one system-level number is how bare adjectives sneak
  // back wearing digits" — but the transcript accepted the row and marked it inert
  // rather than rejecting it. Either the gate is stricter than the method in practice,
  // or the run should have refused the row. Both are findings worth resolving before
  // this test is changed in either direction.
});

// --- Profile 1 of the Three Profiles experiment: the negative pole ---

const VENUE_TOML = readFileSync(join(here, 'corpus', 'ticketing-venue.toml'), 'utf-8');
const venue = parseToml(VENUE_TOML).sheet;

test('the venue sheet parses cleanly', () => {
  assert.deepEqual(parseToml(VENUE_TOML).errors, []);
  assert.equal(venue.domain_shape.length, 3);
});

test('profile 1: zero pressures — the most important test in the corpus', () => {
  const result = derive(venue);
  assert.deepEqual(result.pressures, [],
    'an engine that presses here is selling architecture');
});

test('profile 1: the null vector survives on every axis', () => {
  const result = derive(venue);
  for (const [axis, entries] of Object.entries(result.vector)) {
    if (axis === 'recovery') continue;
    assert.equal(entries.length, 1, `${axis} should carry exactly one position`);
    assert.equal(entries[0].moved, false, `${axis} must not move`);
    assert.equal(entries[0].scope, 'system');
  }
  assert.deepEqual(
    Object.fromEntries(Object.entries(result.vector)
      .filter(([a]) => a !== 'recovery').map(([a, e]) => [a, e[0].value])),
    { topology: 'single deployable', substrate: 'direct', read_write: 'unified',
      state: 'current-state', persistence: 'single shared' });
});

test('profile 1: every money-path step compensates, from its defined inverse', () => {
  const { decided, judgmentPoints } = deriveRecovery(venue);
  assert.deepEqual(judgmentPoints, []);
  assert.deepEqual(decided.map(d => d.value), ['compensate', 'compensate', 'compensate']);
  assert.deepEqual(decided.map(d => d.operation).sort(),
    ['authorize-payment', 'confirm-sale', 'reserve-seat']);
});

test('profile 1: read volume without shape divergence stays below the axis move', () => {
  const result = derive(venue);
  assert.ok(result.inert.some(i => /cache, coalescing, replicas/.test(i.because || '')),
    'the read chain must contain it, and say so');
});

// --- The experimental condition itself ---

test('EXPERIMENT: one domain, two sheets, different vectors', () => {
  // three-profiles.md:5 — "three answer sheets over one domain must produce three
  // different vectors, each forced, with no step appealing to taste." Two so far;
  // this assertion grows as profiles 2 and 3 land.
  const venueMoves = Object.values(derive(venue).vector).flat().filter(e => e.moved).length;
  const chMoves = Object.values(derive(sheet).vector).flat().filter(e => e.moved).length;
  assert.equal(venueMoves, 0);
  assert.equal(chMoves, 4);
  assert.notEqual(venueMoves, chMoves,
    'different answers must produce different architectures, or the method is an illustration');
});

// --- Profile 3: the hostile pole ---

const ENT_TOML = readFileSync(join(here, 'corpus', 'ticketing-enterprise.toml'), 'utf-8');
const enterprise = parseToml(ENT_TOML).sheet;

test('profile 3 passes the entry gate', () => {
  const gate = checkSheet(ENT_TOML);
  assert.deepEqual(gate.findings.map(f => f.code), []);
});

test('profile 3 reproduces every recorded move the ledger can price', () => {
  const result = derive(enterprise);
  const moved = [];
  for (const [axis, entries] of Object.entries(result.vector)) {
    if (axis === 'recovery') continue;
    for (const e of entries) if (e.moved) moved.push(`${axis}:${e.value}@${e.scope}`);
  }
  assert.deepEqual(moved.sort(), [
    'persistence:distributed shared@data-class:bookings',
    'persistence:polyglot@data-class:event-management',
    'read_write:separated@path:quote',
    'state:event-sourced@data-class:pricing',
    'topology:multiple deployables@path:quote',
  ]);
});

test('profile 3: the unique container is reached by the three answers that force it', () => {
  const result = derive(enterprise);
  const p = result.pressures.find(x => x.toward === 'distributed shared');
  assert.ok(p);
  assert.equal(p.unique, true);
  assert.match(p.because, /strict, multi-region and zero-loss/);
});

test('profile 3: 10^5 attempts per minute moves NO axis — contention refuses copies', () => {
  const result = derive(enterprise);
  const contention = result.inert.find(i => /second copy does not help/.test(i.because || ''));
  assert.ok(contention, 'the contention row must be recorded inert, not discarded');
  assert.ok(!result.pressures.some(p => p.scope === 'path:on-sale'),
    'the most dramatic number on the sheet must move nothing');
});

test('profile 3: booking keeps current-state while pricing goes event-sourced', () => {
  const result = derive(enterprise);
  const state = result.vector.state;
  assert.ok(state.some(e => e.value === 'current-state' && e.scope === 'system' && !e.moved));
  assert.ok(state.some(e => e.value === 'event-sourced' && e.scope === 'data-class:pricing' && e.moved));
  // Two data classes, two storage answers, one system.
  assert.equal(state.length, 2);
});

test('profile 3: recovery spans all three classes, each from domain shape', () => {
  const { decided } = deriveRecovery(enterprise);
  const by = v => decided.filter(d => d.value === v).map(d => d.operation).sort();
  assert.deepEqual(by('compensate'), ['authorize-payment', 'confirm-booking']);
  assert.deepEqual(by('design-out'), ['append-price', 'hold-seat']);
  assert.deepEqual(by('degrade-and-continue'), ['refresh-availability-view']);
});

// --- The experiment, complete on both poles ---

test('EXPERIMENT: one domain, three sheets, three different vectors', () => {
  // three-profiles.md:5 — "If the architecture follows from the answers, three answer
  // sheets over one domain must produce three different vectors, each forced, with no
  // step appealing to taste."
  const count = s => Object.values(derive(s).vector).flat().filter(e => e.moved).length;
  const venueMoves = count(venue);
  const entMoves = count(enterprise);

  assert.equal(venueMoves, 0, 'the venue derives the null vector');
  assert.equal(entMoves, 5, 'the enterprise derives five forced moves');
  assert.notEqual(venueMoves, entMoves,
    'same domain, same engine, different answers — different architectures');
});
