# Part 1: Introduction & Foundations

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 1 of 6 | **Next:** [Part 2: Core Principles](part-02-core-principles.md)

---

## Introduction: Code in a New Era

Software development is changing faster than ever. AI-powered code generation tools have moved from experimental novelty to daily workflow staple in just a few years. We now write code alongside - and increasingly with - intelligent assistants that can generate entire functions, refactor modules, and suggest architectural patterns. This shift creates new challenges that traditional coding practices weren't designed to handle.

Historically, code has carried a heavy burden of personal style. Every developer brings preferences about naming, structure, error handling, and abstraction. Teams spend countless hours in code review debating subjective choices. Style guides help, but they can't capture the deeper structural decisions that make code readable or maintainable. When AI generates code, it inherits these same inconsistencies - we just don't know whose preferences it's channeling or why it made particular choices.

This creates a context problem. When you read AI-generated code, you're reverse-engineering decisions made by a model trained on millions of examples with conflicting styles. When AI reads your code to suggest changes, it must infer your intentions from the structure that may not clearly express them. The cognitive overhead compounds: developers burn mental cycles translating between their mental model, the code's structure, and what the AI "thinks" the code means.

Meanwhile, technical debt accumulates silently. Small deviations from the good structure - a validation check here, an exception there, a bit of mixed abstraction levels - seem harmless in isolation. But they compound. Refactoring becomes risky. Testing becomes difficult. The codebase becomes a collection of special cases rather than a coherent system.

> Traditional approaches don't provide clear, mechanical rules for when to refactor or how to structure new code, so these decisions remain subjective and inconsistent.

This technology proposes a different approach: **reduce the space of valid choices until there's essentially one good way to do most things**. Not through rigid frameworks or heavy ceremony, but through a small set of rules that make structure predictable, refactoring mechanical, and business logic clearly separated from technical concerns.

The benefits compound:

**Unified structure** means humans can read AI-generated code without guessing about hidden assumptions, and AI can read human code without inferring structure from context. A use case looks the same whether you wrote it, your colleague wrote it, or an AI assistant generated it. The structure carries the intent.

**Minimal technical debt** emerges naturally because refactoring rules are built into the technology. When a function grows beyond one clear responsibility, the rules tell you exactly how to split it. When a component gets reused, there's one obvious place to move it. Debt doesn't accumulate because prevention is cheaper than cleanup.

**Close business modeling** happens when you're not fighting technical noise. Value objects enforce domain invariants at construction time. Use cases read like business processes because each step does one thing. Errors are domain concepts, not stack traces. Product owners can read the code structure and recognize their requirements.

**Requirement discovery** becomes systematic. When you structure code as validation → steps → composition, gaps become obvious. Missing validation rules surface when you define value objects. Unclear business logic reveals itself when you can't name a step clearly. Edge cases emerge when you model errors as explicit types. The structure itself asks the right questions: What can fail here? What invariants must hold? What happens when this is missing? Validating answers for compatibility is mechanical - if a new requirement doesn't fit the existing step structure, you know immediately whether it's a new concern or a modification to existing logic.

**Asking correct questions** becomes easy because the technology provides a framework for inquiry. When discussing requirements with domain experts, you can ask: "What validation rules apply to this field?" (maps to value object factories). "What happens if this step fails?" (maps to error types). "Can these operations run in parallel?" (maps to Fork-Join vs. Sequencer). "Is this value optional or required?" (maps to `Option<T>` vs `T`). The questions are grounded in structure, not abstraction, so answers are concrete and immediately implementable.

**Business logic as a readable language** happens when patterns become vocabulary. The four return types, parse-don't-validate, and the fixed pattern catalog form a Business Logic Expression Language - a consistent way to express domain concepts in code. When you use the same patterns everywhere, business logic becomes immediately apparent in all necessary details. The structure itself tells the story: a Sequencer shows process steps, Fork-Join reveals parallel operations, `Result<Option<T>>` declares "optional but must be valid when present." Anyone who somewhat understands the domain can pick up a new codebase virtually instantly. No more narrow specializations where only one developer understands "their" module. A large part of the code becomes universally readable. Fresh onboarding happens in days, not months - developers spend time learning the domain, not deciphering structural choices.

