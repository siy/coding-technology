# Systematic Application Guide

## What You'll Learn

- 8 checkpoints for consistent JBCT application
- Quick reference tables for immediate lookup
- Violation -> Fix patterns for common mistakes
- Application order for new code and reviews

**Prerequisites:** [Project Structure](project-structure.md)

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
| L1 | Is method reference possible? | Use `Type::method` |
| L2 | Does lambda have braces `{}`? | Extract to named method |
| L3 | Nested monadic operations inside? | Extract inner operation |
| L4 | Control flow (if/switch/try)? | Extract to named method |
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
|-- NO: Can the value be absent?
|   |-- NO -> return T
|   |-- YES -> return Option<T>
|-- YES: Is it async/IO?
    |-- NO -> return Result<T>
    |-- YES -> return Promise<T>
```

### Rules to Check

| Rule | Check | Fix |
|------|-------|-----|
| R1 | Does Result always succeed? | Change to T |
| R2 | Is Option always present? | Change to T |
| R3 | Using `Promise<Result<T>>`? | Use `Promise<T>` only |
| R4 | Returning Void? | Use Unit |
| R5 | Returning null? | Use `Option<T>` |

---

## CHECKPOINT 3: Writing Factory Methods

**Trigger**: Creating construction logic for a type

### Rules to Check

| Rule | Check | Fix |
|------|-------|-----|
| F1 | Name follows `TypeName.typeName()`? | Rename |
| F2 | Validation happens at construction? | Move to factory |
| F3 | Return type matches validation needs? | Apply Checkpoint 2 |
| F4 | Constructor exposed publicly? | Make factory only entry |

### Pattern

```java
public record Email(String value) {
    // Factory with validation -> Result<T>
    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::present)
            .map(String::trim)
            .filter(INVALID_EMAIL, s -> PATTERN.matcher(s).matches())
            .map(Email::new);
    }
}

public record Config(DbUrl url, DbPassword pass) {
    // Factory without validation -> T
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
  -> Business action verbs: handleRegistration(), processOrder()

Zone B (Domain): Use cases, value objects, domain services
  -> Domain vocabulary: Email.email(), ValidRequest.validRequest()

Zone C (Infrastructure): DB, external APIs, config loading
  -> Technical names: loadAllGenerations(), saveUser(), readFile()
```

---

## CHECKPOINT 5: Writing Monadic Chains

**Trigger**: Chaining `.map()/.flatMap()/.filter()` etc.

### Rules to Check

| Rule | Check | Fix |
|------|-------|-----|
| M1 | Single pattern per method? | Extract mixed patterns |
| M2 | Chain length <= 5 steps? | Split into composed methods |
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
| G1 | Is logging conditional on data? | Remove condition |
| G2 | Logger passed as parameter? | Move logging to owner |
| G3 | Logging in pure transformation? | Move to terminal operation |
| G4 | Duplicate logging across layers? | Single layer logs |

### Ownership Pattern

```java
// VIOLATION: Caller logs for callee
cache.refresh()
    .onSuccess(count -> log.debug("Refreshed {}", count));

// FIX: Cache owns its logging
// In GenerationCache:
public Result<Integer> refresh() {
    return doRefresh()
        .onSuccess(count -> log.debug("Refreshed {}", count));
}
```

---

## CHECKPOINT 7: Review Completeness

**Trigger**: Before submitting code for review

### Verification Checklist

- [ ] Every lambda checked against L1-L5
- [ ] Every return type checked against R1-R5
- [ ] Every factory method checked against F1-F4
- [ ] Every new type checked against D1-D4
- [ ] Every monadic chain checked against M1-M4
- [ ] Every log statement checked against G1-G4
- [ ] No FQCNs in code (use imports)
- [ ] Test names follow `method_[scenario_]expectation` (two or more segments)

---

## CHECKPOINT 8: Implementation Patterns

**Trigger**: Choosing implementation style

### Nested Record vs Lambda Pattern

```
Does implementation need state beyond parameters?
|-- YES -> Use nested record pattern
|-- NO: Is it a functional interface?
    |-- YES -> Use lambda pattern
    |-- NO -> Use nested record pattern
```

**Nested record pattern** (state needed):
```java
static GenerationCache generationCache(WorkConfig config) {
    record generationCache(
        AtomicReference<Instant> lastRefreshTime,
        ConcurrentMap<String, Generation> cache,
        WorkConfig config
    ) implements GenerationCache {
        @Override
        public Result<Unit> refresh() { ... }
    }

    return new generationCache(
        new AtomicReference<>(Instant.EPOCH),
        new ConcurrentHashMap<>(),
        config
    );
}
```

**Lambda pattern** (functional interface, no state):
```java
static Step validate(Validator validator) {
    return ctx -> validator.validate(ctx.input());
}
```

---

## Quick Reference: Violation -> Fix Patterns

| Violation | Detection | Fix |
|-----------|-----------|-----|
| Multi-statement lambda | `{ }` with multiple lines | Extract to method |
| Nested monadic ops | `.flatMap(x -> y.map(...))` | Extract inner to method |
| Always-succeeding Result | `Result.success(new X())` | Return X directly |
| Mixed I/O and domain | File/DB ops in domain class | Split to adapter |
| Primitive obsession | `String url`, `int poolSize` | Create value object |
| Conditional logging | `if (x) log.debug()` | Remove condition |
| Logger as parameter | `method(Logger log)` | Move logging to owner |

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

## Key Takeaways

1. **8 checkpoints** - Cover all aspects of JBCT
2. **Apply systematically** - Violations caught early, not in review
3. **Quick reference tables** - For immediate lookup
4. **Order matters** - Design -> Signature -> Implementation -> Polish
5. **100% compliance** - Achievable through systematic verification

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 6.1: Code Review Checklist
- Exercise 6.3: Debugging Practice

---

## What's Next

[Migration Strategies](migration-strategies.md) covers migration strategies for adopting JBCT in existing codebases.
