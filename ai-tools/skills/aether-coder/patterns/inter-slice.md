# Inter-Slice Invocation

Declare dependency as a factory parameter (no annotation needed):

```java
static Ordering ordering(Inventory inventory,
                         Payments payments,
                         @Sql SqlConnector db) {
    return request -> inventory.checkAvailability(request.items())
                               .flatMap(available -> payments.processPayment(paymentRequest))
                               .flatMap(payment -> saveOrder(db, request, payment));
}
```

The annotation processor detects non-annotated interface parameters, classifies them as slice dependencies, and generates `MethodHandle`-based proxy wiring via `SliceInvokerFacade`.

## Call Routing and Retry

- **Routing:** each call goes to one live instance of the dependency, chosen round-robin per artifact and method. The local node is one candidate among the others, with no local preference. A call that lands on the calling node still goes through encode and decode, because each slice has its own classloader.
- **Retry:** the runtime never re-sends a slice-to-slice call that may have reached its target. A request the transport provably did not write is the one exception: the invoker re-routes it to another instance, at most `timeouts.invocation.max_retries` times (default 3). The runtime re-sends only at the HTTP entry node (a forwarded request that is safe to re-send) and in event delivery (stream and durable-topic redelivery). Everywhere else the caller asks again, either by a declared retry interceptor (see [interceptors.md](../resources/interceptors.md)) or in its own code.
- **Consequence:** every slice method must be idempotent (an idempotency key or a conditional write), and no caller may assume the runtime retries a call for it.

## Dependency Classification

| Parameter Pattern | Classification | What Happens |
|---|---|---|
| `@Sql SqlConnector db` | Resource dependency | Provisioned from `aether.toml` |
| `Inventory inventory` | Slice dependency | Proxy generated for remote calls |
| `OrderValidator validator` | Plain interface | Factory method called directly |
