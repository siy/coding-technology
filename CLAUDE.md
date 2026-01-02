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

5. **Lambda complexity rules**
   - Lambdas in `map`, `flatMap`, `recover`, `filter` must be minimal
   - Allowed: method references, simple parameter forwarding, constructor references
   - Forbidden: conditionals, try-catch, multi-statement blocks
   - Example:
     ```java
     // DO: Extract to named method
     .recover(this::recoverExpectedErrors)

     private Promise<Data> recoverExpectedErrors(Cause cause) {
         return switch (cause) {
             case NotFound ignored, Timeout ignored -> useDefault();
             default -> cause.promise();
         };
     }

     // DON'T: instanceof chain in lambda
     .recover(cause -> {
         if (cause instanceof NotFound || cause instanceof Timeout) {
             return useDefault();
         }
         return cause.promise();
     })
     ```

6. **Use switch expressions for type matching**
   - Replace `if (instanceof)` chains with pattern matching switch
   - Use multi-case matching: `case A ignored, B ignored ->`
   - Example:
     ```java
     // DO
     private Promise<User> recoverNetworkError(Cause cause) {
         return switch (cause) {
             case NetworkError.Timeout ignored -> TIMEOUT.promise();
             case NetworkError.Connection ignored -> UNREACHABLE.promise();
             default -> cause.promise();
         };
     }

     // DON'T
     private Promise<User> recoverNetworkError(Cause cause) {
         if (cause instanceof NetworkError.Timeout) {
             return TIMEOUT.promise();
         }
         if (cause instanceof NetworkError.Connection) {
             return UNREACHABLE.promise();
         }
         return cause.promise();
     }
     ```

7. **Extract error constants**
   - Define Cause instances as static final constants
   - Never construct inline with fixed strings
   - Example:
     ```java
     // DO
     private static final Cause TIMEOUT = new ServiceUnavailable("User service timed out");
     private static final Cause UNREACHABLE = new ServiceUnavailable("User service unreachable");

     // DON'T
     return switch (cause) {
         case NetworkError.Timeout ignored ->
             new ServiceUnavailable("Timed out").promise();
         default -> cause.promise();
     };
     ```

---

# Pragmatica Lite Core 0.9.4 API Reference

This section documents the actual API methods available in Pragmatica Lite Core 0.9.4.

**Maven:**
```xml
<dependency>
   <groupId>org.pragmatica-lite</groupId>
   <artifactId>core</artifactId>
   <version>0.9.4</version>
</dependency>
```

**Gradle:**
```gradle
implementation 'org.pragmatica-lite:core:0.9.4'
```

Library documentation: https://central.sonatype.com/artifact/org.pragmatica-lite/core

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
- `Option.from(Optional<T>)`  -  converts Java Optional to Option
- `Option.some(T value)` / `Option.present(T value)`  -  create present option
- `Option.none()` / `Option.empty()`  -  create empty option
- `Result.success(T value)` / `Result.ok(T value)`  -  create success
- `Result.unitResult()`  -  success with Unit value
- `Result.failure(Cause cause)` / `Result.err(Cause cause)`  -  create failure (prefer `cause.result()`)
- `Promise.success(T value)` / `Promise.ok(T value)`  -  resolved promise (success)
- `Promise.unitPromise()`  -  resolved promise with Unit value
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

### Result.tryOf aliases (0.9.0+):
Supplier-first signatures for exception handling:
- **`Result.tryOf(ThrowingFn0<U> supplier)`**  -  alias for `lift()` with supplier first
- **`Result.tryOf(ThrowingFn0<U> supplier, Cause cause)`**  -  fixed cause at end
- **`Result.tryOf(ThrowingFn0<U> supplier, Fn1<Cause, Throwable> mapper)`**  -  mapper at end

### Promise.lift* methods:
All accept optional `exceptionMapper: Fn1<Cause, Throwable>` (defaults to `Causes::fromThrowable`)

- **`Promise.lift(ThrowingFn0<U> supplier)`**  -  async execution, wraps exceptions
- **`Promise.lift(Fn1<Cause, Throwable> mapper, ThrowingFn0<U> supplier)`**
- **`Promise.lift(ThrowingRunnable runnable)`**  -  returns `Promise<Unit>`
- **`Promise.lift(Cause cause, ThrowingFn0<U> supplier)`**  -  fixed cause on failure
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

**Note**: There is NO `Promise.async(Runnable)` method. Use `Promise.lift(ThrowingRunnable)` for async execution of void operations.

