# Comparison with Other Approaches

JBCT doesn't exist in isolation. This chapter places it beside the functional techniques and libraries you are most likely to be choosing between on the JVM: railway-oriented error handling, and the established functional libraries.

---

## Railway-Oriented Programming

Scott Wlaschin's approach from F#, using "two-track" types for error handling.

### Concept

```
Success Track:  ───●───────●───────●───────●─── → Success
                   │       │       │       │
                   ↓       ↓       ↓       ↓
Failure Track:  ───────────────────────────────→ Failure
```

Each function either stays on success track or switches to failure track.

### Example (F# style in Java)

```java
public Result<User> registerUser(String email, String password) {
    return validateEmail(email)           // Success or Failure
        .flatMap(this::validatePassword)  // Continue or stay failed
        .flatMap(this::checkUniqueness)   // Continue or stay failed
        .flatMap(this::createUser);       // Continue or stay failed
}
```

### What JBCT Borrows

- **Two-track model** → `Result<T>` is exactly this
- **flatMap for composition** → Same chaining style
- **Errors as values** → Cause instead of exceptions

### What JBCT Adds

- **Four tracks, not two** - T, Option, Result, Promise for different semantics
- **Structural patterns** - Named patterns (Sequencer, Fork-Join) beyond just chaining
- **Aggregation** - Result.all() for parallel validation
- **Async integration** - Promise extends the model to async operations

### Key Difference

ROP is a technique for error handling. JBCT is a complete methodology including project structure, testing, and team practices.

### Verdict

JBCT incorporates ROP as its error handling model, then builds a full methodology around it.

---

## vavr (formerly Javaslang)

Functional programming library for Java.

### What vavr Provides

```java
import io.vavr.control.Try;
import io.vavr.control.Either;
import io.vavr.control.Option;

// Try - captures exceptions
Try<Integer> result = Try.of(() -> Integer.parseInt(input));

// Either - success or failure with typed error
Either<Error, User> user = findUser(id);

// Option - presence or absence
Option<User> maybeUser = Option.of(nullableUser);

// Pattern matching
String message = Match(result).of(
    Case($Success($()), "Parsed"),
    Case($Failure($()), "Failed")
);
```

### Comparison

| Feature | vavr | Pragmatica Core |
|---------|------|-----------------|
| Option type | `Option<T>` | `Option<T>` |
| Error type | `Either<L, R>` or `Try<T>` | `Result<T>` with `Cause` |
| Async type | None (use CompletableFuture) | `Promise<T>` |
| Collections | Immutable collections | Uses Java collections |
| Pattern matching | Built-in DSL | Standard switch expressions |
| Tuples | Tuple1-8 | Use records |

### Key Differences

1. **vavr is a library, JBCT is a methodology** - vavr provides types, JBCT provides patterns, structure, and practices.

2. **Error typing** - vavr's Either has generic left type. Pragmatica Core's Result always uses Cause, providing consistent error handling.

3. **Async story** - vavr doesn't provide async primitives. JBCT's Promise integrates error handling with async operations.

4. **Simplicity** - vavr includes many FP features (persistent collections, pattern matching DSL, streams). Pragmatica Core focuses on the minimum needed for JBCT.

### When to Use vavr

- You want immutable collections
- You're building a library with FP patterns
- You need persistent data structures
- You want pattern matching DSL

### When to Use Pragmatica Core

- You're building backend services
- You want a complete methodology (not just types)
- You need integrated async support
- You prefer simplicity over features

### Verdict

vavr is a more comprehensive FP library. Pragmatica Core is purpose-built for JBCT. You could use vavr to implement JBCT patterns, but you'd need to add your own Promise type and establish your own structural patterns.

---

## Arrow-kt (Kotlin)

Functional programming library for Kotlin.

### What Arrow Provides

```kotlin
// Either for errors
fun divide(a: Int, b: Int): Either<DivisionError, Int> =
    if (b == 0) DivisionError.DivideByZero.left()
    else (a / b).right()

// Validated for accumulating errors
fun validateUser(name: String, age: Int): ValidatedNel<ValidationError, User> =
    ValidatedNel.applicative<ValidationError>().mapN(
        validateName(name),
        validateAge(age)
    ) { (n, a) -> User(n, a) }

// Effect for async
suspend fun fetchUser(id: UserId): Either<Error, User> =
    either { userRepository.findById(id).bind() }
```

### Why Mention It?

Arrow-kt demonstrates that these patterns work well in a JVM language. Key insights:

- **Kotlin's coroutines + Either** = Similar to `Promise<T>`
- **Validated type** = Similar to Result.all() accumulation
- **Typed errors** = Same as JBCT's Cause

### Verdict

If you're on Kotlin, Arrow-kt provides similar capabilities to JBCT. The concepts transfer, but the syntax differs due to language features (coroutines, extension functions, sealed classes).

---

## Summary: Where JBCT Fits

```
                    Implementation Style
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Imperative        Railway (ROP)         FP Library
   (exceptions)      (Result types)        (vavr, Arrow)
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                         JBCT
                           │
                    ┌──────┴──────┐
                    │             │
              Pragmatica     Structural
              Lite Core      Patterns
```

JBCT:
- Uses railway-oriented error handling
- Is simpler than full FP libraries
- Provides structural patterns other approaches lack
- Includes methodology beyond just types

---

## Exercises

1. **Find your composition style:** Take one method in your codebase that orchestrates several steps. Count the distinct ways it signals failure - return codes, exceptions, nulls, logged-and-swallowed. How many are there?

2. **Compare error handling:** Take one exception-based method in your codebase. Rewrite it using ROP style with Result. What errors were implicit?

3. **Evaluate vavr:** If you use vavr, identify which features you actually use. Could you replace it with Pragmatica Core?

4. **Cross-language patterns:** If you have Kotlin services, compare how Arrow-kt's Either compares to JBCT's Result. Are the patterns similar?

---

## Summary

JBCT is not revolutionary - it combines proven ideas:

| Idea | Source |
|------|--------|
| Errors as values | Railway-Oriented Programming |
| Functional types | vavr, Arrow-kt, Haskell |
| Parse don't validate | Type-driven design |

What JBCT adds:
- **Unified methodology** - Architecture + implementation + testing
- **Structural patterns** - Named, composable patterns
- **Team practices** - Migration path, code review guidelines
- **AI optimization** - Predictable code for AI collaboration

The goal isn't originality - it's unification.
