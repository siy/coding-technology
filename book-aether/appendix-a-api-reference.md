# Appendix A — API quick reference

The author-facing surface this book teaches, in one place. Every signature below was read from
Pragmatica source at `release-1.0.0-rc3` head `e123caafb` (2026-08-26); the shapes are stable,
but this is the fastest-moving appendix in the book, so verify against the source of your
runtime version before you lean on a detail. The core types — `Result`, `Option`, `Promise`,
their combinators, and the JBCT patterns built on them — are the JBCT book's territory and its
appendix covers them; this one starts where Aether starts.

## The slice contract

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Slice {}
```

A slice is an interface marked `@Slice`. Its methods return `Promise<T>` and take one request
parameter; request, response, and error types nest inside the interface; the factory is a static
method named after the interface, lower-first, whose parameters are the slice's dependencies. A
single-method slice returns a lambda; a multi-method slice returns a local record.

Failures implement `Cause`:

```java
public interface Cause {
    String message();
    default boolean isTerminal() { return false; }
    default Option<Cause> source() { return Option.empty(); }
    default <T> Result<T> result() {...}
    default <T> Promise<T> promise() {...}

    interface Terminal extends Cause {...}   // marks non-retryable
    interface Wrapped  extends Cause { Cause origin(); ... }
}
```

An application type implements only `message()`. Lift a failure fluently — `cause.promise()`,
`cause.result()` — never by throwing.

## Resource qualifiers

Provisioning is declared by a qualifier annotation carrying `@ResourceQualifier`:

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.ANNOTATION_TYPE)
public @interface ResourceQualifier {
    Class<?> type();      // the resource type to provision
    String   config();    // the config section that describes it
}
```

Built-in qualifiers, each `@Target(PARAMETER)` unless noted:

| Qualifier | Provisions | Config section |
|---|---|---|
| `@Sql` | `SqlConnector` | `database` |
| `@PgSql` (also `@Target(TYPE)`) | `PgSqlConnector` | `database` |
| `@Http` | `HttpClient` | `http` |
| `@Notify` | `NotificationSender` | `notification` |
| `@Jooq` | `JooqConnector` | `database` |

Everything else follows the author-declared pattern: you write the annotation, naming the
resource type and the section. This is how scheduled methods, pub-sub, streams, entities, and
interceptors are all declared — one mechanism, no special cases:

```java
@ResourceQualifier(type = StreamPublisher.class, config = "streams.order-events")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface OrderEventStream {}
```

## Persistence

```java
public interface SqlConnector extends DatabaseConnector {
    <T> Promise<T>          queryOne(String sql, RowMapper<T> mapper, Object... params);
    <T> Promise<Option<T>>  queryOptional(String sql, RowMapper<T> mapper, Object... params);
    <T> Promise<List<T>>    queryList(String sql, RowMapper<T> mapper, Object... params);
    Promise<Integer>        update(String sql, Object... params);
    Promise<int[]>          batch(String sql, List<Object[]> paramsList);
    <T> Promise<T>          transactional(TransactionCallback<T> callback);

    @FunctionalInterface
    interface TransactionCallback<T> {
        Promise<T> execute(SqlConnector connector);
    }
}

public interface PgSqlConnector extends SqlConnector {}
```

Transport is selected by the `database` section's URL key: `async_url` (native asynchronous
Postgres), `r2dbc_url`, or JDBC by default. Schema migrations live under `schema/` in
Flyway-style versioned files, applied at deploy; Module A carries the details.

## HTTP client

