# Foundations

*Spiral 0 ended on a promise: the decisions a use case forces have a small, fixed set of answers. This chapter is that set. It is the shortest kind of chapter to write and the easiest to underestimate — a vocabulary, not an argument. Everything the spiral does afterward is this vocabulary, applied.*

---

## What this chapter does

The previous chapter raised the decisions every use case forces and claimed they have simple, consistent answers. This chapter names the pieces those answers are built from. It defines; it does not demonstrate. Demonstration is the spiral's job — four passes that take this vocabulary and apply it at use-case, workflow, subsystem, and system altitude. Read this once and refer back to it; nothing here needs to be memorized, because the spiral will use every piece often enough to make it stick.

The vocabulary is deliberately small. Four shapes, six patterns, six properties, three recovery classes, one organizing structure. That smallness is the point Spiral 0 made: a vocabulary you can hold in your head is one you apply from memory, the same way every time. The list below is the whole of it. The reason the book can be read in one sitting is that the list does not grow as the altitudes climb.

---

## Process-first

The stance the whole methodology rests on, stated plainly: **the unit of design is the process, not the entity.** What you design is a thing that *happens* — a trigger producing an outcome — not a thing that *is*. Data structures are shaped by the processes that use them, not by a model of the domain that exists prior to any use.

The immediate consequence is that types belong to processes. A "customer" in *buy ticket* is the shape buying needs; a "customer" in registration is the shape registering needs; they are different types that happen to share a noun. What is genuinely common — an identifier, a money amount, a thing that means exactly the same wherever it appears — is a small shared value object. Everything else is local to the process that uses it.

This is a bet, and it is worth naming as one. Entity-first design — one shared model of each domain concept, used everywhere — has a real advantage: no duplication, one place to look. Process-first gives that up; it pays in per-process types and in the discipline of deciding what is genuinely shared. The bet is that the coupling cost of the shared model grows faster than the duplication cost of per-process types, so that past a certain scale process-first is cheaper to maintain. The spiral does not argue this bet; it shows the methodology operating and lets the reader judge whether the result is the kind of code they want to maintain. The bet's scope is bounded: enterprise backend, where systems are large and long-lived enough for the coupling cost to bite. The methodology does not claim to be the right tool below that scale or outside that domain.

---

## The six properties of a process

A process has six properties, and they are the same six at every altitude — that is what makes the telescope below possible. Their granularity changes as you climb; the list does not.

- **Trigger** — what makes the process run. An incoming request, a scheduled tick, an event, a human approval resolving. The trigger is not the protocol that carries it; the same work behind a different trigger is a different process.
- **Typed input** — what the process needs to begin, as a precise type carrying exactly that and no more.
- **Typed output** — what the process produces on success.
- **Typed failures** — the enumerable, closed set of ways it can fail, each a named domain fact, part of the specification rather than an exception raised elsewhere.
- **Steps** — its internal sequence of operations, named in domain terms and visible at the altitude they belong to.
- **Dependencies** — the graph between the steps: what must precede what, what can run in parallel, what is conditional.

Name these six for any process and it is, in the methodology's terms, specified. The spiral walks the same six at each altitude, with the steps becoming use cases, then workflows, then subsystems as it climbs.

---

## The four shapes

Every value a process handles has one of four shapes, and the shape is a domain statement, not a stylistic choice. They are type-honest: the type says what the domain knows about the value. A type's capacity to carry a business statement rather than merely a layout is its *semantic potential* — the term is William Jackson's — and the four shapes are the first place the methodology spends it.

- **`T`** — the value exists, unconditionally. No absence, no failure, no waiting.
- **`Option<T>`** — the value may or may not exist, and its absence is a domain fact, not an error.
- **`Result<T>`** — the operation may or may not have produced the value; failure is a typed outcome carried in the type, synchronous.
- **`Promise<T>`** — the value arrives later, and may fail; `Promise<T>` carries both the asynchrony and the failure, so there is no `Promise<Result<T>>`.

Asynchrony emerges from leaves: any operation that touches I/O is a `Promise`, and the `Promise` propagates outward through everything that depends on it. It is not a decision made at the top; it is a fact that rises from the bottom.

A type carries a claim — a `CustomerId` claims to be a valid identifier, a `Money` claims to be a non-negative amount in a known currency — and construction is where the claim is enforced. This is *parse, don't validate*: the value cannot exist in an invalid state, so code that receives it can trust it without re-checking. The enforcement has four levels, strongest to weakest, and the methodology's commitment is identical across all of them; only the teeth differ:

1. **Type-level** — a refinement or dependent type the compiler rejects when invalid. Strongest; available only where the language supplies it.
2. **Construction-level** — a non-public constructor and a factory that returns `Result<T>`, so no invalid value can be built. This is the level the Java implementation uses.
3. **Runtime-level** — validation at the boundary, catching invalid values when they occur rather than preventing their construction.
4. **Convention-level** — discipline and review, with nothing in the code enforcing it.

The shape and the enforcement together are why a process body is free of defensive checks: the types arriving have already made their claims good.

---

## The six patterns

Composition has six primitives, and the same six compose a process at every altitude. Each maps to a recognizable shape of work; together they are sufficient, and the methodology adds no others.

