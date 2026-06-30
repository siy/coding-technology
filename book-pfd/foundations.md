# Foundations

*Spiral 0 ended on a promise: the decisions a use case forces have a small, fixed set of answers. This chapter is that set. It is the shortest kind of chapter to write and the easiest to underestimate — a vocabulary, not an argument. Everything the spiral does afterward is this vocabulary, applied.*

---

## What this chapter does

The previous chapter raised the decisions every use case forces and claimed they have simple, consistent answers. This chapter names the pieces those answers are built from. It defines; it does not demonstrate. Demonstration is the spiral's job — four passes that take this vocabulary and apply it at use-case, workflow, subsystem, and system altitude — the four scales of the telescope, defined under *The telescope* below. Read this once and refer back to it; nothing here needs to be memorized, because the spiral will use every piece often enough to make it stick.

The vocabulary is deliberately small. Four shapes, six patterns, six properties, three recovery classes, two axes of cohesion, one organizing structure. That smallness is the point Spiral 0 made: a vocabulary you can hold in your head is one you apply from memory, the same way every time. The list below is the whole of it. The reason the book can be read in one sitting is that the list does not grow as the altitudes climb.

---

## Process-first

The stance the whole methodology rests on, stated plainly: **the unit of design is the process, not the entity.** What you design is a thing that *happens* — a trigger producing an outcome — not a thing that *is*. Data structures are shaped by the processes that use them, not by a model of the domain that exists prior to any use.

The immediate consequence is that types belong to processes. A "customer" in *buy ticket* is the shape buying needs; a "customer" in registration is the shape registering needs; they are different types that happen to share a noun. What is genuinely common — an identifier, a money amount, a thing that means exactly the same wherever it appears, its change-driver set independent of any one process — is a small shared value object. Everything else is local to the process that uses it.

This is a bet, and it is worth naming as one. Entity-first design — one shared model of each domain concept, used everywhere — has a real advantage: no duplication, one place to look. Process-first appears to give that up — but what looks like duplication usually is not. The genuinely-common part factors out into a shared value object; what stays per-process answers to *different* change drivers, so a "customer" in one process and a "customer" in another are not one type duplicated but two that vary for different reasons. What process-first actually pays is not a DRY violation but more type declarations and the discipline of telling a shared value object from a per-process type. The bet is that this cost grows slower, at enterprise scale, than the coupling cost of one shared model — which couples every process that touches it, so a change for one risks all — so that past a certain scale process-first is cheaper to maintain. The spiral does not argue this bet; it shows the methodology operating and lets the reader judge whether the result is the kind of code they want to maintain. The bet's scope is bounded: enterprise backend, where systems are large and long-lived enough for the coupling cost to bite. The methodology does not claim to be the right tool below that scale or outside that domain.

None of this is a ban on entities. An entity earns its place when a business invariant genuinely spans more than one field — when a whole assembled from individually-valid fields can still be invalid, so the combination needs guarding, not each field alone. Its role is to enforce that cross-field invariant during persistence: it is the composite every write to that state passes through, so the store can never hold a combination the invariant forbids. Process-first changes only the default — the process is the unit of design, and an entity is introduced where a cross-field invariant demands one, not placed at the centre of the domain because a concept happens to have a name.

---

## The six properties of a process

A process has six properties, and they are the same six at every altitude — that is what makes the telescope below possible. Their granularity changes as you climb; the list does not.

- **Trigger** — what makes the process run: an incoming request, a scheduled tick, an event, a human approval resolving. The trigger is not the transport that carries it; HTTP versus a queue is not a different trigger. A process needs at least one trigger and may have several (a fulfilment process can begin from a purchase or from a restock), but its *outcome* is what defines it: the same outcome reached through different triggers is one process, while the same steps performed for a different outcome are different processes.
- **Typed input** — what the process needs to begin, as a precise type carrying exactly that and no more.
- **Typed output** — what the process produces on success.
- **Typed failures** — the enumerable, closed set of ways it can fail, each a named domain fact, part of the specification rather than an exception raised elsewhere.
- **Steps** — its internal sequence of operations, named in domain terms and visible at the altitude they belong to.
- **Dependencies** — the graph between the steps: what must precede what, what can run in parallel, what is conditional.

