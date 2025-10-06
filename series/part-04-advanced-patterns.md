# Part 4: Advanced Patterns & Testing

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 4 of 5

**Previous:** [Part 3: Basic Patterns & Structure](part-03-basic-patterns.md) | **Next:** [Part 5: Building Production Systems](part-05-production-systems.md)

---

## Overview

You've mastered the basic patterns (Leaf, Condition, Iteration). Now we'll compose them into sophisticated workflows that handle real-world use cases.

By the end of this part, you'll understand:
- **Sequencer**: The workhorse pattern for chaining dependent steps
- **Fork-Join**: Parallel composition for independent operations
- **Aspects**: Adding cross-cutting concerns without mixing responsibilities
- **Testing**: Functional assertions with onSuccess/onFailure

These patterns compose the basic building blocks you learned in Part 3. Together, they cover 90% of backend use case implementation.

---

## Pattern: Sequencer

**Definition:** A Sequencer chains dependent steps linearly using `map` and `flatMap`. Each step's output feeds the next step's input. This is the primary pattern for use case implementation.

**Rationale (by criteria):**
- **Mental Overhead**: Linear flow, 2-5 steps fits short-term memory capacity - predictable structure (+3).
- **Business/Technical Ratio**: Steps mirror business process language - reads like requirements (+3).
- **Complexity**: Fail-fast semantics, each step isolated and testable (+2).
- **Design Impact**: Forces proper step decomposition, prevents monolithic functions (+2).

### The 2-5 Rule

A Sequencer should have 2 to 5 steps. Fewer than 2, and it's probably just a Leaf. More than 5, and it needs decomposition - extract sub-sequencers or group steps.

> The rule is intended to limit local complexity. It is derived from the average size of short-term memory - 7 ± 2 elements.

**Domain requirements take precedence:** Some functions inherently require more steps because the domain demands it. Value object factories may need multiple validation and normalization steps to ensure invariants - this is correct because the validation logic must be concentrated in one place. Fork-Join patterns may need to aggregate 6+ independent results because that's what the domain requires. Don't artificially fit domain logic into numeric rules. The 2-5 guideline helps you recognize when to consider refactoring, but domain semantics always win.

### Sync Example

```java
public interface ProcessOrder {
    record Request(String orderId, String paymentToken) {}
    record Response(OrderConfirmation confirmation) {}

    Result<Response> execute(Request request);

    interface ValidateInput {
        Result<ValidRequest> apply(Request raw);
    }
    interface ReserveInventory {
        Result<Reservation> apply(ValidRequest req);
    }
    interface ProcessPayment {
        Result<Payment> apply(Reservation reservation);
    }
    interface ConfirmOrder {
        Result<Response> apply(Payment payment);
    }

    static ProcessOrder processOrder(
        ValidateInput validate,
        ReserveInventory reserve,
        ProcessPayment processPayment,
        ConfirmOrder confirm
    ) {
        record processOrder(
            ValidateInput validate,
            ReserveInventory reserve,
            ProcessPayment processPayment,
            ConfirmOrder confirm
        ) implements ProcessOrder {
            public Result<Response> execute(Request request) {
                return validate.apply(request)        // Step 1
                    .flatMap(reserve::apply)          // Step 2
                    .flatMap(processPayment::apply)   // Step 3
                    .flatMap(confirm::apply);         // Step 4
            }
        }
        return new processOrder(validate, reserve, processPayment, confirm);
    }
}
```

Four steps, each a single-method interface. The `execute()` body reads top-to-bottom: validate → reserve → process payment → confirm. Each step returns `Result<T>`, so we chain with `flatMap`. If any step fails, the chain short-circuits and returns the failure.

### Async Example

Same structure, different types:

```java
public Promise<Response> execute(Request request) {
    return ValidateInput.validate(request)  // returns Result<ValidInput>
        .async()                            // lift to Promise<ValidInput>
        .flatMap(reserve::apply)            // returns Promise<Reservation>
        .flatMap(processPayment::apply)     // returns Promise<Payment>
        .flatMap(confirm::apply);           // returns Promise<Response>
}
```

