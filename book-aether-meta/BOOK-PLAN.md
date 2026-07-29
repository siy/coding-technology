# Aether Book — Plan (working draft)

> Status: DRAFT. Stable framing written; sections marked `‹AUDIT›` await the two
> source-grounded audits (real slice contract + drift; spine-app assessment).
> Owner session: `Aether-book-editor`. Coordinate versioning/build with `pfd-editor`.

---

## 1. Premise

A→Z guide to **building real applications in JBCT style that deploy on Aether**.
The reader does not memorize an API; they learn to **derive** the right structure
from the shape of the problem, express it in idiomatic Aether, and justify every
rule by an explicit technical or organizational reason. Where no idiomatic
solution exists yet, the book **invents, proves, and canonizes** one.

- **Input:** mid-level Java developer with JBCT *basics*.
- **Output:** senior developer who can architect, build, test, deploy, operate,
  and **extend** Aether applications — and reason from first principles when the
  runtime offers no ready-made answer.

### Relationship to existing books (decided: "build on JBCT, assume basics")
- Foundations (Result/Option/Promise, parse-don't-validate, the six patterns,
  data-transformation thinking) live in the **JBCT book** and are *assumed*.
- This book opens with a **fast on-ramp** (Part 0) that compresses those
  essentials and points to the JBCT book — enough that a mid-level dev isn't
  stranded, without re-teaching a whole book.
- No duplicated maintenance: when JBCT foundations change, the JBCT book is the
  source; this book references.

---

## 2. The pedagogical engine (the differentiator)

Every chapter runs the same loop. This is what makes it problem-driven rather
than reference-shaped:

1. **Problem.** A concrete business/technical problem, stated in domain terms.
   *(e.g. "placing an order must reserve inventory, charge payment, and book
   shipping; any step can fail; partial completion is unacceptable.")*
2. **Analysis.** Decompose with the universal lens: what data flows where, where
   it can fail, what the business actually requires (consistency? ordering?
   idempotency? at-least-once vs exactly-once?). Name the six patterns in play.
3. **Derivation.** Show how the analysis points to a structure. Use an Aether
   primitive where one exists; where none does, **invent and justify** a
   technique.
4. **Idiom.** The concrete, **source-verified** code. (Volatile API surfaces are
   outlined now, finalized post-overhaul — see §4.)
5. **Integration.** Fold the solution into the running **spine app** so the reader
   sees it in a real system, not in isolation.
6. **Why.** Every rule/idiom carries its explicit reason — technical
   (correctness, latency, fault-tolerance, determinism) **or** organizational
   (team boundaries, deployment independence, reviewability, AI-friendliness).

A running **"Why index"** (appendix) collects every rule→reason pair.

**Foundational framing (a through-line, echo it everywhere).** Every request is
**knowledge gathering**: each step (a parse, a fetch, a computation) adds a piece of
knowledge, and processing continues until there is enough to respond. **A failure is
knowledge too** — "declined", "malformed", "not found" is something you now know, often
exactly enough to answer (with a rejection). This is what makes "failures are values"
inevitable rather than stylistic, and it recasts the four return shapes as four *kinds
of knowledge*. The frame recurs deliberately: error modeling, saga/compensation,
scatter-gather, and caching all become "what knowledge do we have, and is it enough?"
Introduced in Part 0.1; threaded through Part III.

**Foundational framing (planted early, Part 0).** Aether splits DI into **assembling**
(wiring app parts: local deps instantiated, slice deps obtained as proxies, passed as
factory parameters, no annotations) and **provisioning** (external resources, requested by
a qualifier meta-annotation that links a resource type to a config section). Assembling is
environment-independent (automatic, compile-time-checked); provisioning is
environment-dependent (deferred to config) — this asymmetry is the root of "config change,
not code change". Default config targets local dev; other environments are overrides.
Code tell: un-annotated param = assembling, qualified param (`@Sql`) = provisioning.
Distinct from the §4b *param-vs-method* wiring mechanisms, which are a sub-cut **within**
provisioning. Part 0 plants the vocabulary; Part I 1.3 shows the generated mechanism and
references back.

---

## 3. Three chapter/section categories

| Tag | Meaning | Validation bar |
|-----|---------|----------------|
| **STABLE** | Concepts that survive the overhaul (mental models, problem analysis, design reasoning, the "why"). | Author review. Write now. |
| **VOLATILE** | Exact API surface (annotations, config keys, CLI, generated artifacts). | Source-verified at draft time; **finalize after overhaul**. Outline now. |
| **INVENTED** | A new idiom designed because Aether has no primitive (saga, outbox, idempotency discipline, batching, …). | **Highest:** design + working prototype + tests + validated against the runtime; author-reviewed; labeled as a new idiom and a candidate to feed back into Aether/skill. |

Each chapter is labeled with its dominant category so we know what to draft now
vs. defer.

---

## 4. Fidelity & overhaul policy

- **Source is truth; docs are navigational.** Every idiom traces to real code
  (slice processor, slice-api, real `@Slice` usages, test blueprints), not to the
  repo's `docs/` and not to the (stale) `aether-coder` skill.
- **Overhaul-aware drafting:** draft STABLE chapters now; outline VOLATILE detail
  with placeholders; gate INVENTED idiom *code* on a stable-enough runtime
  (their *analysis* can be written now).
- **Currency of version-sensitive facts** (test counts, CLI command counts,
  endpoint counts, "planned" tiers): keep them in one controlled place and
  coordinate with `pfd-editor`'s cross-book versioning thread rather than
  scattering them inline.

---

## 4b. Validated core model (source-confirmed — gold for Part I)

> Resolved by reading the author interface + the generated `*Factory` + the runtime
> invoker together. The contract audit's "no processor / fabricated artifacts"
> alarm was a **false positive** — it excluded `target/generated-sources/`. Do not
> re-litigate.
>
> **PROBE CORRECTION (2026-07-09):** the `Aspect` param-0 seam was **deleted** from
> generated factories (`fd1649ad0`, 2026-07-05, closed #277 — it was always identity,
> never wired). Bridge and wrapper are now single-arg `(SliceCreationContext)`;
> `SliceFactory` *rejects* 2-arg factories. Read every `Aspect` mention below as
> historical. Runtime-switchable observability shipped separately (ObservabilityStrategyCells,
> `/api/aspects`); user interceptors are compile-time by RFC-0008 design. Details +
> book punch list: `PROBE-2026-07-09.md`.

The author-facing model the articles teach is **accurate**; a compile-time
`slice-processor` generates the bridge to the runtime. Two layers:

1. **You write** — in the `@Slice` interface, a static factory
   `{interfaceNameLowerFirst}(deps…)` returning the impl (lambda for single-method,
   local `record` for multi-method). Dependencies are real parameters: resource
   qualifiers (`@PgSql`, `@Http`, custom `@EventStreamPublisher`…), other `@Slice`
   interfaces, or plain interfaces with their own factory (e.g. `KvPersistence`).
2. **`slice-processor` generates `{Interface}Factory`** with two statics:
   - **bridge** `{nameLowerFirst}(Aspect, SliceCreationContext)` — resolves each
     declared dependency via
     `ctx.resources().provide(Type.class, "config.section"[, ProvisioningContext])`,
     `Promise.all`s them, applies the `Aspect`, calls your factory. **This is where
     parameter→wiring classification actually happens** (codegen, compile time).
   - **wrapper** `{nameLowerFirst}Slice(Aspect, SliceCreationContext)` — wraps the
     impl as a `Slice`: `methods()` dispatch (`SliceMethod` + `TypeToken`s),
     generated `codec()` (so `@Codec` is unneeded), `stop()` →
     `resources.releaseAll(...)`.
3. **Runtime `SliceFactory`** reflectively invokes the generated *wrapper*
   (`(Aspect, SliceCreationContext) → Promise<Slice>`). You never write this 2-arg
   contract.

**Teaching consequence:** Part I presents the author model with confidence; the
"what's actually happening" deep-dive now has the *real* internals (bridge + Slice
wrapper + codec generation + resource lifecycle) — richer than the skill.

**Confirmed extras:** `@Heartbeat` (zero-arg `Promise<Unit>`); custom qualifiers
real (`@EventStreamPublisher`/`@EventStreamReader` → `StreamPublisher`/`StreamAccess`
on a config section); `@PgSql` on a TYPE generates a persistence interface
(`KvPersistence` via `KvPersistenceFactory`).

**Confirmed from the generated manifest** (`META-INF/slice/<Slice>.manifest`): the
processor records `resource.*`, `stream.publisher.*`/`stream.access.*`,
`publish.topics.*`, `reactive.*` (category/config/method), `route.*` (incl. per-route
`security`), `request.classes`/`response.classes`, `dependencies.count`, and generates a
`<Slice>Routes` class (listed in `impl.classes`). So the manifest, the `<Slice>Routes`
class, and per-route `[security]` are real (were previously "unconfirmed").

**Two resource wiring mechanisms** (echo in Part I 1.3 and Part III-A):
- *resource-as-parameter* — resolved by the bridge via `ctx.resources().provide(...)`,
  passed to the factory: `@Sql`/`@PgSql`/`@Http`/`@Notify`/`@Jooq`, pub-sub `Publisher`,
  `StreamPublisher`/`StreamAccess`.
- *resource-as-method-invocation* — runtime drives an annotated method (a `reactive.*`
  manifest entry): `@Heartbeat`/Scheduled, pub-sub `Subscriber`, `StreamSubscriber`,
  `PgNotificationSubscriber`.
- Pub-sub and streams use **both**; SQL/HTTP/Notify are parameter-only;
  scheduled/PG-notify are method-only.

Config merge is layered, most-specific wins: **SLICE > NODE > GLOBAL** (blueprint
`resources.toml` = global, `aether.toml` = node, `slices/<Slice>.toml` = slice override);
`${secrets:...}` resolved at load.

**CONFIRMED 2026-07-09 (was unconfirmed):** error globs match the **Cause type's simple
name only** — never the message, never individual enum constants (`ErrorTypeDiscovery.java:157`;
all constants of one enum share one status; #385 CLOSED adds compile-time unmapped-Cause
build failure + zero-match warning). Consequence: per-case HTTP statuses require
record-per-case Causes — the Part II enum example is broken as written (punch list P1.2).

**Still unconfirmed — do not assert:** step-composition transitive naming.

**Landed (merged 2026-06-24, write to source — examples pending, re-verify when they land):**
- **#339** added `consumes`/`produces` media types to slice routes, both directions, default
  JSON (text, raw `byte[]`, form/multipart). Replaced the old generator (hardcoded
  `.asJson()` output, always-`fromJson` input). Part I 1.5 already says "response media type,
  JSON by default" (now backed by merged code; verify the exact wording against source);
  **Module C / routing** details `consumes`/`produces`.
- **#198** added first-class **API versioning**: `[api]` + `[vN.routes]` in `routes.toml`,
  path- or header-mode detection (deployment-level toggle, not in `routes.toml`),
  `getV1`/`getV2` auto-suffix binding (+ explicit escape hatch), declarative
  `deprecated`/`sunset` → `Deprecation`/`Sunset` headers. Separates **API version**
  (HTTP contract) from **slice version** (artifact) — anchors **Module F** (versioned-message
  / contract evolution) and is referenced from the routing chapter.

> Status: both merged with no example projects yet. Verify the API surface against
> `../pragmatica` source when drafting routing / Module C / Module F; do a second pass against
> the example projects once they exist (Sergiy will flag them).

**Module C intended-design features (drafted to intended shape, tracked tickets, verify on merge):**
- **Interceptors** (C.3) — declaration model CONFIRMED from source (annotation per interceptor,
  `@ResourceQualifier(type = <X>MethodInterceptor.class, config = "<section>")`, e.g. banking's
  `@WithCache` → `CacheMethodInterceptor`; six impls: Retry/CircuitBreaker/RateLimit/Metrics/
  Logging/Cache; `@Key` for cache key). UNWIRED half tracked by **#277** (Aspect seam always
  `identity`, runtime switching), **#278** (retry+metrics unprovisionable from TOML; missing
  sections silently default), **#279** (cache bugs), **#280** (retry/CB/rate-limit/logging),
  **#283** (interceptor docs). Multi-interceptor composition order not yet fixed. Chapter flags
  all this inline.
