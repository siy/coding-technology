# Chapter 15b: Focused Example - TransferFunds

This focused example demonstrates **Aspects** for cross-cutting concerns in a financial domain with audit requirements.

---

## Requirements

**Business Goal:** Transfer funds between accounts with full audit trail.

**Flow:**
1. Validate transfer request
2. Verify source account has sufficient balance
3. Execute the transfer (debit source, credit destination)
4. Record audit log

**Regulatory Requirements:**
- Every operation must be logged with timestamp, actor, and outcome
- Failed operations must also be logged (not just successes)
- Audit logging must not fail the transfer (best-effort)
- All transfers above threshold require additional authorization

**Technical Requirements:**
- Idempotency - same request ID must not execute twice
- Timeout - external calls must timeout after 5 seconds
- Retry - transient failures should retry up to 3 times

---

## Domain Model

```java
public record AccountId(String value) { /* factory omitted */ }

public record TransferId(String value) { /* factory omitted */ }

public record Money(BigDecimal value) {
    public boolean isGreaterThan(Money other) {
        return this.value.compareTo(other.value) > 0;
    }

    public Money subtract(Money other) {
        return new Money(this.value.subtract(other.value));
    }

    public Money add(Money other) {
        return new Money(this.value.add(other.value));
    }
}

public record TransferRequest(
    String requestId,
    String sourceAccountId,
    String destinationAccountId,
    String amount,
    String initiatedBy
) {}

public record TransferResult(
    TransferId transferId,
    Money amount,
    Instant completedAt
) {}
```

---

## Error Types

```java
public sealed interface TransferError extends Cause {

    enum General implements TransferError {
        INSUFFICIENT_FUNDS("Insufficient funds in source account"),
        SAME_ACCOUNT("Cannot transfer to same account"),
        DUPLICATE_REQUEST("Transfer request already processed"),
        ACCOUNT_NOT_FOUND("Account not found"),
        TRANSFER_FAILED("Transfer execution failed");

        private final String message;

        General(String message) {
            this.message = message;
        }

        @Override
        public String message() {
            return message;
        }
    }

    record AuthorizationRequired(Money amount, Money threshold) implements TransferError {
        @Override
        public String message() {
            return String.format("Transfer of %s requires authorization (threshold: %s)",
                amount.value(), threshold.value());
        }
    }
}
```

---

## Validated Request

```java
public record ValidTransfer(
    String requestId,
    AccountId sourceAccount,
    AccountId destinationAccount,
    Money amount,
    String initiatedBy
) {
    public static Result<ValidTransfer> validTransfer(TransferRequest raw) {
        return Result.all(
            validateRequestId(raw.requestId()),
            AccountId.accountId(raw.sourceAccountId()),
            AccountId.accountId(raw.destinationAccountId()),
            Money.money(raw.amount()),
            validateInitiator(raw.initiatedBy())
        ).flatMap(ValidTransfer::validateNotSameAccount);
    }

    private static Result<ValidTransfer> validateNotSameAccount(
        String requestId,
        AccountId source,
        AccountId destination,
        Money amount,
        String initiatedBy
    ) {
        if (source.value().equals(destination.value())) {
            return TransferError.General.SAME_ACCOUNT.result();
        }
        return Result.success(new ValidTransfer(requestId, source, destination, amount, initiatedBy));
    }

    private static Result<String> validateRequestId(String requestId) {
        return Verify.ensure(requestId, Verify.Is::notBlank)
            .mapError(_ -> Causes.cause("Request ID is required"));
    }

    private static Result<String> validateInitiator(String initiatedBy) {
        return Verify.ensure(initiatedBy, Verify.Is::notBlank)
            .mapError(_ -> Causes.cause("Initiator is required"));
    }
}
```

---

## Use Case with Aspects