Name these six for any process and it is, in the methodology's terms, specified. The spiral walks the same six at each altitude, with the steps becoming use cases, then workflows, then subsystems as it climbs.

Naming the six is already a verification step, not only a specification one. To fill in the typed failures you must enumerate every way the process can end badly; to fill in the dependencies you must say what genuinely must precede what; to fill in the typed input you must state the least the trigger can carry. A flaw in the design shows up as a property you cannot complete — an outcome with no failure named for it, a step that needs a fact no earlier step produces — and it shows up *now*, at design time, on one page, before a line is written. Entity-first defers this: an entity declares its fields and says nothing about which operations touch it, how they fail, or in what order, so the failure modes and the ordering surface later, in implementation or in production. Process-first front-loads the discovery of flaws, because specifying a process *is* walking its outcomes.

---

## A process gathers knowledge

Underneath the six properties is a simpler way to see what a process is: an act of knowledge gathering. A process begins knowing only its trigger and its input, and each step acquires one more piece of what it needs — *buy ticket* learns that the request is well-formed, then that the event is selling, then that the seat is held, then that the payment cleared. The process ends, success or failure, the moment it knows enough to answer. A declined payment is not a missing outcome but knowledge in its own right, enough to answer *the ticket cannot be sold*, so the process stops there rather than gather what it no longer needs. Typed failures and short-circuiting are not machinery bolted on; they are the process recognizing it is done.

This is also why the types belong to the process. Ask of a domain "what data exists?" and the answer is entities: one `Customer`, one `Order`, one shared shape every process must accept. Ask instead "what does *this* process need to know?" and the answer is the per-process types the methodology produces — the smallest input the trigger carries, the typed knowledge each step adds, the closed set of facts, failures included, that let the process answer. Process-first is what falls out when you model around the knowledge a process gathers rather than the data a system stores.

Not every step adds to that store. Some only confirm a precondition (the caller is entitled, the request within its rate) and nothing downstream reads their result; they gate the process without enriching it. The test is whether a later step needs the outcome: when it does, the step must carry it forward as knowledge the next step consumes, for a result some later step depends on, discarded once tested, is the loss *parse, don't validate* warns against, one boundary inward. When nothing does, the check is a pure gate, and its single fact — *the process may continue* — is spent the moment it does.

---

## Where data comes from

Process-first design seems to have a hole in it. A process consumes data and produces data, so to describe a process you need the data first; but the data model is supposed to fall out of the processes, not precede them. Which comes first?

Neither, because data is not a thing you design. It is the residue a process leaves behind. The chicken-and-egg only bites if you believe data has an existence of its own, waiting to be modeled. It does not. A field of stored state exists for exactly one reason: some operation writes it and some operation reads it. A column no process produces and no process consumes is unobservable and unproducible. There is nothing there to design. So data is not prior to process, and not even concurrent with it; data is downstream, the way a compiled program is downstream of its source.

This reverses the usual order of work. You do not model the entities and then write operations over them. You describe the processes, and the stored state precipitates out of them. There is no data-modeling step to perform, the same way design-out removes a recovery step rather than making it cheaper. The cost other methods pay forever, in entity-relationship diagrams and aggregate boundaries argued and re-argued, is paid once, in describing what the business does.

**The id is the seed.** Persistence enters at a single, locatable moment: when a process first needs to remember something past the end of its own run. At that moment one thing appears, and it is not a record full of fields. It is an identity. To persist something is to be able to find it again, and finding requires a name, so the first thing that exists is the name and nothing else.

Identity is the one piece of state that needs no other. Every field is a fact about an identity; an identity is a fact about nothing but itself. You can have an id with no fields, a thing that exists about which nothing is yet known. You cannot have a field with no id, a fact about no one. That asymmetry is why persisted state begins at the id and grows outward from it.

