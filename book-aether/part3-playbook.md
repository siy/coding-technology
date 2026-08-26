# Part III — The playbook

This is where the order application becomes a system. Each chapter opens with a problem,
takes it apart, derives the idiomatic Aether solution, and folds that solution into the
running app. The resource modules come first, because you build with resources; the pattern
modules that follow combine them to solve the harder problems.

# Module A — Persistence

## Storing state that survives

So far `placeOrder` has run entirely in memory. The moment the node holding it restarts,
every order it accepted is gone. The first thing a real order service needs is to record
what it knows somewhere that outlives the process.

In the knowledge-gathering frame, persistence is two acts: writing a piece of knowledge
down so it survives, and reading it back when it is needed again. Both touch the outside
world, so both are `Promise`, and both are provisioning in the sense of Part 0: a database
is a resource, environment-dependent, requested with a qualifier.

You request it with the built-in `@Sql` qualifier, which binds a `SqlConnector` to the
`database` configuration section:

```java
@Slice
public interface OrderStore {
    Promise<Option<Order>> find(OrderId id);
    Promise<Unit> save(Order order);

    static OrderStore orderStore(@Sql SqlConnector db) {
        record orderStore(SqlConnector db) implements OrderStore {
            @Override public Promise<Option<Order>> find(OrderId id) {
                return db.queryOptional(
                    "SELECT id, customer, total_cents FROM orders WHERE id = ?",
                    OrderStore::toOrder, id.value());
            }

            @Override public Promise<Unit> save(Order order) {
                return db.update(
                    "INSERT INTO orders (id, customer, total_cents) VALUES (?, ?, ?) "
                  + "ON CONFLICT (id) DO UPDATE SET customer = excluded.customer, "
                  + "total_cents = excluded.total_cents",
                    order.id().value(), order.customer().value(), order.total().cents())
                  .mapToUnit();
            }
        }
        return new orderStore(db);
    }

    private static Result<Order> toOrder(RowAccessor row) {
        return Result.all(row.getString("id"), row.getString("customer"), row.getLong("total_cents"))
                     .map((id, customer, cents) ->
                              new Order(new OrderId(id), new CustomerId(customer), Money.ofCents(cents)));
    }
}
```

The connector's API is small and uniform. `queryOne`, `queryOptional`, and `queryList`
read, each taking the SQL, a `RowMapper` that turns a row into a domain value, and the
parameters. `update` writes and returns the affected row count; `batch` writes many;
`transactional` runs several statements as one atomic unit. Every one returns a `Promise`,
so a query composes into a slice's pipeline like any other step.

Two details carry weight. The first is the mapper. A `RowMapper` reads columns through a
`RowAccessor`, and every getter returns a `Result`, because a column can be absent or the
wrong type, and that is knowledge worth keeping rather than an exception worth throwing.
`Result.all` gathers the three column results and builds the `Order` only if all three
succeed. (Values read back from your own store were validated on the way in, so the mapper
builds them directly; untrusted input is still parsed at the edge, as always.)

The second is the upsert. `save` is written with `ON CONFLICT (id) DO UPDATE`, so running it
twice produces one row, not two. That is Part II's idempotency made concrete: a retried
`save` after a dropped connection is safe. Module D returns to idempotency keys for the
cases an upsert cannot cover.

You wrote `@Sql` once and chose no driver. The runtime selects the transport from
configuration, by priority. If the `database` section carries an `async_url`, Aether uses
its built-in **postgres-async** transport, a native Netty driver that multiplexes many
in-flight queries over a small pool of connections. If it carries an `r2dbc_url`, it uses
R2DBC. Otherwise it uses JDBC. The same slice runs on all three; which one is a matter of
configuration.

```toml
[database]
type = "POSTGRESQL"
host = "localhost"
database = "orders"
username = "orders"
password = "${secrets:database/password}"
async_url = "postgresql://localhost:5432/orders"   # selects postgres-async

[database.pool_config]
min_connections = 5
max_connections = 20
```

As Part 0 set out, this is the local-development default: it points at a Postgres on your
laptop. Production supplies the same keys with a different host and a secret-resolved
password, and the slice does not change. The `pool_config` block tunes the pool; for the
async transport, `io_threads` sizes the Netty event loop.

With `OrderStore` in hand, `placeOrder` gains a step: after reserving inventory and charging
payment, it saves the order before returning. The order now survives a restart, and because
`save` is an upsert, a replay after failover writes the same row rather than a duplicate.
The next chapter keeps the persistence and removes the hand-written SQL, letting the
compiler check queries against the schema.

## Aether Store: type-safe persistence

The SQL in `OrderStore` is a string. Rename a column in the schema and nothing complains
until the query runs in production and fails. The knowledge of which columns exist, and of
what type, lives in the database schema, where the compiler cannot see it. Aether Store
closes that gap: it reads your schema at build time and checks every query against it.

You declare a persistence interface and annotate it with `@PgSql`:

```java
@PgSql
public interface OrderPersistence {
    Promise<Option<OrderRow>> findById(String id);
    Promise<OrderRow> save(OrderRow order);

    @Query("SELECT id, customer, total_cents FROM orders WHERE customer = :customer")
    Promise<List<OrderRow>> findByCustomer(String customer);
}
```

`OrderRow` is generated from your migrations by `mvn pg:generate`, which reads the `schema/`
directory and emits one record per table with the right field types. The next chapter covers
migrations; here it is enough that the schema exists and the row type comes from it.

Two kinds of method live in this interface. A method with a `@Query` runs that SQL, its
`:name` parameters matched to the method parameters; the processor rewrites them to
PostgreSQL's positional form and validates the whole statement against the schema. A method
without a `@Query` is generated from its name in the Spring Data style: `findById` becomes a
select by primary key, `save` an insert-or-update, `deleteById` a delete,
`findByCustomerOrderByCreatedAtDesc` the obvious query. You write the interface; the
processor writes the SQL for the routine cases and checks the SQL for the rest.

The checking is the point. If a column does not exist, a parameter has no place in the
query, or a type does not line up, compilation fails with a clear message:

```
error: [PG-VALIDATE] Column 'totl_cents' not found in table 'orders'
  -> OrderPersistence.java:14
```

If it compiles, the queries work. The return type tells the processor how many rows to
expect: `Promise<T>` is exactly one, `Promise<Option<T>>` is zero or one, `Promise<List<T>>`
is many, `Promise<Unit>` is a write, and `Promise<Long>` or `Promise<Boolean>` is a scalar.

`@PgSql` is itself a resource qualifier, placed on the interface rather than on a parameter.
That makes the interface a small hybrid of Part 0's two jobs: it is assembled into your
slice like any other dependency, named as a plain parameter, while its own generated factory
provisions a `PgSqlConnector` from the `database` section to back it. You wire it in without
ceremony:

```java
static OrderService orderService(OrderPersistence orders) {
    return request -> orders.save(toRow(request))
                            .map(OrderPlaced::from);
}
```

`OrderStore` from the previous chapter is now `OrderPersistence`, and the hand-written SQL is
gone. `save` is still an upsert, because the generated `save` is an insert-or-update on the
primary key, so it stays idempotent. What changed is that the dangerous part, the SQL, is no
longer a string the compiler ignores; it is checked against the schema on every build.

Which raises the question the next chapter answers: where does that schema come from, and how
does it change without breaking the orders already in the table?

## Schema management and migration

Chapter 2 left a question open: `@PgSql` validates your queries against the schema, but where
does the schema come from, and how do you change it, add a column, add a table, without
breaking the orders already stored or the cluster already running?

The schema is shared knowledge. The database depends on it, and so does the compiler, through
the row types and query checks. Knowledge that two parties rely on cannot change by hand on a
whim; it has to change in recorded, ordered, reversible steps. That is what a migration is.

Migrations are SQL files in `src/main/resources/schema/`, named Flyway-style:

```
src/main/resources/schema/
  V001__create_orders.sql
  V002__add_orders_status.sql
```

```sql
-- V001__create_orders.sql
CREATE TABLE orders (
    id          TEXT PRIMARY KEY,
    customer    TEXT NOT NULL,
    total_cents BIGINT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The prefix is the kind of migration. **V** is versioned: applied once, in order, the everyday
case. **R** is repeatable: re-applied whenever its checksum changes, for things you redefine
rather than alter, like a view or a function. **U** is an undo for a versioned step, and **B**
is a baseline that adopts an existing schema as the starting point when you bring an older
database under management.

The runtime applies them when the blueprint deploys. The schema manager runs the pending
migrations against each datasource, records every one in an `aether_schema_history` table with
its checksum and timestamp, and a slice does not begin serving until its migrations have
succeeded. That gate is on by default; a blueprint can set `schema_required = false` to opt
out. So a deploy is migrate-then-serve: the orders table is at the version the code expects
before the first request reaches it. The engine manages tables, not databases, so the
datasource's database must already exist; creating it is an environment step, not a migration.

The same files do double duty. `mvn pg:generate` reads them to generate the `OrderRow` type
from chapter 2, and `@PgSql` validates queries against them at compile time. One source of
truth, the migrations, feeds the database, the row types, and the query checks, so the three
cannot drift apart. Before shipping a migration, `mvn pg:lint` checks it for the hazards that
bite in production: a `NOT NULL` column added without a default, an index built without
`CONCURRENTLY`, a timestamp without a time zone, a `DROP` without `IF EXISTS`.

A second datasource is a subdirectory whose name matches its configuration section:

```
schema/                 -> [database]            (@Sql, @PgSql)
schema/analytics/       -> [database.analytics]  (@AnalyticsDb)
```

Resolution is strict: every schema directory must have a matching config section, and a
missing one fails the deploy with a clear message rather than guessing.

Locally, you run an external Postgres (the example projects' `start-postgres.sh` starts one and
creates the database); the migrations then manage its tables. Production points the same
configuration at a managed instance, and the identical migration files run there on deploy. The
orders table now has a history you can read, evolve, and roll back, and adding a column is one
new `V` file, applied on the next deploy and checked by the compiler before that.

The generated query model covers the common cases well. The next chapter is for when it does
not: complex, composed, or dynamic queries, built type-safely with jOOQ.

## jOOQ interoperability

`@PgSql` shines when the query is known in advance: a fixed statement, validated against the
schema, run by name. Some queries are not known in advance. An order search offers a dozen
optional filters, and the SQL depends on which ones the caller supplied. Writing one `@Query`
per combination is hopeless, and concatenating SQL strings by hand throws away the safety
chapter 2 just bought. For queries you build at runtime, Aether speaks jOOQ.

You request a `JooqConnector` with the built-in `@Jooq` qualifier and build queries through
its `DSLContext`:

```java
@Slice
public interface OrderSearch {
    Promise<List<OrderRecord>> search(OrderCriteria criteria);

