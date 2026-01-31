# Appendix A: Pragmatica Lite Core API Reference

## Library Information

**Maven:**
```xml
<dependency>
   <groupId>org.pragmatica-lite</groupId>
   <artifactId>core</artifactId>
   <version>0.11.2</version>
</dependency>
```

**Gradle:**
```gradle
implementation 'org.pragmatica-lite:core:0.11.2'
```

**Documentation:** https://central.sonatype.com/artifact/org.pragmatica-lite/core

---

## Type Conversions

### Option Conversions

| From | To | Method |
|------|----|--------|
| `Option<T>` | `Result<T>` | `.toResult(Cause cause)` or `.await(Cause cause)` |
| `Option<T>` | `Result<T>` | `.toResult()` (uses CoreError.emptyOption) |
| `Option<T>` | `Promise<T>` | `.async(Cause cause)` |
| `Option<T>` | `Promise<T>` | `.async()` (uses CoreError.emptyOption) |
| `Option<T>` | `Optional<T>` | `.toOptional()` |

### Result Conversions

| From | To | Method |
|------|----|--------|
| `Result<T>` | `Option<T>` | `.option()` (loses error) |
| `Result<T>` | `Promise<T>` | `.async()` |

### Promise Conversions

| From | To | Method |
|------|----|--------|
| `Promise<T>` | `Promise<T>` | `.async()` (identity) |
| `Promise<T>` | `Result<T>` | `.await()` (blocks) |
| `Promise<T>` | `Result<T>` | `.await(TimeSpan timeout)` |

### Cause Conversions

| From | To | Method |
|------|----|--------|
| `Cause` | `Result<T>` | `.result()` |
| `Cause` | `Promise<T>` | `.promise()` |

---

## Creating Instances

### Option

```java
Option.some(value)           // Create present option
Option.present(value)        // Alias for some()
Option.none()                // Create empty option
Option.empty()               // Alias for none()
Option.option(nullable)      // null -> none, value -> some
Option.from(Optional<T>)     // Convert Java Optional
```

### Result

```java
Result.success(value)        // Create success
Result.ok(value)             // Alias for success()
Result.unitResult()          // Success with Unit value
Result.failure(cause)        // Create failure (prefer cause.result())
Result.err(cause)            // Alias for failure()
```

### Promise

```java
Promise.success(value)                   // Resolved success
Promise.ok(value)                        // Alias for success()
Promise.unitPromise()                    // Resolved with Unit
Promise.failure(cause)                   // Resolved failure (prefer cause.promise())
Promise.resolved(Result<T> result)       // Resolved from result
Promise.promise()                        // Unresolved promise
Promise.promise(Consumer<Promise<T>>)    // Unresolved, runs consumer async
Promise.promise(Supplier<Result<T>>)     // Async execution of supplier
```

---

## Exception Handling (lift methods)

### Result.lift

```java
// Basic lift
Result.lift(ThrowingFn0<U> supplier)
Result.lift(Fn1<Cause, Throwable> mapper, ThrowingFn0<U> supplier)
Result.lift(ThrowingRunnable runnable)  // Returns Result<Unit>
Result.lift(Cause cause, ThrowingFn0<U> supplier)  // Fixed cause

// Direct invocation (lift + apply)
Result.lift1(ThrowingFn1<R, T1> fn, T1 value)
Result.lift2(ThrowingFn2<R, T1, T2> fn, T1 v1, T2 v2)
Result.lift3(ThrowingFn3<R, T1, T2, T3> fn, T1 v1, T2 v2, T3 v3)

// Function factories (returns wrapped function)
Result.liftFn1(ThrowingFn1<R, T1> fn)  // Returns Fn1<Result<R>, T1>
Result.liftFn2(ThrowingFn2<R, T1, T2> fn)
Result.liftFn3(ThrowingFn3<R, T1, T2, T3> fn)
```

### Promise.lift

```java
// Basic lift (async execution)
Promise.lift(ThrowingFn0<U> supplier)
Promise.lift(Fn1<Cause, Throwable> mapper, ThrowingFn0<U> supplier)
Promise.lift(ThrowingRunnable runnable)  // Returns Promise<Unit>

// Direct invocation (async)
Promise.lift1(ThrowingFn1<R, T1> fn, T1 value)
Promise.lift2(ThrowingFn2<R, T1, T2> fn, T1 v1, T2 v2)
Promise.lift3(ThrowingFn3<R, T1, T2, T3> fn, T1 v1, T2 v2, T3 v3)

// Function factories
Promise.liftFn1(ThrowingFn1<R, T1> fn)  // Returns Fn1<Promise<R>, T1>
```

---

## Aggregation (all/any/allOf)

### Result.all (accumulates failures)

```java
Result.all(Result<T1>)                    // -> Mapper1<T1>
Result.all(Result<T1>, Result<T2>)        // -> Mapper2<T1, T2>
// ... up to Mapper9

Result.allOf(Result<T>...)                // -> Result<List<T>>
Result.allOf(List<Result<T>>)             // -> Result<List<T>>
```

### Promise.all (fail-fast)

```java
Promise.all(Promise<T1>)                  // -> Mapper1<T1>
Promise.all(Promise<T1>, Promise<T2>)     // -> Mapper2<T1, T2>
// ... up to Mapper9

Promise.allOf(Collection<Promise<T>>)     // -> Promise<List<Result<T>>>
```

### any Methods

```java
Option.any(Option<T>...)   // First present option
Result.any(Result<T>...)   // First success result
Promise.any(Promise<T>...) // First success, cancels others
```

---

## Common Methods

### map/flatMap