- **PG LISTEN/NOTIFY** (C.4) — resource exists (#83, closed); method-driven reactive binding
  (annotate a method, runtime calls it on NOTIFY) was the unchecked half of #83. Filed as
  **#363** (created 2026-06-27) with full intended design. Chapter written to that shape, flagged
  inline. Verify when #363 lands.

> Both C.3 and C.4 carry an inline "intended design / verify before GA" editorial note in
> `part3-playbook.md`; remove those notes once the tickets merge and the chapters are re-verified.

---

## 5. Structure (parts at a glance — detail in §8)

- **Part 0 — On-ramp** [STABLE]: JBCT recap (assumed) + the "let Java be Java" thesis.
- **Part I — Aether Slice: No Magic** [STABLE+VOLATILE]: optional deep dive
  (skip-disclaimer) — slice structure (written vs generated), lifecycle, assembly &
  resource provisioning, config inheritance, request routing. Absorbs the old
  building-blocks *mechanism*.
- **Part II — The Aether model** [mixed]: practical entry — first slice & contract,
  Ember→Forge→Aether, idempotency as the enabling rule. *(was Part I)*
- **Part III — The playbook** [resource modules + INVENTED idioms]: the heart,
  problem-first, organized into modules. Resource modules: A Persistence · B Messaging ·
  C Other resources. Pattern modules: D Reliability & consistency · E Performance & scale ·
  F Architecture-in-the-large.
- **Part IV — Testing & evolving** [mixed]: plain-Java tests, Forge, k6,
  legacy→slice migration.
- **Part V — Operate like a senior** [VOLATILE]: blueprints, scaling tiers,
  canary/rollback, observability, the 50% rule as a design force.
- **Part VI — Thinking in Aether** [STABLE]: deriving idioms, designing for failure,
  finished app, invented-techniques upstream.

**Appendices:** post-overhaul API quick-reference; the **Why index** (rule→reason);
glossary.

---

## 6. Running example — DECIDED: e-commerce orders spine (loan apps = references)

**Decided spine: e-commerce order fulfillment** (reserve inventory → charge
payment → arrange shipping). It is the canonical saga/compensation domain, the
lightest cognitive load, already the de-facto example across the existing
articles/skill (`OrderService`/`InventoryService`/`PaymentService`/`commerce`
blueprint), and a natural continuation after the JBCT book. The spine is a
**fresh app built incrementally** — each chapter adds a slice to solve a problem.

**Breadth via varied overview domains.** The single spine gives coherence; but
*introductory/overview* sections (and chapter openers) draw illustrative vignettes
from **different domains** (logistics, booking, IoT, banking, telemetry, …) so the
book shows the patterns generalize far beyond commerce — many domains touched,
without fragmenting the running example.

*(Context: `jbct-realworld` is **not** the Conduit/RealWorld demo — it is a loan
app, misleading name. Loan was judged too domain-heavy for a teaching spine.)*

**The loan apps — now idiom references, not the spine** (both loan-domain):

- **`jbct-realworld`** (pragmatica `0.9.10`) — 8 slices, full loan lifecycle
  (KYC → credit → collateral → risk → pricing → booking → notify) driven by
  `LoanOrchestrator`. Strong JBCT idioms: Promise, factories, sealed `Cause`,
  parse-don't-validate (`Result.all`), fork-join across 3 credit bureaus,
  context-record accumulation, **compensation stubs** (`reverseBooking`,
  `releaseHold`, `revokeVerification`). BUT: adapter-port with **in-memory** impls,
  **no Aether resource annotations, no `routes.toml`, no entrypoint — not runnable
  or deployable**, behind on version.
- **`jbct-loan`** (pragmatica `0.17.0`, current) — 4 slices
  (`ProcessLoanApplication`, `EvaluateCredit`, `DisburseLoan`, `ProcessRepayment`)
  with **real resource injection** (`@LoanDb SqlConnector`, `@KycProvider`/
  `@AmlProvider`/`@CreditBureau`/`@CollateralAppraiser` HttpClients) + a
  `spring-boot/` sibling = **before/after migration** artifact.

**Spine build (orders):** start from an empty Aether project; each chapter adds a
slice to solve a stated problem, integrating into the running order app. Use
`jbct-loan`'s real-resource idioms (current `0.17.0` API) as the reference for
how `@Sql`/`@Http`/`@Notify` wiring is really done, and its Spring module as the
migration chapter's "before." Borrow orchestration/compensation *shapes* from
`jbct-realworld` (8-slice pipeline, fork-join, compensation stubs) where useful.
Every chapter **starts from the problem and its analysis**, then integrates into
the spine — the spine grows by solving problems, not touring features.

### Gap → curriculum map (domain-neutral problems) — seeds Part III
These problems came from the loan-app audit but are domain-neutral; each maps
cleanly onto the orders spine (the "spine hook" column shows the loan-app origin).
| Problem (gap) | Spine hook | Category |
|---|---|---|
| Durable, restart-safe **saga** | compensation is in-memory only | INVENTED (flagship) |
| **Idempotency** / exactly-once effects | `bookLoan` has no key → retry duplicates | INVENTED |
| **Caching** + invalidation | `RatePolicyAdapter` called every request | INVENTED/VOLATILE |
| **Batching / debouncing / coalescing** | 3 bureau calls, no coalescing | INVENTED |
| Real **`@Sql`/`@Http`/`@Notify`** resources | in-memory adapters → real resources | VOLATILE |
| **HTTP routing / entrypoint** | no `routes.toml`, not runnable | VOLATILE |
| **Streaming / event sourcing** | state transitions are fire-and-forget | INVENTED/VOLATILE |
| **Schema migration** | no DB today | VOLATILE |
| **pg-notify / pub-sub** status events | only fire-and-forget notify | VOLATILE |
| **Observability** / correlation IDs | `java.util.logging` only | STABLE+VOLATILE |
| **Backpressure / rate limiting / bulkhead** | unbounded bureau fan-out | INVENTED |
| **Legacy → slice migration** | `jbct-loan` Spring `before` | STABLE+VOLATILE |

---

## 7. Open items (need decisions later, not blocking)

- **Book name / working title.**
- **Repo location & build:** follow the `book-pfd/` + `book-pfd-meta/` convention
  (→ `book-aether/` + `book-aether-meta/`?). Pandoc + xelatex toolchain reuse.
- **Versioning/build conventions:** coordinate with `pfd-editor` (third book now
  exists; cross-book changelog/version symmetry is their open thread).
- **Depth-of-why default:** high-value rules get a full rationale; every rule gets
  at least a one-line reason. (Assumed unless you want uniform depth.)
- **Prototyping sandbox** for INVENTED techniques: likely a branch/module of the
  spine app or a scratch Aether project; needed before those chapters finalize.

---

## 8. Chapter-by-chapter outline (v2 — restructured 2026-06-20)

Each entry: **problem → technique** [tag]. Tags: STABLE / VOLATILE / INVENTED.
**Restructure:** the building-blocks catalog (old Part II) is dissolved — its
*mechanism* moved into the new Part I "No Magic"; its *usage* absorbed into the
Part III playbook, problem-first. Old Part I (the model) is now Part II.

**Part 0 — On-ramp** [STABLE] (overview vignettes span domains)
- 0.1 JBCT in one sitting: data transformation, Result/Option/Promise, the six
  patterns, parse-don't-validate. Pointers to the JBCT book.
- 0.2 The thesis: let Java be Java; infrastructure vs business logic; what Aether owns.

**Part I — Aether Slice: No Magic** (deep dive; optional)
> Opens with: "You don't have to know everything under the hood to use Aether, but
> if you're interested, let's dive in. If not, skip to the next part."
- 1.1 Anatomy of a slice: what you write vs what the `slice-processor` generates
  (author factory → generated `Factory` bridge + `Slice` wrapper, side by side). [STABLE+VOLATILE]
- 1.2 Slice lifecycle: load → assemble → start → serve → stop. [STABLE+VOLATILE]
- 1.3 Assembly & resource provisioning: `ctx.resources().provide(...)`; dependency
  classification (resource / slice / local); the generated wiring. [STABLE+VOLATILE]
- 1.4 Config inheritance: SLICE → NODE → GLOBAL merge; secret resolution. [VOLATILE]
- 1.5 Request routing: `routes.toml` → generated routing; typed path params; error
  mapping; `[security]` block. [VOLATILE]

**Part II — The Aether model** (was Part I; the practical entry point) [mixed]
- 2.1 Your first slice: the contract (`Promise<T>`, nested Request/Response, a sealed
  interface extending `Cause`); the factory you write; exercised with a plain-Java test.
- 2.2 Ember, Forge, Aether: two runtimes + a tool. Cross-slice calls are always remote
  with identical behavior; only the network differs (localhost in Ember/Forge, real in
  Aether). Forge is a testing/debug tool on Ember.
- 2.3 Idempotency as the enabling requirement.

**Part III — The playbook** (problem-driven; the heart). Organized into **modules**:
resource modules first (you need them to build), then the pattern/idiom modules. Resource
modules are grounded in `resource-reference.md` (current) + source verification.

### Resource modules

> Resources are **behavior-stable** (per the runtime author): approaches and behavior
> will not change, and `resource-reference.md` is current. Write these now; still verify
> every API/config detail against source ("works as advertised"). The one soft spot is
> **streaming** — its config options/capabilities may still shift, though the approach
> will not. Tags below mean "verify against source," not "defer."

*Module A — Persistence* (the big one)
- Storing state: `@Sql SqlConnector`; transport auto-selected by priority —
  **postgres-async** (native Netty, `async_url`), R2DBC (`r2dbc_url`), JDBC (default);
  `pool_config`. [VOLATILE]
- Aether Store: `@PgSql` type-safe persistence, compile-time-validated queries. [VOLATILE]
- Schema management & migration: `schema/` Flyway-style V/R/U/B, per-datasource subdirs,
  `aether_schema_history`, strict resolution; local dev via external Postgres. [VOLATILE]
- jOOQ interoperability: `@Jooq JooqConnector`, `dsl()`, offline XML codegen (pg-tools). [VOLATILE]
- Multiple datasources: custom DB qualifiers (orders vs analytics). [VOLATILE]
- (transactions, `DatabaseConnectorError`, DB types woven through.)

*Module B — Messaging*
- Pub-sub: `Publisher` (provision-param, publish out) + `Subscriber` (method-invocation,
  receive in); topic namespace auto-derived from blueprint coords. [VOLATILE]
- Streaming: `StreamPublisher`/`StreamAccess` (param) + `StreamSubscriber` (method);
  partitioned, ordered, replayable. [VOLATILE]
- Choosing pub-sub vs streams (ordering, replay, consumer groups). [STABLE analysis]

*Module C — Other resources*
- HTTP client (`@Http`): outbound calls, `HttpClientError`, per-client config. [VOLATILE]
- Notifications (`@Notify`): email via SMTP / HTTP vendor, retry. [VOLATILE]
- Scheduled work (`@Heartbeat`/Scheduled): interval/cron, `leaderOnly`, pause/resume; the
  abandoned-cart and retry-sweep patterns live here. [VOLATILE]
- PG LISTEN/NOTIFY (`PgNotificationSubscriber`): react to DB changes. [VOLATILE]
- Cross-cutting interceptors via the Aspect seam (retry, circuit breaker, rate limit,
  metrics, logging, cache), configured in TOML. [VOLATILE]

### Pattern / idiom modules (the invented heart)

*Module D — Reliability & consistency* (mostly INVENTED)
- Saga / multi-step compensation (FLAGSHIP). [INVENTED]
- Idempotency & exactly-once effects. [INVENTED]
- Outbox / reliable event emission. [INVENTED]
- Distributed locks / leasing. [INVENTED]
- Scatter-gather + partial-failure policy. [INVENTED]

*Module E — Performance & scale*
- Caching & invalidation (Cache interceptor + PG LISTEN/NOTIFY). [INVENTED/VOLATILE]
- Batching / coalescing / debouncing. [INVENTED]
- Rate limiting / backpressure / bulkhead (rate-limit + circuit-breaker interceptors). [INVENTED]

*Module F — Architecture in the large*
- Event sourcing & read models (CQRS split). [INVENTED/VOLATILE]
- Multi-tenancy. [INVENTED]
- Audit-as-data. [INVENTED]
- Schema & versioned-message evolution. [INVENTED/VOLATILE]

**Part IV — Testing & evolving**
- 4.1 Unit testing as plain Java: lambdas, not mocks. [STABLE]
- 4.2 Forge: realistic local cluster, chaos, dashboard. [VOLATILE]
- 4.3 Load testing with k6: steady / ramp / spike. [VOLATILE]
- 4.4 Legacy → slice migration: strangler/peeling, `Promise.lift`; `jbct-loan`
  Spring module as the "before." [STABLE + VOLATILE]

**Part V — Deploy & operate like a senior** (VOLATILE-heavy: outline, defer)
- 5.1 Blueprints & assembly.
- 5.2 Scaling: two-level + decision tiers (watch tense — tier-3 LLM is "planned").
- 5.3 Rolling updates / canary / rollback.
- 5.4 Observability & metrics; correlation IDs through Promise context. [STABLE + VOLATILE]
- 5.5 Fault tolerance & the 50% rule — and how it should shape your *design*. [STABLE]

**Part VI — Thinking in Aether** (capstone) [STABLE]
- 6.1 Deriving idioms yourself; when to invent vs reuse.
- 6.2 Designing for idempotency & failure from line one.
- 6.3 The completed order app, end to end.
- 6.4 Techniques this book invented (upstream candidates).

**Appendices:** post-overhaul API quick-reference; the **Why index** (rule→reason);
glossary.

---

## 9. Voice & prose discipline

Two-file model (series-wide voice split landed 2026-06-20, owned by `pfd-editor`):
- **Shared base:** `../../oss/content/book-voice.md` — prose discipline common to all
  books: tempo/rhythm, tonal anchor, layering, editorial commitment + NFR ban,
  AI-tell discipline, consistency, framework-name default (§7), what-varies, review
  checklist, drift detection.
- **Aether overlay:** `aether-book-voice.md` (this dir) — reading-mode target
  (build-along, one Part per sitting), orders domain vocabulary, problem-driven
  structural discipline, source-first code fidelity, the "why" rule, the
  STABLE/VOLATILE/INVENTED tags, and the Part I skip-disclaimer device. Framework
  names use the shared §7 default (permitted, factual / no-teardown) — no override.

The detailed deltas live in the overlay; this plan defers to it.

---

## 10. Structural & code conventions (inherits PFD spec — with care)

**Caveat:** `../../oss/content/pfd-book-spec.md` is dated 2026-05-17 and the PFD book
has diverged since (structure, word targets, schedule are stale). Treat it as a
*checklist of conventions*, not authority. Where it states code style it **defers to
the live `jbct-coder` agent + `jbct` skill** — so do the same; anchor on those and on
this plan's source-validated model (§4b), never on a copied table.

**Adopt:**
- **Code notation = JBCT, authoritative source = `jbct-coder` agent + `jbct` skill**
  (not a copied convention table). The shared rules: four shapes (`T` / `Option` /
  `Result` / `Promise`); never `Void` → `Unit`; I/O ⇒ `Promise<T>`; failures as
  sealed `Cause` (enum for fixed-message, record for data); fluent lifting
  (`cause.promise()`, not `throw`/static factory); factory naming = type name,
  lower-first; `Result.all` / `Promise.all` / `allOrCancel` / `any`; method
  references over forwarding lambdas; no multi-statement lambdas in monadic ops; no
  `*Impl`; one-pattern-per-method. **Aether adds** the slice-specific notation from
  §4b (author `@Slice` factory, generated bridge, `routes.toml`, resource qualifiers).
- **Citation conventions (two-stage):** inline citations at first mention during
  drafting → consolidation sweep before publication into a back-matter References
  list + front-matter acknowledgments. Same mechanism.
- **JBCT cross-reference discipline:** delegate Java/JBCT specifics to the
  `jbct-coder` agent; **reference, don't restate.** This operationalizes "builds on
  JBCT, assume basics" — the book points to JBCT for foundations instead of
  duplicating them.
- **Recovery-class taxonomy as conceptual scaffold for Part III-B:** PFD/JBCT name
  BER (compensate) / FER (continue degraded) / design-out (make compensation
  unnecessary: idempotence, immutability, CRDT); **saga = BER at workflow altitude,
  each forward step's inverse is itself a use case**; **time-as-decay** as
  first-class FER. The Aether book builds on this — it shows the *Aether-idiomatic
  implementation* of these named patterns and credits PFD/JBCT for the taxonomy.

**Do NOT copy (PFD-specific):** spiral pedagogy & the four altitudes; the six-phase
derivation (Phase-4/5/6, axis-vectors); authorial principles; thesis; audience;
word targets; drafting schedule; the ticketing example. Aether has its own.

*(If conventions grow, split this into a `BOOK-SPEC.md` mirroring PFD's
voice/spec separation. Single doc is fine at scaffold stage.)*