```java
public interface TransferFunds {

    Promise<TransferResult> execute(TransferRequest request);

    // Step interfaces
    interface CheckIdempotency {
        Promise<ValidTransfer> apply(ValidTransfer transfer);
    }

    interface CheckBalance {
        Promise<ValidTransfer> apply(ValidTransfer transfer);
    }

    interface ExecuteTransfer {
        Promise<TransferResult> apply(ValidTransfer transfer);
    }

    interface AuditLog {
        Promise<Unit> apply(AuditEntry entry);
    }

    // Factory with aspect composition
    static TransferFunds transferFunds(
        CheckIdempotency checkIdempotency,
        CheckBalance checkBalance,
        ExecuteTransfer executeTransfer,
        AuditLog auditLog,
        TimeSpan timeout,
        RetryPolicy retryPolicy
    ) {
        // Wrap executeTransfer with aspects
        var decoratedExecute = withRetry(retryPolicy,
            withTimeout(timeout,
                withAudit(auditLog, executeTransfer)
            )
        );

        return request -> ValidTransfer.validTransfer(request)
            .async()
            .flatMap(checkIdempotency::apply)
            .flatMap(checkBalance::apply)
            .flatMap(decoratedExecute);
    }

    // ASPECT: Timeout
    private static Fn1<ValidTransfer, Promise<TransferResult>> withTimeout(
        TimeSpan timeout,
        Fn1<ValidTransfer, Promise<TransferResult>> step
    ) {
        return transfer -> step.apply(transfer).timeout(timeout);
    }

    // ASPECT: Retry
    private static Fn1<ValidTransfer, Promise<TransferResult>> withRetry(
        RetryPolicy policy,
        Fn1<ValidTransfer, Promise<TransferResult>> step
    ) {
        return transfer -> retryWithPolicy(policy, () -> step.apply(transfer));
    }

    private static Promise<TransferResult> retryWithPolicy(
        RetryPolicy policy,
        Supplier<Promise<TransferResult>> operation
    ) {
        return operation.get()
            .recover(cause -> {
                if (policy.shouldRetry(cause) && policy.attemptsRemaining() > 0) {
                    return retryWithPolicy(policy.decrementAttempts(), operation);
                }
                return cause.promise();
            });
    }

    // ASPECT: Audit (wraps execution with before/after logging)
    private static Fn1<ValidTransfer, Promise<TransferResult>> withAudit(
        AuditLog auditLog,
        Fn1<ValidTransfer, Promise<TransferResult>> step
    ) {
        return transfer -> {
            var startTime = Instant.now();

            return step.apply(transfer)
                .onResult(result -> logAuditEntry(auditLog, transfer, result, startTime));
        };
    }

    private static void logAuditEntry(
        AuditLog auditLog,
        ValidTransfer transfer,
        Result<TransferResult> result,
        Instant startTime
    ) {
        var entry = new AuditEntry(
            transfer.requestId(),
            "TRANSFER",
            transfer.initiatedBy(),
            startTime,
            Instant.now(),
            result.isSuccess() ? "SUCCESS" : "FAILURE",
            result.fold(Cause::message, r -> "Transfer completed: " + r.transferId().value())
        );

        // Best-effort: log but don't fail if audit fails
        auditLog.apply(entry)
            .onFailure(e -> { /* log to fallback */ });
    }
}
```

---

## Supporting Types

### AuditEntry

```java
public record AuditEntry(
    String requestId,
    String operation,
    String initiatedBy,
    Instant startedAt,
    Instant completedAt,
    String outcome,
    String details
) {}
```

### RetryPolicy

```java
public record RetryPolicy(
    int maxAttempts,
    int attemptsRemaining,
    Set<Class<? extends Cause>> retryableErrors
) {
    public static RetryPolicy retryPolicy(int maxAttempts, Set<Class<? extends Cause>> retryableErrors) {
        return new RetryPolicy(maxAttempts, maxAttempts, retryableErrors);
    }

    public boolean shouldRetry(Cause cause) {
        return retryableErrors.stream()
            .anyMatch(errorClass -> errorClass.isInstance(cause));
    }

    public RetryPolicy decrementAttempts() {
        return new RetryPolicy(maxAttempts, attemptsRemaining - 1, retryableErrors);
    }
}
```

---

## Step Implementations

### CheckIdempotency

