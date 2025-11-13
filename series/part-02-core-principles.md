# Part 2: Core Principles

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 2 of 6

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

Throughout Part 2, you'll see Smart Wrappers (monads) used frequently. These are the fundamental building blocks. We'll gradually introduce the term "monad" as you become comfortable with the patterns.

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

| Java Standard Approach | Problem | JBCT Solution |
|------------------------|---------|---------------|
| `return null` | Hidden optionality → `NullPointerException` at runtime | `Option<T>` - optionality explicit in type |
| `Optional<T>` | Can't represent failures (empty vs error), awkward async composition | `Option<T>` for "not found", `Result<T>` for "might fail with typed error" |
| `try-catch` with exceptions | Invisible control flow, unchecked = hidden, checked = verbose | `Result<T>` - errors are values, type-checked, composable |
| `CompletableFuture<T>` | Complex error handling (`.exceptionally`, `.handle`), nested hell with `Optional` | `Promise<T>` - consistent with `Result<T>` patterns, simpler composition |
| `CompletableFuture<Optional<T>>` | Forbidden anti-pattern - two levels of "might not have value" | Use `Promise<T>` (failure in Promise) or `Promise<Option<T>>` sparingly |

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
    // private Email {}  // Not yet supported in Java

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
    // private ReferralCode {}  // Not yet supported in Java

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

### Cross-Field Validation with Result.all()

Parse-don't-validate handles complex validation beyond single fields. What if validation depends on multiple fields together? Use `Result.all()` to validate independent fields, then add cross-field rules.

**Example: Password must not contain email local part**

```java
record ValidRegistration(Email email, Password password) {
    // Factory validates fields independently, then checks cross-field rule
    static Result<ValidRegistration> validRegistration(String emailRaw, String passwordRaw) {
        return Result.all(Email.email(emailRaw),
                          Password.password(passwordRaw))
            .flatMap((email, pwd) -> {
                // Cross-field rule: password can't contain email local part
                String localPart = email.value().split("@")[0];
                if (pwd.value().contains(localPart)) {
                    return RegistrationError.PasswordContainsEmail.INSTANCE.result();
                }
                return Result.success(new ValidRegistration(email, pwd));
            });
    }
}
```

**Benefits:**
- Both fields validated independently first (accumulates all per-field errors)
- Cross-field rule only checked if both fields individually valid
- Type system ensures you can't create `ValidRegistration` with invalid data
- Clear separation: per-field validation in value objects, cross-field rules in aggregate validators

**Example: Premium features require stronger password**

```java
record ValidRequest(Email email, Password password, Option<PremiumCode> premiumCode) {
    static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()),
                          PremiumCode.premiumCode(raw.premiumCode()))
            .flatMap((email, pwd, premium) -> {
                // Cross-field rule: premium code requires 12+ char password
                if (premium.isPresent() && pwd.value().length() < 12) {
                    return RequestError.PremiumRequiresStrongPassword.INSTANCE.result();
                }
                return Result.success(new ValidRequest(email, pwd, premium));
            });
    }
}
```

**Pattern:**
1. Validate individual fields with `Result.all()` → accumulates per-field errors
2. Use `.flatMap()` to add cross-field validation → fail-fast on cross-field rules
3. Only construct if all validation passes

This keeps validation close to the data while handling complex business rules cleanly.

### Why This Matters for AI

When an AI generates a value object, the structure is mechanical:
1. Private constructor
2. Static factory named after type
3. `Result<T>` or `Result<Option<T>>` return type
4. Validation via `Verify` combinators
5. Normalization in the pipeline

No guessing about where validation happens or how errors are reported. The AI learns the pattern once and applies it consistently.

### Pragmatica Lite Validation Utilities

Pragmatica Lite Core provides built-in utilities that eliminate boilerplate in value object validation:

**Verify.Is Predicates** - 20+ ready-to-use validation predicates:
```java
// Instead of custom lambdas:
.flatMap(s -> s.length() >= 8 ? Result.success(s) : Result.failure(...))

// Use standard predicates:
.flatMap(Verify.ensureFn(TOO_SHORT, Verify.Is::lenBetween, 8, 128))
```

