---
tags: [java, functionalprogramming, api, cleancode]
canonical_url: https://pragmatica.dev/articles/four-return-types
description: A systematic approach to function signatures that makes code self-documenting
published: true
---

# Four Types, Four Guarantees: Designing Clear Function Signatures

**What does your return type promise?**

---

## The Signature Tells a Story

Every function signature is a contract. It tells callers: "Give me these inputs, and I'll give you this output." But traditional Java signatures often lie by omission:

```java
User findUser(String userId)
```

What does this signature promise? It says: give me a string, get a user. But what actually happens?

- What if the user doesn't exist? `null`? Exception?
- What if the database is down? Exception?
- Is this synchronous or does it block on I/O?
- Can this *ever* fail, or is it pure computation?

The signature doesn't say. You have to read the implementation, check the Javadoc, or learn from production failures.

**What if signatures told the whole truth?**

---

## The Four Return Types

Every function can be characterized by two questions:

1. **Can it fail?** (Yes or No)
2. **Is it synchronous?** (Sync or Async)

This gives us four possibilities, each with its own type:

| | Can't Fail | Can Fail |
|---|------------|----------|
| **Sync** | `T` | `Result<T>` |
| **Async** | *(rare)* | `Promise<T>` |

Plus one special case for absence without failure:
- **`Option<T>`**: Synchronous, can't fail, value might be absent

### Type 1: `T` -- Always Succeeds, Always Present

```java
public Money calculateTotal(List<LineItem> items)
```

This signature promises: give me line items, you *will* get a total. No nulls, no exceptions, no failures. Pure computation.

**Use when:**
- Pure functions (math, string manipulation, data transformation)
- Factory methods for types that can't be invalid
- Accessors that always have a value

### Type 2: `Option<T>` -- Might Be Absent, Can't Fail

```java
public Option<User> findByEmail(Email email)
```

This signature promises: the user might not exist, but looking for them will never fail. If there's a user, you get `Some(user)`. If not, you get `None`.

**Use when:**
- Lookup operations (find by ID, search by criteria)
- Optional fields in data structures
- First/last element of a possibly-empty collection

**Not for:** Operations that can fail for reasons other than absence. Database errors aren't "absence"--they're failures.

### Type 3: `Result<T>` -- Synchronous, Might Fail

```java
public Result<Email> validateEmail(String raw)
```

This signature promises: validation happens immediately (sync), but might fail. You get either a valid `Email` or a `Cause` explaining what went wrong.

**Use when:**
- Validation and parsing
- Computations that can fail (division, parsing numbers)
- Business rule checks

### Type 4: `Promise<T>` -- Asynchronous, Might Fail

```java
public Promise<User> fetchUser(UserId id)
```

This signature promises: this operation involves I/O (database, network, file system), will complete later, and might fail.

**Use when:**
- Database operations
- HTTP calls
- File system access
- Any external I/O

---

## The Decision Tree

When designing a function, walk through this:

```
Can this operation fail?
+-- NO: Can the value be absent?
|   +-- NO -> return T
|   +-- YES -> return Option<T>
+-- YES: Does it involve I/O?
    +-- NO -> return Result<T>
    +-- YES -> return Promise<T>
```

Let's apply this to real scenarios:

**Calculating a sum:**
- Can it fail? No (assuming non-null inputs)
- -> Return `T` (specifically, `Money` or `BigDecimal`)

**Finding a user by email:**
- Can it fail? The lookup itself (I/O) can fail
- Does it involve I/O? Yes (database)
- -> Return `Promise<User>` or `Promise<Option<User>>`

**Parsing a string to an email:**
- Can it fail? Yes (invalid format)
- Does it involve I/O? No (pure parsing)
- -> Return `Result<Email>`

**Getting the first element of a list:**
- Can it fail? Not really--empty list isn't a "failure"
- Can it be absent? Yes
- -> Return `Option<T>`

---

## Signatures as Documentation

Compare these signatures:

```java
// What can go wrong? Who knows.
User authenticate(String email, String password)

// Crystal clear: async operation that might fail
Promise<User> authenticate(Email email, Password password)
```

The second signature tells you:
- It's async (involves I/O--probably database lookup)
- It might fail (invalid credentials, user not found, database down)
- Inputs are validated (`Email`, `Password` not raw strings)

No documentation needed. The types *are* the documentation.

---

## Common Patterns

### Pattern 1: Composing Results

```java
public Result<ValidOrder> validateOrder(OrderRequest request) {
    return Result.all(
        Email.email(request.email()),
        Address.address(request.shippingAddress()),
        validateItems(request.items())
    ).map(ValidOrder::new);
}
```