```java
public class IdempotencyChecker implements TransferFunds.CheckIdempotency {
    private final IdempotencyStore store;

    public IdempotencyChecker(IdempotencyStore store) {
        this.store = store;
    }

    @Override
    public Promise<ValidTransfer> apply(ValidTransfer transfer) {
        return Promise.lift(
            _ -> TransferError.General.TRANSFER_FAILED,
            () -> store.exists(transfer.requestId())
        ).flatMap(exists -> exists
            ? TransferError.General.DUPLICATE_REQUEST.promise()
            : Promise.success(transfer));
    }
}
```

### CheckBalance

```java
public class BalanceChecker implements TransferFunds.CheckBalance {
    private final AccountRepository accounts;

    public BalanceChecker(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @Override
    public Promise<ValidTransfer> apply(ValidTransfer transfer) {
        return accounts.getBalance(transfer.sourceAccount())
            .flatMap(balance -> balance.isGreaterThan(transfer.amount())
                ? Promise.success(transfer)
                : TransferError.General.INSUFFICIENT_FUNDS.promise());
    }
}
```

### ExecuteTransfer

```java
public class TransferExecutor implements TransferFunds.ExecuteTransfer {
    private final AccountRepository accounts;
    private final IdempotencyStore idempotencyStore;

    @Override
    public Promise<TransferResult> apply(ValidTransfer transfer) {
        return Promise.lift(
            _ -> TransferError.General.TRANSFER_FAILED,
            () -> executeInTransaction(transfer)
        );
    }

    private TransferResult executeInTransaction(ValidTransfer transfer) {
        // Transaction boundary
        accounts.debit(transfer.sourceAccount(), transfer.amount());
        accounts.credit(transfer.destinationAccount(), transfer.amount());
        idempotencyStore.record(transfer.requestId());

        return new TransferResult(
            new TransferId(UUID.randomUUID().toString()),
            transfer.amount(),
            Instant.now()
        );
    }
}
```

---

## Key Points: Aspects Pattern

### What Aspects Are

Aspects are **higher-order functions** that wrap step execution with cross-cutting concerns. They form a composition chain:

```
Request -> [Retry -> [Timeout -> [Audit -> Execute]]]
```

### Aspect Composition Order

The order matters. Aspects are applied **outside-in**:

```java
var decorated = withRetry(policy,      // 1. Outer: retry wraps everything
    withTimeout(timeout,                // 2. Middle: timeout per attempt
        withAudit(auditLog, execute)    // 3. Inner: audit each attempt
    )
);
```

This means:
- Retry wraps timeout (each retry attempt has its own timeout)
- Timeout wraps audit (audit happens within timeout)
- Audit wraps execute (execution is audited)

### Standard Composition Order

For most use cases:

1. **Metrics/Logging** (outermost) - Observe everything
2. **Timeout** - Limit total time
3. **Circuit Breaker** - Fail fast if service unhealthy
4. **Retry** - Retry transient failures
5. **Rate Limit** - Control request rate
6. **Business Logic** (innermost) - Actual operation

### Aspect Independence

Each aspect is independent and testable:

```java
@Test
void withTimeout_fails_whenTimeoutExceeds() {
    var slowStep = transfer -> Promise.<TransferResult>promise()
        .timeout(TimeSpan.timeSpan(100).millis());  // Never resolves

    var decorated = withTimeout(TimeSpan.timeSpan(50).millis(), slowStep);

    decorated.apply(validTransfer())
        .await()
        .onSuccess(Assertions::fail);  // Should timeout
}
```

---

## Testing

