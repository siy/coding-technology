# The Capability/Cost Ledger — v0.2

*v0.2 (2026-07-10): added the demand-shape vocabulary (F7/F15), the containment-rung section with the read chain and hardware rung + ceiling (F12/F13/F18), cells under sharded (F19), scope exclusion in the selection rule (F20), and the boundary-cost entry. Every addition cites the run that forced it. v0.1: 2026-07-05.*

The process's middle space (see `PROCESS-DESIGN.md`, three-spaces model), made explicit. One entry per **atomic axis value**: what it *provides* (always scoped — never a bare -ility), *via* which mechanism (what earns it), at what *costs* (always-on, paid whether exercised or not), and which demands *press toward it*.

**Ledger discipline (anti-drift guardrails):**
- Entries are **mechanism physics** — what a projection costs, what a queue absorbs, what quorum commit cannot avoid. Never axis×axis compatibility rules; interactions surface as contrast inside derivations.
- **"Mixed" and "hybrid" are not values.** They are compositions produced by scope splits (conflict rule): cost = each part's ledger + the boundary between parts (see the boundary-cost entry below).
- **Values apply at demand scope.** Event-source *one data class*, separate *one read path*, extract *one component*. Uniformity is never free; a value applied wider than its demanding scope is unforced cost (= debt, F10).
- No numbers pretending to be universal. Physics floors are named (RTT, quorum), magnitudes are the derivation's job against actual answers.

**Selection rule** (replaces any fake total ordering of values; this is what both dry runs did implicitly). **Cited by name, never by index** — this list has been added to twice, and the book's copy in `axes-and-ledger.md` orders it differently on purpose (chapter order teaches; this order was historical). The names are the contract:

- **Start null.** Begin at the null value (cheapest per axis).
- **Rungs before moves.** Move only when a demand is uncontained (regime insight).
- **Scope exclusion before hardening (F20).** For prune-mode demands, test scope exclusion first: cheapest-containing-move applies to the *demand's scope*, not only the axis value — narrowing where the demand applies competes with any axis hardening. Shopify contains PCI by splitting the card path out so the monolith never sees card data; the demand's scope shrinks, every other axis stays null.
- **Fewest new mechanisms.** Among containing values, pick the one introducing fewest — each mechanism is an ongoing cost (ops, evolution, failure modes), not a one-time price.
- **Narrowest scope.** Apply the chosen value at the narrowest scope that contains the demand.
- **UNKNOWN derives a null position.** An answer nobody supplied presses nothing, is recorded with the position it leaves standing, and is never guessed. (Stated as a rule as of 2026-08-01 — the blind runs had been citing it as "rule 3" against a list that never contained it.)

---

## Demand shapes — the pressure vocabulary (F7, F15)

Demands press the axes in four distinct shapes. Naming the shape is what selects the containing mechanism family; conflating them buys the wrong mechanism (the classic error: sharding a contention problem).

**Volume** — sustained magnitude on a path (requests/s, rows/day).
- Contained by: capacity along the chain — hardware rung, cache, replicas, sharding, streaming for the append-heavy class. Presses an axis only past a ceiling AND on *divergence* (one path orders-of-magnitude unlike the rest); uniform volume presses sizing, not structure.

**Burst** — peak/steady ratio with a tolerable settling delay.
- Contained by: a buffer — the queue is the mechanism (event substrate), absorbing the peak the deepest dependency never sees. If the peak must be served *synchronously* at latency, it is not a burst demand — it is volume at the peak number.

**Contention** — many actors, one record; one seat has one winner.
- **Side-symmetric (F15):** write-side at Shopify flash sales (every checkout hits the same records), read-side at Discord hot channels (concurrent identical reads on one partition). Same containment family both sides: **admission control / fair queueing at the edge (write side), request coalescing (read side), design-out reshaping** — NEVER more sharding; the contended record has one home regardless of shard count.
- Discriminator vs volume: would a second copy help? Volume says yes; contention says no.

