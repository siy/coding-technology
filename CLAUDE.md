Collaboration Rule (Must Read)

Always ask questions and listen first. Do not produce artifacts, documents, code, or summaries unless explicitly asked to do so by the user. When unsure, ask before acting.

Operationalization
- Begin each interaction by asking targeted clarifying questions.
- Confirm scope and desired format; wait for an explicit "produce X".
- Keep outputs minimal and directly tied to the explicit request.

Java Code Formatting Rules

When writing Java code examples, follow these formatting conventions strictly:

1. **Always use braces for if statements**
   - Never use bracketless if, even for single-line bodies
   - Example:
     ```java
     // DO
     if (condition) {
         return result;
     }

     // DON'T
     if (condition) return result;
     ```

2. **Annotations on separate lines**
   - Always place annotations like `@Override` on their own line
   - Example:
     ```java
     // DO
     @Override
     public String message() {
         return "Error message";
     }

     // DON'T
     @Override public String message() { return "Error message"; }
     ```

3. **No one-line method bodies**
   - Always use multi-line format for method bodies
   - Example:
     ```java
     // DO
     private User getUser() {
         return currentUser;
     }

     // DON'T
     private User getUser() { return currentUser; }
     ```

4. **Result.all() and Promise.all() parameter alignment**
   - Align parameters starting from the first parameter
   - Align subsequent method calls (`.flatMap`, `.map`) with the `.all` call
   - Example:
     ```java
     // DO
     return Result.all(Email.email(emailRaw),
                       Password.password(passwordRaw))
                  .flatMap(this::validateAndCheckStatus);

     // DON'T
     return Result.all(
         Email.email(emailRaw),
         Password.password(passwordRaw)
     ).flatMap(this::validateAndCheckStatus);
     ```

---

# Pragmatica Lite Core 0.8.0 API Reference

This section documents the actual API methods available in Pragmatica Lite Core 0.8.0.

## Type Conversions

### Option conversions:
- `Option<T>` → `Result<T>`  -  **`.toResult(Cause cause)`** or **`.await(Cause cause)`** (aliases)
- `Option<T>` → `Result<T>`  -  **`.toResult()`** or **`.await()`** (uses CoreError.emptyOption)
- `Option<T>` → `Promise<T>`  -  **`.async(Cause cause)`**
- `Option<T>` → `Promise<T>`  -  **`.async()`** (uses CoreError.emptyOption)
- `Option<T>` → `Optional<T>`  -  **`.toOptional()`**

### Result conversions:
- `Result<T>` → `Option<T>`  -  **`.option()`** (loses error information)
- `Result<T>` → `Promise<T>`  -  **`.async()`**

### Promise conversions:
- `Promise<T>` → `Promise<T>`  -  **`.async()`** (identity, for API consistency)
- `Promise<T>` → `Result<T>`  -  **`.await()`** (blocks current thread)
- `Promise<T>` → `Result<T>`  -  **`.await(TimeSpan timeout)`** (with timeout)

### Cause conversions:
- `Cause` → `Result<T>`  -  **`.result()`** (prefer over `Result.failure(cause)`)
- `Cause` → `Promise<T>`  -  **`.promise()`** (prefer over `Promise.failure(cause)`)

### Factories (creating instances):
- `Option.option(T value)`  -  wraps nullable value (null → empty)
- `Option.some(T value)` / `Option.present(T value)`  -  create present option
- `Option.none()` / `Option.empty()`  -  create empty option
- `Result.success(T value)` / `Result.ok(T value)`  -  create success
- `Result.failure(Cause cause)` / `Result.err(Cause cause)`  -  create failure (prefer `cause.result()`)
- `Promise.success(T value)` / `Promise.ok(T value)`  -  resolved promise (success)
- `Promise.failure(Cause cause)` / `Promise.err(Cause cause)`  -  resolved promise (failure) (prefer `cause.promise()`)
- `Promise.resolved(Result<T> result)`  -  resolved promise
- `Promise.promise()`  -  unresolved promise
- `Promise.promise(Consumer<Promise<T>>)`  -  unresolved, runs consumer async
- `Promise.promise(Supplier<Result<T>>)`  -  async execution of supplier

## Exception Handling (lift methods)

