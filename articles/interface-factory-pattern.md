---
tags: [java, architecture, design-patterns, functional-programming]
canonical_url: https://pragmatica.dev/articles/interface-factory-pattern
description: "Interfaces with static factory methods aren't just convention. They make implementations disposable, testing trivial, and coupling impossible."
published: true
---

# Why Interface + Factory? The Java Pattern That Makes Everything Replaceable

## The Pattern

Every component — use case, processing step, adapter — is defined as an interface with a static factory method:

```java
public interface ProcessOrder {
    record Request(String orderId, String paymentToken) {}
    record Response(OrderConfirmation confirmation) {}

    Result<Response> execute(Request request);

    interface ValidateInput {
        Result<ValidRequest> apply(Request raw);
    }
    interface ReserveInventory {
        Result<Reservation> apply(ValidRequest req);
    }
    interface ProcessPayment {
        Result<Payment> apply(Reservation reservation);
    }
    interface ConfirmOrder {
        Result<Response> apply(Payment payment);
    }

    static ProcessOrder processOrder(ValidateInput validate,
                                     ReserveInventory reserve,
                                     ProcessPayment processPayment,
                                     ConfirmOrder confirm) {
        return request -> validate.apply(request)
                                  .flatMap(reserve::apply)
                                  .flatMap(processPayment::apply)
                                  .flatMap(confirm::apply);
    }
}
```

Four steps. Each is a single-method interface. The factory method accepts all dependencies as parameters and returns a lambda implementing the use case. The body reads exactly like the business process: validate, reserve, process payment, confirm.

This isn't arbitrary convention. There are three specific reasons this structure exists.

## Reason 1: Substitutability Without Magic

Anyone can implement the interface. No framework. No inheritance hierarchy. No annotations.

Testing becomes trivial:

```java
@Test
void order_fails_when_inventory_insufficient() {
    var useCase = ProcessOrder.processOrder(
        request -> Result.success(new ValidRequest(request)),  // always valid
        req -> INSUFFICIENT_INVENTORY.result(),                // always fails
        reservation -> { throw new AssertionError("unreachable"); },
        payment -> { throw new AssertionError("unreachable"); }
    );

    useCase.execute(new Request("order-1", "tok_123"))
           .onSuccess(Assertions::fail);
}
```

No mocking framework. No `@Mock` annotations. No `when().thenReturn()` chains. The test constructs the exact scenario it needs with plain lambdas.

Stubbing incomplete implementations during development is equally straightforward:

```java
// Payment gateway isn't ready yet? Stub it.
var useCase = ProcessOrder.processOrder(
    realValidator,
    realInventoryService,
    reservation -> Result.success(new Payment("stub-" + reservation.id(), Money.ZERO)),
    realConfirmation
);
```

The team working on inventory doesn't need to wait for the payment team. Each step is independently implementable.

## Reason 2: Implementation Isolation

Each implementation is self-contained. No shared base classes. No abstract methods to override. No coupling between implementations whatsoever.

Compare with the typical abstract class approach:

```java
// The abstract class trap
public abstract class AbstractOrderProcessor {
    protected final Logger log = LoggerFactory.getLogger(getClass());

    public final Result<Response> execute(Request request) {
        log.info("Processing order: {}", request.orderId());
        var result = doExecute(request);
        log.info("Order result: {}", result);
        return result;
    }

    protected abstract Result<Response> doExecute(Request request);
    protected abstract Result<ValidRequest> validate(Request request);

    // "Shared utility" that every subclass now depends on
    protected Result<Money> calculateTotal(List<LineItem> items) {
        // 47 lines of logic that one subclass needed once
    }
}
```

Now every implementation is coupled to the base class. Change `calculateTotal` and you need to understand every subclass. Add logging to `execute` and every implementation gets it whether appropriate or not. The base class becomes a gravity well — accumulating shared code that creates invisible dependencies between implementations that should have nothing in common.

With interface + factory, there is no shared implementation code. Period. Each intersection between implementations is unnecessary coupling with corresponding maintenance overhead — up to needing deep understanding of two projects instead of one, with zero benefit.

```java
// Implementation A: uses database
static ProcessPayment databasePayment(PaymentRepository repo) {
    return reservation -> repo.charge(reservation.paymentToken(), reservation.total())
                              .map(Payment::fromRecord);
}

// Implementation B: uses external API
static ProcessPayment stripePayment(StripeClient client) {
    return reservation -> client.createCharge(reservation.total(), reservation.paymentToken())
                                .map(Payment::fromStripe);
}
```

These implementations don't know about each other. They don't share code. They don't share a base class. They share a contract — the interface — and nothing else.

## Reason 3: Disposable Implementation

Here's the subtle one. The factory method returns a lambda or local record. It can't be referenced externally by class name.

```java
static ProcessOrder processOrder(ValidateInput validate,
                                 ReserveInventory reserve,
                                 ProcessPayment processPayment,
                                 ConfirmOrder confirm) {
    return request -> validate.apply(request)          // this lambda IS the implementation
                              .flatMap(reserve::apply)
                              .flatMap(processPayment::apply)
                              .flatMap(confirm::apply);
}
```

No code anywhere says `new ProcessOrderImpl()`. No code depends on the implementation class. The implementation is replaceable by definition — because nothing can reference it.

The interface is the design artifact. The implementation is incidental.

This might sound academic until you need to:
- Replace a synchronous implementation with an async one
- Swap a database adapter for an API adapter
- Add a caching layer around an existing step
- Completely rewrite a step's internals

In each case, the interface stays. The factory method signature stays. The implementation — which nothing references — gets replaced. No downstream changes. No adapter layers. No "backwards compatibility."

## The Compound Effect

Each reason is valuable on its own. Together, they create a system where:

**Testing is configuration.** You assemble the exact combination of real and stubbed components you need. No mocking framework overhead. No "mock everything" test fragility.

**Refactoring is safe.** Replacing an implementation can't break other implementations because they don't share code. The compiler enforces the contract through the interface.

**Complexity is bounded.** Understanding one implementation requires understanding only that implementation and the interfaces it consumes. Not a base class hierarchy. Not shared utilities. Not other implementations.

**Incremental development is natural.** Stub what's not ready. Replace stubs with real implementations one at a time. Each step can be developed, tested, and deployed independently.

## When Does This Not Apply?

When there genuinely is one implementation and always will be. Pure utility functions, mathematical computations, simple data transformations — these don't need the interface + factory treatment. A static method is fine.

The pattern pays for itself when there's any possibility of multiple implementations — including the test implementation, which almost always exists.

## The Shift

Most Java codebases default to classes. Interface extraction happens later, reluctantly, when testing forces it or when the second implementation appears.

Flip this. Start with the interface. Define the contract. The implementation follows naturally — and when it needs to change, nothing else does.

The interface is what you design. The implementation is what you happen to write today.
