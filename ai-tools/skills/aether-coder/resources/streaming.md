# Streaming (Partitioned, Ordered, Replayable)

Requires custom qualifier annotations.

## Stream Publisher (targets PARAMETER)

```java
@ResourceQualifier(type = StreamPublisher.class, config = "streams.audit-log")
@Retention(RUNTIME) @Target(PARAMETER)
public @interface AuditStream {}
```

```java
static AuditTrail auditTrail(@AuditStream StreamPublisher<AuditEvent> stream) {
    return event -> stream.publish(event);
}
```

## Stream Subscriber (targets METHOD)

```java
@ResourceQualifier(type = StreamSubscriber.class, config = "streams.audit-log")
@Retention(RUNTIME) @Target(METHOD)
public @interface AuditStreamConsumer {}
```

Single or batch:
```java
@Slice
public interface AuditLedger {
    @AuditStreamConsumer
    Promise<Unit> processAuditEvent(AuditEvent event);

    @AuditStreamConsumer
    Promise<Unit> processAuditBatch(List<AuditEvent> events);
}
```

## Stream Access — Pull (targets PARAMETER)

```java
@ResourceQualifier(type = StreamAccess.class, config = "streams.audit-log")
@Retention(RUNTIME) @Target(PARAMETER)
public @interface AuditAccess {}
```

A consumer is a small read-process-commit loop, one partition at a time:

```java
// stream: StreamAccess<AuditEvent>, injected as @AuditAccess StreamAccess<AuditEvent> stream
stream.fetchFromCommitted("audit-replay", partition, 100)   // Promise<List<StreamEvent<AuditEvent>>>
      .flatMap(batch -> applyInOrder(batch))                // your per-event handling, yields the last offset
      .flatMap(offset -> stream.commit("audit-replay", partition, offset));
```

- `fetchFromCommitted(group, partition, max)` reads from the group's committed offset (offset 0 the first time), so a restart resumes rather than replays. A multi-partition stream needs a loop per partition.
- To replay from a chosen position, use `fetch(partition, fromOffset, max)` on one partition.
- Never use the no-partition `fetch(fromOffset, maxEvents)` to resume: it merges the same offset across partitions and sorts by offsets that mean nothing across partitions. Use it for a glance only.
- Each consumer group keeps its own cursor, so two groups read the whole stream independently.

## Partition Key

```java
public record AuditEvent(@PartitionKey String userId, String action, Instant timestamp) {
    public static AuditEvent auditEvent(String userId, String action, Instant timestamp) {
        return new AuditEvent(userId, action, timestamp);
    }
}
```

## Delivery

A driven consumer (`@AuditStreamConsumer` method) gets events one at a time, in partition order. Its position is a committed offset per consumer group and partition, advanced only after the handler's `Promise` succeeds.

- **Guarantee:** at-least-once per consumer group. A failed delivery is retried with backoff, 3 attempts by default; an event that exhausts them is recorded as a dead letter and skipped, so one poison event cannot stall its partition.
- **Duplicates:** a redelivery after a failure, a partition reassignment or a resume from a checkpoint repeats an event, and two nodes can briefly deliver the same partition during a handover. The handler must be idempotent: key the write on an event id (`ON CONFLICT ... DO NOTHING`).
- **Loss:** an event that fails every attempt leaves the main path. A consumer that must lose nothing watches the dead-letter side; the runtime does not redeliver it forever.
- **No consumer, no delivery:** if the consuming slice is active on no live node, nothing is delivered until it returns.

## Config

Stream settings ship with the slice as `META-INF/resources.toml` (write `src/main/resources/resources.toml`); the node's `aether.toml` or an operator change may override them (see [configuration.md](configuration.md)). A missing section fails the pre-load config check, before the slice loads: `Config section not found: streams.<name>`.

Keys are snake_case; a key the runtime does not know, a dashed spelling included, is refused when the section is read.

```toml
# src/main/resources/resources.toml
[streams.audit-log]
partitions = 8               # ordering and parallelism unit; changing it remaps keys
replication_factor = 3       # copies of each partition, including the owner (default 3)
confirmation_factor = 2      # copies, including the owner, that must hold a write before publish resolves
retention = "time"           # count | time | size | compound (default count)
retention_value = "24h"
max_event_size = 65536       # bytes (default 1048576)
```

Consumer groups need no section. `[streams.<name>.consumers.<group>]` accepts `processing`, `checkpoint_interval`, `batch_size`, `on_failure`, `max_retries`, `dead_letter` and `read_preference`, but the pragmatica source refuses any non-default value at deploy because it never reaches the runtime consumer (`InertKeyRules.java`, `inertConsumerKeys`); leave them out. Likewise `compression` other than `none` and `auto_offset_reset` other than `earliest` are refused.

The same config-source rule applies to any other `@ResourceQualifier(config = "...")` lookup: pub-sub topics, database names, HTTP clients, rate limits.

## Where Events Live and What Survives

A stream partition keeps events in three places:

- **Hot ring:** off-heap, the newest events; a bounded cache that evicts its oldest events when full.
- **Write-ahead log:** one per partition on local disk; the owner's publish is gated on an fsync to it.
- **Sealed segments:** the history. A read below the ring's tail is served from them through the same `fetch`.

`retention` and `retention_value` bound the history: `time` with `"24h"` keeps sealed events for 24 hours, and a section with no `retention` key also keeps 24 hours, rarely what a ledger wants, so declare it. Durability across the loss of a node comes from `confirmation_factor >= 2`: every write waits for a copy beyond the owner, fsynced there before its ack counts. With `replication_factor = 1` one disk holds the only copy: the log survives a restart, not the loss of the node. Proven case: one graceful owner loss with the rest of the cluster stable, in an in-process test cluster; wider churn and full cloud deployments are still being validated.
