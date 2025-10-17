# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
