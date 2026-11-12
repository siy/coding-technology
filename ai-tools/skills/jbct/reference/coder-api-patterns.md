# jbct-coder Rules: API, Patterns, Testing, Structure

> Part of the `jbct` skill: the `jbct-coder` agent's rule body, loaded on demand (see the agent's "Startup" section). Text moved verbatim from the former single-file agent definition.

## API Quick Reference

### Type Conversions

```java
result.async()                    // Result<T> → Promise<T>
option.async()                    // Option<T> → Promise<T> (CoreError.emptyOption)
option.async(cause)               // Option<T> → Promise<T> (custom cause)
option.toResult(cause)            // Option<T> → Result<T>
```

### Creating Instances

```java
Result.success(value)             // Success Result
Result.unitResult()               // Success with Unit
cause.result()                    // Cause → Result (PREFER over Result.failure)
cause.promise()                   // Cause → Promise (PREFER over Promise.failure)
Promise.success(value)            // Success Promise
Option.some(value) / Option.none() / Option.option(nullable)
```

### Aggregation

```java
Result.all(a, b, c).map(Combined::combined) // Parallel validation (collects failures)
Result.allOf(list)                         // Collection → Result<List<T>>
Promise.all(a, b, c).map(this::combine)   // Parallel async (accumulates failures, 1-15 params)
Promise.allOrCancel(a, b, c).map(combine) // Fail-fast: first failure, cancels the rest (prefer all())
Promise.allOf(list)                        // Collect all results
Promise.allOfOrCancel(list)                // Like allOf(), cancels remaining on failure
Promise.any(a, b, c)                      // First success wins
```

### Context-Preserving Combinators (core 1.0.0-rc1+, on Result/Option/Promise)

```java
r.mapWith(T::field, op, Stage::stage)      // effectful op on a projection; factory(original, result)
r.mapWith(op, Stage::stage)                // whole-object form
r.flatMapWith(T::field, op, Stage::stage) // same, fallible factory (validating stage factory)
r.ensureWith(T::field, op)                 // op result discarded; success gates; failure propagates
                                           //   (transient gates only — if read later, return evidence + mapWith)
```

### Error Handling in Adapters

```java
Promise.lift(t -> Error.FACTORY.apply(Causes.fromThrowable(t)), () -> ioOperation())    // Exception → Cause
Result.lift1(t -> Error.FACTORY.apply(Causes.fromThrowable(t)), encoder::encode, value) // Function with param
promise.mapToUnit() / result.mapToUnit()               // T → Unit
```

### Unit Type

```java
Result.unitResult()           // Success with no value
Result.lift(runnable)         // Void operation → Result<Unit>
promise.mapToUnit()           // Promise<T> → Promise<Unit>
```

### fold() — Prefer Alternatives

| Instead of fold() | Use |
|-------------------|-----|
| `opt.fold(() -> err.promise(), ...)` | `opt.async(err).flatMap(...)` |
| `opt.fold(() -> err.result(), ...)` | `opt.toResult(err).flatMap(...)` |
| `res.fold(_ -> fallback, identity())` | `res.or(fallback)` |
| `res.fold(c -> {log; none()}, ...)` | `res.onFailure(log).option()` |

Reserve `fold()` for genuine bifurcation at system boundaries.

### Result<Option<T>> Pattern

```java
public static Result<Option<ReferralCode>> referralCode(String raw) {
    return Verify.ensureOption(
        Option.option(raw).map(String::trim).filter(s -> !s.isEmpty()),
        PATTERN.asMatchPredicate(), INVALID_FORMAT
    ).map(opt -> opt.map(ReferralCode::new));
}
```
Empty/null → `Success(None)`, present+valid → `Success(Some)`, present+invalid → `Failure(cause)`.

---

## Pattern Implementation

### Leaf

```java
// Business Leaf — pure computation
static Price calculateDiscount(Price original, Percentage rate) { return original.multiply(rate); }

// Adapter Leaf — I/O with lift
public Promise<User> apply(UserId id) {
    return Promise.lift(t -> Error.FACTORY.apply(Causes.fromThrowable(t)),
                        () -> dsl.selectFrom(USERS).where(USERS.ID.eq(id.value())).fetchOptional())
                  .flatMap(opt -> opt.map(this::toDomain).orElse(NOT_FOUND.promise()));
}
```

### Sequencer

