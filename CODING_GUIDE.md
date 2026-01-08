---
tags: [AI, Java, coding-technology]
published: true
description: "Revolutionary technology for writing deterministic, AI-friendly, high quality Java backend code using functional patterns, vertical slicing, and minimal set of rules."
---

# Java Backend Coding Technology: Writing Code in the Era of AI

**Version:** 2.1.0 | **Repository:** [github.com/siy/coding-technology](https://github.com/siy/coding-technology) | **Changelog:** [CHANGELOG.md](https://github.com/siy/coding-technology/blob/main/CHANGELOG.md)

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

> **A Broader Movement:** JBCT is not alone in pursuing compile-time guarantees and type-driven design. Similar philosophies appear in database design (7NF type-first approaches), distributed systems, and functional programming communities. The common thread: shift errors from runtime to compile-time, make invalid states unrepresentable, and reduce cognitive load through explicit contracts.

This guide presents the complete technology: the rules, the patterns, the rationale, and the practices. It's framework-agnostic by design - these principles work whether you're building REST APIs with Spring, message processors with plain Java, or anything in between. The framework lives at the edges; the business logic remains pure, testable, and independent.

We'll start with core concepts - the building blocks that make everything else possible. Then we'll explore the pattern catalog that covers almost every situation you'll encounter. A detailed use case walkthrough shows how the pieces fit together. Framework integration demonstrates how to bridge this functional core to the imperative world of web frameworks and databases. Finally, we'll examine common mistakes and how to avoid them.

The goal isn't to give you more tools. It's to give you fewer decisions to make, so you can focus on the problems that actually matter.

---

## Quick Reference

**For experienced developers:** This section provides a concise overview of the technology's core elements. If you're new to this approach, skip to ["Why This Technology Works"](#why-this-technology-works-the-evaluation-framework) for the full explanation.

### The Four Return Kinds

Every function returns exactly one of these four types:

| Type | Use When | Examples |
|------|----------|----------|
| `T` | Synchronous, cannot fail, always present | `String formatName(Name)`, `Money calculateTotal(List<Item>)` |
| `Option<T>` | Synchronous, cannot fail, might be absent | `Option<Theme> findTheme(UserId)`, `Option<String> middleName(FullName)` |
| `Result<T>` | Synchronous, can fail (validation/business errors) | `Result<Email> email(String)`, `Result<Order> placeOrder(Cart)` |
| `Promise<T>` | Asynchronous, can fail | `Promise<User> loadUser(UserId)`, `Promise<Response> execute(Request)` |

**Never:** `Promise<Result<T>>` (redundant nesting), `Void` type (use `Unit`), return null (use `Option<T>`)

### Pattern Decision Tree

```
Is it a single atomic operation?
  └─ YES → Leaf Pattern
       └─ Business logic? Pure function
       └─ I/O operation? Use Promise.lift()

Does it have 2-5 sequential dependent steps?
  └─ YES → Sequencer Pattern (.flatMap() chains)

Does it have parallel independent operations?
  └─ YES → Fork-Join Pattern (Result.all() or Promise.all())

Does it branch based on a condition?
  └─ YES → Condition Pattern (ternary or switch expression)

Does it process a collection?
  └─ YES → Iteration Pattern (.map(), .filter(), .reduce())

Is it a cross-cutting concern (retry, timeout, metrics)?
  └─ YES → Aspects Pattern (higher-order functions)
```

### Core Principles

**Parse, Don't Validate:**
- Validation = construction. Factory methods return `Result<T>`.
- If instance exists, it's valid. No separate validation methods.
- Makes invalid states unrepresentable.

**No Business Exceptions:**
- Business failures are typed `Cause` values in `Result`/`Promise`.
- Exceptions only for true exceptional conditions (OOM, assertion failures).
- `Result<T>` for sync errors, `Promise<T>` for async errors.

**Thread Safety by Design:**
- Immutable at boundaries: parameters and return values must be immutable
- Thread confinement: mutable state OK within single-threaded execution
- Fork-Join requires strict immutability

### Naming Conventions

| Element | Convention | Examples |
|---------|------------|----------|
| Factory methods | `TypeName.typeName(...)` (lowercase-first) | `Email.email(String)`, `UserId.userId(String)` |
| Validated inputs | `Valid` prefix (not `Validated`) | `ValidRequest`, `ValidUser` |
| Error types | `<Noun><PastTenseState>` (noun-first, NOT verb-first) | ✅ `EmailNotFound`, `PaymentFailed`, `AccountLocked`<br>❌ `NotFoundEmail`, `FailedPayment` |
| Test methods | `methodName_outcome_condition` | `execute_fails_whenEmailInvalid` |
| Use case interfaces | Verb + noun | `RegisterUser`, `ProcessPayment`, `SendEmail` |

### Common Type Transformations

```java
// Option → Result/Promise
option.toResult(cause)      // or .await(cause)
option.async(cause)

// Result → Promise
result.async()

// Promise → Result (blocking)
promise.await()
promise.await(timeout)

// Cause → Result/Promise (prefer over failure constructors)
cause.result()
cause.promise()

// Lifting sync to async context
Result.all(...).async()     // Start Promise chain from Result
```

### Project Structure (Vertical Slicing)

```
com.example.app/
├── usecase/
│   ├── registeruser/           # Self-contained vertical slice
│   │   ├── RegisterUser.java  # Interface + factory + all types
│   │   └── [steps, errors]    # Everything for this use case
│   └── processorder/
│       └── ProcessOrder.java
├── domain/
│   └── shared/                 # ONLY reusable value objects
│       ├── Email.java          # Used by 2+ use cases
│       └── UserId.java
└── adapter/
    ├── rest/                   # Inbound (HTTP)
    ├── persistence/            # Outbound (DB)
    └── messaging/              # Outbound (queues)
```

**Placement rules (tiered by scope):**
- **Used by single use case** → inside use case package (e.g., `usecase/registeruser/ValidRequest.java`)
- **Used by 2+ use cases in same domain/module** → `domain/<module>/` (e.g., `domain/billing/Invoice.java` used by `CreateInvoice` and `SendInvoice`)
- **Used across multiple domains/modules** → `domain/shared/` (e.g., `domain/shared/Email.java` used everywhere)
- **Steps (interfaces)** → always inside use case package (never shared)
- **Errors** → sealed interface inside use case package (never shared)

**Guideline:** Start specific (use case package), move to broader scope only when actually reused. Don't prematurely extract to `shared/`.

---

## Why This Technology Works: The Evaluation Framework

Every rule and pattern in this technology is evaluated against five objective criteria. These replace subjective "readability" arguments with measurable comparisons:

1. **Mental Overhead** - "Don't forget to..." and "Keep in mind..." items you must track. This appears as things developers must remember because the compiler can't catch them. Lower is better.

2. **Business/Technical Ratio** - Balance between domain concepts and framework/infrastructure noise. Higher domain visibility with less technical boilerplate is better.

3. **Design Impact** - Whether an approach improves design consistency or breaks it. Does it enforce good patterns or allow bad ones?

4. **Reliability** - Does the compiler catch mistakes, or must you remember? Type safety that makes invalid states unrepresentable eliminates entire classes of bugs.

5. **Complexity** - Number of elements, connections, and especially hidden coupling. Fewer moving parts and explicit dependencies are better.

These criteria aren't preferences - they're measurable attributes. When we say "don't use business exceptions," we can prove why:
- **Mental Overhead**: Checked exceptions force signature pollution; unchecked are invisible (+2 for Result-based)
- **Reliability**: Exception paths are hidden from type checker; Result makes them explicit (+1 for Result-based)
- **Complexity**: Exception hierarchies create cross-package coupling (+1 for Result-based)

Similarly, "parse don't validate":
- **Mental Overhead**: No "remember to validate" - invalid states are unrepresentable (+1)
- **Reliability**: Compiler enforces validity through types, not runtime checks (+1)
- **Design Impact**: Business invariants encoded in type system, not scattered (+1)

Throughout this guide, major rules reference these criteria. The goal: replace endless "best practices" with five measurable standards.

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

**Verdict: Use explicit transaction management (Aspect pattern)**
- Mental Overhead: +2
- Business/Technical Ratio: 0
- Design Impact: +2
- Reliability: +1
- Complexity: +1
- **Total: +6 points for explicit**

This is how every decision in JBCT is made—not based on opinion, but on measurable impact across five dimensions.

---

## Foundational Concepts

Before diving into specific rules and patterns, understanding the core concepts that make this technology work is essential. These concepts provide the foundation for all patterns and practices described later.

### Side Effects and Purity

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
public Promise<Unit> saveUser(User user) {
    return database.save(user)  // Side effect: modifies external state
                   .onSuccess(_ -> logger.info("User saved"));  // Side effect: writes to log
}
```

**Pure functions are predictable**: same inputs always produce same output. They're easy to test (no mocking needed) and safe to run anywhere, anytime.

**Impure functions are necessary** - applications must interact with the world - but they're **unpredictable**: network might fail, disk might be full, database might be down.

**This technology's approach**: Push side effects to the edges. Keep business logic pure. Isolate impure operations in adapter leaves. This makes core logic easy to test and reason about.

### Composition

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

The second version **chains** operations. Each step takes the output of the previous step as input. Data flows through a pipeline.

Composition lets you **build complex logic from simple pieces** without intermediate variables or explicit error checking at each step. The structure itself handles error propagation.

### Smart Wrappers (Monads)

This technology uses **Smart Wrappers**—types that wrap values and control how operations are applied to them.

> **Terminology Note:** In functional programming, these are called *monads*. This guide uses both terms, with "Smart Wrapper" being more accessible for those new to functional programming and "monad" connecting to broader FP ecosystem. They refer to the same concept.

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
                              .map(String::trim)       // "Trim, if value is present"
                              .flatMap(this::validate) // "Validate, if trim succeeded"
                              .flatMap(this::save);    // "Save, if validate succeeded"
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

**Key insight**: Smart Wrappers (monads) invert control. Instead of checking conditions and deciding what to run, you give the wrapper a chain of operations and it decides when/if to run them based on its rules (presence, success, completion).

Common Smart Wrappers:
- **Option<T>**: Runs operations **if** value is present (handles "might be missing")
- **Result<T>**: Runs operations **if** no error yet (handles "might fail")
- **Promise<T>**: Runs operations **when** result arrives (handles "happens later")

Each Smart Wrapper has:
- **map**: "Transform the value, if/when available"
- **flatMap**: "Chain another operation, if/when the current one succeeds"

### Functional vs Imperative

Traditional object-oriented programming **hides data inside objects** and exposes behavior through methods:

```java
class User {
    private String email;
    private String name;
    private Status status;

    public void setEmail(String email) {
        this.email = email;  // Mutates state
    }

    public void setStatus(Status status) {
        this.status = status;  // Mutates state
    }
}
```

Functional programming **makes data transparent** and treats functions as transformations:

```java
// Immutable data using value objects
public record User(UserId id, Email email, UserName name, Status status) {
    public User withEmail(Email newEmail) {
        return new User(id, newEmail, name, status);  // Returns new instance, other fields unchanged
    }

    public User withStatus(Status newStatus) {
        return new User(id, email, name, newStatus);  // Only status changed
    }
}
```

Benefits:
- **No hidden state**: All data visible in type signature
- **No mutation**: Original values never change, eliminating bug classes
- **Easier reasoning**: Function output depends only on inputs, not hidden state

This technology uses functional principles:
- **Immutable data**: Records, not mutable classes
- **Pure functions**: Computation separate from side effects
- **Explicit effects**: Return types declare what can happen (Option, Result, Promise)

But it's **pragmatic functional programming**: we use Java, integrate with imperative frameworks, don't chase theoretical purity. The goal is **predictable structure**, not functional programming orthodoxy.

### Mental Model: Pipes and Values

Think of code as a series of **pipes** through which **values** flow:

```java
// Water (value) flows through pipes (functions)
public Result<Response> execute(Request request) {
    return ValidRequest.validRequest(request)           // Pipe 1: validation
                       .flatMap(this::checkPermissions) // Pipe 2: authorization
                       .flatMap(this::processRequest)   // Pipe 3: business logic
                       .flatMap(this::saveResult)       // Pipe 4: persistence
                       .map(this::buildResponse);       // Pipe 5: formatting
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
- Data passed between parallel operations (Fork-Join pattern - see [Fork-Join](#fork-join))
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

Detailed pattern-specific safety rules are covered in each pattern's section (see [Patterns Reference](#patterns-reference)). For now, remember: **input data is read-only, local working data can be mutable, output data is immutable**.

---

## Spring to JBCT Translation

**If you're coming from Spring Boot**, here's how JBCT concepts map to familiar patterns. JBCT doesn't replace Spring—it changes how you structure code within Spring applications.

| Spring Pattern | JBCT Equivalent | Key Difference |
|----------------|-----------------|----------------|
| `@Service` class | Use case interface + implementation | Pure functions, no framework coupling. Business logic doesn't know about Spring. |
| `@Repository` interface | Adapter interface (in use case package) | I/O operations live at edges only. Database logic is isolated. |
| `@Valid` + Bean Validation | Parse-don't-validate (value object factories) | Validation = construction. Impossible to create invalid objects. |
| `Optional<T>` | `Option<T>` | Better composition with Smart Wrappers (monads), clearer semantics for "might be missing". |
| `throws Exception` | `Result<T>` (sync) or `Promise<T>` (async) | Typed errors, no hidden control flow. Compiler forces error handling. |
| `CompletableFuture<T>` | `Promise<T>` | Simpler error handling, consistent with `Result<T>` patterns. |
| `@Transactional` | Aspect pattern | Explicit boundary management, independently testable. |

**Key insight:** Your Spring controllers stay largely the same. But instead of calling `@Service` beans that throw exceptions and return nulls, you call use case interfaces that return `Result<T>` or `Promise<T>`. The framework integration stays in adapters—business logic becomes pure and framework-agnostic.

Example:

```java
// Traditional Spring
@RestController
public class UserController {
    @Autowired private UserService userService;  // Framework-coupled service

    @PostMapping("/register")
    public User register(@Valid @RequestBody RegistrationRequest req) {
        return userService.registerUser(req);  // Throws exceptions
    }
}

// JBCT with Spring
@RestController
public class UserController {
    private final RegisterUser registerUser;  // Pure use case interface

    public UserController(RegisterUser registerUser) {
        this.registerUser = registerUser;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterUser.Request raw) {
        return registerUser.execute(raw)     // Validation happens inside use case
                           .fold(this::errorResponse,     // Explicit error handling
                                 this::successResponse);
    }
}
```

---

## Core Concepts

> **Note:** This section uses **Pragmatica Lite Core** library as an underlying functional style library.
> The library is available on Maven Central: https://central.sonatype.com/artifact/org.pragmatica-lite/core
>
> **Maven:**
> ```xml
> <dependency>
>    <groupId>org.pragmatica-lite</groupId>
>    <artifactId>core</artifactId>
>    <version>0.9.10</version>
> </dependency>
> ```
>
> **Gradle:**
> ```gradle
> implementation 'org.pragmatica-lite:core:0.9.10'
> ```

### The Four Return Kinds

Every function in this technology returns exactly one of four types. Not "usually" or "preferably" - exactly one, always. This isn't arbitrary restriction; it's intentional compression of complexity into type signatures.

**Why by criteria:**
- **Mental Overhead**: Hidden error channels (exceptions), hidden optionality (null), hidden asynchrony (blocking I/O) all force developers to remember behavior not expressed in signatures. Explicit return types eliminate this (+3).
- **Reliability**: Compiler verifies error handling, null safety, and async boundaries when encoded in types (+3).
- **Complexity**: Four types cover all scenarios - no guessing about combinations or special cases (+2).

#### Pragmatica Lite Quick Reference

Common imports and methods you'll use throughout this guide:

```java
// Core types
import org.pragmatica.lang.Option;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Promise;
import org.pragmatica.lang.Unit;

// Error handling
import org.pragmatica.lang.error.Cause;
import org.pragmatica.lang.error.Causes;

// Validation
import org.pragmatica.lang.validation.Verify;

// Parsing utilities
import org.pragmatica.lang.parse.Number;
import org.pragmatica.lang.parse.DateTime;
import org.pragmatica.lang.parse.Network;

// Functions
import org.pragmatica.lang.Functions.Fn1;
import org.pragmatica.lang.Functions.Fn2;
```

**Static imports (encouraged):**

Static imports reduce verbosity. The API is designed to avoid naming conflicts:

```java
// Pragmatica Lite static imports
import static org.pragmatica.lang.Result.all;
import static org.pragmatica.lang.Result.success;
import static org.pragmatica.lang.Option.option;
import static org.pragmatica.lang.Option.some;
import static org.pragmatica.lang.Option.none;

// Value object factory static imports
import static com.example.domain.Email.email;
import static com.example.domain.Password.password;
```

This allows concise code:
```java
// With static imports
return all(email(raw), password(raw)).flatMap(ValidRequest::validRequest);

// Without (verbose)
return Result.all(Email.email(raw), Password.password(raw)).flatMap(ValidRequest::validRequest);
```

**Common patterns:**
- `Result.success(value)` - Create success
- `cause.result()` - Create failure (prefer over `Result.failure(cause)`)
- `Result.all(r1, r2, ...)` - Parallel validation, collect all errors
- `Result.allOf(list)` - Aggregate list of Results
- `Option.option(value)` - Wrap nullable (null → empty())
- `Option.some(value)` / `Option.none()` - Create present/absent
- `Promise.success(value)` - Resolved success
- `cause.promise()` - Create failure (prefer over `Promise.failure(cause)`)
- `Promise.promise(supplier)` - Async execution
- `Promise.all(p1, p2, ...)` - Parallel execution, fail-fast
- `Promise.allOf(list)` - Parallel with resilient collection
- `Verify.ensure(value, predicate, cause)` - Validate with error (cause-at-end)
- `.filter(cause, predicate)` - Validation in chains (replaces ensureFn)
- `Causes.cause("message")` - Create fixed cause
- `Causes.forOneValue("message: %s")` - Create cause factory for one context value
- `Causes.forTwoValues("message: %s %s")` - Create cause factory for two context values
- `Causes.forThreeValues("message: %s %s %s")` - Create cause factory for three context values
- `Number.parseInt(raw)`, `DateTime.parseLocalDate(raw)` - Safe parsing

---

**`T`**  - Synchronous, cannot fail, value always present.

Use this when the operation is pure computation with no possibility of failure or missing data. Mathematical calculations, transformations of valid data, simple getters. If you can't think of a way this function could fail or return nothing, it returns `T`.

```java
public record FullName(String value) {
    public String initials() {  // returns String (T)
        return value.chars()
                    .filter(Character::isUpperCase)
                    .collect(StringBuilder::new, 
                             StringBuilder::appendCodePoint, 
                             StringBuilder::append)
                    .toString();
    }
}
```

**`Option<T>`**  - Synchronous, cannot fail, value may be missing.

Use this when absence is a valid outcome, but failure isn't possible. Lookups that might not find anything, optional configuration, nullable database columns when null is semantically meaningful (not just "we don't know"). The key: missing data is normal business behavior, not an error.

```java
// Finding an optional user preference
public interface PreferenceRepository {
    Option<Theme> findThemePreference(UserId id);  // might not be set
}
```

**`Result<T>`**  - Synchronous, can fail, represents business or validation errors.

Use this when an operation might fail for business or validation reasons. Parsing input, enforcing invariants, business rules that can be violated. Failures are represented as typed `Cause` objects, not exceptions. Every failure path is explicit in the return type.

```java
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
                     .map(String::trim)
                     .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
                     .map(Email::new);
    }
}
```

> **Why Result: Error Handling Philosophy**
>
> Error handling logic belongs where business context exists to make decisions. Sometimes that's close to where the error occurred; sometimes the error propagates unchanged because only the caller has enough context to decide. This fundamental truth doesn't depend on the error mechanism—it's about where knowledge lives.
>
> Different languages use different mechanisms for error propagation, each with distinct trade-offs in **transparency** (is failure visible?), **ergonomics** (is it pleasant to use?), and **reliability** (does the compiler help?):
>
> | Mechanism | Transparency | Ergonomics | Reliability |
> |-----------|--------------|------------|-------------|
> | **Checked exceptions** | ✅ Explicit in signature | ❌ Verbose, tight coupling | ✅ Compiler-enforced |
> | **Unchecked exceptions** | ❌ Hidden in implementation | ⚠️ Acceptable, but mental overhead | ❌ Silent failures |
> | **Errors as values** (Go) | ✅ Return value visible | ❌ Manual `if err != nil` everywhere | ❌ Easy to ignore |
> | **Functional (Result/Either)** | ✅ Type signature | ✅ Monadic composition | ✅ Compiler-enforced |
>
> **Checked exceptions** couple caller and callee tightly—changes in lower-level methods cascade upward, forcing signature changes throughout the call stack.
>
> **Unchecked exceptions** eliminate coupling but hide failure modes. Every method call requires reading implementation to discover what might throw. The mental overhead is constant; the bugs are intermittent.
>
> **Errors as values** (Go-style) make failure visible but require manual propagation at every step. Complex scenarios with multiple error sources or interleaved resource management become error-prone boilerplate.
>
> **Functional style** (`Result<T>`) combines the best properties: failure is explicit in the type signature (transparent), monadic composition eliminates manual propagation (ergonomic), and the compiler ensures every failure is either handled or propagated (reliable). The "do this if value is available" semantics of `map`/`flatMap` means error handling code only appears where decisions are made—not at every intermediate step.
>
> Being absolutely clear about failure possibility isn't pedantry—it's the foundation of maintainable code.

**`Promise<T>`**  - Asynchronous, can fail, represents eventual success or failure.

Use this for any I/O operation, external service call, or computation that might block. `Promise<T>` is semantically equivalent to `Result<T>` but asynchronous - failures are carried in the Promise itself, not nested inside it. This is Java's answer to Rust's `Future<Result<T>>` without the nesting problem.

```java
public interface AccountRepository {
    Promise<Account> findById(AccountId id);  // async lookup, can fail
}
```

> **Promise as Async Result**
>
> Think of `Promise<T>` as the asynchronous counterpart to `Result<T>`. Both represent operations that can succeed or fail with typed errors. The only difference is timing: `Result<T>` completes immediately, `Promise<T>` completes later. This symmetry is intentional—the same `map`/`flatMap` composition patterns work identically, and converting between them is trivial (`result.async()` lifts to Promise, `promise.await()` blocks to Result). When you understand `Result<T>`, you understand `Promise<T>`.

**Promise Resolution and Thread Safety:**

Promise resolution is **thread-safe** and happens **exactly once**. These guarantees are critical for concurrent code:

- **Multiple threads can attempt resolution** - only the first succeeds. Subsequent resolution attempts are ignored.
- **Resolution serves as synchronization point** - all attached transformations see a consistent, final result.
- **Transformations execute after resolution** - `map`, `flatMap` chains run in attachment order once the Promise resolves.
- **Side effects execute independently** - `onSuccess`, `onFailure`, `onResult` callbacks run asynchronously and don't block transformation chains.

```java
// Thread-safe Promise resolution
var promise = Promise.<User>promise();

// Multiple threads racing to resolve - only first wins
executor.submit(() -> promise.succeed(user1));  // First to resolve
executor.submit(() -> promise.succeed(user2));  // Ignored
executor.submit(() -> promise.succeed(user3));  // Ignored

// All transformations see the same result (user1)
promise.map(this::processUser)           // Executes after resolution
       .flatMap(this::saveToDatabase)    // Chain continues
       .onSuccess(this::logSuccess);     // Side effect runs independently
```

This thread-safety model enables safe concurrent composition without explicit synchronization. See [Fork-Join](#fork-join) pattern for parallel execution details.

**Special case: Unit type for no-value results**

When an operation succeeds but doesn't produce a meaningful value, use `Result<Unit>` or `Promise<Unit>`. **Never use `Void` type.**

```java
// DO: Use Result<Unit> for validation with no return value
public static Result<Unit> checkInventory(Product product, Quantity requested) {
    return product.availableQuantity().isGreaterThanOrEqual(requested)
        ? Result.unitResult()
        : INSUFFICIENT_INVENTORY.apply(product.id(), requested).result();
}

// DO: Use Promise<Unit> for async operations with no return value
public Promise<Unit> sendNotification(UserId userId, Message message) {
    return Promise.lift(NotificationError.SendFailure::cause,
                        () -> notificationService.send(userId, message))
                  .mapToUnit();
    // Alternatively, use Promise.lift2():
    // return Promise.lift2(NotificationError.SendFailure::cause, 
    //                      notificationService::send,
    //                      userId, 
    //                      message)
    //               .mapToUnit();
}

// DON'T: Never use Void - it has no instances and doesn't compose
Result<Void> checkInventory(...) { }     // ❌ FORBIDDEN
Promise<Void> sendNotification(...) { }  // ❌ FORBIDDEN
```

**Why Unit, not Void:**
- `Void` has no instances - you cannot create a value of type `Void` (it's an uninhabited type)
- `Unit` is a singleton type with exactly one instance - it represents "successful computation with no meaningful return value"
- Technically, `Unit` is an representation of empty set or a record with no fields, which by definition has only one possible value
- `Unit` composes naturally with monadic operations (map, flatMap, fold)
- `Unit` makes "no meaningful value" explicit in the type system
- Use `Result.unitResult()` or `Promise.unitPromise()` for operations that succeed without producing data

**Why exactly four return types?**

These four types form a complete basis for composition. You can lift "up" when needed (`Option` to `Result` to `Promise`), but you never nest the same concern twice (`Promise<Result<T>>` is forbidden). Each type represents one orthogonal concern:
- Synchronous vs. asynchronous (now vs. later)
- Can fail vs cannot fail (error channel present or absent)
- Value vs optional value (presence guaranteed or not)

Traditional Java mixes these concerns. A method returning `User` might throw exceptions (hidden error channel), return null (hidden optionality), or block on I/O (hidden asynchrony). You can't tell from the signature. With these four types, the signature tells you everything about the function's behavior before you read a line of implementation.

This clarity is what makes AI-assisted development tractable. When generating code, an AI doesn't need to infer whether error handling is needed - the return type declares it. When reading code, a human doesn't need to trace execution paths to find hidden failure modes - they're in the type signature.

### Parse, Don't Validate

Most Java code validates data after construction. You create an object with raw values, then call a `validate()` method that might throw exceptions or return error lists. This is backwards.

**The principle:** Make invalid states unrepresentable. If construction succeeds, the object is valid by definition. Validation is parsing - converting untyped or weakly-typed input into strongly typed domain objects that enforce invariants at the type level.

**Why by criteria:**
- **Mental Overhead**: No "remember to validate" - type system guarantees validity (+2).
- **Reliability**: Compiler enforces that invalid objects cannot be constructed (+3).
- **Design Impact**: Business invariants concentrated in factories, not scattered across codebase (+2).
- **Complexity**: Single validation point per type eliminates redundant checks (+1).

Traditional validation:
```java
// DON'T: Validation separated from construction
public class Email {
    private final String value;

    public Email(String value) {
        this.value = value;  // accepts anything
    }

    public boolean isValid() {  // The caller must remember to check
        return value != null && value.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    }
}

// Client code must validate manually:
Email email = new Email(input);
if (!email.isValid()) {
    throw new ValidationException("Invalid email");
}
```

Problems: You can construct invalid `Email` objects. Validation is a separate step that callers might forget. The `isValid()` method returns a boolean, discarding information about what's wrong. You can't distinguish "null" from "malformed" from "too long" without checking conditions individually.

Parse-don't-validate approach:
```java
// DO: Validation IS construction
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
                     .map(String::trim)
                     .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
                     .map(Email::new);
    }
}

// Client code gets the Result:
Result<Email> result = Email.email(input);
// If this is a Success, the Email is valid. Guaranteed.
```

The constructor is private (or package-private). The only way to get an `Email` is through the static factory `email()`, which returns `Result<Email>`. If you have an `Email` instance, it's valid - no separate check needed. The type system enforces this.

**Note:** As of current Java versions, records do not support declaring the canonical constructor as private. This limitation means the constructor remains accessible within the same package. Future Java versions may address this. Until then, rely on team discipline and code review to ensure value objects are only constructed through their factory methods. The good news: violations are highly visible in code - since all components are normally constructed via factory methods, any direct `new Email(...)` call stands out immediately. This makes the issue easy to catch using automated static analysis checks or by instructing AI code review tools to flag direct constructor usage for value objects.

**Naming convention:** Factories are always named after their type, lowercase-first (camelCase). This creates a natural, readable call site: `Email.email(...)`, `Password.password(...)`, `AccountId.accountId(...)`. It's slightly redundant but unambiguous and grep-friendly. The intentional redundancy enables conflict-free static imports - `import static Email.email` allows you to write `email(raw)` at call sites while preserving context, since the factory name itself indicates what's being created. (See [Naming Conventions](#naming-conventions) for complete naming guidelines.)

**Optional fields with validation:**

What if a field is optional but must be valid when present? For example, a referral code that's not required but must match a pattern if provided.

Use `Result<Option<T>>` - validation can fail (Result), and if it succeeds, the value might be absent (Option).

```java
public record ReferralCode(String value) {
    private static final Pattern PATTERN = Pattern.compile("^[A-Z0-9]{6}$");
    private static final Cause INVALID_FORMAT = Causes.cause("Invalid referral code format");

    public static Result<Option<ReferralCode>> referralCode(String raw) {
        return Verify.ensureOption(
            Option.option(raw).map(String::trim).filter(s -> !s.isEmpty()),
            PATTERN.asMatchPredicate(),
            INVALID_FORMAT
        ).map(opt -> opt.map(ReferralCode::new));
    }
}
```

`Verify.ensureOption()` handles the Result<Option<T>> pattern directly: if the Option is empty, succeeds with `Option.none()`. If present and valid, succeeds with `Option.some(value)`. If present and invalid, fails. Callers get clear semantics: failure means invalid input, success with `none()` means no value provided, success with `some()` means valid value.

**Normalization:** Factories can normalize input (trim whitespace, lowercase email domains, etc.) as part of parsing. This keeps invariants in one place and ensures all instances are normalized consistently.

**Why this matters for AI:** When an AI generates a value object, the structure is mechanical: private constructor, static factory named after type, `Result<T>` or `Result<Option<T>>` return type, validation via `Verify` combinators. No guessing about where validation happens or how errors are reported.

#### Real-World Validation Scenarios

The basic examples above validate single fields independently. Real applications have more complex requirements: cross-field validation, dependent rules, and business constraints spanning multiple values.

**Cross-field validation** - One field depends on another:

```java
// Date range where end must be after start
public record DateRange(LocalDate start, LocalDate end) {
    // private DateRange {}  // Not yet supported in Java

    private static final Cause START_REQUIRED = Causes.cause("Start date required");
    private static final Cause END_REQUIRED = Causes.cause("End date required");
    private static final Fn1<Cause, LocalDate> END_BEFORE_START = Causes.forOneValue("End date must be after start date: %s");

    public static Result<DateRange> dateRange(LocalDate start, LocalDate end) {
        return Verify.ensure(start, Verify.Is::notNull, START_REQUIRED)
                     .flatMap(_ -> Verify.ensure(end, Verify.Is::notNull, END_REQUIRED))
                     .flatMap(_ -> Verify.ensure(end, isAfter(start), END_BEFORE_START))
                     .map(_ -> new DateRange(start, end));
    }

    private static Predicate<LocalDate> isAfter(LocalDate start) {
        return end -> end.isAfter(start);
    }
}
```

**Dependent validation** - Second field's validity depends on first:

```java
// Password must not contain username (case-insensitive)
public record ValidCredentials(Username username, Password password) {
    // private ValidCredentials {}  // Not yet supported in Java

    private static final Result<ValidCredentials> PASSWORD_CONTAINS_USERNAME =
        Causes.cause("Password must not contain username").result();

    public static Result<ValidCredentials> validCredentials(String usernameRaw, String passwordRaw) {
        // Parse components then call factory method to build instance
        return Result.all(Username.username(usernameRaw),
                          Password.password(passwordRaw))
                     .flatMap(ValidCredentials::validCredentials);
    }

    // Factory method for valid components performs cross-component validation
    public static Result<ValidCredentials> validCredentials(Username username, Password password) {
        return password.contains(username)
            ? PASSWORD_CONTAINS_USERNAME
            : Result.success(new ValidCredentials(username, password));
    }
}
```

**Business rule validation** - Complex domain invariants:

```java
// Order total must match sum of line items
public record ValidOrder(OrderId id, Money total, List<LineItem> items) {
    // private ValidOrder {}  // Not yet supported in Java

    private static final Fn1<Cause, Money> TOTAL_MISMATCH = Causes.forOneValue("Order total does not match line items. Expected: %s");

    public static Result<ValidOrder> validOrder(OrderId id, Money total, List<LineItem> items) {
        return total.equals(calculateTotal(items))
            ? Result.success(new ValidOrder(id, total, items))
            : TOTAL_MISMATCH.apply(calculateTotal(items)).result();
    }

    private static Money calculateTotal(List<LineItem> items) {
        return items.stream()
                    .map(LineItem::subtotal)
                    .reduce(Money.ZERO, Money::add);
    }
}
```

**Collecting multiple errors with Result.all():**

```java
// Validate user registration - collect all field errors
public record ValidRegistration(Email email, Password password, Age age) {
    // private ValidRegistration {}  // Not yet supported in Java

    public static Result<ValidRegistration> validRegistration(String emailRaw,
                                                              String passwordRaw,
                                                              String ageRaw) {
        return Result.all(Email.email(emailRaw),
                          Password.password(passwordRaw),
                          Age.age(ageRaw))
                     .map(ValidRegistration::new);
        // If any field fails, Result.all() accumulates ALL errors
        // User sees "Invalid email AND password too short AND age out of range"
        // Not just the first error
    }
}
```

**Key insight:** Use `Result.all()` for independent field validation (collects all errors), then use `flatMap` chains for dependent validation (fail-fast when one field depends on another being valid first).

#### Adopting Incrementally in Existing Codebases

**Don't refactor everything at once.** Parse-don't-validate works best when adopted incrementally at boundaries.

**Strategy:**

**1. New features first** - Use parse-don't-validate from day one for all new code:

```java
// New feature: referral code tracking
public record ReferralCode(String value) {
    public static Result<Option<ReferralCode>> referralCode(String raw) {
        return Verify.ensureOption(
            Option.option(raw).map(String::trim).filter(s -> !s.isEmpty()),
            PATTERN.asMatchPredicate(), INVALID_FORMAT
        ).map(opt -> opt.map(ReferralCode::new));
    }
}

// Use in new use cases immediately
public interface TrackReferral {
    Result<Response> execute(ReferralCode code);
}
```

**2. Keep existing validation** - Don't remove `@Valid` annotations or existing validation immediately:

```java
// BEFORE: Existing controller with @Valid
@PostMapping("/register")
public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest dto) {
    // @Valid handles Spring-level DTO validation
    // Add bridge layer that converts DTO → use case request
    var request = new RegisterUser.Request(dto.email(), dto.password());
    return registerUser.execute(request)
                       .fold(this::errorResponse, this::successResponse);
}

// AFTER: Fully migrated - use case request directly
@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody RegisterUser.Request raw) {
    return registerUser.execute(raw)     // Validation happens inside use case
                       .fold(this::errorResponse, this::successResponse);
}
```

**3. Gradually move validation** - Shift validation from service layer to value objects:

Before:
```java
@Service
public class RegistrationService {
    public User register(String email, String password) {
        if (email == null || !isValidEmail(email)) {
            throw new ValidationException("Invalid email");
        }
        if (password == null || password.length() < 8) {
            throw new ValidationException("Password too short");
        }
        // ... business logic
    }
}
```

After (incremental):
```java
// Step 1: Extract value objects
public interface RegisterUser {
    Result<User> execute(Email email, Password password);
}

// Step 2: Keep service as thin adapter
@Service
public class RegistrationService {
    private final RegisterUser useCase;

    public User register(String email, String password) {
        return Result.all(Email.email(email), Password.password(password))
                     .flatMap(useCase::execute)
                     // Still throws exception for compatibility with existing code
                     .fold(cause -> throw new ValidationException(cause.message()),
                           user -> user);
    }
}
```

**4. End state** - Pure business logic with adapters at boundaries:

```java
@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody RegistrationRequest request) {
    return ValidRequest.validRequest(request)
                       .async() // Transition into asynchronous code
                       .flatMap(useCase::execute) // Use case does I/O -> uses Promise
                       .await() // Return to synchronous code
                       .fold(this::errorResponse, this::successResponse);
}
```

**Timeline:** New features immediately, existing features over 3-6 months as you touch the code. No big-bang refactoring required.

### Pragmatica Lite Validation and Parsing Utilities

Pragmatica Lite Core provides two categories of utilities that eliminate common boilerplate: `Verify.Is` predicates for validation and the `parse` subpackage for exception-safe JDK API wrapping.

#### Verify.Is Predicates

The `Verify.Is` interface provides 20+ ready-to-use predicates for common validation scenarios. Instead of writing custom predicates or lambdas, use these standardized checks.

**Null safety:**
```java
Verify.ensure(value, Verify.Is::notNull)
```

**String validations:**
```java
// Check non-empty and non-whitespace
Verify.ensure(username, Verify.Is::notBlank)

// Length constraints
Verify.ensure(password, Verify.Is::lenBetween, 8, 128)

// Pattern matching (accepts String regex or compiled Pattern)
Verify.ensure(email, Verify.Is::matches, EMAIL_PATTERN)

// Substring checks
Verify.ensure(comment, Verify.Is::notContains, "spam")
Verify.ensure(url, Verify.Is::contains, "https://")
```

**Numeric validations:**
```java
// Sign checks
Verify.ensure(age, Verify.Is::positive)           // > 0
Verify.ensure(balance, Verify.Is::negative)       // < 0
Verify.ensure(count, Verify.Is::nonNegative)      // >= 0

// Comparisons (works with any Comparable<T>)
Verify.ensure(temperature, Verify.Is::greaterThan, 0)
Verify.ensure(score, Verify.Is::lessThanOrEqualTo, 100)
Verify.ensure(age, Verify.Is::between, 18, 120)

// Equality checks using compareTo
Verify.ensure(value, Verify.Is::equalTo, expected)
Verify.ensure(value, Verify.Is::notEqualTo, forbidden)
```

**Option validations:**
```java
// Ensure Option is present
Verify.ensure(maybeValue, Verify.Is::some)

// Ensure Option is empty
Verify.ensure(shouldBeEmpty, Verify.Is::none)
```

**Complete predicate list:** `notNull`, `positive`, `negative`, `nonNegative`, `nonPositive`, `greaterThan`, `greaterThanOrEqualTo`, `lessThan`, `lessThanOrEqualTo`, `equalTo`, `notEqualTo`, `between`, `empty`, `notEmpty`, `blank`, `notBlank`, `lenBetween`, `contains`, `notContains`, `matches`, `some`, `none`.

**Combining multiple checks:**
```java
// Using chained filters for composite validation
private static final Cause TOO_SHORT = Causes.cause("Password must be at least 8 characters");
private static final Cause NO_UPPERCASE = Causes.cause("Password must contain uppercase letter");
private static final Cause NO_DIGIT = Causes.cause("Password must contain digit");
private static final Pattern HAS_UPPERCASE = Pattern.compile(".*[A-Z].*");
private static final Pattern HAS_DIGIT = Pattern.compile(".*[0-9].*");

public static Result<Password> password(String raw) {
    return Verify.ensure(raw, Verify.Is::notNull)
                 .filter(TOO_SHORT, s -> Verify.Is.lenBetween(s, 8, 128))
                 .filter(NO_UPPERCASE, HAS_UPPERCASE.asMatchPredicate())
                 .filter(NO_DIGIT, HAS_DIGIT.asMatchPredicate())
                 .map(Password::new);
}
```

#### Parse Subpackage - Exception-Safe JDK Wrappers

The `org.pragmatica.lang.parse` package provides functional wrappers for JDK parsing APIs that throw exceptions. These return `Result<T>` instead of throwing, eliminating the need for manual `Result.lift()` wrapping.

**Number parsing (`org.pragmatica.lang.parse.Number`):**
```java
import org.pragmatica.lang.parse.Number;

// Instead of: Result.lift(Integer::parseInt, raw)
Number.parseInt(raw)              // Result<Integer>
Number.parseLong(raw)             // Result<Long>
Number.parseDouble(raw)           // Result<Double>
Number.parseBigDecimal(raw)       // Result<BigDecimal>
Number.parseBigInteger(raw)       // Result<BigInteger>

// With radix support
Number.parseInt(hexString, 16)    // Result<Integer>
```

**DateTime parsing (`org.pragmatica.lang.parse.DateTime`):**
```java
import org.pragmatica.lang.parse.DateTime;

// Instead of: Result.lift(LocalDate::parse, raw)
DateTime.parseLocalDate(raw)               // Result<LocalDate>
DateTime.parseLocalTime(raw)               // Result<LocalTime>
DateTime.parseLocalDateTime(raw)           // Result<LocalDateTime>
DateTime.parseZonedDateTime(raw)           // Result<ZonedDateTime>
DateTime.parseInstant(raw)                 // Result<Instant>

// With custom formatters
DateTime.parseLocalDate(raw, customFormatter)  // Result<LocalDate>
```

**Network and identifier parsing (`org.pragmatica.lang.parse.Network`):**
```java
import org.pragmatica.lang.parse.Network;

// Instead of: Result.lift(UUID::fromString, raw)
Network.parseUUID(raw)              // Result<UUID>
Network.parseURL(raw)               // Result<URL>
Network.parseURI(raw)               // Result<URI>
Network.parseInetAddress(raw)       // Result<InetAddress>
```

**I18n parsing (`org.pragmatica.lang.parse.I18n`):**
```java
import org.pragmatica.lang.parse.I18n;

I18n.parseLocale(raw)              // Result<Locale>
I18n.parseCurrency(raw)            // Result<Currency>
```

**Text utilities (`org.pragmatica.lang.parse.Text`):**
```java
import org.pragmatica.lang.parse.Text;

Text.parseBoolean(raw)             // Result<Boolean>
// Plus charset and encoding utilities
```

**Example value object using parse utilities:**
```java
public record UserId(UUID value) {
    private static final Fn1<Cause, String> INVALID_ID = Causes.forOneValue("Invalid user ID: %s");

    public static Result<UserId> userId(String raw) {
        return Verify.ensure(raw, Verify.Is::notBlank)
                     .flatMap(Network::parseUUID)
                     .mapError(_ -> INVALID_ID.apply(raw)) // Convert generic cause into domain-specific one
                     .map(UserId::new);
    }
}

public record Age(int value) {
    private static final Cause INVALID_RANGE = Causes.cause("Age must be 0-150");

    public static Result<Age> age(String raw) {
        return Number.parseInt(raw)
                     .filter(INVALID_RANGE, v -> Verify.Is.between(v, 0, 150))
                     .map(Age::new);
    }
}

public record BirthDate(LocalDate value) {
    private static final Cause FUTURE_DATE = Causes.cause("Birth date cannot be in the future");

    public static Result<BirthDate> birthDate(String raw) {
        return DateTime.parseLocalDate(raw)
                       .filter(FUTURE_DATE, d -> Verify.Is.lessThanOrEqualTo(d, LocalDate.now()))
                       .map(BirthDate::new);
    }
}
```

**Why these utilities matter:**
- **Discoverability:** Standard utilities are easier to find than custom validation code
- **Consistency:** Same validation predicates used across all value objects
- **High Level:** `Verify.Is::notBlank` tells "what", not "how", unlike `s -> !s.isBlank()`
- **Correctness:** Pre-tested utilities eliminate subtle bugs in custom predicates
- **AI-friendly:** Deterministic API surface for code generation

**Guidelines:**
- ✅ **Use `Verify.Is` predicates** instead of custom lambdas when available
- ✅ **Use `parse.*` utilities** instead of `Result.lift()` for standard JDK parsing
- ✅ **Combine predicates** with `Verify.combine()` for complex validation
- ❌ **Don't write manual checks** for length, null, blank, numeric bounds
- ❌ **Don't wrap JDK parsers** that already have `parse.*` equivalents

### No Business Exceptions

Business failures are not exceptional - they're expected outcomes of business rules. An invalid email isn't an exception; it's a normal case of bad input. An account being locked isn't an exception; it's a business state.

**The rule:** Business logic never throws exceptions for business failures. All failures flow through `Result` or `Promise` as typed `Cause` objects.

**Why by criteria:**
- **Mental Overhead**: Checked exceptions pollute signatures (+1 for Result). Unchecked exceptions are invisible - must read implementation (+2 for Result).
- **Business/Technical Ratio**: Exception stack traces are technical noise; typed Causes are domain concepts (+2 for Result).
- **Reliability**: Exceptions bypass type checker; Result makes all failures explicit and compiler-verified (+3 for Result).
- **Complexity**: Exception hierarchies create cross-package coupling (+1 for Result).

Traditional exception-based code:
```java
// DON'T: Exceptions for business logic
public User loginUser(String email, String password) throws
        InvalidEmailException,
        InvalidPasswordException,
        AccountLockedException,
        CredentialMismatchException {

    if (!isValidEmail(email)) {
        throw new InvalidEmailException(email);
    }
    
    if (!isValidPassword(password)) {
        throw new InvalidPasswordException();
    }

    User user = userRepo.findByEmail(email)
                        .orElseThrow(() -> new CredentialMismatchException());

    if (user.isLocked()) {
        throw new AccountLockedException(user.getId());
    }
    
    if (!passwordMatches(user, password)) {
        throw new CredentialMismatchException();
    }

    return user;
}
```

Problems: Checked exceptions pollute signatures and force callers to handle or rethrow. Unchecked exceptions are invisible in signatures - you can't tell what might fail without reading implementation. Exception hierarchies create coupling. Stack traces are expensive and often irrelevant for business failures. Testing requires catching exceptions and inspecting types.

Result-based code:
```java
// DO: Failures as typed values
public Result<User> loginUser(String emailRaw, String passwordRaw) {
    return Result.all(Email.email(emailRaw),
                      Password.password(passwordRaw))
                 .flatMap(this::validateAndCheckStatus);
}

private Result<User> validateAndCheckStatus(Email email, Password password) {
    return checkCredentials(email, password)
        .flatMap(this::checkAccountStatus);
}

private Result<User> checkCredentials(Email email, Password password) {
    return userRepo.findByEmail(email)
                   .flatMap(user -> validatePassword(user, password));
}

private Result<User> validatePassword(User user, Password password) {
    return passwordMatches(user, password)
        ? Result.success(user)
        : LoginError.InvalidCredentials.INSTANCE.result();
}

private Result<User> checkAccountStatus(User user) {
    return user.isLocked()
        ? new LoginError.AccountLocked(user.id()).result()
        : Result.success(user);
}
```

Every failure is a `Cause`. The `LoginError` is a sealed interface defining the failure modes:

```java
public sealed interface LoginError extends Cause {
    record AccountLocked(UserId userId) implements LoginError {
        @Override
        public String message() {
            return "Account is locked: " + userId;
        }
    }

    enum InvalidCredentials implements LoginError {
        INSTANCE;

        @Override
        public String message() {
            return "Invalid email or password";
        }
    }
}
```

Failures compose: `Result.all(Email.email(...), Password.password(...))` collects validation failures into a `CompositeCause` automatically. If both email and password are invalid, the caller gets both errors, not just the first one encountered.

**Adapter exceptions:** Foreign code (libraries, frameworks, databases) throws exceptions. Adapter leaves catch these and convert them to `Cause` objects.

The Pragmatica library provides `lift()` methods for each monad type to handle exception-to-Cause conversion:

```java
public interface UserRepository {
    Promise<Option<User>> findByEmail(Email email);
}

// Implementation (adapter leaf)
record JpaUserRepository(EntityManager entityManager) implements UserRepository {
    public Promise<Option<User>> findByEmail(Email email) {
        return Promise.lift(RepositoryError::fromDatabaseException, 
                            () -> retrieveUser(email));
    }
    
    private User retrieveUser(Email email) {
        return entityManager.createQuery("SELECT u FROM User u WHERE u.email = :email", UserEntity.class)
                            .setParameter("email", email.value())
                            .getResultList()
                            .stream()
                            .findFirst()
                            .map(this::toDomain)
                            .orElse(Option.none());
    }
}
```

The `lift()` methods handle try-catch boilerplate and exception-to-Cause conversion automatically or via provided exception-to-cause mapping function. Each monad type provides its own `lift()` method: `Option.lift()`, `Result.lift()`, and `Promise.lift()`. The adapter wraps checked `PersistenceException` in a domain `Cause` (`RepositoryError.DatabaseFailure`). Business logic never sees `PersistenceException` - only domain errors.

**Why this matters:** Errors are just data. You compose them with `map`, `flatMap`, and `all()` like any other value. Testing is easy - assert on `Cause` types without catching exceptions. AI can generate error handling mechanically because the pattern is always the same: `SomeCause.INSTANCE.result()` or `SomeCause.INSTANCE.promise()`.

### Error Recovery Patterns

When business operations fail, you often need recovery strategies beyond simple propagation. The `.recover()` method enables sophisticated error handling while maintaining type safety.

**Strategy 1: Fallback to Default Value**

When a failure is acceptable and you have a sensible default:

```java
// Load user theme, fallback to default if not found
public Promise<Theme> loadThemeFor(UserId id) {
    return themeRepository.findByUserId(id)
                          .flatMap(opt -> opt.async(ThemeNotFound.cause(id)))
                          .recover(_ -> Promise.success(Theme.DEFAULT));
}

// Or more concisely
public Promise<Theme> loadThemeFor(UserId id) {
    return themeRepository.findByUserId(id)
                          .map(opt -> opt.orElse(Theme.DEFAULT))
                          .async();
}
```

**Strategy 2: Retry with Different Approach**

When primary approach fails, try alternative:

```java
// Try primary API, fallback to secondary if primary fails
public Promise<ExchangeRate> fetchRate(Currency from, Currency to) {
    return primaryRateApi.getRate(from, to)
                         .recover(primaryError -> {
                             log.warn("Primary API failed: {}, trying secondary", primaryError.message());
                             return secondaryRateApi.getRate(from, to);
                         });
}
```

**Strategy 3: Transform Error Type**

Map low-level errors to domain-appropriate ones:

```java
// Map network errors to service unavailable
private static final Cause TIMEOUT = new ServiceUnavailable("User service timed out");
private static final Cause UNREACHABLE = new ServiceUnavailable("User service unreachable");

public Promise<User> loadUser(UserId id) {
    return httpClient.get("/users/" + id.value())
                     .recover(this::recoverNetworkError);
}

private Promise<User> recoverNetworkError(Cause cause) {
    return switch (cause) {
        case NetworkError.Timeout ignored -> TIMEOUT.promise();
        case NetworkError.Connection ignored -> UNREACHABLE.promise();
        default -> cause.promise();
    };
}
```

**Strategy 4: Partial Success (Degrade Gracefully)**

Continue operation with reduced functionality when non-critical parts fail:

```java
// Load dashboard data, continue even if some sections fail
public Promise<Dashboard> loadDashboard(UserId id) {
    return Promise.all(loadProfile(id), 
                       loadNotifications(id).recover(_ -> Promise.success(Notifications.EMPTY)), 
                       loadActivity(id).recover(_ -> Promise.success(Activity.EMPTY)))
                  .map(Dashboard::new);
}
```

**Strategy 5: Convert to Optional**

When absence is acceptable but failure is not:

```java
// Find optional configuration, treat "not found" as empty
public Promise<Option<Config>> findConfig(ConfigKey key) {
    return configRepository.load(key)
                           .map(Option::some)
                           .recover(this::recoverConfigNotFound);
}

private Promise<Option<Config>> recoverConfigNotFound(Cause cause) {
    return switch (cause) {
        case ConfigNotFound ignored -> Promise.success(Option.none());
        default -> cause.promise();
    };
}
```

**Strategy 6: Retry with Exponential Backoff**

Use Pragmatica Lite's `Retry` utility for transient failures:

```java
import org.pragmatica.lang.utils.Retry;
import static org.pragmatica.lang.utils.Retry.BackoffStrategy;
import static org.pragmatica.lang.io.TimeSpan.timeSpan;

// Retry transient network failures
public Promise<Response> callExternalService(Request request) {
    var retry = Retry.create()
                     .attempts(3)
                     .strategy(BackoffStrategy.exponential()
                                              .initialDelay(timeSpan(100).millis())
                                              .maxDelay(timeSpan(5).seconds())
                                              .factor(2.0)
                                              .withJitter());

    return retry.execute(() -> httpClient.post("/api/endpoint", request));
}
```

**Strategy 7: Circuit Breaker Pattern**

Fail fast when service is degraded (prevents cascading failures):

```java
  import org.pragmatica.lang.utils.CircuitBreaker;

// Protect against cascade failures
private final CircuitBreaker breaker = CircuitBreaker.create()
                                                     .failureThreshold(5)
                                                     .timeout(timeSpan(30).seconds());

public Promise<Data> fetchFromUnstableService(Query query) {
    return breaker.execute(() -> unstableService.query(query))
                  .recover(cause -> recoverWithCache(cause, query));
}

private Promise<Data> recoverWithCache(Cause cause, Query query) {
    return switch (cause) {
        case CircuitOpen ignored -> cache.get(query);
        default -> cause.promise();
    };
}
```

**Anti-patterns to avoid:**

❌ **Silent failure recovery:**
```java
// DON'T: Hide all errors
operation.recover(_ -> Promise.success(Unit.unit()))  // Where did the error go?
```

✅ **Explicit error handling:**
```java
// DO: Trace before recovering
operation.trace() // Add tracing information to the error.
         .recover(cause -> loggingAspect(cause, Promise.success(fallbackValue))); // Log and return fallback value
```

❌ **Overly broad recovery:**
```java
// DON'T: Recover all errors the same way
operation.recover(_ -> useDefault())  // What about real errors?
```

✅ **Selective recovery:**
```java
// DO: Only recover expected errors
operation.recover(cause -> switch (cause) {
    case NotFound ignored, Timeout ignored -> useDefault();
    default -> cause.promise();  // Let unexpected errors propagate
})
```

**Key principle:** Recovery is business logic. The pattern should match business requirements: "if user theme not found, use default" is clear business logic. "if anything fails, ignore it" is hiding problems.

### Single Pattern Per Function

Every function implements exactly one pattern from a fixed catalog: Leaf, Sequencer, Fork-Join, Condition, or Iteration. (Aspects are the exception - they decorate other patterns.)

**Why?** Cognitive load. When reading a function, you should recognize its shape immediately. If it's a Sequencer, you know it chains dependent steps linearly. If it's Fork-Join, you know it runs independent operations and combines results. Mixing patterns within a function creates mixed abstraction levels and forces readers to hold multiple mental models simultaneously.

This rule has a mechanical benefit: it makes refactoring deterministic. When a function grows beyond one pattern, you extract the second pattern into its own function. There's no subjective judgment about "is this too complex?" - if you're doing two patterns, split it.

**Why by criteria:**
- **Mental Overhead**: One pattern per function means immediate recognition - no mental model switching (+2).
- **Complexity**: Mechanical refactoring rule eliminates subjective debates about "too complex" (+2).
- **Design Impact**: Forces proper abstraction layers - no mixing orchestration with computation (+2).

### Single Level of Abstraction

**The rule:** No complex logic inside lambdas. Lambdas passed to `map`, `flatMap`, and similar combinators may contain only:
- Method references (e.g., `Email::new`, `this::processUser`)
- Single method calls with parameter forwarding (e.g., `param -> someMethod(outerParam, param)`)

**Why?** Lambdas are composition points, not implementation locations. When you bury logic inside a lambda, you hide abstraction levels and make the code harder to read, test, and reuse. Extract complex logic to named functions - the name documents intent, the function becomes testable in isolation, and the composition chain stays flat and readable.

**Why by criteria:**
- **Mental Overhead**: Flat composition chains scan linearly - no descending into nested logic (+2).
- **Business/Technical Ratio**: Named functions document intent; anonymous lambdas hide it (+2).
- **Complexity**: Each function testable in isolation; buried lambda logic requires testing through container (+2).

**Anti-pattern:**
```java
// DON'T: Complex logic inside lambda
return fetchUser(userId)
       .flatMap(user -> {
           if (user.isActive() && user.hasPermission("admin")) {
               return loadAdminDashboard(user)
                      .map(dashboard -> {
                          var summary = new Summary(
                              dashboard.metrics(),
                              dashboard.alerts().stream()
                                       .filter(Alert::isUrgent)
                                       .toList()
                          );
                          return new Response(user, summary);
                      });
           } else {
               return AccessError.InsufficientPermissions.INSTANCE.promise();
           }
       });
```

This lambda contains: conditional logic, nested map, stream processing, object construction. Mixed abstraction levels. Hard to test. Hard to read.

**Correct approach:**
```java
// DO: Extract to named functions
return fetchUser(userId)
       .flatMap(this::checkAdminAccess)
       .flatMap(this::loadAdminDashboard)
       .map(this::buildResponse);

private Promise<User> checkAdminAccess(User user) {
    return isActiveAdministrator(user)
        ? Promise.success(user)
        : AccessError.InsufficientPermissions.INSTANCE.promise();
}

private boolean isActiveAdministrator(User user) {
    return user.isActive() && user.hasPermission("admin");
}

private Promise<Dashboard> loadAdminDashboard(User user) {
    return dashboardService.loadDashboard(user);
}

private Response buildResponse(Dashboard dashboard) {
    var urgentAlerts = filterUrgentAlerts(dashboard.alerts());
    var summary = new Summary(dashboard.metrics(), urgentAlerts);
    return new Response(dashboard.user(), summary);
}

private List<Alert> filterUrgentAlerts(List<Alert> alerts) {
    return alerts.stream()
                 .filter(Alert::isUrgent)
                 .toList();
}
```

Now the top-level chain reads linearly: fetch → check access → load dashboard → build response. Each step is named, testable, and at a single abstraction level.

**The Three-Zone Framework:**

> The following zone-based approach to abstraction levels is inspired by [Derrick Brandt's article on clean code](https://medium.com/@brandt.a.derrick/how-to-write-clean-code-actually-5205963ec524), adapted for JBCT patterns.

Think of abstraction levels as three distinct zones, each with its own vocabulary:

- **Zone 1 (Use Case Level)**: High-level business goals
  - `RegisterUser.execute()`, `ProcessOrder.execute()`
  - One zone 1 function per use case

- **Zone 2 (Orchestration Level)**: Coordinating steps that break down the goal
  - Step interfaces in Sequencer/Fork-Join patterns
  - Verbs: `validate`, `process`, `handle`, `transform`, `apply`, `manage`
  - Examples: `validateInput()`, `processPayment()`, `handleNotification()`

- **Zone 3 (Implementation Level)**: Concrete technical operations
  - Business and adapter leaves
  - Verbs: `get`, `set`, `fetch`, `parse`, `calculate`, `convert`, `check`
  - Examples: `hashPassword()`, `parseJson()`, `fetchFromDatabase()`

**The Stepdown Rule Test:**

Your code passes the abstraction test if you can narrate it naturally by adding "to" before each function:

```java
// Good - reads as a story
public Promise<Response> execute(Request request) {
    return ValidRequest.validRequest(request)  // To execute, we validate the request
                       .async()
                       .flatMap(this::processPayment)         // then we process payment
                       .flatMap(this::sendConfirmation);      // then we send confirmation
}
```

Try reading it aloud: "_To execute, we validate the request, then process payment, then send confirmation_." If it flows naturally, your abstraction levels align.

**Allowed simple lambdas:**

Method reference:
```java
// DO: Method reference
.map(Email::new)
.flatMap(this::saveUser)
.map(User::id)
```

Single method call with parameter forwarding:
```java
// DO: Simple parameter forwarding
.flatMap(user -> checkPermissions(requiredRole, user))
.map(order -> calculateTotal(taxRate, order))
```

**Forbidden in lambdas:**

No ternaries (they are the Condition pattern, violates Single Pattern per Function):
```java
// DON'T: Ternary in lambda (violates Single Pattern per Function)
.flatMap(user -> user.isPremium()
    ? applyPremiumDiscount(user)
    : applyStandardDiscount(user))

// DO: Extract to the named function
.flatMap(this::applyApplicableDiscount)

private Result<Discount> applyApplicableDiscount(User user) {
    return user.isPremium()
        ? applyPremiumDiscount(user)
        : applyStandardDiscount(user);
}
```

No conditionals whatsoever:
```java
// DON'T: Any conditional logic in lambda
.flatMap(user -> {
    if (user.isPremium()) {
        return applyPremiumDiscount(user);
    } else {
        return applyStandardDiscount(user);
    }
})

// DO: Extract to the named function
.flatMap(this::applyApplicableDiscount)
```

**Why this matters for AI:** Single level of abstraction makes code generation deterministic. When an AI sees a `flatMap`, it knows to generate either a method reference or a simple parameter-forwarding lambda - nothing else. No decisions about "is this ternary simple enough?" When reading code, the AI can parse the top-level structure without descending into nested lambda logic. Humans benefit identically: scan the chain to understand flow, dive into named functions only when needed.

**Example violation:**
```java
// DON'T: Mixing Sequencer and Fork-Join
public Result<Report> generateReport(ReportRequest request) {
    return ValidRequest.validRequest(request)
                       .flatMap(valid -> {
                           // Sequencer starts here
                           var userData = fetchUserData(valid.userId());
                           var salesData = fetchSalesData(valid.dateRange());

                           // Wait, now we're doing Fork-Join?
                           return Result.all(userData, salesData)
                                        .flatMap((user, sales) -> computeMetrics(user, sales))
                                        .flatMap(this::formatReport);  // Back to Sequencer
                       });
}
```

This function starts as a Sequencer (validate → fetch user → fetch sales → compute → format), but `fetchUserData` and `fetchSalesData` are independent, so we suddenly do a Fork-Join in the middle. Mixed abstraction levels. Hard to test. Unclear at a glance what the function does.

**Corrected:**
```java
// DO: One pattern per function
public Result<Report> generateReport(ReportRequest request) {
    return ValidRequest.validRequest(request)
                       .flatMap(this::fetchReportData)
                       .flatMap(this::computeMetrics)
                       .flatMap(this::formatReport);
}

private Result<ReportData> fetchReportData(ValidRequest request) {
    // This function is a Fork-Join
    return Result.all(fetchUserData(request.userId()),
                      fetchSalesData(request.dateRange()))
                 .map(ReportData::new);
}
```

Now `generateReport` is a pure Sequencer (validate → fetch → compute → format), and `fetchReportData` is a pure Fork-Join. Each function has one clear job.

**Mechanical refactoring:** If you're writing a Sequencer and realize step 3 needs to do a Fork-Join internally, extract step 3 into its own function that implements Fork-Join. The original Sequencer stays clean.

### Monadic Composition Rules

The four return kinds compose via `map`, `flatMap`, `filter`, and aggregation combinators (`all`, `any`). Understanding when to lift and how to avoid nesting is essential.

**Lifting:** You can lift a "lower" type into a "higher" one at call sites:
- `T` → `Option<T>` (via `Option.option(value)`)
- `T` → `Result<T>` (via `Result.success(value)`)
- `T` → `Promise<T>` (via `Promise.success(value)`)
- `Option<T>` → `Result<T>` (via `option.toResult(cause)` or `option.await(cause)`)
- `Option<T>` → `Promise<T>` (via `option.async(cause)` or `option.async()`)
- `Result<T>` → `Promise<T>` (via `result.async()`)

You lift when composing functions that return different types:

```java
// Sync validation (Result) lifted into async flow (Promise)
public Promise<Response> execute(Request request) {
    return ValidRequest.validRequest(request)
                       .async()  // Result has dedicated async() method to convert to Promise
                       .flatMap(step1::apply)  // step1 returns Promise
                       .flatMap(step2::apply); // step2 returns Promise
}
```

**Forbidden nesting:** `Promise<Result<T>>` is not allowed. `Promise<T>` already carries failures - nesting `Result` inside creates two error channels and forces callers to unwrap twice. If a function is async and can fail, it returns `Promise<T>`, period.

Wrong:
```java
// DON'T: Nested error channels
Promise<Result<User>> loadUser(UserId id) { /* ... */ }

// Caller must unwrap twice:
loadUser(id)
    .flatMap(resultUser -> resultUser.fold(
                               Cause::promise,
                               user -> Promise.success(user)
                           ));  // Absurd ceremony
```

Right:
```java
// DO: One error channel
Promise<User> loadUser(UserId id) { /* ... */ }

// Caller just chains:
return loadUser(id).flatMap(nextStep);
```

**Allowed nesting:** `Result<Option<T>>` is permitted sparingly for "optional value that can fail validation." This represents: "If present, must be valid. If absent, that's fine." Example: optional referral code that must match a pattern when provided.

```java
Result<Option<ReferralCode>> refCode = ReferralCode.referralCode(input);
// Success(None) = not provided, valid
// Success(Some(code)) = provided and valid
// Failure(cause) = provided but invalid
```

Avoid `Option<Result<T>>` - it means "maybe there's a result, and that result might have failed," which is backwards. Just use `Result<Option<T>>`.

**Aggregation:** Use `Result.all(...)` or `Promise.all(...)` to combine multiple independent operations:

```java
// Validation: collect multiple field validations
Result<ValidRequest> validated = Result.all(Email.email(raw.email()),                                             
                                            Password.password(raw.password()),
                                            ReferralCode.referralCode(raw.referralCode()))
                                       .flatMap(ValidRequest::new);

// Async: run independent queries in parallel
Promise<Report> report = Promise.all(userRepo.findById(userId),
                                     orderRepo.findByUser(userId),
                                     inventoryService.getAvailableItems())
                                .flatMap(this::generateReport);
```

If any input fails, `all()` collects all values and then collects failures (CompositeCause).

**Why these rules?** They prevent complexity explosion. With exactly four return types and clear composition rules, you can always tell how to combine two functions by looking at their signatures. AI code generation becomes mechanical - given input and output types, there's one obvious way to compose.

#### Lambda Complexity Rules

Lambdas passed to monadic operations (`map`, `flatMap`, `recover`, `filter`) must be minimal. Complex logic belongs in named methods.

**Allowed in lambdas:**
- Method references: `Email::new`, `this::processUser`, `User::id`
- Simple parameter forwarding: `user -> validate(requiredRole, user)`
- Constructor references for error mapping: `RepositoryError.DatabaseFailure::new`

**Forbidden in lambdas:**
- Conditionals (`if`, ternary, `switch`)
- Try-catch blocks
- Multi-statement blocks
- Object construction beyond simple factory calls

**Use switch expressions for type matching:**

Instead of `if (instanceof)` chains, use pattern matching switch expressions in named methods:

```java
// DON'T: instanceof chain in lambda
.recover(cause -> {
    if (cause instanceof NotFound) {
        return useDefault();
    }
    if (cause instanceof Timeout) {
        return useDefault();
    }
    return cause.promise();
})

// DO: Extract to named method with switch expression
.recover(this::recoverExpectedErrors)

private Promise<Data> recoverExpectedErrors(Cause cause) {
    return switch (cause) {
        case NotFound ignored, Timeout ignored -> useDefault();
        default -> cause.promise();
    };
}
```

**Multi-case pattern matching:** When multiple error types require the same recovery strategy, use comma-separated cases:

```java
private Promise<Theme> recoverWithDefault(Cause cause) {
    return switch (cause) {
        case NotFound ignored, Timeout ignored, ServiceUnavailable ignored ->
            Promise.success(Theme.DEFAULT);
        default -> cause.promise();
    };
}
```

**Extract error constants:**

Don't construct `Cause` instances inline with fixed messages. Define them as `static final` constants:

```java
// DON'T: Inline construction with fixed strings
private Promise<User> recoverNetworkError(Cause cause) {
    return switch (cause) {
        case NetworkError.Timeout ignored ->
            new ServiceUnavailable("User service timed out").promise();
        case NetworkError.Connection ignored ->
            new ServiceUnavailable("User service unreachable").promise();
        default -> cause.promise();
    };
}

// DO: Extract as constants
private static final Cause TIMEOUT = new ServiceUnavailable("User service timed out");
private static final Cause UNREACHABLE = new ServiceUnavailable("User service unreachable");

private Promise<User> recoverNetworkError(Cause cause) {
    return switch (cause) {
        case NetworkError.Timeout ignored -> TIMEOUT.promise();
        case NetworkError.Connection ignored -> UNREACHABLE.promise();
        default -> cause.promise();
    };
}
```

**Why these rules:**
- **Mental Overhead**: Flat composition chains read linearly - no descending into nested logic (+2).
- **Business/Technical Ratio**: Named methods document intent; anonymous lambdas hide it (+2).
- **Complexity**: Extracted methods are testable in isolation; buried logic requires testing through container (+2).
- **Reliability**: Switch expressions provide exhaustiveness checking; instanceof chains don't (+1).

---

## Patterns Reference

### Leaf

**Definition:** A Leaf is the smallest unit of processing - a function that does one thing and has no internal steps. It's either a business leaf (pure computation) or an adapter leaf (I/O or side effects).

**Rationale (by criteria):**
- **Mental Overhead**: Atomic operations have no internal steps to track - immediate comprehension (+2).
- **Business/Technical Ratio**: Business leaves are pure domain logic; adapter leaves isolate technical concerns (+2).
- **Complexity**: Single responsibility per leaf - no hidden interactions (+2).
- **Reliability**: Pure business leaves are deterministic and easily testable (+1).

**Business leaves** are pure functions that transform data or enforce business rules. Common examples:

```java
// Simple calculation leaf
public static Price calculateDiscount(Price original, Percentage rate) {
    return original.multiply(rate);
}

// Domain rule enforcement leaf
public static Result<Unit> checkInventory(Product product, Quantity requested) {
    return product.availableQuantity().isGreaterThanOrEqual(requested)
        ? Result.unitResult()
        : InsufficientInventory.cause(product.id(), requested);
}

// Data transformation leaf
public static OrderSummary toSummary(Order order) {
    return new OrderSummary(order.id(), 
                            order.totalAmount(), 
                            order.items().size());
}
```

If there's no I/O and no side effects, it's a business leaf. Keep each leaf focused on one transformation or one business rule.

**Adapter leaves** integrate with external systems: databases, HTTP clients, message queues, file systems. They map foreign errors to domain Causes:

```java
public interface UserRepository {
    Promise<Option<User>> findByEmail(Email email);
}

// Adapter leaf implementation
class PostgresUserRepository implements UserRepository {
    private final DataSource dataSource;

    public Promise<Option<User>> findByEmail(Email email) {
        return Promise.lift(RepositoryError.DatabaseFailure::new, 
                            () -> queryUserByEmail(email))
                      .map(Option::option);
    }

    private User queryUserByEmail(Email email) throws SQLException {
        try (var conn = dataSource.getConnection();
             var stmt = conn.prepareStatement("SELECT * FROM users WHERE email = ?")) {

            stmt.setString(1, email.value());
            var rs = stmt.executeQuery();

            return rs.next() ? mapUser(rs) : null;
        }
    }

    private User mapUser(ResultSet rs) throws SQLException {
        // Mapping logic; SQLException handled by Promise.lift()
        return new User(/* ... */);
    }
}
```

The adapter catches `SQLException` and wraps it in `RepositoryError.DatabaseFailure`, a domain `Cause`. Callers never see `SQLException`.

**Thread Safety:** Leaf operations are **thread-safe through confinement** - each invocation operates independently with its own local state. Mutable local variables (accumulators, builders, working objects) are safe within a leaf because they never escape the function scope. Input parameters must be treated as read-only (see [Immutability and Thread Confinement](#immutability-and-thread-confinement)).

**Placement:** If a leaf is only used by one caller, keep it nearby (same file, same package). If it's reused, move it immediately to the nearest `shared` package. Don't defer - tech debt accumulates when shared code stays in wrong locations.

**Anti-patterns:**

DON'T mix abstraction levels in a leaf:
```java
// DON'T: This "leaf" is actually doing multiple steps
public static Result<Email> email(String raw) {
    var normalized = raw.trim().toLowerCase();
    if (!isValid(normalized)) {
        logValidationFailure(normalized);  // Side effect!
        return EmailError.INVALID.result();
    }
    return Result.success(new Email(normalized));
}
```

This leaf has a side effect (logging) mixed with validation logic. Extract logging to an Aspect decorator if needed.

DON'T let adapter leaves leak foreign types:
```java
// DON'T: SQLException leaks into business logic
Promise<Option<User>> findByEmail(Email email) throws SQLException {
    // Business logic should never see SQLException
}
```

Wrap all foreign exceptions in domain Causes within the adapter.

**Framework independence:** Adapter leaves form the bridge between business logic and framework-specific code. This isolation is critical for maintaining framework-agnostic business logic. Strongly prefer adapter leaves for all I/O operations (database access, HTTP calls, file system operations, message queues). This ensures you can swap frameworks (Spring → Micronaut, JDBC → JOOQ) without touching business logic - only rewrite the adapters.

However, dependencies on specific libraries for business functionality (encryption libraries, complex mathematical computations, specialized algorithms) are acceptable within business logic when they're essential to the domain. The key distinction: I/O adapters isolate infrastructure choices; domain libraries implement business requirements.

DO keep leaves focused:
```java
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forOneValue("Invalid email %s");

    // DO: One clear responsibility
    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
                     .map(String::trim)
                     .map(String::toLowerCase)
                     .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
                     .map(Email::new);
    }
}
```

Linear flow, clear responsibility, no side effects, foreign errors properly wrapped.

### Sequencer

**Definition:** A Sequencer chains dependent steps linearly using `map` and `flatMap`. Each step's output feeds the next step's input. This is the primary pattern for use case implementation.

**Rationale (by criteria):**
- **Mental Overhead**: Linear flow, 2-5 steps fits short-term memory capacity - predictable structure (+3).
- **Business/Technical Ratio**: Steps mirror business process language - reads like requirements (+3).
- **Complexity**: Fail-fast semantics, each step isolated and testable (+2).
- **Design Impact**: Forces proper step decomposition, prevents monolithic functions (+2).

**The 2-5 rule:** A Sequencer should have 2 to 5 steps. Fewer than 2, and it's probably just a Leaf. More than 5, and it needs decomposition - extract sub-sequencers or group steps.

> The rule is intended to limit local complexity. It is derived from the average size of short-term memory - 7 +- 2 elements.

**Domain requirements take precedence:** Some functions inherently require more steps because the domain demands it. Value object factories may need multiple validation and normalization steps to ensure invariants - this is correct because the validation logic must be concentrated in one place. Fork-Join patterns may need to aggregate 6+ independent results because that's what the domain requires. Don't artificially fit domain logic into numeric rules. The 2-5 guideline helps you recognize when to consider refactoring, but domain semantics always win. 

Sync example:
```java
public interface ProcessOrder {
    record Request(String orderId, String paymentToken) {}
    record Response(OrderConfirmation confirmation) {}

    Result<Response> execute(Request request);

    interface ValidateInput { 
        Result<ValidRequest> apply(Request raw); 
    }
    interface ReserveInventory { 
        Result<Reservation> apply(ValidRequest req); 
    }
    interface ProcessPayment { 
        Result<Payment> apply(Reservation reservation); 
    }
    interface ConfirmOrder { 
        Result<Response> apply(Payment payment); 
    }

    static ProcessOrder processOrder(ValidateInput validate, 
                                     ReserveInventory reserve, 
                                     ProcessPayment processPayment, 
                                     ConfirmOrder confirm) {
        return request -> validate.apply(request)                 // Step 1
                                  .flatMap(reserve::apply)        // Step 2
                                  .flatMap(processPayment::apply) // Step 3
                                  .flatMap(confirm::apply);       // Step 4
    }
}
```

Four steps, each a single-method interface. The `execute()` body reads top-to-bottom: validate → reserve → process payment → confirm. Each step returns `Result<T>`, so we chain with `flatMap`. If any step fails, the chain short-circuits and returns the failure.

Async example (same structure, different types):
```java
public Promise<Response> execute(Request request) {
    return ValidateInput.validate(request)              // returns Result<ValidInput>
                        .async()                        // lift to Promise<ValidInput>
                        .flatMap(reserve::apply)        // returns Promise<Reservation>
                        .flatMap(processPayment::apply) // returns Promise<Payment>
                        .flatMap(confirm::apply);       // returns Promise<Response>
}
```

Validation is synchronous (returns `Result`), so we lift it to `Promise` using `.async()`. The rest of the chain is async.

**Thread Safety:** Sequencer pattern is **thread-safe through sequential execution** - steps execute one after another, never in parallel. Each step is isolated and thread-confined. Mutable local state within individual steps is safe because steps don't overlap. Data passed between steps must be immutable (see [Immutability and Thread Confinement](#immutability-and-thread-confinement)).

**When to extract sub-sequencers:**

As soon as you need more than one pattern to express business logic, that other pattern
should be extracted into own (step) method. If method continues to grow and exceeds one pattern,
method should be moved into a dedicated interface.
Suppose `processPayment` actually needs to: authorize card → capture funds → record transaction. That's three dependent steps - a Sequencer. Extract:

```java
// Original step interface
interface ProcessPayment {
    Promise<Payment> apply(Reservation reservation);
}

// Implementation delegates to a sub-sequencer
interface CreditCardPaymentProcessor extends ProcessPayment {
    interface AuthorizeCard {
        Promise<Reservation> apply(Reservation reservation);
    }
    interface CaptureFunds {
        Promise<Reservation> apply(Reservation reservation);
    }
    interface RecordTransaction {
        Promise<Payment> apply(Reservation reservation);
    }

    static CreditCardPaymentProcessor creditCardPaymentProcessor(AuthorizeCard authorizeCard,
                                                                 CaptureFunds captureFunds,
                                                                 RecordTransaction recordTransaction) {
        return (reservation) -> authorizeCard.apply(reservation)
                                             .flatMap(captureFunds::apply)
                                             .flatMap(recordTransaction::apply);
    }
}
```

Now `CreditCardPaymentProcessor` is itself a Sequencer with three steps. The top-level use case remains a clean 4-step chain.

**Anti-patterns:**

DON'T nest logic inside flatMap (violates Single Level of Abstraction):
```java
// DON'T: Business logic buried in lambda
return validate.apply(request)
               .flatMap(valid -> {
                   if (valid.isPremiumUser()) {
                       return applyDiscount(valid)
                              .flatMap(reserve::apply);
                   } else {
                       return reserve.apply(valid);
                   }
               })
               .flatMap(processPayment::apply);
```

The conditional logic is hidden inside the lambda. Extract it:

```java
// DO: Extract to the named function (Single Level of Abstraction)
return validate.apply(request)
               .flatMap(this::applyDiscountIfEligible)
               .flatMap(reserve::apply)
               .flatMap(processPayment::apply);

private Result<ValidRequest> applyDiscountIfEligible(ValidRequest request) {
    return request.isPremiumUser()
        ? applyDiscount(request)
        : Result.success(request);
}
```

DON'T mix Fork-Join inside a Sequencer without extraction:
```java
// DON'T: Suddenly doing Fork-Join mid-sequence (violates Single Pattern + SLA)
return validate.apply(request)
               .flatMap(valid -> {
                   var userPromise = fetchUser(valid.userId());
                   var productPromise = fetchProduct(valid.productId());
                   return Promise.all(userPromise, productPromise)
                                 .flatMap((user, product) -> reserve.apply(user, product));
               })
               .flatMap(processPayment::apply);
```

Extract the Fork-Join:

```java
// DO: Extract Fork-Join to its own step
return validate.apply(request)
               .flatMap(this::fetchUserAndProduct)  // Fork-Join inside this step
               .flatMap(reserve::apply)
               .flatMap(processPayment::apply);

private Promise<ReservationInput> fetchUserAndProduct(ValidRequest request) {
    return Promise.all(fetchUser(request.userId()),
                       fetchProduct(request.productId()))
                  .map(ReservationInput::new);
}
```

DO keep the sequence flat and readable:
```java
// DO: Linear, one step per line
return validate.apply(request)
               .flatMap(step1::apply)
               .flatMap(step2::apply)
               .flatMap(step3::apply)
               .flatMap(step4::apply);
```

### Fork-Join

**Definition:** Fork-Join (also known as Fan-Out-Fan-In) executes independent operations concurrently and combines their results. Use it when you have parallel work with no dependencies between branches.

**Rationale (by criteria):**
- **Mental Overhead**: Parallel execution explicit in structure - no hidden concurrency (+2).
- **Complexity**: Independence constraint acts as design validator - forces proper data organization (+3).
- **Reliability**: Type system prevents dependent operations from being parallelized (+2).
- **Design Impact**: Reveals coupling issues - dependencies surface as compile errors (+3).

**Two flavors:**

1. **Result.all(...)**  -  Synchronous aggregation (not concurrent, just collects multiple Results):
```java
// Validating multiple independent fields
Result<ValidRequest> valid = Result.all(Email.email(raw.email()),
                                        Password.password(raw.password()),
                                        AccountId.accountId(raw.accountId()))
                                   .map(ValidRequest::new);
```

If all succeed, you get a tuple of values to pass to the combiner. If any fail, you get a `CompositeCause` containing all failures (not just the first).

2. **Promise.all(...)**  -  Parallel async execution:
```java
// Running independent I/O operations in parallel
Promise<Dashboard> buildDashboard(UserId userId) {
    return Promise.all(userService.fetchProfile(userId),
                       orderService.fetchRecentOrders(userId),
                       notificationService.fetchUnread(userId))
                  .map(this::createDashboard);
}

private Dashboard createDashboard(Profile profile,
                                   List<Order> orders,
                                   List<Notification> notifications) {
    return new Dashboard(profile, orders, notifications);
}
```

All three fetches run concurrently. The Promise completes when all inputs complete successfully or fails immediately if any input fails.

**Special Fork-Join cases:**

Beyond the standard `Result.all()` and `Promise.all()`, there are specialized fork-join methods for specific aggregation needs. The parallel execution pattern remains the same, but the outcome differs:

1. **Promise.allOf(Collection<Promise<T>>)** - Parallel execution with the resilient collection:
```java
// Fetching data from the dynamic number of sources, collecting all outcomes
Promise<Report> generateSystemReport(List<ServiceId> services) {
    var healthChecks = services.stream()
                               .map(healthCheckService::check)
                               .toList();

    return Promise.allOf(healthChecks)
                  .map(this::createReport);
}

private Report createReport(List<Result<HealthStatus>> results) {
    var successes = results.stream()
                           .filter(Result::isSuccess)
                           .map(Result::value)
                           .toList();
    var failures = results.stream()
                          .filter(Result::isFailure)
                          .map(Result::cause)
                          .toList();
    return new Report(successes, failures);
}
```

Returns `Promise<List<Result<T>>>`  -  unlike `Promise.all()` which fails fast, `allOf()` waits for all promises to complete and collects both successes and failures. Use when you need comprehensive results even if some operations fail (monitoring, reporting, batch processing).

2. **Promise.any(Promise<T>...)** - Parallel execution with first-success wins:
```java
// Racing multiple data sources, using the first successful response
Promise<ExchangeRate> fetchRate(Currency from, Currency to) {
    return Promise.any(primaryRateProvider.getRate(from, to), 
                       secondaryRateProvider.getRate(from, to), 
                       fallbackRateProvider.getRate(from, to));
}
```

Returns the first successfully completed Promise, canceling remaining operations. Use for redundancy scenarios: failover between services, racing multiple data sources, or timeout alternatives.

**When to use Fork-Join:**

- Independent data fetching (parallel I/O)
- Validation of multiple fields with no cross-field dependencies
- Aggregating results from multiple services

**When NOT to use Fork-Join:**

- When operations have dependencies (use Sequencer)
- When you need results sequentially for logging/debugging (use Sequencer)
- When one operation's input depends on another's output (definitely Sequencer)

**Independence and Thread Safety: Two Views of the Same Requirement:**

Fork-Join has a crucial constraint: **all branches must be truly independent with immutable inputs**. This constraint serves two purposes simultaneously - it's both a design quality check and a thread safety guarantee.

**View 1: Design Independence** - When you try to write a Fork-Join and discover hidden dependencies, it reveals design issues:

- **Data redundancy:** If branch A needs data from branch B, maybe that data should be provided upfront, not fetched separately.
- **Incorrect data organization:** Dependencies often signal that data is split across sources when it should be colocated.
- **Missing abstraction:** Hidden dependencies may indicate a missing concept that would eliminate the coupling.

**View 2: Thread Safety** - Parallel execution requires immutable inputs to prevent data races:

- **All input data MUST be immutable** - no shared mutable state between parallel branches.
- **Local mutable state is safe** - thread-confined accumulators, builders within each branch are fine.
- **Results must be immutable** - data returned from branches will be combined, must be thread-safe.

**View 3: Infrastructure Independence** - Type-level independence is not the same as infrastructure-level independence. Operations that appear independent at the code level may conflict at the infrastructure level:

- **Database locks:** Two queries may deadlock on shared rows
- **Rate limits:** Parallel API calls may exhaust quotas
- **Connection pools:** Parallel operations may compete for connections
- **Transactions:** Operations in the same transaction may have ordering requirements

Validate infrastructure constraints, not just type signatures.

Example design issue uncovered by Fork-Join:
```java
// ❌ WRONG: Logical dependency
Promise.all(fetchUserProfile(userId),      // Returns User
            fetchUserPreferences(userId))  // Needs User.timezone from profile!
```

The dependency reveals that `UserPreferences` should either:
1. Be fetched together with `User` (they're part of the same aggregate)
2. Not need `User.timezone` (incorrect data organization - timezone should be stored with preferences)
3. Accept `timezone` as explicit input (surfacing the dependency in the type signature)

Example thread safety violation:
```java
// ❌ WRONG: Shared mutable state
private final DiscountContext context = new DiscountContext();  // Mutable, shared

Promise<Result> calculate() {
    return Promise.all(applyBogo(cart, context),        // DATA RACE
                       applyPercentOff(cart, context))  // DATA RACE - both branches mutate context
                  .map(this::merge);
}

// ✅ CORRECT: Immutable inputs
Promise<Result> calculate(Cart cart) {
    return Promise.all(applyBogo(cart),        // Immutable cart input
                       applyPercentOff(cart))  // Immutable cart input
                  .map(this::mergeDiscounts);  // Combine immutable results
}
```

When Fork-Join feels forced or unnatural, trust that instinct - it's often exposing a design problem (hidden dependencies) or safety issue (shared mutable state) that should be fixed, not worked around.

**Pattern-specific safety rules:**
- **Fork-Join:** All inputs MUST be immutable (parallel execution, no synchronization).
- **Sequencer, Leaf, Iteration:** Local mutable state is safe (thread-confined to operation).
- **Input parameters:** Always treat as read-only, regardless of pattern.
- **Results:** Always return immutable data.

### Validating Independence: A Practical Checklist

Before using Fork-Join, verify operations are truly independent using this checklist:

**✅ Independent Operations (Safe for Fork-Join):**

```java
// Example 1: Different data sources, no shared state
Promise.all(fetchUser(userId),           // User database
            fetchOrders(userId),         // Order database
            fetchNotifications(userId))  // Notification service
        .map(Dashboard::new);

// Why independent:
// - Different datasources (no locking conflicts)
// - userId is immutable value object
// - No shared mutable state
// - Results don't depend on each other
```

```java
// Example 2: Different computations on same immutable input
Promise.all(validateInventory(cart),  // Check stock levels
            calculateShipping(cart),  // Compute shipping cost
            applyDiscounts(cart)      // Calculate discounts
       .map((inventory, shipping, discounts) -> new OrderSummary(cart, inventory, shipping, discounts));

// Why independent:
// - Cart is immutable (read-only input)
// - Each operation does different calculation
// - No shared mutable context
// - Operations don't modify cart
```

**❌ Hidden Dependencies (Use Sequencer Instead):**

```java
// Example 1: Output of one needed by another
Promise.all(hashPassword(password),           // Expensive hashing
            checkPasswordStrength(password))  // Could reuse hash

// Problem: checkPasswordStrength might benefit from reusing hash
// Fix: Run sequentially, pass hash to strength check
hashPassword(password)
    .flatMap(hashed -> checkPasswordStrength(password, hashed.algorithm()))
```

```java
// Example 2: One operation's success affects another
Promise.all(reserveInventory(productId, quantity),  // Locks inventory
            chargePayment(paymentInfo))             // Charges credit card

// Problem: If inventory fails, payment already charged
// Fix: Use Sequencer - reserve first, then charge
reserveInventory(productId, quantity)
    .flatMap(reservation -> chargeAndCreateResult(reservation, paymentInfo))

private Promise<PurchaseResult> chargeAndCreateResult(Reservation reservation, PaymentInfo paymentInfo) {
    return chargePayment(paymentInfo)
           .map(payment -> new PurchaseResult(reservation, payment));
}
```

```java
// Example 3: Shared mutable context
var discountContext = new DiscountContext();  // MUTABLE
Promise.all(applyLoyaltyDiscount(cart, discountContext),   // Mutates context
            applyPromoDiscount(cart, discountContext))     // DATA RACE

// Problem: Both operations mutate shared context concurrently
// Fix: Make context immutable, merge results functionally
Promise.all(applyLoyaltyDiscount(cart),  // Returns DiscountResult
            applyPromoDiscount(cart))    // Returns DiscountResult
       .map(DiscountResult::merge)
```

**Checklist Questions:**

Ask yourself these questions before using Fork-Join:

1. **Data source independence:**
   - Do operations access the same database table/collection?
   - Could concurrent access cause locking conflicts?
   - ✅ Different datasources → likely independent
   - ❌ Same datasource with writes → likely dependent

2. **Input dependencies:**
   - Does operation B need the output of operation A?
   - Is any input parameter mutable?
   - ✅ All inputs immutable, no output dependencies → independent
   - ❌ B needs A's output → use Sequencer

3. **Shared state:**
   - Do operations share any mutable state (fields, parameters)?
   - Does any operation mutate its inputs?
   - ✅ No shared mutable state → independent
   - ❌ Shared mutable state → data race

4. **Business semantics:**
   - Must one operation complete before another starts?
   - Could parallel execution violate business rules?
   - ✅ No ordering requirement → independent
   - ❌ Order matters → use Sequencer

5. **Side effects:**
   - Do operations have side effects that could conflict?
   - Could parallel execution produce different results than sequential?
   - ✅ No conflicting side effects → independent
   - ❌ Conflicting side effects → use Sequencer

**Red flags that suggest hidden dependencies:**
- Operations have similar names (suggests they're parts of same logical step)
- Operations access related data (user profile + user settings → might be one aggregate)
- One operation validates what another computes (validation should be part of computation)
- Operations need to run in specific order "for efficiency" (efficiency isn't independence)
- You're tempted to add locking/synchronization (dependencies make you think about locks)

**Golden rule:** If you're unsure whether operations are independent, they probably aren't. Use Sequencer. Premature parallelization is a root of subtle bugs.

**Anti-patterns:**

DON'T use Fork-Join when there are hidden dependencies:
```java
// DON'T: These aren't actually independent
Promise.all(allocateInventory(orderId),   // Might lock inventory
            chargePayment(paymentToken))  // Should only charge if inventory succeeds
       .flatMap((inventory, payment) -> confirmOrder(inventory, payment));
```

If inventory allocation fails, we've already charged the customer. These steps have a logical dependency: charge only after successful allocation. Use a Sequencer.

DON'T ignore errors in Fork-Join branches:
```java
// DON'T: Silently swallowing failures
Promise.all(fetchPrimary(id).recover(err -> Option.none()),  // Hides failure
            fetchSecondary(id).recover(err -> Option.none()))
       .flatMap((primary, secondary) -> /* ... */);
```

If both fail, the combiner gets two `none()` values with no indication that anything went wrong. Let failures propagate or model the "best-effort" case explicitly:

```java
// DO: Model best-effort explicitly
record DataSources(Option<Primary> primary, Option<Secondary> secondary) {}

Promise.all(fetchPrimary(id).map(Option::some).recover(err -> Promise.success(Option.none())),
            fetchSecondary(id).map(Option::some).recover(err -> Promise.success(Option.none())))
       .map(DataSources::new);
```

Now the type says "we tried to fetch both, either might be missing," and the combiner can decide whether to proceed or fail based on business rules.

DON'T mutate input data in parallel branches:
```java
// ❌ WRONG: Mutating shared input
Promise.all(applyDiscount(cart),  // Mutates cart.subtotal
            calculateTax(cart))   // Reads cart.subtotal - RACE CONDITION
       .map(this::combine);

private Promise<Discount> applyDiscount(Cart cart) {
    cart.setSubtotal(cart.subtotal().subtract(discount));  // DATA RACE
    return Promise.success(new Discount(discount));
}

// ✅ CORRECT: Create new instances
Promise.all(applyDiscount(cart),
            calculateTax(cart))
       .map(this::combine);

private Promise<Discount> applyDiscount(Cart cart) {
    var discountAmount = calculateDiscountFor(cart);
    return Promise.success(new Discount(cart, discountAmount));  // Returns new data
}
```

Input data must be treated as read-only. If you need to "modify" data, create new instances with the modifications.

DO keep Fork-Join local and focused:
```java
// DO: Fork-Join in its own function, combiner extracted (Single Level of Abstraction)
private Promise<ReportData> fetchReportData(ReportRequest request) {
    return Promise.all(userRepo.findById(request.userId()),
                       salesRepo.findByDateRange(request.startDate(), request.endDate()),
                       inventoryRepo.getSnapshot(request.warehouseId()))
                  .map(this::buildReportData);
}

private ReportData buildReportData(User user, List<Sale> sales, Inventory inventory) {
    return new ReportData(user, sales, inventory);
}

// Called from a Sequencer:
public Promise<Report> generateReport(ReportRequest request) {
    return ValidRequest.validRequest(request)
                       .async()
                       .flatMap(this::fetchReportData)  // Fork-Join extracted
                       .flatMap(this::computeMetrics)
                       .flatMap(this::formatReport);
}
```

### Condition

**Definition:** Condition represents branching logic based on data. The key: express conditions as values, not control-flow side effects. Keep branches at the same abstraction level.

**Rationale (by criteria):**
- **Mental Overhead**: Conditions as expressions - evaluates to single value, not control flow scatter (+2).
- **Business/Technical Ratio**: Branch logic mirrors domain rules, not imperative jumps (+2).
- **Complexity**: Same abstraction level per branch - prevents tangled logic (+2).
- **Reliability**: Type-checked branches ensure all cases return compatible types (+2).

Simple conditional:
```java
// DO: Condition as expression returning the monad
Result<Discount> calculateDiscount(Order order) {
    return order.isPremiumUser()
        ? premiumDiscount(order)      // returns Result<Discount>
        : standardDiscount(order);    // returns Result<Discount>
}
```

Both branches return the same type (`Result<Discount>`), so the ternary is just choosing which function to call. No mixed abstractions.

Pattern matching (with Java's switch expressions):
```java
Result<ShippingCost> calculateShipping(Order order, ShippingMethod method) {
    return switch (method) {
        case STANDARD -> standardShipping(order);
        case EXPRESS -> expressShipping(order);
        case OVERNIGHT -> overnightShipping(order);
    };
}
```

Each case returns `Result<ShippingCost>`. The switch expression evaluates to a single result.

**Nested conditions:** Avoid deep nesting by extracting subdecisions into named functions:

```java
// DON'T: Nested ternaries
return user.isPremium()
    ? (order.total().greaterThan(THRESHOLD)
        ? largeOrderPremiumDiscount(order)
        : smallOrderPremiumDiscount(order))
    : (order.total().greaterThan(THRESHOLD)
        ? largeOrderStandardDiscount(order)
        : smallOrderStandardDiscount(order));
```

Extract:
```java
// DO: Extract nested logic
Result<Discount> calculateDiscount(User user, Order order) {
    return user.isPremium()
        ? premiumDiscount(order)
        : standardDiscount(order);
}

private Result<Discount> premiumDiscount(Order order) {
    return order.total().greaterThan(THRESHOLD)
        ? largeOrderPremiumDiscount(order)
        : smallOrderPremiumDiscount(order);
}

private Result<Discount> standardDiscount(Order order) {
    return order.total().greaterThan(THRESHOLD)
        ? largeOrderStandardDiscount(order)
        : smallOrderStandardDiscount(order);
}
```

Now each function has one level of branching. Much clearer.

**Condition with monads:** Use `map`, `flatMap`, and `filter` to keep types consistent. Never use ternaries in lambdas - they violate Single Pattern per Function.

```java
// DON'T: Ternary in lambda (violates Single Pattern per Function)
return fetchUser(userId)
       .flatMap(user -> user.isActive()
           ? processActiveUser(user)
           : UserError.InactiveAccount.INSTANCE.result());

// DO: Extract condition to named function
return fetchUser(userId)
       .flatMap(this::processIfActive);

private Result<ProcessedUser> processIfActive(User user) {
    return user.isActive()
        ? processActiveUser(user)
        : UserError.InactiveAccount.INSTANCE.result();
}
```

Or use `filter` for even cleaner composition:
```java
// DO: Using filter (preferred when applicable)
return fetchUser(userId)
       .filter(User::isActive, UserError.InactiveAccount.INSTANCE)
       .flatMap(this::processActiveUser);
```

**Anti-patterns:**

DON'T mix abstraction levels in branches:
```java
// DON'T: One branch is a leaf, the other is a whole sequence
return user.isPremium()
    ? Result.success(PREMIUM_DISCOUNT)  // Leaf: just a value
    : fetchStandardDiscountRules()      // Sequencer: fetch → compute → validate
          .flatMap(this::computeDiscount)
          .flatMap(this::validateDiscount);
```

Extract the complex branch:
```java
// DO: Both branches are leaves
return user.isPremium()
    ? Result.success(PREMIUM_DISCOUNT)
    : calculateStandardDiscount(user);

private Result<Discount> calculateStandardDiscount(User user) {
    return fetchStandardDiscountRules()
        .flatMap(this::computeDiscount)
        .flatMap(this::validateDiscount);
}
```

DON'T use conditionals to hide missing error handling:
```java
// DON'T: Silently returning the empty result
Result<Data> fetchData(Source source) {
    return source.isAvailable()
        ? source.getData()
        : Result.success(Data.EMPTY);  // Is this a business rule or a hack?
}
```

Be explicit: is empty data a valid outcome, or should unavailable sources fail?

```java
// DO: Explicit semantics
Result<Data> fetchData(Source source) {
    return source.isAvailable()
        ? source.getData()
        : DataError.SourceUnavailable.INSTANCE.result();
}
```

### Iteration

**Definition:** Iteration processes collections, streams, or recursive structures. Prefer functional combinators over explicit loops. Keep transformations pure.

**Rationale (by criteria):**
- **Mental Overhead**: Declarative combinators state intent; imperative loops require tracing (+2).
- **Business/Technical Ratio**: map/filter express business logic; loops are iteration mechanics (+2).
- **Complexity**: Functional composition eliminates index management and loop state (+2).
- **Reliability**: Pure transformations have no side effects - deterministic and testable (+2).

Mapping collections:
```java
// Transforming a list of raw inputs to domain objects
Result<List<Email>> parseEmails(List<String> rawEmails) {
    return Result.allOf(rawEmails.stream()
                                 .map(Email::email)
                                 .toList());
}
```

`Result.allOf` aggregates a `List<Result<Email>>` into `Result<List<Email>>`. If any email is invalid, you get a `CompositeCause` with all failures.

Filtering and transforming:
```java
List<ActiveUser> activeUsers(List<User> users) {
    return users.stream()
                .filter(User::isActive)
                .map(this::toActiveUser)
                .toList();
}

private ActiveUser toActiveUser(User user) {
    return new ActiveUser(user.id(), user.email());
}
```

Pure transformation, no side effects, returns `List<ActiveUser>` (type `T`, not `Result`, because this can't fail).

**Async iteration:** When processing collections with async operations, decide between sequential and parallel:

Sequential:
```java
// Process orders one at a time
Promise<List<Receipt>> processOrders(List<Order> orders) {
    return orders.stream()
                 .reduce(Promise.success(new ArrayList<Receipt>()),
                         (promiseAcc, order) -> promiseAcc.flatMap(acc -> addReceipt(acc, order)),
                         (p1, p2) -> p1);  // Won't be used in sequential reduction
}

private Promise<List<Receipt>> addReceipt(List<Receipt> acc, Order order) {
    return processOrder(order).map(receipt -> {
        acc.add(receipt);
        return acc;
    });
}
```

Parallel (when orders are independent):
```java
// Process orders in parallel
Promise<List<Receipt>> processOrders(List<Order> orders) {
    return Promise.allOf(orders.stream()
                               .map(this::processOrder)
                               .toList());
}
```

Use parallel when operations are independent. The order in the returned List corresponds to the order of the input list of Promises.

**Thread Safety:** Sequential iteration is **thread-safe through single-threaded execution** - operations execute one at a time, making local mutable accumulators safe (like `acc.add(receipt)` above). Parallel iteration requires **immutable inputs** (same rules as Fork-Join pattern) - each operation must work independently without shared mutable state. See [Fork-Join](#fork-join) for parallel execution safety rules.

**Anti-patterns:**

DON'T mix side effects into stream operations:
```java
// DON'T: Side effect in the map
users.stream()
     .map(user -> {
         logger.info("Processing user: {}", user.id());  // Side effect!
         return processUser(user);
     })
     .toList();
```

Extract side effects to an Aspect (logging) or keep them out of transformation logic.

DON'T use imperative loops when combinators exist:
```java
// DON'T: Imperative accumulation
List<Result<Email>> results = new ArrayList<>();
for (String raw : rawEmails) {
    results.add(Email.email(raw));
}
// Then manually aggregate results...
```

Use `Result.allOf`:
```java
// DO: Declarative collection
Result<List<Email>> emails = Result.allOf(rawEmails.stream()
                                                   .map(Email::email)
                                                   .toList());
```

DO keep iteration focused on transformation:
```java
// DO: Pure transformation
List<OrderSummary> summarize(List<Order> orders) {
    return orders.stream()
                 .map(this::toOrderSummary)
                 .toList();
}

private OrderSummary toOrderSummary(Order order) {
    return new OrderSummary(order.id(), 
                            order.total(), 
                            order.itemCount());
}
```

### Aspects (Decorators)

**Definition:** Aspects are higher-order functions that wrap steps or use cases to add cross-cutting concerns - retry, timeout, logging, metrics - without changing business semantics.

**Rationale (by criteria):**
- **Mental Overhead**: Cross-cutting concerns separated from business logic - clear responsibilities (+3).
- **Business/Technical Ratio**: Business logic stays pure; technical concerns isolated in decorators (+3).
- **Complexity**: Composable aspects via higher-order functions - no framework magic (+2).
- **Design Impact**: Business logic independent of retry/metrics/logging - testable separately (+3).

**Placement:**
- **Local concerns:** Wrap individual steps when the aspect applies to just that step. Example: retry only on external API calls.
- **Cross-cutting concerns:** Wrap the entire `execute()` method. Example: metrics for the whole use case.

**Example: Retry aspect on a step**

```java
public interface FetchUserProfile {
    Promise<Profile> apply(UserId userId);
}

// Step implementation
class UserServiceClient implements FetchUserProfile {
    public Promise<Profile> apply(UserId userId) {
        return httpClient.get("/users/" + userId.value())
                         .map(this::parseProfile);
    }
}

// Applying a retry aspect at construction:
static ProcessUserData processUserData(..., UserServiceClient userServiceClient, ...) {
    // Values also can come from passed config
    var retryPolicy = RetryPolicy.builder()
                                 .maxAttempts(3)
                                 .backoff(exponential(100, 2.0))
                                 .build();

    return request -> validateInput.apply(request), 
                                   .flatMap(withRetry(retryPolicy, userServiceClient)::apply),  // Decorated step
                                   .flatMap(processData::apply);
}
```

The retry aspect wraps the `UserServiceClient` step. If it fails, the aspect retries, according to the policy. The rest of the use case is unaware - it just calls `fetchUserProfile.apply(userId)`.

**Example: Metrics aspect on use case**

```java
public interface LoginUser {
    Promise<LoginResponse> execute(LoginRequest request);

    static LoginUser loginUser(...) {
        ...
        var rawUseCase = new loginUser(...);
        var metricsPolicy = MetricsPolicy.metricsPolicy("user_login");
        return withMetrics(metricsPolicy, rawUseCase);
    }
}
```

The `withMetrics` decorator wraps the entire use case. It records execution time, success/failure counts, etc., for every invocation of `execute()`.

**Composing multiple aspects:**

Order matters. Typical ordering (outermost to innermost):
1. Metrics/Logging (outermost - observe everything)
2. Timeout (global deadline)
3. CircuitBreaker (fail-fast if the system is degraded)
4. Retry (per-attempt)
5. RateLimit (throttle requests)
6. Business logic (innermost)

```java
var decoratedStep = withMetrics(metricsPolicy,
    withTimeout(timeoutPolicy,
        withCircuitBreaker(breakerPolicy,
            withRetry(retryPolicy, rawStep)
        )
    )
);
```

Or use a helper:
```java
var decoratedStep = composeAspects(List.of(metrics(metricsPolicy),
                                           timeout(timeoutPolicy),
                                           circuitBreaker(breakerPolicy),
                                           retry(retryPolicy)),
                                   rawStep);
```

**Operational Semantics:**

**Timeout Behavior:**
- **Logical timeout:** Promise resolves with `TimeoutError` after deadline
- **Actual cancellation:** The underlying operation may continue running
- **Rule:** Timeout doesn't guarantee resource cleanup—idempotent operations are safer

**Retry Semantics:**
- **Idempotency required:** Retried operations must be safe to repeat
- **State changes:** Non-idempotent operations (money transfers, order creation) need idempotency keys
- **Backoff:** Exponential backoff prevents thundering herd

```java
// Safe: idempotent read
withRetry(policy, () -> fetchUser(id))

// Unsafe without idempotency key
withRetry(policy, () -> createOrder(request))  // DON'T - may create duplicates

// Safe: idempotent write with key
withRetry(policy, () -> createOrder(request, idempotencyKey))  // DO
```

**Composition Order Semantics:**

| Order | Meaning |
|-------|---------|
| Metrics → Timeout → Retry → Operation | Metrics count total time; timeout applies to all retries |
| Timeout → Metrics → Retry → Operation | Timeout per attempt; metrics count each retry |
| Retry → Timeout → Operation | Each attempt has own timeout |

**Rule:** Define composition order based on what you want to observe and control. Document your choice.

**Implementing Aspects: How They Work**

Aspects are higher-order functions - functions that take a function and return a decorated version. Here's how to implement them using Pragmatica Lite's utilities:

**Retry Aspect (using Pragmatica Lite's Retry):**

```java
import org.pragmatica.lang.utils.Retry;
import static org.pragmatica.lang.utils.Retry.BackoffStrategy;
import static org.pragmatica.lang.io.TimeSpan.timeSpan;

// Retry aspect wraps a step that returns Promise
public static <T, R> Fn1<Promise<R>, T> withRetry(int maxAttempts, 
                                                  BackoffStrategy strategy, 
                                                  Fn1<Promise<R>, T> step) {
    var retry = Retry.create()
                     .attempts(maxAttempts)
                     .strategy(strategy);

    return input -> retry.execute(() -> step.apply(input));
}

// Usage: retry failing network calls
var backoff = BackoffStrategy.exponential()
                             .initialDelay(timeSpan(100).millis())
                             .maxDelay(timeSpan(5).seconds())
                             .factor(2.0)
                             .withJitter();

FetchUserProfile fetchWithRetry = withRetry(3, backoff, fetchUserProfile);
```

**How it works:**
- Takes the original step (`Fn1<Promise<R>, T>`)
- Returns new function with same signature
- Internally uses Retry utility to handle failures and backoff
- Original step unaware it's being retried

**Circuit Breaker Aspect (using Pragmatica Lite's CircuitBreaker):**

```java
import org.pragmatica.lang.utils.CircuitBreaker;

// Circuit breaker aspect protects against cascading failures
public static <T, R> Fn1<Promise<R>, T> withCircuitBreaker(CircuitBreaker breaker, 
                                                           Fn1<Promise<R>, T> step) {
    return input -> breaker.execute(() -> step.apply(input));
}

// Usage: protect against unstable service
var breaker = CircuitBreaker.create()
                            .failureThreshold(5)          // Open after 5 failures
                            .timeout(timeSpan(30).seconds());  // Stay open for 30s

FetchOrders fetchWithBreaker = withCircuitBreaker(breaker, fetchOrders);
```

**Timeout Aspect:**

```java
// Timeout aspect adds deadline to operation
public static <T, R> Fn1<Promise<R>, T> withTimeout(TimeSpan timeout, 
                                                    Fn1<Promise<R>, T> step) {
    return input -> step.apply(input).timeout(timeout);
}

// Usage
FetchData fetchWithTimeout = withTimeout(timeSpan(5).seconds(), fetchData);
```

**Metrics Aspect:**

```java
// Metrics aspect tracks execution time and outcomes
public static <T, R> Fn1<Promise<R>, T> withMetrics(String operationName, 
                                                    Fn1<Promise<R>, T> step) {
    return input -> {
        var start = System.nanoTime();

        return step.apply(input)
                   .onResult(result -> metrics.recordResult(operationName, result, System.nanoTime() - start));
    };
}

// Usage
CheckEmail checkWithMetrics = withMetrics("check_email", checkEmail);
```

**Logging Aspect:**

```java
// Logging aspect adds structured logging
public static <T, R> Fn1<Promise<R>, T> withLogging(Logger log, 
                                                    String operation, 
                                                    Fn1<Promise<R>, T> step) {
    return input -> {
        log.info("Starting: {}", operation);

        return step.apply(input)
                   .onSuccess(result -> log.info("Success: {} -> {}", operation, result))
                   .onFailure(cause -> log.warn("Failure: {} -> {}", operation, cause.message()));
    };
}
```

**Composing Aspects Mechanically:**

```java
// Helper to compose multiple aspects
public static <T, R> Fn1<Promise<R>, T> composeAspects(List<Fn1<Fn1<Promise<R>, T>, Fn1<Promise<R>, T>>> aspects, Fn1<Promise<R>, T> step) {
    Fn1<Promise<R>, T> result = step;
    // Apply aspects in reverse order (innermost to outermost)
    for (int i = aspects.size() - 1; i >= 0; i--) {
        result = aspects.get(i).apply(result);
    }
    return result;
}

// Usage with aspect factories
var decorated = composeAspects(List.of(s -> withMetrics("operation", s), 
                                       s -> withTimeout(timeSpan(10).seconds(), s), 
                                       s -> withRetry(3, exponentialBackoff, s)), 
                               rawStep);
```

**Key insights:**
- Aspects are just higher-order functions - no magic
- Pragmatica Lite provides `Retry` and `CircuitBreaker` out of the box
- Custom aspects follow same pattern: `(step) -> decoratedStep`
- Composition is mechanical function application
- Each aspect is independently testable

**Testing:** Test aspects in isolation with synthetic steps. Use case tests remain aspect-agnostic - they test business logic, not retry behavior or metrics.

```java
// Aspect test (isolated)
@Test
void retryAspect_retriesOnFailure() {
    var failingStep = new FlakyStep(2); //Fail times
    var retryPolicy = RetryPolicy.maxAttempts(3);
    var decorated = withRetry(retryPolicy, failingStep);

    var result = decorated.apply(input).await();

    assertTrue(result.isSuccess());
    assertEquals(3, failingStep.invocationCount());  // Failed twice, succeeded on 3rd
}

// Use case test (aspect-agnostic)
@Test
void loginUser_success() {
    var useCase = LoginUser.loginUser(mockValidate, 
                                      mockCheckCreds, 
                                      mockGenerateToken);

    var result = useCase.execute(validRequest).await();

    assertTrue(result.isSuccess());
    // No assertions about retries, timeouts, etc.
}
```

**Anti-patterns:**

DON'T mix aspect logic into business logic:
```java
// DON'T: Retry logic inside the step
Promise<Profile> fetchProfile(UserId id) {
    return retryWithBackoff(() ->
        httpClient.get("/users/" + id.value())
    ).map(this::parseProfile);
}
```

Extract to an aspect decorator.

DON'T apply aspects inconsistently:
```java
// DON'T: Some steps have retry, some don't, no clear reason
var step1 = withRetry(policy, rawStep1);
var step2 = rawStep2;  // Why no retry?
var step3 = withRetry(policy, rawStep3);
```

Be deliberate. If only external calls need retry, document that. If every step should have metrics, apply it at the use case level.

DO keep aspects composable and reusable:
```java
// DO: Aspects as higher-order functions that decorate steps
static <I, O> Fn1<I, Promise<O>> withTimeout(TimeSpan timeout, Fn1<I, Promise<O>> step) {
    return input -> step.apply(input).timeout(timeout);
}

static <I, O> Fn1<I, Promise<O>> withRetry(RetryPolicy policy, Fn1<I, Promise<O>> step) {
    return input -> retryLogic(policy, () -> step.apply(input));
}

// Compose by wrapping:
var decorated = withTimeout(timeSpan(5).seconds(),
                            withRetry(retryPolicy, rawStep));
```

### Logging Philosophy

**Principle:** Logging belongs only at **leaves** and **external boundaries**. Composition code has zero logging.

**Rationale:**
- Leaves perform real work - they're the only places where operations can fail or produce observable effects
- Boundaries are where we interact with external systems - the points of uncertainty
- Everything else is composition - deterministic routing of values through the system

**Rationale (by criteria):**
- **Mental Overhead**: No scattered logging decisions - architectural, not ad-hoc (+2).
- **Business/Technical Ratio**: Business logic stays pure; logging isolated in aspects (+2).
- **Complexity**: Precisely defined logging points - easy to audit and configure (+2).
- **Design Impact**: Composition code remains transparent - pure value routing (+2).

**Implementation via Aspects:**

Wrap leaf implementations in a logging aspect that logs input and outcome:

```java
public interface UserRepository {
    Promise<User> findById(UserId id);

    static UserRepository create(DataSource ds, Logger log) {
        var impl = new UserRepositoryImpl(ds);
        return withLogging(log, "UserRepository", impl);
    }
}

// The aspect logs every operation transparently
public static UserRepository withLogging(Logger log, String name, UserRepository impl) {
    return id -> {
        var correlationId = CorrelationContext.current();
        log.debug("[{}] {}.findById input: {}", correlationId, name, id);

        return impl.findById(id)
                   .onSuccess(user -> log.debug("[{}] {}.findById success: {}", correlationId, name, user.id()))
                   .onFailure(cause -> log.warn("[{}] {}.findById failure: {}", correlationId, name, cause.message()));
    };
}
```

**What gets logged:**
- Input parameters (sanitized)
- Outcome (success value or failure cause)
- Correlation ID for request tracing
- Timing (optional, can combine with metrics aspect)

**Log levels are implementation decisions:**
- DEBUG for routine operations
- INFO for significant business events
- WARN for failures
- ERROR for system-level issues

**Practical Considerations:**

**Sensitive Data:**
Aspects must sanitize inputs. Options:
- Marker annotations (`@Sensitive` on fields)
- Explicit redaction in aspect
- Domain-aware sanitizers (e.g., mask email: `j***@example.com`)

```java
// Sanitization in aspect
log.debug("Input: {}", sanitize(input));

private String sanitize(Object input) {
    return switch (input) {
        case Password ignored -> "[REDACTED]";
        case Email email -> maskEmail(email);
        default -> String.valueOf(input);
    };
}
```

**Correlation Propagation:**
Request ID must flow through async boundaries. Options:
- MDC (works for sync, breaks on async)
- Explicit context parameter (pollutes signatures)
- Context propagation libraries (Reactor Context, OpenTelemetry)
- Framework-specific solutions

**High-Volume Operations:**
For performance-sensitive paths:
- Async logging (write to buffer, flush separately)
- Sampling (log 1% of requests)
- Conditional logging (only on failure)
- Skip logging entirely (metrics may suffice)

**Testing Composition Logic:**

Since composition has no logging, test it via "value highway" verification:
- Invoke with predefined inputs
- Mock leaves with known responses
- Verify correct routing through the system

```java
@Test
void composition_routesValuesToCorrectLeaves() {
    var userRepo = mockReturning(testUser);
    var orderRepo = mockReturning(testOrder);
    var useCase = CreateOrder.createOrder(userRepo, orderRepo);

    useCase.execute(request).await()
           .onFailure(Assertions::fail)
           .onSuccess(response -> {
               assertEquals(testUser.id(), response.userId());
               assertEquals(testOrder.id(), response.orderId());
           });
}
```

This tests that composition correctly threads values through leaves without needing logging in the composition itself.

**Anti-patterns:**

DON'T scatter logging throughout composition:
```java
// DON'T: Logging in composition code
return validateInput(request)
    .onSuccess(v -> log.info("Validated"))  // Noise
    .flatMap(this::fetchUser)
    .onSuccess(u -> log.info("Fetched user"))  // Noise
    .flatMap(this::processOrder);
```

DON'T log the same event at multiple levels:
```java
// DON'T: Redundant logging
// In leaf:
log.info("Saving user");
// In caller:
log.info("About to save user");  // Redundant
```

DO wrap leaves in logging aspects at construction:
```java
// DO: Single point of logging configuration
static ProcessOrder processOrder(UserRepository users, OrderRepository orders, Logger log) {
    return new ProcessOrderImpl(
        withLogging(log, "users", users),
        withLogging(log, "orders", orders)
    );
}
```

---

## Thread Safety Quick Reference

This table summarizes thread safety rules for each pattern. For detailed explanations, see [Immutability and Thread Confinement](#immutability-and-thread-confinement) and individual pattern sections.

| Pattern                    | Thread Safety Model                               | Local Mutable State                     | Input Data              | Result Data         |
|----------------------------|---------------------------------------------------|-----------------------------------------|-------------------------|---------------------|
| **Leaf**                   | Thread confinement (single invocation)            | ✅ Safe - confined to function scope     | ❌ Must be read-only     | ✅ Must be immutable |
| **Sequencer**              | Sequential execution (steps don't overlap)        | ✅ Safe - confined to each step          | ❌ Must be read-only     | ✅ Must be immutable |
| **Fork-Join**              | Parallel execution (no synchronization)           | ✅ Safe - confined within each branch    | ❌ **MUST be immutable** | ✅ Must be immutable |
| **Iteration (Sequential)** | Single-threaded (operations execute sequentially) | ✅ Safe - accumulators OK                | ❌ Must be read-only     | ✅ Must be immutable |
| **Iteration (Parallel)**   | Parallel execution (no synchronization)           | ✅ Safe - confined within each operation | ❌ **MUST be immutable** | ✅ Must be immutable |
| **Condition**              | Depends on branch pattern                         | Follow pattern rules for each branch    | ❌ Must be read-only     | ✅ Must be immutable |

**Key Principles:**
- **Input data is always read-only** - never mutate parameters
- **Results are always immutable** - data crossing boundaries must be thread-safe
- **Local mutable state is safe** - when confined to single operation (thread confinement)
- **Parallel patterns require immutable inputs** - Fork-Join and parallel iteration have no synchronization

**Common Mistakes:**
- ❌ Sharing mutable state between parallel branches
- ❌ Mutating input parameters (even in sequential patterns)
- ❌ Returning mutable collections or objects
- ✅ Using local mutable builders/accumulators within single operation
- ✅ Creating new immutable instances instead of modifying inputs

---

## Testing Strategy

### The Problem with Traditional Component-Focused Testing

Traditional Java testing fragments business logic across isolated unit tests:

```java
// Traditional: separate tests for each component
class ValidateInputTest {
    @Test void emailValidation() { /* ... */ }
    // 10 tests
}
class CheckCredentialsTest {
    @Test void validCredentials() { /* ... */ }
    // 5 tests
}
// Total: 22 tests, never testing them TOGETHER
```

**Problems:**
1. Doesn't test composition - steps work individually but fail when chained
2. Doesn't test error propagation - how do failures bubble through?
3. Doesn't test actual behavior - tests verify components, not use cases
4. Brittle - interface changes break all tests even when behavior unchanged
5. False confidence - all tests pass, production fails because integration untested

**What we actually want to test:** When a user calls `UseCase.execute(request)`, does the complete assembled behavior match requirements?

### Philosophy: Integration-First Testing

**Core Principle:** Test assembled use cases, not isolated components.

Your use case is a composition of steps. Test the composition. Stub only at adapter boundaries (database, HTTP, external services). Test all business logic together.

**Why by criteria:**
- **Mental Overhead**: One test suite per use case, not per component (+2)
- **Business/Technical Ratio**: Tests read like behavior specifications (+3)
- **Reliability**: Tests verify actual end-to-end behavior (+3)
- **Complexity**: Fewer test contexts, clearer boundaries (+2)

### The Three Testing Layers

**1. Value Objects: Unit Tests (100% coverage)**

Value objects are pure, isolated, enforce invariants. Test them comprehensively:

```java
class EmailTest {
    @ParameterizedTest
    @ValueSource(strings = {"bad", "no@domain", "@missing"})
    void email_rejectsInvalidFormat(String raw) {
        Email.email(raw).onSuccess(Assertions::fail);
    }

    @Test
    void email_normalizesToLowercase() {
        Email.email("USER@EXAMPLE.COM")
             .onSuccess(email -> assertEquals("user@example.com", email.value()));
    }
}
```

**Why unit test here?** Value objects have zero dependencies. They're pure functions. Unit testing is natural.

**2. Business Leaves: Unit Tests if Complex**

Simple business leaves (single calculation, simple transformation) don't need isolated tests - covered by use case integration tests.

Complex business leaves (rich algorithms, many branches) deserve unit tests:

```java
class PricingEngineTest {
    @Test void volumeDiscount_appliesAtThreshold() { /* ... */ }
    @Test void combinedDiscounts_stackCorrectly() { /* ... */ }
    // 20+ tests for complex pricing logic
}
```

**Guideline:** If a leaf has 3+ conditional branches or complex logic, write unit tests.

**3. Use Cases: Integration Tests (Test Vectors)**

**Test vectors:** comprehensive sets of input/output pairs systematically covering all decision paths and edge cases.

Test complete use case behavior with all steps assembled, only adapters stubbed:

```java
class UserLoginTest {
    // Stubs for adapter leaves
    CheckCredentials mockCredentials;
    CheckAccountStatus mockStatus;
    GenerateToken mockToken;

    UserLogin useCase;

    @BeforeEach
    void setup() {
        // Assemble use case with stubbed adapters
        mockCredentials = vr -> Result.success(new Credentials("user-1"));
        mockStatus = c -> Result.success(new Account(c.userId(), true));
        mockToken = acc -> Result.success(new Response("token-" + acc.userId()));

        useCase = UserLogin.userLogin(mockCredentials, mockStatus, mockToken);
    }

    @Test
    void execute_succeeds_forValidInput() {
        var request = new Request("john@example.com", "Valid123", null);

        useCase.execute(request)
               .onFailure(Assertions::fail)
               .onSuccess(response -> assertEquals("token-user-1", response.token()));
    }

    @Test
    void execute_fails_whenCredentialsInvalid() {
        CheckCredentials failingCreds = vr -> LoginError.InvalidCredentials.INSTANCE.result();
        var useCase = UserLogin.userLogin(failingCreds, mockStatus, mockToken);
        var request = new Request("john@example.com", "Valid123", null);

        useCase.execute(request)
               .onSuccess(Assertions::fail)
               .onFailure(cause -> assertInstanceOf(LoginError.InvalidCredentials.class, cause));
    }
}
```

This tests **real behavior**: validation → credentials → status → token, with error propagation.

### Creating Test Stubs

Stubs are simple lambdas that replace real adapters in tests. Here's how to create effective stubs for different scenarios:

**Success stub (always succeeds):**
```java
// Generic success stub factory
static <T, R> Fn1<Promise<R>, T> successStub(R value) {
    return _ -> Promise.success(value);
}

// Usage in test
CheckEmail checkEmail = successStub(validRequest);
SaveUser saveUser = successStub(user);
var useCase = RegisterUser.registerUser(checkEmail, saveUser);
```

**Failure stub (always fails):**
```java
// Generic failure stub factory
static <T, R> Fn1<Promise<R>, T> failureStub(Cause cause) {
    return _ -> cause.promise();
}

// Usage in test
CheckEmail checkEmail = failureStub(EmailError.AlreadyExists.INSTANCE);
var useCase = RegisterUser.registerUser(checkEmail, successStub(user));

useCase.execute(request)
       .await()
       .onSuccess(Assertions::fail);  // Should fail
```

**Conditional stub (based on input):**
```java
// Stub that checks input and decides outcome
CheckEmail checkEmail = validRequest -> {
    if (validRequest.email().value().equals("taken@example.com")) {
        return EmailError.AlreadyExists.INSTANCE.promise();
    }
    return Promise.success(validRequest);
};
```

**Capturing stub (records invocations):**
```java
// Stub that captures what was called
var capturedRequests = new ArrayList<ValidRequest>();
CheckEmail checkEmail = validRequest -> {
    capturedRequests.add(validRequest);
    return Promise.success(validRequest);
};

useCase.execute(request).await();

// Verify the stub was called correctly
assertEquals(1, capturedRequests.size());
assertEquals("test@example.com", capturedRequests.get(0).email().value());
```

**Flaky stub (for aspect testing):**
```java
// Fails N times, then succeeds (tests retry logic)
static <T, R> Fn1<Promise<R>, T> flakyStub(int failCount, R successValue, Cause failureCause) {
    var counter = new AtomicInteger(0);
    return _ -> {
        int attempt = counter.incrementAndGet();
        return attempt <= failCount
            ? failureCause.promise()
            : Promise.success(successValue);
    };
}

// Usage: test retry aspect
var flakyOp = flakyStub(2, user, NetworkError.Timeout.INSTANCE);
var retryAspect = Retry.create().attempts(3)
                       .strategy(BackoffStrategy.fixed().interval(timeSpan(10).millis()));

retryAspect.execute(() -> flakyOp.apply(input))
           .await()
           .onFailure(Assertions::fail)  // Should succeed on 3rd attempt
           .onSuccess(result -> assertEquals(user, result));
```

**Stub returning different values each call:**
```java
// Queue-based stub
static <T, R> Fn1<Promise<R>, T> queueStub(R... values) {
    var queue = new LinkedList<>(Arrays.asList(values));
    return _ -> Promise.success(queue.poll());
}

// Usage: test pagination
var fetchPage = queueStub(page1, page2, page3);
```

**Key insight:** Stubs are just functions. They're simple, composable, and don't require mocking frameworks. The power comes from functional composition—stubs are values you pass to use case factories.

### Core Testing Patterns

**For expected failures** - use `.onSuccess(Assertions::fail)`:
```java
@Test
void validation_fails_forInvalidInput() {
    var request = new Request("invalid-data");

    ValidRequest.validRequest(request)
                .onSuccess(Assertions::fail);  // Fail if unexpectedly succeeds
}
```

**For expected successes** - use `.onFailure(Assertions::fail).onSuccess(assertions)`:
```java
@Test
void validation_succeeds_forValidInput() {
    var request = new Request("valid@example.com", "Valid1234");

    ValidRequest.validRequest(request)
                .onFailure(Assertions::fail)  // Fail if unexpectedly fails
                .onSuccess(valid -> assertEquals("valid@example.com", valid.email().value()));
}
```

**For async operations** - use `.await()` then apply the pattern:
```java
@Test
void execute_succeeds_forValidInput() {
    UseCase useCase = UseCase.create(stub1, stub2);
    var request = new Request("data");

    useCase.execute(request)
           .await()                     // Wait for operation
           .onFailure(Assertions::fail)
           .onSuccess(response -> assertEquals("expected", response.value()));
}
```

**Benefits:**
1. No intermediate variables - no `var result = ...` clutter
2. Functional bifurcation - explicitly specify behavior for each outcome
3. Method references - `Assertions::fail` instead of lambdas
4. Clear intent - test structure mirrors functional flow

**Test naming convention:** Follow pattern `methodName_outcome_condition`:
- `email_rejectsInvalidFormat` - method name, what happens, under what condition
- `execute_succeeds_forValidInput` - clear, readable, searchable

**Thread Safety in Tests:**

Mutable test state is acceptable because **individual test execution is single-threaded**. Each test runs in isolation with its own mutable accumulators, call logs, or test data builders:

```java
@Test
void execute_appliesDiscounts_inCorrectOrder() {
    var callLog = new ArrayList<String>();  // Mutable test state - safe

    var bogo = createLoggingRule("BOGO", callLog);
    var percent = createLoggingRule("PERCENT", callLog);

    calculateDiscounts.apply(new CartWithRules(cart, List.of(bogo, percent)))
                      .await()
                      .onFailure(Assertions::fail);

    assertEquals(List.of("BOGO", "PERCENT"), callLog);  // Verify call order
}
```

This doesn't violate production immutability rules - tests are inherently sequential, and mutable test fixtures are confined to single test method scope.

### The Evolutionary Testing Process

Instead of writing tests after implementation, evolve them **alongside** implementation:

```
Phase 0: Define Contract
    ↓
Phase 1: Stub Everything
    ↓
Phase 2: Implement & Test Validation
    ↓
Phase 3-N: Implement Steps Incrementally
    ↓
Final: Production-Ready
```

At each phase, **all tests remain green**. You're not breaking and fixing - you're growing.

**Phase 0 - Define Contract:**

Start with the interface definition BEFORE any implementation. This forces you to think about the contract first:

```java
public interface UserLogin {
    // Define data structures first
    record Request(String email, String password, String referralCode) {}
    record Response(UserId userId, String token) {}

    // Define the contract
    Promise<Response> execute(Request request);

    // NO FACTORY YET - just the contract
}
```

At this phase, ask yourself:
- What are the inputs? (raw strings from client)
- What are the outputs? (what does success look like?)
- Is this sync or async? (I/O operations → Promise)
- What can fail? (start thinking about error types)

**Benefits of starting with contract:**
- Forces clear thinking about requirements before code
- Makes you consider async vs sync early
- Reveals missing requirements ("wait, what's the referral code format?")
- Documents the use case before implementation details distract

**Don't write factory or implementation yet** - just the interface. This prevents premature implementation and keeps focus on "what" before "how".

**Phase 1 - Stub Everything:**

Create use case interface with factory returning stub:

```java
public interface UserLogin {
    record Request(String email, String password, String referral) {}
    record Response(String token) {}

    Result<Response> execute(Request request);

    // Factory returns stub that always succeeds
    static UserLogin userLogin() {
        return request -> Result.success(new Response("stub-token"));
    }
}
```

Write initial test:

```java
@Test
void execute_succeeds_forValidInput() {
    var useCase = UserLogin.userLogin();
    var request = new Request("john@example.com", "Valid123", null);

    useCase.execute(request)
           .onSuccess(response -> assertEquals("stub-token", response.token()));
}
```

Status: ✅ Test passes (trivial, but structure correct)

**Phase 2 - Implement Validation:**

Add validated request with validation logic:

```java
record ValidRequest(Email email, Password password, Option<ReferralCode> referral) {
    static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()),
                          ReferralCode.referralCode(raw.referral()))
                     .map(ValidRequest::new);
    }
}
```

Update factory to use validation:

```java
static UserLogin userLogin() {
    return request -> ValidRequest.validRequest(request)
                                  .map(_ -> new Response("stub-token"));
}
```

Add validation test vectors:

```java
@Test
void execute_fails_forInvalidEmail() {
    var useCase = UserLogin.userLogin();
    var request = new Request("bad-email", "Valid123", null);

    useCase.execute(request).onSuccess(Assertions::fail);
}

@Test
void execute_aggregatesMultipleErrors() {
    var useCase = UserLogin.userLogin();
    var request = new Request("bad", "weak", "invalid-ref");

    useCase.execute(request)
           .onSuccess(Assertions::fail)
           .onFailure(cause -> assertInstanceOf(Causes.CompositeCause.class, cause));
}
```

Status: ✅ Happy path still green, validation failures tested

**Phase 3+ - Implement Steps Incrementally:**

For each step:
1. Define step interface
2. Update factory to accept step dependency
3. Update existing test stubs
4. Add step failure scenarios

Example:

```java
interface CheckCredentials {
    Result<Credentials> apply(ValidRequest request);
}

static UserLogin userLogin(CheckCredentials checkCredentials) {
    return request -> ValidRequest.validRequest(request)
                                  .flatMap(checkCredentials::apply)
                                  .map(_ -> new Response("stub-token"));
}
```

**Final Phase - Production Ready:**
- ✅ All business logic implemented
- ✅ Only adapter leaves stubbed (database, HTTP, external services)
- ✅ Comprehensive test vector coverage
- ✅ Tests serve as living documentation

### Handling Complex Input Objects

**Problem:** Test data construction becomes verbose:

```java
// Painful to write repeatedly
var request = new Request(
    "john.doe@example.com",
    "SecureP@ssw0rd123",
    "REF-PREMIUM-2024",
    true,
    "192.168.1.1",
    Instant.now(),
    Map.of("tracking", "utm_source=test")
);
```

**Solution 1 - Test Data Builders:**

```java
public class TestData {
    public static RequestBuilder request() {
        return new RequestBuilder();
    }

    public static class RequestBuilder {
        private String email = "default@example.com";
        private String password = "DefaultValid123";
        private String referral = null;
        // ... defaults for all fields

        public RequestBuilder withEmail(String email) {
            this.email = email;
            return this;
        }

        public RequestBuilder withPassword(String password) {
            this.password = password;
            return this;
        }

        public Request build() {
            return new Request(email, password, referral, /* ... */);
        }
    }
}

// Usage
var request = TestData.request()
                      .withEmail("test@example.com")
                      .build();
```

**Solution 2 - Canonical Test Vectors:**

```java
public class TestVectors {
    public static final Request VALID = new Request(
        "user@example.com",
        "Valid123!",
        "REF-123",
        // ... all valid defaults
    );

    public static final Request INVALID_EMAIL = new Request(
        "bad-email",
        "Valid123!",
        "REF-123",
        // ... rest valid
    );

    public static final Request WEAK_PASSWORD = new Request(
        "user@example.com",
        "weak",
        "REF-123",
        // ... rest valid
    );
}

// Usage
useCase.execute(TestVectors.VALID).onFailure(Assertions::fail);
useCase.execute(TestVectors.INVALID_EMAIL).onSuccess(Assertions::fail);
```

**Solution 3 - Factory Methods:**

```java
public class TestData {
    public static Request valid() {
        return new Request("user@example.com", "Valid123!", "REF-123", /* ... */);
    }

    public static Request withEmail(String email) {
        return new Request(email, "Valid123!", "REF-123", /* ... */);
    }

    public static Request withPassword(String password) {
        return new Request("user@example.com", password, "REF-123", /* ... */);
    }
}

// Usage
useCase.execute(TestData.valid()).onFailure(Assertions::fail);
useCase.execute(TestData.withEmail("bad")).onSuccess(Assertions::fail);
```

**Combine strategies:**

```java
Request valid = TestVectors.VALID;  // Canonical

Request customized = TestData.request()  // Builder for complex customization
                             .from(TestVectors.VALID)
                             .withEmail("custom@test.com")
                             .build();
```

### Managing Large Test Counts

Comprehensive testing generates many tests. **This is not a problem - it's honest complexity.** 35 tests = 35 real scenarios. But we need organization.

**Strategy 1 - Nested Test Classes:**

```java
class UserLoginTest {
    private UserLogin useCase;
    // ... stubs

    @BeforeEach
    void setup() { /* ... */ }

    @Nested class HappyPath {
        @Test void execute_succeeds_forValidInput() { /* ... */ }
        @Test void execute_succeeds_withOptionalReferral() { /* ... */ }
    }

    @Nested class ValidationFailures {
        @Test void execute_fails_forInvalidEmail() { /* ... */ }
        @Test void execute_fails_forWeakPassword() { /* ... */ }
        @Test void execute_aggregatesMultipleErrors() { /* ... */ }
    }

    @Nested class StepFailures {
        @Test void execute_fails_whenCredentialsInvalid() { /* ... */ }
        @Test void execute_fails_whenAccountInactive() { /* ... */ }
    }

    @Nested class EdgeCases {
        @Test void execute_handlesNullReferral() { /* ... */ }
        @Test void execute_handlesExtremelyLongInputs() { /* ... */ }
    }
}
```

**Benefits:** IDE collapses nested classes, clear categorization, shared setup per category, test reports group meaningfully.

**Strategy 2 - Parameterized Tests:**

```java
@ParameterizedTest
@ValueSource(strings = {"bad", "no@domain", "@missing", "CAPS@TEST.COM"})
void execute_fails_forInvalidEmail(String invalidEmail) {
    var request = TestData.request().withEmail(invalidEmail).build();

    useCase.execute(request).onSuccess(Assertions::fail);
}

@ParameterizedTest
@CsvSource({
    "weak, TooShort",
    "alllowercase, NoUppercase",
    "ALLUPPERCASE, NoLowercase"
})
void execute_fails_forWeakPassword(String password, String expectedReason) {
    var request = TestData.request().withPassword(password).build();

    useCase.execute(request)
           .onSuccess(Assertions::fail)
           .onFailure(cause -> assertTrue(cause.message().contains(expectedReason)));
}
```

**What collapsed:** 5 individual tests → 1 parameterized test with 5 values.

**Strategy 3 - Test Organization in Files:**

Large use cases → multiple test files:

```
usecase/userlogin/
├── UserLogin.java
├── UserLoginValidationTest.java (validation scenarios)
├── UserLoginFlowTest.java (happy path + step failures)
├── UserLoginBranchesTest.java (conditional logic)
└── UserLoginEdgeCasesTest.java (edge cases)
```

**Guideline:** Keep individual test files under 500 lines.

### When to Write Unit Tests

**Always unit test:**
1. **Value objects** - Pure functions, zero dependencies, enforce invariants
2. **Complex business leaves** - 3+ branches, rich algorithms, many edge cases
3. **Utility functions** - Pure transformations used across many use cases

**Never unit test:**
1. **Simple business leaves** - Single calculation, covered by integration tests
2. **Sequencers/Fork-Joins** - These ARE the integration, test assembled
3. **Adapters** - Test through use case with stubs, or with real infrastructure

**Rule of thumb:** If it needs mocking to test in isolation, it's not a unit - test it integrated.

### Migrating from Traditional Unit Testing

**Don't delete everything.** Migrate incrementally:

**Step 1:** Add integration tests alongside existing unit tests

```java
// Keep existing unit tests
class ValidateInputTest { /* ... */ }
class CheckCredentialsTest { /* ... */ }

// Add new integration test
class UserLoginTest {
    @Test void execute_succeeds_forValidInput() { /* ... */ }
    // Full use case coverage
}
```

**Step 2:** Identify redundancy

Run coverage report. Which unit tests are now redundant because integration tests cover them?

**Step 3:** Remove redundant tests

If `UserLoginTest` covers all scenarios from `CheckCredentialsTest` and `ValidateInputTest`, delete them.

**Step 4:** Keep unique value

Retain unit tests that test edge cases not covered by integration tests, or complex algorithms worth isolated testing.

**End state:**

```
Before:
- 50 unit tests (component fragments)
- 0 integration tests
- False confidence

After:
- 15 value object unit tests (pure functions)
- 5 complex leaf unit tests (algorithms)
- 20 use case integration tests (assembled behavior)
- Real confidence
```

### Testing with Stubs

Use type declarations instead of casts for stub implementations:

```java
// DO: Type declaration
CheckEmailUniqueness checkEmail = req -> Promise.success(req);
HashPassword hashPassword = pwd -> Result.success(new HashedPassword("hashed"));

// DON'T: Cast
var checkEmail = (CheckEmailUniqueness) req -> Promise.success(req);
```

This makes code cleaner and leverages type inference properly.

---

## Null Policy

### Never Return Null

**Core Rule**: JBCT code NEVER returns null. Use `Option<T>` for optional values.

Traditional Java uses null for two semantically different cases: "value not found" and "error occurred". This ambiguity forces defensive null checks throughout the codebase and creates hidden failure modes.

```java
// ❌ WRONG - Returning null
public User findUser(UserId id) {
    return repository.findById(id.value());  // May return null - ambiguous!
}

// Caller must defend:
User user = findUser(id);
if (user == null) {  // Not found? Error? Unknown!
    ...
}

// ✅ CORRECT - Using Option
public Option<User> findUser(UserId id) {
    return Option.option(repository.findById(id.value()));
}

// Caller gets explicit semantics:
findUser(id)
    .onPresent(user -> process(user))
    .onEmpty(() -> handleNotFound());
```

### When Null IS Acceptable

Null appears only at **adapter boundaries** when interfacing with external code that uses null:

#### 1. Wrapping External APIs

When calling external libraries that may return null, wrap immediately at the adapter boundary:

```java
// Adapter layer - wrap nullable external API
public Option<User> findUser(UserId id) {
    User user = repository.findById(id.value());  // External API may return null
    return Option.option(user);  // Wrap immediately: null → none(), value → some(value)
}

// Spring Data JPA example
public Option<User> findByEmail(Email email) {
    return Option.option(userRepository.findByEmail(email.value()));  // JPA returns null if not found
}

// JDBC ResultSet example
public Option<User> loadUser(UserId id) {
    return Promise.lift(DatabaseError::cause, 
                        () -> {
                                  ResultSet rs = executeQuery(id);
                                  User user = rs.next() ? mapUser(rs) : null;  // null if not found
                                  return Option.option(user);  // Wrap before returning
                        });
}
```

**Pattern**: `Option.option(nullable)` immediately converts external null to `Option.none()`.

#### 2. Writing to Nullable Database Columns

When persisting to databases with nullable columns, convert `Option<T>` to null for the column:

```java
// Adapter layer - JOOQ insert with optional field
public Promise<Unit> saveUser(User user) {
    return Promise.lift(DatabaseError::cause,
                        () -> {
                                  dsl.insertInto(USERS)
                                     .set(USERS.ID, user.id().value())
                                     .set(USERS.EMAIL, user.email().value())
                                     .set(USERS.REFERRAL_CODE, user.refCode().map(ReferralCode::value).orElse(null))  // Option → nullable column
                                     .execute();
                                  return Unit.unit();
                        });
}

// JDBC PreparedStatement example
PreparedStatement stmt = connection.prepareStatement("INSERT INTO users (id, email, referral_code) VALUES (?, ?, ?)");
stmt.setString(1, user.id().value());
stmt.setString(2, user.email().value());
stmt.setString(3, user.refCode().map(ReferralCode::value).orElse(null));  // Option → null
```

**Pattern**: `.orElse(null)` ONLY when mapping `Option<T>` to nullable database column.

#### 3. Testing Validation

Use null in test inputs to verify that validation correctly rejects null:

```java
@Test
void email_fails_forNull() {
    Email.email(null)  // Test null input
         .onSuccess(Assertions::fail);
}

@Test
void validRequest_fails_whenFieldNull() {
    var request = new Request("valid@example.com", null);  // Test null password
    ValidRequest.validRequest(request)
                .onSuccess(Assertions::fail);
}

@Test
void userId_fails_forNull() {
    UserId.userId((String) null)
          .onSuccess(Assertions::fail);
}
```

**Pattern**: Use null in test inputs to verify validation behavior.

### When Null is NOT Acceptable

#### Never Pass Null Between JBCT Components

Business logic components communicate using domain types, never null:

```java
// ❌ WRONG - Defensive null checking in business logic
public Result<Order> processOrder(User user, Cart cart) {
    if (user == null || cart == null) {  // DON'T do this
        return OrderError.InvalidInput.INSTANCE.result();
    }
    ...
}

// ✅ CORRECT - Parameters guaranteed non-null by convention
public Result<Order> processOrder(User user, Cart cart) {
    // If cart might be absent, parameter should be Option<Cart>
    // If user might be absent, operation shouldn't be called
    ...
}

// ✅ CORRECT - Explicit optionality when needed
public Result<Order> processOrder(User user, Option<Cart> cart) {
    return cart
        .toResult(OrderError.EmptyCart.INSTANCE)
        .flatMap(c -> validateAndProcess(user, c));
}
```

**Rule**: If a value might be absent, use `Option<T>` parameter, never null.

#### Never Use Null for "Unknown" vs "Absent"

Null conflates two meanings: "value not set" and "value unknown/error". Use types to distinguish:

```java
// ❌ WRONG - Null means "unknown"
public String getUserTheme(UserId id) {
    Theme theme = findTheme(id);
    return theme != null ? theme.name() : null;  // What does null mean?
}

// ✅ CORRECT - Option distinguishes "not set" from "error"
public Option<Theme> getUserTheme(UserId id) {
    return findTheme(id);  // none() = not set, some(theme) = set
}

// ✅ CORRECT - Result distinguishes "not found" from "error"
public Result<Theme> getRequiredTheme(UserId id) {
    return findTheme(id)
        .toResult(ThemeError.NotFound.INSTANCE);
}
```

#### Never Return Null from Business Logic

Business logic always uses typed returns:

```java
// ❌ WRONG - Returning null from business logic
public User enrichUser(User user) {
    Profile profile = loadProfile(user.id());
    if (profile == null) return null;  // Don't return null!
    return user.withProfile(profile);
}

// ✅ CORRECT - Using Option
public Option<User> enrichUser(User user) {
    return loadProfile(user.id())  // Returns Option<Profile>
        .map(profile -> user.withProfile(profile));
}

// ✅ CORRECT - Using Result if enrichment can fail
public Result<User> enrichUser(User user) {
    return loadProfile(user.id())
        .toResult(ProfileError.NotFound.INSTANCE)
        .map(profile -> user.withProfile(profile));
}
```

### Summary

| Context                            | Null Usage | Correct Approach                      |
|------------------------------------|------------|---------------------------------------|
| Return values from JBCT code       | ❌ Never    | Use `Option<T>`                       |
| Parameters between JBCT components | ❌ Never    | Use `Option<T>` or required types     |
| Wrapping external API returns      | ✅ Allowed  | `Option.option(nullable)` immediately |
| Writing to nullable DB columns     | ✅ Allowed  | `.orElse(null)` at write boundary     |
| Test inputs for validation         | ✅ Allowed  | Test null rejection                   |
| "Unknown" or "absent" semantics    | ❌ Never    | Use `Option<T>` or `Result<T>`        |

**Core Principle**: Null exists only at system boundaries (adapters). Inside JBCT code, absence is represented by `Option.none()`, never null.

**Benefits**:
- **Mental Overhead**: No defensive null checks in business logic (-2)
- **Reliability**: Compiler enforces null handling at boundaries (+2)
- **Complexity**: Clear semantics - `Option.none()` vs null confusion eliminated (+1)

---

## Naming Conventions

Consistent naming reduces cognitive overhead and improves readability. This technology uses specific conventions that make code scannable and predictable.

### Factory Method Naming

Factories are always named after their type, lowercase-first (camelCase). This creates a natural, readable call site:

```java
Email.email("user@example.com")
Password.password("Secret123")
AccountId.accountId("ACC-001")
```

The intentional redundancy (`Email.email`) enables conflict-free static imports:
```java
import static com.example.domain.Email.email;

// At call site:
var result = email(raw);  // Clear what's being created
```

This pattern is grep-friendly and unambiguous - searching for `Email.email` or `email(` finds all email construction sites.

**Implementation patterns:**

**Value objects** (records) — Always use records for serializable data types:
```java
record Email(String value) {
    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
                     .map(String::trim)
                     .map(Email::new);
    }
}
```

**Use cases and steps** (lambdas) — Return lambdas for behavioral components that don't require serialization:
```java
public interface RegisterUser extends UseCase.WithPromise<Response, Request> {
    // Factory returns lambda implementing the interface
    static RegisterUser registerUser(CheckEmail checkEmail, CreateUser createUser) {
        return request -> ValidRequest.validRequest(request)
                                      .async()
                                      .flatMap(checkEmail::apply)
                                      .flatMap(createUser::apply);
    }
}
```

**Rationale:** Value objects (Request, Response, domain records) need serialization for API contracts and persistence. Use cases and steps are created at assembly time and never serialized—lambdas are sufficient and lighter-weight than record implementations.

**❌ ANTI-PATTERN: Nested Record Implementation**

NEVER create use case factories that return nested record implementations:

```java
// ❌ WRONG - Verbose nested record
static RegisterUser registerUser(CheckEmail checkEmail, SaveUser saveUser) {
    record registerUser(CheckEmail checkEmail, SaveUser saveUser) implements RegisterUser {
        @Override
        public Promise<Response> execute(Request request) {
            return ValidRequest.validRequest(request)
                               .async()
                               .flatMap(checkEmail::apply)
                               .flatMap(saveUser::apply);
        }
    }
    return new registerUser(checkEmail, saveUser);
}
```

**Why this is wrong:**
- Unnecessary verbosity (doubles the code length)
- Requires `@Override` annotation
- Creates record class when lambda suffices
- No benefit: use cases are never serialized
- Violates Single Level of Abstraction if private helper methods added
- Harder to read and maintain

**✅ CORRECT: Direct Lambda Return**

```java
// ✅ CORRECT - Concise lambda
static RegisterUser registerUser(CheckEmail checkEmail, SaveUser saveUser) {
    return request -> ValidRequest.validRequest(request)
                                  .async()
                                  .flatMap(checkEmail::apply)
                                  .flatMap(saveUser::apply);
}
```

**Rule:** Use case and step factories always return lambdas directly. Records are for data (value objects), lambdas are for behavior (use cases, steps).

### Acronym Naming

Treat acronyms as normal words using camelCase, not all-uppercase. This improves readability by making acronyms blend naturally into identifiers.

**Rationale:** Code is read far more often than it's written. Optimize for reading by making text flow smoothly.

**Examples:**
```java
// DO: Treat acronyms as words
HttpClient client;
XmlParser parser;
sendJsonRequest(data);
setRestApiUrl(url);
validateHtmlContent(html);

// DON'T: All-caps acronyms break readability
HTTPClient client;
XMLParser parser;
sendJSONRequest(data);
setRESTAPIURL(url);
validateHTMLContent(html);
```

**Why by criteria:**
- **Mental Overhead**: Smooth camelCase reads faster than mixed case breaks (+2).
- **Complexity**: Consistent casing rules - no special cases for acronyms (+1).

**Edge case - Two-letter acronyms:** Use lowercase for better flow:
```java
// DO
IoException
IdGenerator

// DON'T
IOException  // Harder to scan in mixed context
IDGenerator
```

> **Source:** [Daniel Moka on LinkedIn](https://www.linkedin.com/posts/danielmoka_clean-code-tip-name-acronyms-as-normal-words-activity-7380843966650474496-vNzK)

### Validated Input Naming

Use the `Valid` prefix (not `Validated`) for types representing validated inputs or intermediate data after validation:

```java
// DO: Use Valid prefix
record ValidRequest(Email email, Password password, Option<ReferralCode> refCode) {
    static Result<ValidRequest> validRequest(Request raw) { ... }
}

record ValidUser(Email email, HashedPassword hashed, Option<ReferralCode> refCode) {}
record ValidCredentials(Email email, HashedPassword hashed) {}

// DON'T: Use Validated prefix (too verbose, no additional semantics)
record ValidatedRequest(...)  // ❌
record ValidatedUser(...)      // ❌
record ValidatedCredentials(...)  // ❌
```

**Rationale:** `Valid` is concise and conveys the same meaning as `Validated`. The past-tense form adds no semantic value—both indicate the data has passed validation. Shorter names reduce line length and cognitive overhead.

**Why by criteria:**
- **Mental Overhead**: Shorter, clearer naming reduces scanning time (+2).
- **Complexity**: One consistent prefix pattern—no ambiguity about when to use which form (+1).

### Test Naming

Follow the pattern: `methodName_outcome_condition`

```java
void validRequest_succeeds_forValidInput()
void validRequest_fails_forInvalidEmail()
void execute_succeeds_forValidInput()
void execute_fails_whenEmailAlreadyExists()
```

This makes test intent immediately clear: what's being tested, expected outcome, and condition triggering that outcome.

### Zone-Based Naming Vocabulary

> **Attribution:** The zone-based naming framework below is adapted from [Derrick Brandt's systematic approach to clean code](https://medium.com/@brandt.a.derrick/how-to-write-clean-code-actually-5205963ec524), modified to align with JBCT patterns and the four return types.

Use these pre-defined verbs to maintain consistent abstraction levels across your codebase. The vocabulary eliminates naming debates and ensures functions at the same abstraction level use similar language.

**Zone 2 Verbs (Step Interfaces - Orchestration):**

| Verb         | When to Use                                 | JBCT Example                   |
|--------------|---------------------------------------------|--------------------------------|
| `validate`   | Checking rules/constraints                  | `ValidateInput.apply()`        |
| `process`    | Transforming or interpreting data           | `ProcessPayment.apply()`       |
| `handle`     | Coordinating reactions to input/events      | `HandleRefund.apply()`         |
| `transform`  | Converting between representations          | `TransformOrder.apply()`       |
| `apply`      | Changing state using parameters             | `ApplyDiscount.apply()`        |
| `check`      | Verifying conditions (returns Result<Unit>) | `CheckInventory.apply()`       |
| `build`      | Assembling complex objects                  | `BuildReport.apply()`          |
| `resolve`    | Determining ambiguous cases                 | `ResolveAddress.apply()`       |
| `load`       | Retrieving data for use                     | `LoadUserProfile.apply()`      |
| `save`       | Persisting changes                          | `SaveOrder.apply()`            |
| `sync`       | Aligning systems or datasets                | `SyncInventory.apply()`        |
| `notify`     | Informing others of events                  | `NotifyUser.apply()`           |
| `manage`     | Supervising lifecycle or multiple sub-tasks | `ManageSession.apply()`        |
| `configure`  | Setting up with flexible options            | `ConfigureSettings.apply()`    |
| `initialize` | Preparing for first use                     | `InitializeConnection.apply()` |

**Zone 3 Verbs (Leaves - Implementation):**

| Verb              | Typical Use                      | JBCT Example                |
|-------------------|----------------------------------|-----------------------------|
| `get`             | Retrieve a value                 | `getTimestamp()`            |
| `set`             | Assign a value                   | `setHeader()`               |
| `fetch`           | Pull from external source        | `fetchWeatherData()`        |
| `parse`           | Break down structured input      | `parseJson()`               |
| `format`          | Build structured output          | `formatDate()`              |
| `calculate`       | Perform computation              | `calculateTax()`            |
| `convert`         | Transform between types          | `convertToUtc()`            |
| `map`             | Apply logic to value             | `mapToDto()`                |
| `filter`          | Reduce based on criteria         | `filterActive()`            |
| `hash`            | Cryptographic transformation     | `hashPassword()`            |
| `encode`/`decode` | Serialization                    | `decodeToken()`             |
| `extract`         | Pull piece from larger structure | `extractDomain()`           |
| `split`/`join`    | String/array manipulation        | `splitPath()`, `joinTags()` |
| `log`             | Track information                | `logError()`                |
| `send`            | Transmit over network            | `sendEmail()`               |
| `receive`         | Handle incoming data             | `receivePayload()`          |
| `read`            | Access from file/disk/memory     | `readConfigFile()`          |
| `write`           | Persist to disk or memory        | `writeLogToFile()`          |
| `add`             | Append or increment              | `addItemToCart()`           |
| `remove`          | Delete or detach                 | `removeUser()`              |

**Naming Patterns:**

Zone 2 (steps):
```java
// verb + general noun
interface ValidateInput { ... }
interface ProcessPayment { ... }
interface HandleNotification { ... }
```

Zone 3 (leaves):
```java
// verb + specific noun
private Timestamp getTimestamp() { ... }
private Hash hashPassword(Password pwd) { ... }

// verb + preposition + object
private Data fetchFromCache(Key key) { ... }
private Unit saveToDatabase(User user) { ... }
```

**Anti-pattern - Mixing Zones:**

```java
// ❌ WRONG - Zone 2 step using Zone 3 verb
interface FetchUserData { ... }  // Too specific - "fetch" is Zone 3

// ✅ CORRECT - Zone 2 verb
interface LoadUserData { ... }   // Appropriately general - "load" is Zone 2
```

**Guideline:** If unsure about naming, consult the zone verb tables. Consistent vocabulary eliminates bikeshedding and improves codebase scanability. When naming a step interface, reach for Zone 2 verbs first. When naming a leaf function, use Zone 3 verbs.

**Why this matters:**
- **Consistency**: Same verb for same abstraction level across entire codebase
- **Lower Mental Overhead**: Predictable naming patterns reduce cognitive load
- **AI-friendly**: Clear vocabulary makes code generation more deterministic
- **Self-documenting**: Function name immediately signals its abstraction level

---

## Project Structure & Package Organization

### Vertical Slicing Philosophy

This technology organizes code around **vertical slices** - each use case is self-contained with its own business logic, validation, and error handling. Unlike architectures that centralize all business logic into one functional core, we **isolate business logic within each use case package**. This creates clear boundaries and prevents coupling between unrelated features.

**Why vertical slicing (by criteria):**
- **Complexity**: Minimizes coupling between unrelated features - each slice independent (+3).
- **Business/Technical Ratio**: Package names reflect domain use cases, not technical layers (+2).
- **Mental Overhead**: All related code in one place - less navigation across packages (+2).
- **Design Impact**: Forces proper boundaries - business logic cannot leak between use cases (+2).

### Package Structure

The standard package layout follows this pattern:

```
com.example.app/
├── usecase/
│   ├── registeruser/              # Use case 1 (vertical slice)
│   │   ├── RegisterUser.java      # Use case interface + factory
│   │   ├── RegistrationError.java # Sealed error interface
│   │   └── [internal types]       # ValidRequest, intermediate records
│   │
│   └── getuserprofile/            # Use case 2 (vertical slice)
│       ├── GetUserProfile.java
│       ├── ProfileError.java
│       └── [internal types]
│
├── domain/
│   └── shared/                    # Reusable value objects only
│       ├── Email.java
│       ├── Password.java
│       ├── UserId.java
│       └── [other VOs]
│
├── adapter/
│   ├── rest/                      # Inbound adapters (HTTP)
│   │   ├── UserController.java
│   │   └── [other controllers]
│   │
│   └── persistence/               # Outbound adapters (DB, external APIs)
│       ├── JooqUserRepository.java
│       └── [other repositories]
│
└── config/                        # Framework configuration
    ├── UseCaseConfig.java
    └── [other configs]
```

### Package Placement Rules

**Use Case Packages** (`com.example.app.usecase.<usecasename>`):
- Use case interface and factory method
- Error types specific to this use case (sealed interface)
- Step interfaces (nested in use case interface)
- Internal validation types (ValidRequest, intermediate records)
- **Rule**: If a type is used only by this use case, it stays here

**Domain Shared** (`com.example.app.domain.shared`):
- Value objects reused across multiple use cases
- **Rule**: Move here immediately when a second use case needs the same value object
- **Anti-pattern**: Don't create this upfront - let reuse drive the move

**Adapter Packages** (`com.example.app.adapter.*`):
- `adapter.rest` - HTTP controllers, request/response DTOs
- `adapter.persistence` - Database repositories, ORM entities
- `adapter.messaging` - Message queue consumers/producers
- `adapter.external` - HTTP clients for external services
- **Rule**: Adapters implement step interfaces from use cases

**Config Package** (`com.example.app.config`):
- Spring/framework configuration
- Bean wiring, dependency injection setup
- **Rule**: No business logic, only infrastructure configuration

### Module Organization (Optional)

For larger systems, split into Gradle/Maven modules:

```
:domain          # Pure Java - value objects, no framework deps
:application     # Use cases and step interfaces
:adapters        # All adapter implementations
:bootstrap       # Main class, configuration, framework setup
```

**When to use modules:**
- Team size > 5 developers
- Multiple deployment units from same codebase
- Enforcing compile-time dependency boundaries
- Independent library publication

**For smaller systems:**
- Single module with packages is sufficient
- Simpler build, faster iteration
- Package discipline enforces boundaries

### Key Principles

**1. Vertical Slicing:**
Each use case package is a vertical slice containing everything needed for that feature. Business logic doesn't leak across use case boundaries.

**2. Minimal Sharing:**
Only share value objects when truly reusable. Premature sharing creates coupling.

**3. Framework at Edges:**
Business logic (use cases, domain) has zero framework dependencies. Adapters and config handle framework integration.

**4. Clear Dependencies:**
- Use cases depend on: domain.shared
- Adapters depend on: use cases (implement step interfaces)
- Config depends on: use cases + adapters (wires them together)
- **Never**: use case depending on adapter, adapter depending on another adapter

**5. Adapter Isolation:**
All I/O operations live in adapters. This enables framework swapping (Spring → Micronaut, JDBC → JOOQ) without touching business logic.

### Example: Where Things Go

**Creating a new Email value object:**
- First use case: Put in `usecase.registeruser` package
- Second use case needs it: Move to `domain.shared`

**Creating a new use case:**
```
com.example.app.usecase.updateprofile/
├── UpdateProfile.java       # Interface + factory
├── UpdateError.java         # Errors
└── ValidUpdateRequest.java  # Internal validation
```

**Implementing database access:**
```
com.example.app.adapter.persistence/
└── JooqProfileRepository.java  # implements UpdateProfile.SaveProfile
```

**Wiring in Spring:**
```
com.example.app.config/
└── ProfileConfig.java  # @Bean methods connecting pieces
```

---

## File Structure Guidelines

This section defines the internal structure of JBCT source files. These guidelines ensure consistency across codebases and enable automated linting.

**Scope:** Use case interfaces, step implementations, value objects, error interfaces, and utility interfaces. Adapters are excluded—they are too framework-specific.

### Import Ordering

All JBCT files follow this import order:

```
1. java.*
2. javax.*
3. org.pragmatica.*
4. third-party (org.*, com.* - alphabetically)
5. project imports
6. (blank line)
7. static imports (same grouping order)
```

### Use Case Interface

```java
package com.example.app.usecase.registeruser;

import org.pragmatica.lang.*;
import com.example.app.domain.shared.*;

public interface RegisterUser {

    // Public API
    record Request(String email, String password, String referralCode) {}
    record Response(UserId userId, ConfirmationToken token) {}

    Promise<Response> execute(Request request);

    // Internal types
    record ValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {
        public static Result<ValidRequest> validRequest(Request raw) { ... }
    }

    // Step interfaces
    interface CheckEmail {
        Promise<ValidRequest> apply(ValidRequest request);
    }

    interface SaveUser {
        Promise<UserId> apply(ValidUser user);
    }

    // Domain fragments (use case specific)
    record ValidUser(Email email, HashedPassword hashed, Option<ReferralCode> referralCode) {}

    // Factory
    static RegisterUser registerUser(CheckEmail checkEmail, SaveUser saveUser) {
        return request -> ValidRequest.validRequest(request)
                                      .async()
                                      .flatMap(checkEmail::apply)
                                      .flatMap(saveUser::apply);
    }
}
```

**Member order:**
1. Public API (Request, Response records)
2. Execute method
3. Internal types (ValidRequest + validation helpers)
4. Step interfaces
5. Domain fragments (records used only by this use case)
6. Factory method

### Value Object

```java
package com.example.app.domain.shared;

import java.util.regex.Pattern;
import org.pragmatica.lang.*;

import static org.pragmatica.lang.Verify.*;

public record Email(String value) {

    // Constants
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forOneValue("Invalid email: %s");

    // Factory
    public static Result<Email> email(String raw) {
        return ensure(raw, Verify.Is::notNull)
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
                .map(Email::new);
    }

    // Helpers
    public String localPart() {
        int at = value.indexOf('@');
        return at > 0 ? value.substring(0, at) : value;
    }
}
```

**Member order:**
1. Static constants (patterns, cause factories)
2. Factory method
3. Helper methods

### Error Interface

```java
package com.example.app.usecase.registeruser;

import org.pragmatica.lang.Cause;

public sealed interface RegistrationError extends Cause {

    // Fixed-message errors (grouped enum)
    enum General implements RegistrationError {
        EMAIL_ALREADY_EXISTS("Email already registered"),
        WEAK_PASSWORD("Password too weak");

        private final String message;

        General(String message) {
            this.message = message;
        }

        @Override
        public String message() {
            return message;
        }
    }

    // Errors with data
    record DatabaseFailure(Throwable cause) implements RegistrationError {
        @Override
        public String message() {
            return "Database error: " + cause.getMessage();
        }
    }
}
```

**Member order:**
1. Enum variants (fixed-message errors, grouped)
2. Record variants (errors carrying data)

### Step Implementation

```java
package com.example.app.adapter.persistence;

import org.jooq.DSLContext;
import com.example.app.usecase.registeruser.RegisterUser.SaveUser;

public class JooqUserRepository implements SaveUser {

    // Dependencies
    private final DSLContext dsl;

    // Constructor
    public JooqUserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    // Interface method
    @Override
    public Promise<UserId> apply(ValidUser user) {
        return Promise.lift(
            RepositoryError.DatabaseFailure::new,
            () -> insertUser(user)
        );
    }

    // Private helpers
    private UserId insertUser(ValidUser user) { ... }
}
```

**Member order:**
1. Dependencies (final fields)
2. Constructor
3. Interface method(s)
4. Private helpers

### Utility Interface

```java
package com.example.app.util;

import java.util.regex.Pattern;
import org.pragmatica.lang.*;

public sealed interface ValidationUtils {

    // Constants
    Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{10,14}$");
    Fn1<Cause, String> INVALID_PHONE = Causes.forOneValue("Invalid phone: %s");

    // Static methods
    static Result<String> normalizePhone(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
                     .map(s -> s.replaceAll("[\\s\\-()]", ""))
                     .filter(INVALID_PHONE, PHONE_PATTERN.asMatchPredicate());
    }

    static boolean isValidCountryCode(String code) {
        return code != null && code.length() == 2;
    }

    // Sealed permit (prevents implementation)
    record unused() implements ValidationUtils {}
}
```

**Member order:**
1. Constants
2. Static methods (grouped by purpose if many)
3. `unused` record (always last—prevents implementation)

**Key points:**
- `sealed` prevents external implementation
- `unused` record satisfies permit requirement
- No visibility modifiers needed (implicit `public`)

### Section Separation

Use blank lines to separate logical sections. Comments are optional—use only when they add clarity (e.g., in examples or teaching contexts). Avoid mandatory section markers like `// --- Section ---`.

---

## Use Case Walkthrough

Let's build a complete use case from scratch: `RegisterUser`. We'll follow the technology step-by-step, showing validation, steps, error handling, and testing.

### Requirements

**Use case:** Register a new user account.

**Inputs (raw):**
- Email (string)
- Password (string)
- Referral code (optional string)

**Outputs:**
- User ID
- Confirmation token

**Validation rules:**
- Email: not null, valid format, lowercase normalized
- Password: not null, min 8 chars, at least one uppercase, one digit
- Referral code: optional; if present, must be exactly 6 uppercase alphanumeric characters

**Cross-field rules:**
- Email must not be registered yet

**Steps:**
1. Validate input
2. Check email uniqueness (async, database)
3. Hash password (sync, expensive computation)
4. Save the user to the database (async)
5. Generate confirmation token (async, calls external service)

**Async flow:** Steps 2, 4, 5 are async. Use `Promise<Response>`.

### Step 1: Package and Use Case Interface

Package: `com.example.app.usecase.registeruser`

```java
package com.example.app.usecase.registeruser;

import org.pragmatica.lang.*;

public interface RegisterUser {
    record Request(String email, String password, String referralCode) {}
    record Response(UserId userId, ConfirmationToken token) {}

    Promise<Response> execute(Request request);

    interface CheckEmailUniqueness {
        Promise<ValidRequest> apply(ValidRequest valid);
    }

    interface CreateValidUser {
        Promise<ValidUser> apply(ValidRequest valid);
    }

    interface SaveUser {
        Promise<User> apply(ValidUser validUser);
    }

    interface GenerateToken {
        Promise<Response> apply(User user);
    }

    static RegisterUser registerUser(CheckEmailUniqueness checkEmail,
                                     CreateValidUser createValidUser,
                                     SaveUser saveUser,
                                     GenerateToken generateToken) {
        return request -> ValidRequest.validRequest(request)
                                      .async()
                                      .flatMap(checkEmail::apply)
                                      .flatMap(createValidUser::apply)
                                      .flatMap(saveUser::apply)
                                      .flatMap(generateToken::apply);
    }
}
```

### Step 2: Valid Request

Nested record with factory method that builds `ValidRequest` from raw `Request`.

```java
record ValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {

    // From raw Request: parse per-field VOs
    public static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()),
                          ReferralCode.referralCode(raw.referralCode()))
                     .map(ValidRequest::new);
    }
}
```

If we had cross-field rules (e.g., "premium referral codes require 10+ char passwords"), we'd add them in the second factory, with the same name but accepting already valid individual fields:

```java
public static Result<ValidRequest> validRequest(Email email, 
                                                Password password, 
                                                Option<ReferralCode> referralCode) {
    return isPremiumWithWeakPassword(code, password)
            ? RegistrationError.General.WEAK_PASSWORD_FOR_PREMIUM.result()
            : Result.success(_ -> new ValidRequest(email, password, referralCode));
}

private static boolean isPremiumWithWeakPassword(ReferralCode code, Password password) {
    return code.isPremium() && password.length() < 10;
}
```

For simplicity, we'll skip cross-field checks in this example.

### Step 3: Value Objects (Business Leaves)

**Email:**
```java
package com.example.app.domain.shared;

import org.pragmatica.lang.*;

public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
                     .map(String::trim)
                     .map(String::toLowerCase)
                     .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
                     .map(Email::new);
    }
}
```

**Password:**

```java
package com.example.app.domain.shared;

import org.pragmatica.lang.*;

import java.util.function.Predicate;

public record Password(String value) {
    private static final Cause TOO_SHORT = Causes.cause("Password must be at least 8 characters");
    private static final Cause MISSING_UPPERCASE = Causes.cause("Password must contain uppercase letter");
    private static final Cause MISSING_DIGIT = Causes.cause("Password must contain digit");

    public static Result<Password> password(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
                     .filter(TOO_SHORT, s -> Verify.Is.lenBetween(s, 8, 128))
                     .flatMap(Password::ensureUppercase)
                     .flatMap(Password::ensureDigit)
                     .map(Password::new);
    }

    private static Result<String> ensureUppercase(String raw) {
        return contains(raw, Character::isUpperCase)
                ? Result.success(raw)
                : MISSING_UPPERCASE.result();
    }

    private static Result<String> ensureDigit(String raw) {
        return contains(raw, Character::isDigit)
                ? Result.success(raw)
                : MISSING_DIGIT.result();
    }

    private static boolean contains(CharSequence sequence, IntPredicate predicate) {
        return sequence.chars().anyMatch(predicate);
    }

    public int length() {
        return value.length();
    }

    public boolean contains(Username username) {
        return value.toLowerCase().contains(username.value().toLowerCase());
    }
}
```

**ReferralCode (optional-with-validation):**
```java
package com.example.app.domain.shared;

import org.pragmatica.lang.*;

public record ReferralCode(String value) {
    private static final Pattern PATTERN = Pattern.compile("^[A-Z0-9]{6}$");
    private static final Cause INVALID_FORMAT = Causes.cause("Invalid referral code format");

    public static Result<Option<ReferralCode>> referralCode(String raw) {
        return Verify.ensureOption(
            Option.option(raw).map(String::trim).filter(s -> !s.isEmpty()),
            PATTERN.asMatchPredicate(),
            INVALID_FORMAT
        ).map(opt -> opt.map(ReferralCode::new));
    }

    public boolean isPremium() {
        return value.startsWith("VIP");
    }
}
```

All three live in `com.example.app.domain.shared` because they're reusable across use cases.

### Step 4: Steps (Interfaces)

```java
// Step 1: Check email uniqueness
public interface CheckEmailUniqueness {
    Promise<ValidRequest> apply(ValidRequest request);
}

// Step 2: Hash password (sync)
public interface HashPassword {
    Result<HashedPassword> apply(Password password);
}

// Step 3: Create valid user with hashed password
public interface CreateValidUser {
    Promise<ValidUser> apply(ValidRequest valid);
}

// Step 4: Save the user
public interface SaveUser {
    Promise<User> apply(ValidUser user);
}

// Step 5: Generate a confirmation token
public interface GenerateToken {
    Promise<Response> apply(User user);
}
```

Supporting types:
```java
record ValidUser(Email email, HashedPassword hashed, Option<ReferralCode> refCode) {}
record HashedPassword(String value) {}
record UserId(String value) {}
record User(UserId id, Email email) {}
record ConfirmationToken(String value) {}
```

### Step 5: Step Implementations

**CheckEmailUniqueness (adapter leaf):**
```java
interface CheckEmailUniqueness {
    Promise<ValidRequest> apply(ValidRequest request);
    
    static CheckEmailUniqueness checkEmailUniqueness(UserRepository repository) {
        return request -> repository.findByEmail(request.email())
                                    .flatMap(user -> checkPresence(user, request));        
    }
    
    static Promise<ValidRequest> checkPresence(Option<User> user, ValidRequest request) {
        return user.isPresent() 
                ? RegistrationError.General.EMAIL_ALREADY_REGISTERED.promise()
                : Promise.success(request);
    }
}
```

**HashPassword (business leaf):**
```java
interface HashPassword {
    Result<HashedPassword> apply(Password password);
    
    static HashPassword hashPassword(BCryptPasswordEncoder encoder) {
        return password -> Result.lift1(RegistrationError.PasswordHashingFailed::new, 
                                        encoder::encode, 
                                        password.value())
                                 .map(HashedPassword::new);
    }
}
```

**CreateValidUser (sequencer step):**
```java
interface CreateValidUser {
    Promise<ValidUser> apply(ValidRequest valid);
    
    static CreateValidUser createValidUser(HashPassword hashPassword) {
        return valid -> hashPassword.apply(valid.password())
                                    .map(hashed -> createValidUser(valid, hashed))
                                    .async();
    }

    private ValidUser createValidUser(ValidRequest valid, HashedPassword hashed) {
        return new ValidUser(valid.email(), hashed, valid.referralCode());
    }
}
```

**SaveUser (adapter leaf):**
```java
class JooqUserRepository implements SaveUser {
    private final DSLContext dsl;

    public Promise<User> apply(ValidUser user) {
        return Promise.lift(RepositoryError.DatabaseFailure::cause, 
                            () -> saveUser(user));
    }

    private User saveUser(ValidUser user) {
        String id = dsl.insertInto(USERS)
                       .set(USERS.EMAIL, user.email().value())
                       .set(USERS.PASSWORD_HASH, user.hashed().value())
                       .set(USERS.REFERRAL_CODE, user.refCode().map(ReferralCode::value).orElse(null))
                       .returningResult(USERS.ID)
                       .fetchSingle()
                       .value1();

        return new User(new UserId(id), user.email());
    }
}
```

**GenerateToken (adapter leaf):**
```java
class TokenServiceClient implements GenerateToken {
    private final HttpClient httpClient;

    public Promise<Response> apply(User user) {
        return httpClient.post("/tokens/confirm", Map.of("userId", user.id().value()))
                         .map(resp -> buildResponse(user.id(), resp))
                         .recover(this::mapTokenError);
    }

    private Response buildResponse(UserId userId, Map<String, String> resp) {
        return new Response(userId, new ConfirmationToken(resp.get("token")));
    }

    private Promise<Response> mapTokenError(Throwable err) {
        return RegistrationError.General.TOKEN_GENERATION_FAILED.promise();
    }
}
```

### Step 6: Errors

```java
package com.example.app.usecase.registeruser;

import org.pragmatica.lang.Cause;

public sealed interface RegistrationError extends Cause {
    enum General implements RegistrationError {
        EMAIL_ALREADY_REGISTERED("Email already registered"),
        WEAK_PASSWORD_FOR_PREMIUM("Premium referral codes require passwords of at least 10 characters"),
        TOKEN_GENERATION_FAILED("Token generation failed");

        private final String message;

        General(String message) {
            this.message = message;
        }

        @Override
        public String message() {
            return message;
        }
    }

    record PasswordHashingFailed(Throwable cause) implements RegistrationError {
        @Override
        public String message() {
            return "Password hashing failed: " + Causes.fromThrowable(cause);
        }
    }
}
```

### Step 7: Testing

**Validation tests:**
```java
@Test
void validRequest_fails_forInvalidEmail() {
    var request = new Request("not-an-email", "Valid1234", null);

    ValidRequest.validRequest(request)
                .onSuccess(Assertions::fail);
}

@Test
void validRequest_fails_forWeakPassword() {
    var request = new Request("user@example.com", "weak", null);

    ValidRequest.validRequest(request)
                .onSuccess(Assertions::fail);
}

@Test
void validRequest_fails_forInvalidReferralCode() {
    var request = new Request("user@example.com", "Valid1234", "abc");

    ValidRequest.validRequest(request)
                .onSuccess(Assertions::fail);
}

@Test
void validRequest_succeeds_forValidInput() {
    var request = new Request("user@example.com", "Valid1234", "ABC123");

    ValidRequest.validRequest(request)
                .onFailure(Assertions::fail)
                .onSuccess(valid -> {
                    assertEquals("user@example.com", valid.email().value());
                    assertTrue(valid.referralCode().isPresent());
                });
}
```

**Happy path test (with stubs):**
```java
@Test
void execute_succeeds_forValidInput() {
    CheckEmailUniqueness checkEmail = req -> Promise.success(req);
    HashPassword hashPassword = pwd -> Result.success(new HashedPassword("hashed"));
    SaveUser saveUser = user -> Promise.success(new UserId("user-123"));
    GenerateToken generateToken = id -> Promise.success(
        new Response(id, new ConfirmationToken("token-456"))
    );

    var useCase = RegisterUser.registerUser(checkEmail, hashPassword, saveUser, generateToken);
    var request = new Request("user@example.com", "Valid1234", null);

    useCase.execute(request)
          .await()
          .onFailure(Assertions::fail)
          .onSuccess(response -> {
              assertEquals("user-123", response.userId().value());
              assertEquals("token-456", response.token().value());
          });
}
```

**Failure scenario:**
```java
@Test
void execute_fails_whenEmailAlreadyExists() {
    CheckEmailUniqueness checkEmail = req -> RegistrationError.EmailAlreadyRegistered.INSTANCE.promise();
    HashPassword hashPassword = pwd -> Result.success(new HashedPassword("hashed"));
    SaveUser saveUser = user -> Promise.success(new UserId("user-123"));
    GenerateToken generateToken = id -> Promise.success(new Response(id, new ConfirmationToken("token-456")));

    var useCase = RegisterUser.registerUser(checkEmail, hashPassword, saveUser, generateToken);
    var request = new Request("existing@example.com", "Valid1234", null);

    useCase.execute(request)
           .await()
           .onSuccess(Assertions::fail);
}
```

---

## Framework Integration

This technology is framework-agnostic, but you still need to connect it to the real world: HTTP endpoints, databases, message queues. Here's how to bridge the functional core to an imperative framework (Spring Boot example).

### Complete Example: Spring REST → Use Case → JOOQ

**Use Case:** `GetUserProfile`  - fetch a user profile by ID.

**Layers:**
1. REST controller (adapter in)
2. Use case (functional core)
3. JOOQ repository (adapter out)

**1. Use Case (functional core):**

```java
package com.example.app.usecase.getuserprofile;

import org.pragmatica.lang.*;

public interface GetUserProfile {
    record Request(String userId) {}
    record Response(String userId, String email, String displayName) {
        static Response fromUser(User user) {
            return new Response(user.id().value(), user.email().value(), user.displayName());
        }
    }

    Promise<Response> execute(Request request);

    interface FetchUser { 
        Promise<User> apply(UserId userId); 
    }

    static GetUserProfile getUserProfile(FetchUser fetchUser) {
        return request -> UserId.userId(request.userId())
                                .async()
                                .flatMap(fetchUser::apply)
                                .map(Response::fromUser);
    }
}
```

**2. REST Controller (adapter in):**

```java
package com.example.app.adapter.rest;

import com.example.app.usecase.getuserprofile.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final GetUserProfile getUserProfile;

    public UserController(GetUserProfile getUserProfile) {
        this.getUserProfile = getUserProfile;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        var request = new GetUserProfile.Request(userId);

        return getUserProfile.execute(request)
                             .await()  // Block (or use reactive types in real Spring WebFlux)
                             .fold(response -> ResponseEntity.ok(response), cause -> toErrorResponse(cause));
    }

    private ResponseEntity<?> toErrorResponse(Cause cause) {
        return switch (cause) {
            case ProfileError.UserNotFound _ -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                              .body(Map.of("error", cause.message()));

            case ProfileError.InvalidUserId _ -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                               .body(Map.of("error", cause.message()));

            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                     .body(Map.of("error", "Internal server error"));
        };
    }
}
```

The controller is a thin adapter: extract path variable → create `Request` → call use case → map `Response`/`Cause` to HTTP status/body. No business logic here.

**3. JOOQ Repository (adapter out):**

```java
package com.example.app.adapter.persistence;

import com.example.app.usecase.getuserprofile.*;
import org.jooq.*;
import org.pragmatica.lang.*;
import org.springframework.stereotype.Repository;

import static com.example.db.tables.Users.USERS;

@Repository
public class JooqUserRepository implements GetUserProfile.FetchUser {
    private final DSLContext dsl;

    public JooqUserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public Promise<User> apply(UserId userId) {
        return Promise.lift(ProfileError.DatabaseFailure::cause, 
                            () -> dsl.selectFrom(USERS)
                                     .where(USERS.ID.eq(userId.value()))
                                     .fetchOptional())
                      .flatMap(optRecord -> optRecord.map(this::toDomain)
                                                     .orElse(ProfileError.UserNotFound.INSTANCE.promise())
        );
    }

    private Promise<User> toDomain(Record record) {
        return Result.all(UserId.userId(record.get(USERS.ID)), 
                          Email.email(record.get(USERS.EMAIL)), 
                          Result.success(record.get(USERS.DISPLAY_NAME)))
                     .map(User::new)
                     .async();
    }
}
```

The repository wraps JOOQ exceptions in domain `Cause` objects. Business logic never sees `DataAccessException`.

**4. Wiring (Spring config):**

```java
package com.example.app.config;

import com.example.app.usecase.getuserprofile.*;
import com.example.app.adapter.persistence.JooqUserRepository;
import org.springframework.context.annotation.*;

@Configuration
public class UseCaseConfig {

    @Bean
    public GetUserProfile getUserProfile(JooqUserRepository repository) {
        return GetUserProfile.getUserProfile(repository);
    }
}
```

Spring autowires the repository into the use case factory. The use case is a bean, injected into the controller.

**Summary:**

- **Controller:** Imperative, thin adapter. Converts HTTP → `Request`, `Response`/`Cause` → HTTP.
- **Use case:** Functional, pure business logic. No framework dependencies.
- **Repository:** Imperative, thin adapter. Converts JOOQ → domain types, exceptions → `Cause`.

The functional core (use case + domain types) is framework-independent. You could swap Spring for Micronaut, Ktor, or plain Servlets - just rewrite the adapters, not the business logic.

---

## Conclusion

This technology isn't about learning new tools or frameworks. It's about reducing the number of decisions you make so you can focus on the decisions that matter - the business logic.

By constraining return types to exactly four kinds, enforcing parse-don't-validate, eliminating business exceptions, and mandating one pattern per function, we compress the design space. There's essentially one good way to structure a use case, one good way to validate input, one good way to handle errors, one good way to compose async operations.

This compression has compound benefits. Code becomes predictable - you recognize patterns at a glance. Refactoring becomes mechanical - the rules tell you when and how to split functions. Technical debt becomes rare - prevention is built into the structure. Business logic becomes clear - domain concepts aren't buried in framework ceremony or mixed abstraction levels.

In the AI era, this matters more than ever. When AI generates code, it needs a well-defined target structure. When humans read AI-generated code, they need to recognize patterns instantly. When teams collaborate across humans and AI, they need a shared vocabulary that both understand without translation overhead.

The technology is simple: four return types, parse-don't-validate, no business exceptions, one pattern per function, clear package layout, mechanical refactoring. The impact compounds: unified structure, minimal debt, close business modeling, deterministic generation, tooling-friendly code.

Start small. Pick one use case. Apply the rules. See how it feels. Then expand. The rules stay the same whether you're building a monolith or a microservice, a synchronous API or an event-driven system, a greenfield project or refactoring legacy code.

The goal isn't perfect code. It's code that's easy to understand, easy to change, easy to test, and easy to generate. Code that humans and AI can collaborate on without friction.

Write code that explains itself. Let structure carry intent. Focus on business logic, not technical ceremony.

That's the technology.

---

## Tooling

JBCT provides tools for both human developers and AI assistants. For complete documentation and installation instructions, see the [Tools section in README.md](README.md#-tools).

### AI Tools

- **JBCT Skill** - Claude Code skill for learning and quick reference
- **jbct-coder** - Subagent for generating JBCT-compliant code
- **jbct-reviewer** - Subagent for code review against JBCT patterns

### CLI Tools

- **JBCT CLI** - Command-line tool for formatting and linting
  - `jbct format` - Format Java code to JBCT style
  - `jbct lint` - Check compliance with 36 lint rules
  - `jbct check` - Combined format + lint (recommended for CI)
- **Maven Plugin** - Build integration for automated checks

---

## Version History

For detailed changelog of all versions, see [CHANGELOG.md](https://github.com/siy/coding-technology/blob/main/CHANGELOG.md).

---

**Copyright © 2025 Sergiy Yevtushenko**

This work is licensed under the [MIT License](https://github.com/siy/coding-technology/blob/main/LICENSE). You are free to use, modify, and distribute this content in commercial and non-commercial projects.
