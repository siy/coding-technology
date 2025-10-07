# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
