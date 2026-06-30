# Changelog — Process-First Design

All notable changes to the PFD book, newest first. Format:
[Keep a Changelog](https://keepachangelog.com/); the book uses
[Semantic Versioning](https://semver.org/). See `../BOOK-VERSIONING.md`.

`0.x` versions were preview editions; `1.0.0` marked the first edition released to
readers, and `1.x` are its maintenance and expansion releases.

## [1.7.0] - 2026-07-01

### Added
- **Two-layer reading: the spine.** Every chapter now carries a bolded *spine* — its load-bearing claim sentences, roughly three per page — so a time-poor reader can skim only the **bold** and get a coherent condensed version of each chapter, while the full prose stays the deep layer. About 300 spine sentences across the eleven main chapters, selected so that, read in sequence, they form one continuous condensed argument. No prose was changed; the spine is pure emphasis, and existing term introductions move to *italic* so the bold layer reads clean.
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
