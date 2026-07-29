# Book Code Fixes — pre-ship (JBCT 4.3.0)

Fixes applied to the book manuscript worked-example code, verified against Pragmatica
Core 1.0.0-rc1 sources (`~/.m2/.../core-1.0.0-rc1-sources.jar`). Website/course files
untouched.

## Verified API facts used (signatures checked in source)

- `Promise.fold(Fn1<Promise<U>, Result<T>> action)` — Promise.java:103. The async
  bifurcation primitive. Combined with `Result.fold(failureMapper, successMapper)`
  (Result.java:1005, failure-first) it gives the only honest "recover into an async
  branch" idiom: `p.fold(result -> result.fold(failFn, Promise::success))`.
- `Promise.recover(Fn1<T, ? super Cause> mapper)` — Promise.java:303. Mapper returns a
  **bare `T`**, synchronously. There is NO Promise-returning recover overload.
- `Promise.mapError(Fn1<Cause, ? super Cause>)` — Promise.java:280. Synchronous cause→cause.
- `Promise.orElse(Promise<T>)` / `orElse(Supplier<Promise<T>>)` — Promise.java:521,531.
  Substitutes an alternative Promise on failure (discards the cause).
- `Cause.promise()` / `Cause.result()` — Cause.java:47,39.
- `Unit.unit()` — Unit.java:43 (only accessor; no `INSTANCE` field).
- `Option.or(T)` returns bare `T` — Option.java:282. `Option.orElse(...)` takes
  `Option`/`Supplier<Option>` (Option.java:303,314), so `.orElse(null)` is ambiguous.

## Fix 1 — async `.recover()` misuse (15 call-sites, 8 files)

`recover`'s mapper is synchronous; every site feeding it a `Promise`-returning
lambda/method-ref would not compile. Replaced with the combinator that actually fits the
intent. The book now teaches ONE async-failure-branch idiom everywhere:
`fold(result -> result.fold(failFn, Promise::success))`.

| Site | Old intent | Fix |
|------|-----------|-----|
| transferfunds `retryWithPolicy` | async recursive retry | `fold(...)` + extracted `retryOrFail` helper (single-ternary Condition) |
| placeorder `executeWithCompensation` :448 | async saga compensation | `fold(...)` (keeps `compensateAndFail`) |
| placeorder `mapPaymentError` :606 | categorize cause → domain error (all-failure) | `mapError`; helper now returns bare `Cause` |
| registeruser `mapTokenError` :264 | any token failure → one domain error | `mapError`; helper returns bare `Cause` |
| null-policy `recoverPaymentErrors` :342 | async alternative payment path | `fold(...)`; helper takes `request` (also fixes prior scope bug) |
| appendix-b :108 | cache-miss → async DB fetch | `orElse(database.fetchProfile(id))` |
| appendix-b :429/:435 | config: DB→file→defaults | `fold(...)` at both levels |
| appendix-b :537 | dashboard degrade to empty list | bare-value `recover(cause -> List.of())` |
| appendix-b :648 | async recursive retry | `fold(...)` + extracted `retryOnFailure` helper |
| appendix-b :1065/:1068 | two-stage saga compensation | `fold(...)` at both stages |
| diagrams :403 | async error handling | `fold(...)` |
| pragmatica-core-essentials :249 | `recover` API demo (was async + a propagate branch — impossible for recover) | rewritten as a correct synchronous `recover(cause -> Config.defaults())` + one clarifying sentence |
| from-process-to-patterns :77 | `ANY(A,B)` fallback notation `a.recover(b)` | `a.orElse(b)` |

Idiom selection rule applied: `fold` when the failure branch is async or inspects the
cause to decide; `mapError` when it is a pure synchronous cause→cause mapping;
`orElse` for an async alternative source; bare-value `recover` for degrade-to-value.

Verify: `grep -rn '\.recover(' book/*.md` → every remaining hit has a synchronous mapper
(bare `List.of()` / `Option.none()` / `User` / `Config.defaults()`) or is signature doc.
`grep '\.recover(.*-> {'` and `'\.recover(.*promise()|Promise\.(success|failure)'` → 0.

## Fix 2 — `Unit.INSTANCE` → `Unit.unit()` (3 sites, transferfunds)

Lines 469/486/512. `INSTANCE` does not exist. Verify: `grep -rn 'Unit.INSTANCE'` → 0.

## Fix 3 — `Option.orElse(null)` → `Option.or(null)` (null-policy, registeruser)

Code null-policy:111,124 + registeruser:245; plus the pattern text (:127) and the
allowed-usage table (:243). Verify: the only remaining `.orElse(null)` is
troubleshooting-faq.md:247, which is a JDK `java.util.Optional`
(`repository.findById(id).orElse(null)`), the FAQ's own recommended boundary conversion —
correct, intentionally retained.

