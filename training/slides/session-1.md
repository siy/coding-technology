# Session 1: Foundations

**Duration:** 2 hours

---

## Slide 1: Welcome & Context

### What We'll Learn

1. **Why AI needs guardrails** - consistency problem
2. **Five evaluation criteria** - objective code quality
3. **Four return types** - T, Option, Result, Promise
4. **Choosing the right type** - decision tree

**Code examples:** RTB (Real-Time Bidding) domain

---

**SPEAKER NOTES:**

> Welcome. Today we start with foundations.
>
> We'll use RTB domain for examples - it's familiar to many of you and has demanding requirements. But the patterns we learn are universal.
>
> By end of session: you'll know which return type to use and why. No more guessing between Optional, exceptions, or null.

---

## Slide 2: The AI Code Quality Problem

### The Reality (2026)

- **84%** of developers use AI tools
- **46%** don't trust the output
- **41%** higher code churn from AI-generated code
- **10x** more vulnerabilities entering pipelines

### The Gap

Training teaches "how to use AI"
Nobody teaches **quality**

---

**SPEAKER NOTES:**

> Let's talk about AI. 84% of you are probably using it. But here's the problem - nearly half don't trust what it produces. Why?
>
> AI generates code that works. But "works" isn't enough. Code that works today becomes technical debt tomorrow. 41% higher churn - meaning you're rewriting AI code more often.
>
> The training market teaches prompting, tools, shortcuts. Nobody teaches how to make AI produce *good* code. That's the gap JBCT fills.

---

## Slide 3: Live Demo - Same Prompt, Different Outputs

### Prompt:
"Write a Java method to validate a bid amount"

### Output 1:
```java
public boolean isValidBid(double amount) {
    return amount > 0;
}
```

### Output 2:
```java
public static boolean validateBidAmount(Double bidAmount) {
    if (bidAmount == null) return false;
    if (bidAmount <= 0) return false;
    if (bidAmount > 1000000) return false;
    return true;
}
```

### Output 3:
```java
public Result<BidAmount> validateBid(String input) {
    // ... 20 lines with try-catch, logging, metrics
}
```

---

**SPEAKER NOTES:**

> Let me show you. Same prompt, three runs.
>
> First output: primitive double, boolean return. What if null? What about currency? Maximum bid?
>
> Second: better - null check, bounds. But still boolean. Caller has no idea *why* it failed.
>
> Third: completely different structure. Result type, string input, logging.
>
> Which is right? All three "work". But they're incompatible. Your codebase becomes a zoo of styles.
>
> **This is the core problem.** AI produces syntactically correct code without architectural consistency.

---

## Slide 4: Why AI Produces Inconsistent Code

### AI Has No Context

1. **No codebase awareness** - doesn't see your patterns
2. **No project conventions** - picks random style each time
3. **No error philosophy** - exceptions? nulls? results?
4. **No domain knowledge** - doesn't know your business rules

### The Fix

Give AI **guardrails** - explicit rules it must follow

JBCT = the guardrails

---

**SPEAKER NOTES:**

> Why does this happen? AI doesn't know your codebase. Each prompt is isolated. It doesn't know you use Result types. It doesn't know your naming conventions.
>
> More importantly, AI has no error handling philosophy. Should it throw? Return null? Return Optional? It picks randomly based on training data.
>
> The fix is constraints. Explicit rules. "Always return Result." "Never throw from business logic." "Use value objects, not primitives."
>
> That's what JBCT provides. A complete set of rules that make code predictable - whether written by human or AI.

---

## Slide 5: Five Evaluation Criteria

### How to judge code quality objectively:

| Criterion | Question |
|-----------|----------|
| **Mental Overhead** | How much context must I hold to understand this? |
| **Business/Technical Ratio** | How much is domain logic vs. plumbing? |
| **Design Impact** | Does this constrain future changes? |
| **Reliability** | How does this behave under failures? |
| **Complexity** | Can this be simpler without losing value? |

---

**SPEAKER NOTES:**

> Before we write code, let's agree on how to evaluate it. Five criteria.
>
> **Mental overhead** - read a method. How much do you need to remember? Variables, branches, possible states. Lower is better.
>
> **Business/technical ratio** - in a 10-line method, how many lines are actual business logic? If 2 lines are business and 8 are error handling boilerplate, that's a problem.
>
> **Design impact** - does this choice make other things harder? A boolean return means callers can't know why something failed.
>
> **Reliability** - what happens when things go wrong? Null? Exception? Undefined behavior?
>
> **Complexity** - simplest solution that solves the problem. No more.
>
> These aren't subjective. You can measure them. You can argue about them in code review with data.

---

