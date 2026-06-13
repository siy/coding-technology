# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2026-06-13

### Added
- **Chapter 9b: Knowledge-Gathering Pipelines** — new chapter developing the knowledge-gathering view (Ch. 2) to implementation depth. Realizes the methodology's *growing context*: stage records carry the previous stage as a type parameter, so the composed type is a compiler-checked proof of pipeline progress; the Pragmatica Core 1.0.0-rc1 `mapWith` / `flatMapWith` / `ensureWith` combinator family collapses each stage to one lambda-free line. Includes the gating-vs-evidence rule: `ensureWith` is where parse-don't-validate runs out (transient outcomes only), while a load-bearing check must return evidence and accrete it. Wired into both build scripts and the TOC.
- **Instrumentation completeness (Ch. 9)** — new subsection in *Pattern: Aspects (Decorators)*: because effects live only at leaves, wrapping every leaf (and every injected dependency) instruments the whole request path by construction, with the business body naming none of it. Reframes the existing logging-at-leaves rule as a completeness guarantee, adds the structural error-telemetry and cross-module-seam points, and a matching key-takeaway.

### Changed
- **Chapter 2 reshaped into a design→code bridge** — *Design Methodology* slimmed to *From Process to Patterns*: keeps the knowledge-gathering view and the data-dependency-graph → pattern → Pragmatica-code mapping (which the pattern chapters and Ch. 9b depend on, and which the implementation-agnostic *Process-First Design* book does not carry), and defers the full design treatment (process-first design, worked design example, data-follows-process, design by elimination, composition at scale, BPMN, ubiquitous language) to the companion *Process-First Design* book. Wired the chapter into both build scripts for the first time — it had been authored at 3.0.0 but omitted from the build.
- **Factory-naming rationale (Ch. 5)** — made explicit that type-named factories (lowercase-first, e.g. `email`, `money`) allow static imports *without collision*, which is the reason shared names like `of`/`create`/`valueOf` are rejected.

### Fixed
- **Emoji rendering in comparison tables** — the `✅`/`❌`/`⚠` marks in the Ch. 3 (return-types) and Ch. 6 (error-handling) comparison tables are emoji codepoints absent from DejaVu, so xelatex rendered them as blank boxes. Added a monochrome **Noto Emoji** fallback (mapped via active-character definitions in `metadata.yaml`, stray variation-selectors stripped) so they render; the font dependency is checked in `build-pdf.sh`.
- **Chapter numbering reconciled with the table of contents** — the 3.0.0 design-methodology insertion (as Chapter 2) had renumbered only the front chapters' titles, leaving everything from *Pragmatica Core Essentials* onward one number behind the TOC (two chapters were both titled "Chapter 3", and the built book skipped from Chapter 1 to Chapter 3 because `ch02-design-methodology` was missing from both build scripts). Added that chapter to the build, and reconciled every body title and cross-reference to the canonical TOC numbering (1–20, with 9b and 15a/15b as lettered sub-chapters). Removed the unused, stale `book/manuscript/` mirror.
- **Factory-naming consistency in examples** — `appendix-b` TransferFunds exercises now use the canonical factories `Money.money(...)` and `TransferFunds.transferFunds(...)` (were `Money.of` / `TransferFunds.create`); `ch11` timeout test uses `UseCase.useCase(...)` (was `UseCase.create`).

## [3.0.0] - 2026-04-12

### Added
- **Design Methodology section** in CODING_GUIDE.md — process-first design, use case identification, data follows process, design by elimination, composition at scale, BPMN as shared language, ubiquitous language, references to emerging direction
- **Series Part 0: Design Methodology** — tutorial with worked e-commerce checkout example
- **Book Chapter 2: Design Methodology** — full treatment with context-specific entities, worked examples, further reading
- **`Promise.await()` forbidden in business logic** — zero-tolerance rule; `@TerminalOperation` for legitimate cases
- **Abandoned `Result`/`Promise` values** — zero-tolerance rule; expression-based code enforcement
- **`@Contract` and `@TerminalOperation` annotations** — replace `@SuppressWarnings` for exemptions

### Changed
- Major version bump to 3.0.0 for new design methodology
- Book renumbered: new Chapter 2 shifts all subsequent chapters by one (20 chapters + 3 appendices)
- ndx section added to CLAUDE.md

## [2.3.1] - 2026-04-11

### Added
- **`Promise.await()` forbidden in business logic** — new zero-tolerance rule; use `@TerminalOperation` for legitimate cases (CLI, fire-and-forget)
- **Abandoned `Result`/`Promise` values** — new zero-tolerance rule; every value must be returned or handled
- **`@Contract` and `@TerminalOperation` annotations** — dedicated annotations replace `@SuppressWarnings` for void return and await exemptions
- **ndx section** in CLAUDE.md for recall palace quick reference

### Changed

## [2.3.0] - 2026-04-06

### Added
- **Aether Coder skill** — full slice development skill covering patterns, resources, deployment, and testing
- **Promise.allOrCancel()** documentation — static and instance variants (1-15 params), cancels remaining on first failure
- **Promise.allOfOrCancel()** documentation — collection variant with cancellation
- **Promise.any()** documentation — first success wins

### Changed
- Updated Pragmatica Core version from 0.25.0 to 1.0.0-rc1 across all documentation, AI tools, examples, and training
- Updated JBCT version from 2.2.0 to 2.3.0 in book metadata
- Corrected Promise.all() arity documentation from 1-9 to 1-15
- Documented instance all()/allOrCancel() for-comprehension style variants
- Fixed instance all() description to reflect parallel execution (was sequential, now fixed in core)

## [2.2.0] - 2026-03-27

### Changed
- Renamed "Pragmatica Lite" to "Pragmatica Core" across all documentation, book, series, articles, and tools
- Updated Pragmatica Core version from 0.11.2 to 0.25.0
- Updated GitHub URLs from `siy/pragmatica-lite` to `pragmaticalabs/pragmatica`
- Stripped CLAUDE.md to essentials — Java formatting and API reference delegated to jbct skill/agent
- Synced project-local AI tools (jbct-coder, jbct-reviewer, jbct skill) from authoritative system versions
- Added proactive SKILL.md loading to jbct-coder and jbct-reviewer agents
- Added spec/plan backreference verification step to jbct-coder self-validation
- Replaced abstract version numbers with last-modified timestamps in AI tool headers

