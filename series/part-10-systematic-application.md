# Part 10: Systematic Application Guide

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 10 of 10

**Previous:** [Part 9: Production Systems](part-09-production-systems.md) | **Complete Series:** [Index](INDEX.md)

---

## Overview

You've learned the principles, patterns, and testing approaches. You've seen complete production systems. Now we need a systematic way to apply JBCT consistently during coding and review.

This part introduces **checkpoints** - specific moments during coding where you pause and verify compliance. This prevents violations from accumulating and reduces review/fix loops.

By the end of this part, you'll have:
- **8 checkpoints** covering every aspect of JBCT
- **Quick reference tables** for immediate lookup
- **Violation → Fix patterns** for common mistakes
- **Application order** for new code and reviews

---

## The Checkpoint Approach

JBCT application works through **checkpoints** - specific moments during coding where you pause and verify compliance. Each checkpoint has:
- **Trigger**: When to apply this checkpoint
- **Rules**: What to check
- **Fixes**: How to correct violations

The goal is 100% compliance through systematic verification, not heroic effort.

---

## CHECKPOINT 1: Before Writing Any Lambda

**Trigger**: You're about to write `->`

### Rules to Check

| Rule | Check | Fix |
|------|-------|-----|
| L1 | Is method reference possible? | Use `Type::method` instead of `x -> x.method()` |
| L2 | Does lambda have braces `{}`? | Extract to named method |
| L3 | Are there nested monadic operations inside? | Extract inner operation to separate method |
| L4 | Is there control flow (if/switch/try)? | Extract to named method |
| L5 | Multiple statements? | Extract to named method |

### Allowed Lambda Forms (Exhaustive)

```java
// Method references (ALWAYS PREFERRED)
.map(Email::new)
.flatMap(this::validate)

// Single-value expression (no braces)
.map(value -> expression)
.filter(s -> !s.isBlank())

// Multi-value expression (no braces)
.map((a, b) -> new Pair(a, b))
```

### Extraction Pattern

```java
// BEFORE (violation)
.map(data -> {
    cache.put(key, data);
    log.info("Cached: {}", data);
    return data.size();
})

// AFTER (compliant)
.map(this::cacheAndCount)

private int cacheAndCount(Data data) {
    cache.put(key, data);
    log.info("Cached: {}", data);
    return data.size();
}
```

---

## CHECKPOINT 2: Choosing Return Type

**Trigger**: Writing a method signature

### Decision Tree

```
Can this operation fail?
├── NO: Can the value be absent?
│   ├── NO → return T
│   └── YES → return Option<T>
└── YES: Is it async/IO?
    ├── NO → return Result<T>
    └── YES → return Promise<T>
```

### Rules to Check

| Rule | Check | Fix |
|------|-------|-----|
| R1 | Does Result always succeed? | Change to T |
| R2 | Is Option always present? | Change to T |
| R3 | Using Promise<Result<T>>? | Use Promise<T> only |
| R4 | Returning Void? | Use Unit |
| R5 | Returning null? | Use Option<T> |

### Anti-pattern Detection

```java
// VIOLATION: Result that never fails
public static Result<Config> config(...) {
    return Result.success(new Config(...));  // Always succeeds!
}

// FIX: Return T directly
public static Config config(...) {
    return new Config(...);
}
```

---

## CHECKPOINT 3: Writing Factory Methods

**Trigger**: Creating construction logic for a type

### Rules to Check

| Rule | Check | Fix |
|------|-------|-----|
| F1 | Name follows `TypeName.typeName()`? | Rename to lowercase-first |
| F2 | Validation happens at construction? | Move validation into factory |
| F3 | Return type matches validation needs? | Apply Checkpoint 2 |
| F4 | Constructor exposed publicly? | Make factory the only entry point |

### Pattern

