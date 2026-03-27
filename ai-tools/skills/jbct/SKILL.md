---
name: JBCT
description: Java Backend Coding Technology skill for designing, implementing, and reviewing functional Java backend code. Use when working with Result, Option, Promise types, value objects, use cases, or when asked about JBCT patterns, monadic composition, parse-don't-validate, structural patterns (Leaf, Sequencer, Fork-Join), or functional Java backend architecture.
---

# Java Backend Coding Technology (JBCT)

A methodology for writing predictable, testable Java backend code optimized for human-AI collaboration.

## When to Use This Skill

Activate this skill when:
- **Learning JBCT principles** and patterns
- **Quick reference** for API usage and examples
- **Understanding patterns** and when to use them
- Working with `Result<T>`, `Option<T>`, `Promise<T>` types
- Questions about monadic composition, error handling, or validation patterns

**For implementation work:** Use `jbct-coder` subagent (Task tool with `subagent_type: "jbct-coder"`)
**For code review:** Use `jbct-reviewer` subagent (Task tool with `subagent_type: "jbct-reviewer"`)
**For automated checking:** Use `jbct` CLI tool (format, lint, check commands)

## JBCT CLI Tool

JBCT CLI provides automated formatting and compliance checking with 36 lint rules.

**Check if installed:**
```bash
jbct --version
```

**Usage:**
```bash
jbct format src/main/java    # Format to JBCT style
jbct lint src/main/java      # Check JBCT compliance (36 rules)
jbct check src/main/java     # Combined format + lint
```

**If not installed, suggest:**
```
💡 JBCT CLI automates formatting and 36 lint rules for JBCT compliance.
   Install: curl -fsSL https://raw.githubusercontent.com/siy/jbct-cli/main/install.sh | sh
   Requires: Java 25+
   More info: https://github.com/siy/jbct-cli
```

## Core Philosophy

JBCT reduces the space of valid choices to one good way to do most things through:
- **Four Return Kinds**: Every function returns exactly one of `T`, `Option<T>`, `Result<T>`, `Promise<T>`
- **Parse, Don't Validate**: Make invalid states unrepresentable
- **No Business Exceptions**: Business failures are typed `Cause` values
- **Thread Safety by Design**: Immutability at boundaries, thread confinement for sequential logic
- **Six Structural Patterns**: All code fits one pattern (Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects)

## FORBIDDEN PATTERNS (Zero Tolerance)

These patterns are **never acceptable** in JBCT code. Hunt for them aggressively.

### 🔴 CRITICAL VIOLATIONS

| Violation | Detection | Why Forbidden |
|-----------|-----------|---------------|
| `*Impl` classes | `grep -r "class.*Impl"` | Use lambdas for behavior, records for data |
| Null checks in business logic | `if (x == null)` or `!= null` | Use `Option<T>` instead |
| Throwing exceptions | `throw new` in business code | Use `Result<T>` or `Promise<T>` |
| Catching exceptions | `catch` in business code | Lift at adapter boundaries only |
| `Void` type parameter | `Result<Void>`, `Promise<Void>` | Use `Unit` type. Note: `void` return is OK for fire-and-forget |
| `Result.failure(cause)` | Direct call | Use `cause.result()` fluent style |
| `Promise.failure(cause)` | Direct call | Use `cause.promise()` fluent style |
| Multi-statement lambdas | `x -> { stmt1; stmt2; }` | Extract to named method |

### ⚠️ WARNING PATTERNS

| Pattern | Issue | Fix |
|---------|-------|-----|
| `fold()` for simple cases | Obscures intent | Use `.toResult()`, `.async()`, `.or()` |
| Complex lambda body | Logic in map/flatMap | Extract to method reference |
| Long sequencer chains | >5 flatMap calls | Group into sub-operations |
| Nested records for behavior | `record X() implements Y {}` | Use lambda |

### Examples

