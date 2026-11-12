# jbct-coder Rules: Return Kinds, Errors, Lambdas, Decomposition

> Part of the `jbct` skill: the `jbct-coder` agent's rule body, loaded on demand (see the agent's "Startup" section). Text moved verbatim from the former single-file agent definition.

## Core Rules

### The Four Return Kinds

<!-- book:four-return-shapes -->
Every function in JBCT returns one of four semantic shapes: `T`, `Option<T>`, `Result<T>`, or `Promise<T>`. Not "usually" or "preferably"—one of the four, always. Two qualifications keep the rule exact rather than merely emphatic. The shapes compose in one permitted way, `Result<Option<T>>` and its asynchronous form `Promise<Option<T>>`, where fallibility and optionality are genuinely independent concerns; every deeper nesting is a smell this chapter names later. And `void` remains available at the edges as a deliberate signal that failure is irrelevant to the caller, distinct from `Result<Unit>`, where it is not. This isn't an arbitrary restriction; it's intentional compression of complexity into type signatures.

**Why by criteria:**
- **Mental Overhead**: Hidden error channels (exceptions), hidden optionality (null), hidden asynchrony (blocking I/O) force remembering behavior not in signatures. Explicit types eliminate this (+3).
- **Reliability**: Compiler verifies error handling, null safety, and async boundaries when encoded in types (+3).
- **Complexity**: Four types cover all scenarios - no guessing about combinations (+2).
<!-- /book:four-return-shapes -->

```
Can this operation fail?
├── NO: Can the value be absent?
│   ├── NO → return T
│   └── YES → return Option<T>
└── YES: Is it async/IO?
    ├── NO → return Result<T>
    └── YES → return Promise<T>
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

### Parse, Don't Validate

Valid objects constructed only when validation succeeds. Factory methods: `TypeName.typeName(...)` (lowercase-first). Every record has a type-named factory (`Profile.profile(...)`), no exceptions: `Result<Self>` if the record has any invariant, `Self` if it has none; a generator or framework that builds a record with `new`/`::new` instead of its factory is defective; a local record declared inside a factory method is outside the rule: it is instantiated once, inside that method, and cannot be instantiated anywhere else.
(`Email` below is a teaching example — production code uses `org.pragmatica.lang.vo.Email`; check
the `vo` package before hand-rolling ANY common value object.)

```java
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::present)
                     .map(String::trim)
                     .map(String::toLowerCase)
                     .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
                     .map(Email::new);
    }
}
```

Use `Valid` prefix for post-validation types: `ValidRequest`, `ValidUser`.

### No Business Exceptions

All failures as sealed `Cause` types.

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

<!-- book:bare-cause -->
`Causes.cause("Age must be 0-150")` remains the sanctioned form where no caller can act on the distinction - value-object validation whose failures all land in the same composite. The line is behavioral: when a caller would branch on the failure, render it separately, or count it, it is worth a type. The single-argument template overloads (`Causes.forOneValue(String)` and friends) belong to this same ad-hoc tier; in domain code a parameterized failure is worth naming, because the template form bakes its data into prose and discards it.
<!-- /book:bare-cause -->

At `lift` boundaries, apply the factory to the converted throwable: `t -> RepositoryError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t))`

### State-Machine State Types

The sealed sum enumerating a state machine's lifecycle states gets a `*State` suffix: `HoldState`, `BookingState`, `SeatState`. Variants stay bare (`Free`, `Held`, `Confirmed`, `Cancelled` — never `HeldState`). It joins the suffix-by-role family (`*Request`, `*Response`, `Cause`) and is reserved for the lifecycle sum a guarded transition advances — not every mutable holder. The state field is the one multi-writer field: change it only through a guarded transition, never an overwrite.

### Single Pattern Per Function

Every function implements exactly ONE of six patterns. The patterns come from the process side — the data dependency graph's operators — and code written in them *is* an executable business process specification.

| Pattern | Purpose | Key Rule |
|---------|---------|----------|
| Leaf | Single atomic operation | No composition |
| Sequencer | 2-5 dependent steps | Each step = Leaf or sub-pattern |
| Fork-Join | Independent parallel ops | All inputs MUST be immutable |
| Condition | Routing only | No transformation in condition itself |
| Iteration | Collection processing | Body = Leaf or sub-pattern |
| Aspects | Cross-cutting wrapper | Wraps Leaf or pattern |

BPMN's core constructs correspond one-to-one (Task ↔ Leaf, Sequence Flow ↔ Sequencer, Parallel Gateway ↔ Fork-Join, Exclusive Gateway ↔ Condition, Multi-Instance Activity ↔ Iteration, Event Sub-Process ↔ Aspects). The recognition is corroboration, not foundation — the catalog is derived from the process, not from the notation. Use it as a dictionary when the shop draws BPMN.

If mixing patterns, split into separate functions.

### Lambda Rules

| Allowed | Forbidden |
|---------|-----------|
| Method references: `.flatMap(Email::email)` | Multi-statement `{}` blocks |
| Single expressions: `.map(v -> expr)` | Ternaries inside lambdas |
| Factory refs: `.map(Pair::pair)` | if/switch/nested maps |

Extract anything complex to a named method.

### Null Policy

- **Business logic:** Never return or check null. Use `Option<T>`.
- **Adapter boundaries only:** `Option.option(nullable)` to wrap external APIs, `opt.orElse(null)` for nullable DB columns, `null` in test validation inputs.

### Intent Annotations (apply at WRITE time, not after lint complains)

Three annotations declare that a normally-forbidden shape is the correct contract. Decision
procedures live in their source headers (`org.pragmatica.lang.Contract` / `TerminalOperation` /
`NullReturn`) — read them via the skill's Source-Anchored Chapters. Summary:

| Situation | First try | If externally dictated |
|-----------|-----------|------------------------|
| `void` method | Return `Unit` / `Result<Unit>` / `Promise<Unit>` | `@Contract` (framework callback, JDK contract, Mojo, processor). WARNING: blanket exemption from ALL JBCT rules — never for convenience |
| `.await()` outside tests | Restructure to stay in the monadic chain | `@TerminalOperation` (CLI entry, lifecycle, dedicated thread). Tests never need it |
| `return null` | `Option<T>` | `@NullReturn` (JDK callback contracts: `Map.compute`, `computeIfPresent`, …) |

Writing the code and the annotation is ONE step — a void method without `@Contract` or an
unannotated `await()` is an unfinished edit, and the roundtrip to fix it later is a failure.

---

## Pattern Decomposition & Data Flow

**Before writing ANY code:**
1. What data do we START with? (Request fields)
2. What data do we NEED for response? (Response fields)
3. Where does each piece come from? (Validation, fetch, calculation)
4. What are the dependencies? (Ordering)

### Growing Context Pattern

Each pipeline stage receives context, adds information, passes enriched context forward. Stage
records carry the previous container as a type parameter; **the `mapWith` family (core
1.0.0-rc1+) makes each stage one lambda-free line** — see `patterns/knowledge-gathering.md` in
the jbct skill:

```java
record ValidRequest(UserId userId) {
    static ValidRequest validRequest(UserId userId) { return new ValidRequest(userId); }
}
record UserProfile<T>(T request, Profile profile) {   // previous stage + new knowledge
    static <T> UserProfile<T> userProfile(T request, Profile profile) { return new UserProfile<>(request, profile); }
}

