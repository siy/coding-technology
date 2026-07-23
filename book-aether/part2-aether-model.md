# Part II — The Aether model

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

A slice with several methods follows the same shape with one change: instead of a lambda,
the factory returns a small local `record` that captures the dependencies and implements
the interface. Still no separate implementation class, still one file.

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

A cross-slice call works the same way in all three. The runtime routes it through its
invocation fabric and handles serialization, retry, and failover for you; the only
difference between the environments is the network underneath, localhost in Ember and
Forge, a real network in Aether. That is why moving a slice from your laptop to production
is a configuration change rather than a code change, and why a failure you reproduce in
Forge is the same failure you would get in Aether. Part IV puts Forge through its paces.

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

Most reads are idempotent already. Writes take a little design: an idempotency key that
lets the second attempt recognize the first, or a conditional write that only applies once.
Those are techniques, and Part III gives them in full. What matters here is the habit:
decide how a write stays safe under repetition while you design it, not after an incident
teaches you it wasn't. Designing for repetition from the first line is the difference
between a slice that scales and one that merely runs, and the rest of the book assumes you
have taken the habit on.

With one slice written, tested, and safe to repeat, the next part is where the real work
lives: the recurring problems of distributed backend systems, each taken apart and solved
on top of this model.
