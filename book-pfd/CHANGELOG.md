# Changelog — Process-First Design

All notable changes to the PFD book, newest first. Format:
[Keep a Changelog](https://keepachangelog.com/); the book uses
[Semantic Versioning](https://semver.org/). See `../BOOK-VERSIONING.md`.

This book is a pre-1.0 **draft**: `0.x` versions are preview editions, and `1.0.0`
will mark the first edition released to readers.

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
