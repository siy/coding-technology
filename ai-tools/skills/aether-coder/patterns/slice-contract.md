# Slice Interface & Factory

## Core Contract

Every slice is a Java interface annotated with `@Slice`:

```java
@Slice
public interface PaymentService {
    record ProcessRequest(String orderId, Money amount, PaymentMethod method) {}
    record ProcessResponse(String transactionId, PaymentStatus status) {}

    sealed interface PaymentError extends Cause {
        record Declined(String reason, String message) implements PaymentError {
            static final Fn1<Declined, String> FACTORY =
                Causes.forOneValue("Payment declined: %s", Declined::new);
        }
        enum General implements PaymentError {
            GATEWAY_TIMEOUT("Payment gateway timeout"),
            INVALID_CARD("Invalid card number");
            private final String message;
            General(String message) { this.message = message; }
            @Override public String message() { return message; }
        }
    }

    Promise<ProcessResponse> processPayment(ProcessRequest request);
    Promise<ProcessResponse> processRefund(RefundRequest request);

    static PaymentService paymentService(@Sql SqlConnector db,
                                          InventoryService inventory) {
        return request -> ValidPayment.validPayment(request)
                                       .async()
                                       .flatMap(valid -> chargeCard(db, valid))
                                       .flatMap(charged -> inventory.reserve(charged.orderId()));
    }
}
```

## Rules

- Interface name = PascalCase, factory method = camelCase of same name
- All methods return `Promise<T>` (never `Result<T>` or plain `T`)
- Factory parameters: resources (annotated), slice dependencies (interfaces), plain interfaces
- Request/Response/Error types nested inside the interface
- JBCT patterns apply: lambdas for single-method slices, inline records for multi-method

## Single-Method Slice (Lambda)

```java
static PaymentService paymentService(@Sql SqlConnector db) {
    return request -> processPayment(db, request);
}
```

## Multi-Method Slice (Inline Record)

```java
static PaymentService paymentService(@Sql SqlConnector db, InventoryService inventory) {
    record paymentService(SqlConnector db, InventoryService inventory) implements PaymentService {
        @Override
        public Promise<ProcessResponse> processPayment(ProcessRequest request) { ... }
        @Override
        public Promise<ProcessResponse> processRefund(RefundRequest request) { ... }
    }
    return new paymentService(db, inventory);
}
```

## Project Scaffolding

```bash
jbct init --slice \
  --group-id com.example \
  --artifact-id my-service \
  my-service
```

## Generated Artifacts

| Artifact | Pattern | Purpose |
|----------|---------|---------|
| API Interface | `{package}.api.{SliceName}` | Public contract for consumers |
| Factory Class | `{package}.{SliceName}Factory` | Resource provisioning + instantiation |
| Routes Class | `{package}.{SliceName}Routes` | HTTP routing from routes.toml |
| Manifest | `META-INF/slice/{SliceName}.manifest` | Deployment metadata |

`@Codec` is NOT needed on slice types — codecs are generated automatically.
