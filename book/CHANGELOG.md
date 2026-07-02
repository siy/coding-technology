# Changelog — Java Backend Coding Technology

All notable changes to the JBCT book, newest first. Format:
[Keep a Changelog](https://keepachangelog.com/); the book uses
[Semantic Versioning](https://semver.org/). See `../BOOK-VERSIONING.md`.

Earlier history (1.x–2.x) predates per-book changelogs and lives in the
repository root `CHANGELOG.md`.

## [4.2.1] - 2026-06-30

### Added
- **The `*State` naming rule** (*Design Methodology*): the sealed sum enumerating a state machine's lifecycle states is named with a `*State` suffix — `HoldState`, `BookingState`, `SeatState` — with variants kept bare (`Free`, `Held`, `Confirmed`, never `HeldState`). It names exactly the *state* axis of the four-way split, joins the suffix-by-role family (`*Request`, `*Response`, `Cause`), and is reserved for the lifecycle sum a guarded transition advances — not every mutable holder. Added to the glossary (a new *State / State Machine* entry) and cross-referenced from the companion *Process-First Design* glossary.
- **Reads stay shared, writes go home** (*Design Methodology / Shared Code Is Exposed Coupling*): the shared-code rule refined by a read-vs-write split — a shared read or pure computation (a Leaf, a value object) couples nothing and is legitimate reuse, while the shared *write* is the coupling, of which process-first allows exactly one per resource (the guarded state transition); every other shared mutation goes home to the use case whose change driver owns it. An inherited mesh of endpoints calling shared methods resolves into the use-case hierarchy once classified this way.

### Changed
- **Shared-spine cross-reference** (*Glossary*): the glossary now points to *Process-First Design*'s glossary for the methodology vocabulary it owns (change driver, telescope, altitude, use case, workflow, data as residue), keeping this appendix to the Pragmatica-level and JBCT-specific terms — the JBCT half of the shared spine deferred from 4.2.0.

## [4.2.0] - 2026-06-28

### Added
- **What an entity fuses, and what JBCT keeps apart** (*Design Methodology*): an entity-first aggregate fuses identity, lifecycle state, representation, and policy; JBCT keeps them apart (id, state machine, value object, use cases). A value object *is* representation behind a stable interface — the aggregate merely adds policy, so a representation change lands in one value type and a policy change in one use case: same change size as entity-first, smaller blast radius. Persistence follows the split — per-operation writes through a `Promise`-returning step interface, no aggregate loaded through an ORM, so the schema cannot leak into the code.
- **Designing out contention** (*Thread Safety*): thread confinement protects state inside one execution; a new section covers contention *across* executions — derive-don't-store (no `free` flag to race), single-writer fields, the guarded atomic transition, database unique/exclusion constraints, and serialized intake — the Java and SQL realization of the methodology's design-out principle.
- **Why test counts stay isolated** (*Testing in Practice*): use cases answer to one driver and stub their steps, so adding behavior adds a test file without touching existing ones, while the entity-first god-object accumulates every driver's scenarios in one suite that fails together — same total tests, isolated rather than entangled.

## [4.1.2] - 2026-06-27

### Fixed
- **Clickable links in the PDF.** The cover was merged with `pdfpages` (`\includepdf`), which strips interactive link annotations, so the blue URLs rendered but did not click. The cover is now concatenated with `pdfunite`, which preserves them; external links and the table of contents are live again (build).

## [4.1.1] - 2026-06-25

### Changed
- **Per-process types framing** (Chapter 2): aligned the "data follows process" passage with the
  change-driver view — what reads as duplication is per-process types that vary for different reasons,
  not a DRY violation (reviewer feedback, Y. Loth).

## [4.1.0] - 2026-06-23

### Added
- **Materialization: when structure earns code** (Chapter 2): a workflow stays *logical* — a state
  machine spread across its use cases — until it gains a trigger of its own, then materializes as a
  use-case-shaped interface + factory whose steps are those use cases; an entity earns code only at a
  persistence edge or a cross-field invariant; and shared code is exposed *intrinsic coupling*, so
  placement follows the change driver, never code similarity.
- **Workflow as a state machine, made explicit** (Chapter 2): the logical-workflow case named — lift
  the legal transitions into one shared machine rather than scattering them across the use cases.
- **Explicit subsystem and system package trees** (Chapter 16): the telescope rule now shows package
  evolution at the subsystem and system altitudes, not only the workflow one, and where a
  *materialized* workflow slice sits.

## [4.0.0] - 2026-06-22

A new edition: the book becomes a **self-contained Java methodology, design to code**, and
the single canonical source. The standalone Coding Guide and Learning Series are retired and
folded into the book, which the site now renders as the free web edition.

### Changed
- **Self-contained design on-ramp** (Chapter 2, *From Process to Patterns*): the book now carries
  the design half itself — the **process as the unit of design** and its six properties,
  **data-follows-process**, and the **telescope** (use case / workflow / subsystem / system) with
  the change-driver **cohesion test**. A reader no longer needs a second book to design a use case.
  The companion *Process-First Design* is now optional further reading, not a prerequisite; every
  cross-reference that deferred design to it has been converted to in-book treatment (Chapters 2
  and 16) or to an optional pointer.
- **The Coding Guide and Learning Series are retired**, their unique content folded in. The book is
  the one hand-maintained source; the website renders it instead of separately maintained pages.

### Added
- **The recovery triple** (Chapter 7, *Null Policy & Error Recovery*): Backward Error Recovery,
  Forward Error Recovery, and design-out, named explicitly with a booking example.
- **Thread-safety quick-reference matrix** (Chapter 10, *Thread Safety*): per-pattern guarantees
  across all six patterns, consolidated into one reference table.
- **Acronym naming** (Chapter 8, *Basic Patterns*): treat acronyms as words in camelCase
  (`HttpClient`, not `HTTPClient`).
- **Observation exercises** (Appendix B): warm-ups for reading an existing codebase.

## [3.2.1] - 2026-06-21

### Added
- **Worked example for the telescope rule** (Chapter 16): a workflow's state machine as shared logic — it lives in the workflow package's `shared`, its transition use cases depend up on it, and it is the case where sharing is *essential* coupling rather than premature. Cross-references the companion *Process-First Design* for why the coupling is essential.

## [3.2.0] - 2026-06-20

### Added
- **The telescope rule** (Chapter 16, *Project Structure*): the package tree grows
  as the design discovers altitudes — use case, workflow, subsystem, system. When a
  workflow is recognized, its use cases move under a workflow package and the tree
  telescopes open one level per altitude. Shared code lives at the **lowest common
  ancestor** of its users and floats up as new users appear; the altitude of a
  shared element measures the blast radius of changing it. Dependencies point up the
  tree, never sideways into a sibling's package. Generalizes the existing "move a
  reused element to the nearest `shared` package" rule.

## [3.1.0] - 2026-06-13

### Added
- **Chapter 9b: Knowledge-Gathering Pipelines** — the growing-context view taken to
  implementation depth, with the `mapWith` / `flatMapWith` / `ensureWith` combinator
  family and the gating-vs-evidence rule.
- **Instrumentation completeness** (Chapter 9, *Aspects*): wrapping every leaf
  instruments the whole request path by construction.

### Changed
- **Chapter 2** reshaped into a design-to-code bridge (*From Process to Patterns*),
  deferring the full design treatment to the companion *Process-First Design* book.
- **Factory-naming rationale** (Chapter 5): type-named factories allow collision-free
  static import.

### Fixed
- Emoji rendering in comparison tables; chapter numbering reconciled with the table
  of contents; factory-naming consistency in the appendix examples.

## [3.0.0] - 2026-04-12

### Added
- **Chapter 2: Design Methodology** — process-first design with worked examples.

### Changed
- Book renumbered: the new Chapter 2 shifts subsequent chapters by one.
