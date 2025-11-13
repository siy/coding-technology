# Part 6: Advanced Patterns & Testing

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 6 of 9

**Previous:** [Part 5: Basic Patterns & Structure](part-05-basic-patterns.md) | **Next:** [Part 7: Testing Philosophy & Evolution](part-07-testing-philosophy.md)

---

## Overview

You've mastered the basic patterns (Leaf, Condition, Iteration). Now we'll compose them into sophisticated workflows that handle real-world use cases.

By the end of this part, you'll understand:
- **Sequencer**: The workhorse pattern for chaining dependent steps
- **Fork-Join**: Parallel composition for independent operations
- **Aspects**: Adding cross-cutting concerns without mixing responsibilities
- **Testing**: Functional assertions with onSuccess/onFailure

These patterns compose the basic building blocks you learned in Part 3. Together, they cover 90% of backend use case implementation.

**Note on terminology:** From this point forward, we'll primarily use "monad" when referring to Option, Result, and Promise. You're now familiar with these Smart Wrapper types—understanding them as monads connects you to the broader functional programming ecosystem.

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

### Thread Safety

Sequencer pattern is **thread-safe through sequential execution** - steps execute one after another, never in parallel. Each step is isolated and thread-confined. Mutable local state within individual steps is safe because steps don't overlap. Data passed between steps must be immutable (see Part 1: [Immutability and Thread Confinement](part-01-foundations.md#immutability-and-thread-confinement)).

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

### Independence and Thread Safety: Two Views of the Same Requirement

Fork-Join has a crucial constraint: **all branches must be truly independent with immutable inputs**. This constraint serves two purposes simultaneously - it's both a design quality check and a thread safety guarantee.

**View 1: Design Independence** - When you try to write a Fork-Join and discover hidden dependencies, it reveals design issues:

- **Data redundancy:** If branch A needs data from branch B, maybe that data should be provided upfront, not fetched separately.
- **Incorrect data organization:** Dependencies often signal that data is split across sources when it should be colocated.
- **Missing abstraction:** Hidden dependencies may indicate a missing concept that would eliminate the coupling.

**View 2: Thread Safety** - Parallel execution requires immutable inputs to prevent data races:

- **All input data MUST be immutable** - no shared mutable state between parallel branches.
- **Local mutable state is safe** - thread-confined accumulators, builders within each branch are fine.
- **Results must be immutable** - data returned from branches will be combined, must be thread-safe.

Example design issue uncovered by Fork-Join:
```java
// ❌ WRONG: Logical dependency
Promise.all(
    fetchUserProfile(userId),           // Returns User
    fetchUserPreferences(userId)        // Needs User.timezone from profile!
)
```

