// normal-form.test.js — Card 5 step 1: one row per unit.
//
// Three axes press on divergence BETWEEN units. The sheet used to assert that divergence
// with a `diverges` boolean and a `diverges_on` vocabulary, which made the sheet's author
// the deriver — the engine read a conclusion and called it a demand. These tests pin the
// replacement: the units are rows, and the divergence is computed by comparing them.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseToml, check } from './engine.js';
import { derive } from './derive.js';

const HEAD = `schema_version = "0.1"
[meta]
system = "s"
era = "2020-2024"
mode = "greenfield"
`;

const sheetOf = toml => parseToml(toml).sheet;

// ---------- the gate rejects the old assertions ----------

test('a q7 `diverges` boolean is UNNORMALIZED, not obeyed', () => {
  const { findings } = check(sheetOf(`${HEAD}
[[answers.q7]]
scope = "system"
statement = "two teams"
diverges = true
status = "answered"
`), {});
  const f = findings.find(x => x.code === 'UNNORMALIZED');
  assert.ok(f, 'the gate must reject an asserted divergence');
  assert.match(f.message, /stating the units/);
});

test('a q9 `diverges_on` vocabulary is UNNORMALIZED', () => {
  const { findings } = check(sheetOf(`${HEAD}
[[answers.q9]]
scope = "data-class:x"
statement = "x differs"
diverges_on = ["regulation", "volume"]
status = "answered"
`), {});
  assert.ok(findings.some(x => x.code === 'UNNORMALIZED'));
});

// ---------- cadence divergence is computed ----------

const cadenceSheet = (unitCadence) => `${HEAD}
[[answers.q7]]
scope = "system"
statement = "baseline train"
cadence = "weekly"
status = "answered"

[[answers.q7]]
scope = "path:quote"
statement = "the quote path"
cadence = "${unitCadence}"
status = "answered"
`;

test('two distinct cadences across units press topology, at the diverging unit', () => {
  const result = derive(sheetOf(cadenceSheet('independent')));
  const p = result.pressures.find(x => x.axis === 'topology');
  assert.ok(p, 'divergence must be found by comparison');
  assert.equal(p.toward, 'multiple deployables');
  assert.equal(p.scope, 'path:quote', 'the pressure attaches to the unit that differs');
});

test('the SAME cadence on both rows presses nothing — the comparison is real', () => {
  const result = derive(sheetOf(cadenceSheet('weekly')));
  assert.deepEqual(result.pressures.filter(p => p.axis === 'topology'), [],
    'identical cadences cannot produce divergence');
  assert.ok(result.inert.some(i => /states the same one/.test(i.because || '')));
});

test('with three units, only the one off the baseline presses', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q7]]
scope = "system"
statement = "baseline train"
cadence = "weekly"
status = "answered"

[[answers.q7]]
scope = "path:quote"
statement = "on the train"
cadence = "weekly"
status = "answered"

[[answers.q7]]
scope = "path:feed"
statement = "off the train"
cadence = "continuous"
status = "answered"
`));
  const topo = result.pressures.filter(p => p.axis === 'topology');
  assert.equal(topo.length, 1, 'only the diverging unit presses');
  assert.equal(topo[0].scope, 'path:feed');
  assert.ok(result.inert.some(i => /releases on the baseline cadence/.test(i.because || '')),
    'the unit that matches the baseline is recorded inert, by name');
});

test('no cadence stated is unknowable, not absent', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q7]]
scope = "system"
statement = "several parts, no cadence given"
status = "answered"
`));
  assert.ok(result.inert.some(i => /unknowable rather than absent/.test(i.because || '')),
    'silence about cadence must not be reported as "no divergence"');
});

// ---------- q9 divergence is computed ----------

test('a unit differing from the baseline on two attributes is extracted', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q9]]
scope = "system"
statement = "the main register"
regulation = "Act A"
volume = "5m"
status = "answered"

[[answers.q9]]
scope = "data-class:other"
statement = "a second register"
regulation = "Act B"
volume = "32k"
status = "answered"
`));
  const p = result.pressures.find(x => x.axis === 'persistence');
  assert.equal(p.toward, 'per-component');
  assert.equal(p.scope, 'data-class:other');
  assert.match(p.because, /regulation, volume/);
});

test('one differing attribute is a variation, not a second animal', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q9]]
scope = "system"
statement = "the main register"
regulation = "Act A"
volume = "5m"
status = "answered"

[[answers.q9]]
scope = "data-class:other"
statement = "same rules, less of it"
regulation = "Act A"
volume = "32k"
status = "answered"
`));
  assert.deepEqual(result.pressures.filter(p => p.axis === 'persistence'), []);
  assert.ok(result.inert.some(i => /one attribute is a variation/.test(i.because || '')));
});

test('two storage shapes on ONE unit press polyglot exactly once', () => {
  const result = derive(sheetOf(`${HEAD}
[[answers.q9]]
scope = "system"
statement = "one product"
status = "answered"

[[answers.q9]]
scope = "data-class:catalogue"
statement = "documents"
data_shape = "document"
status = "answered"

[[answers.q9]]
scope = "data-class:catalogue"
statement = "rows"
data_shape = "relational"
status = "answered"
`));
  const polyglot = result.pressures.filter(p => p.toward === 'polyglot');
  assert.equal(polyglot.length, 1, 'a two-row group must not press twice');
  assert.equal(polyglot[0].scope, 'data-class:catalogue');
  assert.ok(result.inert.some(i => /recorded once/.test(i.because || '')));
});

test('per-component and polyglot are separated by typed fields, not by string matching', () => {
  // The old vocabulary matched `diverges_on` entries exactly, and could not tell
  // "shape" (a separate register — per-component) from "data shape" (document beside
  // relational — polyglot). Comparing typed fields cannot make that mistake: the
  // difference is now WHERE the shapes differ, not what the author called them.
  const crossUnit = derive(sheetOf(`${HEAD}
[[answers.q9]]
scope = "system"
statement = "baseline"
regulation = "Act A"
data_shape = "company record"
status = "answered"

[[answers.q9]]
scope = "data-class:roe"
statement = "another register"
regulation = "Act B"
data_shape = "beneficial ownership"
status = "answered"
`));
  assert.equal(crossUnit.pressures.find(p => p.axis === 'persistence').toward, 'per-component',
    'shapes differing ACROSS units is a second component');
});
