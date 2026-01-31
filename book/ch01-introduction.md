# Chapter 1: Introduction - Code Unification

**Based on:** JBCT v2.1.3 | **Pragmatica Lite Core:** 0.11.2

## What You'll Learn

- Why code unification matters in the AI era
- The problems JBCT solves
- The five evaluation criteria for design decisions
- Foundational concepts: side effects, composition, monads

**Prerequisites:** Mid-/senior Java developers comfortable with Java 21+ features (records, sealed interfaces, pattern matching), lambdas, generics, and basic functional patterns.

---

## Code in a New Era

Software development is changing faster than ever. AI-powered code generation tools have moved from experimental novelty to daily workflow staple in just a few years. We now write code alongside - and increasingly with - intelligent assistants that can generate entire functions, refactor modules, and suggest architectural patterns. This shift creates new challenges that traditional coding practices weren't designed to handle.

Historically, code has carried a heavy burden of personal style. Every developer brings preferences about naming, structure, error handling, and abstraction. Teams spend countless hours in code review debating subjective choices. Style guides help, but they can't capture the deeper structural decisions that make code readable or maintainable. When AI generates code, it inherits these same inconsistencies - we just don't know whose preferences it's channeling or why it made particular choices.

This creates a context problem. When you read AI-generated code, you're reverse-engineering decisions made by a model trained on millions of examples with conflicting styles. When AI reads your code to suggest changes, it must infer your intentions from structure that may not clearly express them. The cognitive overhead compounds: developers burn mental cycles translating between their mental model, the code's structure, and what the AI "thinks" the code means.

Meanwhile, technical debt accumulates silently. Small deviations from good structure - a validation check here, an exception there, a bit of mixed abstraction levels - seem harmless in isolation. But they compound. Refactoring becomes risky. Testing becomes difficult. The codebase becomes a collection of special cases rather than a coherent system.

> Traditional approaches don't provide clear, mechanical rules for when to refactor or how to structure new code, so these decisions remain subjective and inconsistent.

---

## The JBCT Approach

**Java Backend Coding Technology (JBCT)** proposes a different approach: **reduce the space of valid choices until there's essentially one good way to do most things**. Not through rigid frameworks or heavy ceremony, but through a small set of rules that make structure predictable, refactoring mechanical, and business logic clearly separated from technical concerns.

The benefits compound:

**Unified structure** means humans can read AI-generated code without guessing about hidden assumptions, and AI can read human code without inferring structure from context. A use case looks the same whether you wrote it, your colleague wrote it, or an AI assistant generated it. The structure carries the intent.

**Minimal technical debt** emerges naturally because refactoring rules are built into the methodology. When a function grows beyond one clear responsibility, the rules tell you exactly how to split it. When a component gets reused, there's one obvious place to move it. Debt doesn't accumulate because prevention is cheaper than cleanup.

**Close business modeling** happens when you're not fighting technical noise. Value objects enforce domain invariants at construction time. Use cases read like business processes because each step does one thing. Errors are domain concepts, not stack traces. Product owners can read the code structure and recognize their requirements.

**Requirement discovery** becomes systematic. When you structure code as validation → steps → composition, gaps become obvious. Missing validation rules surface when you define value objects. Unclear business logic reveals itself when you can't name a step clearly. Edge cases emerge when you model errors as explicit types.

**Common language** emerges when patterns become vocabulary. The six patterns (Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects) describe both code structure and business processes. When business says "First we verify, then we process, then we notify"—that's a Sequencer. When they say "We need profile, preferences, and history"—that's a Fork-Join. The translation is mechanical, and requirements discussions become technical design sessions.

**Business logic as a readable language** happens when patterns become vocabulary. The four return types, parse-don't-validate, and the fixed pattern catalog form a consistent way to express domain concepts in code. Anyone who understands the domain can pick up a new codebase virtually instantly.

**Deterministic code generation** becomes possible when the mapping from requirements to code is mechanical. Given a use case specification - inputs, outputs, validation rules, steps - there's essentially one correct structure. Different developers (or AI assistants) should produce nearly identical implementations.

> **A Broader Movement:** JBCT is not alone in pursuing compile-time guarantees and type-driven design. Similar philosophies appear in database design (7NF type-first approaches), distributed systems, and functional programming communities. The common thread: shift errors from runtime to compile-time, make invalid states unrepresentable, and reduce cognitive load through explicit contracts.

---

## The Five Evaluation Criteria

Before diving into patterns, understand how we evaluate every decision in JBCT. Traditional "best practices" rely on subjective "readability" - but what does that mean? JBCT uses five objective criteria:

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
   - `@Transactional`: Invisible behavior - must remember that methods run in transactions, requires understanding proxy mechanics
   - Explicit: Transaction boundaries are visible in code
   - **Score: +2 for explicit**

2. **Business/Technical Ratio:**
   - Both approaches are technical infrastructure
   - **Score: 0** (neutral)

3. **Design Impact:**
   - `@Transactional`: Couples business logic to Spring framework
   - Explicit: Business logic stays framework-agnostic
   - **Score: +2 for explicit**

4. **Reliability:**
   - `@Transactional`: Fails silently in some cases (private methods, self-invocation)
   - Explicit: Compiler errors if you forget transaction handling
   - **Score: +1 for explicit**

