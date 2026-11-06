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

## The manifest, read by its consumers

The manifest is the whole contract between the build and the cluster, and no single component
reads all of it. The file is flat, and each reader filters it by key prefix, taking the keys for
its own stage and ignoring the rest. Following each kind
of key to the code that reads it is the quickest way to see what the runtime does with your slice
before your code runs.

The `slice.*` keys, the class lists (`impl.classes`, `request.classes`, `response.classes`) and
`dependency.*` serve the build. `SliceManifest` in the JBCT core models them for the Maven plugin,
which packages each slice into an artifact of its own. `config.file` belongs here too: it names
`slices/<Name>.toml`, the blueprint generator's input that Part I separated from configuration.

The `resource.*` entries carry a type and a config section, and the cluster reads them at deploy
time, before any node loads anything. `BlueprintService` parses each slice jar's manifests into a
topology with `TopologyParser` and hands every resource dependency to
`ConfigSectionPreflightValidator`, which refuses the blueprint if a declared section is absent from
every layer the loader would consult for that slice. The generated bridge's `provide` calls still
do the provisioning; the manifest entries are what let the cluster check, once and for the whole
blueprint, that those calls will find their sections. The check is narrow on purpose. It covers
resource dependencies only, leaving topics and streams to their own validation, and it reads the
node composite of the one node that runs the check (the source calls it the leader's), so a section
missing from any other node's file passes it. The same parse records the `publish.topic.*` entries as the slice's publishes,
which the blueprint's pub/sub pre-flight reads.

Activation reads a different set. When a slice activates, the node's deployment state
(`NodeDeploymentState`) reads the `reactive.*` and `stream.*` entries and publishes the slice's
legs to the cluster's store: topic subscriptions, stream registrations, scheduled tasks, stream
references. On unload it runs the matching unpublish steps. (`SliceLegBuilders` is the equivalent
in the replacement deployment engine, which at rc5 is a test and development switch and off by
default.) A
slice carries one manifest per interface under `META-INF/slice/`, and one that cannot be read is
logged and skipped, so the slice activates without the legs that manifest declared. The
`reactive.*` entries of category `config-update` have one more reader, the configuration path at
the end of this part.

Two keys show the format being designed rather than accumulated. `json.settings.section=json`
sits outside both `resource.N` and `reactive.N` deliberately, so the deploy pre-flight never
demands a `[json]` section and the route-coverage readers never see it as a handler. And the
manifest has no generation timestamp. A timestamp makes the jar differ on every build, and a
write-once artifact repository then refuses a rebuilt jar of an unchanged commit, so the processor
leaves it out.

## Inside the resource provider

Every `provide` call a generated bridge makes ends in one class, `SpiResourceProvider`, and in one
map inside it. Reuse, isolation between slices and release on stop are all properties of that
map's key, so the key is the thing to understand.

Before the call reaches the provider it passes a short chain of wrappers that
`SliceLoadingContext` builds for each slice. The outermost attaches the slice's configuration
composite to the call's `ProvisioningContext`, and when a composite exists it upgrades a plain
`provide(type, section)` into the context-carrying overload. The next adds the slice's own codec as
the serializer, so a stream publisher or a cache resolves your record types rather than only the
framework's. The innermost stamps the slice's identity onto the context. Below the chain sits
either a slice-scoped overlay or the node's provider.

The overlay exists for the provisioned step. The node's provider discovers factories once, at
boot, with a `ServiceLoader` scan through the thread-context classloader, indexes them by resource type and
sorts each list by `priority()`, highest first. A factory that ships inside your slice jar is
defined later, by the slice's classloader, so that scan cannot see it. `SliceScopedResourceProvider`
reads the slice jar's `META-INF/services` with the slice's loader, keeps only the factories that
loader itself defined, and is consulted before the node provider. It keys by `Class`, never by
name: the generated bridge's type literal and your factory's `resourceType()` both come from the
slice loader, so identity matches, while a name match would hand back a node-loader instance and
fail on the cast.

Selection then runs in two steps, and the order matters for anyone writing several factories for
one type. The provider binds the section **once**, using the config type (or the section binder)
of the highest-priority factory, and then asks each factory in priority order whether it
`supports` that bound value; the first that does provisions. Factories competing for one resource
type are therefore competing over one configuration record. Give them the same config type, and
let `supports` read a field of it, which is the shape Part I's `ExpressQuoteFactory` already has. When no factory accepts, provisioning fails with `ResourceFactoryNotFound`.

A failed provision is classified for the deployment machinery rather than passed through. A
transient capacity shortage becomes an intermittent `ResourceUnavailable`, which the deployment
retries with backoff; anything else becomes a fatal `ResourceCreationFailed`. A missing section is
a `ConfigurationFailed`, with two named exceptions: a topic publisher whose section is absent gets
a topic named after the section, and the implicit `[json]` section binds to its defaults when no
composite exists to read it from.

Now the key. The cache maps `(resource type, config section, scope)` to the promise of the
provisioned resource, and the scope is the slice identity the innermost wrapper stamped, or the
fixed `<unattributed>` scope when a call arrives with no identity. Within one slice, two
parameters that ask for the same type from the same section receive one instance. Two slices that
name the same section receive two, and that is deliberate on two counts: a resource built with
one slice's codec cannot encode another slice's record types, and a topic publisher derives its
namespace from the slice that provisioned it. The entry is inserted with `computeIfAbsent`, and a
provision that fails removes its own entry before the caller's continuation sees the failure, so a
retry provisions afresh instead of receiving the memoized failure.

Release reverses the path. The generated `stop()` calls `releaseAll` with a coordinate fixed at
compile time, which has no version in it, because the annotation processor cannot know the version
the slice will be deployed under. The identity wrapper therefore substitutes the deployed artifact
it provisioned under and logs the disagreement, which keeps already-compiled jars working without
a rebuild. The provider detaches each entry of that scope with a conditional remove, so exactly
one releaser closes a given entry, and closes it through the factory that built it rather than the
first factory registered for the type. That distinction is real for SQL connectors, where several
factories answer for one type. The closes are collected with `Promise.allOf`, so one resource that
fails to close is logged and the rest are still released. The `<unattributed>` scope is closed
only at node shutdown, since no single slice's unload can tell that nobody else holds it.

`SliceStore` puts that release into an order. On unload it first releases the slice's
configuration subscriptions, then calls `stop()` if the slice is active, under the store's
start/stop timeout, and only then unregisters the slice and closes its classloader.

## How configuration reaches a running slice

Configuration on a node is three providers stacked by two calls, and a change to it travels as a
key name. Nothing carries the new value to your slice; whoever is told re-reads it through the same
stack the slice was provisioned from.

The node half is built once, at boot, in `SliceRuntimeAssembly`. The node layer is the node's
configuration provider: its TOML file, with `AETHER_` environment variables and `aether.` system
properties above it. Over that sits the operator overlay, a `DynamicConfigurationProvider` built
over an empty base, so it holds operator writes and nothing else. `LayeredConfigProvider` stacks
the two with the overlay first, and the result becomes the node-wide `ConfigService`.

The slice half is built at load. `SliceStore` reads `META-INF/resources.toml` from the slice's own
jar alone, rather than through the slice's classloader, which would answer from the first
dependency jar that ships the file. It flattens the file into a provider and places the node
composite above it. Lookup through the stack is first-wins **per key**, and the section binder
reads key by key, so an operator who overrides one key of a section leaves its other keys
answering from below. At load the store logs, by name and never by value, each key of yours that a
deployment value shadows. A `resources.toml` that does not parse leaves the slice with no
composite at all, and provisioning then falls back to the node-wide service.

Secrets are resolved at two of the three layers, each eagerly and each all-or-nothing. The node's
file is resolved at boot, and a placeholder that fails to resolve, or one present on a node with
no secrets provider, refuses the boot instead of serving the placeholder text as a value. Your
`resources.toml` is resolved at load with the same resolver, and one failed placeholder drops your
entire file's layer, so a section declared only there fails at provisioning as not configured. The
deploy pre-flight does not resolve that layer's placeholders, which is why such a section passes
the pre-flight and fails later. The overlay has no resolver attached in the assembly: what an
operator writes is what the slice reads.

An operator change takes this path. The management API hands the key and value to
`DynamicConfigManager`, which proposes a put to the cluster's consensus store, cluster-wide or
scoped to one node. When the put commits, each node's `onConfigPut` applies it (on a worker, when the replica
feed delivers the committed put) if it is cluster-wide or names that node, writes it into the overlay, and then calls its applied-listeners
in registration order with the dotted key. The overlay write comes first, so a listener that reads
sees the new value. Two listeners are registered, the `Watched` feed first and the update-method
dispatch second.

