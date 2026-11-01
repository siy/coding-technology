---
tags: [java, errorhandling, functionalprogramming, bestpractices]
canonical_url: https://pragmatica.dev/articles/errors-as-values
description: Why your business logic shouldn't throw exceptions and how typed errors improve code quality
published: true
---

# Errors as Values: A Type-Safe Alternative to Exceptions

**Why your business logic shouldn't throw exceptions**

---

## The Exception Problem

Exceptions in Java were designed for exceptional circumstances--situations that shouldn't happen during normal program execution. Yet somewhere along the way, we started using them for everything: validation failures, business rule violations, missing data, and expected error conditions.

This creates several problems:

**1. Hidden Control Flow**

```java
public User authenticate(String email, String password) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
        throw new UserNotFoundException(email);
    }
    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
        throw new InvalidCredentialsException();
    }
    if (user.isLocked()) {
        throw new AccountLockedException(user.getId());
    }
    return user;
}
```

Looking at the signature `User authenticate(String, String)`, you'd never know this method can fail in three different ways. The caller must read the implementation or documentation to understand what to catch.

**2. Coupling Through Exception Hierarchies**

When service A throws `UserNotFoundException` and service B needs to handle it, service B now depends on service A's exception class. This coupling spreads through your codebase, making refactoring painful.

**3. Try-Catch Ceremony**

```java
try {
    User user = authService.authenticate(email, password);
    Token token = tokenService.generateToken(user);
    return new LoginResponse(token);
} catch (UserNotFoundException e) {
    return new ErrorResponse("User not found", 404);
} catch (InvalidCredentialsException e) {
    return new ErrorResponse("Invalid credentials", 401);
} catch (AccountLockedException e) {
    return new ErrorResponse("Account locked", 403);
}
```

This code has more error handling than business logic. And if you forget to catch one exception type? Runtime failure.

**4. Exceptions Don't Compose**

You can't easily combine operations that might throw different exceptions. You can't map over them, filter them, or chain them. Every combination requires more try-catch blocks.

---

## The Alternative: Errors as Values

What if failures weren't exceptional? What if they were just... values?

```java
public Result<User> authenticate(String email, String password) {
    return userRepository.findByEmail(email)
        .toResult(LoginError.USER_NOT_FOUND)
        .flatMap(user -> verifyPassword(user, password))
        .flatMap(this::checkAccountStatus);
}
```

Now the signature tells the complete story: this operation returns either a `User` or a failure. The compiler ensures callers handle both cases.

### The Result Type

`Result<T>` is a container that holds either a success value of type `T` or a failure of type `Cause`. It's similar to `Optional<T>`, but instead of just "present or absent," it's "success or failure with a reason."

```java
// Creating results
Result<User> success = Result.success(user);
Result<User> failure = LoginError.USER_NOT_FOUND.result();

// Using results
result.map(user -> user.getEmail());           // Transform success value
result.flatMap(this::loadProfile);              // Chain operations
result.recover(cause -> defaultUser);           // Handle failures
result.fold(cause -> errorView, user -> userView); // Handle both cases
```

### Defining Errors as Types

Instead of exception hierarchies, define errors as sealed interfaces:

```java
public sealed interface LoginError extends Cause {

    enum UserNotFound implements LoginError {
        INSTANCE;

        @Override
        public String message() {
            return "User not found";
        }
    }

    enum InvalidCredentials implements LoginError {
        INSTANCE;

        @Override
        public String message() {
            return "Invalid email or password";
        }
    }

    record AccountLocked(UserId userId, Instant lockedUntil) implements LoginError {
        @Override
        public String message() {
            return "Account locked until " + lockedUntil;
        }
    }
}
```

This gives you:
- **Exhaustive pattern matching**: The compiler knows all possible error types
- **Data with errors**: `AccountLocked` carries context (when it unlocks)
- **No inheritance coupling**: Errors are values, not exception hierarchies
- **Serializable by default**: Records and enums serialize naturally

---

## Practical Patterns

### Pattern 1: Validation That Accumulates Errors

With exceptions, you typically fail on the first error:

```java
// Exception approach: stops at first failure
public User validateUser(UserRequest request) {
    if (request.email() == null) throw new ValidationException("Email required");
    if (request.password() == null) throw new ValidationException("Password required");
    // ... more validations
}
```

With Result, you can collect all failures:

```java
public Result<ValidUser> validateUser(UserRequest request) {
    return Result.all(
        Email.email(request.email()),
        Password.password(request.password()),
        Username.username(request.username())
    ).map(ValidUser::new);
}
```

If email and password are both invalid, you get a `CompositeCause` containing both errors--much better UX for form validation.

### Pattern 2: Chaining Dependent Operations

```java
public Result<OrderConfirmation> processOrder(OrderRequest request) {
    return ValidOrder.validate(request)
        .flatMap(this::checkInventory)
        .flatMap(this::reserveItems)
        .flatMap(this::processPayment)
        .flatMap(this::confirmOrder);
}
```

Each step returns `Result<T>`. If any step fails, the chain short-circuits and returns that failure. No try-catch, no early returns, no null checks.