```java
public record Email(String value) {
    // Factory with validation → Result<T>
    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::present)
            .map(String::trim)
            .filter(INVALID_EMAIL, s -> PATTERN.matcher(s).matches())
            .map(Email::new);
    }
}

public record Config(DbUrl url, DbPassword pass) {
    // Factory without validation (fields pre-validated) → T
    public static Config config(DbUrl url, DbPassword pass) {
        return new Config(url, pass);
    }
}
```

---

## CHECKPOINT 4: Designing a Class/Interface

**Trigger**: Creating a new type

### Rules to Check

| Rule | Check | Fix |
|------|-------|-----|
| D1 | What zone does this belong to? | Place in correct package |
| D2 | Does it mix I/O with domain logic? | Split into separate types |
| D3 | Are primitives used for domain concepts? | Extract value objects |
| D4 | Does naming match the zone? | Adjust naming style |

### Zone Placement

```
Zone A (Entry): Controllers, handlers, main
  → Business action verbs: handleRegistration(), processOrder()

Zone B (Domain): Use cases, value objects, domain services
  → Domain vocabulary: Email.email(), ValidRequest.validRequest()

Zone C (Infrastructure): DB, external APIs, config loading
  → Technical names: loadAllGenerations(), saveUser(), readFile()
```

### Mixed Responsibility Detection

```java
// VIOLATION: Domain entity with I/O
public record ExtensionConfig(...) {
    public static Result<ExtensionConfig> load(Path file) {
        return Files.readString(file)  // I/O in domain!
            .flatMap(this::parse);
    }
}

// FIX: Separate concerns
public record ExtensionConfig(...) { }  // Pure domain (Zone B)

public interface ConfigLoader {          // I/O adapter (Zone C)
    static Result<ExtensionConfig> load(Path file) { ... }
}
```

---

## CHECKPOINT 5: Writing Monadic Chains

**Trigger**: Chaining `.map()/.flatMap()/.filter()` etc.

### Rules to Check

| Rule | Check | Fix |
|------|-------|-----|
| M1 | Single pattern per method? | Extract mixed patterns |
| M2 | Chain length ≤ 5 steps? | Split into composed methods |
| M3 | Side effects only in terminal ops? | Move to `.onSuccess()/.onFailure()` |
| M4 | Logging mixed with logic? | Move logging to appropriate layer |

### Pattern Separation

```java
// VIOLATION: Mixing Sequencer + Fork-Join
return validate(request)
    .flatMap(req -> Result.all(
        checkInventory(req),
        validatePayment(req)
    ).map((inv, pay) -> proceed(req)));

// FIX: Extract Fork-Join
return validate(request)
    .flatMap(this::validateOrder)
    .flatMap(this::processOrder);

private Result<ValidRequest> validateOrder(ValidRequest req) {
    return Result.all(checkInventory(req), validatePayment(req))
        .map((inv, pay) -> req);
}
```

---

## CHECKPOINT 6: Adding Logging

**Trigger**: Adding log statements

### Rules to Check

| Rule | Check | Fix |
|------|-------|-----|
| G1 | Is logging conditional on data? | Remove condition, use log level |
| G2 | Logger passed as parameter? | Move logging to owning component |
| G3 | Logging in pure transformation? | Move to terminal operation |
| G4 | Duplicate logging across layers? | Single responsibility - one layer logs |

### Anti-pattern

```java
// VIOLATION: Conditional logging
if (count > 0) {
    log.debug("Processed {} items", count);
}

// FIX: Unconditional, let log config filter
log.debug("Processed {} items", count);
```

### Ownership Pattern

```java
// VIOLATION: Caller logs for callee
cache.refresh()
    .onSuccess(count -> log.debug("Refreshed {}", count))
    .onFailure(cause -> log.error("Failed: {}", cause));

// FIX: Cache owns its logging
// In GenerationCache:
public Result<Integer> refresh() {
    return doRefresh()
        .onSuccess(count -> log.debug("Refreshed {}", count))
        .onFailure(cause -> log.error("Failed: {}", cause));
}

// Caller just invokes:
cache.refresh();
```

