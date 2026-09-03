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
- **The durable pub-sub tier** (*Part III, Module B, after "What durable depends on"*) — the
  same `Publisher`/`Subscriber` shape, declared `durability = "durable"` on the topic's config
  section, backed internally by a replicated stream plus its own dead-letter stream. Delivery is
  at-least-once per consumer group (a group cursor, five bounded retries, then a
  group-attributed DLQ at `topic:<address>.dlq`; the source cursor does not advance past a
  failed DLQ append); duplicate exposure is bounded to the cursor-checkpoint window (≤1000 acks
  or 500ms per partition); consumer-group identity is version-stable across a blue-green window.
  The `replicas >= 2` / `min_sync_replicas == replicas` constraint enforced at parse is the same
  configuration the stream-durability section proves survives an owner kill, not an arbitrary
  default (`TopicConfigError.outsideProvenDurableConfig`, durable-pubsub-spec §3, v1 until #411).
  A durable subscriber may opt into a second parameter, `MessageContext context`
  (`aether/slice-api/.../topic/MessageContext.java`), whose `messageId` is the stable
  deduplication key — `partition`/`offset` describe only a delivery's position and change on
  redelivery; the JBCT processor rejects the two-argument shape on a non-durable topic at build
  time (`jbct/slice-processor/.../MessageContextRule.java:1-60`). No exactly-once claim anywhere
  in the mechanism. Sourced against `TopicConfig.java`, `TopicConfigTest.java`
  (`tomlBinding_bindsLegacyDeclaration_asEphemeral` confirms the real field is `topic_name`,
  snake_case), `DurableTopicSpec.java`, `TopicConfigError.java`, `MessageContext.java`,
  `ContextualEvent.java`, `guarantees.md` (line 26, row 22a/23, lines 177-193), and
  `pragmatica/CHANGELOG.md:113-135` ("#386 durable-topic dispatch WIRED") as the primary
  citation. The multi-node composed path (publish node ≠ dispatch node, failover) is stated
  exactly as that CHANGELOG entry states it: "design intent — unverified pending forge e2e"; no
  operator surface yet (no DLQ inspection/redrive route, no lag/stall alarm, no per-topic
  retention override) — a dead-lettered event is durable data readable only via a direct stream
  read on `.dlq` today.

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
- **Appendix A's pin was six days stale** (`e123caafb`, 2026-08-26, against roughly a dozen
  substantive tickets landed since). Re-pinned to the resolved `v1.0.0-rc3` tag commit
  `c67664bd9a104581a54172cf824d7766a5713bcf` (2026-09-02 21:41:37+02:00,
  `appendix-a-api-reference.md:4`), then re-diffed the appendix's four other source-backed
  blocks against the new pin: `Cause` (`core/src/main/java/org/pragmatica/lang/Cause.java`),
  `ResourceQualifier` (`aether/slice-api/.../annotation/ResourceQualifier.java`) plus its five
  built-in qualifiers (`@Sql`/`@PgSql`/`@Http`/`@Notify`/`@Jooq`, one file each, unchanged),
  `HttpClient` (`aether/resource/api/.../http/HttpClient.java`), and `StreamAccess`
  (`aether/slice-api/.../StreamAccess.java`). All four match the taught shapes exactly; the
  appendix's own scope as a quick-reference summary, not an exhaustive listing, already accounts
  for what it omits (header-carrying `HttpClient` overloads, `HttpClient.config()`,
  `StreamAccess`'s internal error/metadata types — all confirmed present at both the old and new
  pin, so their omission predates this delta rather than being caused by it). The timer sentence
  above is the only casualty this six-day range produced.
- **`BOOK-PLAN.md` §6 disagreed with itself about the spine app** (*planning
  doc, owner Q1*). The prose said the spine was "a fresh app built
  incrementally... start from an empty Aether project," but `examples/ecommerce`
  already exists at the rc3 tag and was already cited elsewhere in the plan as
  "the real reference artifact." Owner decision (2026-09-03): narrate directly
  on `examples/ecommerce`, promoted from answer-key to primary source; no
  from-scratch build. While updating, corrected a second, independent staleness
  the gap inventory had introduced: it counted three slices
  (`inventory`/`payment`/`fulfillment`); the tree at `v1.0.0-rc3`
  (`c67664bd9a104581a54172cf824d7766a5713bcf`) has five —
  `inventory`/`pricing`/`payment`/`fulfillment`/`place-order` — plus a `shared`
  module, verified by `git ls-tree` and the parent `pom.xml`'s `<modules>` list.
  `place-order/src/main/java/.../PlaceOrder.java:52-54`'s own doc comment states
  the durable-saga gap the flagship INVENTED chapter needs ("Does NOT
  demonstrate: durable saga state... a production saga needs a persisted log to
  drive the release on restart"), so the gap→curriculum map's saga row is now
  sourced against the shipped example rather than only the loan-app audit.
  Three other map rows (real resources, HTTP routing, schema migration) were
  written assuming the from-scratch spine would start without them;
  `examples/ecommerce` already has all three (real `@Sql` `resources.toml` per
  service, wired `routes.toml`, Flyway-style `schema/V001__create_tables.sql`),
  so those rows now say "teach by reading, not building."
- **Ephemeral pub-sub example used a field that does not exist** (*Part III, Module B*) —
  `topicName = "order-events"` is not a real key; the bound field, confirmed by
  `TopicConfigTest.java`'s `tomlBinding_bindsLegacyDeclaration_asEphemeral` test body, is
  `topic_name` (snake_case). Pragmatica's own `resource-reference` docs carried the same class
  of bug, fixed under the same ticket (`pragmatica/CHANGELOG.md:113-135`) — not an idiosyncratic
  mistake in this book alone.
- **"Pub-sub or stream?" stated the ephemeral tier's at-most-once bound as pub-sub's fixed
  contract** rather than as the default tier's property, and omitted the durable tier entirely.
  Now a three-way comparison (ephemeral / durable / stream) with the durable tier's tradeoffs
  stated alongside the other two. Appendix A's "Pub-sub" section made the same unqualified claim
  ("Delivery is at-most-once...") and now names the `durability` key, the `MessageContext`
  second-parameter shape, and points to Module B for the full guarantee.

## [0.1.0] - 2026-06-20

### Added
- Initial scaffold: manuscript directory, build tooling (mirrors PFD), part-level
  outline, and the planning spec (`../book-aether-meta/BOOK-PLAN.md`).
- Structure established: Part 0 On-ramp · Part I Aether Slice: No Magic · Part II
  The Aether model · Part III The playbook (clusters A–E) · Part IV Testing &
  evolving · Part V Operate · Part VI Thinking in Aether.
- Core slice model validated against current Aether source (two-layer generated
  bridge); recorded in the plan as the basis for Part I.
