// derive.js — `next_step derive`, as far as the book's own rules can currently take it.
//
// Steps, per Card 5 / `derivation.md`:
//   0 null vector   — implemented (ledger.js)
//   1 normalize     — implemented (engine.js, the entry gate)
//   2 prune         — implemented here; mechanical, binary, needs no containment data
//   3 press         — BLOCKED: needs the ledger's provides/mechanism/costs entries,
//                     which do not exist yet. Reported, never guessed.
//   4 resolve       — recovery is implemented here (it reads domain-shape facts, not the
//                     ledger); axis resolution waits on press.
//   5 verify        — waits on a resolved vector.
//
// Refusals are emitted, never resolved: "targets, recovery ties, contradiction choices,
// product picks" (Card 5). A recovery tie is a judgment point in the output.

import { AXES, NULL_VECTOR, unpricedAxes } from './ledger.js';

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
 * Step 3 — press. Cannot run: containment is tested against each axis value's ledger
 * entry, and those entries do not exist. Returns the gap rather than a guess, which is
 * the unexplored-territory halt's own logic — "the ledger cannot price this" is a
 * different statement from "this cannot be built" (`when-derivation-says-no.md:55`).
 */
export function press() {
  const axes = unpricedAxes();
  return {
    ran: false,
    pressures: [],
    halt: {
      kind: 'unexplored-territory',
      message: `The ledger has no provides/mechanism/costs entries for ${axes.length} axes (${axes.join(', ')}), so containment cannot be tested. This is a gap in the instrument, not a verdict about the system: the ledger cannot price this yet.`,
      axes,
    },
  };
}

/** Run the derivation as far as the rules allow. Never fabricates a moved axis. */
export function derive(sheet) {
  const pruned = prune(sheet);
  const recovery = deriveRecovery(sheet);
  const pressed = press();

  const halts = [];
  if (pruned.emptied.length) {
    halts.push({
      kind: 'contradiction',
      message: `Every value was struck on: ${pruned.emptied.join(', ')}. No vector satisfies the answers.`,
      axes: pruned.emptied,
    });
  }
  if (pressed.halt) halts.push(pressed.halt);

  const mode = (sheet && sheet.meta && sheet.meta.mode) || 'greenfield';
  const start = mode === 'living' && sheet.current_vector ? 'current_vector' : 'null vector';

  return {
    mode,
    start,
    // Positions held, not derived: nothing has pressed them, because press did not run.
    vector: { ...NULL_VECTOR },
    board: pruned.board,
    strikes: pruned.strikes,
    rejectedStrikes: pruned.rejected,
    recovery: recovery.decided,
    judgmentPoints: recovery.judgmentPoints,
    pressRan: pressed.ran,
    halts,
    // Exit codes follow spec §5: 2 halts, 3 judgment points pending, 0 clean.
    exitCode: halts.length ? 2 : (recovery.judgmentPoints.length ? 3 : 0),
  };
}

export { SCOPE_ORDER, scopeOf };
