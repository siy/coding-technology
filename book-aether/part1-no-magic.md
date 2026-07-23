# Part I — Aether Slice: No Magic

> You don't have to know everything under the hood to use Aether, but if you're
> interested, let's open it up. If not, skip to Part II and start building; the later
> chapters point back here wherever the machinery matters.

## Anatomy of a slice: what you write versus what is generated

Take the smallest slice that still does something: a quote calculator. Given a SKU and a
quantity, it returns a price. It needs nothing from the outside world, so it makes a clean
specimen.

Here is the whole of what you write:

```java
@Slice
public interface OrderQuote {
    Promise<Quote> quote(QuoteRequest request);

    record QuoteRequest(Sku sku, int qty) {}
    record Quote(Money unitPrice, Money total) {}

    static OrderQuote orderQuote() {
        return request -> Promise.success(price(request));
    }

    private static Quote price(QuoteRequest request) {
        var unit = Catalog.unitPrice(request.sku());
        return new Quote(unit, unit.times(request.qty()));
    }
}
```

An interface, the types it speaks in, and a factory named after it. At compile time the
slice-processor reads this and writes a companion class, `OrderQuoteFactory`, that you
never edit and rarely read. It is worth reading once, so the runtime stops being magic.

```java
public final class OrderQuoteFactory {
    private OrderQuoteFactory() {}

    // 1. The bridge: build your implementation.
    public static Promise<OrderQuote> orderQuote(SliceCreationContext ctx) {
        var instance = OrderQuote.orderQuote();
        return Promise.success(instance);
    }

    // 2. The wrapper: present that implementation to the runtime as a Slice.
    public static Promise<Slice> orderQuoteSlice(SliceCreationContext ctx) {
        record orderQuoteSlice(OrderQuote delegate, ResourceProviderFacade resources)
                implements Slice, OrderQuote {

            public List<SliceMethod<?, ?>> methods() {
                return List.of(new SliceMethod<>(
                    MethodName.methodName("quote").expect("method name literal: quote"),
                    delegate::quote,
                    new TypeToken<Quote>() {},
                    new TypeToken<QuoteRequest>() {}));
            }

            public SliceCodec codec(SliceCodec parent) {
                return SliceCodec.sliceCodec(parent, List.of(/* one TypeCodec per nested type */));
            }

            public Promise<Unit> stop() {
                return resources.releaseAll("com.shop:orders-order-quote-slice");
            }

            public Promise<Quote> quote(QuoteRequest request) {
                return delegate.quote(request);
            }
        }
        var resources = ctx.resources();
        return orderQuote(ctx).map(impl -> new orderQuoteSlice(impl, resources));
    }
}
```

You wrote a dozen lines; the processor wrote the rest, and the rest is where the slice
becomes something the cluster can host, route to, and serialize. Three jobs are worth
naming, because they are the three things every slice needs and none of them are yours to
write.

`methods()` is the dispatch table. Each method becomes a `SliceMethod` keyed by name, with
the request and response types attached as `TypeToken`s. When a request arrives for
`quote`, the runtime looks it up here and calls your implementation; the method name and
its types are how an incoming byte stream finds the right Java method.

`codec()` is the generated serialization. The processor emits one codec per nested type, so
`QuoteRequest` and `Quote` cross the network without you writing or annotating anything.
This is why a slice never carries `@Codec`: the codec already exists, generated from the
record components.

`stop()` releases whatever the slice acquired. For `OrderQuote` it releases nothing, but
the hook is always generated, so a slice that holds a connection pool or a subscription
gives it back cleanly on shutdown.

Two more details close the loop. The factory comes in two methods, not one. `orderQuote`
builds your implementation; `orderQuoteSlice` wraps that implementation as a `Slice`. The
runtime calls the second one, and it calls it by reflection: it looks for a static method
whose name is the slice name with `Slice` appended, taking a single `SliceCreationContext`
and returning `Promise<Slice>`. That one-argument shape is the only contract the runtime
knows, and the loader checks it: a slice compiled against an older runtime, whose factory
took a second argument, is rejected with a named error that tells you to rebuild rather than
failing deep inside reflection. Your own factory, with its real parameters, is called by the
generated bridge, never by the runtime directly. Cross-cutting behavior, retries or logging
or a circuit breaker, is not one of these two methods: it is declared per method as an
annotation and woven into the same generated bridge at compile time, the third seam Module C
takes up.