## [2.1.6] - 2026-03-25

### Added
- Documented when `void` return type is the right choice: API conformance and fire-and-forget side effects
- Added library value objects section to book chapters (ch03, ch04) and series (part-03)
- Added `Verify.Is::present` to API reference listings (combined not-null + not-blank for CharSequence)

### Changed
- Redesigned front page quick-start with ecommerce `CreateUserRequest` example showing `Result.all()` composition
- Migrated string validation from `Verify.Is::notNull` to `Verify.Is::present` across all docs, examples, and AI tools
- Clarified `Void` type parameter (forbidden) vs `void` return type (fire-and-forget) across guide, series, book, and AI tools
- Fixed JBCT method chain dot alignment in all code examples
- Mentioned Pragmatica Core library value objects (`Email`, `Url`, `Uuid`, `NonBlankString`, `IsoDateTime`)
- Updated website styles

## [2.1.5] - 2026-02-07

### Changed
- Version bump for next development cycle

## [2.1.4] - 2026-02-01

### Changed
- Version bump for next development cycle

## [2.1.3] - 2026-01-19

### Added
- **RFC-0008: Aspect Framework** - Compile-time aspect framework for cross-cutting concerns
  - Core interfaces: AspectConfig, AspectFactory, Cache<K,V>
  - Annotations: @Aspect(CACHE, LOG, METRICS, RETRY, TIMEOUT), @Key
  - Hierarchical TOML config: [slice.method.section] → [slice.section] → [default.section]
  - Aspects.with*() composition utilities
  - Key extraction from request records

### Changed
- **Pragmatica Core** updated from 0.9.10 to 0.25.0
  - Updated all documentation, examples, and dependency references
- **RFC-0002: Dependency Protocol** - Improved proxy design
  - Replaced direct invoker.invoke() with pre-built MethodHandle pattern
  - Added MethodHandle<R, T> interface with invoke(), fireAndForget()
  - methodHandle() returns Result - parsing failures caught at factory time
  - Updated all proxy examples to use handle-based design

## [2.1.2] - 2026-01-13

### Added
- **jbct-designer Agent** - new AI agent for JBCT-based architecture design
  - Use *before* implementation to validate architecture and select patterns
  - 8-step design methodology with gap detection
  - Discovery questions by pattern
  - Output format for implementation-ready designs
  - Workflow: jbct-designer → jbct-coder → jbct-reviewer
- **Common Language: Developer-Business Vocabulary** - patterns as shared language
  - CODING_GUIDE.md: New section in Foundational Concepts
  - series/part-01-foundations.md: Added paragraph with translation examples
  - book/ch01-introduction.md: Added paragraph
  - Key insight: "First we verify, then we process, then we notify" = Sequencer
- **Gap Detection Through Patterns** - systematic requirement discovery
  - CODING_GUIDE.md: New section in Patterns Reference
  - series/part-05-basic-patterns.md: New section with discovery questions
  - series/part-06-advanced-patterns.md: Discovery questions for advanced patterns
  - book/ch07-basic-patterns.md: New section
  - book/ch08-advanced-patterns.md: New section
  - jbct-reviewer.md: Step 7 added to Review Methodology
- **Discovery Questions by Pattern** - questions each pattern generates
  - Per-pattern tables: Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects
  - Gap signal → Question to raise mapping
  - Added to CODING_GUIDE.md, series, book, and jbct-reviewer
- **The Six Patterns That Cover Everything** - follow-up article
  - Articles: `articles/six-patterns-that-cover-everything.md`
  - Common language concept, gap detection, right questions
  - Before/after example showing precision gain
- **Request Processing as Data Transformation** - foundational concept
  - Articles: `articles/underlying-process.md` (full article)
  - Articles: `articles/linkedin-data-transformation.md` (LinkedIn post)
  - CODING_GUIDE.md: New section in Foundational Concepts
  - Book: ch01-introduction.md expanded with new section
  - Key insight: sync/async and parallel/sequential are execution details, not structural concerns
  - JBCT patterns as universal primitives for data flow

### Changed
- **jbct-coder.md** - Added Related Agents section with workflow context
- **jbct-reviewer.md** - Added Related Agents section, gap detection step, output format section

## [2.1.1] - 2026-01-08

### Added
- **Parallel JBCT Review System**
  - `/jbct-review` skill for thorough parallel code review
  - 10 focused review areas for comprehensive coverage
  - Severity-based consolidation of findings
  - Support for path and focus arguments
- **fold() Alternatives** guidance across documentation
  - jbct-coder.md: Decision guide and patterns
  - jbct-reviewer.md: Detection of fold() abuse in Quick Reference
  - skills/jbct/patterns/fold-alternatives.md: Full reference with examples
- **Comprehensive Tooling Documentation**
  - AI-TOOLING.md: Claude Code skills, agents, and commands
  - CLI-TOOLING.md: jbct CLI with all 37 lint rules
  - MAVEN-PLUGIN.md: Build integration and CI setup
  - Website navigation updated with Tools section

### Changed
- **jbct-reviewer.md** enhanced with parallel review support
  - Focus parameter for narrow, thorough reviews
  - 10 focus areas with specific violation patterns
  - Improved Quick Reference with fold(), Void detection
- **Pragmatica Core** updated from 0.9.9 to 0.9.10
- **jbct-cli** referenced version updated to 0.4.6

## [2.1.0] - 2026-01-06

### Added
- **Logging Philosophy** section across documentation
  - CODING_GUIDE.md: Full section in Patterns Reference (Aspects)
  - book/ch08-advanced-patterns.md: Subsection with rationale and examples
  - skills/jbct/patterns/aspects.md: Condensed reference with anti-patterns
  - Principle: logging only at leaves and external boundaries
  - Implementation via aspects wrapping leaf implementations
  - Practical considerations: sensitive data sanitization, correlation propagation, high-volume operations
  - "Value highway" testing approach for composition verification

## [2.0.11] - 2026-01-02