One is the update method Part I mentioned. At activation, `ConfigUpdateSections` collects
the sections a slice registers for: the section of each `config-update` reactive entry, and `json`
for a slice with routes. `ConfigNotificationManager` finds the factory's generated static
`notifyConfigUpdate` by reflection and calls it once per section straight away, so the method sees
the current values before any change. A committed change is then dispatched on a single
`config-notification` thread: for each registered slice and each section that, followed by a dot,
is a prefix of the changed key, it builds a facade over that slice's composite and invokes the method. The generated
body re-parses the section into your record and calls your method; a parse failure is logged and
your method is not called. The generated code does not compare the record with the previous one,
so a change to a key whose value parses identically still reaches your method.

The other feeds `Watched`, reached through `ctx.config().watched(section, binder)`, with
`Live` over it for pull access. Its subscriptions do compare: each delivers serially on its own
virtual thread, binds against one consistent state of the overlay, collapses a burst of changes to
the latest, and skips a record equal to the last one delivered. A callback runs under a timeout,
30 seconds unless `config.watch.callback.timeout` says otherwise. Deliveries continue until the
slice unloads, including after `stop()`, so a callback must tolerate resources that are already
closed. A facade that has no feed behind it refuses `watched` with a named cause rather than
returning a subscription that never changes.

