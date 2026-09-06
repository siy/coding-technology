# Four Return Kinds

<!-- book:four-return-shapes -->
Every function in JBCT returns one of four semantic shapes: `T`, `Option<T>`, `Result<T>`, or `Promise<T>`. Not "usually" or "preferably"—one of the four, always. Two qualifications keep the rule exact rather than merely emphatic. The shapes compose in one permitted way, `Result<Option<T>>` and its asynchronous form `Promise<Option<T>>`, where fallibility and optionality are genuinely independent concerns; every deeper nesting is a smell this chapter names later. And `void` remains available at the edges as a deliberate signal that failure is irrelevant to the caller, distinct from `Result<Unit>`, where it is not. This isn't an arbitrary restriction; it's intentional compression of complexity into type signatures.

**Why by criteria:**
- **Mental Overhead**: Hidden error channels (exceptions), hidden optionality (null), hidden asynchrony (blocking I/O) force remembering behavior not in signatures. Explicit types eliminate this (+3).
- **Reliability**: Compiler verifies error handling, null safety, and async boundaries when encoded in types (+3).
- **Complexity**: Four types cover all scenarios - no guessing about combinations (+2).
<!-- /book:four-return-shapes -->

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
    return Verify.ensure(raw, Verify.Is::present)
        .map(String::trim)
        .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
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

<!-- book:promise-boundary -->
Use this for any operation that leaves the process: I/O, external service calls, inter-process communication. `Promise<T>` is semantically equivalent to `Result<T>` but asynchronous - failures are carried in the Promise itself, not nested inside it.

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
- Any other operation that leaves the process (messaging, inter-process calls)

A long-running computation is not on this list. CPU-bound work returns `Result<T>` no matter how long it takes: `Promise` marks crossing the process boundary, and how an operation is scheduled is the caller's decision, made visible at the composition site (`Promise.lift`), never encoded in the leaf's type.
<!-- /book:promise-boundary -->

## Critical Rules

<!-- book:return-type-matrix -->
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
| `Option<List<T>>` | A collection already carries emptiness as a value - a second absence channel says it twice |

**Rule:** Each concern (optionality, failure, asynchrony) appears at most once in a return type; emptiness is the collection's own concern, already carried as a value.
<!-- /book:return-type-matrix -->

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

### ❌ Never Use `Void` Type Parameter

Always use `Unit` for operations without meaningful return values. Note: `void` return is OK for fire-and-forget.

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

## Null Policy

### Never Return Null

**Rule**: JBCT code NEVER returns null. Use `Option<T>` for optional values.

```java
// ❌ WRONG - Returning null
public User findUser(UserId id) {
    return repository.findById(id.value());  // May return null
}

// ✅ CORRECT - Using Option
public Option<User> findUser(UserId id) {
    return Option.option(repository.findById(id.value()));
}
```

### When Null IS Acceptable

Null appears only at **adapter boundaries** when interfacing with external code:

#### 1. Wrapping External APIs

```java
// Adapter layer - wrap nullable external API
public Option<User> findUser(UserId id) {
    User user = repository.findById(id.value());  // External API may return null
    return Option.option(user);  // Wrap immediately
}

// Spring Data JPA example
public Option<User> findByEmail(Email email) {
    return Option.option(
        userRepository.findByEmail(email.value())  // JPA returns null if not found
    );
}
```

**Pattern**: `Option.option(nullable)` converts null → `Option.none()`, non-null → `Option.some(value)`.

#### 2. Writing to Nullable Database Columns

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

**Pattern**: `.orElse(null)` ONLY when mapping `Option<T>` to nullable database column.

#### 3. Testing Validation

```java
@Test
void email_fails_forNull() {
    Email.email(null)  // Test null input
         .onSuccess(Assertions::fail);
}

@Test
void validRequest_fails_whenFieldNull() {
    var request = new Request("valid@example.com", null);  // Test null field
    ValidRequest.validRequest(request)
                .onSuccess(Assertions::fail);
}
```

**Pattern**: Use null in test inputs to verify validation rejects null.

### When Null is NOT Acceptable

#### Never Pass Null Between JBCT Components

```java
// ❌ WRONG - Passing null between business logic
public Result<Order> processOrder(User user, Cart cart) {
    if (cart == null) {  // DON'T check for null
        return OrderError.InvalidCart.INSTANCE.result();
    }
    ...
}

// ✅ CORRECT - Use types to prevent null
public Result<Order> processOrder(User user, Cart cart) {
    // cart parameter cannot be null by convention
    // If cart might be absent, use Option<Cart>
    ...
}
```

#### Never Use Null for "Unknown" vs "Absent"

```java
// ❌ WRONG - Null means "unknown"
public String getUserTheme(UserId id) {
    Theme theme = findTheme(id);
    return theme != null ? theme.name() : null;  // Null ambiguous
}

// ✅ CORRECT - Option distinguishes absent from error
public Option<Theme> getUserTheme(UserId id) {
    return findTheme(id);  // none() = not set, some(theme) = set
}
```

#### Never Return Null from Business Logic

```java
// ❌ WRONG
public User enrichUser(User user) {
    Profile profile = loadProfile(user.id());
    if (profile == null) return null;  // Don't return null!
    return user.withProfile(profile);
}

// ✅ CORRECT
public Option<User> enrichUser(User user) {
    return loadProfile(user.id())  // Returns Option<Profile>
        .map(profile -> user.withProfile(profile));
}
```

### Summary

| Context | Null Usage | Correct Approach |
|---------|-----------|------------------|
| Return values | ❌ Never | Use `Option<T>` |
| Between JBCT components | ❌ Never | Use `Option<T>` or required types |
| Wrapping external APIs | ✅ Allowed | `Option.option(nullable)` |
| Database nullable columns | ✅ Allowed | `.orElse(null)` |
| Test inputs | ✅ Allowed | Test validation |
| "Unknown" semantics | ❌ Never | Use `Option<T>` |

**Core Principle**: Null exists only at system boundaries. Inside JBCT code, absence is `Option.none()`, not null.

## Related

- [parse-dont-validate.md](parse-dont-validate.md) - Validation patterns with Result
- [no-business-exceptions.md](no-business-exceptions.md) - Error handling with Cause
- [../patterns/sequencer.md](../patterns/sequencer.md) - Chaining operations
- [../patterns/fork-join.md](../patterns/fork-join.md) - Parallel operations
