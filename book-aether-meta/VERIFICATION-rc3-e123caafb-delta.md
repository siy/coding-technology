# Verification delta — rc3 `bfd00615d` → `e123caafb` (2026-08-26)

**What this is:** the re-verification pass for the manuscript's runtime pin. The book was
verified against rc3 HEAD `bfd00615d` (late July; see `VERIFICATION-rc3-bfd00615d-P1facts.md`).
The repo moved 292 commits on `aether/` since. Two read-only source agents verified the
behavior-relevant deltas at new HEAD **`e123caafb`** (branch `release-1.0.0-rc3`); this file
records the confirmed facts, the tracked-issue states, and the book edits applied. The manuscript
pin is now **`e123caafb`**.

## Tracked issue states (checked via gh, 2026-08-26)

| Issue | State | Book consequence |
|---|---|---|
| #488 stream declarative consumer dangling | CLOSED 2026-07-27 | `BANNER:stream-declarative-consumer-488` REMOVED; consumer prose rewritten to shipped behavior |
| #507 @PartitionKey dangling | CLOSED 2026-08-09 | inline #507 caveat REPLACED with shipped `@PartitionKey` treatment |
| #520 NONE-mode push dead-end | CLOSED 2026-07-24 | `BANNER:deploy-security-520` REMOVED; settled prose (NONE admits push + WARN; default API_KEY) |
| #521 destroy strands VMs | CLOSED 2026-07-24 | `BANNER:deploy-teardown-521` REMOVED; settled prose (kept registry entry, exit CLEANUP_FAILED) |
| #434 cluster protocol versioning | OPEN | `BANNER:deploy-mixed-version-434` KEPT |
| #596 entity owner-forwarding + bounded-stale reads | CLOSED 2026-08-26 | Module D write/read path prose rewritten to shipped behavior |
| #352 DurableEntity core primitive | CLOSED 2026-08-16 | no longer cited as node-wiring blocker |
| #349 storage durability epic | OPEN | still bounds full-cluster cold-restart claims |
| #351 entity timer fire driver | OPEN | new explicit "timers recorded, never fire" caveat |

## Confirmed facts (all at HEAD `e123caafb`, file:line citations from the agent reports)

### Entity (Module D)
1. **Deployable.** `resource-durable-entity` is a dependency of `aether/node`
   (`aether/node/pom.xml:130-144`); `DurableEntityFactory` registered via SPI; entity extensions
   registered on the node (`AetherNode.java:5891-5930`). A slice injects it via a per-keyspace
   author-declared qualifier `@ResourceQualifier(type = DurableEntity.class, config =
   "entities.<keyspace>")` (`DurableEntity.java:36-61`). July claim "not injectable" is FALSE now.
2. **Interface changed.** `DurableEntity<K, S, C extends Mutator<S>>` (`DurableEntity.java:78`):
   `update(K, C)` and `scheduleTimer(K, Duration, C)` take a named command, not `Fn1<S,S>`;
   new overload `get(K, ReadConsistency)`. `Mutator<S>` (`aether/resource/api/.../Mutator.java`)
   = `S apply(S state)`; author's `C` is a sealed interface of records — lambdas cannot implement
   a sealed interface (build-time transferability guarantee).
3. **EntityError = 11 variants** — `TimerFireFailed(String key, TimerToken token, Cause cause)`
   added (`EntityError.java:69`); the July ten unchanged.
4. **Write forwarding.** create/update/delete arriving at a non-owner forward to the committed
   owner (`PartitionFencedDurableEntity.java:313-316,357-360,369-371`); owner re-runs admission
   under the fence; refusals cross the wire typed (`:811-820`, EntityAlreadyExists/EntityNotFound
   reconstructed). Timer ops do NOT forward — `NotCurrentOwner` (`:245-249,:291`).
5. **Reads.** `ReadConsistency {BOUNDED_STALE, LINEARIZABLE}` (`ReadConsistency.java:13-29`);
   default get = BOUNDED_STALE. BOUNDED_STALE: a holding node (owner or replica) serves locally,
   fold caught up to committed head; a non-holding node forwards to the committed owner
   (`PartitionFencedDurableEntity.java:324,331-342`). LINEARIZABLE: committed owner + no-op
   consensus round + post-round epoch fence (`LinearizableEntityServe`, `:197-205`); typed
   `LinearizableUnavailable` when the barrier is absent.
