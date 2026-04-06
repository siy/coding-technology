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

```toml
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
