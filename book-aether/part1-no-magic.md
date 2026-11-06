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
                return SliceCodec.sliceCodec(parent, List.of(/* one TypeCodec per reachable type */));
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

`codec()` is the generated serialization. The processor emits one codec per type reachable
from the slice's method signatures, so `QuoteRequest` and `Quote` cross the network without
you writing or annotating anything.
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
knows, and the loader checks it: a slice built by a different Aether version, whose factory
signature does not match, is rejected with a named error that tells you to build it with the
same Aether version as the runtime, rather than failing deep inside reflection. Your own factory, with its real parameters, is called by the
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
- **Stop.** On shutdown or redeploy the runtime calls `stop()`, which asks the
  resource provider to release every resource the slice provisioned, closing each through its
  `AsyncCloseable` or `AutoCloseable`; a resource that implements neither is not closed. The
  hook is always generated.

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
public static Promise<Ordering> ordering(SliceCreationContext ctx) {
    return Promise.all(
        ctx.resources().provide(SqlConnector.class, "database"),
        ctx.resources().provide(Publisher.class, "messaging.order-events", provisioningContext())
    ).map((db, events) -> Ordering.ordering(db, events));
}
```

Each `provide` call looks up a config section, builds the resource (a pooled connection, a
configured client, a topic publisher), and hands it back; `Promise.all` waits for all of
them; your factory receives them as the parameters you declared. In the manifest these
appear as `resource.*`, `stream.publisher.*`, `stream.access.*`, and `publish.topic.*` entries, so the runtime
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

At start the runtime reads these entries and drives the named method. A method carrying a qualifier of type `Scheduled` (for example
your own `@Heartbeat`) is called on a schedule; a subscriber method is called for each message; a PG-notify method
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

- **The slice's own defaults** ship in its jar as `META-INF/resources.toml`. Topics, stream
  settings, feature flags, business thresholds: the settings that are part of the app
  wherever it runs. They are local to each node and are the fallback for any key the
  deployment does not set.
- **Node** is the infrastructure configuration on each machine, in `aether.toml`. Database
  hosts, endpoints, credentials: the facts that differ between a laptop, staging, and
  production. It overrides the slice's defaults.
- **Operator changes** made through the management API are stored in the cluster's
  consensus store and override both.

The runtime applies them in that order of precedence, so a value set closer to the
deployment replaces the same value set in the slice's defaults. (A `slices/<Name>.toml`
file is a different thing: the blueprint generator reads it at build time to set the
slice's instance count, and it is not a configuration layer.)

Values written as `${secrets:orders/db-password}` are resolved at load time from the
platform's secret store, so credentials live there rather than in the blueprint.

This split is what makes "configuration change, not code change" concrete. The app's own
settings ship with the app; the environment's facts live on the node; moving from staging
to production changes node config and touches nothing else. Operators can also change
configuration on a running cluster through the management API, and the update propagates
through the cluster's consensus store. What that changes is the stored configuration, not
a running slice: every resource a slice holds was built from the values current when it
was provisioned, and in the form described here nothing rebuilds it when those values
change. A slice that wants to react to a change declares an update method for the section;
otherwise it sees new configuration when it is next reloaded.

Through all of this, the slice reads nothing. It declares a qualifier, the runtime reads
the merged configuration, builds the resource, and hands it over. Configuration is the
runtime's input, never the slice's concern.

## Configuring behavior: the provisioned step

That last claim holds while configuration is values. It stops holding the moment a setting
decides *what* the application does rather than what it does it with.

The orders spine has both kinds. A pool size, a payment timeout, a maximum order amount are
values, and the code that uses them does not change shape when they change. A setting like
`express-shipping = true` is different in kind. Something has to read it and choose, and the
choosing lands inside a method that would otherwise be a straight sequence of steps:

```java
if (config.expressShipping()) {
    return expressQuote(order);
}
return standardQuote(order);
```

That is a small ugliness with a long tail. One of those branches is unexercised on any given
deployment, and flags multiply: three of them make eight combinations, of which a team tests
two and ships all eight. Configuration has also become the slice's concern, which is the one
thing the previous section said it never is.

Part 0 drew the line this sits on: a plain interface as a factory parameter is assembling,
the same parameter carrying a resource qualifier is provisioning. A qualifier does not have
to name a runtime type. It can name yours.

```java
@ResourceQualifier(type = ShippingQuote.class, config = "shipping")
@Retention(RUNTIME) @Target(PARAMETER)
public @interface ShippingQuotes {}
```

`ShippingQuote` is an ordinary interface of your own, shaped to what the use case needs and
nothing else. The slice declares it as a parameter and calls it. There is no flag in that
code and no branch, because which implementation arrives was decided before the slice ran.
A parameter of your own type, carrying a qualifier, is a **provisioned step**: assembled
like your own code, provisioned like a resource.

What decides it is a factory you write, registered in the slice's jar under
`META-INF/services` and found by the runtime:

```java
public class ExpressQuoteFactory implements ResourceFactory<ShippingQuote, ShippingConfig> {
    public Class<ShippingQuote> resourceType() { return ShippingQuote.class; }

