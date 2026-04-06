# Custom Resource Qualifiers

Define your own for multiple instances of the same resource type:

```java
@ResourceQualifier(type = SqlConnector.class, config = "database.orders")
@Retention(RUNTIME) @Target(PARAMETER)
public @interface OrderDb {}

@ResourceQualifier(type = SqlConnector.class, config = "database.analytics")
@Retention(RUNTIME) @Target(PARAMETER)
public @interface AnalyticsDb {}
```

## Built-In vs Custom

Built-in shortcuts (use directly, no custom annotation needed):

| Annotation | Type | Config Section |
|-----------|------|---------------|
| `@Sql` | SqlConnector | `"database"` |
| `@PgSql` | PgSqlConnector | `"database"` |
| `@Http` | HttpClient | `"http"` |
| `@Notify` | NotificationSender | `"notification"` |

Custom qualifiers required for (no built-in shortcuts):

| Resource | Type in `@ResourceQualifier` | Target |
|----------|------------------------------|--------|
| Pub-Sub publisher | `Publisher.class` | PARAMETER |
| Pub-Sub subscriber | `Subscriber.class` | METHOD |
| Stream publisher | `StreamPublisher.class` | PARAMETER |
| Stream subscriber | `StreamSubscriber.class` | METHOD |
| Stream access | `StreamAccess.class` | PARAMETER |
| PG LISTEN/NOTIFY | `PgNotificationSubscriber.class` | METHOD |
| Scheduled task | `Scheduled.class` | METHOD |
| Config section | `ConfigurationSection.class` | PARAMETER, METHOD |
| Method interceptor | `MethodInterceptor.class` | METHOD |
