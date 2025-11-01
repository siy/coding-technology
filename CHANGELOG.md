# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.8.1] - 2025-01-21

### Added
- **Syntax highlighting for code blocks** on pragmatica.dev website
  - Integrated highlight.js with GitHub light/dark themes
  - Dynamic theme switching synced with site theme toggle
  - Fixes Firefox rendering issue where Java code blocks appeared as unreadable gray boxes

### Changed
- **All version references updated** from 1.8.0 to 1.8.1
- **Pragmatica Lite API corrections** in CLAUDE.md and jbct-coder.md
  - Added missing factory methods: `Option.from(Optional)`, `Result.unitResult()`, `Promise.unitPromise()`
  - Corrected lift methods: removed non-existent `Promise.async(Runnable)`, use `Promise.lift(ThrowingRunnable)` instead
  - Added missing aggregation: `Promise.failAll()`, `Promise.cancelAll()`
  - Added missing callback methods: `.apply()`, `.fold()`, `.withSuccess()`, `.withFailure()`, `.withResult()`
  - Added Promise-specific operations: `.resolve()`, `.succeed()`, `.fail()`, `.cancel()`, `.isResolved()`, `.timeout()`, `.mapResult()`, `.replaceResult()`, `.trace()`
  - Added query and unsafe operations: `.isPresent()`, `.isEmpty()`, `.isSuccess()`, `.isFailure()`, `.unwrap()`, `.expect()`, `.stream()`, `.toOptional()`

## [1.8.0] - 2025-01-21

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

## [1.7.0] - 2025-01-19

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
  - Added Pragmatica Lite Core dependency verification
  - Check for correct groupId, artifactId, version
  - Build configuration added as Critical priority
  - New review section for dependency issues
- **Pragmatica Lite Core dependency specification** - Added Gradle coordinates alongside Maven in all docs
  - README.md, CODING_GUIDE.md, CLAUDE.md
  - Full artifact coordinates: `org.pragmatica-lite:core:0.8.3`
  - Both Maven and Gradle examples provided

### Fixed
- **Terminology consistency** - "Validated Request" → "Valid Request" in CODING_GUIDE.md
- **Grammar improvements** - "the factory method which builds" → "factory method that builds"
- **All version references updated** from 1.6.2 to 1.7.0

## [1.6.2] - 2025-01-17

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
- **Pragmatica Lite Core version** updated from 0.8.0 to 0.8.3 in all examples
- **CLAUDE.md API Reference** updated from Pragmatica Lite Core 0.8.0 to 0.8.3
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
