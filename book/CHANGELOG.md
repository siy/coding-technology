# Changelog — Java Backend Coding Technology

All notable changes to the JBCT book, newest first. Format:
[Keep a Changelog](https://keepachangelog.com/); the book uses
[Semantic Versioning](https://semver.org/). See `../BOOK-VERSIONING.md`.

Earlier history (1.x–2.x) predates per-book changelogs and lives in the
repository root `CHANGELOG.md`.

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
