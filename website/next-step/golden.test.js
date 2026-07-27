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

// --- What the engine cannot yet reproduce ---

test('PENDING: the three recorded axis moves need the ledger', () => {
  const result = derive(sheet);
  assert.equal(result.pressRan, false);
  assert.equal(COMPANIES_HOUSE.moves.length, 3,
    'substrate->event-based, read_write->separated, persistence->per-component');
  // Until the ledger carries provides entries, no axis may move.
  assert.ok(result.halts.some(h => h.kind === 'unexplored-territory'));
});

test('PENDING: the vector shape must become scoped before it can hold this run', () => {
  const result = derive(sheet);
  // The recorded answer puts three values on read_write and two on persistence, each at
  // a different scope. A flat value-per-axis vector cannot express that.
  assert.equal(COMPANIES_HOUSE.vector.read_write.length, 3);
  assert.equal(COMPANIES_HOUSE.vector.persistence.length, 2);
  assert.equal(typeof result.vector.read_write, 'string',
    'engine still returns one value per axis — this is the shape gap');
});

test('PENDING: eight inert rows must stay inert once press runs', () => {
  // Recorded as pressing nothing. An engine that presses any of these inflates every
  // architecture it derives, so these are the sharpest regression guards to have ready.
  assert.equal(COMPANIES_HOUSE.inert.length, 8);
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
