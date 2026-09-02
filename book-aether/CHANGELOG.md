# Changelog — Building Applications with Aether

All notable changes to the Aether book, newest first. Format:
[Keep a Changelog](https://keepachangelog.com/); the book uses
[Semantic Versioning](https://semver.org/). See `../BOOK-VERSIONING.md`.

This book is a pre-1.0 **draft**: `0.x` versions are preview editions, and `1.0.0`
will mark the first edition released to readers.

## [Unreleased]

### Added
- **Configuring behavior: the provisioned step** (*Part I, after Config inheritance*) —
  a resource qualifier may name a type of your own, so the varying part of an application
  is provisioned rather than selected by a flag the slice reads. Covers the factory
  (`configType()` for parsed config, `supports()` for selection, `provision()` returning
  `Promise` so assembly can fail the deployment), the two levels of one mechanism
  (`ConfigurationSection` hands over a section to interpret, a provisioned step hands over
  something already built), the boundary rule (a setting that selects a behavior becomes a
  step; one that parameterizes a single behavior stays a value), and the type bound: because
  the use case names the step's type, configuration can change how a step works and never
  what it is. Placed with configuration provisioning per the owner's ruling, as a form of
  application configuration rather than a standalone pattern. The capability itself dates
  from `8d36f0c1c` (pragmatica #773); before it, a slice declaring a qualifier for its own
  type failed at load with `ResourceFactoryNotFound`.

### Fixed
- **Config inheritance overstated live updates** (*Part I*). The text said an operator's
  configuration change propagates through consensus "so slices pick it up without a
  redeploy." Verified false: `SpiResourceProvider` mutates its promise cache only on first
  provision and on last release, there is no invalidation path on config change, and
  `ConfigNotificationManager.notifyChange` has no callers (pragmatica #381, with a gate test
  asserting it). A resource is built from the values current when it was provisioned and is
  not rebuilt when they change, so a slice sees new configuration when it is next reloaded.
  The corrected text states that boundary, which the provisioned-step section then relies on.

## [0.1.0] - 2026-06-20

### Added
- Initial scaffold: manuscript directory, build tooling (mirrors PFD), part-level
  outline, and the planning spec (`../book-aether-meta/BOOK-PLAN.md`).
- Structure established: Part 0 On-ramp · Part I Aether Slice: No Magic · Part II
  The Aether model · Part III The playbook (clusters A–E) · Part IV Testing &
  evolving · Part V Operate · Part VI Thinking in Aether.
- Core slice model validated against current Aether source (two-layer generated
  bridge); recorded in the plan as the basis for Part I.
