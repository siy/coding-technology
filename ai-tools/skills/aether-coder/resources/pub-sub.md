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
static OrderService orderService(@OrderEvents Publisher<OrderPlacedEvent> events,
                                  @Sql SqlConnector db) {
    return request -> processOrder(db, request)
                         .onSuccess(order -> events.publish(new OrderPlacedEvent(order.id())));
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
public interface AnalyticsService {
    @OrderEventSubscription
    Promise<Unit> onOrderPlaced(OrderPlacedEvent event);
}
```

Config:
```toml
[messaging.order-events]
topic_name = "order-events"
```

## Delivery semantics

Subscriber *discovery* is durable: subscriptions are KV-Store-backed and survive node failure and leader change. *Delivery* is not — it is **at-most-once, unordered, best-effort**: no retry, no queueing, no persistence. A publish that finds no live instance of a subscribing slice drops the message silently while the publish call still reports success, and a subscriber that is down at publish time misses the message permanently, even after it comes back up. In-flight messages do not survive leader change. A handler that needs guaranteed processing builds idempotent recovery on top (reconcile against a durable source); delivery alone cannot carry that guarantee. Source: pragmatica `aether/docs/reference/guarantees.md` §5, feature-catalog row 24.

## Pub-Sub vs Streams

| | Pub-Sub | Streams |
|---|---------|---------|
| Delivery | At-most-once, best-effort | Cursor-based read; replay within retention |
| Ordering | None | Per-partition strict |
| Replay | No | Yes, within retention window |
| Consumer groups | No | Yes |
| Use case | Notifications, broadcasts | Event sourcing, pipelines |