    record OrderCriteria(Option<String> customer, Option<Long> minTotalCents, Option<Instant> since) {}

    static OrderSearch orderSearch(@Jooq JooqConnector jooq) {
        return criteria -> jooq.fetch(query(jooq.dsl(), criteria));
    }

    private static ResultQuery<OrderRecord> query(DSLContext dsl, OrderCriteria c) {
        return dsl.selectFrom(ORDERS)
                  .where(c.customer().map(ORDERS.CUSTOMER::eq).fold(DSL::noCondition, cond -> cond),
                         c.minTotalCents().map(ORDERS.TOTAL_CENTS::ge).fold(DSL::noCondition, cond -> cond),
                         c.since().map(ORDERS.CREATED_AT::ge).fold(DSL::noCondition, cond -> cond))
                  .orderBy(ORDERS.CREATED_AT.desc());
    }
}
```

`ORDERS`, `ORDERS.CUSTOMER`, and the rest are generated jOOQ types, so a wrong column or a
type mismatch is a compile error even though the query is assembled at runtime. Each optional
filter becomes a condition or a no-op: `Option.map(ORDERS.CUSTOMER::eq)` yields the condition
when the criterion is present, and `fold(DSL::noCondition, ...)` supplies jOOQ's no-op when it
is absent, so a missing filter drops out of the `WHERE` cleanly. The connector runs the
result: `fetch` for many rows, `fetchOne` and `fetchOptional` for one, `execute` for writes,
`transactional` for a unit of work, each a `Promise`. Transport is chosen exactly as for
`@Sql`.

The interesting part is where jOOQ's generated types come from. Normally jOOQ inspects a live
database at build time to generate them, which means a running Postgres in your build, usually
a Docker container. Aether removes that. The `pg-tools` plugin reads the same `schema/`
migrations from chapter 3 and emits a jOOQ schema XML:

```bash
mvn pg:export-jooq-xml      # migrations -> src/main/resources/jooq/jooq-schema.xml
```

Standard jOOQ code generation then runs against that XML, offline, with no database and no
container. Commit the XML beside the migrations, and in CI `mvn pg:check-jooq-xml` fails the
build when the two have drifted. The migrations stay the single source of truth from chapter
3: they create the tables, generate the `@PgSql` row types, validate `@PgSql` queries, and
generate the jOOQ types. Every layer reads one schema, and none can disagree with it.

Use `@PgSql` for the queries you can name and jOOQ for the ones you must build; they share the
`database` configuration and live in the same slice. Persistence is now covered for one
database. The last question in this module is what changes when an order service needs more
than one.

## More than one datasource

Persistence so far has used a single database, the default `database` section, reached through
`@Sql`, `@PgSql`, and `@Jooq`. One database is the right answer for most slices and should stay
the default answer. This chapter is about what to do when one is genuinely not enough.

The honest first question is whether the second store belongs in this slice at all. A separate
concern with its own data, a reporting warehouse, a catalog owned by another team, is usually
better as its own slice, called across the cluster like any other (Part II): a second slice
deploys and scales on its own and draws a clean ownership line. Reach for a second datasource
inside one slice only when a single use case must touch both stores and you want them to share
this slice's deployment and lifecycle. Workload isolation is the usual reason. The orders table
is a transactional hot path, while reporting wants a denormalized store with its own indexes,
its own retention, and often its own instance the data team tunes. Those two profiles contend
when they share a database, and separating them is what a second datasource buys.

The mechanism is the one from Part 0, used a second time. A resource qualifier binds a connector
to a configuration section, and the built-in `@Sql` and `@PgSql` bind to `database`. The default
section is taken, so a second store needs a section of its own and a qualifier that names it. You
write that qualifier once:

```java
@ResourceQualifier(type = PgSqlConnector.class, config = "database.analytics")
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.PARAMETER, ElementType.TYPE})
public @interface AnalyticsDb {}
```

That is the whole of it: a meta-annotation saying which resource type to build and which section
to build it from. `@Sql` and `@PgSql` are defined in exactly this way against `database`;
`@AnalyticsDb` is the same shape against `database.analytics`. The annotation carries the logical
name, "the analytics store," and configuration carries the location, so the slice still names a
store rather than stating where it lives. That is the assembling-versus-provisioning line from
Part 0 holding at two datasources just as it did at one.

With the qualifier defined, the analytics store is an Aether Store interface like any other,
except it carries `@AnalyticsDb` in place of `@PgSql`:

```java
@AnalyticsDb
public interface OrderAnalytics {
    Promise<Unit> record(OrderEventRow event);

    @Query("SELECT day, count(*) AS orders, sum(total_cents) AS revenue_cents "
         + "FROM order_events WHERE day = :day GROUP BY day")
    Promise<Option<DailyTotal>> dailyTotal(LocalDate day);
}
```

Everything chapter 2 said still holds: the processor generates the row types from this
datasource's migrations, derives the routine methods from their names, and validates each
`@Query` against the schema. The only difference is which schema and which connector, and that
difference lives entirely in the qualifier. A parameter store works the same way: an
`@AnalyticsDb SqlConnector` parameter hands you a hand-written-SQL connector on the analytics
section, exactly as `@Sql` does on the default one.

Each datasource is its own configuration section. The default keeps the shape from chapter 1,
and the analytics datasource nests under it:

```toml
[database]
async_url = "postgresql://localhost:5432/orders"
username  = "orders"
password  = "${secrets:database/password}"

[database.analytics]
async_url = "postgresql://localhost:5432/orders_analytics"
username  = "analytics"
password  = "${secrets:database/analytics-password}"
```

Locally both can point at one Postgres as two databases on the same instance, which keeps a
developer's setup to a single server. Production gives `database.analytics` its own host, and
again no slice code changes. Transport selection is per section, so one datasource can run
postgres-async while another runs JDBC if their URLs say so.

Each datasource owns its own schema, so each owns its own migrations. Chapter 3's `schema/`
directory holds the default database's migrations; a named datasource takes a subdirectory whose
name matches its section:

```
src/main/resources/schema/
  V001__create_orders.sql          -> [database]
  analytics/
    V001__create_order_events.sql  -> [database.analytics]
```

The schema manager runs each datasource's migrations against that datasource and records them in
an `aether_schema_history` table inside that datasource's own database, so the two histories
never mix. Resolution is strict: a schema subdirectory with no matching config section fails the
deploy rather than running against the wrong place. The migrate-then-serve gate from chapter 3
covers every datasource, so the slice does not begin serving until both schemas are at the
version the code expects.

Wiring both into the order slice is two parameters where there was one:

```java
static OrderService orderService(OrderPersistence orders, OrderAnalytics analytics) {
    return request -> orders.save(toRow(request))
                            .flatMap(saved -> analytics.record(OrderEventRow.from(saved))
                                                       .map(() -> OrderPlaced.from(saved)));
}
```

The order is saved to its own database, the truth of the system, and the analytics row is
recorded to the other. Here is the cost two datasources carry that one does not: two databases
are two transactions. The `save` can commit and the `record` can fail, leaving the analytics
store behind the orders store. For analytics that lag is usually tolerable, and recording it
best-effort, as above, is a fair first answer. When the second write must not be lost, that is the
dual-write problem: two stores, no shared transaction. The classic answer is a transactional outbox;
Module D reaches the same guarantee more directly, with an idempotency key that lets the second
effect be retried until it lands and recognized so it never duplicates. This dual-write is the
problem it solves.

That completes persistence. One database or several, the model is the same: a qualifier names a
store, a configuration section places it, migrations under a matching directory own its schema,
and the compiler checks every query against that schema before the slice runs. Nothing in this
chapter was a new concept; it was Part 0's provisioning applied a second time. The next module
leaves storage for movement, the messages slices send each other, by pub-sub and by stream.

# Module B — Messaging

Persistence let a slice remember. Messaging lets slices tell each other what happened. Module A
reached its stores as parameters, the slice initiating every call. Messaging uses both wiring
mechanisms from Part I: a parameter to send and an annotated method the runtime drives to
receive. Two kinds of messaging share that shape and differ in what they promise. Pub-sub is a
live announcement that whoever is listening hears. A stream is a durable log that nothing falls
out of. This module builds each on the orders spine and ends with how to choose.

## Telling other slices what happened

`placeOrder` saves an order and returns. Around that one fact a system grows reactions: a
customer dashboard wants to show the new order, a cache wants warming, an in-app notification
wants sending. The order slice could call each of them, but then it would have to know all of
them, and every new reaction would mean editing the order slice and redeploying it. That couples
the thing that happened to everything that cares, and the list of things that care keeps
growing.

The order slice's job is to place orders, not to keep a directory of interested parties. It
should state that an order was placed and move on; whoever cares arranges to hear it. That is
publish-subscribe: the sender names a topic, not a recipient.

You publish through a `Publisher`, requested as a parameter with a qualifier that names the
topic's configuration section:

```java
@ResourceQualifier(type = Publisher.class, config = "messaging.order-events")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface OrderEvents {}
```

```java
static OrderService orderService(OrderPersistence orders, @OrderEvents Publisher<OrderPlaced> events) {
    return request -> orders.save(toRow(request))
                            .map(OrderPlaced::from)
                            .flatMap(placed -> events.publish(placed).map(() -> placed));
}
```

`Publisher` is a one-method interface, `Promise<Unit> publish(T)`, so a publish composes into the
pipeline like any other step. The qualifier is the same `@ResourceQualifier` meta-annotation
Module A used for datasources, pointed this time at a topic section with `Publisher` as its type.
The order slice now names a topic and knows nothing about who reads it.

Receiving is the other wiring mechanism: an annotated method the runtime calls. A separate slice
declares a method qualified for the same topic, and the runtime drives it once per published
message:

```java
@Slice
public interface CustomerDashboard {
    @OnOrderPlaced
    Promise<Unit> onOrderPlaced(OrderPlaced event);

