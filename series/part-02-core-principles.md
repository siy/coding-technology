# Part 2: Core Principles

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 2 of 5

**Previous:** [Part 1: Introduction & Foundations](part-01-foundations.md) | **Next:** [Part 3: Basic Patterns & Structure](part-03-basic-patterns.md)

---

## Overview

This part teaches the non-negotiable foundation of the technology: **four return types** and **three core principles**. Everything else in this series builds on these concepts.

By the end of this part, you'll understand:
- Why exactly four return types are all you need
- How to make invalid states unrepresentable through parsing
- Why business logic never throws exceptions
- How to compose operations without nesting complexity

These principles compress design decisions into mechanical rules. Master them, and the patterns in later parts become obvious.

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

```java
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forValue("Invalid email format: {}");

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

### Why Exactly Four?

These four types form a complete basis for composition. You can lift "up" when needed (`Option` to `Result` to `Promise`), but you never nest the same concern twice (`Promise<Result<T>>` is forbidden). Each type represents one orthogonal concern:

- **Synchronous vs. asynchronous**: now vs. later
- **Can fail vs cannot fail**: error channel present or absent
- **Value vs optional value**: presence guaranteed or not

Traditional Java mixes these concerns. A method returning `User` might throw exceptions (hidden error channel), return null (hidden optionality), or block on I/O (hidden asynchrony). You can't tell from the signature. With these four types, the signature tells you everything about the function's behavior before you read a line of implementation.

**Decision table:**

| Sync? | Can Fail? | May Be Absent? | Return Type |
|-------|-----------|----------------|-------------|
| Yes   | No        | No             | `T`         |
| Yes   | No        | Yes            | `Option<T>` |
| Yes   | Yes       | No             | `Result<T>` |
| Async | Yes       | No             | `Promise<T>`|

This clarity is what makes AI-assisted development tractable. When generating code, an AI doesn't need to infer whether error handling is needed - the return type declares it. When reading code, a human doesn't need to trace execution paths to find hidden failure modes - they're in the type signature.

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

## Parse, Don't Validate

Most Java code validates data after construction. You create an object with raw values, then call a `validate()` method that might throw exceptions or return error lists. This is backwards.

**The principle:** Make invalid states unrepresentable. If construction succeeds, the object is valid by definition. Validation is parsing - converting untyped or weakly-typed input into strongly typed domain objects that enforce invariants at the type level.

**Why by criteria:**
- **Mental Overhead**: No "remember to validate" - type system guarantees validity (+2).
- **Reliability**: Compiler enforces that invalid objects cannot be constructed (+3).
- **Design Impact**: Business invariants concentrated in factories, not scattered (+2).
- **Complexity**: Single validation point per type eliminates redundant checks (+1).

### The Traditional (Wrong) Approach

```java
// DON'T: Validation separated from construction
public class Email {
    private final String value;

    public Email(String value) {
        this.value = value;  // accepts anything
    }

    public boolean isValid() {  // The caller must remember to check
        return value != null && value.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    }
}

// Client code must validate manually:
Email email = new Email(input);
if (!email.isValid()) {
    throw new ValidationException("Invalid email");
}
```

**Problems:**
- You can construct invalid `Email` objects
- Validation is a separate step that callers might forget
- The `isValid()` method returns a boolean, discarding information about what's wrong
- You can't distinguish "null" from "malformed" from "too long" without checking conditions individually

### The Parse-Don't-Validate Approach

```java
// DO: Validation IS construction
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forValue("Invalid email format: {}");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .map(String::trim)
            .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, EMAIL_PATTERN))
            .map(Email::new);
    }
}

// Client code gets the Result:
Result<Email> result = Email.email(input);
// If this is a Success, the Email is valid. Guaranteed.
```

The constructor is private (or package-private). The only way to get an `Email` is through the static factory `email()`, which returns `Result<Email>`. If you have an `Email` instance, it's valid - no separate check needed. The type system enforces this.

**Note:** As of current Java versions, records do not support declaring the canonical constructor as private. This limitation means the constructor remains accessible within the same package. Future Java versions may address this. Until then, rely on team discipline and code review to ensure value objects are only constructed through their factory methods. The good news: violations are highly visible in code - since all components are normally constructed via factory methods, any direct `new Email(...)` call stands out immediately. This makes the issue easy to catch using automated static analysis checks or by instructing AI code review tools to flag direct constructor usage for value objects.

### Naming Conventions

**Factory naming**: Factories are always named after their type, lowercase-first (camelCase). This creates a natural, readable call site: `Email.email(...)`, `Password.password(...)`, `AccountId.accountId(...)`.

It's slightly redundant but:
- **Unambiguous**: You know exactly what's being created
- **Grep-friendly**: Searching for "Email.email" finds all construction sites
- **Allows static imports**: `import static Email.email` lets you write `email(raw)` while preserving context

**Validated input naming**: Use the `Valid` prefix (not `Validated`) for types representing validated inputs or intermediate data:

```java
// DO: Use Valid prefix
record ValidRequest(Email email, Password password) { ... }
record ValidUser(Email email, HashedPassword hashed) { ... }

