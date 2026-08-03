// press.js — step 3. Each rule cites the book line that licenses it.
//
// A rule fires only on facts the sheet states as structured fields, never on prose.
// Read-model divergence, cadence divergence and the q9 divergence vocabulary are all
// elicited — Card 1's second row asks for read-model divergence as of AS 1.1.0 — and the
// sheet declares each explicitly, exactly as prune requires an explicit `strikes` entry.
// Inferring any of them from a `statement` would be inventing the demand.
//
// What the engine does NOT yet do is compute divergence from per-unit rows. Card 5's
// normalize step calls for one row per unit; `diverges` here remains an assertion the
// sheet makes rather than a comparison the engine runs. Tracked in NEXT-STEP-SPEC.
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
    source: 'Card 1 q7; axes-and-ledger.md:41; Card 5 step 1 (normal form)',
    // "The count presses nothing; divergence presses everything." Release independence is
    // the one thing no single artifact buys.
    //
    // Divergence is COMPUTED, not asserted. The sheet's normal form is one row per unit,
    // each stating that unit's cadence; this rule compares them. The sheet used to carry
    // a `diverges` boolean instead, which made the author the deriver — the entry gate
    // now rejects it.
    apply(row, sheet) {
      if (row.q !== 'q7') return null;
      const stated = rowsOf(sheet, 'q7')
        .filter(r => answered(r) && typeof r.cadence === 'string' && r.cadence);
      const distinct = new Set(stated.map(r => r.cadence));

      if (!stated.length) {
        return { inert: true, row: row.id,
          because: 'no unit states a cadence, so divergence is unknowable rather than absent' };
      }
      if (distinct.size < 2) {
        return { inert: true, row: row.id,
          because: `every unit that states a cadence states the same one (${[...distinct][0]}); the count of parts presses nothing` };
      }

      // The system row is the baseline the units are read against.
      const baseline = stated.find(r => scopeKind(r.scope) === 'system');
      if (scopeKind(row.scope) === 'system') {
        return { inert: true, row: row.id,
          because: 'the baseline cadence; the divergence is carried by the units that differ from it' };
      }
      if (typeof row.cadence !== 'string' || !row.cadence) {
        return { inert: true, row: row.id,
          because: 'this unit states no cadence, so it cannot be compared against the baseline' };
      }
      if (baseline && row.cadence === baseline.cadence) {
        return { inert: true, row: row.id,
          because: `this unit releases on the baseline cadence (${row.cadence})` };
      }
      const against = baseline ? baseline.cadence : 'the other units';
      return { axis: 'topology', toward: 'multiple deployables', scope: row.scope,
        mechanism: 'second pipeline', row: row.id,
        because: `the read path carries its own cadence: this unit releases ${row.cadence} against a baseline of ${against}, and cadence divergence is what no single artifact buys` };
    },
  },
  {
    id: 'scope-excluded-divergence',
    source: 'axes-and-ledger.md:63; Card 5 resolve and step 1 (normal form)',
    // Scope exclusion before hardening: a demand confined to one data class is met by
    // narrowing scope, not by hardening the whole store.
    //
    // Divergence is COMPUTED by comparing units. Each q9 row is one unit stating its own
    // comparable attributes; the system-scoped row is the baseline. This replaces a
    // `diverges_on` vocabulary matched by exact string, which could not tell Companies
    // House's "shape" (a separate register's entity shape — per-component) from profile
    // 3's "data shape" (document beside relational — polyglot), and reclassified one of
    // them the first time substring matching was tried. Comparing typed fields cannot
    // make that mistake.
    apply(row, sheet) {
      if (row.q !== 'q9') return null;
      const ATTRS = ['regulation', 'volume', 'data_shape', 'access_pattern'];
      const stated = a => row[a] !== undefined && row[a] !== null && row[a] !== '';

      if (scopeKind(row.scope) === 'system') {
        return { inert: true, row: row.id,
          because: 'the baseline the per-unit rows are compared against; a baseline presses nothing by itself' };
      }
      if (!ATTRS.some(stated)) {
        return { inert: true, row: row.id,
          because: 'states no comparable attribute, so divergence against the baseline cannot be computed' };
      }

      const peers = rowsOf(sheet, 'q9').filter(r => answered(r) && r.id !== row.id);

      // Same unit, two storage shapes -> polyglot: "stores shaped to their data".
      // Pressed once per unit, on the first row of the group, so a two-row group does
      // not press twice.
      const sameUnit = peers.filter(r => r.scope === row.scope);
      const shapeSplit = row.data_shape !== undefined
        && sameUnit.some(r => r.data_shape !== undefined && r.data_shape !== row.data_shape);
      if (shapeSplit) {
        const group = [row, ...sameUnit].filter(r => r.data_shape !== undefined)
          .sort((a, b) => String(a.id).localeCompare(String(b.id)));
        if (group[0].id !== row.id) {
          return { inert: true, row: row.id,
            because: `a second storage shape for ${row.scope}; the divergence is recorded once, on ${group[0].id}` };
        }
        const shapes = [...new Set(group.map(r => r.data_shape))];
        return { axis: 'persistence', toward: 'polyglot', scope: row.scope,
          mechanism: 'store', row: row.id, scopeExclusion: true,
          because: `one data class carries ${shapes.join(' beside ')}; a store shaped to each beats one store shaped to neither, at this scope only` };
      }

      // A unit differing from the baseline on two or more attributes is extracted.
      // One attribute is a variation; two at once is a different animal.
      const baseline = rowsOf(sheet, 'q9')
        .find(r => answered(r) && scopeKind(r.scope) === 'system');
      if (!baseline) {
        return { inert: true, row: row.id,
          because: 'no system-scoped baseline row, so this unit has nothing to diverge from' };
      }
      const differing = ATTRS.filter(a =>
        stated(a) && baseline[a] !== undefined && baseline[a] !== row[a]);
      if (differing.length < 2) {
        return { inert: true, row: row.id,
          because: differing.length
            ? `differs from the baseline on ${differing[0]} alone; one attribute is a variation, not a second animal`
            : 'states nothing the baseline also states, so no divergence is computable' };
      }
      return { axis: 'persistence', toward: 'per-component', scope: row.scope,
        mechanism: 'store', row: row.id, scopeExclusion: true,
        because: `scope exclusion before hardening: ${differing.join(', ')} diverge from the baseline simultaneously, so this unit's demand is met by narrowing scope rather than hardening the whole store` };
    },
  },
  {
    id: 'partitionable-write-volume-to-sharded',
    source: 'axes-and-ledger.md:49; LEDGER.md sharded; Shopify (Part II)',
    // Two conditions, and the second is what the industry skips. Write volume past one
    // node is the pressure; a NATURAL partition key is what makes sharding able to
    // contain it. Volume without a key is a cost problem, not an axis move — and
    // sharding a contention problem "buys hardware and keeps the melt".
    apply(row) {
      if (row.q !== 'q5' || row.exceeds_single_node !== true) return null;
      if (row.shape === 'contention') {
        return { inert: true, row: row.id,
          because: 'contention, not volume: one record has one home regardless of fleet size, so sharding buys hardware and keeps the melt' };
      }
      if (!row.partition_key) {
        return { inert: true, row: row.id,
          because: 'write volume past one node with no natural partition key: sharding has nothing to shard along, so this stays a capacity and cost problem rather than an axis move' };
      }
      return { axis: 'persistence', toward: 'sharded', scope: row.scope,
        mechanism: 'partitioned store', row: row.id,
        because: `write volume past a single node's ceiling with a natural partition key (${row.partition_key}): sharding scales writes along it, and the key becomes load-bearing` };
    },
  },
  {
    id: 'volume-plus-replay-to-streaming',
    source: 'axes-and-ledger.md:43; LEDGER.md streaming',
    // "Ordered, replayable, consumer-paced consumption for the ONE data class whose
    // volume earns a partitioned log." Both halves are required: replay-from-position
    // without the volume is an event log, and volume without replay is absorbed by the
    // event-based substrate already.
    apply(row) {
      if (row.q !== 'q5' || row.replay_from_position !== true) return null;
      if (scopeKind(row.scope) !== 'data-class') {
        return { inert: true, row: row.id,
          because: 'replay-from-position is stated, but not at data-class scope: streaming is earned by one data class, not by a path or a system' };
      }
      if (row.shape !== 'volume') {
        return { inert: true, row: row.id,
          because: `replay-from-position on a ${row.shape || 'unstated'} shape: without the volume that earns a partitioned log, the event-based substrate already contains this` };
      }
      return { axis: 'substrate', toward: 'streaming', scope: row.scope,
        mechanism: 'partitioned log', row: row.id,
        because: 'this one data class carries both the volume that earns a partitioned log and a replay-from-position need; the log is applied at its scope and nowhere else' };
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
    source: 'axes-and-ledger.md:35,45; derivation.md:21; LEDGER.md:121',
    // TWO conditions, and staleness is a COST rather than a third.
    //
    // The book, the ledger and the published runs disagreed about this rule: the book
    // asked for a contractual target plus a divergent model, the ledger asked for a tight
    // SLO plus a scale shape plus tolerable staleness, and the two graded blind runs
    // derived it from volume plus a divergent model. The runs are what reproduced
    // reality — Companies House's public-search separation was graded a HIT with its
    // staleness answer UNKNOWN and no path-level target on the sheet — so the rule
    // follows them, and the book and ledger were corrected to match.
    //
    // Staleness stays what the ledger already calls it in its costs column: a price. It
    // is checked here only where the sheet says the price cannot be paid, which is a
    // strict contract on the very scope being separated.
    apply(sheet) {
      const pressures = [];
      for (const load of rowsOf(sheet, 'q5')) {
        if (!answered(load) || scopeKind(load.scope) !== 'path') continue;
        // Read-side rows only. A burst on an intake path is write-side pressure and has
        // nothing to do with the read chain.
        if (load.read_model === undefined) continue;
        // The read chain contains same-shape volume up to replicas. Only a read whose
        // MODEL diverges from the write model reaches the top rung, which is the move.
        //
        // The divergence must be declared on the READ ROW itself. An earlier version
        // also accepted any data-class-scoped q6 row that reshaped reads, and that
        // spread one redaction mandate across every path in the sheet — applying a value
        // wider than its demanding scope, which axes-and-ledger.md:11 calls unforced
        // cost. The Companies House corpus caught it as two false projections.
        if (load.read_model !== 'diverges') {
          // Each rung contains a different shape; the top rung is the axis move and this
          // demand does not reach it. Name where the climb stopped, so the vector records
          // replicas as a mechanism rather than silently implying nothing happened.
          pressures.push({ inert: true, row: load.id, rung: 'replicas',
            because: 'same-shape read volume: the chain climbs cache, coalescing, replicas and stops there. The top rung — projections — is the axis move, and the read model has not diverged.' });
          continue;
        }
        // Second condition: the volume that makes a second copy worth building. A
        // divergent model on a path nobody reads hard is a schema opinion, not a demand.
        if (load.shape !== 'volume') {
          pressures.push({ inert: true, row: load.id,
            because: `the read model diverges but the load shape is ${load.shape || 'unstated'}, not volume: divergence alone does not earn projection machinery` });
          continue;
        }
        // The cost check. Separation buys its scaling with a staleness window, so a scope
        // contracted to strict consistency cannot pay for it.
        const strict = rowsOf(sheet, 'q4').find(r =>
          answered(r) && r.scope === load.scope && r.contract === 'strict');
        if (strict) {
          pressures.push({ inert: true, row: load.id,
            because: `this path is contracted strict (${strict.id}), and separation is paid for in a staleness window: the price cannot be paid at this scope` });
          continue;
        }
        pressures.push({
          axis: 'read_write', toward: 'separated', scope: load.scope,
          mechanism: 'projection pipeline', row: load.id, combination: true,
          because: 'read volume and a read model that diverges from the write model converge: the chain goes past replicas to projections, and that top rung is the axis move',
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
