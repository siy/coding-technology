# Handover: Process-First Design Book

Handover document for the agent taking over authoring of the **Process-First Design (PFD)** book in this repository. Read this document first, then the linked spec and considerations, then the validation notes and source articles. Do not start drafting chapters before reading all of them and confirming the current state with the user.

---

## Status snapshot (2026-05-19) — STALE; superseded for current state

> ⚠️ **This status section is superseded by `HANDOVER-2026-05-28.md`** for where-we-are and what's-next. The whole spiral spine, Architecture Synthesis, Brownfield, and Closing are now drafted (the snapshot below predates all of that). The **durable reference sections of this document** (methodology framework, narrative threads, voice/tone, commitments) remain valid — read those for orientation; read `HANDOVER-2026-05-28.md` for current state.

### Original snapshot (2026-05-19) — spiral pedagogy adopted; Pass 1 substantively drafted

**Where we are.** Structural reframe to spiral pedagogy adopted 2026-05-17 (Theme 22). Spiral Pass 1 (use case altitude, event ticketing) drafted and iteratively refined through May 17-19 (~10+ user reviews on specific lines/sections). Pause point: ready for either (a) user re-read with voice doc in hand and targeted polish, or (b) continuing with Spiral Pass 2 (workflow altitude).

**Current book structure** (replaces the previous 26-chapter outline; old outline archived in `pfd-book-considerations.md` Theme 22):

- **Introduction** (~2K) — DRAFTED (~1.7K): thesis, compact convergence, five principles, running-example intro, reading guide
- **Spiral 0** (~1.5K) — DRAFTED (~1.5K): the decisions a use case forces, before any methodology (Theme 24 entry ramp)
- **Foundations** (~2.5K) — DRAFTED (~2.1K): methodology axioms (process-first core, six properties, four shapes + four enforcement levels, six patterns, telescope + change-driver cohesion + IVP citation, recovery triple)
- **Spiral Pass 1: Use case altitude** (~8K) — DRAFTED + refined (~8.4K)
- **Spiral Pass 2: Workflow altitude** (~8K) — DRAFTED + refined (~8.2K)
- **Spiral Pass 3: Subsystem altitude** (~5K) — DRAFTED + refined (~4.9K)
- **Spiral Pass 4: System altitude** (~3K) — DRAFTED + refined (~2.7K); spiral spine complete
- **Architecture Synthesis module** (~12K) — not yet drafted; the hourglass payoff (agenda = the deferred-decision inventory in spec)
- **Brownfield module** (~8-9K) — not yet drafted
- **Closing** (~3K) — not yet drafted; carries the reflexive taper-proof

Total target ~50-60K words (provisional; front matter + spiral spine drafted at ~29.5K — lighter than the prior ~70-80K because front matter and upper passes came in compact, the taper applying to front matter too). Architecture Synthesis is the swing factor; reconcile once it lands. Bands, not mandates.

