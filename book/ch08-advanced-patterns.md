# Chapter 9: Advanced Patterns

## What You'll Learn

- **Sequencer**: The workhorse pattern for chaining dependent steps
- **Fork-Join**: Parallel composition for independent operations
- **Aspects**: Adding cross-cutting concerns without mixing responsibilities

**Prerequisites:** [Chapter 8: Basic Patterns & Structure](ch07-basic-patterns.md)

---

## Discovery Questions for Advanced Patterns

Chapter 8 introduced gap detection and the pattern-BPMN mapping. Here are the discovery questions for advanced patterns — they emerge from the BPMN constructs themselves:

| Pattern | BPMN | Key Questions |
|---------|------|--------------|
| **Sequencer** | Sequence Flow | What does step 1 produce that step 2 needs? Can step 3 happen if step 2 fails? Is order fixed? |
| **Fork-Join** | Parallel Gateway | Do these depend on each other? Can we fetch X while fetching Y? What if one succeeds and another fails? |
| **Aspects** | Event Sub-Process | Retry on failure? How many times? Timeout duration? What needs logging? |

These questions emerge from the patterns themselves — the structure demands specific information.

---

## Pattern: Sequencer

**Definition:** A Sequencer chains dependent steps linearly using `map` and `flatMap`. Each step's output feeds the next step's input. This is the primary pattern for use case implementation.

**Rationale (by criteria):**
- **Mental Overhead**: Linear flow, 2-5 steps fits short-term memory capacity - predictable structure (+3)
- **Business/Technical Ratio**: Steps mirror business process language - reads like requirements (+3)
- **Complexity**: Fail-fast semantics, each step isolated and testable (+2)
- **Design Impact**: Forces proper step decomposition, prevents monolithic functions (+2)

### The 2-5 Rule

A Sequencer should have 2 to 5 steps. Fewer than 2, and it's probably just a Leaf. More than 5, and it needs decomposition—extract sub-sequencers or group steps.

> The rule is intended to limit local complexity. It is derived from the average size of short-term memory - 7 +/- 2 elements.

**Domain requirements take precedence:** Some functions inherently require more steps because the domain demands it. Value object factories may need multiple validation and normalization steps to ensure invariants. Fork-Join patterns may need to aggregate 6+ independent results because that's what the domain requires. Don't artificially fit domain logic into numeric rules. The 2-5 guideline helps you recognize when to consider refactoring, but domain semantics always win.

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

    static ProcessOrder processOrder(ValidateInput validate,
                                     ReserveInventory reserve,
                                     ProcessPayment processPayment,
                                     ConfirmOrder confirm) {
        return request -> validate.apply(request)                 // Step 1
                                  .flatMap(reserve::apply)        // Step 2
                                  .flatMap(processPayment::apply) // Step 3
                                  .flatMap(confirm::apply);       // Step 4
    }
}
```

Four steps, each a single-method interface. The `execute()` body reads top-to-bottom: validate -> reserve -> process payment -> confirm. Each step returns `Result<T>`, so we chain with `flatMap`. If any step fails, the chain short-circuits and returns the failure.

**Why interface + factory?** Every component — use case, step, adapter — is defined as an interface with a static factory method. This is not arbitrary convention:

- **Substitutability**: Anyone can implement the interface. Testing, stubbing incomplete implementations, swapping adapters — all work without framework magic or inheritance hierarchies.
- **Implementation isolation**: Each implementation is self-contained. No shared base classes, no abstract methods to override, no coupling between implementations. Each intersection between implementations is unnecessary coupling with corresponding maintenance overhead — up to needing deep understanding of two projects instead of one, with zero benefit.
- **Disposable implementation**: A local record or lambda returned by the factory can't be referenced externally. The implementation is replaceable by definition. The interface is the design artifact; the implementation is incidental.

### Async Example

Same structure, different types:

```java
public Promise<Response> execute(Request request) {
    return ValidateInput.validate(request)              // returns Result<ValidInput>
                        .async()                        // lift to Promise<ValidInput>
                        .flatMap(reserve::apply)        // returns Promise<Reservation>
                        .flatMap(processPayment::apply) // returns Promise<Payment>
                        .flatMap(confirm::apply);       // returns Promise<Response>
}
```

Validation is synchronous (returns `Result`), so we lift it to `Promise` using `.async()`. The rest of the chain is async.

### When to Extract Sub-Sequencers

If a step grows complex internally, extract it to its own interface with a nested structure. Suppose `processPayment` actually needs to: authorize card -> capture funds -> record transaction. That's three dependent steps - a Sequencer. Extract:

```java
// Original step interface
interface ProcessPayment {
    Promise<Payment> apply(Reservation reservation);
}

