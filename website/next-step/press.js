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

import { unpricedValues } from './ledger.js';

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
    id: 'fanout-to-event-based',
    source: 'axes-and-ledger.md:43; three-profiles.md:35',
    // "Event-based buys temporal decoupling, burst absorption, and fan-out." A feed
    // consumed asynchronously across module boundaries wants fan-out and tolerates lag;
    // the booking sequence inside a module wants immediacy and keeps direct. Mixed by
    // scope is a composition, not a compromise, and each scope stays uniform.
    apply(row) {
      if (row.q !== 'q5' || row.fanout !== true) return null;
      return { axis: 'substrate', toward: 'event-based', scope: row.scope,
        mechanism: 'broker', row: row.id,
        because: 'consumed asynchronously with fan-out across module boundaries: lag is tolerated, and the ledger prices fan-out here' };
    },
  },
  {
    id: 'read-your-writes-mechanism',
    source: 'three-profiles.md:33',
    // "The venue-sees-own-updates answer is a prune-mode fact replicas alone violate.
    // The lens forces a mechanism: session-pinned reads to the primary for a venue's own
    // recent writes. Contained without an axis move — a mechanism note, not a value
    // change, and the difference is the vector staying honest about what it is."
    apply(row) {
      if (row.q !== 'q4' || !row.read_your_writes) return null;
      if (row.contract === 'strict') return null;   // strict already provides it
      return { mechanismNote: true, row: row.id, scope: row.scope,
        mechanism: 'session-pinned reads to the primary',
        because: `read-your-writes (${row.read_your_writes}) against a ${row.contract} contract: replicas alone violate it, so the lens forces a mechanism rather than an axis move` };
    },
  },
  {
    id: 'contention-refuses-copies',
    source: 'Card 3; axes-and-ledger.md:21',
    // "Contention (no - one record, one winner) -> admission control (write side),
    // coalescing (read side), design-out. Never sharding." The contended record has one
    // home regardless of fleet size, so the containing mechanisms are thin tiers, and
    // thin tiers "own no business logic and no data of record -> never in the vector."
    // The most dramatic number on a sheet can move nothing, and that is the discipline
    // holding under maximum provocation (three-profiles.md:55).
    apply(row) {
      if (row.q !== 'q5' || row.shape !== 'contention') return null;
      return { inert: true, row: row.id,
        because: 'contention: a second copy does not help, so containment is admission control on the write side and coalescing on the read side — thin tiers, which never enter the vector. Sharding a contention problem buys hardware and keeps the melt.' };
    },
  },
  {
    id: 'unique-container-distributed-shared',
    source: 'Card 2; axes-and-ledger.md:49',
    // "Unique container: strict x multi-region x zero-loss on one data class ->
    // distributed shared only." The only value in the ledger providing strict
    // transactions across regions with zero loss on regional failure; its price is
    // physics, a write floor of cross-region round trips times quorum.
    apply(row, sheet) {
      if (row.q !== 'q4' || row.contract !== 'strict' || row.multi_region !== true) return null;
      const zeroLoss = rowsOf(sheet, 'q3').some(
        l => answered(l) && l.scope === row.scope && l.zero_loss === true);
      if (!zeroLoss) return null;
      return { axis: 'persistence', toward: 'distributed shared', scope: row.scope,
        mechanism: 'store', row: row.id, unique: true,
        because: 'strict, multi-region and zero-loss on one data class: the only value in the ledger that contains all three, and the write floor is physics no vendor tunes away' };
    },
  },
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
      // Two destinations, one rule. Polyglot provides "stores shaped to their data"; it
      // is earned when the divergence is about STORAGE shape — document beside
      // relational. Per-component provides "independent evolution"; it is earned when
      // the divergence is across a component boundary.
      //
      // `diverges_on` is a controlled vocabulary, matched exactly. Substring matching
      // cannot separate these: Companies House lists "shape" meaning the
      // beneficial-ownership entity shape of a separate register (per-component), while
      // profile 3 lists "data shape" meaning document beside relational (polyglot).
      // Anything not in STORAGE_SHAPE falls to per-component, which is the cheaper value.
      const STORAGE_SHAPE = ['data shape', 'storage shape', 'access pattern'];
      const onStorageShape = row.diverges_on.some(
        d => STORAGE_SHAPE.includes(String(d).trim().toLowerCase()));
      const toward = onStorageShape ? 'polyglot' : 'per-component';
      return { axis: 'persistence', toward, scope: row.scope,
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
          // Each rung contains a different shape; the top rung is the axis move and this
          // demand does not reach it. Name where the climb stopped, so the vector records
          // replicas as a mechanism rather than silently implying nothing happened.
          pressures.push({ inert: true, row: load.id, rung: 'replicas',
            because: 'same-shape read volume: the chain climbs cache, coalescing, replicas and stops there. The top rung — projections — is the axis move, and the read shape has not diverged.' });
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
  // Demands contained by a named mechanism with no axis move. Recorded so the vector
  // stays honest about what it is (three-profiles.md:33).
  const notes = [];

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
      if (result.mechanismNote) notes.push({ ...result, rule: rule.id, source: rule.source });
      else if (result.inert) inert.push({ ...result, rule: rule.id, source: rule.source });
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

  // Values with no ledger entry cannot be pressed toward; say so rather than imply
  // the derivation considered them.
  const unpriced = unpricedValues();

  return { ran: true, pressures, inert, notes, blocked: blocked(sheet), unpriced };
}
