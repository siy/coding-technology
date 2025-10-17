## Conversation Style (MANDATORY)

**Core Principles:**
1. **Extreme brevity** - Answer directly without preamble or postamble. No "Let me help you", "Great question!", or "Here's what I found". Just the answer.
2. **Action-first execution** - Execute immediately. Explain only when necessary for safety or clarity.
3. **No conversational fluff** - Skip politeness markers, acknowledgments, and summaries unless explicitly requested.
4. **Ask questions when necessary** - If requirements are ambiguous, critical information is missing, or there are multiple valid approaches, ask before acting. Start conservative with questioning threshold.

**When to Ask Questions:**
- **Ambiguous requirements** - Multiple valid interpretations exist
- **Missing critical information** - Cannot proceed without specific details (file paths, values, choices)
- **Destructive operations** - Risk of data loss or irreversible changes
- **Multiple valid approaches** - Technical decision requires user preference
- **Unclear scope** - "Update documentation" could mean many things

**When NOT to Ask:**
- **Clear, unambiguous requests** - "Update version to 1.5.0" is clear
- **Standard patterns** - Follow established project conventions
- **Recoverable mistakes** - Git operations, file edits can be undone
- **Obvious next steps** - If 99% certain of intent, proceed

**Execution Pattern:**
1. **Read → Act → Verify** - Show work incrementally: read files, make changes, verify results
2. **Parallel operations** - Use multiple tool calls in single message when operations are independent
3. **Progressive disclosure** - Show work in logical steps, not all at once
4. **Immediate verification** - Check results after significant actions (word counts, git status, etc.)

**Task Management:**
1. **Proactive todo tracking** - Use TodoWrite for multi-step tasks (3+ steps) without being asked
2. **Update todos in real-time** - Mark completed, in_progress, pending as you work
3. **One task in_progress** - Focus on one todo at a time, complete before moving on

**Response Format:**
- **Simple questions**: Direct answer only (e.g., "What is X?" → "X is Y.")
- **Commands**: Execute, then confirm with minimal output (e.g., "✅ Updated" or "Done.")
- **Complex tasks**: Show structured progress with checkmarks and brief status
- **Errors/blockers**: State problem clearly, propose solution, wait for confirmation
- **Questions**: Ask directly, provide context, suggest options when applicable

**Examples:**

*Simple answer:*
```
User: What version are we on?
Assistant: 1.5.0
```

*Clear execution:*
```
User: Update all version references to 1.5.0
Assistant: [reads, edits, verifies]
✅ README.md
✅ CHANGELOG.md
✅ jbct-coder.md
```

*Appropriate question:*
```
User: Create a condensed version of the executive summary
Assistant: Target word count? (Options: 500 words for blog post, 850 for magazine, 1200 for article)
```

*Bad (over-explaining):*
```
User: What version are we on?
Assistant: Let me check that for you! I'll look at the README.md file to find the current version. [reads file] Great! I found it. The current version is 1.5.0. Is there anything else you'd like to know?
```

**Key Rule**: Minimize words while maximizing clarity. Ask when necessary, execute when clear.

---

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

# Pragmatica Lite Core 0.8.3 API Reference

This section documents the actual API methods available in Pragmatica Lite Core 0.8.3.

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
- `Promise.promise(TimeSpan delay, Consumer<Promise<T>>)`  -  unresolved, runs consumer after delay
- `Promise.promise(TimeSpan delay, Supplier<Result<T>>)`  -  async execution after delay

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
- **`Result.liftFn1(Fn1<Cause, Throwable> mapper, ThrowingFn1<R, T1> fn)`**  -  with custom exception mapper
- **`Result.liftFn2(ThrowingFn2<R, T1, T2> fn)`**  -  returns `Fn2<Result<R>, T1, T2>`
- **`Result.liftFn3(ThrowingFn3<R, T1, T2, T3> fn)`**  -  returns `Fn3<Result<R>, T1, T2, T3>`

### Promise.lift* methods:
All accept optional `exceptionMapper: Fn1<Cause, Throwable>` (defaults to `Causes::fromThrowable`)