## Slide 6: Applying Criteria - Boolean Returns

```java
// Evaluating: boolean isValidBid(double amount)

// Mental Overhead: LOW (simple)
// Business/Technical: HIGH (pure logic)
// Design Impact: BAD - callers can't know WHY invalid
// Reliability: BAD - no null handling, no error info
// Complexity: LOW (maybe too simple)
```

### The Problem

Caller code:
```java
if (!isValidBid(amount)) {
    // What went wrong? Too low? Too high? Null?
    // We don't know. Log generic message? Guess?
}
```

---

**SPEAKER NOTES:**

> Let's evaluate that first AI output. Boolean return.
>
> Mental overhead is low. That's good. Simple to understand.
>
> Business ratio is high. The method is pure logic. Also good.
>
> But design impact? Bad. The caller has no information about *what* went wrong. Was it null? Negative? Over limit?
>
> Reliability? No null handling. If someone passes null Double instead of double, what happens? Unboxing null - NullPointerException somewhere unexpected.
>
> The boolean looks simple but it's actually *too* simple. It pushed complexity onto callers. Every caller must guess what went wrong.

---

## Slide 7: The Four Return Types

### JBCT Rule: Every method returns one of four types

| Type | Meaning | Example |
|------|---------|---------|
| `T` | Always succeeds, always has value | `String.toUpperCase()` |
| `Option<T>` | Might be absent, absence is normal | `Map.get(key)` |
| `Result<T>` | Might fail, failure has a reason | `parseAmount("abc")` |
| `Promise<T>` | Async operation, might fail | `fetchBid(dspUrl)` |

---

**SPEAKER NOTES:**

> JBCT has a simple rule. Every method returns one of four types. No exceptions - literally.
>
> **T** - plain value. Method always succeeds, always returns something. `String.toUpperCase()` never fails.
>
> **Option** - value might be absent. Absence is *normal*, not an error. Looking up a key that doesn't exist isn't failure, it's just empty.
>
> **Result** - operation might fail with a *reason*. Parsing user input, validating business rules. Caller needs to know what went wrong.
>
> **Promise** - async. Like Result but for operations that take time. HTTP calls, database queries.
>
> That's it. Four types. If you know which type a method returns, you know how to handle it. No surprises.

---

## Slide 8: Option<T> - Absence is Normal

### When to use:
- Lookup that might not find anything
- Optional configuration
- First/last element of possibly empty collection

### Example:
```java
/// Find cached bid response for this user
Option<CachedBid> findCachedBid(UserId userId) {
    return Option.option(cache.get(userId));
}

// Usage:
findCachedBid(userId)
    .onPresent(cached -> log.debug("Cache hit for {}", userId))
    .orElse(() -> computeFreshBid(userId));
```

---

**SPEAKER NOTES:**

> Option is for "maybe there, maybe not" - and that's fine.
>
> Example: cache lookup. We might have a cached value. If we do, use it. If not, compute fresh.
>
> Notice: no null check. `Option.option()` wraps nullable value safely. Empty cache returns `Option.empty()`, not null.
>
> The `orElse` provides fallback. Clean, readable, no if-null checks scattered everywhere.
>
> Key insight: empty Option is a valid result. It's not an error. Nobody made a mistake. We just don't have that data.

---

## Slide 9: Result<T> - Failure Has a Reason

### When to use:
- Validation (bad input is expected)
- Parsing (malformed data is expected)
- Business rules (rejection is normal flow)

### Example:
```java
/// Parse bid amount from string input
Result<BidAmount> parseBidAmount(String input) {
    return Verify.ensure(
        input,
        s -> s != null && !s.isBlank(),
        BidError.EMPTY_INPUT
    ).flatMap(s ->
        Result.lift(() -> new BigDecimal(s))
              .mapError(_ -> BidError.INVALID_FORMAT)
    ).flatMap(BidAmount::bidAmount);
}
```

---

**SPEAKER NOTES:**

> Result is for "might fail, and caller needs to know why."
>
> Parsing a bid amount. Input could be null, blank, not a number, negative, over limit. Each is a different error.
>
> Look at the structure. `Verify.ensure` checks not null/blank. Returns error if fails. `flatMap` chains to next step only if previous succeeded.
>
> `Result.lift` catches exceptions from BigDecimal constructor and wraps them. We transform to our domain error.
>
> Finally, `BidAmount.bidAmount` is a factory that validates business rules - amount is positive, within limits.
>
> Caller gets either valid BidAmount or specific error. Not a boolean. Not an exception. Structured information.

---

## Slide 10: Result<T> - Handling Failures