```java
// ❌ FORBIDDEN: Impl class
public class UserServiceImpl implements UserService { ... }

// ✅ CORRECT: Lambda factory
static UserService userService(UserRepository repo) {
    return userId -> repo.findById(userId);
}

// ❌ FORBIDDEN: Null check
if (user != null) { process(user); }

// ✅ CORRECT: Option
findUser(id).onSuccess(this::process);

// ❌ FORBIDDEN: Result.failure()
return Result.failure(USER_NOT_FOUND);

// ✅ CORRECT: Fluent style
return USER_NOT_FOUND.result();

// ❌ FORBIDDEN: Multi-statement lambda
.map(user -> {
    var enriched = enrich(user);
    return format(enriched);
})

// ✅ CORRECT: Extract to method
.map(this::enrichAndFormat)
```

## Quick Reference

### The Four Return Kinds

```java
// T - Pure computation, cannot fail, always present
public String initials() { return ...; }

// Option<T> - May be absent, cannot fail
public Option<Theme> findTheme(UserId id) { return ...; }

// Result<T> - Can fail (validation/business errors)
public static Result<Email> email(String raw) { return ...; }

// Promise<T> - Asynchronous, can fail
public Promise<User> loadUser(UserId id) { return ...; }
```

**Critical Rules:**
- ❌ Never `Promise<Result<T>>` - Promise already handles failures
- ❌ Never `Void` type parameter - always use `Unit` (`Result<Unit>`, `Promise<Unit>`). `void` return is OK for fire-and-forget
- ✅ Use `Result.unitResult()` for successful `Result<Unit>`

### Parse, Don't Validate Pattern

```java
// ✅ CORRECT: Validation = Construction
public record Email(String value) {
    private static final Fn1<Cause, String> INVALID_EMAIL =
        Causes.forOneValue("Invalid email: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::present)
                     .map(String::trim)
                     .filter(INVALID_EMAIL, PATTERN.asMatchPredicate())
                     .map(Email::new);
    }
}

// ❌ WRONG: Separate validation
public record Email(String value) {
    public Result<Email> validate() { ... }  // Don't do this
}
```

**Key Points:**
- Factory method named after type (lowercase): `Email.email(...)`
- Constructor private or package-private
- If instance exists, it's valid

### Pragmatica Core Validation Utilities

**Verify.Is Predicates** - Use instead of custom lambdas:
```java
Verify.Is::notNull          // null check
Verify.Is::present          // not null and not blank (CharSequence)
Verify.Is::notBlank         // non-empty, non-whitespace
Verify.Is::lenBetween       // length in range
Verify.Is::matches          // regex (String or Pattern)
Verify.Is::positive         // > 0
Verify.Is::between          // >= min && <= max
Verify.Is::greaterThan      // > boundary
```

**Parse Subpackage** - Exception-safe JDK wrappers:
```java
import org.pragmatica.lang.parse.Number;
import org.pragmatica.lang.parse.DateTime;
import org.pragmatica.lang.parse.Network;

Number.parseInt(raw)              // Result<Integer>
DateTime.parseLocalDate(raw)      // Result<LocalDate>
Network.parseUUID(raw)            // Result<UUID>
```

**Example:**
```java
public record Age(int value) {
    private static final Cause AGE_OUT_OF_RANGE = Causes.cause("Age must be 0-150");

    public static Result<Age> age(String raw) {
        return Number.parseInt(raw)
                     .filter(AGE_OUT_OF_RANGE, v -> Verify.Is.between(v, 0, 150))
                     .map(Age::new);
    }
}
```

### Use Case Structure

