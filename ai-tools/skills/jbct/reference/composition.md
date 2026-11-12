# JBCT Reference: Use Cases, Composition, Patterns

> Part of the `jbct` skill; loaded on demand from the index in `../SKILL.md`. Text moved verbatim from the former single-file SKILL.md.

### Use Case Structure

```java
public interface RegisterUser extends UseCase.WithPromise<Response, Request> {
    record Request(String email, String password) {
        static Request request(String email, String password) { return new Request(email, password); }
    }
    record Response(UserId userId, ConfirmationToken token) {
        static Response response(UserId userId, ConfirmationToken token) { return new Response(userId, token); }
    }

    // Nested API: steps as single-method interfaces
    interface CheckEmail { Promise<ValidRequest> apply(ValidRequest valid); }
    interface SaveUser { Promise<User> apply(ValidRequest valid); }

    // Validated input with Valid prefix (not Validated)
    record ValidRequest(Email email, Password password) {
        static Result<ValidRequest> validRequest(Request raw) {
            return Result.all(Email.email(raw.email()),
                              Password.password(raw.password()))
                         .map(ValidRequest::new);
        }
    }

    // ✅ CORRECT: Factory returns lambda directly
    static RegisterUser registerUser(CheckEmail checkEmail, SaveUser saveUser) {
        return request -> ValidRequest.validRequest(request)
                                      .async()
                                      .flatMap(checkEmail::apply)
                                      .flatMap(saveUser::apply);
    }
}
```

**❌ ANTI-PATTERN: Nested Record Implementation**

NEVER create factories with nested record implementations:

```java
// ❌ WRONG - Verbose, no benefit
static RegisterUser registerUser(CheckEmail check, SaveUser save) {
    record registerUser(CheckEmail check, SaveUser save) implements RegisterUser {
        @Override
        public Promise<Response> execute(Request request) { ... }
    }
    return new registerUser(check, save);
}
```

**Rule:** Records are for data (value objects), lambdas are for behavior (use cases, steps).

## Thread Safety Essentials

**Core Rules:**
- **Immutable at boundaries**: All shared data (parameters, return values) must be immutable
- **Thread confinement**: Mutable state allowed within single-threaded execution (sequential patterns)
- **Fork-Join requires immutability**: Parallel operations must not share mutable state

**Pattern-Specific Safety:**
- **Leaf, Sequencer, Condition, Iteration**: Thread-safe through sequential execution. Mutable local state OK.
- **Fork-Join**: Requires strict immutability. All parallel operations receive immutable inputs.
- **Promise resolution**: Thread-safe (exactly-once semantics, synchronization point for flatMap/map chains)

**Example - Thread-Safe Fork-Join:**
```java
// ✅ CORRECT: Immutable cart passed to both operations
Promise.all(applyBogo(cart),          // cart is immutable
            applyPercentOff(cart))    // cart is immutable
        .map(this::mergeDiscounts);

// ❌ WRONG: Shared mutable context creates data race
private final DiscountContext context = new DiscountContext();
Promise.all(applyBogo(cart, context),     // mutates context
            applyPercentOff(cart, context))  // DATA RACE
        .map(this::merge);
```