Validation is synchronous (returns `Result`), so we lift it to `Promise` using `.async()`. The rest of the chain is async.

### When to Extract Sub-Sequencers

If a step grows complex internally, extract it to its own interface with a nested structure. Suppose `processPayment` actually needs to: authorize card → capture funds → record transaction. That's three dependent steps - a Sequencer. Extract:

```java
// Original step interface
interface ProcessPayment {
    Promise<Payment> apply(Reservation reservation);
}

// Implementation delegates to a sub-sequencer
class CreditCardPaymentProcessor implements ProcessPayment {
    private final AuthorizeCard authorizeCard;
    private final CaptureFunds captureFunds;
    private final RecordTransaction recordTransaction;

    public Promise<Payment> apply(Reservation reservation) {
        return authorizeCard.apply(reservation)
            .flatMap(captureFunds::apply)
            .flatMap(recordTransaction::apply);
    }
}
```

Now `CreditCardPaymentProcessor` is itself a Sequencer with three steps. The top-level use case remains a clean 4-step chain.

### Common Mistakes

**DON'T nest logic inside flatMap (violates Single Level of Abstraction):**
```java
// DON'T: Business logic buried in lambda
return validate.apply(request)
    .flatMap(valid -> {
        if (valid.isPremiumUser()) {
            return applyDiscount(valid)
                .flatMap(reserve::apply);
        } else {
            return reserve.apply(valid);
        }
    })
    .flatMap(processPayment::apply);
```

The conditional logic is hidden inside the lambda. Extract it:

```java
// DO: Extract to the named function (Single Level of Abstraction)
return validate.apply(request)
    .flatMap(this::applyDiscountIfEligible)
    .flatMap(reserve::apply)
    .flatMap(processPayment::apply);

private Result<ValidRequest> applyDiscountIfEligible(ValidRequest request) {
    return request.isPremiumUser()
        ? applyDiscount(request)
        : Result.success(request);
}
```

**DON'T mix Fork-Join inside a Sequencer without extraction:**
```java
// DON'T: Suddenly doing Fork-Join mid-sequence (violates Single Pattern + SLA)
return validate.apply(request)
    .flatMap(valid -> {
        var userPromise = fetchUser(valid.userId());
        var productPromise = fetchProduct(valid.productId());
        return Promise.all(userPromise, productPromise)
            .flatMap((user, product) -> reserve.apply(user, product));
    })
    .flatMap(processPayment::apply);
```

Extract the Fork-Join:

```java
// DO: Extract Fork-Join to its own step
return validate.apply(request)
    .flatMap(this::fetchUserAndProduct)  // Fork-Join inside this step
    .flatMap(reserve::apply)
    .flatMap(processPayment::apply);

private Promise<ReservationInput> fetchUserAndProduct(ValidRequest request) {
    return Promise.all(fetchUser(request.userId()),
                       fetchProduct(request.productId()))
                  .map(ReservationInput::new);
}
```

**DO keep the sequence flat and readable:**
```java
// DO: Linear, one step per line
return validate.apply(request)
    .flatMap(step1::apply)
    .flatMap(step2::apply)
    .flatMap(step3::apply)
    .flatMap(step4::apply);
```

---

## Pattern: Fork-Join

**Definition:** Fork-Join (also known as Fan-Out-Fan-In) executes independent operations concurrently and combines their results. Use it when you have parallel work with no dependencies between branches.

**Rationale (by criteria):**
- **Mental Overhead**: Parallel execution explicit in structure - no hidden concurrency (+2).
- **Complexity**: Independence constraint acts as design validator - forces proper data organization (+3).
- **Reliability**: Type system prevents dependent operations from being parallelized (+2).
- **Design Impact**: Reveals coupling issues - dependencies surface as compile errors (+3).

### Two Primary Flavors

**1. Result.all(...) - Synchronous aggregation:**

Not concurrent, just collects multiple Results:

