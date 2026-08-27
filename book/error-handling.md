# Error Handling & Composition

## What You'll Learn

- Why business logic never throws exceptions
- How to define typed error hierarchies with Cause
- Error accumulation vs fail-fast semantics
- Monadic composition rules

**Prerequisites:** [Parse, Don't Validate](parse-dont-validate.md)

---

## No Business Exceptions

Business failures are not exceptional—they're expected outcomes of business rules. An invalid email isn't an exception; it's a normal case of bad input. An account being locked isn't an exception; it's a business state.

**The rule:** Business logic never throws exceptions for business failures. All failures flow through `Result` or `Promise` as typed `Cause` objects.

---

## Why Result: Error Handling Philosophy

Error handling logic belongs where business context exists to make decisions. Sometimes that's close to where the error occurred; sometimes the error propagates unchanged because only the caller has enough context to decide. This fundamental truth doesn't depend on the error mechanism—it's about where knowledge lives.

Different languages use different mechanisms for error propagation, each with distinct trade-offs in **transparency** (is failure visible?), **ergonomics** (is it pleasant to use?), and **reliability** (does the compiler help?):

| Mechanism | Transparency | Ergonomics | Reliability |
|-----------|--------------|------------|-------------|
| **Checked exceptions** | ✅ Explicit in signature | ❌ Verbose, tight coupling | ✅ Compiler-enforced |
| **Unchecked exceptions** | ❌ Hidden in implementation | ⚠ Acceptable, but mental overhead | ❌ Silent failures |
| **Errors as values** (Go) | ✅ Return value visible | ❌ Manual `if err != nil` everywhere | ❌ Easy to ignore |
| **Functional (Result/Either)** | ✅ Type signature | ✅ Monadic composition | ✅ Compiler-enforced |

**Checked exceptions** couple caller and callee tightly—changes in lower-level methods cascade upward, forcing signature changes throughout the call stack.

**Unchecked exceptions** eliminate coupling but hide failure modes. Every method call requires reading implementation to discover what might throw. The mental overhead is constant; the bugs are intermittent.

**Errors as values** (Go-style) make failure visible but require manual propagation at every step. Complex scenarios with multiple error sources or interleaved resource management become error-prone boilerplate.

**Functional style** (`Result<T>`) combines the best properties: failure is explicit in the type signature (transparent), monadic composition eliminates manual propagation (ergonomic), and the compiler ensures every failure is either handled or propagated (reliable). The "do this if value is available" semantics of `map`/`flatMap` means error handling code only appears where decisions are made—not at every intermediate step.

Being absolutely clear about failure possibility isn't pedantry—it's the foundation of maintainable code.

---

## The Traditional (Wrong) Approach

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
    // ... more checks throwing exceptions
}
```

**Problems:**
- Checked exceptions pollute signatures
- Unchecked exceptions are invisible
- Exception hierarchies create coupling
- Stack traces are expensive for business failures
- Testing requires catching exceptions

---

## The Result-Based Approach

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

private Result<User> checkAccountStatus(User user) {
    return user.isLocked()
            ? LoginError.AccountLocked.FACTORY.apply(user.id()).result()
            : Result.success(user);
}
```

---

## Defining Typed Errors

Every failure is a `Cause`, and `Cause` has exactly one abstract member: `message()`. The construction idiom satisfies it structurally, so no error type ever hand-writes prose in a method body.

A use case's failures form a sealed interface with two kinds of members. A **data-carrying failure** is a record: its components are the error's data, in declaration order, with a trailing `String message` component whose generated accessor *is* the `message()` implementation. Its `FACTORY`, built from a message template and the canonical constructor reference, is the construction path. **Fixed-text failures** share one enum in a prescribed shape - a single `message` field, a constructor, a field-returning accessor - with each failure declared as one constant carrying its text.

```java
public sealed interface LoginError extends Cause {

    record AccountLocked(UserId userId, String message) implements LoginError {
        static final Fn1<AccountLocked, UserId> FACTORY =
            Causes.forOneValue("Account is locked: %s", AccountLocked::new);
    }

    enum General implements LoginError {
        INVALID_CREDENTIALS("Invalid email or password");

        private final String message;

        General(String message) { this.message = message; }

        @Override
        public String message() { return message; }
    }
}
```

Construction sites:

```java
LoginError.AccountLocked.FACTORY.apply(user.id()).result();   // data-carrying
LoginError.General.INVALID_CREDENTIALS.result();              // fixed text
```

