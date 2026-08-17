# Appendix D: The Use Case Worksheet

*The method at operating altitude. Part A is the sheet you fill in, one use case at a time; Part B is the reference you consult while filling it. The chapters are the full treatment; nothing here is new, and everything here is enough.*

**One rule governs the whole sheet: every row you fill is a claim the type system has to carry.** A failure you name becomes a `Cause`; a field you parse becomes a value object whose existence proves it valid; a step that can fail says so in its return kind. Nothing on this sheet stays a comment.

## Part A — The sheet

### Step 1 · Specify the process

Take one use case and complete its six properties before writing a line of it.

| Property | Your answer |
|---|---|
| **Trigger** — what makes it run: a request, a scheduled tick, an event, a human approval resolving. Not the transport. | |
| **Typed input** — what it needs to begin, carrying exactly that and no more | |
| **Typed output** — what it produces on success | |
| **Typed failures** — the closed, enumerable set of ways it can fail | |
| **Steps** — its internal operations, named in domain terms | |
| **Dependencies** — which steps must precede which, which run in parallel, which are conditional | |

The first four are the signature — `Promise<Output> apply(Input)`, failures carried inside the type. The last two become the composition.

**Filling this in is verification, not only specification.** A gap shows up as a property you cannot complete: an outcome with no failure named for it, a step needing a fact no earlier step produced. It shows up here, on one page, rather than in review.

### Step 2 · Parse the input

Every field the trigger carries becomes a type whose construction enforces its claim. Validation is construction: if the instance exists, it is valid.

| Raw field | Value object | Predicate | Failure when it does not hold |
|---|---|---|---|
| | | | |

Two rules apply to every row:

- **Reach for `Verify.Is` before writing the comparison by hand.** A catalog predicate is tested once, in the library, for everyone. The inline comparison is tested here, by you, and can be wrong here.
- **The factory returns `Result<T>`**, and normalization — trimming, lowercasing — happens inside it, once.

A condition genuinely specific to your domain has no catalog equivalent and is written inline. That is a business leaf, and it owes a leaf's tests.

### Step 3 · Name the failures

The set is closed and enumerable, or it is not designed. Each entry is a named domain fact, not an exception raised elsewhere.

| Failure | `Cause` type | Produced by | What the caller does with it |
|---|---|---|---|

Sealed interfaces make the set exhaustive and let the compiler check that every case is handled. **Programming errors are not on this sheet** — a null dereference or a broken invariant is a bug, thrown and fixed, never a typed failure the caller is asked to handle.

### Step 4 · Choose the return kind per step

One row per step. Answer the three questions and the kind follows; the decision table is in Part B.

| Step | Async? | Can fail? | May be absent? | Return kind |
|---|---|---|---|---|

Two checks before moving on:

- **No concern appears twice.** `Promise<Result<T>>` is forbidden — `Promise` already carries failure.
- **A step whose every return is `.success(...)` is not fallible**, and its failure test cannot be written. That is a return-kind violation, not a missing test. Return the plain value and chain it with `map`.

### Step 5 · Place each step in a zone and a pattern

| Step | Zone | Pattern | Leaf kind |
|---|---|---|---|

- **Zone 2 names the intent; Zone 3 names the mechanism.** A step interface saying `hashPassword` is a Zone-3 name on a Zone-2 seat, and that is a defect rather than a style preference.
- **One pattern per function.** A function that sequences *and* branches is two functions that have not been split yet.
- **Run the stepdown test.** Read the chain aloud with "to" before each step. If it sounds overly detailed, the zones are mixed.

A Sequencer of more than five steps needs decomposition; one of fewer than two is a Leaf.

### Step 6 · Choose a recovery response

One row for every step that can be invalidated after an earlier step already changed state. **Check design-out first.**

| Invalidated step | What earlier change it strands | Response | Why |
|---|---|---|---|
| | | design-out / BER / FER | |

