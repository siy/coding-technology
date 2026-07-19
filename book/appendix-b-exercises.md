# Appendix B: Exercises and Solutions

This appendix contains exercises for each part of the book, organized by difficulty level. Each exercise includes a solution with explanation.

**Difficulty Levels:**
- [Beginner] Beginner - Direct application of concepts
- [Intermediate] Intermediate - Combining multiple concepts
- [Advanced] Advanced - Design decisions and trade-offs

---

## Observation Exercises

These warm-ups require no code changes - just observation. Before working through the implementation exercises below, spend a few minutes with your current codebase:

- Find one place that uses `orElse(null)` with `Optional`. Consider how `Option` would make that type-safe.
- Find one method that throws exceptions for business failures. Think about how `Result<T>` would make those failures explicit in the type signature.
- Find one async operation using `CompletableFuture`. Notice the complexity of error handling - `Promise<T>` simplifies that pattern.

Don't change anything yet - just observe the patterns. The implementation exercises that follow will show you how to refactor them.

---

## Part I: Foundations (Chapters 1-3)

### Exercise 1.1 [Beginner] - Return Type Selection

For each scenario, identify the correct return type (T, Option, Result, Promise):

1. A method that calculates the sum of two integers
2. A method that finds a user's middle name (not all users have one)
3. A method that parses a date string
4. A method that fetches a user profile from a remote API
5. A method that validates an email format
6. A method that looks up a value in an in-memory cache

<details>
<summary>Solution</summary>

1. **T** - Pure calculation, cannot fail
2. **Option** - Absence is normal, not an error
3. **Result** - Parsing can fail with a reason
4. **Promise** - Remote I/O, can fail asynchronously
5. **Result** - Validation can fail with a reason
6. **Option** - Cache miss is normal, not an error

</details>

---

### Exercise 1.2 [Beginner] - Option vs Result

Explain why each of these uses the wrong type and provide the correct signature:

```java
// A
public Optional<User> authenticate(String email, String password) {
    // Returns empty if credentials invalid
}

// B
public Result<Config> getOptionalConfig(String key) {
    // Returns failure if config key doesn't exist
}
```

<details>
<summary>Solution</summary>

**A is wrong:** Authentication failure is an error with a reason (wrong password, account locked, user not found). Should be:
```java
public Result<User> authenticate(String email, String password)
```

**B is wrong:** "Optional config" implies absence is expected, not an error. Should be:
```java
public Option<Config> getOptionalConfig(String key)
```

</details>

---

### Exercise 1.3 [Intermediate] - Type Lifting

Complete the following code to properly lift between types:

```java
public Promise<UserProfile> loadProfile(String userId) {
    // 1. Parse userId to UserId value object (Result<UserId>)
    // 2. Look up in cache (Option<UserProfile>)
    // 3. If not in cache, fetch from database (Promise<UserProfile>)

    Result<UserId> id = UserId.userId(userId);
    // TODO: Complete the chain
}
```

<details>
<summary>Solution</summary>

```java
public Promise<UserProfile> loadProfile(String userId) {
    return UserId.userId(userId)
        .async()  // Result -> Promise
        .flatMap(id -> cache.get(id)
            .async(CACHE_MISS)  // Option -> Promise (with cause for empty)
            .orElse(database.fetchProfile(id)));
}

// Alternative: if cache miss should fall through silently
public Promise<UserProfile> loadProfile(String userId) {
    return UserId.userId(userId)
        .async()
        .flatMap(id -> cache.get(id)
            .map(Promise::success)
            .or(() -> database.fetchProfile(id)));
}
```

</details>

---

### Exercise 1.4 [Beginner] - Cause Creation

Create appropriate Cause definitions for a user registration system:

1. Email already exists
2. Password too weak (should include the specific weakness)
3. Username contains invalid characters (should show which characters)

<details>
<summary>Solution</summary>

```java
public sealed interface RegistrationError extends Cause {

    record EmailExists(String email) implements RegistrationError {
        private static final Fn1<Cause, String> FACTORY =
            Causes.forOneValue("Email already registered: %s");

        @Override
        public String message() {
            return FACTORY.apply(email).message();
        }
    }

    record WeakPassword(String weakness) implements RegistrationError {
        private static final Fn1<Cause, String> FACTORY =
            Causes.forOneValue("Password too weak: %s");

        @Override
        public String message() {
            return FACTORY.apply(weakness).message();
        }
    }

    record InvalidUsername(String invalidChars) implements RegistrationError {
        private static final Fn1<Cause, String> FACTORY =
            Causes.forOneValue("Username contains invalid characters: %s");

        @Override
        public String message() {
            return FACTORY.apply(invalidChars).message();
        }
    }
}
```