Three rules govern the shape:

- **Every value the template formats is a component.** The factory's parameters are exactly the non-message components, so the data an error mentions stays typed - renderable at the boundary, countable in telemetry, never trapped in prose. The `message` component comes last, which is what lets the constructor reference serve as the factory argument. Zero data is a property, not an omission: `INVALID_CREDENTIALS` deliberately says nothing about which credential failed.
- **One discriminable case per failure** - its own record type or its own enum constant. Qualified enum constant case labels (`case General.INVALID_CREDENTIALS ->`) discriminate constants in a switch over the sealed interface, and listing every constant preserves exhaustiveness: adding a constant breaks every switch, exactly as adding a record does.
- **The `FACTORY` is the only constructor call site.** `new AccountLocked(id, "hand-typed prose")` compiles and silently decouples the stored message from the declared template; routed through the factory, template and data cannot disagree.

---

## Wrapped and Terminal Causes

Two mixins nested in `Cause` remove the remaining overrides. A failure wrapping an underlying cause implements `Cause.Wrapped` with an `origin` component; the mixin derives `source()` from it. The component cannot be named `source` - the record accessor's return type would clash with `Cause.source()`, and `origin` is the name that avoids the trap. A failure no retry can change implements `Cause.Terminal`, which retry facilities consult to stop immediately.

```java
record PaymentFailed(Cause origin, String message) implements TransferError, Cause.Wrapped {
    static final Fn1<PaymentFailed, Cause> FACTORY =
        Causes.forOneValue("Payment step failed: %s", PaymentFailed::new);
}

// translation at a composition boundary:
paymentStep.execute(order).mapError(PaymentFailed.FACTORY);
```

Composition sites accept the fully-typed factory directly. Where only some constants of an enum are terminal, a constant body overrides `isTerminal()` per constant.

---

## Rendering at the Boundary

The `message` component is for logs and operators. User-facing text is produced at the boundary, by an exhaustive switch over the sealed interface, composed from the data components:

```java
String userText(LoginError error) {
    return switch (error) {
        case AccountLocked locked -> localized("login.locked", locked.userId());
        case General.INVALID_CREDENTIALS -> localized("login.invalid");
    };
}
```

No default arm: the compiler proves the failure catalog covered, and a new failure breaks this switch instead of falling through silently. This is where the exhaustiveness the sealed hierarchy promises is collected. Redaction rides the same mechanism as messages: `String.format` renders value objects through their own `toString()`, so a value object that masks itself stays masked in every message with no per-error effort.

---

## When a Bare Cause Is Enough

`Causes.cause("Age must be 0-150")` remains the sanctioned form where no caller can act on the distinction - value-object validation whose failures all land in the same composite. The line is behavioral: when a caller would branch on the failure, render it separately, or count it, it is worth a type. The single-argument template overloads (`Causes.forOneValue(String)` and friends) belong to this same ad-hoc tier; in domain code a parameterized failure is worth naming, because the template form bakes its data into prose and discards it.

---

## When Fixed Text Acquires Data

A failure often starts as fixed text and later needs data. The migration is one motion - remove the constant, add the record - and the compiler walks through the rest: every switch that listed the constant stops being exhaustive, every constant assertion becomes a missing symbol, and each site is rewritten from `case General.SESSION_EXPIRED ->` to `case SessionExpired e ->`. No site can be missed. The constant's name becomes the record's name in type case, so history and search survive the move; and because user text is produced at the boundary, the migration changes no external contract.

---

## Error Accumulation with Result.all()

`Result.all()` collects validation failures into a `CompositeCause`:

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

Users see all errors at once, not fix-and-retry repeatedly.

---

## Programming Errors vs Business Errors

### Business Errors → Result/Promise with Typed Cause

**Business errors** are expected outcomes of business rules:

| Error Type | Example | Representation |
|------------|---------|----------------|
| Validation failure | Invalid email format | `Result<T>` with `ValidationError` |
| Business rule violation | Insufficient funds | `Result<T>` with `InsufficientFunds` |
| Not found | User doesn't exist | `Result<T>` with `NotFound` or `Option.none()` |
| External service failure | Payment declined | `Promise<T>` with `PaymentError` |

**Rule:** If a user action can trigger it, it's a business error—represent with `Result` or `Promise`.

### Programming Errors → Exceptions (Fail Fast)

**Programming errors** indicate bugs that should never reach production:

| Error Type | Example | Handling |
|------------|---------|----------|
| Null invariant violation | Null passed to non-null parameter | `IllegalArgumentException` |
| Impossible state | Switch case that should never happen | `IllegalStateException` |
| Configuration error | Missing required config at startup | Fail fast, don't start |

**Rule:** Exceptions for programming errors only when there's no meaningful recovery and the application should terminate or restart.

### Adapter Boundaries → Map to Domain Types

**Adapter code** catches external exceptions and maps to domain types:

```java
// Adapter: map exception → wrapped Cause, null → Option
record DatabaseFailure(Cause origin, String message) implements RepositoryError, Cause.Wrapped {
    static final Fn1<DatabaseFailure, Cause> FACTORY =
        Causes.forOneValue("Database failure: %s", DatabaseFailure::new);
}

public Promise<Option<User>> findById(UserId id) {
    return Promise.lift(
        t -> DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
        () -> Option.option(jdbcTemplate.queryForObject(...))  // null → Option
    );
}
```

**Rule:** No external exception or null crosses adapter boundaries—map immediately.

---

## Adapter Exceptions: The Boundary

Foreign code throws exceptions. **Adapters** catch and convert them:

```java
class JpaUserRepository implements UserRepository {
    public Promise<Option<User>> findByEmail(Email email) {
        return Promise.lift(
            t -> DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
            () -> {
                // JDBC/JPA code that might throw
                return Option.option(result);
            });
    }
}
```

Business logic never sees foreign exceptions - only domain errors.

---

## Monadic Composition Rules

### map vs flatMap

```java
// map: Transform success value (T → U)
result.map(String::toUpperCase)

// flatMap: Chain operations (T → Result<U>)
result.flatMap(this::validate)
```

Use `flatMap` when the transformation itself can fail.

### Lifting Between Types

```java
// Option → Result
option.toResult(cause)

// Result → Promise
result.async()

// Full chain
return ValidRequest.validRequest(request)
           .async()              // Result → Promise
           .flatMap(step1)       // Promise chains
           .flatMap(step2);
```

### Forbidden: `Promise<Result<T>>`

`Promise<T>` already carries failures. Never nest:

```java
// WRONG
Promise<Result<User>> loadUser(UserId id)

// RIGHT
Promise<User> loadUser(UserId id)
```

### Allowed: `Result<Option<T>>`

For optional values that must validate when present:

```java
Result<Option<ReferralCode>> refCode = ReferralCode.referralCode(input);
// Success(None) = not provided
// Success(Some(code)) = valid code
// Failure(cause) = invalid code
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

## Testing Errors

Assert on the failure's identity, never on `message()` text - a test matching message strings couples itself to prose and survives mutants that change which failure occurred. Fixed-text failures assert constant equality; data-carrying failures assert type and components.

```java
// Test failure identity
@Test
void login_failsWithInvalidCredentials_forWrongPassword() {
    loginUser("user@example.com", "wrong")
        .onSuccess(Assertions::fail)
        .onFailure(cause -> assertEquals(LoginError.General.INVALID_CREDENTIALS, cause));
}

// Test failure
@Test
void email_rejectsInvalidFormat() {
    Email.email("not-an-email")
         .onSuccess(Assertions::fail);  // Fail if unexpectedly succeeds
}

// Test success
@Test
void email_acceptsValidFormat() {
    Email.email("user@example.com")
        .onFailure(Assertions::fail)
        .onSuccess(email -> assertEquals("user@example.com", email.value()));
}

// Test async
@Test
void execute_succeeds() {
    useCase.execute(request)
           .await()
           .onFailure(Assertions::fail)
           .onSuccess(response -> assertEquals("expected", response.value()));
}
```

---

## Key Takeaways

1. **No business exceptions** - Errors are values, not thrown
2. **Records with data, one enum for fixed text** - `message` is a trailing component, never a hand-written body
3. **FACTORY constructs** - Template and data cannot disagree; direct `new` bypasses the guarantee
4. **Result.all()** - Accumulates all failures, not just first
5. **Adapters convert** - Exceptions → Cause at boundaries
6. **Render at the boundary** - The exhaustive switch composes user text from components
7. **Never nest** - `Promise<Result<T>>` is forbidden
8. **Test identity, not prose** - Constant equality and components, never `message()` text

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 2.3: Error accumulation vs short-circuit
- Exercise 2.5: Recovery patterns

---

## What's Next

[Null Policy & Error Recovery](null-policy-recovery.md) covers null policy - when null is acceptable and how to recover from errors with fallback values.
