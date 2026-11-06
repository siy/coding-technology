# Part VI — Under the hood

> You do not need any of this to build with Aether; every earlier part stands without it. This
> part opens the machinery those parts relied on, for when you want to know what runs beneath
> your slice.
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
your own `@Heartbeat`) is called on a schedule; a subscriber method is called for each message. A database-notification method is declared the
same way, but the runtime half is not wired at this release (Module C). Each kind produces its own reactive entry, with
its own category and config section.

Some resources use only one side. A SQL connector or an HTTP client is parameter-only,
because the slice always initiates. A scheduled task is
method-only, because the runtime always initiates. Pub-sub and streams use both: a
`Publisher` parameter to send and a subscriber method to receive; a `StreamPublisher` or
`StreamAccess` parameter to write and read, and a `StreamSubscriber` method to consume. The
two mechanisms are independent, and a slice mixes them freely.

One more parameter kind rounds out assembly. A factory parameter that is another `@Slice`
interface is wired as a remote proxy, so calling it routes across the cluster; a plain
interface that has its own factory is wired locally and called in place. The bridge
resolves each parameter by what it is, resources from configuration, slices to proxies,
local interfaces to direct calls, and your factory only ever sees the finished handles.