</details>

---

### Exercise 1.5 [Intermediate] - Pragmatica Core Operations

What does each expression evaluate to?

```java
// Given:
Result<Integer> success = Result.success(10);
Result<Integer> failure = Causes.cause("error").result();

// 1.
success.map(x -> x * 2).or(0)

// 2.
failure.map(x -> x * 2).or(0)

// 3.
success.filter(Causes.cause("not positive"), x -> x > 0)

// 4.
success.filter(Causes.cause("not negative"), x -> x < 0)

// 5.
Result.all(success, failure).map((a, b) -> a + b)
```

<details>
<summary>Solution</summary>

1. `20` - maps 10 to 20, or() returns value
2. `0` - failure skips map, or() returns fallback
3. `Result.success(10)` - predicate passes
4. `Result.failure(Cause("not negative"))` - predicate fails
5. `Result.failure(Cause("error"))` - all() accumulates failure from second

</details>

---

## Part II: Core Principles (Chapters 4-6)

### Exercise 2.1 [Beginner] - Value Object Creation

Create a `PhoneNumber` value object that:
- Accepts strings in format "+1-555-123-4567" or "5551234567"
- Normalizes to digits only
- Must be 10-15 digits

<details>
<summary>Solution</summary>

```java
public record PhoneNumber(String value) {
    private static final Pattern DIGITS_ONLY = Pattern.compile("\\d+");
    private static final Cause INVALID_FORMAT =
        Causes.cause("Phone number must contain only digits, dashes, and optional leading +");
    private static final Cause INVALID_LENGTH =
        Causes.cause("Phone number must be 10-15 digits");

    public static Result<PhoneNumber> phoneNumber(String raw) {
        return Verify.ensure(raw, Verify.Is::notBlank)
            .map(PhoneNumber::normalize)
            .filter(INVALID_FORMAT, PhoneNumber::isValidFormat)
            .filter(INVALID_LENGTH, s -> Verify.Is.lenBetween(s, 10, 15))
            .map(PhoneNumber::new);
    }

    private static String normalize(String input) {
        return input.replaceAll("[^0-9]", "");
    }

    private static boolean isValidFormat(String normalized) {
        return DIGITS_ONLY.matcher(normalized).matches();
    }
}
```

</details>

---

### Exercise 2.2 [Intermediate] - Aggregate Validation

Create a `DateRange` value object with `from` and `to` LocalDate fields where:
- Both dates are required
- `from` must be before or equal to `to`
- Neither date can be in the past

<details>
<summary>Solution</summary>

```java
public record DateRange(LocalDate from, LocalDate to) {
    private static final Cause FROM_AFTER_TO =
        Causes.cause("Start date must be before or equal to end date");
    private static final Cause FROM_IN_PAST =
        Causes.cause("Start date cannot be in the past");
    private static final Cause TO_IN_PAST =
        Causes.cause("End date cannot be in the past");

    public static Result<DateRange> dateRange(String fromRaw, String toRaw) {
        var today = LocalDate.now();

        return Result.all(parseAndValidate(fromRaw, today, FROM_IN_PAST),
                         parseAndValidate(toRaw, today, TO_IN_PAST))
                     .flatMap(DateRange::validateOrder);
    }

    private static Result<LocalDate> parseAndValidate(String raw, LocalDate today, Cause pastError) {
        return DateTime.parseLocalDate(raw)
            .filter(pastError, date -> !date.isBefore(today));
    }

    private static Result<DateRange> validateOrder(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            return FROM_AFTER_TO.result();
        }
        return Result.success(new DateRange(from, to));
    }
}
```

</details>

---

### Exercise 2.3 [Intermediate] - Error Accumulation vs Short-Circuit

Explain the difference in behavior and output:

```java
// Version A
Result<ValidForm> validateA(Form form) {
    return Email.email(form.email())
        .flatMap(email -> Password.password(form.password())
            .map(password -> new ValidForm(email, password)));
}

// Version B
Result<ValidForm> validateB(Form form) {
    return Result.all(Email.email(form.email()),
                     Password.password(form.password()))
                 .map(ValidForm::new);
}
```

Given input with both invalid email AND invalid password, what does each return?

<details>
<summary>Solution</summary>

**Version A (short-circuit):**
Returns failure with ONLY the email error. flatMap stops at first failure.

