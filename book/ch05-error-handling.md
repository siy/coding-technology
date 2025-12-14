# Chapter 5: Error Handling & Composition

## What You'll Learn

- Why business logic never throws exceptions
- How to define typed error hierarchies with Cause
- Error accumulation vs fail-fast semantics
- Monadic composition rules

**Prerequisites:** [Chapter 4: Parse, Don't Validate](ch04-parse-dont-validate.md)

---

## No Business Exceptions

Business failures are not exceptional—they're expected outcomes of business rules. An invalid email isn't an exception; it's a normal case of bad input. An account being locked isn't an exception; it's a business state.

**The rule:** Business logic never throws exceptions for business failures. All failures flow through `Result` or `Promise` as typed `Cause` objects.

**Why by criteria:**
- **Mental Overhead**: Checked exceptions pollute signatures (+1). Unchecked are invisible (+2).
- **Business/Technical Ratio**: Stack traces are noise; typed Causes are domain concepts (+2).
- **Reliability**: Exceptions bypass type checker; Result makes failures explicit (+3).
- **Complexity**: Exception hierarchies create cross-package coupling (+1).

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
            ? new LoginError.AccountLocked(user.id()).result()
            : Result.success(user);
}
```

---

## Defining Typed Errors

Every failure is a `Cause`. Define error types as sealed interfaces:

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

**Benefits:**
- Exhaustive switch expressions
- Compiler checks all cases handled
- Clear documentation of failure modes

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
// Adapter: map null → Option, exception → Cause
public Promise<Option<User>> findById(UserId id) {
    return Promise.lift(
        RepositoryError.DatabaseFailure::new,  // Exception → Cause
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
            RepositoryError.DatabaseFailure::new,  // Convert exception → Cause
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

### Forbidden: Promise<Result<T>>

`Promise<T>` already carries failures. Never nest:

```java
// WRONG
Promise<Result<User>> loadUser(UserId id)

// RIGHT
Promise<User> loadUser(UserId id)
```

### Allowed: Result<Option<T>>

For optional values that must validate when present:

```java
Result<Option<ReferralCode>> refCode = ReferralCode.referralCode(input);
// Success(None) = not provided
// Success(Some(code)) = valid code
// Failure(cause) = invalid code
```

---

## Testing Errors

```java
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
2. **Sealed interfaces** - Define exhaustive error types
3. **Result.all()** - Accumulates all failures, not just first
4. **Adapters convert** - Exceptions → Cause at boundaries
5. **Never nest** - `Promise<Result<T>>` is forbidden
6. **Test functionally** - Use `onSuccess`/`onFailure` assertions

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 2.3: Error accumulation vs short-circuit
- Exercise 2.5: Recovery patterns

---

## What's Next

[Chapter 6](ch06-null-policy-recovery.md) covers null policy - when null is acceptable and how to recover from errors with fallback values.
