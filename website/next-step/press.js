// press.js — step 3. Each rule cites the book line that licenses it.
//
// A rule fires only on facts the sheet states. Where the book's condition depends on
// something no question elicits — "a read shape that diverges from the write model" —
// the sheet must declare it, exactly as prune requires an explicit `strikes` entry.
// Inferring it from prose would be inventing the demand.
//
// Contained demands are inert and are recorded as results, not discarded
// (`derivation.md:19`). Inert rows matter as much as moves: an engine that presses one
// inflates every architecture it derives.

import { CONTAINMENT } from './ledger.js';

const scopeKind = scope =>
  typeof scope !== 'string' ? null : (scope === 'system' ? 'system' : scope.split(':')[0]);

const rowsOf = (sheet, q) => ((sheet.answers || {})[q] || [])
  .map((row, index) => ({ ...row, id: `answers.${q}[${index}]` }));

const answered = row => (row.status || 'answered') !== 'UNKNOWN';

/**
 * Single-row rules. Each returns a pressure or null, and each names its source.
 * A pressure is (axis, toward, scope, mechanism) — `derivation.md:19`.
 */
const SINGLE = [
  {
    id: 'burst-to-event-based',
    source: 'Card 3; axes-and-ledger.md:23,43',
    // "Burst (peak + tolerable settling delay) -> buffer/queue." The definition carries
    // its own test: a peak that must be served SYNCHRONOUSLY is volume at the peak
    // number, so a system-clock time answer at the same scope defeats the burst reading.
    apply(row, sheet) {
      if (row.q !== 'q5' || row.shape !== 'burst') return null;
      const syncTarget = rowsOf(sheet, 'q1').some(
        t => answered(t) && t.shape === 'system-clock' && t.scope === row.scope);
      if (syncTarget) {
        return { inert: true, row: row.id,
          because: 'a peak that must be served synchronously is volume at the peak number, not a burst' };
      }
      return { axis: 'substrate', toward: 'event-based', scope: row.scope,
        mechanism: 'queue', row: row.id,
        because: 'burst shape: the queue absorbs the peak, and no synchronous latency target opposes it' };
    },
  },
  {
    id: 'requester-clock-inert',
    source: 'Card 3',
    // "requester's clock (statutory window - inert) vs system's clock (response target
    // - presses)."
    apply(row) {
      if (row.q !== 'q1' || row.shape !== 'requester-clock') return null;
      return { inert: true, row: row.id,
        because: "the deadline binds the requester's clock, not the system's" };
    },
  },
  {
    id: 'replay-to-event-sourced',
    source: 'axes-and-ledger.md:47; Card 1 q6',
    // Current-state plus an audit log answers every who/what/when question. Only REPLAY
    // - state at a past moment, under that moment's rules - earns event-sourced.
    apply(row) {
      if (row.q !== 'q6') return null;
      if (row.kind === 'audit') {
        return { inert: true, row: row.id,
          because: 'audit is contained by current-state plus an audit log written in the same transaction; only replay earns event-sourced' };
      }
      if (row.kind === 'replay') {
        return { axis: 'state', toward: 'event-sourced', scope: row.scope,
          mechanism: 'event store', row: row.id,
          because: 'replay requires state at a past moment under that moment’s rules' };
      }
      return null;
    },
  },
  {
    id: 'cadence-divergence-to-multiple',
    source: 'Card 1 q7; axes-and-ledger.md:41',
    // "The count presses nothing; divergence presses everything." Release independence
    // is the one thing no single artifact buys. The sheet must state the divergence.
    apply(row) {
      if (row.q !== 'q7') return null;
      if (!row.diverges) {
        return { inert: true, row: row.id,
          because: 'no cadence divergence is stated; the count of parts presses nothing' };
      }
      return { axis: 'topology', toward: 'multiple deployables', scope: row.scope,
        mechanism: 'second pipeline', row: row.id,
        because: 'cadence divergence: release independence is what no single artifact buys' };
    },
  },
  {
    id: 'scope-excluded-divergence',
    source: 'axes-and-ledger.md:63; Card 5 resolve',
    // Scope exclusion before hardening: a demand confined to one data class is met by
    // narrowing scope, not by hardening the whole store. The sheet declares the
    // divergence rather than the engine reading it out of prose.
    apply(row) {
      if (row.q !== 'q9' || !Array.isArray(row.diverges_on)) return null;
      if (row.diverges_on.length < 2 || scopeKind(row.scope) === 'system') return null;
      return { axis: 'persistence', toward: 'per-component', scope: row.scope,
        mechanism: 'store', row: row.id, scopeExclusion: true,
        because: `${row.diverges_on.join(', ')} diverge simultaneously at one scope; scope exclusion is tested before hardening the whole store` };
    },
  },
];

