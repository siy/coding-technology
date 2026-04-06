# Inter-Slice Invocation

Declare dependency as a factory parameter (no annotation needed):

```java
static OrderService orderService(InventoryService inventory,
                                  PaymentService payments,
                                  @Sql SqlConnector db) {
    return request -> inventory.checkAvailability(request.items())
                               .flatMap(available -> payments.processPayment(paymentRequest))
                               .flatMap(payment -> saveOrder(db, request, payment));
}
```

The annotation processor detects non-annotated interface parameters, classifies them as slice dependencies, and generates `MethodHandle`-based proxy wiring via `SliceInvokerFacade`. Calls are routed local-first (same node) or remote (with retry and failover).

## Dependency Classification

| Parameter Pattern | Classification | What Happens |
|---|---|---|
| `@Sql SqlConnector db` | Resource dependency | Provisioned from `aether.toml` |
| `InventoryService inventory` | Slice dependency | Proxy generated for remote calls |
| `OrderValidator validator` | Plain interface | Factory method called directly |
