# Knowledge-Gathering Pattern (mapWith family)

**Purpose**: Run an effectful operation that needs only part of the current value (or produces auxiliary confirmation), then continue the chain with the original value preserved — either combined with the operation's result into the next stage container, or unchanged.

**Availability**: pragmatica core 1.0.0-rc1+. Six combinators on each of `Result`, `Option`, `Promise`.

## Definition

Plain `map`/`flatMap` stages consume the whole previous value and replace it. Quite often a stage:
- needs only one field of the accumulated knowledge, and
- must NOT lose the rest of it.

The `mapWith` family flattens the nested-`flatMap`-with-captured-binding workaround:

```java
// instead of:
result.flatMap(t -> operation(t.field()).map(b -> new Stage<>(t, b)))
// write:
result.mapWith(T::field, this::operation, Stage::new)
```

## The six combinators

```java
// whole-object forms — operation sees the full container
<B, U> Result<U> mapWith    (T -> Result<B> operation, (T, B) -> U factory)
<B, U> Result<U> flatMapWith(T -> Result<B> operation, (T, B) -> Result<U> factory)
<B>    Result<T> ensureWith (T -> Result<B> operation)

// field-scoped forms — getter projects, operation sees only the projection
<A, B, U> Result<U> mapWith    (T -> A getter, A -> Result<B> operation, (T, B) -> U factory)
<A, B, U> Result<U> flatMapWith(T -> A getter, A -> Result<B> operation, (T, B) -> Result<U> factory)
<A, B>    Result<T> ensureWith (T -> A getter, A -> Result<B> operation)
```

| Combinator | Operation result | Factory | On operation failure |
|---|---|---|---|
| `mapWith` | passed to factory with the **original** value | pure | propagates; factory not invoked |
| `flatMapWith` | same | fallible (its failure propagates) | propagates; factory not invoked |
| `ensureWith` | **discarded** — original continues | — | propagates |

`ensureWith` is the *gating* side effect: unlike `onSuccess` (Consumer, cannot fail, does not gate `Promise` chains), `ensureWith` awaits the operation and propagates its failure. Entitlement checks, rate limits, fire-and-forget audit writes, notifications.

**Load-bearing rule (ensureWith vs mapWith).** The deciding question is *does any later step read the outcome?* If no — it is transient, gate it away with `ensureWith`. If yes — the operation must return *evidence* and be accreted via `mapWith`, so holding the next stage proves the check passed. The same audit operation lands in two homes by this test: `ensureWith(audit::write)` when nobody reads the id, `mapWith(getter, audit::write, Audited::new)` when a later step needs it. Corollary: **a load-bearing check that returns only a boolean is itself the parse-don't-validate anti-pattern** — make it return the proof.

## Stage-accretion containers

The factory slot's `(T, B) -> U` shape is exactly the canonical constructor of a knowledge-accreting record — each pipeline stage holds new knowledge plus the previous container as a type parameter:

```java
record ValidRequest(UserId userId) {}
record UserProfile<T>(T request, Profile profile) {}
record UserArticles<T>(T request, List<Article> articles) {}

Request.parse(raw)                                                       // Result<ValidRequest>
       .mapWith(ValidRequest::userId, profiles::fetch, UserProfile::new) // Result<UserProfile<ValidRequest>>
       .ensureWith(p -> entitlements.check(p.request().userId()))        // gate; container unchanged
       .mapWith(UserProfile::profile, articles::byAuthor, UserArticles::new)
       .map(Response::from);
```

Every slot is a method reference: getter = record accessor, operation = service method against its **narrow natural input** (no container coupling), factory = next stage's canonical constructor. A well-shaped stage has no lambda bodies. Earlier knowledge stays reachable through the `request()` chain; nothing is lost — the factory always receives the full previous container.

## When to use

- A stage needs one projected field + the original must survive → field-scoped `mapWith`
- The next stage container's constructor validates (parse-don't-validate) → `flatMapWith`
- A stage must succeed but produces no knowledge → `ensureWith`
- An operation needs several accumulated facts → whole-object form, reach via `request()` chain; for cross-pipeline reuse bound the container with capability interfaces (`<T extends HasUserId>`)

## Anti-patterns

```java
// WRONG: multi-getter decomposition — that is all()'s job; no mapWith2 exists by design
result.mapWith(T::a, T::b, op, factory)              // does not exist; use result.all(...)

// WRONG: several INDEPENDENT fetches via chained mapWith — they run sequentially; fork-join them
result.mapWith(T::id, profiles::fetch, ...).mapWith(T::id, prefs::fetch, ...)   // serial
// RIGHT: gather concurrently, accrete in one step (identity projection keeps the container)
result.all(Result::success,                          // keep the container itself
           v -> profiles.fetch(v.id()),              // independent fetch 1
           v -> prefs.fetch(v.id()))                 // independent fetch 2
      .map(Enriched::new)                            // record Enriched<T>(T request, Profile p, Prefs pr)

// WRONG: non-gating side effect via ensureWith — use onSuccess for fire-and-forget consumers
promise.ensureWith(t -> log.info(t))                 // log returning Promise just to gate? use onSuccess

// WRONG: load-bearing check that returns only a boolean, then a later step needs the fact
result.ensureWith(quotas::hasRemaining)              // boolean gate; if a later step reads quota →
result.flatMapWith(T::id, quotas::lookup, QuotaScoped::quotaScoped)  // return evidence, accrete it

// WRONG: pure operation — needs no combinator at all
result.mapWith(t -> Result.success(f(t.field())), factory)  // just: result.map(t -> factory(t, f(t.field())))

// WRONG: losing context with plain flatMap when a later stage needs it
result.flatMap(t -> operation(t.field()))            // original t gone; use mapWith/ensureWith
```

## Boundaries (when NOT to accrete)

- **Two-step pipeline where each step needs only the previous step's output** → plain `flatMap`; a stage record is ceremony. Accretion's defining trigger is "a *later* step needs *earlier* knowledge."
- **A composed type needs naming** (step-interface boundary, sub-pipeline seam) → flatten the `E<D<C<...>>>` accretion into a named milestone record (`record EnrichedOrder(ValidRequest request, Profile profile, List<Article> articles) {}`). Accrete generically *within* a use case; flatten at boundaries other code must speak about.
- **A `request()` chain three hops deep** → same flattening signal, or a capability interface (`HasUserId`) if the depth comes from operation reuse rather than pipeline length.

## Testing

- Stage records with canonical constructors need **no dedicated tests** — nothing to get wrong.
- Validating stage factories (`flatMapWith` constructors) are tested **like value objects**: success + one test per rejection rule.
- Pipelines: stub the step operations, assert the happy path, then **one test per failing step** — including `ensureWith` stages: its failure must fail the chain, and its success must leave the container untouched (assert the *same instance* flows through).

## Design constraints (why shaped this way)

- Operation is **always effectful** (returns the carrier) — pure ops are plain `map` territory.
- Purity is encoded in **names**, not overloads: `Fn1<B, A>` and `Fn1<Result<B>, A>` erase identically, so same-name pure/effectful overloads would be ambiguous for implicitly-typed lambdas. Arity overloads (whole-object vs field-scoped) are safe.
- Reference: `core/docs/knowledge-gathering-pipelines.md` in the pragmatica repo.
