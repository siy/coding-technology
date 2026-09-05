# Changelog — Process-First Design

All notable changes to the PFD book, newest first. Format:
[Keep a Changelog](https://keepachangelog.com/); the book uses
[Semantic Versioning](https://semver.org/). See `../BOOK-VERSIONING.md`.

`0.x` versions were preview editions; `1.0.0` marked the first edition released to
readers, and `1.x` are its maintenance and expansion releases.

## [Unreleased]

### Fixed
- **The Architecture Synthesis module no longer contradicts its own successor** (*Architecture Synthesis*).
  The module argued that getting from nine answers to six axis values "is deliberately not a procedure that
  hands back an answer", having considered and rejected a per-axis decision tree and an axis-by-axis
  compatibility matrix. *Architecture Synthesis: The Next Correct Step* then derived that step mechanically
  using neither instrument: null vector, pressure against a ledger, movement only under citation, a stated
  conflict rule, and a halt on contradiction. The section now records that both objections were right about
  those two instruments and wrong about the conclusion, states that the book is authoritative where the two
  differ, and keeps the three profiles and the named considerations as the preview and intuition they are.
  Reported by a review of the site handed to this session, 2026-09-05.
- **Semantic independence distinguished from physical contention** (*Glossary*, *The Data Question*). The
  shared-primitive entry said two processes writing different fields of one row "are not coupled by
  co-location", and the conflict table answered write-write on different fields with "no conflict to
  resolve". Both are true of the ownership split and false of the storage engine, where row-level locking
  and whole-row versioning make co-located writers contend. Keeping them independent at runtime is now
  named as a storage-layout obligation rather than a consequence of the split. Same review.
- **The quasi-linear claim on the reference card matches the glossary** (*Reference Cards*). The card said
  driver attribution turns a quadratic similarity search into a quasi-linear partition; the glossary already
  scoped the property to the cost of *keeping a decomposition cohesive*, attribution itself being human
  elicitation. The card now carries the same scope. Same review.

## [3.0.0] - 2026-08-28

The third edition. Published editions jump from 2.5.0 directly to 3.0.0: the 2.6.0
and 2.7.0 entries below were committed but never published, and this edition carries
both. Major per the versioning scheme: the 2.4.2 correction replaced a prescription
readers relied on (locking → the guarded field), 2.6.0 added a module (*The Data
Question*), and 3.0.0 adds the construction-scaling claim to the book's position,
paired with *Java Backend Coding Technology* 5.0.0 carrying the other half.

### Added
- **The second payoff: construction that scales** (*Closing*, between the bet and the
  predictions) — the development-scaling assembly: Brooks' law read as a coupling cost that
  adding AI does not touch; the two properties that make work parallelize (uniform,
  independent); independence from the change-driver cut, with the quasi-linear discovery
  referenced rather than re-derived; uniformity and the below-use-case grain from a
  corresponding coding technology, *Java Backend Coding Technology* named as the worked
  instance; the buildable-versus-runnable distinction, the optimal grain, and Amdahl as the
  governing ceiling once Brooks' condition is met.
- **Foundations** — the "thousand independent descents" paragraph points forward to the
  Closing section and to the article that develops the argument.
- **References** — Amdahl (1967), Brooks (*The Mythical Man-Month*), and the author's
  *Software's Second Free Lunch*.

## [2.7.0] - 2026-08-27

### Added
- **Compensated sequence** (*Architecture Synthesis*, recovery-class selection; glossary) — the
  composite named, and its identity with *saga* stated: a Sequencer whose steps each carry an
  inverse, advanced by a ledger of what has committed so far. The two terms are declared
  interchangeable. The reduction itself is unchanged — a saga is still not a primitive.
- **The Data Question** — the scope boundary stated: the data the chapter models is the system's
  state; the form its persistence takes is outside the methodology's scope, and deliberately so.
- **The Data Question** — configuration named as owned state: written by operations rather than by
  a business capability, read by anyone, on its own cadence, under its own authority. The model is
  indifferent to the kind of state it holds.
- **The Data Question** — the closing opens toward the derivation: grain, transaction boundaries,
  identity, and enforcement follow from the closures, owners, and lifespans the chapter names;
  that derivation is synthesis work, owned by *Architecture Synthesis*.

## [2.6.0] - 2026-08-21

### Added
- **The Data Question** (*new module, between Architecture Synthesis and Edge Cases*): the standard
  objection answered end to end. The whole record materializes on exactly three occasions, sorted by
  whether the assembled whole has a writer — the read path (none, so no cost), a cross-field invariant
  (one, the new parent), and erasure (universal, and keyed by the data subject). Carries the three
  responses to a spanning invariant in order of cost (change the modality, push it into the store,
  materialize the closure), *How ownership moves* and *Designing out contention* relocated from
  *Foundations*, and the prior-art convergence with sixth normal form.
- **Invariant closure** (*The Data Question*, glossary, Card 6): what a spanning rule actually binds —
  the fields it spans plus anything transitively bound by an invariant sharing a field, normally a
  proper subset of what hangs off the id. The entity is what you get by assuming every closure on an
  id is one closure.
- **The constraint-losslessness mechanism** (*The Data Question*): decomposing state by owner is
  lossless with respect to data and lossy with respect to constraints. A predicate over one field
  survives the split; a predicate over several must be re-imposed. This is the mechanism behind the
  honest limit, which the book previously asserted without explaining.
- **Severance** (*The Data Question*, glossary): the withdrawal of an identity from an accretion that
  survives it. Not a motion of ownership, since no field changes owner, but a motion of the seed — and
  the only motion in the model whose driver is a regulation rather than the business.
- **Retention** (*The Data Question*, glossary, Card 6): how long a field may be kept and under whose
  authority, derived from ownership rather than added as a fifth field property. Lifespan is per-field
  because ownership is.
- **Erasure** (*The Data Question*): named as the case that breaks two of the model's rules at once —
  keyed by the data subject rather than by a minted id, and a universal writer. Three tactics: fan-out
  as a Fork-Join over per-owner leaves, crypto-shredding as design-out, and severance. Records the
  collision the book previously left unacknowledged: an immutable log corrected by appending is a
  design-out tactic that a right to erasure cannot be honoured against.

### Changed
- **The write/read asymmetry is stated where it is load-bearing** (*Foundations*, *Where data comes
  from*). "The whole never materializes" was refutable by any report; the claim that does the work is
  that no process ever *writes* the whole record. Reads may assemble anything; writes stay partitioned
  by owner. The book already carried the asymmetry in passing in *How ownership moves* — written by
  that one owner and read by anyone — one section downstream of the claim that needed it.
- **Foundations sheds the data consequences and keeps the derivation** (10,900 to 9,500 words). *How
  ownership moves* and *Designing out contention*, including read-write staleness, move to the new
  module. What stays is the derivation itself: data as residue, the id as seed, accretion, the
  creatability gate, one writer per field. Absorption and the honest limit keep a compressed statement
  in place with the full treatment forward.

## [2.5.0] - 2026-08-10
### Fixed
- **The backward-measurement claim was too strong** (*Foundations*, both appendices). The book said the version-control history *does not lie* about how the system changes, and rested the measure-backward instrument on that. It does mislead, in one specific and correctable way: **co-change is partly endogenous** — files change together partly *because the current decomposition forces them to* — so raw co-change is downstream of the very structure it is being used to judge, and a decomposition that disagrees with the history may be indicting the history. The instrument survives with two adjustments, both formulation-level and neither requiring tooling: measure the co-change that **crosses a boundary**, where coupling indicates a misattribution whether the change was forced by the domain or induced by the structure; and treat restructurings as **natural experiments**, since co-change that survives a known restructure answers to a real driver, while co-change that vanishes with it was an artifact of the structure just removed. The claim gets narrower and the instrument gets sharper.
### Added
- **Where the criterion does not govern** (*Foundations*, both appendices). The change-driver criterion was stated as general while the Closing quietly bounded it, so the bound is now attached where the criterion is asserted rather than left to a later chapter. The Closing's scope band already excludes the domains that answer to deadlines, hardware budgets, memory access, or mathematics — hard real-time, embedded firmware, game engines, numerical pipelines — but two exceptions sit *inside* the band and went unnamed. A **trust boundary** can require splitting things that change together, because merging them by change attribution would be the vulnerability itself; there the boundary outranks cohesion. A **concern that co-changes with everything** — telemetry is the standard case — partitions nothing, because a driver that touches every use case selects no subset of them. Neither is a failure of the criterion; both are places where a different relation governs, and the honest move is to say which. The desk references carry the compressed form, so they do not teach the gap.

## [2.4.2] - 2026-08-02

### Fixed
- **The predicate-over-a-set case was misclassified** (*Foundations*, both appendices, both glossaries). 2.4.0 filed it as the limit where "design-out has nothing to bite on" and offered "a materialized counter that writers **lock**" — while the same section closes by calling locking *"the admission that the conflict was left constructible."* The book condemned locking and then prescribed it. Design-out does reach this case: materialize the predicate as one guarded field and put the guard in the write (`where count < limit`, rejecting when it matches nothing), which is the **guarded transition** applied to a count rather than to a workflow state. The reshape was never into rows — counts genuinely do not become rows — but into a single field a guard can sit on.
- **The reason the interval reshape fails here, stated correctly**: the set includes rows that *do not exist yet*, so no constraint can hold one and no lock over the rows already counted covers the one a concurrent operation is about to add. The earlier account blamed a missing unique key, which is a symptom rather than the cause.

### Changed
- **The honest limit, relocated to where it actually is** (*Foundations*): a collision between two of the book's own tactics rather than an absence of any. *Derive, don't store* says the count should not exist; *the guarded transition* says it must, because a guard needs a field. Materializing it obliges every capability that can change the predicate to maintain it in the same transaction, and one that forgets leaves the stored count and the facts quietly disagreeing — the drift derive-don't-store exists to prevent. Read-set validation is the alternative that keeps the facts authoritative and pays in carrying them forward instead. Noted with it: an append-only log gets this case cheaply, because a query over events already selects the event that would invalidate the decision, phantom included.
- **What remains is named as real** rather than as a shortfall: two operations competing for one guest's booking budget genuinely conflict, and serializing them at that one field is the domain's own truth, not a lock standing in for a design nobody did.

All of the above follows a reply from Rico Fritzsche to a question about this exact case; the references entry records it.

## [2.4.1] - 2026-08-01

### Fixed
- **Q2's scope, corrected to match the companion** (*Architecture Synthesis module*): the failure budget bundled an **error budget**, which is a service-or-path commitment, with **criticality**, which is per operation, and attached both "per use case". The two answer at different scopes, so a single answer covering the pair is exactly the kind of bundle the entry gate exists to catch — in the question list itself. *Architecture Synthesis* 1.1.0 decomposed it after `next_step` had to accept worked examples that contradicted the card; the series crosswalk states that both books ask the same nine questions, so this edition follows.

### Added
- **Rico Fritzsche in the references**: *The Command Context Consistency Principle* (Level Up Coding, 2026), the source behind 2.4.0's read-write staleness section and the convergence note in *Foundations*. The note names the principle now that it is formally cited.

## [2.4.0] - 2026-08-01

### Added
- **Read-write staleness named** (*Foundations*, both appendices, glossary): *Designing out contention* treated contention as a **write-write** problem throughout, and single-writer ownership — the section's own load-bearing tactic — is exactly what hides the other kind. A field with one writer cannot be raced; a decision that *reads* it can still go stale. A new subsection names it, maps the four cases (write-write on different fields, write-write on the workflow's state, read-write on a fact with a unique key, read-write on a predicate over a set), keeps design-out first where the claim is reshapeable — an interval becomes a row per interval claimed, and an exclusion constraint refuses the overlap — and states the honest limit for the fourth case: counts and sums offer no unique key to constrain, leaving read-set validation at commit or a locked counter row that is an aggregate root under another name. Card 7 and the worksheet's contention card carry the compressed form, so the desk references do not teach the gap; the term enters both the book glossary and the series glossary. The tactics are a discipline, not a closure.
- **Convergence note on the aggregate** (*Foundations*, at the dissolution itself): one sentence recording that Rico Fritzsche's command-context argument reaches the same dissolution on **concurrency** grounds — an aggregate is a static consistency boundary while the facts a decision reads change from command to command — where this book reaches it on **change-driver** grounds. Two directions onto one target. The ownership discipline removes most of the contexts such a principle must guard; what survives it is precisely the read-write staleness above.
- **Appendix A — The Design Worksheet**: the method at operating altitude. Part A is the sheet you fill one bite at a time — specify a process by its six properties, check the altitude against the use-case/workflow discriminator, attribute it to a change driver with its confidence and source, let the data precipitate under the producer-and-reader gate, choose a recovery response, and climb only when the register says to. Part B is the reference consulted while filling it. Answers a reader request: the book taught the method and shipped nothing to apply it with, while the companion *Architecture Synthesis* ships both a worksheet and cards.
- **Appendix B — Reference Cards**: eight cards, one per instrument — process-first and the six properties, the shapes, the patterns, the telescope, the change driver and its register, where data comes from, recovery and designing out contention, and attribution across contexts. Definitions stay in Foundations; the cards are the compressed form, for the desk.
- **Web editions of both**: `/method/pfd/worksheet/` and `/method/pfd/reference/`, mirroring the routes the *Architecture Synthesis* course already carries, and linked from the PFD course footer.

## [2.3.1] - 2026-07-24

### Changed
- **Brownfield cost-and-risk indicators de-branded** (*Brownfield*): the six-indicators / six-dimensions references now lead with the name, matching the *Architecture Synthesis* edition. Argument-bearing counts unchanged.

## [2.3.0] - 2026-07-23

Two moves: the numbers stop clogging the core vocabulary, and a new section generalizes driver attribution across project and organizational contexts.

### Added
- **"Attribution across contexts"** (Foundations, after *Where the structure comes from*): a two-axis treatment — project history (does the artifact carry the drivers?) × organizational history (does anyone remember them?) — naming the four corners, including the inherited-codebase / new-team case where reading the register *builds* the memory the org lacks. States the error-cost inversion (hardest to know where cheapest to get wrong), the output-form split (a governance finding for an established org vs an open strategic question / readiness instrument for a startup), and the borrowed-history caution. Generalizes the greenfield honest-limit shipped in 2.2.1.

### Changed
- **Numbers no longer brand the core vocabulary** (Foundations): the introductions of the process properties, the shapes, the composition primitives, the ownership moments, the *parse, don't validate* levels, and the telescope's altitudes now lead with the names rather than announcing a count ("six primitives" → "a small, fixed set"; "one of four shapes" → "a shape"; "There are four moments." dropped; and so on). The argument-bearing counts — the recovery triple, the nine questions, the two cohesion axes — are kept. Addresses the reviewer note that readers retain the tally and forget the members.

## [2.2.1] - 2026-07-22

Scope the change-driver-as-fact claim by what the business can actually know, and ship the greenfield honest-limit.

### Added
- **The knowable-vs-predicted limit** (Foundations — *Where the structure comes from*): a paragraph scoping the change driver's objectivity — a measurable fact where volatility is realized (a system with history), an elicited low-confidence prediction where it is not (a young company predicting its own future, and businesses are routinely wrong about that) — and noting the thin end self-corrects as co-change history promotes a predicted driver to a measured one.

## [2.2.0] - 2026-07-22

The decomposition method gets its name, and the property it buys is exposed where readers first meet it.

### Added
- **The method's two names** (Foundations — *the change driver*; glossary): the move — attribute each use case to its driver, group by shared driver — is now named **driver attribution**, and the property it buys, **quasi-linear cohesion**. Both enter the glossary, and the Introduction's jigsaw picture now states the payoff — the work scales with the number of use cases, not the pairs between them — where a first-time reader meets it, instead of leaving it inside Foundations alone.
- **A mechanical use-case / workflow discriminator** (Foundations — *the telescope*; glossary): the boundary is now a stated rule — a use case decomposes into patterns, never into independently triggerable steps; the moment a step could stand alone under its own trigger, or state must survive between steps, you are at workflow altitude — with a short note positioning the term against the classic (Jacobson/Cockburn) use case. Closes the first cold-reader-confirmed clarity gap.

### Changed
- **"near-linear" → "quasi-linear"** for the decomposition-cost claim (Foundations): one defensible term — the guaranteed bound of a labeling pass plus a sort — replacing the informal one.

## [2.1.0] - 2026-07-15

The Phase-4 question set converges with *Architecture Synthesis*: **nine questions**, one sheet across both books.

### Changed
- **The Phase-4 question set: eleven → nine** (the transition story, told on this book's own pages as *Architecture Synthesis* promised). The eleven were audited, in the AS book's validation runs, against a membership criterion — a question earns its seat only if its answer can press or prune an architecture axis independently of every other answer. Two failures: *throughput* and *scale shape* never pressed anything separately — every derivation cited them together — and merged into **Load** (magnitude, shape per path, concentration, window); *technology mandates* never pressed an architecture axis — they bind the Phase-6 technology choice, reaching architecture only when a mandate strikes a value outright ("no cloud" kills serverless) — and folded into **External constraints** as one clause. Three survivors — latency, availability, durability — turned out to be one grammar in three vocabularies, regrammared as the budgets: **time budget**, **failure budget**, **loss budget**. Nine survived; the count is an output of the criterion, and the sheet grows the day a tenth demand demonstrates independent pressure. **For readers who learned the eleven: nothing you learned is wrong** — two pairs merged, three renamed; the sheets are compatible. The published articles keep the historical eleven.
- **Touched by the convergence:** the module's question table, categories, and scope paragraph (answers now attach at four scopes — load reads per path); the per-axis primary-input citations; the brownfield audit walkthroughs' question numbers; Spiral Pass 1's Phase-4 scope note. The four question categories (SLO / constraint / operational target / substrate-shaping) are unchanged.

### Added
- **About the Series** front-matter note (`series-note.md`, first spine entry): the series pipeline, reading map, and register note — the reading map identical across all three books.
- **The module → book pointer** (Architecture Synthesis module, landing with the AS book's ship): names the full book, what it adds beyond the preview (the ledger, the derivation procedure with conflict rule and halts, verification arithmetic, the blind-derivation evidence), and that the two share one question sheet.
- **Recovery-triple long names at first use** (Foundations + glossary): BER — *compensate-by-inverse*; FER — *degrade-and-continue* (series terminology ruling 2026-07-12; the short forms remain the compact notation).
- **The shapes' statements survive realization** (Foundations, the shapes): the semantic-potential paragraph closes the loop with JBCT's newly named twin property — *hide the machinery, keep the meaning* (JBCT 4.3.0): the realization preserves the domain facts the shapes declare, so finished code reads back as the process it implements.

## [2.0.1] - 2026-07-03

Coherence pass on the condensed edition: the spine now reads end-to-end as a self-sufficient argument. Nearly all changes are re-selection of which sentences carry the spine (`**` placement); the full book's rendered text is unchanged except one clarification noted below.

### Changed
- **Spine re-selected for self-sufficiency (condensed edition).** Every counted set now carries its members: the six process properties, the four shapes, the six composition primitives, the recovery triple (BER / FER / design-out, with definitions), the four selection axes, the two cohesion axes (completeness / purity), the four altitudes, the three time shapes, the two compensation shapes, the six cost-and-risk indicators, the six architecture axes, the five general and four brownfield failure modes, and the five book principles. The reviewer is introduced before he is cited; V₀/V₁ are defined before use; the representation-change objection is stated before it is refuted; "the other three failure modes named above" now follows the naming. Orphan fragments and content-free repeats dropped; dangling antecedents given their referents.
- **Workflow SLO triple named inline** (*Spiral Pass 2*): "its own SLO triple — latency, throughput, availability —". The only prose change in this release; everything else is spine markup.

## [2.0.0] - 2026-07-02

Second edition — the book reworked after its first serious external review (Denys Poltorak's full read and the Fractal Platform community). It consolidates 1.7.0–1.9.0 (the two-layer spine and the free condensed edition, the *Where the structure comes from* section, the *Variation without branching* answer, and the scope / tiers / single-sitting corrections) and adds the finishing pass below.

### Added
- **Afterword** — the author's note: the density was the method leaking, unnoticed, into the prose. Deliberately kept out of the condensed edition; the one page where the prose is allowed to relax.

### Changed
- **Vocabulary de-branded across the book.** The sets are named, not counted — "the patterns," "the shapes," "the properties" replace "the six patterns," "the four shapes," "the six properties" throughout — with each count stated once where its members are actually listed, and the counts that carry an argument (the recovery triple, the two axes of cohesion, the one organizing structure) kept. Readers were retaining the number and losing the content it stood for.
- **Loth / Independent Variation Principle, reframed** (*Foundations / The telescope*): from a defended priority ("corroboration, not foundation") to plain gratitude — the book holds a working scheme drawn from practice, Loth built the formal foundation beneath it, and the credit for the rigor is his.

## [1.9.0] - 2026-07-02

### Added
- **Where the structure comes from** (*Foundations*, after *Finding the change driver*): a new section that *shows* the decomposition the book had only asserted. You never cut the whole vision at once — you eat it one operation at a time, and each bite is a *question put to the business* (the change-driver test is an interview question), so decomposition is a structured conversation whose rule is *nothing about the business without the business*, with the telescope and the cohesion test bounding it to only the necessary questions. The register is the transcript; it crystallizes into the telescope the way data precipitates from process (*where data comes from* and *where the structure comes from* are one answer given twice). Each bite drills to Leaves — the descent bottoms out in code so simple it cannot be argued with, so a thousand use cases is a thousand independent descents, not a thousand-way tangle. Names the local-vs-independent step decision: a step goes independent the moment the register shows it varies — not premature abstraction but a change driver made physical, a business fact recorded in the shape of the code, because the business *told you* it varies (knowledge, not speculation). Closes on the inversion — you understand the business *by* building it, so the method produces a precise, derived, always-current model of the business as a byproduct: nobody knows the whole business, and nobody has to. Answers the decomposition, scale, "no business understanding," and enterprise objections from the design debate in one place.

### Changed
- **The one-sitting-read claim, removed** (*Introduction, Foundations, Closing*): the full book no longer claims to be an afternoon read — it is a dense, multi-session text, and pretending otherwise did not survive contact with real readers. The twenty-minute pass is the *condensed edition*; the full text is read at whatever pace the material asks.

## [1.8.0] - 2026-07-02

### Added
- **Variation without branching** (*Edge Cases*): the deepest form of the "process-first explodes" objection answered — the multi-dimensional booking mesh (seat selection × numbering × track model). The objection assumes process-first cannot *dispatch*; it can, spelled as data rather than inheritance — a varying *how* is a bound policy value (the policy axis of the four-way split), not a branch, so the use case stays a linear Sequencer for the same reason a polymorphic object-oriented one does. Maps the object-oriented toolbox (Strategy → a function-typed step or value-object policy; polymorphic dispatch → a sum-type match at the boundary; Template Method → a higher-order Sequencer) and names the honest limit: dispatch is not free, and a strategy-dense domain carries a real policy table either way — process-first just keeps it out of the use-case body and off any shared object. Origin: Denys Poltorak's combinatorial-explosion / "diamonds" challenge, whose force turned out to rest entirely on the unstated premise that process-first has no dispatch.

### Changed
- **The scope band, defined** (*Closing / Honest scope*): replaced the undefined "enterprise" with an explicit band — large, long-lived, multi-team backend — bounded by a floor (below which coupling cost never pays for the discipline) and a ceiling (true mega-enterprise: dozens of departments sharing no common model, which is organizational / bounded-context territory above the system altitude the book stops below). The methodology's argument lives in between, where a single shared model is still *attempted* and its coupling cost still bites; the concrete anchor sits in the lower-to-middle of the band, not at the ceiling, and the anchor is no longer labelled "enterprise."
- **Technical tiers** (*Brownfield*): corrected an overclaim — the tiers do not become "a presentation detail"; they persist as real language, technology, security-posture, and staffing boundaries, but stop being the axis the code is decomposed along.

### Fixed
- **The single-sitting-read claim** (*Introduction, Foundations, Closing*): the full text is fact-dense and reads across several sittings for most readers, not the single sitting an earlier draft claimed as achieved. The one-sitting promise is re-homed to the *condensed edition* (the bolded spine on its own), which is where it holds.

## [1.7.0] - 2026-07-01

### Added
- **Two-layer reading: the spine.** Every chapter carries an internal *spine* — its load-bearing claim sentences, marked in the source. The full book renders them as ordinary prose, so the deep read stays clean with nothing emphasized to interrupt it; the extractor instead harvests them, in reading order, into the free *condensed edition* — the argument in about twenty minutes. Roughly 300 spine sentences across the eleven main chapters, selected so that, read in sequence, they form one continuous condensed argument. The markup is internal only; the full text carries no bold on its account.
- **The Honest Scope epigraph** (*Closing*): a four-line exchange — *"Should the CTO really be in every service's code? … Make backups."* — credited to Denys Poltorak, heading the section it distills: above the system altitude you get recovery, not design-out.
- **Spine extractor and condensed edition** (build): `book-pfd-meta/extract-spine.py` harvests the bold spine, in reading order, into a derived *Argument in ~20 Minutes* companion built from the same source — self-checking, since an incoherent harvest means the bold selection is wrong.

## [1.6.0] - 2026-06-30

### Added
- **Edge Cases** (*new chapter, between Architecture Synthesis and Brownfield*): the methodology stress-tested against a sustained adversarial debate's worth of booking scenarios, each a worked *challenge → resolution → principle*. Buy-N-adjacent-seats (a new use case under an existing driver joins the unit; data grows at the invariant, not before); premium auto-buy (one "feature" splitting across two drivers, composed by a boundary event, with the named multi-driver edge); conference parallel tracks with mid-event change-seat (the *change seat* Sequencer, the timetable as reference data, the earned-record honest edge); the three-feature interaction meeting at exactly one field — the seat-status state machine; cancellation residue (derived availability + an owned guarded cancel transition + cancelled rows as owned residue, not orphans); the time-shared seat (presence intervals, trim-as-free, a Postgres range-exclusion constraint); and the central change-locality-versus-the-aggregate objection (a value object insulates representation in process-first too, so a representation change is a tie while policy change — the axis that actually churns — isolates to one use case). Opens with the reframe that there are altitudes, not predrawn modules, and a unit appears where one driver's cohesion closes.
- **Objections answered** (*Edge Cases, closing section*): three recurring high-level objections refuted — the inner-saga diagnostic (no Rosetta table; a saga inside one context is the tell of a noun-cut boundary, re-cut by transaction); "process-first is bottom-up, so it has no vision" (the method declares no direction, the helicopter view is its precondition and a deliverable, and vision-on-top / construction-from-below is the pyramid's actual shape); and "domain-driven design already handles the enterprise level" (a different altitude the tactical method consumes rather than contests).

### Changed
- **Glossary: the `*State` naming clause** (*State machine entry*): the state-machine type is named with a `*State` suffix, variants bare — a forward reference to the rule the companion *Java Backend Coding Technology* now makes explicit, part of the shared-spine alignment.

## [1.5.0] - 2026-06-30

### Added
- **Where the methodology sits** (*Closing / Honest scope*): named the layer explicitly — a *code-structure* method at the tactical layer that *consumes* the strategic/organizational frame (value streams, domain decomposition, team topology) rather than competing with it; the strategic layer *decrees* boundaries top-down, this one *derives* the same boundaries from change-driver cohesion, with the catalogue as a live map. And *below the organizational layer is not small*: the target is large, long-lived, many-team systems, where coupling cost dominates.
- **Reading a tangled call graph** (*Brownfield*): a real call graph is a mesh, not a tree — several endpoints calling shared methods, several layers deep — and the mesh is the use-case hierarchy read by the wrong key: endpoints are use-case roots, the layers are altitudes. Classify the shared methods by read vs write — a shared *read* or pure computation (a Leaf, a value object) is legitimate reuse that couples nothing; the tangle is the shared *write*, of which process-first allows exactly one per resource (the guarded state transition), every other shared mutation being accidental coupling sent home to its driver's use case. The cut is made by change driver and confirmed by co-change, never read off the topology.
- **Process-first is business understanding** (*Introduction / The thesis*): the process is the unit the business already uses to describe itself — verbs (place an order, hold a seat, issue a refund), user stories, acceptance tests, and BPMN are all process-shaped, while the noun model is something analysts derive to support the verbs. Designing around processes keeps the design's unit aligned with the business's own, so the charge that process-first lacks domain understanding is backwards: it is entity-first that opens by inventing a model the business never stated.
- **The contract-first / API-first on-ramp** (*Introduction / A convergence*): the widest independent arrival at process-first is one most backend developers have already made — designing the API before the schema. A business operation is an endpoint, a workflow a sequence of them, the contract shaped by what the operation does; process-first carries that same commitment inward past the contract, to the types and the residual data. Named as the easiest on-ramp, not a rival to set against existing practice.
- **Specifying a process is verifying it** (*Foundations / The six properties*): naming the six — typed failures, dependencies, typed input — forces every outcome and ordering to be confronted at design time, so a design flaw surfaces as a property that cannot be completed, on one page, before a line is written; entity-first defers the same discovery to implementation or production.
- **Altitude, defined where the telescope is** (*Foundations / The telescope*): the term every chapter leans on is now fixed prominently at the telescope — an altitude is one scale of the telescope (use case, workflow, subsystem, system), with *climbing* and *descending* defined as moving between them — plus a forward pointer at its first weighty use, so the word stops reading as undefined jargon.
- **The data gate forbids the orphan, not foresight** (*Foundations / Where data comes from*): clarified that capture-for-later (analytics, audit) is itself a process with a producer and a consumer and passes the gate cleanly; what the gate forbids is the orphan field nothing writes or will ever read. The difference between a captured fact and a speculative column is that the foresight names both processes.
- **Parsimony versus locality** (*Closing / The bet*): named the trade-off under the bet — entity-first optimizes *parsimony* (fewest concepts, one shared model held in one head), process-first optimizes *locality* (each thing changes alone). Parsimony wins at small scale but inverts under maintenance, because the one model you hold in your head *is* the coupling; in maintenance-dominated enterprise backend the governing virtue is locality, so the bet reduces to where the crossover between the two falls.

### Fixed
- **Emancipation and migration cost** (*Foundations / How ownership moves*): corrected an overstated "the data does not move" — emancipation restructures *ownership*, not the data's existence; where the new owner lives in a different store, the re-home is a schema migration (a deliberate, rare, costed coordination point), not a free byproduct.

## [1.4.0] - 2026-06-29

### Added
- **Glossary** (*back matter*): the methodology's vocabulary defined once — some forty terms from *absorption* to *workflow*, each pointing to its home section — established as the shared spine the companion volumes build on. *Java Backend Coding Technology* keeps its own appendix for the Pragmatica-level terms this glossary does not cover.

## [1.3.0] - 2026-06-28

### Added
- **How ownership moves** (*Foundations*): ownership has a lifecycle — *minted* (the id), *accreted* (fields, each owned by its creating operation), *transitioned* (the state machine as ownership in motion), then *absorbed* or *emancipated*. Absorption is growth without rewriting: a spanning invariant summons a parent that owns only the cross-part guard and reads its parts, while the parts keep their write-logic untouched and run inside it as steps — a spanning rule adds a parent, it does not edit the children. Emancipation is its dual: a field that gains an independent driver leaves its owner. The hierarchy absorption builds is the telescope read from the data side, and the summoning invariant is a change driver, so data ownership, the telescope, and the change driver are one structure.
- **Use-case trigger taxonomy** (*Foundations / The telescope*): a use case's one trigger is one of three — an external request, a published event, or the invocation of another use case or workflow — dispelling the picture of use cases as a flat list of screen handlers.
- **Designing out contention** (*Foundations*): a section generalizing the recovery triple's design-out for races into one principle (move contention to a single coordination point; make the conflicting state unconstructible) and its family of tactics — derive-don't-store, single-writer fields, the guarded transition, declarative constraints, serialized intake.
- **The four-way split** (*Foundations / Where data comes from*): the aggregate fuses identity, lifecycle state, representation, and policy; process-first keeps them apart (id, state machine, value type, use cases), so a representation change is the same change *located differently* — value type vs aggregate — while every policy change isolates to one use case instead of editing the shared object. New behavior is an addition, not an in-place modification; locating change by its driver is the cohesion test applied to data.
- **Change-driver tracking** (*Foundations / Finding the change driver*): tracking which use case answers to which driver turns cohesion from a quadratic pairwise search into a near-linear partition; the change-driver register doubles as the completeness/purity checklist and is confirmable against version-control co-change.
- **The work, in one picture** (*Introduction*): the methodology as jigsaw assembly — every piece in one of three states (in the box / sorted into change-driver heaps / placed), the heaps being the change-driver catalogue itself, and the starting state (greenfield or brownfield) irrelevant because you place a piece by its driver, never by a picture on a box lid you do not have. The heaps evolve as the business does, and the finished work yields two things: the system and a complete change-driver map, the second built for free.
- **Change drivers evolve** (*Foundations / Finding the change driver*): a driver is the current shape of the business's volatility, not a fixed fact; as drivers appear, split, and merge, the partition re-forms and the code restructures via absorption and emancipation. The register is live, version-control history is where a driver's movement first shows, and the commonest legacy decay is a driver that moved while the code stayed fused.
- **The enterprise bound, named** (*Closing / Honest scope*): the telescope stops at the system because the level above is composed by forces code does not express (Conway's law, the organization, funding); the methodology's only reach upward is the change-driver/team correspondence (persistent divergence = a Conway signal), and naming where code-shaped reasoning ends is part of using it honestly.
- **The change-driver catalogue as deliverable** (*Closing*): completing the work leaves two artifacts, not one — the working system, and a complete map of its change drivers and the parts each touches, the second a byproduct of having sorted by driver throughout.
- **Contention, designed out** (*Spiral 2*): a worked demonstration of design-out at workflow altitude — the seat-contention race (two buyers, or a buyer and a premium auto-buy) resolved by derived availability, a guarded `held → confirmed` transition, and a per-seat exclusion constraint, so the race is lost by construction rather than detected after the fact.
- **Change-locality in the bet** (*Closing / The bet*): a representation change is the same edit in both disciplines, located differently — concentrated in one fused object every driver edits, or distributed to value type and use cases by driver — so per-change cost is equal while blast radius is not.

## [1.2.0] - 2026-06-27

### Added
- **Where data comes from** (*Foundations*): data is not designed; it precipitates from processes as residue, so there is no data-modeling step to perform. Persistence begins at an id (the one field that needs no other, minted by an operation), and the entity accretes fields along the knowledge-gathering path, each field named, owned by its creating operation, and existing only if some operation can create it. The whole record never materializes: what couples two processes is a shared business primitive, and a record earns its place only when a cross-field invariant summons a new owner that absorbs the field-groups.

## [1.1.1] - 2026-06-27

### Fixed
- **Clickable links in the PDF.** The cover was merged onto the manuscript with `pdfpages` (`\includepdf`), which strips interactive link annotations, so the blue URLs rendered but did not click. The cover is now concatenated with `pdfunite`, which preserves them; external links and the table of contents are live again (build).
- **Heuristics rendered as a list** (*Architecture synthesis*): each dimension in *The heuristics, named* now has a blank line before its rules, so pandoc renders them as a bulleted list, one rule per line, instead of folding them into the label's paragraph.

## [1.1.0] - 2026-06-25

### Added
- **Finding the change driver** (*Foundations*): how to find the change driver the cohesion test turns on — the convergence (Parnas, Löwy, IVP), the "who would ask for this to change?" criterion, the ask-forward and measure-backward (version-control co-change) modes, the source taxonomy, the similarity guardrail and its converse (a cohesive unit may carry more than one driver; the adapter as essential coupling), and the organizational diagnostic.
- ***The Saga is Antipattern*** added to references, with the scope distinction against *Saga Is Not a Pattern* (a within-boundary composition vs a cross-service antipattern).

### Changed
- **Per-process types framing** (*Foundations*, *Closing*): what reads as duplication is per-process types that vary for different reasons, not a DRY violation; the real cost is the discipline of telling shared value objects from per-process types.
- **What stays shared** (*Spiral 1*, *Foundations*): a type is genuinely shared exactly when its change-driver set is independent of the process using it.
- Updated the *On the Nature of Cohesion* citation to the current version.
- **Heading size ladder** (build): the section heading now sits clearly above the subsection (the article default collided with the customized subsection size).

## [1.0.0] - 2026-06-21

First edition. Changes since the 0.9.0 preview:

### Added
- **Workflow progression** (*Spiral 2*): how a workflow advances in each case — logical (persisted state, external triggers, no orchestrator), materialized (its own trigger, a single process), and mixed.
- **Workflow as a state machine** (*Spiral 2*): a logical workflow is usually a state machine over persisted state, its use cases the transitions; making it explicit relocates essential coupling rather than adding it, with a pointer to the deterministic placement in the companion *Java Backend Coding Technology*.

## [0.9.0] - 2026-06-20

Initial tracked draft (preview edition). Highlights of the recent pre-publication
reviewer pass:

### Added
- **Entity clarification** (*Foundations*): process-first is not a ban on entities —
  an entity earns its place for a cross-field invariant enforced at persistence.
- **Telescope navigation note** (*Foundations*): the discovery hierarchy is also how
  the code is organized; the companion JBCT book carries the package realization (the
  *telescope rule*).

### Changed
- **Trigger model** (*Foundations*): a process needs at least one trigger and may
  have several; the outcome individuates the process.
- **Workflow cohesion** (*Spiral 2*): the reservation use cases cohere via one change
  driver and one seat state machine, not lockstep co-change; added a state-machine
  diagram.
- **Workflow materialization** (*Spiral 2*): a workflow is logical by default and
  takes code form only when it has its own trigger; even then it is a use-case-like
  interface, not a container of its use cases.

### Fixed
- **Audit-as-data** (*Spiral 3*): clarified that the use case writes its own ledger
  entry as a step; the response carries the already-written record as data, and
  nothing intercepts the call.
- Typography: heading sizes, code font matched to JBCT, orphan/widow control, lighter
  draft watermark; first-use expansion of SLO and SLA.
