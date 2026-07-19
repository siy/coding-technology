# Troubleshooting & FAQ

This chapter consolidates common issues, debugging techniques, and frequently asked questions about JBCT.

---

## Debugging Monadic Chains

### Problem: "I can't see what's happening inside flatMap"

**Symptom:** You have a chain like this and can't figure out where it fails:

```java
return validateRequest(request)
    .flatMap(this::checkPermissions)
    .flatMap(this::processData)
    .flatMap(this::saveResult);
```

**Solution 1: Add intermediate logging**

```java
return validateRequest(request)
    .onSuccess(r -> log.debug("Validated: {}", r))
    .onFailure(c -> log.debug("Validation failed: {}", c.message()))
    .flatMap(this::checkPermissions)
    .onSuccess(r -> log.debug("Permissions OK: {}", r))
    .onFailure(c -> log.debug("Permission denied: {}", c.message()))
    .flatMap(this::processData)
    // ...
```

**Solution 2: Use IDE breakpoints**

Set breakpoints inside the lambda:
```java
.flatMap(data -> {
    return processData(data);  // Breakpoint on this line
})
```

**Solution 3: Extract to named methods**

```java
return validateRequest(request)
    .flatMap(this::checkPermissionsStep)  // Breakpoint in method
    .flatMap(this::processDataStep)
    .flatMap(this::saveResultStep);

private Result<Permissions> checkPermissionsStep(ValidRequest request) {
    // Breakpoint here, full visibility
    return checkPermissions(request);
}
```

### Problem: "My Promise never resolves"

**Symptom:** Test hangs on `.await()` or production code times out.

**Checklist:**

1. **Is the Promise created but never resolved?**
```java
Promise<User> promise = Promise.promise();  // Unresolved!
// Missing: promise.succeed(user) or promise.fail(cause)
```

2. **Is there a deadlock in async code?**
```java
// WRONG: Blocking inside async chain
.flatMap(data -> {
    return otherPromise.await().async();  // Blocks the thread!
})

// CORRECT: Chain without blocking
.flatMap(data -> otherPromise)
```

3. **Is Promise.lift wrapping blocking code?**
```java
// This runs async - make sure the thread pool isn't exhausted
Promise.lift(() -> {
    Thread.sleep(10000);  // Blocks a thread
    return result;
});
```

**Debug technique:** Add timeout to isolate:
```java
promise
    .timeout(TimeSpan.timeSpan(5).seconds())
    .await()
    .onFailure(cause -> log.error("Timed out or failed: {}", cause));
```

### Problem: "I'm getting CompositeCause but don't know which validations failed"

**Symptom:** Result.all() fails but you only see "Multiple failures".

**Solution:** Inspect the CompositeCause:

```java
result.onFailure(cause -> {
    if (cause instanceof CompositeCause composite) {
        composite.causes().forEach(c ->
            log.error("Validation failure: {}", c.message())
        );
    } else {
        log.error("Single failure: {}", cause.message());
    }
});
```

**Better solution:** Create specific error messages in value objects:

```java
public record Email(String value) {
    private static final Fn1<Cause, String> INVALID =
        Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notBlank)
            .filter(INVALID, PATTERN.asMatchPredicate())
            .map(Email::new);
    }
}
```

Now CompositeCause contains "Invalid email format: xyz" instead of generic message.

---

## Common Mistakes and Fixes

### Mistake: Nested Result/Promise

```java
// WRONG: Returns Result<Result<User>>
public Result<Result<User>> findUser(String id) {
    return UserId.userId(id)
        .map(this::lookupUser);  // lookupUser returns Result<User>
}
```

**Fix:** Use flatMap instead of map:

```java
// CORRECT: Returns Result<User>
public Result<User> findUser(String id) {
    return UserId.userId(id)
        .flatMap(this::lookupUser);
}
```

### Mistake: Ignoring the Result

```java
// WRONG: Result is created but never used
public void processOrder(Order order) {
    validateOrder(order);  // Returns Result<ValidOrder> but ignored!
    saveOrder(order);
}
```

**Fix:** Always handle the Result:

```java
// CORRECT: Result flows through
public Result<OrderId> processOrder(Order order) {
    return validateOrder(order)
        .flatMap(this::saveOrder);
}
```

### Mistake: Throwing inside monadic chain

```java
// WRONG: Exception breaks the chain
.flatMap(data -> {
    if (data.isEmpty()) {
        throw new IllegalStateException("Empty data");  // Escapes!
    }
    return process(data);
})
```

**Fix:** Return failure instead:

```java
// CORRECT: Error stays in the chain
.flatMap(data -> {
    if (data.isEmpty()) {
        return EMPTY_DATA_ERROR.result();
    }
    return process(data);
})

// BETTER: Use filter
.filter(EMPTY_DATA_ERROR, data -> !data.isEmpty())
.flatMap(this::process)
```

### Mistake: Multi-statement lambda

