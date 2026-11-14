# Pub-Sub Messaging

Requires custom qualifier annotations — no built-in shortcuts.

## Publisher (targets PARAMETER)

```java
@ResourceQualifier(type = Publisher.class, config = "messaging.order-events")
@Retention(RUNTIME) @Target(PARAMETER)
public @interface OrderEvents {}
```

Usage:
```java
static Ordering ordering(@OrderEvents Publisher<OrderPlacedEvent> events,
                         @Sql SqlConnector db) {
    return request -> processOrder(db, request)
                         .onSuccess(order -> events.publish(OrderPlacedEvent.orderPlacedEvent(order.id())));
}
```

## Subscriber (targets METHOD)

```java
@ResourceQualifier(type = Subscriber.class, config = "messaging.order-events")
@Retention(RUNTIME) @Target(METHOD)
public @interface OrderEventSubscription {}
```

Usage:
```java
@Slice
public interface CustomerDashboard {
    @OrderEventSubscription
    Promise<Unit> onOrderPlaced(OrderPlacedEvent event);
}
```

Config:
```toml
[messaging.order-events]
topic_name = "order-events"
```

## Delivery semantics (ephemeral, the default)

Subscriber *discovery* is durable: subscriptions are KV-Store-backed and survive node failure and leader change. *Delivery* is not: it is **at-most-once, unordered, best-effort**, a single invoke to a round-robin instance, never retried, queued or persisted. A publish that finds no live instance of a subscribing slice drops the message silently while the publish call still reports success, and a subscriber that is down at publish time misses the message permanently, even after it comes back up. In-flight messages do not survive leader change. A handler that needs guaranteed processing builds idempotent recovery on top (reconcile against a durable source), or uses a durable topic (below).

`publish` waits: its `Promise` completes once every subscriber present at that moment has been invoked and its own `Promise` has settled, each within a delivery timeout of about 20 seconds. A caller that chains work onto the publish pays the subscribers' latency in its own response time, so keep subscriber work short or move the slow part to a stream. Source: pragmatica `aether/docs/reference/guarantees.md` §5, feature-catalog row 24.

## Durable Topics

The same topic declared durable keeps the pub-sub shape (publish a value, receive a value, no offsets in slice code) and adds a replicated stream underneath. The Java does not change; the config section grows:

```toml
[messaging.order-events]
topic_name = "order-events"
durability = "durable"        # "ephemeral" (default) | "durable"
partitions = 1                # durable only; default 1
replication_factor = 3        # durable only; default: the cluster replication default (3)
confirmation_factor = 2       # durable only; default min(2, replication_factor)
retention = "7d"              # durable only; default 7d (an age)
```

- **Delivery:** at-least-once per consumer group (group id `groupId:artifactId#method`), with 5 attempts and exponential backoff, then the group-attributed dead-letter queue `topic:<address>.dlq` (14 days, fixed). The source cursor does not pass an event whose DLQ append failed, so a stalled DLQ stalls the partition visibly instead of dropping the event.
- **Duplicates:** after a crash or restart a durable topic can redeliver up to the checkpoint window (at most 1000 acknowledged events or 500 ms per partition; fixed constants). The handler must dedupe.
- **MessageContext:** a durable subscriber may take a second parameter, `Promise<Unit> handler(T event, MessageContext context)`. Dedupe on `context.messageId()`, stable across retries and dead-letter hops; never on `context.partition()` or `context.offset()`, which change on redelivery. The build rejects the two-argument shape on a non-durable topic.
- **Config honesty:** the four durable-only keys on an ephemeral topic are rejected by the build; a `confirmation_factor` above `replication_factor`, or a factor below 1, is refused. A publisher declared ephemeral reaching a subscriber that takes a `MessageContext` is refused and raised as a `topic-tier-mismatch` operator event: keep the tier in the one section both sides name.
- **Not yet verified:** the guarantee is verified single-node. The multi-node path (publish on one node, dispatch owned by another, with a failover between them) is design intent, unverified. There is no operator surface for the durable tier yet: a dead-lettered event is readable only by reading the `.dlq` stream directly.

`@Notify` email is not pub-sub and carries no DLQ; none of this applies to it.

## Ephemeral Topic, Durable Topic, or Stream

| | Ephemeral topic | Durable topic | Stream |
|---|---|---|---|
| Delivery | At-most-once, best-effort | At-least-once per group; 5 attempts, then DLQ | At-least-once per consumer group; 3 attempts by default, then dead-letter and skip |
| Ordering | None | Not specified | Per-partition strict |
| Replay | No | No offsets in slice code; the DLQ is a readable stream | Yes, within retention |
| Consumer groups | No | Yes | Yes |
| Use case | Live signals, cache invalidation, broadcasts | Pub-sub shape where a down subscriber must still get the event | Event sourcing, pipelines, replay |