// DON'T: Use Validated prefix (too verbose, no additional semantics)
record ValidatedRequest(...)
record ValidatedUser(...)
```

The `Valid` prefix is concise and conveys the same meaning. The past-tense `Validated` adds no semantic value - both indicate data has passed validation

```java
// Usage examples
Result<Email> email = Email.email("user@example.com");
Result<Password> password = Password.password("Secret123");
Result<UserId> userId = UserId.userId("abc-123");
```

### Optional Fields with Validation

What if a field is optional but must be valid when present? For example, a referral code that's not required but must match a pattern if provided.

Use `Result<Option<T>>` - validation can fail (Result), and if it succeeds, the value might be absent (Option).

```java
public record ReferralCode(String value) {
    private static final String PATTERN = "^[A-Z0-9]{6}$";

    public static Result<Option<ReferralCode>> referralCode(String raw) {
        return isAbsent(raw)
            ? Result.success(Option.none())
            : validatePresent(raw);
    }

    private static boolean isAbsent(String raw) {
        return raw == null || raw.isEmpty();
    }

    private static Result<Option<ReferralCode>> validatePresent(String raw) {
        return Verify.ensure(raw.trim(), Verify.Is::matches, PATTERN)
                     .map(ReferralCode::new)
                     .map(Option::some);
    }
}
```

If `raw` is null or empty, we succeed with `Option.none()`. If it's present, we validate and wrap in `Option.some()`. If validation fails, the `Result` itself is a failure.

**Caller semantics are crystal clear:**
- `Failure(cause)`: Invalid input (provided but doesn't match pattern)
- `Success(None)`: No value provided (valid state)
- `Success(Some(code))`: Valid code provided

### Normalization in Factories

Factories can normalize input (trim whitespace, lowercase email domains, etc.) as part of parsing. This keeps invariants in one place and ensures all instances are normalized consistently.

```java
public static Result<Email> email(String raw) {
    return Verify.ensure(raw, Verify.Is::notNull)
        .map(String::trim)           // Normalize: remove whitespace
        .map(String::toLowerCase)    // Normalize: lowercase for comparison
        .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, EMAIL_PATTERN))
        .map(Email::new);
}
```

Now all `Email` instances are guaranteed to be trimmed and lowercased. Domain logic never worries about case-insensitive comparison or leading/trailing spaces - it's handled once, at construction time.

### Why This Matters for AI

When an AI generates a value object, the structure is mechanical:
1. Private constructor
2. Static factory named after type
3. `Result<T>` or `Result<Option<T>>` return type
4. Validation via `Verify` combinators
5. Normalization in the pipeline

No guessing about where validation happens or how errors are reported. The AI learns the pattern once and applies it consistently.

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
    return Result.all(Email.email(emailRaw),
                      Password.password(passwordRaw))
                 .flatMap(this::validateAndCheckStatus);
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
    return ValidRequest.validate(request)
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

### Why These Rules?

They prevent complexity explosion. With exactly four return types and clear composition rules, you can always tell how to combine two functions by looking at their signatures. AI code generation becomes mechanical - given input and output types, there's one obvious way to compose.

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

## What's Next?

In [Part 3: Basic Patterns & Structure](part-03-basic-patterns.md), we'll learn the structural rules and basic patterns that handle 80% of daily coding:

- Single Pattern Per Function: one responsibility, mechanical refactoring
- Single Level of Abstraction: no complex logic in lambdas
- Leaf: the atomic unit of processing
- Condition: branching as values
- Iteration: functional collection processing

These patterns apply the core principles you just learned. Once you master them, you'll have a complete toolkit for writing clear, testable business logic.

---

**Series Navigation**

[← Part 1: Introduction & Foundations](part-01-foundations.md) | [Index](INDEX.md) | [Part 3: Basic Patterns & Structure →](part-03-basic-patterns.md)

---

**Version:** 1.0.0 (2025-10-05) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)
