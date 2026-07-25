// engine.test.js — run with: node --test website/next-step/
//
// The gate's job is to refuse incomplete sheets in the book's own vocabulary. These
// tests pin each discipline of Card 1 (priced / scoped / decomposed / triaged /
// surfaced) and, just as importantly, pin what the gate must NOT do: it must accept
// UNKNOWN, and it must not invent a derivation.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { check, checkSheet, parseToml } from './engine.js';
import { CLEAN_SHEET, GAPPY_SHEET } from './examples.js';

const codes = result => result.findings.map(f => f.code);
const noteCodes = result => result.notes.map(n => n.code);

const HEAD = `schema_version = "0.1"

[meta]
system = "companies-house"
era = "2017-2025"
mode = "greenfield"
`;

// A sheet that should pass cleanly: every row priced, scoped, triaged, shaped.
const CLEAN = `${HEAD}
[[answers.q1]]
scope = "path:company-search"
statement = "P95 <= 200 ms at the register's read peak"
shape = "system-clock"
price = "read path engineering; see Q8 envelope"

[[answers.q2]]
scope = "operation:accept-filing"
statement = "99.9% monthly, tier-1 criticality"
price = "filing backlog and statutory penalty exposure"

[[answers.q3]]
scope = "data-class:filings"
statement = "RPO 0, retention 20 years, never-lose set = accepted filings"

[[answers.q4]]
scope = "data-class:filings"
statement = "strict on accept; read-your-writes for the filer's own view"

[[answers.q5]]
scope = "path:company-search"
statement = "50k req/s peak, concentrated in the 09:00 window"
shape = "volume"

[[answers.q6]]
scope = "data-class:filings"
kind = "audit"
statement = "who filed what and when, retained 20 years"

[[answers.q7]]
scope = "system"
statement = "search ships weekly; the filing engine ships 3x a year"

[[answers.q8]]
scope = "system"
statement = "4 engineers, no platform team, 250k GBP/yr infra"

[[answers.q9]]
scope = "system"
statement = "1 country, 1 currency, no tenancy split"

[[domain_shape]]
operation = "accept-filing"
inverse = "none"
decays = false
reshapeable = ["append-only"]
`;

test('parseToml reads the sheet subset: tables, arrays of tables, inline tables', () => {
  const { sheet, errors } = parseToml(CLEAN);
  assert.deepEqual(errors, []);
  assert.equal(sheet.schema_version, '0.1');
  assert.equal(sheet.meta.era, '2017-2025');
  assert.equal(sheet.answers.q1.length, 1);
  assert.equal(sheet.answers.q1[0].shape, 'system-clock');
  assert.equal(sheet.domain_shape[0].decays, false);
  assert.deepEqual(sheet.domain_shape[0].reshapeable, ['append-only']);
});

test('parseToml handles multi-line arrays and inline tables', () => {
  const { sheet, errors } = parseToml(`${HEAD}
[current_vector]
topology = [
  { value = "single deployable", scope = "system" },
  { value = "multiple", scope = "path:search" }
]
`);
  assert.deepEqual(errors, []);
  assert.equal(sheet.current_vector.topology.length, 2);
  assert.equal(sheet.current_vector.topology[1].scope, 'path:search');
});

test('a complete sheet passes the gate with exit code 0', () => {
  const result = checkSheet(CLEAN);
  assert.deepEqual(codes(result), []);
  assert.equal(result.summary.passed, true);
  assert.equal(result.summary.exitCode, 0);
  assert.equal(result.summary.answered, 9);
});

test('UNPRICED: a nine without a price is refused', () => {
  const result = checkSheet(CLEAN.replace(`price = "filing backlog and statutory penalty exposure"\n`, ''));
  assert.ok(codes(result).includes('UNPRICED'));
  assert.match(result.findings.find(f => f.code === 'UNPRICED').message, /fifty-third minute/);
});

test('UNSCOPED: a per-operation question answered at system scope is refused', () => {
  const result = checkSheet(CLEAN.replace('scope = "operation:accept-filing"', 'scope = "system"'));
  const finding = result.findings.find(f => f.code === 'UNSCOPED');
  assert.ok(finding);
  assert.match(finding.message, /demands operation or path/);
});

test('UNSCOPED does NOT fire on Q8 — the envelope is legitimately system-scoped', () => {
  const result = checkSheet(CLEAN);
  assert.equal(result.findings.filter(f => String(f.row).startsWith('answers.q8')).length, 0);
});

test('BARE_ADJECTIVE: banned vocabulary is refused even when it carries digits', () => {
  const result = checkSheet(CLEAN.replace(
    `statement = "50k req/s peak, concentrated in the 09:00 window"`,
    `statement = "high availability with 99.9% scalability"`));
  assert.ok(codes(result).includes('BARE_ADJECTIVE'));
});

test('UNTRIAGED: a time answer without a clock is refused', () => {
  const result = checkSheet(CLEAN.replace(`shape = "system-clock"\n`, ''));
  const finding = result.findings.find(f => f.code === 'UNTRIAGED');
  assert.ok(finding);
  assert.match(finding.message, /requester-clock|system-clock/);
});

test('MISSING_SHAPE: a load answer without volume/contention/burst/deadline is refused', () => {
  const result = checkSheet(CLEAN.replace(`shape = "volume"\n`, ''));
  assert.ok(codes(result).includes('MISSING_SHAPE'));
});