Neither listener touches the provider's cache. That is the mechanism under Part I's statement that
a provisioned resource is built from the values current when it was provisioned: the cache entry
for `(type, section, scope)` holds until `releaseAll` detaches it, and no configuration path
reaches `releaseAll`. What a change can reach is a record, through a method you declared or a
subscription you made.

The overlay itself is one more value held in the cluster's store, and the store, the consensus
that commits to it and the nodes that share it are the next layer down.

## The path of a call between slices

The assembly section ended on one line: a factory parameter that is another slice becomes a
remote proxy. That proxy is the start of every call one slice makes to another, and the whole path
from it to the target method and back is short enough to follow class by class. Take an `Ordering`
slice whose factory asks for the `OrderQuote` slice from the anatomy section. The processor writes
a proxy record into `OrderingFactory`, one `MethodHandle` per method of the dependency:

```java
record orderQuote(MethodHandle<Quote, QuoteRequest> quoteHandle) implements OrderQuote {
    @Override
    public Promise<Quote> quote(QuoteRequest request) {
        return quoteHandle.invoke(request);
    }
}
```

The handle itself is requested while the factory assembles, alongside the resources:

```java
ctx.invoker().methodHandle("com.shop:orders-order-quote:1.0.0", "quote",
                           new TypeToken<QuoteRequest>() {},
                           new TypeToken<Quote>() {}).async()
```

The coordinate is the dependency's full artifact, version included, fixed at build time. A method
with several parameters gets a small generated request record that packs them, so every handle
takes exactly one value. At activation the runtime asks each handle to materialize, which checks
that at least one node has published an endpoint for that artifact and method. A dependency that
has not published yet fails activation as an intermittent condition ("not published yet"), not a
fatal one, because slices in a blueprint activate concurrently and the order is a race.

Calling `quote` on the proxy calls `MethodHandle.invoke`, which hands the artifact, the method
name, the request and the response type to the node's `SliceInvoker`. Everything from here on is
that one class, plus the network and the receiving node's `InvocationHandler`.

**Choosing an instance.** The invoker reads the endpoint registry, an in-memory index fed from
the cluster's replicated key-value store. When a slice becomes active on a node, that node writes
one row naming itself, the artifact and the list of method names taken from the slice's
`methods()`. Every node's registry turns those rows into endpoints. Selection takes the endpoints
for the exact artifact and method, sorts them by node id, removes any node that cluster membership
no longer considers reachable, and picks the next one round-robin, with a counter per artifact
and method. The local node is one candidate among the others, with no preference; the invoker has a
cache-affinity hook that could bias the pick, and nothing registers it at rc5. While a
deployment is shifting traffic between two versions the pick is weighted instead; that belongs to
rolling updates. If nothing is left after filtering, the call fails at once with
`No endpoint found for slice/method`.

**The same node.** When the pick lands on the calling node, no frame is sent, but the call still
goes through bytes. The caller's codec encodes the request, the target slice's bridge receives the
bytes, and the response bytes are decoded by the caller's codec again. The reason is class
loading: each slice lives in its own classloader, so `QuoteRequest` built by `Ordering` is a
different `Class` object from the `QuoteRequest` that `OrderQuote` knows, and handing the object
across would fail. On this path the invoker arms no timer of its own; the call waits as long as
the method runs.