**Title locked.** Working title: *Process-First Design*. Working subtitle: ***Less art, more engineering*** (revised 2026-05-17, replacing "Leveraging the Semantic Potential of Types and Patterns"; Jackson's "semantic potential" credit preserved in body content and front matter).

**Running example locked.** Event ticketing, throughout the spiral. Vocabulary captured in `pfd-example-glossary.md`.

**v1 chapters archived.** Introduction + Ch1-9 from the previous 26-chapter outline moved to `book-pfd/archive-v1/` 2026-05-17. Repurposable source material — Ch7/Ch8/Ch9 mostly survive as Foundations content; Ch1/Ch5/Ch6 partially survive as introduction material; Ch2/Ch3/Ch4 are candidates for why-interludes if those ship.

### Conventions established / refined this session

These are now in working specs; future drafting must honor them.

- **Code notation** (`pfd-book-spec.md` "Code Notation Conventions" section):
  - Java-style syntax in code examples (audience is predominantly Java).
  - **Single-parameter `Result<T>`** — failure variants populate failure branch as typed values.
  - **`Promise<T>` carries failure modality** — no `Promise<Result<T>>`.
  - **I/O is asynchronous** — any use case with I/O returns `Promise<T>` even with synchronous trigger.
  - **Never `Void`** — use `Unit` (`Result<Unit>`, `Promise<Unit>`).
  - **Fluent failures**: `cause.result()` / `cause.promise()` (never `Result.failure(...)` or `throw`).
  - **Factory naming**: `TypeName.typeName(...)` (lowercase first letter); non-public constructor + static factory returning `Result<T>`.
  - **Failure types** as sealed interface extending `Cause`; nested enum (`General`) for fixed-message variants, nested records for variants with data.
  - **Step interfaces** as single-method nested interfaces inside the use case (`interface ReserveSeat { Promise<Reservation> apply(ValidRequest valid); }`).
  - **Method references** preferred over forwarding lambdas (`.flatMap(reserveSeat::apply)`, not `.flatMap(req -> reserveSeat.apply(req))`).
  - **No multi-statement lambdas** in monadic operations — extract to named method.
  - **No `*Impl` classes** — lambdas for behavior, records for data.
  - **Inline aggregator arguments** — `Promise.all(...)`, `Result.all(...)` take arguments inline; avoid intermediate variables that merely echo what the underlying call says.
  - **Lambda syntax**: `->` not `→`; `var` not `val`; semicolons; record accessors as method calls.

- **Type naming convention** (codified in `pfd-example-glossary.md`):
  - Use case types nested under the use case: `BuyTicket.Request`, `BuyTicket.Response`, `BuyTicket.Failure`, `BuyTicket.ValidRequest`.
  - **`Valid` prefix, not `Validated`** — state, not history.
  - Per-process types as concept + process-aspect: `SeatLocation`, `SeatAvailability`, `SeatPricing`.
  - Failure variants named for domain fact: `PaymentDeclined`, not `PaymentException`.

- **Domain vocabulary discipline**: stay inside the running example's vocabulary. Event ticketing uses seats, tickets, holds, reservations — do not borrow generic e-commerce language (stock, items) when illustrating with this example.

- **Time types by domain semantic**: `ZonedDateTime` where local-zone semantics matter (event start time — what was sold, what survives DST); `Instant` where only moment matters (hold expiration — no local-zone meaning). Type chosen per domain meaning, not blanket rule.

- **Forbidden terminology** (`pfd-book-voice.md` Section 4 + review checklist):
  - **"Non-functional requirements" / "NFR" / variants** — strictly forbidden.
  - **"System-level requirements" / "system-input requirements"** — superseded.
  - Use **"quality requirements"** or **"system qualities"** (interchangeable umbrella terms). At Phase-4 detail use specific terms: SLO, constraint, operational target, substrate-shaping requirement.

- **Phase vs altitude distinction**:
  - **Altitude** = compositional scale (use case → workflow → subsystem → system). Same vocabulary at each scale.
  - **Phase** = procedural stage (design → assembly → elicitation → architecture synthesis → technology selection).
  - Do not conflate. Performance vs process-simplicity is resolved by phase separation (Phase 1 design vs Phase 5 architecture synthesis), not by altitude.

- **Citation conventions** (`pfd-book-spec.md` "Citation Conventions" section):
  - **Stage 1 (drafting)**: inline Markdown links or "Author (Year)" at first mention per chapter.
  - **Stage 2 (consolidation sweep)**: convert to dedicated References section + footnote markers + acknowledgments before publication.
  - **Tracking working spec**: `pfd-book-references.md` to be created when first 5-10 references accumulate (not yet created — Pass 1 has one citation, Alexis King "Parse, Don't Validate" 2019).

- **Voice constraints** (`pfd-book-voice.md`, 11 sections):
  - Tempo target: cover-to-cover in one sitting (5-8 hours).
  - Tonal anchor: uniform commitment, varied form; no hedge-without-warrant; definite verbs; position-mode not survey-mode.
  - Three-layer model: surface self-sufficient; second-layer in named devices (sidebars, threads-advanced tags); third-layer optional.
  - Spiral-pass discipline (Section 5): walk-and-surface, not argue-then-conclude; opening states multiplicity that earned this altitude; closing names multiplicity that earns next altitude.
  - AI-tells discipline (Section 6): em-dash budget (≤2 per paragraph); methodology trios preserved, decorative trios varied; load-bearing causal pivots stay, rhetorical pivots cut; bridge-skipping audited; sterility remediation via commitment density (not anecdote injection).
  - Forbidden terminology, anti-patterns, drift detection, per-chapter review checklist (Section 9).

### Source of truth (oss/content/)

When instructions conflict, follow this order:

1. This handover (orientation + current state)
2. `pfd-book-spec.md` (structural working agreement + Code Notation + Citation Conventions + Methodology Framework + Risks + Preconditions + Structure)
3. `pfd-book-voice.md` (prose-discipline working agreement)
4. `pfd-example-glossary.md` (running-example vocabulary + JBCT structural conventions)
5. `pfd-book-considerations.md` (active iteration — Themes 1-23)
6. `pfd-validation-notes.md` (empirical findings)
7. Source articles
8. Author's direct instructions in-session

### Latest themes worth knowing (in considerations.md)

- **Theme 21 (2026-05-16)**: Round-3-followup review pass on v1 chapters — applied items, deferred items, rejected items. Mostly superseded by Theme 22 reframe, but content decisions (Ch6 counter-current section, Ch8 four-way enforcement, etc.) propagate as repurposable material.
- **Theme 22 (2026-05-17)**: Structural reframe to spiral pedagogy. Rationale, alternatives surveyed, archived 26-chapter outline preserved, why-interlude decision deferred.
- **Theme 23 (2026-05-19)**: CodersWorld Medium thread analysis. Four objections worth addressing in the book (abstraction-tax, hygiene-maintenance, multi-senior-engineer-divergence, performance-vs-process-simplicity), framings worth lifting ("cognitive sustainability," "operational reasoning," "abstraction surface"), 350KLoC empirical anchor (Aether-adjacent — careful framing per no-product-pitch constraint).

### Pass 1 specifics (`book-pfd/spiral-1-use-case.md`, ~7,400 words)

**Structure (9 sections):**

1. What this pass does
2. The use case, opened (six properties: trigger, typed input, typed output, typed failures, steps, dependencies)
3. Per-process types: where the methodology earns its first concrete commitment
4. Composition: the six patterns at use-case altitude
5. The four shapes earn their place
6. Recovery: BER applies cleanly at this altitude
7. Architecture surfaces at this altitude
8. Closing — multiplicity is coming

**Key content decisions:**

- **buyTicket signature**: `Promise<BuyTicket.Response> buyTicket(BuyTicket.Request request)` — I/O-is-async rule applied.
- **Per-process types**: `BuyTicket.Request`, `BuyTicket.Response`, `BuyTicket.Failure` (with six variants: PaymentDeclined, SeatUnavailable, EventNotSelling, CustomerIneligible, PaymentProviderUnavailable, ConcurrentBooking), `BuyTicket.ValidRequest`. Plus per-process Seat types (`SeatLocation`, `SeatAvailability`, `SeatPricing`).
- **Shared value objects**: CustomerId, EventId, SeatId, TicketId, ReceiptId, Money, PriceTier (premium/standard/economy/accessible/restricted-view), SectionId, RowId, SeatNumber, AvailabilityStatus, NotificationChannel.
- **Six properties walked** through `buy ticket` step by step. Eight steps: validate, check event selling, check customer eligibility, reserve seat, authorize payment, confirm seat, issue ticket, notify customer.
- **Six patterns**: Sequencer (strong), Leaf (frequent, defined as either boundary crossing OR pure computation), Fork-Join (once, using `Promise.all`), Condition (rare in buy ticket; framed as branching on business decision; examples include event sale type, discount tiers, promo codes, group discounts; never on success/failure), Iteration (absent in buy ticket but domain-shape-dependent; multi-item use cases iterate naturally), Aspects (runtime).
- **Four shapes**: T (unconditional), Option (`holdExpiresAt: Option<Instant>`), Result (sync may-fail), Promise (async with baked-in failure). Deliberate `ZonedDateTime` vs `Instant` choice illustrated (eventStartsAt vs holdExpiresAt).
- **Recovery**: BER for failures with mechanical inverses; design-out via reservation model preventing concurrent-booking conflicts; FER not yet earned at this altitude.
- **Architecture surfaces**: per-use-case SLOs (latency, throughput, availability) named; persistence topology, deployment topology, cross-process consistency, composition substrate explicitly deferred to Architecture Synthesis module.
- **Citation**: Alexis King "Parse, Don't Validate" (2019) linked at first mention in Dependencies bullet.

**Iteratively refined through user reviews May 17-19** — significant items:
- ZonedDateTime vs Instant choice for time fields (domain semantics)
- Result/Promise correctness (single-param Result; Promise bakes failure; I/O is async)
- Method references over forwarding lambdas
- Nested type naming (`BuyTicket.X` namespace; `Valid` not `Validated`)
- Factory pattern + Cause framing for JBCT alignment
- Condition reframed from success/failure to business decision (with concrete examples: event sale type, discount tiers, promo codes, group discounts)
- Leaf broadened: boundary crossing OR pure computation
- Iteration corrected: not altitude-restricted, depends on use case shape
- Fare category → price tier (event ticketing vocabulary, not transit vocabulary)
- "Price seat" process renamed to "Quote a price for a seat" for clearer customer-facing framing
- Domain vocabulary discipline applied (don't mix "stock" language with event-ticketing examples)
- Inline aggregator arguments (no intermediate `var sellingCheck = ...` echoing the call)

### Outstanding decisions / open items

1. **Pass 1 disposition.** User indicated planning to re-read with voice doc in hand. Voice diagnostic was produced (em-dash density, pivot density, trio density per chapter — applies to v1 chapters; not yet repeated for Pass 1). Pass 1 has likely accumulated some voice debt during 10+ rounds of focused iteration; one continuous re-read may surface paragraphs to polish. Not yet acted on.

2. **Use case interface structure decision** (deferred from Pass 1 drafting). Three options:
   - **Option A** — Pass 1 keeps freestanding-function signature notation (`Promise<BuyTicket.Response> buyTicket(BuyTicket.Request request)`); full JBCT `interface BuyTicket extends UseCase.WithPromise<Response, Request>` structure lives in glossary only.
   - **Option B** — show full JBCT interface structure in Pass 1 itself.
   - **Option C** — Pass 1 stays signature-level + one sidebar showing full structure for readers who want it.
   - Decision pending. Glossary's "JBCT Structural Conventions" section has the canonical reference if Option A or C wins.

3. **Why-interludes between spiral passes**: deferred per Theme 22. Decide after spiral spine complete.

4. **References file**: create `pfd-book-references.md` when first 5-10 citations accumulate. Currently only one (King 2019). Defer.

5. **Forward references in Pass 1**: some passages reference Foundations as if it exists ("the Foundations section named four enforcement levels," etc.). When Foundations is drafted, these become real forward links; until then, they're aspirational. Pass 1 has been corrected where it was awkward (the "construction enforces" passage now backward-references with "mentioned above" instead of forward-referencing). Other forward references may need similar handling depending on draft order.

6. **Aether-adjacent 350KLoC empirical anchor** (from Theme 23): worth citing in Pass 4 or closing chapter, but careful framing needed per no-Aether-product-pitch voice constraint. Cite the technical achievement (350KLoC + solo-dev + AI maintainable) without promoting the platform.

### Next concrete steps (suggested order)

1. **User re-reads Pass 1 from scratch** with voice doc in hand; flags any sections that drift from voice or where iteration has accumulated awkwardness.
2. **Targeted polish pass** on whatever user flags. Keep within voice budget (em-dash ≤2/paragraph, no decorative trios, etc.).
3. **Decide use case interface structure option** (A / B / C above).
4. **Begin Spiral Pass 2 (workflow altitude)** — new file `book-pfd/spiral-2-workflow.md`. Pass 2's opening depends on Pass 1's closing as natural emergence: workflows from use case multiplicity. Sequential drafting required. Expected content: booking-and-payment workflow, cancellation-and-refund workflow, temporary-hold workflow; Iteration earns more visibility; compensation derivation surfaces; time-as-decay enters as first-class concern; saga recognized as composite (state-machine variant of Condition + Sequencer + compensation Aspect).
5. **Continue with Pass 3 (subsystem altitude)** — Pass 3's opening depends on Pass 2's closing.
6. **Pass 4 (system altitude)** — Pass 4's opening depends on Pass 3's closing.
7. **Foundations + Introduction** drafted after spiral spine is proven (voice + density calibrated by then).
8. **Architecture Synthesis + Brownfield modules** can be drafted in parallel with later spiral passes. Architecture Synthesis specifically needs to address the performance-vs-process-simplicity objection (Theme 23 item 4) — the legitimate tradeoff CodersWorld surfaced; book's answer is the design/architecture-phase separation.
9. **Closing** last.

### For next session, start here

1. Read this status snapshot.
2. Read the source-of-truth docs (oss/content/), especially:
   - `pfd-book-spec.md` (structure, Code Notation Conventions, Citation Conventions, Methodology Framework)
   - `pfd-book-voice.md` (prose discipline, Section 5 spiral-pass discipline, Section 9 review checklist)
   - `pfd-example-glossary.md` (running-example vocabulary, JBCT structural conventions)
3. Read the current Pass 1 draft: `coding-technology/book-pfd/spiral-1-use-case.md`.
4. Check `pfd-book-considerations.md` Themes 21, 22, 23 for recent context.
5. Confirm with user where to pick up.

---

## Historical context (pre-spiral structure)

The following sections capture the methodology framework and decisions from Round 1, Round 2, and Round 3 (closed 2026-05-03 before the 2026-05-17 spiral reframe). The methodology content remains accurate; only the book's *structure* changed in the reframe (26 chapters → spiral pedagogy). Read for context on how the methodology framework was established.

- **Round 2 (closed 2026-04-29):** all 10 validation gaps closed or substantially covered
- **Round 3 (closed 2026-05-03):**
  - 4th + 5th authorial principles promoted
  - Two new narrative threads (#14 telescope, #15 standardization)
  - New canonical Methodology Framework section in spec
  - Article-reuse-map updated with three warm-up articles
  - Differentiation extended; Risks-and-Mitigations augmented with three Round-2-and-3 objections
  - **Chapter restructuring complete (then superseded 2026-05-17 by spiral reframe).** The 26-chapter outline is archived in considerations.md Theme 22.
- **Operational preconditions resolved 2026-05-03:**
  - Time allocation: **mixed mode** (background-task + dedicated sprints; user wants more time on book)
  - JBCT overlap re-verification: **complete** — PFD references JBCT for Java-specific implementation across multiple sections; JBCT Cross-Reference Map section in spec
  - Publication mechanism: **local builds (PDF/EPUB)** mirroring JBCT book — Leanpub dropped; `book-pfd/` directory at `coding-technology/` repo root
  - Case studies: **resolved via Theme 20** — five public cases (Google, Stripe, Spotify, Shopify, Uber-as-cautionary) + three supporting (HP LaserJet, Auto Trader UK, Funda) + 3-part organizing pattern. Anecdotal case retired.
- **Articles published / in queue:** "Saga Is Not a Pattern" (Medium 2026-04-27); "Software's Industrialization Moment" (dev.to + Medium 2026-05-02); "Scaling Methodology: from ToDo App to Enterprise" (drafted, pending publication); planned: "What Benefits Humans Benefits AI", fractal-validation-receipts, possibly "Where Temporal Fits", possibly "The Compiler as a Participant" (per Theme 21 D5).

---

## What This Project Is

A new, separate book titled **Process-First Design**, subtitle **Leveraging the Semantic Potential of Types and Patterns**. It sits **above** the existing JBCT book (in `book/`). Not a replacement. Not a rewrite. A different altitude.

**Relationship to the existing JBCT book:**
- **PFD book** = the *why* at the methodology layer. Language-neutral. Industry framing, convergence evidence, principles, patterns, adoption.
- **Existing JBCT book** = the *how* for Java. Language-specific, Pragmatica Core APIs, implementation detail.
- Analogy: "We Should Write Java Code Differently" is to PFJ as PFD is to JBCT. High-level *why* vs concrete *how*.
- The two books **refer to each other** at appropriate points but do not duplicate content. Readers can adopt PFD principles in Scala, Kotlin, Rust, C#, TypeScript without opening the JBCT book; JBCT is one implementation shortcut for Java teams.

**Scope discipline (load-bearing):** PFD inherits JBCT's bounded scope — enterprise backend applications, primarily Java but methodology applies more broadly. **PFD does not claim universal applicability beyond enterprise backend.** Avoiding the universal-claim trap is what allowed JBCT to ship; PFD inherits this discipline.

**Where the PFD book lives in this repo:** create a new directory `book-pfd/` at the repo root (sibling to `book/`) when chapter drafting begins. Use the same naming convention (`ch01-introduction.md`, `ch02-...`, etc.). Maintain build scripts analogous to the JBCT book's `build-epub.sh` and `build-pdf.sh` when you reach that stage.

---

## Read These Files in This Order

1. **This handover** (`HANDOVER-PFD-BOOK.md`) — orientation and current state.

2. **`/Users/sergiyyevtushenko/IdeaProjects/oss/content/pfd-book-spec.md`** — the book specification. Title, thesis, authorial principles, 13 narrative threads, 5-part / 24-chapter structure, per-chapter word targets, article reuse map, publication schedule, risks, preconditions. **This is the working agreement** — what's decided.

3. **`/Users/sergiyyevtushenko/IdeaProjects/oss/content/pfd-book-considerations.md`** — raw methodology iteration. 17 themes covering vocabulary, fractal composition, recovery classes, emergence-first principle, anti-patterns chapter, JBCT update items, etc. **This is what's being refined**, not yet decided.

4. **`/Users/sergiyyevtushenko/IdeaProjects/oss/content/pfd-book-voice.md`** — prose discipline working agreement. Tempo (cover-to-cover in one sitting), tonal anchor (uniform commitment, varied form), three-layer model (surface / second / third), pattern discipline against AI tells (em-dash budget, trio audit, causal-pivot distinction), per-chapter review checklist, drift detection. **This is how the prose stays consistent across chapters and revisions.**

5. **`/Users/sergiyyevtushenko/IdeaProjects/oss/content/pfd-example-glossary.md`** — running example (event ticketing) vocabulary. Names, types, domain concepts, naming conventions. **Reference during drafting to keep vocabulary consistent across spiral passes.** Updated incrementally as new passes are drafted.

6. **`/Users/sergiyyevtushenko/IdeaProjects/oss/content/pfd-validation-notes.md`** — 10-gap workplan with Round 1 substantial progress. **This is the empirical and analytical work** behind the methodology framework's current state.

7. **`/Users/sergiyyevtushenko/IdeaProjects/oss/content/article-index.md`** — the article canon with verified URLs on Dev.to and Medium. Use these URLs when citing.

8. **The source articles.** Nine published on Medium+Dev.to, one on LinkedIn only. Read source articles when seeding chapters.

---

## Round 1 Validation State (2026-04-26)

The methodology was validated across ten gap areas before chapter drafting begins. Current state:

| Gap | Status |
|---|---|
| 1 — Multi-domain examples (Cargo, RealWorld, Ecommerce + jbct-loan) | **Substantially covered** |
| 2 — Workflow-altitude examples + vocabulary refinement | **Substantially covered** |
| 3 — Compensation/saga derivation mechanics | **Closed (Round 2, 2026-04-28)** |
| 4 — System-altitude examples (ecommerce subagent walk) | **Substantially covered** |
| 5 — Phase-4 elicitation (SLOs, constraints, operational targets) | **Closed (Round 2, 2026-04-28)** |
| 6 — Phase-5 architecture selection (axis-vector framing) | **Closed (Round 2, 2026-04-28)** |
| 7 — Architecture transformations (continuous, brownfield) | **Closed (Round 2, 2026-04-29)** |
| 8 — Fractal validation (multi-domain × multi-altitude) | **Substantially covered (Outcome A confirmed empirically)** |
| 9 — AI-era treatment (Thread #4) | **Substantially covered** |
| 10 — Organizational implications (Ch22 depth) | **Substantially covered** |

**Round 2 complete (2026-04-29).** All 10 gaps closed or substantially covered. Methodology framework is stable enough for chapter drafting pending user authorization.

**Round-3-followup considerations** (post-2026-05-03 review pass) captured in Theme 21 of `pfd-book-considerations.md`. Includes applied items now in spec, deferred items, and rejected items with rationale.

---

## Methodology Framework (current state)

These are decisions made or refined during Round 1. Most are captured in `pfd-book-considerations.md` themes (cited where relevant); this section is the synthesis.

### Vocabulary (Theme 2)

Six-altitude ladder (telescopes; emerges from multiplicity, not imposition):

- **Step** — atomic transformation OR composed sub-steps recursively (within-altitude fractal at this level)
- **Use case** — atomic business operation; one trigger → one outcome; signature `Request → Result<Response>` or `Promise<...>`
- **Workflow** — composition of use cases for one discrete business outcome
- **Subsystem** — coherent business concern; group of related workflows
- **System** — composition of subsystems + business cross-cutting
- **Enterprise** — federation of systems + organization-level concerns

"Slice" dropped in favor of "use case" (use case = function = deployable unit).

"Process" preserved as philosophical stance (worldview) but minimized as working term in chapter text. Use case / workflow / system / etc. carry the precise meaning.

### Six patterns (verified Outcome A across 6 real codebases — Gap 8)

Composition primitives at every altitude: **Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects.** Frequencies vary by altitude and domain; applicability is universal.

### Four shapes (type-honest)

`T`, `Option<T>`, `Result<T>`, `Promise<T>`. Async-ness emerges from leaves (any I/O → Promise propagates); not a stylistic choice.

### DDG operators

Sequential, ALL, ANY — for data dependency analysis at use-case altitude. Open work item: DDG clarification stage (how to specify what we need to know to *request* information; Theme 13).

### Telescopic evolution (Theme 3, load-bearing)

Altitudes emerge from multiplicity; methodology lets emergence happen, neither forces nor resists. Same six patterns at every altitude (fractal property — Outcome A confirmed). Telescope can collapse; transformations are continuous (architecture as a derivative, not a state — Theme 7).

### Resources as substrate (Q4 of Gap 2)

External trigger sources are uniform resources: HTTP, scheduler, event bus, message queue, human approval system, sensor. Each invokes a typed method when its trigger fires; the method is a use case. Same pattern; what looks like new primitives (temporal, event-driven, human-in-loop) reduces to resource-driven trigger.

### Recovery class triple (Theme 15, Gap 3 — closed Round 2)

Three responses to invalidation:
- **BER (Backward Error Recovery)** — compensate via inverse action (saga, rollback, RAII)
- **FER (Forward Error Recovery)** — continue with degraded state (defaults, ECC, self-stabilization)
- **Design-out** — alter data/convergence model so compensation unnecessary (CRDT, idempotence, immutability)

Most software discourse covers only BER. Methodology surfaces all three.

**Round 2 closure additions (full detail in `pfd-validation-notes.md` Gap 3):**

- **Compensation derivation split**: derivable-mechanically (inverse stays inside step's own domain — insert/delete, reserve/release, post/reverse-entry) vs designed-per-case (effect escapes domain — send-email, charge-card, ship-package; inverse is itself a workflow). Residuals (refund money, can't refund time) surfaced explicitly during Phase-2 derivation; no separate "partial inverse" label.
- **Recovery class selection axes** (judgment dimensions, not flowchart): reversibility, forward-progress value, domain shape, coordination cost. Mixed strategies normal — BER for money flows, FER for telemetry, design-out for collaborative state.
- **Saga altitude-pinned**: `Saga = BER applied at workflow altitude across autonomous subsystems with no shared transactional substrate, where each forward step's inverse is itself a use case.` Higher-altitude saga-shapes are compositions of sagas, different beast.
- **Time-decay claimed as PFD-original FER contribution**: distinguishes time-as-trigger (BER, scheduler-fired compensation; jbct-loan offer expiry), time-as-condition (boundary check; cargo delivery window), time-as-decay (FER, continuous degradation through `fresh → stale → expired`; ecommerce price freshness). Time-as-decay has no widely cited treatment in literature; PFD names it.

### Saga reduces (Gap 8 cross-finding)

Saga = state machine variant of Condition + Sequencer + compensation Aspect (or audit-as-data). Not a primitive; a recognizable composite. Decomposition is article material (see article warm-up plan).

**Pre-emption strategy for the spicy reductions** (saga, state machine as Condition variant, audit-as-data alternative):

- **State machine as Condition variant** — name it precisely; not demoted, named. Cite established uses of typed state (UML statecharts Harel 1987; Erlang/OTP supervisor strategies). Methodology recognizes existing structure rather than reframing.
- **Saga as composite** — historical depth (Pacioli → Anderson & Lee → Garcia-Molina/Salem) locates saga in lineage; decomposition shown so each component is recognizable; four qualifiers explicitly say *when* saga is the right composite. Locating, not denigrating.
- **Audit-as-data** — alternative, not demotion. Two design paths; readers pick by context. Quality move; matches show-don't-claim principle. Worth elevating to **named pattern pair**: audit-as-data vs audit-as-Aspect. Sidebar in patterns chapter or Named Composite Patterns chapter (Theme 14).

**The "Saga Is Not a Pattern" article publishes the saga reduction as public pre-emption test.** Article validates framing in conversation before book commits. If pushback is productive, fold into book. If unproductive heat, sharpen framing first. Cheaper than book-stage rework.

### Business vs technical cross-cutting (refined Theme 2)

Binary at design altitude:
- **Business cross-cutting** — there is a business requirement (regulatory, contractual, compliance). System implements as part of business behavior.
- **Technical cross-cutting** — implementation/instrumentation (observability, retries, correlation IDs). Runtime/platform supplies uniformly.

Audit-as-data is a legitimate alternative to Aspect-based audit (loan domain example).

### Six-phase methodology (Theme 1)

Hypothesized; partially validated:
1. Use case design (existing PFD/JBCT scope)
2. Workflow assembly (Gap 2)
3. System assembly (Gap 4)
4. Phase-4 elicitation — SLOs, constraints, operational targets (Gap 5; in progress)
5. Architecture selection — axis-vector reframing (Gap 6; in progress)
6. Synthesis to concrete deployables

Phases 1-3 and 6 deterministic; Phases 4-5 elicitation + matching (judgment-required).

**Phase-4 minimal set (Gap 5 — closed Round 2):** 11 questions across 4 categories — SLO (latency, throughput, availability, consistency, durability), Constraint (compliance, tech mandates), Operational target (deploy frequency, cost shape), Substrate-shaping (multi-X dimensions, scale shape). Substrate-shaping is first-class — partitions data and shapes substrate; not collapsible into Constraint. Trigger source belongs to Phase-1, not Phase-4. Phase-1 / Phase-4 iteration is targeted-insertion (new use cases surfaced at Phase-4 fold back into Phase-1 for that use case only). **Answers attach at three scopes:** per use case (latency, throughput, availability), per data class (consistency, durability), per domain (compliance, tech mandates, deploy frequency, cost shape, multi-X, scale shape). Walkthroughs on cargo + ecommerce completed without stalls.

### Axis-vector Phase-5 framing (Gap 6 — closed Round 2)

Architecture selection isn't picking from a list; it's a vector across six orthogonal axes:
- Deployment topology (single deployable / multiple deployables / unified runtime / serverless / hybrid)
- Composition substrate (sync calls / async events / streaming / mixed)
- Read/write model (unified / CQRS-separated)
- State storage (current-state / event-sourced / hybrid)
- **Persistence layer configuration** (single shared / distributed shared / sharded shared / per-component / polyglot / hybrid) — added Round 2; distributed shared captures NewSQL (Yugabyte, CockroachDB, Spanner, TiDB)
- Recovery class (BER / FER / design-out / mixed)

Hexagonal dropped from catalog (composition style, not architecture). Unified runtime added (Aether is one instance; Erlang/OTP, Akka, Orleans, Dapr also instances). Modulith vs microservices recognized as architectural styles within deployment-topology axis.

**Selection mechanism (Round 2):** half-structured + walkthroughs. Each axis gets 3–4 selection heuristics anchored in Phase-4 inputs; walkthroughs demonstrate coherent vector formation under representative profiles. Methodology stance (user phrasing): *"Show thought process, give reader a tool to build own thought process, let them make own decision."* Decision trees per axis rejected (becomes recipe, misses interactions); compatibility matrix rejected (combinatorial, brittle).

**Phase-5 / Phase-6 boundary (Round 2):** Phase-5 picks axis vector; Phase-6 picks concrete technology. Analogy (user phrasing): *"Phase-5 is selecting the restaurant; Phase-6 is selecting a meal from the menu."* Some axis values describe properties supplied by recognized product classes (e.g., "unified runtime", "distributed shared store") — wrinkle acknowledged in chapter text; boundary holds.

**Walkthrough plan (Round 2):** same domain (cargo), three Phase-4 profiles (startup / mid-stage / enterprise carrier). Demonstrates Phase-4-deltas-drive-Phase-5-deltas without confounding domain effects. **Directive: avoid domain→scale coupling in walkthrough examples** — methodology must not bake "cargo is for enterprises, url-shortener is for startups" assumptions into examples.

**Anti-Patterns chapter:** deferred. Anti-patterns surface as walkthrough contrast cases ("here's what we avoided and why"), not as a pre-emptive prohibition chapter. Decision deferred to Round 3 — chapter committed only if 6+ recurring incoherent vectors emerge from walkthroughs.

### Continuous transformation (Gap 7 — closed Round 2)

Architecture is a derivative, not a state. *"Transformations never stop because system is a living organism"* (user, 2026-04-26). Methodology produces *next-correct-step* recommendations, not target-state migration plans. Coherent at multi-dimensional level (technical + business + organizational).

**Round 2 closure additions:**

- **All transformations are Phase-4-driven.** Driver categories describe where Phase-4 changes come from (external change, telescoping, internal discovery, organizational change), not different methodology procedures. Round-2 walkthrough confirmed organizational changes decompose cleanly into Phase-4 deltas (deploy frequency #8 with per-subsystem cardinality + tech mandates #7 expanded to per-team operational capacity).
- **Audit-phase entry path** for always-was-wrong (internal discovery): Phase-4 11-question minimal set is the audit's lens; bound the audit to the trigger that surfaced the discovery (not "audit everything at once"); explicitly steer away from the "rewrite everything" reflex. No structural mechanics beyond that.
- **Six cost/risk indicators** methodology produces (qualitative, no numerical scores): reversibility cost, intermediate-state feasibility, coupling cost, transition duration, dependency cost, failure-mode amplification.
- **Five methodology failure modes** named: Phase-4 contradictions, vector infeasibility, trapped state, knowledge gap, unexplored territory (PFD bounded to enterprise backend; reader proceeds at own judgment outside scope — reframe rejects gatekeeping tone).
- **Staging emerges from continuous next-correct-step.** Staged transformations (e.g., shared DB → per-service DB → independent services) are visible trajectories of continuous adjustment, not pre-planned multi-step migrations.
- **Hybrid V₁ vectors are normal.** Cargo walkthroughs show only the smallest transformation produces a uniform vector; mid-stage and enterprise transitions produce intrinsically hybrid vectors across axes.

### Emergence-first research methodology (Theme 16)

The methodology's emergence principle applies to research itself. Patterns, architectures, and methodology refinements emerge from real derivation across real domains; literature cross-reference is *curiosity*, not validation foundation. JBCT-BPMN convergence (six patterns paralleling BPMN constructs) is precedent: derive first, recognize second.

### "What benefits humans benefits AI" (Gap 9)

Methodology designed for human comprehension and predictability; AI compatibility is downstream consequence, not engineering target. Standardization, unification, simplification are human-friendly properties; AI inherits because AI faces analogous constraints.

Cognitive Load Theory (Sweller 1988; Skelton/Pais 2019) is the unifying empirical anchor.

### Organizational implications (Gap 10, empirically grounded)

Five claims with empirical strength:
- **Process-clustering → team boundaries** — strongest support (Conway 1968 mirroring; MacCormack/Rusnak/Baldwin 2012; Nagappan/Murphy/Basili 2008 Microsoft Vista predictors)
- **Conway's Law inversion (methodology-first)** — solid (Team Topologies, Accelerate empirical, documented failure modes argue *for* methodology-first)
- **Career as scope expansion** — mixed support (industry practice aligns; fractal-vocabulary aspiration exceeds documented evidence)
- **Liquid work allocation** — most contested (stable teams normally win; standardized vocabulary is the precondition fluid-teams literature names)
- **Domain-based hiring** — weakest empirical support (no longitudinal hire-outcome study)

Honest non-findings disclosed in Ch22.

---

## Authorial Principles (load-bearing — set in introduction, enforced throughout)

1. **Legibility first.** Code optimized for the reader. Every structural choice is a concession to the future reader. Rebuts brevity objections: extra words that aid the reader are purchased legibility, not ceremony.

2. **Show possibilities, don't make claims.** Describe properties. Demonstrate with examples. Never promise compliance-readiness, productivity multipliers, or bug reductions. Readers map possibilities to their own situations. Where data is absent, say so explicitly.

3. **More time for the interesting work.** The structural discipline offloads mechanical work so human attention moves up to architecture and domain judgment. Most developers want more architecture time; PFD is how to get it.

4. **Methodology fits the work, not the reverse.** Vocabulary scales with complexity. Trivial code stays trivial; methodology earns its weight at the scale where complexity demands it. Pattern vocabulary is a tool, not a recipe. Same principle applies at altitude (telescoping): altitudes emerge from multiplicity, neither forced nor resisted. (Promoted from Round 1 validation finding — empirical observation under downward-test conditions during Gap 8 fractal analysis.)

---

## Voice and Tone

- **Research-cited with sharp punchlines.** Model: *Accelerate*. Hard data, respectful framing, occasional one-liners.
- **Industry critique honest but not polemic.** "Here's what the last decade taught us" beats "you were all wrong."
- **Never name competitors or competing products by name** in publishable content. This applies to both individual frameworks (no "Spring" / "Quarkus" framing against each other) and individual practitioner criticism (no naming people to criticize). Named references only when crediting positively.
- **No Aether product pitch** in the PFD book. PFD is methodology, Aether is platform. They connect but don't share marketing space.
- **No Pragmatica Labs marketing copy.** A single closing pointer to pragmaticalabs.io in the back matter is fine.

---

## Content Boundaries

- **No effect-systems deep dive.** Keep the comparison at "most functional styles express structure implicitly through combinators; PFD names the shape first." Do not dive into ZIO / Cats Effect / monad transformers comparisons.
- **No "linear complexity" claims.** The defensible claim is **compositional complexity** — each feature adds its own complexity without multiplying existing.
- **Specific features don't get wrapped in containers when they cannot fail.** The `T` baseline is real. `Result<T>` for a total function is ceremony without payload.
- **No DDD / Clean Architecture comparison** (Theme 12). Comparisons don't strengthen methodology; they invite criticism. Present positively.
- **"Non-functional requirements" is strictly forbidden** (refined 2026-05-19, supersedes 2026-04-26 directive). Use "quality requirements" or "system qualities" (interchangeable) as the umbrella terms. At Phase-4 detail, use specific terms: SLOs, constraints, operational targets, substrate-shaping requirements. Never use "non-functional," "non-functional requirements," "NFR," or any variant.

---

## Narrative Threads (13 — referenced per chapter)

Every chapter should list which threads it advances. Drift is visible immediately this way.

1. Compositional complexity
2. Deterministic rules
3. Industrialization / streamlining
4. AI-era coding (commoditized mechanical work)
5. Legibility asymmetry
6. Knowledge preservation in code
7. Less code, more business
8. Observable by construction
9. Failure modes (credibility earned)
10. Team as Choice (liquid work)
11. The Interesting Work (architecture time as payoff)
12. Manufacturing analogy (single paragraph only, in opening chapter)
13. What We Expect (predictions, no data claims)

Possible 14th thread emerging from Round 1: **Telescopic evolution / fractal composition** — appears in many chapters, methodology-distinctive enough to deserve thread status. Decision deferred.

---

## Chapter Structure (summary — full detail in spec)

**Part I — Why We're Stuck** (~18k words, 5 chapters): productivity plateau, cargo-cult best practices, design-architecture gap (sharpened from "DDD's Strategic Gap"), OO vs FP, AI meets code (rename candidate per Gap 9 — see considerations).

**Part II — The Shift Already Happening** (~16k words, 4 chapters): Quiet Consensus, process-first vs entity-first, semantic potential of types (Jackson credit foregrounded), knowledge gathering as upstream.

**Part III — Process-First Design: The Framework** (~20-22k words, 5-6 chapters): four shapes, six patterns, leaves and quarantine, use case as deployable unit (was "slices"), assembly vs provisioning, possibly new chapter on altitude ladder / vocabulary bridge.

**Part IV — End-to-End Practice** (~22k words, 5 chapters): request-to-code walk-through, naming as design, knowledge preservation, observable by construction, less code more business.

**Part V — Adoption** (~22k words, 5-6 chapters): one-sprint migration (rewritten without Aether coupling), priority guide, Team as Choice, failure modes, What We Expect; possible Anti-Patterns chapter (Theme 14).

Plus Introduction and Closing (~6k combined).

**Target total:** ~70-80K words (concise; revised 2026-05-27 from the original 85-110K band to match realized per-pass length). Book length, not manifesto length.

**Closing chapter** acknowledges architecture-derivation as open follow-up work (middle-path Book 2 acknowledgment per Theme 7).

---

## Article Reuse (what seeds what)

See `content/article-index.md` for full URLs. Seeding map in `pfd-book-spec.md`. Notable additions during Round 1:

- **"Hidden Anatomy of Backend Applications"** seeds Ch10 (Four Shapes) — adds I/O ⇔ transformation cycle framing.
- **"The Saga is Antipattern"** (2023) is referenced and refined by upcoming "Saga Is Not a Pattern" article.

Source article markdown is at `/Users/sergiyyevtushenko/IdeaProjects/oss/content/` — drafts with frontmatter. Do not edit the draft files; they are published artifacts. Read to extract content and voice, then rewrite for book depth and cross-chapter continuity.

---

## Article Warm-up Plan (pre-publication)

Sequenced content to build audience before book launch:

**Articles (Medium primary):**

1. **"Saga Is Not a Pattern"** — **Published 2026-04-27 on Medium:** https://medium.com/@sergiy-yevtushenko/saga-is-not-a-pattern-6973bdcebde5. Decomposes saga, introduces BER/FER/design-out triple, refines 2023 *"Saga is Antipattern"* position. Draft at `/Users/sergiyyevtushenko/IdeaProjects/oss/content/saga-not-a-pattern-draft.md`; article-specific handover at `saga-not-a-pattern-handover.md`. Reception/pushback feeds into book chapter framing.

2. **"What Benefits Humans Benefits AI"** (planned) — methodology stance on AI; counter to AI-redesign discourse; Cognitive Load Theory anchor.

3. **Fractal validation receipts** (planned) — empirical result across 6 real Java codebases; establishes credibility with measurement.

**LinkedIn warm-up posts (planned):**

- Telescopic evolution: altitudes emerge from multiplicity
- Compensation is 500 years older than software
- Architecture is a derivative, not a state
- Methodology designed for humans handles AI by accident

Each post is short-form (200-500 chars); each can drive thread engagement that informs subsequent article framing.

---

## Predicted Pushbacks Already Surveyed (Theme 19, captured 2026-05-03)

Two warm-up articles published so far ("Saga Is Not a Pattern" 2026-04-27, "Software's Industrialization Moment" 2026-05-02) have surfaced the major objections book reviewers will raise. Article publication functions as pre-publication reviewer-anticipation. Captured material guides chapter framing.

**Two textbook objections surfaced within 24 hours of industrialization article:**

1. **AI-as-fragmentation-force** (Locke, LinkedIn). AI lowers cost of creating non-standard alternatives, therefore expect MORE fragmentation, not convergence. Aether-as-counter-to-Spring cited as example of one-person-plus-AI making alternatives.

2. **Practical mechanics of standardization** (Kvien, dev.to comments). Three sub-objections: (a) agreement problem ("as many opinions as developers"); (b) subdomain problem (embedded vs enterprise vs game dev differ); (c) tooling problem (needs compiler enforcement, citing Go).

**Key reframe directive (user, 2026-05-03):** stop arguing standardization SHOULD happen; reveal that it IS happening. Replace defensive posture with observational catalog of in-the-wild evidence. Reader becomes observer, not skeptic.

**Theme 19 in `pfd-book-considerations.md` carries the full structure:**
- Evidence catalog (substrate, tooling, language, practice, per-domain analogues)
- Five observation-first response patterns (primary mode)
- Five defensive second-line counter-arguments (reserved for AI-fragmentation case where observation alone insufficient)
- Publication strategy principle (warm-up articles as reviewer-anticipation)
- Where this material lands in the book (chapter mapping)
- Open considerations (curation, vocabulary-vs-procedure distinction, four enforcement layers, possible 5th authorial principle)

**Standardization gets its own narrative thread (#15)** alongside telescope/fractal-composition (#14) — both forced from Round 3 prep.

**Where this lands in the book:** Ch 1 (Productivity Plateau reframed observationally), Ch 5 (AI Agents Meet Code — explicit AI-fragmentation treatment), Ch 6 (Quiet Consensus — standardization framing principles), Ch 22 (Team as Choice — banking → banking portability), Ch 23 (Failure Modes — "working code over rhetoric" tactical pattern), Ch 24 (What We Expect — observed-trajectory predictions).

**Authorial-principle candidate for Round 3 consideration:** *"Show it's happening; don't argue it should."* Distinct from existing principles 1-4 (legibility-first, show-possibilities, more-time-for-interesting-work, methodology-fits-the-work).

---

## Durable-Workflow SaaS Coverage (Theme 18, captured 2026-04-29)

Readers will arrive with pre-loaded questions about Temporal, Step Functions, Restate, Camunda, etc. Methodology must address durable-workflow SaaS explicitly — not as comparison framing, but as Phase-5 + Phase-6 placement.

**Core framing (full detail in `pfd-book-considerations.md` Theme 18):**

- Durable-workflow SaaS is a **Phase-6 technology choice that bundles a specific Phase-5 vector** (event-sourced workflow execution + managed retries + compensation handlers + distributed shared persistence). "We use Temporal" is Phase-6; the vector underneath is Phase-5.
- **No new primitives needed** — Temporal-class workflows = state-machine variant of Condition + Sequencer with state-persistence Aspect baked into the runtime. Activities = Leaves. Compensation handlers = Aspect or use-case-as-inverse. Saga reduction holds operationally.
- **Determinism alignment is a positive observation** — durable-execution engines require deterministic workflow code, which is exactly the discipline PFD recommends (effects in leaves, orchestration as pure composition). Methodology produces durable-execution-compatible code by accident.
- **Three traps** to surface as anti-patterns or warnings: everything-is-a-workflow (using durable execution where Phase-4 doesn't justify); event-sourcing-by-back-door (engine event-sources workflow decisions even if business state isn't event-sourced); workflow versioning (load-bearing operational cost for long-running workflows + code changes).
- **Discourse counter:** *"Methodology lives upstream of substrate choice."* Durable-workflow SaaS solves the substrate problem at one Phase-5 vector; composition problem at use-case and workflow altitude still has to be designed.

**Where this lands in the book:**
- Phase-5 axis-vector chapter — short worked example showing what durable-workflow-as-substrate commits you to across six axes
- Phase-6 technology-selection chapter — durable-workflow SaaS as Phase-6 menu items
- Workflow-altitude chapter — one-paragraph mapping to the six primitives
- Anti-Patterns chapter (if it ships) — the three traps

**Possible separate warm-up article** *"Where Temporal Fits"* (or vendor-neutral framing) — held in queue, deployed if reader questions consistently land on the "doesn't Temporal already solve this?" objection. Not committed.

---

## JBCT Documentation Updates Pending (Theme 17)

When JBCT docs are next updated, apply these refinements (sourced from PFD Round 1 work):

1. **State machine as Condition variant** — typed states + transition rules; dedicated section/treatment in CODING_GUIDE, JBCT book chapters, jbct-coder agent.
2. **Saga as state machine** — dedicated treatment as composite of state-machine variant + Sequencer + Aspect.

These flow naturally from JBCT's existing six-pattern + four-shape framework; no new primitives needed; just clearer surfacing.

---

## Commitments to Honor

- **William Jackson acknowledgment.** He coined "semantic potential" (now the subtitle) via a Medium comment on *When Types Become the Business Language* (April 2026). Phrase adopted with his explicit permission. At ship time: (1) send him a free copy, (2) acknowledge in front matter, (3) credit in any public reference to the phrase's origin.
- **Incremental publication of work-in-progress.** Drafts and updates committed to the repo as they develop; local PDF/EPUB builds mirror the JBCT book workflow.
- **Numbered predictions with commitment to update.** Chapter 24 ("What We Expect") includes the list and the honest disclaimer that updates will be published as evidence accumulates.
- **Every chapter lists its advanced threads** at the top. Standard format — see spec.

---

## Case Study Material Available

**Resolved 2026-05-03 via Theme 20 capture (see `pfd-book-considerations.md`).**

**Five primary public cases** (with primary-source links):
- **Google monorepo + trunk-based development** (Potvin & Levenberg, CACM 2016) — instant context-switching across project trees; ~1B files, tens of thousands of developers
- **Stripe Sorbet + 15M LOC Ruby monolith** (Larson, lethain.com) — ~1:300 leverage ratio (10-engineer Product Infrastructure team supports thousands of product engineers)
- **Spotify Golden Paths + Backstage** (Niemen, Spotify Engineering) — new-hire-as-target-user design; 1-week → 10-minute service creation
- **Shopify modular monolith + Packwerk** (Westeinde, Shopify Engineering) — 2.8M LOC Ruby; standardization-within-monolith counterpoint to microservices
- **Uber standardization arc** (Fowler, *Production-Ready Microservices*) — cautionary tale on local-vs-global standards

**Three supporting cases:**
- HP LaserJet firmware transformation (Gruver, Young, Fulghum, 2012) — non-web/firmware case; 400 engineers, 10M LOC
- Auto Trader UK (Karl Stoney) — small-org Stripe parallel
- Funda (Dutch real estate) — small-org Spotify Golden Paths adoption

**Recurring 3-part pattern across cases:** substrate standardization + small dedicated team owns substrate as product + opinionated-but-optional process. Maps to Theme 19 (standardization-already-happening) and thread #15.

**Round 1 also added:** empirical pattern-frequency data across six Java codebases (banking, ecommerce, url-shortener, notification-hub, pricing-engine, jbct-loan). Belongs in Ch 11 (Six Patterns) and possibly Ch 15 (worked walkthrough).

**Deliberately excluded:** Netflix Paved Road (weak match; conflict-of-interest risk).

**Anecdotal anonymized startup case retired 2026-05-03** — redundant with public set (Funda and Auto Trader UK fill the small-org slot with verifiable sources).

**Verification status:** specific data points (Stripe 1:300 ratio, Spotify 10-minute number, Shopify 2.8M LOC, etc.) deferred to chapter-drafting time when citations go to print.

**Case-study precondition is fully resolved.** Chapter drafting can proceed without further case gathering as a blocker.

---

## Preconditions Still Open

All preconditions identified in Round 1 resolved 2026-05-03; see status snapshot above for details.

---

## Quotable Lines Catalog

A growing catalog of quotable one-liners is maintained in user memory at `~/.claude/projects/-Users-sergiyyevtushenko-IdeaProjects-coding-technology/memory/project_quotable_lines.md`. Notable additions during Round 1:

- *"We're paid for solving business tasks, not for playing with toys and imaginary concepts."* — business-outcome workflow boundary
- *"First time when patterns will be emerging instead of being introduced artificially."* — emergence-first pattern presentation
- *"What benefits humans benefits AI."* — PFD's AI stance
- Plus earlier additions on coupling, JPA, hexagonal, stability axes

Use sparingly in chapters; over-quoting one's own quotables is bad voice.

---

## Working Rules (from author's global preferences)

- **Commit messages:** single line, conventional prefix (`docs:`, `feat:`, etc.), no body, no `Co-Authored-By` trailer.
- **No merging of PRs** unless explicitly requested.
- **Track progress with tasks** for 3+ step work.
- **Delegate noisy work** (builds, tests, large surveys) to appropriate subagents.
- **No competitor names** in public content.
- **Show, don't tell.** Applies to technical claims and to status updates.

---

## Source of Truth Hierarchy

When instructions conflict, follow in this order:

1. This handover document (orientation and current state)
2. `pfd-book-spec.md` (structural working agreement)
3. `pfd-book-voice.md` (prose-discipline working agreement)
4. `pfd-example-glossary.md` (running-example vocabulary; settles naming questions inside the event-ticketing example)
5. `pfd-book-considerations.md` (active iteration; may not yet be promoted to spec)
6. `pfd-validation-notes.md` (empirical findings; informs spec/considerations)
7. Source articles for content seeding
8. Author's direct instructions in-session

If user says something in-session that contradicts the spec, they are overriding. Update the spec (or considerations or voice or glossary) to match, commit the change, note the deviation in the chapter's notes.

---

## First Concrete Action (superseded — see top status snapshot)

This section is **superseded** by the top **Status snapshot (2026-05-19)**. The 2026-05-03 plan it described (Round 3 synthesis pass → article warm-up → chapter drafting against the 26-chapter outline) is no longer current.

**Current state:** spiral pedagogy adopted 2026-05-17; Pass 1 (use case altitude, event ticketing) substantively drafted; next concrete steps are listed in the top status snapshot under "Next concrete steps."

Preserved here for historical reference: the 2026-05-03 plan reflected the state at Round 3 closure, before the structural reframe. The methodology framework decisions from that era remain valid (still captured in the "Methodology Framework" section above); only the book's *structure* changed.

---

## Contact Points

- **User (author):** Sergiy Yevtushenko. Co-founder dynamic — propose ideas proactively, push back when the thesis risks weakening, flag tradeoffs explicitly. Not a client relationship.
- **Existing agents in other repos:** ndx palace in each project carries per-repo knowledge. Search before asking. Don't cross repositories with git operations (see feedback memory in `~/.claude/projects/-Users-sergiyyevtushenko-IdeaProjects-oss/memory/feedback_no_git_in_pragmatica.md` — similar caution applies to any repo where another agent may be active).

---

*This handover is complete when you can recite the five authorial principles from memory, name at least 10 of the 15 narrative threads, articulate the spiral structure (Introduction → Foundations → Spiral Passes 1-4 → Architecture Synthesis → Brownfield → Closing), and apply the JBCT-flavored code conventions (single-parameter Result, Promise carries failure, I/O is async, factory naming, sealed-interface Cause, method references). Read the top status snapshot and the working specs in oss/content/ until then.*
