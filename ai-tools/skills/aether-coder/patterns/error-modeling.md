# Error Modeling

## Sealed Cause Hierarchy

```java
sealed interface OrderError extends Cause {
    enum General implements OrderError {
        DUPLICATE_ORDER("Order already exists"),
        INVENTORY_UNAVAILABLE("Requested items not available");
        private final String message;
        General(String message) { this.message = message; }
        @Override public String message() { return message; }
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

**Convention:** Enum for fixed-message errors, records for errors with context data. Records carry a trailing `String message` component. Each has a type-named factory (`customerNotFound(...)`) that delegates to its `FACTORY`; callers use the type-named factory.

## HTTP Status Mapping (routes.toml)

```toml
[errors]
default = 500
HTTP_404 = ["*NotFound*"]
HTTP_409 = ["*DUPLICATE_ORDER*"]
HTTP_422 = ["*INVENTORY_UNAVAILABLE*"]
HTTP_402 = ["*PaymentFailed*"]
```

Glob patterns match against Cause type names.

## Pattern Matching in Slice Code

```java
.recover(this::handlePaymentFailure)

private Promise<ProcessResponse> handlePaymentFailure(Cause cause) {
    return switch (cause) {
        case OrderError.PaymentFailed pf -> retryWithBackup(pf);
        case OrderError.General.INVENTORY_UNAVAILABLE -> waitAndRetry();
        default -> cause.promise();
    };
}
```