```java
public interface HttpClient {
    Promise<HttpResult<String>> get(String path);
    Promise<HttpResult<String>> post(String path, String body);
    Promise<HttpResult<String>> put(String path, String body);
    Promise<HttpResult<String>> patch(String path, String body);
    Promise<HttpResult<String>> delete(String path);
    Promise<HttpResult<byte[]>> getBytes(String path);

    <T> Promise<T> getJson(String path, TypeToken<T> responseType, Option<TypeToken<?>> errorType);
    <T> Promise<T> postJson(String path, Object body, TypeToken<T> responseType, Option<TypeToken<?>> errorType);
    <T> Promise<T> putJson(String path, Object body, TypeToken<T> responseType, Option<TypeToken<?>> errorType);
    <T> Promise<T> patchJson(String path, Object body, TypeToken<T> responseType, Option<TypeToken<?>> errorType);
    <T> Promise<T> deleteJson(String path, TypeToken<T> responseType, Option<TypeToken<?>> errorType);
}
```

Every verb also has header-carrying overloads, and the `*Json` family has `Class<T>`-based
shortcuts. Failures arrive typed on the error channel (`HttpClientError`).

## Notifications

```java
public interface NotificationSender {
    Promise<NotificationResult> send(Notification notification);
}
```

The `notification` section's `backend` key selects `smtp` or `http` (provider API); the
`Notification` you build is the same either way.

## Pub-sub

```java
@FunctionalInterface
public interface Publisher<T> {
    Promise<Unit> publish(T message);
}
```

Publishing is a parameter (qualifier over `Publisher.class`, section `messaging.<topic>`).
Receiving is a method: declare a method-level qualifier over `Subscriber.class` with the same
section, on a method taking exactly the message type and returning `Promise<Unit>`. Delivery is
at-most-once to the subscribers present at publish time; the returned `Promise` completes when
every present subscriber's `Promise` settles.

## Streams

```java
public interface StreamPublisher<T> {
    Promise<Unit> publish(T event);
    default Promise<Unit> publishBatch(List<T> events) {...}
}

public interface StreamAccess<T> {
    Promise<Long>                 publish(T event);
    Promise<List<StreamEvent<T>>> fetch(long fromOffset, int maxEvents);
    Promise<List<StreamEvent<T>>> fetch(int partition, long fromOffset, int maxEvents);
    Promise<Unit>                 commit(String consumerGroup, int partition, long offset);
    Promise<Option<Long>>         committedOffset(String consumerGroup, int partition);
    default Promise<List<StreamEvent<T>>> fetchFromCommitted(String consumerGroup, int partition, int maxEvents) {...}
    Promise<StreamMetadata>       metadata();

    record StreamEvent<T>(long offset, long timestamp, int partition, T payload) {}
}
```

A driven consumer is a method: qualifier over `StreamSubscriber.class`, section
`streams.<name>`, method taking the event type (or `List<T>`) and returning `Promise<Unit>`.
The runtime delivers per partition in order, advances the group's committed offset only on
handler success, retries a failure (three attempts by default), then dead-letters and skips.
Partition routing: mark one record component `@PartitionKey` (`@Target(RECORD_COMPONENT)`);
keyless events route round-robin.

`[streams.<name>]` keys and defaults:

| Key | Default | Meaning |
|---|---|---|
| `partitions` | `4` | ordering and parallelism unit; changing it remaps keys |
| `replicas` | `1` | copies of each partition, including the owner |
| `min-sync-replicas` | `0` | copies that must confirm a write before it resolves |
| `retention` | `"count"` | `count` \| `time` \| `size` \| `compound` |
| `retention-value` | `""` | bound for the chosen retention |
| `auto-offset-reset` | `"latest"` | where a new consumer group starts |
| `max-event-size` | `1048576` | bytes |
| `compression` | `NONE` | payload compression |

Consumer-group overrides live under `[streams.<name>.consumers.<group>]` (error strategy
`RETRY` \| `SKIP` \| `STALL`, `maxRetries`, `deadLetterStream`, checkpoint interval).

## Durable entity