- **Leaf** — an atomic unit: a boundary crossing (I/O, an external call) or a pure computation. The bottom of composition; everything else composes Leaves.
- **Sequencer** — steps in order, each feeding the next, short-circuiting on the first failure.
- **Fork-Join** — independent steps run in parallel and joined.
- **Condition** — a branch on a business fact, routing between legitimate alternatives. Typed, never a bare boolean where the fact carries meaning.
- **Iteration** — a step applied across a collection.
- **Aspects** — cross-cutting concerns that wrap operations uniformly: business cross-cutting (audit, compliance — part of the design) and technical cross-cutting (logging, tracing, retries — supplied by the runtime).

Each function implements exactly one pattern; mixing patterns is the signal to split. The patterns are not invented by the methodology — practitioners arrived at them independently, and they parallel the constructs business-process notations have used for decades. The methodology recognizes the structure rather than imposing it.

---

## The telescope

The methodology's organizing structure is a telescope: the same vocabulary at successive scales. A **use case** is one business operation — one trigger, one outcome. A **workflow** is a composition of use cases for one business outcome. A **subsystem** is a coherent business concern, a cluster of workflows. A **system** is the composition of subsystems. The enterprise above the system is outside this book's scope.

Altitudes are not imposed; they emerge from multiplicity. One use case is one use case. When several cohere, a workflow appears. When several workflows cohere, a subsystem appears. The methodology lets the emergence happen rather than forcing a hierarchy in advance.

Two operations recur at every altitude, and keeping them distinct is essential:

- **Within-altitude composition** — how the units *at* an altitude compose into one unit — is the six patterns. It happens at every altitude, including the use case (its steps compose via Sequencer, Leaf, Fork-Join).
- **Cross-altitude grouping** — how units of the level below *cohere to form* a unit at this level — happens only where a level is formed from a lower one. It is **change-driver cohesion**: units cohere when a single business force governs them, when one change would force them all to change together.

The recognition test for grouping is one question, asked at each transition: *what business change would force all of these to change together?* If a single force rewrites them all, they cohere. The mechanism is identical at every transition; the *kind* of driver differs by altitude:

| Transition | Units grouped | Change-driver character |
|---|---|---|
| use cases → workflow | use cases | a business policy (reservation rules, refund rules) |
| workflows → subsystem | workflows | a domain concern (the booking domain, the pricing model) |
| subsystems → system | subsystems | the product/platform boundary + operational envelope |

The use case is the floor of this ladder: the smallest business-meaningful unit, not formed by grouping a lower *business* altitude. Its steps are internal composition, not a lower altitude — so the grouping question begins at the workflow and recurs upward, while the use case has only within-altitude composition.

The same criterion, derived independently and given formal shape, is [Yannick Loth's Independent Variation Principle](https://dev.to/yannick555/the-principle-of-independent-variation-as-a-thought-framework-4aaa): unify elements with the same change-driver assignment, separate those with different ones. Process-First Design reaches the criterion from the process side; the Independent Variation Principle reaches the same partition from the change-driver side — two paths to one territory. The methodology uses change-driver cohesion as its own; it recognizes IVP as corroboration, not foundation.

One consequence of the telescope is worth stating because the spiral relies on it: a unit's composition at one altitude is a Leaf at the altitude above. A workflow is a composition of use cases, and a Leaf to its subsystem. A subsystem is a composition of workflows, and a Leaf to its system. The patterns recur because the structure is fractal.

---

## The recovery triple

When something is invalidated — a step fails after earlier steps have changed state — there are three responses, and the methodology names all three where most discourse names only the first.

- **BER (Backward Error Recovery)** — compensate by an inverse action. Release the held seat, void the authorization, reverse the entry. The classic rollback or saga shape.
- **FER (Forward Error Recovery)** — continue with degraded state rather than undoing. Defaults under partial failure, a notification queued for retry while the booking stands, a value allowed to decay through `fresh → stale → expired`.
- **Design-out** — change the model so the invalidation cannot arise. An immutable log corrected by appending rather than overwriting; a reservation model where two bookings of one seat is structurally impossible; an idempotent operation safe to repeat.

Which applies is a judgment across four axes — reversibility, forward-progress value, domain shape, coordination cost — and mixed strategies are normal: a system can use BER for money, FER for telemetry, and design-out for collaborative state, coherently, at once. The spiral surfaces which response each altitude reaches for; the full selection mechanism is the Architecture Synthesis module's work.

---

## Reading the spiral

That is the whole vocabulary. The spiral now applies it — four passes through one running example, event ticketing, at successive altitudes. Pass 1 takes a single use case, *buy a ticket*, and answers the decisions Spiral 0 raised, in full. Pass 2 lets workflows emerge as use cases multiply. Pass 3 lets subsystems emerge as workflows cluster. Pass 4 reaches the whole platform.

One thing to watch as you read: how little is new after the first pass. The vocabulary does not grow; each altitude reuses it and adds only the small delta that altitude makes visible. The passes get shorter as they climb, and that is deliberate — not the book running out of things to say, but the telescope doing exactly what it claims. Keep that in view; by the end it will be the clearest evidence the methodology offers about itself.

The spiral begins at the smallest unit of the work: one customer, one seat, one event.

---

*Threads advanced: 1 (compositional complexity), 2 (deterministic rules), 5 (legibility), 14 (telescope).*
