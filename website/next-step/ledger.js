// ledger.js — the selection space, as data.
//
// Transcribed from book-arch-meta/LEDGER.md v0.2 (2026-07-10), "The Capability/Cost
// Ledger": one entry per atomic axis value — what it *provides* (always scoped, never a
// bare -ility), *via* which mechanism, at what *costs* (always-on, paid whether
// exercised or not), and which demands *press toward it*.
//
// That file is the authority, not this one and not the chapter prose. An earlier version
// of this module was reconstructed from `axes-and-ledger.md` because the ledger was
// believed missing; it is not missing, it is unpublished, and `axes-and-ledger.md:39`
// forward-references it to the reference cards where it has not yet been printed.
//
// `pressedBy` is the press rules' source of truth. Where press.js and LEDGER.md
// disagree, LEDGER.md wins and press.js has a bug.

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
  topology: {
    'single deployable': {
      provides: 'in-process calls on all internal paths (no network latency or partial failure inside); one release pipeline, one ops surface, one on-call; trivially uniform technical cross-cutting',
      via: 'one artifact, one process (or N identical instances)',
      costs: ['whole-system blast radius', 'scaling is whole-unit, sized to the hottest path',
              'one release cadence for all code'],
      pressedBy: ['bounded ops capacity', 'no divergent scale shapes', 'uniform cadence acceptable'],
      // Sub-value: modules provide OWNERSHIP at zero deployment cost, and contain the
      // ownership half of "team independence" (F2). They do NOT provide release
      // independence. F21: the modulith holds from 4 to 1000+ developers.
      subValues: ['modulith'],
      source: 'LEDGER.md:63-68',
    },
    'multiple deployables': {
      provides: 'independent release cadence per unit; independent scaling per unit\'s shape; blast-radius isolation between failure domains',
      via: 'separate processes, network boundaries, separate pipelines, versioned contracts',
      costs: ['network on every cross-unit path — latency floor and partial failure become internal concerns',
              'N times the ops surface', 'cross-unit consistency drops from transactional to protocol-based'],
      pressedBy: ['divergent scale shape on a path', 'demanded release independence',
                  'demanded blast-radius isolation'],
      // "NOT by team ownership alone (modules contain that)" — F21.
      notPressedBy: ['team ownership alone'],
      source: 'LEDGER.md:70-74',
    },
    'unified runtime': {
      provides: 'one-or-many packaging decided at deploy time without wire rewrite, keeping the one-vs-many decision deferrable; transport-transparent calls between slices; uniform resource and aspect supply',
      via: 'runtime hosts components as slices over a wire abstraction',
      costs: ['the runtime is itself a platform dependency', 'young product class'],
      pressedBy: ['strongly-coupled cores plus uncertainty about future topology'],
      source: 'LEDGER.md:76-80',
    },
    'serverless': {
      provides: 'per-invocation scaling including to zero; no instance operations',
      via: 'FaaS-managed ephemeral instances',
      costs: ['cold-start tails on latency-sensitive paths', 'no retained in-memory state',
              'per-invocation pricing crosses over against sustained load', 'execution-duration caps'],
      pressedBy: ['spiky, low-duty-cycle workloads plus a minimal ops budget'],
      source: 'LEDGER.md:82-86',
    },
  },
  substrate: {
    'direct': {
      provides: 'lowest composition latency (no broker hop); immediate visibility of step effects to the caller; single-stack debugging',
      via: 'in-process or synchronous calls; the result rides the return path',
      costs: ['temporal coupling — the callee must be up now, so availability multiplies down the chain',
              'backpressure means the caller blocks',
              'bursts arrive unbuffered at the deepest dependency'],
      pressedBy: ['strict consistency within a unit', 'tight latency', 'no cross-boundary fan-out'],
      source: 'LEDGER.md:90-94',
    },
    'event-based': {
      provides: 'temporal decoupling; burst absorption (the queue is a buffer); fan-out without producer knowledge; a natural trail of published facts',
      via: 'broker plus typed versioned facts plus at-least-once delivery',
      costs: ['propagation lag — a staleness window on every consumer view',
              'idempotent consumers or dedupe, forced by at-least-once', 'ordering only per key',
              'the between-steps state becomes durable, named, and operated'],
      pressedBy: ['cross-boundary facts that tolerate lag', 'burst absorption', 'fan-out'],
      source: 'LEDGER.md:96-100',
    },
    'streaming': {
      provides: 'ordered, replayable, consumer-paced consumption of a continuous high-volume feed; windowed processing; backpressure by position',
      via: 'partitioned log with offsets and retention',
      costs: ['partition-key design is load-bearing (hot partitions)', 'retention storage',
              'consumer-group and rebalancing ops', 'replay discipline'],
      pressedBy: ['the one data class whose volume earns it', 'replay-from-position needs'],
      source: 'LEDGER.md:102-106',
    },
  },
  read_write: {
    'unified': {
      provides: 'read-your-writes for free (one model); zero projection machinery; one schema to evolve',
      via: 'the write model serves reads',
      costs: ['read scaling and read shape coupled to the write model', 'read storms compete with writes'],
      // Containment before separation: the whole read chain lives INSIDE this value.
      // Replicas are the last rung before separation — same-shape read volume, costing
      // replication lag plus primary-pinning for read-your-writes.
      subValues: ['cache', 'coalescing', 'read replicas'],
      source: 'LEDGER.md:110-115',
    },
    'separated': {
      provides: 'independent read scaling on the read path\'s own shape; read-optimized denormalized views; independent latency tuning on that path; read storms isolated from the write side',
      via: 'projections maintained from write-side changes (events or CDC)',
      costs: ['staleness window (projection lag) — read-your-writes needs an explicit mechanism',
              'projection machinery to build, monitor and backfill', 'dual schema evolution'],
      // Three conditions together, not one: own tight SLO + own scale shape + tolerable
      // staleness. "and only that path separates."
      pressedBy: ['read-model divergence on a path', 'the volume to justify a second copy'],
      source: 'LEDGER.md:117-121',
    },
  },
  state: {
    'current-state': {
      provides: 'the read is the state (no derivation); simplest queries and updates; bounded storage',
      via: 'mutable rows or documents',
      costs: ['history gone unless explicitly kept', 'no replay'],
      // "+ Audit log as data" contains audit demands WITHOUT replay — the discriminator
      // that fired in P2, P3 and payroll. Do not let "we need audit" buy an event store.
      subValues: ['audit log as data'],
      source: 'LEDGER.md:125-129',
    },
    'event-sourced': {
      provides: 'full replay — state at any point, and why per rule version; new projections derivable from history at will; immutable record by construction',
      via: 'append-only event log as source of truth plus projections for every read',
      costs: ['every read is a projection', 'event schema versioning forever (upcasters)',
              'storage grows unboundedly', 'unfamiliar-model tax on the team'],
      pressedBy: ['a genuine replay or reconstruction demand on a data class — the regulator\'s "why", not the auditor\'s "what"'],
      source: 'LEDGER.md:131-135',
    },
  },
  persistence: {
    'single shared': {
      provides: 'cross-component transactions for free (strict consistency within the store); one backup, restore and RPO story; one ops surface',
      via: 'one store, one schema domain',
      costs: ['shared write-capacity ceiling', 'schema coupling across components',
              'whole-store blast radius'],
      source: 'LEDGER.md:139-142',
    },
    'distributed shared': {
      provides: 'multi-region strict transactions plus regional survivability — the only value containing strict x multi-region x RPO 0 on one data class',
      via: 'consensus replication, quorum commit',
      costs: ['write-latency floor of cross-region RTT times quorum, which is physics and cannot be tuned away',
              'ops sophistication', 'per-write cost'],
      pressedBy: ['strict consistency', 'multi-region', 'RPO 0 — all three on one data class'],
      unique: true,
      source: 'LEDGER.md:144-147',
    },
    'sharded': {
      provides: 'write scaling past one node along a partition key, same schema',
      via: 'horizontal partitioning',
      costs: ['cross-shard transactions gone or expensive', 'the partition key is load-bearing (hot shards)',
              'resharding ops'],
      pressedBy: ['write volume past a single node\'s ceiling, with a natural partition key'],
      // Cells (F19) are this value at FULL-STACK scope: when volume-sharding compounds
      // with blast-radius isolation, the boundary widens to a complete isolated instance.
      // Same axis value, widening boundary, priced per widening.
      subValues: ['cells'],
      source: 'LEDGER.md:149-157',
    },
    'per-component': {
      provides: 'independent schema evolution; tech fit per component; data-level failure and performance isolation',
      via: 'each component owns its store',
      costs: ['cross-component transactions gone', 'N durability and backup stories',
              'duplication where views overlap'],
      pressedBy: ['diverged persistence forces on one component — shape, volume, regulation, lifecycle — and only that component'],
      source: 'LEDGER.md:159-163',
    },
    'polyglot': {
      provides: 'store shaped to the data — document for nested-variable, relational for rigid-with-joins, log or time-series for append-heavy',
      via: 'multiple store technologies',
      costs: ['multiple ops competencies', 'cross-store consistency is manual', 'wider deployment surface'],
      pressedBy: ['genuinely divergent data shapes within scope'],
      source: 'LEDGER.md:165-169',
    },
  },
};

// What a scope split itself pays, once per boundary, always-on (LEDGER.md:194-204).
// A composition's cost is each part's ledger PLUS this. It is why the scope test must
// find *different* scopes before splitting: a split inside one scope pays all of this
// and contains nothing.
export const BOUNDARY_COST = [
  'a contract — versioned, evolved, owned; every change negotiated across the seam',
  'consistency decay — what crossed transactionally now crosses by protocol',
  'a translation seam — two vocabularies where there was one',
  'an operational seam — correlation across deploys, monitoring and incident timelines',
  'for persistence splits: N durability/backup/RPO stories plus duplicated overlapping views',
];

/** Axis values with no ledger entry. Nothing can be pressed toward these. */
export function unpricedValues() {
  const out = [];
  for (const [axis, spec] of Object.entries(AXES)) {
    if (axis === 'recovery') continue;   // derived from domain shape, not the ledger
    for (const value of spec.values) {
      if (!CONTAINMENT[axis] || !CONTAINMENT[axis][value]) out.push(`${axis}:${value}`);
    }
  }
  return out;
}