/**
 * Combination rules. "Pressures must be tested in combination, not only row by row. Two
 * answers that are individually contained can jointly clear a bar neither reaches
 * alone" (`derivation.md:21`) — the canonical case being read volume replicas would
 * hold, meeting a read shape replicas cannot serve.
 */
const COMBINATIONS = [
  {
    id: 'volume-plus-shape-to-separated',
    source: 'axes-and-ledger.md:35,45; derivation.md:21',
    apply(sheet) {
      const pressures = [];
      for (const load of rowsOf(sheet, 'q5')) {
        if (!answered(load) || scopeKind(load.scope) !== 'path') continue;
        // Read-side rows only. A burst on an intake path is write-side pressure and has
        // nothing to do with the read chain.
        if (load.read_shape === undefined) continue;
        // The read chain contains same-shape volume up to replicas. Only a read whose
        // SHAPE diverges from the write model reaches the top rung, which is the move.
        //
        // The divergence must be declared on the READ ROW itself. An earlier version
        // also accepted any data-class-scoped q6 row that reshaped reads, and that
        // spread one redaction mandate across every path in the sheet — applying a value
        // wider than its demanding scope, which axes-and-ledger.md:11 calls unforced
        // cost. The Companies House corpus caught it as two false projections.
        if (load.read_shape !== 'diverges') {
          pressures.push({ inert: true, row: load.id,
            because: 'same-shape read volume is contained by the read chain: cache, coalescing, replicas' });
          continue;
        }
        pressures.push({
          axis: 'read_write', toward: 'separated', scope: load.scope,
          mechanism: 'projection pipeline', row: load.id, combination: true,
          because: 'read volume and a read shape that diverges from the write model converge: the chain goes past replicas to projections, and that top rung is the axis move',
        });
      }
      return pressures;
    },
  },
];

/** Values an UNKNOWN blocks: an answer the value requires, not supplied, blocks it. */
function blocked(sheet) {
  const out = [];
  for (const row of rowsOf(sheet, 'q3')) {
    if (answered(row)) continue;
    out.push({ axis: 'persistence', value: 'distributed shared', row: row.id,
      because: 'the loss budget is UNKNOWN, and distributed shared is earned only by a stated zero-loss demand — an honest UNKNOWN derives a null position, never machinery' });
  }
  return out;
}

/** Step 3. Returns pressures, inert rows, and blocked values. */
export function press(sheet) {
  const pressures = [];
  const inert = [];

  const all = [];
  for (const q of ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9']) {
    for (const row of rowsOf(sheet, q)) all.push({ ...row, q });
  }

  for (const row of all) {
    if (!answered(row)) {
      inert.push({ row: row.id, because: 'UNKNOWN derives a null position and a note' });
      continue;
    }
    let matched = false;
    for (const rule of SINGLE) {
      const result = rule.apply(row, sheet);
      if (!result) continue;
      matched = true;
      if (result.inert) inert.push({ ...result, rule: rule.id, source: rule.source });
      else pressures.push({ ...result, rule: rule.id, source: rule.source });
    }
    if (!matched) {
      inert.push({ row: row.id, because: 'no rule in the ledger prices this row against the current position' });
    }
  }

  for (const rule of COMBINATIONS) {
    for (const result of rule.apply(sheet)) {
      if (result.inert) inert.push({ ...result, rule: rule.id, source: rule.source });
      else pressures.push({ ...result, rule: rule.id, source: rule.source });
    }
  }

  // Axes with no ledger entries at all cannot be tested; say so rather than imply clean.
  const unpriced = Object.keys(CONTAINMENT).length
    ? Object.keys({ topology: 1, substrate: 1, read_write: 1, state: 1, persistence: 1 })
        .filter(axis => !CONTAINMENT[axis])
    : [];

  return { ran: true, pressures, inert, blocked: blocked(sheet), unpriced };
}
