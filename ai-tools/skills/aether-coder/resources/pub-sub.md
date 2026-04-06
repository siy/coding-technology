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

## Pub-Sub vs Streams

| | Pub-Sub | Streams |
|---|---------|---------|
| Ordering | None | Per-partition strict |
| Replay | No | Yes, within retention window |
| Consumer groups | No | Yes |
| Use case | Notifications, broadcasts | Event sourcing, pipelines |
