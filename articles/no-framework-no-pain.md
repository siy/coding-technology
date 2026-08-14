---
tags: [java, microservices, architecture, backend]
canonical_url: https://pragmatica.dev/articles/no-framework-no-pain
description: What if your microservice was just an interface? No dependency injection container, no annotations to learn, no configuration files to maintain. Just Java.
published: true
---

# No Framework, No Pain: Writing Aether Slices

The [previous article](https://dev.to/siy/pragmatica-aether-let-java-be-java-4k2g) introduced Aether's philosophy: return Java to managed runtimes, let the runtime handle infrastructure, and let developers handle business logic. This article shows what that looks like in practice -- what you actually write, how dependencies work, how testing works, and how existing code migrates in.

## Your Microservice Is Just an Interface

Here's an entire deployable service:

```java
@Slice
public interface OrderService {
    Promise<OrderResult> placeOrder(PlaceOrderRequest request);

    static OrderService orderService(InventoryService inventory,
                                     PricingEngine pricing) {
        return request -> inventory.check(request.items())
                                   .flatMap(pricing::calculate)
                                   .map(OrderResult::placed);
    }
}
```

That's not a simplified example. That's the actual thing. The annotation processor sees `@Slice`, reads the factory method signature and generates the wiring code, the proxy for remote calls, and the deployment metadata. You write one interface. You get a service that scales, fails over, and routes transparently across a distributed cluster.

No `@Autowired`. No `application.yml`. No `@Configuration` class. No `@Bean` method. No component scan. No service locator. No dependency injection container at all.

The factory method *is* dependency injection. Its parameters *are* the declared dependencies. The compiler verifies them. The annotation processor wires them. Nothing to configure, nothing to forget, nothing to debug at 2 AM.

Notice what the factory returns: a lambda. No implementation class. The interface has one method, so the factory returns a lambda that implements it directly. Business logic as a function. For slices with multiple methods, a private record captures the dependencies and implements the interface -- still no separate `Impl` class, no file to maintain, and no indirection to trace.

## Two Rules, Zero Boilerplate

Every slice follows two rules:

**1. The factory method declares dependencies.** What the slice needs from the outside world appears in one place: the factory method signature.

```java
static OrderService orderService(InventoryService inventory,
                                 PricingEngine pricing) {
    return request -> inventory.check(request.items())
                               .flatMap(pricing::calculate)
                               .map(OrderResult::placed);
}
```

Read the factory; know the dependencies. No configuration file can contradict it. No runtime surprise can introduce a dependency the compiler hasn't seen.

**2. Promise return types.** Every method returns `Promise<T>`. This isn't a stylistic choice -- it's what makes transparent distribution possible. Whether the call is in-process or cross-network, the caller sees the same type.

That's it. Two rules. Everything else follows from them.

## The Magic Is in the Factory Method

The annotation processor looks at each factory parameter and classifies it automatically:

| What the processor sees           | What it does                                               |
|-----------------------------------|------------------------------------------------------------|
| `@PrimaryDb SqlConnector db` | Resource -- provisions from config                         |
| `InventoryService inventory`      | External slice -- generates a network proxy                |
| `OrderValidator validator`        | Local interface with factory -- calls the factory directly |

You don't configure this. You don't annotate dependencies with `@Inject` or `@Qualifier` (except for infrastructure resources). You just list what you need, and the processor figures out how to provide it.

Consider what this means. A parameter annotated with `@ResourceQualifier` is infrastructure -- a database connection, an HTTP client, or a message queue. The processor provisions it from configuration:

```java
@ResourceQualifier(type = SqlConnector.class, config = "database.primary")
public @interface PrimaryDb {}

@Slice
public interface OrderRepository {
    Promise<OrderResult> findOrder(FindOrderRequest request);

    static OrderRepository orderRepository(@PrimaryDb SqlConnector db) {
        return request -> db.query(request.orderId())
                            .map(OrderResult::fromRow);
    }
}
```

A parameter that's a `@Slice` interface from another package is a remote dependency. The processor generates a proxy record that delegates to the runtime's invocation fabric. Your code calls `inventory.check(request)` as a method call. The proxy handles serialization, routing, retry, and failover.

A parameter that's a plain interface with a static factory method is local. The processor calls the factory directly. No proxy, no network, no overhead.

All three categories coexist in one factory:

```java
static LoanService loanService(@PrimaryDb SqlConnector db,
                               CreditBureau creditBureau,
                               RiskCalculator riskCalculator) {
    return request -> riskCalculator.assess(request)
                                    .flatMap(risk -> creditBureau.check(request.applicant()))
                                    .flatMap(credit -> persistDecision(db, request, credit));
}
```

Database from config. Credit bureau via network proxy. Risk calculator instantiated locally. One line declares it all. The processor handles the rest.

## Errors Without Exceptions

Frameworks train you to throw exceptions. Spring converts them to HTTP status codes. Jackson serializes error responses. Exception handlers map types to messages. It works until someone throws an unexpected exception, and the generic 500 response tells the caller nothing.

Slices use sealed Cause hierarchies:

```java
public sealed interface OrderCause extends Cause {
    OrderCause EMPTY_ORDER = new EmptyOrder("Order must have items");
    OrderCause INSUFFICIENT_STOCK = new InsufficientStock("Insufficient stock");

    static OrderCause insufficientStock(StockStatus stock) {
        return new InsufficientStock("Insufficient stock: " + stock);
    }

    record EmptyOrder(String message) implements OrderCause {}
    record InsufficientStock(String message) implements OrderCause {}
}
```

Every failure mode is a type. The compiler knows all of them. Pattern matching handles them exhaustively. No surprise `NullPointerException` masquerading as a business error. No `catch (Exception e)` swallowing context.

When something fails, you return a failed promise using fluent style:

```java
return inventory.checkStock(stockRequest)
                .flatMap(this::verifyAvailability);

private Promise<StockStatus> verifyAvailability(StockStatus stock) {
    return stock.sufficient()
        ? completeOrder(stock)
        : OrderCause.insufficientStock(stock).promise();
}
```

The runtime propagates the Cause across the network. The caller gets a typed failure, not a string message. The error handling contract is part of the API, not an afterthought in a `@ControllerAdvice`.

## Testing: It's Just Java

No test containers to spin up. No mock server to configure. No `@SpringBootTest` annotation that loads half the universe. No mocking frameworks either -- dependencies are interfaces, so you pass lambdas that return exactly what you need:

```java
class OrderServiceTest {
    @Test
    void placeOrder_succeeds_whenInventoryAvailable() {
        InventoryService inventory = request -> Promise.success(new StockResult("RES-123", true));
        PricingEngine pricing = request -> Promise.success(new PriceResult("ORD-456", 99.99));

        var service = OrderService.orderService(inventory, pricing);

        service.placeOrder(request)
               .await()
               .onFailure(Assertions::fail)
               .onSuccess(result -> assertEquals("ORD-456", result.orderId()));
    }

    @Test
    void placeOrder_fails_whenInventoryUnavailable() {
        InventoryService inventory = request -> OrderCause.INSUFFICIENT_STOCK.promise();
        PricingEngine pricing = request -> Promise.success(new PriceResult("ORD-456", 99.99));

        var service = OrderService.orderService(inventory, pricing);

        service.placeOrder(request)
               .await()
               .onSuccess(Assertions::fail);
    }
}
```

Dependencies are interfaces. Pass lambdas that return success; pass lambdas that return failure. The factory method wires them in. No reflection, no classpath scanning, no context initialization. No Mockito, no `when(...).thenReturn(...)`, no `verify(...)`.

Test startup is instant because there's nothing to start. No container. No framework. No bean resolution. Just objects calling objects.

## Slices at Any Granularity

A single Maven module can contain as many slices as make sense:

```
commerce/
  src/main/java/org/example/
    order/
      OrderService.java       # @Slice
    payment/
      PaymentService.java     # @Slice
    shipping/
      ShippingService.java    # @Slice
```

Each `@Slice` generates its own factory, its own API artifact, its own deployment metadata. The Maven plugin packages them separately. They deploy and scale independently. But they develop together -- shared domain types, shared build, and one repository.

A slice can be as small as a single method. There's no operational overhead for small slices -- no container to configure, no load balancer to provision, and no monitoring to set up per service. This enables granular scaling that would be operationally insane with traditional microservices: one slice serving 50 instances during peak load while another idles at minimum. With Aether, it's the default.

## What's Actually Happening

Let's trace what the annotation processor generates for a simple slice with one external dependency:

```java
@Slice
public interface OrderService {
    Promise<OrderResult> placeOrder(PlaceOrderRequest request);

    static OrderService orderService(InventoryService inventory) {
        return request -> inventory.check(request.items())
                                   .map(OrderResult::fromAvailability);
    }
}
```

The processor sees `InventoryService` is from a different package and has `@Slice` annotation -- external dependency. It generates:

1. **A proxy record** that implements `InventoryService` and delegates every method call to the runtime's `SliceInvokerFacade`. Your code calls `inventory.check(request)`. The proxy serializes the request, routes it to a node hosting InventoryService, deserializes the response, and returns it as a `Promise`.

2. **A factory class** that accepts an `Aspect` and the `SliceInvokerFacade`, creates the proxy, and wires everything together.

3. **Deployment metadata** in `META-INF/slice/` -- the slice name, its methods, its dependencies. The runtime reads this to build the dependency graph and determine deployment order.

All generated. All verified at compile time. All invisible to your business logic.

## Your Existing Code Is Already Halfway There

You don't need to start from scratch. Any existing Java code becomes a slice with one line:

```java
// Your existing Spring service
@Service
public class OrderService {
    @Autowired private InventoryRepository inventory;
    @Autowired private PricingService pricing;

    @Transactional
    public OrderResult processOrder(OrderRequest request) {
        var availability = inventory.checkAvailability(request.getItems());
        if (!availability.isAvailable()) {
            return OrderResult.outOfStock(availability.getMissingItems());
        }
        var quote = pricing.calculateQuote(request.getItems(), request.getCustomerId());
        // ... payment, order creation, notification ...
        return OrderResult.success(order);
    }
}
```

Wrap it:

```java
@Slice
public interface OrderProcessor {
    Promise<OrderResult> processOrder(OrderRequest request);

    static OrderProcessor orderProcessor() {
        var legacyService = createLegacyService();
        return request -> Promise.lift(() -> legacyService.processOrder(request));
    }
}
```

`Promise.lift()` wraps the synchronous call, catches any exception, and returns a proper `Promise` with a typed failure instead of a stack trace. 
Your legacy code runs unchanged inside. The slice deploys to the Aether runtime (initially as a one-process cluster called Ember) alongside your existing application -- same JVM, no new risk. Move to a full Aether cluster when ready. That's a configuration change, not a code change.

### The Peeling Pattern

The wrapped slice works, but it's a black box. The peeling pattern opens it up incrementally -- one layer at a time, working code at every step.

**Peel the outer structure.** Replace the opaque `lift()` with a Sequencer where each step is still wrapped:

```java
return Promise.lift(() -> legacyCheckInventory(request))
              .flatMap(inv -> Promise.lift(() -> legacyCalculatePricing(inv)))
              .flatMap(quote -> Promise.lift(() -> legacyProcessPayment(quote)))
              .flatMap(payment -> Promise.lift(() -> legacyCreateOrder(payment)));
```

Now the pipeline is visible. You can see the steps, test them individually, and reason about the flow.

**Peel one step deeper.** Take the hottest `lift()` and expand it:

```java
private Promise<Availability> checkInventory(OrderRequest request) {
    return Promise.all(Promise.lift(() -> legacyCheckWarehouse(request)),
                       Promise.lift(() -> legacyCheckSupplier(request)))
                  .map(this::combineAvailability);
}
```

The outer call is now clean JBCT. The inner calls are still wrapped. Tests pass at every step. Stop anywhere -- mixed JBCT and legacy code works fine. The remaining `lift()` calls mark exactly where legacy code lives. When they're all gone, you have a clean slice. But there's no deadline. Each peeling step delivers value on its own.

The [full migration walkthrough](https://dev.to/siy/fail-safe-your-legacy-java-in-one-sprint-p5l) covers the complete path -- from initial wrapping through fault tolerance to clean JBCT code.

## The Shift

Traditional microservice development is a negotiation with frameworks. You learn their abstractions, their lifecycle hooks, their configuration DSLs, their annotation model, their error-handling conventions, and their testing utilities. The framework becomes the center of gravity. Your business logic orbits around it.

Slices invert this. Business logic is the center. The interface defines the contract. The factory method declares dependencies. The implementation is a lambda. Everything else -- serialization, routing, scaling, failover, and configuration -- is the runtime's problem.

You don't learn a framework. You write Java interfaces and implement them. Two rules. The rest is just your domain.

No framework. No pain.

---

- [Pragmatica Aether](https://pragmaticalabs.io/aether.html) -- distributed Java runtime
- [GitHub Repository](https://github.com/pragmaticalabs/pragmatica) -- source code
- [Slice Development Guide](https://github.com/pragmaticalabs/pragmatica/blob/main/aether/docs/slice-developers/development-guide.md) -- full reference