**Tooling and automation** become dramatically simpler when the structure is predictable. Code generators don't need to infer patterns - there's one pattern for validation, one for composition, one for error handling. Static analysis can verify properties mechanically: does this function return exactly one of the four allowed types? Does validation happen before construction? Are errors properly typed? AI assistants can generate more accurate code because the target structure is well-defined and consistent.

**Deterministic code generation** becomes possible when the mapping from requirements to code is mechanical. Given a use case specification - inputs, outputs, validation rules, steps - there's essentially one correct structure. Different developers (or AI assistants) should produce nearly identical implementations. This isn't about stifling creativity; it's about channeling creativity into business logic rather than structural decisions.

This guide presents the complete technology: the rules, the patterns, the rationale, and the practices. It's framework-agnostic by design - these principles work whether you're building REST APIs with Spring, message processors with plain Java, or anything in between. The framework lives at the edges; the business logic remains pure, testable, and independent.

We'll start with core concepts - the building blocks that make everything else possible. Then we'll explore the pattern catalog that covers almost every situation you'll encounter. A detailed use case walkthrough shows how the pieces fit together. Framework integration demonstrates how to bridge this functional core to the imperative world of web frameworks and databases. Finally, we'll examine common mistakes and how to avoid them.

The goal isn't to give you more tools. It's to give you fewer decisions to make, so you can focus on the problems that actually matter.

---

## Foundational Concepts: Understanding the Building Blocks

Before diving into the technology's specific rules and patterns, let's establish the fundamental concepts. If you're new to functional programming, this section explains the core ideas in plain language. If you're experienced, feel free to skim - but these definitions frame how we'll use these concepts throughout the series.

### What Are Side Effects?

A **side effect** is anything a function does beyond computing and returning a value:

- Writing to a database
- Making an HTTP call
- Writing to a file
- Printing to console
- Modifying a global variable
- Throwing an exception

**Pure function** (no side effects):
```java
public int add(int a, int b) {
    return a + b;  // Only computes and returns
}
```

**Impure function** (has side effects):
```java
public void saveUser(User user) {
    database.save(user);  // Side effect: modifies external state
    logger.info("User saved");  // Side effect: writes to log
}
```

Why care? **Pure functions are predictable**: same inputs always produce same output. They're easy to test (no mocking needed) and safe to run anywhere, anytime.

**Impure functions are necessary** - your app must interact with the world - but they're **unpredictable**: network might fail, disk might be full, database might be down.

The technology's approach: **push side effects to the edges**. Keep business logic pure. Isolate impure operations in adapter leaves. This makes your core logic easy to test and reason about.

### What Is Composition?

**Composition** means building complex operations by combining simpler ones.

Traditional imperative style:
```java
public String processUser(String email) {
    String trimmed = email.trim();
    String lowercase = trimmed.toLowerCase();
    String validated = validate(lowercase);
    String saved = save(validated);
    return saved;
}
```

Functional composition:
```java
public Result<String> processUser(String email) {
    return Result.success(email)
        .map(String::trim)
        .map(String::toLowerCase)
        .flatMap(this::validate)
        .flatMap(this::save);
}
```

The second version **chains** operations. Each step takes the output of the previous step as input. The data flows through a pipeline.

Why this matters: composition lets you **build complex logic from simple pieces** without intermediate variables or explicit error checking at each step. The structure itself handles error propagation.

### What Are Smart Wrappers?

In JBCT, we use **Smart Wrappers**—types that wrap values and control how operations are applied to them.

> **Note:** In functional programming, these are called *monads*. You'll see both terms used throughout this series, with "Smart Wrapper" being more common early on and "monad" becoming more frequent later. By the end, you'll be comfortable with the correct FP terminology.

**A Smart Wrapper controls when and if your operations run.**

#### The Key Insight: Inversion of Control

Traditional code: **you** decide when to do something.
Smart Wrapper code: **the wrapper** decides when to do something.

Think: "Do this operation, **if/when the value is available**."