**Version B (accumulation):**
Returns failure with BOTH errors in a CompositeCause. Result.all() collects all failures.

**When to use each:**
- Use flatMap chain when errors are dependent (later validations need earlier values)
- Use Result.all() when validations are independent and you want to show all errors to user

</details>

---

### Exercise 2.4 [Advanced] - Null Handling Strategy

Refactor this method to eliminate null handling:

```java
public User processUser(UserDto dto) {
    if (dto == null) {
        throw new IllegalArgumentException("DTO cannot be null");
    }

    String email = dto.getEmail();
    if (email == null || email.isBlank()) {
        throw new ValidationException("Email required");
    }

    String name = dto.getName();  // Optional field
    String normalizedName = name != null ? name.trim() : null;

    Address address = null;
    if (dto.getAddress() != null) {
        address = processAddress(dto.getAddress());
    }

    return new User(email.toLowerCase(), normalizedName, address);
}
```

<details>
<summary>Solution</summary>

```java
public Result<User> processUser(UserDto dto) {
    return Result.all(Email.email(dto.email()),
                     processOptionalName(dto.name()),
                     processOptionalAddress(dto.address()))
                 .map(User::new);
}

private Result<Option<Name>> processOptionalName(String raw) {
    return Option.option(raw)
        .map(String::trim)
        .filter(s -> !s.isBlank())
        .map(Name::new)
        .fold(
            () -> Result.success(Option.none()),
            name -> Result.success(Option.some(name))
        );
}

private Result<Option<Address>> processOptionalAddress(AddressDto dto) {
    return Option.option(dto)
        .map(this::validateAddress)
        .fold(
            () -> Result.success(Option.none()),
            result -> result.map(Option::some)
        );
}

// User record accepts Option types
public record User(Email email, Option<Name> name, Option<Address> address) {}
```

</details>

---

### Exercise 2.5 [Beginner] - Recovery Patterns

Complete the recovery logic:

```java
public Promise<Config> loadConfig() {
    return loadFromDatabase()
        // TODO: If database fails with ConnectionError, try file
        // TODO: If file fails with FileNotFound, use defaults
        // TODO: Any other error should propagate
        ;
}

private Promise<Config> loadFromDatabase() { /* ... */ }
private Promise<Config> loadFromFile() { /* ... */ }
private Config defaultConfig() { /* ... */ }
```

<details>
<summary>Solution</summary>

```java
public Promise<Config> loadConfig() {
    return loadFromDatabase()
        .fold(result -> result.fold(this::recoverFromDatabaseError, Promise::success));
}

private Promise<Config> recoverFromDatabaseError(Cause cause) {
    return switch (cause) {
        case ConnectionError ignored -> loadFromFile()
            .fold(result -> result.fold(this::recoverFromFileError, Promise::success));
        default -> cause.promise();
    };
}

private Promise<Config> recoverFromFileError(Cause cause) {
    return switch (cause) {
        case FileNotFound ignored -> Promise.success(defaultConfig());
        default -> cause.promise();
    };
}
```

</details>

---

## Part III: Patterns (Chapters 7-9)

### Exercise 3.1 [Beginner] - Pattern Identification

Identify the JBCT pattern used in each code snippet:

```java
// A
return validateOrder(request)
    .flatMap(this::checkInventory)
    .flatMap(this::processPayment)
    .flatMap(this::createShipment);

// B
return Promise.all(fetchUserProfile(userId),
                  fetchUserOrders(userId),
                  fetchUserPreferences(userId))
              .map(Dashboard::new);

// C
return switch (user.tier()) {
    case PREMIUM -> premiumProcessor.process(order);
    case STANDARD -> standardProcessor.process(order);
    case BASIC -> basicProcessor.process(order);
};

// D
return Promise.lift(DatabaseError::new,
                   () -> jdbcTemplate.query(sql, mapper));
```

<details>
<summary>Solution</summary>

- **A: Sequencer** - Linear chain of dependent steps
- **B: Fork-Join** - Parallel independent operations combined
- **C: Condition** - Routing based on discriminator
- **D: Leaf** - Adapter wrapping external I/O

</details>

---

### Exercise 3.2 [Intermediate] - Implement Fork-Join

Implement a dashboard loader that fetches three pieces of data in parallel:
- User profile (required)
- Recent orders (required)
- Recommendations (optional - use empty list on failure)

```java
public interface LoadDashboard {
    Promise<Dashboard> load(UserId userId);

    record Dashboard(UserProfile profile, List<Order> orders, List<Product> recommendations) {}
}
```

<details>
<summary>Solution</summary>