    public Class<ShippingConfig> configType() { return ShippingConfig.class; }

    public boolean supports(ShippingConfig config) { return config.express(); }

    public Promise<ShippingQuote> provision(ShippingConfig config) {
        return ExpressQuote.build(config.carrier(), config.cutoff());
    }
}
```

Three things there are the pattern doing its work. The configuration arrives **parsed**:
`configType()` names a record, the runtime binds the `[shipping]` section to it before the
factory runs, and a malformed section fails there rather than inside a request. **`supports`
is where the choosing went**: several factories may offer `ShippingQuote`, the runtime asks
each whether it handles this configuration, and `priority()` breaks a tie, so the `if` that
was in the slice is now a question asked once at provisioning. And **`provision` returns a
`Promise`, which means assembly can fail**. Configuration goes in and a working step comes
out, so configuration that cannot produce one fails the deployment: a missing carrier code
becomes a deployment that does not start, while somebody is watching, instead of a failure
on an order at three in the morning.

A `ConfigurationSection` parameter and a provisioned step are two levels of one mechanism.
The first hands the slice a section to interpret; the second hands it something already
built. Same qualifier, same provisioning, same merge order. The only difference is how far
the runtime carries the work before the slice takes over, and the names say which is which:
a section sounds like something you read, a step sounds like something that runs.

That difference matters because of a property both levels share, and which the previous
section stated: neither refreshes as a parameter. A resource is built once, from the configuration current
at that moment. For a section this is easy to forget, because a thing called configuration
sounds live. For a provisioned step the name carries the truth, since it was assembled once
and it is what it was assembled into.

That is the form to learn first, and build-once belongs to the form rather than to the
runtime: the mechanism will gain a form that does refresh. Saying so now costs nothing,
because what makes a provisioned step safe was never that it holds still. It is the type,
and the type does not care how often the step behind it is rebuilt.

The line to hold is about which settings earn this. If a setting selects which of several
behaviors runs, provision the behavior; if it parameterizes one behavior that runs
regardless, pass the value. `max-order-amount` stays a number, because one check always runs
and the setting is its threshold. `express-shipping` becomes a step, because it picks between
two ways of quoting. Applied to every scalar this would be absurd; applied to the settings
that fork the code, it removes the fork.

The type is what keeps it safe. Because the unit is a step and the use case names its type,
configuration can change how the step works and never what it is, so the compiler bounds
what any setting you add is able to reach.

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
statuses. `default` is the fallback for causes no pattern claims, except that a transient
cause answers 503 and a validation cause 422; the processor warns at build time about
concrete `Cause` types no pattern reaches. A pattern matches against the returned `Cause`'s
type name, which is why a case that needs its own status is its own type, `OutOfStock` or
`PaymentDeclined`, rather than one constant of a shared enum: every constant of an enum is
the same type, so they cannot map to different statuses.

The processor compiles this into the manifest and a generated `OrderingRoutes` class.
In the manifest each route is fully resolved (the entry also carries a `route.0.version`, omitted here):

```
route.0.handler=placeOrder
route.0.method=POST
route.0.path=/api/v1/orders/
route.0.security=public
```

When a request arrives, the router matches its method and path to a route, decodes the
path parameters and body into the request type with the generated codec, and calls the
slice method through the dispatch table described in the anatomy section above. A success is
serialized to the route's response media type, JSON by default, and an empty result becomes
a 204. A returned `Cause` is mapped to its HTTP status and rendered as an RFC 9457 `ProblemDetail`
body (served as `application/json`); a request that matches no route becomes a 404 in the same shape.

That closes the machine. You write an interface, a factory, and a `routes.toml`. The
processor writes the factory bridge, the `Slice` wrapper with its dispatch table and
codecs, the manifest, and the routes class. The runtime reads that manifest as data and,
for every request, decodes, dispatches, and encodes, while your method does the one thing
it was written to do: return a `Promise`. Part II builds slices in earnest, and Part III
puts them to work on the problems that fill a real system.