### Changed
- **Pragmatica Core** updated from 0.9.3 to 0.9.4
  - TCP Server optimizations (TCP_NODELAY, PooledByteBufAllocator)
  - Consensus Netty network layer
  - Core API unchanged - version bump only

## [2.0.10] - 2026-01-01

### Changed
- **Pragmatica Core** updated from 0.9.0 to 0.9.3
  - 0.9.1: Dependency updates, deprecation warning fixes
  - 0.9.2: KSUID (replaces ULID), JOOQ integration module
  - 0.9.3: Consensus module (CFT protocol)
  - Core API unchanged - version bump only
- **Fixed deprecated `Verify.ensure()` syntax** across documentation
  - Old: `Verify.ensure(CAUSE, value, predicate)` (deprecated, forRemoval)
  - New: `Verify.ensure(value, predicate, CAUSE)` (cause-at-end)
  - Updated: articles/value-objects-cookbook.md, articles/parse-dont-validate.md, CODING_GUIDE.md, README.md
- **jbct-cli 0.4.3 improvements** (parser and formatter fixes)
  - Farthest failure tracking for better error positions
  - Multiple formatter alignment fixes
  - JBCT-SEAL-01 and JBCT-PAT-02 false positive fixes

## [2.0.9] - 2025-12-27

### Changed
- JBCT CLI lint rules count updated from 33 to 36

## [2.0.8] - 2025-12-26

### Changed
- **Pragmatica Core** updated from 0.8.6 to 0.9.0
  - New: `Verify.ensureOption()` for elegant `Result<Option<T>>` validation pattern
  - New: TOML Parser (not documented in JBCT guides)
- **Documentation updates** for `Verify.ensureOption()` pattern
  - CLAUDE.md API reference section
  - CODING_GUIDE.md ReferralCode example
  - jbct-coder.md and jbct-reviewer.md agent configurations
  - Series files: parts 2, 3, 4, 9 with ensureOption examples
  - Book chapters: ch02, ch04, ch05, ch12 with ensureOption pattern
- **Series part count** updated from 9 to 10 across all series files

## [2.0.7] - 2025-12-24

### Changed
- **Pragmatica Core** updated from 0.8.5 to 0.8.6
  - New: `Result.sequence()` for collecting results from iterables
  - New: `.getOrThrow()` for Result and Option
  - New: Instance `all()` for Option and Promise (was Result-only)
- CLI lint rules count updated from 23 to 33

## [2.0.6] - 2025-12-22

### Added
- **Monetization links** - Book and GitHub Sponsors links in site navigation and footer
- **Services page** - Consulting offerings with pricing (CONTACT.md → "Work With Us")
- **File structure guidelines** - Standardized internal structure for JBCT source files
  - Import ordering convention (java → javax → pragmatica → third-party → project → static)
  - Member ordering by file type (use case, value object, error interface, step implementation, utility interface)
  - Utility interface pattern with sealed + `unused` record
  - Added to CODING_GUIDE.md, series/part-09, book/ch15, jbct-coder.md, jbct-reviewer.md
- **Article series for JBCT promotion** - 5-part series for Medium/Dev.to publication

### Changed
- CLI lint rules count updated from 23 to 33
- Repository cleanup and build artifact management
- **Medium compatibility** - Replaced tables with lists in article series for better rendering
- **Pragmatica Core** updated from 0.8.4 to 0.8.5 in all documentation and examples
  - Breaking: `Verify.ensureFn()` removed - use `.filter(cause, predicate)` instead
  - New: RateLimiter with Token Bucket algorithm
  - New: `Result.tryOf()` aliases, `Result.onOk()/onErr()/run()` aliases
  - New: Instance `all()` methods for for-comprehension style
  - Migrated 108 `ensureFn` occurrences across 35 files to `filter` pattern

## [2.0.5] - 2025-12-18

### Added
- **Broader movement acknowledgment** - Added note in Chapter 1 that JBCT is part of a wider industry trend toward compile-time guarantees and type-driven design

### Removed
- **Appendix D (Quick Reference Cards)** - Removed from book due to EPUB rendering issues

## [2.0.4] - 2025-12-14

### Added
- **Tools section in README.md** - Reorganized documentation structure
  - "AI Tools" subsection for Claude Code skill and subagents
  - "CLI Tools" subsection for jbct-cli and Maven plugin
- **JBCT CLI integration** - AI tools now aware of jbct-cli
  - jbct-coder.md: Suggests running `jbct check` after code generation
  - jbct-reviewer.md: Recommends `jbct check` before manual review
  - skills/jbct/SKILL.md: References CLI tool for automated checking
  - All tools suggest installation when CLI not found
- **Tooling section in CODING_GUIDE.md** - Brief overview pointing to README
- **jbct-reviewer.md added to website build**
- **"Why Result" philosophy section** - Error handling mechanism comparison
  - Added to CODING_GUIDE.md, series/part-02-four-return-types.md, book/ch02 and ch05
  - Comparison table: checked/unchecked exceptions, Go-style, functional Result
  - Explains transparency, ergonomics, reliability trade-offs
- **"Promise as Async Result" note** - Clarifies Promise/Result relationship
  - Added to CODING_GUIDE.md, series/part-02, book/ch02
  - Emphasizes symmetry and conversion patterns

## [2.0.3] - 2025-12-14

### Added
- **Static imports section** - Encouraged use of static imports for factory methods and Pragmatica Core APIs
  - Added to jbct-coder.md, jbct-reviewer.md, CODING_GUIDE.md, skills/jbct/SKILL.md
  - Reduces code verbosity while maintaining readability
- **Fluent failure creation** - Explicit preference for `cause.result()` over `Result.failure(cause)`
  - Added anti-pattern documentation with examples
  - Updated all code examples to use fluent style