The id is not free either. Some operation mints it, and that operation is part of a process. In a ticketing system, *buy ticket* is the operation that brings a booking into being; the booking's identity is its first output. Even the seed obeys the rule that governs every field after it: it has a creator, and the creator is a step in a process.

**The entity is an accretion, not a schema.** Once the id exists, fields attach to it as the process gathers knowledge. Each step that learns something durable fastens its result to the identity. A booking learns its seat, then its holder, then that it is confirmed; later, a different process learns that it is cancelled. The stored entity at any moment is exactly what processes have committed about that id so far, no more.

It is a running total of what has been learned about one identity, assembled over time by independent steps, never authored as a whole. The schema, the table someone wants to draw on day one, is only the union of every field any process might ever attach. It is the integral of the accretions, and writing it first is writing the integral before you have the function.

Each attached field carries four things: a name, an owner (the operation that creates it), the operations permitted on it, and the fact that it can be created at all. That last is a quiet gate. A field exists if and only if some operation can produce it; the uncreatable is not data, it is noise that never got born. Reference data has a seeding operation, an import or an admin action. A value that could be recomputed is data only if a process needs it remembered; otherwise it stays a calculation done on read and never becomes stored state. *Data appears only when a process needs to persist it* is precisely this gate.

This gate is sometimes misread as a ban on keeping data for later — on analytics, audit trails, the column captured now because some future report will want it. It is no such ban. Capturing-for-later is itself a process: its trigger is the event worth recording, its outcome is the stored fact, and its eventual consumer is the report or the audit that reads it. That data has a producer and a reader, so it passes the gate cleanly. What the gate forbids is the *orphan* — a field no operation writes, or no operation will ever read, carried because a diagram had a box for it. Foresight is allowed; the gate only asks that the foresight name the process that will produce the data and the one that will consume it. That is the whole difference between a captured fact and a speculative column.

**The whole never materializes.** Because each field is fastened by the step that owns it, no process ever needs the entire record. The buy process sees a booking as something to create; the cancel process sees the same id as something to close. Each reads and writes only the fields it owns. The record is a place where independent processes park what they each know, keyed by a shared id: a coordinate, not an object. There is no shared `Booking` class, because nothing in the business needs one.

The only field several processes write is, almost always, the one that carries the workflow's state: free, held, confirmed, cancelled. That field is a state machine, and writing it is a transition, not an overwrite. So the single point that needs coordination is the transition, and the way to coordinate it is to design the conflict out, not to lock. Every other field has one writer and needs no coordination at all.

What couples two processes, then, is never an object or a service. It is a shared primitive: the id, the state enum, the value type of a field they both touch. And every such primitive is a word the business actually says. You share the seat's identity because it is the same seat; you share its reservation state because that state is a real shared fact. Co-location is not coupling: two processes that write different fields of one row are uncoupled at runtime, sharing only a schema, which is a coordination point touched at migration time, deliberately and rarely. The coupling that remains is the business's own, and only the business's own.

**When a record earns its place.** One case looks like a counterexample. A new feature appears that must write two field-groups together, under an invariant that spans both. This does not break the model; it grows it. The feature is a new owner, and it absorbs those groups as subcomponents. The processes that wrote them before now write through it. The seam appears exactly at the invariant and nowhere else, and the realization that *these have to move together now* is itself a change in the business: the discovery of a governance boundary that did not exist yesterday.

The familiar aggregate is the fossil of one such absorption: a write-need that once justified a boundary, frozen into a noun that persists after the need has moved. Process-first keeps the boundary a verb, an owning operation, so when the need moves the ownership moves with it and nothing fossilizes. This is why aggregates rot: they record an absorption and then stop recording.

