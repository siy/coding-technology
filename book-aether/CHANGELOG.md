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
- **Module D and Appendix A claimed entity timers never fire (five sites).** Stale as of the
  rc3 pin: `#351`/`#345` I4 landed 2026-08-27, wiring `EntityTimerDriver` into the deployed node
  (`AetherNode.java:3995` construction, `:4031` periodic `tick` on `ENTITY_TIMER_INTERVAL`,
  `:6079` SPI registration; the constant itself at `:823`,
  `TimeSpan.timeSpan(1).seconds()`); `pragmatica/CHANGELOG.md:471-519` (the rc3 tag) describes
  the wire verbs, caller-minted dedupe, and the at-or-after fire-instant contract, with no
  mention of workflow or saga anywhere in the entry. Corrected: the Module D status banner
  (`part3-playbook.md:1104-1112`), the timers paragraph (`:1397-1402`), the durability-bound
  paragraph (`:1409-1420`), the closing note (`:1676-1682`), and Appendix A's entity section
  (`appendix-a-api-reference.md:214-215`) — the fourth and fifth of these were found by a sweep
  beyond the three sites originally flagged. None cites the product's own `guarantees.md`,
  which still rows this PLANNED at this pin. Workflow/saga substance is unchanged: the same two
  source citations confirm #345 I4 is entity infrastructure only, so "no runtime code behind
  them yet" still holds.
- **The full-cluster cold-restart bound (`#349`) carried no verification date** (two sites,
  `part3-playbook.md:1104-1112` and `:1409-1420`), read as a standing fact rather than a
  time-stamped one. Now reads "has not been re-verified since 2026-08-26" — the date of the
  last tracked-issue check confirming #349 still open and still bounding the claim
  (`book-aether-meta/VERIFICATION-rc3-e123caafb-delta.md:21`). Re-verification is an rc4
  verification-stream task, not a book task.

## [0.1.0] - 2026-06-20

### Added
- Initial scaffold: manuscript directory, build tooling (mirrors PFD), part-level
  outline, and the planning spec (`../book-aether-meta/BOOK-PLAN.md`).
- Structure established: Part 0 On-ramp · Part I Aether Slice: No Magic · Part II
  The Aether model · Part III The playbook (clusters A–E) · Part IV Testing &
  evolving · Part V Operate · Part VI Thinking in Aether.
- Core slice model validated against current Aether source (two-layer generated
  bridge); recorded in the plan as the basis for Part I.
