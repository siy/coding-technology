# JBCT Reference: Core Rules and Return Kinds

> Part of the `jbct` skill; loaded on demand from the index in `../SKILL.md`. Text moved verbatim from the former single-file SKILL.md.

## Core Philosophy

JBCT reduces the space of valid choices to one good way to do most things through:
- **Four Return Kinds**: Every function returns one of four semantic shapes: `T`, `Option<T>`, `Result<T>`, `Promise<T>`
- **Parse, Don't Validate**: Make invalid states unrepresentable
- **No Business Exceptions**: Business failures are typed `Cause` values
- **Thread Safety by Design**: Immutability at boundaries, thread confinement for sequential logic
- **Six Structural Patterns**: All code fits one pattern (Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects)

<!-- book:jbct-approach -->
**Java Backend Coding Technology (JBCT)** proposes a different approach: **reduce the space of valid choices until there's essentially one good way to do most things**. Not through rigid frameworks or heavy ceremony, but through a small set of rules that make structure predictable, refactoring mechanical, and business logic clearly separated from technical concerns.

The benefits compound:

**Unified structure** means humans can read AI-generated code without guessing about hidden assumptions, and AI can read human code without inferring structure from context. A use case looks the same whether you wrote it, your colleague wrote it, or an AI assistant generated it. The structure carries the intent.

**Minimal technical debt** emerges naturally because refactoring rules are built into the methodology. When a function grows beyond one clear operation, the rules tell you exactly how to split it. When a component gets reused, there's one obvious place to move it. Debt doesn't accumulate because prevention is cheaper than cleanup.

**Close business modeling** happens when you're not fighting technical noise. Value objects enforce domain invariants at construction time. Use cases read like business processes because each step does one thing. Errors are domain concepts, not stack traces. Product owners can read the code structure and recognize their requirements.

**Requirement discovery** becomes systematic. When you structure code as validation → steps → composition, gaps become obvious. Missing validation rules surface when you define value objects. Unclear business logic reveals itself when you can't name a step clearly. Edge cases emerge when you model errors as explicit types.

**Common language** emerges when patterns become vocabulary. The six patterns (Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects) describe both code structure and business processes. When business says "First we verify, then we process, then we notify"—that's a Sequencer. When they say "We need profile, preferences, and history"—that's a Fork-Join. The translation is mechanical, and requirements discussions become technical design sessions.

**Business logic as a readable language** happens when patterns become vocabulary. The four return types, parse-don't-validate, and the fixed pattern catalog form a consistent way to express domain concepts in code. Anyone who understands the domain can pick up a new codebase virtually instantly.

