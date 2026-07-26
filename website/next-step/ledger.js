// ledger.js — the selection space, as data.
//
// Card 2 gives the six axes and their atomic values, null first. What it does NOT give
// is each value's `provides / mechanism / costs` entry — and those are what press and
// resolve consume. `axes-and-ledger.md:39` says "the full entries live in the reference
// cards"; they do not exist there yet, so this file enumerates the values with their
// containment entries absent.
//
// That absence is deliberate and load-bearing. The book is explicit that the procedure
// "selects among mechanisms the ledger prices; it cannot invent one"
// (`derivation.md:57`), and that a demand the ledger cannot price is the
// unexplored-territory halt, not a guess. So press reports a ledger gap rather than
// inventing containment. Filling `contains` below is data entry against the book, and
// authorial work — a wrong `provides` produces confidently wrong derivations.

// Card 2 — six axes, atomic values, null first. Recovery has no null.
export const AXES = {
  topology: {
    title: 'Deployment topology',
    values: ['single deployable', 'multiple deployables', 'unified runtime', 'serverless'],
  },
  substrate: {
    title: 'Composition substrate',
    values: ['direct', 'event-based', 'streaming'],
  },
  read_write: {
    title: 'Read/write model',
    values: ['unified', 'separated'],
  },
  state: {
    title: 'State storage',
    values: ['current-state', 'event-sourced'],
  },
  persistence: {
    title: 'Persistence',
    values: ['single shared', 'distributed shared', 'sharded', 'per-component', 'polyglot'],
  },
  recovery: {
    title: 'Recovery',
    // No null: every effectful operation must answer it.
    values: ['design-out', 'compensate', 'degrade-and-continue'],
    noNull: true,
  },
};

// Step 0 — "single deployable / direct / unified / current-state / single shared"
// (`derivation.md:11`, Card 5). Recovery is decided per effectful operation in step 4.
export const NULL_VECTOR = {
  topology: 'single deployable',
  substrate: 'direct',
  read_write: 'unified',
  state: 'current-state',
  persistence: 'single shared',
};

// Card 4 — containment rungs, in order. Rung zero is hardware sizing; the read chain
// climbs cache -> coalescing -> replicas -> projections, and only the top rung is an
// axis move (`axes-and-ledger.md:35`).
export const RUNGS = ['hardware sizing', 'cache', 'coalescing', 'replicas', 'projections'];

// Thin tiers own no business logic and no data of record, so they never enter the
// vector (`axes-and-ledger.md:31`).
export const THIN_TIERS = ['load balancer', 'cache', 'coalescer', 'admission gate'];

// Per-axis-value containment entries. Empty by design — see the header. Shape, for
// whoever fills it:
//
//   'separated': {
//     provides: [{ shape: 'volume', scope: 'path', bound: '...' }],
//     mechanisms: ['projection', 'backfill', 'dual schema evolution'],
//     costs: ['staleness window', 'dual schema evolution'],
//   }
//
// Until an axis has entries, press cannot test containment against it and says so.
export const CONTAINMENT = {};

/** Which axes the ledger can currently price. */
export function pricedAxes() {
  return Object.keys(AXES).filter(axis => CONTAINMENT[axis] !== undefined);
}

/** Axes press cannot evaluate, because the ledger has no entries for them. */
export function unpricedAxes() {
  return Object.keys(AXES).filter(axis => CONTAINMENT[axis] === undefined && axis !== 'recovery');
}