```java
// Traditional: YOU check, YOU decide
String result;
if (email != null) {
    String trimmed = email.trim();
    if (isValid(trimmed)) {
        result = save(trimmed);
        if (result == null) {
            // Error: save failed
        }
    } else {
        // Error: invalid
    }
} else {
    // Error: null input
}

// Smart Wrapper: WRAPPER checks, WRAPPER decides
Result<String> result = Result.success(email)
    .map(String::trim)          // "Trim, if value is present"
    .flatMap(this::validate)    // "Validate, if trim succeeded"
    .flatMap(this::save);       // "Save, if validate succeeded"
```

You're saying: "Here's what to do with the value... **if** you have one and **when** you're ready."

The Smart Wrapper decides:
- **Option**: "I'll apply your operation **if** the value is present"
- **Result**: "I'll apply your operation **if** there's no error so far"
- **Promise**: "I'll apply your operation **when** the async result arrives"

#### The "Do, If/When Available" Mental Model

```java
// Option: "Do this, IF value is present"
Option<User> user = findUser(id);
Option<String> email = user.map(User::email);
// You: "Extract email"
// Option: "OK, I'll do that IF I have a user. I don't? Then I won't."

// Result: "Do this, IF no error yet"
Result<Email> email = Email.email(raw);
Result<User> user = email.flatMap(this::findByEmail);
// You: "Find user by email"
// Result: "OK, I'll do that IF email is valid. It failed? Then I skip this."

// Promise: "Do this, WHEN result arrives"
Promise<User> user = fetchUser(id);
Promise<Profile> profile = user.flatMap(this::loadProfile);
// You: "Load profile"
// Promise: "OK, I'll do that WHEN the user fetch completes. Not done? I'll wait."
```

#### Why This Matters

Without Smart Wrappers, **you** write control flow:
```java
if (email != null) {
    if (isValid(email)) {
        if (save(email) != null) {
            // success
        }
    }
}
```

With Smart Wrappers, **you describe transformations**, the wrapper handles control flow:
```java
Result.success(email)
    .flatMap(this::validate)
    .flatMap(this::save);
// "Validate, then save - but only if each step succeeds"
```

**Key insight**: Smart Wrappers (monads) invert control. Instead of you checking conditions and deciding what to run, you give the wrapper a chain of operations and it decides when/if to run them based on its rules (presence, success, completion).

Common Smart Wrappers you'll use:
- **Option<T>**: Runs operations **if** value is present (handles "might be missing")
- **Result<T>**: Runs operations **if** no error yet (handles "might fail")
- **Promise<T>**: Runs operations **when** result arrives (handles "happens later")

Each Smart Wrapper has:
- **map**: "Transform the value, if/when available"
- **flatMap**: "Chain another operation, if/when the current one succeeds"

**These concepts become practical in Part 2** when working with map/flatMap composition for validation and error handling.

> **Try It Now:** Before moving to Part 2, look at your current codebase:
> - Find one place that uses `orElse(null)` with `Optional`. Consider how `Option` would make that type-safe.
> - Find one method that throws exceptions for business failures. Think about how `Result<T>` would make those failures explicit in the type signature.
> - Find one async operation using `CompletableFuture`. Notice the complexity of error handling—`Promise<T>` will simplify that in Part 3.
>
> Don't change anything yet—just observe the patterns. Part 2 will show you how to refactor them.

### Why "Functional" Composition?

Traditional object-oriented programming **hides data inside objects** and exposes behavior through methods:

```java
class User {
    private String email;

    public void setEmail(String email) {
        this.email = email;  // Mutates state
    }
}
```

Functional programming **makes data transparent** and treats functions as transformations:

```java
public record User(UserId id, Email email, UserName name, Status status) {  // Immutable data with value objects
    public User withEmail(Email newEmail) {
        return new User(id, newEmail, name, status);  // Returns new instance, other fields unchanged
    }

    public User withStatus(Status newStatus) {
        return new User(id, email, name, newStatus);  // Only status changed
    }
}
```

Benefits:
- **No hidden state**: You see all data in the type signature
- **No mutation**: Original values never change, eliminating whole classes of bugs
- **Easier reasoning**: Function output depends only on inputs, not hidden state

This technology uses functional principles:
- **Immutable data**: Records, not mutable classes
- **Pure functions**: Computation separate from side effects
- **Explicit effects**: Return types declare what can happen (Option, Result, Promise)

