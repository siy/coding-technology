# Part 2: The Four Return Types

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 2 of 9

**Previous:** [Part 1: Introduction & Foundations](part-01-foundations.md) | **Next:** [Part 3: Parse, Don't Validate](part-03-parse-dont-validate.md)

---

## Overview

This part introduces the foundation of the technology: **four return types** that cover every possible function behavior. These aren't arbitrary—they form a complete, minimal basis for expressing sync/async, success/failure, and present/absent combinations.

By the end of this part, you'll understand:
- Why exactly four return types are sufficient
- When to use each type
- How to convert between types
- Why Java's standard library isn't enough

**Note on examples:** Code examples in this series show types in their final package locations (use case packages, `domain.shared`). Package structure and organization are covered comprehensively in Part 6—for now, focus on the concepts and patterns.

---

## Spring to JBCT Translation

**If you're coming from Spring Boot**, here's how JBCT concepts map to familiar patterns. JBCT doesn't replace Spring—it changes how you structure code within Spring applications.

| Spring Pattern | JBCT Equivalent | Key Difference |
|----------------|-----------------|----------------|
| `@Service` class | Use case interface + implementation | Pure functions, no framework coupling. Business logic doesn't know about Spring. |
| `@Repository` interface | Adapter interface (in use case package) | I/O operations live at edges only. Database logic is isolated. |
| `@Valid` + Bean Validation | Parse-don't-validate (value object factories) | Validation = construction. Impossible to create invalid objects. |
| `Optional<T>` | `Option<T>` | Better composition with Smart Wrappers (monads), clearer semantics for "might be missing". |
| `throws Exception` | `Result<T>` (sync) or `Promise<T>` (async) | Typed errors, no hidden control flow. Compiler forces error handling. |
| `CompletableFuture<T>` | `Promise<T>` | Simpler error handling, consistent with `Result<T>` patterns. |
| `@Transactional` | Aspect pattern (Part 4) | Explicit boundary management, independently testable. |

**Key insight:** Your Spring controllers stay largely the same. But instead of calling `@Service` beans that throw exceptions and return nulls, you call use case interfaces that return `Result<T>` or `Promise<T>`. The framework integration stays in adapters—business logic becomes pure and framework-agnostic.

Example:

```java
// Traditional Spring
@RestController
public class UserController {
    @Autowired private UserService userService;  // Framework-coupled service

    @PostMapping("/register")
    public User register(@Valid @RequestBody RegistrationRequest req) {
        return userService.registerUser(req);  // Throws exceptions
    }
}

// JBCT with Spring
@RestController
public class UserController {
    private final RegisterUser registerUser;  // Pure use case interface

    public UserController(RegisterUser registerUser) {
        this.registerUser = registerUser;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterUser.Request raw) {
        return registerUser.execute(raw)     // Validation happens inside use case
            .fold(this::errorResponse,       // Explicit error handling
                  this::successResponse);
    }
}
```

Throughout this part, you'll see Smart Wrappers (monads) used frequently. These are the fundamental building blocks. We'll gradually introduce the term "monad" as you become comfortable with the patterns.

---

## The Four Return Kinds

Every function in this technology returns exactly one of four types. Not "usually" or "preferably" - exactly one, always. This isn't arbitrary restriction; it's intentional compression of complexity into type signatures.

**Why by criteria:**
- **Mental Overhead**: Hidden error channels (exceptions), hidden optionality (null), hidden asynchrony (blocking I/O) force remembering behavior not in signatures. Explicit types eliminate this (+3).
- **Reliability**: Compiler verifies error handling, null safety, and async boundaries when encoded in types (+3).
- **Complexity**: Four types cover all scenarios - no guessing about combinations (+2).

### `T` - Synchronous, Cannot Fail, Value Always Present

Use this when the operation is pure computation with no possibility of failure or missing data. Mathematical calculations, transformations of valid data, simple getters. If you can't think of a way this function could fail or return nothing, it returns `T`.

```java
public record FullName(String value) {
    public String initials() {  // returns String (T)
        return value.chars()
                    .filter(Character::isUpperCase)
                    .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                    .toString();
    }
}
```

The signature `String initials()` tells you: this always succeeds, always returns a value, completes immediately.

### `Option<T>` - Synchronous, Cannot Fail, Value May Be Missing

Use this when absence is a valid outcome, but failure isn't possible. Lookups that might not find anything, optional configuration, nullable database columns when null is semantically meaningful (not just "we don't know"). The key: missing data is normal business behavior, not an error.

```java
// Finding an optional user preference
public interface PreferenceRepository {
    Option<Theme> findThemePreference(UserId id);  // might not be set
}
```

The signature `Option<Theme>` tells you: this always succeeds, but the value might be absent. The caller must handle both cases (`some()` and `none()`).

### `Result<T>` - Synchronous, Can Fail, Represents Business/Validation Errors

Use this when an operation might fail for business or validation reasons. Parsing input, enforcing invariants, business rules that can be violated. Failures are represented as typed `Cause` objects, not exceptions. Every failure path is explicit in the return type.

> **Note on terminology:** `Cause` represents domain failures or error reasons, not exception causes (like `Throwable.getCause()`). Think of it as "FailureReason" or "DomainError"—it's the typed representation of why a business operation failed.

```java
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Functions.Fn1;
import org.pragmatica.lang.validation.Verify;
import org.pragmatica.lang.error.Cause;
import org.pragmatica.lang.error.Causes;

import java.util.regex.Pattern;

public record Email(String value) {
    // private Email {}  // Not yet supported in Java

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
                     .map(String::trim)
                     .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, EMAIL_PATTERN))
                     .map(Email::new);
    }
}
```

The signature `Result<Email>` tells you: this might fail (invalid format), completes immediately, failure is typed (not an exception).

### `Promise<T>` - Asynchronous, Can Fail, Represents Eventual Success or Failure

Use this for any I/O operation, external service call, or computation that might block. `Promise<T>` is semantically equivalent to `Result<T>` but asynchronous - failures are carried in the Promise itself, not nested inside it. This is Java's answer to Rust's `Future<Result<T>>` without the nesting problem.

```java
public interface AccountRepository {
    Promise<Account> findById(AccountId id);  // async lookup, can fail
}
```

The signature `Promise<Account>` tells you: this completes later (async), might fail (network, database), failure is carried in the Promise.

**Promise Resolution and Thread Safety:**

Promise resolution is **thread-safe** and happens **exactly once**. These guarantees are critical for concurrent code:

- **Multiple threads can attempt resolution** - only the first succeeds. Subsequent resolution attempts are ignored.
- **Resolution serves as synchronization point** - all attached transformations see a consistent, final result.
- **Transformations execute after resolution** - `map`, `flatMap` chains run in attachment order once the Promise resolves.
- **Side effects execute independently** - `onSuccess`, `onFailure`, `onResult` callbacks run asynchronously and don't block transformation chains.

```java
// Thread-safe Promise resolution
var promise = Promise.<User>promise();

// Multiple threads racing to resolve - only first wins
executor.submit(() -> promise.succeed(user1));  // First to resolve
executor.submit(() -> promise.succeed(user2));  // Ignored
executor.submit(() -> promise.succeed(user3));  // Ignored

// All transformations see the same result (user1)
promise.map(this::processUser)           // Executes after resolution
       .flatMap(this::saveToDatabase)    // Chain continues
       .onSuccess(this::logSuccess);     // Side effect runs independently
```

This thread-safety model enables safe concurrent composition without explicit synchronization. See Part 4 for Fork-Join pattern details on parallel execution.

### Why Not Use Java's Built-in Types?

**"Can't I just use `Optional`, `CompletableFuture`, and exceptions?"**

You could, but you'd hit these problems:

| Java Standard Approach           | Problem                                                                           | JBCT Solution                                                              |
|----------------------------------|-----------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| `return null`                    | Hidden optionality → `NullPointerException` at runtime                            | `Option<T>` - optionality explicit in type                                 |
| `Optional<T>`                    | Can't represent failures (empty vs error), awkward async composition              | `Option<T>` for "not found", `Result<T>` for "might fail with typed error" |
| `try-catch` with exceptions      | Invisible control flow, unchecked = hidden, checked = verbose                     | `Result<T>` - errors are values, type-checked, composable                  |
| `CompletableFuture<T>`           | Complex error handling (`.exceptionally`, `.handle`), nested hell with `Optional` | `Promise<T>` - consistent with `Result<T>` patterns, simpler composition   |
| `CompletableFuture<Optional<T>>` | Forbidden anti-pattern - two levels of "might not have value"                     | Use `Promise<T>` (failure in Promise) or `Promise<Option<T>>` sparingly    |

**Example of the problem:**

```java
// Traditional Java - hidden failures
public User findUser(String id) throws UserNotFoundException {
    // Throws checked exception - must declare, must catch
    // OR returns null - hidden optionality
    // OR returns Optional<User> - can't distinguish "not found" from "database error"
}

// CompletableFuture for async
public CompletableFuture<User> findUserAsync(String id) {
    // Error handling: .exceptionally? .handle? .whenComplete?
    // What if user not found vs database error?
    // CompletableFuture<Optional<User>>? Now you have nested hell
}

// JBCT - explicit, composable
public Result<User> findUser(UserId id) {
    // Sync: Returns Result - caller knows it might fail
    // Type carries both success (User) and failure (Cause)
    // Composes with flatMap, no exception handling needed
}

public Promise<User> findUserAsync(UserId id) {
    // Async: Returns Promise - caller knows it's async
    // Failure is inside Promise, same Result semantics
    // Composes with flatMap, consistent patterns
}
```

**Key differences:**
- **Explicit in types**: Signature tells you failure modes, no hidden exceptions
- **Consistent composition**: `map`/`flatMap` work the same across all monadic types
- **No nesting**: One concern per type level, never `Promise<Result<T>>`
- **Better inference**: AI can generate correct error handling from types alone

### Why Exactly Four?

These four types form a complete basis for composition. You can lift "up" when needed (`Option` to `Result` to `Promise`), but you never nest the same concern twice (`Promise<Result<T>>` is forbidden). Each type represents one orthogonal concern:

- **Synchronous vs. asynchronous**: now vs. later
- **Can fail vs cannot fail**: error channel present or absent
- **Value vs optional value**: presence guaranteed or not

Traditional Java mixes these concerns. A method returning `User` might throw exceptions (hidden error channel), return null (hidden optionality), or block on I/O (hidden asynchrony). You can't tell from the signature. With these four types, the signature tells you everything about the function's behavior before you read a line of implementation.

**Decision table:**

| Sync?  | Can Fail?  | May Be Absent?  | Return Type  |
|--------|------------|-----------------|--------------|
| Yes    | No         | No              | `T`          |
| Yes    | No         | Yes             | `Option<T>`  |
| Yes    | Yes        | No              | `Result<T>`  |
| Async  | Yes        | No              | `Promise<T>` |

This clarity is what makes AI-assisted development tractable. When generating code, an AI doesn't need to infer whether error handling is needed - the return type declares it. When reading code, a human doesn't need to trace execution paths to find hidden failure modes - they're in the type signature.

### Return Type Matrix

**Allowed Return Types:**

| Type | Use Case |
|------|----------|
| `T` | Synchronous, cannot fail, always present |
| `Option<T>` | Synchronous, cannot fail, might be absent |
| `Result<T>` | Synchronous, can fail |
| `Promise<T>` | Asynchronous, can fail |
| `Result<Option<T>>` | Optional value that can fail validation |
| `Promise<Option<T>>` | Async lookup that might not find anything |

**Discouraged:**

| Type | Why Discouraged |
|------|-----------------|
| `Optional<T>` | Use `Option<T>` for consistency |
| `CompletableFuture<T>` | Use `Promise<T>` for consistent error handling |
| Framework-specific types | Keep business logic framework-agnostic |

**Forbidden (Double-Monad Nesting):**

| Type | Why Forbidden |
|------|---------------|
| `Promise<Result<T>>` | `Promise` already carries failures |
| `Result<Result<T>>` | Nested failures create unwrapping ceremony |
| `Option<Option<T>>` | Nested optionality is meaningless |

**Rule:** Each monadic concern appears at most once in a return type.

### Quick Reference: Choosing the Right Type

**Return `T` when:**
- Pure computation (e.g., `calculateTotal`, `formatCurrency`)
- Transformation of already-valid data (e.g., `toUpperCase`, `extractId`)
- Getters for required fields (e.g., `user.email()`, `order.total()`)

**Return `Option<T>` when:**
- Lookup might not find anything (e.g., `findByUsername`)
- Field is genuinely optional in the domain (e.g., `user.middleName()`)
- "Not found" is a normal outcome, not an error

**Return `Result<T>` when:**
- Validating input (e.g., `Email.email(raw)`)
- Enforcing business rules (e.g., `checkInvariant`)
- Parsing or constructing domain objects (e.g., `OrderId.orderId(raw)`)

**Return `Promise<T>` when:**
- Any I/O operation (database, HTTP, file system)
- External service calls
- Operations that might block or take time

---

## Type Conversions and Lifting

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
    .flatMap(resultUser -> resultUser.fold(
        Cause::promise,
        user -> Promise.success(user)
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

---

## Pragmatica Lite Quick Reference

Common imports and methods you'll use throughout this series:

```java
// Core types
import org.pragmatica.lang.Option;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Promise;
import org.pragmatica.lang.Unit;

// Error handling
import org.pragmatica.lang.error.Cause;
import org.pragmatica.lang.error.Causes;

// Validation
import org.pragmatica.lang.validation.Verify;

// Parsing utilities
import org.pragmatica.lang.parse.Number;
import org.pragmatica.lang.parse.DateTime;
import org.pragmatica.lang.parse.Network;

// Functions
import org.pragmatica.lang.Functions.Fn1;
import org.pragmatica.lang.Functions.Fn2;
```

**Common patterns:**
- `Result.success(value)` - Create success
- `cause.result()` - Create failure (prefer over `Result.failure(cause)`)
- `Result.all(r1, r2, ...)` - Parallel validation, collect all errors
- `Result.allOf(list)` - Aggregate list of Results
- `Verify.ensure(value, predicate)` - Validate value
- `Verify.ensureFn(cause, predicate, params...)` - Validate with custom error
- `Causes.forOneValue("message: %s")` - Create cause factory
- `Number.parseInt(raw)`, `DateTime.parseLocalDate(raw)` - Safe parsing

---

## Type Conversion API Reference

### Option conversions:
- `Option<T>` → `Result<T>`  -  **`.toResult(Cause cause)`** or **`.await(Cause cause)`** (aliases)
- `Option<T>` → `Result<T>`  -  **`.toResult()`** or **`.await()`** (uses CoreError.emptyOption)
- `Option<T>` → `Promise<T>`  -  **`.async(Cause cause)`**
- `Option<T>` → `Promise<T>`  -  **`.async()`** (uses CoreError.emptyOption)
- `Option<T>` → `Optional<T>`  -  **`.toOptional()`**

### Result conversions:
- `Result<T>` → `Option<T>`  -  **`.option()`** (loses error information)
- `Result<T>` → `Promise<T>`  -  **`.async()`**

### Promise conversions:
- `Promise<T>` → `Promise<T>`  -  **`.async()`** (identity, for API consistency)
- `Promise<T>` → `Result<T>`  -  **`.await()`** (blocks current thread)
- `Promise<T>` → `Result<T>`  -  **`.await(TimeSpan timeout)`** (with timeout)

### Cause conversions:
- `Cause` → `Result<T>`  -  **`.result()`** (prefer over `Result.failure(cause)`)
- `Cause` → `Promise<T>`  -  **`.promise()`** (prefer over `Promise.failure(cause)`)

### Factories (creating instances):
- `Option.option(T value)`  -  wraps nullable value (null → empty)
- `Option.from(Optional<T>)`  -  converts Java Optional to Option
- `Option.some(T value)` / `Option.present(T value)`  -  create present option
- `Option.none()` / `Option.empty()`  -  create empty option
- `Result.success(T value)` / `Result.ok(T value)`  -  create success
- `Result.unitResult()`  -  success with Unit value
- `Result.failure(Cause cause)` / `Result.err(Cause cause)`  -  create failure (prefer `cause.result()`)
- `Promise.success(T value)` / `Promise.ok(T value)`  -  resolved promise (success)
- `Promise.unitPromise()`  -  resolved promise with Unit value
- `Promise.failure(Cause cause)` / `Promise.err(Cause cause)`  -  resolved promise (failure) (prefer `cause.promise()`)
- `Promise.resolved(Result<T> result)`  -  resolved promise
- `Promise.promise()`  -  unresolved promise
- `Promise.promise(Consumer<Promise<T>>)`  -  unresolved, runs consumer async
- `Promise.promise(Supplier<Result<T>>)`  -  async execution of supplier
- `Promise.promise(TimeSpan delay, Consumer<Promise<T>>)`  -  unresolved, runs consumer after delay
- `Promise.promise(TimeSpan delay, Supplier<Result<T>>)`  -  async execution after delay

---

## Summary: Foundation Set

You now understand the four return types that make everything else possible:

**Four return types:**
- `T`: Sync, can't fail, always present
- `Option<T>`: Sync, can't fail, may be absent
- `Result<T>`: Sync, can fail, always present if success
- `Promise<T>`: Async, can fail

**Key insights:**
- Signatures tell you everything: failure modes, optionality, synchrony
- Conversions let you lift between types when composing
- Never nest the same concern twice (`Promise<Result<T>>` forbidden)
- `Result<Option<T>>` allowed for optional values that must validate

These aren't preferences or guidelines. They're **mechanical rules** that make structural decisions for you. When you follow them, code becomes predictable for humans and AI alike.

---

## What's Next?

In [Part 3: Parse, Don't Validate](part-03-parse-dont-validate.md), you'll learn how to make invalid states unrepresentable through factory methods and validation at construction time.

---

**Series Navigation**

[← Part 1: Introduction & Foundations](part-01-foundations.md) | [Index](INDEX.md) | [Part 3: Parse, Don't Validate →](part-03-parse-dont-validate.md)

---

**Version:** 2.0.0 (2025-11-13) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)