```java
// Caller code - three patterns:

// Pattern 1: Transform on success, propagate failure
Result<Bid> bid = parseBidAmount(input)
    .map(amount -> Bid.create(advertiserId, amount));

// Pattern 2: Provide fallback
BidAmount amount = parseBidAmount(input)
    .orElse(BidAmount.MINIMUM);

// Pattern 3: Handle both cases
parseBidAmount(input)
    .onSuccess(amount -> metrics.recordBid(amount))
    .onFailure(error -> metrics.recordRejection(error));
```

---

**SPEAKER NOTES:**

> Three common patterns for handling Result.
>
> **Transform**: `map` applies function only if success. Error propagates unchanged. Clean pipeline, no if-else.
>
> **Fallback**: `orElse` provides default when failed. Use when you have a sensible default. In bidding, maybe minimum bid is acceptable.
>
> **Handle both**: `onSuccess` and `onFailure` for side effects - logging, metrics. Both methods return the original Result, so you can chain them.
>
> Notice what's missing? No try-catch. No null checks. No `if (result.isSuccess())`. The type system guides you to handle both cases.

---

## Slide 11: Promise<T> - Async with Same Semantics

### When to use:
- HTTP calls (DSP queries)
- Database operations
- Any I/O that takes time

### Example:
```java
/// Query DSP for bid
Promise<BidResponse> queryDsp(DspEndpoint dsp, BidRequest request) {
    return httpClient.post(dsp.url(), request)
        .timeout(Duration.ofMillis(50))
        .map(BidResponse::fromJson)
        .mapError(_ -> DspError.TIMEOUT);
}
```

---

**SPEAKER NOTES:**

> Promise is Result that takes time. Same semantics - success or failure with reason. But async.
>
> Any I/O operation needs this. HTTP calls, database queries. Some succeed, some timeout.
>
> Same operators: `map`, `flatMap`, `mapError`, `onSuccess`, `onFailure`. You already know them from Result.
>
> The `.timeout()` is critical for external calls. If service doesn't respond in time, treat as failure. Don't wait forever.
>
> Key point: same mental model for sync and async. Learn Result, you know Promise.

---

## Slide 12: Promise<T> - Parallel Operations

```java
/// Query all DSPs in parallel, collect successful bids
Promise<List<Bid>> queryAllDsps(BidRequest request) {
    List<Promise<Bid>> queries = dsps.stream()
        .map(dsp -> queryDsp(dsp, request))
        .toList();

    return Promise.allSuccesses(queries);
}
```

### What happens:
- All DSPs queried simultaneously
- Each has independent timeout
- Failed/slow DSPs ignored
- Returns list of successful responses

---

**SPEAKER NOTES:**

> Many systems require parallel queries. You can't call 10 services sequentially when you have time constraints.
>
> `Promise.allOf` collects results from all promises. You filter successes after. Perfect when you want as many results as possible but don't block on slow services.
>
> Alternative: `Promise.all()` fails if any fails. Use when you need all-or-nothing.
>
> This is Fork-Join pattern. We'll cover it in Session 3. For now, notice how simple parallel async becomes with Promise.

---

## Slide 13: Choosing the Right Return Type

### Decision Tree:

```
Can the operation fail?
├── No → Return T
└── Yes → Is failure exceptional or expected?
    ├── Expected (validation, parsing) → Result<T>
    └── Is it async?
        ├── Yes → Promise<T>
        └── No → Is absence an error?
            ├── No (lookup miss is fine) → Option<T>
            └── Yes (missing = problem) → Result<T>
```

---

**SPEAKER NOTES:**

> How do you choose? Simple decision tree.
>
> Can it fail? No? Return plain T. `String.length()` always works.
>
> Can fail, is it async? Use Promise.
>
> Sync failure - is missing value an error or just "not found"?
>
> Cache lookup: not found is fine → Option.
> Config loading: missing is error → Result.
> User input validation: invalid is expected → Result.
>
> The key question: does the caller need to know *why* it failed, or just that it's absent? Need the why → Result. Just absent → Option.

---

## Slide 14: Example Domain Model

### Core Types We'll Build:

```java
// Value objects (Session 2)
record UserId(String value) { }
record BidAmount(BigDecimal value) { }
record AdPlacement(String siteId, String slotId) { }

// Requests/Responses
record BidRequest(UserId user, AdPlacement placement, Instant deadline) { }
record BidResponse(BidAmount amount, String adMarkup) { }

// Errors (sealed interface)
sealed interface BidError extends Cause {
    record InvalidAmount(String input) implements BidError { }
    record Timeout(Duration elapsed) implements BidError { }
    record NoBids() implements BidError { }
}
```

---

**SPEAKER NOTES:**

