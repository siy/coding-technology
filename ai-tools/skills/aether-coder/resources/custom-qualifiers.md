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

| Annotation | Type | Config Section | Target |
|-----------|------|---------------|--------|
| `@Sql` | SqlConnector | `"database"` | PARAMETER |
| `@PgSql` | PgSqlConnector (or a `@PgSql` `@Query` persistence interface) | `"database"` | PARAMETER, TYPE |
| `@Http` | HttpClient | `"http"` | PARAMETER |
| `@Notify` | NotificationSender | `"notification"` | PARAMETER |
| `@Jooq` | JooqConnector | `"database"` | PARAMETER |
| `@Heartbeat` | Scheduled (heartbeat task) | `"scheduling.heartbeat"` | METHOD |

`@Heartbeat` is the built-in shortcut for the heartbeat scheduled task (method must
be zero-arg, returning `Promise<Unit>`); other schedules still need a custom
`Scheduled.class` qualifier.

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
| **A type you define** | **your own class** | PARAMETER |

## User-defined resource types — the provisioned step

`type` may name a class of your own, not only a runtime type. The runtime provisions it from
config and hands the slice a working object, so a configurable part of the application is
provisioned rather than selected by a flag the slice reads. The book calls this a
**provisioned step**.

Available since `8d36f0c1c` (#773). Before that commit a slice declaring a qualifier for its
own type compiled and deployed, then failed at load with `ResourceFactoryNotFound`.

Supply a `ResourceFactory<T, C>`, registered in the slice jar under
`META-INF/services/org.pragmatica.aether.resource.ResourceFactory`:

- `configType()` names the config record. The section is bound to it before the factory runs,
  so a malformed section fails at provisioning, not inside a request.
- `supports(C)` selects among factories offering the same type; `priority()` breaks ties. This
  is where a `if (config.flag())` in the slice goes.
- `provision(C)` returns `Promise<T>`, so assembly can fail the deployment. An optional
  `provision(C, ProvisioningContext)` override exists.
- `close(T)` defaults to closing the resource if it is `AutoCloseable`, **only when the last
  consuming slice releases it**, and **a close failure is absorbed**: it is recorded and the
  release still reports success.

`T` itself is unconstrained — no interface to implement, no constructor shape. The factory
carries the whole contract.

**Config is read once.** A resource is built from the values current at provisioning and is
not rebuilt when configuration changes; a slice sees new config when it is next reloaded. This
holds for `ConfigurationSection` too — see the delivery-semantics note in `configuration.md`.

**When to use it:** a setting that selects which of several behaviors runs becomes a
provisioned step. A setting that parameterizes one behavior that runs regardless stays a value.
