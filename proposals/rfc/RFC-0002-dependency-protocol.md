---
RFC: 0002
Title: Dependency Protocol
Status: Draft
Author: Sergiy Yevtushenko
Created: 2026-01-15
Updated: 2026-01-15
Affects: [jbct-cli, aether]
---

## Summary

Defines how slice dependencies are classified, resolved, and invoked at runtime. Covers internal vs external dependency distinction, artifact coordinate format, proxy generation, and the `SliceInvokerFacade` contract.

## Motivation

Slices depend on other slices. Some dependencies are internal (same deployment unit), others are external (separate artifacts requiring network calls). The generator must produce correct wiring code, and the runtime must route calls appropriately. This RFC establishes the protocol for dependency resolution and invocation.

## Design

### Boundaries

- **jbct-cli**: Classifies dependencies, generates proxies for external deps, resolves artifact coordinates
- **aether**: Provides `SliceInvokerFacade` implementation, routes calls to correct slice instances

### 1. Dependency Classification

Dependencies are classified based on package structure:

```
Base package: org.example.myslice

Internal: org.example.myslice.other.OtherSlice     (same base)
External: org.example.payments.PaymentService      (different base)
```

#### Classification Rules

```java
// DependencyModel.isExternal()
boolean isExternal(String basePackage) {
    return !dependencyPackage.startsWith(basePackage);
}
```

**Internal dependencies:**
- Same base package
- Wired via direct factory method calls
- No artifact coordinates needed
- Instantiated in same classloader

**External dependencies:**
- Different base package
- Wired via generated proxy records
- Require artifact coordinates for routing
- May be in different classloader/JVM

### 2. Artifact Coordinate Format

Format: `groupId:artifactId:version`

```
org.example:payment-service:1.2.0
```

**Components:**
- `groupId`: Maven group ID (dot-separated)
- `artifactId`: Maven artifact ID (hyphen-separated)
- `version`: Semantic version (may include qualifier)

**Validation:** Performed by `Artifact.artifact(String)` in aether's slice module.

### 3. Dependency Resolution

#### slice-deps.properties

Location: Generated in `target/classes/META-INF/slice-deps.properties`

Format:
```properties
org.example.payments.PaymentService=org.example:payment-service:1.2.0
org.example.inventory.InventoryService=org.example:inventory-service:2.0.0
```

Key: Fully qualified interface name
Value: Maven artifact coordinates

#### Resolution Process

1. `jbct:collect-slice-deps` Maven goal scans `provided` dependencies
2. For each dependency JAR, reads `META-INF/slice-api.properties`
3. Extracts `api.interface` and `slice.artifact`
4. Writes mapping to `slice-deps.properties`

#### Unresolved Dependencies

If dependency not found in `slice-deps.properties`:

```java
private static final String ARTIFACT = "groupId:artifactId:UNRESOLVED";
```

This causes a clear runtime error rather than silent failure.

### 4. Proxy Generation

For each external dependency, generator creates a proxy record:

```java
// Generated inside factory method
record PaymentServiceProxy(SliceInvokerFacade invoker) implements PaymentService {
    private static final String ARTIFACT = "org.example:payment-service:1.2.0";

    @Override
    public Promise<PaymentResponse> processPayment(PaymentRequest request) {
        return invoker.invoke(
            ARTIFACT,
            "processPayment",
            request,
            new TypeToken<PaymentResponse>() {}
        );
    }

    @Override
    public Promise<RefundResponse> refundPayment(RefundRequest request) {
        return invoker.invoke(
            ARTIFACT,
            "refundPayment",
            request,
            new TypeToken<RefundResponse>() {}
        );
    }
}
```

#### Proxy Characteristics

- Record type (immutable, compact)
- Implements dependency interface
- Holds reference to `SliceInvokerFacade`
- Static `ARTIFACT` constant for routing
- Each method delegates to `invoker.invoke(...)`
- TypeToken provides response type for deserialization (supports generics)

### 5. SliceInvokerFacade Contract

Interface provided by aether runtime:

```java
public interface SliceInvokerFacade {
    <R> Promise<R> invoke(
        String artifact,           // Target slice artifact coordinates
        String methodName,         // Method to invoke
        Object request,            // Request payload
        TypeToken<R> responseType  // For response deserialization (supports generics)
    );
}
```

#### Implementation Responsibilities

1. **Artifact Resolution**: Map artifact string to slice instance
2. **Method Lookup**: Find `SliceMethod` by name in target slice
3. **Serialization**: Serialize request for network transport (if remote)
4. **Invocation**: Call handler function or send network request
5. **Deserialization**: Deserialize response using TypeToken (supports generic types)
6. **Error Handling**: Propagate failures through Promise

#### Local vs Remote

```
┌─────────────────┐     ┌─────────────────────────────┐
│  Calling Slice  │     │      SliceInvokerFacade     │
│                 │     │                             │
│  proxy.method() │────▶│  artifact → slice lookup    │
│                 │     │                             │
└─────────────────┘     │  ┌─────────────────────┐   │
                        │  │ Same JVM? Direct    │   │
                        │  │ Different? Network  │   │
                        │  └─────────────────────┘   │
                        └─────────────────────────────┘
```

