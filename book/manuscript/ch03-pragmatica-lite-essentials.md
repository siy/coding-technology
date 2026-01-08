# Chapter 3: Pragmatica Lite Essentials

This chapter introduces Pragmatica Lite Core—the library that provides the foundational types for JBCT. You'll learn why the library exists, its design philosophy, and how to use its core features effectively.

---

## Why a Custom Library?

Java provides `Optional` and `CompletableFuture`. Why not use them?

### Problems with Java's Built-in Types

| Type | Problem |
|------|---------|
| `Optional` | No error channel - you know something is missing but not why |
| `Optional` | Not designed for validation - orElseThrow loses context |
| `CompletableFuture` | Exceptions as control flow - checked exceptions don't compose |
| `CompletableFuture` | Verbose API - thenApply, thenCompose, exceptionally chains |
| `null` | Billion-dollar mistake - no type safety, NPE at runtime |

### What JBCT Needs

1. **Four distinct return types** - Each with clear semantics
2. **Composable error handling** - Errors as values, not exceptions
3. **Consistent API** - Same method names across all types
4. **Type-safe transformations** - Lift between types without losing information

Pragmatica Lite Core provides exactly this.

---

## Installation

**Maven (preferred):**
```xml
<dependency>
   <groupId>org.pragmatica-lite</groupId>
   <artifactId>core</artifactId>
   <version>0.9.10</version>
</dependency>
```

**Gradle:**
```gradle
implementation 'org.pragmatica-lite:core:0.9.10'
```

---

## The Four Core Types

### `Option<T>` - Value May Be Absent

```java
import org.pragmatica.lang.Option;

Option<User> user = Option.some(new User("Alice"));
Option<User> nobody = Option.none();
Option<User> fromNullable = Option.option(possiblyNullValue);
```

**Use when:** Value might not exist, but absence is not an error.

**Examples:** Cache lookup, optional configuration, search result.

### `Result<T>` - Operation May Fail

```java
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Cause;

Result<Email> valid = Result.success(new Email("user@example.com"));
Result<Email> invalid = INVALID_EMAIL.result();  // Preferred: fluent style

// Also works (but verbose)
Result<Email> invalid2 = Causes.cause("Invalid format").result();
```

**Use when:** Synchronous operation that can fail with typed error.

**Examples:** Validation, parsing, business rule checks.

### `Promise<T>` - Async Operation May Fail

```java
import org.pragmatica.lang.Promise;

Promise<User> fetching = Promise.promise();  // Unresolved
Promise<User> ready = Promise.success(user);  // Already resolved
Promise<User> failed = USER_NOT_FOUND.promise();  // Preferred: fluent style
```

**Use when:** Asynchronous operation (I/O, external service).

**Examples:** Database query, HTTP call, file read.

### Cause - Typed Error

```java
import org.pragmatica.lang.Cause;
import org.pragmatica.lang.utils.Causes;

// Simple cause
Cause simple = Causes.cause("Something went wrong");

// Cause with context
Fn1<Cause, String> INVALID_EMAIL = Causes.forOneValue("Invalid email: %s");
Cause withContext = INVALID_EMAIL.apply("not-an-email");

// Cause from exception
Cause fromException = Causes.fromThrowable(exception);
```

**Use when:** Representing failure reason in Result or Promise.

---

## Design Philosophy

### Consistent Method Names

All types share the same vocabulary where applicable:

| Method | Option | Result | Promise |
|--------|--------|--------|---------|
| Transform value | `map()` | `map()` | `map()` |
| Chain operations | `flatMap()` | `flatMap()` | `flatMap()` |
| Filter with condition | - | `filter()` | `filter()` |
| Provide fallback | `or()` | `or()` | `or()` |
| Handle success | `onPresent()` | `onSuccess()` | `onSuccess()` |
| Handle failure | `onEmpty()` | `onFailure()` | `onFailure()` |

### Prefer Cause Methods Over Factory Methods

```java
// DO: Use Cause methods
Cause error = VALIDATION_FAILED;
return error.result();   // Result<T>
return error.promise();  // Promise<T>

// DON'T: Use factory methods with Cause
return Result.failure(error);   // Works but verbose
return Promise.failure(error);  // Works but verbose
```

### Lift to Higher Types, Not Lower

```java
// Lifting UP is safe
Option<T> option = ...;
Result<T> result = option.toResult(CAUSE_IF_EMPTY);
Promise<T> promise = result.async();

// Going DOWN loses information
Result<T> result = ...;
Option<T> option = result.option();  // Loses error info!
```

---

## Type Transformations

### Option Conversions

```java
Option<User> option = findUser(id);

// Option -> Result (provide cause for empty case)
Result<User> result = option.toResult(USER_NOT_FOUND);

// Option -> Promise (provide cause for empty case)
Promise<User> promise = option.async(USER_NOT_FOUND);

// Option -> Java Optional (interop only)
Optional<User> javaOptional = option.toOptional();
```