```java
public interface LoadDashboard {
    Promise<Dashboard> load(UserId userId);

    record Dashboard(UserProfile profile, List<Order> orders, List<Product> recommendations) {}

    interface FetchProfile {
        Promise<UserProfile> apply(UserId userId);
    }

    interface FetchOrders {
        Promise<List<Order>> apply(UserId userId);
    }

    interface FetchRecommendations {
        Promise<List<Product>> apply(UserId userId);
    }

    static LoadDashboard create(FetchProfile fetchProfile,
                                FetchOrders fetchOrders,
                                FetchRecommendations fetchRecommendations) {
        return userId -> Promise.all(fetchProfile.apply(userId),
                                    fetchOrders.apply(userId),
                                    fetchRecommendations.apply(userId)
                                        .recover(cause -> List.of()))
                                .map(Dashboard::new);
    }
}
```

</details>

---

### Exercise 3.3 [Intermediate] - Implement Condition Pattern

Implement a notification sender that routes based on user preference:

```java
public interface SendNotification {
    Promise<Unit> send(UserId userId, Message message);
}

public enum NotificationPreference {
    EMAIL, SMS, PUSH, NONE
}
```

<details>
<summary>Solution</summary>

```java
public interface SendNotification {
    Promise<Unit> send(UserId userId, Message message);

    interface GetPreference {
        Promise<NotificationPreference> apply(UserId userId);
    }

    interface SendEmail {
        Promise<Unit> apply(UserId userId, Message message);
    }

    interface SendSms {
        Promise<Unit> apply(UserId userId, Message message);
    }

    interface SendPush {
        Promise<Unit> apply(UserId userId, Message message);
    }

    static SendNotification create(GetPreference getPreference,
                                   SendEmail sendEmail,
                                   SendSms sendSms,
                                   SendPush sendPush) {
        return (userId, message) -> getPreference.apply(userId)
            .flatMap(pref -> routeByPreference(pref, userId, message,
                                               sendEmail, sendSms, sendPush));
    }

    private static Promise<Unit> routeByPreference(NotificationPreference pref,
                                                    UserId userId,
                                                    Message message,
                                                    SendEmail sendEmail,
                                                    SendSms sendSms,
                                                    SendPush sendPush) {
        return switch (pref) {
            case EMAIL -> sendEmail.apply(userId, message);
            case SMS -> sendSms.apply(userId, message);
            case PUSH -> sendPush.apply(userId, message);
            case NONE -> Promise.unitPromise();
        };
    }
}
```

</details>

---

### Exercise 3.4 [Advanced] - Implement Aspects

Add retry and timeout aspects to an existing step:

```java
public interface FetchData {
    Promise<Data> apply(DataId id);
}

// Requirements:
// - Retry up to 3 times on TransientError
// - Timeout after 5 seconds
// - Log each attempt
```

<details>
<summary>Solution</summary>

```java
public interface FetchData {
    Promise<Data> apply(DataId id);

    static FetchData withAspects(FetchData base, Logger log) {
        return id -> withRetry(withTimeout(base, id), id, log, 3);
    }

    private static Promise<Data> withTimeout(FetchData base, DataId id) {
        return base.apply(id)
            .timeout(TimeSpan.timeSpan(5).seconds());
    }

    private static Promise<Data> withRetry(Promise<Data> operation,
                                           DataId id,
                                           Logger log,
                                           int remainingAttempts) {
        return operation.fold(result -> result.fold(
            cause -> retryOnFailure(operation, id, log, remainingAttempts, cause),
            Promise::success));
    }

    private static Promise<Data> retryOnFailure(Promise<Data> operation,
                                                DataId id,
                                                Logger log,
                                                int remainingAttempts,
                                                Cause cause) {
        log.warn("Fetch failed for {}: {}", id, cause.message());

        if (remainingAttempts <= 0) {
            return cause.promise();
        }

        return switch (cause) {
            case TransientError ignored -> {
                log.info("Retrying fetch for {}, {} attempts remaining",
                         id, remainingAttempts);
                yield withRetry(operation, id, log, remainingAttempts - 1);
            }
            default -> cause.promise();
        };
    }
}
```

</details>

---

### Exercise 3.5 [Intermediate] - Thread Safety Analysis

Identify the thread safety issue and fix it:

```java
public class OrderProcessor {
    private List<Order> processedOrders = new ArrayList<>();
    private int totalAmount = 0;

    public Promise<OrderResult> process(Order order) {
        return validateOrder(order)
            .flatMap(this::chargePayment)
            .onSuccess(result -> {
                processedOrders.add(order);
                totalAmount += order.amount();
            })
            .map(OrderResult::new);
    }
}
```

