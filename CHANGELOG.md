# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MIT License file for the project
- License section in README.md with usage permissions
- Copyright notices in README.md and CODING_GUIDE.md footers

### Changed
- Comprehensive rewrite of README.md with user-friendly navigation guide
- Added clear entry points for different audiences (developers, managers, AI collaboration)
- Added visual repository structure diagram
- Added "Quick Start" section with learning path recommendations
- Added "Key Concepts at a Glance" for quick reference

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