> Here's our example domain model. We'll build this over four sessions.
>
> Value objects: UserId, BidAmount, AdPlacement. Not primitives. Not Strings. Types with meaning and validation.
>
> BidError is a sealed interface. Only these three error types exist. Compiler enforces you handle all cases.
>
> Session 2 deep dives into value objects. Session 3 into patterns for composing operations. Today we set the foundation.
>
> The patterns apply to any domain - the RTB example just gives us concrete code to work with.

---

## Slide 15: Exercise Setup

### Your Task (15 minutes):

1. Clone the training repo
2. Open `session-1-foundations`
3. Find `BidAmountExercise.java`
4. Implement `parseBidAmount(String input)`

### Requirements:
- Return `Result<BidAmount>`
- Reject: null, blank, non-numeric, negative, over 10000
- Each rejection has specific error

### Run: `mvn test -pl session-1-foundations`

---

**SPEAKER NOTES:**

> Exercise time. Open session-1-foundations module.
>
> Implement parseBidAmount. Take string input, return Result of BidAmount.
>
> Requirements on screen. Null, blank, non-numeric - invalid input. Negative, over 10000 - business rules.
>
> Each case needs its own error. Don't just return "invalid". Tell caller what's wrong.
>
> Tests are provided. Run with maven. Green means you're done.
>
> I'll walk around if you have questions. 15 minutes.

---

## Slide 16: Exercise Review

### Common Approaches:

**Approach 1: Chained flatMap**
```java
Result<BidAmount> parseBidAmount(String input) {
    return Verify.ensure(input, Objects::nonNull, EMPTY_INPUT)
        .flatMap(s -> Verify.ensure(s, str -> !str.isBlank(), EMPTY_INPUT))
        .flatMap(s -> Result.lift(() -> new BigDecimal(s))
                           .mapError(_ -> INVALID_FORMAT))
        .flatMap(BidAmount::bidAmount);
}
```

**Approach 2: all() composition** (preview of Session 3)
```java
Result<BidAmount> parseBidAmount(String input) {
    return Verify.ensure(input, Objects::nonNull, EMPTY_INPUT)
        .all(s -> Verify.ensure(s, str -> !str.isBlank(), EMPTY_INPUT))
        .map((_, s) -> s)  // take second (non-blank string)
        .flatMap(s -> Result.lift(() -> new BigDecimal(s))
                           .mapError(_ -> INVALID_FORMAT))
        .flatMap(BidAmount::bidAmount);
}
```

---

**SPEAKER NOTES:**

> Let's review. Two common approaches.
>
> Chained flatMap: each step returns Result. flatMap continues only on success. Error stops the chain.
>
> `all()` composition: combines multiple validations, gives you access to all intermediate values. Preview of patterns in Session 3.
>
> Both work. flatMap is more linear. `all()` is better when you need values from multiple steps.
>
> Key observation: no if-else. No try-catch. The structure *is* the error handling.

---

## Slide 17: Key Takeaways

### Session 1 Summary:

1. **AI generates inconsistent code** - needs guardrails
2. **Five criteria** - Mental Overhead, Business/Tech Ratio, Design Impact, Reliability, Complexity
3. **Four return types** - T, Option, Result, Promise
4. **Choose type by failure mode** - can it fail? is failure expected? is it async? is absence an error?
5. **Result chains** - flatMap, map, onSuccess, onFailure

### Next Session:
**Parse Don't Validate** - value objects that enforce invariants

---

**SPEAKER NOTES:**

> Let's recap. AI needs guardrails. JBCT provides them.
>
> Five criteria for evaluating code. Use them in code review. Make discussions objective.
>
> Four return types. The signature tells you how to handle it. No surprises, no checking documentation.
>
> Choose type by failure semantics. Decision tree is your guide.
>
> Result chains replace try-catch. Cleaner, composable, type-safe.
>
> Next session: Parse Don't Validate. We'll build proper value objects. BidAmount that cannot be invalid. UserId that's always correct. The compiler becomes your validator.
>
> Questions?

---

## Slide 18: Homework

### Before Session 2:

1. **Read** book chapters 1-3
2. **Run** `jbct check` on session-1 module
3. **Refactor** one method in your real codebase:
   - Find a method returning boolean/null
   - Convert to Result<T> or Option<T>
   - Note what became clearer

### Bring to Session 2:
Your refactored method for discussion

---

**SPEAKER NOTES:**

> Homework. Read chapters 1-3 in the book. Foundation material.
>
> Run jbct check on the session-1 module. See how the linter validates code.
>
> Most important: find one real method in your codebase. Something returning boolean or null. Convert it. Bring it to next session.
>
> Real code, real context. We'll discuss your examples. What got clearer? What was harder than expected?
>
> See you in Session 2.
