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
static Ordering ordering(OrderPersistence orders) {
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
succeeded. That gate is on by default; a blueprint can set `schema_required = false` under `[deployment]` to
opt out. So a deploy is migrate-then-serve: the orders table is at the version the code expects
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

Resolution is strict by name: `schema/analytics/` is migrated against `[database.analytics]`,
never against a guess. A datasource that a slice uses but that has no migrations fails the
blueprint build (unless the schema is declared external), and a slice whose config section is
missing is refused at deploy.

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
never mix. A datasource is migrated by one blueprint only: a second blueprint that migrates the
same datasource is refused at publish. Resolution is strict: a migration directory whose section is not configured cannot be
migrated, so the slice is held rather than run against the wrong place. The migrate-then-serve gate from chapter 3
covers every datasource, so the slice does not begin serving until both schemas are at the
version the code expects.

Wiring both into the order slice is two parameters where there was one:

```java
static Ordering ordering(OrderPersistence orders, OrderAnalytics analytics) {
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
static Ordering ordering(OrderPersistence orders, @OrderEvents Publisher<OrderPlaced> events) {
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
topic_name = "order-events"
```

`topic_name` is the only field this ephemeral declaration needs, the default tier, so the
zero-config path stays cheap. A bare name like `order-events` is scoped to the application at
deploy; a fully qualified `namespace:topic:version` is taken as written. The same section can
instead declare the topic durable, trading the zero-config default for a stronger guarantee; that
variant is its own subsection later in this module, once streams have introduced the substrate it
is built on. In the manifest the publisher and subscriber appear as data the runtime reads before
loading a class, the publisher as a `publish.topic` entry and the subscriber among the reactive
bindings:

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
waits on those subscribers, a caller that chains work onto it, as `ordering` does above with
`events.publish(placed).map(() -> placed)`, pays the subscribers' latency in its own response time,
so keep subscriber work short or move the slow part to a stream. That the publisher waits on present
subscribers, and that a missing one is simply missed, is a property of the ephemeral tier, the
default, not a fixed contract of pub-sub itself; declaring the same topic durable decouples the
two, covered once streams are in hand. Delivery here is at-most-once: a subscriber that is absent
misses the event, and there is no log
to catch up from. One consequence is friendly: publishing to a topic with no subscribers is a
success, so a quiet system does not fail `placeOrder` for lack of listeners. The other is the
constraint that decides when to use it. Ephemeral pub-sub fits when missing a message is
acceptable, a dashboard that refreshes a moment later, a cache that warms on the next read. When a
message must not be lost, reach for a stream, covered next, or declare the topic itself durable,
covered right after it once the mechanism a durable topic is built on has been introduced.

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
static Ordering ordering(OrderPersistence orders, @OrderEventStream StreamPublisher<OrderEvent> stream) {
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
per group and per partition and, on an owner with a writable data dir, survives a restart. To scan or replay from a chosen position, read one partition at a time with `fetch(partition, fromOffset, max)`; the reads are covered in full below, under reading the log yourself. Each consumer group
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
retention_value = "30d"   # tuning
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

`max_event_size` caps a single event, one MiB by default. The retention keys, `retention`, `retention_value`, `retention_mode` and the `max_*` bounds, decide how long the log keeps what it holds; they have their own section below, because what they bound depends on where an event lives. Keys are snake_case, and a key the runtime does not know, a dashed spelling included, is refused when the section is read rather than ignored. Treat the tuning keys as the part of streaming most likely to grow or change as the runtime evolves; the shape this chapter relies on, a durable ordered log read by committed offset, is the stable part. Verify the current keys against the resource reference when you configure a stream.

### What "durable" depends on

Calling the log durable has glossed one dimension the configuration controls: how many nodes hold
each partition. Two keys set it, both structural:

```toml
[streams.order-events]
partitions = 4                # ordering and parallelism unit
replication_factor = 3        # copies of each partition, including the owner
confirmation_factor = 2       # a write resolves only once this many copies, including the owner, hold it
retention = "time"
retention_value = "30d"
```

`replication_factor` is the number of copies of each partition, counting the owner;
`confirmation_factor` is how many of those copies, again counting the owner, must hold a write before
the publishing `Promise` resolves. Left unset, the stream takes the cluster's replication defaults,
`replication_factor = 3` and `confirmation_factor = 2` unless the cluster configuration says otherwise.
Declaring `replication_factor = 1` is allowed but warned: the log then lives on a single owner, and a
write resolves the moment that one node has it on disk. That is durable in a narrow sense, crash-safe
through a per-partition write-ahead log, so a node that dies and restarts recovers its log, but not safe
against losing the node's disk and not safe against losing the owner. With one copy, lose that node and
its single copy goes with it: a consumer reads empty until the node returns. For a stream whose whole
point is that no event is lost, one disk is not enough.

One failure sits earlier than any of this: the node's WAL directory itself. A node that finds it
cannot write there refuses to start, rather than come up and stream non-durably behind a single
warning buried in the log — the same fail-stop-at-boot idiom the cluster-name and TLS checks use
(`#634` item 2, `AetherNode.verifyWalBootable`/`decideWalAvailability`, wired
through `Main`'s boot sequence). A deployment that genuinely wants best-effort streaming over no
streaming at all opts in explicitly with `-Daether.allowNonDurableStreams=true` (or
`AETHER_ALLOW_NON_DURABLE_STREAMS=true`); a node constructed directly rather than through `Main` —
Forge, a test, an embedded runtime — bypasses this check and keeps the old warn-and-degrade
behavior, since it is not the deployment the guard protects.

Durability across the loss of a node is what `confirmation_factor` buys. Set it to `2` or more and
every write waits for at least one copy beyond the owner, so a caught-up replica always exists —
and that copy is fsynced on the replica before its ack counts, the same bar the owner clears, so a
power loss on owner and replica together inside an unsynced window cannot silently erase a write
the caller was told reached the configured confirmation factor (`#634` item 1,
`ReplicationReceiveHandler`: the replica acks only after the batch is fsynced there, and a failed
sync withholds the ack). Then losing the owner is survivable for reads:
after the owner is killed, a reader still gets the complete
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

### The durable pub-sub tier

Pub-sub and streams are not the only two points on this axis. The same topic can be declared
durable, keeping the pub-sub shape, publish a value, receive a value, no offsets for the slice to
manage, while buying most of a stream's delivery guarantee. The one-argument subscriber method
from the previous section is unaffected; declaring a topic durable does not require touching the
Java at all. Only the configuration section grows:

```toml
[messaging.order-events]
topic_name = "order-events"
durability = "durable"        # "ephemeral" (default) | "durable"
partitions = 1                 # durable only; default 1
replication_factor = 3         # durable only; default: the cluster's [replication] default (3)
confirmation_factor = 2        # durable only; default: min(cluster default (2), replication_factor)
retention = "7d"               # durable only; default 7d
```

`durability` is the switch. The four knobs below it exist only for a durable declaration; declare
them on an ephemeral topic and the build rejects the section rather than silently ignoring the
keys, the same config-honesty stance a stream's own knobs take. A durable topic is backed
internally by a replicated stream plus its own dead-letter stream, both provisioned the moment
the topic is provisioned, not lazily on first publish, and a publish resolves once the write
reaches the replication floor below, not merely once it lands on the owner.

The defaults, `replication_factor = 3` with `confirmation_factor = 2`, are the stream
configuration the previous section describes as surviving an owner kill with every prior event
intact. The build refuses a `confirmation_factor` above `replication_factor` or a factor below 1, and
warns on a declared `replication_factor` below 3, on a `confirmation_factor` equal to
`replication_factor`, and on `confirmation_factor = 1`, rather than silently accepting a weaker
guarantee than the one advertised.

What the tier buys, and no more:

- **Delivery to a subscriber group.** Ephemeral is at-most-once: a single invoke to a
  round-robin instance, dropped on RPC failure, crash, or absence, never retried, never
  persisted. Durable is **at-least-once per group**: a group cursor plus bounded redelivery,
  five attempts with exponential backoff, then the group-attributed dead-letter queue.
- **Subscriber failure.** Ephemeral failure is invisible to the runtime, logged, no redelivery.
  Durable retries and then lands the event in `topic:<address>.dlq` as a group-attributed
  envelope carrying the original message id, source position, failing group, attempt count, and
  last cause. The source cursor does not advance past an event whose DLQ append has not itself
  succeeded, so a stalled dead-letter sink stalls the partition visibly instead of silently
  dropping the event.
- **Duplicate exposure.** None for ephemeral, zero or one delivery. Durable can redeliver up to
  the cursor-checkpoint window on crash or restart, at most 1000 acknowledged events or 500ms
  per partition, whichever comes first; both figures are fixed constants today, not per-topic
  configuration.
- **Consumer-group identity.** Version-stable (`groupId:artifactId#method`), so a blue-green
  deploy window collapses to one dispatch loop per group and partition instead of doubling
  delivery across the two versions in flight.

A durable subscriber may opt into a second parameter, `Promise<Unit> handler(T event,
MessageContext context)`. `context.messageId()` is the field worth keying on, a publisher-minted
id stable across a retry and across a dead-letter hop; `context.partition()` and
`context.offset()` describe only where this particular delivery landed and change on redelivery,
so using either to de-duplicate reintroduces the duplicates the id exists to catch. The build
rejects the two-argument shape on a topic that is not durable, there being no envelope to build a
context from.

A redelivered message carries the same `messageId` as the original; the handler is what dedupes
on it, not the runtime. The strongest claim the runtime makes is at-least-once with
de-duplication left to the handler, the same discipline Module D asks of any at-least-once path.

**What is still open.** The guarantee above is verified single-node: publish and dispatch proven
end to end on one node, and subscriber registration is crash-durable regardless of tier, a
Rabia-replicated write, so the topology survives a restart even though an ephemeral topic's
in-flight messages do not. The multi-node composed path, a publish landing on one node and
dispatch owned by another, including a failover between them, is **design intent, unverified
pending forge e2e**. There is also no operator surface yet for the durable tier: no DLQ
inspection or redrive route, no lag or stall alarm, no per-topic retention override on the
dead-letter stream. A dead-lettered event is real, durable data today, readable only by reading
the `.dlq` stream directly, awaiting the management surface that turns redriving it into a
command instead of a stream read.

A related but distinct surface: `@Notify` for email or HTTP is at-least-once with retries and may
duplicate, but it is not pub-sub and carries no DLQ; the guarantees above do not extend to it.

### Who reads which partition

The order ledger and the order-history read model both subscribe to `streams.order-events`, and each slice runs on three nodes. Two questions decide whether either of them works. Do the ledger and the read model split the events between them, or does each see all of them? And of the ledger's three instances, which one reads partition 2? A ledger that receives half the orders is not a ledger, and a team that adds instances to make it faster wants to know whether the instances will get any work.

Each subscriber method is its own consumer group. The group's name is the slice artifact without its version, followed by the method name, so the ledger's `record` method reads as the group `com.example:order-ledger-record`. Groups are independent: the ledger and the read model each read every event of the stream, at their own pace. Within one group, each partition has exactly one node assigned to deliver it. Leaving the version out of the name is deliberate. A new version of the ledger deployed beside the old one joins the same group, so a rolling upgrade continues the group instead of starting a second reader beside it. The same rule cuts the other way: renaming the method, or moving it to another artifact, makes a new group with no committed position of its own. Treat a stream subscriber's method name as part of its contract. Where a new group starts reading is a cursor question, covered with cursors.

The assignment is a committed record, one per stream, group and partition, written only by the cluster leader. The leader computes the assignee with two rules. If the node that owns the partition runs the slice, the owner delivers it, reading its own copy. Otherwise the assignee is chosen among the nodes where the slice is active and live, by the same rendezvous hash that places partitions, so every node computes the same answer; that node reads the partition through its owner. A node attaches a partition only when the committed record names it. Each node runs a reconcile pass every five seconds, and the leader's pass writes a new record only where the computed assignee differs from the committed one. Each write carries an epoch, and a write from a deposed leader is refused when it is applied.

Follow those rules to a consequence that is easy to miss. A group's parallelism is capped by the stream's partition count, and the assignment follows where the data lives, not how many instances the slice has. With four partitions, at most four nodes deliver for the ledger, whatever its instance count; if one node owns two partitions and runs the slice, it delivers both while another instance sits idle for this group. Consumption scales with partitions, which the partition note above asks you to choose deliberately, not with replicas.

There is no join protocol for a slice to run. A rebalance is the leader rewriting a record because the computed assignee moved: a node left the live set, the slice became active or stopped on a node, or a partition's ownership moved. Rendezvous hashing keeps that churn small, since only the partitions whose ranking involved the changed node get a new answer. When no node can run the slice at all, the leader writes nothing, the old record stands, and the partitions appear as `unassignedPartitions` in each node's `/streams/declarative-consumers` report. What a handover means for the events in flight during it is part of the delivery contract and is covered there.

Two limits apply in this release. A `[streams.order-events.consumers.<group>]` table parses, but per-group settings do not reach the runtime, so a non-default value in it is refused at deploy and every group runs on the defaults. A subscriber method may declare `List<OrderEvent>` as its parameter, and the runtime records it as a batch consumer, but it delivers one-element lists; write the handler so that is correct.

A process outside the cluster that reads a stream over the management API has a separate, explicit group mechanism: `POST /streams/groups/join`, `POST /streams/groups/leave`, and `GET /streams/groups` for status. On every join, and on every leave that leaves a member behind, the leader deals the partitions round-robin over the members, sorted by consumer id, under an epoch that refuses a stale rebalance. Its limits are sharp. Membership lives in the leader's memory, so a new leader starts with no members and rebalances only over the clients that join it. Nothing tracks member liveness, so a client that disappears without leaving keeps its partitions until a later rebalance moves them, and when the last member leaves no rebalance runs at all. A client of this mechanism should treat joining as something it repeats, not a registration it makes once.

### Reading the log yourself

Rebuilding the order-history read model from scratch, or an audit job that checks every partition, needs the active form: a `StreamAccess<OrderEvent>` requested against `streams.order-events`, read under your own control. Two reads carry the work. `metadata()` returns the stream's name, its `partitionCount` and a `PartitionInfo` per partition. `fetch(partition, fromOffset, maxEvents)` returns up to `maxEvents` events of one partition from `fromOffset`, each a `StreamEvent` carrying its `offset`, `timestamp`, `partition` and `payload`. Offsets are per partition: offset 7 in partition 0 and offset 7 in partition 3 are unrelated events.

A read of the first page of every partition, then, discovers the count and fans out one read per partition:

```java
// events : StreamAccess<OrderEvent>, injected against streams.order-events
static Promise<List<List<StreamEvent<OrderEvent>>>> firstPages(StreamAccess<OrderEvent> events) {
    return events.metadata()
                 .flatMap(meta -> Promise.allOf(IntStream.range(0, meta.partitionCount())
                                                         .mapToObj(partition -> events.fetch(partition, 0L, 500))
                                                         .toList()))
                 .flatMap(pages -> Result.allOf(pages).async());
}
```

Each inner list is one partition, in that partition's order, and that is the only order the stream has to offer across a multi-partition read. The next page of a partition starts at the last offset read plus one. Saving that position durably is what a cursor does, covered with cursors.

Two reads in the interface look more general than they are. `fetch(fromOffset, maxEvents)`, without a partition, reads the same offset from every partition, merges the results, sorts them by offset and keeps the first `maxEvents`. The offsets it sorts by mean nothing across partitions, and the cut can keep one partition's page while dropping the end of another's, so use it for a glance at a stream, never as a position to resume from. And `metadata()` describes this node's own copy. `partitionCount` is right on every node, but the head, tail and count of a partition this node does not hold read `-1`, `-1` and `0`, and on a node that does hold it they describe the hot ring, the newest part of the log. Events older than the ring's tail remain readable through the same `fetch`; the next section says where they are.

### Where an event lives

Retention says how long the log keeps an event, and the answer only makes sense once you know where the event is kept. A stream partition stores its events in three places, each with its own bound.

The first is the hot ring, an off-heap ring buffer per partition holding the newest events. Reads near the head are served from it. Its size comes from the stream's retention, as the next section shows, and when it is full it evicts its oldest events.

The second is the write-ahead log, one append log per partition on local disk. An owner's publish is gated on the event reaching that log with an fsync, and the log is not truncated above the point where events have been sealed, so every event the ring has evicted but not yet sealed is still there. The log's directory is set per node:

```toml
[storage.streams]
wal_path = "/var/lib/aether/wal"   # the node id is appended; unset, the path is derived
```

The third is sealed segments. The ring's evicted events queue for a sealer, which writes them out as one segment once the run reaches 1 MiB, 4,096 events, or five seconds of waiting, whichever comes first. Those thresholds are node settings in `[streaming]` (`seal_run_bytes`, `seal_run_events`, `seal_run_age`), and the runtime's own source marks all of them as guesses awaiting a baseline measurement; `seal_run_age` is refused above one day. Segments go to the node's `streams` storage instance, which keeps a small memory tier, a local disk tier capped at 40% of the usable space unless `[streaming] segment_disk_max_bytes` says otherwise, and a cluster-shared tier that, for streams, can only be the DHT. A read below the ring's tail is served from the sealed tier, so a consumer catching up on last week reads through the same API as one reading the last second.

The model to keep: the ring is a bounded cache of the newest events, the write-ahead log covers the gap until a seal, and the sealed tier is the history. Retention bounds both the ring and the history, by different rules.

Pub-sub has tiers too, on a different axis. A topic's `durability` selects its substrate. An ephemeral topic is a fan-out of calls to the subscribers present, and nothing is stored anywhere. A durable topic is a stream named `topic:<address>`, so its events live in the three places above; its `retention` declares an age only, seven days by default, and its dead-letter stream `topic:<address>.dlq` keeps fourteen days, fixed, with no key to change it. When a subscriber whose handler takes a `MessageContext`, which needs the durable tier, is reached by a publisher whose declaration is ephemeral, the delivery is refused without a call and raised as a `topic-tier-mismatch` operator event. Keep the tier in the one section both sides name.

### How long the log keeps an event

The finance ledger's stream must keep thirty days so an audit can replay a month. A stream of order-page views needs a few hours. Disk is finite on every node that holds a partition. Retention is how each stream states what it needs, and every bound it states applies per partition.

`retention` picks the kind of bound: `count` (the default), `time`, `size` or `compound`. The first three take their value from `retention_value`; `compound` names any of `max_count`, `max_bytes` and `max_age`, and `retention_mode` says whether the declared bounds reclaim at the first one reached (`any`, the default) or only when all are (`all`). Durations are a whole number of milliseconds or of `s`, `m`, `h` or `d`; sizes are bytes or `KB`, `MB` or `GB`, counted in powers of 1,024; counts are whole numbers. Every value is at least 1, and a malformed or overflowing value is refused with the key named.

What a declaration bounds differs by tier, and this is the rule to carry away. The ring uses all three bounds and fills any it was not given with a default of 100,000 events, 256 MiB and 24 hours; a `count` stream's ring has no byte or age bound, since the count sizes it. The sealed tier is bounded only by what the section declares:

| Section declares | Ring holds up to | Sealed history kept |
|---|---|---|
| no `retention` key | 100,000 events | 24 hours, the node default |
| `count`, N | N events | while fewer than N newer events are sealed |
| `time`, D | 100,000 events, 256 MiB or D, first reached | for D |
| `size`, S | 100,000 events, S or 24 hours, first reached | until S of newer sealed bytes |
| `compound` | the declared bounds, defaults for the rest | the declared bounds only |

So the stream configured earlier with `retention = "time"` and `retention_value = "30d"` does not keep thirty days in memory. Its ring evicts at 100,000 events or 256 MiB, those events seal, and the sealed tier keeps them for thirty days, readable through the same `fetch`. A stream with no retention key keeps a day of history, which is rarely what a ledger wants; declare it. And because a count is measured over the sealed tier, a partition with `count` N can serve up to N events from its ring on top of at least N sealed ones.

A compound declaration states several bounds at once:

```toml
[streams.order-events]
partitions = 4
retention = "compound"
max_age = "30d"
max_bytes = "8GB"
retention_mode = "any"   # reclaim at whichever declared bound is reached first
```

Reclaiming runs as a pass every five minutes. Each pass removes only the oldest whole segments of a partition, as an unbroken prefix, and judges a segment by its newest event's age and by how much is newer than it. That rule earns a precise promise: retention does not reclaim an event before its declared bound. An event can outlive its bound by up to a segment's worth of newer events and one pass interval. Under `all`, a dimension the section did not declare neither reclaims nor blocks.

Retention fails closed. A node that cannot read a stream's policy, because the committed configuration has not been applied there yet or the mode is one this build does not know, reclaims nothing of that stream, and after two such passes raises `STREAM_RETENTION_WITHHELD`. Its disk use grows until the policy is readable. Retention also does not shorten under disk pressure. At 85% of the segment disk tier the node raises `STREAM_SEGMENT_DISK_PRESSURE`; what a full tier does to publishers is backpressure, covered there. Size the declared bounds against the disk of the nodes that hold the partitions, replicas included, rather than against what the stream would like to keep.

Retention is also a bargain with consumers. A group that falls further behind than the bound has missed what was reclaimed, and no later read can return it. Pick the bound from the slowest consumer you are willing to support, and what a group reads after falling off the end is part of cursor semantics, covered there.

### Pub-sub, durable pub-sub, or stream?

All three deliver a message from one slice to others, and the same two resource types cover them,
`Publisher`/`Subscriber` for both pub-sub tiers, `StreamPublisher`/`StreamSubscriber`/
`StreamAccess` for streams. What varies is what happens to a message no one is ready for, and how
much bookkeeping buying a stronger answer costs.

- Reach for **ephemeral pub-sub** when the message is a live signal and missing one is
  acceptable: refreshing a dashboard, warming or invalidating a cache, an in-app nudge, fanning
  out to whoever happens to be listening. It is the loosest coupling and the cheapest,
  at-most-once, with no bookkeeping and no configuration beyond a topic name.
- Reach for a **durable topic** when the shape you want is still pub-sub, publish a value,
  receive a value, no offsets to manage by hand, but a subscriber that is temporarily down must
  still get the event once it returns. It costs a handful of configuration keys and buys
  at-least-once per group with a dead-letter queue for what a handler cannot process, at the
  price documented above: bounded duplicate exposure, and a multi-node failover path still
  unverified.
- Reach for a **stream** when every message counts, order matters, or a late or replayed
  consumer must reprocess history it missed entirely: audit ledgers, event-sourced read models.
  It is durable, ordered, and at-least-once, at the cost of managing offsets, or letting the
  declarative consumer do it, and writing idempotent handlers.

The stream has a deeper use, foreshadowed by Module A's dual-write. When `placeOrder` must both
commit the order and record an event reliably, the event written to a durable stream is the safe
record, and the rest of the system is built by reading that stream. Making that second write
reliable when neither the commit nor the emit may be lost is the dual-write problem, and Module D
solves it with an idempotency key rather than a separate outbox to operate. The
model to carry forward is unchanged from Part I: a parameter to send, an annotated method to
receive, and the runtime reading the manifest to wire both. Messaging added two resource types —
a durable declaration on the first is configuration, not a third — and reused the model intact.
The next module collects the smaller resources a slice reaches for, HTTP, notifications,
scheduled work, and the interceptors that wrap them.

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

[notification.smtp_config]
host = "smtp.example.com"
port = 587
tls_mode = "STARTTLS"

[notification.smtp_config.auth]
username = "orders@shop.example"
password = "${secrets:smtp/password}"
```

`backend = "smtp"` sends through an SMTP server; `backend = "http"` with a
`[notification.http_config]` section (`provider_hint`, `api_key`) sends through a provider API
instead; SendGrid, Mailgun, Postmark and Resend have a mapping today. The slice builds the same
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

> _Partly wired (source at rc5, `d113279af`): the `PgNotificationSubscriber` resource, the
> `PgNotification` payload and the callback machinery exist, and the processor now recognizes the
> method-level listener annotation and writes the `pg-notification` manifest binding shown below.
> No code that invokes the slice method for that binding was found in the deployment, invoke, slice
> or node modules at this SHA, so the runtime half is not confirmed. Written to the intended shape;
> verify against source before GA._

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
reactive.0.category=pg-notification
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

> _Confirmed from source at rc5 (`d113279af`). Interceptors are woven into the generated factory at
> compile time as nested `intercept(...)` calls, and their order is deterministic: the first
> annotation on a method is the outermost wrapper. Pragmatica #277 removed the older runtime-applied
> `Aspect` seam, so the interceptor chain is not reconfigured per deployment without a rebuild; what
> a deployment tunes is each interceptor's config section, not the chain. Seven `MethodInterceptor`
> types ship. The config keys shown were checked against the config records at rc5; verify them against the resource reference before GA._

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
public interface Ordering {
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
retry_on = "TRANSIENT"    # or NON_TERMINAL

[retry.payment.backoff_strategy]
type = "fixed"
interval = "200ms"

[circuit-breaker.payment]
failure_threshold = 5
reset_timeout = "30s"
test_attempts = 3

[logging.orders]
name = "orders"
level = "INFO"
log_args = false
log_result = false
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
cache_name = "quotes"
ttl_seconds = 60
max_entries = 10000
mode = "LOCAL"            # or DISTRIBUTED (shared across the cluster), or TIERED (local in front of distributed)
strategy = "CACHE_ASIDE"
```

A cache earns its keep on reads and is a hazard on writes, so it goes on the methods that read;
its hard part is invalidation. The cache interceptor has no pub-sub hook of its own: a write method
using the `WRITE_AROUND` strategy removes the key on its own node, and other nodes' copies age out
by TTL unless a slice subscribes to a change event and calls such a method. Module E takes that up
alongside the pub-sub from Module B.

When more than one interceptor wraps a method, the order they nest in matters: logging outermost so
it records the whole attempt, rate limit before any real work so a rejected call costs nothing, and
the retry inside the circuit breaker, so the breaker counts one failure per exhausted retry sequence
rather than one per attempt. That order is not left to chance. The first annotation on the method is the outermost
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
> head, with the crash gate run against a live cluster. Entity timers are durably recorded and
> fire on a deployed node as of 2026-08-27 (#351); the interval is a documented 1-second constant,
> not a config knob. The proven durability envelope covers both the loss and replacement of an
> owner in a live cluster and a full cluster restart that keeps the node data directories (#349,
> re-verified at rc3): the per-partition WAL and the entity's own log are fsynced and replayed at
> boot. Two things fall outside that envelope: the DHT key-value store, which is in-memory only
> and does not survive a restart, and an ungraceful power loss of every node or a partition
> reassigned to a different owner afterward, both still untested. The workflow and saga
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

    static PlaceOrder placeOrder(Inventory inventory,
                                 Payments payment,
                                 Shipping shipping,
                                 Notifications notify) {
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
static Promise<Reserved> reserve(Inventory inventory, ValidOrder order) {
    return inventory.reserve(order.orderId(), order.items())
                    .map(id -> new Reserved(order, id));
}

static Promise<Charged> charge(Payments payment, Inventory inventory, Reserved r) {
    return payment.charge(r.order().customerId(), r.order().total())
                  .map(id -> new Charged(r, id))
                  .onFailure(_ -> inventory.release(r.reservationId()).recover(_ -> Unit.unit()));
}

static Promise<Shipped> arrange(Shipping shipping, Payments payment,
                                Inventory inventory, Charged c) {
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
static Unit confirm(Notifications notify, Shipped shipped) {
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
ran locally or three nodes away. Timer operations route the same way: a
`scheduleTimer` or `cancelTimer` at a non-owner is forwarded to the committed owner, and the owner
stamps the fire instant on its own clock.

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
replication_factor = 3     # optional: copies of each partition's log, including the owner
confirmation_factor = 2    # optional: copies that must hold a write before it acknowledges
```

`keyspace` and `partition_count` name the family and its fence granularity. `replication_factor` and
`confirmation_factor` are optional and default to the cluster's replication defaults, 3 and 2. Values
are validated when the slice loads, so a rejected value fails loading with a named cause rather than
surfacing at first write. Durability is bought with the two factors together:
`replication_factor` is the number of copies of each partition's log, including the owner, and
`confirmation_factor` is how many of them must hold a write before it acknowledges. At the defaults,
3 and 2, a write acknowledges only once the owner and at least one peer hold the record, which is what
makes state survive the owner's death rather than merely its restart. At `replication_factor = 1` the
entity is still durable across a restart of its own node, but the disk it sits on is the only copy;
that weaker guarantee is legal and warned, and has to be declared on purpose.

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
    record TimerTokenMismatch(String key, DurableEntity.TimerToken token, String appliedToken) implements EntityError {}
    record TimerDelayInvalid(String key, long delayMillis) implements EntityError {}
    record TimerFireFailed(String key, DurableEntity.TimerToken token, Cause cause) implements EntityError {}
    record StaleOwnerEpoch(String key, String presentedEpoch) implements EntityError {}
    record StorageFailed(String key, Cause cause) implements EntityError {}
    record StorageUnavailable(String key, Cause cause) implements EntityError, Cause.Transient {}
    record NotCurrentOwner(String key, String committedOwner) implements EntityError {}
    record OwnershipNotYetCommitted(String key, String keyspace, int partition) implements EntityError, Cause.Transient {}
    record OwnerTransitioning(String key, String reason) implements EntityError, Cause.Transient {}
    record StaleEpochRead(String key, String presentedEpoch, String highWaterEpoch) implements EntityError {}
    record LinearizableUnavailable(String key) implements EntityError, Cause.Transient {}
}
```

`StaleOwnerEpoch` is the one to recognize: it is the fence speaking. This node was deposed as owner
while the operation was in flight, and the write committed nowhere. It is not marked transient, and the
caller re-resolves the current owner and retries there.

> _Not yet available: there is no terminal-state predicate on the entity, and so no typed failure
> for operating on a finished entity or for collecting one that is not finished. Earlier drafts of
> this listing carried `EntityTerminated` and `EntityNotTerminal`; neither is implemented, and
> neither is shown above because a sealed interface's variants are exhaustive — a `switch` over
> `EntityError` must match the fourteen above and nothing else._

Reads carry their consistency in the call. Plain `get(key)` is a bounded-stale read: a node that
holds the partition, owner or replica, answers from its local copy after folding its view forward
to the log's committed head, and a node that holds nothing forwards the read to the committed
owner. The answer can trail an in-flight write by a bounded window; it never invents state. When
trailing is not acceptable — a check immediately before an irreversible action, a read that must
see a write another node just acknowledged — ask for it: `get(key, ReadConsistency.LINEARIZABLE)`
is served only by the committed owner: it orders a no-op consensus round, re-checks the owner's epoch
after the round, and only then serves, so the read reflects every write acknowledged before it began.
A node that is not the owner answers `NotCurrentOwner` and the caller re-resolves.
The price is a consensus round per read. Default to the bounded-stale form and escalate per call,
so the code shows exactly which reads paid for certainty.

Timers need one honest sentence about their bound, not their existence. `scheduleTimer` and
`cancelTimer` work against the entity's log — a pending timer is a durable record, scheduled at
an absolute instant, surviving handover and restart like any other state — and the driver that
fires due timers is wired into a deployed node as of 2026-08-27 (pragmatica #351): a scheduled
timer fires there, at or after its instant, never before. The check runs on a documented
1-second constant, not a config knob, so do not design around a finer grain than that.

One observation pays off immediately. A fenced single writer per key is a lease. If a slice needs a
distributed lock, a leader for some resource, or a guarantee that only one worker touches an account
at a time, it models that resource as an entity and lets the fence be the lock. There is no separate
locking primitive to learn, because single-writer-per-key already is one.

A word on what durable means in a running cluster, stated per property with the mechanism that
earns it, because the rest of the module leans on it. A write acknowledges only after the
entity's log holds it fsynced on the owner and, at a `confirmation_factor` of two or more, on at
least one peer — so an acknowledged write survives the owner's death, and the crash gate
exercises exactly that: an owner killed mid-traffic, every acknowledged write still present with
its exact value after the cluster heals. The stream write-ahead log beneath it fail-stops on a failed
frame write or fsync, so later writes fail and acknowledgements stay withheld rather than
acknowledging what the disk did not take. The proven envelope, stated with the same rigor as the write above, now covers a
full cluster restart too: the write survives its owner being replaced and a full cluster restart
that keeps the node data directories, because the same fsync-before-ack discipline applies to the
per-partition WAL — replayed in full at boot — and the entity's own log restores its snapshot the
same way (#349, re-verified at rc3). Two things sit outside that envelope: the DHT key-value
store, which is in-memory only and loses its contents on any restart, and an ungraceful power
loss of every node or a partition reassigned to a different owner afterward, both still untested.
The timer half of the surface is recorded and firing, as the timers note above says.
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

A saga is a durable entity whose state, `SagaState<C>`, is a step ledger over a shared context.
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
the design has the runtime write a `StepAttempt(sagaId, stepIndex)` marker under the fence; if the
process crashes before the ledger commits, recovery finds the marker and does not re-invoke that
forward action, treating the step as taken. The mechanism is the marker: a crash between the marker and
the effect skips the effect, and that is the price of never repeating it. An `IDEMPOTENT`
step carries no marker: the author has declared that running it again is harmless, so recovery simply
re-runs it. The `(sagaId, stepIndex)` pair is the idempotency anchor in this sketch; the current
design spec replaces it with an explicit typed `StepContext` (an `operationId` and a `compensationId`)
that every forward, outcome lookup and compensation receives, so treat the pair as the shape of the
idea rather than the final API. The design also intends a stable per-entity monotonic counter
`(key, n)` that a slice could hand to a downstream service as an idempotency key; the shipped
`update` returns only the post-update state and does not expose one yet, so today the idempotency key
is one the slice mints itself and writes into the state or the command.

This also settles a debt left open in Module A. A single operation that must commit to its own store
and reliably emit an event to another faces the dual-write problem: two writes, no shared
transaction. The classic answer is a transactional outbox, staging the second write inside the first
store's transaction and delivering it later by a separate process. Aether reaches the same guarantee
more directly. The designed per-entity `(key, n)` counter, or an idempotency key the slice mints itself, and a
`RUN_ONCE` step would let a retried effect land once instead of repeating, with no outbox table to
maintain and no delivery worker to operate. The reliable emission Module A pointed forward to is this.

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
acknowledge, its reads served replica-aware, with its timers durably recorded and firing on
schedule (#351). The workflow and the saga above it are the module's intended design: pinned against those
verified primitives, with no runtime code behind them yet. Write the manual baseline when you
need compensation now, reach for the entity directly when you need durable per-key state now, and
verify the workflow and saga surfaces against the runtime before you stake an order on them.

Reliability keeps one operation correct across steps and crashes. The next module turns from
correctness to speed: keeping the whole system responsive under load, with caching, batching, and
backpressure.

# Module E — Performance and scale

> _Confirmed from source at rc5 (`d113279af`) for the cache, rate-limit and circuit-breaker
> interceptors, their config keys, and the causes a caller receives. The database-notification half
> of the invalidation example inherits the "partly wired" status of that section. Backpressure,
> batching, scaling and stream delivery guarantees are covered later._

Every performance tool in this module is an interceptor from Module C, and every one of them keeps
state: cached values, tokens in a bucket, a count of recent failures. The advice for each follows
from one question, which is where that state lives. Most of it lives in the node, inside one
slice's copy of the interceptor, so a cluster of five nodes runs five caches, five buckets and five
breakers unless the configuration says otherwise. A setting that looks right for one process is
off by a factor of the node count, and each section below names that factor.

## Serving a read without doing the work

`placeOrder` prices every line item, and the price of a product changes a few times a day while it
is read thousands of times an hour. Reading it from the database on every order is the slice doing
the same work over and over. A cache returns the stored answer instead, and the interceptor from
Module C does this without the slice's code changing: on a hit it returns the stored value and the
method does not run; on a miss it runs the method and stores the result.

```java
@Slice
public interface ProductCatalog {
    @CachedPrice
    Promise<Money> price(@Key Sku sku);
}
```

```toml
[cache.prices]
cache_name = "prices"
strategy = "CACHE_ASIDE"
ttl_seconds = 30
max_entries = 50000
mode = "DISTRIBUTED"
```

All five keys are required. `cache_name` has no default on purpose: two sections that forgot it
would otherwise land in one shared namespace. What to cache follows from what a hit means. A hit
answers with the value the method returned for that key up to `ttl_seconds` ago, so cache a read
whose answer you would accept at that age: a price, a product description, a tax table. Do not
cache a read whose staleness is a business error, such as stock on hand at the moment of
reservation.

`ttl_seconds` is the staleness you accept, stated in seconds. It is counted from the moment the
value was stored, not from its last read, and an expired entry is a miss: the cache never serves a
value past its TTL to cover for a failing method. How old a served value can be depends on `mode`:

- `LOCAL` keeps an in-memory map per node, bounded by `max_entries` with the least recently used
  entry evicted first. Each node fills its own copy, so two nodes can answer the same key with two
  different prices for up to `ttl_seconds`.
- `DISTRIBUTED` keeps one copy per key in the cluster's distributed hash table, under a namespace
  named by `cache_name`, so every node reads the same entry. The expiry is stamped with the writing
  node's wall clock and checked against the reading node's, so clock skew between them moves the
  expiry by that skew. The cache namespace is replicated once by default, so losing the node that
  holds an entry turns it into misses. `max_entries` bounds nothing in this mode; the distributed
  backend is built without it.
- `TIERED` puts a `LOCAL` map in front of the `DISTRIBUTED` one, and a hit in the shared tier is
  copied into the node's map with a fresh TTL. A value stored at the last moment of its shared
  lifetime therefore lives on in a node's map for one more TTL: under `TIERED`, a served value can be
  up to twice `ttl_seconds` old.

The cache is fail-open. A shared backend that cannot answer a read is treated as a miss and the
method runs; one that cannot take a write leaves the method's result standing, and the interceptor
removes the key so the old value is not left behind. A cache outage costs latency and load on
whatever the method reads, never a failed order. That is also why the next problem matters: the
only expiry the cache enforces on its own is the TTL.

## Telling the cache a value changed

A merchant lowers a price. With a 30-second TTL, orders placed in the next 30 seconds may still be
charged the old one. If that window is too wide, shrinking the TTL trades it for more database
reads; the other move is to remove the entry when the price changes. The cache interceptor's
`WRITE_AROUND` strategy does exactly that: it runs the method and, once the method succeeds,
removes the key it was called with.

```java
@Slice
public interface ProductCatalog {
    @CachedPrice
    Promise<Money> price(@Key Sku sku);

    @EvictsPrice
    Promise<Unit> changePrice(@Key Sku sku, Money newPrice);

    @EvictsPrice
    Promise<Unit> evictPrice(@Key Sku sku);
}
```

```toml
[cache.price-evict]
cache_name = "prices"
strategy = "WRITE_AROUND"
ttl_seconds = 30
max_entries = 50000
mode = "DISTRIBUTED"
```

`@EvictsPrice` points at its own section, and that section names the same `cache_name`. Sections
that share a name share one backend, so the mode, TTL, capacity and key type must agree with every
other section of that name, or provisioning refuses the slice and names the setting that differs.
The strategy may differ, which is what lets a `CACHE_ASIDE` reader and a `WRITE_AROUND` invalidator
work on one namespace. `changePrice` writes the new price and then evicts; `evictPrice`'s body is
`Promise.unitPromise()`, because the interceptor does all of its work.

What a removal reaches depends on the mode again. Under `DISTRIBUTED` there is one copy, so one
removal from any node clears it for every node. Under `LOCAL` it clears the calling node's map and
no other; under `TIERED` it clears the calling node's map and the shared tier, and the other nodes'
local copies live out their TTL. If invalidation matters to you, use `DISTRIBUTED`: it is the one
mode where a single removal is complete.

Two details decide whether the removal happens at all. First, interceptors wrap calls that arrive
through the slice's interface. If `changePrice`'s implementation calls `evictPrice` on its own
object, that call runs the bare method and evicts nothing; the eviction has to come from outside,
or from the annotated method itself, as `changePrice` does. Second, prices also change when another
system writes the catalog table directly. For those, a listener slice calls `evictPrice` through the
catalog's interface:

```java
@Slice
public interface PriceChangeListener {
    @OnPriceChange
    Promise<Unit> onChange(PgNotification notification);

    static PriceChangeListener priceChangeListener(ProductCatalog catalog) {
        return notification -> Sku.sku(notification.payload())
                                        .async()
                                        .flatMap(catalog::evictPrice);
    }
}
```

`@OnPriceChange` is a `PgNotificationSubscriber` qualifier declared as in the database notifications
section of Module C, and a trigger on the catalog table sends the product id as the payload. That
section's caveat applies here: the runtime half of the listener is not yet confirmed. A pub-sub
subscriber from Module B calling `evictPrice` works the same way.

Invalidation narrows the window; it does not close it. A failed removal is absorbed and logged at
DEBUG, a dropped notification never arrives, and a read that loaded the old price just before the
write can store it just after the removal. Each of those leaves a stale entry, and the TTL is what
ends it. Keep the TTL at the longest staleness the business accepts, and treat invalidation as the
mechanism that makes the common case much fresher than that.

## Choosing a rate limit

A rate limit says how much work a method accepts per unit of time and turns away the rest before it
does any. The rate-limit interceptor is a token bucket:

```toml
[rate-limit.orders]
max_requests = 200
window = "1s"
burst = 50
```

The bucket holds `max_requests + burst` tokens and starts full. Each admitted call takes one, and
tokens come back continuously, one every `window / max_requests`, here one every 5 ms, rather than
all at once when a window ends. `burst` is extra headroom: after a quiet spell, up to 250 calls go
through at once, and after that the sustained rate is 200 a second. With `burst = 0` the bucket
holds exactly `max_requests`. All three keys are required, and a configuration the limiter cannot
represent, such as more than 65,535 tokens in total or a window shorter than one nanosecond per
token, fails provisioning with its reason.

The bucket lives in the node. Each node running the slice has its own, and nothing in the
interceptor coordinates them, so the cluster admits up to the per-node figure times the number of
nodes running the slice, and a node that receives more than its share rejects calls while its
neighbours have tokens to spare. Choose the number from the other end: take what the thing you are
protecting can absorb, a payment gateway's contracted rate or the database's comfortable query
rate, divide it by the nodes that run the slice, and leave room for traffic that reaches it by
other paths. Adding a node raises the cluster's effective limit; scaling is covered later.

A rejected call does not run the method. The caller receives `RateLimiter.RateLimiterError.LimitExceeded`,
which carries a `retryAfter` duration and is classified `Cause.Transient`. A slice calling this one
gets it as the failure of its `Promise`; an HTTP request served on the node that rejected it
receives 503 Service Unavailable, because that node answers every transient failure with 503. It
does not receive 429, and no `Retry-After` header is set.

## Failing fast when a dependency is down

When the payment gateway stops answering, each call to it waits for its timeout, holds its
resources while it waits, and fails anyway. A circuit breaker notices the run of failures and stops
calling: for a while it fails every call at once, without touching the gateway, and then it probes
to see whether the gateway is back. The keys are the three from Module C, and all three may be
omitted, falling back to 5 failures, 30 seconds and 3 test calls.

The breaker has three states:

- **Closed.** Calls run. Each failure adds one to a counter and each success resets it to zero, so
  `failure_threshold` counts failures without a success between them. Reaching it opens the breaker.
- **Open.** Calls are rejected without running. After `reset_timeout` the breaker moves to half-open,
  on a timer or on the first call after the timeout, whichever comes first.
- **Half-open.** Calls run as trials. `test_attempts` successes close the breaker; one failure opens
  it again for another `reset_timeout`.

A rejected caller receives `CircuitBreaker.CircuitBreakerError.CircuitBreakerOpenError`, classified
`Cause.Transient`, with a message ending in how long until the breaker tries again. An HTTP request
served on that node gets 503, the same as a rate-limit rejection.

Three properties shape how you configure it. Every failure counts: the interceptor builds the
breaker with a trip rule that accepts any cause, and the config offers no filter. A gateway that
declines five cards in a row opens the breaker exactly as an outage would, so put the breaker on a
call whose failures are infrastructure, or return the business verdict as a value instead of a
failure. Half-open admits every call that arrives, not one probe at a time, so a recovering gateway
receives the full arrival rate at once; a longer `reset_timeout` gives it more time before that
happens, nothing in the breaker spreads it out. And the breaker is per node, one per config section
and slice on each node, so with five nodes the gateway sees up to five times `failure_threshold`
failed calls before every node has stopped calling, and each node probes on its own schedule.

## When the guards meet

Both rejections are `Cause.Transient`, and the retry interceptor's default `retry_on = "TRANSIENT"`
retries exactly that classification. A retry wrapped around a rate limiter or a breaker retries
their rejections: it spends further tokens on calls the limiter refused and retries calls the
breaker refused with the very failure it is designed to return fast. The order Module C gave is
also the order that keeps them apart, with one addition each:

```java
@Slice
public interface Ordering {
    @LogCalls
    @LimitOrderIntake
    @BreakOnPaymentOutage
    @RetryPayment
    Promise<OrderPlaced> placeOrder(PlaceOrder request);
}
```

The limiter sits outside the breaker as well as outside the retry. Inside the breaker, its own
rejections would count as failures, and a burst of traffic would open the breaker against a gateway
that is perfectly healthy. A cache on a read method goes outside the limiter and the breaker, so a hit
spends no token and is still served while the breaker is open; it serves only unexpired entries, so
it shortens an outage's reach without hiding the outage.

The three interceptors have this in common: each turns a deployment number into behavior, and each
number is per node unless the cache is `DISTRIBUTED`. Module F turns from the speed of one
operation to the shape of the system around it.

# Module F — Architecture in the large

The earlier modules kept one operation correct and fast. This one is about the shape of the whole
application once it outlives its first version, its first customer and its first auditor. Aether
contributes less here than anywhere else in the playbook, and that is the point of the module: the
runtime supplies a handful of hooks (versioned routes, a binary codec with stated rules, a security
context at the edge, transactions on your datasource), and the architecture is made of your own
types arranged around them. Three patterns follow: evolving a message while old and new readers
both run, serving many customers from one deployment, and keeping an audit trail you can query.
Event sourcing and read models (CQRS) build on the third and come in a later revision of this
module.

## Changing a message without breaking its readers

The order summary needs a currency. Adding a field to a record is a one-line change, and in a
single process it is safe. In a cluster it is not, because a deployment does not swap every
instance at once. Aether's update strategies are canary, blue-green and rolling, and each of them
runs the old slice version and the new one side by side for a while. Every message type that
crosses a slice boundary has readers on both sides of that window.

Two version numbers are in play, and they move independently. The **slice version** is the
artifact's version, the thing a deployment replaces. The **API version** is the HTTP contract an
external client depends on. A slice can ship ten artifact versions under one API version, or carry
two API versions inside one artifact. Keep the two apart: the artifact version is your release
cadence, the API version is a promise to someone you cannot redeploy.

### At the edge: versions in `routes.toml`

For external clients, the API version lives in `routes.toml`. Each `[vN.routes]` block declares the
routes of version N, and a bind key `get` under `[v1.routes]` binds to a slice method named `getV1`.
The per-version table carries the lifecycle:

```toml
[api]
prefix = "/api/orders"

[security]
default = "authenticated"

[v1.routes]
get = "GET /{id:Long}"

[v1]
deprecated = true
sunset = "2027-06-30"

[v2.routes]
get = "GET /{id:Long}"

[v2]
defaultIfMissing = true
```

```java
@Slice
public interface OrderQueries {
    record GetOrderRequest(Long id) {}

    record OrderSummaryV1(long id, String status, long totalCents) {}
    record OrderSummaryV2(long id, String status, long totalCents, String currency) {}

    Promise<OrderSummaryV1> getV1(GetOrderRequest request);
    Promise<OrderSummaryV2> getV2(GetOrderRequest request);
}
```

Whether the version is selected by path (`/api/orders/v1/42`) or by a request header is a
deployment-level setting, outside `routes.toml`, so the same slice serves either. Responses from
a deprecated version carry a `Deprecation: true` header, a `Sunset` header when a date is set, and
a `Link` to the newest non-deprecated successor. The router also counts requests per version and
counts deprecated-version requests separately, and the management API lists each slice's versions
at `GET /api/versions`. That counter is how you know when the sunset can actually happen: when it
reads zero for long enough, delete `getV1` and its record.

The pattern is the code above. Each API version gets its own response type, `OrderSummaryV2` beside
`OrderSummaryV1`, and one implementation projects the current model into each. Never widen
`OrderSummaryV1` in place; the whole reason a client pinned to v1 is safe is that v1 stops changing.

### Inside the cluster: the codec's rules

Between slices, values travel in a binary codec generated from your records. Its rules decide what
evolution is safe, and they are short. A record is written field by field in declaration order,
with no field names on the wire. Each field is preceded by a one-byte type tag, and the reader
compares that tag with the one its own compile-time shape expects; a mismatch fails the decode with
a `TagMismatchException` naming the record and field. A record's own type tag is derived from its
fully qualified class name.

Read off those rules, the consequences are concrete:

- **Renaming a field is free.** Names never reach the wire.
- **Removing or retyping a field, or inserting one before others, is a different shape.** A reader
  on the other version fails on the field where the shapes diverge. The failure is loud, which is
  the good news. A field appended after the last one is the case to test rather than assume: the
  older reader can finish its own fields before it reaches the new one, so do not count on the tag
  check to catch it.
- **Swapping two fields of the same type is silent.** Both carry the same tag, the check passes,
  and the values land in each other's fields. This is the one edit the codec cannot catch, and no
  test that runs a single version will catch it either.
- **Renaming or moving the record changes its wire identity.** The tag comes from the class name,
  so to the other version it is a type it has never seen.

The pattern follows from the last rule: **a new shape gets a new name.** Freeze a record once
another slice reads it. When the shape must change, add `OrderPlacedV2` beside `OrderPlaced`, have
the producer emit the new type only after every consumer's deployed version can read it, and remove
the old type once no producer emits it. That is two deployments where an in-place edit looks like
one, and the extra deployment is exactly the window in which both versions run.

Enums get one rule from the codec processor itself. A `@Codec` enum must declare `UNKNOWN` as its
last constant, or the build fails; enums travel as ordinals, and an ordinal the reader does not have
decodes to `UNKNOWN`. Add new constants immediately before `UNKNOWN`, never in the middle, and
treat `UNKNOWN` as a refusal wherever you consume it. There is a less obvious edge: adding a constant
moves `UNKNOWN` to a new ordinal, so an `UNKNOWN` that an old-version slice forwards decodes on the
new version as the constant you just added. Never forward `UNKNOWN`; reject it where it arrives.

Durable topic subscribers make the coexistence explicit. A subscriber's consumer-group identity
drops the artifact version, so during a blue-green window either version may process the group's
events, and the event type must be readable by both. What the runtime promises about those events
reaching a subscriber is a separate question, answered in "Events that must not be lost" in
Module B.

**The honest limit.** The runtime does not compare record shapes across slice versions before a
deployment. The codec turns most shape drift into a decode failure at the moment of the call, which
is far better than garbage, but it is still a failure in production. The new-name rule is your
check, and it holds only as long as reviewers enforce it.

## One cluster, many customers

Several merchants place orders through one deployment. Each must see only its own orders, and
nothing in one merchant's traffic may leak into another's answer. The question is where the tenant
lives, and the answer this book commits to is: in your types, from the first line of the request
to the last row of the database.

Start with what Aether does not do. It has no tenant concept. Its stated trust model is a single
application in a single security domain, and the runtime README says it is not hardened for
multi-tenant deployment. Tenancy inside one cluster is therefore an application property: one
trusted application serving many customers, each separated from the others by your code. Aether's
*communities* are a different axis entirely, a grouping of nodes in the core/community/worker node
hierarchy; a community is not a tenant, and binding one to the other is a deployment decision the
runtime knows nothing about.

What Aether does provide is the caller's identity at the HTTP edge. When a route is authenticated
with a JWT, the token's claims become string claims on a `SecurityContext`, and a slice method may
take that context as a parameter beside exactly one request record. That is where the tenant enters:

```java
@Slice
public interface OrderIntake {
    record PlaceOrderRequest(List<LineItem> items) {}

    Promise<OrderPlaced> placeOrder(SecurityContext security, PlaceOrderRequest request);
}

public record TenantId(String value) {
    private static final Cause MISSING_TENANT = Causes.cause("Token carries no tenant claim");

    public static Result<TenantId> tenantId(SecurityContext security) {
        return Option.option(security.claim("tenant"))
                     .filter(value -> !value.isBlank())
                     .map(TenantId::new)
                     .toResult(MISSING_TENANT);
    }
}
```

`claim` returns null for an absent claim, so it is wrapped at once and never travels further.
`placeOrder` parses `TenantId.tenantId(security)` first, fails the request if it is missing, and
from then on the tenant is an ordinary value: a field of every request record sent to another
slice, a field of every event, the first parameter of every repository method. Carry it
explicitly. A tenant read from ambient context halfway down a call chain is a tenant that some
code path will one day forget to read.

In the data, the shared-schema form is the default: a `tenant_id` column on every tenant-owned
table, part of every key, and in every `WHERE`. Make the type enforce it: if every method on the
order repository takes a `TenantId`, an unscoped query is a compile error at the call site rather
than a review comment. When a large customer needs its own database, the multi-datasource support
in Module A ("More than one datasource") gives each tenant class its own connector, and the
`TenantId` decides which one a request uses. The repository signatures do not change.

**The honest limit.** Every boundary here is code you wrote. A missed `WHERE tenant_id = ?` is a
cross-tenant leak, and nothing beneath it will refuse the query. API-key authentication carries no
claims, so tenancy needs token-based authentication on every tenant-facing route. Customers who must
be protected from each other as adversaries, rather than merely kept apart, need separate
clusters; that is what the single-trust-domain statement means in practice.

## The audit trail is data

Support asks who changed the shipping address on order 4417, and when. A log line might answer,
if it was kept, if it was not rotated away, and if someone can grep it. An audit trail that answers
reliably is a table: rows you query by order, by tenant, by actor or by time, with the same retention
and access control as the data it describes.

Aether's own audit records are the wrong place for this. The runtime writes an audit log for its
operator-facing events (authentication results, deployments, configuration and schema changes), and
it is a log stream, written for operators. The workflow and saga audit stream from Module D is part
of a pinned design with no runtime code behind it. Neither records business changes. An application
audit trail is ordinary slice code, and that is no loss: it is a small amount of code.

The pattern has two parts. First, the audit entry is a type, designed like any other domain record:

```java
public record AuditEntry(TenantId tenant,
                         String subject,     // "order:4417"
                         String action,      // "shipping-address-changed"
                         String actor,       // Principal.value()
                         Instant at,
                         String detail) {}
```

Second, it is written in the same database transaction as the change it records:

```java
static OrderMaintenance orderMaintenance(@Sql SqlConnector db) {
    record orderMaintenance(SqlConnector db) implements OrderMaintenance {
        @Override
        public Promise<Unit> changeAddress(SecurityContext security, ChangeAddressRequest request) {
            return TenantId.tenantId(security)
                           .async()
                           .flatMap(tenant -> db.transactional(conn -> updateAndAudit(conn, tenant, security, request)));
        }

        private Promise<Unit> updateAndAudit(SqlConnector conn,
                                             TenantId tenant,
                                             SecurityContext security,
                                             ChangeAddressRequest request) {
            return conn.update(UPDATE_ADDRESS, request.address(), tenant.value(), request.orderId())
                       .flatMap(_ -> conn.update(INSERT_AUDIT,
                                                 tenant.value(),
                                                 "order:" + request.orderId(),
                                                 "shipping-address-changed",
                                                 security.principal().value(),
                                                 Timestamp.from(Instant.now()),
                                                 request.address()))
                       .mapToUnit();
        }
    }
    return new orderMaintenance(db);
}
```

The transaction is what makes the trail trustworthy. The audit row commits with the change or not
at all, so the trail cannot claim a change that was rolled back, and a change cannot exist without
its row. Writing the audit entry in a second step, after the change, reopens exactly the gap the
table was meant to close.

Treat the trail as data in the rest of its life too. It is append-only: the slice that owns it
exposes inserts and queries, never updates. It carries the tenant, so it obeys the tenancy rules
above. Its `detail` is a deliberate projection, not a dump of the request; a trail that stores
whole payloads also stores every secret and personal field the payload carried, and then needs its
own audit.

**The honest limit.** The trail records what passes through the code that writes it. A change made
by a migration, by a manual `UPDATE` or by a slice that skips the pattern leaves no row. When other
slices must react to audit entries, publishing them is a messaging question, and what the runtime
promises about delivery is covered in Module B ("Pub-sub, durable pub-sub, or stream?"); none of it
replaces the row written in the transaction. A cross-cutting interceptor (Module C) can enforce
that audited methods exist, but the entry itself belongs in the business transaction.

An audit table records what happened beside the state that resulted. Turn that around, make the
recorded changes the source and derive the state from them, and you arrive at event sourcing and
its read models, which this module will take up once the delivery guarantees they rest on are
settled.
