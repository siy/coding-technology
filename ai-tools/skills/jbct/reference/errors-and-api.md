# JBCT Reference: Errors, Recovery, Core API

> Part of the `jbct` skill; loaded on demand from the index in `../SKILL.md`. Text moved verbatim from the former single-file SKILL.md.

## Type Conversions

```java
// Option → Result/Promise
option.toResult(cause)    // or .await(cause)
option.async(cause)

// Result → Promise
result.async()

// Promise → Result (blocking)
promise.await()
promise.await(timeout)

// Cause → Result/Promise (prefer over failure constructors)
cause.result()
cause.promise()
```

## Aggregation Operations

```java
// Result.all - Accumulates all failures (1-15 params)
Result.all(result1, result2, result3)
       .map((v1, v2, v3) -> combine(v1, v2, v3));

// Promise.all - Parallel, waits for all, accumulates failures (1-15 params)
Promise.all(promise1, promise2, promise3)
        .map((v1, v2, v3) -> combine(v1, v2, v3));

// Promise.allOrCancel - Fail-fast: first failure, cancels the rest (1-15 params)
// PREFER all(): it reports every failure. allOrCancel only when waiting is costly
Promise.allOrCancel(promise1, promise2, promise3)
        .map((v1, v2, v3) -> combine(v1, v2, v3));

// Option.all - Fail-fast on first empty (1-15 params)
Option.all(opt1, opt2, opt3)
       .map((v1, v2, v3) -> combine(v1, v2, v3));

// Collection variants
Promise.allOf(collection)             // Promise<List<Result<T>>> - collects all, never fails
Promise.allOfOrCancel(collection)     // Like allOf(), cancels remaining on first failure
Promise.any(promise1, promise2)       // First success wins (race)
Result.any(r1, () -> r2)              // First success, tried in order (ordered fallback)
Option.any(o1, () -> o2)              // First present, tried in order (ordered fallback)
Result.allOf(collection)              // Result<List<T>> - accumulates failures
```

**Instance variants** (for-comprehension style, same semantics):
```java
promise.all(fn1, fn2, fn3).map(combine);            // Parallel, accumulates failures
promise.allOrCancel(fn1, fn2, fn3).map(combine);     // Parallel, fail-fast + cancel
```

## Exception Handling

```java
// Lift exceptions in adapters
Promise.lift(
    t -> RepositoryError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
    () -> jdbcTemplate.queryForObject(...)
);

// With custom exception mapper (constructor reference preferred)
Result.lift(
    t -> CustomError.ProcessingFailed.FACTORY.apply(Causes.fromThrowable(t)),
    () -> riskyOperation()
);
```

## Recovery: What To Do When A Step Fails

**Absorbing a failure requires saying why.** A `.recover(...)` or swallowing `.onFailure(...)` in a
composition drops a failure the caller will never see, so the site must name which recovery strategy
it is using and what guarantee that earns. Absorption without a stated justification is the defect —
not absorption itself.

```java
// FER: the buy is already committed by the time the fact is published, so a publish failure is
// swallowed rather than reported to a buyer who has been charged. Guarantee earned: the response
// is truthful about the purchase, not about the fact. Mechanism: a single attempt -- no retry and
// no outbox, so a lost fact leaves downstream projections stale until the next fact or an
// operator re-drive.
private Promise<Response> publishSold(Confirmation confirmation) {
    return seatSold.publish(confirmation.fact())
                   .recover(_ -> Unit.unit())
                   .map(_ -> confirmation.response());
}
```

Name the triple, the guarantee, and the mechanism. The rule and its vocabulary are book-owned:

<!-- book:recovery-triple -->
The patterns above answer "this operation failed — what value do I return instead?" A harder question sits one level up: a step fails *after earlier steps already changed state* — a seat is held, an authorization placed — and that state is now invalid. There are exactly three responses, and naming all three keeps the choice deliberate instead of defaulting to the first.

- **BER — Backward Error Recovery.** Series long name: *compensate-by-inverse*. Undo by an inverse action: release the held seat, void the authorization, reverse the ledger entry. The classic rollback or saga shape. Reach for it when the change is reversible and correctness demands the system look as if nothing happened — money, inventory.
- **FER — Forward Error Recovery.** Series long name: *degrade-and-continue*. Do not undo; continue with degraded state. Queue a confirmation email for retry while the booking stands; let a cached value decay `fresh -> stale -> expired` rather than fail outright. The `.or(...)` and graceful-degradation patterns above are FER. Reach for it when forward progress is worth more than perfect consistency — telemetry, notifications, optional enrichment.
- **Design-out.** Change the model so the invalidation cannot arise: a reservation type where two bookings of one seat is structurally impossible; an idempotent write safe to repeat; an append-only log corrected by appending. The failure mode is removed rather than handled — the strongest option, when the model permits it.