<details>
<summary>Solution</summary>

**Issues:**
1. `processedOrders` is mutable and accessed from multiple threads (Promise callbacks)
2. `totalAmount` is a primitive with non-atomic read-modify-write
3. State mutation in callbacks violates JBCT principles

**Fix: Remove shared mutable state, return immutable results**

```java
public class OrderProcessor {
    public Promise<OrderResult> process(Order order) {
        return validateOrder(order)
            .flatMap(this::chargePayment)
            .map(payment -> new OrderResult(order, payment));
    }
}

// Track processed orders externally with thread-safe collection if needed
public record OrderResult(Order order, Payment payment) {
    public int amount() {
        return order.amount();
    }
}

// If aggregation is needed, do it at a higher level:
public Promise<BatchResult> processBatch(List<Order> orders) {
    return Promise.allOf(orders.stream()
                               .map(this::process)
                               .toList())
                  .map(this::aggregateResults);
}

private BatchResult aggregateResults(List<Result<OrderResult>> results) {
    // Immutable aggregation
    var successful = results.stream()
        .filter(Result::isSuccess)
        .map(r -> r.fold(cause -> null, identity()))
        .filter(Objects::nonNull)
        .toList();

    int total = successful.stream()
        .mapToInt(OrderResult::amount)
        .sum();

    return new BatchResult(successful, total);
}
```

</details>

---

## Part IV: Testing (Chapters 10-11)

### Exercise 4.1 [Beginner] - Test Structure

Write tests for this value object:

```java
public record Age(int value) {
    private static final Cause TOO_YOUNG = Causes.cause("Must be at least 0");
    private static final Cause TOO_OLD = Causes.cause("Must be at most 150");

    public static Result<Age> age(int value) {
        return Verify.ensure(value, Verify.Is::nonNegative)
            .filter(TOO_OLD, v -> Verify.Is.lessThanOrEqualTo(v, 150))
            .map(Age::new);
    }
}
```

<details>
<summary>Solution</summary>

```java
class AgeTest {

    @Test
    void age_succeeds_forValidValue() {
        Age.age(25)
           .onFailure(Assertions::fail)
           .onSuccess(age -> assertEquals(25, age.value()));
    }

    @Test
    void age_succeeds_forZero() {
        Age.age(0)
           .onFailure(Assertions::fail)
           .onSuccess(age -> assertEquals(0, age.value()));
    }

    @Test
    void age_succeeds_forMaximum() {
        Age.age(150)
           .onFailure(Assertions::fail)
           .onSuccess(age -> assertEquals(150, age.value()));
    }

    @Test
    void age_fails_forNegative() {
        Age.age(-1)
           .onSuccess(Assertions::fail);
    }

    @Test
    void age_fails_forTooOld() {
        Age.age(151)
           .onSuccess(Assertions::fail);
    }
}
```

</details>

---

### Exercise 4.2 [Intermediate] - Stub Implementation

Create test stubs for this use case:

```java
public interface TransferFunds {
    Promise<TransferResult> execute(TransferRequest request);

    interface ValidateAccounts {
        Promise<ValidatedAccounts> apply(AccountId from, AccountId to);
    }

    interface ExecuteTransfer {
        Promise<TransferId> apply(ValidatedAccounts accounts, Money amount);
    }
}
```

Write stubs for: success case, source account not found, insufficient funds.

<details>
<summary>Solution</summary>

```java
class TransferFundsTest {

    // Success stubs
    private static final ValidateAccounts VALID_ACCOUNTS =
        (from, to) -> Promise.success(new ValidatedAccounts(
            new Account(from, Money.money(1000)),
            new Account(to, Money.money(500))
        ));

    private static final ExecuteTransfer TRANSFER_SUCCESS =
        (accounts, amount) -> Promise.success(new TransferId("TXN-001"));

    // Failure stubs
    private static final ValidateAccounts SOURCE_NOT_FOUND =
        (from, to) -> TransferError.SOURCE_NOT_FOUND.promise();

    private static final ValidateAccounts INSUFFICIENT_FUNDS =
        (from, to) -> TransferError.INSUFFICIENT_FUNDS.promise();

    @Test
    void transfer_succeeds_forValidAccounts() {
        var useCase = TransferFunds.transferFunds(VALID_ACCOUNTS, TRANSFER_SUCCESS);
        var request = new TransferRequest(
            new AccountId("ACC-001"),
            new AccountId("ACC-002"),
            Money.money(100)
        );

        useCase.execute(request)
               .await()
               .onFailure(Assertions::fail)
               .onSuccess(result ->
                   assertEquals("TXN-001", result.transferId().value()));
    }

    @Test
    void transfer_fails_whenSourceNotFound() {
        var useCase = TransferFunds.transferFunds(SOURCE_NOT_FOUND, TRANSFER_SUCCESS);
        var request = new TransferRequest(
            new AccountId("INVALID"),
            new AccountId("ACC-002"),
            Money.money(100)
        );

        useCase.execute(request)
               .await()
               .onSuccess(Assertions::fail);
    }
}
```

