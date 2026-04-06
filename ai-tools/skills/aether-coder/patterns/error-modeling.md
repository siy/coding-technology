# Error Modeling

## Sealed Cause Hierarchy

```java
sealed interface OrderError extends Cause {
    enum General implements OrderError {
        DUPLICATE_ORDER("Order already exists"),
        INVENTORY_UNAVAILABLE("Requested items not available");
        private final String msg;
        General(String msg) { this.msg = msg; }
        @Override public String message() { return msg; }
    }
    record CustomerNotFound(String customerId) implements OrderError {
        public String message() { return "Customer not found: " + customerId; }
    }
    record PaymentFailed(String reason, String transactionId) implements OrderError {
        public String message() { return "Payment failed: " + reason; }
    }
}
```

**Convention:** Enum for fixed-message errors, records for errors with context data.

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
