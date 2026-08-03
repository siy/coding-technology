# Appendix B: Reference Cards

*One card per instrument. Definitions live in Part I; these are for the desk.*

## Card 1 — The nine questions

1. **Time budget** — per operation: percentiles, tails, soft maxima, windows. *Hard max as correctness = out of scope (hard real-time).*
2. **Failure budget** — error budget **per service or path**; criticality **per operation**. The two answer at *different scopes*, and one answer covering both is bundled: decompose it. 99.5% ≈ 44 h/yr · 99.9% ≈ 8.8 h/yr · 99.99% ≈ 53 min/yr.
3. **Loss budget** — per data class: RPO, retention, never-lose set.
4. **Consistency contract** — per data class/path: strict / bounded (named bound) / eventual; read-your-writes where?
5. **Load** — magnitude (steady/peak), shape **per path**, concentration, window.
6. **External constraints** — audit (*who/what/when*) vs replay (*state under past rules*); residency pins; mandates that strike values.
7. **Release structure** — cadence **divergence**; deploy safety. The count presses nothing; divergence presses everything.
8. **Cost & capacity envelope** — money + *who operates*.
9. **Multi-X** — countries/currencies/tenants/regions/versions: partition gifts + legal pins.

**Second row source:** domain-shape facts per effectful operation — inverse exists? value decays? reshapeable (idempotent / commutative / append-only)? · **read-model divergence** per path — does this read want a *different shape* from the write model, or only more of the same? (Volume climbs the rungs; divergence is the only thing that reaches the top one. Distinct from Card 3's demand shapes.) · change-driver facts per rule set / data class — how often does the governing logic change, under whose control? (PFD's change-driver analysis feeds here; presses in combination, rarely alone.)

**Entry gate:** priced (a nine has a price; "what changes in the 53rd minute?") · scoped (per operation / data class / path) · decomposed ("team independence" → ownership ≠ release independence; "audit" ≠ replay) · triaged (requester's clock vs system's clock; observed failure ≠ stated target) · contradictions surfaced early.

## Card 2 — The six axes

| Axis | Values (null first) |
|---|---|
| Deployment topology | **single deployable** (± modules; ± role-selective activation) / multiple / unified runtime / serverless |
| Composition substrate | **direct** / event-based / streaming |
| Read/write model | **unified** (+ chain rungs) / separated |
| State storage | **current-state** (+ audit log) / event-sourced |
| Persistence | **single shared** / distributed shared / sharded (→ cells) / per-component / polyglot |
| Recovery *(no null)* | design-out / compensate (BER) / degrade-and-continue (FER) |

Values apply **at demand scope**. Hybrids are compositions: parts + boundary cost. Deployment prices two countables: release coupling + delivery plumbing (pipelines, the version matrix) bill to the *artifact*; scaling shape and runtime blast bill to the *unit*. Unique container: strict × multi-region × zero-loss on one data class → **distributed shared** only.

Per-value pricing is Card 2b.

## Card 2b — The ledger: provides / via / costs

*The entries the selection rule consumes. Numbered 2b rather than 3 so the cards this book already cites by number keep their numbers.*

**Axis 1 — Deployment topology**

| Value | Provides | Via | Costs |
|---|---|---|---|
| **single deployable** *(null)* | in-process calls on all internal paths; one release, one ops surface; the composition you test is the one that runs | one artifact, one process (or N identical instances) | whole-system blast radius; whole-unit scaling; one build-and-test train for every merge |
| *modular form* | ownership boundaries at zero deployment cost | modules inside the one artifact | none beyond discipline — this is what dissolves most "we need services" pressure |
| *role-selective form* | per-role scaling envelopes; inter-pool blast isolation, no second artifact | same artifact, handlers enabled per instance group | the activation machinery becomes a mechanism: role config, per-role capacity, knowing which instance runs what |
| **multiple deployables** | independent release cadence per unit; independent toolchains; blast isolation that holds at deploy time | separate processes, network boundaries, separate pipelines, versioned contracts | network on every crossing (latency floor, partial failure, consistency decaying to protocol); N× delivery plumbing; a version matrix, because independent cadences mean production runs a mixture |
| **unified runtime** | one-or-many packaging decided at deploy time, no rewire | runtime hosts components as slices over a wire abstraction | a platform dependency, with its own operational competence |
| **serverless** | per-invocation scaling, including to zero; no instance operations | FaaS-managed ephemeral instances | cold-start tails; no retained in-memory state; per-invocation pricing crosses over against sustained load |

**Axis 2 — Composition substrate**