Which applies is a judgment — reversibility, the value of partial progress, the domain's shape, coordination cost — and mixed strategies are normal: one booking flow can use BER for the payment, FER for the confirmation email, and design-out for the seat model, all at once. Name the triple for each step that changes state, and recovery becomes a design decision rather than an afterthought.

**Record the choice where a failure is absorbed.** `.recover(...)` turns a failure into a value and ends its journey. That is often exactly right - a notification that fails must not fail the purchase it reports - but an absorption nobody explained is indistinguishable from an accident. Name the response as BER, FER or design-out in a comment at the absorption, followed by the reason: `// FER: a lost receipt email must not void the sale`. A reason without the name does not say which of the three was chosen. Every absorption carries its own, so adding a `.recover(...)` means adding its sentence, even in a file that already explains others.
<!-- /book:recovery-triple -->

### Typed Errors

<!-- book:typed-errors -->
Every failure is a `Cause`, and `Cause` has exactly one abstract member: `message()`. The construction idiom satisfies it structurally, so no error type ever hand-writes prose in a method body.

A use case's failures form a sealed interface with two kinds of members. A **data-carrying failure** is a record: its components are the error's data, in declaration order, with a trailing `String message` component whose generated accessor *is* the `message()` implementation. Its `FACTORY`, built from a message template and the canonical constructor reference, is the construction path, and the record's type-named static factory (`accountLocked(userId)`, like every record's) delegates to it with the non-message components. **Fixed-text failures** share one enum in a prescribed shape - a single `message` field, a constructor, a field-returning accessor - with each failure declared as one constant carrying its text.

```java
public sealed interface LoginError extends Cause {

    record AccountLocked(UserId userId, String message) implements LoginError {
        static final Fn1<AccountLocked, UserId> FACTORY =
            Causes.forOneValue("Account is locked: %s", AccountLocked::new);

        static AccountLocked accountLocked(UserId userId) { return FACTORY.apply(userId); }
    }

    enum General implements LoginError {
        INVALID_CREDENTIALS("Invalid email or password");

        private final String message;

        General(String message) { this.message = message; }

        @Override
        public String message() { return message; }
    }
}
```

Construction sites:

```java
LoginError.AccountLocked.FACTORY.apply(user.id()).result();   // data-carrying
LoginError.General.INVALID_CREDENTIALS.result();              // fixed text
```

Three rules govern the shape:

- **Every value the template formats is a component.** The factory's parameters are exactly the non-message components, so the data an error mentions stays typed - renderable at the boundary, countable in telemetry, never trapped in prose. The `message` component comes last, which is what lets the constructor reference serve as the factory argument. Zero data is a property, not an omission: `INVALID_CREDENTIALS` deliberately says nothing about which credential failed.
- **One discriminable case per failure** - its own record type or its own enum constant. Qualified enum constant case labels (`case General.INVALID_CREDENTIALS ->`) discriminate constants in a switch over the sealed interface, and listing every constant preserves exhaustiveness: adding a constant breaks every switch, exactly as adding a record does.
- **The `FACTORY` is the only constructor call site, inside the record's own body as well.** `new AccountLocked(id, "hand-typed prose")` compiles and silently decouples the stored message from the declared template; routed through the factory, template and data cannot disagree. The type-named factory delegates to `FACTORY`, so the one rule that every record is built through a factory named for its type holds here too.
<!-- /book:typed-errors -->

### Wrapped and Terminal Causes

<!-- book:wrapped-terminal-causes -->
Two mixins nested in `Cause` remove the remaining overrides. A failure wrapping an underlying cause implements `Cause.Wrapped` with an `origin` component; the mixin derives `source()` from it. The component cannot be named `source` - the record accessor's return type would clash with `Cause.source()`, and `origin` is the name that avoids the trap. A failure no retry can change implements `Cause.Terminal`, which retry facilities consult to stop immediately.

```java
record PaymentFailed(Cause origin, String message) implements TransferError, Cause.Wrapped {
    static final Fn1<PaymentFailed, Cause> FACTORY =
        Causes.forOneValue("Payment step failed", PaymentFailed::new);

    static PaymentFailed paymentFailed(Cause origin) { return FACTORY.apply(origin); }
}

// translation at a composition boundary:
paymentStep.execute(order).mapError(PaymentFailed.FACTORY);
```

Composition sites accept the fully-typed factory directly. Where only some constants of an enum are terminal, a constant body overrides `isTerminal()` per constant.