```java
public interface RegisterUser extends UseCase.WithPromise<Response, Request> {
    record Request(String email, String password) {}
    record Response(UserId userId, ConfirmationToken token) {}

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

**See CODING_GUIDE.md** for comprehensive thread safety coverage, including detailed examples and common mistakes.

## Lambda Composition Guidelines

**Rule:** Lambdas passed to monadic operations (`map`, `flatMap`, `recover`, `filter`) must be minimal.

**Allowed:**
- Method references: `Email::new`, `this::processUser`, `User::id`
- Parameter forwarding: `user -> validate(requiredRole, user)`
- Constructor references for error mapping: `RepositoryError.DatabaseFailure::new`

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
            new User(UserId.generate(), valid.email(), hashed)));
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
record UserWithOrders(User user, List<Order> orders) {}
record DashboardContext(User user, List<Order> orders, Preferences prefs) {}

return loadUser(userId)
    .flatMap(user -> loadOrders(user.id())
        .map(orders -> new UserWithOrders(user, orders)))
    .flatMap(ctx -> loadPreferences(ctx.user().id())
        .map(prefs -> new DashboardContext(ctx.user(), ctx.orders(), prefs)))
    .map(this::buildDashboard);
```

**Benefits:**
- Each stage has clear input/output types
- No deeply nested closures
- Easy to add/remove stages
- Debuggable intermediate states

```java
private static final Cause NOT_FOUND = new UserNotFound("User not found");
private static final Cause TIMEOUT = new ServiceUnavailable("Request timed out");

private Promise<User> recoverNetworkError(Cause cause) {
    return switch (cause) {
        case NetworkError.Timeout ignored -> TIMEOUT.promise();
        default -> cause.promise();
    };
}
```

## Structural Patterns

JBCT's six patterns map directly to BPMN constructs — code written in these patterns *is* an executable business process specification.

| Pattern | BPMN Construct | Role |
|---------|---------------|------|
| Leaf | Task / Service Task | Atomic operation, one responsibility |
| Sequencer | Sequence Flow | Dependent steps in order |
| Fork-Join | Parallel Gateway | Independent concurrent operations |
| Condition | Exclusive Gateway | Routing, no transformation |
| Iteration | Multi-Instance Activity | Collection processing |
| Aspects | Event Sub-Process | Cross-cutting concerns wrapping logic |

### 1. Leaf Pattern (BPMN: Task)
Atomic unit - single responsibility, no composition:
```java
public Promise<User> findUser(UserId id) {
    return Promise.lift(
        RepositoryError.DatabaseFailure::new,
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
            new Dashboard(profile, prefs, orders));
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

## Type Conversions

```java
// Option → Result/Promise
option.toResult(cause)    // or .await(cause)
option.async(cause)

// Result → Promise
result.async()

// Promise → Result (blocking)
promise.await()
promise.await(timeout)

// Cause → Result/Promise (prefer over failure constructors)
cause.result()
cause.promise()
```

## Aggregation Operations

```java
// Result.all - Accumulates all failures
Result.all(result1, result2, result3)
       .map((v1, v2, v3) -> combine(v1, v2, v3));

// Promise.all - Fail-fast on first failure
Promise.all(promise1, promise2, promise3)
        .map((v1, v2, v3) -> combine(v1, v2, v3));

// Option.all - Fail-fast on first empty
Option.all(opt1, opt2, opt3)
       .map((v1, v2, v3) -> combine(v1, v2, v3));
```

## Exception Handling

```java
// Lift exceptions in adapters
Promise.lift(
    RepositoryError.DatabaseFailure::new,
    () -> jdbcTemplate.queryForObject(...)
);