### Result Conversions

```java
Result<User> result = validateUser(input);

// Result -> Promise (lift to async context)
Promise<User> promise = result.async();

// Result -> Option (loses error - use sparingly)
Option<User> option = result.option();
```

### Promise Conversions

```java
Promise<User> promise = fetchUser(id);

// Promise -> Result (blocks current thread)
Result<User> result = promise.await();

// Promise -> Result with timeout
Result<User> result = promise.await(TimeSpan.timeSpan(5).seconds());
```

---

## Common Operations

### map - Transform Success Value

```java
Result<String> raw = Result.success("  USER@EXAMPLE.COM  ");

Result<String> normalized = raw
    .map(String::trim)
    .map(String::toLowerCase);
// Result.success("user@example.com")
```

### flatMap - Chain Dependent Operations

```java
Result<Email> email = Email.email(rawEmail);
Result<Password> password = Password.password(rawPassword);

// Wrong: Nested Result
Result<Result<ValidRequest>> nested = email.map(e ->
    password.map(p -> new ValidRequest(e, p))
);

// Correct: Flat chain
Result<ValidRequest> flat = email.flatMap(e ->
    password.map(p -> new ValidRequest(e, p))
);
```

### filter - Validate with Predicate

```java
Result<Integer> age = Result.success(25);

Result<Integer> adult = age.filter(
    Causes.cause("Must be 18 or older"),
    a -> a >= 18
);
```

### recover - Handle Specific Failures

```java
Promise<Config> config = loadFromDatabase()
    .recover(cause -> switch (cause) {
        case DatabaseError _ -> loadFromFile();
        case FileError _ -> Promise.success(Config.defaults());
        default -> cause.promise();
    });
```

### or / orElse - Provide Fallback

```java
// or: Fallback value
String name = option.or("Anonymous");

// orElse: Fallback wrapped value
Option<User> user = cache.find(id).orElse(database.find(id));
```

---

## Aggregation

### Result.all - Validate Multiple Fields

```java
Result<ValidRequest> request = Result.all(
    Email.email(raw.email()),
    Password.password(raw.password()),
    Name.name(raw.name())
).map(ValidRequest::new);
```

**Behavior:** Accumulates ALL failures into CompositeCause. Does not short-circuit.

### Promise.all - Parallel Execution

```java
Promise<Dashboard> dashboard = Promise.all(
    fetchProfile(userId),
    fetchOrders(userId),
    fetchPreferences(userId)
).map(Dashboard::new);
```

**Behavior:** Executes in parallel, fails fast on first failure.

### Result.allOf / Promise.allOf - Collection Aggregation

```java
// Validate list of emails
Result<List<Email>> emails = Result.allOf(
    rawEmails.stream().map(Email::email).toList()
);

// Fetch multiple users in parallel
Promise<List<Result<User>>> users = Promise.allOf(
    userIds.stream().map(this::fetchUser).toList()
);
```

### any - First Success Wins

```java
Promise<Config> config = Promise.any(
    loadFromPrimarySource(),
    loadFromSecondarySource(),
    loadFromFallback()
);
```

---

## Exception Handling with lift

### Basic lift - Wrap Throwing Code

```java
// Wrap supplier that may throw
Result<Integer> parsed = Result.lift(() -> Integer.parseInt(raw));

// With custom error mapping
Result<Integer> parsed = Result.lift(
    ParseError::new,
    () -> Integer.parseInt(raw)
);
```

### lift with Parameters

```java
// Single parameter
Result<Hash> hashed = Result.lift1(
    HashError::new,
    encoder::encode,
    password.value()
);

// Two parameters
Result<Token> token = Result.lift2(
    TokenError::new,
    tokenService::generate,
    userId,
    expiry
);
```

### Promise.lift - Async Exception Wrapping

```java
Promise<User> user = Promise.lift(
    DatabaseError::new,
    () -> jdbcTemplate.queryForObject(sql, mapper, id)
);
```

---

## Validation Utilities

### Verify.Is Predicates

```java
import org.pragmatica.lang.utils.Verify;

// String checks
Verify.ensure(value, Verify.Is::notNull)
Verify.ensure(value, Verify.Is::notBlank)
Verify.ensure(value, Verify.Is::notEmpty)

// Length checks
Verify.ensure(password, Verify.Is::lenBetween, 8, 128)

// Pattern matching
Verify.ensure(email, Verify.Is::matches, EMAIL_PATTERN)

// Numeric checks
Verify.ensure(age, Verify.Is::positive)
Verify.ensure(age, Verify.Is::between, 0, 150)
Verify.ensure(quantity, Verify.Is::lessThanOrEqualTo, 100)
```

### Combining Validations

```java
public static Result<Password> password(String raw) {
    return Verify.ensure(raw, Verify.Is::notNull)
        .filter(TOO_SHORT, s -> Verify.Is.lenBetween(s, 8, 128))
        .filter(NO_DIGIT, DIGIT_PATTERN.asMatchPredicate())
        .filter(NO_UPPER, UPPER_PATTERN.asMatchPredicate())
        .map(Password::new);
}
```

