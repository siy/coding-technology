# JBCT Course Fidelity Check — pre-ship

Scope: `website/course/jbct/*.md` (22 lesson files) against `book/*.md` (single prose
source, spine in `book/root.md`). Guardrail under test: course adds framing/exercises,
never restates or forks book prose; a lesson needing different prose is a book defect,
not a course patch. All 22 lessons read in full; all 22 corresponding book chapters
read in full; Appendix B cross-references checked; `mapWith`/`flatMapWith`/`ensureWith`/
`recover`/`orElse`/`Unit` verified against the actual Pragmatica Core 1.0.0-rc1 sources
jar (`~/.m2/.../core/1.0.0-rc1/core-1.0.0-rc1-sources.jar`), not just the book's own
claims about itself.

## Verdict: ship-with-fixes

The course *layer* is clean: all 22 lessons are thin (blurb/learn/note/exercise only,
zero code blocks, zero prose paragraphs), map 1:1 onto the book spine in spine order,
and every Appendix-B exercise citation resolves to the right topic. The guardrail holds
almost perfectly. But the audit's code spot-check surfaced HIGH-severity defects in the
book's own worked-example code that the course explicitly teaches from — `.recover()`
misused with `Promise`-returning lambdas (won't compile) in 3 of the 4 Part V chapters,
including the exact retry-aspect example that `advanced-patterns` and
`transferfunds-example` promise to teach; `Unit.INSTANCE` (doesn't exist — only
`Unit.unit()`); and a `.orElse(null)` idiom on `Option<T>` that is ambiguous/non-
compiling and is codified as "the Pattern" in `null-policy-recovery.md` itself. Since
`/book/*` URLs 301 to the course at cutover and the course's whole value proposition is
"copy this, it works," shipping today means the first thing a motivated learner tries
to compile (retry, or the canonical null-to-DB-column write) fails. These are surgical,
well-localized fixes (rewrite ~5 methods, one constant), not a rewrite — hence
ship-with-fixes, not do-not-ship, contingent on landing them first. One course-side fix
also needed: `introduction.md`'s "three problems" bullet cites a framing that lives in
`chapter-summaries.md` (not in the book's reading spine) rather than in
`introduction.md` itself.

## Per-lesson table

| Lesson | Source chapter(s) | Fidelity | Guardrail | Notes |
|---|---|---|---|---|
| introduction.md | introduction.md | **ISSUE** | OK | "three problems" bullet not supported by this chapter |
| from-process-to-patterns.md | from-process-to-patterns.md | OK | OK | DDG, telescope, all verified |
| four-return-types.md | four-return-types.md | OK | OK | Ex. 1.1 matches Appendix B 1.1 |
| pragmatica-core-essentials.md | pragmatica-core-essentials.md | OK | OK | version/coordinate/`all()` semantics verified against source |
| parse-dont-validate.md | parse-dont-validate.md | OK | OK | |
| error-handling.md | error-handling.md | OK | OK | Ex. 2.3 matches |
| null-policy-recovery.md | null-policy-recovery.md | **ISSUE** (book code) | OK | "re-throw recovery" mislabel + `.orElse(null)` antipattern codified as canonical |
| basic-patterns.md | basic-patterns.md | OK | OK | "Leaf, Condition, Iteration" verbatim |
| advanced-patterns.md | advanced-patterns.md | OK (book code downstream broken) | OK | Sequencer/Fork-Join/Aspects verbatim; retry-aspect code it points to is broken (see Findings) |
| knowledge-gathering-pipelines.md | knowledge-gathering-pipelines.md | OK | OK | `mapWith`/`flatMapWith`/`ensureWith` verified against real source |
| thread-safety.md | thread-safety.md | OK | OK | Promise resolution semantics verified |
| testing-philosophy.md | testing-philosophy.md | OK (trivial paraphrase) | OK | |
| testing-practice.md | testing-practice.md | OK | OK | RegisterUser confirmed as chapter's own worked example |
| registeruser-example.md | registeruser-example.md | **ISSUE** (book code) | OK | `.recover()` misuse, `.orElse(null)` |
| placeorder-example.md | placeorder-example.md | **ISSUE** (book code) | OK | `.recover()` misuse x2, raw `null` param |
| publisharticle-example.md | publisharticle-example.md | OK | OK | switch-expression claim verified, no code issues |
| transferfunds-example.md | transferfunds-example.md | **ISSUE** (book code) | OK | `.recover()` misuse in retry aspect (core teaching point), `Unit.INSTANCE` |
| project-structure.md | project-structure.md | OK | OK | telescope-rule reuse from-process-to-patterns→project-structure is deliberate, cross-referenced, not drift |
| systematic-application.md | systematic-application.md | OK | OK | 8 checkpoints confirmed |
| migration-strategies.md | migration-strategies.md | OK | OK | 4 phases, exact names/order confirmed |
| comparison.md | comparison.md | OK | OK | ROP/Vavr/Arrow-kt confirmed by name |
| troubleshooting-faq.md | troubleshooting-faq.md | OK | OK | named mistakes confirmed (subset, no contradiction) |

Structure: all 22 chapters in `root.md`'s Parts I-VI have exactly one course lesson,
in spine order. Back matter (Appendices A/B/C) intentionally has no lessons.

## Findings

**HIGH · introduction.md · "The three problems JBCT solves: scattered validation,
hidden control flow, inconsistent patterns"** — This exact enumeration exists verbatim
in `book/chapter-summaries.md:15`, a doc that is not in `book/root.md`'s reading spine.
`book/introduction.md` itself never frames things as "three problems" — it opens with a
style/technical-debt narrative and its own structure is "The Five Evaluation Criteria"
(verified at `introduction.md:58`, matches the course's next bullet exactly). A reader
opening the chapter this lesson cites won't find the claim it makes. **Course-side
fix**: rewrite the bullet to match what `introduction.md` itself says, or if the
three-problems framing is wanted, promote it into the actual chapter first (book
change) — don't cite an out-of-spine doc as if it were the chapter.

**HIGH · transferfunds-example.md (book code) · `retryWithPolicy`'s `.recover(cause -> {
... return retryWithPolicy(...); return cause.promise(); })`** — Verified against the
actual source (`Promise.java:303`): `recover(Fn1<T, ? super Cause> mapper)` requires the
mapper to return `T` synchronously, not `Promise<T>`. Both branches of this lambda
return `Promise<TransferResult>`. This is the chapter's central "Retry aspect" — the
exact thing `advanced-patterns.md` ("Add Retry and Timeout") and
`transferfunds-example.md` ("Retry for transient failures... Aspects compose around the
core operation") promise to teach — and it will not compile as written. **Book defect**,
highest priority: there is no async-flavored recover on `Promise` in the real API; the
retry aspect needs restructuring (e.g., a recursive `Promise.lift`/loop that doesn't
route through `.recover`, or a real async-recover helper added to Core first).

**HIGH · registeruser-example.md:264, placeorder-example.md:448,606 (book code) ·
`.recover(this::mapTokenError)` / `.recover(cause -> compensateAndFail(...))` /
`.recover(this::mapPaymentError)`** — Same root cause as above: each referenced method
returns `Promise<Response>` / `Promise<PaymentConfirmation>`, not the bare success type
`.recover()` requires. Three more instances of the identical antipattern across two of
the four flagship worked examples. **Book defect** — same fix needed everywhere this
pattern occurs; worth a single grep-and-fix pass across the book rather than four
one-off patches.

**HIGH · transferfunds-example.md:469,486,512 (book code) · `Unit.INSTANCE`** — Verified
against source (`Unit.java`): the only public accessor is `Unit.unit()`; the private
singleton field is not named or exposed as `INSTANCE`. Won't compile. **Book defect**,
trivial fix (rename to `Unit.unit()`).

**MED · null-policy-recovery.md · "Fallback, alternative-source, and re-throw
recovery"** — The book's third mechanism is `.recover()` — "transform specific failures
to success" — not "re-throw." "Re-throw" implies exception semantics and contradicts
the book's own no-exceptions stance stated everywhere else. **Course-side fix**: rename
to the book's own term (e.g. "conditional recovery").

**MED · null-policy-recovery.md:111,124,127 + registeruser-example.md:245 (book code) ·
`.orElse(null)` on `Option<T>` codified as "the Pattern"** — Verified against source
(`Option.java`): `orElse` only has `orElse(Option<T>)` and `orElse(Supplier<Option<T>>)`
overloads — passing a bare `null` literal is ambiguous between two unrelated parameter
types and will not compile; even if it somehow resolved, it returns `Option<T>`, not the
raw nullable value a JDBC/jOOQ setter needs. The correct idiom already exists in the
same API: `.or(null)` (`Option<T>.or(T replacement)` unwraps to `T`). This is worse than
a style nit because `null-policy-recovery.md:127` states it as *the* canonical rule for
writing Option to nullable DB columns, and `registeruser-example.md` reproduces it.
**Book defect**, quick fix: `.orElse(null)` → `.or(null)` everywhere this pattern
appears.

**LOW · placeorder-example.md:430 (book code) · `sendConfirmation.apply(response.orderId(), null)`**
— `valid` (the `ValidOrderRequest` second arg) is out of scope at that call site and a
literal `null` is passed for a non-Option business parameter; untested (the stub in the
chapter's own tests ignores the arg), will NPE in a real adapter. **Book defect**, fix
by nesting the fire-and-forget call inside the `flatMap(valid -> ...)` lambda where
`valid` is still in scope.

**LOW · book-internal Appendix-B footer drift (not exposed through the course)** —
Several book chapters' own end-of-chapter "Exercises" footers cite exercise numbers
that don't match `appendix-b-exercises.md`'s real numbering (e.g. `basic-patterns.md`
footer claims 3.4 = "Zone-based naming" but Appendix B's 3.4 is "Implement Aspects";
`thread-safety.md` footer cites 3.6/3.7, which don't exist — Part III stops at 3.5;
`testing-practice.md` footer cites 4.4, doesn't exist; `registeruser-example.md` footer
mislabels 5.1/5.3; `project-structure.md` footer cites a nonexistent 5.4 and
mislabels 6.2; `systematic-application.md` footer mislabels 6.3). The course lessons
themselves all cite the *correct* Appendix B numbers/topics — they inadvertently
bypass the book's own broken footers rather than propagating them — so this is
invisible to anyone taking the course, but worth a book tidy-up pass since it will
confuse anyone reading the book straight through.

## What's clean (verified, not just asserted)

- Version string `1.0.0-rc1` and coordinate `org.pragmatica-lite:core` — consistent
  across `pragmatica-core-essentials.md`, `appendix-a-api-reference.md`, and the
  matching `.m2` artifact; not stale.
- `Result.all()` accumulates failures, `Promise.all()` fails fast — confirmed directly
  in `Result.java`/`Promise.java` doc comments and static-method behavior.
- `mapWith`/`flatMapWith`/`ensureWith` family (Result and Promise) and the
  "gating vs. evidence" framing — verified against the real method signatures on both
  types.
- The recovery triple, five evaluation criteria, DDG-to-pattern mapping, Leaf/
  Condition/Iteration, Sequencer/Fork-Join/Aspects, 8 checkpoints, 4 migration phases,
  ROP/Vavr/Arrow-kt comparison claims — all verified verbatim against their chapters.
- The "telescope" metaphor reused in both `from-process-to-patterns.md` and
  `project-structure.md` is deliberate and cross-referenced by the book itself
  (`from-process-to-patterns.md:162` explicitly hands the metaphor off to Project
  Structure), not an accidental collision.
- All Appendix B exercise citations from the course (1.1, 1.3, 2.3, 2.4-2.5, 3.3, 3.4,
  3.5, 4.1, 4.2, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3) resolve to the correct topic.