**Hide the machinery, keep the meaning** is the property those last two add up to, and it deserves its own name. Technical noise is pushed to the edges *and* the business facts survive in the types: a return type states whether a step can fail, an `Option` parameter states that the domain allows absence, `Promise.all` states that steps are independent, a sealed error type states the complete failure catalog. The code executes and testifies at once — and because the testimony lives in types, the compiler keeps it true. The full inventory is a table in [From Process to Patterns](https://pragmatica.dev/java/jbct/course/from-process-to-patterns/), and it is why JBCT code stays legible to humans and AI assistants alike after its authors have moved on.

**Deterministic code generation** becomes possible when the mapping from requirements to code is mechanical. Given a use case specification - inputs, outputs, validation rules, steps - there's essentially one correct structure. Different developers (or AI assistants) should produce nearly identical implementations.

**The normalization boundary.** "Nearly identical" has a precise scope, and stating the scope is what makes the claim testable. JBCT derives the package hierarchy (the telescope rule), the Java types, the step contracts and return types, the pattern for each composition, the failure representation, the placement of shared code, the concurrency structure, and the testing obligations. JBCT does not normalize algorithms inside atomic leaves, framework-specific adapter internals, module promotion (content-invariant along derived boundaries — [Project Structure](https://pragmatica.dev/java/jbct/course/project-structure/) has the full treatment), the test-input supply vehicle, or test-data representation. Variation below this line is style; variation above it is a defect. A newly discovered variation receives an explicit ruling: closed by a rule, or placed below the line. The boundary comes from measurement rather than taste — inspecting independent implementations of one design found their skeletons identical, and what differed became the first rulings.

**Construction that scales** is what these properties buy at team size. It is a different claim from runtime parallelism: whether steps *run* in parallel follows from their data dependencies, while whether they can be *built* in parallel follows from their contracts — and JBCT steps share only their typed input and output, so the pieces of even a strictly sequential chain can be built concurrently by builders who coordinate on nothing beyond the types. Uniformity supplies the rest: when every unit is shaped from the same six patterns and four return types, any builder, human or AI agent, picks up any unit already knowing its shape, so ramp-up cost falls toward zero and workers stay interchangeable across the codebase. The other half of the pair — cutting the system into units that change for different reasons, so builders rarely meet at all — is design-phase work, developed in the companion *Process-First Design*. The author's *Software's Second Free Lunch* carries the full argument.

> **A Broader Movement:** JBCT is not alone in pursuing compile-time guarantees and type-driven design. Similar philosophies appear in database design (7NF type-first approaches), distributed systems, and functional programming communities. The common thread: shift errors from runtime to compile-time, make invalid states unrepresentable, and reduce cognitive load through explicit contracts.
<!-- /book:jbct-approach -->

## FORBIDDEN PATTERNS (Zero Tolerance)

These patterns are **never acceptable** in JBCT code. Hunt for them aggressively.

### 🔴 CRITICAL VIOLATIONS

| Violation | Detection | Why Forbidden |
|-----------|-----------|---------------|
| `*Impl` classes | `grep -r "class.*Impl"` | Use lambdas for behavior, records for data |
| Null checks in business logic | `if (x == null)` or `!= null` | Use `Option<T>` instead |
| Throwing exceptions | `throw new` in business code | Use `Result<T>` or `Promise<T>` |
| Catching exceptions | `catch` in business code | Lift at adapter boundaries only |
| `Void` type parameter | `Result<Void>`, `Promise<Void>` | Use `Unit`. `void` return OK with `@Contract` (external API) or fire-and-forget |
| `Result.failure(cause)` | Direct call | Use `cause.result()` fluent style |
| `Promise.failure(cause)` | Direct call | Use `cause.promise()` fluent style |
| Multi-statement lambdas | `x -> { stmt1; stmt2; }` | Extract to named method |
| `Promise.await()` in business logic | `.await()` in domain/usecase | Blocks thread. Stay in chain. OK in tests; use `@TerminalOperation` for CLI/fire-and-forget |
| `@SuppressWarnings` misuse | Used instead of `@Contract`/`@TerminalOperation` | Use `@Contract` for void return (external API), `@TerminalOperation` for legitimate `await()` |
| Abandoned `Result`/`Promise` | Statement discarding return value | Every Result/Promise must be returned or handled |

**Exception:** Methods annotated with `@Contract` are exempt from all JBCT lint rules. Use `@Contract` for Java API boundary methods (annotation processors, Maven Mojos).

### ⚠️ WARNING PATTERNS

| Pattern | Issue | Fix |
|---------|-------|-----|
| `fold()` for simple cases | Obscures intent | Use `.toResult()`, `.async()`, `.or()` |
| Complex lambda body | Logic in map/flatMap | Extract to method reference |
| Long sequencer chains | >5 flatMap calls | Group into sub-operations |
| Nested records for behavior | `record X() implements Y {}` | Use lambda |

### Examples

```java
// ❌ FORBIDDEN: Impl class
public class UserServiceImpl implements UserService { ... }

// ✅ CORRECT: Lambda factory
static UserService userService(UserRepository repo) {
    return userId -> repo.findById(userId);
}

// ❌ FORBIDDEN: Null check
if (user != null) { process(user); }

// ✅ CORRECT: Option
findUser(id).onSuccess(this::process);

// ❌ FORBIDDEN: Result.failure()
return Result.failure(USER_NOT_FOUND);

// ✅ CORRECT: Fluent style
return USER_NOT_FOUND.result();

// ❌ FORBIDDEN: Multi-statement lambda
.map(user -> {
    var enriched = enrich(user);
    return format(enriched);
})

// ✅ CORRECT: Extract to method
.map(this::enrichAndFormat)
```

## Quick Reference

### The Four Return Kinds

<!-- book:four-return-shapes -->
Every function in JBCT returns one of four semantic shapes: `T`, `Option<T>`, `Result<T>`, or `Promise<T>`. Not "usually" or "preferably"—one of the four, always. Two qualifications keep the rule exact rather than merely emphatic. The shapes compose in one permitted way, `Result<Option<T>>` and its asynchronous form `Promise<Option<T>>`, where fallibility and optionality are genuinely independent concerns; every deeper nesting is a smell this chapter names later. And `void` remains available at the edges as a deliberate signal that failure is irrelevant to the caller, distinct from `Result<Unit>`, where it is not. This isn't an arbitrary restriction; it's intentional compression of complexity into type signatures.

**Why by criteria:**
- **Mental Overhead**: Hidden error channels (exceptions), hidden optionality (null), hidden asynchrony (blocking I/O) force remembering behavior not in signatures. Explicit types eliminate this (+3).
- **Reliability**: Compiler verifies error handling, null safety, and async boundaries when encoded in types (+3).
- **Complexity**: Four types cover all scenarios - no guessing about combinations (+2).
<!-- /book:four-return-shapes -->

```java
// T - Pure computation, cannot fail, always present
public String initials() { return ...; }

// Option<T> - May be absent, cannot fail
public Option<Theme> findTheme(UserId id) { return ...; }

// Result<T> - Can fail (validation/business errors)
public static Result<Email> email(String raw) { return ...; }

// Promise<T> - Asynchronous, can fail
public Promise<User> loadUser(UserId id) { return ...; }
```

<!-- book:return-type-matrix -->
### Allowed Return Types

| Type | Use Case |
|------|----------|
| `T` | Synchronous, cannot fail, always present |
| `Option<T>` | Synchronous, cannot fail, might be absent |
| `Result<T>` | Synchronous, can fail |
| `Promise<T>` | Asynchronous, can fail |
| `Result<Option<T>>` | Optional value that can fail validation |
| `Promise<Option<T>>` | Async lookup that might not find anything |

### Discouraged

| Type | Why Discouraged |
|------|-----------------|
| `Optional<T>` | Use `Option<T>` for consistency |
| `CompletableFuture<T>` | Use `Promise<T>` for consistent error handling |
| Framework-specific types (`Mono<T>`, `ResponseEntity<T>`) | Keep business logic framework-agnostic |

### Forbidden (Double-Monad Nesting)

| Type | Why Forbidden |
|------|---------------|
| `Promise<Result<T>>` | `Promise` already carries failures - double error channel |
| `Result<Result<T>>` | Nested failures create unwrapping ceremony |
| `Option<Option<T>>` | Nested optionality is meaningless |
| `Promise<Option<Result<T>>>` | Triple nesting - architectural smell |
| `Option<List<T>>` | A collection already carries emptiness as a value - a second absence channel says it twice |

**Rule:** Each concern (optionality, failure, asynchrony) appears at most once in a return type; emptiness is the collection's own concern, already carried as a value.
<!-- /book:return-type-matrix -->

**Critical Rules:**
- ❌ Never `Void` type parameter - always use `Unit` (`Result<Unit>`, `Promise<Unit>`). `void` return is OK for fire-and-forget
- ✅ Use `Result.unitResult()` for successful `Result<Unit>`

### Parse, Don't Validate Pattern

```java
// ✅ CORRECT: Validation = Construction
public record Email(String value) {
    private static final Fn1<Cause, String> INVALID_EMAIL =
        Causes.forOneValue("Invalid email: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::present)
                     .map(String::trim)
                     .filter(INVALID_EMAIL, PATTERN.asMatchPredicate())
                     .map(Email::new);
    }
}

// ❌ WRONG: Separate validation
public record Email(String value) {
    public Result<Email> validate() { ... }  // Don't do this
}
```

**Key Points:**
- Factory method named after type (lowercase): `Email.email(...)`
- Constructor private or package-private
- If instance exists, it's valid

### Pragmatica Core Validation Utilities

**Verify first, lambdas last.** Before writing any predicate lambda in a validation chain, check
the `Verify.Is` catalog — **full catalog and `ensure` overload families: see the `Verify.java`
source header** (Source-Anchored Chapters above). Hand-rolling a check that duplicates a catalog
predicate is a JBCT violation. Hottest entries:
```java
Verify.Is::present          // not null and not blank — the "required string" check
Verify.ensure(v, Is::lenBetween, 3, 50)   // parameterized predicates need no capturing lambda
Verify.ensureOption(opt, predicate)       // Result<Option<T>> contract for optional values
```

**Parse Subpackage** - Exception-safe JDK wrappers:
```java
import org.pragmatica.lang.parse.Number;
import org.pragmatica.lang.parse.DateTime;
import org.pragmatica.lang.parse.Network;

Number.parseInt(raw)              // Result<Integer>
DateTime.parseLocalDate(raw)      // Result<LocalDate>
Network.parseUUID(raw)            // Result<UUID>
```

**Example:**
```java
public record Age(int value) {
    private static final Cause AGE_OUT_OF_RANGE = Causes.cause("Age must be 0-150");

    public static Result<Age> age(String raw) {
        return Number.parseInt(raw)
                     .filter(AGE_OUT_OF_RANGE, v -> Verify.Is.between(v, 0, 150))
                     .map(Age::new);
    }
}
```