### Causes utilities:
- **`Causes.cause(String message)`**  -  create simple cause with message
- **`Causes.cause(String message, Option<Cause> source)`**  -  create cause with source
- **`Causes.fromThrowable(Throwable throwable)`**  -  convert exception to cause (includes stack trace)
- **`Causes.forOneValue(String template)`**  -  create `Fn1<Cause, T>` factory with `String.format` template
- **`Causes.forTwoValues(String template)`**  -  create `Fn2<Cause, T1, T2>` factory
- **`Causes.forThreeValues(String template)`**  -  create `Fn3<Cause, T1, T2, T3>` factory
- **`Causes.composite(Result<?>...)`**  -  create composite cause from multiple results

**Template syntax**: Uses `String.format` placeholders (`%s`), NOT MessageFormat (`{}`):
```java
Causes.forOneValue("Invalid email: %s")           // CORRECT
Causes.forOneValue("Invalid email: {}")           // WRONG - uses MessageFormat syntax
Causes.forTwoValues("Range error: %s to %s")      // CORRECT
```

**DEPRECATED**: `Causes.forValue(String)` - use `Causes.forOneValue(String)` instead (since 0.8.2, for removal)

## Validation and Parsing Utilities

### Verify.Is Predicates

Standard validation predicates for use with `Verify.ensure()`:

**Null check:**
- `Verify.Is::notNull` - value != null

**String checks:**
- `Verify.Is::empty` - isEmpty()
- `Verify.Is::notEmpty` - !isEmpty()
- `Verify.Is::blank` - only whitespace
- `Verify.Is::notBlank` - has non-whitespace
- `Verify.Is::lenBetween` - length in range (inclusive)
- `Verify.Is::contains` - contains substring
- `Verify.Is::notContains` - doesn't contain substring
- `Verify.Is::matches` - regex match (String or Pattern)

**Numeric checks:**
- `Verify.Is::positive` - > 0
- `Verify.Is::negative` - < 0
- `Verify.Is::nonNegative` - >= 0
- `Verify.Is::nonPositive` - <= 0
- `Verify.Is::greaterThan` - > boundary
- `Verify.Is::greaterThanOrEqualTo` - >= boundary
- `Verify.Is::lessThan` - < boundary
- `Verify.Is::lessThanOrEqualTo` - <= boundary
- `Verify.Is::equalTo` - == boundary (via compareTo)
- `Verify.Is::notEqualTo` - != boundary (via compareTo)
- `Verify.Is::between` - >= min && <= max

**Option checks:**
- `Verify.Is::some` - Option.isPresent()
- `Verify.Is::none` - Option.isEmpty()

**Usage (cause-at-end aliases):**
```java
Verify.ensure(password, Verify.Is::lenBetween, 8, 128, TOO_SHORT)
Verify.ensure(age, Verify.Is::between, 0, 150, AGE_OUT_OF_RANGE)
Verify.ensure(username, Verify.Is::notBlank, BLANK_USERNAME)
```

**In validation chains (use filter):**
```java
return ensure(raw, Verify.Is::notNull)
    .map(String::trim)
    .filter(BLANK, Verify.Is::notBlank)
    .filter(INVALID_FORMAT, EMAIL_PATTERN.asMatchPredicate())
    .map(Email::new);
```

**Combining checks:**
```java
Verify.combine(
    s -> Verify.ensure(s, Verify.Is::notBlank, BLANK),
    s -> Verify.ensure(s, Verify.Is::lenBetween, 8, 128, TOO_SHORT)
)
```

### Verify.ensureOption (0.9.0+)

Validates optional values, returning `Result<Option<T>>`. If empty, succeeds with `Option.none()`. If present and valid, succeeds with `Option.some(value)`. If present and invalid, fails.

**Signatures:**
- `Verify.ensureOption(Option<T>, Predicate<T>)` → `Result<Option<T>>`
- `Verify.ensureOption(Option<T>, Predicate<T>, Cause)` → with fixed cause
- `Verify.ensureOption(Option<T>, Predicate<T>, Fn1<Cause, T>)` → with cause provider
- Binary/ternary predicate variants also available

**Usage - Result<Option<T>> pattern:**
```java
public static Result<Option<ReferralCode>> referralCode(String raw) {
    return Verify.ensureOption(
        Option.option(raw).map(String::trim).filter(s -> !s.isEmpty()),
        PATTERN.asMatchPredicate(),
        INVALID_FORMAT
    ).map(opt -> opt.map(ReferralCode::new));
}
```

**Key benefit:** Eliminates complex fold/map chains for optional validation.

### Result.sequence (0.9.0+)

Lazy sequential evaluation with short-circuit behavior. Suppliers are only invoked when terminal operation is called.

**Signatures:**
- `Result.sequence(Supplier<Result<T1>>)` → `Mapper1<T1>`
- `Result.sequence(Supplier<Result<T1>>, Supplier<Result<T2>>)` → `Mapper2<T1, T2>`
- ... up to `Mapper15` (15 suppliers)

