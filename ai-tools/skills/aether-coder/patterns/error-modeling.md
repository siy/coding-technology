# Error Modeling

## Sealed Cause Hierarchy

```java
sealed interface OrderError extends Cause {
    record DuplicateOrder(String message) implements OrderError {
        static DuplicateOrder duplicateOrder() { return new DuplicateOrder("Order already exists"); }
    }
    record InventoryUnavailable(String message) implements OrderError {
        static InventoryUnavailable inventoryUnavailable() {
            return new InventoryUnavailable("Requested items not available");
        }
    }
    record CustomerNotFound(String customerId, String message) implements OrderError {
        static final Fn1<CustomerNotFound, String> FACTORY =
            Causes.forOneValue("Customer not found: %s", CustomerNotFound::new);

        static CustomerNotFound customerNotFound(String customerId) { return FACTORY.apply(customerId); }
    }
    record PaymentFailed(String reason, String transactionId, String message) implements OrderError {
        static final Fn2<PaymentFailed, String, String> FACTORY =
            Causes.forTwoValues("Payment failed: %s (tx %s)", PaymentFailed::new);

        static PaymentFailed paymentFailed(String reason, String transactionId) { return FACTORY.apply(reason, transactionId); }
    }
}
```

**Convention:** One record per failure, with a trailing `String message` component. Data-carrying records have a type-named factory (`customerNotFound(...)`) that delegates to its `FACTORY`; fixed-message records have a no-argument type-named factory (`duplicateOrder()`). Callers use the type-named factory. A failure that needs its own HTTP status is never one constant of a shared enum: the router matches the Cause's type name, and every constant of an enum is the same type. An enum is fine only for causes that all map to one status.

## HTTP Status Mapping (routes.toml)

```toml
[errors]
default = 500
strict = true          # optional: a Cause type no pattern reaches fails the build
HTTP_404 = ["*NotFound*"]
HTTP_409 = ["*DuplicateOrder*"]
HTTP_422 = ["*InventoryUnavailable*"]
HTTP_402 = ["*PaymentFailed*"]
```

A glob matches the returned Cause's type simple name only, never the message and never an enum constant. Where no pattern sets a status, a transient cause answers 503 and a validation cause 422; `default` is the fallback for the rest. Without `strict = true` the processor only warns about concrete `Cause` types no pattern reaches.

## Pattern Matching in Slice Code

```java
.recover(this::handlePaymentFailure)

private Promise<ProcessResponse> handlePaymentFailure(Cause cause) {
    return switch (cause) {
        case OrderError.PaymentFailed pf -> retryWithBackup(pf);
        case OrderError.InventoryUnavailable _ -> waitAndRetry();
        default -> cause.promise();
    };
}
```

`retryWithBackup` and `waitAndRetry` are the caller's own code: the runtime does not re-send a slice-to-slice call that may have reached its target, so a retry here is the caller's decision, and the method it calls again must be idempotent.