5. **Complexity:**
   - `@Transactional`: Hidden control flow
   - Explicit: Control flow is visible
   - **Score: +1 for explicit**

**Verdict: Use explicit transaction management (Aspect pattern)**
- Total: +6 points for explicit

This is how every decision in JBCT is made—not based on opinion, but on measurable impact across five dimensions.

---

## Foundational Concepts

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

JBCT's approach: **push side effects to the edges**. Keep business logic pure. Isolate impure operations in adapter leaves. This makes your core logic easy to test and reason about.

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

### Request Processing as Data Transformation

Every request your system handles follows the same fundamental process. It doesn't depend on language or framework. It mirrors how humans naturally solve problems: take input, gradually collect necessary pieces of knowledge, and produce a correct answer.

**The Universal Pattern:**
```
Input → Parse → Gather → Process → Respond → Output
```

Each stage transforms data. Each stage may need additional data. Each stage may fail. The entire flow is a data transformation pipeline.

**Why Async Looks Like Sync:**

When you think in terms of data transformation, the sync/async distinction disappears:

```java
// These are structurally identical
Result<User> user = database.findUser(userId);     // "sync"
Promise<User> user = httpClient.fetchUser(userId); // "async"
```

Both take a user ID, both produce a User (or failure). The only difference is *when* the result becomes available—an execution detail, not a structural concern.

**Parallel Execution Becomes Transparent:**

You don't decide "this should be parallel." You express data dependencies. The execution strategy follows from the structure:

```java
// Sequential: each step needs previous result
return validateInput(request)
    .flatMap(this::createUser)
    .flatMap(this::sendWelcomeEmail);

// Parallel: steps are independent
return Promise.all(
    fetchUserProfile(userId),
    loadAccountSettings(userId),
    getRecentActivity(userId)
).map(this::buildDashboard);
```

The JBCT patterns—Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects—are the fundamental ways data can flow through any system. Once you start thinking in data transformation, implementing any processing task in close to optimal form becomes routine.

### What Are Monads (Smart Wrappers)?

In JBCT, we use types that wrap values and control how operations are applied to them.

> **Note:** In functional programming, these are called *monads*. This book uses both terms - "Smart Wrapper" for intuition, "monad" for precision.

**A monad controls when and if your operations run.**

#### The Key Insight: Inversion of Control

Traditional code: **you** decide when to do something.
Monad code: **the monad** decides when to do something.

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

// Monad: WRAPPER checks, WRAPPER decides
Result<String> result = Result.success(email)
                              .map(String::trim)
                              .flatMap(this::validate)
                              .flatMap(this::save);
```

You're saying: "Here's what to do with the value... **if** you have one and **when** you're ready."

The monad decides:
- **Option**: "I'll apply your operation **if** the value is present"
- **Result**: "I'll apply your operation **if** there's no error so far"
- **Promise**: "I'll apply your operation **when** the async result arrives"

Each monad has:
- **map**: "Transform the value, if/when available"
- **flatMap**: "Chain another operation, if/when the current one succeeds"

### Pragmatic, Not Pure

JBCT uses *pragmatic* monads. Monad laws are not required. Purity is not a goal. **Predictability is.**

We borrow functional patterns because they make code more predictable and composable, not because we're pursuing theoretical purity. Side effects happen. I/O is necessary. The goal is to make side effects *explicit* and *isolated*, not to eliminate them.

If you're coming from Haskell or Scala, adjust your expectations: this is practical Java, not academic FP.

### Immutability

All input data passed to operations must be treated as immutable and read-only. This isn't about dogmatic functional purity - it's about maintaining safety guarantees that make concurrent code predictable.

**What MUST be immutable:**
- Data passed between parallel operations (Fork-Join pattern)
- Input parameters to any operation
- Response types returned from use cases
- Value objects used as map keys or in collections

**What CAN be mutable (thread-confined):**
- Local state within single operation (accumulators, builders)
- Working objects within adapter boundaries
- State confined to sequential patterns

**Key principle:** Mutability is safe when state is **thread-confined** (accessed by single thread). Parallel patterns require immutable inputs because no isolation exists.

---

## Who Should Use JBCT?

**You should use this if:**
- You're building backend services (REST APIs, microservices, batch processors)
- You want code that's easy for new team members to understand
- You're working with AI coding assistants and want generated code to match your structure
- You value testability and want to minimize mocking
- You're tired of architectural debates and want mechanical rules

**This might not fit if:**
- You're building UI applications (different concerns, different patterns)
- You need extreme performance optimization (some abstraction overhead)
- Your team is heavily invested in a conflicting architecture
- You prefer object-oriented design with mutable state

---

## Key Takeaways

1. **JBCT unifies code** - Making code predictable across teams and AI collaboration
2. **Five criteria** guide all decisions - Mental overhead, business/technical ratio, design impact, reliability, complexity
3. **Side effects at edges** - Keep business logic pure, isolate I/O in adapters
4. **Composition over imperative** - Chain operations, let structure handle errors
5. **Monads invert control** - You describe transformations, the monad handles execution

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 1.1: Return Type Selection
- Exercise 1.2: Option vs Result

---

## What's Next

[Chapter 2](ch02-four-return-types.md) introduces the four return types that form the foundation of everything else: `T`, `Option<T>`, `Result<T>`, and `Promise<T>`. You'll learn when to use each one, how they compose, and why these four types are all you need.