    static CustomerDashboard customerDashboard(@Sql SqlConnector db) {
        return event -> db.update(
            "INSERT INTO dashboard (customer, last_order, orders) VALUES (?, ?, 1) "
          + "ON CONFLICT (customer) DO UPDATE SET last_order = excluded.last_order, "
          + "orders = dashboard.orders + 1",
            event.customer().value(), event.id().value()).mapToUnit();
    }
}
```

```java
@ResourceQualifier(type = Subscriber.class, config = "messaging.order-events")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface OnOrderPlaced {}
```

A subscriber method takes the message and returns `Promise<Unit>`, the shape the runtime
enforces. Its qualifier names `Subscriber` as the type and the same `messaging.order-events`
section, which is how the runtime connects this method to that topic. The two slices never
reference each other; they meet at the topic name.

The topic itself is one configuration section:

```toml
[messaging.order-events]
topicName = "order-events"
```

`topicName` is the only field. A bare name like `order-events` is scoped to the application at
deploy; a fully qualified `namespace:topic:version` is taken as written. In the manifest the
publisher and subscriber appear as data the runtime reads before loading a class, the publisher
as a `publish.topic` entry and the subscriber among the reactive bindings:

```
publish.topic.0.config=messaging.order-events
reactive.0.category=subscription
reactive.0.config=messaging.order-events
reactive.0.method=onOrderPlaced
```

What pub-sub promises, and what it does not, follows from being live. `publish` returns a
`Promise<Unit>` that completes once every subscriber present at that moment has been invoked and
its own `Promise` has settled, each within a delivery timeout of about twenty seconds; it does not
persist the message, and it does not retry a subscriber that is down. Because the returned `Promise`
waits on those subscribers, a caller that chains work onto it, as `orderService` does above with
`events.publish(placed).map(() -> placed)`, pays the subscribers' latency in its own response time,
so keep subscriber work short or move the slow part to a stream. That the publisher waits on present
subscribers is today's behavior, not a fixed contract; a durable pub-sub variant on the roadmap
would decouple the two. Delivery is at-most-once: a subscriber that is absent misses the event, and
there is no log
to catch up from. One consequence is friendly: publishing to a topic with no subscribers is a
success, so a quiet system does not fail `placeOrder` for lack of listeners. The other is the
constraint that decides when to use it. Pub-sub fits when missing a message is acceptable, a
dashboard that refreshes a moment later, a cache that warms on the next read. When a message must
not be lost, the tool is a stream, and that is the next chapter.

## Events that must not be lost

Some reactions cannot be best-effort. Finance needs every order in an append-only ledger for
audit. An order-history read model must see every order, in order, and if the slice that builds
it was down for an hour it must catch up on the hour it missed rather than skip it. Pub-sub
offers none of this: no durability, no replay, no ordering across a gap. What these reactions
need is a durable, ordered, replayable log. That is a stream.

A stream carries domain events. Give the order one:

```java
record OrderEvent(String eventId, OrderId orderId, Kind kind, Instant at) {
    enum Kind { PLACED, PAID, SHIPPED, CANCELLED }

    static OrderEvent placed(OrderRow row) {
        return new OrderEvent(UUID.randomUUID().toString(), new OrderId(row.id()), Kind.PLACED, Instant.now());
    }
}
```

It is written through a `StreamPublisher`, requested as a parameter exactly as the topic
publisher was, with `StreamPublisher` as the qualifier's type and a `streams.*` section:

```java
@ResourceQualifier(type = StreamPublisher.class, config = "streams.order-events")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface OrderEventStream {}
```

```java
static OrderService orderService(OrderPersistence orders, @OrderEventStream StreamPublisher<OrderEvent> stream) {
    return request -> orders.save(toRow(request))
                            .flatMap(saved -> stream.publish(OrderEvent.placed(saved))
                                                    .map(() -> OrderPlaced.from(saved)));
}
```

`StreamPublisher` is `Promise<Unit> publish(T)`, with `publishBatch(List<T>)` for writing many at
once. Where the topic dropped the message if no one was listening, the stream writes it to a
persisted log, so a consumer that is not there yet still reads it later. The live topic from the
previous chapter and this durable stream can both run from the same slice; they serve different
consumers, and a slice mixes the two mechanisms freely.

Consuming is again an annotated method, qualified with `StreamSubscriber` for the same stream:

```java
@Slice
public interface OrderLedger {
    @OnOrderEvent
    Promise<Unit> record(OrderEvent event);

    static OrderLedger orderLedger(@Sql SqlConnector db) {
        return event -> db.update(
            "INSERT INTO order_ledger (event_id, order_id, kind, at) VALUES (?, ?, ?, ?) "
          + "ON CONFLICT (event_id) DO NOTHING",
            event.eventId(), event.orderId().value(), event.kind().name(), event.at()).mapToUnit();
    }
}
```

```java
@ResourceQualifier(type = StreamSubscriber.class, config = "streams.order-events")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface OnOrderEvent {}
```

The method shape is the same as a topic subscriber's, the message in and `Promise<Unit>` out, but
the delivery contract is a stream's. Declaring the method registers a consumer group, named from
the artifact and the method so every replica of the slice shares one, and the runtime elects
exactly one node to drive each partition for that group: the partition's owner when it also runs
the slice, otherwise a slice-bearing node that reads through the owner. Events arrive one at a
time, in partition order. The consumer's position is a committed offset per group and partition,
and it advances only after `record`'s `Promise` succeeds, so a restart or a reassignment resumes
from the last committed position instead of skipping what it missed. All of this needs the slice
running somewhere: a stream whose consuming slice is active on no live node delivers nothing and
reports the unassigned partitions, loudly, until it returns.

Failure is part of the same contract. A delivery the handler fails is retried with backoff, three
attempts by default, and an event that exhausts them is recorded as a dead letter and skipped, the
cursor advancing past it so one poison event cannot stall its partition forever. Pin down both
halves of that. Delivery is at-least-once, and only that: a redelivery after a failure, a
reassignment, or a resume from a checkpoint can hand the handler the same event twice, which is
why the ledger's insert is keyed on the event id. And an event that fails every retry leaves the
main path; the dead-letter record is where it goes, so a consumer that must lose nothing watches
the dead-letter side rather than assuming the stream will redeliver forever.

The annotated method is the passive form, and the runtime drives it. When you need the active
form — scanning history, replaying from a chosen offset, batching reads under your own control —
request a `StreamAccess<OrderEvent>` parameter against the same `streams.order-events` section.
`StreamAccess` reads and commits explicitly, and a consumer is a small read-process-commit loop
over it:

```java
// events : StreamAccess<OrderEvent>, injected against streams.order-events
events.fetchFromCommitted("order-ledger", partition, 100)   // Promise<List<StreamEvent<OrderEvent>>>
      .flatMap(batch -> applyInOrder(db, batch))            // your per-event record(...), yields the new offset
      .flatMap(offset -> events.commit("order-ledger", partition, offset));
