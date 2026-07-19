# Appendix B: Reference Cards

*One card per instrument. Definitions live in Part I; these are for the desk.*

## Card 1 — The nine questions

1. **Time budget** — per operation: percentiles, tails, soft maxima, windows. *Hard max as correctness = out of scope (hard real-time).*
2. **Failure budget** — per operation: error budget + criticality. 99.5% ≈ 44 h/yr · 99.9% ≈ 8.8 h/yr · 99.99% ≈ 53 min/yr.
3. **Loss budget** — per data class: RPO, retention, never-lose set.
4. **Consistency contract** — per data class/path: strict / bounded (named bound) / eventual; read-your-writes where?
5. **Load** — magnitude (steady/peak), shape **per path**, concentration, window.
6. **External constraints** — audit (*who/what/when*) vs replay (*state under past rules*); residency pins; mandates that strike values.
7. **Release structure** — cadence **divergence**; deploy safety. The count presses nothing; divergence presses everything.
8. **Cost & capacity envelope** — money + *who operates*.
9. **Multi-X** — countries/currencies/tenants/regions/versions: partition gifts + legal pins.

**Second row source:** domain-shape facts per effectful operation — inverse exists? value decays? reshapeable (idempotent / commutative / append-only)? · change-driver facts per rule set / data class — how often does the governing logic change, under whose control? (PFD's change-driver analysis feeds here; presses in combination, rarely alone.)

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
1. **Normalize** — run the entry gate.
2. **Prune** — correctness answers strike values (binary).
3. **Press** — per demand: contained → *inert* (a result); uncontained → record (axis, direction, scope, mechanism). **Check combinations, not just rows.**
4. **Resolve** — cheapest containing value · fewest new mechanisms · narrowest scope · rungs before moves · scope exclusion before hardening. Recovery per effectful operation from domain shape (check design-out first).
5. **Verify** — the exit gate (Card 6).

**Conflict rule:** opposing pressures on one axis → *different scopes*: split at the boundary (pay: contract, consistency decay, translation seam, ops seam) · *same scope*: decompose further · *still opposed*: **contradiction** → renegotiation menu with prices (bend the softest demand first; every branch re-enters the derivation).

**Refusals:** targets, recovery ties, contradiction choices, product picks.

## Card 6 — Verification

**Consistency lens**, per operation: **guarantee + mechanism + failure behavior**. Guarantee without mechanism = wrong vector or fake answer. One-bit labels banned in the system's own docs.

**Budget arithmetic:**
1. Latency decomposes down the critical path — sequential adds, parallel costs its max, hops pay floors. Target ÷ floor → 1 = pressing; floors > target = wrong vector.
2. Tails compose through the distribution — slow-fractions add in series (5 steps at P99 each ⇒ ~5% chain-slow); fan-out harvests the tail (100-way at per-shard P99 ⇒ ~63% of requests see one).
3. Envelopes compose upward **by correlation** — steady adds; peaks add only when correlated; the calendar is capacity input.
4. Availability multiplies in series (five 99.99% parts ≈ 99.95%); parallel arithmetic requires **earned independence** (no shared deploys/certs/regions/config).
5. Mechanism bill fits the operating envelope — count the vector's standing mechanisms (stores, brokers, projection pipelines, cell disciplines); price the count in Q8's two currencies (money + operating attention). A comparison rather than a formula: a platform-team vector against a four-engineers sheet fails before anything is built.

Pre-build: load models (with correlation), capacity vs rung ceilings, failure injection per lens row.

## Card 7 — The living system

**Audit** — for every held position: *name the answer that forces it.* Silence = debt, by construction. Unchanged answers must derive "no change."

**Increment** — a changed answer implicates exactly the axes its rows press; re-derive those; the rest is untouched by construction. Merges are outputs too.

**Path** — deltas don't commute. Constraints per intermediate: operable · affordable · calendar-feasible (dual state must not span a freeze wall). Weigh by six indicators (reversibility, intermediate feasibility, coupling, dual-state duration, dependency, failure amplification) — reject by *named indicator*, never by weighted sum. Reversible deltas early; one-way doors late. Scaffolds are allowed when priced with their own demolition.

**Trail** — per axis move: position · forcing answers · mechanism · costs accepted · **revisit when**.