```java
// WRONG: Violates single level of abstraction
.map(user -> {
    log.info("Processing user: {}", user.id());
    String normalized = user.email().toLowerCase();
    cache.put(user.id(), user);
    return new ProcessedUser(user.id(), normalized);
})
```

**Fix:** Extract to named method:

```java
// CORRECT: Simple lambda, logic in method
.map(this::processUser)

private ProcessedUser processUser(User user) {
    log.info("Processing user: {}", user.id());
    String normalized = user.email().toLowerCase();
    cache.put(user.id(), user);
    return new ProcessedUser(user.id(), normalized);
}
```

### Mistake: Using Optional instead of Option

```java
// WRONG: Mixing Java Optional with Pragmatica types
public Result<User> findUser(UserId id) {
    Optional<User> optional = repository.findById(id);
    if (optional.isPresent()) {
        return Result.success(optional.get());
    }
    return USER_NOT_FOUND.result();
}
```

**Fix:** Convert at the boundary:

```java
// CORRECT: Wrap immediately
public Result<User> findUser(UserId id) {
    return Option.option(repository.findById(id).orElse(null))
        .toResult(USER_NOT_FOUND);
}

// OR: Use Option.from()
public Result<User> findUser(UserId id) {
    return Option.from(repository.findById(id))
        .toResult(USER_NOT_FOUND);
}
```

### Mistake: Bypassing factory method

```java
// WRONG: Direct constructor call
Email email = new Email("user@example.com");  // Skips validation!

// CORRECT: Use factory method
Result<Email> email = Email.email("user@example.com");
```

---

## IDE Setup

### IntelliJ IDEA

**Recommended settings:**

1. **Enable parameter hints for lambdas:**
   - Settings → Editor → Inlay Hints → Java → Parameter hints
   - Enable "Show hints for lambdas"

2. **Fold anonymous classes:**
   - Settings → Editor → General → Code Folding
   - Enable "Lambda expressions"

3. **Live templates for JBCT patterns:**

```
// Template: jbctvo (Value Object)
public record $NAME$($TYPE$ value) {
    private static final Cause INVALID = Causes.cause("Invalid $NAME$");

    public static Result<$NAME$> $FACTORY$(String raw) {
        return Verify.ensure(raw, Verify.Is::notBlank)
            .map($NAME$::new);
    }
}

// Template: jbctuc (Use Case)
public interface $NAME$ {
    Promise<Response> execute(Request request);

    record Request($PARAMS$) {}
    record Response($RESULT$) {}

    static $NAME$ $FACTORY$($DEPS$) {
        return request -> ValidRequest.validRequest(request)
            .async()
            .flatMap($STEPS$);
    }
}
```

### VS Code

**Recommended extensions:**
- Extension Pack for Java
- Java Test Runner

**settings.json:**
```json
{
    "java.completion.chain.enabled": true,
    "java.completion.filteredTypes": [
        "java.util.Optional"  // Suggest Option instead
    ]
}
```

---

## Testing Troubleshooting

### Problem: "Test passes but shouldn't"

**Symptom:** You expect failure but test passes silently.

```java
@Test
void shouldFail() {
    Email.email("invalid");  // Returns Result, but test doesn't check it!
}
```

**Fix:** Always assert:

```java
@Test
void email_fails_forInvalidInput() {
    Email.email("invalid")
        .onSuccess(Assertions::fail);  // Fail if unexpectedly succeeds
}
```

### Problem: "Async test is flaky"

**Symptom:** Test sometimes passes, sometimes fails.

**Checklist:**

1. **Are you awaiting the Promise?**
```java
// WRONG: Test completes before Promise resolves
@Test
void asyncTest() {
    useCase.execute(request);  // Returns Promise, not awaited!
}

// CORRECT: Await before asserting
@Test
void asyncTest() {
    useCase.execute(request)
        .await()
        .onFailure(Assertions::fail);
}
```

2. **Is there shared mutable state between tests?**
```java
// WRONG: Shared state
private static List<String> logs = new ArrayList<>();

// CORRECT: Per-test state
private List<String> logs;

@BeforeEach
void setup() {
    logs = new ArrayList<>();
}
```

3. **Are Promise timeouts too short?**
```java
// Increase timeout for CI environments
.await(TimeSpan.timeSpan(30).seconds())
```

### Problem: "Can't create stub for step interface"

**Symptom:** Compilation error when creating lambda stub.

```java
// ERROR: Target type must be a functional interface
var stub = req -> Promise.success(req);  // What type is this?
```

**Fix:** Declare the type explicitly:

```java
// CORRECT: Type declaration
CheckEmail checkEmail = req -> Promise.success(req);
```

---

## FAQ

### General

**Q: Is JBCT only for microservices?**

A: No. JBCT works for any backend Java application - monoliths, microservices, serverless functions. The patterns are about code organization, not deployment topology.

**Q: Does JBCT require Spring Boot?**

A: No. JBCT is framework-agnostic. The examples use Spring Boot because it's common, but the patterns work with Micronaut, Quarkus, plain Java, or any other framework.

**Q: Can I use JBCT with Kotlin?**