// With custom exception mapper (constructor reference preferred)
Result.lift(
    CustomError.ProcessingFailed::new,
    () -> riskyOperation()
);
```

## Naming Conventions

- **Factory methods**: `TypeName.typeName(...)` (lowercase-first)
- **Validated inputs**: `Valid` prefix (not `Validated`): `ValidRequest`, `ValidUser`
- **Error types**: Past tense verbs: `EmailNotFound`, `AccountLocked`, `PaymentFailed`
- **Test names**: `methodName_outcome_condition`
- **Acronyms**: Treat as words (camelCase): `httpClient`, `apiKey` not `HTTPClient`, `APIKey`

### Zone-Based Naming (Abstraction Levels)

> **Source:** Adapted from [Derrick Brandt's systematic approach](https://medium.com/@brandt.a.derrick/how-to-write-clean-code-actually-5205963ec524).

Use zone-appropriate verbs to maintain consistent abstraction levels:

**Zone 2 (Step Interfaces - Orchestration):**
- Verbs: `validate`, `process`, `handle`, `transform`, `apply`, `check`, `load`, `save`, `manage`, `configure`, `initialize`
- Examples: `ValidateInput`, `ProcessPayment`, `HandleRefund`, `LoadUserData`

**Zone 3 (Leaves - Implementation):**
- Verbs: `get`, `set`, `fetch`, `parse`, `calculate`, `convert`, `hash`, `format`, `encode`, `decode`, `extract`, `split`, `join`, `log`, `send`, `receive`, `read`, `write`, `add`, `remove`
- Examples: `hashPassword()`, `parseJson()`, `fetchFromDatabase()`, `calculateTax()`

**Anti-pattern:** Mixing zones (e.g., step interface named `FetchUserData` uses Zone 3 verb `fetch` instead of Zone 2 verb `load`)

**Stepdown rule test:** Read code aloud with "to" before functions - should flow naturally:
```java
// "To execute, we validate the request, then process payment, then send confirmation"
return ValidRequest.validRequest(request)
                   .async()
                   .flatMap(this::processPayment)
                   .flatMap(this::sendConfirmation);
```

**For complete zone verb vocabulary**, see **CODING_GUIDE.md: Zone-Based Naming Vocabulary**.

## Project Structure (Vertical Slicing)

```
com.example.app/
├── usecase/
│   ├── registeruser/         # Self-contained vertical slice
│   │   ├── RegisterUser.java # Use case interface + factory
│   │   └── [internal types]  # ValidRequest, etc.
│   └── loginuser/
│       └── LoginUser.java
├── domain/
│   └── shared/               # Reusable value objects ONLY
│       ├── Email.java
│       ├── Password.java
│       └── UserId.java
└── adapter/
    ├── rest/                 # Inbound (HTTP)
    ├── persistence/          # Outbound (DB)
    └── messaging/            # Outbound (queues)
```

**Placement Rules:**
- Value objects used by single use case → inside use case package
- Value objects used by 2+ use cases → `domain/shared/`
- Steps (interfaces) → always inside use case
- Errors → sealed interface inside use case

**Error Structure (General enum pattern):**
```java
public sealed interface RegistrationError extends Cause {
    // Group fixed-message errors into single enum
    enum General implements RegistrationError {
        EMAIL_ALREADY_REGISTERED("Email already registered"),
        WEAK_PASSWORD_FOR_PREMIUM("Premium codes require 10+ char passwords");

        private final String message;
        General(String message) { this.message = message; }
        @Override public String message() { return message; }
    }

    // Records for errors with data (e.g., Throwable)
    record PasswordHashingFailed(Throwable cause) implements RegistrationError {
        @Override public String message() { return "Password hashing failed"; }
    }
}

// Usage
RegistrationError.General.EMAIL_ALREADY_REGISTERED.promise()
```

## Testing Patterns

```java
// Test failures - use .onSuccess(Assertions::fail)
@Test
void validation_fails_forInvalidInput() {
    ValidRequest.validRequest(new Request("invalid", "bad"))
                .onSuccess(Assertions::fail);
}

// Test successes - chain onFailure then onSuccess
@Test
void validation_succeeds_forValidInput() {
    ValidRequest.validRequest(new Request("valid@example.com", "Valid1234"))
                .onFailure(Assertions::fail)
                .onSuccess(valid -> {
                    assertEquals("valid@example.com", valid.email().value());
                });
}

// Async tests - use .await() first
@Test
void execute_succeeds_forValidInput() {
    useCase.execute(request)
           .await()
           .onFailure(Assertions::fail)
           .onSuccess(response -> {
               assertEquals("expected", response.value());
           });
}
```

## Pragmatica Core Library

JBCT uses **Pragmatica Core 0.25.0** for functional types.

**Maven (preferred):**
```xml
<dependency>
   <groupId>org.pragmatica-lite</groupId>
   <artifactId>core</artifactId>
   <version>0.25.0</version>