// Implementation delegates to a sub-sequencer
interface CreditCardPaymentProcessor extends ProcessPayment {
    interface AuthorizeCard {
        Promise<Reservation> apply(Reservation reservation);
    }
    interface CaptureFunds {
        Promise<Reservation> apply(Reservation reservation);
    }
    interface RecordTransaction {
        Promise<Payment> apply(Reservation reservation);
    }

    static CreditCardPaymentProcessor creditCardPaymentProcessor(
            AuthorizeCard authorizeCard,
            CaptureFunds captureFunds,
            RecordTransaction recordTransaction) {
        return (reservation) -> authorizeCard.apply(reservation)
                                             .flatMap(captureFunds::apply)
                                             .flatMap(recordTransaction::apply);
    }
}
```

Now `CreditCardPaymentProcessor` is itself a Sequencer with three steps. The top-level use case remains a clean 4-step chain.

### Thread Safety

Sequencer pattern is **thread-safe through sequential execution** - steps execute one after another, never in parallel. Each step is isolated and thread-confined. Mutable local state within individual steps is safe because steps don't overlap. Data passed between steps must be immutable.

### Common Mistakes

**DON'T nest logic inside flatMap:**
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

Extract:
```java
// DO: Extract to named function
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
// DON'T: Suddenly doing Fork-Join mid-sequence
return validate.apply(request)
    .flatMap(valid -> {
        var userPromise = fetchUser(valid.userId());
        var productPromise = fetchProduct(valid.productId());
        return Promise.all(userPromise, productPromise)
            .flatMap((user, product) -> reserve.apply(user, product));
    })
    .flatMap(processPayment::apply);
```

Extract:
```java
// DO: Extract Fork-Join to its own step
return validate.apply(request)
               .flatMap(this::fetchUserAndProduct)  // Fork-Join inside
               .flatMap(reserve::apply)
               .flatMap(processPayment::apply);

private Promise<ReservationInput> fetchUserAndProduct(ValidRequest request) {
    return Promise.all(fetchUser(request.userId()),
                       fetchProduct(request.productId()))
                  .map(ReservationInput::new);
}
```

---

## Pattern: Fork-Join

**Definition:** Fork-Join (also known as Fan-Out-Fan-In) executes independent operations concurrently and combines their results. Use it when you have parallel work with no dependencies between branches.

**Rationale (by criteria):**
- **Mental Overhead**: Parallel execution explicit in structure - no hidden concurrency (+2)
- **Complexity**: Independence constraint acts as design validator - forces proper data organization (+3)
- **Reliability**: Type system prevents dependent operations from being parallelized (+2)
- **Design Impact**: Reveals coupling issues - dependencies surface as compile errors (+3)

### Two Primary Flavors

**1. Result.all(...) - Synchronous aggregation:**

Not concurrent, just collects multiple Results:

```java
// Validating multiple independent fields
Result<ValidRequest> validated = Result.all(Email.email(raw.email()),
                                            Password.password(raw.password()),
                                            AccountId.accountId(raw.accountId()))
                                       .map(ValidRequest::new);
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

**1. `Promise.allOf(Collection<Promise<T>>)` - Resilient collection:**

