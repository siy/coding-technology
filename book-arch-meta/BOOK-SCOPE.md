# Architecture Synthesis — Book Scope

**Status:** scope capture only. Writing NOT started; fills the slot vacated by the delayed Aether book. `BOOK-PLAN.md` (chapter map, voice doc, build setup) comes when writing is green-lit.
**Provenance:** "The Editor" session, 2026-07-04/05 discussion. Not committed (same convention as other book meta dirs).

---

## Settled name (2026-07-05, user decision)

**Architecture Synthesis: The Next Correct Step**

The subtitle does triple duty:
1. **Thesis reading** — an architecture IS the next correct step (the derivative claim; covers the continuous/brownfield half that "synthesis" alone can't gesture at).
2. **Series reading** — for a PFD reader, the subtitle literally says this book is what comes next. Sequel pointer without "book two."
3. **Method reading** — title names the activity, subtitle names its output; self-demonstrating, same move as PFD's spiral structure.

Division of labor: "Synthesis" = derived-from-inputs, not picked-from-catalogs. "The Next Correct Step" = re-derived as forces change, greenfield through inherited.

- Tagline / back-cover: **"derived, not chosen"**.
- Problem-statement copy: CodersWorld line — "a huge percentage of architectural debates are really disguised preference wars dressed up as engineering certainty" (see memory `project_quotable_lines.md`).
- Thesis in one sentence (user, on record): "From the same design (== business), different capacity/scaling/etc. requirements may produce entirely different architectures."
- Title space verified clean 2026-07-05: no book owns "Architecture Synthesis" (closest: Synbad academic chapter 2002; EDA/HLS hardware literature — see Positioning). No tech collision for "The Next Correct Step."

## Positioning

The shelf has two kinds of architecture books: **catalogs** (styles, patterns, trade-off matrices — Richards/Ford, Poltorak's Metapatterns) and **physics** (mechanism behavior — Kleppmann DDIA). Missing kind: a **procedure** — elicit these inputs (business logic + SLO = Phase-4 answers), run this derivation, get a vector out, re-derive when inputs change. This book owns that position.

- **Ecosystem slot:** PFD (process → design) → **this book** (design + SLO → architecture) → JBCT (code) → Aether (a Phase-6 instance). Widest-funnel book of the family — architects who'd never read a Java methodology book enter here. Title deliberately does NOT carry the PFD brand; the front door shouldn't require knowing the house.
- **EDA/HLS parallel is an argument, not a collision:** hardware has derived architectures from behavioral specs + constraints for decades (high-level synthesis); software still picks styles from articles. Introduction-chapter material: "hardware engineers stopped doing this by taste in the 1990s."
- **Adjacencies to position against, not ignore:** Hohpe *Software Architect Elevator* ch. 3 "Architects Live in the First Derivative" (his derivative = rate of change; ours = derivation from inputs — cite as cousin, overlap is corroboration that the calculus frame resonates). Löwy *Righting Software* (closest stance-competitor: derivation via volatility-based decomposition; differentiate: single-axis volatility vs six-axis vector from elicited Phase-4 inputs). Poltorak *Architectural Metapatterns* (already corroborates the deployment axis in PFD; relationship exists — reviewer/foreword candidate). Yannick L.'s *Independent Variation Principle* + cohesion papers (Zenodo: 10.5281/zenodo.20794332, records 20785752, 20785881) — independent theoretical convergence: IVP modules partition by change-driver structure, "no need to choose an architecture style, it materializes from the domain's change drivers"; publicly endorsed the first validation article 2026-07-06 and claims his theory confirms the approach. **Read-for-citation audit done 2026-07-10 (`IVP-CLAIMS-MAP.md`): papers are semi-formal, self-citing, circular at load-bearing steps, and never cite Löwy — DECIDED (user): no formal citations; mention in prose as independent formulation only.** Potential reviewer (see memory `project_pfd_interlocutors.md`). **SEI QAW/ATAM** (surfaced by Max Grom, Telegram 2026-07-06): QAW ≈ Phase-4 elicitation (scenario-based), ATAM = trade-off *evaluation* of a candidate architecture. **The gap between them is the book's exact position: SEI provides elicitation and evaluation, but candidate *generation* is left to expert judgment — the derivation fills precisely that hole, and ATAM becomes a check on the output rather than a substitute for producing it.** Load-bearing positioning line; belongs in the Introduction's related-work framing.

## Core content: delta over the PFD module

The PFD Architecture Synthesis module is the compressed skeleton (Phase-4 question set, six-axis vector, three-profile ticketing walkthrough, architecture-as-derivative, Brownfield application). The book adds what the module has no room for:

1. **Phase-4 elicitation as practice** — extracting SLOs from a business that doesn't have them; fake nines; the cost of a nine; latency budgets composed across hops; tail-latency behavior.
2. **Each of the six axes as a chapter** — full decision surface, failure modes, quantitative reasoning (back-of-envelope capacity math, queueing intuition).
3. **Multi-domain worked derivations** — module proves "same domain, three scales"; book must prove "different domains, same method" (method isn't ticketing-shaped).
4. **Verifying an architecture against its SLO before it's fully built** — load models, capacity planning, failure injection.
5. **Cost as a first-class Phase-4 input** — cloud spend, operational load, team topology (currently implicit).
6. **The transformation calculus expanded** — migration sequencing, intermediate-state feasibility, when a delta is worth its dependency cost. Brownfield gestures at this; could be half the book. (Feeds the subtitle's claim.)
7. **Consistency-lens chapter** — precise guarantee per operation + the mechanism that earns it; strip one-bit labels (CP/AP, "strongly consistent", "exactly-once"). The `/consistency-lens` discipline is a ready-made seed.

## Authorial guardrail (main risk)

**The anti-catalog trap.** The module's power is smallness — "keep the question set small, resist the special question per project." Book format invites inventory expansion, which would turn it into the thing it argues against. Discipline: growth = more *worked derivations*, never more *options*. Every chapter addition must answer "which derivation does this serve?"

## Process design → `PROCESS-DESIGN.md`

The derivation mechanics (the named gap: module narrates, book must mechanize) live in their own doc: the **three-spaces model** (demand / decision / capability — the missing middle), **driver modes** (prune / select / split / isolate / bound), the **11 process candidates** with the core bet (1+2+3 = the process), and the dry-run validation plan.

## Open questions

1. **Standalone vs recap:** carry a compressed PFD recap chapter, or openly assume PFD? (The condensed-edition coherence pass proved the recap craft is known.) Leaning: standalone with recap — required by the widest-funnel positioning.
2. **Module-name ambiguity:** book and PFD module share "Architecture Synthesis." Convention needed: PFD cross-refs say "the Architecture Synthesis module"; consider whether PFD 2.x renames the module or embraces the promotion ("the module that became a book").
3. **Validation before commitment:** article series on the thesis ("architecture is a derivative, not a state") via article-cross-poster, watch pull; sample-angle LinkedIn post sequencing already agreed for PFD — this series follows. Decide book-go after signal.
4. **Sequencing vs Aether:** book fills the Aether-book slot during the gap-drain (see memory `project_aether_gap_drain.md`). If Aether stabilizes early, decide order then; note Phase-6 examples in this book can feature Aether — funnel synergy either way.
5. **Leanpub slug / covers / og assets** — when writing is green-lit (slug candidate: `architecture-synthesis`).
6. ~~**Process dry run**~~ **DONE 2026-07-05:** `DRY-RUN-TICKETING.md` — all three ticketing vectors reproduced mechanically by `next_step` v0.1; two refinements forced (scope test on the conflict rule; demand decomposition at the entry gate). Next hardening: a non-ticketing domain (payroll, from the Brownfield hybrid sketch), then first-draft capability/cost ledger.
7. **Axis-completeness argument** (forced by Vania Leyn, Telegram 2026-07-06): the module commits to six axes but never argues closure. The book must either argue completeness (candidate criterion: an axis earns its place iff two systems with different Phase-4 answers must *structurally* differ along it before any technology choice — DB engine by access pattern fails this, it's Phase 6; test architecture fails it, it's scaffolding) or explicitly declare the set open with an admission rule ("a demand no combination of the six + Phase 6 contains"). Poltorak argued his metapattern completeness geometrically — precedent for attempting the argument.

## Validation log (article: "How Architecture Emerges", published 2026-07-06)

- dev.to: https://dev.to/siy/how-architecture-emerges-1b9 · Medium: https://medium.com/@sergiy-yevtushenko/how-architecture-emerges-2626fca4fe52
- **Day 1:** Yannick L. (IVP) reposted with theoretical-convergence endorsement + 3 Zenodo papers. LinkedIn: centralized-DB pushback (Galyen), praise (Bloch). Telegram architecture chat: three substantive critiques — **every one a module→article compression loss mapping to planned book content**: Vania Leyn (axes not atomic/independent → scope-composition, ledger discipline "values apply at demand scope" + new open question 7), Max Grom (5-of-11 SLO-heavy, QAW/ATAM undeveloped → inert-answers-are-results framing + the SEI-gap positioning above), Andrii Kurdiumov (wants money/maintenance-cost as first-class + social constraints → delta items 5 and the org-shape driver, both already planned). Critique-of-article = demand-for-book: the signal shape we wanted.

## Raw material inventory

- PFD module `book-pfd/architecture-synthesis.md` (skeleton + checklist of every promise the spiral deferred) and `book-pfd/brownfield.md` (transformation application, failure taxonomy).
- Edge-cases chapter debate corpus (Poltorak exchange) — adversarial worked examples.
- `project_quotable_lines.md` — marketing + chapter-opener lines (incl. "Phase-5 is selecting the restaurant; Phase-6 is selecting a meal from the menu").
- Consistency-lens skill text.
- Race Condition Theater demo (possible interactive companion; still gated on honesty/fidelity/attribution pass).