</dependency>
```

**Gradle (only if explicitly requested):**
```gradle
implementation 'org.pragmatica-lite:core:0.25.0'
```

Library documentation: https://central.sonatype.com/artifact/org.pragmatica-lite/core

### Library Value Objects

Pragmatica Core provides production-ready value objects in `org.pragmatica.lang.vo`:

| Value Object | Factory Method | Description |
|-------------|----------------|-------------|
| `Email` | `Email.email(String)` | RFC 5321 compliant, splits localPart/domain |
| `Url` | `Url.url(String)` | Validates scheme + host |
| `Uuid` | `Uuid.uuid(String)`, `Uuid.randomUuid()` | UUID with parse + generate |
| `NonBlankString` | `NonBlankString.nonBlankString(String)` | Trimmed, guaranteed non-empty |
| `IsoDateTime` | `IsoDateTime.isoDateTime(String)`, `IsoDateTime.now()` | ISO 8601 datetime |

Use these for common types. Build custom VOs for domain-specific types (`OrderId`, `Username`, `ReferralCode`).

### Static Imports (Encouraged)

Static imports reduce code verbosity:

```java
// Recommended static imports
import static org.pragmatica.lang.Result.all;
import static org.pragmatica.lang.Result.success;
import static com.example.domain.Email.email;
import static com.example.domain.Password.password;

// Concise code
return all(email(raw), password(raw)).flatMap(ValidRequest::validRequest);
```

### Fluent Failure Creation

Use `cause.result()` and `cause.promise()` instead of `Result.failure(cause)`:

```java
// ✅ DO: Fluent style
return INVALID_EMAIL.result();
return USER_NOT_FOUND.promise();