</details>

---

### Exercise 4.3 [Intermediate] - Testing Async Behavior

Test that this use case properly times out:

```java
public interface SlowService {
    Promise<Data> fetch(DataId id);

    static SlowService withTimeout(SlowService base, TimeSpan timeout) {
        return id -> base.fetch(id).timeout(timeout);
    }
}
```

<details>
<summary>Solution</summary>

```java
class SlowServiceTest {

    @Test
    void fetch_timesOut_whenServiceTooSlow() {
        // Stub that never resolves
        SlowService neverResolves = id -> {
            Promise<Data> promise = Promise.promise();
            // Never call promise.succeed() or promise.fail()
            return promise;
        };

        var withTimeout = SlowService.withTimeout(
            neverResolves,
            TimeSpan.timeSpan(100).millis()
        );

        withTimeout.fetch(new DataId("test"))
                   .await(TimeSpan.timeSpan(500).millis())
                   .onSuccess(Assertions::fail)
                   .onFailure(cause ->
                       assertTrue(cause instanceof TimeoutError));
    }

    @Test
    void fetch_succeeds_whenServiceFastEnough() {
        SlowService fast = id -> Promise.success(new Data("result"));

        var withTimeout = SlowService.withTimeout(
            fast,
            TimeSpan.timeSpan(1).seconds()
        );

        withTimeout.fetch(new DataId("test"))
                   .await()
                   .onFailure(Assertions::fail)
                   .onSuccess(data ->
                       assertEquals("result", data.value()));
    }
}
```

</details>

---

## Part V: Production Systems (Chapters 12-15)

### Exercise 5.1 [Intermediate] - Complete Use Case Design

Design a use case interface for "Cancel Order" with these requirements:
- Validate order exists and belongs to user
- Only pending orders can be cancelled
- Refund payment if already charged
- Send cancellation notification

<details>
<summary>Solution</summary>

```java
public interface CancelOrder {
    Promise<CancellationResult> execute(CancelRequest request);

    record CancelRequest(UserId userId, OrderId orderId) {}
    record CancellationResult(OrderId orderId, Option<RefundId> refundId) {}

    // Step interfaces
    interface FindOrder {
        Promise<Order> apply(OrderId orderId);
    }

    interface ValidateOwnership {
        Promise<Order> apply(Order order, UserId userId);
    }

    interface ValidateCancellable {
        Promise<Order> apply(Order order);
    }

    interface ProcessRefund {
        Promise<Option<RefundId>> apply(Order order);
    }

    interface UpdateOrderStatus {
        Promise<Unit> apply(OrderId orderId, OrderStatus status);
    }

    interface SendNotification {
        Promise<Unit> apply(UserId userId, OrderId orderId);
    }

    static CancelOrder create(FindOrder findOrder,
                              ValidateOwnership validateOwnership,
                              ValidateCancellable validateCancellable,
                              ProcessRefund processRefund,
                              UpdateOrderStatus updateStatus,
                              SendNotification sendNotification) {
        return request -> findOrder.apply(request.orderId())
            .flatMap(order -> validateOwnership.apply(order, request.userId()))
            .flatMap(validateCancellable::apply)
            .flatMap(order -> processRefund.apply(order)
                .flatMap(refundId -> updateStatus.apply(order.id(), OrderStatus.CANCELLED)
                    .map(unit -> new CancellationResult(order.id(), refundId))))
            .onSuccess(result -> sendNotification.apply(request.userId(), request.orderId())
                .onFailure(cause -> log.warn("Notification failed", cause)));
    }
}
```

</details>

---

### Exercise 5.2 [Advanced] - Compensation Pattern

Implement a booking system where if any step fails, previous steps are rolled back:

```java
// Steps: Reserve seat → Charge payment → Send confirmation
// If payment fails, release the seat
// If confirmation fails, refund payment and release seat
```

<details>
<summary>Solution</summary>