What the aggregate fuses is four things that vary independently: the identity, the lifecycle state, the representation of what is stored, and the policy that acts on it. Process-first keeps them apart. The id mints identity, the state machine owns state, a value type owns the representation, and the use cases own policy. The value type is the part people fear is lost, and it is not: encapsulating the representation behind a stable interface is exactly what a value object does. The aggregate simply adds policy to that object, and the addition is the whole difference. A value type changes when the representation changes; an aggregate changes when the representation, or any policy, or any rule on any field changes, which is every driver at once. That is why it becomes the system's hotspot, and why a change an entity would absorb in one private method is, for process-first, the same change located differently: representation in the value type, each policy in its own use case. The magnitude is equal; the location is not. New behavior is then an addition, a use case appearing while the old ones stay untouched, where the aggregate must be modified in place. Locating change by its driver is the cohesion test applied to data, and the aggregate fails it by fusing drivers the value object keeps apart.

There is an honest limit. In a domain dense with invariants that span many fields at once, a ledger or a tax engine, the stored state has real structure that is not just per-process accretion, and a record genuinely earns its place. That is the same corner where an entity carries cross-field invariants of its own. Data is not eliminated there; it is minimized to the invariants that genuinely span. The claim does not break at that edge; it changes magnitude. Most line-of-business software lives at the other end, process-rich and invariant-poor, and has been modeled entity-first out of habit rather than fit.

What is left when the data-modeling step is gone is a system whose stored state is the residue of its processes, whose every field has a creator, and whose every coupling is a word the business says. The architecture has no content the business did not put there.

---

## How ownership moves

The previous section fixed who owns a field at the moment it is created. Ownership is not frozen there. It has a lifecycle, and that lifecycle is what lets the model grow without rewriting itself.

There are four moments. A datum is *minted* when an operation first needs an identity to remember past its own run: the id, owned by the operation that creates it. It *accretes* as later operations fasten fields to that id, each field owned by the operation that produces it, written by that one owner and read by anyone. It *transitions* when its workflow state changes — the state machine is ownership in motion, each transition owned by the operation that performs it, all of them coordinated at the single state field. And over the system's life one of two things happens to it: it is absorbed, or it is emancipated.

**Absorption is the growth of the previous section, seen as a motion.** A record earns its place when a cross-field invariant summons a new owner that absorbs the field-groups; said as a motion, the pieces are not rewritten. A new owning process appears above them and takes them as its parts — it owns the cross-part invariant and the right to read the parts, and nothing else; the parts keep their own write-logic untouched and run inside the new process as steps. The only new code is the guard the invariant requires. A spanning rule adds a parent; it does not edit the children. That is the whole answer to the worry that a new rule forces a rewrite of everything the rule touches.

**Emancipation is the same motion run backward.** A field one operation owned acquires a second, independent reason to change — another authority now writes it too, or it starts to vary on its own cadence. It leaves its old owner and becomes its own, the others reaching it through the shared primitive it has become. Absorption gathers the pieces an invariant binds; emancipation releases the piece a driver has split. What restructures in both is the ownership, not the data's existence — the field's values persist; their owner changes. Where the new owner lives in a different store, that re-home is a schema migration: the deliberate, rare, costed coordination point the data section named, never a free byproduct of the redraw. In a system already built, emancipation is a refactoring move with a name: the god-object is a field-cluster several drivers came to own at once, and prying loose the one whose driver has diverged is this same motion performed after the fact.

**The hierarchy absorption builds is the telescope, read from the data side.** A part is owned data together with the process that owns it, and a part is a Leaf to its parent — the same fractal the altitudes are made of. And the invariant that summoned the parent is a change driver: it is the single reason all the parts must now change together. So absorption is an altitude emerging, driven from the data rather than from policy, and the force that groups use cases into a workflow is the force that gathers fields under a record. Where data comes from, how the telescope is built, and how the change driver is found are three views of one structure.

---

## The four shapes

Every value a process handles has one of four shapes, and the shape is a domain statement, not a stylistic choice. They are type-honest: the type says what the domain knows about the value. A type's capacity to carry a business statement rather than merely a layout is its *semantic potential* — the term is William Jackson's — and the four shapes are the first place the methodology spends it.