## Fix 4 — placeorder raw `null` confirmation param (:430)

`sendConfirmation.apply(response.orderId(), null)` sat in an `onSuccess` outside the
`flatMap`, so `valid` (the `ValidOrderRequest` the second param wants) was out of scope
and `null` was passed. Moved the best-effort call inside the `flatMap(valid -> ...)` lambda
and passed `valid`.

## Fix 5 — Appendix-B footer exercise numbers (9 chapters)

Realigned end-of-chapter "Exercises" footers to the real Appendix-B numbering/titles
(1.1–1.5, 2.1–2.5, 3.1–3.5, 4.1–4.3, 5.1–5.3, 6.1–6.3), assigning each chapter its
topically-correct exercises:

- basic-patterns: 3.2/3.4 → **3.1 Pattern Identification, 3.3 Implement Condition Pattern**
- advanced-patterns: 3.3/3.5 → **3.2 Implement Fork-Join, 3.4 Implement Aspects**
- thread-safety: nonexistent 3.6/3.7 → **3.5 Thread Safety Analysis**
- testing-philosophy: → **4.1 Test Structure, 4.2 Stub Implementation**
- testing-practice: nonexistent 4.4 → **4.3 Testing Async Behavior**
- registeruser: 5.1/5.3 → **5.1 Complete Use Case Design**
- project-structure: nonexistent 5.4 + 6.2 → **5.3 Project Structure**
- systematic-application: → **6.1 Code Review Checklist, 6.3 Debugging Practice**
- null-policy-recovery: 5.2 gloss → **5.2 Compensation Pattern** (2.5 already correct)

Left as-is (already correct): introduction (1.1/1.2), four-return-types (1.3/1.4/1.5),
parse-dont-validate (2.1/2.2/2.3 — verified 2.1=PhoneNumber, 2.2=DateRange),
error-handling (2.3/2.5). Chapters with inline (non-numbered) Exercises sections were not
touched.

## Fix 6 — CHANGELOG

Added `### Fixed` to `## [4.3.0]`, one bullet per defect class, named chapters.

---

## OUT OF SCOPE — surfaced for a decision (NOT fixed)

**STATUS UPDATE (main session, same day): FIXED.** Verified independently (Promise.java has
only `orElse` at :521/:531, zero bare `or(`); applied: doc block :279-293 now scopes `.or()`
to Option/Result and shows `promise.recover(cause -> defaultValue)` for the async
degrade-to-value; dashboard call-sites → `.recover(cause -> List.of())`. Bonus catch while
applying: the three-tier Config fallback at :272-275 chained two unwrapping `.or(...)` calls
(the first returns bare `T`, so the second cannot compile) — fixed to
`orElse(supplier).or(fallback)`. CHANGELOG 4.3.0 extended.

**Also fixed (jbct-fixer, same class):** the SEPARATE Promise-based `LoadConfig` fallback at
null-policy-recovery.md:385-389 — `loadFile.apply().orElse(loadEnv.apply()).or(() -> new
Config(...))` → `.recover(cause -> new Config(...))` (that chain is a `Promise<Config>`, so
the final unwrap cannot be `.or`, which Promise lacks). And appendix-a-api-reference.md:227-228
`.or` cheat-sheet rows annotated `// Option/Result` to kill the implicit Promise.or reading.
Whole-book `.or(` sweep: every remaining hit is an `Option`/`Result` receiver or prose —
notably appendix-b-exercises.md:117 (`cache.get(id).map(Promise::success).or(...)`, an
`Option<Promise<T>>` receiver — legitimate `Option.or`, NOT touched). Zero Promise-receiver
`.or` remain.

**`Promise.or(...)` does not exist in core 1.0.0-rc1**, but null-policy-recovery.md
documents and uses it:
- :279–293 documents `promise.or(defaultValue)` / `promise.or(() -> computeDefault())`
  under "// Promise<T> - provide value if failure (async)".
- :365–366 uses `loadRecentOrders(userId).or(List.of())` /
  `loadRecommendations(userId).or(List.of())` inside `Promise.all(...)` (so the receivers
  are Promises).

Verified: `grep '\bor(' Promise.java` → 0 hits; Promise has only `orElse(Promise)` /
`orElse(Supplier<Promise>)`. `Option.or(T)` and `Result.or(T)` DO exist (Result.or returns
bare `T`), so the doc block is correct for Option/Result but wrong for Promise.

This is a distinct defect class not in the assigned fix list and not identified by the
audit, so I did not touch it. Recommended fix if approved: for the degrade-to-value
dashboard case use bare-value `recover(cause -> List.of())` (matches the appendix-b:537
fix), and correct/remove the `promise.or(...)` line in the doc block. Flagging rather than
fixing unilaterally because it edits a documented "graceful degradation" teaching block
and may interact with parallel course work.