```java
// Fetching data from dynamic number of sources
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

Returns `Promise<List<Result<T>>>` - unlike `Promise.all()` which fails fast, `allOf()` waits for all promises to complete and collects both successes and failures.

**2. `Promise.any(Promise<T>...)` - First-success wins:**

```java
// Racing multiple data sources
Promise<ExchangeRate> fetchRate(Currency from, Currency to) {
    return Promise.any(primaryRateProvider.getRate(from, to),
                       secondaryRateProvider.getRate(from, to),
                       fallbackRateProvider.getRate(from, to));
}
```

Returns the first successfully completed Promise, canceling remaining operations.

### Independence and Thread Safety

Fork-Join has a crucial constraint: **all branches must be truly independent with immutable inputs**.

> **Caution:** Type-level independence is not the same as infrastructure-level independence. Operations that appear independent at the code level may conflict at the infrastructure level:
> - **Database locks:** Two queries may deadlock on shared rows
> - **Rate limits:** Parallel API calls may exhaust quotas
> - **Connection pools:** Parallel operations may compete for connections
> - **Transactions:** Operations in the same transaction may have ordering requirements
>
> Validate infrastructure constraints, not just type signatures.

**Design Independence** - When you try to write a Fork-Join and discover hidden dependencies, it reveals design issues:
- Data redundancy: If branch A needs data from branch B, maybe that data should be provided upfront
- Incorrect data organization: Dependencies signal that data is split across sources when it should be colocated
- Missing abstraction: Hidden dependencies may indicate a missing concept

**Thread Safety** - Parallel execution requires immutable inputs:
- All input data MUST be immutable - no shared mutable state between parallel branches
- Local mutable state is safe - thread-confined accumulators, builders within each branch are fine
- Results must be immutable - data returned from branches will be combined

Example design issue:
```java
// DON'T: Logical dependency
Promise.all(fetchUserProfile(userId),      // Returns User
            fetchUserPreferences(userId))  // Needs User.timezone from profile!
```

Example thread safety violation:
```java
// DON'T: Shared mutable state
private final DiscountContext context = new DiscountContext();  // Mutable

Promise<Result> calculate() {
    return Promise.all(applyBogo(cart, context),       // DATA RACE
                       applyPercentOff(cart, context))  // Both mutate context
                  .map(this::merge);
}

// DO: Immutable inputs
Promise<Result> calculate(Cart cart) {
    return Promise.all(applyBogo(cart),        // Immutable cart
                       applyPercentOff(cart))  // Immutable cart
                  .map(this::mergeDiscounts);
}
```

### Common Mistakes

**DON'T use Fork-Join when there are hidden dependencies:**
```java
// DON'T: These aren't actually independent
Promise.all(allocateInventory(orderId),   // Might lock inventory
            chargePayment(paymentToken))  // Should only charge if inventory succeeds
```

If inventory allocation fails, we've already charged the customer. Use a Sequencer.

**DON'T ignore errors in Fork-Join branches:**
```java
// DON'T: Silently swallowing failures
Promise.all(fetchPrimary(id).recover(err -> Option.none()),  // Hides failure
            fetchSecondary(id).recover(err -> Option.none()))
```

Model the "best-effort" case explicitly with proper types.

---

## Pattern: Aspects (Decorators)

**Definition:** Aspects are higher-order functions that wrap steps or use cases to add cross-cutting concerns - retry, timeout, logging, metrics - without changing business semantics.

**Rationale (by criteria):**
- **Mental Overhead**: Cross-cutting concerns separated from business logic - clear responsibilities (+3)
- **Business/Technical Ratio**: Business logic stays pure; technical concerns isolated in decorators (+3)
- **Complexity**: Composable aspects via higher-order functions - no framework magic (+2)
- **Design Impact**: Business logic independent of retry/metrics/logging - testable separately (+3)

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
    var retryPolicy = RetryPolicy.builder()
                                 .maxAttempts(3)
                                 .backoff(exponential(100, 2.0))
                                 .build();

    return new processUserData(validateInput,
                               withRetry(retryPolicy, userServiceClient),  // Decorated
                               processData);
}
```