```java
// Validating multiple independent fields
Result<ValidRequest> validated = Result.all(Email.email(raw.email()),
                                             Password.password(raw.password()),
                                             AccountId.accountId(raw.accountId()))
                                        .flatMap((email, password, accountId) ->
                                            ValidRequest.create(email, password, accountId)
                                        );
```

If all succeed, you get a tuple of values to pass to the combiner. If any fail, you get a `CompositeCause` containing all failures (not just the first).

**2. Promise.all(...) - Parallel async execution:**

```java
// Running independent I/O operations in parallel
Promise<Dashboard> buildDashboard(UserId userId) {
    return Promise.all(userService.fetchProfile(userId),
                       orderService.fetchRecentOrders(userId),
                       notificationService.fetchUnread(userId))
                  .map(this::createDashboard);
}

private Dashboard createDashboard(Profile profile,
                                   List<Order> orders,
                                   List<Notification> notifications) {
    return new Dashboard(profile, orders, notifications);
}
```

All three fetches run concurrently. The Promise completes when all inputs complete successfully or fails immediately if any input fails.

### Special Fork-Join Cases

Beyond the standard `Result.all()` and `Promise.all()`, there are specialized fork-join methods for specific aggregation needs:

**1. Promise.allOf(Collection<Promise<T>>) - Resilient collection:**

```java
// Fetching data from the dynamic number of sources, collecting all outcomes
Promise<Report> generateSystemReport(List<ServiceId> services) {
    var healthChecks = services.stream()
                               .map(healthCheckService::check)
                               .toList();

    return Promise.allOf(healthChecks)
                  .map(this::createReport);
}

private Report createReport(List<Result<HealthStatus>> results) {
    var successes = results.stream()
                           .filter(Result::isSuccess)
                           .map(Result::value)
                           .toList();
    var failures = results.stream()
                          .filter(Result::isFailure)
                          .map(Result::cause)
                          .toList();
    return new Report(successes, failures);
}
```

Returns `Promise<List<Result<T>>>` - unlike `Promise.all()` which fails fast, `allOf()` waits for all promises to complete and collects both successes and failures. Use when you need comprehensive results even if some operations fail (monitoring, reporting, batch processing).

**2. Promise.any(Promise<T>...) - First-success wins:**

```java
// Racing multiple data sources, using the first successful response
Promise<ExchangeRate> fetchRate(Currency from, Currency to) {
    return Promise.any(
        primaryRateProvider.getRate(from, to),
        secondaryRateProvider.getRate(from, to),
        fallbackRateProvider.getRate(from, to)
    );
}
```

Returns the first successfully completed Promise, canceling remaining operations. Use for redundancy scenarios: failover between services, racing multiple data sources, or timeout alternatives.

### When to Use Fork-Join

- Independent data fetching (parallel I/O)
- Validation of multiple fields with no cross-field dependencies
- Aggregating results from multiple services

### When NOT to Use Fork-Join

- When operations have dependencies (use Sequencer)
- When you need results sequentially for logging/debugging (use Sequencer)
- When one operation's input depends on another's output (definitely Sequencer)

### Design Validation Through Independence

Fork-Join has a crucial constraint: **all branches must be truly independent**. This constraint acts as a design quality check. When you try to write a Fork-Join and discover hidden dependencies, it reveals design issues:

- **Data redundancy:** If branch A needs data from branch B, maybe that data should be provided upfront, not fetched separately.
- **Incorrect data organization:** Dependencies often signal that data is split across sources when it should be colocated.
- **Missing abstraction:** Hidden dependencies may indicate a missing concept that would eliminate the coupling.

Example design issue uncovered by Fork-Join:
```java
// Attempting Fork-Join reveals a problem
Promise.all(
    fetchUserProfile(userId),           // Returns User
    fetchUserPreferences(userId)        // Needs User.timezone from profile!
)
```