But it's **pragmatic functional programming**: we use Java, we integrate with imperative frameworks, we don't chase theoretical purity. The goal is **predictable structure**, not functional programming orthodoxy.

### Mental Model: Pipes and Values

Think of your code as a series of **pipes** through which **values** flow:

```java
// Water (value) flows through pipes (functions)
public Result<Response> execute(Request request) {
    return ValidRequest.validRequest(request)     // Pipe 1: validation
        .flatMap(this::checkPermissions)      // Pipe 2: authorization
        .flatMap(this::processRequest)        // Pipe 3: business logic
        .flatMap(this::saveResult)            // Pipe 4: persistence
        .map(this::buildResponse);            // Pipe 5: formatting
}
```

Each pipe:
- Takes input from the previous pipe
- Transforms it
- Passes output to the next pipe

If any pipe "leaks" (returns a failure), **the flow stops** and the error propagates to the end.

This mental model makes code structure **visual and predictable**:
- Linear flow: top to bottom
- No hidden branching: if you see 5 steps, there are 5 steps
- Error handling: automatic, not scattered through if-checks

### Immutability and Thread Confinement

This technology's thread safety guarantees rest on one critical requirement: **all input data passed to operations must be treated as immutable and read-only**. This isn't about dogmatic functional purity - it's about maintaining safety guarantees that make concurrent code predictable.

**Thread confinement** (i.e., data accessed by exactly one thread) is the key safety mechanism. When data stays within a single operation's scope, mutable state is safe. When data crosses operation boundaries - especially with patterns that enable parallelism - it must be immutable.

**What MUST be immutable:**
- Data passed between parallel operations (Fork-Join pattern - see Part 4)
- Input parameters to any operation (read-only contract)
- Response types returned from use cases (may be cached/reused)
- Value objects used as map keys or in collections
- Data crossing Promise boundaries when parallel execution is possible

**What CAN be mutable (thread-confined):**
- Local state within single operation (accumulators, builders)
- Working objects within adapter boundaries (before domain conversion)
- State confined to sequential patterns (Leaf, Sequencer, Iteration steps)

**Example - Safe local mutable state:**
```java
private DiscountResult applyRules(Cart cart, List<DiscountRule> rules) {
    var mutableCart = cart.toMutable();  // Local working copy
    var applied = new ArrayList<>();     // Local accumulator

    for (var rule : rules) {
        applied.add(rule.apply(mutableCart));
    }

    return new DiscountResult(
        mutableCart.toImmutable(),  // Immutable result
        List.copyOf(applied)
    );
}
```

**Why safe:** `mutableCart` and `applied` are local variables, thread-confined to this method. Input `cart` remains unmodified (read-only). Result is immutable.

**Key principle:** Mutability is safe when state is **thread-confined** (accessed by single thread). Sequential patterns (Sequencer, Leaf, Iteration) guarantee isolation between steps, making local mutable state safe within each step. Parallel patterns (Fork-Join) require immutable inputs because no such isolation exists.

Detailed pattern-specific safety rules are covered in Part 3 and Part 4. For now, remember: **input data is read-only, local working data can be mutable, output data is immutable**.

---

## Why This Technology Works: The Evaluation Framework

Before diving into patterns, understand how we evaluate every decision in this technology. Traditional "best practices" rely on subjective "readability" - but what does that mean? This technology uses five objective criteria:

1. **Mental Overhead** - "Don't forget to..." and "Keep in mind..." items you must track. Lower is better.

2. **Business/Technical Ratio** - Domain concepts vs framework/infrastructure noise. Higher domain visibility is better.

3. **Design Impact** - Does an approach enforce good patterns or allow bad ones? Improves consistency or breaks it?

4. **Reliability** - Does the compiler catch mistakes, or must you remember? Type safety eliminates bug classes.

5. **Complexity** - Number of elements, connections, and hidden coupling. Fewer moving parts are better.

These aren't preferences - they're measurable. When we say "don't use business exceptions," we prove it:
- **Mental Overhead**: Checked exceptions pollute signatures; unchecked are invisible (+2 for Result)
- **Reliability**: Exceptions bypass type checker; Result makes failures explicit (+1 for Result)
- **Complexity**: Exception hierarchies create coupling (+1 for Result)

### Example: Applying the Criteria