### Example: Metrics Aspect on Use Case

```java
public interface LoginUser {
    Promise<LoginResponse> execute(LoginRequest request);

    static LoginUser loginUser(...) {
        var rawUseCase = new loginUser(...);
        var metricsPolicy = MetricsPolicy.metricsPolicy("user_login");
        return withMetrics(metricsPolicy, rawUseCase);
    }
}
```

### Composing Multiple Aspects

Order matters. Typical ordering (outermost to innermost):
1. Metrics/Logging (outermost - observe everything)
2. Timeout (global deadline)
3. CircuitBreaker (fail-fast if system is degraded)
4. Retry (per-attempt)
5. RateLimit (throttle requests)
6. Business logic (innermost)

```java
var decoratedStep = withMetrics(metricsPolicy,
    withTimeout(timeoutPolicy,
        withCircuitBreaker(breakerPolicy,
            withRetry(retryPolicy, rawStep))));
```

### Operational Semantics

**Timeout Behavior:**
- **Logical timeout:** Promise resolves with `TimeoutError` after deadline
- **Actual cancellation:** The underlying operation may continue running
- **Rule:** Timeout doesn't guarantee resource cleanup—idempotent operations are safer

```java
// Timeout resolves promise but underlying HTTP call may complete
promise.timeout(TimeSpan.seconds(5))  // Returns TimeoutError after 5s
       .onFailure(this::logTimeout);   // Operation may still finish
```

**Retry Semantics:**
- **Idempotency required:** Retried operations must be safe to repeat
- **State changes:** Non-idempotent operations (money transfers, order creation) need idempotency keys
- **Backoff:** Exponential backoff prevents thundering herd

```java
// Safe: idempotent read
withRetry(policy, () -> fetchUser(id))

// Unsafe without idempotency key: creates duplicate
withRetry(policy, () -> createOrder(request))  // DON'T

// Safe: idempotent write with key
withRetry(policy, () -> createOrder(request, idempotencyKey))  // DO
```

**Composition Order Semantics:**

| Order | Meaning |
|-------|---------|
| Metrics → Timeout → Retry → Operation | Metrics count total time; timeout applies to all retries |
| Timeout → Metrics → Retry → Operation | Timeout per attempt; metrics count each retry |
| Retry → Timeout → Operation | Each attempt has own timeout |

**Rule:** Define composition order based on what you want to observe and control. Document your choice.

### Testing Aspects

Test aspects in isolation with synthetic steps. Use case tests remain aspect-agnostic:

```java
// Aspect test (isolated)
@Test
void retryAspect_retriesOnFailure() {
    var failingStep = new FlakyStep(2);  // Fail times
    var retryPolicy = RetryPolicy.maxAttempts(3);
    var decorated = withRetry(retryPolicy, failingStep);

    var result = decorated.apply(input).await();

    assertTrue(result.isSuccess());
    assertEquals(3, failingStep.invocationCount());
}

// Use case test (aspect-agnostic)
@Test
void loginUser_success() {
    var useCase = LoginUser.loginUser(mockValidate, mockCheckCreds, mockGenerateToken);

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
    return retryWithBackoff(() -> httpClient.get("/users/" + id.value()))
            .map(this::parseProfile);
}
```

Extract to an aspect decorator.

**DO keep aspects composable and reusable:**
```java
static <I, O> Fn1<I, Promise<O>> withTimeout(TimeSpan timeout, Fn1<I, Promise<O>> step) {
    return input -> step.apply(input).timeout(timeout);
}

static <I, O> Fn1<I, Promise<O>> withRetry(RetryPolicy policy, Fn1<I, Promise<O>> step) {
    return input -> retryLogic(policy, () -> step.apply(input));
}
```

### Logging Philosophy

**Principle:** Logging belongs only at **leaves** and **external boundaries**. Composition code has zero logging.