- **`T`** — the value exists, unconditionally. No absence, no failure, no waiting.
- **`Option<T>`** — the value may or may not exist, and its absence is a domain fact, not an error.
- **`Result<T>`** — the operation may or may not have produced the value; failure is a typed outcome carried in the type, synchronous.
- **`Promise<T>`** — the value arrives later, and may fail; `Promise<T>` carries both the asynchrony and the failure.

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

How those steps reach one another is a second question, and it has two answers. In **direct step composition**, a step calls the next and composes on the result it returns: the chain is written out, output feeding input, the shape every pass of this book uses by default. In **event-based step composition**, a step publishes a typed fact and the next is triggered by it: the same steps, wired through events rather than return values. The two are not a timing distinction — direct composition is still `Promise`-based and non-blocking; the difference is whether coordination rides the return path or a published fact. It is not an altitude distinction either: a use case's steps can compose either way without becoming anything other than that use case. Which substrate a given composition uses is an architectural choice, decided in Architecture Synthesis against the system's Phase-4 inputs; the methodology names both and prefers neither.

---

## The telescope

The methodology's organizing structure is a telescope: the same vocabulary at successive scales. Each scale is an **altitude** — the book's one word for the level you are reasoning at, and the term every chapter leans on, so it is worth fixing here. There are four. A **use case** is one business operation — one trigger, one outcome — the lowest altitude. A **workflow** is a composition of use cases for one business outcome. A **subsystem** is a coherent business concern, a cluster of workflows. A **system** is the composition of subsystems, the top of the telescope. To *climb* is to move to a higher altitude, where each unit below is now a whole composition seen from outside; to *descend* is to open one unit into the composition it is. There is a rung above the system, the enterprise, but the book stops at the system on purpose: above the system the composing force is organizational and strategic, Conway's law and the shape of the business itself, not change-driver cohesion the code can express. The telescope reaches as far as its mechanism holds, and no further.

That one trigger need not be an external actor. A use case fires from one of three sources: an external request (a user at a screen, an inbound API call); a published event another process emitted; or the invocation of another use case or workflow that composes it as a step. It is the same use case under each — only what pulls it differs. Naming the three dispels the picture of use cases as a flat list of screen handlers: most of a mature system's use cases are triggered by other use cases, and the telescope is the shape that invocation traces.

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

That question has two directions, and a grouping is right only when both hold. **Completeness**: is every unit this driver governs inside the group, or are some scattered elsewhere, so that one change has to chase them across modules — the smell teams know as shotgun surgery? **Purity**: is only what this driver governs inside, or is a foreign unit riding along, so that its unrelated changes leak in as accidental coupling? The sharpened test asks both at once: does this one change force *all* of these, and *only* these, to change? Pass both and the group is cohesive; pass one and it is not.