```

`fetchFromCommitted(group, partition, max)` reads the next batch from wherever this consumer group
last committed on that partition: offset 0 the first time, the saved cursor afterwards, so a restart
resumes rather than replays. `commit(group, partition, offset)` records progress; the cursor is kept
per group and per partition and, on an owner with a writable data dir, survives a restart. Plain
`fetch(fromOffset, max)` reads from any position when you want to scan or replay. Each consumer group
keeps its own cursor, so a ledger and a read model read the whole stream independently, at their own
pace. The read is per partition, so a single-partition stream, the shape the partition note below
reserves for a log that must read as one total order, makes partition 0 the whole log; a
multi-partition stream needs a loop per partition.

Delivery is at-least-once: a batch read but not committed is read again after a failure, so the same
event can arrive twice, and the handler must be idempotent in the sense of Part II. The ledger's
`ON CONFLICT (event_id) DO NOTHING` makes a redelivery a no-op, which is why it is an insert keyed on
the event id rather than a blind append.

The stream's configuration section carries one structural setting and a few tuning ones:

```toml
[streams.order-events]
partitions = 4            # structural: ordering and parallelism unit
retention = "time"        # tuning
retention-value = "30d"   # tuning
```

`partitions` is structural: ordering is guaranteed within a partition, and partitions are the
unit of parallel consumption.

Which partition a given event lands in is a declaration, made in the event type itself. Mark one
component of the event record `@PartitionKey`:

```java
record OrderEvent(String eventId, @PartitionKey OrderId orderId, Kind kind, Instant at) { ... }
```

Every publish now routes by a stable hash of that component's string form, so all events carrying
the same order id land in the same partition and read back in publish order — per-key order on a
multi-partition stream, which is what the order-history read model needs. The hash is stable
across nodes and restarts; one key per record, and a second `@PartitionKey` is a compile-time
error. A record without one falls back to round-robin, which spreads load evenly but promises
nothing about which partition an event takes: the right default for independent events where
throughput is the only concern. Two edges to respect. The partition count is part of the
contract, because changing it remaps keys to different partitions and existing events are not
reshuffled, so pick the count as deliberately as you pick the key. And per-key order is order
within a partition: a stream that must read as one total order across all keys still wants
`partitions = 1`. `partitions` defaults to four.

The retention keys tune how long the log is kept and how large an
event may be. Treat those tuning keys as the part of streaming most likely to grow or change as
the runtime evolves; the shape this chapter relies on, a durable ordered log read by committed
offset, is the stable part. Verify the current keys against the resource reference when you
configure a stream.

### What "durable" depends on

Calling the log durable has glossed one dimension the configuration controls: how many nodes hold
each partition. Two keys set it, both structural, and their defaults are modest on purpose:

```toml
[streams.order-events]
partitions = 4              # ordering and parallelism unit
replicas = 3                # copies of each partition, including the owner
min-sync-replicas = 2       # a write resolves only once this many copies, including the owner, confirm it
retention = "time"
retention-value = "30d"
```

`replicas` is the number of copies of each partition, counting the owner; `min-sync-replicas` is how
many of those copies, again counting the owner, must acknowledge a write before the publishing
`Promise` resolves. Left unset, `replicas` is `1` and `min-sync-replicas` is `0`: the log lives on a
single owner, and a write resolves the moment that one node has it on disk. That is durable in a
narrow sense, crash-safe through a per-partition write-ahead log, so a node that dies and restarts
recovers its log, but not safe against losing the node's disk and not safe against losing the owner.
Lose that node and its single copy goes with it: a consumer reads empty until the node returns. For a
stream whose whole point is that no event is lost, one disk is not enough.

Durability across the loss of a node is what `min-sync-replicas` buys. Set it to `2` or more and
every write waits for at least one copy beyond the owner, so a caught-up replica always exists. Then
losing the owner is survivable for reads: after the owner is killed, a reader still gets the complete
prior history and the ordered tail, nothing dropped and nothing reordered. That is proven end to
end, an owner killed mid-stream and every earlier event still served in offset order alongside the
events that follow.

And after that owner loss the depth of replication heals itself. The runtime rebuilds the replica set
back to a caught-up copy on its own, so the stream returns to its configured redundancy without an
operator stepping in, and a status read reflects the restored count. A regression test guards this,
killing the owner and requiring both the lossless read and the automatic rebuild to converge. Two
bounds keep the claim honest: the proven case is a single graceful owner loss with the rest of the
cluster stable, exercised in an in-process test cluster, and the same behavior under heavier churn
and in a full cloud deployment is still being hardened. Read it as a clean promise for the clean
case, a stream configured for durability survives an owner loss with its reads intact and restores
its own redundancy afterward, with the wider failure envelope still being validated, so verify
against the current runtime before you rely on behavior past that single-failure path.

### Pub-sub or stream?

Both deliver a message from one slice to others through the same two mechanisms, and they trade
on a single axis: what happens to a message no one is ready for.

- Reach for **pub-sub** when the message is a live signal and missing one is acceptable:
  refreshing a dashboard, warming or invalidating a cache, an in-app nudge, fanning out to
  whoever happens to be listening. It is the loosest coupling and the cheapest, at-most-once,
  with no bookkeeping.
- Reach for a **stream** when every message counts and order or catch-up matters: audit ledgers,
  event-sourced read models, anything a restarted or late consumer must reprocess. It is durable,
  ordered, and at-least-once, at the cost of managing offsets and writing idempotent handlers.

The stream has a deeper use, foreshadowed by Module A's dual-write. When `placeOrder` must both
commit the order and record an event reliably, the event written to a durable stream is the safe
record, and the rest of the system is built by reading that stream. Making that second write
reliable when neither the commit nor the emit may be lost is the dual-write problem, and Module D
solves it with an idempotency key rather than a separate outbox to operate. The
model to carry forward is unchanged from Part I: a parameter to send, an annotated method to
receive, and the runtime reading the manifest to wire both. Messaging added two resource types
and reused the model intact. The next module collects the smaller resources a slice reaches for,
HTTP, notifications, scheduled work, and the interceptors that wrap them.

# Module C — Other resources

Part I named three seams a slice meets the world through: a resource taken as a parameter, where
the slice calls out; a method the runtime calls in; and the interceptors woven around the slice's
own methods.
Modules A and B used the first two for stores and messaging. This module collects the smaller
resources that round out a service, the ones a slice calls out to and the work the runtime drives
on its behalf.

## Calling out: HTTP and notifications

A slice rarely lives alone. To price an order the order service may need a currency rate from an
external API; once an order is placed, the customer should get a confirmation. Both reach outside
the cluster, one to a third-party HTTP service and the other to an email provider, and both are
resources requested as parameters, the slice initiating the call. (A call to another slice inside
the cluster is the remote-proxy parameter from Part I; this chapter is about reaching services
that are not slices.)

The HTTP client comes from the built-in `@Http` qualifier, which binds an `HttpClient` to the
`http` configuration section:

```java
@Slice
public interface FxRates {
    Promise<Rate> rate(Currency ccy);

    static FxRates fxRates(@Http HttpClient http) {
        return ccy -> http.getJson("/rates/" + ccy.code(), new TypeToken<Rate>() {}, Option.none());
    }
}
```

`HttpClient` offers the verbs you expect, `get`, `post`, `put`, `delete`, `patch`, each returning
a `Promise<HttpResult<String>>`. `HttpResult` is status-aware: it carries the status code,
headers, and body, and `toResult()` turns a non-2xx into a failure, so an HTTP error is data you
handle rather than an exception that escapes. For the common case of a JSON body, `getJson` and
`postJson` take a `TypeToken` for the response type and parse the body into a domain value at the
edge, the parse-don't-validate rule from JBCT applied to a network boundary. The trailing
`Option<TypeToken<?>>` is an optional type for a structured error body, `Option.none()` when you
do not need one.

Config supplies the endpoint and the timeouts:

```toml
[http]
base_url = "https://rates.example.com"
connect_timeout = "10s"
request_timeout = "30s"
```

As with a datasource, the slice names `http` and config places it; production points `base_url` at
the real service and the slice does not change. When a slice talks to more than one HTTP service,
give each its own qualifier exactly as Module A gave each datasource one:
`@ResourceQualifier(type = HttpClient.class, config = "http.pricing")` and a second for the other,
each with its own `[http.pricing]` section.

Notifications work the same way, through the built-in `@Notify` qualifier and a
`NotificationSender`:

```java
static OrderMailer orderMailer(@Notify NotificationSender mail) {
    return order -> mail.send(new Notification.Email(
            "orders@shop.example",
            List.of(order.customerEmail()),
            "Order " + order.id().value() + " received",
            new NotificationBody.Text("Thanks. We have your order and will email when it ships."),
            List.of(), List.of(), Option.none()))
        .mapToUnit();
}
```

`NotificationSender` has one method, `Promise<NotificationResult> send(Notification)`.
`Notification` is a sealed type, today an `Email`, whose body is itself sealed as `Text` or
`Html`; the empty lists and `Option.none()` are cc, bcc, and reply-to. The message is a value you
build; what delivers it is config:

```toml
[notification]
backend = "smtp"

[smtp]
host = "smtp.example.com"
port = 587
tls_mode = "STARTTLS"
username = "orders@shop.example"
password = "${secrets:smtp/password}"
```

`backend = "smtp"` sends through an SMTP server; `backend = "http"` with an `[http-email]` section
sends through a provider API such as SendGrid or Mailgun instead. The slice builds the same
`Notification` either way, and switching providers is a config change. The set of providers behind
the HTTP backend is the part of this resource most likely to grow, so check the resource
reference for the current list; the `Notification` model and the `send` call are the stable shape.

Both resources are the same mechanism Modules A and B used, a capability named by a qualifier and
located by config. The next chapter turns to work that no caller triggers.

## Work the runtime drives

Not all work starts with a request. Abandoned carts need sweeping every few minutes, a nightly
report needs building at two in the morning, a stuck payment needs a periodic nudge. No caller
initiates these; they run on a clock. This is the other wiring mechanism from Part I: the runtime
calls into an annotated method, this time on a schedule.

You declare a scheduled task with a method qualifier whose type is the built-in `Scheduled`
resource and whose config section holds the schedule:

```java
@ResourceQualifier(type = Scheduled.class, config = "scheduling.cart-sweeper")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface SweepAbandonedCarts {}
```

```java
@Slice
public interface CartMaintenance {
    @SweepAbandonedCarts
    Promise<Unit> sweep();