Mixed strategies are normal: BER for the payment, FER for the confirmation email, design-out for the seat model, in one flow, at once.

### Step 7 · Check the four composition obligations

Walk the finished chain and check off four rows. This is what the coverage percentage should be *made of* — a percentage reports how much ran, not whether the right things were established.

| Obligation | One per | Your test |
|---|---|---|
| **Success path** — the chain runs end to end and the response is assembled | use case | |
| **Validation failure** — malformed input is rejected before any step runs | use case | |
| **I/O failure** — that step is unavailable and the use case says so | **each** step reaching outside the process | |
| **Absorbed failure** — the drop is asserted on the call, since it leaves no trace in the response | **each** dropped failure | |

The two per-each rows are the ones suites short-change. A use case that loads an account and then persists a payment owes two I/O tests; covering one is not covering both.

**What is not on the list matters as much.** Do not add a failure test per step: short-circuiting is `flatMap`'s behavior, established once by the library, and a failure's content belongs to the rule that produces it. Everything else the use case owes belongs at the leaf, where the branches are and where the vectors are cheap.

## Part B — The reference

### The four return kinds

| Sync? | Can fail? | May be absent? | Return kind |
|---|---|---|---|
| Yes | No | No | `T` |
| Yes | No | Yes | `Option<T>` |
| Yes | Yes | No | `Result<T>` |
| Async | Yes | No | `Promise<T>` |

Two nestings are allowed because each concern still appears once: `Result<Option<T>>` for an optional value that can fail validation, and `Promise<Option<T>>` for an async lookup that may find nothing. `Promise<Result<T>>`, `Result<Result<T>>`, and `Option<Option<T>>` are forbidden.

**Asynchrony emerges from leaves.** Any step touching I/O returns `Promise`, and it propagates outward. It is not decided at the top.

### The zones

| Zone | What lives there | Names |
|---|---|---|
| **Zone 1** | the use case entry point, one per use case | the business goal |
| **Zone 2** | step interfaces the composition chains | the **intent** — what the workflow needs to happen |
| **Zone 3** | business and adapter leaves | the **mechanism** — how it is done |

A function calls its own zone or one level down. The verb tables in *Basic Patterns* are representative, never closed: a verb absent from them is unlisted, not wrong. The zone is the constraint.

### The patterns

- **Leaf** — an atomic operation with no substeps. A *business leaf* is pure computation; an *adapter leaf* crosses a boundary. Everything else composes Leaves.
- **Sequencer** — dependent steps chained with `map` and `flatMap`, each feeding the next, short-circuiting on the first failure. Two to five steps.
- **Fork-Join** — independent steps run in parallel and joined.
- **Condition** — a branch on a business fact, extracted to a named function rather than left as a ternary inside a lambda.
- **Iteration** — a step applied across a collection.
- **Aspects** — cross-cutting concerns wrapping operations uniformly.

**Each function implements exactly one pattern; mixing patterns is the signal to split.** Lambdas are composition points: method references and single calls with parameter forwarding, nothing more.

### The recovery triple

- **Design-out** — change the model so the invalidation cannot arise: an idempotent write, an append-only log, a reservation type where double-booking is structurally impossible. **Check this first.**
- **BER** (*compensate-by-inverse*) — undo by an inverse action: release the seat, void the authorization, reverse the entry. For changes that are reversible and where correctness demands the system look as if nothing happened.
- **FER** (*degrade-and-continue*) — continue with degraded state rather than undoing: a queued retry, a value decaying `fresh -> stale -> expired`. For where forward progress is worth more than perfect consistency.

Which applies is a judgment across reversibility, the value of partial progress, the domain's shape, and coordination cost.

### What the stubs owe

Every stub in a use case test is an assumption about a boundary: that the real adapter succeeds that way, fails that way, and translates a transport exception into that typed failure. No use case test checks any of it. **The adapter contract test is what makes the stub honest** — success, the not-found case, and the exception-to-`Cause` translation that is the adapter's entire job.
