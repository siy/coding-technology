# Dry Run — the process v0.1 against the three ticketing profiles

**Purpose:** BOOK-SCOPE open question 6. Test whether process candidates 1+2+3 (+ gates 4/5) with the three-spaces semantics mechanically reproduce the module's three published vectors. A step that needs hand-waving = underspecification found.

**Result up front: all three vectors reproduced. Two refinements were forced (F1, F2 below) — the conflict rule as originally stated does NOT reproduce profile two without a scope test, and pressures must be decomposed before matching. Core bet survives.**

---

## The mechanics under test — `next_step(V₀, answers)` v0.1

0. **Null vector** (needed by the regime insight; new definition, see F5): the cheapest position per axis — *single deployable / direct / unified / current-state / single shared store / (recovery: no null — forced per effectful operation by domain shape)*. Greenfield: V₀ = null vector.
1. **Normalize** (entry gate, extended — F2): each answer priced AND decomposed to mechanism-level demands, each with its scope attached (per use case / per data class / per domain / per path).
2. **Prune** (correctness drivers: consistency, RPO, compliance, sovereignty): strike axis values whose capability ledger cannot provide the demand. Binary.
3. **Press**: for each demand, check containment in V's capability envelope. Contained → inert (record nothing). Not contained → record pressure: (axis, direction, demanding scope, mechanism that would contain it).
4. **Resolve** per pressed axis:
   - One direction → move to the **cheapest value whose ledger contains all demands** on that axis.
   - Opposing directions → **scope test (F1)**: pressures from *different* scopes (different paths/subsystems) → split the system at the scope boundary, recurse per part (the telescope). Pressures from the *same* scope → decompose the demands further (return to step 1 for them); if still opposed after decomposition → genuine contradiction (module failure mode: inputs contradict; stop, surface).
5. **Recovery axis**: per effectful operation, from domain-shape facts (inverse exists? degraded progress beats halting? reshapeable to idempotent/append-only? coordination cost?) → BER / FER / design-out. Mixed is normal.
6. **Verify** (consistency-lens): per operation, guarantee under V + mechanism earning it + failure behavior. Guarantee without mechanism ⇒ vector wrong or an answer was fake.

---

## Profile one: the independent venue

Answers (module §Profile one): buy ≈2s P95; availability check <1s; service 99.5%; booking strict, RPO 0; quote/availability reads eventual; no multi-X; daily deploys; tight cost ceiling; read-moderate; one team, one region.

| Demand (scoped) | Mode | Against null vector | Outcome |
|---|---|---|---|
| buy 2s P95 (use case) | select | contained (direct calls + single store at tens/sec) | inert |
| check <1s (use case) | select | contained | inert |
| 99.5% (domain) | isolate | contained (single node + restart budget: hours/year) | inert |
| booking strict + RPO 0 (data class) | prune | single shared store provides strict tx + durable commit | strikes nothing |
| reads eventual (data class) | — | weaker than what V provides | inert |
| cost ceiling (domain) | bound | reinforces null | inert |
| one team (domain) | bound | no ownership pressure | inert |
| read-moderate (domain) | split | no divergence | inert |

Zero pressures → **V = null vector**. Recovery: booking moves money, inverses defined and in-domain (release hold, void auth) → **BER**.

**Derived:** *single deployable / direct / unified / current-state / single shared / BER* — **exact match.** The regime insight validated: every driver inert, minimal vector survives, and the "didn't copy the big platform" lesson is the mechanics working, not discipline.

## Profile two: the regional platform

Answers: several teams/venues, one region, multi-currency/country; availability check 500ms P95; buy ≈2s; sales feed async; booking strict RPO 0; quotes bounded staleness; own-availability-view read-your-writes; 99.9%; weekly blue-green; PCI; read-heavy + event-heavy.