**See [Thread Safety](https://pragmatica.dev/java/jbct/course/thread-safety/)** for comprehensive thread safety coverage, including detailed examples and common mistakes.

## Lambda Composition Guidelines

**Rule:** Lambdas passed to monadic operations (`map`, `flatMap`, `recover`, `filter`) must be minimal.

**Allowed:**
- Method references: `Email::email`, `this::processUser`, `User::id`
- Parameter forwarding: `user -> validate(requiredRole, user)`
- Error mapping at `lift` boundaries: the error type's `FACTORY` applied to the converted throwable, `t -> RepositoryError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t))`

**Forbidden:**
- Conditionals (`if`, ternary, `switch`)
- Try-catch blocks
- Multi-statement blocks
- Object construction beyond simple factory calls

**Pattern matching:** Use switch expressions in named methods:

```java
// Extract type matching to named method
.recover(this::recoverKnownErrors)

private Promise<T> recoverKnownErrors(Cause cause) {
    return switch (cause) {
        case NotFound ignored, Timeout ignored -> DEFAULT.promise();
        default -> cause.promise();
    };
}
```

**Multi-case matching:** Comma-separated for same recovery:

```java
private Promise<Theme> recoverWithDefault(Cause cause) {
    return switch (cause) {
        case NotFound ignored, Timeout ignored, ServiceUnavailable ignored ->
            Promise.success(Theme.DEFAULT);
        default -> cause.promise();
    };
}
```

**Error constants:** Define once, reuse everywhere:

## Pattern Decomposition & Data Flow

### Mandatory: Maximum Decomposition

**Rule:** One pattern per method. Never combine patterns in a single method body.

```java
// ❌ WRONG: Mixed patterns (Sequencer + Fork-Join + Condition)
public Promise<Response> execute(Request request) {
    return validate(request)
        .async()
        .flatMap(valid -> {
            if (valid.isPremium()) {
                return Promise.all(fetchA(valid), fetchB(valid))
                    .map(this::merge);
            }
            return fetchBasic(valid);
        });
}

// ✅ CORRECT: Decomposed into single-pattern methods
public Promise<Response> execute(Request request) {
    return validate(request)
        .async()
        .flatMap(this::routeByType);  // Sequencer
}

private Promise<Response> routeByType(ValidRequest valid) {
    return valid.isPremium()           // Condition
        ? processPremium(valid)
        : processBasic(valid);
}

private Promise<Response> processPremium(ValidRequest valid) {
    return Promise.all(fetchA(valid), fetchB(valid))  // Fork-Join
        .map(this::merge);
}
```

### Data Flow: Track Dependencies Explicitly

Every method must have clear data flow:
- **Input**: What data does it need?
- **Output**: What data does it produce?
- **Dependencies**: What external services/steps does it call?

```java
// Input: ValidRequest (email, password)
// Output: User (id, email, hashedPassword)
// Dependencies: hashPassword, userRepository
private Promise<User> createUser(ValidRequest valid) {
    return hashPassword.apply(valid.password())
        .flatMap(hashed -> userRepository.save(
            User.user(UserId.generate(), valid.email(), hashed)));
}
```

### Growing Context Pattern

When multi-step operations need data from earlier steps, use **explicit intermediate records** instead of nested closures:

```java
// ❌ WRONG: Nested closures lose clarity
return loadUser(userId)
    .flatMap(user -> loadOrders(user.id())
        .flatMap(orders -> loadPreferences(user.id())
            .map(prefs -> new Dashboard(user, orders, prefs))));

// ✅ CORRECT: Growing context with intermediate records
record UserWithOrders(User user, List<Order> orders) {
    static UserWithOrders userWithOrders(User user, List<Order> orders) { return new UserWithOrders(user, orders); }
}
record DashboardContext(User user, List<Order> orders, Preferences prefs) {
    static DashboardContext dashboardContext(User user, List<Order> orders, Preferences prefs) { return new DashboardContext(user, orders, prefs); }
}

return loadUser(userId)
    .flatMap(user -> loadOrders(user.id())
        .map(orders -> UserWithOrders.userWithOrders(user, orders)))
    .flatMap(ctx -> loadPreferences(ctx.user().id())
        .map(prefs -> DashboardContext.dashboardContext(ctx.user(), ctx.orders(), prefs)))
    .map(this::buildDashboard);
```

**Benefits:**
- Each stage has clear input/output types
- No deeply nested closures
- Easy to add/remove stages
- Debuggable intermediate states

```java
private static final Cause NOT_FOUND = Causes.cause("User not found");
private static final Cause TIMEOUT = Causes.cause("Request timed out");

private Promise<User> recoverNetworkError(Cause cause) {
    return switch (cause) {
        case NetworkError.Timeout ignored -> TIMEOUT.promise();
        default -> cause.promise();
    };
}
```

## Structural Patterns

JBCT's six patterns come from the process side — the data dependency graph's operators — and code written in them *is* an executable business process specification.

| Pattern | Role |
|---------|------|
| Leaf | Atomic operation, no composition |
| Sequencer | Dependent steps in order |
| Fork-Join | Independent concurrent operations |
| Condition | Routing, no transformation |
| Iteration | Collection processing |
| Aspects | Cross-cutting concerns wrapping logic |

### 1. Leaf Pattern
Atomic unit - one operation, no composition:
```java
public Promise<User> findUser(UserId id) {
    return Promise.lift(
        t -> RepositoryError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
        () -> jdbcTemplate.queryForObject(...)
    );
}
```

### 2. Sequencer Pattern
Linear dependent steps (most common use case pattern):
```java
return ValidRequest.validRequest(request)
                   .async()
                   .flatMap(checkEmail::apply)
                   .flatMap(hashPassword::apply)
                   .flatMap(saveUser::apply)
                   .flatMap(sendEmail::apply);
```

### 3. Fork-Join Pattern
Parallel independent operations (requires immutable inputs):
```java
return Promise.all(fetchProfile.apply(userId),
                   fetchPreferences.apply(userId),
                   fetchOrders.apply(userId))
        .map((profile, prefs, orders) ->
            Dashboard.dashboard(profile, prefs, orders));
```

**Thread Safety:** All parallel operations must receive immutable inputs. No shared mutable state.

### 4. Condition Pattern
Branching as values (no mutation):
```java
return userType.equals("premium")
    ? processPremium.apply(request)
    : processBasic.apply(request);
```

### 5. Iteration Pattern
Functional collection processing:
```java
var results = items.stream()
                   .map(Item::validate)
                   .toList();

return Result.allOf(results)
             .map(validItems -> process(validItems));
```

### 6. Aspects Pattern
Cross-cutting concerns without mixing:
```java
return withRetry(
    retryPolicy,
    withMetrics(metricsPolicy, coreOperation)
);
```
