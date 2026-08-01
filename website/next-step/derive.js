// derive.js — `next_step derive`, as far as the book's own rules can currently take it.
//
// Steps, per Card 5 / `derivation.md`:
//   0 null vector   — implemented (ledger.js)
//   1 normalize     — implemented (engine.js, the entry gate)
//   2 prune         — implemented here; mechanical, binary, needs no containment data
//   3 press         — implemented (press.js), against the ledger entries transcribed
//                     from `book-arch-meta/LEDGER.md` v0.2 into ledger.js
//   4 resolve       — recovery is implemented here (it reads domain-shape facts, not the
//                     ledger); axis resolution runs off press.
//   5 verify        — implemented (verify.js), Card 6's five arithmetic rules
//
// Refusals are emitted, never resolved: "targets, recovery ties, contradiction choices,
// product picks" (Card 5). A recovery tie is a judgment point in the output.

import { AXES, NULL_VECTOR } from './ledger.js';
import { press } from './press.js';
import { verify } from './verify.js';

const SCOPE_ORDER = ['system', 'data-class', 'path', 'operation', 'policy'];

function scopeOf(scope) {
  if (typeof scope !== 'string') return null;
  return scope === 'system' ? 'system' : scope.split(':')[0];
}

/**
 * Step 2 — prune. Correctness answers strike values; each strike records the answer
 * that struck it. Binary, no weights (`derivation.md:17`, Card 5).
 *
 * Strikes are explicit in the sheet: a q6 mandate row carries strikes = ["axis:value"].
 * The engine does not infer strikes from prose, because inferring them would be
 * inventing the mandate's reach.
 */
export function prune(sheet) {
  const board = {};
  for (const [axis, spec] of Object.entries(AXES)) board[axis] = [...spec.values];

  const strikes = [];
  const rejected = [];
  const rows = (sheet && sheet.answers && sheet.answers.q6) || [];

  rows.forEach((row, index) => {
    const id = `answers.q6[${index}]`;
    for (const strike of row.strikes || []) {
      const [axis, ...rest] = String(strike).split(':');
      const value = rest.join(':');
      if (!board[axis]) {
        rejected.push({ row: id, strike, reason: `no axis '${axis}'` });
        continue;
      }
      if (!board[axis].includes(value)) {
        rejected.push({ row: id, strike, reason: `'${value}' is not a value of ${axis}` });
        continue;
      }
      board[axis] = board[axis].filter(v => v !== value);
      strikes.push({ axis, value, row: id, by: row.statement || row.kind || 'mandate', scope: row.scope });
    }
  });

  // An axis pruned to nothing is the sharpest halt (`when-derivation-says-no.md:47`).
  const emptied = Object.entries(board)
    .filter(([, values]) => values.length === 0)
    .map(([axis]) => axis);

  return { board, strikes, rejected, emptied };
}

/**
 * Step 4, recovery — decided per effectful operation from domain-shape facts, not from
 * the ledger and not from preference (`derivation.md:23`):
 *   reshapeable            -> design-out, and this is checked first
 *   inverse exists         -> compensate
 *   decays                 -> degrade-and-continue
 *   inverse AND decays     -> a genuine tie: emitted as a judgment point, never resolved
 *   neither                -> no rule applies; the operation needs a built inverse,
 *                             which is a use case of its own with its own targets
 */
export function deriveRecovery(sheet) {
  const decided = [];
  const judgmentPoints = [];
  const rows = (sheet && sheet.domain_shape) || [];

  rows.forEach((row, index) => {
    const id = `domain_shape[${index}]`;
    const operation = row.operation || `(unnamed ${id})`;
    const reshapeable = (row.reshapeable || []).filter(r => r && r !== 'none');
    const hasInverse = row.inverse && row.inverse !== 'none';
    const decays = row.decays === true;

    if (reshapeable.length) {
      decided.push({
        operation, value: 'design-out', row: id,
        forcedBy: `reshapeable: ${reshapeable.join(', ')}`,
        note: 'design-out is checked first; where available it embarrasses the alternatives',
      });
      return;
    }
    if (hasInverse && decays) {
      judgmentPoints.push({
        kind: 'recovery-tie', operation, row: id,
        options: ['compensate', 'degrade-and-continue'],
        message: `'${operation}' offers both an inverse and tolerable degradation. The ledger prices both; weighing restored consistency against liveness is a business preference, so the derivation does not choose.`,
      });
      return;
    }
    if (hasInverse) {
      decided.push({ operation, value: 'compensate', row: id, forcedBy: `inverse: ${row.inverse}` });
      return;
    }
    if (decays) {
      decided.push({
        operation, value: 'degrade-and-continue', row: id, forcedBy: 'value decays',
        note: 'degraded windows must be bounded and visible',
      });
      return;
    }
    judgmentPoints.push({
      kind: 'recovery-unforced', operation, row: id,
      options: ['compensate (inverse must be built)', 'design-out (reshape the operation)'],
      message: `'${operation}' has no inverse, does not decay, and is not reshapeable. No rule decides it: building an inverse is a use case of its own with its own targets.`,
    });
  });

  return { decided, judgmentPoints };
}

