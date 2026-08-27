# Changelog — Java Backend Coding Technology

All notable changes to the JBCT book, newest first. Format:
[Keep a Changelog](https://keepachangelog.com/); the book uses
[Semantic Versioning](https://semver.org/). See `../BOOK-VERSIONING.md`.

Earlier history (1.x–2.x) predates per-book changelogs and lives in the
repository root `CHANGELOG.md`.

## [4.9.0] - 2026-08-26

### Added
- **Introduction** — the normalization boundary: the explicit scope of the determinism claim.
  Derived: package hierarchy, types, step contracts, return types, patterns, composition, failure
  representation, sharing and placement, concurrency structure, testing obligations. Not
  normalized: atomic-leaf algorithms, adapter internals, module promotion, test-input supply
  vehicle, test-data representation. Variation below the line is style, above it a defect; a new
  variation receives an explicit ruling recorded in the block.
- **Four Return Types** — `Option<List<T>>` joins the forbidden nestings: a collection already
  carries emptiness as a value, so the `Option` is a second absence channel. The rule line
  generalizes — each concern appears at most once in a return type; emptiness is the collection's
  own.
- **Four Return Types** — the `Promise` boundary stated exactly: `Promise` marks an operation
  that leaves the process. A long-running CPU-bound computation returns `Result`; scheduling is
  the caller's decision, made visible at the composition site (`Promise.lift`).
- **Appendix A** — a reference realization of the invariant obligation with a property library
  (jqwik), non-normative.

### Changed
- **Error Handling & Composition** — *Defining Typed Errors* rewritten onto the construction idiom
  landed in Pragmatica core: data-carrying failures are records with a trailing `message`
  component and a declared `FACTORY` (message template plus the canonical constructor reference —
  template and data cannot disagree, and the factory is the only construction path); fixed-text
  failures are constants of one prescribed-shape `General` enum per hierarchy, discriminated in
  switches by qualified constant labels. New sections: wrapped and terminal causes
  (`Cause.Wrapped` with the `origin` component, `Cause.Terminal`), rendering at the boundary (the
  exhaustive switch composes user text from data components; `message` is for logs and
  operators), the bare-cause line (a failure is worth a type when a caller can act on it), and
  the fixed-text-to-data migration (compiler-guided, boundary-invisible, name-continuous).
  Worked examples across the book converted; tests assert failure identity, never `message()`
  text.
- **Appendix A** — Causes utilities updated for the same idiom: the typed factory overloads (the
  `causeFactory` receives the values and the formatted message in constructor order, so the
  record's constructor reference is the factory), the `Cause.Terminal`/`Cause.Wrapped` mixins,
  `Locale.ROOT` formatting; the anonymous template factories marked as the ad-hoc tier.
- **Project Structure** — "Module Organization (Optional)" rewritten as **Module Promotion**:
  modules promote derived boundaries (telescope nodes, stratum roots) from lint-checked
  convention to compiler enforcement; promotion is content-invariant; drivers are deployment
  topology (forced), ownership divergence, independent publication, and dependency-direction
  enforcement; the default is no modules. The "team > 5" heuristic replaced by ownership
  divergence. Cut-level verdicts: subsystem natural, workflow rare, use case never. The layer cut
  kept as the enforcement cut; the two cuts compose.
- **Testing Philosophy** — the "3+ conditional branches or complex logic" guideline replaced: the
  space-counting table assigns the business-leaf obligation. Enumerable space → exhaustive
  vectors; unbounded computation → executable invariant plus boundary examples; pure projection →
  covered by the parent's vectors. The invariant obligation is executable — the assertion is the
  invariant, boundaries included, failures reproduce under a fixed or reported seed; the
  input-supply vehicle is style.
- **Testing Philosophy** — the test-data triad ("Which Approach to Use?") replaced by a declared
  default: vectors; a factory method for one systematically varying field; a builder for optional
  fields. The choice is style — the obligation never depends on it.
- **Testing Practice** — the keep/delete criterion for unit tests during migration is now "does
  the leaf carry its own space", replacing "complex logic, many branches".
- **Troubleshooting FAQ** — "blocking code" sharpened to "blocking I/O" in the `Promise.lift`
  checklist.

## [4.8.0] - 2026-08-20

### Added
- **Appendix D: The Use Case Worksheet** — the method at operating altitude, in two parts. Part A
  is filled per use case: the six properties, input parsing into value objects, typed failures,
  return kind per step, zone and pattern per step, recovery response per state-changing step, and
  the four composition obligations. Part B carries the tables consulted while filling it — the four
  return kinds and their allowed nestings, the three zones, the patterns, the recovery triple, and
  what a stub owes. Added to the spine (`root.md`), the appendix table (`index.md`), and the web
  edition at `/java/jbct/worksheet/`.
- **Parse, Don't Validate** (*Pragmatica Core Validation Utilities*) — the predicate preference
  stated: reach for a predicate from the `Verify.Is` catalog before writing the comparison by hand.
  A catalog predicate is tested once in the library; the inline comparison is tested locally. The
  exception is a condition specific to the domain, which is written inline as a business leaf and
  owes a leaf's tests.
- **Basic Patterns** (*Single Level of Abstraction*) — the testability consequence of the rule,
  with branch counts. A credit-score adjustment written as a single method carries 37 conditional
  branches; the same computation decomposed to the rule's standard is six named methods totalling
  35. The decision surface does not shrink; a test reaches six targets directly rather than one.

## [4.7.0] - 2026-08-16

### Added
- **Testing Philosophy** — measured basis for the four-facts rule: mutation testing over two JBCT
  codebases generated 441 logic mutants, none of them in a composition. Every branch sat in a
  value-object predicate, rule, gate, or classifier. The composition's faults are wiring faults,
  which the success path already covers.
- **Testing Philosophy** — mutation testing named as the diagnostic for whether a test discharges
  an obligation or only exercises it. Stated as a diagnostic, not a target, with three limits:
  two thirds of raw mutants are null/empty return replacement and must be filtered out; a codebase
  composing predicates from a library generates few mutants because its decisions move into code
  the tool does not mutate; a near-empty report is a question, not a result.

## [4.6.0] - 2026-08-13

A second testing pass, and the first derived from reading other people's finished suites rather
than from writing new ones. Seven use cases were read end to end across three codebases — a loan
slice, a ticketing system, and a multi-module loan processor — comparing the obligations a
composition's structure implies against the tests that actually exist.

### Added
- **Four facts live at the composition** (*Testing Philosophy*, third rule). The existing second
  rule said a composition adds exactly one fact about validation; asked in general, the answer is
  four kinds, and they were the same four in all seven use cases: the success path, the validation
  failure, **each** I/O failure separately, and **each** absorbed failure. The two per-each clauses
  are the ones suites short-change — a use case that loads an account and then persists a payment
  owes two I/O tests, and five of the seven suites examined got that right while two did not.
  Absorbed failures tie back to the first rule: a dropped failure leaves no trace in the response,
  which is exactly the condition under which that rule calls for an interaction assertion.
- **The obligation checklist** (*Testing in Practice*, use-case coverage). The operational form:
  walk the chain, check off four rows, note which are per-step. Stated as what the 90% figure
  should be *made of*, since a percentage reports how much ran, not whether the right things were
  established.

### Changed
- **Two candidates are named as *not* composition obligations**, because both look like duties and
  neither is. Testing that a failure at step four stops step five tests `flatMap`, which the
  library establishes once; what a composition can actually get wrong is its wiring, and the
  success path already catches that. And the *content* of a step's failure belongs to the rule that
  produces it — assert that the disbursement rules reject a bad principal, not that the rejection
  travels up the chain. Measured against real suites, the mechanical expansion of one failure test
  per step would have produced roughly twice as many tests as anyone wanted.
- **A step that cannot fail is a return-kind violation, not a missing test** (*Testing Philosophy*).
  A method returning `Promise<T>` whose every return is `.success(...)` is neither fallible nor
  asynchronous; its failure test cannot be written at all. The signature is claiming a contract the
  body does not have, and the fix is a plain return value chained with `map`. Found in real code
  while reading the sample.

**Scope.** Seven use cases, three codebases, all written by or under the direction of this book's
author. The rule survived contact with all seven and found genuine gaps in two of them, which is
evidence it is not trivial — but it has not yet met a stranger's code, and that is the test that
would make it general.

## [4.5.0] - 2026-08-11

A naming pass, driven by a grammar-based census of two real JBCT codebases (194 files) rather
than by review. The measurement is what produced every entry below; where the book and the
corpora disagreed, the corpora were right.

### Changed
- **The Zone-verb tables are illustrative, and now say so** (*Basic Patterns*, skill). They were
  written as if closed, and the census found the enumerated verbs head roughly 1.4% of naming
  contributions across both corpora — the vocabulary is overwhelmingly domain terms the list
  could never contain. The tables stay, because the distinction needs something concrete to
  stand on, but they are labelled representative and the reader is told a verb absent from both
  lists is *unlisted, not wrong*. Ten verbs the tables never mentioned account for 419
  occurrences between them.
- **The zone, not the list, is stated as the constraint**, with the distinction that does the
  work named explicitly: **Zone 2 names the intent, Zone 3 names the mechanism.** A step says
  what the workflow needs to happen; a leaf says how it is done. This is what makes a Zone-3
  verb on a step interface a defect rather than a style preference, and it is checkable without
  consulting any table.
- **The mixed-zone anti-pattern is promoted to the primary test**, from a footnote under the
  tables. It is the part of the rule that catches real defects — it found two in the case-study
  repository — and unlike table membership it does not depend on the list being complete.

### Added
- **`find`, `create`, `build`, and `insert` to the Zone 3 table** — the four highest-frequency
  observed verbs the tables omitted (`create` alone occurs 175 times).
- **Predicate naming** (*Basic Patterns*, skill): methods returning `boolean` take `is`, `has`,
  or `can`, and that set is closed. 77 occurrences across the corpora follow this convention and
  the book had never written it down. A predicate never takes a zone verb — `checkExpiry()`
  returning `boolean` should be `isExpired()`.
- **Compiler-forced declarations are outside the naming rules** (*Basic Patterns*). The census
  flagged the utility interface's `record unused()` placeholder as a name fitting no convention,
  which is correct and is the point: a `sealed` type must have a permitted subtype or it does not
  compile, so the record exists to satisfy javac and says nothing about the domain. `unused` is
  named as the canonical form, and the general test is stated — if a declaration would not survive
  a change of language, the naming rules do not reach it.

### Fixed
- **The skill carried a second, larger, contradicting verb list.** `ai-tools/skills/jbct/SKILL.md`
  held a hand-written 31-verb list (11 Zone 2, 20 Zone 3) twenty lines above the synced block
  containing the book's 13, inherited from the external article the zone idea was adapted from
  and never reconciled. Most of the census's "dead" verbs were its, not the book's — the book's
  own table runs about 9 of 13 in real use. The hand-written list is deleted rather than updated;
  the synced block is now the single source, and the new predicate rule is synced too rather than
  hand-copied.
- **Why the utility interface is worth its placeholder, stated with the actual numbers**
  (*Project Structure*). The section asserted that utility interfaces replace utility classes
  without saying what the trade buys. It buys more than it costs: a class needs a private
  constructor, `public static` on every method and `public static final` on every constant, where
  the interface needs one placeholder record and bare declarations, since interface members are
  implicitly public and its fields implicitly `static final`. The saving grows with every member;
  the placeholder is a fixed one-line cost.
- **What `sealed` prevents, corrected** (*Project Structure*). The key points said it "prevents
  external implementation" without saying what that was worth. It is worth more than it looks:
  interface **fields are inherited** by implementors, so an unsealed utility interface lets
  `class X implements ValidationUtils {}` pull `PHONE_PATTERN` into X's namespace — the
  constant-interface antipattern. Static **methods** are not inherited, so on a methods-only
  utility interface `sealed` states intent rather than blocking anything. Both halves are now
  stated, along with the reason to seal uniformly anyway: the distinction then never has to be
  relitigated per file.
- **A second, contradicting verb list inside the book itself** (*Basic Patterns*, The Three-Zone
  Framework). The 31 verbs the skill carried were not the skill's invention — they were copied from
  this section, 390 lines above the naming tables, presented as `Verbs: ...` and reading as closed.
  Removing the skill's copy therefore did not make the book single-source; two book sections still
  disagreed. The inline lists are gone, replaced by what the zones actually mean — Zone 2 names the
  intent, Zone 3 names the mechanism — with a pointer to *Naming Conventions* for representative
  verbs.
- **Two different things were both called "three zones"** (glossary, both editions). The
  architectural model (External / Adapter / Domain) had a glossary entry; the abstraction-level
  model (Zone 1 / 2 / 3) that the naming rules refer to had none, so a reader looking up "Zone 2"
  found layers of architecture instead of levels of abstraction. Both are now defined and each
  points at the other.

## [4.4.0] - 2026-08-05

A testing pass. Every change below came from implementing the book's own testing advice
against real code and finding where it stopped giving answers -- the same method that
produced the *Architecture Synthesis* corrections, applied reflexively.

### Added
- **`PriceCalculator`, implemented and tested** (*PlaceOrder*): the interface was declared
  in Step 5 and never implemented, and *Testing in Practice* named `PricingEngine` as its
  illustration of a complex leaf without ever working one. It is now the book's worked
  example of counting a decision space: eighteen nominal combinations, of which three are
  structurally impossible (an order over the large-order threshold, discounted by at most
  10%, always clears free shipping), leaving fifteen rows in a table. Paired with the one
  test that belongs at the composition -- that the calculated total is the total actually
  charged -- which needs an interaction assertion, because the total never appears in the
  use case's response.
- **An adapter contract test** (*PlaceOrder*, `InventoryChecker`): the book prescribed
  contract tests and no worked example contained one, which left every stub in every
  example an unverified assumption about a boundary. The third case is the load-bearing
  one: a transport exception translated into a typed domain failure is the adapter's whole
  job and the one thing no use case test can reach.
- **Two rules the worked examples already followed silently** (*Testing Philosophy*).
  *Assert on the outcome, except where the effect is invisible in it* -- a transfer that
  retried looks identical to one that did not, which is why `TransferFunds` and
  `PublishArticle` capture calls and the others do not. The rule is neither "avoid mocks"
  nor "verify interactions": assert on the effect where it is visible and on the call only
  where it is not. And *one composition test for propagation, N cheap vectors for the
  space*, which is what `RegisterUser` has been doing by testing validation at two levels.

### Changed
- **Count decisions, not branches** (*Testing in Practice*). The "3+ branches" guideline is
  kept -- checked against an independent JBCT-structured codebase, it predicted every
  isolate-or-not decision correctly -- but it fails in one direction: a branch count cannot
  see a decision expressed as *data*. A limit resolved by looking up two enumerations,
  seven types against five tiers, is thirty-five answers wrapped in four conditionals, and
  rates borderline by branch count while being the most combinatorial rule in the system.
- **"100% coverage" retired as the target for value objects** (*Testing Philosophy*). Four
  hand-picked strings reach 100% line coverage of `Email`; so would two. A metric that
  reports the same number for a careful suite and a lucky one is measuring the paths the
  code has, not the space it decides over. Replaced with a three-way split by space type:
  examples where the space is small and enumerable, a table where it is a finite grid, and
  a stated invariant where it is unbounded. Property-based testing is named as the tool
  class for the third case and deliberately not taught; writing the invariant down is what
  stops four examples from being mistaken for coverage of an infinite space.
- **A branch the composition cannot reach is a design finding** (*Testing in Practice*): a
  two-branch rule reading `Instant.now()` is not cheap-to-reach, it is unreachable, and the
  suite silently changes its answer at the cutoff. The fix is the undeclared dependency,
  not a unit test.

## [4.3.1] - 2026-07-24

Reconciliation with the merged rc3 lint rules.

### Changed
- **Value-object member order** (*Project Structure*): public constants lead; private implementation constants (validation patterns, private formatters) sit at the bottom near their use, exempt from constants-first; the factory / accessor / helper methods carry no enforced relative order (keep conversion pairs like `toJson`/`fromJson` together). Reverses the previous patterns-first ordering to match every value object in the codebase.
- **Test-method naming relaxed to two-or-more segments** (*Chapter Summaries*; *Systematic Application* checklist): `method_[scenario_]expectation` (e.g. `validate_rejectsEmpty`, or the fuller `register_succeeds_forNewEmail`), from the former strict three-segment form, matching the codebase's pervasive readable two-segment names.

## [4.3.0] - 2026-07-15

### Added
- **About the Series** — the series pipeline, reading map, and register note at the head
  of the Introduction (the reading map identical across all three books).
- **Hide the machinery, keep the meaning** — the method's undersold half, named: business
  facts survive into types and combinators (return types state fallibility and absence;
  `Option` parameters state domain optionality; `flatMap` states dependency; `all()`
  states independence; sealed `Cause` states the failure catalog; `*State` states the
  lifecycle; a missing `Result` states a failure designed out — code reads twice, as Java
  by the compiler and as the process by the reader). Capstone section + inventory table in
  *From Process to Patterns*; positioning entry and takeaway in the Introduction; glossary
  entries here and in the series glossary.

### Changed
- **Migration "Phases" → "stages"** (series-consistency rename: the word collided with the
  architecture layer's Phase 4/5/6 — elicit / select / pick-technology; the site glossary
  crosswalk records the rename). Touched: *Migration Strategies*, the exercises appendix,
  chapter summaries.
- **Recovery triple carries the series' long names at first use** (*Null Policy & Error
  Recovery*): BER — *compensate-by-inverse*; FER — *degrade-and-continue*; design-out
  already is its long name (series terminology ruling 2026-07-12; short forms remain the
  compact notation).
- **Pattern catalog grounded in its own derivation** (*Basic Patterns*, *Advanced Patterns*):
  the catalog now leads with its process-side lineage — the data dependency graph — with
  external notation correspondences consolidated into a single convergence aside; discovery
  questions credited to the patterns' own structure.
- **Numbering now derives from the spine.** Chapter files renamed to number-free
  slugs (`parse-dont-validate.md`, not `ch04-…`); reading order and "Chapter N"
  numbering live only in `root.md`; PDF/EPUB builds inject numbers from spine
  position. Letter-suffixed chapters (9b, 15a, 15b) are absorbed into the plain
  sequence — the book is now chapters 1–22. Inserting or moving a chapter is a
  one-line spine edit.
- In-prose cross-references converted from "Chapter N" to title links (104 sites,
  scripted + verified; 83 filename links remapped). `TABLE_OF_CONTENTS.md` retired —
  superseded by the spine and `index.md`.

### Fixed
- **`.recover()` restored to its real, synchronous contract.** Its mapper returns a plain
  value, not a `Promise`; every worked example and exercise that fed it a `Promise`-returning
  lambda now uses the combinator that actually compiles — `fold` for async failure branches
  (the *Transfer Funds* retry aspect, the *Place Order* and appendix saga compensations, the
  *Config* and retry exercises), `mapError` for pure cause mapping (*Register User* token
  errors, *Place Order* payment errors), `orElse` for an async alternative source (the
  cache-then-database exercise), and a bare-value `recover` for degrade-to-empty. Touched:
  *Transfer Funds*, *Register User*, *Place Order*, *Null Policy & Error Recovery*,
  *Pragmatica Core Essentials*, *From Process to Patterns*, *Diagrams*, Appendix B.
- **`Unit.INSTANCE` → `Unit.unit()`** (*Transfer Funds*): the constant does not exist in
  Pragmatica Core; `unit()` is the only accessor.
- **`Option.orElse(null)` → `Option.or(null)`** (*Null Policy & Error Recovery*, *Register
  User*): `orElse` expects another `Option`/supplier and is ambiguous on a bare `null`; `or`
  unwraps to the nullable value a JDBC/jOOQ setter needs — fixed in the pattern text and every
  write-to-nullable-column example.
- **Fire-and-forget confirmation no longer passes a scope-escaping `null`** (*Place Order*):
  the best-effort `SendConfirmation` call moved inside the `flatMap` where the validated
  request is in scope, so it receives the real argument.
- **End-of-chapter exercise pointers realigned to Appendix B** (9 chapters): footers citing
  renumbered or nonexistent exercises (3.6/3.7, 4.4, 5.4) now match the appendix's real
  numbering and titles.
- **The `.or()` fallback family corrected against the real API** (*Null Policy & Error
  Recovery*): `Promise` carries no `.or()` — degrade-to-value on a `Promise` is
  `recover(cause -> value)`; the fallback doc rows and the dashboard graceful-degradation
  example fixed accordingly. The three-tier `Config` fallback now chains `orElse` (which
  keeps the `Option`) before the final unwrapping `.or(...)` — the original chained two
  unwrapping calls and could not compile.

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
