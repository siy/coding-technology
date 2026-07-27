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

// Per-axis-value entries. `provides` is prose from the chapter, kept so a reader can
// check an entry against its source. `mechanisms` is the countable part: resolve's
// tiebreaker is "fewest new mechanisms", and a mechanism is a **standing operational
// component that must be run and can fail independently** — the transcript's own usage
// ("a queue is the named containing mechanism") and Card 6's list (stores, brokers,
// projection pipelines, cell disciplines). Everything else the prose lists is a `cost`:
// "a mechanism bills for existing" (axes-and-ledger.md:12).
//
// Only the values the published runs exercise are entered so far. An axis value with no
// entry is unpriced, and press says so rather than guessing.
export const CONTAINMENT = {
  substrate: {
    'direct': {
      provides: 'lowest latency and read-your-effects immediacy',
      mechanisms: [],
      costs: ['temporal coupling', 'availability multiplies down the chain',
              'bursts arrive unbuffered at the deepest dependency'],
      source: 'axes-and-ledger.md:43',
    },
    'event-based': {
      provides: 'temporal decoupling, burst absorption, and fan-out',
      mechanisms: ['broker'],
      costs: ['propagation lag on every consumer view', 'idempotent consumers',
              'ordering only per key', 'between-steps state becomes durable and operated'],
      source: 'axes-and-ledger.md:43',
    },
  },
  read_write: {
    'unified': {
      provides: 'read-your-writes for free and zero projection machinery; the whole containment chain lives inside this value',
      mechanisms: [],
      costs: [],
      source: 'axes-and-ledger.md:45',
    },
    'separated': {
      provides: 'independent scaling and shape for one read path, through projections',
      mechanisms: ['projection pipeline'],
      costs: ['staleness window', 'machinery to build and backfill', 'dual schema evolution'],
      // "worth paying exactly when a read path carries its own contractual target AND
      // its own shape, and worth refusing otherwise" — a two-condition AND.
      source: 'axes-and-ledger.md:45',
    },
  },
  persistence: {
    'single shared': {
      provides: 'cross-component transactions for free: strict consistency',
      mechanisms: ['store'],
      costs: ['shared ceiling', 'shared blast radius'],
      source: 'axes-and-ledger.md:49',
    },
    'per-component': {
      provides: 'independent evolution and stores shaped to their data',
      mechanisms: ['store'],
      costs: ['transactions across components decay to protocol',
              'one operational competency per store technology'],
      source: 'axes-and-ledger.md:49',
    },
    'distributed shared': {
      provides: 'the only value providing strict transactions across regions with zero data loss on regional failure',
      mechanisms: ['store'],
      costs: ['a write floor of cross-region round trips times quorum, which no vendor tunes away'],
      // Card 2's unique container: strict x multi-region x zero-loss on one data class.
      requires: ['loss-budget'],
      source: 'axes-and-ledger.md:49, Card 2',
    },
  },
};

/** Which axes the ledger can currently price. */
export function pricedAxes() {
  return Object.keys(AXES).filter(axis => CONTAINMENT[axis] !== undefined);
}

/** Axes press cannot evaluate, because the ledger has no entries for them. */
export function unpricedAxes() {
  return Object.keys(AXES).filter(axis => CONTAINMENT[axis] === undefined && axis !== 'recovery');
}
