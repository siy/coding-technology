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

For each external dependency, generator creates a proxy record with pre-built method handles:

```java
// Generated inside factory method
record PaymentServiceProxy(
    MethodHandle<PaymentResponse, PaymentRequest> processPaymentHandle,
    MethodHandle<RefundResponse, RefundRequest> refundPaymentHandle
) implements PaymentService {

    @Override
    public Promise<PaymentResponse> processPayment(PaymentRequest request) {
        return processPaymentHandle.invoke(request);
    }

    @Override
    public Promise<RefundResponse> refundPayment(RefundRequest request) {
        return refundPaymentHandle.invoke(request);
    }
}

// Proxy creation in factory (handles parsing/validation once)
private static final String PAYMENT_ARTIFACT = "org.example:payment-service:1.2.0";

var paymentProxy = Result.all(
    invoker.methodHandle(PAYMENT_ARTIFACT, "processPayment",
        new TypeToken<PaymentRequest>() {}, new TypeToken<PaymentResponse>() {}),
    invoker.methodHandle(PAYMENT_ARTIFACT, "refundPayment",
        new TypeToken<RefundRequest>() {}, new TypeToken<RefundResponse>() {})
).map(PaymentServiceProxy::new);
```

#### Proxy Characteristics

- Record type (immutable, compact)
- Implements dependency interface
- Holds `MethodHandle` references (not raw invoker)
- Method handles created at factory time (parse artifact/method once)
- Each method delegates to pre-built handle
- TypeToken provides type info for serialization (supports generics)

### 5. SliceInvokerFacade Contract

Interface provided by aether runtime:

```java
public interface SliceInvokerFacade {
    <R, T> Result<MethodHandle<R, T>> methodHandle(
        String artifact,           // Target slice artifact coordinates
        String methodName,         // Method to invoke
        TypeToken<T> requestType,  // For request serialization
        TypeToken<R> responseType  // For response deserialization
    );
}

// MethodHandle for repeated invocations
public interface MethodHandle<R, T> {
    Promise<R> invoke(T request);
    Promise<Unit> fireAndForget(T request);
    String artifactCoordinate();
    MethodName methodName();
}
```

#### Design Rationale

- **Method handles over direct invoke**: Artifact/method parsing happens once at handle creation
- **Result return**: Parsing failures caught at factory time, not invocation time
- **TypeToken for both types**: Full generic support for request and response

#### Implementation Responsibilities

1. **Artifact Parsing**: Validate artifact string format at handle creation
2. **Method Resolution**: Validate method name format at handle creation
3. **Handle Creation**: Return reusable handle for repeated invocations
4. **Serialization**: Serialize request using TypeToken for network transport
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

    // External dep gets proxy with pre-built handles
    return invoker.methodHandle(PAYMENT_ARTIFACT, "processPayment",
                                new TypeToken<PaymentRequest>() {},
                                new TypeToken<PaymentResponse>() {})
        .map(handle -> new PaymentServiceProxy(handle))
        .map(paymentProxy -> new OrderServiceImpl(inventory, paymentProxy))
        .map(aspect::apply)
        .map(Promise::success)
        .or(Promise::failed);
}
```

**Wiring Rules:**
- Internal deps: Passed as factory parameters (caller instantiates)
- External deps: Proxy created inside factory with method handles from `invoker`
- Factory returns `Promise` - handle creation failures propagate

### Contracts Summary

| Component | jbct-cli Generates | aether Expects |
|-----------|-------------------|----------------|
| Dependency classification | Package-based internal/external | N/A (generator concern) |
| Artifact coordinates | From `slice-deps.properties` | Colon-separated `g:a:v` format |
| External proxy | Record with MethodHandle fields | Valid interface implementation |
| Proxy creation | `invoker.methodHandle(artifact, method, reqType, respType)` | SliceInvokerFacade.methodHandle |
| Internal deps | Factory parameters | Direct instance passing |

## Examples

### Complete Factory with Mixed Dependencies

```java
public final class OrderServiceFactory {
    private OrderServiceFactory() {}

    private static final String PAYMENT_ARTIFACT = "org.example:payment-service:1.2.0";
    private static final String SHIPPING_ARTIFACT = "org.example:shipping-service:3.0.0";

    // External dependency proxies with pre-built handles
    record PaymentServiceProxy(
        MethodHandle<PaymentResponse, PaymentRequest> processPaymentHandle
    ) implements PaymentService {
        @Override
        public Promise<PaymentResponse> processPayment(PaymentRequest request) {
            return processPaymentHandle.invoke(request);
        }
    }

    record ShippingServiceProxy(
        MethodHandle<ShippingResponse, ShippingRequest> createShipmentHandle
    ) implements ShippingService {
        @Override
        public Promise<ShippingResponse> createShipment(ShippingRequest request) {
            return createShipmentHandle.invoke(request);
        }
    }

    public static Promise<OrderService> orderService(
            Aspect<OrderService> aspect,
            SliceInvokerFacade invoker,
            InventoryService inventory,    // Internal
            NotificationService notifier)  // Internal
    {
        // Create method handles for external dependencies
        return Result.all(
            invoker.methodHandle(PAYMENT_ARTIFACT, "processPayment",
                new TypeToken<PaymentRequest>() {}, new TypeToken<PaymentResponse>() {}),
            invoker.methodHandle(SHIPPING_ARTIFACT, "createShipment",
                new TypeToken<ShippingRequest>() {}, new TypeToken<ShippingResponse>() {})
        ).map((paymentHandle, shippingHandle) -> {
            var impl = new OrderServiceImpl(
                inventory,                              // Internal - direct
                notifier,                               // Internal - direct
                new PaymentServiceProxy(paymentHandle), // External - proxied
                new ShippingServiceProxy(shippingHandle) // External - proxied
            );
            return aspect.apply(impl);
        }).async();
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
// Inside SliceInvoker (aether) - methodHandle creates reusable handle
public <R, T> Result<MethodHandle<R, T>> methodHandle(
        String artifact, String methodName,
        TypeToken<T> requestType, TypeToken<R> responseType) {
    return Artifact.artifact(artifact)
        .flatMap(art -> MethodName.methodName(methodName)
            .map(method -> createMethodHandle(art, method, requestType, responseType)));
}

// MethodHandle.invoke() routes to correct slice
private <R> Promise<R> invokeInternal(Artifact artifact, MethodName method, Object request) {
    return selectEndpoint(artifact, method)
        .flatMap(endpoint -> endpoint.nodeId().equals(self)
            ? invokeLocal(artifact, method, request)    // Same node - direct call
            : invokeRemote(endpoint, artifact, method, request)); // Different node - network
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
