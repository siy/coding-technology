# Part 4: Error Handling & Composition

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 4 of 9

**Previous:** [Part 3: Parse, Don't Validate](part-03-parse-dont-validate.md) | **Next:** [Part 5: Basic Patterns & Structure](part-05-basic-patterns.md)

---

## Overview

This part completes the core principles by teaching error handling as values, null policy, error recovery, and monadic composition rules.

By the end of this part, you'll understand:
- Why business logic never throws exceptions
- When null is acceptable (and when it isn't)
- How to recover from errors with fallback values
- Basic testing patterns for Result/Promise
- Monadic composition rules and lambda guidelines
- Common mistakes to avoid

**Prerequisites:** [Part 2A](part-02-four-return-types.md) and [Part 2B](part-03-parse-dont-validate.md)

---

## No Business Exceptions

Business failures are not exceptional - they're expected outcomes of business rules. An invalid email isn't an exception; it's a normal case of bad input. An account being locked isn't an exception; it's a business state.

**The rule:** Business logic never throws exceptions for business failures. All failures flow through `Result` or `Promise` as typed `Cause` objects.

**Why by criteria:**
- **Mental Overhead**: Checked exceptions pollute signatures (+1 for Result). Unchecked are invisible - must read implementation (+2 for Result).
- **Business/Technical Ratio**: Stack traces are technical noise; typed Causes are domain concepts (+2 for Result).
- **Reliability**: Exceptions bypass type checker; Result makes all failures explicit and compiler-verified (+3 for Result).
- **Complexity**: Exception hierarchies create cross-package coupling (+1 for Result).

### The Traditional (Wrong) Approach

```java
// DON'T: Exceptions for business logic
public User loginUser(String email, String password) throws
        InvalidEmailException,
        InvalidPasswordException,
        AccountLockedException,
        CredentialMismatchException {

    if (!isValidEmail(email)) {
        throw new InvalidEmailException(email);
    }

    if (!isValidPassword(password)) {
        throw new InvalidPasswordException();
    }

    User user = userRepo.findByEmail(email)
        .orElseThrow(() -> new CredentialMismatchException());

    if (user.isLocked()) {
        throw new AccountLockedException(user.getId());
    }

    if (!passwordMatches(user, password)) {
        throw new CredentialMismatchException();
    }

    return user;
}
```

**Problems:**
- Checked exceptions pollute signatures and force callers to handle or rethrow
- Unchecked exceptions are invisible in signatures - you can't tell what might fail without reading implementation
- Exception hierarchies create coupling
- Stack traces are expensive and often irrelevant for business failures
- Testing requires catching exceptions and inspecting types

### The Result-Based Approach

```java
// DO: Failures as typed values
public Result<User> loginUser(String emailRaw, String passwordRaw) {
    return validateCredentials(emailRaw, passwordRaw)
        .flatMap(this::validateAndCheckStatus);
}

private Result<Tuple2<Email, Password>> validateCredentials(String emailRaw, String passwordRaw) {
    return Result.all(Email.email(emailRaw),
                      Password.password(passwordRaw));
}

private Result<User> validateAndCheckStatus(Email email, Password password) {
    return checkCredentials(email, password)
                 .flatMap(this::checkAccountStatus);
}

private Result<User> checkCredentials(Email email, Password password) {
    return userRepo.findByEmail(email)
                   .flatMap(user -> validatePassword(user, password));
}

private Result<User> validatePassword(User user, Password password) {
    return passwordMatches(user, password)
        ? Result.success(user)
        : LoginError.InvalidCredentials.INSTANCE.result();
}

private Result<User> checkAccountStatus(User user) {
    return user.isLocked()
        ? new LoginError.AccountLocked(user.id()).result()
        : Result.success(user);
}
```

Every failure is a `Cause`. The `LoginError` is a sealed interface defining the failure modes:

```java
public sealed interface LoginError extends Cause {
    record AccountLocked(UserId userId) implements LoginError {
        @Override
        public String message() {
            return "Account is locked: " + userId;
        }
    }

    enum InvalidCredentials implements LoginError {
        INSTANCE;

        @Override
        public String message() {
            return "Invalid email or password";
        }
    }
}
```

### Composite Failures: Collecting All Errors

Failures compose: `Result.all(Email.email(...), Password.password(...))` collects validation failures into a `CompositeCause` automatically. If both email and password are invalid, the caller gets both errors, not just the first one encountered.

**Note:** This demonstrates the Fork-Join pattern for parallel validation—covered in detail in Part 4. For now, understand it as validating multiple fields simultaneously and collecting all errors.

```java
// If both fail:
Result.all(Email.email("not-an-email"),
          Password.password("weak"))
      .flatMap(this::processLogin);

// Returns: CompositeCause([
//   "Invalid email format: not-an-email",
//   "Password must be at least 8 characters"
// ])
```

This is far superior to traditional exception-based approaches where you only learn about one error at a time, forcing users to fix-and-retry repeatedly.

### When Exceptions Are Still OK

The "no business exceptions" rule is specifically about **business failures**. There are legitimate uses of exceptions in JBCT code:

**Programming errors (bugs) - Use unchecked exceptions:**
```java
// IllegalArgumentException for programmer mistakes
public record UserId(UUID value) {
    public UserId {
        if (value == null) {
            throw new IllegalArgumentException("UserId cannot be null");
        }
    }
}

// IllegalStateException for invariant violations
public class UserSession {
    public void logout() {
        if (!isAuthenticated()) {
            throw new IllegalStateException("Cannot logout - not authenticated");
        }
        // ... logout logic
    }
}
```

These are **assertions** about code correctness, not business scenarios. If they throw, it's a bug that should crash loudly during development.

**Framework exceptions at boundaries - Catch and convert in adapters:**
```java
// Adapter layer: catch framework exceptions, convert to domain Result/Promise
public class JdbcUserRepository implements FindUser {
    @Override
    public Promise<User> findById(UserId id) {
        return Promise.lift(
            CoreError::database,  // Convert SQLException → domain Cause
            () -> jdbcTemplate.queryForObject(
                "SELECT * FROM users WHERE id = ?",
                new Object[]{id.value()},
                this::mapUser
            )
        );
    }
}
```

Framework exceptions (SQLException, IOException, etc.) are technical failures. **They never escape adapters.** The adapter catches them and converts to `Result` or `Promise` with domain-appropriate `Cause` objects.

**Unrecoverable errors - Let them propagate:**
```java
// OutOfMemoryError, StackOverflowError, AssertionError
// These indicate fatal JVM problems - don't catch them
```

**The key distinction:**

| Scenario | Use |
|----------|-----|
| **Business failure** (invalid input, not found, unauthorized) | `Result<T>` or `Promise<T>` with typed `Cause` |
| **Programming error** (null where shouldn't be, invalid state) | Unchecked exception (`IllegalArgumentException`, `IllegalStateException`) |
| **Framework/library exception** at boundary | Catch in adapter, convert to `Result`/`Promise` |
| **Unrecoverable JVM error** | Let it propagate, don't catch |

**Rule of thumb:** If a user action can trigger it, it's not an exception—it's a business failure that belongs in `Result`/`Promise`.

### Adapter Exceptions: The Boundary

Foreign code (libraries, frameworks, databases) throws exceptions. **Adapter leaves** catch these and convert them to `Cause` objects. Business logic never sees foreign exceptions.

The Pragmatica library provides `lift()` methods for each monad type to handle exception-to-Cause conversion:

```java
public interface UserRepository {
    Promise<Option<User>> findByEmail(Email email);
}

// Implementation (adapter leaf)
class JpaUserRepository implements UserRepository {
    public Promise<Option<User>> findByEmail(Email email) {
        return Promise.lift(
            RepositoryError::fromDatabaseException,
            () -> entityManager.createQuery("SELECT u FROM User u WHERE u.email = :email", UserEntity.class)
                               .setParameter("email", email.value())
                               .getResultList()
                               .stream()
                               .findFirst()
                               .map(this::toDomain)
                               .orElse(Option.none())
        );
    }
}
```

The `lift()` methods handle try-catch boilerplate and exception-to-Cause conversion automatically via the provided exception-to-cause mapping function. Each monad type provides its own `lift()` method: `Option.lift()`, `Result.lift()`, and `Promise.lift()`.

The adapter wraps checked `PersistenceException` in a domain `Cause` (`RepositoryError.DatabaseFailure`). Business logic never sees `PersistenceException` - only domain errors.

**Note:** This exception handling pattern is applied to database adapters in Part 3 and shown in a complete JOOQ example in Part 6.

### Benefits

**Errors are just data**: You compose them with `map`, `flatMap`, and `all()` like any other value.

**Testing is easy**: Assert on `Cause` types without catching exceptions:

```java
@Test
void loginUser_fails_forInvalidEmail() {
    loginUser("not-an-email", "Valid1234")
        .onSuccess(Assertions::fail);  // Should not succeed
}
```

**AI generation is mechanical**: The pattern is always the same:
- `SomeCause.INSTANCE.result()` for Result
- `SomeCause.INSTANCE.promise()` for Promise

No decisions about checked vs unchecked, when to catch, how to wrap.

---

## Null Policy

In traditional Java, `null` has two meanings: "value not found" and "error occurred." This ambiguity forces defensive null checks throughout your codebase. JBCT eliminates this confusion with a simple rule: **business logic never returns null**.

### Never Return Null

**Core Rule**: JBCT code NEVER returns null. Use `Option<T>` for optional values.

Traditional Java uses null for semantically different cases—"value not found" and "error occurred." This creates hidden failure modes:

```java
// ❌ WRONG - Traditional Java with null
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
// ✅ CORRECT - Using Option
public Option<User> findUser(UserId id) {
    return Option.option(repository.findById(id.value()));
}

// Caller gets explicit semantics:
findUser(id)
    .onPresent(user -> process(user))
    .onEmpty(() -> handleNotFound());
```

Now the type signature tells us exactly what's happening: the user might not be present, but the operation itself cannot fail. If the operation can fail (database error), use `Result<Option<User>>` or `Promise<Option<User>>`.

### When Null IS Acceptable

Null appears only at **adapter boundaries** when interfacing with external code that uses null:

#### 1. Wrapping External APIs

When calling external libraries that may return null, wrap immediately at the adapter boundary:

```java
// Adapter layer - wrap nullable external API
public Option<User> findUser(UserId id) {
    User user = repository.findById(id.value());  // External API may return null
    return Option.option(user);  // Wrap immediately: null → none(), value → some(value)
}
```

**Spring Data JPA example:**
```java
public Option<User> findByEmail(Email email) {
    return Option.option(
        userRepository.findByEmail(email.value())  // JPA returns null if not found
    );
}
```

**JDBC ResultSet example:**
```java
public Promise<Option<User>> loadUser(UserId id) {
    return Promise.lift(
        DatabaseError::cause,
        () -> {
            ResultSet rs = executeQuery(id);
            User user = rs.next() ? mapUser(rs) : null;  // null if not found
            return Option.option(user);  // Wrap before returning
        }
    );
}
```

**Pattern**: `Option.option(nullable)` immediately converts external null to `Option.none()`.

#### 2. Writing to Nullable Database Columns

When persisting to databases with nullable columns, convert `Option<T>` to null for the column:

```java
// Adapter layer - JOOQ insert with optional field
public Promise<Unit> saveUser(User user) {
    return Promise.lift(
        DatabaseError::cause,
        () -> {
            dsl.insertInto(USERS)
                .set(USERS.ID, user.id().value())
                .set(USERS.EMAIL, user.email().value())
                .set(USERS.REFERRAL_CODE,
                    user.refCode().map(ReferralCode::value).orElse(null))  // Option → nullable column
                .execute();
            return Unit.unit();
        }
    );
}
```

**JDBC PreparedStatement example:**
```java
PreparedStatement stmt = connection.prepareStatement(
    "INSERT INTO users (id, email, referral_code) VALUES (?, ?, ?)"
);
stmt.setString(1, user.id().value());
stmt.setString(2, user.email().value());
stmt.setString(3, user.refCode().map(ReferralCode::value).orElse(null));  // Option → null
```

**Pattern**: `.orElse(null)` ONLY when mapping `Option<T>` to nullable database column.

#### 3. Testing Validation

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

### When Null is NOT Acceptable

#### Never Pass Null Between JBCT Components

Business logic components communicate using domain types, never null:

```java
// ❌ WRONG - Defensive null checking in business logic
public Result<Order> processOrder(User user, Cart cart) {
    if (user == null || cart == null) {  // DON'T do this
        return OrderError.InvalidInput.INSTANCE.result();
    }
    // ...
}

// ✅ CORRECT - Parameters guaranteed non-null by convention
public Result<Order> processOrder(User user, Cart cart) {
    // If cart might be absent, parameter should be Option<Cart>
    // If user might be absent, operation shouldn't be called
    // ...
}

// ✅ CORRECT - Explicit optionality when needed
public Result<Order> processOrder(User user, Option<Cart> cart) {
    return cart
        .toResult(OrderError.EmptyCart.INSTANCE)
        .flatMap(c -> validateAndProcess(user, c));
}
```

**Rule**: If a value might be absent, use `Option<T>` parameter, never null.

#### Never Use Null for "Unknown" vs "Absent"

Null conflates two meanings: "value not set" and "value unknown/error". Use types to distinguish:

```java
// ❌ WRONG - Null means "unknown"
public String getUserTheme(UserId id) {
    Theme theme = findTheme(id);
    return theme != null ? theme.name() : null;  // What does null mean?
}

// ✅ CORRECT - Option distinguishes "not set" from "error"
public Option<Theme> getUserTheme(UserId id) {
    return findTheme(id);  // none() = not set, some(theme) = set
}

// ✅ CORRECT - Result distinguishes "not found" from "error"
public Result<Theme> getRequiredTheme(UserId id) {
    return findTheme(id)
        .toResult(ThemeError.NotFound.INSTANCE);
}
```

#### Never Return Null from Business Logic

Business logic always uses typed returns:

```java
// ❌ WRONG - Returning null from business logic
public User enrichUser(User user) {
    Profile profile = loadProfile(user.id());
    if (profile == null) return null;  // Don't return null!
    return user.withProfile(profile);
}

// ✅ CORRECT - Using Option
public Option<User> enrichUser(User user) {
    return loadProfile(user.id())  // Returns Option<Profile>
        .map(profile -> user.withProfile(profile));
}

// ✅ CORRECT - Using Result if enrichment can fail
public Result<User> enrichUser(User user) {
    return loadProfile(user.id())
        .toResult(ProfileError.NotFound.INSTANCE)
        .map(profile -> user.withProfile(profile));
}
```

### Summary

| Context | Null Usage | Correct Approach |
|---------|-----------|------------------|
| Return values from JBCT code | ❌ Never | Use `Option<T>` |
| Parameters between JBCT components | ❌ Never | Use `Option<T>` or required types |
| Wrapping external API returns | ✅ Allowed | `Option.option(nullable)` immediately |
| Writing to nullable DB columns | ✅ Allowed | `.orElse(null)` at write boundary |
| Test inputs for validation | ✅ Allowed | Test null rejection |
| "Unknown" or "absent" semantics | ❌ Never | Use `Option<T>` or `Result<T>` |

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
        .recover(cause -> switch (cause) {
            case UserError.NotFound _ -> User.GUEST;
            case UserError.DatabaseError _ -> User.OFFLINE;
            default -> throw new IllegalStateException("Unexpected error: " + cause);
        });
}
```

**Promise version with async recovery:**
```java
public Promise<Order> processOrder(OrderRequest request) {
    return paymentService.charge(request)
        .recover(cause -> switch (cause) {
            case PaymentError.InsufficientFunds _ ->
                // Async alternative: split payment
                splitPaymentService.process(request);
            case PaymentError.TemporaryFailure _ ->
                // Retry once
                Promise.success(request).flatMap(paymentService::charge);
            default ->
                // Can't recover
                Promise.failure(cause);
        });
}
```

### Real-World Example: Configuration with Fallbacks

```java
public interface LoadConfig {
    record Config(String apiUrl, int timeout, boolean retryEnabled) {}

    Promise<Config> load();

    static LoadConfig loadConfig(
        LoadFromFile loadFile,
        LoadFromEnv loadEnv
    ) {
        return () -> loadFile.apply()
            .orElse(loadEnv.apply())
            .or(() -> new Config(
                "https://api.default.com",
                30,
                true
            ));
    }
}
```

This tries file configuration, falls back to environment variables, and finally uses hardcoded defaults. Each layer adds resiliency.

### Graceful Degradation Pattern

Combine recovery with feature detection:

```java
public Promise<Dashboard> loadDashboard(UserId userId) {
    return Promise.all(
        loadUserProfile(userId),
        loadRecentOrders(userId).or(List.of()),      // Empty list if fails
        loadRecommendations(userId).or(List.of())    // Empty list if fails
    ).map((profile, orders, recommendations) ->
        new Dashboard(profile, orders, recommendations)
    );
}
```

Here, profile is **required** (must succeed), but orders and recommendations gracefully degrade to empty lists if unavailable. The dashboard still loads with reduced functionality.

### Common Patterns Summary

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
// ❌ BAD - Swallowing errors silently
loadCriticalData(id)
    .or(Data.EMPTY)  // User never knows load failed!

// ✅ GOOD - Let critical errors propagate
loadCriticalData(id)  // Caller handles the error
```

Recovery is for **expected** failures where degradation makes sense (cache miss, optional feature unavailable). Critical errors should propagate so callers can handle them appropriately.

**Why This Matters**:
- **Reliability**: Systems stay operational despite partial failures
- **User Experience**: Graceful degradation better than total failure
- **Complexity**: Clear recovery strategy, no hidden try-catch blocks

**Next Steps**: Now that you can handle and recover from errors, let's see how to test this code (next section).

---

## Testing Your Code

Now that you understand the four return types and core principles, you need to know how to test them. This section covers the basic functional assertion pattern—Part 5 will cover advanced testing strategies (stubs, integration tests, test organization).

### Testing Results: The Functional Pattern

When testing functions that return `Result<T>`, use `.onSuccess(Assertions::fail)` and `.onFailure(Assertions::fail)` to make test intent explicit.

**Testing failures:**
```java
@Test
void email_rejectsInvalidFormat() {
    Email.email("not-an-email")
        .onSuccess(Assertions::fail);  // Fail test if unexpectedly succeeds
}
```

**Testing successes:**
```java
@Test
void email_acceptsValidFormat() {
    Email.email("user@example.com")
        .onFailure(Assertions::fail)  // Fail test if unexpectedly fails
        .onSuccess(email -> {
            assertEquals("user@example.com", email.value());
            // More assertions on the success value
        });
}
```

**Why this pattern:**
- **Clear intent**: `.onSuccess(Assertions::fail)` reads as "this should fail"
- **Better failures**: You see "Expected failure but got success with value X"
- **Functional style**: Matches the Smart Wrapper (monadic) composition you use in production code

### Testing Promises: Await Then Assert

For async code that returns `Promise<T>`, call `.await()` to block the test thread, then use the same pattern:

```java
@Test
void execute_succeeds_forValidInput() {
    var useCase = UseCase.create(repositoryStub, emailServiceStub);
    var request = new Request("valid-data");

    useCase.execute(request)
        .await()  // Block until promise resolves
        .onFailure(Assertions::fail)
        .onSuccess(response -> {
            assertEquals("expected", response.value());
        });
}
```

### Testing Options

Same pattern works for `Option<T>`:

```java
@Test
void findUser_returnsEmpty_whenUserNotFound() {
    repository.findUser(unknownId)
        .onPresent(Assertions::fail);  // Should be empty
}

@Test
void findUser_returnsUser_whenUserExists() {
    repository.findUser(knownId)
        .onEmpty(Assertions::fail)  // Should be present
        .onPresent(user -> {
            assertEquals("expected@example.com", user.email());
        });
}
```

### Test Naming Convention

Follow the pattern `methodName_outcome_condition`:
- `email_rejectsInvalidFormat` - method name, what happens, under what condition
- `email_normalizesToLowercase` - method name, outcome, implicit condition (always)
- `execute_succeeds_forValidInput` - clear, readable, searchable

This is the foundation. **Part 5 covers**:
- Stub creation and dependency injection
- Integration testing with real I/O
- Test organization (nested classes, builders, parameterized tests)
- Testing complex scenarios

For now, this functional assertion pattern is all you need to verify your value objects and simple use cases.

---

## Monadic Composition Rules

The four return kinds compose via `map`, `flatMap`, `filter`, and aggregation combinators (`all`, `any`). Understanding when to lift and how to avoid nesting is essential.

### Lifting: Moving Between Types

You can lift a "lower" type into a "higher" one at call sites:

- `T` → `Option<T>` (via `Option.option(value)`)
- `T` → `Result<T>` (via `Result.success(value)`)
- `T` → `Promise<T>` (via `Promise.success(value)`)
- `Option<T>` → `Result<T>` (via `option.toResult(cause)` or `option.await(cause)`)
- `Option<T>` → `Promise<T>` (via `option.async(cause)` or `option.async()`)
- `Result<T>` → `Promise<T>` (via `result.async()`)

You lift when composing functions that return different types:

```java
// Sync validation (Result) lifted into async flow (Promise)
public Promise<Response> execute(Request request) {
    return ValidRequest.validRequest(request)
                       .async()  // Result has dedicated async() method to convert to Promise
                       .flatMap(step1::apply)  // step1 returns Promise
                       .flatMap(step2::apply); // step2 returns Promise
}
```

### Forbidden Nesting: Don't Nest the Same Concern Twice

**`Promise<Result<T>>` is forbidden.** `Promise<T>` already carries failures - nesting `Result` inside creates two error channels and forces callers to unwrap twice. If a function is async and can fail, it returns `Promise<T>`, period.

**Wrong:**
```java
// DON'T: Nested error channels
Promise<Result<User>> loadUser(UserId id) { /* ... */ }

// Caller must unwrap twice:
loadUser(id)
    .flatMap(resultUser -> resultUser.match(
        user -> Promise.success(user),
        Cause::promise
    ));  // Absurd ceremony
```

**Right:**
```java
// DO: One error channel
Promise<User> loadUser(UserId id) { /* ... */ }

// Caller just chains:
return loadUser(id).flatMap(nextStep);
```

### Allowed Nesting: Result<Option<T>>

`Result<Option<T>>` is permitted sparingly for "optional value that can fail validation." This represents: "If present, must be valid. If absent, that's fine."

Example: optional referral code that must match a pattern when provided.

```java
Result<Option<ReferralCode>> refCode = ReferralCode.referralCode(input);
// Success(None) = not provided, valid
// Success(Some(code)) = provided and valid
// Failure(cause) = provided but invalid
```

Avoid `Option<Result<T>>` - it means "maybe there's a result, and that result might have failed," which is backwards. Just use `Result<Option<T>>`.

### Aggregation: Combining Independent Operations

Use `Result.all(...)` or `Promise.all(...)` to combine multiple independent operations:

```java
// Validation: collect multiple field validations
Result<ValidRequest> validated = Result.all(Email.email(raw.email()),
                                             Password.password(raw.password()),
                                             ReferralCode.referralCode(raw.referralCode()))
                                       .flatMap(ValidRequest::new);

// Async: run independent queries in parallel
Promise<Report> report = Promise.all(userRepo.findById(userId),
                                     orderRepo.findByUser(userId),
                                     inventoryService.getAvailableItems())
                                .flatMap(this::generateReport);
```

If any input fails, `all()` fails immediately (fail-fast for Promise) or collects failures (CompositeCause for Result).

### Composition Cheat Sheet

| You have | You need | Use |
|----------|----------|-----|
| `T` | `Option<T>` | `Option.option(value)` |
| `T` | `Result<T>` | `Result.success(value)` |
| `T` | `Promise<T>` | `Promise.success(value)` |
| `Option<T>` | `Result<T>` | `.toResult(cause)` or `.await(cause)` |
| `Option<T>` | `Promise<T>` | `.async(cause)` |
| `Result<T>` | `Promise<T>` | `.async()` |
| Multiple `Result<T>` | Single `Result` | `Result.all(...)` |
| Multiple `Promise<T>` | Single `Promise` | `Promise.all(...)` |
| `Collection<Promise<T>>` | `Promise<List<Result<T>>>` | `Promise.allOf(collection)` |

### Lambda Rules: Keep Composition Clean

Lambdas passed to `map`, `flatMap`, and similar combinators should contain ONLY:
- **Method references**: `Email::new`, `this::processUser`, `User::id`
- **Simple parameter forwarding**: `param -> someMethod(outerParam, param)`
- **Simple constructors**: `hashed -> new ValidCredentials(email, hashed)`

**Why?** Lambdas are composition points, not implementation locations. Burying logic inside lambdas hides abstraction levels and makes code harder to read and test.

**Forbidden in lambdas:**

❌ **Ternaries** (violates Single Pattern per Function):
```java
// DON'T: Ternary in lambda
.flatMap(user -> user.isPremium()
    ? applyPremiumDiscount(user)
    : applyStandardDiscount(user))

// DO: Extract to named function
.flatMap(this::applyApplicableDiscount)

private Result<Discount> applyApplicableDiscount(User user) {
    return user.isPremium()
        ? applyPremiumDiscount(user)
        : applyStandardDiscount(user);
}
```

❌ **Nested maps/flatMaps:**
```java
// DON'T: Nested composition in lambda
.flatMap(user -> loadProfile(user)
    .map(profile -> enrichWithPreferences(profile))
    .flatMap(enriched -> save(enriched)))

// DO: Extract to named method
.flatMap(this::loadAndEnrichProfile)

private Promise<Profile> loadAndEnrichProfile(User user) {
    return loadProfile(user)
        .map(this::enrichWithPreferences)
        .flatMap(this::save);
}
```

❌ **Complex object construction:**
```java
// DON'T: Complex construction in lambda
.map(dashboard -> {
    var urgentAlerts = dashboard.alerts().stream()
        .filter(Alert::isUrgent)
        .toList();
    return new Summary(dashboard.metrics(), urgentAlerts);
})

// DO: Extract to named method
.map(this::buildSummary)

private Summary buildSummary(Dashboard dashboard) {
    var urgentAlerts = filterUrgentAlerts(dashboard.alerts());
    return new Summary(dashboard.metrics(), urgentAlerts);
}
```

**Prefer constructor references:**
```java
// DO: Constructor reference
.map(Email::new)

// DON'T: Lambda wrapping constructor
.map(value -> new Email(value))
```

This keeps composition chains flat and readable. Named functions document intent; anonymous lambdas hide it.

**Zone framework reference**: Part 3 introduces the zone-based naming framework that helps maintain abstraction levels across your codebase. Lambdas should only forward to methods at the appropriate abstraction level.

### Why These Rules?

They prevent complexity explosion. With exactly four return types and clear composition rules, you can always tell how to combine two functions by looking at their signatures. AI code generation becomes mechanical - given input and output types, there's one obvious way to compose.

---

## Pragmatica Lite API Reference

This section consolidates the essential Pragmatica Lite Core 0.8.3 APIs you'll use daily. For complete API documentation, see [CODING_GUIDE.md: Pragmatica Lite Core 0.8.3 API Reference](../CODING_GUIDE.md).

### Type Conversions

Moving between the four return types:

```java
// Option → Result/Promise
option.toResult(cause)      // or .await(cause) - alias
option.async(cause)         // Option → Promise
option.async()              // Uses CoreError.emptyOption as cause

// Result → Promise
result.async()              // Lift sync Result to async Promise

// Promise → Result (blocking - use with caution)
promise.await()             // Blocks current thread
promise.await(timeout)      // With timeout

// Cause → Result/Promise (prefer over constructors)
cause.result()              // Cause → Result (recommended)
cause.promise()             // Cause → Promise (recommended)
// Instead of: Result.failure(cause) or Promise.failure(cause)
```

### Aggregation Operations

Combining multiple operations:

```java
// Result.all - Accumulates ALL failures (CompositeCause)
Result.all(result1, result2, result3)
    .map((v1, v2, v3) -> combine(v1, v2, v3));

Result.allOf(List.of(result1, result2, result3))  // From collection
    .map(list -> process(list));

// Promise.all - Fail-fast on FIRST failure
Promise.all(promise1, promise2, promise3)
    .map((v1, v2, v3) -> combine(v1, v2, v3));

Promise.allOf(collection)  // Collection<Promise<T>> → Promise<List<Result<T>>>
    .map(results -> process(results));

// Option.all - Fail-fast on FIRST empty
Option.all(opt1, opt2, opt3)
    .map((v1, v2, v3) -> combine(v1, v2, v3));

// any - First success
Result.any(result1, result2)    // First success or all failures
Promise.any(promise1, promise2)  // First success, cancels others
Option.any(opt1, opt2)          // First present
```

### Exception Handling (lift methods)

Wrapping throwing code:

```java
// Result.lift - Sync exceptions → Result
Result.lift(Integer::parseInt, raw)
Result.lift(ErrorType::cause, () -> riskyOperation())
Result.lift(ThrowingRunnable)  // → Result<Unit>

// Promise.lift - Async exceptions → Promise
Promise.lift(DatabaseError::cause, () -> jdbcQuery())
Promise.lift(() -> riskyAsyncOperation())
Promise.lift(ThrowingRunnable)  // → Promise<Unit>

// Function factories (returns wrapped function)
Fn1<Result<Integer>, String> parser = Result.liftFn1(Integer::parseInt);
Fn1<Promise<Data>, String> loader = Promise.liftFn1(this::loadFromDisk);
```

### Verify.Is Predicates (Validation)

Standard validation predicates:

```java
// Null and emptiness
Verify.Is::notNull
Verify.Is::notBlank         // Has non-whitespace characters
Verify.Is::notEmpty         // Non-empty string/collection
Verify.Is::empty
Verify.Is::blank

// String checks
Verify.Is::lenBetween       // Verify.ensure(str, Verify.Is::lenBetween, min, max)
Verify.Is::contains         // Contains substring
Verify.Is::notContains
Verify.Is::matches          // Regex (String or Pattern)

// Numeric comparisons
Verify.Is::positive         // > 0
Verify.Is::negative         // < 0
Verify.Is::nonNegative      // >= 0
Verify.Is::nonPositive      // <= 0
Verify.Is::greaterThan
Verify.Is::greaterThanOrEqualTo
Verify.Is::lessThan
Verify.Is::lessThanOrEqualTo
Verify.Is::equalTo          // Via compareTo
Verify.Is::notEqualTo
Verify.Is::between          // >= min && <= max (inclusive)

// Option checks
Verify.Is::some             // Option.isPresent()
Verify.Is::none             // Option.isEmpty()
```

**Usage:**
```java
Verify.ensure(password, Verify.Is::lenBetween, 8, 128)
Verify.ensure(age, Verify.Is::between, 0, 150)
Verify.ensure(username, Verify.Is::notBlank)

// Combining multiple checks
Verify.combine(
    Verify.ensureFn(TOO_SHORT, Verify.Is::lenBetween, 8, 128),
    Verify.ensureFn(BLANK, Verify.Is::notBlank)
)
```

### Parse Utilities (Exception-Safe JDK Wrappers)

Instead of `Result.lift(Integer::parseInt, raw)`, use dedicated parse utilities:

```java
import org.pragmatica.lang.parse.Number;
import org.pragmatica.lang.parse.DateTime;
import org.pragmatica.lang.parse.Network;
import org.pragmatica.lang.parse.I18n;
import org.pragmatica.lang.parse.Text;

// Numbers
Number.parseInt(raw)              // Result<Integer>
Number.parseLong(raw)             // Result<Long>
Number.parseDouble(raw)           // Result<Double>
Number.parseBigDecimal(raw)       // Result<BigDecimal>
Number.parseBigInteger(raw)       // Result<BigInteger>

// Date/Time
DateTime.parseLocalDate(raw)      // Result<LocalDate>
DateTime.parseLocalDateTime(raw)  // Result<LocalDateTime>
DateTime.parseZonedDateTime(raw)  // Result<ZonedDateTime>
DateTime.parseInstant(raw)        // Result<Instant>

// Network
Network.parseUUID(raw)            // Result<UUID>
Network.parseURL(raw)             // Result<URL>
Network.parseURI(raw)             // Result<URI>
Network.parseInetAddress(raw)     // Result<InetAddress>

// Internationalization
I18n.parseLocale(raw)             // Result<Locale>
I18n.parseCurrency(raw)           // Result<Currency>

// Text
Text.parseBoolean(raw)            // Result<Boolean>
```

**Example value object using parse utilities:**
```java
public record Age(int value) {
    public static Result<Age> age(String raw) {
        return Number.parseInt(raw)
            .flatMap(Verify.ensureFn(Causes.cause("Age must be 0-150"),
                                     Verify.Is::between, 0, 150))
            .map(Age::new);
    }
}
```

### Common Patterns

**Factory Methods** - Always named after type (camelCase):
```java
Email.email(raw)            // → Result<Email>
Password.password(raw)      // → Result<Password>
UserId.userId(raw)          // → Result<UserId>
```

**Validated Input** - Use `Valid` prefix (not `Validated`):
```java
record ValidRequest(Email email, Password password) {
    static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()))
                     .map(ValidRequest::new);
    }
}
```

**Result<Unit> for side effects:**
```java
public Result<Unit> saveUser(User user) {
    // ... save logic
    return Result.unitResult();  // Success with no meaningful value
}
```

**Promise<Unit> for async side effects:**
```java
public Promise<Unit> sendEmail(EmailAddress to, String body) {
    return Promise.lift(() -> {
        mailService.send(to, body);
        return Unit.unit();
    });
}
```

This covers the core Pragmatica Lite APIs you'll use in daily development. For advanced features (retry policies, timeout handling, Promise cancellation), see CODING_GUIDE.md.

---

## Summary: The Foundation is Set

You now understand the core principles that make everything else possible:

**Four return types:**
- `T`: Sync, can't fail, always present
- `Option<T>`: Sync, can't fail, may be absent
- `Result<T>`: Sync, can fail, always present if success
- `Promise<T>`: Async, can fail

**Three principles:**
1. **Parse, don't validate**: Make invalid states unrepresentable via factory methods
2. **No business exceptions**: Errors are typed Cause values, not thrown
3. **Composition rules**: Lift when needed, never nest the same concern twice

These aren't preferences or guidelines. They're **mechanical rules** that make structural decisions for you. When you follow them, code becomes predictable for humans and AI alike.

---

## Common Mistakes to Avoid

Now that you understand the core principles, here are the most common mistakes beginners make when first adopting this approach:

### Mistake 1: Nesting `Promise<Result<T>>`

❌ **Wrong:**
```java
// DON'T: Double-wrapping failures
public Promise<Result<User>> loadUser(UserId id) {
    return Promise.lift(() -> userRepository.findById(id));
}
```

✅ **Correct:**
```java
// DO: Promise already handles failures
public Promise<User> loadUser(UserId id) {
    return Promise.lift(
        DatabaseError::cause,
        () -> userRepository.findById(id)
    );
}
```

**Why wrong:** `Promise<T>` already carries failure - wrapping `Result` inside creates two error channels.

### Mistake 2: Using `.flatMap()` for Constructors

❌ **Wrong:**
```java
// DON'T: flatMap expects monadic return
Result.all(Email.email(emailRaw),
          Password.password(passwordRaw))
    .flatMap(ValidRequest::new);  // Constructor returns ValidRequest, not Result<ValidRequest>
```

✅ **Correct:**
```java
// DO: Use .map() for constructors
Result.all(Email.email(emailRaw),
          Password.password(passwordRaw))
    .map(ValidRequest::new);
```

**Why wrong:** Constructors return `T`, not `Result<T>`. Use `.map()` for plain values, `.flatMap()` for monadic values.

### Mistake 3: Defensive Null Checks in Business Logic

❌ **Wrong:**
```java
// DON'T: Defensive programming in business logic
public Result<Order> processOrder(User user, Cart cart) {
    if (user == null || cart == null) {
        return OrderError.InvalidInput.INSTANCE.result();
    }
    // ... process order
}
```

✅ **Correct:**
```java
// DO: Parameters guaranteed non-null by convention
public Result<Order> processOrder(User user, Cart cart) {
    // If cart might be absent, parameter should be Option<Cart>
    // ... process order directly
}
```

**Why wrong:** Parse-don't-validate guarantees: if a value exists, it's valid. Null checks violate this principle.

### Mistake 4: Using `Optional` Instead of `Option`

❌ **Wrong:**
```java
// DON'T: Java Optional doesn't compose with Result/Promise
public Result<Optional<Theme>> findTheme(UserId id) {
    return Result.success(repository.findTheme(id));  // Optional inside Result
}
```

✅ **Correct:**
```java
// DO: Use Option for monadic composition
public Result<Option<Theme>> findTheme(UserId id) {
    return Result.lift(
        DatabaseError::cause,
        () -> Option.option(repository.findTheme(id))
    );
}
```

**Why wrong:** `Optional` doesn't have `.async()`, `.toResult()`, or composition methods. Use `Option<T>` instead.

### Mistake 5: Throwing Business Exceptions

❌ **Wrong:**
```java
// DON'T: Throwing exceptions for business failures
public User findUser(Email email) throws UserNotFoundException {
    User user = repository.find(email);
    if (user == null) {
        throw new UserNotFoundException(email);
    }
    return user;
}
```

✅ **Correct:**
```java
// DO: Return errors as values
public Promise<User> findUser(Email email) {
    return repository.find(email)  // Returns Promise<Option<User>>
        .flatMap(opt -> opt.async(UserNotFound.cause(email)));
}
```

**Why wrong:** Exceptions are invisible in signatures and force try-catch boilerplate. Use `Result<T>` or `Promise<T>`.

### Mistake 6: Validation Separate from Construction

❌ **Wrong:**
```java
// DON'T: Separate validation method
public class Email {
    private String value;

    public Email(String value) {
        this.value = value;  // Constructor doesn't validate
    }

    public static boolean isValid(String raw) {  // Separate validation
        return raw != null && raw.matches(PATTERN);
    }
}
```

✅ **Correct:**
```java
// DO: Validation = construction
public record Email(String value) {
    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, PATTERN))
            .map(Email::new);
    }
}
```

**Why wrong:** Parse-don't-validate: if instance exists, it's valid. No separate validation methods needed.

### Mistake 7: Using `.await()` in Business Logic

❌ **Wrong:**
```java
// DON'T: Blocking in business logic
public Result<Response> execute(Request request) {
    var user = loadUser(request.userId()).await();  // Blocks!
    var profile = loadProfile(user.id()).await();   // Blocks!
    return Result.success(new Response(user, profile));
}
```

✅ **Correct:**
```java
// DO: Compose promises without blocking
public Promise<Response> execute(Request request) {
    return loadUser(request.userId())
        .flatMap(user -> loadProfile(user.id())
            .map(profile -> new Response(user, profile)));
}
```

**Why wrong:** `.await()` blocks threads, killing scalability. Use `.flatMap()` to compose async operations.

### Mistake 8: Not Using Parse Utilities

❌ **Wrong:**
```java
// DON'T: Manual exception handling
public static Result<UserId> userId(String raw) {
    try {
        UUID uuid = UUID.fromString(raw);
        return Result.success(new UserId(uuid));
    } catch (IllegalArgumentException e) {
        return InvalidUserId.cause(raw).result();
    }
}
```

✅ **Correct:**
```java
// DO: Use Pragmatica Lite parse utilities
import org.pragmatica.lang.parse.Network;

public static Result<UserId> userId(String raw) {
    return Network.parseUUID(raw).map(UserId::new);
}
```

**Why wrong:** Parse utilities handle exceptions cleanly. Don't write try-catch boilerplate manually.

**Key insight:** Most mistakes come from not trusting the type system. If you validate at construction, you don't need defensive checks. If you compose with `.flatMap()`, you don't need try-catch. Let the types guide you.

---

## What's Next?

In [Part 5: Basic Patterns & Structure](part-05-basic-patterns.md), we'll learn the structural rules and basic patterns that handle 80% of daily coding:

- Single Pattern Per Function: one responsibility, mechanical refactoring
- Single Level of Abstraction: no complex logic in lambdas
- Leaf: the atomic unit of processing
- Condition: branching as values
- Iteration: functional collection processing

These patterns apply the core principles you just learned. Once you master them, you'll have a complete toolkit for writing clear, testable business logic.

---

**Series Navigation**

[← Part 1: Introduction & Foundations](part-01-foundations.md) | [Index](INDEX.md) | [Part 5: Basic Patterns & Structure →](part-05-basic-patterns.md)

---

**Version:** 1.0.0 (2025-10-05) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)

---

## Summary: The Complete Foundation

You now have all three core principles:

**1. Four Return Types** (Part 2A):
- `T`: Sync, can't fail, always present
- `Option<T>`: Sync, can't fail, may be absent  
- `Result<T>`: Sync, can fail
- `Promise<T>`: Async, can fail

**2. Parse, Don't Validate** (Part 2B):
- Validation IS construction
- Factory methods return `Result<T>`
- Invalid states unrepresentable

**3. Errors as Values** (Part 2C):
- No business exceptions
- Typed `Cause` objects
- Error recovery with `.or()`, `.orElse()`, `.recover()`
- Null only at adapter boundaries
- Monadic composition with clean lambda rules

These aren't preferences - they're mechanical rules that eliminate entire classes of bugs and make code predictable for humans and AI.

---

## What's Next?

In [Part 5: Basic Patterns & Structure](part-05-basic-patterns.md), you'll learn the structural rules and basic patterns (Leaf, Condition, Iteration) that handle 80% of your daily coding.

---

**Series Navigation**

[← Part 3: Parse, Don't Validate](part-03-parse-dont-validate.md) | [Index](INDEX.md) | [Part 5: Basic Patterns & Structure →](part-05-basic-patterns.md)

---

**Version:** 2.0.0 (2025-01-13) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)
