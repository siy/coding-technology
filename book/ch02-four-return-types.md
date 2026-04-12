# Chapter 3: The Four Return Types

## What You'll Learn

- Why exactly four return types are sufficient
- When to use each type: T, Option, Result, Promise
- How to convert between types
- Why Java's standard library isn't enough

---

## Overview

Every function in JBCT returns exactly one of four types. Not "usually" or "preferably"—exactly one, always. This isn't an arbitrary restriction; it's intentional compression of complexity into type signatures.

**Why by criteria:**
- **Mental Overhead**: Hidden error channels (exceptions), hidden optionality (null), hidden asynchrony (blocking I/O) force remembering behavior not in signatures. Explicit types eliminate this (+3).
- **Reliability**: Compiler verifies error handling, null safety, and async boundaries when encoded in types (+3).
- **Complexity**: Four types cover all scenarios - no guessing about combinations (+2).

---

## T - Synchronous, Cannot Fail, Always Present

Use this when the operation is pure computation with no possibility of failure or missing data. Mathematical calculations, transformations of valid data, simple getters. If you can't think of a way this function could fail or return nothing, it returns `T`.

```java
public record FullName(String value) {
    public String initials() {  // returns String (T)
        return value.chars()
                    .filter(Character::isUpperCase)
                    .collect(StringBuilder::new,
                             StringBuilder::appendCodePoint,
                             StringBuilder::append)
                    .toString();
    }
}
```

The signature `String initials()` tells you: this always succeeds, always returns a value, completes immediately.

**Return `T` when:**
- Pure computation (e.g., `calculateTotal`, `formatCurrency`)
- Transformation of already-valid data (e.g., `toUpperCase`, `extractId`)
- Getters for required fields (e.g., `user.email()`, `order.total()`)

---

## `Option<T>` - Synchronous, Cannot Fail, May Be Missing

Use this when absence is a valid outcome but failure isn't possible. Lookups that might not find anything, optional configuration, nullable database columns when null is semantically meaningful. The key: missing data is normal business behavior, not an error.

```java
public interface PreferenceRepository {
    Option<Theme> findThemePreference(UserId id);  // might not be set
}
```

The signature `Option<Theme>` tells you: this always succeeds, but the value might be absent. The caller must handle both cases.

**Return `Option<T>` when:**
- Lookup might not find anything (e.g., `findByUsername`)
- Field is genuinely optional in the domain (e.g., `user.middleName()`)
- "Not found" is a normal outcome, not an error

---

## `Result<T>` - Synchronous, Can Fail, Business/Validation Errors

Use this when an operation might fail for business or validation reasons. Parsing input, enforcing invariants, business rules that can be violated. Failures are represented as typed `Cause` objects, not exceptions.

> **Note:** `Cause` represents domain failures or error reasons. Think of it as "FailureReason" or "DomainError"—the typed representation of why a business operation failed.

```java
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL =
        Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::present)
                     .map(String::trim)
                     .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
                     .map(Email::new);
    }
}
```

The signature `Result<Email>` tells you: this might fail (invalid format), completes immediately, failure is typed.

**Return `Result<T>` when:**
- Validating input (e.g., `Email.email(raw)`)
- Enforcing business rules (e.g., `checkInvariant`)
- Parsing or constructing domain objects (e.g., `OrderId.orderId(raw)`)

> **Why Result: Error Handling Philosophy**
>
> Error handling logic belongs where business context exists to make decisions. Sometimes that's close to where the error occurred; sometimes the error propagates unchanged because only the caller has enough context to decide.
>
> Different mechanisms have distinct trade-offs:
>
> | Mechanism | Transparency | Ergonomics | Reliability |
> |-----------|--------------|------------|-------------|
> | **Checked exceptions** | ✅ Explicit | ❌ Verbose, coupling | ✅ Compiler-enforced |
> | **Unchecked exceptions** | ❌ Hidden | ⚠️ Mental overhead | ❌ Silent failures |
> | **Errors as values** (Go) | ✅ Visible | ❌ Manual propagation | ❌ Easy to ignore |
> | **Functional (Result)** | ✅ In type | ✅ Monadic composition | ✅ Compiler-enforced |
>
> `Result<T>` combines the best: explicit in signature, ergonomic via `map`/`flatMap`, compiler-verified handling.

---

## `Promise<T>` - Asynchronous, Can Fail

Use this for any I/O operation, external service call, or computation that might block. `Promise<T>` is semantically equivalent to `Result<T>` but asynchronous - failures are carried in the Promise itself, not nested inside it.