return Request.parse(raw)                                              // Result<ValidRequest>
    .mapWith(ValidRequest::userId, profiles::fetch, UserProfile::userProfile) // op on ONE field, original kept
    .ensureWith(p -> entitlements.check(p.request().userId()))        // gate; container unchanged
    .map(Response::from);
```

`mapWith(getter, operation, factory)` — operation is effectful, factory combines original +
result (pure); `flatMapWith` — factory may fail (validating stage factories); `ensureWith` —
operation result discarded, success gates the chain (the fallible counterpart to `onSuccess`).
Whole-object forms (`mapWith(operation, factory)`) cover stages needing several accumulated
facts. No multi-getter arities exist — multi-projection decomposition is `all(...)`'s job.

Decision rules (get these right):
- **ensureWith vs mapWith = does a later step read the outcome?** No → transient gate, `ensureWith`.
  Yes → the operation must return *evidence*, accreted via `mapWith` (so the next stage proves it
  passed). A load-bearing check that returns only a boolean is the parse-don't-validate anti-pattern.
- **Several INDEPENDENT fetches → Fork-Join, not chained `mapWith`** (which runs them serially):
  `r.all(M::success, v -> f1(v.id()), v -> f2(v.id())).map(Enriched::enriched)` — identity projection
  keeps the container; the accreting record gathers more than one fact at once.
- **Accrete within a use case; flatten to a named milestone record at boundaries** other code names
  (deep `request()` chains / a step-interface seam are the flattening signal). Two-step pipeline
  where each step needs only the prior output → plain `flatMap`, not accretion.

### Decomposition Thresholds

- Method >10 lines → justify or split
- Method does 2+ things → split into Leafs
- Inline logic that could be named → extract
