# Chapter 7: Null Policy & Error Recovery

## What You'll Learn

- When null is acceptable (and when it isn't)
- How to handle null at adapter boundaries
- Error recovery patterns with fallback values
- Graceful degradation strategies
- The recovery triple: backward recovery, forward recovery, and designing failure out

**Prerequisites:** [Chapter 6: Error Handling & Composition](ch05-error-handling.md)

---

## Null Policy

> **The One Rule:** No null crosses domain boundaries. Incoming null is mapped to `Option.none()`; outbound domain null is forbidden.

In traditional Java, `null` has two meanings: "value not found" and "error occurred." This ambiguity forces defensive null checks throughout your codebase. JBCT eliminates this confusion with a simple rule: **business logic never returns null**.

### Never Return Null

**Core Rule**: JBCT code NEVER returns null. Use `Option<T>` for optional values.

Traditional Java uses null for semantically different cases - "value not found" and "error occurred." This creates hidden failure modes:

```java
// DON'T: Traditional Java with null
public User findUser(UserId id) {
    return repository.findById(id.value());  // May return null - but why?
}

// Caller must defend:
User user = findUser(id);
if (user == null) {  // Not found? Error? Database down? Unknown!
    // What happened? We don't know.
}
```

The caller has no idea whether null means "user doesn't exist" or "database connection failed." This ambiguity spreads defensive null checks everywhere.

**JBCT eliminates this**:

```java
// DO: Using Option
public Option<User> findUser(UserId id) {
    return Option.option(repository.findById(id.value()));
}

// Caller gets explicit semantics:
findUser(id)
    .onPresent(user -> process(user))
    .onEmpty(() -> handleNotFound());
```

Now the type signature tells us exactly what's happening: the user might not be present, but the operation itself cannot fail. If the operation can fail (database error), use `Result<Option<User>>` or `Promise<Option<User>>`.

---

## When Null IS Acceptable

Null appears only at **adapter boundaries** when interfacing with external code that uses null:

### 1. Wrapping External APIs

When calling external libraries that may return null, wrap immediately at the adapter boundary:

```java
// Adapter layer - wrap nullable external API
public Option<User> findUser(UserId id) {
    User user = repository.findById(id.value());  // External API may return null
    return Option.option(user);  // Wrap immediately: null -> none(), value -> some(value)
}
```

**Spring Data JPA example:**
```java
public Option<User> findByEmail(Email email) {
    return Option.option(userRepository.findByEmail(email.value()));  // JPA returns null if not found
}
```

**JDBC ResultSet example:**
```java
public Promise<Option<User>> loadUser(UserId id) {
    return Promise.lift(RepositoryError.DatabaseFailure::new,
                        () -> {
                            ResultSet rs = executeQuery(id);
                            User user = rs.next() ? mapUser(rs) : null;  // null if not found
                            return Option.option(user);  // Wrap before returning
                        });
}
```

**Pattern**: `Option.option(nullable)` immediately converts external null to `Option.none()`.

### 2. Writing to Nullable Database Columns

When persisting to databases with nullable columns, convert `Option<T>` to null for the column:

```java
// Adapter layer - JOOQ insert with optional field
public Promise<Unit> saveUser(User user) {
    return Promise.lift(
            RepositoryError.DatabaseFailure::new,
            () -> {
                dsl.insertInto(USERS)
                   .set(USERS.ID, user.id().value())
                   .set(USERS.EMAIL, user.email().value())
                   .set(USERS.REFERRAL_CODE,
                        user.refCode().map(ReferralCode::value).orElse(null))  // Option -> nullable column
                   .execute();
                return Unit.unit();
            });
}
```

**JDBC PreparedStatement example:**
```java
PreparedStatement stmt = connection.prepareStatement(
    "INSERT INTO users (id, email, referral_code) VALUES (?, ?, ?)");
stmt.setString(1, user.id().value());
stmt.setString(2, user.email().value());
stmt.setString(3, user.refCode().map(ReferralCode::value).orElse(null));  // Option -> null
```

**Pattern**: `.orElse(null)` ONLY when mapping `Option<T>` to nullable database column.

### 3. Testing Validation

Use null in test inputs to verify that validation correctly rejects null:

```java
@Test
void email_fails_forNull() {
    Email.email(null)  // Test null input
         .onSuccess(Assertions::fail);
}

@Test
void validRequest_fails_whenFieldNull() {
    var request = new Request("valid@example.com", null);  // Test null password
    ValidRequest.validRequest(request)
                .onSuccess(Assertions::fail);
}
```

**Pattern**: Use null in test inputs to verify validation behavior.

---

## When Null is NOT Acceptable

### Never Pass Null Between JBCT Components

Business logic components communicate using domain types, never null:

```java
// DON'T: Defensive null checking in business logic
public Result<Order> processOrder(User user, Cart cart) {
    if (user == null || cart == null) {  // Don't do this
        return OrderError.InvalidInput.INSTANCE.result();
    }
    // ...
}

// DO: Parameters guaranteed non-null by convention
public Result<Order> processOrder(User user, Cart cart) {
    // If cart might be absent, parameter should be Option<Cart>
    // If user might be absent, operation shouldn't be called
    // ...
}

// DO: Explicit optionality when needed
public Result<Order> processOrder(User user, Option<Cart> cart) {
    return cart.toResult(OrderError.EmptyCart.INSTANCE)
               .flatMap(c -> validateAndProcess(user, c));
}
```

**Rule**: If a value might be absent, use `Option<T>` parameter, never null.

### Never Use Null for "Unknown" vs "Absent"

Null conflates two meanings: "value not set" and "value unknown/error". Use types to distinguish:

```java
// DON'T: Null means "unknown"
public String getUserTheme(UserId id) {
    Theme theme = findTheme(id);
    return theme != null ? theme.name() : null;  // What does null mean?
}

// DO: Option distinguishes "not set" from "error"
public Option<Theme> getUserTheme(UserId id) {
    return findTheme(id);  // none() = not set, some(theme) = set
}

// DO: Result distinguishes "not found" from "error"
public Result<Theme> getRequiredTheme(UserId id) {
    return findTheme(id)
        .toResult(ThemeError.NotFound.INSTANCE);
}
```

### Never Return Null from Business Logic

Business logic always uses typed returns:

```java
// DON'T: Returning null from business logic
public User enrichUser(User user) {
    Profile profile = loadProfile(user.id());
    if (profile == null) {
        return null;  // Don't return null!
    }
    return user.withProfile(profile);
}

// DO: Using Option
public Option<User> enrichUser(User user) {
    return loadProfile(user.id())  // Returns Option<Profile>
        .map(profile -> user.withProfile(profile));
}

// DO: Using Result if enrichment can fail
public Result<User> enrichUser(User user) {
    return loadProfile(user.id())
        .toResult(ProfileError.NotFound.INSTANCE)
        .map(profile -> user.withProfile(profile));
}
```

---

## Null Policy Summary

| Context | Null Usage | Correct Approach |
|---------|------------|------------------|
| Return values from JBCT code | Never | Use `Option<T>` |
| Parameters between JBCT components | Never | Use `Option<T>` or required types |
| Wrapping external API returns | Allowed | `Option.option(nullable)` immediately |
| Writing to nullable DB columns | Allowed | `.orElse(null)` at write boundary |
| Test inputs for validation | Allowed | Test null rejection |
| "Unknown" or "absent" semantics | Never | Use `Option<T>` or `Result<T>` |

**Core Principle**: Null exists only at system boundaries (adapters). Inside JBCT code, absence is represented by `Option.none()`, never null.

**Why This Matters**:
- **Mental Overhead**: No defensive null checks in business logic
- **Reliability**: Compiler enforces null handling at boundaries
- **Complexity**: Clear semantics - `Option.none()` vs null confusion eliminated

---

## Error Recovery Patterns

So far we've focused on error **handling** - how to represent and propagate failures through `Result` and `Promise`. But real systems need **recovery** - providing fallback values, retrying operations, or gracefully degrading when errors occur.

### Providing Fallback Values

When an operation fails, you can substitute a default value using `.or()`:

```java
// Provide a literal fallback value
public Theme getUserTheme(UserId userId) {
    return loadTheme(userId)  // Returns Option<Theme>
        .or(Theme.DEFAULT);   // Use DEFAULT if none
}

// Lazy evaluation with supplier
public Config getConfig(String key) {
    return loadFromCache(key)  // Returns Option<Config>
        .or(() -> loadFromDefaults(key))  // Only evaluated if cache miss
        .or(Config.EMPTY);  // Final fallback
}
```

The `.or()` method works with `Option`, `Result`, and `Promise`:

```java
// Option<T> - provide value if empty
option.or(defaultValue)
option.or(() -> computeDefault())

// Result<T> - provide value if failure
result.or(defaultValue)
result.or(() -> computeDefault())

// Promise<T> - provide value if failure (async)
promise.or(defaultValue)
promise.or(() -> computeDefault())
```

### Fallback to Alternative Operations

Use `.orElse()` when you want to try an alternative operation that returns the same monadic type:

```java
// Try cache, then database, then in-memory
public Promise<User> findUser(UserId id) {
    return cacheRepository.find(id)      // Promise<User>
                          .orElse(databaseRepository.find(id))  // Try DB if cache fails
                          .orElse(Promise.success(User.GUEST)); // Final fallback
}

// Result version
public Result<Config> loadConfig(String key) {
    return loadFromFile(key)      // Result<Config>
        .orElse(loadFromEnv(key))  // Try environment if file fails
        .orElse(Result.success(Config.DEFAULT));
}
```

**The difference**:
- `.or(value)` - substitute a plain value
- `.orElse(M<T>)` - substitute with another `Result`/`Promise`/`Option`

### Recovering from Specific Failures

Use `.recover()` when you want to transform failures into successes based on the error:

```java
public Result<User> findUserOrGuest(UserId id) {
    return userRepository.find(id)
        .recover(this::recoverUserErrors);
}

private User recoverUserErrors(Cause cause) {
    return switch (cause) {
        case UserError.NotFound ignored -> User.GUEST;
        case UserError.DatabaseError ignored -> User.OFFLINE;
        default -> throw new IllegalStateException("Unexpected error: " + cause);
    };
}
```

**Promise version with async recovery:**
```java
public Promise<Order> processOrder(OrderRequest request) {
    return paymentService.charge(request)
        .recover(this::recoverPaymentErrors);
}

private Promise<Order> recoverPaymentErrors(Cause cause) {
    return switch (cause) {
        case PaymentError.InsufficientFunds ignored ->
            splitPaymentService.process(request);  // Async alternative
        case PaymentError.TemporaryFailure ignored ->
            Promise.success(request).flatMap(paymentService::charge);  // Retry once
        default -> cause.promise();  // Can't recover
    };
}
```

---

## Graceful Degradation Pattern

Combine recovery with feature detection:

```java
public Promise<Dashboard> loadDashboard(UserId userId) {
    return Promise.all(loadUserProfile(userId),
                       loadRecentOrders(userId).or(List.of()),
                       loadRecommendations(userId).or(List.of()))
                  .map(Dashboard::new);
}
```

Here, profile is **required** (must succeed), but orders and recommendations gracefully degrade to empty lists if unavailable. The dashboard still loads with reduced functionality.

### Real-World Example: Configuration with Fallbacks

```java
public interface LoadConfig {
    record Config(String apiUrl, int timeout, boolean retryEnabled) {}

    Promise<Config> load();

    static LoadConfig loadConfig(LoadFromFile loadFile,
                                 LoadFromEnv loadEnv) {
        return () -> loadFile.apply()
                             .orElse(loadEnv.apply())
                             .or(() -> new Config("https://api.default.com", 30, true));
    }
}
```

This tries file configuration, falls back to environment variables, and finally uses hardcoded defaults. Each layer adds resiliency.

---

## Recovery Patterns Summary

| Pattern | Method | Use When |
|---------|--------|----------|
| Default value | `.or(value)` | Fixed fallback available |
| Lazy default | `.or(() -> compute())` | Fallback is expensive to create |
| Alternative operation | `.orElse(M<T>)` | Try another source/service |
| Conditional recovery | `.recover(cause -> ...)` | Transform specific errors to success |
| Graceful degradation | `.or(emptyValue)` | Feature optional, show partial data |

### When NOT to Recover

Don't use recovery to hide genuine errors:

```java
// DON'T: Swallowing errors silently
loadCriticalData(id)
    .or(Data.EMPTY)  // User never knows load failed!

// DO: Let critical errors propagate
loadCriticalData(id)  // Caller handles the error
```

Recovery is for **expected** failures where degradation makes sense (cache miss, optional feature unavailable). Critical errors should propagate so callers can handle them appropriately.

**Why This Matters**:
- **Reliability**: Systems stay operational despite partial failures
- **User Experience**: Graceful degradation better than total failure
- **Complexity**: Clear recovery strategy, no hidden try-catch blocks

---

## The Recovery Triple: BER, FER, Design-Out

The patterns above answer "this operation failed — what value do I return instead?" A harder question sits one level up: a step fails *after earlier steps already changed state* — a seat is held, an authorization placed — and that state is now invalid. There are exactly three responses, and naming all three keeps the choice deliberate instead of defaulting to the first.

- **BER — Backward Error Recovery.** Undo by an inverse action: release the held seat, void the authorization, reverse the ledger entry. The classic rollback or saga shape. Reach for it when the change is reversible and correctness demands the system look as if nothing happened — money, inventory.
- **FER — Forward Error Recovery.** Do not undo; continue with degraded state. Queue a confirmation email for retry while the booking stands; let a cached value decay `fresh -> stale -> expired` rather than fail outright. The `.or(...)` and graceful-degradation patterns above are FER. Reach for it when forward progress is worth more than perfect consistency — telemetry, notifications, optional enrichment.
- **Design-out.** Change the model so the invalidation cannot arise: a reservation type where two bookings of one seat is structurally impossible; an idempotent write safe to repeat; an append-only log corrected by appending. The failure mode is removed rather than handled — the strongest option, when the model permits it.

Which applies is a judgment — reversibility, the value of partial progress, the domain's shape, coordination cost — and mixed strategies are normal: one booking flow can use BER for the payment, FER for the confirmation email, and design-out for the seat model, all at once. Name the triple for each step that changes state, and recovery becomes a design decision rather than an afterthought.

---

## Key Takeaways

1. **Null only at boundaries** - Adapters wrap external nulls in `Option`
2. **Option.option(nullable)** - Immediate conversion at entry point
3. **Never return null** - Use `Option<T>` for optional values
4. **.or() for defaults** - Provide fallback values
5. **.orElse() for alternatives** - Try another operation
6. **.recover() for conditional** - Transform specific failures to success
7. **The recovery triple** - when a step fails after state changed: BER (undo), FER (degrade forward), or design-out (make it impossible)

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 2.5: Recovery patterns
- Exercise 5.2: Graceful degradation scenarios

---

## What's Next

[Chapter 8](ch07-basic-patterns.md) introduces the basic structural patterns - Leaf, Condition, and Iteration - that handle 80% of your daily coding needs.
