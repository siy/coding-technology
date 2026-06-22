# Chapter 10: Thread Safety

## What You'll Learn

- Core thread safety principles in JBCT
- Pattern-by-pattern safety guarantees
- Promise resolution semantics
- Common mistakes and how to avoid them

**Prerequisites:** [Chapter 9: Advanced Patterns](ch08-advanced-patterns.md)

---

## Core Rules

**Two principles ensure thread safety:**

1. **Immutable at boundaries**: All data passed between functions (parameters, return values) must be immutable
2. **Thread confinement**: Mutable state is allowed within a single-threaded execution path (sequential patterns)

These rules mean you can use mutable local variables in sequential code, but any data shared across threads must be immutable.

---

## Pattern-by-Pattern Safety Guarantees

### Leaf (Sequential)

Thread-safe through sequential execution:

```java
// SAFE: Mutable local state OK
public Result<Order> calculateTotal(Cart cart) {
    var total = 0.0;  // Mutable local variable
    for (Item item : cart.items()) {
        total += item.price();  // Sequential mutation
    }
    return Result.success(new Order(cart, total));
}
```

- Mutable local state confined to single thread
- Input (`cart`) is read-only
- Output (`Order`) is immutable

### Sequencer (Sequential)

Thread-safe, mutable local state OK:

```java
// SAFE: Each step runs sequentially
return ValidRequest.validRequest(request)
                   .async()
                   .flatMap(checkEmail::apply)    // Runs first
                   .flatMap(hashPassword::apply)  // Runs second
                   .flatMap(saveUser::apply);     // Runs third
```

- Steps execute in order, never concurrently
- Each step can use mutable local state
- Promise resolution is a synchronization point

### Fork-Join (Parallel)

Requires strict immutability:

```java
// SAFE: Immutable cart passed to both operations
Promise.all(applyBogo(cart),          // cart is immutable
            applyPercentOff(cart))    // cart is immutable
       .map(this::mergeDiscounts);

// UNSAFE: Shared mutable context creates data race
private final DiscountContext context = new DiscountContext();  // Mutable!
Promise.all(applyBogo(cart, context),     // Both access context
            applyPercentOff(cart, context))  // DATA RACE
       .map(this::merge);
```

- All parallel operations receive immutable inputs
- No shared mutable state between parallel operations
- Results merged after all complete

### Condition (Sequential)

Thread-safe, no shared mutable state:

```java
// SAFE: Only one branch executes
return user.isPremium()
    ? processPremium(user)
    : processBasic(user);
```

- Branches never execute concurrently
- Each branch can use mutable local state

### Iteration (Sequential)

Thread-safe through sequential processing:

```java
// SAFE: Stream processes sequentially
var results = items.stream()
                   .map(Item::validate)  // Sequential
                   .toList();
```

- Stream operations sequential by default
- Parallel streams require immutable inputs (use with caution)

### Aspects (Inherits)

Safety depends on wrapped operation:

```java
// SAFE: Aspect preserves underlying safety
var retried = withRetry(retryPolicy, sequentialStep);  // Still sequential
var retried = withRetry(retryPolicy, forkJoinStep);    // Still parallel
```

- Decorators don't change concurrency model
- Retry/timeout/metrics don't introduce shared state

---

## Promise Resolution Thread Safety

Promise resolution has exactly-once semantics with built-in synchronization:

```java
Promise<User> promise = Promise.promise();

// Thread 1
promise.resolve(Result.success(user));

// Thread 2
promise.resolve(Result.success(anotherUser));  // Ignored - already resolved
```

- First `resolve()` wins, subsequent calls ignored
- `flatMap`/`map` chains wait for resolution before executing
- Resolution acts as synchronization point for sequential chains

---

## Common Mistakes

### Mistake 1: Shared Mutable State in Fork-Join

```java
// WRONG: Mutable list shared across parallel operations
private final List<String> errors = new ArrayList<>();

Promise.all(validateEmail(request).onFailure(e -> errors.add(e.message())),     // DATA RACE
            validatePassword(request).onFailure(e -> errors.add(e.message())))  // DATA RACE
       .map(this::process);
```

**Fix:** Use immutable results and combine after:
```java
// CORRECT: Each operation returns its own result
Promise.all(validateEmail(request),
            validatePassword(request))
       .map((emailResult, passwordResult) -> combineResults(emailResult, passwordResult));
```

### Mistake 2: Assuming Sequential Execution in Promise.all

```java
// WRONG: Assuming order
Promise.all(incrementCounter(), incrementCounter())  // May execute concurrently!
```