That is the whole trick. You write business logic against an interface; a compile-time
processor writes the dispatch, the serialization, the lifecycle hook, and the single-argument
entry point the runtime expects. There is no reflection over your code at request time, no
proxy magic to step through in a debugger, and nothing generated that you could not have
written by hand. The next sections follow this generated slice through its life: how it is
loaded and assembled, how its dependencies are provisioned, how configuration reaches it,
and how an HTTP request finds its way to `quote`.

## Slice lifecycle

A slice has a life on a node, and every stage of it runs off the manifest the processor
wrote next to the generated factory. The manifest is a flat text file that records
everything the runtime needs before it loads a single class: the interface and factory
names, the resources the slice wants, the methods the runtime should drive, the HTTP
routes, and the request and response types. Here is the shape of one, trimmed:

```
slice.name=PersistenceSlice
slice.factory=...PersistenceSliceFactory
resource.0.type=PgSqlConnector
resource.0.config=database
stream.publisher.0.config=streams.test-events
reactive.0.category=scheduled
reactive.0.config=scheduling.heartbeat
reactive.0.method=heartbeat
route.0.method=GET
route.0.path=/api/kv/{key}
route.0.security=public
```

The runtime moves the slice through five stages:

- **Load.** The slice's artifact is resolved and its classes are loaded in their own
  classloader, isolated from other slices, so two of them can use different versions of the
  same library side by side.
- **Assemble.** The runtime calls the generated `...Slice` factory by reflection, passing a
  `SliceCreationContext`. The bridge resolves the slice's resource parameters, builds your
  implementation, and returns it wrapped as a `Slice`. How those resources are resolved is
  the next section.
- **Start.** The runtime registers the slice's `methods()` as its dispatch table and its
  routes as HTTP endpoints, then wires the reactive bindings from the manifest, so a
  scheduled or subscriber method begins receiving calls.
- **Serve.** Requests arrive, the dispatch table finds the method by name, the generated
  codec decodes the request and encodes the response, and your logic runs.
- **Stop.** On shutdown or redeploy the runtime calls `stop()`, which releases every
  resource the slice acquired. The hook is always generated, so nothing leaks.

All of this is decided at build time: the runtime reads the manifest as data and dispatches
through the generated table. That is the whole of what happens when a request arrives.

## Assembly and resource provisioning

Part 0 drew the line between assembling, wiring your own parts together, and provisioning,
getting a resource from outside. This section shows how the processor wires each.
Provisioning comes in two forms, and the difference is which side places the call.

**Resource as a parameter.** The slice asks for a handle and calls out through it: a
database connector, an HTTP client, a notification sender, a pub-sub publisher, a stream
publisher or reader. You declare it as a factory parameter with a resource qualifier, and
the generated bridge resolves it before your factory runs:

```java
public static Promise<OrderService> orderService(SliceCreationContext ctx) {
    return Promise.all(
        ctx.resources().provide(SqlConnector.class, "database"),
        ctx.resources().provide(Publisher.class, "messaging.order-events", provisioningContext())
    ).map((db, events) -> OrderService.orderService(db, events));
}
```

Each `provide` call looks up a config section, builds the resource (a pooled connection, a
configured client, a topic publisher), and hands it back; `Promise.all` waits for all of
them; your factory receives them as the parameters you declared. In the manifest these
appear as `resource.*`, `stream.publisher.*`, and `publish.topics.*` entries, so the runtime
knows what to provision before the slice starts.

**Resource as a method invocation.** The slice does not hold a handle; the runtime calls in
to one of its methods when the resource has something to deliver: a scheduled tick, a
message on a topic, an event on a stream, a notification from the database. You declare it
by annotating a method, and the processor records the binding in the manifest as a reactive
entry:

```
reactive.0.category=scheduled
reactive.0.config=scheduling.heartbeat
reactive.0.method=heartbeat
```

At start the runtime reads these entries and drives the named method. A `@Heartbeat` method
is called on a schedule; a subscriber method is called for each message; a PG-notify method
is called for each database notification. Each kind produces its own reactive entry, with
its own category and config section.