```java
public interface BookSeat {
    Promise<Booking> execute(BookingRequest request);

    interface ReserveSeat {
        Promise<ReservationId> apply(SeatId seatId);
    }

    interface ReleaseSeat {
        Promise<Unit> apply(ReservationId reservationId);
    }

    interface ChargePayment {
        Promise<PaymentId> apply(UserId userId, Money amount);
    }

    interface RefundPayment {
        Promise<Unit> apply(PaymentId paymentId);
    }

    interface SendConfirmation {
        Promise<Unit> apply(UserId userId, ReservationId reservationId);
    }

    static BookSeat create(ReserveSeat reserveSeat,
                           ReleaseSeat releaseSeat,
                           ChargePayment chargePayment,
                           RefundPayment refundPayment,
                           SendConfirmation sendConfirmation) {
        return request -> reserveSeat.apply(request.seatId())
            .flatMap(reservationId ->
                chargePayment.apply(request.userId(), request.amount())
                    .fold(result -> result.fold(
                        cause -> compensateReservation(releaseSeat, reservationId, cause),
                        Promise::success))
                    .flatMap(paymentId ->
                        sendConfirmation.apply(request.userId(), reservationId)
                            .fold(result -> result.fold(
                                cause -> compensatePayment(
                                    releaseSeat, refundPayment,
                                    reservationId, paymentId, cause),
                                Promise::success))
                            .map(unit -> new Booking(reservationId, paymentId))));
    }

    private static Promise<PaymentId> compensateReservation(ReleaseSeat releaseSeat,
                                                             ReservationId reservationId,
                                                             Cause originalCause) {
        return releaseSeat.apply(reservationId)
            .flatMap(unit -> originalCause.promise());
    }

    private static Promise<Unit> compensatePayment(ReleaseSeat releaseSeat,
                                                    RefundPayment refundPayment,
                                                    ReservationId reservationId,
                                                    PaymentId paymentId,
                                                    Cause originalCause) {
        return Promise.all(releaseSeat.apply(reservationId),
                          refundPayment.apply(paymentId))
                      .flatMap((u1, u2) -> originalCause.promise());
    }
}
```

</details>

---

### Exercise 5.3 [Intermediate] - Project Structure

Given these classes, organize them into the correct package structure:

```java
RegisterUser (use case interface)
RegisterUserImpl (use case implementation - if needed)
ValidRegistration (validated request)
Email, Password, Username (value objects)
UserRepository (step interface)
JpaUserRepository (repository implementation)
RegistrationError (error types)
UserController (REST controller)
UserDto (API DTO)
```

<details>
<summary>Solution</summary>

```
src/main/java/com/example/user/
├── domain/
│   ├── Email.java              # Value object
│   ├── Password.java           # Value object
│   ├── Username.java           # Value object
│   └── RegistrationError.java  # Domain errors
├── usecase/
│   └── RegisterUser.java       # Use case with:
│                               #   - Request record
│                               #   - ValidRegistration record
│                               #   - Response record
│                               #   - Step interfaces (SaveUser, CheckEmailUnique, etc.)
│                               #   - Factory method
├── adapter/
│   ├── persistence/
│   │   └── JpaUserRepository.java  # Implements step interface
│   └── web/
│       ├── UserController.java     # REST controller
│       └── UserDto.java            # API DTO
└── config/
    └── UserConfiguration.java      # Spring wiring
```

**Notes:**
- `RegisterUserImpl` is not needed - factory method in interface creates implementation
- `ValidRegistration` is nested in `RegisterUser` as `ValidRequest` record
- `UserRepository` doesn't exist separately - it's a step interface inside use case

</details>

---

## Part VI: Adoption (Chapters 16-19)

### Exercise 6.1 [Beginner] - Code Review Checklist

Review this code for JBCT violations:

```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User createUser(String email, String password) {
        if (email == null || !email.contains("@")) {
            throw new ValidationException("Invalid email");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new EmailExistsException();
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));

        return userRepository.save(user);
    }
}
```

<details>
<summary>Solution</summary>

**Violations found:**

1. **Primitive obsession** - Using raw `String` for email and password instead of value objects
2. **Validation in wrong place** - Controller or service validating instead of value object factory
3. **Exceptions for business errors** - EmailExistsException should be a Cause in Result
4. **Mutable entity** - Using setters instead of immutable record
5. **Field injection** - Using @Autowired instead of constructor injection
6. **Missing use case interface** - Business logic directly in service

**Refactored:**