### 6. Factory Wiring

Generated factory wires dependencies appropriately:

```java
public static Promise<OrderService> orderService(
        Aspect<OrderService> aspect,
        SliceInvokerFacade invoker,
        InventoryService inventory) {  // Internal dep passed directly

    // External dep gets proxy
    var paymentProxy = new PaymentServiceProxy(invoker);

    var impl = new OrderServiceImpl(inventory, paymentProxy);
    return Promise.success(aspect.apply(impl));
}
```

**Wiring Rules:**
- Internal deps: Passed as factory parameters (caller instantiates)
- External deps: Proxy created inside factory using `invoker`

### Contracts Summary

| Component | jbct-cli Generates | aether Expects |
|-----------|-------------------|----------------|
| Dependency classification | Package-based internal/external | N/A (generator concern) |
| Artifact coordinates | From `slice-deps.properties` | Colon-separated `g:a:v` format |
| External proxy | Record implementing interface | Valid interface implementation |
| Proxy invocation | `invoker.invoke(artifact, method, req, new TypeToken<R>() {})` | SliceInvokerFacade contract |
| Internal deps | Factory parameters | Direct instance passing |

## Examples

### Complete Factory with Mixed Dependencies

```java
public final class OrderServiceFactory {
    private OrderServiceFactory() {}

    public static Promise<OrderService> orderService(
            Aspect<OrderService> aspect,
            SliceInvokerFacade invoker,
            InventoryService inventory,    // Internal
            NotificationService notifier)  // Internal
    {
        // External dependencies - proxied
        record PaymentServiceProxy(SliceInvokerFacade invoker) implements PaymentService {
            private static final String ARTIFACT = "org.example:payment-service:1.2.0";

            @Override
            public Promise<PaymentResponse> processPayment(PaymentRequest request) {
                return invoker.invoke(ARTIFACT, "processPayment", request,
                    new TypeToken<PaymentResponse>() {});
            }
        }

        record ShippingServiceProxy(SliceInvokerFacade invoker) implements ShippingService {
            private static final String ARTIFACT = "org.example:shipping-service:3.0.0";

            @Override
            public Promise<ShippingResponse> createShipment(ShippingRequest request) {
                return invoker.invoke(ARTIFACT, "createShipment", request,
                    new TypeToken<ShippingResponse>() {});
            }
        }

        var impl = new OrderServiceImpl(
            inventory,                        // Internal - direct
            notifier,                         // Internal - direct
            new PaymentServiceProxy(invoker), // External - proxied
            new ShippingServiceProxy(invoker) // External - proxied
        );

        return Promise.success(aspect.apply(impl));
    }
}
```

### slice-deps.properties Example

```properties
# Generated by jbct:collect-slice-deps
# Source: provided dependencies with slice-api.properties manifests
org.example.payments.PaymentService=org.example:payment-service:1.2.0
org.example.shipping.ShippingService=org.example:shipping-service:3.0.0
org.example.users.UserService=org.example:user-service:2.1.0
```

### Aether Invocation Flow

```java
// Inside LocalSliceInvoker (aether)
public <R> Promise<R> invoke(String artifact, String methodName, Object request, TypeToken<R> responseType) {
    return sliceStore.findSlice(Artifact.artifact(artifact).unwrap())
        .async(SliceError.NotFound.INSTANCE)
        .flatMap(slice -> {
            var method = slice.methods().stream()
                .filter(m -> m.name().value().equals(methodName))
                .findFirst()
                .orElseThrow();

            @SuppressWarnings("unchecked")
            var typedMethod = (SliceMethod<I, O>) method;
            return typedMethod.handler().apply(request);
        });
}
```

## Edge Cases

### Circular Dependencies

Circular dependencies between external slices are allowed - proxies are lazy (invoke on call, not on construction). Circular internal dependencies cause compile-time factory parameter cycle.

### Version Mismatches

If slice A expects `payment-service:1.2.0` but `payment-service:1.3.0` is deployed:
- Runtime uses deployed version (artifact coordinates are routing hints)
- Method signature changes may cause deserialization failures
- Recommendation: Use compatible versioning (minor bumps backward compatible)

### Missing Dependencies

If target artifact not deployed:
- `SliceInvokerFacade.invoke()` returns failed Promise
- Error type: `SliceError.NotFound` or similar
- Caller handles via Promise error channel

## Breaking Changes

Changes requiring version bump:

1. `SliceInvokerFacade` signature changes
2. Artifact coordinate format changes
3. `slice-deps.properties` format changes
4. Proxy generation pattern changes

## References

- [RFC-0001: Core Slice Contract](RFC-0001-core-slice-contract.md) - Factory method signature, Aspect pattern
- [RFC-0003: HTTP Layer](RFC-0003-http-layer.md) - HTTP routes (uses same artifact coordinates)
