# Changelog — Process-First Design

All notable changes to the PFD book, newest first. Format:
[Keep a Changelog](https://keepachangelog.com/); the book uses
[Semantic Versioning](https://semver.org/). See `../BOOK-VERSIONING.md`.

`0.x` versions were preview editions; `1.0.0` marked the first edition released to
readers, and `1.x` are its maintenance and expansion releases.

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