    static CartMaintenance cartMaintenance(@Sql SqlConnector db) {
        return () -> db.update(
            "DELETE FROM carts WHERE updated_at < now() - interval '30 minutes'").mapToUnit();
    }
}
```

A scheduled method takes no arguments and returns `Promise<Unit>`, the shape the runtime
enforces; there is no request, only the tick. The schedule itself is config:

```toml
[scheduling.cart-sweeper]
interval = "5m"
cron = ""
execution_mode = "SINGLE"
```

`interval` runs the method at a fixed rate; `cron` runs it on a cron expression instead, for
"every day at 02:00" rather than "every five minutes". The setting that matters most,
`execution_mode`, is the one a cluster forces you to think about. A blueprint runs on many nodes,
and every node hosts the slice, so either each node runs the sweep or just one does.
`execution_mode = "SINGLE"`, the default, runs the task on the cluster leader alone, so it fires
once across the whole cluster however many nodes are up. `execution_mode = "ALL"` runs it on every
node, which is what you want for node-local work like flushing a per-node metric, and what you
keep away from work that must happen once, like the sweep, a report, or a billing run. Leader-
gated cron is a one-line setting here because the runtime already knows which node is the leader.

In the manifest the task is a reactive binding like a subscriber, with its own category:

```
reactive.0.category=scheduled
reactive.0.config=scheduling.cart-sweeper
reactive.0.method=sweep
```

Because a scheduled task can run after a missed tick, or during a leader change land close to
another run, write it to be safe to repeat, the idempotency habit from Part II: the sweep's
`DELETE` is naturally repeatable, and a task that is not should guard itself. Moving from every
five minutes to every minute, or from per-node to leader-only, is a config change; the method
does not know the difference.

Scheduled work is one thing the runtime drives on a clock. The next is work it drives on an event
from the database itself.

## Database notifications (PG LISTEN/NOTIFY)

> _Intended design, not yet wired (source as of 2026-06-27): the `PgNotificationSubscriber`
> resource, the `PgNotification` payload, and the callback machinery exist, but the method-level
> listener annotation shown here is not yet generated by the processor. Written to the intended
> shape; verify against source before GA._

Some events originate in the database. A trigger fires on an `INSERT`, a row's status flips, or
another service writes through the same Postgres, and the slice wants to react the moment it
happens rather than poll for it. Postgres has `LISTEN`/`NOTIFY` for this, and Aether surfaces it
as the database-side sibling of a stream subscriber: a method the runtime drives when a
notification arrives on a channel.

You declare it with a method qualifier whose type is `PgNotificationSubscriber` and whose config
section names the datasource and the channels:

```java
@ResourceQualifier(type = PgNotificationSubscriber.class, config = "pg-notifications.order-changes")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface OnOrderChange {}
```

```java
@Slice
public interface OrderChangeListener {
    @OnOrderChange
    Promise<Unit> onChange(PgNotification notification);

    static OrderChangeListener orderChangeListener(@Sql SqlConnector db) {
        return notification -> db.update(
            "INSERT INTO order_change_log (channel, payload, at) VALUES (?, ?, now())",
            notification.channel(), notification.payload()).mapToUnit();
    }
}
```

The method receives a `PgNotification`, which carries the `channel` it arrived on, the `payload`
string the `NOTIFY` sent, and the `pid` of the Postgres backend that sent it, and returns
`Promise<Unit>`. Config lists the datasource and the channels to listen on:

```toml
[pg-notifications.order-changes]
datasource = "database"
channels = ["order_status", "order_cancelled"]
```

The runtime issues `LISTEN` on each channel against that datasource and calls the method for every
`NOTIFY`, so a `NOTIFY order_status, '42'` from a trigger or another writer reaches `onChange` as
a `PgNotification("order_status", "42", pid)`. In the manifest it is a reactive binding like the
others, with its own category:

```
reactive.0.category=pg-notify
reactive.0.config=pg-notifications.order-changes
reactive.0.method=onChange
```

What this is for, and what it is not, follows from how `LISTEN`/`NOTIFY` behaves. A notification
is fire-and-forget inside Postgres: one delivered while no node is connected is gone, and the
payload is a short string, not the row. So it fits a low-latency nudge, "something changed, go
look", and a change you cannot afford to miss belongs in a table or a stream from Module B, with
the notification as an optimization on top. Because a reconnection can drop or repeat around the
edges, keep the handler cheap and idempotent, the same habit Part II asks of every method the
runtime drives.

Scheduled ticks and database notifications are both the runtime calling in. Part I named one more
seam, different from either: behavior wrapped around the slice's own methods. Which behaviors apply,
and in what order, is fixed when the slice is compiled; how each behaves is what a deployment tunes.

## Cross-cutting behavior: interceptors

> _Confirmed from source at rc3 (`bfd00615d`). Interceptors are woven into the generated factory at
> compile time as nested `intercept(...)` calls, and their order is deterministic: the first
> annotation on a method is the outermost wrapper. Pragmatica #277 removed the older runtime-applied
> `Aspect` seam, so the interceptor chain is not reconfigured per deployment without a rebuild; what
> a deployment tunes is each interceptor's config section, not the chain. Seven `MethodInterceptor`
> types ship. Verify config-section keys against the resource reference before GA._

`placeOrder` calls payment over the network. That call fails transiently and should be retried;
if payment is down, retrying harder makes it worse, so calls should trip a circuit breaker; the
endpoint should be rate-limited; every call should be timed and logged. None of that is the order
service's job to express. Hand-written retry loops and breakers spread infrastructure through code
that should read as the domain, and they bake deployment decisions, how many retries and what
limit, into the artifact, where changing them means a rebuild.

These behaviors are interceptors, and you attach one the same way you request any resource: with a
qualifier. An interceptor is a resource whose type is a `MethodInterceptor`, so you declare a
method annotation for it and point its config section at the settings:

```java
@ResourceQualifier(type = RetryMethodInterceptor.class, config = "retry.payment")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RetryPayment {}
```

Then you put it on the method it should wrap, alongside any others:

```java
@Slice
public interface OrderService {
    @LogCalls
    @BreakOnPaymentOutage
    @RetryPayment
    Promise<OrderPlaced> placeOrder(PlaceOrder request);
}
```

Each annotation names a `MethodInterceptor` type and a config section, and the settings live in
that section exactly as a datasource's did:

```toml
[retry.payment]
max_attempts = 3
backoff = "EXPONENTIAL"
interval = "200ms"

[circuit-breaker.payment]
failure_threshold = 5
reset_timeout = "30s"
test_attempts = 3

[logging.orders]
level = "INFO"
log_args = false
log_duration = true
```

The generated factory builds each interceptor from its config section and wraps the method in them,
composing them as nested `intercept(...)` calls inside the generated bridge from Part I 1.1, so the
method runs inside the chain with nothing in `placeOrder` changing. The seven that ship are retry,
circuit breaker, rate limit, metrics, logging, cache, and idempotency, each a `MethodInterceptor`
(`RetryMethodInterceptor`, `CircuitBreakerMethodInterceptor`, and so on) with its own config record.

Cache is the one that changes behavior rather than only observing or guarding it: it can return a
stored result without calling the method at all. Because of that it wraps reads, and it needs to
know what to key on, which a `@Key` parameter marks:

```java
@ResourceQualifier(type = CacheMethodInterceptor.class, config = "cache.quotes")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface WithQuoteCache {}
```

```java
@Slice
public interface OrderQuote {
    @WithQuoteCache
    Promise<Quote> quote(@Key QuoteRequest request);
}
```

```toml
[cache.quotes]
ttl_seconds = 60
max_entries = 10000
mode = "LOCAL"            # or DISTRIBUTED, shared across the cluster
strategy = "CACHE_ASIDE"
```

A cache earns its keep on reads and is a hazard on writes, so it goes on the methods that read;
its hard part is invalidation, which Module E takes up alongside the pub-sub from Module B that
carries the invalidation signal.

When more than one interceptor wraps a method, the order they nest in matters: logging outermost so
it records the whole attempt, rate limit before any real work so a rejected call costs nothing, and
the circuit breaker around retry so a retried call re-enters the breaker and a tripped breaker stops
the retries. That order is not left to chance. The first annotation on the method is the outermost
wrapper, the next is inside it, and so on down to the method itself, fixed when the slice is
compiled. It is why the example above lists `@LogCalls` first and `@RetryPayment` last: logging ends
up outermost, recording the whole attempt, and the retry innermost, closest to the call. Read the
annotations top to bottom as wrappers from the outside in.

Every one of these is a deployment decision, not a domain decision. How many times to retry a flaky
gateway, how long to cache a quote, whether to allow a hundred requests a second or a thousand,
depends on the environment and the service level, not on what `placeOrder` means. Keeping them in
configuration leaves the slice readable as domain logic and lets operations tune resilience and
observability per environment, the same "configuration change, not code change" the rest of the
runtime follows. The annotation says which behaviors apply; the config section says how they
behave, and an environment changes the latter without touching the slice.

Modules A through C have built up the resources a slice uses and the three seams it meets the
world through. Module D turns from single resources to the patterns that combine them when one
operation has to stay correct across several.

# Module D — Reliability and consistency

> _Status: split by layer. The durable entity at the module's core is shipped: the resource is on
> a deployed node's classpath, a slice injects it like any other resource, and the write,
> replication, forwarding, and read paths taught below are source-verified at the pinned runtime
> head, with the crash gate run against a live cluster. Two bounds hold. Entity timers are
> durably recorded but the driver that fires them is not yet wired into a deployed node
> (pragmatica #351), so a scheduled timer never fires in production today; and the proven
> durability envelope is the loss and replacement of an owner in a live cluster, with a
> full-cluster cold restart riding the storage work still in flight (#349). The workflow and saga
> facades later in the module remain intended design (INVENTED, prototype-gated): pinned against
> the entity's verified primitives, with no runtime code behind them yet. The manual baseline
> that opens the module runs now on plain JBCT._

Placing an order is a single business operation built from several steps across several slices. It
reserves inventory, charges payment, and arranges shipping: three slices, three external effects,
three separate stores, and no transaction spanning them, because they do not share a database. When
the third step fails, the first two have already happened for real.

Reliability, in this module, is the discipline of keeping that operation whole anyway. It has to
stay correct in two different ways. When a later step fails, the earlier ones must be undone. And
when the process running the operation dies in the middle, something in the surviving cluster has to
remember where it got to and finish the job or unwind it. The first problem you can solve today with
nothing new. The second is why the durable entity exists.

## Rolling back what no transaction covers

A single-store write that half-finishes rolls back: the transaction is the unit of all-or-nothing,
and the database owns it. Across services there is no such unit. If `placeOrder` reserves inventory,
charges the card, and then shipping has no carrier for the address, there is no transaction to undo.
The reservation is held and the customer is charged for an order that will never ship.

The pattern the industry settled on is the saga: give every step a paired compensation that
semantically undoes it, and when a step fails, run the compensations for the steps that already
succeeded, in reverse order. A reservation is undone by releasing it; a charge is undone by
refunding it. Compensation is not a rollback. It is a second forward action that cancels out the
first, and the difference matters, because a refund is itself a real event the rest of the system
can see.

You can write this today, with nothing the runtime does not already give you. Validate the request
into a value every later step can trust, thread each step's result through a small context record,
and hang each step's compensation on the failure channel of the next:

```java
@Slice
public interface PlaceOrder {
    @Route("/orders")
    Promise<OrderConfirmation> place(OrderRequest request);