Some resources use only one side. A SQL connector or an HTTP client is parameter-only,
because the slice always initiates. A scheduled task or a PG-notify listener is
method-only, because the runtime always initiates. Pub-sub and streams use both: a
`Publisher` parameter to send and a subscriber method to receive; a `StreamPublisher` or
`StreamAccess` parameter to write and read, and a `StreamSubscriber` method to consume. The
two mechanisms are independent, and a slice mixes them freely.

One more parameter kind rounds out assembly. A factory parameter that is another `@Slice`
interface is wired as a remote proxy, so calling it routes across the cluster; a plain
interface that has its own factory is wired locally and called in place. The bridge
resolves each parameter by what it is, resources from configuration, slices to proxies,
local interfaces to direct calls, and your factory only ever sees the finished handles.

## Config inheritance

Resources are provisioned from config sections, which raises the obvious question: where
do those sections come from? Config arrives in three layers, and the more specific layer
wins.

- **Global** is the application's own configuration, and it travels with the blueprint as
  `resources.toml` (packaged into the artifact as `META-INF/resources.toml`). Topics,
  stream settings, feature flags, business thresholds: the settings that are part of the
  app wherever it runs.
- **Node** is the infrastructure configuration on each machine, in `aether.toml`. Database
  hosts, endpoints, credentials: the facts that differ between a laptop, staging, and
  production.
- **Slice** is a per-slice override, named in the manifest as `config.file` (for example
  `slices/OrderService.toml`), for the rare case where one slice needs to depart from the
  shared settings.

The runtime merges them in that order, with slice over node over global, so a value set
closer to the slice replaces the same value set further away. Values written as
`${secrets:orders/db-password}` are resolved at load time from the platform's secret
store, so credentials live there rather than in the blueprint.

This split is what makes "configuration change, not code change" concrete. The app's own
settings ship with the app; the environment's facts live on the node; moving from staging
to production changes node config and touches nothing else. Operators can also change
configuration on a running cluster through the management API, and the update propagates
through the cluster's consensus store, so slices pick it up without a redeploy.

Through all of this, the slice reads nothing. It declares a qualifier, the runtime reads
the merged configuration, builds the resource, and hands it over. Configuration is the
runtime's input, never the slice's concern.

## Request routing

A slice method becomes an HTTP endpoint through a `routes.toml` that sits beside it. For
the order service it is short:

```toml
prefix = "/api/v1/orders"

[security]
default = "public"

[routes]
placeOrder = "POST /"
getOrder   = "GET /{id}"

[errors]
default  = 500
HTTP_409 = ["*OutOfStock*"]
HTTP_402 = ["*PaymentDeclined*"]
```

`prefix` is optional and applies to every route. `[routes]` maps each method name to an
HTTP verb and path; path parameters are written `{id}` or, when you want a type, `{id:Integer}`.
`[security]` sets the baseline access policy. `[errors]` maps failure patterns to HTTP
statuses, with `default` as the fallback. A pattern matches against the returned `Cause`'s
type name, which is why a case that needs its own status is its own type, `OutOfStock` or
`PaymentDeclined`, rather than one constant of a shared enum: every constant of an enum is
the same type, so they cannot map to different statuses.

The processor compiles this into the manifest and a generated `OrderServiceRoutes` class.
In the manifest each route is fully resolved:

```
route.0.handler=placeOrder
route.0.method=POST
route.0.path=/api/v1/orders/
route.0.security=public
```

When a request arrives, the router matches its method and path to a route, decodes the
path parameters and body into the request type with the generated codec, and calls the
slice method through the dispatch table from 1.1. A success is serialized to the route's response media type, JSON by default, and an empty result becomes a 204. A
returned `Cause` is mapped to its HTTP status and rendered as an RFC 9457 `ProblemDetail`
body (`application/problem+json`); a request that matches no route becomes a 404 in the same shape.

That closes the machine. You write an interface, a factory, and a `routes.toml`. The
processor writes the factory bridge, the `Slice` wrapper with its dispatch table and
codecs, the manifest, and the routes class. The runtime reads that manifest as data and,
for every request, decodes, dispatches, and encodes, while your method does the one thing
it was written to do: return a `Promise`. Part II builds slices in earnest, and Part III
puts them to work on the problems that fill a real system.