### Option.lift* methods:
- **`Option.lift(Fn0<R> function)`**  -  wraps function that may return null or throw
- **`Option.lift1(Fn1<R, T> function, T value)`**  -  invoke unary function, wrap result
- **`Option.lift2(Fn2<R, T1, T2> function, T1 v1, T2 v2)`**  -  invoke binary function
- **`Option.lift3(Fn3<R, T1, T2, T3> function, ...)`**  -  invoke ternary function

### Result.lift* methods:
All liftN methods accept optional `exceptionMapper: Fn1<Cause, Throwable>` as first parameter (defaults to `Causes::fromThrowable`)

- **`Result.lift(ThrowingFn0<U> supplier)`**  -  wrap throwing supplier
- **`Result.lift(Fn1<Cause, Throwable> mapper, ThrowingFn0<U> supplier)`**
- **`Result.lift(ThrowingRunnable runnable)`**  -  returns `Result<Unit>`
- **`Result.lift(Cause cause, ThrowingFn0<U> supplier)`**  -  fixed cause on failure
- **`Result.lift1(ThrowingFn1<R, T1> fn, T1 value)`**  -  direct invocation
- **`Result.lift1(Fn1<Cause, Throwable> mapper, ThrowingFn1<R, T1> fn, T1 value)`**  -  with custom mapper
- **`Result.lift2(ThrowingFn2<R, T1, T2> fn, T1 v1, T2 v2)`**  -  direct invocation
- **`Result.lift2(Fn1<Cause, Throwable> mapper, ThrowingFn2<R, T1, T2> fn, T1 v1, T2 v2)`**  -  with custom mapper
- **`Result.lift3(ThrowingFn3<R, T1, T2, T3> fn, ...)`**  -  direct invocation
- **`Result.lift3(Fn1<Cause, Throwable> mapper, ThrowingFn3<R, T1, T2, T3> fn, ...)`**  -  with custom mapper
- **`Result.liftFn1(ThrowingFn1<R, T1> fn)`**  -  returns `Fn1<Result<R>, T1>` (function factory)
- **`Result.liftFn2(ThrowingFn2<R, T1, T2> fn)`**  -  returns `Fn2<Result<R>, T1, T2>`
- **`Result.liftFn3(ThrowingFn3<R, T1, T2, T3> fn)`**  -  returns `Fn3<Result<R>, T1, T2, T3>`

### Promise.lift* methods:
All accept optional `exceptionMapper: Fn1<Cause, Throwable>` (defaults to `Causes::fromThrowable`)

- **`Promise.lift(ThrowingFn0<U> supplier)`**  -  async execution, wraps exceptions
- **`Promise.lift(Fn1<Cause, Throwable> mapper, ThrowingFn0<U> supplier)`**
- **`Promise.lift(ThrowingRunnable runnable)`**  -  returns `Promise<Unit>`
- **`Promise.lift(Cause cause, ThrowingFn0<U> supplier)`**  -  fixed cause on failure
- **`Promise.lift1(ThrowingFn1<R, T1> fn, T1 value)`**  -  direct invocation
- **`Promise.lift2(ThrowingFn2<R, T1, T2> fn, T1 v1, T2 v2)`**  -  direct invocation
- **`Promise.lift3(ThrowingFn3<R, T1, T2, T3> fn, ...)`**  -  direct invocation
- **`Promise.liftFn1(ThrowingFn1<R, T1> fn)`**  -  returns `Fn1<Promise<R>, T1>` (function factory)
- **`Promise.liftFn2(ThrowingFn2<R, T1, T2> fn)`**  -  returns `Fn2<Promise<R>, T1, T2>`
- **`Promise.liftFn3(ThrowingFn3<R, T1, T2, T3> fn)`**  -  returns `Fn3<Promise<R>, T1, T2, T3>`

**Note**: There are NO `Promise.liftOption()` or `Promise.liftResult()` methods. Use `Promise.lift()` for exception handling in adapters.

## Aggregation (all/any/allOf)

### Option.all (fail-fast on empty):
- `Option.all(Option<T1>)` → `Mapper1<T1>` with `.map()` / `.flatMap()`
- `Option.all(Option<T1>, Option<T2>)` → `Mapper2<T1, T2>`
- ... up to `Mapper9` (9 parameters)

### Result.all (accumulates failures in CompositeCause):
- `Result.all(Result<T1>)` → `Mapper1<T1>` with `.map()` / `.flatMap()` / `.async()`
- `Result.all(Result<T1>, Result<T2>)` → `Mapper2<T1, T2>`
- ... up to `Mapper9` (9 parameters)
- `Result.allOf(Result<T>...)` → `Result<List<T>>` (varargs)
- `Result.allOf(List<Result<T>>)` → `Result<List<T>>`