    static PlaceOrder placeOrder(InventoryService inventory,
                                 PaymentService payment,
                                 ShippingService shipping,
                                 NotificationService notify) {
        return request -> ValidOrder.validOrder(request)
            .async()
            .flatMap(order    -> reserve(inventory, order))
            .flatMap(reserved -> charge(payment, inventory, reserved))
            .flatMap(charged  -> arrange(shipping, payment, inventory, charged))
            .onSuccess(shipped -> confirm(notify, shipped))
            .map(OrderConfirmation::from);
    }
}
```

The request is parsed once, at the edge, into a value the rest of the pipeline never has to
re-check:

```java
record ValidOrder(OrderId orderId, CustomerId customerId, List<LineItem> items, Money total) {
    static Result<ValidOrder> validOrder(OrderRequest raw) {
        return Result.all(OrderId.orderId(raw.orderId()),
                          CustomerId.customerId(raw.customerId()),
                          LineItems.lineItems(raw.items()),
                          Money.money(raw.total()))
                     .map(ValidOrder::new);
    }
}
```

Each step carries its predecessor forward and adds what it produced, so the result of every
committed step is in hand if a later one has to undo it:

```java
record Reserved(ValidOrder order, ReservationId reservationId) {}
record Charged(Reserved reserved, ChargeId chargeId) {}
record Shipped(Charged charged, ShipmentId shipmentId) {}
```

The compensation lives on each step's failure channel. When `charge` fails, the reservation that
`reserve` made is released; when `arrange` fails, both the charge and the reservation are undone, in
reverse:

```java
static Promise<Reserved> reserve(InventoryService inventory, ValidOrder order) {
    return inventory.reserve(order.orderId(), order.items())
                    .map(id -> new Reserved(order, id));
}

static Promise<Charged> charge(PaymentService payment, InventoryService inventory, Reserved r) {
    return payment.charge(r.order().customerId(), r.order().total())
                  .map(id -> new Charged(r, id))
                  .onFailure(_ -> inventory.release(r.reservationId()).recover(_ -> Unit.unit()));
}

static Promise<Shipped> arrange(ShippingService shipping, PaymentService payment,
                                InventoryService inventory, Charged c) {
    return shipping.arrange(c.reserved().order().orderId())
                   .map(id -> new Shipped(c, id))
                   .onFailure(_ -> {
                       payment.refund(c.chargeId()).recover(_ -> Unit.unit());
                       inventory.release(c.reserved().reservationId()).recover(_ -> Unit.unit());
                   });
}
```

Compensation runs on the failure path and must not itself fail it, which is why each reversal ends
in `recover`: a refund that cannot reach the payment service should be recorded and surfaced, not
allowed to mask the failure that triggered it. The confirmation is fire-and-forget for the same
reason, a side effect that must never fail the order:

```java
static Unit confirm(NotificationService notify, Shipped shipped) {
    notify.orderPlaced(shipped.charged().reserved().order().orderId())
          .recover(_ -> Unit.unit());
    return Unit.unit();
}
```

This is a real, working saga, and for an operation that completes inside one invocation it is
enough. Its weakness is exactly the thing this module exists to fix. The compensation lives in
`onFailure` callbacks held on the call stack of one slice invocation, on one node. If that node dies
after `charge` commits and before `arrange` runs, no stack frame is left to run the refund. The
charge happened in the payment service; nothing in the surviving cluster remembers that it must be
undone. The saga's memory is the process's memory, and the process is mortal.

To survive a crash, the saga's progress has to live somewhere durable, owned by something that wakes
up after the crash and finishes the job. That something is the durable entity.

## A durable single writer

The progress of an in-flight operation is state: which steps committed, what they returned, whether
the saga is moving forward or unwinding. For that state to survive the loss of the process holding
it, it must be durable. For it to stay correct while updates and failovers race, it must have
exactly one writer at a time. A keyed, durable object with a single fenced writer is a durable
entity, and it is the one primitive the rest of this module is built on.

```java
public interface DurableEntity<K, S, C extends Mutator<S>> {
    Promise<S>          create(K key, S initial);
    Promise<Option<S>>  get(K key);
    Promise<Option<S>>  get(K key, ReadConsistency consistency);
    Promise<S>          update(K key, C mutator);
    Promise<TimerToken> scheduleTimer(K key, Duration delay, C onFire);
    Promise<Unit>       cancelTimer(K key, TimerToken token);
    Promise<Unit>       delete(K key);

    record TimerToken(String value) {}
}
```

An entity is `(key, state, owner)`. The runtime hashes the key to a partition, and the partition
has exactly one owner across the cluster. Every write goes through that owner as
`update(key, mutator)`. The owner applies mutators for the same key one at a time, so same-key
updates never race, while different keys run in parallel on different owners. The state itself is
an ordinary immutable value, a record or a sealed interface.

The third type parameter is the shape of those writes. A mutation is not a lambda. It is a value
of your own command type `C`: a sealed interface extending `Mutator<S>`, whose variants are
records, each implementing the single method `S apply(S state)`:

```java
public sealed interface OrderCommand extends Mutator<OrderState> {
    record Cancel(String reason) implements OrderCommand {
        @Override
        public OrderState apply(OrderState state) { return state.withStatus(CANCELLED); }
    }

