# Four Return Kinds

Every function in JBCT returns exactly one of four kinds. This constraint eliminates ambiguity and makes function behavior predictable from the signature alone.

## The Four Kinds

### 1. `T` - Pure Value

**When to use**: Synchronous computation that cannot fail and always produces a value.

```java
public String initials() {
    return firstName.substring(0, 1) + lastName.substring(0, 1);
}

public int calculateTotal(List<Integer> prices) {
    return prices.stream().mapToInt(Integer::intValue).sum();
}
```

**Characteristics**:
- No null returns
- No checked or unchecked exceptions for business logic
- Deterministic (same input → same output)

### 2. `Option<T>` - Maybe Present

**When to use**: Value might be absent, but this is not an error condition.

```java
public Option<Theme> findTheme(UserId id) {
    return Option.option(themeRepository.findById(id.value()));
}

public Option<String> extractMiddleName(String fullName) {
    String[] parts = fullName.split(" ");
    return parts.length == 3 ? Option.some(parts[1]) : Option.none();
}
```

**Characteristics**:
- Represents optional presence
- Cannot fail (empty is a valid state, not a failure)
- Use for lookups, optional fields, search results

**Converting Option**:
```java
// Option → Result (when absence should be treated as error)
option.toResult(UserError.NotFound.INSTANCE)
option.await(UserError.NotFound.INSTANCE)  // alias

// Option → Promise (async context)
option.async(UserError.NotFound.INSTANCE)
```

### 3. `Result<T>` - May Fail

**When to use**: Synchronous operation that can fail due to validation or business rules.

```java
public static Result<Email> email(String raw) {
    return Verify.ensure(raw, Verify.Is::notNull)
        .map(String::trim)
        .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, EMAIL_PATTERN))
        .map(Email::new);
}

public Result<Order> placeOrder(UserId userId, List<Item> items) {
    if (items.isEmpty()) {
        return OrderError.EmptyCart.INSTANCE.result();
    }
    // ... validation and business logic
    return Result.success(order);
}
```

**Characteristics**:
- Represents computation that can fail
- Failure is a typed `Cause`, not an exception
- Use for validation, business rule enforcement
- Synchronous execution

**Converting Result**:
```java
// Result → Option (loses error information)
result.option()

// Result → Promise (async context)
result.async()
```

### 4. `Promise<T>` - Asynchronous

**When to use**: Asynchronous operation (I/O, network, database) that can fail.

```java
public Promise<User> loadUser(UserId id) {
    return Promise.lift(
        DatabaseError::cause,
        () -> jdbcTemplate.queryForObject(
            "SELECT * FROM users WHERE id = ?",
            new Object[]{id.value()},
            this::mapUser
        )
    );
}

public Promise<Response> execute(Request request) {
    return ValidRequest.validRequest(request)
        .async()
        .flatMap(checkEmail::apply)
        .flatMap(saveUser::apply)
        .map(this::toResponse);
}
```

**Characteristics**:
- Asynchronous execution
- Can fail (wraps failures in `Cause`)
- Use for I/O operations, external services, database calls
- Composes with `flatMap` for sequential async operations

**Converting Promise**:
```java
// Promise → Result (blocks current thread)
promise.await()
promise.await(timeout)
```

## Critical Rules

### ❌ Never `Promise<Result<T>>`

Promise already handles failures. Nesting Result is redundant:

```java
// ❌ WRONG
public Promise<Result<User>> loadUser(UserId id) {
    return Promise.lift(() -> {
        Result<User> result = userRepository.findById(id);
        return result;
    });
}

// ✅ CORRECT
public Promise<User> loadUser(UserId id) {
    return Promise.lift(
        DatabaseError::cause,
        () -> userRepository.findById(id)
    );
}
```

### ❌ Never Use `Void` Type

Always use `Unit` for operations without meaningful return values:

```java
// ❌ WRONG
public Result<Void> deleteUser(UserId id) { ... }

// ✅ CORRECT
public Result<Unit> deleteUser(UserId id) {
    // ... deletion logic
    return Result.unitResult();  // or Result.ok(Unit.unit())
}

// ✅ CORRECT (Promise)
public Promise<Unit> sendEmail(Email to, String subject) {
    return Promise.lift(() -> {
        emailService.send(to, subject);
        return Unit.unit();
    });
}
```

## Choosing the Right Kind

**Decision tree**:

1. **Is it asynchronous?** → `Promise<T>`
2. **Can it fail (validation/business rules)?** → `Result<T>`
3. **Might the value be absent?** → `Option<T>`
4. **Otherwise** → `T`

**Examples**:

| Operation | Return Type | Reason |
|-----------|-------------|--------|
| Database query | `Promise<User>` | Async I/O, can fail |
| Email validation | `Result<Email>` | Sync, can fail validation |
| Find by ID (optional) | `Option<User>` | Sync, might be absent, not an error |
| Calculate total | `int` | Sync, cannot fail, always present |
| Parse JSON | `Result<Data>` | Sync, can fail parsing |
| HTTP request | `Promise<Response>` | Async I/O, can fail |
| Extract optional field | `Option<String>` | Sync, might be absent |

## Type Conversions

### Common patterns:

```java
// Sync validation → Async processing
Result<ValidRequest> validated = ValidRequest.validRequest(request);
Promise<Response> response = validated.async()
                                       .flatMap(processRequest::apply);

// Optional lookup → Required value
Option<User> maybeUser = findUser(id);
Result<User> user = maybeUser.toResult(UserError.NotFound.INSTANCE);

// Async result → Sync (testing)
Promise<User> userPromise = loadUser(id);
Result<User> user = userPromise.await();
```

## Aggregation

### Combining multiple values:

```java
// Result.all - accumulates all failures
Result.all(Email.email(emailRaw),
           Password.password(passwordRaw))
      .map(ValidCredentials::new);

// Promise.all - fail-fast on first failure
Promise.all(fetchProfile.apply(userId),
            fetchPreferences.apply(userId),
            fetchOrders.apply(userId))
       .map((profile, prefs, orders) ->
           new Dashboard(profile, prefs, orders));

// Option.all - fail-fast on first empty
Option.all(findTheme(userId),
           findLanguage(userId))
      .map((theme, lang) -> new UserSettings(theme, lang));
```

## Error Handling

### Never throw business exceptions:

```java
// ❌ WRONG
public User findUser(UserId id) {
    User user = repository.findById(id);
    if (user == null) {
        throw new UserNotFoundException(id);  // Don't throw for business logic
    }
    return user;
}

// ✅ CORRECT
public Option<User> findUser(UserId id) {
    return Option.option(repository.findById(id));
}

// Or if absence is an error:
public Result<User> getUser(UserId id) {
    return Option.option(repository.findById(id))
                 .toResult(UserError.NotFound.INSTANCE);
}
```

### Lift exceptions at adapter boundaries:

```java
// Wrap throwing code in adapters
public Promise<User> loadUser(UserId id) {
    return Promise.lift(
        DatabaseError::cause,  // Map exception to Cause
        () -> jdbcTemplate.queryForObject(...)
    );
}
```

## Related

- [parse-dont-validate.md](parse-dont-validate.md) - Validation patterns with Result
- [no-business-exceptions.md](no-business-exceptions.md) - Error handling with Cause
- [../patterns/sequencer.md](../patterns/sequencer.md) - Chaining operations
- [../patterns/fork-join.md](../patterns/fork-join.md) - Parallel operations
