# Part I — The Aether model

Part 0 made the case that infrastructure and business logic are different kinds of code, and
Part VI, for those who want to open the hood, shows the machinery that keeps them apart. This part is
where you start building. The working model is three commitments. A slice is plain Java with an
explicit contract. The three environments you will meet run the same slice code; what differs
is what lies underneath it, the network and with it timing and the ways a call can fail. And the runtime's guarantees are bought with one design habit,
idempotency. Everything in the playbook that follows assumes these three, and nothing in them
requires a cluster on your desk.

## Your first slice

In Part 0 you saw `placeOrder` as a plain JBCT use case. Making it a deployable unit on
Aether takes one annotation and one factory method. Nothing about the business logic
changes.

A slice is a Java interface marked `@Slice`. It declares its methods, nests the types
they speak in, names its failures, and ends with a factory that lists what it needs:

```java
@Slice
public interface Ordering {
    Promise<OrderPlaced> placeOrder(PlaceOrder request);

    record PlaceOrder(CustomerId customer, List<LineItem> items) {}
    record OrderPlaced(OrderId id, Money total) {}

    sealed interface OrderError extends Cause {
        record OutOfStock(Sku sku) implements OrderError {
            public String message() { return "Out of stock: " + sku.value(); }
        }
        record PaymentDeclined(String reason) implements OrderError {
            public String message() { return "Payment declined: " + reason; }
        }
    }

    static Ordering ordering(Inventory inventory, Payments payments) {
        return request -> inventory.reserve(request.items())
                                   .flatMap(reserved -> payments.charge(request.customer(), reserved))
                                   .map(OrderPlaced::from);
    }
}
```

Read it from the bottom. The factory's parameters, `Inventory` and `Payments`, are the
slice's declared dependencies: everything it needs from the outside world appears in one
place, checked by the compiler. Because the interface has a single method, the factory
returns a lambda that implements it, so there is no `OrderingImpl` to write or keep
in sync. The body is the pipeline from Part 0, unchanged. `Inventory` and `Payments` are
other slices, and you call them as ordinary method calls; reaching them and choosing the
instance that serves each call are the runtime's job, and the call behaves the same
wherever they run. The runtime sends each call once. Asking again after a failure is
declared on the method (Part II, Module C) or done by the caller.

That is the whole contract. Three rules hold every slice together:

- Every method returns `Promise<T>`. A caller composes a local step and a cross-slice
  call the same way, because both hand back a `Promise`.
- Request, response, and error types are nested in the interface, so the contract travels
  as one unit. You do not annotate them for serialization; the runtime generates the
  codecs.
- Failures are a sealed interface extending `Cause`: the same knowledge-as-values
  discipline from Part 0, now carried across the network intact.

Read the failure list the way you read the happy path, because it is one. `placeOrder`
runs to gather enough knowledge to answer, and "the card was declined" is enough
knowledge to answer. It is not an accident to log and apologize for; it is a result the
caller pattern-matches, delivered with the same fidelity as `OrderPlaced` no matter how
many nodes sit between. The habit worth unlearning is the error channel as the place
where information goes to die. Here it is half of the API, and later parts lean on that:
a compensation decision, a retry policy, an HTTP status all dispatch on which failure
came back, which only works because the failure kept its type on the way.

The contract traveling as one unit is a rule with an organizational reason, so it is
worth making the reason explicit. Whoever can read the interface can read all of it —
what goes in, what comes out, every way it fails — without opening a second file or a
schema registry. A reviewer sees a contract change in one diff. A calling team depends
on the interface and nothing else. The compiler, not a wiki, is what keeps caller and
callee agreeing. One file is not a tidiness preference; it is where the coordination
cost of a distributed team goes to shrink.

Most services are not one method. A slice with several follows the same shape with one
change: the factory returns a small local record that captures the dependencies and
implements the interface.

```java
@Slice
public interface Shipping {
    Promise<Shipment> arrange(OrderId order);
    Promise<Unit>     cancel(ShipmentId shipment);

    record Shipment(ShipmentId id, OrderId order, Carrier carrier) {}

    sealed interface ShippingError extends Cause {
        record NoCarrierAvailable(OrderId order) implements ShippingError {
            public String message() { return "No carrier available for: " + order.value(); }
        }
    }

    static Shipping shipping(CarrierDirectory carriers) {
        record shipping(CarrierDirectory carriers) implements Shipping {
            @Override public Promise<Shipment> arrange(OrderId order) {
                return carriers.pick(order)
                               .map(carrier -> new Shipment(ShipmentId.random(), order, carrier));
            }

            @Override public Promise<Unit> cancel(ShipmentId shipment) {
                return carriers.releaseBooking(shipment);
            }
        }
        return new shipping(carriers);
    }
}
```