A: Yes, but consider Arrow-kt instead. Kotlin's coroutines and extension functions provide more idiomatic alternatives. The concepts transfer directly.

**Q: What about reactive streams (Project Reactor, RxJava)?**

A: JBCT's Promise is simpler than reactive streams. Use reactive streams when you need backpressure or complex stream operations. Use Promise for simple async request/response patterns.

### Error Handling

**Q: When should I use exceptions instead of Result?**

A: Use exceptions for:
- Programming errors (IllegalArgumentException, NullPointerException)
- Unrecoverable system failures
- Framework requirements (Spring's @Transactional rollback)

Use Result for:
- Business failures (validation, not found, conflict)
- Expected error conditions
- Anything the caller might want to handle

**Q: How do I handle errors from third-party libraries that throw?**

A: Wrap at the adapter boundary:

```java
public Promise<User> findUser(UserId id) {
    return Promise.lift(
        DatabaseError::new,
        () -> jdbcTemplate.queryForObject(sql, mapper, id.value())
    );
}
```

**Q: Should every method return Result?**

A: No. Pure functions that cannot fail should return T directly:

```java
// Returns T - pure computation, cannot fail
public Money calculateTotal(List<LineItem> items) {
    return items.stream()
        .map(LineItem::subtotal)
        .reduce(Money.ZERO, Money::add);
}

// Returns Result<T> - validation can fail
public Result<Money> parseAmount(String raw) {
    return Money.money(raw);
}
```

### Performance

**Q: Is there overhead from wrapping everything in Result/Promise?**

A: Minimal. The types are thin wrappers. Overhead is comparable to Optional. For typical web applications, this is negligible compared to I/O latency.

**Q: Are lambdas slower than methods?**

A: No. The JVM inlines simple lambdas. There's no significant performance difference for typical use cases.

**Q: Does creating many small objects (value objects) hurt GC?**

A: Modern JVMs handle short-lived objects efficiently. Value objects are typically small and short-lived. If profiling shows GC pressure, the issue is usually elsewhere.

### Testing

**Q: Should I test value object validation separately from use cases?**

A: Yes. Value objects get unit tests for each validation rule. Use cases get integration tests with stubbed steps.

**Q: How many tests should a use case have?**

A: At minimum:
- 1 happy path test
- 1 test per step failure
- 1 test per validation rule in ValidRequest

**Q: Should I use mocks or stubs?**

A: Prefer stubs (simple lambda implementations). Mocks add complexity and verification overhead. JBCT's functional style makes stubbing easy.

### Architecture

**Q: Where do DTOs belong?**

A: At adapter boundaries:
- Request DTOs in controller (convert to domain types immediately)
- Response DTOs from use case Response records
- No DTOs in domain layer

**Q: Can use cases call other use cases?**

A: Generally no. If use case A needs functionality from use case B, extract that functionality to a shared step interface.

**Q: How do I handle transactions?**

A: At the adapter layer:
```java
@Repository
public class JooqOrderRepository implements SaveOrder {
    @Transactional
    @Override
    public Promise<OrderId> apply(ValidOrder order) {
        return Promise.lift(
            DatabaseError::new,
            () -> saveInTransaction(order)
        );
    }
}
```

---

## Error Message Reference

### "Cannot infer functional interface type"

**Cause:** Lambda target type is ambiguous.

**Fix:** Add explicit type declaration:
```java
CheckEmail checkEmail = req -> Promise.success(req);
```

### "Incompatible types: `Result<X>` cannot be converted to `Result<Y>`"

**Cause:** Using map when flatMap is needed.

**Fix:** Check if the mapping function returns a Result. If so, use flatMap:
```java
// WRONG: validate returns Result<ValidEmail>
.map(this::validate)  // Results in Result<Result<ValidEmail>>

// CORRECT
.flatMap(this::validate)  // Results in Result<ValidEmail>
```

### "No instances of type variable(s) T exist"

**Cause:** Type inference failure, often with Cause.result() or Cause.promise().

**Fix:** Add type witness or assign to typed variable:
```java
// Option 1: Type witness
return ERROR.<User>result();

// Option 2: Assign to variable
Result<User> failure = ERROR.result();
return failure;
```

### "Promise.await() blocks forever"

**Cause:** Promise never resolved.

**Fix:** Ensure all code paths resolve the Promise:
```java
Promise<User> promise = Promise.promise();

// Ensure both success and failure paths resolve
if (condition) {
    promise.succeed(user);
} else {
    promise.fail(cause);  // Don't forget this!
}
```

---

## Summary

When debugging JBCT code:

1. **Add logging at chain points** - Use onSuccess/onFailure for visibility
2. **Extract to named methods** - Easier breakpoints and stack traces
3. **Check for common mistakes** - Nested results, ignored returns, thrown exceptions
4. **Use explicit types** - Helps IDE and compiler catch errors
5. **Test both success and failure** - Always assert on Result/Promise

The functional style may feel unfamiliar initially, but debugging becomes easier once you internalize the patterns. The explicit error handling means fewer surprises at runtime.