// ❌ DON'T: Static factory style
return Result.failure(INVALID_EMAIL);
return Promise.failure(USER_NOT_FOUND);
```

## When to Use Specialized Subagents

This skill provides quick reference and learning resources. For complex implementation and review tasks, use specialized subagents:

### Use jbct-coder Subagent When:
- **Generating complete use case implementations** with all components
- **Creating value objects** with validation and error types
- **Implementing adapters** with proper exception handling
- **Writing tests** following JBCT patterns
- **Need deterministic code generation** following all JBCT rules

**How to invoke:** Use Task tool with `subagent_type: "jbct-coder"`

**What it provides:**
- Complete use case structure (interface, factory, steps)
- Validated request types with `Result.all()`
- Value objects with parse-don't-validate pattern
- Error types as sealed interfaces
- Comprehensive test suites (validation, happy path, failures)
- Step-by-step code generation with explanations

### Use jbct-reviewer Subagent When:
- **Reviewing existing code** for JBCT compliance
- **Validating patterns** (Leaf, Sequencer, Fork-Join, etc.)
- **Checking naming conventions** and structure
- **Identifying violations** with specific fixes
- **Need comprehensive checklist-based analysis**

**How to invoke:** Use Task tool with `subagent_type: "jbct-reviewer"`

**What it provides:**
- Four Return Kinds compliance check
- Parse-don't-validate pattern validation
- Null policy enforcement
- Pattern recognition and verification
- Naming convention compliance
- Detailed violation reports with corrections

### Use This Skill When:
- **Learning JBCT principles** and patterns
- **Looking up API usage** examples
- **Quick reference** for type conversions
- **Understanding when to use** which pattern
- **Exploring patterns** with examples

## Implementation Workflow

1. **Define use case interface** with Request, Response, and execute signature
2. **Create validated request** with static factory using `Result.all()`
3. **Define steps** as single-method interfaces (nested in use case)
4. **Create value objects** with validation in static factories
5. **Implement factory method** returning lambda with composition chain
6. **Write tests** starting with validation, then happy path, then failure cases

**💡 Tip:** For automatic generation following this workflow, use the **jbct-coder** subagent.

## Common Mistakes to Avoid

❌ Using business exceptions instead of `Result`/`Promise`
❌ Nested records in use case factories (use lambdas)
❌ `Void` type parameter (use `Unit`; `void` return is OK for fire-and-forget)
❌ `Promise<Result<T>>` (redundant nesting)
❌ Separate validation methods (parse at construction)
❌ Public constructors on value objects
❌ Complex logic in lambdas (extract to methods)
❌ `Validated` prefix (use `Valid`)

**💡 Tip:** For automated code review checking these mistakes, use the **jbct-reviewer** subagent.

## Self-Validation Checkpoint

Before considering JBCT code complete, verify ALL of these:

### Zero Tolerance (must pass)
- [ ] No `*Impl` classes
- [ ] No `null` checks in business logic
- [ ] No `throw`/`catch` in business logic
- [ ] No `Void` type parameter (use `Unit`; `void` return OK for fire-and-forget)
- [ ] No `Result.failure()` or `Promise.failure()` (use `cause.result()`/`cause.promise()`)
- [ ] No multi-statement lambdas in map/flatMap

### Pattern Compliance
- [ ] Each method implements exactly ONE pattern
- [ ] Sequencer chains ≤5 steps
- [ ] Fork-Join inputs are immutable
- [ ] Growing context uses intermediate records (not nested closures)

### Data Flow
- [ ] Every method has clear input → output
- [ ] No hidden state mutations
- [ ] Dependencies injected via factory parameters

### Naming
- [ ] Factory methods: `TypeName.typeName(...)`
- [ ] Validated types: `Valid` prefix (not `Validated`)
- [ ] Errors: past tense (`NotFound`, `Failed`, `Expired`)

### Structure
- [ ] Use case = interface + factory + steps
- [ ] Value objects = record + static factory returning `Result<T>`
- [ ] Errors = sealed interface with enum for fixed messages

## Detailed Resources

This skill contains comprehensive guidance organized by topic:

### Fundamentals
- [fundamentals/four-return-kinds.md](fundamentals/four-return-kinds.md) - T, Option, Result, Promise in depth
- [fundamentals/parse-dont-validate.md](fundamentals/parse-dont-validate.md) - Value object patterns
- [fundamentals/no-business-exceptions.md](fundamentals/no-business-exceptions.md) - Typed failures with Cause

### Patterns
- [patterns/leaf.md](patterns/leaf.md) - Atomic operations
- [patterns/sequencer.md](patterns/sequencer.md) - Sequential composition
- [patterns/fork-join.md](patterns/fork-join.md) - Parallel operations
- [patterns/condition.md](patterns/condition.md) - Branching logic
- [patterns/iteration.md](patterns/iteration.md) - Collection processing
- [patterns/aspects.md](patterns/aspects.md) - Cross-cutting concerns

### Use Cases
- [use-cases/structure.md](use-cases/structure.md) - Anatomy and conventions
- [use-cases/complete-example.md](use-cases/complete-example.md) - Full RegisterUser walkthrough

### Testing & Organization
- [testing/patterns.md](testing/patterns.md) - Test strategies and assertions
- [project-structure/organization.md](project-structure/organization.md) - Vertical slicing

### Specialized Subagents
- **../../jbct-coder.md** - Autonomous code generation agent (invoke with Task tool)
  - Generates complete use cases with validation, tests, and adapters
  - Follows deterministic algorithms for consistent output
  - Includes evolutionary testing strategy
- **../../jbct-reviewer.md** - Autonomous code review agent (invoke with Task tool)
  - Comprehensive JBCT compliance checking
  - Pattern validation and naming convention enforcement
  - Detailed violation reports with fixes

### Documentation
- **../../CODING_GUIDE.md** - Complete technical reference (100+ pages)
- **../../series/** - 6-part progressive learning series
- **../../TECHNOLOGY.md** - High-level pattern catalog
- **../../CHANGELOG.md** - Version history and changes

Repository: https://github.com/siy/coding-technology