**Usage:**
```java
Result.sequence(
    () -> validateUser(userId),
    () -> loadPermissions(userId),  // Only called if validateUser succeeds
    () -> fetchProfile(userId)      // Only called if both above succeed
).map((user, perms, profile) -> new Context(user, perms, profile))
```

**vs Result.all():** `all()` evaluates eagerly and accumulates errors. `sequence()` is lazy and short-circuits on first failure.

### Parse Subpackage - JDK Wrappers

Exception-safe wrappers for JDK parsing APIs. All return `Result<T>`.

**org.pragmatica.lang.parse.Number:**
- `Number.parseInt(String)` → `Result<Integer>`
- `Number.parseInt(String, int radix)` → `Result<Integer>`
- `Number.parseLong(String)` → `Result<Long>`
- `Number.parseLong(String, int radix)` → `Result<Long>`
- `Number.parseShort(String)` → `Result<Short>`
- `Number.parseByte(String)` → `Result<Byte>`
- `Number.parseFloat(String)` → `Result<Float>`
- `Number.parseDouble(String)` → `Result<Double>`
- `Number.parseBigInteger(String)` → `Result<BigInteger>`
- `Number.parseBigInteger(String, int radix)` → `Result<BigInteger>`
- `Number.parseBigDecimal(String)` → `Result<BigDecimal>`

**org.pragmatica.lang.parse.DateTime:**
- `DateTime.parseLocalDate(String)` → `Result<LocalDate>`
- `DateTime.parseLocalDate(String, DateTimeFormatter)` → `Result<LocalDate>`
- `DateTime.parseLocalTime(String)` → `Result<LocalTime>`
- `DateTime.parseLocalDateTime(String)` → `Result<LocalDateTime>`
- `DateTime.parseZonedDateTime(String)` → `Result<ZonedDateTime>`
- `DateTime.parseInstant(String)` → `Result<Instant>`
- `DateTime.parseOffsetDateTime(String)` → `Result<OffsetDateTime>`

**org.pragmatica.lang.parse.Network:**
- `Network.parseUUID(String)` → `Result<UUID>`
- `Network.parseURL(String)` → `Result<URL>`
- `Network.parseURI(String)` → `Result<URI>`
- `Network.parseInetAddress(String)` → `Result<InetAddress>`

**org.pragmatica.lang.parse.I18n:**
- `I18n.parseLocale(String)` → `Result<Locale>`
- `I18n.parseCurrency(String)` → `Result<Currency>`

**org.pragmatica.lang.parse.Text:**
- `Text.parseBoolean(String)` → `Result<Boolean>`

**Usage:**
```java
// Instead of: Result.lift(Integer::parseInt, raw)
Number.parseInt(raw)

// Instead of: Result.lift(UUID::fromString, raw)
Network.parseUUID(raw)

// Value object example
public record Age(int value) {
    private static final Cause AGE_OUT_OF_RANGE = Causes.cause("Age must be 0-150");

    public static Result<Age> age(String raw) {
        return Number.parseInt(raw)
            .filter(AGE_OUT_OF_RANGE, v -> Verify.Is.between(v, 0, 150))
            .map(Age::new);
    }
}
```

## Aggregation (all/any/allOf)

### Option.all (fail-fast on empty):
- `Option.all(Option<T1>)` → `Mapper1<T1>` with `.map()` / `.flatMap()`
- `Option.all(Option<T1>, Option<T2>)` → `Mapper2<T1, T2>`
- ... up to `Mapper9` (9 parameters)

### Result.all (accumulates failures in CompositeCause):
- `Result.all(Result<T1>)` → `Mapper1<T1>` with `.map()` / `.flatMap()` / `.async()`
- `Result.all(Result<T1>, Result<T2>)` → `Mapper2<T1, T2>`
- ... up to `Mapper15` (15 parameters)
- `Result.allOf(Result<T>...)` → `Result<List<T>>` (varargs)
- `Result.allOf(List<Result<T>>)` → `Result<List<T>>`

### Instance all() (for-comprehension style - 0.9.0+):
For Result, Option, and Promise - chains dependent operations with access to source value:
- `result.all(Fn1<Result<T1>, T>...)` → `Mapper1-9`
- `option.all(Fn1<Option<T1>, T>...)` → `Mapper1-9`
- `promise.all(Fn1<Promise<T1>, T>...)` → `Mapper1-9`

```java
userId.all(
    id -> fetchUser(id),
    id -> fetchProfile(id)
).map((user, profile) -> combine(user, profile))
```

### Result.sequence (0.9.0+):
- `Result.sequence(Iterable<Result<T>>)` → `Result<List<T>>` - collect all successes or first failure

### Promise.all (fail-fast on first failure):
- `Promise.all(Promise<T1>)` → `Mapper1<T1>` with `.map()` / `.flatMap()`
- `Promise.all(Promise<T1>, Promise<T2>)` → `Mapper2<T1, T2>`
- ... up to `Mapper15` (15 parameters)
- `Promise.allOf(Collection<Promise<T>>)` → `Promise<List<Result<T>>>`

