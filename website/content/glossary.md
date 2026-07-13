# Series Glossary

One glossary for the whole series. Each entry is labeled with the book (or books) that define it — *PFD* for **Process-First Design**, *JBCT* for **Java Backend Coding Technology**, *AS* for **Architecture Synthesis**. Every term is defined once, here; the books themselves point back to this page rather than repeating each other's definitions. Where a term means slightly different things in different books, the shared core comes first, then each book's nuance.

## Crosswalk

Renames and mappings across the series, so a reader who learned a term in one book can find it under a different name in another.

| In one book | Maps to | Note |
|---|---|---|
| AS's long names — *compensate-by-inverse*, *degrade-and-continue*, *design-out* | PFD/JBCT's **BER**, **FER**, **design-out** | Same three classes, the [recovery triple](#recovery-triple). AS spells them out in prose; PFD/JBCT use the short acronyms as the series' compact notation. |
| PFD's eleven Phase-4 questions (*Architecture Synthesis* module) | AS's [nine questions](#nine-questions) | The audit that produced AS found two pairs redundant — throughput + scale shape merged into *Load*; technology mandates folded into *External constraints* — and regrammared latency/availability/durability as budgets (time/failure/loss). AS's sheet **supersedes** the PFD module for architecture work; PFD's next revision will say so on its own pages. |
| PFD's four question categories (SLO / Constraint / Operational target / Substrate-shaping) | AS's five [driver modes](#driver-modes) (prune / select / isolate / split / bound) | Driver modes are the series-canonical taxonomy — they classify by what an answer *does* in the derivation, not by what kind of requirement it superficially looks like. |
| JBCT's migration "Phases" (Phase 1–4: incremental steps for adopting JBCT in an existing codebase) | — | Unrelated to AS's Phase 4/5/6 (elicit/select/pick-technology) despite the shared word. Rename pending in JBCT's next revision to "stages," to remove the collision. |

---

## A

**Absorption** {#absorption}
The growth move by which a cross-field invariant spanning several parts summons a new process that owns just the cross-part guard, while the parts keep their own write-logic and run as its steps. The dual of [emancipation](#emancipation).
*Defined in: PFD*

**Accretion** {#accretion}
How an entity comes to be: fields attach to an id one at a time as processes learn durable facts, so a stored record is a running total of what has been committed, never authored whole.
*Defined in: PFD*

**Adapter** {#adapter}
A component bridging an external system and the domain — a repository, an HTTP client, a queue producer — implementing a step interface and wrapping external I/O in a Promise.
*Defined in: JBCT*

**Adapter Zone** {#adapter-zone}
The architectural layer holding adapters, converting between external representations (JSON, SQL) and domain types. The only zone where `Promise.lift()` should appear. Part of the [Three Zones](#three-zones).
*Defined in: JBCT*

**Aggregation** {#aggregation}
Combining multiple Result or Promise values into one. `Result.all()` accumulates every failure; `Promise.all()` fails fast on the first.
*Defined in: JBCT*

**Altitude** {#altitude}
A level of the [telescope](#telescope) — use case, workflow, subsystem, system. Altitudes aren't imposed; they emerge as units cohering at one level form a unit at the next.
*Defined in: PFD*

**Aspects** {#aspects}
The pattern for cross-cutting concerns that wrap an operation uniformly. Business cross-cutting (audit, compliance) is a design decision; technical cross-cutting (logging, tracing, retry, timeout) is supplied by the runtime through a fixed [wrapping convention](#aspect-wrapping-convention). JBCT's coding-level realization: wrapper functions composing around a core operation for retry, timeout, and audit.
*Defined in: PFD, JBCT*

**Aspect-Wrapping Convention** {#aspect-wrapping-convention}
The settled order in which technical Aspects wrap one operation: metric (outermost, so it measures everything including waits), then timeout, then circuit breaker, then retry, then rate limit, then the business operation (innermost). Fixed once at the platform level and inherited everywhere, not decided per use case.
*Defined in: AS*

## B

**Backward Error Recovery (BER)** {#ber}
The first member of the [recovery triple](#recovery-triple): undo an invalidated step by its inverse — release a held seat, void an authorization. The classic rollback/saga shape. AS's long name: *compensate-by-inverse*.
*Defined in: PFD, AS*

**Bifurcation** {#bifurcation}
Handling both outcomes of a computation at once. Methods like `fold()` and `apply()` take two handlers, one per outcome.
*Defined in: JBCT*

**Boundary Contract** {#boundary-contract}
What a subsystem exposes at its edge — what callers must send, what it returns, which failures it surfaces — composed from the subsystem's own internal types rather than invented fresh for the boundary.
*Defined in: PFD*

## C

**Cause** {#cause}
Pragmatica Core's typed error value: a sealed interface enabling exhaustive handling, used in place of exceptions for business errors.
*Defined in: JBCT*

**Cells** {#cells}
The escalation of sharding when volume sharding compounds with blast-radius isolation: the shard boundary widens to a full, isolated instance of the whole stack per shard. Cross-cell features are structurally forbidden — the prohibition is the mechanism working.
*Defined in: AS*

**Chain** {#chain}
A sequence of monadic operations connected by `flatMap()`, each step receiving the previous step's success value; a failure anywhere short-circuits the rest.
*Defined in: JBCT*

**Change Driver** {#change-driver}
A reason code changes — a force that, moving, forces the code to move with it. A boundary is right when everything inside changes for the same reason and nothing outside does. Distinct from a [trigger](#trigger); drivers themselves evolve as the business does.
*Defined in: PFD*

**Change-Driver Cohesion** {#change-driver-cohesion}
The grouping criterion: units cohere when one change driver governs all of them, tested on two axes — [completeness](#completeness) and [purity](#purity).
*Defined in: PFD*

**Clean Architecture** {#clean-architecture}
Uncle Bob's concentric-layers style with the dependency rule. JBCT can be implemented inside it; the two are compatible, not identical.
*Defined in: JBCT*

**Completeness** {#completeness}
One axis of the cohesion test: does a grouping contain everything a driver governs, or is some of it scattered elsewhere, forcing one change to chase pieces across modules (shotgun surgery)?
*Defined in: PFD*

**CompositeCause** {#composite-cause}
A Cause holding several sub-causes, produced by `Result.all()` when multiple validations fail, so all errors are collected rather than only the first.
*Defined in: JBCT*

**Composition Substrate** {#composition-substrate}
One of the [six axes](#six-axes): how units talk to each other — direct calls, event-based, streaming, or mixed. Direct is cheapest and couples callers temporally; event-based decouples in time at the cost of propagation lag and idempotent consumers; streaming serves one ordered, replayable, high-volume feed.
*Defined in: AS*

**Condition** {#condition}
The pattern for routing on a business fact between legitimate alternatives, implemented with a switch expression where every branch returns the same type — never a bare boolean where the fact carries meaning.
*Defined in: PFD, JBCT*

**Conflict Rule** {#conflict-rule}
What the derivation does when two demands press one axis in opposite directions: at genuinely different scopes, split at the boundary (and price the split); at the same scope, decompose further; if still opposed, escalate to a [contradiction halt](#contradiction-halt).
*Defined in: AS*

**Consistency Contract** {#consistency-contract}
Per data class and path: which reads must be strict, which may lag and by how much (a named bound), and who must see their own writes. A [prune-mode](#driver-modes) question — one of the [nine questions](#nine-questions) — because a value that can't honor the contract is struck outright, not merely disfavored.
*Defined in: AS*

**Consistency Lens** {#consistency-lens}
The verification discipline for any consistency claim: name the guarantee, the mechanism that earns it, and the failure behavior — never a one-bit label like "strongly consistent." A guarantee stated without its mechanism is either a wrong vector or a fake answer. AS uses it as the [exit gate](#exit-gate).
*Defined in: AS*

**Containment Rungs** {#containment-rungs}
Mechanisms that absorb a demand without moving any architecture axis, because they own no business logic and no data of record: hardware sizing, then cache, then read coalescing, then replicas, then projections. Climb rung by rung and stop where the citations stop; only the top rung (projections) is an axis move.
*Defined in: AS*

**Contradiction Halt** {#contradiction-halt}
The derivation's refusal state when opposing pressures survive both the same-scope and different-scope resolutions of the [conflict rule](#conflict-rule): output is a priced renegotiation menu, not a forced pick.
*Defined in: AS*

## D

**Data as Residue** {#data-as-residue}
The claim that data isn't designed but precipitates from process: a field exists only because some operation writes it and some operation reads it, so stored state is downstream of process, never prior to it. Bounded by an [honest limit](#honest-limit).
*Defined in: PFD*

**Decision Record** {#decision-record}
One page per axis move, written as the derivation runs rather than reconstructed later: position, the answers that forced it, the mechanism, the costs accepted, and a [revisit trigger](#revisit-trigger). Kept, it turns an architecture's history from archaeology into instrumentation.
*Defined in: AS*

**Demand Shapes** {#demand-shapes}
The taxonomy that decides which mechanism family contains a load, answered by one diagnostic — *would a second copy help?* **Volume** (yes: sizing, cache, replicas, sharding). **Contention** (no — one record, one winner: admission control, coalescing, design-out; never sharding). **Burst** (a peak with tolerable settling delay: a buffer). **Deadline** (finish inside a window: windowed throughput, resumable batch).
*Defined in: AS*

**Dependency Inversion** {#dependency-inversion}
Dependencies point at abstractions, not implementations. In JBCT, use cases depend on step interfaces; adapters implement them.
*Defined in: JBCT*

**Deployment Topology** {#deployment-topology}
One of the [six axes](#six-axes): single deployable, multiple deployables, unified runtime, or serverless. The single deployable gives in-process calls everywhere at the cost of whole-system blast radius; multiple deployables buy independent release, scaling, and blast-radius isolation at the cost of a network on every crossing.
*Defined in: AS*

**Derive, Don't Store** {#derive-dont-store}
Prefer recomputing a value from authoritative facts over storing a redundant copy that can drift — availability is the absence of a reservation, never a stored `free` flag. A [design-out](#design-out) tactic against contention.
*Defined in: PFD*

**Design-Out** {#design-out}
The third member of the [recovery triple](#recovery-triple): reshape the model so an invalidation cannot arise at all, rather than recovering after the fact — an idempotent write, a structurally unrepresentable double-booking. The strongest guarantee available in the series, paid once in the model's shape rather than repeatedly in compensation.
*Defined in: PFD, AS*

**Direct Step Composition** {#direct-step-composition}
Wiring steps by calling the next one on the value the previous returned — the chain written out, output feeding input. Contrast [event-based step composition](#event-based-step-composition); both are Promise-based and non-blocking.
*Defined in: PFD*

**Domain Zone** {#domain-zone}
The architectural layer holding pure business logic — use cases, value objects, step interfaces — with no framework dependencies. Part of the [Three Zones](#three-zones).
*Defined in: JBCT*

**Driver Modes** {#driver-modes}
The five ways an answer to one of the [nine questions](#nine-questions) can act on the derivation. **Prune**: strikes values outright, binary, no hardware buys it back (consistency contract, loss budget, external constraints, multi-X). **Select**: narrows among surviving values (time budget). **Isolate**: sets blast-radius boundaries (failure budget). **Split**: presses structure only on divergence, not magnitude (load). **Bound**: sets the envelope everything else optimizes inside (release structure, cost & capacity envelope).
*Defined in: AS*

## E

**Emancipation** {#emancipation}
The growth move by which a field or part that gains its own independent change driver separates from its old owner to become one itself. The dual of [absorption](#absorption).
*Defined in: PFD*

**Entry Gate** {#entry-gate}
The five disciplines an answer must pass before it counts as a demand rather than a wish: **priced** (what does the business do differently in the 53rd minute of downtime?), **scoped** (per operation/data class/path, never system-wide), **decomposed** (bundled asks like "team independence" or "we need audit" split into their real, separately-priced parts — including the audit/replay/erasure three-way split), **triaged** (the requester's clock vs. the system's clock; an observed incident isn't yet a demand), and **surfaced early** (stakeholder disagreement caught as a business contradiction, not an engineering one).
*Defined in: AS*

**Error Accumulation** {#error-accumulation}
Collecting every failure instead of stopping at the first; `Result.all()` accumulates into a CompositeCause.
*Defined in: JBCT*

**Evidence Grades** {#evidence-grades}
The protection levels assigned to a derivation run's evidence, worst first: **C** — registered in advance but drawn from memory of the same public sources it's graded against. **B** — registered before the answer sheet was assembled, operator not isolated. **A** — executed by an operator that provably could not have seen the outcome.
*Defined in: AS*

**Event-Based Step Composition** {#event-based-step-composition}
Wiring steps by having one publish a typed fact that triggers the next, instead of calling it on a return value. The in-flight state between steps is the same either way; what changes is its durability — implicit and brief on a call stack versus externalized, named, and independently consumable.
*Defined in: PFD, AS*

**Exception Wrapping** {#exception-wrapping}
Converting a thrown exception to a Cause at an adapter boundary, via `Promise.lift()` or `Result.lift()`.
*Defined in: JBCT*

**Exit Gate** {#exit-gate}
Verification of a derived vector before it's built: every guarantee must name its mechanism (the [consistency lens](#consistency-lens)), and every budget must survive arithmetic — latency composing down the critical path, tails composing through the distribution, envelopes composing upward by correlation, availability multiplying in series.
*Defined in: AS*

**External Zone** {#external-zone}
Everything outside the application: databases, external APIs, message queues, file systems.
*Defined in: JBCT*

## F

**Factory Method** {#factory-method}
A static method creating a value object or use case instance; value-object factories return `Result<T>` to enforce validation at construction.
*Defined in: JBCT*

**Fail-Fast** {#fail-fast}
Stopping at the first failure. `flatMap()` chains and `Promise.all()` are fail-fast; contrast [Result.all](#result-all).
*Defined in: JBCT*

**Failure Budget** {#failure-budget}
Per operation: the error budget and the criticality setting it — a 99.5% target is 44 hours a year and a restart strategy fits inside it; 99.99% is 53 minutes, and whole design classes stop fitting. One of the [nine questions](#nine-questions), [isolate mode](#driver-modes).
*Defined in: AS*

**Forward Error Recovery (FER)** {#fer}
The second member of the [recovery triple](#recovery-triple): continue with degraded state rather than undoing — a notification queued for retry, a value decaying through fresh → stale → expired. AS's long name: *degrade-and-continue*.
*Defined in: PFD, AS*

**flatMap** {#flatmap}
The monadic bind: chains a dependent operation, skipping it on failure, and flattens rather than nesting (`Result<Result<T>>` never appears).
*Defined in: JBCT*

**Fn1, Fn2, Fn3** {#fn1-fn2-fn3}
Pragmatica Core's functional interfaces for one-, two-, and three-argument functions, built for composition in a way `java.util.function.Function` is not.
*Defined in: JBCT*

**Fork-Join** {#fork-join}
The pattern for independent operations run in parallel and joined, typically via `Promise.all()`.
*Defined in: PFD, JBCT*

**Four-Way Split** {#four-way-split}
The claim that an entity-first aggregate fuses identity, lifecycle state, representation, and policy into one object, while process-first design keeps them apart as id, state machine, value object, and use cases, so each varies independently.
*Defined in: PFD*

## G

**Guard Clause** {#guard-clause}
An early return on invalid input. JBCT replaces this with [parse, don't validate](#parse-dont-validate): validation lives in the value-object factory, not scattered checks.
*Defined in: JBCT*

## H

**Happy Path** {#happy-path}
The execution path when every operation succeeds. In JBCT it's the default read of the code; failures are the explicit branch, not the other way around.
*Defined in: JBCT*

**Hexagonal Architecture** {#hexagonal-architecture}
Ports-and-adapters: domain at the center, adapters at the edges. JBCT's step interfaces play a role similar to ports.
*Defined in: JBCT*

**Honest Limit** {#honest-limit}
The acknowledged edge of [data as residue](#data-as-residue): in domains dense with cross-field invariants (a ledger, a tax engine), stored state has real structure and a record earns its place — data is minimized there, not eliminated.
*Defined in: PFD*

## I

**id as Seed** {#id-as-seed}
Persisted state begins at an identity — minted by one operation, needing no other field — and grows outward from it. An id can exist with no fields; a field never exists with no id.
*Defined in: PFD*

**Immutability** {#immutability}
An object that cannot change after construction. Java records are immutable by default, which JBCT leans on for thread safety.
*Defined in: JBCT*

**Independent Variation Principle (IVP)** {#independent-variation-principle}
Yannick Loth's criterion: unify elements sharing a change-driver assignment, separate those that don't. PFD reaches the same partition from the process side.
*Defined in: PFD*

**Information Hiding** {#information-hiding}
Parnas's criterion: decompose by hiding the design decisions most likely to change, so the module boundary follows the change list, not the flowchart.
*Defined in: PFD*

**Iteration** {#iteration}
The pattern for a step applied across a collection — `Promise.allOf()` for parallel processing, stream operations for sequential.
*Defined in: PFD, JBCT*

## J

**JBCT** {#jbct}
Java Backend Coding Technology: the series' methodology for writing maintainable backend Java using functional composition and explicit, typed error handling.
*Defined in: JBCT*

## L

**Leaf** {#leaf}
The atomic unit of composition: a boundary crossing (I/O, an external call) or a pure computation. Everything else composes Leaves; a unit's whole composition at one [altitude](#altitude) is a Leaf at the altitude above.
*Defined in: PFD, JBCT*

**Ledger** {#ledger}
The written record of what each value on each of the [six axes](#six-axes) provides, through what mechanism, at what always-on cost — priced independent of any technology choice, and applied only at the scope a demand actually earns.
*Defined in: AS*

**Lift** {#lift}
Converting a value or throwing operation into a monadic context — `Result.lift()` wraps throwing code; `result.async()` lifts a Result into a Promise.
*Defined in: JBCT*

## M

**map** {#map}
Transforming a success value while preserving its container, without flattening — use [flatMap](#flatmap) when the mapper itself returns a monadic type.
*Defined in: JBCT*

**Modulith** {#modulith}
One deployable, split internally along subdomain boundaries, so teams own modules without yet paying for independent deployment. The standard resolution when team independence presses but deployment complexity is still bounded; modules become services later, when *release* independence — not just ownership — actually demands it.
*Defined in: AS*

**Monad** {#monad}
A pattern for chaining operations that may fail or have side effects; Option, Result, and Promise are all monads, and `flatMap()` is the key operation.
*Defined in: JBCT*

**Multi-X** {#multi-x}
Countries, currencies, tenants, regions, versions — one of the [nine questions](#nine-questions), [prune mode](#driver-modes). Carries two distinct outputs: partition *gifts* (tenants that never interact are a natural shard key) and legal *pins* (data that must stay in-country by statute).
*Defined in: AS*

## N

**Nine Questions** {#nine-questions}
AS's elicitation sheet — the minimal set of questions whose answers can press or prune an architecture axis independently of every other question's answer. Time budget, failure budget, loss budget, consistency contract, load, external constraints, release structure, cost & capacity envelope, multi-X. Organized by [driver mode](#driver-modes); see the [crosswalk](#crosswalk) for its relation to PFD's eleven.
*Defined in: AS*

**Null Vector** {#null-vector}
The cheapest position on every axis — single deployable, direct calls, unified reads, current-state, single shared store — and the starting point of every derivation. Recovery has no null; it's decided per effectful operation from domain shape. Starting at the bottom is a measurement precondition: pressure is only visible as escape from containment, so containment must start somewhere defined.
*Defined in: AS*

## O

**Option** {#option}
A type for a value that may be absent, used when absence is a normal domain fact rather than an error; converts to Result when absence should be treated as one.
*Defined in: JBCT*

**Ownership** {#ownership}
The relation that every datum has one creating (minting) operation; writes are owned, reads are open. Ownership has a lifecycle — minted, accreted, transitioned, then [absorbed or emancipated](#absorption) — and restructures around stable data as a system grows.
*Defined in: PFD*

## P

**Parse, Don't Validate** {#parse-dont-validate}
Enforce a type's claim at construction, so an invalid value can't exist and downstream code trusts it without re-checking. JBCT's Java realization sits at the construction level: a non-public constructor and a factory method returning `Result<T>`.
*Defined in: PFD, JBCT*

**Patterns (the six)** {#the-patterns}
The sufficient set of composition primitives, identical at every altitude: [Leaf](#leaf), [Sequencer](#sequencer), [Fork-Join](#fork-join), [Condition](#condition), [Iteration](#iteration), [Aspects](#aspects).
*Defined in: PFD*

**Persistence Configuration** {#persistence-configuration}
One of the [six axes](#six-axes): single shared store, distributed shared, sharded, per-component, or polyglot. The distributed shared store is the only value giving strict cross-region transactions with zero data loss on regional failure — priced in physics (a cross-region round-trip floor), not tunable away.
*Defined in: AS*

**Phase 4 / Phase 5 / Phase 6** {#phase-4-5-6}
AS's three phases of architecture work, cutting across [altitude](#altitude) rather than naming one: **Phase 4** elicits what the system must satisfy (the [nine questions](#nine-questions)); **Phase 5** selects the axis vector that satisfies it; **Phase 6** picks the concrete technology. See the [crosswalk](#crosswalk) for the unrelated JBCT term sharing the word "Phase."
*Defined in: AS*

**Port** {#port}
In Hexagonal Architecture, an interface defining how the domain talks to the outside world — similar in role to JBCT's step interfaces.
*Defined in: JBCT*

**Pragmatica Core** {#pragmatica-core}
The minimal Java library providing Option, Result, Promise, and Cause — the foundation JBCT's patterns are built on.
*Defined in: JBCT*

**Pressure Matrix** {#pressure-matrix}
The derivation's working record of which answer pressed which axis toward which value. During derivation it's the workspace; kept afterward, it's the traceability record a [decision record](#decision-record) is built from.
*Defined in: AS*

**Process** {#process}
The unit of design: a trigger producing an outcome, and an act of knowledge gathering. Types belong to processes, not the reverse.
*Defined in: PFD*

**Promise** {#promise}
A type for an asynchronous operation that may fail, combining async execution with explicit, typed error handling.
*Defined in: JBCT*

**Pure Function** {#pure-function}
A function with no side effects, returning the same output for the same input every time. Value-object factories should be pure.
*Defined in: JBCT*

**Purity** {#purity}
One axis of the cohesion test: is everything inside a grouping governed by its driver, or has a foreign unit ridden along, leaking its unrelated changes in as accidental coupling?
*Defined in: PFD*

## R

**Railway-Oriented Programming (ROP)** {#railway-oriented-programming}
The two-track error-handling model — success track, failure track — that Result and Promise implement in JBCT.
*Defined in: JBCT*

**Read/Write Model** {#read-write-model}
One of the [six axes](#six-axes): unified (reads served from the same model as writes) or separated (a read path split into its own projection). Unified gives read-your-writes for free; separation earns its cost only when a read path carries both its own SLO and its own shape.
*Defined in: AS*

**Record** {#record}
Java's immutable data class (since Java 14), used throughout JBCT for value objects, requests, responses, and error types.
*Defined in: JBCT*

**recover** {#recover}
Handling a failure and potentially converting it to success: a function `Cause -> M<T>` that supplies a fallback or re-raises.
*Defined in: JBCT*

**Recovery Triple** {#recovery-triple}
The three responses to an invalidated step, where most discourse names only the first: [BER](#ber) (compensate by inverse), [FER](#fer) (continue degraded), [design-out](#design-out) (make the invalidation impossible). AS carries the same three classes under long names — see the [crosswalk](#crosswalk).
*Defined in: PFD, AS*

**Result** {#result}
A type for a synchronous operation that may fail, holding either a success value or a Cause.
*Defined in: JBCT*

**Result.all** {#result-all}
Combines multiple Results, accumulating every failure into a CompositeCause rather than stopping at the first — for independent validations. Contrast [fail-fast](#fail-fast).
*Defined in: JBCT*

**Revisit Trigger** {#revisit-trigger}
The condition, named when a decision is made, under which it expires — "this decision expires when these answers change." Converts a [decision record](#decision-record) from archaeology into instrumentation, and lets a later audit report that conditions changed without ever assigning blame.
*Defined in: AS*

## S

**Saga** {#saga}
Not a primitive: [BER](#ber) applied across autonomous steps sharing no transactional substrate, where each forward step's inverse is itself a use case. Recognized by structure, not pinned to one altitude — most elaborate across subsystems, same shape wherever committed steps must unwind.
*Defined in: AS*

**Scope Test** {#scope-test}
The check the [conflict rule](#conflict-rule) runs first: are two opposing pressures on one axis actually at different scopes? If so, split at the boundary rather than forcing one uniform value.
*Defined in: AS*

**Sealed Interface** {#sealed-interface}
Java's restricted inheritance (since Java 17), where every implementation is known at compile time — used for Cause types and exhaustive switch expressions.
*Defined in: JBCT*

**Semantic Potential** {#semantic-potential}
William Jackson's term for a type's capacity to carry a business statement rather than a mere data layout; the [shapes](#the-shapes) are where the methodology first spends it.
*Defined in: PFD*

**Sequencer** {#sequencer}
The pattern for steps in strict order, each feeding the next, short-circuiting on the first failure — implemented with `flatMap()` chains.
*Defined in: PFD, JBCT*

**Shapes (the four)** {#the-shapes}
The four type-honest shapes a value can carry: `T` (exists unconditionally), `Option<T>` (may be absent, as a domain fact), `Result<T>` (may have failed, synchronously), `Promise<T>` (arrives later, may fail).
*Defined in: PFD*

**Shared Primitive** {#shared-primitive}
What actually couples two processes — an id, a state enum, a field's value type they both touch, each a word the business actually says. Two processes writing different fields of one row are not coupled merely by sharing a table.
*Defined in: PFD*

**Short-Circuit** {#short-circuit}
Stopping at the first failure. `flatMap()` chains short-circuit; `Result.all()` deliberately does not.
*Defined in: JBCT*

**Six Axes** {#six-axes}
The orthogonal decisions an architecture vector commits to: [deployment topology](#deployment-topology), [composition substrate](#composition-substrate), [read/write model](#read-write-model), [state storage](#state-storage), [persistence configuration](#persistence-configuration), and recovery (the [recovery triple](#recovery-triple), the one axis with no null). An axis earns its seat only if systems with different answers must differ *structurally* along it before any technology is chosen.
*Defined in: AS*

**State Machine (`*State*`)** {#state-machine}
The lifecycle a workflow advances through, modeled as a sealed sum type named with a `*State*` suffix (`HoldState`, `BookingState`) with bare variants (`Free`, `Held`, `Confirmed`). It's the one field several use cases write, changed only through a guarded transition, never an overwrite — the single point needing coordination. JBCT reserves the suffix for this lifecycle sum specifically, not every mutable holder.
*Defined in: PFD, JBCT*

**State Storage** {#state-storage}
One of the [six axes](#six-axes): current-state or event-sourced. Current-state, paired with an audit log written in the same transaction, answers every who/what/when question; event-sourced buys genuine replay (state as of any past moment, under that moment's rules) at a cost that compounds forever. Erasure demands run structurally against event-sourcing.
*Defined in: AS*

**Step Interface** {#step-interface}
A functional interface defining one operation in a use case, declared inside the use-case interface and implemented by adapters.
*Defined in: JBCT*

**Stub** {#stub}
A test double returning predetermined values — in JBCT, typically a lambda implementing a step interface.
*Defined in: JBCT*

**Subsystem** {#subsystem}
A coherent business concern: a cluster of workflows cohering under one domain driver, and a Leaf to its [system](#system).
*Defined in: PFD*

**System** {#system}
The composition of subsystems, the top of the [telescope](#telescope); above it is the enterprise, governed by organizational forces code structure can't express.
*Defined in: PFD*

## T

**Targeted Insertion** {#targeted-insertion}
The response when Phase 4 surfaces a use case nobody had written down: fold that one use case back into Phase 1 and re-derive only it, rather than re-running the whole derivation.
*Defined in: AS*

**Telescope** {#telescope}
The methodology's organizing structure: the same vocabulary at successive scales (use case, workflow, subsystem, system), where a unit's internal composition at one [altitude](#altitude) is a Leaf at the altitude above.
*Defined in: PFD*

**Three Zones** {#three-zones}
JBCT's architectural model: [External](#external-zone) (outside systems), [Adapter](#adapter-zone) (boundary translation), [Domain](#domain-zone) (pure business logic).
*Defined in: JBCT*

**TimeSpan** {#timespan}
Pragmatica Core's duration type, built with a fluent API: `TimeSpan.timeSpan(5).seconds()`.
*Defined in: JBCT*

**Trigger** {#trigger}
What fires a use case: an external request, a published event, or an invocation from another use case or workflow. Distinct from a [change driver](#change-driver), which is what forces a use case to *change*, not what starts it.
*Defined in: PFD*

**Type Lifting** {#type-lifting}
Converting a lower type to a higher one — `T` → `Option` → `Result` → `Promise` — the safe direction, since each step only adds information.
*Defined in: JBCT*

## U

**Unified Runtime** {#unified-runtime}
A [deployment topology](#deployment-topology) value: a single runtime hosting every component as a slice, with a transport-transparent wire between them, so the same composition deploys as one process or many without touching business code. Aether is the series' reference instance.
*Defined in: AS*

**Unforced Position** {#unforced-position}
An axis value in a decision record with no citing answer left in the current sheet — not a mistake, just a decision the answers no longer support. The vocabulary is deliberate: positions are "unforced" or "no longer cited," never "wrong," since the answers may simply have moved since the decision was made.
*Defined in: AS*

**Unique Container** {#unique-container}
A demand combination with exactly one containing value on the ledger — e.g., strict consistency × multi-region × zero-loss on one data class is only ever satisfied by a distributed shared store. Combination pressure, not any single row, is what forces it.
*Defined in: AS*

**Unit** {#unit}
A type with a single value, meaning "no meaningful result" — used instead of `Void` for an operation that succeeds but returns nothing.
*Defined in: JBCT*

**Use Case** {#use-case}
One business operation with one trigger and one outcome. JBCT realizes it as a functional interface holding Request/ValidRequest/Response records and step interfaces; it's the floor of PFD's [telescope](#telescope), composed internally from [the patterns](#the-patterns); AS attaches per-use-case SLO answers (latency, throughput, availability) to it as an elicitation scope.
*Defined in: JBCT, PFD, AS*

## V

**Validation** {#validation}
Checking data meets requirements. In JBCT this happens inside value-object factories, which return `Result<T>` rather than a boolean.
*Defined in: JBCT*

**Value Object** {#value-object}
An immutable domain concept — Email, Money, UserId — created only through a factory method that enforces validation.
*Defined in: JBCT*

**Verify (utility)** {#verify-utility}
Pragmatica Core's utility class for validation predicates: `Verify.ensure()` builds a Result from a predicate; `Verify.Is` supplies common predicates.
*Defined in: JBCT*

**Volatility-Based Decomposition** {#volatility-based-decomposition}
Löwy's criterion: decompose by what varies, not by function — encapsulate the volatile part and leave the stable nature of the business alone.
*Defined in: PFD*

## W

**When-to-Decompose Triggers** {#when-to-decompose-triggers}
The four conditions that justify splitting a unit into its own workflow, subsystem, or deployable — a distinct trigger, a distinct SLO, non-trivial compensation, independent operation (deploys/scales/fails apart from its neighbors). Absence of all four argues against splitting; the split is granularity for its own sake otherwise.
*Defined in: AS*

**Within-Altitude Composition / Cross-Altitude Grouping** {#within-altitude-cross-altitude}
The two operations recurring at every altitude: composition (how units at one altitude compose into one, via [the patterns](#the-patterns)) and grouping (how units below cohere into one, via [change-driver cohesion](#change-driver-cohesion)).
*Defined in: PFD*

**Workflow** {#workflow}
A composition of use cases for one business outcome, cohering under one business policy — a Leaf to its subsystem.
*Defined in: PFD*

**Wrapper** {#wrapper}
A function adding behavior around another function; the mechanism behind the [Aspects](#aspects) pattern for cross-cutting concerns.
*Defined in: JBCT*