**Another node.** When the pick is remote, the invoker encodes the request with the caller's own
codec, generates a correlation id, and records a pending invocation keyed by that id and indexed
by target node. It arms the caller's wait: the configured invoker timeout (20 seconds by default,
`timeouts.invocation.invoker_timeout`), or less if the incoming request's budget has less left.
Then it builds an `InvokeRequest` and sends it:

```java
record InvokeRequest(NodeId sender, String correlationId, String requestId,
                     Artifact targetSlice, MethodName method, byte[] payload,
                     boolean expectResponse, int depth, int hops, boolean sampled)
```

The request id and depth carry the trace across the hop; the budget itself does not travel, so
the receiving node applies its own limit. The send passes the caller's wait along with the frame.
If the peer is momentarily disconnected, the transport may buffer the frame, and it drops it on
reconnect once that wait has passed, rather than delivering work whose caller has already given
up. The invoker does not read the transport's write outcome, so a frame the transport refused
shows up to the caller as a timeout, not as a send error.

**Dispatch on the target.** On the receiving node the message router delivers `InvokeRequest` to
`InvocationHandler.onInvokeRequest`, which restores the request id, depth and sampling flag as
the ambient context and looks up the local bridge for the exact artifact. The bridge was built
when the slice was registered: `DefaultSliceBridge` wraps the generated `Slice`, keeps a map from
method name to the `SliceMethod` entries of `methods()`, and holds the slice's codec. An
`AdmittedSliceBridge` wraps that in turn, and every call first passes its admission gate; a node
that is draining refuses new work there. Admitted, the
bridge looks up `quote` in the map, decodes the payload with the slice's own codec, calls the
`SliceMethod`, which is `delegate::quote` from the generated wrapper, and encodes the result. The
reply is bounded on this side too: the `AdmittedSliceBridge` timer, `timeouts.invocation.timeout`
(15 seconds by default), fails the reply when the method runs longer. It bounds the reply, not the
execution, so the method keeps running.
Failures the bridge itself produces are tagged as slice defects, separately from failures your
method returns: a method name not in the map, a codec that throws, a method that throws instead of
returning a failed `Promise`. That split is what lets the leader tell a broken version from a
business outcome.

**The way back.** The handler answers with an `InvokeResponse` carrying the same correlation id,
a success flag and a payload. On success the payload is the encoded result. On failure it is
text: the UTF-8 bytes of the cause's client message. Back on the caller the router delivers the
response to `SliceInvoker.onInvokeResponse`, which removes the pending entry by correlation id,
decodes a success with the caller's codec, and resolves the `Promise` that `quote` returned.

What the caller receives when something goes wrong follows directly from that path, and it is
worth knowing exactly:

| What happened | What the caller's `Promise` fails with |
|---|---|
| No reachable endpoint at selection | `No endpoint found for slice/method` |
| No response within the caller's wait (at the defaults this needs a lost frame or an unresponsive node, because the callee's own limit is shorter) | `CoreError.Timeout`, "Promise timed out after N ms" |
| Target node removed or decommissioned by membership | "Target node … departed", at once, without waiting for the timer |
| The callee's method failed | `RemoteInvocationError`, "Remote invocation failed: " plus the client message |
| The callee's method runs past the callee-side limit (15 s by default, shorter than the caller's 20 s) | `RemoteInvocationError`, "Remote invocation failed: Promise timed out after 15000ms"; the method keeps running |
| The slice is not on the target (moved between pick and arrival) | `RemoteInvocationError`, "Slice not found: …" |
| The target is draining | `RemoteInvocationError` with the draining message |
| The response does not decode | the codec's failure |

Three of these rows deserve a sentence each. A timeout means the outcome is unknown, not that the
call failed: the callee may never have received it, may still be running it, or may have finished
with the answer lost. A response that arrives after the timer fires finds no pending entry and is
logged and dropped. The departure row is a fast failure, not a retry; the call path above sends
each request once, to one node, and retries nothing. If an operation must survive these, make it
safe to repeat and declare the retry where Module C puts cross-cutting behavior.

The callee row is the one that surprises people. The callee's `Cause` does not cross the wire;
only its client message does, as text. Your sealed error type on `OrderQuote`'s side arrives at
`Ordering` as a `RemoteInvocationError` holding a string. A caller that needs to branch on what
went wrong cannot match on the callee's failure type; it needs that outcome in the response
type itself, as a value the codec carries.

## What crosses the wire

A cross-node call is two encodings, one inside the other. The outer one is the envelope:
`InvokeRequest` and `InvokeResponse` are runtime protocol messages with their own generated codec
and fixed wire tags. The inner one is the payload, a byte array the envelope carries without
looking inside, produced by the codec the slice processor generated for your types.