`Result.all` combines multiple validations. If any fails, you get all the errors. If all succeed, you get all the values.

### Pattern 2: Chaining Promises

```java
public Promise<OrderConfirmation> processOrder(OrderRequest request) {
    return ValidOrder.validate(request)  // Result<ValidOrder>
        .async()                          // -> Promise<ValidOrder>
        .flatMap(this::reserveInventory)  // -> Promise<Reservation>
        .flatMap(this::processPayment)    // -> Promise<Payment>
        .flatMap(this::confirmOrder);     // -> Promise<OrderConfirmation>
}
```

Each step might fail. If any step fails, the chain short-circuits. No try-catch needed.

### Pattern 3: Converting Between Types

```java
// Option to Result (absence becomes a specific error)
Option<User> maybeUser = findUser(id);
Result<User> result = maybeUser.toResult(UserError.NOT_FOUND);

// Result to Promise (lift sync to async)
Result<ValidOrder> validated = ValidOrder.validate(request);
Promise<ValidOrder> async = validated.async();

// Promise to Result (block and wait--use sparingly)
Promise<User> promise = fetchUser(id);
Result<User> result = promise.await();
```

### Pattern 4: Handling Absence vs. Failure

```java
public Promise<User> getUser(UserId id) {
    return repository.findById(id)  // Returns Promise<Option<User>>
        .flatMap(opt -> opt
            .map(Promise::success)
            .orElse(UserError.NOT_FOUND.promise()));
}
```

The repository returns `Option` (user might not exist). We convert absence to a specific error.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Result That Never Fails

```java
// Bad: Result that always succeeds
public Result<Config> loadDefaults() {
    return Result.success(new Config("default", 8080));
}
```

If it always succeeds, return `T`:

```java
// Good: honest signature
public Config loadDefaults() {
    return new Config("default", 8080);
}
```

### Anti-Pattern 2: Promise<Result<T>>

```java
// Bad: double error channel
public Promise<Result<User>> findUser(UserId id)
```

Both `Promise` and `Result` can represent failure. Pick one:

```java
// Good: Promise handles async failures
public Promise<User> findUser(UserId id)
```

### Anti-Pattern 3: Returning Null

```java
// Bad: null for absence
public User findByEmail(String email) {
    return users.get(email);  // might be null
}
```

Use `Option`:

```java
// Good: explicit absence
public Option<User> findByEmail(Email email) {
    return Option.option(users.get(email));
}
```

### Anti-Pattern 4: Throwing Business Exceptions

```java
// Bad: hidden failure mode
public User authenticate(String email, String password) {
    if (!valid) throw new InvalidCredentialsException();
    return user;
}
```

Use `Result` or `Promise`:

```java
// Good: explicit failure mode
public Result<User> authenticate(Email email, Password password) {
    if (!valid) return AuthError.INVALID_CREDENTIALS.result();
    return Result.success(user);
}
```

---

## Migration Strategy

You don't have to change everything at once:

**Step 1: New code uses the four types**
```java
// New methods return explicit types
public Result<ValidOrder> validateOrder(OrderRequest request) { }
```

**Step 2: Wrap legacy code at boundaries**
```java
public Result<User> findUserSafe(String email) {
    return Result.lift(
        LegacyErrors::fromException,
        () -> legacyService.findUser(email)
    );
}
```

**Step 3: Gradually migrate callers**
As code is touched, update signatures to use proper types.

---

## Benefits Summary

| Aspect | Traditional | Four Types |
|--------|-------------|------------|
| **Failure modes** | Hidden in throws/docs | Explicit in signature |
| **Absence** | null or exception | `Option<T>` |
| **Sync failures** | Exceptions | `Result<T>` |
| **Async** | Callbacks, CompletableFuture | `Promise<T>` |
| **Composition** | Try-catch blocks | map/flatMap chains |
| **Documentation** | Javadoc (maybe) | Types (always) |

---

## Conclusion

Your function signatures should answer four questions:
1. Is this sync or async?
2. Can it fail?
3. Can the value be absent?
4. What are the possible error types?

Traditional Java answers these in documentation (if you're lucky) or not at all. The four-type system answers them in the signature itself.

When every function uses `T`, `Option<T>`, `Result<T>`, or `Promise<T>` appropriately:
- Callers know exactly what to expect
- The compiler enforces error handling
- Composition becomes natural
- Code becomes self-documenting

The signature tells the whole story. No surprises.

---

*Want to explore how these types compose into larger patterns? Check out [Java Backend Coding Technology](https://pragmatica.dev) for a complete methodology built on typed functional composition.*