---

## CHECKPOINT 7: Review Completeness

**Trigger**: Before submitting code for review / finishing implementation

### Verification Checklist

- [ ] Every lambda checked against L1-L5
- [ ] Every return type checked against R1-R5
- [ ] Every factory method checked against F1-F4
- [ ] Every new type checked against D1-D4
- [ ] Every monadic chain checked against M1-M4
- [ ] Every log statement checked against G1-G4
- [ ] No FQCNs in code (use imports)
- [ ] Test names follow `methodName_outcome_condition`

---

## CHECKPOINT 8: Implementation Patterns

**Trigger**: Choosing implementation style for interfaces

### Rule I1: Nested Record vs Lambda Pattern

**Decision tree**:
```
Does implementation need state beyond parameters?
├── YES → Use nested record pattern
│   (Records capture state explicitly as fields)
└── NO: Is it a functional interface (single method)?
    ├── YES → Use lambda pattern
    └── NO → Use nested record pattern
```

**Nested record pattern** (when state is needed):
```java
public interface GenerationCache {
    Result<Unit> refresh();
    Generation getOrDefaultNg(String clientId);

    static GenerationCache generationCache(WorkConfig config) {
        record generationCache(
            AtomicReference<Instant> lastRefreshTime,  // State
            ConcurrentMap<String, Generation> cache,   // State
            WorkConfig config,
            Logger log
        ) implements GenerationCache {
            @Override
            public Result<Unit> refresh() { ... }

            @Override
            public Generation getOrDefaultNg(String clientId) { ... }
        }

        return new generationCache(
            new AtomicReference<>(Instant.EPOCH),
            new ConcurrentHashMap<>(),
            config,
            LoggerFactory.getLogger(GenerationCache.class)
        );
    }
}
```

**Lambda pattern** (for functional interfaces, no state):
```java
public interface Step {
    Result<Data> execute(Context ctx);

    static Step validate(Validator validator) {
        return ctx -> validator.validate(ctx.input());  // Pure lambda
    }
}
```

### Rule I2: Conditional Option Composition

**Trigger**: Creating Option based on condition + value extraction

**Anti-pattern** (imperative mess):
```java
var matcher = pattern.matcher(topic);
var matches = matcher.matches();
var clientId = matcher.group(1);  // BUG: called before check!
var isOg = generation == Generation.OG;

return (matches && isOg)
    ? Option.option(clientId)
    : Option.none();
```

**Correct pattern** (functional, short-circuiting):
```java
var matcher = pattern.matcher(topic);

return Option.option(matcher.matches() ? matcher.group(1) : null)
             .filter(clientId -> cache.getOrDefaultNg(clientId) == Generation.OG);
```

**Benefits**:
- Safe: value extracted only when condition true
- Short-circuits: filter not evaluated if Option is empty
- Composable: can chain more filters/maps
- Clear data flow: reads top-to-bottom

### Rule I3: Validation Ownership

**Core principle**: Validation (parsing) ALWAYS lives in value objects.

**Rules**:
- Never use raw types if ANY validation is needed
- If valid range doesn't exactly match raw type → create Value Object
- Validation logic exists in ONE place: the value object factory

**Anti-pattern** (duplicate validation):
```java
// In transformer - WRONG
private Result<String> validateAction(String action) {
    return "open".equals(action) || "close".equals(action)
        ? Result.success(action)
        : UNKNOWN_COMMAND.result();
}

private Result<Command> buildCommand(String[] fields) {
    return validateAction(fields[0])  // Duplicate!
        .flatMap(action -> Command.command(action, fields[1]));
}
```

**Correct pattern** (single ownership):
```java
// In Command value object - validation lives here
public static Result<Command> command(String action, String target) {
    return validateAction(action)
        .map(_ -> new Command(action, Option.empty(), target));
}

// In transformer - just delegate
private Result<Command> buildCommand(String[] fields) {
    return Command.command(fields[0], fields[1]);  // Trust the value object
}
```

