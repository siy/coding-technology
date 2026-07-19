# Streaming (Partitioned, Ordered, Replayable)

Requires custom qualifier annotations.

## Stream Publisher (targets PARAMETER)

```java
@ResourceQualifier(type = StreamPublisher.class, config = "streams.audit-log")
@Retention(RUNTIME) @Target(PARAMETER)
public @interface AuditStream {}
```

```java
static AuditService auditService(@AuditStream StreamPublisher<AuditEvent> stream) {
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
public interface AuditProcessor {
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

static ReplayService replayService(@AuditAccess StreamAccess<AuditEvent> stream) {
    return (fromOffset, count) -> stream.fetch(fromOffset, count);
}
```

## Partition Key

```java
public record AuditEvent(@PartitionKey String userId, String action, Instant timestamp) {}
```

## Config

Stream configuration is **application-level**, not node-level. It lives in the
blueprint's `src/main/resources/resources.toml` — NOT in the node's
`aether.toml`. The jbct-maven-plugin packages this file into the blueprint JAR
as `META-INF/resources.toml`; at deploy time each node loads the stream config
from the blueprint's own resources.

Missing stream config → slice fails to load with:
`Config section not found: streams.<name>` → blueprint gets deregistered.

```toml
# src/main/resources/resources.toml (packaged with the blueprint)
[streams.audit-log]
partitions = 8
retention = "time"
retention-value = "24h"
max-event-size = "64KB"
backpressure = "drop-oldest"

[streams.audit-log.consumers.processor]
auto-offset-reset = "earliest"
checkpoint-interval = "1s"
batch-size = 100
on-failure = "retry"
max-retries = 3
dead-letter = "audit-log-dlq"
```

See [configuration.md](configuration.md) for the config source merge order
(SLICE > NODE > GLOBAL/resources.toml). Same rule applies to any other
`@ResourceQualifier(config = "...")` lookups — pub-sub topics, database
names, HTTP clients, rate limits.