### any methods:
- `Option.any(Option<T>...)`  -  first present option
- `Result.any(Result<T>...)`  -  first success result
- `Promise.any(Promise<T>...)`  -  first success promise, cancels others

### Promise-specific aggregation:
- `Promise.failAll(Collection<Promise<?>>)`  -  waits for all promises to complete, returns failure if any failed
- `Promise.cancelAll(Collection<Promise<?>>)`  -  cancels all promises in collection

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
- `.apply(Consumer<T>, Runnable)`  -  Option only: bifurcation (onPresent, onEmpty)
- `.onSuccess(Consumer<T>)`  -  Result and Promise (alias: `.onOk()`)
- `.onSuccessRun(Runnable)`  -  Result and Promise: run action on success
- `.onSuccessAsync(Consumer<T>)`  -  Promise only: async version of onSuccess
- `.onSuccessRunAsync(Runnable)`  -  Promise only: async run action on success
- `.withSuccess(Consumer<T>)`  -  Promise only: returns self for chaining
- `.onFailure(Consumer<Cause>)`  -  Result and Promise (alias: `.onErr()`)
- `.onFailureRun(Runnable)`  -  Result and Promise: run action on failure
- `.onFailureAsync(Consumer<Cause>)`  -  Promise only: async version of onFailure
- `.onFailureRunAsync(Runnable)`  -  Promise only: async run action on failure
- `.withFailure(Consumer<Cause>)`  -  Promise only: returns self for chaining
- `.onResult(Consumer<Result<T>>)`  -  Result and Promise
- `.onResultRun(Runnable)`  -  Result and Promise: run action regardless of outcome
- `.onResultAsync(Consumer<Result<T>>)`  -  Promise only: async version of onResult
- `.onResultRunAsync(Runnable)`  -  Promise only: async run action regardless of outcome
- `.withResult(Consumer<Result<T>>)`  -  Promise only: returns self for chaining
- `.apply(Consumer<T>, Consumer<Cause>)`  -  Result only: bifurcation (onSuccess, onFailure) (alias: `.run()`)
- `.fold(Fn1<R, Cause> failure, Fn1<R, T> success)`  -  Result/Promise: transform both cases (failure first, then success)
- `.fold(Supplier<R> empty, Fn1<R, T> present)`  -  Option: transform both cases (empty first, then present)

### Recovery:
- `.or(T replacement)`  -  provide fallback value
- `.or(Supplier<T> supplier)`  -  lazy fallback value
- `.orElse(M<T> replacement)`  -  fallback monadic value
- `.recover(Fn1<T, Cause> mapper)`  -  Result/Promise: recover from failure

### Promise-specific operations:
- `.resolve(Result<T>)`  -  resolve unresolved promise with result
- `.succeed(T value)`  -  resolve unresolved promise with success
- `.fail(Cause cause)`  -  resolve unresolved promise with failure
- `.succeedAsync(T value)`  -  resolve promise asynchronously
- `.failAsync(Cause cause)`  -  fail promise asynchronously
- `.cancel()`  -  cancel promise execution
- `.isResolved()`  -  check if promise has been resolved
- `.timeout(TimeSpan duration)`  -  add timeout to promise
- `.mapResult(Fn1<Result<U>, Result<T>>)`  -  transform result (both success and failure)
- `.replaceResult(Result<U>)`  -  replace result entirely
- `.mapError(Fn1<Cause, Cause>)`  -  transform error cause
- `.trace()`  -  add tracing information (class name and line number) to error cause

### Query methods:
- `.isPresent()` / `.isEmpty()`  -  Option only
- `.isSuccess()` / `.isFailure()`  -  Result only
- `.isResolved()`  -  Promise only

### Unsafe operations (avoid in production):
- `.unwrap()`  -  deprecated, throws if empty/failure (delegates to getOrThrow)
- `.expect(String message)`  -  throws with custom message if empty/failure (delegates to getOrThrow)
- `.getOrThrow(String message)`  -  throws `IllegalStateException` with context message
- `.getOrThrow(Fn1<RuntimeException, String>, String)`  -  throws custom exception type
- `.stream()`  -  converts to Java Stream (0 or 1 element)
- `.toOptional()`  -  Option only: converts to Java Optional

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
    return ValidRequest.validRequest(request)  // returns Result<ValidRequest>
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

    ValidRequest.validRequest(request)
                .onSuccess(Assertions::fail);  // Fail test if unexpectedly succeeds
}
```

**Testing successes** - use `.onFailure(Assertions::fail).onSuccess(assertions)`:
```java
@Test
void validation_succeeds_forValidInput() {
    var request = new Request("valid@example.com", "Valid1234");

    ValidRequest.validRequest(request)
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