test('MISSING_SHAPE: an invented shape is refused', () => {
  const result = checkSheet(CLEAN.replace(`shape = "volume"`, `shape = "spiky"`));
  assert.ok(codes(result).includes('MISSING_SHAPE'));
});

test('UNDECOMPOSED: audit without a kind is refused; audit is not replay', () => {
  const result = checkSheet(CLEAN.replace(`kind = "audit"\n`, ''));
  const finding = result.findings.find(f => f.code === 'UNDECOMPOSED');
  assert.ok(finding);
  assert.match(finding.message, /replay/);
});

test('UNDECOMPOSED: "team independence" is a bundled answer', () => {
  const result = checkSheet(CLEAN.replace(
    `statement = "search ships weekly; the filing engine ships 3x a year"`,
    `statement = "we need team independence across 4 squads"`));
  const finding = result.findings.find(f => f.code === 'UNDECOMPOSED');
  assert.ok(finding);
  assert.match(finding.message, /ownership is not release independence/);
});

test('MISSING_DOMAIN_SHAPE: an effectful operation without domain shape blocks recovery', () => {
  const result = checkSheet(CLEAN.replace(/\[\[domain_shape\]\][\s\S]*$/, ''));
  const finding = result.findings.find(f => f.code === 'MISSING_DOMAIN_SHAPE');
  assert.ok(finding);
  assert.match(finding.message, /recovery cannot be derived/);
});

test('NO_ERA: era-pinning is mandatory', () => {
  const result = checkSheet(CLEAN.replace(`era = "2017-2025"\n`, ''));
  assert.ok(codes(result).includes('NO_ERA'));
});

// --- What the gate must NOT do ---

test('UNKNOWN passes the gate, is reported, and is never guessed', () => {
  const result = checkSheet(CLEAN.replace(
    `[[answers.q7]]
scope = "system"
statement = "search ships weekly; the filing engine ships 3x a year"`,
    `[[answers.q7]]
scope = "system"
status = "UNKNOWN"`));
  assert.equal(result.summary.passed, true, 'UNKNOWN must not block the gate');
  assert.ok(noteCodes(result).includes('UNKNOWN'));
  assert.equal(result.summary.unknown, 1);
  assert.equal(result.summary.answered, 8);
});

test('an UNKNOWN row is not also reported as unpriced or untriaged', () => {
  const result = checkSheet(CLEAN.replace(
    `scope = "path:company-search"
statement = "P95 <= 200 ms at the register's read peak"
shape = "system-clock"
price = "read path engineering; see Q8 envelope"`,
    `scope = "path:company-search"
status = "UNKNOWN"`));
  assert.deepEqual(codes(result), []);
});

test('the gate reports no vector, no axis moves, and resolves no judgment point', () => {
  const result = checkSheet(CLEAN);
  assert.equal(result.vector, undefined);
  assert.equal(result.recovery, undefined);
  assert.deepEqual(Object.keys(result).sort(), ['findings', 'notes', 'summary']);
});

test('a missing question is a note, not an invented answer', () => {
  const result = checkSheet(HEAD);
  assert.equal(result.notes.filter(n => n.code === 'NO_ROWS').length, 9);
  assert.equal(result.summary.answered, 0);
});

test('malformed TOML is reported with a line number rather than half-parsed', () => {
  const result = checkSheet(`${HEAD}\n[[answers.q1]]\nscope = "unterminated\n`);
  assert.equal(result.summary.passed, false);
  assert.ok(result.findings.some(f => typeof f.line === 'number'));
});

test('findings carry the card that justifies them', () => {
  const result = checkSheet(CLEAN.replace(`shape = "volume"\n`, ''));
  const finding = result.findings.find(f => f.code === 'MISSING_SHAPE');
  assert.equal(finding.card, 'Card 3');
  assert.equal(typeof finding.line, 'number');
});

test('check() is callable on an already-parsed sheet', () => {
  const { sheet, lines } = parseToml(CLEAN);
  assert.equal(check(sheet, lines).summary.passed, true);
});

// --- The sheets the playground ships must behave as the page advertises ---

test('the shipped complete sheet passes the gate', () => {
  const result = checkSheet(CLEAN_SHEET);
  assert.deepEqual(codes(result), [], 'the "complete sheet" example must have no findings');
  assert.equal(result.summary.answered, 9);
});

test('the shipped gappy sheet demonstrates every discipline it claims to', () => {
  const result = checkSheet(GAPPY_SHEET);
  const found = new Set(codes(result));
  for (const expected of ['NO_ERA', 'UNPRICED', 'UNSCOPED', 'UNTRIAGED',
                          'BARE_ADJECTIVE', 'MISSING_SHAPE', 'UNDECOMPOSED',
                          'MISSING_DOMAIN_SHAPE']) {
    assert.ok(found.has(expected), `gappy example should demonstrate ${expected}`);
  }
  assert.equal(result.summary.passed, false);
});

test('the gappy sheet UNKNOWN is a note, not a finding', () => {
  const result = checkSheet(GAPPY_SHEET);
  assert.ok(noteCodes(result).includes('UNKNOWN'));
  assert.equal(result.summary.unknown, 1);
  assert.ok(!codes(result).includes('UNKNOWN'));
});

test('every finding carries a message and a citing card', () => {
  for (const source of [GAPPY_SHEET, CLEAN.replace(`shape = "volume"\n`, '')]) {
    for (const finding of checkSheet(source).findings) {
      assert.ok(finding.message, `${finding.code} has no message`);
      assert.ok(finding.card, `${finding.code} cites no card`);
    }
  }
});