/**
 * Step 3 — press, delegated to press.js. Kept re-exported so callers that only want the
 * pressure matrix do not have to run the whole derivation.
 */
export { press };

/**
 * Step 4 — resolve. Pressures become scoped positions. Values apply at demand scope and
 * hybrids are compositions produced by scope splits (`axes-and-ledger.md:10-11`), so the
 * vector is a set of (axis, value, scope) entries, not one value per axis.
 *
 * Where two pressures on one axis attach to DIFFERENT scopes, the axis does not
 * compromise: the system splits at the boundary and each side keeps its own value
 * (`derivation.md:33`). Same-scope opposition is a contradiction and halts.
 */
export function resolve(pressures, board) {
  const vector = {};
  for (const [axis, value] of Object.entries(NULL_VECTOR)) {
    vector[axis] = [{ value, scope: 'system', moved: false }];
  }

  const halts = [];
  const byAxis = {};
  for (const p of pressures) (byAxis[p.axis] = byAxis[p.axis] || []).push(p);

  for (const [axis, group] of Object.entries(byAxis)) {
    for (const p of group) {
      const available = board[axis] || [];
      if (!available.includes(p.toward)) {
        halts.push({ kind: 'contradiction', axis,
          message: `'${p.toward}' is pressed on ${axis} at ${p.scope} but was struck during prune. No vector satisfies the answers.` });
        continue;
      }
      const sameScope = group.filter(o => o.scope === p.scope && o.toward !== p.toward);
      if (sameScope.length) {
        halts.push({ kind: 'contradiction', axis,
          message: `Opposing pressures on ${axis} at the same scope (${p.scope}) after decomposition: ${p.toward} against ${sameScope.map(o => o.toward).join(', ')}.` });
        continue;
      }
      // Different scopes: split at the boundary, each side keeps its own value.
      if (!vector[axis].some(e => e.value === p.toward && e.scope === p.scope)) {
        vector[axis].push({
          value: p.toward, scope: p.scope, moved: true,
          forcedBy: p.row, mechanism: p.mechanism, because: p.because,
          combination: !!p.combination, scopeExclusion: !!p.scopeExclusion,
        });
      }
    }
  }
  return { vector, halts };
}

/** Run the derivation. Never fabricates a moved axis: every move cites a pressure. */
export function derive(sheet) {
  const pruned = prune(sheet);
  const recovery = deriveRecovery(sheet);
  const pressed = press(sheet);
  const resolved = resolve(pressed.pressures, pruned.board);

  const halts = [...resolved.halts];
  if (pruned.emptied.length) {
    halts.push({
      kind: 'contradiction',
      message: `Every value was struck on: ${pruned.emptied.join(', ')}. No vector satisfies the answers.`,
      axes: pruned.emptied,
    });
  }
  if (pressed.unpriced.length) {
    halts.push({
      kind: 'unexplored-territory',
      message: `${pressed.unpriced.length} axis values carry no ledger entry (${pressed.unpriced.join(', ')}), so nothing can be pressed toward them. The ledger cannot price these yet — a different statement from "these cannot be built."`,
      values: pressed.unpriced,
    });
  }

  const mode = (sheet && sheet.meta && sheet.meta.mode) || 'greenfield';
  const start = mode === 'living' && sheet.current_vector ? 'current_vector' : 'null vector';

  const vector = { ...resolved.vector };
  vector.recovery = recovery.decided.map(r => ({
    value: r.value, scope: `operation:${r.operation}`, forcedBy: r.row, because: r.forcedBy,
  }));

  // Step 5 — verify. Runs only when the sheet carries verification inputs; the exit
  // gate never invents a floor, so a sheet without them is not "verified clean", it is
  // unverified, and the result says which.
  const verification = sheet && sheet.verification
    ? verify(sheet, vector)
    : { results: [], failures: [], unverified: [], passed: false, complete: false,
        notAttempted: true };

  return {
    mode,
    start,
    vector,
    board: pruned.board,
    strikes: pruned.strikes,
    rejectedStrikes: pruned.rejected,
    pressures: pressed.pressures,
    inert: pressed.inert,
    mechanismNotes: pressed.notes,
    blocked: pressed.blocked,
    recovery: recovery.decided,
    judgmentPoints: recovery.judgmentPoints,
    pressRan: pressed.ran,
    verification,
    halts,
    exitCode: halts.length ? 2 : (recovery.judgmentPoints.length ? 3 : 0),
  };
}

export { SCOPE_ORDER, scopeOf };