```java
public interface AccountRepository {
    Promise<Account> findById(AccountId id);  // async lookup, can fail
}
```

The signature `Promise<Account>` tells you: this completes later (async), might fail (network, database), failure is carried in the Promise.

> **Promise as Async Result**
>
> Think of `Promise<T>` as the asynchronous counterpart to `Result<T>`. Both represent operations that can succeed or fail with typed errors. The only difference is timing: `Result<T>` completes immediately, `Promise<T>` completes later. The same `map`/`flatMap` patterns work identically; converting is trivial (`result.async()` lifts to Promise, `promise.await()` blocks to Result). When you understand `Result<T>`, you understand `Promise<T>`.

**Promise Resolution and Thread Safety:**

Promise resolution is **thread-safe** and happens **exactly once**:

- Multiple threads can attempt resolution - only the first succeeds
- Resolution serves as synchronization point
- Transformations execute after resolution
- Side effects execute independently

```java
var promise = Promise.<User>promise();

// Multiple threads racing to resolve - only first wins
executor.submit(() -> promise.succeed(user1));  // First to resolve
executor.submit(() -> promise.succeed(user2));  // Ignored

// All transformations see the same result (user1)
promise.map(this::processUser)
       .flatMap(this::saveToDatabase)
       .onSuccess(this::logSuccess);
```

**Return `Promise<T>` when:**
- Any I/O operation (database, HTTP, file system)
- External service calls
- Operations that might block or take time

---

## Why Exactly Four?

These four types form a complete basis for composition. You can lift "up" when needed (`Option` to `Result` to `Promise`), but you never nest the same concern twice.

Each type represents one orthogonal concern:
- **Synchronous vs. asynchronous**: now vs. later
- **Can fail vs cannot fail**: error channel present or absent
- **Value vs optional value**: presence guaranteed or not

**Decision table:**

| Sync? | Can Fail? | May Be Absent? | Return Type |
|-------|-----------|----------------|-------------|
| Yes   | No        | No             | `T`         |
| Yes   | No        | Yes            | `Option<T>` |
| Yes   | Yes       | No             | `Result<T>` |
| Async | Yes       | No             | `Promise<T>`|

---

## Return Type Matrix

### Allowed Return Types

| Type | Use Case |
|------|----------|
| `T` | Synchronous, cannot fail, always present |
| `Option<T>` | Synchronous, cannot fail, might be absent |
| `Result<T>` | Synchronous, can fail |
| `Promise<T>` | Asynchronous, can fail |
| `Result<Option<T>>` | Optional value that can fail validation |
| `Promise<Option<T>>` | Async lookup that might not find anything |

### Discouraged

| Type | Why Discouraged |
|------|-----------------|
| `Optional<T>` | Use `Option<T>` for consistency |
| `CompletableFuture<T>` | Use `Promise<T>` for consistent error handling |
| Framework-specific types (`Mono<T>`, `ResponseEntity<T>`) | Keep business logic framework-agnostic |

### Forbidden (Double-Monad Nesting)

| Type | Why Forbidden |
|------|---------------|
| `Promise<Result<T>>` | `Promise` already carries failures - double error channel |
| `Result<Result<T>>` | Nested failures create unwrapping ceremony |
| `Option<Option<T>>` | Nested optionality is meaningless |
| `Promise<Option<Result<T>>>` | Triple nesting - architectural smell |

**Rule:** Each monadic concern (optionality, failure, asynchrony) appears at most once in a return type.

---

## Why Not Java's Built-in Types?

**"Can't I just use `Optional`, `CompletableFuture`, and exceptions?"**

You could, but you'd hit these problems:

| Java Approach | Problem | JBCT Solution |
|---------------|---------|---------------|
| `return null` | Hidden optionality → NPE at runtime | `Option<T>` explicit in type |
| `Optional<T>` | Can't represent failures | `Result<T>` for typed errors |
| `try-catch` | Invisible control flow | `Result<T>` - errors as values |
| `CompletableFuture<T>` | Complex error handling | `Promise<T>` consistent patterns |

**Key differences:**
- **Explicit in types**: Signature tells you failure modes, no hidden exceptions
- **Consistent composition**: `map`/`flatMap` work the same across all types
- **No nesting**: One concern per type level
- **Better inference**: AI can generate correct error handling from types alone

---

## Type Conversions

### Lifting: Moving Between Types

You can lift a "lower" type into a "higher" one:

```java
// T → Option/Result/Promise
Option.option(value)
Result.success(value)
Promise.success(value)

// Option → Result/Promise
option.toResult(cause)
option.async(cause)

// Result → Promise
result.async()
```

Example:
```java
public Promise<Response> execute(Request request) {
    return ValidRequest.validRequest(request)
                       .async()  // Result → Promise
                       .flatMap(step1::apply)
                       .flatMap(step2::apply);
}
```

### Forbidden Nesting: `Promise<Result<T>>`

**`Promise<Result<T>>` is forbidden.** `Promise<T>` already carries failures - nesting `Result` inside creates two error channels.

**Wrong:**
```java
Promise<Result<User>> loadUser(UserId id) { /* ... */ }

// Caller must unwrap twice - absurd ceremony
loadUser(id)
    .flatMap(resultUser -> resultUser.fold(
        Cause::promise,
        user -> Promise.success(user)
    ));
```

**Right:**
```java
Promise<User> loadUser(UserId id) { /* ... */ }

// Caller just chains
return loadUser(id).flatMap(nextStep);
```

### Allowed Nesting: `Result<Option<T>>`

`Result<Option<T>>` is permitted sparingly for "optional value that can fail validation."

```java
Result<Option<ReferralCode>> refCode = ReferralCode.referralCode(input);
// Success(None) = not provided, valid
// Success(Some(code)) = provided and valid
// Failure(cause) = provided but invalid
```

Use `Verify.ensureOption()` (Pragmatica Core 0.9.0+) to implement this pattern:

```java
public static Result<Option<ReferralCode>> referralCode(String raw) {
    return Verify.ensureOption(
        Option.option(raw).map(String::trim).filter(s -> !s.isEmpty()),
        PATTERN.asMatchPredicate(),
        INVALID_FORMAT
    ).map(opt -> opt.map(ReferralCode::new));
}
```

---

## API Quick Reference

### Type Conversions

```java
// Option conversions
option.toResult(cause)      // Option → Result
option.async(cause)         // Option → Promise
option.toOptional()         // Option → Java Optional

// Result conversions
result.async()              // Result → Promise
result.option()             // Result → Option (loses error)

// Promise conversions
promise.await()             // Promise → Result (blocks)
promise.await(timeout)      // Promise → Result (with timeout)

// Cause conversions (preferred)
cause.result()              // Cause → Result failure
cause.promise()             // Cause → Promise failure
```

### Creating Instances

```java
// Option
Option.some(value)
Option.none()
Option.option(nullable)     // null → none

// Result
Result.success(value)
cause.result()              // Preferred for failure

// Promise
Promise.success(value)
cause.promise()             // Preferred for failure
Promise.promise()           // Unresolved
```

---

## Key Takeaways

1. **Four types cover all cases** - T, Option, Result, Promise
2. **Signatures tell everything** - failure modes, optionality, synchrony
3. **Lift up, never nest** - Convert to higher types, never `Promise<Result<T>>`
4. **Consistent composition** - Same map/flatMap across all types
5. **Use Cause methods** - Prefer `cause.result()` over `Result.failure(cause)`

### When `void` Is the Right Return Type

The four return kinds cover cases where the caller uses the result. But there's a distinct category where **no caller ever inspects the outcome**: fire-and-forget side effects.

**Two legitimate cases:**

1. **API Conformance** — An external API requires `void` (JDK's `Runnable`, framework event handlers)
2. **Fire-and-Forget Side Effects** — The caller deliberately discards the outcome (metrics, event publishing, cache warming)

```java
// Fire-and-forget — caller doesn't care about outcome
void recordLatency(String operation, Duration elapsed);
void publishDomainEvent(OrderPlaced event);
```

The `void` return type is a **semantic signal**: errors are handled internally, never propagated to the caller. Compare:

- `Result<Unit>` — failure matters (e.g., `deleteUser`)
- `Promise<Unit>` — async, failure matters (e.g., `sendEmail`)
- `void` — failure is irrelevant to caller (e.g., `recordMetric`)

**Note:** The `Void` *type parameter* (as in `Result<Void>`) remains forbidden — use `Unit`. The `void` *return type* is the fire-and-forget signal.

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 1.3: Type Lifting
- Exercise 1.4: Cause Creation
- Exercise 1.5: Pragmatica Core Operations

---

## What's Next

[Chapter 4](ch03-pragmatica-lite-essentials.md) covers Pragmatica Core - the library that provides these four types. You'll learn the API in depth and see common usage patterns.