### Parse Utilities - JDK Wrappers

```java
import org.pragmatica.lang.parse.*;

// Instead of Result.lift(() -> Integer.parseInt(raw))
Result<Integer> number = Number.parseInt(raw);
Result<Long> bigNumber = Number.parseLong(raw);
Result<BigDecimal> decimal = Number.parseBigDecimal(raw);

// Date/time parsing
Result<LocalDate> date = DateTime.parseLocalDate(raw);
Result<Instant> instant = DateTime.parseInstant(raw);

// Network types
Result<UUID> uuid = Network.parseUUID(raw);
Result<URI> uri = Network.parseURI(raw);
```

---

## Callback Methods

### Success/Failure Handlers

```java
result
    .onSuccess(user -> log.info("Found user: {}", user.id()))
    .onFailure(cause -> log.warn("User not found: {}", cause.message()));

promise
    .onSuccess(data -> cache.put(key, data))
    .onFailure(cause -> metrics.incrementFailure());
```

### Result Handler (Both Cases)

```java
promise.onResult(result -> {
    if (result.isSuccess()) {
        metrics.recordSuccess();
    } else {
        metrics.recordFailure();
    }
});
```

### fold - Transform Both Cases

```java
// Result -> ResponseEntity
ResponseEntity<?> response = result.fold(
    cause -> toErrorResponse(cause),    // Failure case first
    data -> ResponseEntity.ok(data)     // Success case second
);
```

---

## Unit Type

For operations that succeed but produce no value:

```java
// Use Unit, never Void
Result<Unit> validated = checkBusinessRule(input);
Promise<Unit> sent = sendNotification(user);

// Create success with no value
Result<Unit> ok = Result.unitResult();

// Convert any result to Unit
Promise<Unit> ignored = fetchData().mapToUnit();
```

---

## Thread Safety

### Promise Resolution

Promises have exactly-once resolution semantics:

```java
Promise<User> promise = Promise.promise();

// Only first resolution wins
promise.succeed(user1);  // This resolves the promise
promise.succeed(user2);  // Ignored
promise.fail(cause);     // Ignored
```

### Transformation Thread Safety

Transformations are thread-safe but execution order depends on resolution:

```java
Promise<User> promise = fetchUser(id);

// These may execute on different threads
promise
    .map(this::enrichUser)      // Executes after resolution
    .onSuccess(this::cacheUser) // Executes after map
    .onFailure(this::logError); // Executes if failed
```

---

## Quick Reference

### Creating Instances

```java
// Option
Option.some(value)           // Present
Option.none()                // Empty
Option.option(nullable)      // null -> none, value -> some

// Result
Result.success(value)        // Success
cause.result()               // Failure (preferred)
Result.unitResult()          // Success with Unit

// Promise
Promise.success(value)       // Resolved success
cause.promise()              // Resolved failure (preferred)
Promise.promise()            // Unresolved
```

### Type Lifting

```java
option.toResult(cause)       // Option -> Result
option.async(cause)          // Option -> Promise
result.async()               // Result -> Promise
promise.await()              // Promise -> Result (blocks)
```

### Common Transformations

```java
.map(fn)                     // Transform value
.flatMap(fn)                 // Chain monadic operation
.filter(cause, predicate)    // Validate with predicate
.recover(fn)                 // Handle failure
.or(fallback)                // Provide default value
.mapToUnit()                 // Discard value, keep success/failure
```

---

## Exercises

1. **Parse a date range:** Create a `DateRange` value object with `from` and `to` fields. Use `DateTime.parseLocalDate()` and validate that `from` is before `to`.

2. **Combine validations:** Write a `Username` value object that must be 3-20 characters, alphanumeric only, and not on a blocklist. Chain the validations.

3. **Handle nullable external API:** You receive a `Map<String, Object>` from a JSON parser. Write a method that safely extracts an optional `email` field and validates it.

4. **Lift JDBC code:** Wrap a `jdbcTemplate.query()` call in `Promise.lift()` with appropriate error mapping.

---

## Summary

Pragmatica Lite Core provides:

- **Four types with clear semantics** - Option, Result, Promise, Cause
- **Consistent API** - Same method names across types
- **Composable error handling** - Errors as values, not exceptions
- **Type-safe transformations** - Lift between types without losing information
- **Validation utilities** - Verify.Is predicates, parse wrappers
- **Thread-safe promises** - Exactly-once resolution, safe transformations

The library is intentionally minimal. It provides the building blocks for JBCT without imposing architectural decisions. Your business logic remains framework-independent.

---

## What's Next

With the foundation in place, we move to the core principles:
- **Chapter 4:** Parse, Don't Validate - Making invalid states unrepresentable
- **Chapter 5:** Error Handling & Composition - Typed errors and recovery patterns