```java
class TransferFundsTest {

    @Nested
    class Aspects {

        @Test
        void execute_retriesOnTransientFailure() {
            var attempts = new AtomicInteger(0);

            TransferFunds.ExecuteTransfer failingThenSucceeding = transfer -> {
                if (attempts.incrementAndGet() < 3) {
                    return new TransientError().promise();
                }
                return Promise.success(new TransferResult(
                    new TransferId("tx-123"),
                    transfer.amount(),
                    Instant.now()
                ));
            };

            var policy = RetryPolicy.retryPolicy(3, Set.of(TransientError.class));

            var useCase = TransferFunds.transferFunds(
                t -> Promise.success(t),
                t -> Promise.success(t),
                failingThenSucceeding,
                e -> Promise.success(Unit.INSTANCE),
                TimeSpan.timeSpan(5).seconds(),
                policy
            );

            useCase.execute(validRequest())
                .await()
                .onFailure(Assertions::fail)
                .onSuccess(result -> assertEquals(3, attempts.get()));
        }

        @Test
        void execute_auditsSuccessfulTransfer() {
            var auditedEntries = new ArrayList<AuditEntry>();

            TransferFunds.AuditLog auditLog = entry -> {
                auditedEntries.add(entry);
                return Promise.success(Unit.INSTANCE);
            };

            var useCase = TransferFunds.transferFunds(
                t -> Promise.success(t),
                t -> Promise.success(t),
                t -> Promise.success(new TransferResult(new TransferId("tx-123"), t.amount(), Instant.now())),
                auditLog,
                TimeSpan.timeSpan(5).seconds(),
                RetryPolicy.retryPolicy(0, Set.of())
            );

            useCase.execute(validRequest())
                .await()
                .onFailure(Assertions::fail);

            assertEquals(1, auditedEntries.size());
            assertEquals("SUCCESS", auditedEntries.get(0).outcome());
        }

        @Test
        void execute_auditsFailedTransfer() {
            var auditedEntries = new ArrayList<AuditEntry>();

            TransferFunds.AuditLog auditLog = entry -> {
                auditedEntries.add(entry);
                return Promise.success(Unit.INSTANCE);
            };

            var useCase = TransferFunds.transferFunds(
                t -> Promise.success(t),
                t -> TransferError.General.INSUFFICIENT_FUNDS.promise(),
                t -> Promise.success(new TransferResult(new TransferId("tx-123"), t.amount(), Instant.now())),
                auditLog,
                TimeSpan.timeSpan(5).seconds(),
                RetryPolicy.retryPolicy(0, Set.of())
            );

            useCase.execute(validRequest())
                .await()
                .onSuccess(Assertions::fail);

            // Audit still captured even though transfer failed
            assertEquals(1, auditedEntries.size());
            assertEquals("FAILURE", auditedEntries.get(0).outcome());
        }

        @Test
        void execute_succeedsEvenIfAuditFails() {
            TransferFunds.AuditLog failingAudit = entry ->
                Causes.cause("Audit service unavailable").promise();

            var useCase = TransferFunds.transferFunds(
                t -> Promise.success(t),
                t -> Promise.success(t),
                t -> Promise.success(new TransferResult(new TransferId("tx-123"), t.amount(), Instant.now())),
                failingAudit,
                TimeSpan.timeSpan(5).seconds(),
                RetryPolicy.retryPolicy(0, Set.of())
            );

            // Transfer should succeed even if audit fails
            useCase.execute(validRequest())
                .await()
                .onFailure(Assertions::fail);
        }
    }

    private TransferRequest validRequest() {
        return new TransferRequest(
            "req-123",
            "acc-source",
            "acc-dest",
            "100.00",
            "user@example.com"
        );
    }

    static class TransientError implements Cause {
        @Override
        public String message() {
            return "Transient error";
        }
    }
}
```

---

## Exercises

1. **Add circuit breaker:** Implement a circuit breaker aspect that fails fast after N consecutive failures.

2. **Add rate limiting:** Implement a rate limit aspect that rejects requests exceeding N per second.

3. **Add metrics:** Create a metrics aspect that records duration and success/failure counts.

4. **Conditional aspects:** Modify the factory to only apply audit logging for transfers above a threshold amount.

---

## Summary

TransferFunds demonstrates:

- **Aspects as higher-order functions** - Wrap step execution with cross-cutting concerns
- **Composition order matters** - Outside-in application (retry wraps timeout wraps audit)
- **Independent and testable** - Each aspect tested in isolation
- **Best-effort operations** - Audit failure doesn't fail the transfer
- **Idempotency pattern** - Prevent duplicate processing
- **Retry with policy** - Configurable retry behavior based on error type