```java
public interface CreateUser {
    Promise<UserId> execute(CreateUserRequest request);

    record CreateUserRequest(String email, String password) {}
    record ValidRequest(Email email, Password password) {}

    interface CheckEmailUnique {
        Promise<Email> apply(Email email);
    }

    interface SaveUser {
        Promise<UserId> apply(ValidRequest request);
    }

    static CreateUser create(CheckEmailUnique checkEmail, SaveUser saveUser) {
        return request -> ValidRequest.validRequest(request)
            .async()
            .flatMap(valid -> checkEmail.apply(valid.email())
                .map(email -> valid))
            .flatMap(saveUser::apply);
    }
}
```

</details>

---

### Exercise 6.2 [Intermediate] - Migration Planning

You have this legacy service. Plan a stage-by-stage migration:

```java
@Service
public class OrderService {
    public Order placeOrder(OrderDto dto) {
        // 50 lines of validation
        // 30 lines of inventory check
        // 40 lines of payment processing
        // 20 lines of order creation
        // 15 lines of notification
    }
}
```

<details>
<summary>Solution</summary>

**Stage 1: Value Objects (Week 1)**
- Create: OrderId, ProductId, Quantity, Money, CustomerId
- Parallel method: `placeOrderValidated(ValidOrderRequest request)`
- Keep original method, call validated version internally

**Stage 2: Result in New Code (Week 2)**
- Extract validation to `ValidOrderRequest.validRequest(OrderDto)`
- Return `Result<Order>` instead of throwing
- Create `OrderError` sealed interface

**Stage 3: Extract Use Case (Week 3-4)**
- Create `PlaceOrder` interface with step interfaces:
  - `CheckInventory`
  - `ProcessPayment`
  - `CreateOrder`
  - `SendNotification`
- Move business logic to factory method
- Service becomes thin wrapper calling use case

**Stage 4: Adapter Isolation (Week 5)**
- Wrap inventory check in `Promise.lift()`
- Wrap payment gateway in `Promise.lift()`
- Wrap repository in `Promise.lift()`
- Email service as fire-and-forget Promise

**Migration commits:**
1. Add value objects
2. Add ValidOrderRequest
3. Add OrderError types
4. Extract PlaceOrder interface
5. Implement step interfaces as adapters
6. Convert service to use case wrapper
7. Remove legacy method

</details>

---

### Exercise 6.3 [Beginner] - Debugging Practice

This chain fails silently. Add debugging to find where:

```java
public Promise<Report> generateReport(ReportRequest request) {
    return validateRequest(request)
        .flatMap(this::fetchData)
        .flatMap(this::transformData)
        .flatMap(this::formatReport);
}
```

<details>
<summary>Solution</summary>

```java
public Promise<Report> generateReport(ReportRequest request) {
    return validateRequest(request)
        .onSuccess(r -> log.debug("Validated: {}", r))
        .onFailure(c -> log.error("Validation failed: {}", c.message()))
        .flatMap(this::fetchData)
        .onSuccess(d -> log.debug("Fetched {} records", d.size()))
        .onFailure(c -> log.error("Fetch failed: {}", c.message()))
        .flatMap(this::transformData)
        .onSuccess(t -> log.debug("Transformed to {} items", t.size()))
        .onFailure(c -> log.error("Transform failed: {}", c.message()))
        .flatMap(this::formatReport)
        .onSuccess(r -> log.debug("Report generated: {} pages", r.pageCount()))
        .onFailure(c -> log.error("Format failed: {}", c.message()));
}
```

**Alternative: Extract to named methods for breakpoints:**

```java
public Promise<Report> generateReport(ReportRequest request) {
    return validateRequestStep(request)
        .flatMap(this::fetchDataStep)
        .flatMap(this::transformDataStep)
        .flatMap(this::formatReportStep);
}

private Promise<ValidRequest> validateRequestStep(ReportRequest request) {
    log.debug("Validating request");
    return validateRequest(request);  // Breakpoint here
}

// ... similar for other steps
```

</details>

---

## Summary

These exercises cover the full JBCT learning path:

| Part | Focus | Key Skills |
|------|-------|------------|
| I | Foundations | Type selection, Cause creation, basic operations |
| II | Principles | Value objects, error accumulation, null handling |
| III | Patterns | Pattern identification, implementation, thread safety |
| IV | Testing | Test structure, stubs, async testing |
| V | Production | Use case design, compensation, project structure |
| VI | Adoption | Code review, migration, debugging |

Practice these exercises to build muscle memory for JBCT patterns. The goal is to make these patterns your default way of thinking about code.