6. **Durability.** fsync-before-ack via chained WAL writes (c778bb54f); failed fsync fail-stops
   the WAL, operator-visible (`PartitionWal.java:321,326,412`; `WalStats.failStopped`); unwritable
   WAL dir refuses boot. Gate: 02w-entity-crash 2026-08-26 — 40/40 pre-kill acked, 77/77 acked
   survived owner SIGKILL exact-valued (`guarantees.md:139`). Bound: full-cluster cold restart
   not in the proven envelope (#349 open: durable tiers, cursors durable store, S3, GC).
7. **Replication.** `DurableEntityConfig`: defaults RF=3, partitions=64; `minSyncReplicas() =
   min(2, rf)` — derived, not configured; RF=1 ⇒ restart-durable only. Config keys (snake_case,
   all required, validated at bind): `[entities.<name>]` `keyspace`, `partition_count`,
   `replication_factor` (verbatim reference: `aether/tests/blueprints/test-entity/.../resources.toml`).
   `terminal-ttl` is NOT a shipped key (S2 stays a design-level open decision).
8. **Timers half-built.** Schedule/cancel durably logged under the replication barrier
   (`PartitionFencedDurableEntity.java:229-307`); `EntityTimerDriver` exists but is never
   registered by the node — zero references in `aether/node/src` — so timers never fire in a
   deployed cluster (#351 OPEN).
9. **Facades absent.** No `PersistentWorkflow`/`SagaDefinition`/`Saga`/`SagaResult`/`SagaState`
   in `aether/` main source; #353/#354 OPEN. July claim (f) still true.

### Streaming (Module B)
10. **Declarative consumer delivered (#488 + #535 repair).** `StreamConsumerManager`
    (node-wired, reconcile scheduled — `AetherNode.java:3748-3761`): exactly one assignee per
    (stream, partition, group); assignee = HRW partition owner if slice-bearing, else HRW pick
    among slice-bearing nodes reading through the owner. Group id = `artifact.base()-methodName`
    (`StreamConsumerRegistry.java:54`). Per-partition ordered serial delivery; cursor advances
    only on handler success; RETRY×3 with backoff then dead-letter and advance
    (`ConsumerRuntimeState.java:383-408,474-479`; default handler is in-memory); checkpoint
    1000 events/30s; resume at max(local, cluster) cursor. At-least-once, conditional on the
    slice being ACTIVE on ≥1 live node (zero delivery otherwise, reported as
    `unassignedPartitions`). NOT effectively-once (no delivery fencing token).
11. **@PartitionKey routes (#507).** `@Target(RECORD_COMPONENT)` (`PartitionKey.java:13-15`);
    codegen appends `withKeyExtractor` for stream resources (`FactoryClassGenerator.java:1652-1674`);
    partition = `floorMod(stableHash64(String.valueOf(key)), partitions)`
    (`DefaultStreamPublisher.java:305-317`); keyless = round-robin; two keys on one record =
    compile error; default partitions still 4 (`StreamConfig.java:30`). Changing partition count
    remaps keys; no repartitioning of existing data. Topic publishers deliberately excluded.

### Deploy (Part V)
12. **#520.** `PushAdmission` (`MavenProtocolRoutes.java:156-165,198-212`): authenticated
    OPERATOR/ADMIN accepted silently; `AETHER_INSECURE_DEV_MODE=true` accepts; `security_mode=NONE`
    accepts unauthenticated with a security WARN per push; else denied. Unset `security_mode`
    defaults to API_KEY (`ConfigLoader.java:330-335`, #290 secure-by-default).
13. **#521.** Failed cloud cleanup keeps the registry entry and exits `CLEANUP_FAILED` (=4)
    (`ClusterDestroyCommand.java:172-184,393-403`; `ExitCode.java:12`); prints the retry command
    and names `tools/cloud-reaper.sh` (still present) as the orphan sweep.

## Book edits applied (this session, working tree)

- `part3-playbook.md` Module B: #488 banner removed; consumer section rewritten (delivery
  contract, failure/dead-letter, at-least-once bounds); `StreamAccess` reframed active-form;
  #507 caveat replaced with `@PartitionKey` treatment (spine `OrderEvent` gains
  `@PartitionKey OrderId orderId` in the partition note).
- `part3-playbook.md` Module D: status banner rewritten (entity shipped; timers inert #351;
  full-cluster restart bound #349; facades stay INVENTED/prototype-gated); interface updated to
  3-type-param + `Mutator` named-command model with new `OrderCommand` example and rationale;
  fence prose moved off "KV path" to the entity log's append gate; write-forwarding paragraph
  added; provisioning updated to real keys (`[entities.orders]` `keyspace`/`partition_count`/
  `replication_factor`), `terminal-ttl` removed from config (S2 note moved to facade design,
  reworded); route example uses a command value; Temporal-contrast paragraph corrected (command
  log + checkpointed fold, replay confined to `apply`); `TimerFireFailed` added (11 variants);
  reads-consistency paragraph added; timers-inert paragraph added; "what durable means" passage
  flipped to per-property guarantees with the two named bounds; closing note rewritten.
- `part5-operate.md`: #520 and #521 banners removed, replaced with settled-behavior prose;
  #434 banner kept.

## Product-side observations (routed to the CTO, not filed by this session)

See `PROBE-2026-08-26.md` — headline: guarantees.md/known-limitations.md rows still deny entity
deployability (stale vs code; deferred to #496); DurableEntity javadoc header still describes the
in-memory cut and shows the 2-param generic in its own example; timer fire-driver gap (#351) is
invisible in the resource's javadoc.