### Rule I4: Utility Class Pattern

**Standard pattern**: sealed interface with unused record

```java
public sealed interface InterceptorUtils {

    static Option<String> matches(String topic, Pattern pattern) { ... }

    static String bufferToString(ByteBuffer buffer) { ... }

    record unused() implements InterceptorUtils {}
}
```

**Visibility**:
- If used only within same package → package-private, lives with consumers
- If shared across packages → public, lives in `shared` package under longest common package path

---

## Quick Reference: Violation → Fix Patterns

| Violation | Detection | Fix |
|-----------|-----------|-----|
| Multi-statement lambda | `{ }` with multiple lines | Extract to method |
| Nested monadic ops | `.flatMap(x -> y.map(...))` | Extract inner to method |
| Always-succeeding Result | `Result.success(new X())` | Return X directly |
| Mixed I/O and domain | File/DB ops in domain class | Split to adapter |
| Primitive obsession | `String url`, `int poolSize` | Create value object |
| Conditional logging | `if (x) log.debug()` | Remove condition |
| Logger as parameter | `method(Logger log)` | Move logging to owner |
| FQCN in code | `org.foo.Bar` in method body | Add import |

---

## Application Order

### When Implementing New Code

1. **Design phase**: Apply Checkpoint 4 (class design)
2. **Signature phase**: Apply Checkpoint 2 (return types), Checkpoint 3 (factories)
3. **Implementation phase**: Apply Checkpoint 1 (lambdas), Checkpoint 5 (chains), Checkpoint 8 (patterns)
4. **Polish phase**: Apply Checkpoint 6 (logging)
5. **Completion phase**: Apply Checkpoint 7 (review)

### When Reviewing Existing Code

1. **Scan for lambdas** (`->`) - apply Checkpoint 1
2. **Scan for return types** - apply Checkpoint 2
3. **Scan for factories** - apply Checkpoint 3
4. **Scan for mixed responsibilities** - apply Checkpoint 4
5. **Scan for logging** - apply Checkpoint 6
6. **Final verification** - apply Checkpoint 7

---

## Summary

Systematic application of JBCT through checkpoints ensures:
- **Consistency**: Same code structure regardless of who writes it
- **Efficiency**: Violations caught early, not in review
- **Quality**: 100% compliance is achievable through systematic verification

The checkpoints form a complete verification system:
- **Checkpoints 1-3**: Code mechanics (lambdas, types, factories)
- **Checkpoints 4-5**: Structure (classes, chains)
- **Checkpoint 6**: Cross-cutting (logging)
- **Checkpoint 7**: Final verification
- **Checkpoint 8**: Implementation patterns

Apply them systematically, and JBCT compliance becomes automatic.

---

## What's Next?

This completes the JBCT learning series. You now have:

1. **Foundations** (Part 1) - Mental model and core ideas
2. **Four Return Types** (Part 2) - T, Option, Result, Promise
3. **Parse, Don't Validate** (Part 3) - Making invalid states unrepresentable
4. **Error Handling** (Part 4) - Errors as values, composition rules
5. **Basic Patterns** (Part 5) - Leaf, Condition, Iteration
6. **Advanced Patterns** (Part 6) - Sequencer, Fork-Join, Aspects
7. **Testing Philosophy** (Part 7) - Integration-first approach
8. **Testing Practice** (Part 8) - Organization and examples
9. **Production Systems** (Part 9) - Complete walkthrough
10. **Systematic Application** (Part 10) - Checkpoints for coding and review

**For reference**: See [CODING_GUIDE.md](../CODING_GUIDE.md) for the complete technical documentation.

**For AI assistance**: Use the jbct-coder and jbct-reviewer subagents for Claude Code integration.

---

**End of Series**