That inner codec is the `codec()` method from the anatomy section. When the runtime registers a
slice it calls `codec(nodeCodec)`, and the generated body returns
`SliceCodec.sliceCodec(parent, List.of(...))`: a registry layered over the node's own codecs,
holding one `TypeCodec` per type the slice transmits. Each entry is four things: the Java class, a
wire tag, a writer and a reader. For a record the writer writes each component in turn through
the same registry, so nested records, lists and options recurse through it.

An abridged entry; the generated code spells the types fully qualified and writes out the reader:

```java
new SliceCodec.TypeCodec<QuoteRequest>(QuoteRequest.class,
    SliceCodec.deterministicTag("com.shop.orders.OrderQuote.QuoteRequest"),
    (codec, buf, val) -> {
        codec.write(buf, val.sku());
        codec.write(buf, val.qty());
    },
    /* reader: the components back, in the same order */)
```

"Types the slice transmits" is wider than its own method signatures. The list also covers, among others, the
request and response types of every slice it depends on, which is why `Ordering`'s codec can
encode a `QuoteRequest` even though `QuoteRequest` belongs to `OrderQuote`.

**How a codec is found.** Writing a value looks its class up in the registry. An exact
registration wins; failing that, the registry walks to the most specific registered supertype,
which is how an immutable list implementation class finds the codec for `List`. The walk is
deterministic, so every node resolves the same class to the same codec, and a tie between
unrelated interfaces fails loudly rather than picking one. The writer then emits the codec's tag
followed by the body. Reading is the reverse: read a tag, look it up, let that codec read the
body. A tag the registry does not know fails with `UnknownTypeTagException`, a distinct error so
that "the peer sent a type I do not have" is told apart from a corrupt frame.

**Where tags come from.** Tags are variable-length integers, one byte up to 127, two up to 16,383,
three beyond. The space is split in two. The system range, 0 to 16,383, is assigned by hand to the
runtime's own protocol types and never reused; the two invocation messages hold 642 and 643. The
user range, 16,384 up to about two million, is where your types land: the tag is an FNV-1a hash of
the fully qualified class name. The ranges are disjoint, so a slice type can never collide with a
runtime type, and each slice's registry is separate, so two slices' types never meet. The only
possible collision is two types within one slice hashing to the same tag. The slice processor
checks that at compile time and fails the build naming both types; the registry checks it again
at load.

Deriving the tag from the name is what makes the classloader isolation above work. `Ordering`
encodes its own copy of `QuoteRequest`, and `OrderQuote` decodes into a different `Class` object
with the same name. Neither side needs the other's classes. They agree on the bytes because they
agree on the name. The payload carries no field names and no header of its own: a tag, then the
fields, each preceded by its own tag. What that means for changing a record that another slice
reads (which edits are free, which fail loudly, and the one that passes silently) is set out in
"Inside the cluster: the codec's rules" in Part II, Module F.

**Framing.** The envelope, payload inside, is encoded once more by the node's serializer and
written as one frame on the peer connection. Nodes talk over QUIC, and each peer connection
carries a fixed set of lanes, each its own stream: consensus, key-value, metrics, invocation and
a few more. Slice calls ride the invocation lane, so a burst of application traffic does not
queue behind, or in front of, the cluster's consensus rounds. Within a lane, each frame is a
4-byte length followed by the encoded message, and the decoder accepts frames up to 32 MiB. A
zero-length frame is reserved to mark the end of a lane, so a message that encodes to nothing is
refused before it is written.

From the proxy's `quoteHandle.invoke(request)` to the bytes on the lane and back, every step is
either generated or a named class in the runtime. The registry that steers the pick and the
membership that filters it are the next layer down.

## The cluster beneath the slice

> _Status: outline. These sections wait for runtime work that is landing now (the node hierarchy
> rewrite, the deployment state machine replacement, and the streams storage work), so that the
> book describes the machinery that ships rather than the machinery being replaced._

- **Agreement.** How the core nodes agree on cluster state, and which decisions go through that
  agreement and which do not.
- **The cluster's own store.** The key-value state the runtime keeps about itself: what lives
  there, who writes it, and how a node learns that it changed.
- **Core, community, worker.** The three node tiers, what a community's governor decides, and
  what only the core decides.
- **From blueprint to running instance.** The deployment state machine that turns a deployed
  blueprint into instances on nodes.
- **Where a stream's events live.** The storage beneath a stream partition, below what Module B's
  stream material in Part II shows.
