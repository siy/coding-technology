Java Backend Coding Technology (Framework‑Agnostic)

Purpose
- Define a practical, minimal methodology to write business logic that is predictable, testable, and easy to evolve.
- Keep it framework‑agnostic; adapters to frameworks live at the edges and are out of scope.

High‑Level Properties (optimization criteria)
- Mental Overhead: minimize “keep in mind that …” burdens; push to compiler and types.
- Business/Technical Ratio: maximize domain signal, minimize incidental/technical noise.
- Design Impact: choices should simplify future change; avoid rigid structures.
- Reliability: explicit error channels; predictable behavior; testable by construction.
- Complexity: small, composable units; single level of abstraction per function.

Core Rules
- Return kinds (exactly one per function/method):
  - `T`  -  sync, cannot fail, value always present.
  - `Option<T>`  -  sync, cannot fail, value may be missing.
  - `Result<T>`  -  sync, can fail (business/validation errors).
  - `Promise<T>`  -  async, can fail (technical/business), same semantics as `Result<T>` but asynchronous.
- No business exceptions: represent business failures via `Result<T>` (and `Promise<T>` failures). Technical exceptions should not appear in business logic; if unavoidable in adapters, convert to Causes.
- Parse, don’t validate: construct only valid domain/value objects. Factories enforce invariants before instance creation.
- Single pattern per function: each method implements exactly one pattern (Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects).
- Leaves:
  - Business leaves are pure (no side effects).
  - Adapter leaves integrate with external systems; map foreign failures to domain/technical Causes.
  - Every function (including leaves) uses one of the four return kinds above.

Monadic Conventions
- Lift “up” at call sites when needed: `Option → Result → Promise` and `Option → Promise` are allowed.
- Avoid `Promise<Result<T>>`; `Promise<T>` carries failures already.
- Mixing `Result<Option<T>>` is allowed sparingly (for optional presence with possible validation error). Avoid `Option<Result<T>>`.
- Use `all()`/`any()` predicates from Option/Result/Promise to collect multiple values with clear, type‑safe mapping.
- Composite errors: when combining validations with `Result.all(...)`, failures accumulate into `CompositeCause` automatically.

Validation Model (parse, don’t validate)
- Per‑field parsing: each field has a VO/Domain type with a static factory named after the type (lowerCamel): e.g., `email(String) -> Result<Email>`.
- Optional fields: if presence is optional and validation may fail, factories return `Result<Option<T>>` (None = absent, Failure = invalid).
- Aggregate input: define a validated internal type with two (or more) factories using chain‑of‑responsibility:
  - From raw input: parse per‑field VOs, then delegate to the component‑based factory.
  - From components: perform cross‑field checks, then construct; returns `Result<ValidRequest>`.
- Cross‑field checks: break into small `Result<Unit>` checks and combine via `Result.all(...).map(_ -> this)` to get aggregated `CompositeCause`.

Use Case Shape
- Use case interface lives at `<base>.usecase.<barelowercase>.CamelCaseName` and defines nested API records:
  - `CamelCaseName.Request`  -  raw input (records only).
  - `CamelCaseName.Response`  -  output element (records only). The returned value may be `Response` or a collection of `Response`.
- One entry method named consistently (execute/perform/call  -  TBD). Recommendation: `execute(...)`.
- Use `UseCase.WithPlain/WithOption/WithResult/WithPromise` variants optionally for clarity; technology works without them.
- Construction via static factory named after the use case (lowerCamel): `userLogin(deps...) -> UserLogin`.

Steps and Decomposition
- Rule of 2..5: if a function contains more than one processing step, extract steps; if a sequencer has >5 steps, introduce intermediate sequencers.
- Simple steps: keep in the `<uc-root>` package as single‑method interfaces (may implement `Fn1<Out, In>` for direct use in `map/flatMap`).
- Complex steps: mirror use‑case structure in a subpackage `<uc-root>.<barelowercasestep>` with its own interface and nested types.
- Leaves:
  - If only used by one step, keep them near their caller (same file or same package).
  - If reused, move immediately to the nearest `shared` package (see Package Layout) to avoid tech debt.

Package Layout
- Base: `<base-package>`.
- Use cases: `<base>.usecase.<barelowercaseusecasename>` (no separators). Example: `com.example.app.usecase.userlogin.UserLogin`.
- Nested complex steps: `<uc-root>.<barelowercasestepname>`.
- Shared packages: introduce `shared` at any level for reuse:
  - `<base>.shared` (topmost, cross‑use‑case/domain).
  - `<uc-root>.shared` (shared across this use case and its subpackages).
