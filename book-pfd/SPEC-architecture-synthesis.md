# SPEC — Architecture Synthesis module (drafting brief)

*Status: spec / not yet drafted. Target ~12K words. Position: post-spiral, before Brownfield. This file is a drafting brief; actual prose is written by the drafting agent.*

> **Authority:** This brief **aligns to and defers to** the canonical outline in `oss/content/pfd-book-spec.md` lines **503–527**. Where this brief and canon differ, **canon wins** — re-read those lines before drafting. The brief's value-add over canon is (a) consolidating canon scattered across spec/considerations/validation/voice into one place, (b) specifying *how the external Metapatterns framework enters* (canon is silent on this — see §5), and (c) flagging the net-new authoring work (the per-axis heuristics, §4.2).

## 1. Role and identity

The hourglass payoff. The spiral climbs altitudes (use-case → workflow → subsystem → system), naming and deferring architecture decisions at each. This module is where "the methodology stops surfacing decisions and starts making them." It is **integrative, not delta-based** (Theme 26): the spiral tapered to a point at system altitude; Synthesis swells back out because it pays all deferred debts at once. A short Pass 4 is correct *because* Synthesis is the payoff (spec L379).

It proceeds by **Phase, not altitude** (Theme 25 guard — do not conflate). Owns **Phase 4** (elicitation) and **Phase 5** (architecture selection); defines the **Phase-5/6 boundary**; presents the **continuous-transformation framework** that Brownfield then applies. Theme 22: the full Phase-5 treatment lives only here; the spiral passes plant one-sentence deferrals.

## 2. Canonical module outline (the spine — spec L519–525)

Draft these eight sub-sections in this order. Word sub-targets are **indicative and scale with the ~12K total** (they sum to ~18K by design slack — spec L503).

| # | Sub-section | ~words | §brief |
|---|---|---|---|
| 0 | Deferred-decision inventory (checklist) | — | §3 |
| 1 | Phase-4 elicitation | 3K | §4.1 |
| 2 | Phase-5 six-axis vector | 5K | §4.2 |
| 3 | Phase-5 selection mechanism | 3K | §4.3 |
| 4 | Phase-5 / Phase-6 boundary | 1K | §4.4 |
| 5 | Recovery-class selection | 2K | §4.5 |
| 6 | Continuous transformation | 3K | §4.6 |
| 7 | Walkthrough integration | 1K | §4.7 |

**Threads advanced (canonical): 1, 2, 11, 13, 14, 15.** Open with the multiplicity that earns the module (the spiral surfaced everything, resolved nothing); close handing to Brownfield (the inherited system).

## 3. Deferred-decision inventory (spec L507–517)

The spiral's promissory notes, collected so none drop. Most map to a sub-section; **two still need an explicit home (genuine open item — see §8):**