- **Book content** - Complete JBCT book with 19 chapters and 4 appendices
- **CI workflow** - GitHub Actions workflow to build book PDF
- **Book feedback fixes** - Comprehensive improvements based on Java 25 reviewer feedback
  - JBCT abbreviation decoded on first use ("Java Backend Coding Technology")
  - Prerequisites updated: Mid-/senior Java developers, Java 21+, FP basics
  - "Pragmatic, Not Pure" section clarifying JBCT's non-academic FP approach
  - Return Type Matrix with allowed/discouraged/forbidden nesting rules
  - Validation placement guidelines (value object vs ValidRequest vs use case)
  - Programming errors vs business errors clarification
  - Null policy consolidation statement
  - Fork-Join infrastructure-level dependency warnings (DB locks, rate limits)
  - Aspects operational semantics (timeout, retry, composition order)
  - Test speed classification (fast/slow integration tests)
  - Async Promise testing patterns with timeouts
  - Interoperability section: Optional→Option, CompletableFuture→Promise, exceptions→Cause

### Changed
- **Pragmatica Core** updated from 0.8.3 to 0.8.4 in all documentation and examples
  - New in 0.8.4: Extended `all()`/`Fn`/`Tuple` support from 9 to 15 parameters
  - New integration modules: HTTP Client, JDBC, R2DBC, JOOQ R2DBC
- **jbct-coder.md** and **jbct-reviewer.md** synchronized with system agent definitions
- **ch01-introduction.md**: Prerequisites, JBCT decode, "Pragmatic Not Pure" section
- **ch02-four-return-types.md**: Return Type Matrix (allowed/discouraged/forbidden)
- **ch04-parse-dont-validate.md**: Validation placement guidelines
- **ch05-error-handling.md**: Programming vs business errors clarification
- **ch06-null-policy-recovery.md**: Consolidated null policy statement
- **ch08-advanced-patterns.md**: Fork-Join infra warnings, Aspects operational semantics
- **ch11-testing-practice.md**: Test speed classification, async testing patterns
- **ch17-migration-strategies.md**: Interoperability section (Optional, CF, exceptions)

## [2.0.2] - 2025-12-06

### Added
- **Part 10: Systematic Application Guide** - New series part with checkpoints for coding and review
  - 8 checkpoints covering lambdas, return types, factories, class design, chains, logging, review, and implementation patterns
  - Quick reference violation → fix tables
  - Application order for new code and reviews
  - Nested record vs lambda pattern decision tree
  - Conditional Option composition patterns
  - Validation ownership rules

### Changed
- **Series expanded from 9 to 10 parts** with systematic application guide
- **jbct-coder.md v2.0.2**
  - Added Thread Safety and Immutability section with Fork-Join safety rules
  - Added grouped error enum pattern (`enum General` for fixed-message errors)
  - Added exception mapping with constructor references pattern
  - Updated `Causes.forValue()` to `Causes.forOneValue()` (deprecated name fix)
  - Updated `.match()` to `.fold()` in controller example (correct API)
  - Added Part 10 to references
- **jbct-reviewer.md v2.0.2**
  - Added Thread Safety and Immutability section with Fork-Join checks
  - Added Zone-Based Abstraction Check section with Derrick Brandt attribution
  - Added direct constructor invocation check (bypassing factory methods)
  - Added Verify.Is/parse utilities usage checks
  - Updated `Causes.forValue()` to `Causes.forOneValue()` (deprecated name fix)
  - Enhanced review methodology with zone-based abstraction verification
- Updated series INDEX.md to reflect 10-part structure
- Synced subagents with hivemq-assignment project updates
- Copied updated subagents to system location (~/.claude/agents/)

## [2.0.1] - 2025-11-17

### Fixed
- **Causes API consistency**: Replaced deprecated `Causes.forValue()` with `Causes.forOneValue()` across all documentation
- **Template syntax**: Changed `{}` placeholders to `%s` (String.format syntax) in all Causes factory examples
- **CLAUDE.md API Reference**: Added comprehensive Causes utilities documentation with correct template syntax
- **ValidOrder examples**: Extracted `calculateTotal()` method to follow Single Level of Abstraction principle
- **Error type references**: Renamed `UserLoginError` to `LoginError` to match actual interface definitions
- **UserError interface**: Added `EmailExists` enum constant with consistent naming (`EMAIL_EXISTS`)

## [2.0.0] - 2025-11-13

**Major release: Thread Safety, Concurrency, and Series v2.0.0 (100% Parity)**

### Added

- **Foundational Concepts: Immutability and Thread Confinement**
  - Comprehensive section explaining thread safety model
  - Clear distinction between what MUST be immutable vs what CAN be mutable
  - Thread confinement as key safety mechanism
  - Safe local mutable state example with detailed explanation

- **Promise Resolution and Thread Safety**
  - Documents exactly-once resolution guarantee
  - Explains synchronization point semantics
  - Shows thread-safe resolution with multiple racing threads
  - Details transformation execution order and side effect independence

- **Fork-Join: Independence and Thread Safety unified section**
  - Rewrote to show independence and thread safety as two views of same requirement
  - Added thread safety violation examples (shared mutable state, data races)
  - Enhanced anti-patterns with mutation examples
  - Pattern-specific safety rules inline

- **Thread Safety Quick Reference table** (before Testing Strategy)
  - Comprehensive table for all patterns (Leaf, Sequencer, Fork-Join, Iteration, Condition)
  - Columns: Thread Safety Model, Local Mutable State, Input Data, Result Data
  - Key principles and common mistakes sections
  - Quick lookup for developers

- **Thread Safety notes for each pattern**
  - Leaf: Thread-safe through confinement
  - Sequencer: Safe through sequential execution
  - Iteration: Sequential safe with accumulators, parallel needs immutability
  - Each pattern section now includes thread safety subsection

- **Testing: Mutable test state is acceptable**
  - Explains why mutable test state is safe (single-threaded execution)
  - Example with call log accumulator
  - Clarifies this doesn't violate production immutability rules