**Rationale:**
- Leaves perform real work - they're the only places where operations can fail or produce observable effects
- Boundaries are where we interact with external systems - the points of uncertainty
- Everything else is composition - deterministic routing of values through the system

**Implementation:** Wrap leaf implementations in a logging aspect at construction:

```java
public interface UserRepository {
    Promise<User> findById(UserId id);

    static UserRepository create(DataSource ds, Logger log) {
        var impl = new UserRepositoryImpl(ds);
        return withLogging(log, "UserRepository", impl);
    }
}

public static UserRepository withLogging(Logger log, String name, UserRepository impl) {
    return id -> {
        var correlationId = CorrelationContext.current();
        log.debug("[{}] {}.findById input: {}", correlationId, name, id);

        return impl.findById(id)
                   .onSuccess(user -> log.debug("[{}] {}.findById success", correlationId, name))
                   .onFailure(cause -> log.warn("[{}] {}.findById failure: {}", correlationId, name, cause.message()));
    };
}
```

**What gets logged:**
- Input parameters (sanitized for sensitive data)
- Outcome (success or failure cause)
- Correlation ID for request tracing

**Anti-pattern - scattered logging in composition:**
```java
// DON'T: Logging in composition code
return validateInput(request)
    .onSuccess(v -> log.info("Validated"))  // Noise
    .flatMap(this::fetchUser)
    .onSuccess(u -> log.info("Fetched user"))  // Noise
    .flatMap(this::processOrder);

// DO: Wrap leaves at construction
static ProcessOrder processOrder(UserRepository users, Logger log) {
    return new ProcessOrderImpl(withLogging(log, "users", users));
}
```

### Instrumentation Completeness

**Principle:** Because effects live only at leaves, wrapping every leaf instruments the whole request path - completely, by construction.

The Logging Philosophy above is a placement rule; combined with the quarantine of effects at leaves, it becomes a guarantee. I/O, clock reads, outbound calls, message publishing - every effect exists only behind a leaf interface, and composition is pure routing. The set of leaves is therefore the complete set of points where the program touches the outside world. Wrap them all at construction and no path is left uninstrumented, because there is no effect outside a leaf to miss.

**Injected dependencies wrap on the same seam.** A capability injected from another module is itself a `Promise`-returning interface, so cross-module calls are observed exactly like local leaves - no extra mechanism, the same decorator.

**Error telemetry is structural.** Because `Promise<T>` carries failure as a typed value rather than throwing, one wrapper records both outcomes at a single point: a success becomes a normal span and a latency metric, a typed `Cause` becomes an error span and an error metric. There is no `try`/`catch` to write and none to forget.

The honest boundary: wrapping for observability is old (proxies, decorators, AOP). What the quarantine discipline adds is the pair of guarantees - **completeness** (no effect escapes a leaf, so none escapes instrumentation) and **cleanliness** (the business body names none of it).

---

## Key Takeaways

1. **Sequencer** - Chain dependent steps (2-5 rule), fail-fast semantics
2. **Fork-Join** - Parallel independent operations, strict immutability requirement
3. **Aspects** - Cross-cutting concerns as decorators, tested separately
4. **Logging Philosophy** - Logging only at leaves and boundaries, composition is transparent
5. **Instrumentation completeness** - Wrapping every leaf instruments the whole path by construction; no effect outside a leaf to miss
6. **Independence validation** - Prevents Fork-Join mistakes; use Sequencer if unsure
7. **Pattern composition** - Sequencers call Fork-Joins, Aspects wrap both

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 3.3: Pattern composition
- Exercise 3.5: Aspect implementation

---

## What's Next

[Chapter 9b](ch08b-knowledge-gathering-pipelines.md) turns from composing *behavior* to composing *data*: the records that flow between pipeline steps, and the `mapWith` family that makes each stage one line. [Chapter 10](ch09-thread-safety.md) then consolidates the thread-safety rules across JBCT patterns.