    record MarkPaid(ChargeId charge) implements OrderCommand {
        @Override
        public OrderState apply(OrderState state) { return state.paid(charge); }
    }
}
```

The reason is the knowledge-as-values discipline the whole book runs on, applied to state
transitions. A lambda has no name: it cannot be serialized, so it cannot follow a write to the
key's owner on another node, cannot be stored in the entity's log, and cannot be re-applied
during recovery. A record can. Its name identifies the transition, its components are the
arguments, and the slice's codec for it is generated because `C` is a type argument of the
injected resource — the code is already on every node in the slice JAR, so only the data naming
which transition to run has to travel. The sealed hierarchy is what holds the door shut: a
lambda cannot implement a sealed interface, so a transition that could not survive a hop or a
restart does not compile. Commands must stay pure, no IO and no reading anything beyond the
state and their own components, because the owner may re-apply one during recovery, and only a
pure transition lands the same way twice.

The single writer is a guarantee, not a convention, because the write is fenced. Each owner holds an
epoch, every write carries it, and a write tagged with a stale epoch is rejected by every replica
identically. When ownership moves during a failover, the deposed owner's last in-flight write cannot
commit, so two nodes that briefly both believe they own the key cannot both write. That fence is the
correctness core, and it is live at the entity log's own append gate: a write from a deposed owner
is refused identically wherever it lands.

Writes route themselves. A `create`, `update`, or `delete` arriving at a node that does not own
the key is forwarded to the committed owner rather than refused, and the owner re-runs its
admission under the fence, so forwarding weakens nothing. A failure crosses back typed: the
caller pattern-matches `EntityAlreadyExists` or `EntityNotFound` the same way whether the write
ran locally or three nodes away. Timer operations are the exception; they do not forward, and a
non-owner answers them with `NotCurrentOwner`.

Provisioning follows the same four moves as every resource in Part 0: a qualifier annotation, a
config section, a manifest entry, an injected parameter. Entities come in keyspaces, one per
family of keys — `entities.orders`, `entities.payments` — so you declare one qualifier per
keyspace, each naming its own section:

```java
@ResourceQualifier(type = DurableEntity.class, config = "entities.orders")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface OrderEntity {}
```

```toml
[entities.orders]
keyspace           = "orders"
partition_count    = 8     # fence granularity: each partition has one fenced owner
replication_factor = 3     # copies of each partition's log, including the owner
```

All three keys are required and validated when the slice loads, so a rejected value fails loading
with a named cause rather than surfacing at first write. `replication_factor` is where durability
is bought, and the write barrier is derived from it: at `3`, a write acknowledges only once the
owner and at least one peer hold the record, which is what makes state survive the owner's death
rather than merely its restart. At `1` the entity is still durable across a restart of its own
node, but the disk it sits on is the only copy; that weaker guarantee is legal and has to be
chosen on purpose.

```java
@Route("/orders/{id}/cancel")
public Promise<OrderState> cancel(
        String id,
        @OrderEntity DurableEntity<String, OrderState, OrderCommand> orders) {

    return orders.update(id, new OrderCommand.Cancel("customer request"));
}
```

The entity durably stores state transitions, not your control flow. On recovery an owner or a
replica rebuilds the state by re-applying committed commands from the entity's own log, from the
last checkpoint forward — which is exactly why a command must be pure, and why it must be a
value. The discipline stops at the command boundary. Replay-based durable execution engines such
as Temporal re-execute the whole workflow function to rebuild its state, and so require all of
that code to be deterministic; the durable entity confines replay to `apply`, and the slice code
around it, IO and all, stays ordinary Java that never reruns.

Operations fail in a typed channel, like every Aether resource:

```java
public sealed interface EntityError extends Cause {
    String key();   // every variant names the offending key

    record EntityAlreadyExists(String key) implements EntityError {}
    record EntityNotFound(String key) implements EntityError {}
    record TimerNotFound(String key, DurableEntity.TimerToken token) implements EntityError {}
    record TimerNotSupported(String key) implements EntityError {}
    record TimerFireFailed(String key, DurableEntity.TimerToken token, Cause cause) implements EntityError {}
    record StaleOwnerEpoch(String key, String presentedEpoch) implements EntityError {}
    record StorageFailed(String key, Cause cause) implements EntityError {}
    record NotCurrentOwner(String key, String committedOwner) implements EntityError {}
    record OwnershipNotYetCommitted(String key, String keyspace, int partition) implements EntityError {}
    record StaleEpochRead(String key, String presentedEpoch, String highWaterEpoch) implements EntityError {}
    record LinearizableUnavailable(String key) implements EntityError {}
}
```

`StaleOwnerEpoch` is the one to recognize: it is the fence speaking, and it is transient. It means a
handover was in flight, the runtime retries against the new owner, and the author rarely sees it.

> _Not yet available: there is no terminal-state predicate on the entity, and so no typed failure
> for operating on a finished entity or for collecting one that is not finished. Earlier drafts of
> this listing carried `EntityTerminated` and `EntityNotTerminal`; neither is implemented, and
> neither is shown above because a sealed interface's variants are exhaustive — a `switch` over
> `EntityError` must match the eleven above and nothing else._

Reads carry their consistency in the call. Plain `get(key)` is a bounded-stale read: a node that
holds the partition, owner or replica, answers from its local copy after folding its view forward
to the log's committed head, and a node that holds nothing forwards the read to the committed
owner. The answer can trail an in-flight write by a bounded window; it never invents state. When
trailing is not acceptable — a check immediately before an irreversible action, a read that must
see a write another node just acknowledged — ask for it: `get(key, ReadConsistency.LINEARIZABLE)`
routes to the committed owner, orders a no-op consensus round, re-checks the owner's epoch after
the round, and only then serves, so the read reflects every write acknowledged before it began.
The price is a consensus round per read. Default to the bounded-stale form and escalate per call,
so the code shows exactly which reads paid for certainty.

Timers need one honest sentence more than the interface suggests. `scheduleTimer` and
`cancelTimer` work against the entity's log — a pending timer is a durable record, scheduled at
an absolute instant, surviving handover and restart like any other state — but the driver that
fires due timers is not yet wired into a deployed node, so today a scheduled timer is remembered
and never fires (pragmatica #351). Design with them where the design wants them; do not stake a
production behavior on a fire until the driver lands.

One observation pays off immediately. A fenced single writer per key is a lease. If a slice needs a
distributed lock, a leader for some resource, or a guarantee that only one worker touches an account
at a time, it models that resource as an entity and lets the fence be the lock. There is no separate
locking primitive to learn, because single-writer-per-key already is one.

A word on what durable means in a running cluster, stated per property with the mechanism that
earns it, because the rest of the module leans on it. A write acknowledges only after the
entity's log holds it fsynced on the owner and, at `replication_factor` of two or more, on at
least one peer — so an acknowledged write survives the owner's death, and the crash gate
exercises exactly that: an owner killed mid-traffic, every acknowledged write still present with
its exact value after the cluster heals. A log whose fsync fails stops accepting writes rather
than acknowledging what the disk did not take: fail-stop, visible to the operator, instead of
silent loss. Two bounds keep the claim honest. The proven envelope is the loss and replacement of
an owner in a live cluster; a full-cluster cold restart rides the storage work still in flight
(#349). And the timer half of the surface is recorded but inert, as the timers note above says.
Read the two chapters that follow differently: they are facades not yet built, designed against
the verified entity underneath them.

## When the process is a state machine

Many multi-step operations are not arbitrary code. They are state machines. An order is Pending,
then Confirmed, then Shipped, or it is Cancelled from either of the first two states; the transitions
that are legal are a small fixed set, and the ones that are not should be impossible. When an
operation has that shape, modelling it as an entity whose update applies a state-machine transition
gives you a workflow, and the runtime enforces the legal transitions for you.

```java
public interface PersistentWorkflow<S, E> {
    Promise<S>          start(String id, S initial);
    Promise<S>          dispatch(String id, E event);
    Promise<Option<S>>  current(String id);
    Promise<TimerToken> scheduleTimer(String id, Duration delay, E event);
    Promise<Unit>       cancelTimer(String id, TimerToken token);
    Promise<Unit>       delete(String id);
}
```

The states and events are sealed types, one case per node and one per trigger:

```java
public sealed interface OrderState permits Pending, Confirmed, Shipped, Cancelled {}
public record Pending()   implements OrderState {}
public record Confirmed() implements OrderState {}
public record Shipped()   implements OrderState {}
public record Cancelled() implements OrderState {}

public sealed interface OrderEvent permits Confirm, Ship, Cancel {}
public record Confirm() implements OrderEvent {}
public record Ship()    implements OrderEvent {}
public record Cancel()  implements OrderEvent {}
```

The machine itself is declared once, with the legal transitions and the final states named
explicitly:

```java
Result<StateMachineDefinition<OrderState, OrderEvent, Unit>> ORDER_FSM =
    StateMachineDefinition.<OrderState, OrderEvent, Unit>builder("order-process")
        .initialState(new Pending())
        .transition(new Pending(),   new Confirm(), new Confirmed())
        .transition(new Pending(),   new Cancel(),  new Cancelled())
        .transition(new Confirmed(), new Ship(),    new Shipped())
        .transition(new Confirmed(), new Cancel(),  new Cancelled())
        .finalState(new Shipped())
        .finalState(new Cancelled())
        .build();
```

A slice drives it by dispatching events:

```java
@Route("/orders/{id}/confirm")
public Promise<OrderState> confirm(
        String id,
        @OrdersWorkflow PersistentWorkflow<OrderState, OrderEvent> workflow) {

    return workflow.dispatch(id, new Confirm());
}
```

`dispatch` validates the event against the machine before it writes anything. Dispatching `Ship` to
a `Pending` order does not half-apply and then roll back; it is rejected with `InvalidEvent`,
carrying the event and the current state, and no write happens. That pre-write validation is the
reason a workflow is a facade over the bare entity rather than a raw `update` with a state-machine
mutator: a rejected transition is a domain error you can pattern-match, not a generic failed write,
and the facade is the natural home for final-state detection and timer cleanup.

```java
public sealed interface WorkflowCause extends Cause {
    record WorkflowNotFound(String id)                            implements WorkflowCause {}
    record WorkflowAlreadyExists(String id)                       implements WorkflowCause {}
    record InvalidEvent(String id, Object event, Object currentState)  implements WorkflowCause {}
    record WorkflowTerminated(String id, Object finalState)       implements WorkflowCause {}
    record StaleOwnerEpoch(String id)                             implements WorkflowCause {}
}
```

Timers make the machine react to the passage of time. An order that sits Pending too long should
cancel itself. Schedule the event when the order is created, and cancel it if the order is confirmed
first:

```java
workflow.scheduleTimer(id, Duration.ofMinutes(30), new Cancel());
```

The timer is durable and survives handover: if the owning node is replaced while the order waits,
the new owner rebuilds the pending timer and still fires the `Cancel` at the right moment. When
`Confirm` arrives first, cancelling the timer is one call, and reaching a final state cancels any
remaining timers automatically.

> _Open decision (S4): the workflow is `PersistentWorkflow<S, E>`, with the state-machine's context
> type held at `Unit` and hidden. Because the state is the single source of truth, anything an entry
> or exit action needs belongs in the state record, which keeps the taught signature to two type
> parameters. Exposing a third `C` parameter would earn its keep only if actions must read request
> context that cannot live in the state. Recommended: keep it hidden; Sergiy to confirm._

## Sagas the runtime remembers

The manual saga that opened this module had the right shape and the wrong memory. Its steps and
compensations were correct; its ledger lived on the stack and died with the process. The durable
saga keeps the same shape and moves the ledger into an entity, so the runtime remembers where a saga
got to and can finish it or unwind it after a crash.

A saga is a `DurableEntity<String, SagaState<C>>` whose state is a step ledger over a shared context.
The author declares the steps; each is a forward action, the compensation that undoes it, and a
re-run policy, all reading the immutable context `C`:

```java
public enum RerunPolicy { RUN_ONCE, IDEMPOTENT }