```java
static RegisterUser registerUser(CheckEmail check, HashPassword hash, SaveUser save, GenerateToken gen) {
    return request -> ValidRequest.validRequest(request)
                                  .async()
                                  .flatMap(check::apply)
                                  .flatMapWith(ValidRequest::password, hash::apply, ValidUser::validUser)
                                  .flatMap(save::apply)
                                  .flatMap(gen::apply);
}
```

### Fork-Join

```java
Promise.all(fetchProfile(id), fetchOrders(id), fetchNotifications(id)).map(this::buildDashboard);
```

All inputs MUST be immutable — no shared mutable state across branches.

### Condition

Routing only — delegates untouched data to called functions:

```java
return order.isPremiumUser() ? premiumDiscount(order) : standardDiscount(order);
```

### Iteration

```java
Result.allOf(rawEmails.stream().map(Email::email).toList())  // Collection validation
```

### Aspects

```java
static <I, O> Fn1<I, Promise<O>> withTimeout(TimeSpan timeout, Fn1<I, Promise<O>> step) {
    return input -> step.apply(input).timeout(timeout);
}
```

Composition order: Metrics → Timeout → Circuit Breaker → Retry → Rate Limit → Business Logic.

---

## Thread Safety

- **Input data = always read-only.** Immutable records for all data flowing between operations.
- **Fork-Join:** All inputs MUST be immutable (parallel, no synchronization).
- **Local working data:** Can be mutable if thread-confined (Leaf, Sequencer steps).

---

## Monadic Chain Rules

| Rule | Check | Fix |
|------|-------|-----|
| Single pattern per method | Mixed patterns? | Extract |
| Chain length ≤ 5 steps | Too long? | Split into composed methods |
| Side effects in terminal ops only | Mid-chain? | Move to `.onSuccess()`/`.onFailure()` |
| Logging ownership | Caller logs for callee? | Move logging to owning component |
| Conditional logging | `if (x) log.debug()` | Remove condition, use log level |

---

## Static Imports (Encouraged)

```java
import static org.pragmatica.lang.Option.option;
import static org.pragmatica.lang.Option.some;
import static org.pragmatica.lang.Option.none;
import static org.pragmatica.lang.Result.success;
import static org.pragmatica.lang.Result.all;
import static org.pragmatica.lang.Promise.all;
import static org.pragmatica.lang.Unit.unit;
```

Static import all factory methods and common Pragmatica methods. Keep regular imports for types.

---

## Testing

### Philosophy: Integration-First, Evolutionary

Test assembled use cases with all business logic; stub only adapters. Evolve: stubs → real implementations incrementally.

### Test Patterns

**Expected failure:** `.onSuccess(Assertions::fail)`
**Expected success:** `.onFailure(Assertions::fail).onSuccess(assertions)`
**Async:** `.await()` then apply pattern above

### Naming: `methodName_outcome_condition`

### What Must Be Tested

| Category | Requirement |
|----------|-------------|
| Value object validation | All rules, success + failure |
| Use case happy path | At least one, all steps stubbed |
| Use case step failures | One test per step |
| Adapters (recommended) | Success + error handling |

### Stubs

Use type declarations, not casts:
```java
CheckEmail checkEmail = req -> Promise.success(req);    // DO
var checkEmail = (CheckEmail) req -> Promise.success(req); // DON'T
```

### Organization

Use `@Nested` classes: `ValidationTests`, `HappyPath`, `StepFailures`. Extract common setup to `@BeforeEach`.

---

## Project Structure

```
com.example.app/
├── usecase/<usecasename>/    # Vertical slice: interface + factory + errors + internal types
├── domain/shared/            # Reusable value objects (move here when 2nd use case needs it)
├── adapter/rest/             # Inbound (HTTP controllers)
├── adapter/persistence/      # Outbound (DB repositories implementing step interfaces)
└── config/                   # Framework wiring only
```

**Dependencies:** use case → domain.shared; adapter → use case; config → both. Never: use case → adapter.

## File Structure

### Import Order
`java.*` → `javax.*` → `org.pragmatica.*` → third-party → project → (blank) → static imports

### Member Order

| File Type | Order |
|-----------|-------|
| Use case interface | Request/Response → execute → internal types → step interfaces → domain fragments → factory |
| Value object | Static constants → factory → helpers |
| Error interface | Enum variants → record variants |
| Step implementation | Dependencies → constructor → interface methods → private helpers |

### Utility Interface Pattern

```java
public sealed interface ValidationUtils {
    static Result<String> normalizePhone(String raw) { ... }
    record unused() implements ValidationUtils {}
}
```
