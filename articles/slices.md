---
tags: [java, microservices, architecture, backend]
canonical_url: https://pragmatica.dev/articles/slices
description: The microservices granularity problem isn't about finding the right size—it's about defining the right boundaries. Slices solve this by making boundaries explicit and deployment flexible.
published: true
---

# Slices: The Right Size for Microservices

## The Granularity Trap

Every team that adopts microservices eventually hits the same wall: how big should a service be?

Go too small and you drown in network calls, distributed transactions, and deployment complexity. Your simple "get user profile" operation now involves five services, three of which are just proxies for database tables. Latency compounds. Debugging becomes archaeology.

Go too large and you're back to the monolith. Different teams step on each other. Deployments require coordination. The "micro" in microservices becomes ironic.

The standard advice—"one service per bounded context" or "services should be independently deployable"—sounds reasonable but provides no actionable guidance. Where does one context end and another begin? What exactly makes something "independently deployable"?

Teams oscillate between extremes, refactoring services that are "too small" into larger ones, then splitting services that grew "too large." The cycle repeats because the fundamental question remains unanswered: what determines the right boundary?

## Boundaries Before Size

The problem isn't size. It's boundaries.

A well-defined boundary has specific properties:
- **Clear contract**: callers know exactly what they can request and what they'll receive
- **Explicit dependencies**: the component declares what it needs from outside
- **Internal freedom**: implementation details can change without affecting callers

Size follows from boundaries, not the other way around. A component is the right size when it fully owns its boundaries—when everything needed to fulfill its contract lives inside, and everything outside is accessed through explicit dependencies.

This is where most microservice designs fail. They draw boundaries based on technical layers (API gateway, business logic, database access) or organizational structure (team ownership). Neither approach produces stable boundaries because neither focuses on the actual contracts between components.

## What Is a Slice?

A slice is a deployable unit defined by its contract. You write an interface with a single annotation:

```java
@Slice
public interface OrderService {
    Promise<OrderResponse> createOrder(CreateOrderRequest request);
    Promise<OrderResponse> getOrder(GetOrderRequest request);
    Promise<Unit> cancelOrder(CancelOrderRequest request);
}
```

That's it. The annotation processor generates everything else—factory methods, dependency wiring, deployment metadata. You define the contract; the tooling handles the infrastructure.

This interface is the boundary:
- **Methods define the contract**: each takes a request, returns a promise of response
- **Request/response types are explicit**: no hidden parameters, no ambient context
- **Async by default**: `Promise<T>` handles both success and failure paths

The implementation lives behind this interface. It might be simple or complex. It might call other slices or be completely self-contained. The boundary doesn't care.

## Aether and Forge: Development Made Simple

Slices run on Aether, a distributed runtime designed around slice contracts. You don't configure service discovery, serialization, or inter-slice communication—Aether handles it based on what the slice interfaces declare. Every inter-slice call eventually succeeds if the cluster is alive; the runtime manages retries, failover, and recovery transparently.

Forge provides a development environment for testing slices under realistic conditions—load generation, chaos injection, backend simulation. Instead of deploying to staging to see how your slices behave under pressure, you run Forge locally and observe.

The development experience stays simple: write `@Slice` interfaces, implement them, test with Forge, deploy to Aether. The annotation processor generates all the boilerplate—factories, dependency wiring, routing metadata.

## Dependencies That Don't Lie

Traditional service architectures bury dependencies in configuration files, environment variables, or runtime discovery. You find out what a service needs by reading its code, tracing its network calls, or waiting for it to fail in production.

Slices declare dependencies in the interface:

```java
@Slice
public interface OrderService {
    Promise<OrderResponse> createOrder(CreateOrderRequest request);
    // Other methods...

    // Factory method declares dependencies explicitly
    static OrderService orderService(InventoryService inventory, PaymentService payment) {
        return OrderServiceFactory.orderService(Aspect.identity(), inventory, payment);
    }
}
```

The annotation processor generates the factory that wires everything:

```java
public final class OrderServiceFactory {
    private OrderServiceFactory() {}

    public static OrderService orderService(
            Aspect<OrderService> aspect,
            InventoryService inventory,
            PaymentService payment) {
        return aspect.apply(new OrderServiceImpl(inventory, payment));
    }
}
```

The factory method signature declares dependencies. No service locators, no runtime discovery, no configuration files that might or might not match reality. Dependencies are visible at compile time and verified before deployment.

This explicitness matters. You can trace the dependency graph by reading code. You can test with substitutes by passing different implementations. Forge validates the entire graph before starting anything.

## Same Code, Different Environments

The same slices run unchanged across three runtime modes:

- **Ember**: Single-process runtime with multiple cluster nodes. Fast startup, simple debugging. Perfect for local development.
- **Forge**: Ember plus load generation and chaos injection. Test how slices behave under pressure without deploying anywhere.
- **Aether**: Full distributed cluster. Production deployment with all the resilience guarantees.

Your code doesn't know which mode it's running in. Slice interfaces, implementations, and dependencies stay identical. The runtime handles the difference—whether inter-slice calls are in-process or cross-network is transparent.

This changes the development workflow. You write and debug in Ember. You stress-test in Forge. You deploy to Aether. At no point do you modify slice code to accommodate the environment.

## Right-Sized by Definition

With boundaries explicit and deployment flexible, the "right size" question dissolves.

A slice is the right size when:
1. Its interface captures a coherent set of operations
2. Its dependencies accurately reflect what it needs
3. Its implementation can fulfill its contract

There's no minimum or maximum. An authentication slice might have two methods. An order processing slice might have twenty. Size follows from the domain, not from arbitrary rules about lines of code or team structure.

More importantly, getting it wrong is recoverable. Split a slice that grew too complex? The boundary changes, but callers just see a new interface. Merge slices that were artificially separated? Same story. Refactoring slices is refactoring code, not rewriting infrastructure.

## The JBCT Connection

Slices are where JBCT patterns live.

Each slice method is a data transformation pipeline:
- Parse input (validated request types)
- Gather data (dependencies, other slices)
- Process (business logic)
- Respond (typed response)

The six patterns—Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects—compose within and across slice methods. A slice is simply the deployment boundary around a set of related transformations.

This is why the combination works. JBCT gives you consistent structure within slices. Slices give you consistent boundaries between them. Together, they eliminate the two sources of architectural entropy: inconsistent implementation patterns and unclear service boundaries.

## Conclusion

The microservices granularity problem persists because it asks the wrong question. "How big should a service be?" has no good answer. "What are the contracts between components?" has a precise one.

Slices shift focus from size to boundaries. Define the interface. Declare dependencies explicitly. Let deployment topology adapt to operational needs rather than dictating code structure.

The result: boundaries that are clear by construction, dependencies that are visible by design, and deployment flexibility that doesn't require rewriting code.

---

*Part of [Java Backend Coding Technology](https://pragmatica.dev/java/jbct/) - a methodology for writing predictable, testable backend code.*