**Deadline / window (F7)** — the run must *finish inside a window* (payroll by the 25th), not respond fast.
- Contained by: windowed-throughput capacity (sized to window ÷ work) + **resumable/checkpointed batch** (the FER face: progress survives failures, so the window survives retries). Latency mechanisms are irrelevant to this shape; a deadline answer entering the time budget selects these rows, not #1's.

---

## Containment rungs — axis-invisible mechanisms (F12, F13, F15, F18)

Mechanisms that contain demands *without moving any axis*. The ledger must price them explicitly, or every derivation over-moves — and every real system looks like it has more deployables than its vector claims.

**Thin-tier rule (F18):** a tier that owns **no business logic and no data of record** — load balancers, caches, coalescers, admission gates (Discord's Rust data services: "no business logic, one gRPC endpoint per database query") — is a containment mechanism, not a topology move. It never appears in the vector.

**Hardware rung (F12)** — vertical sizing of the null position.
- Provides: containment of volume and latency pressure with **zero new mechanisms** — the cheapest possible move by the fewest-new-mechanisms rule. SO 2016: RAM holds the entire working set, web tier idles at 5–15% CPU, 50ms budget met at 3,000 req/s peak with no axis moved; their cost stance is the selection rule as a company value ("hardware is cheaper than developers and efficient code").
- Costs: the box's price curve — and its **ceiling**: the rung stops when the working set or write rate outgrows one box's *economics* (not one box's spec sheet — the crossover is priced, and past it every further dollar buys less than the mechanism it was avoiding).
- Position: rung zero of every chain; always price it before any axis move.

**The read-containment chain (F13, F15):** read pressure climbs **cache → coalescing → replicas → projections**, each rung containing a *distinct* pressure shape, separation being the axis move only at the top:
- **Cache** — repeated reads of hot values (volume of *repeats*). Costs: invalidation discipline, staleness window per entry. (SO's pervasive cache tiers; Discord's Read States LRU.)
- **Coalescing** — concurrent *identical in-flight* reads (contention shape): dedupe by key, bound concurrency. (Discord, routed by channel ID.)
- **Replicas** — *same-shape* read volume past one node. Costs: replication lag + primary-pinning for RYW. (SO's replica graded HA-only — reads stayed on the primary; the rung exists even when a system buys it for availability instead.)
- **Projections (= separated read model)** — only when the read path's *shape itself* diverges (own SLO + own model + tolerable staleness). This is the axis move; everything below it is not.
- Three industrial stops, each cited: SO stopped at cache (+HA replica), Discord at coalescing+cache, ticketing P3 alone climbed to projections (pricing read path) — the chain explains why "CQRS by default" over-moves by three rungs.

---

## Axis 1 — Deployment topology (null: single deployable)

**Single deployable**
- Provides: in-process calls on all internal paths (no network latency/partial failure inside); one release pipeline, one ops surface, one on-call; trivially uniform technical cross-cutting.
- Via: one artifact, one process (or N identical instances).
- Costs: whole-system blast radius (any defect can reach every path); scaling is whole-unit (sized to the hottest path); one release cadence for all code.
- Pressed toward by: bounded ops capacity (#9), no divergent scale shapes (#11), uniform cadence acceptable (#8).
- **Modulith** (sub-value): + internal subdomain module boundaries → provides *ownership* at zero deployment cost. Contains the ownership half of "team independence" (F2); does NOT provide release independence.

**Multiple deployables (services)**
- Provides: independent release cadence per unit (#8, the genuinely-demanded kind); independent scaling per unit's shape (#11 divergence); blast-radius isolation between failure domains (#3 per-path).
- Via: separate processes, network boundaries, separate pipelines, versioned contracts.
- Costs: network on every cross-unit path — latency floor + partial failure become *internal* concerns; N× ops surface (pipelines, on-call, contract evolution); cross-unit consistency drops from transactional to protocol-based (#4 across units decays to eventual unless paid for elsewhere).
- Pressed toward by: divergent scale shape on a path, demanded release independence, demanded blast-radius isolation. NOT by team ownership alone (modules contain that).

**Unified runtime**
- Provides: one-or-many packaging decided at deploy time, without wire rewrite (keeps the one-vs-many decision *deferrable*); transport-transparent calls between slices; uniform resource/aspect supply.
- Via: runtime hosts components as slices over a wire abstraction.
- Costs: the runtime is itself a platform dependency (operational competence, Phase-6 bundling — the module's honest wrinkle); young product class.
- Pressed toward by: strongly-coupled cores + uncertainty about future topology (#9 ops cost now, #11 unknown later).

**Serverless**
- Provides: per-invocation scaling including to zero; no instance operations.
- Via: FaaS-managed ephemeral instances.
- Costs: cold-start tails (#1 tension on latency-sensitive paths); no retained in-memory state; per-invocation pricing crosses over against sustained load (#9); execution-duration caps.
- Pressed toward by: spiky, low-duty-cycle workloads + minimal ops budget.

## Axis 2 — Composition substrate (null: direct)

**Direct**
- Provides: lowest composition latency (no broker hop); immediate visibility of step effects to the caller (strict intra-chain consistency); single-stack debugging.
- Via: in-process or synchronous calls; result rides the return path.
- Costs: temporal coupling — callee must be up *now*, so availability multiplies down the chain; backpressure = caller blocks; bursts arrive unbuffered at the deepest dependency.
- Pressed toward by: strict consistency within a unit (#4), tight latency (#1), no cross-boundary fan-out.

**Event-based**
- Provides: temporal decoupling (producer proceeds while consumer is down — availability isolation across the boundary); burst absorption (the queue is a buffer, #2 peak vs steady); fan-out without producer knowledge; a natural trail of published facts.
- Via: broker + typed versioned facts + at-least-once delivery (the honest default).
- Costs: propagation lag — a staleness window on every consumer view (#4 across drops to eventual); idempotent consumers or dedupe (at-least-once forces it); ordering only per key; cross-hop debugging needs correlation; **the between-steps state becomes durable, named, and operated** (the module's own price statement).
- Pressed toward by: cross-boundary facts that tolerate lag, burst absorption, fan-out.

**Streaming**
- Provides: ordered, replayable, consumer-paced consumption of a continuous high-volume feed; windowed processing; backpressure by position.
- Via: partitioned log with offsets and retention.
- Costs: partition-key design is load-bearing (hot partitions); retention storage; consumer-group/rebalancing ops; replay discipline.
- Pressed toward by: the one data class whose volume earns it (#11 event-heavy divergence); replay-from-position needs.

## Axis 3 — Read/write model (null: unified)

**Unified**
- Provides: read-your-writes for free (one model); zero projection machinery; one schema to evolve.
- Via: the write model serves reads.
- Costs: read scaling and read shape coupled to the write model; read storms compete with writes.
- **Containment before separation:** the full read chain (cache → coalescing → replicas — see Containment rungs above) lives INSIDE this value; separation is priced only when the chain is exhausted or the read *shape* diverges.
- **Read replicas** (last rung *before* separation): provides read-volume scaling of *same-shape* reads; costs replication lag (bounded staleness) + primary-pinning for RYW. Cheaper than separation whenever the read shape is unchanged — the P2 lesson, now a ledger fact.

**Separated**
- Provides: independent read scaling on the read path's own shape; read-optimized denormalized views; independent latency tuning (#1 on that path); read storms isolated from the write side (blast radius).
- Via: projections maintained from write-side changes (events or CDC).
- Costs: staleness window (projection lag) — RYW needs an explicit mechanism; projection machinery to build, monitor, and backfill; dual schema evolution.
- Pressed toward by: a read path with its own tight SLO + own scale shape + tolerable staleness (#1 + #11 divergence, #4 permitting) — and only that path separates.

## Axis 4 — State storage (null: current-state)

**Current-state**
- Provides: the read *is* the state (no derivation); simplest queries and updates; bounded storage.
- Via: mutable rows/documents.
- Costs: history gone unless explicitly kept; no replay.
- **+ Audit log as data** (sub-mechanism): provides WHO/WHAT/WHEN answers for audit and dispute, written in the same transaction; costs dual-write discipline. **Contains audit demands without replay** — the discriminator that fired in P2, P3, and payroll (#6 audit-only). Do not let it slide into event-sourcing; do not let "we need audit" buy an event store.

**Event-sourced**
- Provides: full replay — state at any point, *why* per rule version; new projections derivable from history at will; immutable record by construction.
- Via: append-only event log as source of truth + projections for every read.
- Costs: every read is a projection (build, maintain, rebuild); event schema versioning *forever* (upcasters); storage grows unboundedly (snapshots as mitigation); unfamiliar-model tax on the team.
- Pressed toward by: **genuine replay/reconstruction demand on a data class** (#6 replay — the regulator's "why", not the auditor's "what") — and only that class event-sources.

## Axis 5 — Persistence configuration (null: single shared)

**Single shared**
- Provides: cross-component transactions for free (strict #4 within the store); one backup/restore and RPO story (#5); one ops surface.
- Via: one store, one schema domain.
- Costs: shared write-capacity ceiling; schema coupling across components (coordinated change); whole-store blast radius.

**Distributed shared**
- Provides: **multi-region strict transactions + regional survivability — the only value containing strict (#4) × multi-region (#10) × RPO 0 (#5) on one data class** (the P3 booking prune).
- Via: consensus replication, quorum commit.
- Costs: write-latency floor = cross-region RTT × quorum (physics; cannot be tuned away); ops sophistication; per-write cost.

**Sharded shared**
- Provides: write scaling past one node along a partition key, same schema.
- Via: horizontal partitioning.
- Costs: cross-shard transactions gone or expensive; partition key is load-bearing (hot shards — the per-event key in ticketing); resharding ops.
- Pressed toward by: write volume past a single node's ceiling *with* a natural partition key (#2/#11).
- **Cells (F19)** — the sharded value at *full-stack scope*. When volume-sharding compounds with blast-radius isolation (one tenant's burst must not reach another), a store-only shard leaves shared caches, queues, and workers as cross-tenant failure paths — the shard boundary widens to a **complete, isolated instance of the system** (Shopify pods: "a fully isolated instance… its own datastores — MySQL, Redis, memcached"; nothing acts across pods).
  - Provides: tenant-scoped blast radius + per-cell capacity + cell-at-a-time rollout.
  - Costs: full stack duplicated per cell; cell provisioning/balancing/mobility as a standing ops discipline; cross-cell features structurally banned or expensive (the no-cross-pod rule is the value working, not a limitation to fix).
  - The escalation is scope, not mechanism: store-only shard → store+cache+queue → cell. Same axis value, widening boundary, priced per widening.

**Per-component**
- Provides: independent schema evolution; tech fit per component; data-level failure/perf isolation.
- Via: each component owns its store.
- Costs: cross-component transactions gone (consistency across becomes protocol, #4 decays to eventual); N durability/backup stories (#5 each); duplication where views overlap.
- Pressed toward by: **diverged persistence forces** on one component — shape, volume, regulation, lifecycle (payroll's time-import) — and only that component.

**Polyglot**
- Provides: store shaped to the data (document for nested-variable, relational for rigid-with-joins, log/time-series for append-heavy).
- Via: multiple store technologies.
- Costs: multiple ops competencies; cross-store consistency manual; wider Phase-6 surface.
- Pressed toward by: genuinely divergent data shapes within scope (P3 event management).

## Axis 6 — Recovery class (no null — forced per effectful operation; rows keyed to domain-shape facts, F4)

**BER (backward: compensate by inverse)**
- Provides: return to a consistent prior state after partial failure; correctness restored by undo.
- Via: a defined inverse per step (release, void, reversing entry); the saga = BER across autonomous steps.
- Costs: the inverse must exist and stay in-domain — otherwise compensation is designed per case and is itself a use case with its own SLOs (F9, payroll's off-cycle correction); compensation paths are code to test; residuals remain (the module's refunded-money-but-not-spent-hour); coordination cost across autonomy.
- Selected when: the effect has a defined inverse and restored consistency is the requirement (money).

**FER (forward: continue degraded)**
- Provides: forward progress under degraded state; liveness over immediate consistency.
- Via: defaults, queue-for-later, decay states (*fresh → stale → expired*, time-as-decay).
- Costs: degraded windows must be bounded and visible; convergence must be designed; consumers must tolerate staleness explicitly.
- Selected when: staying running beats halting and the state tolerates lag or decay (holds, accruals).
- **+ Resumable/checkpointed batch** (F7 mechanism): contains deadline-shaped availability — the run finishes inside its window despite failures because progress survives them. The batch-workload face of FER.

**Design-out (reshape so the failure cannot arise)**
- Provides: the failure class is structurally impossible — no recovery path to write, test, or operate. Cheapest at runtime.
- Via: idempotency, commutativity, append-only + supersede, structural constraints (the range-exclusion seat).
- Costs: paid once in the model's shape, and real — hold expiry to manage, convergence windows to bound (the module's own caveat); not every domain reshapes.
- Selected when: the operation can be made idempotent/commutative/immutable at acceptable model cost (counters, logs, reservations).

---

## The boundary cost — what a scope split itself pays

When the conflict rule splits a system at the boundary between pressures (different scopes → the axis doesn't compromise, the system splits and derivation recurses per part), the split is not free. A composition's cost = each part's ledger **+ this entry**, paid once per boundary, always-on:

- **A contract** — versioned, evolved, owned; every change is now negotiated across the seam.
- **Consistency decay** — whatever crossed the boundary transactionally now crosses by protocol (#4 across drops to eventual unless re-bought at distributed-store prices).
- **A translation seam** — two vocabularies where there was one; mapping code that answers to both sides' change drivers.
- **An operational seam** — correlation across deploys, monitoring, and incident timelines; failure modes that live *in* the boundary (half-applied interactions → the recovery axis fires per crossing operation).
- **For persistence splits additionally:** N durability/backup/RPO stories (#5 each) + duplicated views where read scopes overlap.

This entry is why the scope test must find *different* scopes before splitting: a split inside one scope pays all of the above and contains nothing — the conflict just moved into the boundary. (P2's modulith is this entry read in reverse: same scope → decompose demands, don't split the system.)

---

## Consistency check against the runs

Every informal "cheapest containing value" step now has an explicit entry behind it: replicas-before-separation (P2), audit-log-before-event-sourcing (P2/P3/payroll), distributed-shared as the unique container of strict×multi-region×RPO-0 (P3), per-component for diverged forces (payroll time-import), streaming for the volume-earning class (payroll), modules-contain-ownership (P2/payroll, F2), unforced-value-=-debt (merge-back, F10). No dry-run decision required a ledger fact not stated above.

**v0.2 additions, each citing its forcing run:** hardware rung + ceiling (SO), read chain cache→coalescing→replicas→projections with three cited industrial stops (SO/Discord/P3), thin-tier axis-invisibility (Discord), cells (Shopify), scope exclusion in the selection rule (Shopify card path), demand shapes incl. deadline/window (payroll) and side-symmetric contention (Shopify write-side / Discord read-side), boundary cost (the scope test's price, implicit in P2/P3 all along).

**Open for v0.3 (if forced by future derivations):** ~~boring-enterprise run may move or retire the read/write-model axis~~ **RESOLVED 2026-07-11: the Companies House blind run moved the axis (Q5 read ratio × Q6 redaction shape) and graded HIT — the axis stays; the fold is dead** (PROCESS-DESIGN, 4th blind derivation). New v0.3 candidates from that run: the axis-5 intermediate shape stated as a composition (per-component at service scope over a shared legacy backbone — F26), and F22's requester's-clock/system's-clock triage note in the demand-shapes section; multi-X (#9) interaction entries if a derivation ever cites one.