```java
// All types
.map(Fn1<U, T> mapper)           // Transform value
.map(Supplier<U> supplier)        // Replace value
.flatMap(Fn1<M<U>, T> mapper)     // Chain monadic operations
.flatMap(Supplier<M<U>> supplier) // Replace with monadic value

// Result/Promise only
.flatMap2(Fn2<M<U>, T, I> mapper, I param)  // flatMap with extra param
.mapToUnit()                                 // Transform to Unit
```

### filter (Result and Promise)

```java
.filter(Cause cause, Predicate<T> predicate)
.filter(Fn1<Cause, T> causeMapper, Predicate<T> predicate)
```

### Callback Methods

```java
// Option
.onPresent(Consumer<T>)
.onEmpty(Runnable)
.apply(Consumer<T>, Runnable)  // Bifurcation

// Result
.onSuccess(Consumer<T>)
.onFailure(Consumer<Cause>)
.onResult(Consumer<Result<T>>)
.apply(Consumer<T>, Consumer<Cause>)  // Bifurcation

// Promise (same as Result, plus async variants)
.onSuccessAsync(Consumer<T>)
.onFailureAsync(Consumer<Cause>)
.withSuccess(Consumer<T>)  // Returns self for chaining
```

### fold

```java
// Option
.fold(Supplier<R> empty, Fn1<R, T> present)

// Result/Promise
.fold(Fn1<R, Cause> failure, Fn1<R, T> success)
```

### Recovery

```java
.or(T replacement)                    // Fallback value
.or(Supplier<T> supplier)             // Lazy fallback
.orElse(M<T> replacement)             // Fallback monadic value
.recover(Fn1<T, Cause> mapper)        // Result/Promise: recover from failure
```

---

## Verify.Is Predicates

```java
// Null check
Verify.Is::notNull

// String checks
Verify.Is::empty
Verify.Is::notEmpty
Verify.Is::blank
Verify.Is::notBlank
Verify.Is::lenBetween        // lenBetween(8, 128)
Verify.Is::contains
Verify.Is::notContains
Verify.Is::matches           // matches(Pattern)

// Numeric checks
Verify.Is::positive
Verify.Is::negative
Verify.Is::nonNegative
Verify.Is::nonPositive
Verify.Is::greaterThan
Verify.Is::lessThan
Verify.Is::between           // between(0, 150)
Verify.Is::equalTo
Verify.Is::notEqualTo
```

**Usage:**
```java
Verify.ensure(password, Verify.Is::lenBetween, 8, 128)
Verify.ensure(age, Verify.Is::between, 0, 150)
```

---

## Parse Subpackage

### Number Parsing

```java
Number.parseInt(String)           // -> Result<Integer>
Number.parseLong(String)          // -> Result<Long>
Number.parseDouble(String)        // -> Result<Double>
Number.parseBigDecimal(String)    // -> Result<BigDecimal>
```

### DateTime Parsing

```java
DateTime.parseLocalDate(String)       // -> Result<LocalDate>
DateTime.parseLocalTime(String)       // -> Result<LocalTime>
DateTime.parseLocalDateTime(String)   // -> Result<LocalDateTime>
DateTime.parseInstant(String)         // -> Result<Instant>
```

### Network Parsing

```java
Network.parseUUID(String)        // -> Result<UUID>
Network.parseURL(String)         // -> Result<URL>
Network.parseURI(String)         // -> Result<URI>
```

---

## Causes Utilities

```java
Causes.cause(String message)                          // Simple cause
Causes.cause(String message, Option<Cause> source)    // Cause with source
Causes.fromThrowable(Throwable)                       // Convert exception
Causes.forOneValue(String template)                   // Fn1<Cause, T> factory
Causes.forTwoValues(String template)                  // Fn2<Cause, T1, T2>
Causes.forThreeValues(String template)                // Fn3<Cause, T1, T2, T3>
Causes.composite(Result<?>...)                        // Composite from results
```

**Template syntax** (uses String.format):
```java
Causes.forOneValue("Invalid email: %s")           // CORRECT
Causes.forTwoValues("Range error: %s to %s")      // CORRECT
```

---

## Promise-Specific Operations

```java
// Resolution
.resolve(Result<T>)     // Resolve unresolved promise
.succeed(T value)       // Resolve with success
.fail(Cause cause)      // Resolve with failure
.cancel()               // Cancel execution

// Query
.isResolved()           // Check if resolved

// Timeout
.timeout(TimeSpan duration)  // Add timeout

// Result manipulation
.mapResult(Fn1<Result<U>, Result<T>>)  // Transform result
.trace(Fn1<Cause, Cause>)              // Transform error (alias: mapError)
```

---

## Example Usage Patterns

### Adapter with exception handling

```java
public Promise<User> findUser(UserId id) {
    return Promise.lift(
        CoreError::database,
        () -> jdbcTemplate.queryForObject(
            "SELECT * FROM users WHERE id = ?",
            new Object[]{id.value()},
            this::mapUser)
    );
}
```

### Lifting sync Result to async Promise

```java
public Promise<Response> execute(Request request) {
    return ValidRequest.validRequest(request)  // Result<ValidRequest>
                       .async()                // Promise<ValidRequest>
                       .flatMap(step1::apply)
                       .flatMap(step2::apply);
}
```

### Testing with functional assertions

```java
@Test
void validation_fails_forInvalidInput() {
    ValidRequest.validRequest(invalidRequest)
                .onSuccess(Assertions::fail);
}

@Test
void validation_succeeds_forValidInput() {
    ValidRequest.validRequest(validRequest)
                .onFailure(Assertions::fail)
                .onSuccess(valid -> {
                    assertEquals("expected", valid.field());
                });
}
```