The record is local to the factory, named after it in lower case, and never leaves.
`CarrierDirectory` here is not a slice; it is a plain interface with its own factory, a
local dependency the way Part 0 defined assembling. Still no separate implementation
class, still one file carrying contract and construction together, and nothing else
changes: the same nested types, the same sealed failures, the same rule that dependencies
appear as factory parameters and nowhere else.

One more thing happened when you wrote `@Slice`, and it happened at compile time. The
slice-processor read the interface and generated the companion class that lets a node
host it: the wiring that resolves the factory's parameters, the dispatch table for its
methods, the codecs for every nested type. None of it needs your attention while
building, all of it is inspectable Java when you are curious, and Part VI walks through
every generated line. What matters here is the direction of authority: the contract you
wrote is the whole input. There is no configuration class, no serialization annotation
on the request types, no registration step to forget — a slice that compiles is a slice
the runtime knows how to host.

You do not need a cluster to run this. A slice is plain Java, so you exercise it as plain
Java, passing lambdas where the real dependencies will go:

```java
@Test
void placeOrder_succeeds_whenStockIsAvailable() {
    Inventory inventory = items -> Promise.success(new Reservation(items));
    Payments  payments  = (customer, reservation) -> Promise.success(new Charge("CH-1"));

    Ordering.ordering(inventory, payments)
                .placeOrder(sampleOrder)
                .await()
                .onFailureRun(Assertions::fail)
                .onSuccess(placed -> assertNotNull(placed.id()));
}
```

No container starts and no mocks are configured. The factory wires the lambdas, the chain
runs, and you assert on the result. Tests like this are instant because there is nothing
to boot.

The failure path is tested the same way, and testing it this way is the first payoff of
failures-as-values: a declined payment is not an exception to trap but a value to hand
back, so the test reads like the happy path with a different answer.

```java
@Test
void placeOrder_reportsDecline_whenPaymentRefuses() {
    Inventory inventory = items -> Promise.success(new Reservation(items));
    Payments  payments  = (customer, reservation) ->
            new OrderError.PaymentDeclined("insufficient funds").promise();

    Ordering.ordering(inventory, payments)
                .placeOrder(sampleOrder)
                .await()
                .onSuccess(placed -> fail("expected a decline"))
                .onFailure(cause -> assertInstanceOf(OrderError.PaymentDeclined.class, cause));
}
```

Two lambdas, one of them refusing, and the whole failure route of the pipeline is under
test without a network, a container, or a mock of anything. Part III builds a testing
practice on this foundation; for now the point is that the contract you just wrote is
already exercisable, in full, before any runtime enters the picture.

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
statuses. `default` is the fallback for causes no pattern claims, except that, where no pattern set a status, a transient
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
slice method through the dispatch table described in the anatomy section of Part VI. A success is
serialized to the route's response media type, JSON by default, and an empty result becomes
a 204. A returned `Cause` is mapped to its HTTP status and rendered as an RFC 9457 `ProblemDetail`
body (served as `application/json`); a request that matches no route becomes a 404 `ProblemDetail`
body, served by the ingress as `application/problem+json`.

That closes the request path. You write an interface, a factory, and a `routes.toml`. The
processor writes the factory bridge, the `Slice` wrapper with its dispatch table and
codecs, the manifest, and the routes class. The runtime reads that manifest as data and,
for every request, decodes, dispatches, and encodes, while your method does the one thing
it was written to do: return a `Promise`. The rest of this part configures a slice and places it
in its environments, and Part II puts slices to work on the problems that fill a real system.

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

## Ember, Forge, and Aether

Your slice's code runs unchanged from your laptop to production. Three names cover how you
meet it along the way.

**Ember** is the single-process runtime: it runs the whole cluster inside one JVM, with
the nodes reaching each other over localhost. Startup is immediate and you can put a
breakpoint anywhere, so this is where you write and debug.

**Forge** is a chaos-testing and debugging tool built on top of Ember. It starts several
Ember nodes and adds a REST API for status, load generation, and chaos controls, so you can kill a
node, kill the leader, or trigger a rolling restart while traffic flows and watch the
cluster recover.

**Aether** is the distributed runtime: the same nodes on separate machines, reaching each
other over the real network.

A working day moves through them in that order. You shape a slice against Ember, where
the loop is edit, run, step through, and the whole cluster is one debuggable process.
When the logic holds, you promote the question from "is it correct" to "does it survive":
a Forge session runs load against the same slices while you kill the node that owns the
work mid-flight and watch what the recovery does to your invariants. What reaches Aether
is the artifact that already answered both questions. Nothing is rebuilt for production;
the blueprint and its configuration name the environment-specific parts, which is Part
0's split doing its job — assembling decided the wiring at compile time, and provisioning
defers only the endpoints, credentials, and sizes that legitimately differ per
environment. Part IV takes the deployment story from there.