- **Series v2.0.0: 100% Parity with CODING_GUIDE.md v2.0.0** (+1,439 lines across all parts)
  - **Part 1: Quick Reference** (+193 lines)
    - Pattern decision tree for selecting correct return type
    - Four Return Kinds reference table
    - Type transformations cheat sheet (Option→Result→Promise)
    - Naming conventions summary (factory methods, validated inputs, zone-based verbs)
    - Positioned after "Setting Up" for immediate use
  - **Part 2: Null Policy** (+237 lines)
    - When null IS acceptable (adapter boundaries only)
    - When null is NOT acceptable (business logic, parameters, returns)
    - `Option.option(nullable)` wrapping pattern
    - Complete examples with repositories and DTOs
  - **Part 2: Error Recovery Patterns** (+172 lines)
    - `.or()`, `.orElse()`, `.recover()` for fallback values
    - Graceful degradation strategies
    - Default values and safe mode examples
    - Multi-level fallback chains
  - **Part 2: Expanded Monadic Composition Rules** (+75 lines)
    - Lambda composition guidelines (what belongs inside/outside)
    - Forbidden patterns (direct field access, nested lambdas)
    - Single pattern per function enforcement
    - Common violations with corrections
  - **Part 2: Pragmatica Core API Reference** (+214 lines)
    - Complete type conversions table
    - Factories (creating instances)
    - Exception handling (lift methods)
    - Validation utilities (Verify.Is predicates)
    - Parse subpackage (JDK wrappers)
    - Aggregation (all/any/allOf)
    - Common methods reference
  - **Part 3: Zone-Based Abstraction Framework** (+62 lines within Single Level of Abstraction)
    - Three zones: Use Case, Orchestration, Implementation
    - Zone-specific verb vocabulary
    - Attribution to Derrick Brandt with link
    - Clear abstraction level boundaries
  - **Part 3: Naming Conventions** (+168 lines)
    - Factory method naming rules
    - Validated input naming (`Valid` prefix)
    - Zone-based verb selection
    - Acronym naming (treat as words: `HttpClient` not `HTTPClient`)
    - Test naming patterns
    - Complete examples for each convention
  - **Part 4: Thread Safety Quick Reference** (+183 lines)
    - Pattern-by-pattern thread safety guarantees
    - Leaf, Sequencer, Fork-Join, Iteration, Condition safety models
    - Common mistakes checklist
    - Independence validation for Fork-Join
    - Mutable state guidelines
  - **Part 6: Module Organization** (+187 lines)
    - Multi-module project structure
    - When to use modules vs single module
    - Gradle and Maven examples
    - Module dependency management
    - Build configuration best practices

### Changed