**A translated failure carries the failure it translates.** Every failure translator uses its argument: the mapper passed to `mapError`, and the exception mapper passed to `lift`. A cause becomes the `origin` of a `Cause.Wrapped` record, or the source of a bare cause (`Causes.cause("Invalid money format", Option.some(cause))`); a `Throwable` becomes one through `Causes.fromThrowable(t)` first. Branching on the input is fine (a timeout and a decline may deserve different failures), as long as every branch carries it. A translator that ignores its argument (`_ -> INVALID_ID`, or a method returning a constant) discards the cause, and so does one that keeps only its text (`e -> Failure.FACTORY.apply(e.message())`, `t.getMessage()`): the type and the chain are gone, and the diagnosis goes with them. The rule has no exceptions. A technical failure translated into a domain one is exactly where the original is most valuable, because it is the only record of what the infrastructure actually reported. Where the failure is decided before any cause exists, supply it at the source instead of translating afterwards: `Verify.ensure(value, predicate, cause)` and `filter(cause, predicate)` fail with the intended cause directly, leaving nothing to discard.

**Carry the origin; do not print it.** The wrapper's message template does not format `origin`. The message of the top failure is what a boundary is most likely to show a client (Aether's HTTP layer renders it as the problem `detail`), and an origin formatted into it carries store and network internals along. The origin travels as a component and is read where the chain is logged, through `source()` or `iterate`.

At Pragmatica 1.0.0-rc4 the linter's `JBCT-CAUSE-04` still counts `origin` among the values a template must format, so it flags a wrapper written this way. Until the linter exempts a `Cause.Wrapped` origin, suppress that one rule on the wrapper record: `@SuppressWarnings("JBCT-CAUSE-04")`.

Carrying the cause does not carry its retry classification. At Pragmatica 1.0.0-rc4 `Cause.Wrapped` does not hand the origin's classification to the wrapper: a wrapper around a terminal failure is not itself terminal, and a wrapper around a transient one is not itself transient. Where a retry facility consults the wrapper, a wrapper that should be classified exactly as its origin overrides `isTerminal()` to return `origin().isTerminal()` and `isTransient()` to return `origin().isTransient()`. A bare cause cannot override anything, so a failure whose classification matters is a `Wrapped` record, not `Causes.cause(text, source)`.
<!-- /book:wrapped-terminal-causes -->

### When a Bare Cause Is Enough

<!-- book:bare-cause -->
`Causes.cause("Age must be 0-150")` remains the sanctioned form where no caller can act on the distinction - value-object validation whose failures all land in the same composite. The line is behavioral: when a caller would branch on the failure, render it separately, or count it, it is worth a type. The single-argument template overloads (`Causes.forOneValue(String)` and friends) belong to this same ad-hoc tier; in domain code a parameterized failure is worth naming, because the template form bakes its data into prose and discards it.
<!-- /book:bare-cause -->

## Pragmatica Core Library

JBCT uses **Pragmatica Core 1.0.0-rc4** for functional types.

**Maven (preferred):**
```xml
<dependency>
   <groupId>org.pragmatica-lite</groupId>
   <artifactId>core</artifactId>
   <version>1.0.0-rc4</version>
</dependency>
```

**Gradle (only if explicitly requested):**
```gradle
implementation 'org.pragmatica-lite:core:1.0.0-rc4'
```

Library documentation: https://central.sonatype.com/artifact/org.pragmatica-lite/core

### Library Value Objects

**Check `org.pragmatica.lang.vo` BEFORE writing any value object** — hand-rolling a VO that
duplicates a built-in (`Email`, `Url`, `Uuid`, `NonBlankString`, `IsoDateTime`) is a JBCT
violation. **Catalog with factories and validation rules: see the `vo/package-info.java` source
header** (Source-Anchored Chapters above). Build custom VOs only for domain-specific types
(`OrderId`, `Username`, `ReferralCode`).

Note: `Email` appears throughout this skill as a *teaching example* for writing validation
chains — in production code, use `org.pragmatica.lang.vo.Email`.

### Static Imports (Encouraged)

Static imports reduce code verbosity:

```java
// Recommended static imports
import static org.pragmatica.lang.Result.all;
import static org.pragmatica.lang.Result.success;
import static org.pragmatica.lang.vo.Email.email;      // built-in VO
import static com.example.domain.Password.password;    // domain-specific VO

// Concise code
return all(email(raw), password(raw)).flatMap(ValidRequest::validRequest);
```

### Fluent Failure Creation

Use `cause.result()` and `cause.promise()` instead of `Result.failure(cause)`:

```java
// ✅ DO: Fluent style
return INVALID_EMAIL.result();
return USER_NOT_FOUND.promise();

// ❌ DON'T: Static factory style
return Result.failure(INVALID_EMAIL);
return Promise.failure(USER_NOT_FOUND);
```