The same criterion, derived independently and given formal shape, is [Yannick Loth's Independent Variation Principle](https://dev.to/yannick555/the-principle-of-independent-variation-as-a-thought-framework-4aaa): unify elements with the same change-driver assignment, separate those with different ones. Process-First Design reaches the criterion from the process side; the Independent Variation Principle reaches the same partition from the change-driver side — two paths to one territory. The methodology uses change-driver cohesion as its own; it recognizes IVP as corroboration, not foundation.

Loth gives the cohesion behind the test its own formal account in [*On the Nature of Cohesion*](https://doi.org/10.5281/zenodo.20785752): cohesion as correctness relative to a modularization principle, along exactly these two axes. Process-First Design's change driver is one such principle, so the convergence IVP named now reaches cohesion itself — and the same account explains why the old structural metrics never captured it, since they measure what code shares rather than what governs it.

One consequence of the telescope is worth stating because the spiral relies on it: a unit's composition at one altitude is a Leaf at the altitude above. A workflow is a composition of use cases, and a Leaf to its subsystem. A subsystem is a composition of workflows, and a Leaf to its system. The patterns recur because the structure is fractal.

Because the structure is fractal, it is also how the code is organized. The altitudes are not only the order in which the design is discovered; they are the order in which a reader navigates the codebase, browsing from system to subsystem to workflow to use case — which is the answer to the worry about a flat list of a thousand use cases. The companion volume, Java Backend Coding Technology, names the package realization of this the *telescope rule*: each altitude becomes a package level that appears only when the design discovers it, the use cases below moving under it, while shared code settles at the lowest altitude that covers all its users.

---

## Finding the change driver

The cohesion test asks whether a grouping is right — *does one change force all of these, and only these?* It does not say how to find the change driver the test turns on, and that is the judgment the methodology leans on most. A change driver is a *reason code changes*: a force that, when it moves, forces the code to move with it. A boundary is right when everything inside changes for the same reason, and nothing outside changes for that reason.

The criterion is not new. Three independent lines of design thinking converge on it — Parnas's information hiding (decompose by hiding the decisions *likely to change*), Löwy's volatility-based decomposition (decompose by what *varies*, not by function), and the Independent Variation Principle named above (partition by *change-driver assignment*). Five decades, three directions, one criterion.

There are two ways to find the drivers. **Ask forward**, at the desk, the question the three converge on: *who, or what, would ask for this to change?* Each independent decision authority is a driver — a stakeholder or team, a regulator, an external partner on its own release schedule, a pricing policy, a technical concern such as storage. Two independent authorities able to demand changes to one unit means two drivers, and a split. Parnas sharpens it — *what is the riskiest decision here, the one that would ripple widest if it changed?* — and Löwy sharpens it again — *what varies over time for one user, and across users now; what would a competitor do differently?*

**Measure backward**, on an existing codebase: the version-control history does not lie about how the system actually changes. Files that change together in the same commits share a driver; if they live in different modules, a driver is cutting across a boundary. What you would argue at the desk, the history can confirm or correct. Cadence is a further tell — parts that change weekly do not belong with parts that change yearly.

Two cautions complete the picture, and they are mirror images. The first is the inverse of *what stays shared*: **similarity is not a change driver.** Code that looks alike, even identical today, may answer to different drivers; merging it couples what the domain leaves separate, so before sharing, ask whether the pieces change for the same reason. The second is the converse: a cohesive unit may legitimately answer to *more than one* driver. An adapter between two interfaces changes when either changes, and splitting it to separate them destroys the mediation it exists for — not a fault but essential coupling, two drivers the domain itself binds together. Cohesion is not about the *number* of drivers a unit carries; it is about carrying exactly the ones its job requires, and no others.

One consequence reaches past the code. The *who would ask for this to change* question makes change drivers organizational — an authority that requests changes is usually a team — so change-driver boundaries and team boundaries should coincide. Where they persistently diverge, it shows as cross-team coordination for a single change, or as coordination forced across a boundary drawn on a team line rather than a domain one. That divergence is worth attention rather than alarm: a signal that the unit of ownership and the unit of change have come apart.

Finding a driver is one thing; tracking which use case answers to which is another, and it is what makes the search scale. Without it, deciding whether a set of use cases is cohesive is a pairwise question, asking of each pair whether the two belong together, which is quadratic in the number of use cases and re-run from scratch every time one is added. Label each use case with its driver once, and cohesion stops being a comparison and becomes a sort: units that share a driver are the cohesive groups, and a new use case is placed by its label rather than weighed against all the others. The change driver is the key that turns a quadratic similarity search into a near-linear partition, which is the Independent Variation Principle read as a procedure.

The artifact is a plain register, use case against driver, and it does triple duty: it is the grouping itself; it is the completeness-and-purity checklist, asking whether a driver's column holds all and only its use cases; and it is what version-control history can confirm, since use cases that share a driver should change together in the commits. A use case that lands in two columns is not an error but a sighting — an adapter or a boundary, the place to look for essential coupling.

A driver is not a fixed fact about the world; it is the current shape of the business's volatility, and that shape moves. A new authority appears and a new driver with it; a concern that varied as one pulls into two; two that drifted independently begin to move together. When the set of drivers changes, the partition it induced changes, and the code restructures to match — which is exactly what absorption and emancipation are: a new spanning driver gathers parts under a new owner, a diverging driver releases one to its own. The register — those sorted heaps made literal — is therefore live, not written once, and the version-control history is where a driver's movement first shows: a coupling that strengthened until two heaps were really one, or weakened until one was really two. This also names the commonest origin of legacy decay: a driver moved and the code did not follow, leaving a structure partitioned for a business that no longer exists. Code is downstream of process, process of the drivers, the drivers of the business; keeping the reflection current as the business moves is not maintenance overhead but the same work continued.

---

## The recovery triple

When something is invalidated — a step fails after earlier steps have changed state — there are three responses, and the methodology names all three where most discourse names only the first.

- **BER (Backward Error Recovery)** — compensate by an inverse action. Release the held seat, void the authorization, reverse the entry. The classic rollback or saga shape.
- **FER (Forward Error Recovery)** — continue with degraded state rather than undoing. Defaults under partial failure, a notification queued for retry while the booking stands, a value allowed to decay through `fresh → stale → expired`.
- **Design-out** — change the model so the invalidation cannot arise. An immutable log corrected by appending rather than overwriting; a reservation model where two bookings of one seat is structurally impossible; an idempotent operation safe to repeat.

Which applies is a judgment across four axes — reversibility, forward-progress value, domain shape, coordination cost — and mixed strategies are normal: a system can use BER for money, FER for telemetry, and design-out for collaborative state, coherently, at once. The spiral surfaces which response each altitude reaches for; the full selection mechanism is the Architecture Synthesis module's work.

---

## Designing out contention

Design-out earns a second look where the invalidation is a race — two processes reaching for the same state at once. The recovery triple's instinct, change the model so the bad state cannot arise, has a specific shape here, and it is one principle with a small family of tactics. The principle: move the contention to a single named coordination point, and make the conflicting state impossible to write rather than something detected after it is written.

The tactics are the ways to make it impossible:

- **Derive, don't store** — a value you can recompute from authoritative facts is not stored at all, so it has no second copy to fall out of step; availability is the absence of an active reservation, never a flag that says *free*.
- **Single-writer fields** — a field with exactly one owning operation needs no coordination, because nothing else can race it.
- **The guarded transition** — the one field several processes do write, the workflow's state, changes only as a guarded transition, so the conflict is resolved at the single point it lives and nowhere else.
- **Declarative constraints** — push the impossibility into the store: a uniqueness or exclusion constraint makes two bookings of one seat a write the database refuses, so the race is lost by construction, not by a check.
- **Serialized intake** — where order itself is the hazard, a per-entity queue makes a new event meet only a fully-processed prior one, never a half-applied one.

Each tactic removes a race by removing the thing that could be in two states at once. What is left needing coordination is the irreducible business contention, and the methodology funnels it to one visible transition where it is designed out rather than locked around. Locking is the admission that the conflict was left constructible; design-out is the decision that it never was.

---

## Reading the spiral

That is the whole vocabulary. The spiral now applies it — four passes through one running example, event ticketing, at successive altitudes. Pass 1 takes a single use case, *buy a ticket*, and answers the decisions Spiral 0 raised, in full. Pass 2 lets workflows emerge as use cases multiply. Pass 3 lets subsystems emerge as workflows cluster. Pass 4 reaches the whole platform.

One thing to watch as you read: how little is new after the first pass. The vocabulary does not grow; each altitude reuses it and adds only the small delta that altitude makes visible. The passes get shorter as they climb, and that is deliberate — not the book running out of things to say, but the telescope doing exactly what it claims. Keep that in view; by the end it will be the clearest evidence the methodology offers about itself.

The spiral begins at the smallest unit of the work: one customer, one seat, one event.