- **Series restructured from 6 to 9 parts for better learning progression**
  - Part 2 split into 2A (Four Return Types), 2B (Parse Don't Validate), 2C (Error Handling)
  - Part 5 split into 5A (Testing Philosophy), 5B (Testing Practice)
  - Each section now focused and digestible (~450-700 lines vs 2000+)
  - Improved navigation with clear prerequisites and next steps
  - All cross-references updated throughout series
- **Series INDEX.md**: Updated version to 2.0.0 with complete changelog
  - Added all new topics to each part's topic list
  - Updated version history with comprehensive v2.0.0 details
  - Progressive terminology transition documented
  - Thread safety and 100% parity milestones captured
- All pattern sections enhanced with thread safety information
- Zone-based naming integrated throughout series with Derrick Brandt attribution
- Moved basic testing from Part 5 to Part 2 for earlier verification capability

### Fixed

## [1.8.2] - 2025-11-09

**Enhanced documentation for easier adoption**

### Added
- **README: 30-Second Pitch** with before/after code comparison
  - Shows validation hell → parse-don't-validate transformation
  - Concrete example highlighting immediate benefits
  - Positioned at top of README for maximum impact

- **README: Quick Wins section** for incremental adoption
  - Three small changes developers can make today (10 minutes each)
  - Win 1: Convert one value object to parse-don't-validate
  - Win 2: Convert one service method to return Result<T>
  - Win 3: Convert one test to functional assertions
  - Emphasis: "You don't have to rewrite everything"

- **Part 2: Spring to JBCT Translation table**
  - Maps familiar Spring patterns to JBCT equivalents
  - Clear guidance on @Service → use case, @Repository → adapter, etc.
  - Example showing traditional vs JBCT Spring controller
  - Reduces barrier for Spring Boot developers

- **Part 2: "Why Not Java Standard Library?" comparison**
  - Table comparing null, Optional, exceptions, CompletableFuture to JBCT types
  - Shows concrete problems with traditional Java approaches
  - Explains why four types are necessary

- **Part 2: Migration strategy for existing codebases**
  - Three-phase incremental adoption path
  - Keep existing @Valid annotations, add parsing layer
  - Gradual migration from services to value objects
  - Real-world Spring controller example

- **Part 2: Real-world validation examples**
  - Cross-field validation (DateRange with end > start)
  - Dependent validation (password must not contain username)
  - Business rule validation (order total matches line items)
  - Error accumulation with Result.all()

- **Part 2: "When Exceptions Are Still OK" section**
  - Programming errors vs business failures distinction
  - Legitimate exception uses (IllegalArgumentException, framework boundaries)
  - Clear table showing when to use Result vs exceptions

- **Part 2: Basic testing moved forward from Part 5**
  - Functional assertion pattern (onSuccess/onFailure)
  - Examples for Result, Promise, and Option
  - Test naming convention (methodName_outcome_condition)
  - Allows developers to verify code immediately after learning concepts

- **Part 2: Pragmatica Core Quick Reference**
  - Common imports and method cheat sheet
  - Frequently used patterns with descriptions
  - Positioned after validation utilities section

- **Part 3: "Why This Rule Exists" section for Single Pattern Per Function**
  - Shows concrete pain points of mixing patterns
  - Testing brittleness, debugging confusion, code review issues
  - Demonstrates benefits of separation

- **Part 1: Evaluation Framework worked example**
  - Complete analysis of @Transactional vs explicit transactions
  - Applies all 5 criteria with scoring
  - Shows how every JBCT decision is made objectively

### Changed
- **Progressive "Smart Wrapper" → "monad" terminology** across series
  - Part 1: 90% "Smart Wrapper", 10% "monad" (gentle introduction)
  - Part 2: 70% "Smart Wrapper", 30% "monad" (building familiarity)
  - Part 3: 50/50 mix with transition statements
  - Part 4: 70% "monad" (primary term established)
  - Parts 5-6: 80-100% "monad" (correct FP terminology)
  - Eliminates FP phobia while teaching correct terminology

- **Part 3: Simplified async iteration example**
  - Replaced complex reduce with simple for-loop version
  - Shows reduce as "alternative" with note: "clarity matters more than cleverness"
  - Makes async iteration immediately understandable

- **Part 1: Added "Try It Now" exercises**
  - After Smart Wrappers introduction
  - Encourages code exploration before moving to Part 2
  - Observation-focused (don't change yet, just notice patterns)

- **Terminology clarifications**
  - Part 2: Added note that "Cause" ≠ exception cause (means "FailureReason")
  - Part 3: Clarified "Leaf" as "(atomic operation with no substeps)"
  - Part 2: First code example shows full imports for API context

- **CODING_GUIDE.md: Major comprehensive improvements (+1074 lines)**
  - Added complete **Foundational Concepts** section (~250 lines)
    - Side effects and purity explanation
    - Composition fundamentals
    - Smart Wrappers (Monads) with "Do, If/When Available" mental model
    - Functional vs imperative comparison
    - Pipes and values mental model
  - Added **Evaluation Framework worked example**
    - Complete @Transactional analysis with 5-criteria scoring
    - Shows objective decision-making process
  - Added **Spring to JBCT Translation** table
    - Maps @Service, @Repository, @Valid, etc. to JBCT equivalents
    - Before/after Spring controller example
    - Reduces adoption friction for Spring Boot teams
  - Added comprehensive **Testing Strategy** section (~580 lines)
    - Problem with traditional component-focused testing
    - Integration-first philosophy with criteria justification
    - Three testing layers (value objects, leaves, use cases)
    - Evolutionary testing process (Phase 1-N)
    - Complex input handling (3 solutions: builders, vectors, factories)
    - Managing large test counts (3 strategies: nested classes, parameterized, file organization)
    - When to write unit tests (clear guidelines)
    - Migration guide from traditional unit testing
  - Added **Real-World Validation Scenarios** (~95 lines)
    - Cross-field validation (DateRange)
    - Dependent validation (password/username)
    - Business rule validation (order totals)
    - Error accumulation with Result.all()
  - Added **Incremental Adoption Strategy** (~95 lines)
    - 4-phase migration path for existing codebases
    - Keep existing validation while adding JBCT
    - Gradual shift from service layer to value objects
    - Timeline guidance (3-6 months)
  - Added **Pragmatica Core Quick Reference** (~45 lines)
    - Common imports cheat sheet
    - Frequently used patterns with descriptions
    - Positioned early for immediate reference
  - All examples updated with commented-out private constructors
    - `// private Email {}  // Not yet supported in Java`
    - Team discipline note about package-private limitation
  - Terminology note added to Smart Wrappers section
    - Explains Smart Wrapper ↔ monad equivalence
    - Connects to broader FP ecosystem

**Impact:** CODING_GUIDE.md evolved from 3076 lines to 4150 lines of comprehensive, reference-quality documentation that bridges theoretical concepts with practical implementation guidance.

## [1.8.1] - 2025-11-08

### Added
- **Syntax highlighting for code blocks** on pragmatica.dev website
  - Integrated highlight.js with GitHub light/dark themes
  - Dynamic theme switching synced with site theme toggle
  - Fixes Firefox rendering issue where Java code blocks appeared as unreadable gray boxes
- **Cross-references between JBCT skill and subagents**
  - Added "When to Use Specialized Subagents" section to skills/jbct/SKILL.md
  - Clear guidance on when to use jbct-coder vs jbct-reviewer vs skill
  - Invocation instructions with Task tool for both subagents
  - Inline tips in workflow and mistakes sections
  - Enhanced External Resources section highlighting subagent capabilities

### Changed
- **All version references updated** from 1.8.0 to 1.8.1
- **Pragmatica Core API corrections** in CLAUDE.md and jbct-coder.md
  - Added missing factory methods: `Option.from(Optional)`, `Result.unitResult()`, `Promise.unitPromise()`
  - Corrected lift methods: removed non-existent `Promise.async(Runnable)`, use `Promise.lift(ThrowingRunnable)` instead
  - Added missing aggregation: `Promise.failAll()`, `Promise.cancelAll()`
  - Added missing callback methods: `.apply()`, `.fold()`, `.withSuccess()`, `.withFailure()`, `.withResult()`
  - Added Promise-specific operations: `.resolve()`, `.succeed()`, `.fail()`, `.cancel()`, `.isResolved()`, `.timeout()`, `.mapResult()`, `.replaceResult()`, `.trace()`
  - Added query and unsafe operations: `.isPresent()`, `.isEmpty()`, `.isSuccess()`, `.isFailure()`, `.unwrap()`, `.expect()`, `.stream()`, `.toOptional()`
- **JBCT Learning Series consistency fixes** (30 improvements across 6 parts)
  - Fixed navigation metadata: Updated parts 1-3 from "of 5" to "of 6", added "Part: 5 of 6" header
  - Fixed API violation: Changed `Verify.Is::minLength` to `Verify.Is::lenBetween` in Part 6
  - Consolidated testing content: Removed duplication from Part 4, standardized to functional assertion style in Part 5
  - Fixed naming convention: Changed all `ValidatedUser` occurrences to `ValidUser` in Part 6
  - Added forward references: Fork-Join (Part 2), package organization (Part 2), exception handling (Parts 2-3-6)
  - Added definitions: Unit type (Part 3), test vectors (Part 5), monad practical usage (Part 1)
  - Added Promise.allOf() to composition cheat sheet (Part 2)

## [1.8.0] - 2025-10-21

### Added
- **Comprehensive Null Policy** across all JBCT documentation
  - Added dedicated "Null Policy" section to CODING_GUIDE.md
  - Added null policy to skills/jbct/fundamentals/four-return-kinds.md with examples and summary table
  - Added null policy to jbct-coder.md with clear rules and patterns
  - Added null policy to jbct-reviewer.md with review checklist
  - Core principle: "Null exists only at system boundaries, business logic uses Option.none()"
  - Defined when null IS acceptable: adapter boundaries (wrapping external APIs, database nullable columns, test inputs)
  - Defined when null is NOT acceptable: business logic returns, component parameters, null checks
  - Pattern guidance: `Option.option(nullable)` at adapter entry, `.orElse(null)` at adapter exit (DB writes only)
- **Structured JBCT Skill for Claude Code**
  - Reorganized skills/jbct/ with progressive detalization structure
  - fundamentals/: four-return-kinds.md, parse-dont-validate.md, no-business-exceptions.md (3 files)
  - patterns/: leaf.md, sequencer.md, fork-join.md, condition.md, iteration.md, aspects.md (6 files)
  - use-cases/: structure.md, complete-example.md (RegisterUser walkthrough) (2 files)
  - testing/: patterns.md (functional assertions, test organization) (1 file)
  - project-structure/: organization.md (vertical slicing) (1 file)
  - Total: 13 detailed markdown files for granular topic access
  - Updated SKILL.md with references to detailed resources
  - Updated README.md with complete structure overview
  - Self-contained package ready for distribution

### Changed
- **All version references updated** from 1.7.0 to 1.8.0

## [1.7.0] - 2025-10-20

### Added
- **proposals/private-record-constructors.md** - JEP proposal for enabling private canonical constructors in records
  - Complete JEP following OpenJDK JEP 2.0 format
  - Motivation: Enable parse-don't-validate pattern with records
  - Examples comparing current workarounds vs proposed feature
  - Integration with value object patterns
- **Factory method anti-pattern guidance** across all documentation
  - Explicit prohibition of nested record implementations in use case factories
  - Clear examples showing wrong (nested record) vs correct (lambda) patterns
  - Added to jbct-coder.md, CODING_GUIDE.md, jbct-reviewer.md
  - Rule: "Records are for data, lambdas are for behavior"

### Changed
- **Use case factory examples** - All examples now use lambda returns instead of nested records
  - jbct-coder.md RegisterUser example fixed
  - CODING_GUIDE.md RegisterUser and GetUserProfile examples fixed
  - series/part-06-production-systems.md RegisterUser and GetUserProfile examples fixed
  - Reduces verbosity from 10+ lines to 5 lines per factory
- **jbct-coder.md Maven preference** - Added explicit instruction to prefer Maven over Gradle
  - Maven marked as "(preferred)"
  - Gradle marked as "(only if explicitly requested)"
- **jbct-reviewer.md build configuration checks**
  - Added Pragmatica Core dependency verification
  - Check for correct groupId, artifactId, version
  - Build configuration added as Critical priority
  - New review section for dependency issues
- **Pragmatica Core dependency specification** - Added Gradle coordinates alongside Maven in all docs
  - README.md, CODING_GUIDE.md, CLAUDE.md
  - Full artifact coordinates: `org.pragmatica-lite:core:0.8.3`
  - Both Maven and Gradle examples provided

### Fixed
- **Terminology consistency** - "Validated Request" → "Valid Request" in CODING_GUIDE.md
- **Grammar improvements** - "the factory method which builds" → "factory method that builds"
- **All version references updated** from 1.6.2 to 1.7.0

## [1.6.2] - 2025-10-19

### Added
- **jbct-reviewer.md** - Claude Code subagent for JBCT-specialized code review
  - Reviews code for JBCT compliance (Four Return Kinds, Parse Don't Validate, No Business Exceptions)
  - Checks structural patterns (Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects)
  - Validates project structure and naming conventions
  - Enforces testing requirements
  - Provides actionable feedback with severity levels and examples
- **Unit type guidance** in CODING_GUIDE.md, jbct-coder.md, and Critical Rules Checklist
  - Explicit prohibition of `Void` type usage
  - Mandatory use of `Result<Unit>` or `Promise<Unit>` for operations without meaningful return values
  - Use `Result.unitResult()` for successful `Result<Unit>` creation
- **Project Structure & Package Organization** section in jbct-coder.md
  - Vertical slicing architecture guidelines
  - Package naming conventions and placement rules
  - Layer responsibilities (domain, usecase, adapter)
  - Value object, cause, and step placement rules
- **Testing Requirements** section in jbct-coder.md
  - Mandatory tests (value objects, use cases with end-to-end stubs)
  - Recommended tests (complex leaves, adapters)
  - Functional assertion patterns with onSuccess/onFailure
  - Test organization guidelines
- **Website dark mode feature**
  - Manual theme toggle button with localStorage persistence
  - System preference detection via prefers-color-scheme
  - No-flash initialization script
  - Dark mode CSS variables and styles

### Changed
- **README.md AI collaboration section** replaced with Claude Code Subagents section
  - Added download links for jbct-coder.md and jbct-reviewer.md
  - Installation instructions for subagents (~/.claude/agents/)
  - Usage guidance for invoking subagents
- **All version references updated** from 1.6.1 to 1.6.2

## [1.6.1] - 2025-01-17

### Added
- **INVISIBLE_MIDDLE_LAYER.md** - New article explaining architectural philosophy behind the Coding Technology
  - Explains how coordination mechanics disappear into the type system
  - Three-layer architecture model (Business Domain, Coordination, Language/Runtime)
  - Concrete examples comparing traditional, intermediate, and Coding Technology implementations
  - Pattern demonstrations showing how each pattern eliminates middle layer code
  - Business logic visibility analysis with line count comparisons
  - Compiler as coordination engine concept
  - Composability, type-driven coordination, and pattern-combinator mapping explanations
- **usecase-internal-service example** demonstrating internal service patterns

### Changed
- **Naming convention standardization**: Replaced `Validated` prefix with `Valid` prefix throughout all documentation
  - `ValidatedUser` → `ValidUser`
  - `ValidatedCredentials` → `ValidCredentials`
  - `ValidatedRequest` → `ValidRequest` (where applicable)
  - Rationale: `Valid` is concise and conveys the same meaning; `Validated` adds no semantic value
- **Documentation of Valid prefix naming convention** added to:
  - CODING_GUIDE.md (new "Validated Input Naming" section)
  - jbct-coder.md (added to factory naming section)
  - series/part-02-core-principles.md (expanded naming conventions)
  - series/part-04-advanced-patterns.md (added to naming conventions)
- **All version references updated** from 1.6.0 to 1.6.1
- **Pragmatica Core version** updated from 0.8.0 to 0.8.3 in all examples
- **CLAUDE.md API Reference** updated from Pragmatica Core 0.8.0 to 0.8.3
  - Added new convenience methods: `flatMap2()`, `mapToUnit()`
  - Added Run variants: `onPresentRun()`, `onEmptyRun()`, `onSuccessRun()`, `onFailureRun()`, `onResultRun()`
  - Added async variants for Promise: `onSuccessAsync()`, `onSuccessRunAsync()`, etc.
  - Added async predicate filtering for Promise: `filter(Cause, Promise<Boolean>)`
  - Added lift method variants with custom exception mappers
  - Added delayed Promise factory methods: `promise(TimeSpan delay, ...)`
- **jbct-coder.md** updated to v1.6.1
  - Refined lambda constructor rules: prefer `::new`, inline only with captured parameters
  - Added Condition pattern critical rule: routing only, no transformation
  - Clarified Single Level of Abstraction with constructor reference guidelines
  - Updated version references (v1.5.0 → v1.6.1, 0.8.0 → 0.8.3)

## [1.6.0] - 2025-01-10

### Added
- **Conversation style guidelines** in both CLAUDE.md files
  - Extreme brevity principle (no conversational fluff)
  - Action-first execution pattern
  - Question asking guidelines with clear thresholds
  - Read → Act → Verify execution pattern
  - Proactive todo tracking rules
  - Structured response formats with examples
- **Website favicon** generated from pragmatica.png
  - 32x32, 16x16 PNG favicons
  - 180x180 Apple touch icon
  - Integrated into HTML template
- **EXECUTIVE_SUMMARY_SHORT.md** - Condensed 865-word version for publication
  - Maintains structure of full executive summary
  - Includes diagnostic checklist, code example, metrics
  - Suitable for magazine/journal submission (InformationWeek)

### Changed
- Updated website build script to copy image directory to dist
- Updated conversation style from "ask first" to "execute when clear, ask when necessary"

## [1.5.0] - 2025-01-07

### Added
- **EXECUTIVE_SUMMARY.md** - Executive brief for CTOs/VPs (2-3 pages)
  - Diagnostic checklist with 5 friction signals
  - Visual proof with side-by-side code comparisons and cognitive load analysis
  - Observable outcomes with 3 proxy metrics (review efficiency, onboarding speed, structural consistency)
  - Academic foundations (Brooks's Law, Dijkstra's Structured Programming, Miller's Law, Google's consistency findings)
  - Inevitability narrative (AI code generation, distributed teams, rising team sizes)
  - Evidence-based adoption path with micro-evidence collection framework

### Changed
- **Factory pattern clarifications** in CODING_GUIDE.md and TECHNOLOGY.md
  - Value objects (records): serializable data structures
  - Use cases and steps (lambdas): behavioral components created at assembly time
- All EXECUTIVE_SUMMARY links point to pragmatica.dev
- README updated with executive summary reference
- Website build includes EXECUTIVE_SUMMARY.md

## [1.4.0] - 2025-01-07

### Added
- **Static website for pragmatica.dev**
  - Build script to convert markdown to HTML
  - Professional, responsive CSS design
  - HTML templates with navigation
  - Sitemap generation for SEO
  - GitHub Actions CI/CD for automatic deployment
  - Netlify configuration for hosting
  - Complete deployment documentation
  - Local development server support

### Infrastructure
- GitHub Actions workflow for automated deployment to Netlify
- Netlify configuration with security headers and caching
- Cloudflare DNS setup instructions for custom domain

## [1.3.0] - 2025-01-07

### Added
- **New Part 5: Testing Strategy & Evolutionary Approach** in learning series (~3000 lines)
  - Comprehensive evolutionary testing strategy
  - Integration-first philosophy (test composition, not components)
  - Test organization patterns (nested classes, builders, canonical vectors, parameterized tests)
  - Handling complex input objects with test data builders
  - Managing large test counts without drowning in complexity
  - What to Test Where guidelines (value objects, leaves, use cases, adapters)
  - Test utilities and helpers (ResultAssertions, StubBuilders, PromiseTestUtils)
  - Complete worked example (RegisterUser evolutionary testing)
  - Comparison to traditional unit testing
  - Migration guide from traditional to evolutionary testing
- Former Part 5 "Production Systems" is now Part 6
- Cross-references between Part 4, 5, and 6 for testing content

### Changed
- Series expanded from 5 to 6 parts
- Updated INDEX.md with Part 5 description and 6-part structure
- Updated README.md Quick Start with Part 5 link
- Updated all series parts to reflect "X of 6" instead of "X of 5"
- Part 6 testing section now references detailed Part 5 content
- Part 4 "What's Next" now points to Part 5 (Testing Strategy)

### Documentation
- Series version bumped to 1.1.0
- INDEX.md version history updated

## [1.2.0] - 2025-01-06

### Added
- Comprehensive "Naming Conventions" section consolidating all naming guidelines
- Acronym naming convention: treat acronyms as normal words using camelCase (e.g., `HttpClient` not `HTTPClient`)
- Factory method naming guidelines consolidated in dedicated section
- Test naming pattern consolidated in dedicated section
- Cross-references between sections for better navigation
- Attribution to Daniel Moka's LinkedIn post for acronym naming convention

### Changed
- Replaced inline changelog in CODING_GUIDE.md with reference to CHANGELOG.md file
- Improved document structure by consolidating scattered naming conventions

## [1.1.0] - 2025-01-06

### Added
- Evaluation framework section explaining five objective criteria for code decisions
- Criteria justifications for all core concepts (Four Return Kinds, Parse Don't Validate, No Business Exceptions, Single Pattern Per Function, Single Level of Abstraction)
- Rationale subsections for all patterns (Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects) based on evaluation criteria
- Criteria justification for vertical slicing philosophy in package organization
- Evaluation framework section integrated into all series parts (Part 1-5)

### Changed
- Enhanced CODING_GUIDE.md with objective evaluation framework
- Enhanced all series/*.md files with criteria-based justifications
- Improved documentation clarity by replacing subjective "best practices" with measurable standards

## [1.0.1] - 2025-01-05

### Added
- Adapter leaves framework independence guidance

## [1.0.0] - 2025-01-05

### Added
- Initial release of Java Backend Coding Technology
- Complete coding guide with patterns and principles
- Five-part learning series
- Management perspective document
- Project structure and package organization guide