The dependency reveals that `UserPreferences` should either:
1. Be fetched together with `User` (they're part of the same aggregate)
2. Not need `User.timezone` (incorrect data organization - timezone should be stored with preferences)
3. Accept `timezone` as explicit input (surfacing the dependency in the type signature)

When Fork-Join feels forced or unnatural, trust that instinct - it's often exposing a design problem that should be fixed, not worked around.

### Common Mistakes

**DON'T use Fork-Join when there are hidden dependencies:**
```java
// DON'T: These aren't actually independent
Promise.all(
    allocateInventory(orderId),   // Might lock inventory
    chargePayment(paymentToken)   // Should only charge if inventory succeeds
).flatMap((inventory, payment) -> confirmOrder(inventory, payment));
```

If inventory allocation fails, we've already charged the customer. These steps have a logical dependency: charge only after successful allocation. Use a Sequencer.

**DON'T ignore errors in Fork-Join branches:**
```java
// DON'T: Silently swallowing failures
Promise.all(
    fetchPrimary(id).recover(err -> Option.none()),  // Hides failure
    fetchSecondary(id).recover(err -> Option.none())
).flatMap((primary, secondary) -> /* ... */);
```

If both fail, the combiner gets two `none()` values with no indication that anything went wrong. Let failures propagate or model the "best-effort" case explicitly:

```java
// DO: Model best-effort explicitly
record DataSources(Option<Primary> primary, Option<Secondary> secondary) {}

Promise.all(fetchPrimary(id).map(Option::some).recover(err -> Promise.success(Option.none())),
            fetchSecondary(id).map(Option::some).recover(err -> Promise.success(Option.none())))
       .map(DataSources::new);
```

Now the type says "we tried to fetch both, either might be missing," and the combiner can decide whether to proceed or fail based on business rules.

**DO keep Fork-Join local and focused:**
```java
// DO: Fork-Join in its own function, combiner extracted (Single Level of Abstraction)
private Promise<ReportData> fetchReportData(ReportRequest request) {
    return Promise.all(userRepo.findById(request.userId()),
                       salesRepo.findByDateRange(request.startDate(), request.endDate()),
                       inventoryRepo.getSnapshot(request.warehouseId()))
                  .map(this::buildReportData);
}

private ReportData buildReportData(User user, List<Sale> sales, Inventory inventory) {
    return new ReportData(user, sales, inventory);
}

// Called from a Sequencer:
public Promise<Report> generateReport(ReportRequest request) {
    return ValidRequest.validate(request)
                  .async()
                  .flatMap(this::fetchReportData)  // Fork-Join extracted
                  .flatMap(this::computeMetrics)
                  .flatMap(this::formatReport);
}
```

---

## Pattern: Aspects (Decorators)

**Definition:** Aspects are higher-order functions that wrap steps or use cases to add cross-cutting concerns - retry, timeout, logging, metrics - without changing business semantics.

**Rationale (by criteria):**
- **Mental Overhead**: Cross-cutting concerns separated from business logic - clear responsibilities (+3).
- **Business/Technical Ratio**: Business logic stays pure; technical concerns isolated in decorators (+3).
- **Complexity**: Composable aspects via higher-order functions - no framework magic (+2).
- **Design Impact**: Business logic independent of retry/metrics/logging - testable separately (+3).

### Placement

**Local concerns:** Wrap individual steps when the aspect applies to just that step. Example: retry only on external API calls.

**Cross-cutting concerns:** Wrap the entire `execute()` method. Example: metrics for the whole use case.

### Example: Retry Aspect on a Step

```java
public interface FetchUserProfile {
    Promise<Profile> apply(UserId userId);
}

// Step implementation
class UserServiceClient implements FetchUserProfile {
    public Promise<Profile> apply(UserId userId) {
        return httpClient.get("/users/" + userId.value())
            .map(this::parseProfile);
    }
}

// Applying a retry aspect at construction:
static ProcessUserData processUserData(..., UserServiceClient userServiceClient, ...) {
    // Values also can come from passed config
    var retryPolicy = RetryPolicy.builder()
        .maxAttempts(3)
        .backoff(exponential(100, 2.0))
        .build();

    var fetchWithRetry = withRetry(retryPolicy, userServiceClient);

    return new processUserData(
        validateInput,
        fetchWithRetry,  // Decorated step
        processData
    );
}
```

The retry aspect wraps the `UserServiceClient` step. If it fails, the aspect retries according to the policy. The rest of the use case is unaware - it just calls `fetchUserProfile.apply(userId)`.

### Example: Metrics Aspect on Use Case

```java
public interface LoginUser {
    Promise<LoginResponse> execute(LoginRequest request);

    static LoginUser loginUser(...) {
        ...
        var rawUseCase = new loginUser(...);
        var metricsPolicy = MetricsPolicy.metricsPolicy("user_login");
        return withMetrics(metricsPolicy, rawUseCase);
    }
}
```

The `withMetrics` decorator wraps the entire use case. It records execution time, success/failure counts, etc., for every invocation of `execute()`.

### Composing Multiple Aspects

Order matters. Typical ordering (outermost to innermost):
1. Metrics/Logging (outermost - observe everything)
2. Timeout (global deadline)
3. CircuitBreaker (fail-fast if the system is degraded)
4. Retry (per-attempt)
5. RateLimit (throttle requests)
6. Business logic (innermost)

```java
var decoratedStep = withMetrics(metricsPolicy,
    withTimeout(timeoutPolicy,
        withCircuitBreaker(breakerPolicy,
            withRetry(retryPolicy, rawStep)
        )
    )
);
```

Or use a helper:
```java
var decoratedStep = composeAspects(
    List.of(
        metrics(metricsPolicy),
        timeout(timeoutPolicy),
        circuitBreaker(breakerPolicy),
        retry(retryPolicy)
    ),
    rawStep
);
```

### Testing Aspects

Test aspects in isolation with synthetic steps. Use case tests remain aspect-agnostic - they test business logic, not retry behavior or metrics.

```java
// Aspect test (isolated)
@Test
void retryAspect_retriesOnFailure() {
    var failingStep = new FlakyStep(2); //Fail times
    var retryPolicy = RetryPolicy.maxAttempts(3);
    var decorated = withRetry(retryPolicy, failingStep);

    var result = decorated.apply(input).await();

    assertTrue(result.isSuccess());
    assertEquals(3, failingStep.invocationCount());  // Failed twice, succeeded on 3rd
}

// Use case test (aspect-agnostic)
@Test
void loginUser_success() {
    var useCase = LoginUser.loginUser(
        mockValidate,
        mockCheckCreds,
        mockGenerateToken
    );

    var result = useCase.execute(validRequest).await();

    assertTrue(result.isSuccess());
    // No assertions about retries, timeouts, etc.
}
```

### Common Mistakes

**DON'T mix aspect logic into business logic:**
```java
// DON'T: Retry logic inside the step
Promise<Profile> fetchProfile(UserId id) {
    return retryWithBackoff(() ->
        httpClient.get("/users/" + id.value())
    ).map(this::parseProfile);
}
```

Extract to an aspect decorator.

**DON'T apply aspects inconsistently:**
```java
// DON'T: Some steps have retry, some don't, no clear reason
var step1 = withRetry(policy, rawStep1);
var step2 = rawStep2;  // Why no retry?
var step3 = withRetry(policy, rawStep3);
```

Be deliberate. If only external calls need retry, document that. If every step should have metrics, apply it at the use case level.

**DO keep aspects composable and reusable:**
```java
// DO: Aspects as higher-order functions that decorate steps
static <I, O> Fn1<I, Promise<O>> withTimeout(TimeSpan timeout, Fn1<I, Promise<O>> step) {
    return input -> step.apply(input).timeout(timeout);
}

static <I, O> Fn1<I, Promise<O>> withRetry(RetryPolicy policy, Fn1<I, Promise<O>> step) {
    return input -> retryLogic(policy, () -> step.apply(input));
}

// Compose by wrapping:
var decorated = withTimeout(timeSpan(5).seconds(),
                    withRetry(retryPolicy, rawStep));
```

---

## Testing Patterns

Testing functional code uses a different approach than traditional imperative testing. Instead of interrogating state with `isSuccess()`/`isFailure()`, we use functional bifurcation with `onSuccess`/`onFailure` callbacks.

### Core Testing Pattern

**For expected failures** - use `.onSuccess(Assertions::fail)`:
```java
@Test
void validation_fails_forInvalidInput() {
    var request = new Request("invalid-data");

    ValidRequest.validate(request)
                .onSuccess(Assertions::fail);  // Fail if unexpectedly succeeds
}
```

**For expected successes** - use `.onFailure(Assertions::fail).onSuccess(assertions)`:
```java
@Test
void validation_succeeds_forValidInput() {
    var request = new Request("valid@example.com", "Valid1234");

    ValidRequest.validate(request)
                .onFailure(Assertions::fail)  // Fail if unexpectedly fails
                .onSuccess(valid -> {
                    assertEquals("valid@example.com", valid.email().value());
                    // Additional assertions...
                });
}
```

**For async operations** - use `.await()` then apply the pattern:
```java
@Test
void execute_succeeds_forValidInput() {
    UseCase useCase = UseCase.create(stub1, stub2);
    var request = new Request("data");

    useCase.execute(request)
           .await()                     // Wait for operation
           .onFailure(Assertions::fail)
           .onSuccess(response -> assertEquals("expected", response.value()));
}
```

### Benefits of This Approach

1. **No intermediate variables**: No `var result = ...` clutter
2. **Functional bifurcation**: Explicitly specify behavior for each outcome
3. **Method references**: Use `Assertions::fail` instead of `() -> Assertions.fail()`
4. **Clear intent**: The test structure mirrors the functional flow

### Test Naming Convention

Follow the pattern: `methodName_outcome_condition`

```java
void validRequest_succeeds_forValidInput()
void validRequest_fails_forInvalidEmail()
void execute_succeeds_forValidInput()
void execute_fails_whenEmailAlreadyExists()
```

### Testing with Stubs

Use type declarations instead of casts for stub implementations:

```java
// DO: Type declaration
CheckEmailUniqueness checkEmail = req -> Promise.success(req);
HashPassword hashPassword = pwd -> Result.success(new HashedPassword("hashed"));

// DON'T: Cast
var checkEmail = (CheckEmailUniqueness) req -> Promise.success(req);
```

This makes the code cleaner and leverages type inference properly.

---

## Summary: Complete Pattern Toolkit

You now have the complete pattern toolkit for building production use cases:

**Advanced patterns:**
1. **Sequencer**: Chain dependent steps (validate → fetch → process → save)
2. **Fork-Join**: Parallel independent operations (fetch user + orders + notifications)
3. **Aspects**: Cross-cutting concerns (retry, timeout, metrics) without mixing logic

**Testing approach:**
- Functional bifurcation: `onSuccess`/`onFailure`
- Method references for cleaner tests
- Aspect-agnostic use case tests

**Pattern composition:**
- Sequencers call Leaves, Conditions, and Fork-Joins
- Fork-Joins aggregate Leaves or other async operations
- Aspects decorate Sequencers or individual steps
- Tests verify business logic, aspects tested separately

With these patterns, you can structure any backend use case:
1. Validate inputs (Condition + Leaf)
2. Fetch data in parallel (Fork-Join)
3. Process sequentially (Sequencer)
4. Add retry/metrics (Aspects)
5. Test functionally (onSuccess/onFailure)

---

## What's Next?

In [Part 5: Building Production Systems](part-05-production-systems.md), we'll bring everything together:

- **Complete Use Case Walkthrough**: RegisterUser from requirements to tests
- **Project Structure & Package Organization**: Vertical slicing, placement rules
- **Framework Integration**: Connecting to Spring Boot and JOOQ
- **Conclusion**: Where to go next

Part 5 shows you how patterns compose into complete, production-ready systems.

---

**Series Navigation**

[← Part 3: Basic Patterns & Structure](part-03-basic-patterns.md) | [Index](INDEX.md) | [Part 5: Building Production Systems →](part-05-production-systems.md)

---

**Version:** 1.0.0 (2025-10-05) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)