**Question:** Should we use `@Transactional` annotation or explicit transaction management in use cases?

**Analysis using the five criteria:**

1. **Mental Overhead:**
   - `@Transactional`: Invisible behavior - must remember that methods run in transactions, requires understanding proxy mechanics, can fail silently if applied to private methods
   - Explicit: Transaction boundaries are visible in code - you see exactly where they start/end
   - **Score: +2 for explicit** (less to remember)

2. **Business/Technical Ratio:**
   - Both approaches are technical infrastructure, neither is more "business" than the other
   - **Score: 0** (neutral)

3. **Design Impact:**
   - `@Transactional`: Couples business logic to Spring framework, makes code framework-dependent
   - Explicit: Business logic stays framework-agnostic, transactions applied at assembly/adapter layer
   - **Score: +2 for explicit** (better separation of concerns)

4. **Reliability:**
   - `@Transactional`: Fails silently in some cases (private methods, self-invocation), runtime errors only
   - Explicit: Compiler errors if you forget transaction handling in adapter
   - **Score: +1 for explicit** (more reliable)

5. **Complexity:**
   - `@Transactional`: Hidden control flow - method entry/exit triggers transaction logic you don't see
   - Explicit: Control flow is visible - you see transaction begin/commit/rollback in code
   - **Score: +1 for explicit** (less hidden behavior)

**Verdict: Use explicit transaction management (Aspect pattern in Part 4)**
- Mental Overhead: +2
- Business/Technical Ratio: 0
- Design Impact: +2
- Reliability: +1
- Complexity: +1
- **Total: +6 points for explicit**

This is how every decision in JBCT is made—not based on opinion, but on measurable impact across five dimensions.

Throughout the series, major rules reference these criteria. They replace endless "best practices" with five measurable standards.

---

## What You'll Learn in This Series

This series teaches you a complete technology for writing backend Java code. By the end, you'll know:

### Part 2: Core Principles
- The four return types that handle every scenario (T, Option, Result, Promise)
- How to make invalid states unrepresentable (parse-don't-validate)
- Why business logic never throws exceptions
- How to compose operations without nesting complexity

### Part 3: Basic Patterns & Structure
- The two structural rules that prevent most bugs
- Five patterns that cover 80% of daily coding
- How to refactor mechanically when patterns don't match
- When to extract functions and where to put them

### Part 4: Advanced Patterns & Testing
- The Sequencer pattern that structures 90% of business logic
- Fork-Join for parallel operations
- How to add cross-cutting concerns without mixing responsibilities
- Testing functional code with simple, readable assertions

### Part 5: Building Production Systems
- Complete use case from requirements to production code
- How to organize packages and modules
- Integrating with Spring Boot, JOOQ, and other frameworks
- Where to go next

### What You Won't Learn

This isn't a general functional programming tutorial. We don't cover:
- Category theory or abstract mathematics
- Every possible functional pattern (just the ones you need)
- Pure functional languages (this is pragmatic Java)
- Reactive programming frameworks (though the concepts apply)

The goal: **teach you enough to build production backend systems with predictable structure, minimal debt, and optimal AI collaboration**.

---

## Who Should Use This Technology?

**You should use this if:**
- You're building backend services (REST APIs, microservices, batch processors)
- You want code that's easy for new team members to understand
- You're working with AI coding assistants and want generated code to match your structure
- You value testability and want to minimize mocking
- You're tired of architectural debates and want mechanical rules

**This might not fit if:**
- You're building UI applications (different concerns, different patterns)
- You need extreme performance optimization (the technology adds some abstraction overhead)
- Your team is heavily invested in a conflicting architecture (migration cost might be high)
- You prefer object-oriented design with mutable state (this is fundamentally different)

**Your background:**
- **Junior developers**: Start here! The foundations section above gives you everything needed. Read sequentially, try the examples.
- **Mid-level developers**: The patterns will feel familiar but more structured. Focus on why rules are mechanical, not just what they are.
- **Senior developers**: If you know functional programming, skim Part 1-2 and focus on Part 3-5 for pattern specifics and integration.

---

## How to Use This Series

**Sequential learning** (recommended for most readers):
1. Read Part 1 (you're here!) to understand why and build foundations
2. Read Part 2 to master the core principles
3. Read Part 3 to learn basic patterns
4. Read Part 4 to compose patterns into real workflows
5. Read Part 5 to see complete production examples

**Reference use**:
- Bookmark the [Series Index](INDEX.md) for quick topic lookup
- Use the [Complete Technical Guide](../CODING_GUIDE.md) for API reference
- Jump to specific parts when you need pattern examples

**Practical application**:
- After Part 2: Try converting a simple function to use Result<T>
- After Part 3: Refactor a small module to follow Single Level of Abstraction
- After Part 4: Implement a complete use case with Sequencer pattern
- After Part 5: Structure a new service using vertical slicing

---

## Prerequisites

You should be comfortable with:
- **Java basics**: classes, interfaces, methods, generics
- **Modern Java features**: records (Java 14+), switch expressions (Java 14+), pattern matching helpful
- **Backend concepts**: REST APIs, databases, basic architecture

You don't need:
- Functional programming experience (we'll teach you)
- Advanced Java knowledge (streams help but aren't required)
- Specific framework expertise (examples use Spring/JOOQ but principles are framework-agnostic)

---

## Setting Up

This series uses **Pragmatica Lite Core** library for the four return types (Option, Result, Promise) and related utilities.

Add to your `pom.xml`:
```xml
<dependency>
   <groupId>org.pragmatica-lite</groupId>
   <artifactId>core</artifactId>
   <version>0.8.3</version>
</dependency>
```

Or Gradle:
```gradle
implementation 'org.pragmatica-lite:core:0.8.3'
```

Library documentation: https://central.sonatype.com/artifact/org.pragmatica-lite/core

---

## Quick Reference

This section provides at-a-glance reference for the core concepts you'll learn throughout the series. Bookmark this page for quick lookup while coding.

### The Four Return Kinds

Every function returns exactly one of these:

| Type | Meaning | Use When | Example |
|------|---------|----------|---------|
| `T` | Sync, can't fail, always present | Pure computation | `String initials()` |
| `Option<T>` | Sync, can't fail, may be absent | Optional value | `Option<Theme> findTheme()` |
| `Result<T>` | Sync, can fail (validation/business) | Validation, business rules | `Result<Email> email(String)` |
| `Promise<T>` | Async, can fail (I/O/external) | Database, HTTP, file I/O | `Promise<User> loadUser()` |

**Critical:** Never `Promise<Result<T>>` - Promise already handles failures.

### Pattern Decision Tree

Choose your pattern based on the situation:

```
Is this a single atomic operation?
├─ Yes → Leaf pattern
└─ No → Does it involve multiple operations?
    ├─ Yes → Are they independent (can run in parallel)?
    │   ├─ Yes → Fork-Join pattern
    │   └─ No → Sequencer pattern
    └─ No → Does it branch based on condition?
        ├─ Yes → Condition pattern
        └─ No → Does it process a collection?
            ├─ Yes → Iteration pattern
            └─ No → Need cross-cutting concerns? → Aspects pattern
```

### Core Principles Summary

**Parse, Don't Validate:**
```java
// Factory method validates, constructor is private
public record Email(String value) {
    public static Result<Email> email(String raw) {
        return validate(raw).map(Email::new);
    }
}
```

**No Business Exceptions:**
```java
// Errors are typed values, not thrown
public sealed interface UserError extends Cause {
    enum NotFound implements UserError { INSTANCE; }
    record InvalidEmail(String value) implements UserError {}
}
```

**Single Level of Abstraction:**
```java
// ✅ Lambdas contain only method references
.flatMap(this::validateInput)
.flatMap(this::processPayment)

// ❌ No complex logic in lambdas
.flatMap(user -> { /* nested logic */ })  // WRONG
```

### Common Type Transformations

Moving between the four return types:

```java
// Option → Result
option.toResult(cause)        // or .await(cause)

// Option → Promise
option.async(cause)

// Result → Promise
result.async()

// Promise → Result (blocking - use with caution)
promise.await()
promise.await(timeout)

// Cause → Result/Promise (prefer over constructors)
cause.result()                // Recommended
cause.promise()               // Recommended
```

### Aggregation Quick Reference

Combining multiple operations:

```java
// Result.all - Accumulates ALL failures
Result.all(result1, result2, result3)
    .map((v1, v2, v3) -> combine(v1, v2, v3));

// Promise.all - Fail-fast on FIRST failure
Promise.all(promise1, promise2, promise3)
    .map((v1, v2, v3) -> combine(v1, v2, v3));

// Option.all - Fail-fast on FIRST empty
Option.all(opt1, opt2, opt3)
    .map((v1, v2, v3) -> combine(v1, v2, v3));
```

### Naming Conventions

```java
// Factory methods: TypeName.typeName
Email.email(raw)
Password.password(raw)

// Validated inputs: Valid prefix
record ValidRequest(Email email, Password password) {}

// Step interfaces (Zone 2): orchestration verbs
interface ValidateInput { ... }
interface ProcessPayment { ... }

// Leaves (Zone 3): implementation verbs
private Hash hashPassword(Password pwd) { ... }
private Data fetchFromCache(Key key) { ... }

// Tests: methodName_outcome_condition
void email_fails_forInvalidFormat() {}
```

### Project Structure (Vertical Slicing)

```
com.example.app/
├── usecase/
│   ├── registeruser/         # Self-contained slice
│   │   ├── RegisterUser.java # Use case + factory
│   │   └── [internal types]  # Steps, errors, validated inputs
│   └── loginuser/
│       └── LoginUser.java
├── domain/
│   └── shared/               # Reusable value objects ONLY
│       ├── Email.java
│       └── UserId.java
└── adapter/
    ├── rest/                 # Inbound adapters
    ├── persistence/          # Outbound adapters
    └── messaging/
```

**Placement Rule:** If used by single use case → inside use case package. If used by 2+ → `domain/shared/`.

### Testing Pattern

```java
// Test failures
@Test
void validation_fails_forInvalidInput() {
    ValidRequest.validRequest(badRequest)
        .onSuccess(Assertions::fail);
}

// Test successes
@Test
void validation_succeeds_forValidInput() {
    ValidRequest.validRequest(goodRequest)
        .onFailure(Assertions::fail)
        .onSuccess(valid -> assertEquals(...));
}

// Async tests
@Test
void execute_succeeds_forValidInput() {
    useCase.execute(request)
        .await()
        .onFailure(Assertions::fail)
        .onSuccess(response -> assertEquals(...));
}
```

### When to Use Each Pattern

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Leaf** | Single operation | Hash password, calculate total, query database |
| **Sequencer** | Dependent steps (A→B→C) | Validate → save → notify |
| **Fork-Join** | Independent parallel ops | Load user + orders + notifications |
| **Condition** | Branching logic | Premium vs basic user processing |
| **Iteration** | Process collection | Validate list of items |
| **Aspects** | Cross-cutting concerns | Retry, timeout, metrics, logging |

This reference covers the essentials. Each topic is explained in depth in subsequent parts. Refer back here when you need a quick reminder.

---

## Key Principles to Remember

As you progress through this series, keep these principles in mind:

1. **Structure is mechanical, not subjective**: When rules say "extract this to a function," it's not a preference - it's a mechanical requirement
2. **Business logic is pure**: Side effects (I/O, database, HTTP) belong in adapters, not business logic
3. **Types declare behavior**: If a function returns Result<T>, it can fail. If it returns T, it can't. The signature tells you everything.
4. **Patterns are a vocabulary**: Learn the patterns, and you can describe any business logic by composing them
5. **Refactoring is deterministic**: When code doesn't match patterns, there's one obvious refactoring

These principles make code **predictable for humans and AI alike**.

---

## What's Next?

You now understand:
- Why structural standardization matters in the AI era
- The foundational concepts: side effects, composition, monads
- What you'll learn in this series
- How to approach the learning path

**Next:** [Part 2: Core Principles](part-02-core-principles.md)

In Part 2, we'll dive into the four return types that form the foundation of everything else: T, Option<T>, Result<T>, and Promise<T>. You'll learn when to use each one, how they compose, and why these four types are all you need.

---

**Series Navigation**

← *You are at Part 1* | [Index](INDEX.md) | [Part 2: Core Principles →](part-02-core-principles.md)

---

**Version:** 1.0.0 (2025-10-05) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)