| Value | Provides | Via | Costs |
|---|---|---|---|
| **direct** *(null)* | lowest composition latency; immediate visibility of effects to the caller | in-process or synchronous calls | temporal coupling — callee must be up *now*, availability multiplies down the chain, bursts arrive unbuffered at the deepest dependency |
| **event-based** | temporal decoupling; burst absorption; fan-out | broker + typed versioned facts + at-least-once delivery | propagation lag on every consumer view; idempotent consumers forced; ordering only per key; between-steps state becomes durable, named and *operated* |
| **streaming** | ordered, replayable, consumer-paced consumption for the one class whose volume earns a log | partitioned log with offsets and retention | partition-key design load-bearing; retention storage; rebalance operations |

**Axis 3 — Read/write model**

| Value | Provides | Via | Costs |
|---|---|---|---|
| **unified** *(null)* | read-your-writes for free; zero projection machinery; one schema to evolve | the write model serves reads | read scaling and read model coupled to the write model; read storms compete with writes |
| **separated** | independent read scaling on the read path's own model | projections maintained from write-side changes | a staleness window; machinery to build and backfill; dual schema evolution. Earned by **read-model divergence plus the volume to justify a second copy**; the staleness is the price, and a scope contracted strict cannot pay it |

**Axis 4 — State storage**

| Value | Provides | Via | Costs |
|---|---|---|---|
| **current-state** *(null)* | the read *is* the state; simplest queries; bounded storage | mutable rows/documents | history gone unless explicitly kept; no replay |
| *+ audit log* | every *who-what-when* question | log written in the same transaction | one more table, and the discipline of writing it |
| **event-sourced** | genuine replay — state at any past moment, *why* under that moment's rules | append-only log as source of truth + projections | every read a projection; event schemas versioned for life; unbounded growth; a model the team must learn. Runs head-on into statutory erasure |

**Axis 5 — Persistence**

| Value | Provides | Via | Costs |
|---|---|---|---|
| **single shared** *(null)* | cross-component transactions free; one backup/restore and RPO story; one ops surface | one store, one schema domain | shared write ceiling; schema coupling across components; whole-store blast radius |
| **distributed shared** | **the only value providing strict transactions across regions with zero loss on regional failure** | consensus replication, quorum commit | write floor = cross-region RTT × quorum — physics, not tuning; ops sophistication; per-write cost |
| **sharded** | write scaling past one node, same schema | horizontal partitioning on a natural key | cross-shard transactions gone or expensive; the key is load-bearing; resharding ops |
| *→ cells* | blast-radius isolation per tenant group, when volume sharding compounds with isolation | a complete isolated stack per shard | the whole stack duplicated per cell; cross-cell features structurally forbidden — and the prohibition is the value working |
| **per-component** | independent schema evolution; tech fit; data-level isolation | each component owns its store | cross-component transactions gone; N durability stories; duplication |
| **polyglot** | store shaped to the data | multiple store technologies | one ops competency per technology; cross-store consistency manual |

**Axis 6 — Recovery** *(no null; every effectful operation answers)*

| Value | Provides | Via | Costs |
|---|---|---|---|
| **design-out** | the failure class stops existing — no recovery path to write, test or operate. **Check first** | idempotency, commutativity, append-only + supersede, structural constraints | paid once in the model's shape, and real: hold expiry, convergence windows. Not every domain offers it |
| **compensate (BER)** | a consistent prior state restored after partial failure | a defined inverse per step (release, void, reversing entry) | the inverse must exist and stay in-domain; where it must be *built* it is a use case of its own, with its own targets |
| **degrade-and-continue (FER)** | forward progress where staleness or decay is tolerable | defaults, queue-for-later, decay states (*fresh → stale → expired*) | degraded windows must be bounded and visible; convergence designed; consumers must tolerate staleness explicitly |

**Containment rungs** *(axis-invisible — never in the vector)*

| Rung | Provides | Costs |
|---|---|---|
| **hardware** | volume and latency containment with **zero new mechanisms** — the first bid on every containment | the box's price curve, and a *economic* ceiling: it ends where the working set or write rate outgrows what one box buys. Priced on *your* substrate — gentle on owned metal, stepped and earlier-capped on cloud |
| **cache** | repeated reads of hot values | invalidation, and a staleness window |
| **coalescing** | concurrent *identical in-flight* reads collapsed to one query | applies only to identical concurrent reads |
| **replicas** | same-model read volume past one node | replication lag; read-your-writes needs an explicit mechanism |
| **projections** | reads whose *model* diverges from the write model | **this rung is the axis move** — it is Axis 3 separated, priced above |

**The boundary cost.** Every composition contains a boundary, priced like any mechanism: a contract versioned and negotiated evermore; consistency across the seam decaying from transaction to protocol; a translation layer answering to both sides' changes; an operational seam where deploys, monitoring and incidents must be correlated; and for persistence splits, one durability story per store.