| Debt | Resolved in |
|---|---|
| Recovery-class full selection (all four judgment axes; mixed per use-case/workflow/subsystem/boundary) | §4.5 |
| Phase-4 elicitation (full set; per-use-case/workflow/subsystem SLOs; subsystem SLO = derived envelope of its workflows') | §4.1 |
| Persistence-layer configuration (per-subsystem vs shared-with-logical-separation; topology) | §4.2 (axis 5) |
| Composition substrate (sync/async/streaming/mixed; the cross-workflow & cross-subsystem "wire" carrying typed versioned contracts) | §4.2 (axis 2) |
| Deployment topology (services/functions/monolith/unified runtime) | §4.2 (axis 1) |
| Cross-data-class consistency (strong within a subsystem, eventual across) + delivering substrate | §4.2 (axes 4 + 2) |
| System-level resource provisioning + platform technical cross-cutting (observability, tracing, idempotency) | §4.4 + assembly-vs-provisioning |
| ⚠ **Aspect wrapping convention** (metrics → timeout → circuit-breaker → retry → rate-limit → business) | **no home yet** |
| ⚠ **When-to-decompose judgment** (distinct triggers / distinct SLOs / non-trivial compensation / independent operation) | **no home yet** |

## 4. Section briefs

### 4.1 Phase-4 elicitation (~3K)

Half-structured. The minimal set is universal across enterprise backend; the answer varies, the question doesn't. **Use this canonical set verbatim** (spec L104–131):

```
| # | Question | Category |
| 1 | Latency (per use case, usually P95/P99) | SLO |
| 2 | Throughput (steady-state and peak) | SLO |
| 3 | Availability (per use-case criticality) | SLO |
| 4 | Consistency contract (per data class: strict / read-your-writes / bounded-staleness / eventual) | SLO |
| 5 | Durability / RPO | SLO |
| 6 | Compliance (regulatory/contractual regimes) | Constraint |
| 7 | Tech / platform mandates | Constraint |
| 8 | Deploy frequency / safety | Operational target |
| 9 | Cost shape (ceiling or per-operation budget) | Operational target |
| 10| Multi-X (multi-country/-currency/-tenant/-region) | Substrate-shaping |
| 11| Scale shape (read-heavy/write-heavy/event-heavy/mixed) | Substrate-shaping |
```

- **Substrate-shaping is first-class** (not folded into Constraint): multi-X partitions data; scale shape drives substrate.
- **Three attachment scopes:** per use case (latency, throughput, availability) · per data class (consistency, durability) · per domain (compliance, mandates, deploy frequency, cost shape, multi-X, scale shape).
- Trigger source stays **Phase-1**, not Phase-4. Phase-1↔Phase-4 iteration is **targeted-insertion** (re-derive only the affected use case), not full re-derivation.
- Extended/contextual questions are illustrative, not prescriptive (RTO, external SLA deps, data sovereignty, compat window, seasonal load, decommissioning, audit/dispute).

### 4.2 Phase-5 six-axis vector (~5K) — largest section

Canonical axes + options (spec L137–145; finalized in validation Gap 6):

```
| Axis | Values |
| Deployment topology | single deployable / multiple deployables / unified runtime / serverless / hybrid |
| Composition substrate | sync calls / async events / streaming / mixed |
| Read/write model | unified / CQRS-separated |
| State storage | current-state / event-sourced / hybrid |
| Persistence layer config | single shared / distributed shared (NewSQL: Yugabyte/CockroachDB/Spanner/TiDB) / sharded / per-component / polyglot / hybrid |
| Recovery class | BER / FER / design-out / mixed-by-component  → fully treated in §4.5 |
```

**NET-NEW AUTHORING (the core writing task):** canon names the axes and options but the **per-axis "3–4 selection heuristics anchored in Phase-4 inputs" do not yet exist** — only the directive to write them (spec L146, L520). The drafter authors them for axes 1–5 (axis 6 already has its procedure, §4.5). Required **shape** (validation L722–730):
- Each heuristic **anchored in a Phase-4 input** (e.g. "scale shape = write-heavy + multi-region → consider distributed-shared persistence").
- Phrased "**consider this as well**," not "pick from this menu" — heuristics, not a flowchart.
- Surface **infeasible/incoherent vectors as contrast cases**, not a prohibition chapter (validation L668–676, L819–825): e.g. "*Microservices + sync everywhere = distributed monolith*"; "*Serverless + heavy state = mismatch*."
- Catalog decisions to honor: **Hexagonal dropped** (composition style, not architecture); **unified runtime added** as first-class (Aether, Erlang/OTP, Akka, Orleans, Dapr are instances); modulith vs microservices = styles *within* axis 1.
- **Honest wrinkle (spec L148, validation L743):** some axis values are properties supplied by product classes ("unified runtime", "distributed shared store"). Acknowledge the overlap; the Phase-5/6 boundary still holds.
- **← Metapatterns convergence enters here, on axes 1 & 2 only. See §5.**

### 4.3 Phase-5 selection mechanism (~3K)

Half-structured + walkthroughs (spec L146–148). Stance, quote: *"Show thought process, give reader a tool to build own thought process, let them make own decision."* **Decision trees per axis rejected** (becomes a recipe, misses interactions); **compatibility matrix rejected** (combinatorial, brittle). Walkthroughs demonstrate coherent vector formation; this section sets up the §4.7 walkthrough.

### 4.4 Phase-5 / Phase-6 boundary (~1K)

- Boundary: Phase-5 picks the axis vector; Phase-6 picks concrete technology. *"Phase-5 is selecting the restaurant; Phase-6 is selecting a meal from the menu."*
- **Durable-workflow SaaS placement (Theme 18):** Temporal/Step Functions/Restate = a Phase-6 choice that **bundles a specific Phase-5 vector** (event-sourced workflow execution + managed retries + compensation + distributed-shared persistence). **No new primitives** (durable workflow = state-machine Condition + Sequencer + state-persistence Aspect; activities = Leaves; timers = scheduler-resource trigger). Saga reduction holds. Quote: *"Methodology lives upstream of substrate choice."* Name the **three traps**: everything-is-a-workflow; event-sourcing-by-the-back-door; workflow-versioning as a load-bearing operational concern (a Phase-5 cost needing a mitigation plan).

### 4.5 Recovery-class selection (~2K)

The one axis whose selection procedure already exists (spec L179–208) — use verbatim:
- **Classes:** BER (compensate via inverse: saga/rollback/RAII/reversing entry) · FER (continue degraded: defaults, ECC, self-stabilization) · design-out (alter model so compensation is unnecessary: CRDT, idempotence, immutability). Most discourse covers only BER; surface all three.
- **Four judgment axes (NOT flowchart inputs):** 1) reversibility · 2) forward-progress value · 3) domain shape (commutative/idempotent/immutable?) · 4) coordination cost. **Mixed is normal:** BER for money, FER for telemetry, design-out for collaborative state.
- **Compensation derivation:** derivable/mechanical (inverse stays in-domain) vs designed-per-case (inverse escapes domain → is itself a workflow); residuals (refund money, can't refund time) surfaced explicitly, no "partial inverse" label.
- **Saga (altitude-pinned):** *"BER applied at workflow altitude across autonomous subsystems with no shared transactional substrate, where each forward step's inverse is itself a use case."* Higher-altitude saga-shapes are compositions of sagas.
- **Time-decay as first-class FER (PFD original):** time-as-trigger (BER) vs time-as-condition (boundary check) vs time-as-decay (`fresh → stale → expired`, FER).
- Carry the cross-subsystem insight: prefer reads over writes across boundaries; where a cross-subsystem write is unavoidable, prefer design-out over BER.

### 4.6 Continuous transformation (~3K)

**Placement is resolved (spec L150–177, L524, L531–545):** Synthesis **presents** the framework; Brownfield **applies** it. Do not duplicate the application here.
- "Architecture is a derivative, not a state." Output = **next-correct-step recommendations, not target-state migration plans.** All transformations are **Phase-4-driven** (trigger categories: external change / always-was-wrong discovery / telescoping new altitude).
- **Six cost/risk indicators (qualitative, no scores):** reversibility cost · intermediate-state feasibility · coupling cost · transition duration · dependency cost · failure-mode amplification.
- **Five methodology failure modes (surface the obstruction as useful output):** Phase-4 contradictions · vector infeasibility · trapped state (resolution = invest in scaffolding: test substrate, observability, deploy automation) · knowledge gap · unexplored territory (PFD bounded to enterprise backend).
- Close on the hinge to Brownfield: even a greenfield architecture is a first derivative.

### 4.7 Walkthrough integration (~1K)

**Event-ticketing three-profile walkthrough — small-venue → mid-stage platform → enterprise multi-tenant** (spec L526). This **replaces the previously-planned cargo walkthrough.** Same domain, different Phase-4 inputs → different Phase-5 vectors (Theme 6 engine: "don't push choice, show possibility"). **Only the startup profile has a uniform vector; mid-stage and enterprise are intrinsically hybrid across axes** (validation L815) — hybrid is a property of real systems, not a failure. **Avoid domain→scale coupling** (validation L749). This walkthrough carries the demonstration for falsification bet #10 (process-first stays cheaper as the system grows). Running example state at end of spiral-4: thousand-venue multi-tenant platform; three subsystems (Booking BER / Pricing design-out / Event-mgmt mixed) exchanging typed versioned facts.

## 5. Where the architecture-design (Metapatterns) skill plugs in

**This is the brief's contribution; canon is silent on external frameworks. The book's own Theme 3 dictates the mechanism, so this is fully on-brand.**

**Theme 3 — emergence-first / derive-then-recognize (considerations L171–196):** "situation → composition emerges from primitives → *'the literature calls this X'* → synthesis. **Name comes third, not first.**" Metapatterns is the **"the literature calls this X"** step — never the derivation, always the recognition after.

**Voice compliance (pfd-book-voice.md L44–63, L158):** present convergence as a **named second-layer device** ("Convergence" callout / sidebar / cross-reference). Rules: surface prose must be **self-sufficient without it**; it is **visible but non-blocking** (skippable, never load-bearing); framework names allowed **only as positive crediting**. A Convergence callout crediting Poltorak's framework is permissible exactly under these terms.

**Placements:**
- **§4.2, axes 1 & 2 only.** After deriving PFD's topology/substrate options, a Convergence callout notes the literature's names: single→**Monolith**, layered→**Layers**, subdomain→**Services**, staged→**Pipeline**, very-large→**SOA/Hierarchy**, coordination layers→**Middleware/Proxy/Orchestrator/Shared Repository**. Independent corroboration, not derivation.
- **§4.2 completeness check.** Poltorak's geometric-completeness argument ("blank spaces become obvious") = outside evidence the topology options are exhaustive — which dovetails with PFD's own infeasible-vector contrast cases.
- **§4.6 (lightly) / Brownfield (mainly).** The metapattern **evolution maps** (from→to · prerequisites · pros · cons) share the shape of next-correct-step recommendations; prerequisites ≈ intermediate-state-feasibility/dependency-cost, cons ≈ failure-mode-amplification. Use as a source of transition shapes and a sanity-check on the six indicators — revocabularized into PFD terms. The bulk of this lands in the Brownfield module.

**Partial-coverage is the honest framing (a feature):** Metapatterns touches ~**2 of 6 axes**. Divergences prove PFD's independence — **unified runtime** has no metapattern; **Hexagonal** is dropped here but is a metapattern there; axes 3–6 (read/write, state, persistence, recovery) sit largely outside Poltorak's structural taxonomy.

**Attribution:** one positive-crediting line — Poltorak's *Architectural Metapatterns* (CC BY 4.0) — beside the King/Loth/Jackson credits. Cite the **book**, not the skill (`../architecture/.claude/skills/architecture-design/` is the working digest).

**Do NOT:** make the 19 metapatterns a section spine; quote Poltorak's prose (use PFD vocabulary; the digest is ~0.5% verbatim — keep it that way); let a Convergence callout grow into surface prose; introduce a metapattern PFD doesn't need.

## 6. Binding style & voice constraints

- **Register (voice L156):** research-cited, sharp, observational. No marketing, no motivational filler, no "let's explore."
- **Sentence discipline (voice L21–24):** vary length with intent (~60% medium / 25% longer / 15% short); sections ~400–900 words.
- **Em-dash: ≤1–2 per paragraph** (voice L116–121); parenthetical em-dashes → commas; reserve for genuine pivots.
- **Three-layer model (voice L44–63):** surface self-sufficient; second-layer (sidebars, named cross-refs, threads tag, **Convergence callouts**) non-blocking; "See Ch X for full treatment" OK, "as we'll see in Ch X" in main flow not OK.
- **Forbidden vocabulary (voice L85–88):** never "non-functional" / "NFR" / variant (use "quality requirements" / "system qualities"; at detail use SLO / constraint / operational target / substrate-shaping); never "system-level/system-input requirements"; no anti-hedge fillers ("the truth lies in the middle," "it depends" without naming what).
- **Theme 19:** show it's happening, don't argue it should — present vectors (durable-workflow, distributed-shared store) as observed industry practice, reader-as-observer.
- **Theme 25:** PFD's determinism is **phase-scoped** — decomposition (Phases 1–3) is mechanical; judgment is reserved for architecture (Phases 4–5). Don't over-claim determinism.
- **Theme 23 #4 answer (verbatim-anchored):** process simplicity resolved at Phase-1, performance at Phase-5; "they compose; they don't trade." Edge cases: tight loops isolated inside **Leaves** (use-case body unchanged); hard-real-time is out of PFD's bounded scope.
- **No competitor/product names in publishable body** except positive crediting (Temporal/CockroachDB/Aether appear in planning only).
- **Pseudo-code for type shapes; Java for composition** per JBCT idioms (single-param `Result<T>`; `Promise<T>` carries failure; async I/O; `Unit` not `Void`; `TypeName.typeName(...)` factories; method references; `->`, `var`).

## 7. Sources of truth (read before drafting)

- `oss/content/pfd-book-spec.md` — **canonical module outline L503–527**; axes L137–148; Phase-4 L104–131; recovery L179–208; continuous-transformation L150–177.
- `oss/content/pfd-book-considerations.md` — Theme 3 (L171–196, emergence-first), 6 (show possibility), 18 (L618–672, Temporal), 19 (L676–792), 22 (synthesis-is-a-module), 23 (L1309–1335, esp #4 L1332), 25 (determinism phase-scoped), 26 (integrative-not-delta).
- `oss/content/pfd-validation-notes.md` — Gap 3 (recovery), Gap 5 (Phase-4 set), Gap 6 (six-axis); infeasible-vector contrast cases L668–676, L819–825; hybrid-normal L815.
- `oss/content/pfd-book-voice.md` — register, em-dash, three-layer/named-device model, forbidden vocab, positive-crediting rule.
- `coding-technology/book-pfd/spiral-{1..4}.md`, `foundations.md`, `REVIEW-spirals-2026-05-27.md` — deferral promises, recovery taxonomy, running example.
- `../architecture/.claude/skills/architecture-design/` — Metapatterns digest, for §5 convergence only.

## 8. Genuinely-open decisions (escalate before/at drafting)

1. **Homes for two deferred debts (§3):** the **Aspect-wrapping convention** (metrics→timeout→circuit-breaker→retry→rate-limit→business) and the **when-to-decompose judgment** — canon flags both as "needs an explicit home." Recommend: wrapping convention as a short cross-cutting note under §4.2/§4.5; when-to-decompose as a decomposition-granularity heuristic adjacent to §4.2. **Author to confirm.**
2. **Net-new heuristics (§4.2):** the 3–4 selection heuristics for axes 1–5 don't exist anywhere — they are original authoring, anchored in Phase-4, validated against the three-profile walkthrough. Largest risk to fidelity; do not invent silently — derive from the walkthrough.
3. **Budget reconciliation:** canonical sub-targets sum to ~18K vs ~12K module total (flagged "indicative, scale with figure"). Decide compression: likely trim axes 3–5 treatment (less contested, no convergence layer) and keep 1–2 + recovery + walkthrough rich.
4. **Resolved (recorded, not open):** continuous-transformation split → present in Synthesis, apply in Brownfield. Walkthrough → event-ticketing three-profile, replaces cargo.