**Common predicates:** `notNull`, `notBlank`, `lenBetween`, `matches`, `positive`, `nonNegative`, `between`, `greaterThan`, `lessThan`, `contains`.

**Parse Subpackage** - Exception-safe JDK API wrappers:
```java
import org.pragmatica.lang.parse.Number;
import org.pragmatica.lang.parse.DateTime;
import org.pragmatica.lang.parse.Network;

// Instead of: Result.lift(Integer::parseInt, raw)
Number.parseInt(raw)              // Result<Integer>

// Instead of: Result.lift(LocalDate::parse, raw)
DateTime.parseLocalDate(raw)      // Result<LocalDate>

// Instead of: Result.lift(UUID::fromString, raw)
Network.parseUUID(raw)            // Result<UUID>
```

**Example using utilities:**
```java
public record Age(int value) {
    public static Result<Age> age(String raw) {
        return Number.parseInt(raw)
            .flatMap(Verify.ensureFn(Causes.cause("Age 0-150"),
                                     Verify.Is::between, 0, 150))
            .map(Age::new);
    }
}
```

For comprehensive list, see main [Coding Guide](../CODING_GUIDE.md#pragmatica-lite-validation-and-parsing-utilities).

---

**Pragmatica Lite Quick Reference**

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
- `Result.failure(cause)` or `cause.result()` - Create failure
- `Result.all(r1, r2, ...)` - Parallel validation, collect all errors
- `Result.allOf(list)` - Aggregate list of Results
- `Verify.ensure(value, predicate)` - Validate value
- `Verify.ensureFn(cause, predicate, params...)` - Validate with custom error
- `Causes.forValue("message: {}")` - Create cause factory
- `Number.parseInt(raw)`, `DateTime.parseLocalDate(raw)` - Safe parsing

---

### Real-World Validation Scenarios

The basic examples above validate single fields independently. Real applications have more complex requirements: cross-field validation, dependent rules, and business constraints that span multiple values.

**Cross-field validation** - One field depends on another:

```java
// Date range where end must be after start
public record DateRange(LocalDate start, LocalDate end) {
    private static final Fn1<Cause, LocalDate> END_BEFORE_START =
        date -> Causes.cause("End date must be after start date: " + date);

    public static Result<DateRange> dateRange(LocalDate start, LocalDate end) {
        return Verify.ensure(start, Verify.Is::notNull)
            .flatMap(_ -> Verify.ensure(end, Verify.Is::notNull))
            .flatMap(_ -> Verify.ensure(end, isAfter(start), END_BEFORE_START))
            .map(_ -> new DateRange(start, end));
    }

    private static Predicate<LocalDate> isAfter(LocalDate start) {
        return end -> end.isAfter(start);
    }
}
```

**Dependent validation** - Second field's validity depends on first:

```java
// Password must not contain username (case-insensitive)
public record ValidCredentials(Username username, Password password) {
    private static final Fn1<Cause, String> PASSWORD_CONTAINS_USERNAME =
        pass -> Causes.cause("Password must not contain username");

    public static Result<ValidCredentials> credentials(String usernameRaw, String passwordRaw) {
        return validateIndependently(usernameRaw, passwordRaw)
            .flatMap(ValidCredentials::validatePasswordDependency);
    }

    private static Result<Tuple2<Username, Password>> validateIndependently(String usernameRaw, String passwordRaw) {
        return Result.all(Username.username(usernameRaw),
                          Password.password(passwordRaw));
    }

    private static Result<ValidCredentials> validatePasswordDependency(Username user, Password pass) {
        String userLower = user.value().toLowerCase();
        String passLower = pass.value().toLowerCase();

        return passLower.contains(userLower)
            ? PASSWORD_CONTAINS_USERNAME.apply(pass.value()).result()
            : Result.success(new ValidCredentials(user, pass));
    }
}
```

**Business rule validation** - Complex domain invariants:

```java
// Order total must match sum of line items
public record ValidOrder(OrderId id, Money total, List<LineItem> items) {
    private static final Fn1<Cause, Money> TOTAL_MISMATCH =
        actual -> Causes.cause("Order total does not match line items. Expected: " + actual);

    public static Result<ValidOrder> validOrder(OrderId id, Money total, List<LineItem> items) {
        Money calculated = items.stream()
            .map(LineItem::subtotal)
            .reduce(Money.ZERO, Money::add);

        return calculated.equals(total)
            ? Result.success(new ValidOrder(id, total, items))
            : TOTAL_MISMATCH.apply(calculated).result();
    }
}
```

**Collecting multiple errors with Result.all():**

```java
// Validate user registration - collect all field errors
public record ValidRegistration(Email email, Password password, Age age) {
    public static Result<ValidRegistration> validate(String emailRaw,
                                                      String passwordRaw,
                                                      String ageRaw) {
        return Result.all(Email.email(emailRaw),
                          Password.password(passwordRaw),
                          Age.age(ageRaw))
                     .map(ValidRegistration::new);
        // If any field fails, Result.all() accumulates ALL errors
        // User sees "Invalid email AND password too short AND age out of range"
        // Not just the first error
    }
}
```

**Key insight:** Use `Result.all()` for independent field validation (collects all errors), then use `flatMap` chains for dependent validation (fail-fast when one field depends on another being valid first).

### Adopting Incrementally in Existing Codebases

**Don't refactor everything at once.** Parse-don't-validate works best when adopted incrementally at boundaries.

**Strategy:**

**1. New features first** - Use parse-don't-validate from day one for all new code:
```java
// New feature: payment processing
public record CardNumber(String value) {
    // private CardNumber {}  // Not yet supported in Java

    public static Result<CardNumber> cardNumber(String raw) {
        return Verify.ensure(raw, Verify.Is::notBlank)
            .flatMap(Verify.ensureFn(INVALID, Verify.Is::matches, CARD_PATTERN))
            .map(CardNumber::new);
    }
}
```

**2. Keep existing validation at controller boundaries** - Don't remove `@Valid` annotations immediately. Add a parsing layer:
```java
// BEFORE: Existing Spring controller with @Valid
@RestController
public class UserController {
    private final RegisterUser registerUser;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest dto) {
        // @Valid handles Spring-level DTO validation
        // Add new parsing layer that converts DTO → use case request
        var request = new RegisterUser.Request(dto.email(), dto.password());
        return registerUser.execute(request)
            .fold(this::errorResponse, this::successResponse);
    }
}

// AFTER: Fully migrated - use case request directly
@RestController
public class UserController {
    private final RegisterUser registerUser;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterUser.Request raw) {
        return registerUser.execute(raw)     // Validation happens inside use case
            .fold(this::errorResponse, this::successResponse);
    }
}

// Inside RegisterUser use case - validation layer
public record ValidRequest(Email email, Password password) {
    public static Result<ValidRequest> validRequest(RegisterUser.Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()))
                     .map(ValidRequest::new);
    }
}
```

**3. Gradually move validation from services to value objects:**
- Find a service method with manual validation
- Extract that validation into a value object factory method
- Update callers to use the value object
- Repeat for next field

**Example migration:**
```java
// Before: Validation in service
@Service
public class UserService {
    public User registerUser(String emailRaw, String passwordRaw) {
        if (emailRaw == null || !emailRaw.matches(EMAIL_PATTERN)) {
            throw new ValidationException("Invalid email");
        }
        // ... more validation, then business logic
    }
}

// After: Validation in value objects
public class UseCase implements RegisterUser {
    public Result<UserId> execute(ValidRequest request) {
        // request.email() and request.password() are already validated
        // Business logic only sees valid data
    }
}
```

**Key insight:** Start at the edges (controllers, API boundaries) and work inward. Your existing service layer can stay mostly unchanged while you build the new domain layer alongside it. Over time, the service layer shrinks as logic moves to use cases and value objects.

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
