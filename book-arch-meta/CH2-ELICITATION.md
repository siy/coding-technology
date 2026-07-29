# Ch. 2 material — The answer sheet: elicitation practice

*Consolidated 2026-07-11 from PROCESS-DESIGN (question-set audit 2026-07-07, entry gate, driver modes) + LEDGER v0.2 (demand shapes) + dry-run findings. The chapter's narrative beat is the audit itself: the questions were derived, not chosen.*

## The chapter's two jobs

1. Put the nine-question sheet in the reader's hands, organized **by driver mode** (what each question *does* in the derivation), not by topic category.
2. Teach the elicitation discipline that makes answers derivation-grade: **priced, scoped, shaped, decomposed**. The entry gate is parse-don't-validate for requirements — fake drivers die here, before they buy architecture.

## The audit as narrative (the "why these nine?" beat)

Open with Max Grom's question in the reader's mouth: *why exactly these?* Then the membership criterion: **a question earns its place iff its answer can press or prune at least one axis independently of every other question's answer.** Run the audit on stage:

- Two questions failed independence (peak load & scale-shape were never used separately in eight derivations) → merged into **Load**.
- One failed press-ability (mandates never pressed a Phase-5 axis across all eight; they bind Phase 6, entering Phase 5 only when striking a value outright — "no cloud" kills serverless) → merged into **External constraints**.
- Three passed separately but turned out to share one grammar → **the three budgets** (time / failure / loss): *"five turned out to be three budgets and a contract wearing different grammar."*

The eleven-question history stays honest: the articles and blind derivations ran with eleven; the audit is research working as research. *(Public-count ruling 2026-07-07 on record.)*

## The sheet, by driver mode

**Prune** (binary, correctness — can't buy back with hardware):
- **4 · Consistency contract** — per data class / path: strict, bounded (named bound), eventual; read-your-writes where?
- **3 · Loss budget** — per data class: RPO, retention, product-identity commitments.
- **6 · External constraints** — audit vs **replay** (distinct demands: the auditor's *what* vs the regulator's *why* — the discriminator that fired in three derivations); residency/sovereignty pins; mandates that strike values.
- **9 · Multi-X** — regions / tenants / versions: two outputs — partition *gifts* (a natural key is free sharding) and legal *pins*.

**Select** (continuous, presses only near the physics floor):
- **1 · Time budget** — per operation, **shaped**: percentiles, tails, soft maxima, completion *windows* (deadline shape, F7). The shape catalog doubles as a scope detector: a *hard* max as correctness criterion = the hard-real-time tripwire — out of the book's scope, by the module's own boundary, and the sheet must say so at elicitation time, not at derivation time.

**Isolate** (starts biting past ~99.9 on a named path):
- **2 · Failure budget** — per operation: error budget + criticality (Google CRE framing verbatim — the ch. 12 vocabulary seam closes here).

**Split** (presses only on divergence — uniform load presses nothing):
- **5 · Load** — magnitude (steady/peak), shape *per path* (read/write/event mix), concentration (uniform / bursty / **contended**), window. The shape vocabulary (LEDGER v0.2): volume, burst, contention, deadline — with the field discriminator *"would a second copy help?"*

**Bound** (the economic envelope everything optimizes inside):
- **8 · Cost & capacity envelope** — money + *who operates* ("4 engineers, no DevOps" is an answer that moves axes).
- **7 · Release structure** — cadence **divergence** + deploy safety. The count "deploys/day" pressed nothing in eight derivations; divergence pressed everything (F21: team size never presses topology — only cadence divergence does).

**The second row-source, outside the sheet by design:** domain-shape facts (F4) — does an inverse exist, does the value decay, can the operation be reshaped (idempotent / commutative / append-only)? They are Phase-1 output, not elicitation answers, and they alone drive the recovery axis. The book must say this explicitly or readers will hunt for a tenth question.

## The entry gate — answers are purchased and decomposed

**Priced.** *An SLO you haven't priced is a wish.* A nine has a price (ch. 5 is the price list: 99.99% = 52.6 min/year → name the on-call, the redundancy, the correlated-failure work — or lower the number). "Real-time" priced becomes "under 800 ms." The **fake-nines drill**: for every availability answer, ask what the business does in the minutes the budget allows — if the answer is "nothing changes," the nine is decoration and the real number is lower.

**Scoped.** Scope lives *in* the question (per operation / per data class / per path). One system-level number is the bare--ility trap; ban the bare words ("scalability" means nothing; "scaling shape of *which path* under *which load*" means everything). Bare means ban rides along (VOID convergence): a mean without a shape is not an answer.

**Decomposed.** Pressures decompose to mechanism level before they may press: "team independence" is not primitive — ownership boundaries (modules contain it, F2) ≠ release independence (a real topology driver). "We need audit" decomposes to audit-vs-replay before it may touch the storage axis (the trap that, undecomposed, buys event sourcing nobody demanded — F3). Decomposition is where most drivers turn out inert, and **inert answers are results**: they are what keeps the vector null and the system cheap.

**Triaged (two answer-shaped things that are not demands — F22/F23, from the Companies House blind run).** First, whose clock does a time answer bind? A statutory 14-day filing window or a 20-day FOI duty binds the *requester's* clock — a business-process deadline, inert for Phase 5 (it may become a path constraint in transformation). Only *system-clock* targets press. Second, observed failures are not stated targets: last quarter's outage is real signal about failure domains, but it is corroboration to log, never a priced demand that may press an axis — if the business wants it to press, it must come back as a number (a failure budget), which is the entry gate doing its job.

**Contradiction surfacing (early).** Opposite answers from different stakeholders at the same scope = a business decision wearing an engineering costume; the sheet forces it visible at elicitation, where renegotiation is cheap, instead of at derivation (ch. 8's menu) or in production.

## Practice assets (to draft at prose time)

- A filled example sheet (ticketing P2 fits in half a page) next to a *deliberately bad* sheet — same system, bare -ilities, unpriced nines, undecomposed "independence" — and the two vectors they'd buy. The delta *is* the chapter's argument.
- The worksheet (ch. 4 artifact) cross-reference: section 1 of `WORKSHEET.md` is this chapter compressed to a table.
- Elicitation dialogue fragments: the pricing move ("what happens in the 53rd minute?"), the decomposition move ("independent to *deploy*, or independent to *own*?"), the shape move ("is that 10⁵ per minute arriving evenly?").