| Demand (scoped) | Mode | Against V | Outcome |
|---|---|---|---|
| team independence (domain) | bound | **not primitive — decompose (F2):** (a) ownership boundaries → demands module split; (b) release independence → weekly blue-green already contained by one deployable: NOT demanded | presses deployment toward *internal* split only |
| cost/ops complexity (domain) | bound | opposes many deployables | opposing pressure, **same scope** |
| → resolve deployment | | scope test: same scope → decomposition resolves it: modules without deployment split | **modulith** ✓ |
| check 500ms P95 + read-heavy (path) | select | not contained by primary-only serving | press read serving; ledger: read replicas (cheap; bounded staleness allowed) vs separated read model (projection machinery, buys nothing extra here) → **replicas**; read/write model stays **unified** ✓ |
| own-view read-your-writes (data class) | prune | replicas alone don't provide RYW | mechanism note: session-pinned/primary reads for own writes — contained, no axis move |
| sales feed + cross-module facts, lag-tolerant (paths) | select | direct-everywhere pays latency/coupling across modules | substrate across modules → event-based; strict within → direct: **mixed** ✓ |
| PCI + dispute pressure (domain) | prune | **decompose:** audit → yes; replay → NO | cheapest provider of audit alone = **audit log as data**; storage stays **current-state** ✓ (the module's trap lesson falls out of ledger comparison — F3) |
| multi-currency/country (domain) | pin | data partitioning, no residency demand stated | no axis move |
| booking strict + RPO 0 | prune | single shared store still provides | no strike |

Recovery: booking BER (as before); reservation/counters reshapeable (idempotent hold, converging counter) → **design-out** for that part.

**Derived:** *modulith / mixed / unified / current-state + audit log / single shared + replicas / BER + design-out* — **match.**

## Profile three: the enterprise multi-tenant platform

Answers: quote/availability P99 200ms contractual; on-sale bursts (10⁵+ attempts/min vs a handful of seats); price history auditable **and replayable**; booking strict RPO 0; availability reads bounded staleness with named bound; 99.99% customer-facing read path; multi-region + sovereignty; PCI + consumer protection; weekly canaries; cost bites; read+event+write-heavy, write spikes at on-sale.

| Demand (scoped) | Mode | Resolution |
|---|---|---|
| read path: 200ms P99 + 99.99% + storm-scale (path) vs cores: saga consistency + moderate scale (subsystems) | select+split+isolate | opposing pressures, **different scopes** → scope test: **split at the path boundary** → read path = services with own scaling/cadence; blast-radius containment falls out ✓ |
| pricing: replay + dispute reconstruction (data class) | prune | replay IS demanded (unlike P2) → **event-sourced** for pricing; quote storm served from projections → **separated read model** for pricing ✓ |
| booking: audit only (data class) | prune | same ledger comparison as P2, sharper → **current-state + audit-as-data, unified** ✓ |
| booking: strict + RPO 0 + multi-region (data class) | prune | only a **distributed shared store** provides multi-region strict transactions — every other persistence value struck ✓ |
| cores: strongly coupled, scale/deploy as units; ops cost bound (subsystems) | bound | ledger: unified runtime provides one-or-many packaging without wire rewrite, uniform resources → cores as slices on **unified runtime** ✓ |
| cross-subsystem facts tolerate lag; saga strict within | select | **event-based across, direct within** ✓ |
| event mgmt: document + relational shapes; schedule history audited | prune | **polyglot** stores; **hybrid** storage ✓ |
| sovereignty (domain) | pin | regional data pinning within the distributed store — constraint on Phase 6, no further axis move |
| on-sale burst on one seat | — | **contention, not volume**: one seat has one winner → admission + fast-fail (`SeatUnavailable`), holds with decay — **no axis move** ✓ (volume-vs-contention distinction validated) |

Recovery: booking **BER** (in-domain inverses); pricing **design-out** (append-only + idempotent apply); holds **FER** (fresh→stale→expired decay). Scope-splits recursed → **vector per subsystem** = the telescope, mechanically.

**Derived:** *services (read path) + unified runtime (cores) / event-based across + direct within / separated (pricing) + unified (booking) / event-sourced (pricing) + current-state (booking) + hybrid (event mgmt) / distributed-shared + per-component + polyglot / BER + design-out + FER* — **match, including every "plus."**

---

## Findings

- **F1 (rule refinement, forced by profile two):** the conflict rule "opposing pressures → split" is incomplete. **Scope test:** different scopes → split at the boundary (P3 read path); same scope → decompose the demands and satisfy the binding part minimally (P2 modulith); still opposed after decomposition → genuine contradiction (the module's failure mode 1, now mechanically detectable).
- **F2 (new step):** pressures must be **decomposed to mechanism-level demands** before matching — "team independence" is not primitive (ownership ≠ release independence). Entry gate extended: answers are priced AND decomposed. This is where fake drivers die.
- **F3 (validation):** the module's two storage "trap" lessons (audit-vs-replay ×2, replicas-vs-projection) fall out of **cheapest-containing-value ledger comparison** with no judgment required. The traps were underspecified derivation all along.
- **F4:** the recovery axis's inputs are **domain-shape facts** (inverses, decay, reshapeability), not the 11 answers — pressure-matrix rows = 11 answers ∪ domain-shape facts. The module says this quietly ("decided by what the domain forces"); the process must say it loudly.
- **F5:** the **null vector** needed defining (cheapest position per axis; recovery has no null). The regime insight is unusable without it.
- **F6 (honest):** irreversibility ordering never fired in these greenfield passes — no commitment-order conflicts arose. It belongs to the transformation half (Brownfield), not to a single derivation pass.

## Verdict

The process is real. v0.1 reproduces all three vectors; the judgment that remains is exactly where the stance wants it (demand decomposition, recovery-class weighing, contradiction handling) and everything else moved to mechanics. Next hardening: run it against a **non-ticketing** domain (the method must not be ticketing-shaped) — payroll from the Brownfield chapter's hybrid sketch is the natural candidate.
