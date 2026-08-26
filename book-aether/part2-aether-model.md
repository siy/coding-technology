# Part II — The Aether model

Part 0 made the case that infrastructure and business logic are different kinds of code, and
Part I, for those who took the detour, showed the machinery that keeps them apart. This part is
where you start building. The working model is three commitments. A slice is plain Java with an
explicit contract. The three environments you will meet run that slice identically, differing
only in the network underneath. And the runtime's guarantees are bought with one design habit,
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
public interface OrderService {
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

    static OrderService orderService(Inventory inventory, Payments payments) {
        return request -> inventory.reserve(request.items())
                                   .flatMap(reserved -> payments.charge(request.customer(), reserved))
                                   .map(OrderPlaced::from);
    }
}
```

Read it from the bottom. The factory's parameters, `Inventory` and `Payments`, are the
slice's declared dependencies: everything it needs from the outside world appears in one
place, checked by the compiler. Because the interface has a single method, the factory
returns a lambda that implements it, so there is no `OrderServiceImpl` to write or keep
in sync. The body is the pipeline from Part 0, unchanged. `Inventory` and `Payments` are
other slices, and you call them as ordinary method calls; reaching them, routing, retry,
and failover are the runtime's job, and the call behaves the same wherever they run.

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
building, all of it is inspectable Java when you are curious, and Part I walks through
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

    OrderService.orderService(inventory, payments)
                .placeOrder(sampleOrder)
                .await()
                .onFailure(Assertions::fail)
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

    OrderService.orderService(inventory, payments)
                .placeOrder(sampleOrder)
                .await()
                .onSuccess(placed -> fail("expected a decline"))
                .onFailure(cause -> assertInstanceOf(OrderError.PaymentDeclined.class, cause));
}
```

Two lambdas, one of them refusing, and the whole failure route of the pipeline is under
test without a network, a container, or a mock of anything. Part IV builds a testing
practice on this foundation; for now the point is that the contract you just wrote is
already exercisable, in full, before any runtime enters the picture.

## Ember, Forge, and Aether

Your slice runs unchanged from your laptop to production. Three names cover how you meet
it along the way.

**Ember** is the single-process runtime: it runs the whole cluster inside one JVM, with
the nodes reaching each other over localhost. Startup is immediate and you can put a
breakpoint anywhere, so this is where you write and debug.

**Forge** is a chaos-testing and debugging tool built on top of Ember. It starts several
Ember nodes and adds a dashboard, load generation, and chaos controls, so you can kill a
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
environment. Part V takes the deployment story from there.

A cross-slice call works the same way in all three. The runtime routes it through its
invocation fabric and handles serialization, retry, and failover for you; the only
difference between the environments is the network underneath, localhost in Ember and
Forge, a real network in Aether. That is why moving a slice from your laptop to
production is a configuration change rather than a code change, and why a failure you
reproduce in Forge is the same failure you would get in Aether.

That uniformity is a commitment with consequences in both directions, and it is worth
naming them. Because a cross-slice call is remote in every environment, you never write
the code that pretends it is local: there is no in-process fast path to design around,
no "it worked in dev because dev was one process" class of surprise waiting at the first
real deployment. And because the fabric is the same on your laptop, what Forge shows you
when you kill the payment node under load is not an approximation of a production
incident; it is the production incident, brought forward to the point in the schedule
where it costs a coffee break instead of a war room. The environments differ in scale
and stakes. They do not differ in behavior, and the whole testing strategy of Part IV
stands on that.

## Idempotency, the price of admission

The runtime makes your slice fault-tolerant and scalable for free, and asks one thing in
return: a slice method should be idempotent. Given the same request, it should produce the
same result, even if it runs more than once.

This requirement is what the runtime's guarantees are built on.
Retry, scaling, and failover all work by running a request again, sometimes on a different
instance. If `placeOrder` is idempotent, a retry after a dropped connection is safe and
invisible. If it is not, the retry charges the customer twice. In the knowledge-gathering
frame, an idempotent step gathers the same knowledge no matter how many times it runs, so
repeating it costs nothing and changes nothing.

The requirement exists because a distributed caller has a blind spot no amount of
engineering removes. When a call times out, the caller cannot know which side of the
work the loss happened on: the request may never have arrived, or the work may have
completed and the acknowledgment died on the way back. Waiting does not resolve the
ambiguity and asking again is the only move available — so the runtime asks again, after
failovers, across instance moves, wherever delivery is at-least-once. Repetition is not
an edge case in a distributed system; it is the ordinary mechanics of one. A slice
method is written to be repeated because it will be.

Be precise about what is being promised, because "the same result" is about the world,
not just the return value. Running the method twice must leave the same external effects
as running it once: one row, one charge, one email — and the same answer to the caller
both times. Reads clear the bar by construction. Writes take design, and the two working
techniques are the ones Part III develops: an idempotency key, some stable identity the
second attempt carries so the first attempt's work is recognized rather than repeated,
and the conditional write, an operation phrased so applying it twice converges on the
same state, the way the persistence module's `ON CONFLICT` insert and the durable
entity's serialized `create` both do.

What matters here is the habit: decide how a write stays safe under repetition while you
design it, not after an incident teaches you it wasn't. The question "what happens when
this runs twice" belongs in the same breath as "what does this return." Designing for
repetition from the first line is the difference between a slice that scales and one that
merely runs, and the rest of the book assumes you have taken the habit on.

With one slice written, tested on both its paths, and safe to repeat, the next part is
where the real work lives: the recurring problems of distributed backend systems, each
taken apart and solved on top of this model.
