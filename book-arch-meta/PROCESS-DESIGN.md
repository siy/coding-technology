# Process Design — the derivation mechanics

The book's named gap (2026-07-05): the module narrates one traversal; the book must mechanize the path from Phase-4 answers to the vector — without violating the stance on record ("show the thought process, give the reader a tool to build their own"; decision trees and compatibility matrices explicitly rejected, `architecture-synthesis.md` §Selecting the vector).

**Design constraint (yardstick for everything here):** do the PFD move at architecture altitude — mechanize the steps that never deserved judgment; explicitly name the ones that do.

---

## The three-spaces model (2026-07-05; load-bearing discovery)

The module works in two spaces and glosses the third:

1. **Demand space** — Phase-4 answers: targets with numbers and scopes (per use case / per data class / per domain).
2. **Decision space** — the six Phase-5 axes: the knobs actually set.
3. **Capability space** (the missing middle) — what each axis *value* provides, **via which mechanism, at what cost**. E.g. separated read model: provides read-scaling independence + latency isolation, via projections, at the cost of a staleness window + sync machinery. Event substrate: provides temporal decoupling + burst absorption, via a queue, at the cost of propagation lag + delivery-semantics complexity.

Classic literature (ATAM, quality-attribute workshops) works in the middle space directly and drowns — "-ilities" aren't decidable knobs. The module skips the middle entirely — demand→decision by narrated judgment. **The derivation becomes checkable when the middle is explicit: selection = the cheapest vector whose capability envelope contains the demands.** This generalizes consistency-lens (guarantee + mechanism that earns it) from consistency to every quality.

**Per-axis-value capability/cost ledger** is the shippable artifact: 6 axes × ~4-6 values × (provides / mechanism / costs). Finite, small, physics-grounded.

## Driver modes — which inputs dominate in which situations

The eleven inputs are not peers; they act in different modes:

| Mode | Drivers | Action | Character |
|---|---|---|---|
| **Prune** | consistency contract (#4), durability/RPO (#5), compliance (#6), sovereignty (#10) | eliminate vectors that can't honor them | binary, correctness — can't buy back with hardware |
| **Select** | latency (#1) | choose within survivors | continuous, presses only near the physics floor (target ÷ floor → 1) |
| **Split** | scale shape (#2, #11) | force decomposition | presses only on *divergence* (one path orders-of-magnitude unlike the rest = the "distinct SLO" decompose-trigger); uniform load presses nothing |
| **Isolate** | availability (#3) | blast-radius containment, failure domains, recovery class | starts biting past ~99.9 on a named path |
| **Bound** | cost (#9), team/deploy shape (#8) | economic envelope everything optimizes inside | org shape is usually the real deployment-topology driver (profile two says it without naming Conway) |

**Volume vs contention** (ticketing gem, already in the walkthrough): the on-sale burst is not a throughput problem — one seat has one winner. Contention pressure drives admission control + fast-fail (design-out/FER holds), never sharding the seat. Distinguishing the two pressures is a chapter on its own.

**The regime insight (why derivation terminates):** a driver presses only when it crosses the capability boundary of the current vector. Profile one is the proof — every driver inert, minimal vector survives. Each threshold crossing forces the *minimal* axis move that re-contains the demand. "Read the answers first," turned into mechanics.

**Two ordering principles, both real, distinct:**
- **Negotiability orders pruning:** prune (correctness) → select (physics) → bound (economics).
- **Irreversibility orders commitment:** decide hardest-to-reverse axes first (storage model before substrate before topology).

**Two named traps:**
- Ledger drifting into the rejected compatibility matrix. Line of defense: ledger entries are *mechanism physics* (what a projection costs, what a queue absorbs), never axis×axis rules; interactions stay surfaced-as-contrast inside derivations.
- -ilities as scalars. "Scalability" means nothing; "scaling shape of *which path* under *which load*" means everything. Ban the bare words in the book.

---

## Process candidates (2026-07-05 session)

Core bet — 1+2+3 ARE the process; 4 and 5 its exit/entry gates; 7 the sleeper for the transformation half:

1. **One process, latent in Brownfield.** Single operation `next_step(V₀, Phase-4 answers) → V₁`; greenfield = first iteration with empty V₀ ("even a greenfield architecture is only the first derivative"). Inverts every competing book (greenfield-then-migration-appendix). Process chapter = iteration of one derivation function.
2. **The missing intermediate artifact: the pressure matrix.** JBCT works because of its middle artifact (knowledge → dependency graph → composition). Synthesis analog: explicit question→axis pressure mapping. A cell = "this driver, past this threshold, presses this axis toward this value, because this mechanism" (semantics supplied by the three-spaces model above). Every axis position cites the answers that forced it — "no content the business did not put there," operationalized. Answer changes → know exactly which axes to re-derive (incremental recomputation). Embryo already exists: the heuristics section's "primary inputs" per axis.
3. **The conflict rule + scope test (refined by dry run, F1):** when two demands press one axis in opposite directions — apply the **scope test**. Different scopes (paths/subsystems) → the axis doesn't compromise; **the system splits at the boundary between the pressures** and derivation recurses per part (the telescope as mechanics; produces P3's read-path split). Same scope → decompose the demands to mechanism level and satisfy the binding part minimally (produces P2's modulith). Still opposed after decomposition → genuine contradiction — the module's failure mode 1, now mechanically detectable.
4. **Verify phase = consistency-lens.** Per operation: guarantee held under the vector + mechanism earning it + failure-mode behavior. Guarantee with no mechanism ⇒ vector wrong OR answer was fake. Closes elicit → derive → prove.
5. **Entry gate: answers are purchased AND decomposed (extended by dry run, F2).** Parse-don't-validate for requirements: an answer counts only with its cost acknowledged (a nine costs X; "real-time" priced becomes "under 800ms") — *"An SLO you haven't priced is a wish."* And pressures must be decomposed to mechanism-level demands before matching: "team independence" is not primitive (ownership boundaries ≠ release independence). This is where fake drivers die. Ties to trust-lens / "can't bribe a derivation."
6. **Decision ordering** — see the two ordering principles above (negotiability for pruning, irreversibility for commitment). Provenance: gap-drain risk-first formula (interaction-risk × blast-radius × observability-gap).

Tangential / lower probability, real upside:

7. **Migration as pathfinding, not diffing.** Vector space + deltas that don't commute + intermediate-state feasibility as a *path* constraint (every intermediate vector must be operable + affordable). Poltorak's Metapatterns transitions catalog = the **edge list** of this graph (prerequisites/costs annotated). Derivation picks the target; pathfinding picks the route. Unifies the transformation calculus with his work without importing his taxonomy as spine. The module's six cost-and-risk indicators (§Architecture as a derivative) are the edge weights, kept qualitative.
8. **ADR trail heals the disease Brownfield treats.** Per-axis output = decision record citing its Phase-4 answers → the derivation leaves behind exactly the artifact the next inheritor lacks ("original requirements are lost"). Self-medicating across time.
9. **The Aether gap-drain is the process running live** (memory `project_aether_gap_drain.md`): deferred-decision inventory as queue, risk-first ordering, verify-before-building, mechanical merges with named hard stops where judgment is genuinely owed. The book can confess this origin — process debugged on a live distributed runtime before being written down. Authenticity argument no competitor has.
10. **Walkthrough as regression test + worksheet artifact.** The process must mechanically reproduce the three ticketing vectors, or it's underspecified. Companion: one-page derivation worksheet (11 questions, pressure matrix, vector line, ADR stubs) — "a methodology you can apply from memory is one you actually apply."
11. **Budget arithmetic sub-procedure.** "A subsystem's target is the derived envelope of its workflows'." Envelopes compose upward, latency budgets decompose downward, tails don't add linearly. Numeric teeth without becoming DDIA.

---

## The question-set audit (2026-07-07) — the instruments derived, not chosen

**Trigger:** user's observation that some questions overlap and the latency-adjacent questions consume conspicuous bandwidth; Max Grom's "why exactly these eleven?" deserved a criterion, not "my analysis."

**Membership criterion (mirrors axis-completeness, open q7):** *a question earns its place iff its answer can press or prune at least one axis independently of every other question's answer.* Applying it to our own derivation logs (the eight validations are the evidence base):

- **Q2+Q11 fail independence — merge into "Load."** Never used separately in any derivation; cited inconsistently (Shopify burst under Q11, SO peaks under Q2, Discord hot partitions under "Q11 pathology"); neither housed F7 (windows) nor F15 (contention). Merged question: magnitude (steady/peak), shape (read/write/event mix, **per path**), concentration (uniform/bursty/contended), window (batch).
- **Q7 fails press-ability — merge into Q6 as "External constraints."** Across all eight derivations, mandates never pressed a Phase-5 axis (they bind Phase 6); they enter Phase 5 only when striking an axis value outright ("no cloud" kills serverless). Merged question keeps Q6's rich decomposition (audit vs replay, residency, scope-minimizable per F20) + mandates-that-strike-values.
- **Q1, Q3, Q5 pass separately (different modes: select/isolate/prune) but get one grammar — the three budgets** (user's reformulation, generalized):
  - **Time budget**, per operation, shaped: percentiles, tails, soft maxima, completion windows (absorbs F7). Guardrails: scope lives in the question (per operation — one system-level number is the bare--ility trap); a *hard* max as correctness criterion = the hard-real-time tripwire, out of scope by the module's own boundary — the shape catalog doubles as scope detector.
  - **Failure budget**, per operation: error budget + criticality (Google CRE framing verbatim — ch. 2/ch. 12 vocabulary seam closed).
  - **Loss budget**, per data class: RPO + retention + product-identity commitments (F17's home).
  - "Budget" bakes the entry gate into the noun (priced by definition); "shape" bans the bare mean (VOID convergence).
- **Q4, Q8, Q9, Q10 pass with reformulation:** Q8 → **Release structure** (cadence divergence + deploy safety — the number "deploys/day" pressed nothing anywhere; divergence pressed everything, F2/F21). Q9 → **Cost & capacity envelope** (money + who operates — Discord's "4 engineers, no DevOps" finally has a home; was cited fuzzily as "#8/#9"). Q4, Q10 unchanged (Q10 noted as two-output: partition gifts + legal pins).

**The nine-question sheet v2:** 1 Time budget · 2 Failure budget · 3 Loss budget · 4 Consistency contract · 5 Load · 6 External constraints · 7 Release structure · 8 Cost & capacity envelope · 9 Multi-X. Presentation note for the book: organize by **driver mode** (what each question does in the derivation), not by the module's four categories — the mode is the question's actual role.

**Axes audit (same pass):** all six survived the eight validations; one watch item — **read/write model never moved in any blind derivation** (unified in all three; only ticketing P3's pricing separated it) and it couples tightly to state storage (event-sourced ⇒ projected reads). Not surgery — a watch: candidate for folding into storage as "read serving: from-truth vs projected" if future derivations keep confirming. **RESOLVED 2026-07-11 (4th blind run, Companies House): the axis MOVED — 1000:1 read:write ratio (Q5) × statutory redaction duty (Q6, read shape ≠ stored shape) cleared the shape-divergence bar together — and graded HIT against a first-party-documented projection pipeline. The axis earned its seat; the fold is dead. Corollary finding (F24): it took cross-question convergence — neither answer alone would have moved it past replicas.**

**Public-count note (user ruling, 2026-07-07):** the published articles and the blind derivations stay at eleven — they are the historical record, and research work carries the right to mistake/change/adjustment. The book introduces the nine-question sheet **with the audit as the narrative** ("we made every question justify its seat; two couldn't, and five turned out to be three budgets and a contract wearing different grammar"). PFD-module sync rides decision D in BOOK-PLAN. Domain-shape facts (F4) remain deliberately OUTSIDE the question set — they are Phase-1 output, the answer sheet's second row-source, and the book must say so explicitly.

## Validation status

**Dry run DONE (2026-07-05): `DRY-RUN-TICKETING.md` — all three profile vectors reproduced mechanically.** The full `next_step` v0.1 procedure (null vector → normalize → prune → press → resolve-with-scope-test → recovery-by-domain-shape → consistency-lens verify) is written out there, with per-profile pressure tables. Findings folded back into this doc: F1 (scope test on the conflict rule), F2 (demand decomposition at the entry gate). Additional structural notes from the run:
- **F4:** recovery-axis inputs are *domain-shape facts* (inverses, decay, reshapeability), not the 11 answers — pressure-matrix rows = 11 answers ∪ domain-shape facts.
- **F5:** the **null vector** is now defined (cheapest position per axis: single deployable / direct / unified / current-state / single shared; recovery has no null). The regime insight is unusable without it.
- **F3 (strongest validation):** the module's storage "trap" lessons (audit-vs-replay, replicas-vs-projection) fall out of cheapest-containing-value ledger comparison with no judgment — the traps were underspecified derivation all along.
- **F6:** irreversibility ordering never fired in greenfield passes; it belongs to the transformation half.

**Next hardening step:** ~~non-ticketing domain~~ **DONE (2026-07-05): `DRY-RUN-PAYROLL.md` — domain-independence passed.** Three tests against `brownfield.md`'s published derivations: greenfield derivation reproduced the long-lived hybrid on every axis and every "except"; unchanged-inputs audit returned "no change" mechanically; the merge-back walkthrough's one-axis delta reproduced exactly (and its unforced "three deployables" position was detected as debt — no demand cites it). New findings, all vocabulary/ledger, none algorithmic: **F7** deadline-shaped SLOs (windowed throughput + resumable batch as containing mechanisms), **F8** business-calendar constraints on intermediate-state feasibility (freeze windows), **F9** compensation-as-domain-workflow (off-cycle correction anchors the recovery rows), **F10** the process doubles as a mechanical debt detector (underivable axis position = debt). Volume/contention poles now both covered (payroll: volume-without-contention; ticketing on-sale: contention-without-volume).

Score so far: `next_step` v0.1 has reproduced **eight derivations — five published (our own) + three EXTERNAL blind derivations** (`BLIND-DERIVATION-SO.md`, `BLIND-DERIVATION-SHOPIFY.md`, `BLIND-DERIVATION-DISCORD.md`; predictions pre-registered in `BLIND-DERIVATION-PREDICTIONS.md` and graded): Stack Overflow 2016 (every axis incl. both splits; pre-registered "read replicas" prediction WRONG, derivation right — the replica is HA-only), Shopify pod-era (modular monolith at 1000+ devs, full-stack shop-sharded cells, edge admission control for flash contention — all HIT), Discord 2017-2023 (gateway split, `((channel_id, bucket))` sharding, coalescing-over-unified-store not CQRS — all HIT incl. the registered self-correction). Cross-findings: **F15** contention is side-symmetric (write-side admission at Shopify, read-side coalescing at Discord, never more sharding), **F16** the vector lens classifies migration severity (Mongo→Cassandra = axis move; Cassandra→ScyllaDB = pure Phase 6), **F19** cells = sharded value at full-stack scope when blast-radius compounds, **F20** compliance containable by scope exclusion, **F21** modulith holds from 4 to 1000+ developers — team size never presses topology, only release-cadence divergence does. Ledger v0.2 additions queued: F12 hardware-sizing rung + ceiling, F13 containment chain (cache → coalescing → replicas → projections; three industrial stops, each cited), F18 thin mechanism tiers are axis-invisible, F19, F20.

## The 4th blind derivation — Companies House (2026-07-11), boring-enterprise + isolated-operator protocol

**Score: 10 HIT / 2 PARTIAL / 2 MISS of 14 graded positions (8 predictions + 6 axes), 0 ungradeable.** Files: `BLIND-DERIVATION-CH-ANSWERS.md` (answer sheet, demand-side venues only), `-CH-RUN.md` (pre-registered derivation), `-CH-GRADES.md` (adversarial grading with citations). Candidate provenance + contamination record: `BLIND-CANDIDATES-ENTERPRISE.md`.

**Protocol upgrade (methods-note for ch. 7):** first run under the **isolated-operator protocol** — assembler/deriver/grader as separate fresh agents; the deriver had no web access, prior-knowledge quarantine with a written log, every step citing answer + rule; orchestrating session was outcome-contaminated and therefore derived nothing. Stronger claim than the first three runs: the operator provably could not have seen the outcome — mechanical enough for a machine to run it is the thesis, demonstrated.

**Headline result — the read/write watch item resolved** (see axes audit above): the axis moved for the first time in a blind run and graded HIT against first-party documentation of the projection pipeline. The consistency-lens core ("what guarantee, what cheapest mechanism earns it") scored near-perfect, with documentary confirmations down to a literal `annotations` API field.

**The teaching miss — topology (the deriver's own pre-flagged riskiest claim):** predicted modulith via F21 + three inert UNKNOWNs; reality is self-described fine-grained microservices (670+ repos). Two honest readings, both on record: (a) **the miss is F10 working** — the method derives the forced minimum, and the decomposition is unforced by any published demand → the blind run *detected an unforced position* it couldn't know was chosen (mirror of SO's "prediction wrong, derivation right"); (b) the forcing demand may exist but be unpublished (Q7 release structure was UNKNOWN — internal cadence divergence would legitimately press). Grader's caution against reading (a) too fast: the grader suggested the org's own "we adopted microservices" statement could have informed the call — rejected for the answer sheet on circularity grounds (that statement IS the outcome); the correct fix is better Q7 elicitation, not outcome ingestion. **F21 rescoped:** "team size never presses topology" holds as a *forcing* claim; it is not a *prediction* that organizations won't decompose anyway — strategy/convention produce unforced positions the method will systematically under-predict, and that gap between derived-minimum and observed-actual is the debt/unforced-position detector's output, not noise.

**New findings:**
- **F22 — requester's-clock vs system's-clock.** The entry gate needs a triage rule for time answers: statutory/business-process deadlines (14-day filings, 20-day FOI) bind the *requester's* clock and are inert for Phase 5; only system-clock targets press. (Deriver had to invent this mid-run; ~6 Q1 sub-answers.)
- **F23 — observed-failure ≠ stated target.** Incident anecdotes (outage closures) are real signal but not priced demands: log them as corroboration, never let them press. Name the class in ch. 2.
- **F24 — cross-question convergence** (see axes audit): some axis moves clear their bar only when answers from different questions combine; the pressure pass must check combinations, not just rows. Worked example: reads separation = Q5 ratio × Q6 redaction.
- **F25 — the unforced-position gap** (from the topology miss, reading (a) above): blind-derivation misses on unforced positions are the method's debt detector firing in reverse — book must set grading expectations accordingly (grade the *forced* core strictly; treat divergence on unforced positions as a finding about the system, not only about the method).
- **F26 — axis-5 intermediate shape.** "Database-per-service atop a shared legacy backbone" sits between *single shared* and *per-component* as currently worded; it is a scope-composition (per-component applied at service scope over a shared legacy core), and the ledger/worksheet should show that composition reading explicitly so derivations name it instead of rounding to "single shared."

**Now the least-specified component: the capability/cost ledger** — ~~first-draft it next~~ **DRAFTED (2026-07-05): `LEDGER.md` v0.1; v0.2 DONE (2026-07-10)** — added demand-shape vocabulary (volume/burst/contention/deadline, F7/F15), containment rungs with the read chain and hardware rung + ceiling (F12/F13/F18), cells (F19), scope exclusion in the selection rule (F20), boundary-cost entry. All six axes, atomic values only (mixed/hybrid = scope-split compositions, not values), each entry provides/via/costs/pressed-by; the explicit **selection rule** (null → move only on uncontained demand → fewest new mechanisms → narrowest containing scope → scope-exclusion-first for prune demands); anti-drift guardrails baked in. Consistency-checked against both dry runs and all three blind derivations — every v0.2 addition cites its forcing run.