```java
public interface DurableEntity<K, S, C extends Mutator<S>> {
    Promise<S>          create(K key, S initial);
    Promise<Option<S>>  get(K key);                                    // BOUNDED_STALE
    Promise<Option<S>>  get(K key, ReadConsistency consistency);
    Promise<S>          update(K key, C mutator);
    Promise<TimerToken> scheduleTimer(K key, Duration delay, C onFire);
    Promise<Unit>       cancelTimer(K key, TimerToken token);
    Promise<Unit>       delete(K key);

    record TimerToken(String value) {}
}

public interface Mutator<S> { S apply(S state); }       // implement via sealed records, never a lambda

public enum ReadConsistency { BOUNDED_STALE, LINEARIZABLE }
```

Declare one qualifier per keyspace over `DurableEntity.class`, section `entities.<keyspace>`.
The section requires all of `keyspace` (non-blank, no `/`), `partition_count` (≥ 1), and
`replication_factor` (≥ 1); the write barrier is derived as `min(2, replication_factor)`.
Failures are the sealed `EntityError` — eleven variants, listed in Module D. Timers are durably
recorded but not yet fired on a deployed node (#351) at this pin.

## Scheduled work

Declare a method-level qualifier over the built-in `Scheduled` type; the method takes no
parameters and returns `Promise<Unit>`:

```java
@ResourceQualifier(type = Scheduled.class, config = "scheduling.cart-sweeper")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface SweepAbandonedCarts {}
```

The section carries `interval` (e.g. `"10s"`) and `cron` (present even when empty); Module C
covers `leaderOnly` and operational behavior.

## Interceptors

No built-in method annotations ship. You declare one annotation per cross-cutting concern,
naming the interceptor class and its config section:

```java
@ResourceQualifier(type = RetryMethodInterceptor.class, config = "retry.payment")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RetryPayment {}
```

The seven shipped interceptor classes: `RetryMethodInterceptor`, `CircuitBreakerMethodInterceptor`,
`RateLimitMethodInterceptor`, `MetricsMethodInterceptor`, `LoggingMethodInterceptor`,
`CacheMethodInterceptor`, `IdempotencyMethodInterceptor`. Composition is compile-time and
deterministic: the first annotation on the method is the outermost wrapper, the last is
innermost. `@Key` (parameter or record component) marks the cache/idempotency key.

## routes.toml

Recognized surface, per the route-config loader:

- top-level `prefix`
- `[routes]` — `methodName = "METHOD /path"`, or an inline table with `method`, `consumes`,
  `produces`, `security`
- versioned form: `[api]` (`prefix`, `requireVersionHeader`) with `[vN.routes]` per version and
  per-version `deprecated`, `defaultIfMissing`, `sunset`; flat and versioned forms do not mix
- `[errors]` — `default` status, `strict`, and `HTTP_<code> = ["glob", ...]` lists; a glob
  matches the returned `Cause` type's simple name only, never a message and never an enum
  constant; `strict = true` turns an unmapped `Cause` into a build failure
- `[security]` — `default`, `override_policy`

## Configuration layering

Most-specific wins: blueprint `resources.toml` (global) < `aether.toml` (node) <
`slices/<Slice>.toml` (slice). `${secrets:...}` references resolve at load.

## CLI and management API

The operational commands Part V teaches, at this pin:

```bash
aether cluster bootstrap <config>.toml --wait
aether -c <node>:8080 artifacts push  <group>:<artifact>:<version>
aether -c <node>:8080 blueprints deploy <group>:<artifact>:<version> --wait
aether scale <coords> -n <instances> --placement WORKER_PREFERRED --wait
aether cluster scale <provider> worker --count <n>
aether deploy <coords> --canary --traffic 5 --error-rate 0.01 --latency 500
aether deploy promote|complete|rollback <deploymentId>
aether cluster destroy --cluster=<name> --yes    # exit 4 = cleanup failed, registry kept
```

Management endpoints: `/api/traces?id=<requestId>`, `/api/metrics` (and
`/api/metrics/prometheus`), `/api/invocations/metrics` (and `/slow`),
`/api/observability/config`, `/api/observability/depth`.