## Card 3 — Demand shapes

**Would a second copy help?**

- **Volume** (yes) → sizing, cache, replicas, sharding.
- **Contention** (no — one record, one winner) → admission control (write side), coalescing (read side), design-out. Never sharding.
- **Burst** (peak + tolerable settling delay) → buffer/queue. Synchronous peak = volume at the peak number.
- **Deadline** (finish inside window) → windowed throughput + resumable batch. Latency mechanisms irrelevant.

Time-answer triage: **requester's clock** (statutory window — inert) vs **system's clock** (response target — presses).

## Card 4 — Containment rungs

```
hardware sizing → cache → coalescing → replicas → projections
                                                    ↑ the axis move
```

Thin tiers (LB, cache, coalescer, admission gate) own no business logic and no data of record → never in the vector. Hardware rung's ceiling is *economic*: it ends where the working set or write rate outgrows one box's price curve.

## Card 5 — The procedure (`next_step`)

0. **Null vector**: single deployable / direct / unified / current-state / single shared. (Living system: start from its actual vector.)
1. **Normalize** — run the entry gate, and put the sheet in **normal form: one row per unit**. Three axes move on divergence *between* units (release cadence, read model, regulation-and-volume), so a row answering for "the services" collectively cannot express the thing that presses. Divergence is only computable once the units are rows.
2. **Prune** — correctness answers strike values (binary).
3. **Press** — per demand, one of **three** outcomes: contained → *inert* (a result) · contained **by a named mechanism** → a **mechanism note** (nothing on the vector moves; the mechanism is recorded and owned) · uncontained → record (axis, direction, scope, mechanism). **Check combinations, not just rows.**
4. **Resolve** — the cheapest containing value, by these rules in order: *rungs before moves* · *scope exclusion before hardening* · *fewest new mechanisms* · *narrowest scope*. Recovery per effectful operation from domain shape (check design-out first).
5. **Verify** — the exit gate (Card 6).

**Cite rules by name, never by number.** This list and Chapter 3's have each been added to; an index is a citation that expires.

**UNKNOWN derives a null position** — an answer nobody supplied presses nothing, is recorded with the position it leaves standing, and is never guessed.

**Conflict rule:** opposing pressures on one axis → *different scopes*: split at the boundary (pay: contract, consistency decay, translation seam, ops seam) · *same scope*: decompose further · *still opposed*: **contradiction** → renegotiation menu with prices (bend the softest demand first; every branch re-enters the derivation).

**Refusals:** targets, recovery ties, contradiction choices, product picks.

## Card 6 — Verification

**Consistency lens**, per operation: **guarantee + mechanism + failure behavior**. Guarantee without mechanism = wrong vector or fake answer. One-bit labels banned in the system's own docs.

**Budget arithmetic** — cite these by name, not by number:

1. **Latency decomposition.** Latency decomposes down the critical path — sequential adds, parallel costs its max, hops pay floors. Target ÷ floor → 1 = pressing; floors > target = wrong vector.
2. **Tail composition.** Tails compose through the distribution — slow-fractions add in series (5 steps at P99 each ⇒ ~5% chain-slow); fan-out harvests the tail (100-way at per-shard P99 ⇒ ~63% of requests see one).
3. **Envelope composition.** Envelopes compose upward **by correlation** — steady adds; peaks add only when correlated; the calendar is capacity input.
4. **Availability multiplication.** Availability multiplies in series (five 99.99% parts ≈ 99.95%); parallel arithmetic requires **earned independence** (no shared deploys/certs/regions/config).
5. **Mechanism bill.** The bill fits the operating envelope — count the vector's standing mechanisms (stores, brokers, projection pipelines, cell disciplines); price the count in Q8's two currencies (money + operating attention). A comparison rather than a formula: a platform-team vector against a four-engineers sheet fails before anything is built.

Pre-build: load models (with correlation), capacity vs rung ceilings, failure injection per lens row.

## Card 7 — The living system

**Audit** — for every held position: *name the answer that forces it.* Silence = debt, by construction. Unchanged answers must derive "no change."

**Increment** — a changed answer implicates exactly the axes its rows press; re-derive those; the rest is untouched by construction. Merges are outputs too.

**Path** — deltas don't commute. Constraints per intermediate: operable · affordable · calendar-feasible (dual state must not span a freeze wall). Weigh by six indicators (reversibility, intermediate feasibility, coupling, dual-state duration, dependency, failure amplification) — reject by *named indicator*, never by weighted sum. Reversible deltas early; one-way doors late. Scaffolds are allowed when priced with their own demolition.

**Trail** — per axis move: position · forcing answers · mechanism · costs accepted · **revisit when**.