- **`Promise.lift(ThrowingFn0<U> supplier)`**  -  async execution, wraps exceptions
- **`Promise.lift(Fn1<Cause, Throwable> mapper, ThrowingFn0<U> supplier)`**
- **`Promise.lift(ThrowingRunnable runnable)`**  -  returns `Promise<Unit>`
- **`Promise.lift(Cause cause, ThrowingFn0<U> supplier)`**  -  fixed cause on failure
- **`Promise.async(Runnable action)`**  -  async execution returning `Promise<Unit>`
- **`Promise.lift1(ThrowingFn1<R, T1> fn, T1 value)`**  -  direct invocation
- **`Promise.lift1(Fn1<Cause, Throwable> mapper, ThrowingFn1<R, T1> fn, T1 value)`**  -  with custom mapper
- **`Promise.lift2(ThrowingFn2<R, T1, T2> fn, T1 v1, T2 v2)`**  -  direct invocation
- **`Promise.lift2(Fn1<Cause, Throwable> mapper, ThrowingFn2<R, T1, T2> fn, T1 v1, T2 v2)`**  -  with custom mapper
- **`Promise.lift3(ThrowingFn3<R, T1, T2, T3> fn, ...)`**  -  direct invocation
- **`Promise.lift3(Fn1<Cause, Throwable> mapper, ThrowingFn3<R, T1, T2, T3> fn, ...)`**  -  with custom mapper
- **`Promise.liftFn1(ThrowingFn1<R, T1> fn)`**  -  returns `Fn1<Promise<R>, T1>` (function factory)
- **`Promise.liftFn1(Fn1<Cause, Throwable> mapper, ThrowingFn1<R, T1> fn)`**  -  with custom exception mapper
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
- `.flatMap2(Fn2<M<U>, T, I> mapper, I parameter2)`  -  Result/Promise only: flatMap with additional parameter
- `.mapToUnit()`  -  Result/Promise only: transform to Result<Unit>/Promise<Unit>

### filter (Result and Promise):
- `.filter(Cause cause, Predicate<T> predicate)`  -  filter by predicate
- `.filter(Fn1<Cause, T> causeMapper, Predicate<T> predicate)`  -  dynamic cause
- `.filter(Cause cause, Promise<Boolean> predicate)`  -  Promise only: async predicate
- `.filter(Fn1<Cause, T> causeMapper, Promise<Boolean> predicate)`  -  Promise only: async predicate with dynamic cause

### Callback methods:
- `.onPresent(Consumer<T>)`  -  Option only
- `.onPresentRun(Runnable)`  -  Option only: run action when present
- `.onEmpty(Runnable)`  -  Option only (alias: `.onEmptyRun(Runnable)`)
- `.onSuccess(Consumer<T>)`  -  Result and Promise
- `.onSuccessRun(Runnable)`  -  Result and Promise: run action on success
- `.onSuccessAsync(Consumer<T>)`  -  Promise only: async version of onSuccess
- `.onSuccessRunAsync(Runnable)`  -  Promise only: async run action on success
- `.onFailure(Consumer<Cause>)`  -  Result and Promise
- `.onFailureRun(Runnable)`  -  Result and Promise: run action on failure
- `.onFailureAsync(Consumer<Cause>)`  -  Promise only: async version of onFailure
- `.onFailureRunAsync(Runnable)`  -  Promise only: async run action on failure
- `.onResult(Consumer<Result<T>>)`  -  Result and Promise
- `.onResultRun(Runnable)`  -  Result and Promise: run action regardless of outcome
- `.onResultAsync(Consumer<Result<T>>)`  -  Promise only: async version of onResult
- `.onResultRunAsync(Runnable)`  -  Promise only: async run action regardless of outcome

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
- CODING_GUIDE.md is the main document we're working on. Usually if I'm mentioning document I mean CODING_GUIDE.md unless we're discussing in specific context dedicated to other document.
- Tag version only after explicit command. Sometimes we will be making more than one change.
- Preserve header during changes in jbct-coder.md. You're free to update decription if necessary, for example, version change or clarifications/updates in the description. If you think that other fields need to be changed, ask firts.
- If I inform that PR is merged, then check current branch. If it is not main, switch to main. Then pull changes.