### Pattern 3: Recovery and Fallbacks

```java
public Result<Config> loadConfig() {
    return loadFromDatabase()
        .recover(cause -> loadFromFile())
        .recover(cause -> defaultConfig());
}
```

The `recover` method lets you handle failures gracefully, providing fallbacks without try-catch blocks.

### Pattern 4: Transforming Errors

Sometimes you need to translate errors between layers:

```java
public Result<User> findUser(UserId id) {
    return repository.findById(id)
        .mapError(dbError -> switch(dbError) {
            case ConnectionFailed cf -> ServiceError.DATABASE_UNAVAILABLE;
            case RecordNotFound nf -> UserError.NOT_FOUND;
            default -> ServiceError.INTERNAL_ERROR;
        });
}
```

---

## Handling Errors at Boundaries

Errors as values work beautifully within your business logic, but at system boundaries (HTTP controllers, message handlers), you need to convert them to appropriate responses:

```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    return authService.authenticate(request.email(), request.password())
        .map(tokenService::generateToken)
        .fold(
            cause -> toErrorResponse(cause),
            token -> ResponseEntity.ok(new LoginResponse(token))
        );
}

private ResponseEntity<?> toErrorResponse(Cause cause) {
    return switch (cause) {
        case LoginError.UserNotFound _ ->
            ResponseEntity.status(404).body(errorBody(cause));
        case LoginError.InvalidCredentials _ ->
            ResponseEntity.status(401).body(errorBody(cause));
        case LoginError.AccountLocked locked ->
            ResponseEntity.status(403).body(errorBody(cause));
        default ->
            ResponseEntity.status(500).body(errorBody("Internal error"));
    };
}
```

The `fold` method handles both success and failure cases in one expression. Pattern matching on the sealed interface gives you compile-time exhaustiveness checking.

---

## What About Async Operations?

The same principle extends to asynchronous code. Instead of `Result<T>` for sync operations, use `Promise<T>` for async:

```java
public Promise<User> findUser(UserId id) {
    return userRepository.findById(id)  // Returns Promise<Option<User>>
        .flatMap(opt -> opt.toResult(UserError.NOT_FOUND).async());
}

public Promise<Dashboard> loadDashboard(UserId userId) {
    return Promise.all(
        userService.findUser(userId),
        orderService.getRecentOrders(userId),
        notificationService.getUnread(userId)
    ).map(Dashboard::new);
}
```

`Promise<T>` carries the same semantics--success or failure--but for operations that complete asynchronously. The API is nearly identical to `Result<T>`, so the patterns you learn transfer directly.

---

## When Exceptions ARE Appropriate

This approach doesn't eliminate exceptions entirely. Exceptions remain appropriate for:

**Programming Errors**
```java
Objects.requireNonNull(param, "param must not be null");
```
These indicate bugs that should crash loudly in development.

**Unrecoverable System Failures**
```java
throw new OutOfMemoryError();
```
When the JVM can't continue, exceptions are the right tool.

**Framework Boundaries**
Some frameworks expect exceptions (e.g., Spring's `@ExceptionHandler`). At these boundaries, you might convert your `Result` failures to exceptions.

The key distinction: **Business failures are expected outcomes, not exceptions.** A user entering wrong credentials isn't exceptional--it's a normal part of the login flow.

---

## Migration Strategy

You don't have to rewrite everything. Adopt gradually:

**Step 1: New Code Uses Result**
```java
// New validation logic returns Result
public Result<ValidEmail> validateEmail(String raw) {
    return Email.email(raw);
}
```

**Step 2: Wrap Legacy Code**
```java
// Wrap exception-throwing legacy code
public Result<User> findUserSafe(String email) {
    return Result.lift(
        LegacyError::fromException,
        () -> legacyService.findUser(email)
    );
}
```

**Step 3: Migrate Outward**
Start with inner layers (domain logic), move outward to services, finally to controllers.

---

## Benefits Summary

| Aspect | Exceptions | Errors as Values |
|--------|------------|------------------|
| **Visibility** | Hidden in implementation | Explicit in signature |
| **Composition** | Try-catch blocks | map/flatMap chains |
| **Exhaustiveness** | Runtime failures | Compile-time checking |
| **Data carrying** | Exception fields | Record fields |
| **Testing** | Catch assertions | Value assertions |
| **Coupling** | Exception hierarchies | Independent types |

---

## Conclusion

Exceptions are a powerful tool--for exceptional circumstances. But login failures, validation errors, and missing data aren't exceptional. They're expected parts of normal program flow.

By treating errors as values:
- Your function signatures become honest documentation
- The compiler helps you handle all cases
- Error handling composes naturally with business logic
- Testing becomes straightforward value comparison

The shift from "throw and catch" to "return and handle" isn't just a technical change--it's a mindset shift that leads to more predictable, testable, and maintainable code.

---

*Want to dive deeper into typed error handling and functional patterns for Java? Check out [Java Backend Coding Technology](https://pragmatica.dev) for a complete methodology built on these principles.*