- Move shared components immediately when reuse appears (no deferred refactors).

Errors
- Per‑use‑case errors live with the use case. Suggest sealed interfaces by default; enums or local constants via `Causes.forOneValue()` are acceptable if simpler.
- Error mapping: adapters wrap foreign failures into domain/technical Causes. A use case should not leak unknown exceptions.
- Validation details: rely on `CompositeCause` from `Result.all(...)`. Specific per‑project policies for error shapes are allowed (TBD).

Aspects (Decorators)
- Aspects are higher‑order steps (decorators) applied inline where appropriate; they are not business logic.
- Placement: decorate individual steps/leaves where the concern is local; decorate `execute()` for cross‑cutting concerns.
- Composition: order is explicit in code; use a `CompositeAspect` helper to combine decorators as one step (see PL_IMPROVEMENTS.md).
- Variants: Promise‑only for I/O‑centric aspects (Retry, CircuitBreaker, RateLimit, Bulkhead, Deadline, Cancellation). Result/Promise for observational ones (Metrics, Logging). Timeout may exist in both if needed.
- Configuration: aspects receive policies/config as dependencies (static or via suppliers). Exact mechanism is implementation‑specific (TBD).
- Testing: aspects have dedicated tests; use‑case tests remain aspect‑agnostic.

Testing Strategy
- Vertical slicing: one use case (endpoint) at a time. Instance is created via static factory with explicit dependencies.
- Test evolution:
  1) Define public API; add stub implementation that returns a fixed value; write the first happy‑path test.
  2) Add validation tests (mostly negative/edge cases); implement only the validation path (per‑field + cross‑field) until green.
  3) Add behavior tests incrementally; replace stubs with real code step by step until complete.
- Tests are black‑box at the use‑case boundary (inputs → outputs/errors). Prefer fakes over mocks; assert outcomes, not interactions.
- Async tests: use real time with strict timeouts for now (deterministic schedulers  -  TBD).

Guidance and Conventions
- Factories: always named after the type with first letter lowercased, e.g., `artifactId(String) -> Result<ArtifactId>`.
- Factory implementations:
  - Value objects (records): use records for serializable data (Request, Response, domain types).
  - Use cases and steps (lambdas): return lambdas for behavioral components created at assembly time (no serialization needed).
- Constructors: prefer static factories; use private constructors for records if/when the language allows.
- Normalization: may be performed inside factories if domain requires (trim, case‑folding, canonicalization).
- Collections: return immutable collections when feasible. Create defensive copies only when returning internal collections.
- Dependencies: pass explicit dependencies to factories (no mega‑containers). Keep parameter lists manageable via extraction rules (2..5).

Open Topics (TBD)
- Idempotency policy and placement.
- Time/IDs/randomness: injection patterns and boundaries.
- Deadline/cancellation propagation strategy.
- Standard aspect names and policies; recommended defaults per aspect.
- Error taxonomy unification vs per‑project freedom (validation detail exposure, codes).

References (in repo)
- Sources: `sources/articles` and `sources/patterns`  -  background on PFJ, patterns, and Promises.
- Examples: `sources/code/input-validation`  -  value object factories and `Result.all(...)` usage.
- Use case skeletons: `sources/code/use-case`  -  minimal examples of shape and flow.
- Library backlog: `PL_IMPROVEMENTS.md`  -  Pragmatica Core enhancements (aspects, helpers).

Example Patterns (quick map)
- Use case with nested API + Sequencer
  - Sync: `examples/usecase-userlogin-sync/.../usecase/userlogin/UserLogin.java`
  - Async: `examples/usecase-userlogin-async/.../usecase/userlogin/UserLogin.java`
- Parse, don’t validate (VO factories)
  - Email: `examples/*/domain/shared/Email.java`  -  normalization + Verify.ensure/filter
  - Password: `examples/*/domain/shared/Password.java`  -  chained invariants + helpers
  - ReferralCode: `examples/*/domain/shared/ReferralCode.java`  -  optional-with-validation via `Result<Option<T>>`
- Cross-field validation
  - `ValidRequest.validRequest(Email, Password, Option<ReferralCode>)`  -  combine via `Result.all(...)` and map to constructor only on success
- Lifting and async composition
  - Async `execute(...)` lifts sync validation to Promise, then chains async steps with `flatMap`

Patterns (concise guide)
- Leaf
  - Definition: Single, minimal processing step. Two kinds: business leaf (pure) and adapter leaf (I/O, side‑effects).
  - Rules: Always return one of the four kinds (T/Option/Result/Promise). Business leaves are pure; adapter leaves map foreign failures to Causes and may apply local technical concerns (e.g., low‑level timeouts).
  - Value objects are leaves: static factories named after the type enforce invariants before construction.
  - Placement: Keep near caller unless reused; move to nearest `shared` package upon reuse.

