# Slice Interface & Factory

## Core Contract

Every slice is a Java interface annotated with `@Slice`:

```java
@Slice
public interface Payments {
    record ProcessRequest(String orderId, Money amount, PaymentMethod method) {
        static ProcessRequest processRequest(String orderId, Money amount, PaymentMethod method) {
            return new ProcessRequest(orderId, amount, method);
        }
    }
    record ProcessResponse(String transactionId, PaymentStatus status) {
        static ProcessResponse processResponse(String transactionId, PaymentStatus status) {
            return new ProcessResponse(transactionId, status);
        }
    }

    sealed interface PaymentError extends Cause {
        record Declined(String reason, String message) implements PaymentError {
            static final Fn1<Declined, String> FACTORY =
                Causes.forOneValue("Payment declined: %s", Declined::new);

            static Declined declined(String reason) { return FACTORY.apply(reason); }
        }
        record GatewayTimeout(String message) implements PaymentError {
            static GatewayTimeout gatewayTimeout() { return new GatewayTimeout("Payment gateway timeout"); }
        }
        record InvalidCard(String reason, String message) implements PaymentError {
            static final Fn1<InvalidCard, String> FACTORY =
                Causes.forOneValue("Invalid card: %s", InvalidCard::new);

            static InvalidCard invalidCard(String reason) { return FACTORY.apply(reason); }
        }
    }

    Promise<ProcessResponse> processPayment(ProcessRequest request);
    Promise<ProcessResponse> processRefund(RefundRequest request);

    static Payments payments(@Sql SqlConnector db,
                             Inventory inventory) {
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
- Name a slice after its business capability (`Ordering`, `Payments`, `Inventory`), not `...Service`
- Each failure that needs its own HTTP status is its own record type (`Declined`, `GatewayTimeout`, `InvalidCard`): `routes.toml` globs match the Cause type name, and every constant of one enum is the same type (see [routes-toml.md](../deployment/routes-toml.md))
- Every method must be idempotent: the runtime re-sends only at the HTTP entry node and in event delivery, but a request still repeats (HTTP entry re-send, client resend, event redelivery, a declared retry), and a slice-to-slice call that may have reached its target is never re-sent for you. Use an idempotency key or a conditional write (`ON CONFLICT`); see [inter-slice.md](inter-slice.md)
- JBCT patterns apply: lambdas for single-method slices, inline records for multi-method

## Single-Method Slice (Lambda)

```java
static Payments payments(@Sql SqlConnector db) {
    return request -> processPayment(db, request);
}
```

## Multi-Method Slice (Inline Record)

```java
static Payments payments(@Sql SqlConnector db, Inventory inventory) {
    record payments(SqlConnector db, Inventory inventory) implements Payments {
        @Override
        public Promise<ProcessResponse> processPayment(ProcessRequest request) { ... }
        @Override
        public Promise<ProcessResponse> processRefund(RefundRequest request) { ... }
    }
    return new payments(db, inventory);
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