### Promise.all (fail-fast on first failure):
- `Promise.all(Promise<T1>)` → `Mapper1<T1>` with `.map()` / `.flatMap()`
- `Promise.all(Promise<T1>, Promise<T2>)` → `Mapper2<T1, T2>`
- ... up to `Mapper9` (9 parameters)
- `Promise.allOf(Collection<Promise<T>>)` → `Promise<List<Result<T>>>`

### any methods:
- `Option.any(Option<T>...)`  -  first present option
- `Result.any(Result<T>...)`  -  first success result
- `Promise.any(Promise<T>...)`  -  first success promise, cancels others

## Common Methods

### map/flatMap (all types):
- `.map(Fn1<U, T> mapper)`  -  transform success/present value
- `.map(Supplier<U> supplier)`  -  replace success/present value
- `.flatMap(Fn1<M<U>, T> mapper)`  -  chain monadic operations
- `.flatMap(Supplier<M<U>> supplier)`  -  replace with monadic value

### filter (Result and Promise):
- `.filter(Cause cause, Predicate<T> predicate)`  -  filter by predicate
- `.filter(Fn1<Cause, T> causeMapper, Predicate<T> predicate)`  -  dynamic cause

### Callback methods:
- `.onPresent(Consumer<T>)`  -  Option only
- `.onEmpty(Runnable)`  -  Option only
- `.onSuccess(Consumer<T>)`  -  Result and Promise
- `.onFailure(Consumer<Cause>)`  -  Result and Promise
- `.onResult(Consumer<Result<T>>)`  -  Result and Promise

### Recovery:
- `.or(T replacement)`  -  provide fallback value
- `.or(Supplier<T> supplier)`  -  lazy fallback value
- `.orElse(M<T> replacement)`  -  fallback monadic value
- `.recover(Fn1<T, Cause> mapper)`  -  Result/Promise: recover from failure

## Example Usage Patterns

### Adapter with exception handling:
```java
public Promise<User> findUser(UserId id) {
    return Promise.lift(
        CoreError::database,
        () -> jdbcTemplate.queryForObject("SELECT * FROM users WHERE id = ?",
                                         new Object[]{id.value()},
                                         this::mapUser)
    );
}
```

### Lifting sync Result to async Promise:
```java
public Promise<Response> execute(Request request) {
    return ValidRequest.validate(request)  // returns Result<ValidRequest>
                       .async()            // converts to Promise<ValidRequest>
                       .flatMap(step1::apply)
                       .flatMap(step2::apply);
}
```

### Option to Result/Promise:
```java
Option<User> optUser = findUserById(id);

// To Result
Result<User> result = optUser.toResult(UserError.NotFound.INSTANCE);

// To Promise
Promise<User> promise = optUser.async(UserError.NotFound.INSTANCE);
```

## Testing Patterns

### Functional assertion style with onSuccess/onFailure:

**Testing failures** - use `.onSuccess(Assertions::fail)`:
```java
@Test
void validation_fails_forInvalidInput() {
    var request = new Request("invalid", "data");

    ValidRequest.validate(request)
                .onSuccess(Assertions::fail);  // Fail test if unexpectedly succeeds
}
```

**Testing successes** - use `.onFailure(Assertions::fail).onSuccess(assertions)`:
```java
@Test
void validation_succeeds_forValidInput() {
    var request = new Request("valid@example.com", "Valid1234");

    ValidRequest.validate(request)
                .onFailure(Assertions::fail)  // Fail test if unexpectedly fails
                .onSuccess(valid -> {
                    assertEquals("valid@example.com", valid.email().value());
                    // More assertions...
                });
}
```

**Async tests** - use `.await()` then apply pattern:
```java
@Test
void execute_succeeds_forValidInput() {
    UseCase useCase = UseCase.create(successStub, anotherStub);
    var request = new Request("data");

    useCase.execute(request)
           .await()
           .onFailure(Assertions::fail)
           .onSuccess(response -> {
               assertEquals("expected", response.value());
           });
}
```

**Benefits**:
- No intermediate result variables
- Functional bifurcation: specify behavior for each outcome
- Method references (`Assertions::fail`) for cleaner code
- Clear test intent: what happens on success vs failure

