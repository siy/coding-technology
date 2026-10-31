# Focused Example - TransferFunds

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
        ACCOUNT_NOT_FOUND("Account not found");

        private final String message;

        General(String message) {
            this.message = message;
        }

        @Override
        public String message() {
            return message;
        }
    }

    record AuthorizationRequired(Money amount, Money threshold, String message) implements TransferError {
        static final Fn2<AuthorizationRequired, Money, Money> FACTORY =
            Causes.forTwoValues("Transfer of %s requires authorization (threshold: %s)",
                                AuthorizationRequired::new);
    }

    record TransferFailed(Cause origin, String message) implements TransferError, Cause.Wrapped {
        static final Fn1<TransferFailed, Cause> FACTORY =
            Causes.forOneValue("Transfer execution failed", TransferFailed::new);
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
        return Verify.ensure(requestId, Verify.Is::notBlank, Causes.cause("Request ID is required"));
    }

    private static Result<String> validateInitiator(String initiatedBy) {
        return Verify.ensure(initiatedBy, Verify.Is::notBlank, Causes.cause("Initiator is required"));
    }
}
```

---

## Use Case with Aspects

```java
@UseCase
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

    interface RecordAudit {
        Promise<Unit> apply(AuditEntry entry);
    }

    // Factory with aspect composition
    static TransferFunds transferFunds(
        CheckIdempotency checkIdempotency,
        CheckBalance checkBalance,
        ExecuteTransfer executeTransfer,
        RecordAudit auditLog,
        TimeSpan timeout,
        RetryPolicy retryPolicy
    ) {
        // Wrap executeTransfer with aspects
        var decoratedExecute = withRetry(retryPolicy,
            withTimeout(timeout,
                withAudit(auditLog, executeTransfer::apply)
            )
        );

        return request -> ValidTransfer.validTransfer(request)
            .async()
            .flatMap(checkIdempotency::apply)
            .flatMap(checkBalance::apply)
            .flatMap(decoratedExecute);
    }

    // ASPECT: Timeout
    private static Fn1<Promise<TransferResult>, ValidTransfer> withTimeout(
        TimeSpan timeout,
        Fn1<Promise<TransferResult>, ValidTransfer> step
    ) {
        return transfer -> step.apply(transfer).timeout(timeout);
    }

    // ASPECT: Retry
    private static Fn1<Promise<TransferResult>, ValidTransfer> withRetry(
        RetryPolicy policy,
        Fn1<Promise<TransferResult>, ValidTransfer> step
    ) {
        return transfer -> retryWithPolicy(policy, () -> step.apply(transfer));
    }

    private static Promise<TransferResult> retryWithPolicy(
        RetryPolicy policy,
        Supplier<Promise<TransferResult>> operation
    ) {
        return operation.get()
            .fold(result -> result.fold(cause -> retryOrFail(policy, operation, cause),
                                        Promise::success));
    }

    private static Promise<TransferResult> retryOrFail(
        RetryPolicy policy,
        Supplier<Promise<TransferResult>> operation,
        Cause cause
    ) {
        return policy.shouldRetry(cause) && policy.attemptsRemaining() > 0
            ? retryWithPolicy(policy.decrementAttempts(), operation)
            : cause.promise();
    }

    // ASPECT: Audit (wraps execution with before/after logging)
    private static Fn1<Promise<TransferResult>, ValidTransfer> withAudit(
        RecordAudit auditLog,
        Fn1<Promise<TransferResult>, ValidTransfer> step
    ) {
        return transfer -> {
            var startTime = Instant.now();

            return step.apply(transfer)
                .onResult(result -> logAuditEntry(auditLog, transfer, result, startTime));
        };
    }

    private static void logAuditEntry(
        RecordAudit auditLog,
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

Each step stays nested in `TransferFunds`, and its static factory is the implementation.
`ExecuteTransfer` is an I/O step: its factory takes the database handle. `CheckIdempotency` and
`CheckBalance` make business decisions, so each is business code over a nested I/O leaf that
only loads - the same shape as `CheckEmailUniqueness` and its `FindUser`. jOOQ appears only in
the leaves' factories.

### CheckIdempotency

```java
interface CheckIdempotency {
    Promise<ValidTransfer> apply(ValidTransfer transfer);

    // I/O leaf: has this request already been processed?
    interface LoadProcessedFlag {
        Promise<Boolean> apply(String requestId);

        static LoadProcessedFlag loadProcessedFlag(DSLContext dsl) {
            return requestId -> Promise.lift(
                t -> TransferError.TransferFailed.FACTORY.apply(Causes.fromThrowable(t)),
                () -> dsl.fetchExists(PROCESSED_REQUESTS,
                                      PROCESSED_REQUESTS.REQUEST_ID.eq(requestId))
            );
        }
    }

    static CheckIdempotency checkIdempotency(LoadProcessedFlag loadProcessedFlag) {
        return transfer -> loadProcessedFlag.apply(transfer.requestId())
                                            .flatMap(processed -> rejectIfProcessed(processed, transfer));
    }

    private static Promise<ValidTransfer> rejectIfProcessed(boolean processed, ValidTransfer transfer) {
        return processed
            ? TransferError.General.DUPLICATE_REQUEST.promise()
            : Promise.success(transfer);
    }
}
```

### CheckBalance

```java
interface CheckBalance {
    Promise<ValidTransfer> apply(ValidTransfer transfer);

    // I/O leaf: the current balance of one account
    interface LoadBalance {
        Promise<Money> apply(AccountId accountId);

        static LoadBalance loadBalance(DSLContext dsl) {
            return accountId -> Promise.lift(
                t -> TransferError.TransferFailed.FACTORY.apply(Causes.fromThrowable(t)),
                () -> new Money(dsl.select(ACCOUNTS.BALANCE)
                                   .from(ACCOUNTS)
                                   .where(ACCOUNTS.ID.eq(accountId.value()))
                                   .fetchSingle(ACCOUNTS.BALANCE))
            );
        }
    }

    static CheckBalance checkBalance(LoadBalance loadBalance) {
        return transfer -> loadBalance.apply(transfer.sourceAccount())
                                      .flatMap(balance -> ensureSufficient(balance, transfer));
    }

    private static Promise<ValidTransfer> ensureSufficient(Money balance, ValidTransfer transfer) {
        return balance.isGreaterThan(transfer.amount())
            ? Promise.success(transfer)
            : TransferError.General.INSUFFICIENT_FUNDS.promise();
    }
}
```

### ExecuteTransfer

```java
interface ExecuteTransfer {
    Promise<TransferResult> apply(ValidTransfer transfer);

    static ExecuteTransfer executeTransfer(DSLContext dsl) {
        return transfer -> Promise.lift(
            t -> TransferError.TransferFailed.FACTORY.apply(Causes.fromThrowable(t)),
            () -> dsl.transactionResult(config -> executeInTransaction(config.dsl(), transfer))
        );
    }

    private static TransferResult executeInTransaction(DSLContext tx, ValidTransfer transfer) {
        // Transaction boundary: debit, credit and the idempotency record commit together
        tx.update(ACCOUNTS)
          .set(ACCOUNTS.BALANCE, ACCOUNTS.BALANCE.minus(transfer.amount().value()))
          .where(ACCOUNTS.ID.eq(transfer.sourceAccount().value()))
          .execute();
        tx.update(ACCOUNTS)
          .set(ACCOUNTS.BALANCE, ACCOUNTS.BALANCE.plus(transfer.amount().value()))
          .where(ACCOUNTS.ID.eq(transfer.destinationAccount().value()))
          .execute();
        tx.insertInto(PROCESSED_REQUESTS)
          .set(PROCESSED_REQUESTS.REQUEST_ID, transfer.requestId())
          .execute();

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
                    return TransientError.TRANSIENT_ERROR.promise();
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
                e -> Promise.success(Unit.unit()),
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

            TransferFunds.RecordAudit auditLog = entry -> {
                auditedEntries.add(entry);
                return Promise.success(Unit.unit());
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

            TransferFunds.RecordAudit auditLog = entry -> {
                auditedEntries.add(entry);
                return Promise.success(Unit.unit());
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
            TransferFunds.RecordAudit failingAudit = entry ->
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

    enum TransientError implements Cause {
        TRANSIENT_ERROR("Transient error");

        private final String message;

        TransientError(String message) { this.message = message; }

        @Override
        public String message() { return message; }
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
