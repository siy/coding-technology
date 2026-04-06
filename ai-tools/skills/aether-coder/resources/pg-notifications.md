# PostgreSQL LISTEN/NOTIFY

Real-time database change notifications. Uses a **method annotation** (targets METHOD).

## Define Qualifier

```java
@ResourceQualifier(type = PgNotificationSubscriber.class, config = "pg-notifications.order-changes")
@Retention(RUNTIME) @Target(METHOD)
public @interface OnOrderChange {}
```

## Receive Notifications

Method gets `PgNotification` and returns `Promise<Unit>`:

```java
@Slice
public interface OrderCache {
    @OnOrderChange
    Promise<Unit> onNotification(PgNotification notification);

    static OrderCache orderCache(@Sql SqlConnector db) {
        var cache = new ConcurrentHashMap<String, Order>();
        record orderCache(SqlConnector db, Map<String, Order> cache) implements OrderCache {
            @Override
            public Promise<Unit> onNotification(PgNotification notification) {
                return switch (notification.channel()) {
                    case "orders_changed" -> refreshCache(notification.payload());
                    case "orders_deleted" -> removeFromCache(notification.payload());
                    default -> Promise.unitPromise();
                };
            }
        }
        return new orderCache(db, cache);
    }
}
```

## Config

```toml
[pg-notifications.order-changes]
datasource = "database"
channels = ["orders_changed", "orders_deleted"]
```

`PgNotification` fields: `channel()` (String), `payload()` (String, up to 8000 bytes), `pid()` (int).

**Note:** `@Notify` is for email/SMS, NOT PG LISTEN/NOTIFY.