A cross-slice call is written the same way in all three. The runtime routes it through
its invocation fabric, handles serialization, and picks an instance on a node membership
still counts alive, and nothing in the slice names the environment. It sends the call
once and does not re-send it; Part VI lists what the caller gets back when the chosen
node is lost. That is why moving a slice from your laptop to
production needs no code change. What the code cannot make identical is what lies
underneath it: localhost inside one process in Ember and Forge, a real network in Aether.
Timing, concurrency, and the ways a call can fail differ with it, and the resources a
runtime provides can differ too. Forge lets you rehearse the classes of failure, a lost
node or a lost leader, against the same code and the same recovery path; it does not
replay the exact failure production will produce.

That uniformity is a commitment with consequences in both directions, and it is worth
naming them. Because a cross-slice call goes through the same invocation fabric and codecs in every
environment (a call that lands on the same node skips only the network), you never write
the code that pretends it is local: there is no separate path to design around, and no "it
worked in dev because dev was one process" class of surprise waiting at the first real
deployment. And because the fabric is the same on your laptop, what Forge shows you when
you kill the payment node under load is the same class of incident production will bring,
not the exact one, brought forward to the point in the schedule where it costs a coffee
break instead of a war room. The environments differ in scale, stakes, and network timing;
the code path a call takes does not, and the testing strategy of Part III stands on that.

## Idempotency, the price of admission

The runtime places, scales, and routes your slice, and asks one thing in return: a slice
method should be idempotent. Given the same request, it should produce the same result,
even if it runs more than once.

This requirement is what the runtime's guarantees are built on, because requests get
repeated, and each repeat has a named source. The node that receives an HTTP request and
forwards it to a node serving the route re-sends it to another node when the first attempt provably applied nothing, or when the
HTTP method is idempotent by its definition in RFC 9110 (`GET`, `HEAD`, `OPTIONS`,
`TRACE`, `PUT`, `DELETE`). A stream redelivers an event its handler failed. A method with
a declared retry runs again. A client that saw a timeout sends the request again. Scaling
adds one more fact: the repeat can land on any instance. If `placeOrder` is idempotent,
any of those repeats after a dropped connection is safe. If it is not, the repeat charges
the customer twice. The runtime will not make that repeat on its own: a `POST` whose first
attempt may have reached a node is answered with a 503 saying the outcome is unknown, and
the choice to ask again goes back to the caller. In the knowledge-gathering
frame, an idempotent step gathers the same knowledge no matter how many times it runs, so
repeating it costs nothing and changes nothing.

The requirement exists because a distributed caller has a blind spot no amount of
engineering removes. When a call times out, the caller cannot know which side of the
work the loss happened on: the request may never have arrived, or the work may have
completed and the acknowledgment died on the way back. Waiting does not resolve the
ambiguity, and asking again is the only move available. The runtime asks again in two
places: at the HTTP entry node, which re-sends a forwarded request that is safe to re-send,
up to three times by default, fewer when fewer nodes are connected or the request's time
budget runs out; and in event delivery, which redelivers a failed event (three attempts
for a stream consumer by default, five for a durable topic) before dead-lettering it. A method with a
declared retry asks again by its own policy. Everywhere else, every slice-to-slice call
included, the caller asks again. Repetition is not
an edge case in a distributed system; it is the ordinary mechanics of one. A slice
method is written to be repeated because it will be.

Be precise about what is being promised, because "the same result" is about the world,
not just the return value. Running the method twice must leave the same external effects
as running it once: one row, one charge, one email — and a repeat the caller can
recognize as already done. Reads clear the bar by construction. Writes take design, and the two working
techniques are the ones Part II develops: an idempotency key, some stable identity the
second attempt carries so the first attempt's work is recognized rather than repeated,
and the conditional write, an operation phrased so applying it twice converges on the
same state, the way the persistence module's `ON CONFLICT` upsert converges on the same row, and the durable
entity's serialized `create` applies once, with the repeat answering `EntityAlreadyExists`,
which the caller reads as done.

What matters here is the habit: decide how a write stays safe under repetition while you
design it, not after an incident teaches you it wasn't. The question "what happens when
this runs twice" belongs in the same breath as "what does this return." Designing for
repetition from the first line is the difference between a slice that scales and one that
merely runs, and the rest of the book assumes you have taken the habit on.

With one slice written, tested on both its paths, and safe to repeat, the next part is
where the real work lives: the recurring problems of distributed backend systems, each
taken apart and solved on top of this model.