- Sequencer
  - Definition: Linear, end‑to‑end flow composed via `map/flatMap`, one step after another.
  - Use when: Multiple dependent steps form a vertical slice. Keep 2..5 steps; if >5, extract sub‑sequencers.
  - Conversions: Lift at call sites (Option→Result→Promise). Avoid `Promise<Result<T>>`.
  - Notes: The body of `execute(...)` is typically a sequencer. Aspects may be applied inline around steps.

- Fan‑Out‑Fan‑In
  - Definition: Execute independent operations concurrently and join their results.
  - Promise: `Promise.all(p1, p2, ...).flatMap((a, b, ...) -> combine(...))`. Use for parallel I/O or independent async leaves.
  - Result/Option: Use `Result.all(...)` / `Option.all(...)` to collect multiple synchronous results (not concurrent; aggregates values and errors).
  - Notes: Keep fan‑out local to the function; extract if it grows beyond one conceptual step.

- Condition
  - Definition: Branching expressed as a value, not control flow side‑effects.
  - Guidance: Maintain single level of abstraction; extract nested decisions into named functions rather than nested ternaries/switches.
  - With monads: Prefer `map/flatMap/filter` to keep types consistent across branches; ensure both branches return the same kind.

- Iteration
  - Definition: Functional processing of collections/batches/recursions.
  - Guidance: Use collectors (`Result.allOf`, domain mappers), keep mutation out. For large pipelines, extract steps to keep 2..5 rule.
  - Async: Combine with Fan‑Out‑Fan‑In for parallel batch pieces when appropriate.

- Aspects (decorators)
  - Definition: Higher‑order functions that wrap steps/use‑cases to add reliability/observability/rate control without changing business semantics.
  - Placement: Around steps/leaves where local; around `execute()` for cross‑cutting. Composition order explicit in code (see PL_IMPROVEMENTS.md).
  - Variants: Promise‑only for I/O‑centric (Retry, CircuitBreaker, RateLimit, Bulkhead, Deadline, Cancellation). Result/Promise for observational (Metrics, Logging). Timeout may exist in both.

Pattern selection heuristics
- If it’s one minimal action with clear inputs/outputs → Leaf.
- If multiple dependent steps, 2..5 in a row → Sequencer; if more, introduce sub‑sequencers.
- If multiple independent async steps, need to run in parallel → Fan‑Out‑Fan‑In with Promise.all.
- If choosing between paths based on data → Condition (extract nested logic).
- If processing collections/recursion/batching → Iteration (and compose with others as needed).
- If adding retries/timeouts/metrics/logging/rate‑control → Aspect decorators around steps/use‑case.

Examples: What They Demonstrate (understanding)
- Use case API co-location
  - Request/Response are nested records inside the use case interface to preserve context and reduce naming drift.
  - The entrypoint execute(...) contains a single Sequencer that composes steps with flatMap in source order.
- Parse, don’t validate realized
  - ValidRequest has two factories named after the type: one from raw Request (parses fields) and one from validated components (applies cross‑field checks, then constructs).
  - Construction happens only after all per‑field and cross‑field validations pass; there is no “construct then validate” path.
- VO factories as leaves
  - Email/Password/ReferralCode are records with static factories that normalize input and enforce invariants via Verify.ensure/filter.
  - ReferralCode shows the “optional‑with‑validation” pattern by returning Result<Option<ReferralCode>>.
- Error handling
  - Per‑field failures accumulate through Result.all(...) into a CompositeCause automatically; cross‑field checks return Result<Unit> and are combined the same way.
  - No business exceptions are thrown; errors are represented as Causes produced via Causes.forOneValue and carried by Result/Promise.
- Steps as single‑method interfaces
  - Steps (CheckCredentials, CheckAccountStatus, GenerateToken) each return the use case’s monad; they can be passed directly to flatMap via method references.
  - Leaves that are only used by a single step remain nearby; shared components would be moved to a shared package.
- Async composition without nesting monads
  - The async variant lifts sync validation to Promise at the call site (Promise.promise(() -> Result<ValidRequest>)) and then composes async steps linearly.
  - It avoids Promise<Result<T>>, relying on Promise<T> to carry failures directly.
- Style signals
  - Single level of abstraction per function: validation chains read linearly; execute() is a pure sequencer; helpers are extracted.
  - Factory naming is consistent (lowerCamel type name); dependencies are explicit parameters to the factory.