Promise.all runs operations in parallel. If order matters, use Sequencer.

### Mistake 3: Mutating Input Parameters

```java
// WRONG: Mutating shared input
private Promise<Discount> applyDiscount(Cart cart) {
    cart.setSubtotal(cart.subtotal().subtract(discount));  // DATA RACE
    return Promise.success(new Discount(discount));
}

// CORRECT: Create new instances
private Promise<Discount> applyDiscount(Cart cart) {
    var discountAmount = calculateDiscountFor(cart);
    return Promise.success(new Discount(cart, discountAmount));  // Returns new data
}
```

---

## Independence Validation Checklist

Use this checklist to verify parallel operations are truly independent:

- [ ] **No shared mutable state** - Operations don't modify shared objects
- [ ] **No execution order dependency** - Results same regardless of execution order
- [ ] **Immutable inputs** - All parameters are immutable or read-only
- [ ] **Side effects independent** - I/O operations don't conflict (different database rows, files, etc.)
- [ ] **No hidden coupling** - No shared caches, connection pools with state, etc.

If any checkbox fails, use Sequencer instead of Fork-Join.

---

## When to Use Mutable State

**Allowed:**
- Local variables in sequential patterns (Leaf, Sequencer, Condition, Iteration)
- Builders constructing immutable objects
- Accumulators in sequential loops

**Forbidden:**
- Shared across parallel operations (Fork-Join)
- Passed between use case steps
- Returned from functions (return immutable copy instead)

---

## Testing for Thread Safety

Mutable test fixtures are acceptable - tests execute sequentially:

```java
// SAFE: Test-scoped mutable state
@Test
void execute_succeeds_forValidInput() {
    List<String> callLog = new ArrayList<>();  // Mutable, but test-scoped

    CheckEmail checkEmail = req -> {
        callLog.add("email");  // Sequential execution
        return Promise.success(req);
    };

    useCase.execute(request)
           .await()
           .onSuccess(response -> assertEquals(List.of("email"), callLog));
}
```

Tests are sequential, so mutable fixtures don't create races.

---

## Quick Reference Table

| Pattern                    | Thread Safety Model                               | Local Mutable State                     | Input Data              | Result Data         |
|----------------------------|---------------------------------------------------|-----------------------------------------|-------------------------|---------------------|
| **Leaf**                   | Thread confinement (single invocation)            | Safe - confined to function scope       | Must be read-only       | Must be immutable |
| **Sequencer**              | Sequential execution (steps don't overlap)        | Safe - confined to each step            | Must be read-only       | Must be immutable |
| **Fork-Join**              | Parallel execution (no synchronization)           | Safe - confined within each branch      | **MUST be immutable**   | Must be immutable |
| **Iteration (Sequential)** | Single-threaded (operations execute sequentially) | Safe - accumulators OK                  | Must be read-only       | Must be immutable |
| **Iteration (Parallel)**   | Parallel execution (no synchronization)           | Safe - confined within each operation   | **MUST be immutable**   | Must be immutable |
| **Condition**              | Depends on branch pattern                         | Follow pattern rules for each branch    | Must be read-only       | Must be immutable |
| **Aspects**                | Inherits the wrapped operation's model            | Inherits                                | Inherits                | Inherits          |

**Key Principles:**
- Input data is always read-only - never mutate parameters
- Results are always immutable - data crossing boundaries must be thread-safe
- Local mutable state is safe when confined to single operation (thread confinement)
- Parallel patterns require immutable inputs - Fork-Join and parallel iteration have no synchronization

**Common Mistakes:**
- Sharing mutable state between parallel branches
- Mutating input parameters (even in sequential patterns)
- Returning mutable collections or objects
- Using local mutable builders/accumulators within a single operation is safe
- Create new immutable instances instead of modifying inputs

---

## Key Takeaways

1. **Immutable at boundaries** - Parameters and return values always immutable
2. **Thread confinement** - Mutable local state safe in sequential patterns
3. **Fork-Join strictness** - All inputs must be immutable, no shared state
4. **Promise resolution** - Exactly-once, acts as synchronization point
5. **Independence validation** - Use checklist before parallelizing
6. **When in doubt** - Use Sequencer; premature parallelization causes subtle bugs

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 3.6: Identifying thread safety issues
- Exercise 3.7: Converting unsafe code to safe patterns

---

## What's Next

[Chapter 11](ch10-testing-philosophy.md) introduces the testing philosophy - evolutionary testing and integration-first approaches that work naturally with JBCT patterns.