public record SagaStep<C, R>(
    String                     name,
    Fn1<Promise<R>, C>         forward,
    Fn2<Promise<Unit>, C, R>   compensation,
    RerunPolicy                rerun) {

    public static <C, R> SagaStep<C, R> step(
            String name,
            Fn1<Promise<R>, C> forward,
            Fn2<Promise<Unit>, C, R> compensation,
            RerunPolicy rerun) {
        return new SagaStep<>(name, forward, compensation, rerun);
    }
}
```

Forward and compensation speak the same `Promise` the manual baseline used. A step's forward returns
`Promise<R>`, and a failure on its error channel, whether a technical fault or a business outcome
that must abort the order, is what the runtime compensates on. The `RerunPolicy` is a required
argument, not a default: every step states whether running its forward action again on recovery is
harmless (`IDEMPOTENT`) or must never happen twice (`RUN_ONCE`). A step that cannot be constructed
without that claim cannot silently leave a non-idempotent effect exposed to a crash. The order saga
is the manual baseline restated as a declaration, each step now carrying its policy:

```java
SagaDefinition<OrderContext> ORDER_SAGA =
    SagaDefinition.<OrderContext>builder("order-saga")
        .step(SagaStep.<OrderContext, ReservationId>step(
            "reserve-inventory",
            ctx -> inventory.reserve(ctx.orderId(), ctx.items()),
            (ctx, reservationId) -> inventory.release(reservationId),
            IDEMPOTENT))     // reservation is keyed by order id; a repeat is a no-op
        .step(SagaStep.<OrderContext, ChargeId>step(
            "charge-payment",
            ctx -> payment.charge(ctx.customerId(), ctx.total()),
            (ctx, chargeId) -> payment.refund(chargeId),
            RUN_ONCE))       // a second charge moves real money
        .step(SagaStep.<OrderContext, ShipmentId>step(
            "arrange-shipping",
            ctx -> shipping.arrange(ctx.orderId()),
            (ctx, shipmentId) -> shipping.cancel(shipmentId),
            RUN_ONCE))       // a second call books a second shipment
        .build();
```

A slice runs it by name over a context built from the validated request:

```java
@Route("/orders/{orderId}/place")
public Promise<SagaResult<OrderContext>> place(
        String orderId, OrderRequest req, @OrderSaga Saga<OrderContext> saga) {

    return ValidOrder.validOrder(req).async()
        .flatMap(order -> saga.run(orderId, OrderContext.from(order)));
}
```

`run` drives the saga forward, recording each step's completion in the durable ledger under the
fence, and returns a sealed result the caller pattern-matches:

```java
public sealed interface SagaResult<C> permits Succeeded, Compensated, PartiallyCompensated, Failed {
    record Succeeded<C>(C context, List<StepRecord> steps)               implements SagaResult<C> {}
    record Compensated<C>(C context, List<StepRecord> steps)             implements SagaResult<C> {}
    record PartiallyCompensated<C>(C context, List<StepRecord> steps,
                                   List<CompensationFailure> failures)    implements SagaResult<C> {}
    record Failed<C>(C context, Cause reason)                            implements SagaResult<C> {}
}
```

Those four outcomes are the whole reliability story of the operation, made explicit. `Succeeded`
means every step committed. `Compensated` means a step failed and every compensation ran, leaving
the world as if the order had never been placed. The other two are where the honesty lives.

Compensation is best-effort reverse. The runtime runs the compensations from the last committed step
down to the first, and a compensation that fails does not stop the rest. A saga that finishes
compensating with one or more failed compensations lands in `PartiallyCompensated`, a named terminal
state, not a silent one. That choice is deliberate. Guaranteed compensation would mean retrying a
compensation forever, which hides a permanently broken downstream behind a loop and gives no one a
signal to act on. A named partial state is queryable: an operator can see it, a monitoring slice can
retry it, the author can attach domain-specific recovery. This is how production saga systems
behave; Temporal and Restate document the same best-effort reverse with explicit partial outcomes.
The `status(id)` read returns the live `SagaState<C>`, whose six cases (`Running`, `Compensating`,
`Completed`, `Compensated`, `PartiallyCompensated`, `Failed`) are what a monitor watches.

That leaves the sharpest failure in a distributed saga: the crash between an effect and the record of
it. The payment service charges the card; the process dies before the ledger commits; on recovery,
nobody knows whether the charge happened. Re-running the step double-charges; skipping it ships an
unpaid order. This is what `RUN_ONCE` controls. Before it invokes a `RUN_ONCE` step's forward action,
the runtime writes a `StepAttempt(sagaId, stepIndex)` marker under the fence; if the process crashes
before the ledger commits, recovery finds the marker and does not invoke that forward action a second
time, treating the step as taken. The runtime never calls a `RUN_ONCE` forward twice. An `IDEMPOTENT`
step carries no marker: the author has declared that running it again is harmless, so recovery simply
re-runs it. The key `(sagaId, stepIndex)` is the idempotency anchor, and it is one instance of a
general rule: every entity update carries a stable monotonic counter `(key, n)` that a slice can hand
to a downstream service as an idempotency key, so a retried effect is recognized rather than repeated.

This also settles a debt left open in Module A. A single operation that must commit to its own store
and reliably emit an event to another faces the dual-write problem: two writes, no shared
transaction. The classic answer is a transactional outbox, staging the second write inside the first
store's transaction and delivering it later by a separate process. Aether reaches the same guarantee
more directly. The per-entity `(key, n)` counter and a `RUN_ONCE` step let a retried effect land once
instead of repeating, with no outbox table to maintain and no delivery worker to operate. The
reliable emission Module A pointed forward to is this.

## Entity, workflow, or saga?

The three are one primitive and two facades over it. Choose by the shape of the operation, not by
reaching for the most powerful one.

- Reach for a bare **entity** when you have durable per-key state with custom mutations and no fixed
  lifecycle: a running counter, a seat map, a rate budget, a lease or a lock. The fenced single
  writer is the whole point, and you write the mutators.
- Reach for a **workflow** when the operation is a state machine: a fixed set of states, a small set
  of legal transitions, driven by events, often with a timer or two. The machine validates every
  transition and rejects the illegal ones before they write.
- Reach for a **saga** when the operation is a sequence of steps across services that must be undone
  in reverse when a later step fails. Compensation and the run-once step are the point, and the
  ledger survives the process.

Two patterns from earlier in the book sit just outside this choice. When steps are independent rather
than sequential, run them with `Promise.all` and decide a partial-failure policy at the join, the
scatter-gather you first met in the order pipeline; a single saga step can itself fan out that way.
And the distributed lock is not a fourth primitive: it is an entity with one writer per key, as the
previous chapter noted.

For watching these in production, version one gives you `status(id)` to read a saga's or a workflow's
current state, and an opt-in audit stream that records every transition and step, which together
cover monitoring and operator recovery.

> _Status (S1, resolved 2026-07-04): external signal injection into a running workflow is part of the
> version-one design (spec §6.6), a `POST /api/workflows/{type}/{id}/signal` endpoint with a matching
> CLI command, not deferred. Saga signals wait on a `WAIT_SIGNAL` step kind and are version two. Like
> the rest of the durable-workflow surface, none of this is deployable yet; it is pinned design, not
> shipped behavior._

> _Open decision (S2, design-level): terminal-state retention — how long a finished entity,
> workflow, or saga is kept before collection, with 7d/30d/90d as the taught starting points — is
> part of the facade design, not a shipped configuration key; there is no `terminal-ttl` in the
> entity's section today. Final out-of-the-box values pending Sergiy._

A closing note on what is real today, because this module asks the reader to hold two registers
at once. The manual saga runs now: plain JBCT over resources you already have. The entity is real
too — injectable in a deployed slice, its writes fenced, replicated, and fsynced before they
acknowledge, its reads served replica-aware, with its timers durably recorded but not yet fired
(#351). The workflow and the saga above it are the module's intended design: pinned against those
verified primitives, with no runtime code behind them yet. Write the manual baseline when you
need compensation now, reach for the entity directly when you need durable per-key state now, and
verify the workflow and saga surfaces against the runtime before you stake an order on them.

Reliability keeps one operation correct across steps and crashes. The next module turns from
correctness to speed: keeping the whole system responsive under load, with caching, batching, and
backpressure.

# Module E — Performance and scale

> _Status: scaffold. Caching + invalidation, batching/coalescing, rate-limit/backpressure._

# Module F — Architecture in the large

> _Status: scaffold. Event sourcing + read models (CQRS), multi-tenancy, audit-as-data,
> versioned-message evolution._