The dependency reveals that `UserPreferences` should either:
1. Be fetched together with `User` (they're part of the same aggregate)
2. Not need `User.timezone` (incorrect data organization - timezone should be stored with preferences)
3. Accept `timezone` as explicit input (surfacing the dependency in the type signature)

Example thread safety violation:
```java
// ❌ WRONG: Shared mutable state
private final DiscountContext context = new DiscountContext();  // Mutable, shared

Promise<Result> calculate() {
    return Promise.all(
        applyBogo(cart, context),      // DATA RACE
        applyPercentOff(cart, context)  // DATA RACE - both branches mutate context
    ).map(this::merge);
}

// ✅ CORRECT: Immutable inputs
Promise<Result> calculate(Cart cart) {
    return Promise.all(
        applyBogo(cart),          // Immutable cart input
        applyPercentOff(cart)     // Immutable cart input
    ).map(this::mergeDiscounts);  // Combine immutable results
}
```

When Fork-Join feels forced or unnatural, trust that instinct - it's often exposing a design problem (hidden dependencies) or safety issue (shared mutable state) that should be fixed, not worked around.

**Pattern-specific safety rules:**
- **Fork-Join:** All inputs MUST be immutable (parallel execution, no synchronization).
- **Sequencer, Leaf, Iteration:** Local mutable state is safe (thread-confined to operation).
- **Input parameters:** Always treat as read-only, regardless of pattern.
- **Results:** Always return immutable data.

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

**DON'T mutate input data in parallel branches:**
```java
// ❌ WRONG: Mutating shared input
Promise.all(
    applyDiscount(cart),      // Mutates cart.subtotal
    calculateTax(cart)        // Reads cart.subtotal - RACE CONDITION
).map(this::combine);

private Promise<Discount> applyDiscount(Cart cart) {
    cart.setSubtotal(cart.subtotal().subtract(discount));  // DATA RACE
    return Promise.success(new Discount(discount));
}

// ✅ CORRECT: Create new instances
Promise.all(
    applyDiscount(cart),
    calculateTax(cart)
).map(this::combine);

private Promise<Discount> applyDiscount(Cart cart) {
    var discountAmount = calculateDiscountFor(cart);
    return Promise.success(new Discount(cart, discountAmount));  // Returns new data
}
```

Input data must be treated as read-only. If you need to "modify" data, create new instances with the modifications.

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
    return ValidRequest.validRequest(request)
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

## Thread Safety Quick Reference

Understanding thread safety is essential when working with asynchronous patterns (Promise, Fork-Join). This section consolidates the thread safety guarantees for all JBCT patterns.

### Core Rules

**Two principles ensure thread safety:**

1. **Immutable at boundaries**: All data passed between functions (parameters, return values) must be immutable
2. **Thread confinement**: Mutable state is allowed within a single-threaded execution path (sequential patterns)

These rules mean you can use mutable local variables in sequential code, but any data shared across threads must be immutable.

### Pattern-by-Pattern Safety Guarantees

**Leaf (Sequential)** - Thread-safe through sequential execution:
```java
// ✅ SAFE: Mutable local state OK
public Result<Order> calculateTotal(Cart cart) {
    var total = 0.0;  // Mutable local variable
    for (Item item : cart.items()) {
        total += item.price();  // Sequential mutation
    }
    return Result.success(new Order(cart, total));
}
```
- Mutable local state confined to single thread
- Input (`cart`) is read-only
- Output (`Order`) is immutable

**Sequencer (Sequential)** - Thread-safe, mutable local state OK:
```java
// ✅ SAFE: Each step runs sequentially
return ValidRequest.validRequest(request)
    .async()
    .flatMap(checkEmail::apply)      // Runs first
    .flatMap(hashPassword::apply)    // Runs second (after first completes)
    .flatMap(saveUser::apply);       // Runs third (after second completes)
```
- Steps execute in order, never concurrently
- Each step can use mutable local state
- Promise resolution is a synchronization point

**Fork-Join (Parallel)** - Requires strict immutability:
```java
// ✅ SAFE: Immutable cart passed to both operations
Promise.all(applyBogo(cart),          // cart is immutable
            applyPercentOff(cart))    // cart is immutable
    .map(this::mergeDiscounts);

// ❌ UNSAFE: Shared mutable context creates data race
private final DiscountContext context = new DiscountContext();  // Mutable!
Promise.all(applyBogo(cart, context),     // Both access context
            applyPercentOff(cart, context))  // DATA RACE - undefined behavior
    .map(this::merge);
```
- All parallel operations receive immutable inputs
- No shared mutable state between parallel operations
- Results merged after all complete

**Condition (Sequential)** - Thread-safe, no shared mutable state:
```java
// ✅ SAFE: Only one branch executes
return user.isPremium()
    ? processPremium(user)
    : processBasic(user);
```
- Branches never execute concurrently
- Each branch can use mutable local state

**Iteration (Sequential)** - Thread-safe through sequential processing:
```java
// ✅ SAFE: Stream processes sequentially
var results = items.stream()
    .map(Item::validate)  // Sequential
    .toList();
```
- Stream operations sequential by default
- Parallel streams require immutable inputs (use with caution)

**Aspects (Inherits)** - Safety depends on wrapped operation:
```java
// ✅ SAFE: Aspect preserves underlying safety
var retried = withRetry(retryPolicy, sequentialStep);  // Still sequential
var retried = withRetry(retryPolicy, forkJoinStep);    // Still parallel
```
- Decorators don't change concurrency model
- Retry/timeout/metrics don't introduce shared state

### Promise Resolution Thread Safety

Promise resolution has exactly-once semantics with built-in synchronization:

```java
Promise<User> promise = Promise.promise();

// Thread 1
promise.resolve(Result.success(user));

// Thread 2
promise.resolve(Result.success(anotherUser));  // Ignored - already resolved
```

- First `resolve()` wins, subsequent calls ignored
- `flatMap`/`map` chains wait for resolution before executing
- Resolution acts as synchronization point for sequential chains

### Common Mistakes

**Mistake 1: Shared mutable state in Fork-Join**

```java
// ❌ WRONG: Mutable list shared across parallel operations
private final List<String> errors = new ArrayList<>();

Promise.all(
    validateEmail(request).onFailure(e -> errors.add(e.message())),  // DATA RACE
    validatePassword(request).onFailure(e -> errors.add(e.message()))  // DATA RACE
).map(this::process);
```

**Fix:** Use immutable results and combine after:
```java
// ✅ CORRECT: Each operation returns its own result
Promise.all(validateEmail(request),
            validatePassword(request))
    .map((emailResult, passwordResult) -> combineResults(emailResult, passwordResult));
```

**Mistake 2: Assuming sequential execution in Promise.all**

```java
// ❌ WRONG: Assuming order
Promise.all(incrementCounter(), incrementCounter())  // May execute concurrently!
```

Promise.all runs operations in parallel. If order matters, use Sequencer.

### Independence Validation Checklist

Use this checklist (from Fork-Join pattern) to verify parallel operations are truly independent:

- [ ] **No shared mutable state** - Operations don't modify shared objects
- [ ] **No execution order dependency** - Results same regardless of execution order
- [ ] **Immutable inputs** - All parameters are immutable or read-only
- [ ] **Side effects independent** - I/O operations don't conflict (different database rows, files, etc.)
- [ ] **No hidden coupling** - No shared caches, connection pools with state, etc.

If any checkbox fails, use Sequencer instead of Fork-Join.

### When to Use Mutable State

**Allowed:**
- Local variables in sequential patterns (Leaf, Sequencer, Condition, Iteration)
- Builders constructing immutable objects
- Accumulators in sequential loops

**Forbidden:**
- Shared across parallel operations (Fork-Join)
- Passed between use case steps
- Returned from functions (return immutable copy instead)

### Testing for Thread Safety

Mutable test fixtures are acceptable - tests execute sequentially:

```java
// ✅ SAFE: Test-scoped mutable state
@Test
void execute_succeeds_forValidInput() {
    List<String> callLog = new ArrayList<>();  // Mutable, but test-scoped

    CheckEmail checkEmail = req -> {
        callLog.add("email");  // Sequential execution
        return Promise.success(req);
    };

    useCase.execute(request)
        .await()
        .onSuccess(response -> assertEquals(List.of("email"), callLog));
}
```

Tests are sequential, so mutable fixtures don't create races.

**Key Takeaway:** JBCT's thread safety is simple - immutable at boundaries, sequential by default, explicit parallelism only in Fork-Join with strict immutability requirements. Follow the patterns, and thread safety emerges naturally.

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

## Common Mistakes

**Sequencer Pattern:**
- ❌ Mixing patterns in one function (Sequencer suddenly doing Fork-Join - extract to separate function)
- ❌ More than 5 steps (extract sub-sequences or group related steps)
- ❌ Using `.await()` to block instead of `.flatMap()` to compose

**Fork-Join Pattern:**
- ❌ Hidden dependencies (output of one operation needed by another - use Sequencer instead)
- ❌ Shared mutable state between parallel operations (data races - use immutable inputs)
- ❌ Ignoring independence validation (see Part 4's "Validating Independence" checklist)

**Aspects Pattern:**
- ❌ Mixing aspects with business logic (keep cross-cutting concerns separate)
- ❌ Wrong aspect order (metrics should be outermost, retry innermost)

**Key insight:** Independence validation prevents most Fork-Join mistakes. If unsure whether operations are independent, use Sequencer—premature parallelization causes subtle bugs.

---

## What's Next?

You've learned the patterns and basic testing approach. Now it's time to dive deep into testing strategy.

In **[Part 7: Testing Philosophy & Evolution →](part-07-testing-philosophy.md)** and **[Part 8: Testing in Practice](part-08-testing-practice.md)**, you'll learn:

- **Evolutionary Testing**: How to grow tests alongside implementation
- **Integration-First Testing**: Why test composition, not components
- **Test Organization**: Managing large test suites without drowning
- **Test Utilities**: Eliminating boilerplate with builders and helpers
- **What to Test Where**: Value objects vs leaves vs use cases
- **Migration Guide**: From traditional unit testing to this approach

Parts 5A and 5B complete your testing knowledge before we build production systems in Part 6.

---

**Series Navigation**

[← Part 5: Basic Patterns & Structure](part-05-basic-patterns.md) | [Index](INDEX.md) | [Part 7: Testing Philosophy & Evolution →](part-07-testing-philosophy.md)

---

**Version:** 1.0.0 (2025-10-05) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)
