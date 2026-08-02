# Foundations

*Spiral 0 ended on a promise: the decisions a use case forces have a small, fixed set of answers. This chapter is that set. It is the shortest kind of chapter to write and the easiest to underestimate — a vocabulary, not an argument. Everything the spiral does afterward is this vocabulary, applied.*

---

## What this chapter does

The previous chapter raised the decisions every use case forces and claimed they have simple, consistent answers. This chapter names the pieces those answers are built from. It defines; it does not demonstrate. Demonstration is the spiral's job — four passes that take this vocabulary and apply it at use-case, workflow, subsystem, and system altitude — the four scales of the telescope, defined under *The telescope* below. Read this once and refer back to it; nothing here needs to be memorized, because the spiral will use every piece often enough to make it stick.

**The vocabulary is deliberately small, and closed: the shapes a value takes, the patterns that compose them, the properties that specify a process, three recovery classes, two axes of cohesion, and one organizing structure over them all — a handful of short, fixed lists in total.** That smallness is the point Spiral 0 made: a vocabulary you can hold in your head is one you apply from memory, the same way every time. The list below is the whole of it. The reason the vocabulary never outgrows what you can hold as you read is that the list does not grow as the altitudes climb.

---

## Process-first

**The stance the whole methodology rests on, stated plainly: the unit of design is the process, not the entity.** What you design is a thing that *happens* — a trigger producing an outcome — not a thing that *is*. Data structures are shaped by the processes that use them, not by a model of the domain that exists prior to any use.

**The immediate consequence is that types belong to processes.** A "customer" in *buy ticket* is the shape buying needs; a "customer" in registration is the shape registering needs; they are different types that happen to share a noun. What is genuinely common — an identifier, a money amount, a thing that means exactly the same wherever it appears, its change-driver set independent of any one process — is a small shared value object. Everything else is local to the process that uses it.

**This is a bet, and it is worth naming as one.** Entity-first design — one shared model of each domain concept, used everywhere — has a real advantage: no duplication, one place to look. Process-first appears to give that up — but what looks like duplication usually is not. The genuinely-common part factors out into a shared value object; what stays per-process answers to *different* change drivers, so a "customer" in one process and a "customer" in another are not one type duplicated but two that vary for different reasons. What process-first actually pays is not a DRY violation but more type declarations and the discipline of telling a shared value object from a per-process type. The bet is that this cost grows slower, at enterprise scale, than the coupling cost of one shared model — which couples every process that touches it, so a change for one risks all — so that past a certain scale process-first is cheaper to maintain. The spiral does not argue this bet; it shows the methodology operating and lets the reader judge whether the result is the kind of code they want to maintain. The bet's scope is bounded: enterprise backend, where systems are large and long-lived enough for the coupling cost to bite. The methodology does not claim to be the right tool below that scale or outside that domain.

**None of this is a ban on entities.** An entity earns its place when a business invariant genuinely spans more than one field — when a whole assembled from individually-valid fields can still be invalid, so the combination needs guarding, not each field alone. Its role is to enforce that cross-field invariant during persistence: it is the composite every write to that state passes through, so the store can never hold a combination the invariant forbids. Process-first changes only the default — the process is the unit of design, and an entity is introduced where a cross-field invariant demands one, not placed at the centre of the domain because a concept happens to have a name.

---

## The properties of a process

**A process has the same set of properties at every altitude — that is what makes the telescope below possible.** Their granularity changes as you climb; the list does not.

- **Trigger — what makes the process run: an incoming request, a scheduled tick, an event, a human approval resolving.** The trigger is not the transport that carries it; HTTP versus a queue is not a different trigger. A process needs at least one trigger and may have several (a fulfilment process can begin from a purchase or from a restock), but its *outcome* is what defines it: the same outcome reached through different triggers is one process, while the same steps performed for a different outcome are different processes.
- **Typed input — what the process needs to begin, as a precise type carrying exactly that and no more.**
- **Typed output — what the process produces on success.**
- **Typed failures — the enumerable, closed set of ways it can fail, each a named domain fact, part of the specification rather than an exception raised elsewhere.**
- **Steps — its internal sequence of operations, named in domain terms and visible at the altitude they belong to.**
- **Dependencies — the graph between the steps: what must precede what, what can run in parallel, what is conditional.**

Name these for any process and it is, in the methodology's terms, specified. The spiral walks the same set at each altitude, with the steps becoming use cases, then workflows, then subsystems as it climbs.

**Naming them is already a verification step, not only a specification one.** To fill in the typed failures you must enumerate every way the process can end badly; to fill in the dependencies you must say what genuinely must precede what; to fill in the typed input you must state the least the trigger can carry. A flaw in the design shows up as a property you cannot complete — an outcome with no failure named for it, a step that needs a fact no earlier step produces — and it shows up *now*, at design time, on one page, before a line is written. Entity-first defers this: an entity declares its fields and says nothing about which operations touch it, how they fail, or in what order, so the failure modes and the ordering surface later, in implementation or in production. Process-first front-loads the discovery of flaws, because specifying a process *is* walking its outcomes.

---

## A process gathers knowledge

**Underneath these properties is a simpler way to see what a process is: an act of knowledge gathering.** A process begins knowing only its trigger and its input, and each step acquires one more piece of what it needs — *buy ticket* learns that the request is well-formed, then that the event is selling, then that the seat is held, then that the payment cleared. The process ends, success or failure, the moment it knows enough to answer. A declined payment is not a missing outcome but knowledge in its own right, enough to answer *the ticket cannot be sold*, so the process stops there rather than gather what it no longer needs. Typed failures and short-circuiting are not machinery bolted on; they are the process recognizing it is done.

**This is also why the types belong to the process.** Ask of a domain "what data exists?" and the answer is entities: one `Customer`, one `Order`, one shared shape every process must accept. Ask instead "what does *this* process need to know?" and the answer is the per-process types the methodology produces — the smallest input the trigger carries, the typed knowledge each step adds, the closed set of facts, failures included, that let the process answer. Process-first is what falls out when you model around the knowledge a process gathers rather than the data a system stores.

Not every step adds to that store. Some only confirm a precondition (the caller is entitled, the request within its rate) and nothing downstream reads their result; they gate the process without enriching it. The test is whether a later step needs the outcome: when it does, the step must carry it forward as knowledge the next step consumes, for a result some later step depends on, discarded once tested, is the loss *parse, don't validate* warns against, one boundary inward. When nothing does, the check is a pure gate, and its single fact — *the process may continue* — is spent the moment it does.

---

## Where data comes from

Process-first design seems to have a hole in it. A process consumes data and produces data, so to describe a process you need the data first; but the data model is supposed to fall out of the processes, not precede them. Which comes first?

Neither, because **data is not a thing you design. It is the residue a process leaves behind.** The chicken-and-egg only bites if you believe data has an existence of its own, waiting to be modeled. It does not. A field of stored state exists for exactly one reason: some operation writes it and some operation reads it. A column no process produces and no process consumes is unobservable and unproducible. There is nothing there to design. So data is not prior to process, and not even concurrent with it; data is downstream, the way a compiled program is downstream of its source.

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

**When a record earns its place. One case looks like a counterexample. A new feature appears that must write two field-groups together, under an invariant that spans both.** This does not break the model; it grows it. The feature is a new owner, and it absorbs those groups as subcomponents. The processes that wrote them before now write through it. The seam appears exactly at the invariant and nowhere else, and the realization that *these have to move together now* is itself a change in the business: the discovery of a governance boundary that did not exist yesterday.

The familiar aggregate is the fossil of one such absorption: a write-need that once justified a boundary, frozen into a noun that persists after the need has moved. Process-first keeps the boundary a verb, an owning operation, so when the need moves the ownership moves with it and nothing fossilizes. This is why aggregates rot: they record an absorption and then stop recording.

**What the aggregate fuses is four things that vary independently: the identity, the lifecycle state, the representation of what is stored, and the policy that acts on it.** Process-first keeps them apart. The id mints identity, the state machine owns state, a value type owns the representation, and the use cases own policy. The value type is the part people fear is lost, and it is not: encapsulating the representation behind a stable interface is exactly what a value object does. The aggregate simply adds policy to that object, and the addition is the whole difference. A value type changes when the representation changes; an aggregate changes when the representation, or any policy, or any rule on any field changes, which is every driver at once. **That is why it becomes the system's hotspot, and why a change an entity would absorb in one private method is, for process-first, the same change located differently: representation in the value type, each policy in its own use case. The magnitude is equal; the location is not.** New behavior is then an addition, a use case appearing while the old ones stay untouched, where the aggregate must be modified in place. Locating change by its driver is the cohesion test applied to data, and the aggregate fails it by fusing drivers the value object keeps apart.

**The same dissolution is reachable from another axis.** Rico Fritzsche's *command context consistency* principle reaches it on concurrency grounds — an aggregate is a *static* consistency boundary, while the facts any one decision actually reads change from command to command — where this book reaches it on change-driver grounds. The ownership discipline that follows removes most of the contexts such a principle has to guard; what survives it is the read-write staleness named later in this chapter.

**There is an honest limit. In a domain dense with invariants that span many fields at once, a ledger or a tax engine, the stored state has real structure that is not just per-process accretion, and a record genuinely earns its place.** That is the same corner where an entity carries cross-field invariants of its own. Data is not eliminated there; it is minimized to the invariants that genuinely span. The claim does not break at that edge; it changes magnitude. Most line-of-business software lives at the other end, process-rich and invariant-poor, and has been modeled entity-first out of habit rather than fit.

What is left when the data-modeling step is gone is a system whose stored state is the residue of its processes, whose every field has a creator, and whose every coupling is a word the business says. The architecture has no content the business did not put there.

---

## How ownership moves

The previous section fixed who owns a field at the moment it is created. **Ownership is not frozen there. It has a lifecycle, and that lifecycle is what lets the model grow without rewriting itself.**

A datum is *minted* when an operation first needs an identity to remember past its own run: the id, owned by the operation that creates it. It *accretes* as later operations fasten fields to that id, each field owned by the operation that produces it, written by that one owner and read by anyone. It *transitions* when its workflow state changes — the state machine is ownership in motion, each transition owned by the operation that performs it, all of them coordinated at the single state field. And over the system's life one of two things happens to it: it is absorbed, or it is emancipated.

**Absorption is the growth of the previous section, seen as a motion.** A record earns its place when a cross-field invariant summons a new owner that absorbs the field-groups; said as a motion, the pieces are not rewritten. A new owning process appears above them and takes them as its parts — it owns the cross-part invariant and the right to read the parts, and nothing else; the parts keep their own write-logic untouched and run inside the new process as steps. The only new code is the guard the invariant requires. **A spanning rule adds a parent; it does not edit the children.** That is the whole answer to the worry that a new rule forces a rewrite of everything the rule touches.

**Emancipation is the same motion run backward.** A field one operation owned acquires a second, independent reason to change — another authority now writes it too, or it starts to vary on its own cadence. It leaves its old owner and becomes its own, the others reaching it through the shared primitive it has become. Absorption gathers the pieces an invariant binds; emancipation releases the piece a driver has split. What restructures in both is the ownership, not the data's existence — the field's values persist; their owner changes. Where the new owner lives in a different store, that re-home is a schema migration: the deliberate, rare, costed coordination point the data section named, never a free byproduct of the redraw. In a system already built, emancipation is a refactoring move with a name: the god-object is a field-cluster several drivers came to own at once, and prying loose the one whose driver has diverged is this same motion performed after the fact.

**The hierarchy absorption builds is the telescope, read from the data side.** A part is owned data together with the process that owns it, and a part is a Leaf to its parent — the same fractal the altitudes are made of. And the invariant that summoned the parent is a change driver: it is the single reason all the parts must now change together. So absorption is an altitude emerging, driven from the data rather than from policy, and the force that groups use cases into a workflow is the force that gathers fields under a record. Where data comes from, how the telescope is built, and how the change driver is found are three views of one structure.

---

## The shapes

**Every value a process handles has a shape, and the shape is a domain statement, not a stylistic choice.** They are type-honest: the type says what the domain knows about the value. A type's capacity to carry a business statement rather than merely a layout is its *semantic potential* — the term is William Jackson's — and these shapes are the first place the methodology spends it. The spending is not lost in realization: the companion coding technology preserves these statements through implementation — return types, `Option` parameters, and the composition operators carry the same domain facts the shapes declare — so finished code reads back as the process it implements. *Hide the machinery, keep the meaning*, as JBCT names it.

- **`T` — the value exists, unconditionally. No absence, no failure, no waiting.**
- **`Option<T>` — the value may or may not exist, and its absence is a domain fact, not an error.**
- **`Result<T>` — the operation may or may not have produced the value; failure is a typed outcome carried in the type, synchronous.**
- **`Promise<T>` — the value arrives later, and may fail; `Promise<T>` carries both the asynchrony and the failure.**

Asynchrony emerges from leaves: any operation that touches I/O is a `Promise`, and the `Promise` propagates outward through everything that depends on it. It is not a decision made at the top; it is a fact that rises from the bottom.

A type carries a claim — a `CustomerId` claims to be a valid identifier, a `Money` claims to be a non-negative amount in a known currency — and construction is where the claim is enforced. **This is *parse, don't validate*: the value cannot exist in an invalid state, so code that receives it can trust it without re-checking.** The enforcement has levels, strongest to weakest, and the methodology's commitment is identical across all of them; only the teeth differ:

1. **Type-level** — a refinement or dependent type the compiler rejects when invalid. Strongest; available only where the language supplies it.
2. **Construction-level** — a non-public constructor and a factory that returns `Result<T>`, so no invalid value can be built. This is the level the Java implementation uses.
3. **Runtime-level** — validation at the boundary, catching invalid values when they occur rather than preventing their construction.
4. **Convention-level** — discipline and review, with nothing in the code enforcing it.

The shape and the enforcement together are why a process body is free of defensive checks: the types arriving have already made their claims good.

---

## The patterns

**Composition has a small, fixed set of primitives, and the same set composes a process at every altitude.** Each maps to a recognizable shape of work; together they are sufficient, and the methodology adds no others.

- **Leaf — an atomic unit: a boundary crossing (I/O, an external call) or a pure computation. The bottom of composition; everything else composes Leaves.**
- **Sequencer — steps in order, each feeding the next, short-circuiting on the first failure.**
- **Fork-Join — independent steps run in parallel and joined.**
- **Condition — a branch on a business fact, routing between legitimate alternatives. Typed, never a bare boolean where the fact carries meaning.**
- **Iteration — a step applied across a collection.**
- **Aspects — cross-cutting concerns that wrap operations uniformly: business cross-cutting (audit, compliance — part of the design) and technical cross-cutting (logging, tracing, retries — supplied by the runtime).**

**Each function implements exactly one pattern; mixing patterns is the signal to split.** The patterns are not invented by the methodology — practitioners arrived at them independently, and they parallel the constructs business-process notations have used for decades. The methodology recognizes the structure rather than imposing it.

How those steps reach one another is a second question, and it has two answers. In **direct step composition**, a step calls the next and composes on the result it returns: the chain is written out, output feeding input, the shape every pass of this book uses by default. In **event-based step composition**, a step publishes a typed fact and the next is triggered by it: the same steps, wired through events rather than return values. The two are not a timing distinction — direct composition is still `Promise`-based and non-blocking; the difference is whether coordination rides the return path or a published fact. It is not an altitude distinction either: a use case's steps can compose either way without becoming anything other than that use case. Which substrate a given composition uses is an architectural choice, decided in Architecture Synthesis against the system's Phase-4 inputs; the methodology names both and prefers neither.

---

## The telescope

**The methodology's organizing structure is a telescope: the same vocabulary at successive scales.** Each scale is an **altitude** — the book's one word for the level you are reasoning at, and the term every chapter leans on, so it is worth fixing here. **A use case is one business operation — one trigger, one outcome — the lowest altitude. A workflow is a composition of use cases for one business outcome. A subsystem is a coherent business concern, a cluster of workflows. A system is the composition of subsystems, the top of the telescope.** To *climb* is to move to a higher altitude, where each unit below is now a whole composition seen from outside; to *descend* is to open one unit into the composition it is. There is a rung above the system, the enterprise, but the book stops at the system on purpose: above the system the composing force is organizational and strategic, Conway's law and the shape of the business itself, not change-driver cohesion the code can express. The telescope reaches as far as its mechanism holds, and no further.

That one trigger need not be an external actor. A use case fires from one of three sources: an external request (a user at a screen, an inbound API call); a published event another process emitted; or the invocation of another use case or workflow that composes it as a step. It is the same use case under each — only what pulls it differs. Naming the three dispels the picture of use cases as a flat list of screen handlers: most of a mature system's use cases are triggered by other use cases, and the telescope is the shape that invocation traces.

**Altitudes are not imposed; they emerge from multiplicity.** One use case is one use case. When several cohere, a workflow appears. When several workflows cohere, a subsystem appears. The methodology lets the emergence happen rather than forcing a hierarchy in advance.

Two operations recur at every altitude, and keeping them distinct is essential:

- **Within-altitude composition** — how the units *at* an altitude compose into one unit — is the patterns. It happens at every altitude, including the use case (its steps compose via Sequencer, Leaf, Fork-Join).
- **Cross-altitude grouping** — how units of the level below *cohere to form* a unit at this level — happens only where a level is formed from a lower one. It is **change-driver cohesion**: units cohere when a single business force governs them, when one change would force them all to change together.

**The recognition test for grouping is one question, asked at each transition: what business change would force all of these to change together?** If a single force rewrites them all, they cohere. The mechanism is identical at every transition; the *kind* of driver differs by altitude:

| Transition | Units grouped | Change-driver character |
|---|---|---|
| use cases → workflow | use cases | a business policy (reservation rules, refund rules) |
| workflows → subsystem | workflows | a domain concern (the booking domain, the pricing model) |
| subsystems → system | subsystems | the product/platform boundary + operational envelope |

The use case is the floor of this ladder: the smallest business-meaningful unit, not formed by grouping a lower *business* altitude. Its steps are internal composition, not a lower altitude — so the grouping question begins at the workflow and recurs upward, while the use case has only within-altitude composition.

**That floor is also the rule that separates a use case from a workflow when the two blur.** A use case decomposes into *patterns* — Sequencer, Leaf, Condition — and nothing more; its steps are not themselves business operations you could trigger on their own. The moment a step *is* independently triggerable, or state must survive between steps so a later trigger can resume, you have left the use case: that spanning state belongs to a workflow, and the workflow is the unit that owns it. *Hold a seat* is a use case — its steps (check availability, mark the seat held, start the hold timer) are patterns, meaningless on their own. *Book and pay for a reservation* is a workflow — *hold* and *pay* are each independently triggerable, and the held-then-paid state lives between them. The discriminator is not the number of steps; it is whether a step could stand alone under its own trigger, and whether state has to outlive a single invocation.

A reader who knows the classic use case should read this term as a deliberate departure, not a restatement of it. Three differences carry weight. It is *trigger-centric, not actor-centric*: Jacobson's use case is an observable result of value to an actor, which would exclude the event-triggered and use-case-invoked cases named above; this book's turns on the trigger, whoever or whatever pulls it. It is a *structural unit composed from patterns, not a narrative document*: there is no scenario-with-extensions to write, because the composition is the specification. And it places a unit on an *altitude* where Cockburn uses goal levels: summary, user-goal, and subfunction become positions on the telescope, decided by the mechanical rule just given rather than by how a goal reads. The lineage is real; the deviations are on purpose, because the telescope needs a boundary you can check, not one you argue.

The grouping question has two directions, and a grouping is right only when both hold. **Completeness: is every unit this driver governs inside the group, or are some scattered elsewhere, so that one change has to chase them across modules — the smell teams know as shotgun surgery?** **Purity: is only what this driver governs inside, or is a foreign unit riding along, so that its unrelated changes leak in as accidental coupling?** **The sharpened test asks both at once: does this one change force *all* of these, and *only* these, to change?** Pass both and the group is cohesive; pass one and it is not.

The criterion the cohesion test turns on, this book reaches from the process side: you find the change driver because you are already describing what the process does. Yannick Loth arrives at the same criterion independently and gives it a name — the [Independent Variation Principle](https://dev.to/yannick555/the-principle-of-independent-variation-as-a-thought-framework-4aaa): unify elements with the same change-driver assignment, separate those with different ones. One line, reached from practice here and stated as a principle there.

What this book has of that criterion is a working scheme, drawn from use; what Loth builds around it is a formal account. In [*On the Nature of Cohesion*](https://doi.org/10.5281/zenodo.20785752) he grounds cohesion rigorously — as correctness relative to a modularization principle, along the very two axes the test already leans on — and the change driver turns out to be one such principle. Putting an empirical intuition on a formal footing is work these pages neither did nor set out to do; that Loth has done it, independently, is a gift to the idea, and the credit for the rigor is his. His account is also the one that explains why the old structural metrics missed cohesion for so long — they measure what code shares, where the change driver measures what governs it.

One consequence of the telescope is worth stating because the spiral relies on it: a unit's composition at one altitude is a Leaf at the altitude above. A workflow is a composition of use cases, and a Leaf to its subsystem. A subsystem is a composition of workflows, and a Leaf to its system. **The patterns recur because the structure is fractal.**

Because the structure is fractal, it is also how the code is organized. The altitudes are not only the order in which the design is discovered; they are the order in which a reader navigates the codebase, browsing from system to subsystem to workflow to use case — which is the answer to the worry about a flat list of a thousand use cases. The companion volume, Java Backend Coding Technology, names the package realization of this the *telescope rule*: each altitude becomes a package level that appears only when the design discovers it, the use cases below moving under it, while shared code settles at the lowest altitude that covers all its users.

---

## Finding the change driver

The cohesion test asks whether a grouping is right — *does one change force all of these, and only these?* It does not say how to find the change driver the test turns on, and that is the judgment the methodology leans on most. **A change driver is a *reason code changes*: a force that, when it moves, forces the code to move with it.** A boundary is right when everything inside changes for the same reason, and nothing outside changes for that reason.

The criterion is not new. **Three independent lines of design thinking converge on it — Parnas's information hiding (decompose by hiding the decisions *likely to change*), Löwy's volatility-based decomposition (decompose by what *varies*, not by function), and the Independent Variation Principle named above (partition by *change-driver assignment*).** Five decades, three directions, one criterion.

**There are two ways to find the drivers.** **Ask forward, at the desk, the question the three converge on: who, or what, would ask for this to change?** Each independent decision authority is a driver — a stakeholder or team, a regulator, an external partner on its own release schedule, a pricing policy, a technical concern such as storage. Two independent authorities able to demand changes to one unit means two drivers, and a split. Parnas sharpens it — *what is the riskiest decision here, the one that would ripple widest if it changed?* — and Löwy sharpens it again — *what varies over time for one user, and across users now; what would a competitor do differently?*

**Measure backward, on an existing codebase: the version-control history does not lie about how the system actually changes.** Files that change together in the same commits share a driver; if they live in different modules, a driver is cutting across a boundary. What you would argue at the desk, the history can confirm or correct. Cadence is a further tell — parts that change weekly do not belong with parts that change yearly.

Two cautions complete the picture, and they are mirror images. The first is the inverse of *what stays shared*: **similarity is not a change driver.** Code that looks alike, even identical today, may answer to different drivers; merging it couples what the domain leaves separate, so before sharing, ask whether the pieces change for the same reason. The second is the converse: a cohesive unit may legitimately answer to *more than one* driver. An adapter between two interfaces changes when either changes, and splitting it to separate them destroys the mediation it exists for — not a fault but essential coupling, two drivers the domain itself binds together. Cohesion is not about the *number* of drivers a unit carries; it is about carrying exactly the ones its job requires, and no others.

One consequence reaches past the code. The *who would ask for this to change* question makes change drivers organizational — an authority that requests changes is usually a team — so change-driver boundaries and team boundaries should coincide. Where they persistently diverge, it shows as cross-team coordination for a single change, or as coordination forced across a boundary drawn on a team line rather than a domain one. That divergence is worth attention rather than alarm: a signal that the unit of ownership and the unit of change have come apart.

Finding a driver is one thing; tracking which use case answers to which is another, and it is what makes the search scale. Without it, deciding whether a set of use cases is cohesive is a pairwise question, asking of each pair whether the two belong together, which is quadratic in the number of use cases and re-run from scratch every time one is added. Attribute each use case to its driver once — the move this book calls **driver attribution** — and cohesion stops being a comparison and becomes a sort: one pass to attach the labels, then the use cases that share a driver fall out as the cohesive groups, and a new use case is placed by its label rather than weighed against all the others. **Driver attribution is the key that turns a quadratic similarity search into a quasi-linear partition — the property this book names *quasi-linear cohesion*, and the Independent Variation Principle read as a procedure.**

The artifact is a plain register, use case against driver, and it does triple duty: it is the grouping itself; it is the completeness-and-purity checklist, asking whether a driver's column holds all and only its use cases; and it is what version-control history can confirm, since use cases that share a driver should change together in the commits. A use case that lands in two columns is not an error but a sighting — an adapter or a boundary, the place to look for essential coupling.

**A driver is not a fixed fact about the world; it is the current shape of the business's volatility, and that shape moves.** A new authority appears and a new driver with it; a concern that varied as one pulls into two; two that drifted independently begin to move together. When the set of drivers changes, the partition it induced changes, and the code restructures to match — which is exactly what absorption and emancipation are: a new spanning driver gathers parts under a new owner, a diverging driver releases one to its own. The register — those sorted heaps made literal — is therefore live, not written once, and the version-control history is where a driver's movement first shows: a coupling that strengthened until two heaps were really one, or weakened until one was really two. This also names the commonest origin of legacy decay: a driver moved and the code did not follow, leaving a structure partitioned for a business that no longer exists. Code is downstream of process, process of the drivers, the drivers of the business; keeping the reflection current as the business moves is not maintenance overhead but the same work continued.

---

## Where the structure comes from

Process-first asks you to decompose a system into use cases and let workflows, subsystems, and the system itself emerge as they cohere. On a toy that is obvious. On a real system it looks impossible: a vision worth building has hundreds or thousands of operations, and no one — not the sponsor, not the domain expert, not the architect — holds the whole business in their head. So the objection writes itself. If you cannot see the whole, how do you cut it into use cases at all, and where does the structure come from? This is the complexity domain-driven design was built to survive, and it is a fair place to press.

The answer is that you never decompose the whole vision at once, because you never have to. You take one operation — *book a seat* — and you finish it: its trigger, its typed failures, its steps, the data it leaves behind. Then you take the next. The elephant is eaten one bite at a time, and the reason that works is that a use case is complete in itself; finishing one does not require having finished, or even seen, the other nine hundred.

Here is the part the methodology usually leaves implicit, though it is the most important thing about it. **Each bite is a question you put to the business, not a decision you make at your desk.** The cohesion test — *who would ask for this to change? what varies here, and across whom?* — is not a design puzzle solved by thinking harder. It is an interview question. The change driver behind an operation is a fact about the business's own volatility, and the only place that fact lives is the business. So decomposition is not modelling-in-a-room; it is a structured conversation, and its governing rule is short: **nothing about the business without the business.**

Every answer is written down once, in the change-driver register — the running list of *use case ↔ driver* the previous section introduced. The register is the transcript of the conversation. It grows one line per bite, and it never asks the same question twice: once a driver is named, the next use case that answers to it is filed under it, not re-interrogated.

That economy is the whole discipline, and it is what separates this from the two failures on either side of it. Unstructured requirements-gathering asks the business everything, drowns in answers, and still misses the one that mattered. Big design up front asks the business to hand over the entire domain before a line is written — which, as its own practitioners concede, no one in a large organization can do. Process-first asks neither. The telescope tells you which altitude you are at, and the cohesion test tells you the one question that altitude forces; you ask it, record the answer, and move. **The structure is what bounds the questions, so you spend the business's attention and never abuse it.**

Ask enough of those questions and something happens to the register worth watching for, because it is where this section's title is answered. The use cases that share a driver are already a group; give the group a name and it is a workflow. The workflows that share a concern are already a cluster; name it and it is a subsystem. You did not sit down and design a hierarchy. You asked the business what varies, wrote the answers in a list, and the list sorted itself into the telescope. **The structure precipitates from the register the way data precipitates from process — one level up, by the same mechanism.** *Where data comes from* and *where the structure comes from* are the same answer, given twice.

Follow a single bite all the way down and the descent has a floor you can see. A use case decomposes into steps; the steps compose by the patterns; a step that is a boundary crossing or a pure computation is a Leaf, and a Leaf cannot be split — it is one thing. You split until you hit atoms, and then you stop, and you can *see* that you have stopped, because there is nothing left inside a Leaf to divide. The companion volume walks this in Java, step by step, down to the last leaf; here the point is only that **the decomposition is not open-ended — it bottoms out in code so simple it cannot be argued with.**

This is also where the fear of the branchy, ballooning use case is put to rest. Where an operation varies — a seat that may be one seat or a set of reservations, a section that may be numbered or standing — the variation is resolved into a bound value before the body runs, so the body stays a straight sequence of steps with no fork inside it. The use case does not swell to cover the cases; it calls a step whose implementation was chosen at the edge. And because each use case is this simple and this self-contained, **a thousand of them is a thousand independent descents to Leaves, not one thousand-way tangle — which is the real reason a vision comes apart into use cases naturally.** Scale here is repetition of something small, not accumulation of something large.

One decision along the way deserves a name, because it is where the method does its quietest and deepest work. When a step could be left inline or given its own independent implementation, you make it independent the moment the register shows that it varies — even if, today, it has exactly one form. That independent step is not a premature abstraction, and the distinction is the whole of it: you are not extracting it because it *might* vary, which is the speculation the data gate forbids; you are extracting it because the business has *told you* it varies, which is knowledge. **An independent step is a change driver made physical — a business fact recorded in the one place it cannot drift from the truth, the shape of the code.** A reader fluent in the vocabulary sees that step standing on its own and reads it correctly: the business flexes here. It is one more element of the business preserved in the structure, legible to anyone who knows the language, current by construction.

Miss the call and nothing breaks. If you left a step inline and a second form later arrives, you promote it then — a mechanical extraction that touches the first use case once, at precisely the cost the equivalent move carries in object-oriented design when a strategy it did not foresee finally appears. The register minimizes the misses, the step discipline keeps each one cheap, and the honest claim is not that use cases are independent by magic, but that they are independent to the exact degree the conversation with the business has reached — which is a claim you can stand behind.

How far that conversation can reach is itself set by the business, and it is not always the same distance. Where the volatility is already realized — a system with history, a domain someone has lived — the driver is a fact you can measure, and the version-control record confirms or corrects what the interview claimed; where it is not — a young company still deciding what it will become — the same question returns a prediction rather than a fact, and businesses are routinely wrong about their own future. There the register holds the answer as a low-confidence prior, marked as such, and lets the co-change history promote it to a measured driver as the system earns a past — so **the thin end is real but self-correcting**, and, because a young system has little built, cheap to correct when the history finally speaks.

The register is not written once. A business evolves, and its change drivers move with it — one appears, two that were one pull apart, two that drifted together merge. When a driver moves, the structure re-forms to follow. But watch what actually changes: **a driver moving reorganizes the hierarchy — which use case sits under which workflow — it does not rewrite the units.** Because each use case and each Leaf is self-contained, restructuring is relocation, not surgery. The same business change that forces an entity-first model to be rewritten, and everything coupled to it along with it, costs process-first a re-grouping of pieces that individually do not change. It is the coupling-cost bet seen from the maintenance side: change is a transform — extract, move, regroup — never a rewrite.

Step back and the whole shape of the thing inverts the usual order. You did not need to understand the business before you could build it; you understood it *by* building it, one recorded answer at a time. What is left when the last bite is eaten is not only a working system but a precise, multi-resolution, always-current model of the business — its operations at use-case altitude, its policies at workflow altitude, its concerns above that, its facts and their owners in the data. The model every enterprise pays to have drawn and then declines to trust, drawn here by no one — derived instead from what was actually built and actually asked, and therefore unable to lie. Nobody knew the whole business, and nobody had to; the method's job was to manufacture that knowledge as it went. Which is the last thing to see, and the simplest: every move in this chapter — a field admitted as residue, a group named by its driver, a record earned by an invariant, a step made independent by a variation — is the same act on different material. **The methodology is not a way to structure code that happens to involve the business; it is a way to preserve the business in the structure of the code.** The architecture has no content the business did not put there — stated earlier as a constraint, it turns out to be the product.

---

## Attribution across contexts

The previous section put a limit on the conversation: it reaches only as far as the business can see its own volatility. That reach has two dimensions, and they vary independently. The first is whether the drivers are already written in the artifact — an existing codebase records how it has changed, and version-control history measures the drivers directly, while a system not yet built records nothing. The second is whether anyone remembers them — an established organization carries the drivers in the people who lived the changes, while a new company has no such memory to draw on. Project history and organizational history are separate axes, and where you stand on both decides what the interview can return.

The four corners are worth naming, because the method behaves differently in each.

| | Established org — memory | New org — no memory |
|---|---|---|
| **Brownfield** — git carries the drivers | Richest case: the history measures the drivers and the people corroborate them. | An inherited codebase with a new team: the history holds the drivers, but no one remembers them, so reading the register *builds* the memory the organization lacks. |
| **Greenfield** — no artifact yet | A new product inside a mature business: no code history, but real domain experience and a felt sense of how the domain moves. | A true startup: neither record nor memory, only borrowed history, and the register begins as a list of bets not yet placed. |

Two things move across this grid in opposite directions, and their crossing is what keeps the method honest at the thin end. Evidence is richest in the top-left corner and thinnest in the bottom-right — the true startup, predicting a future no one has lived. But the *cost of getting a driver wrong* runs the other way. A large, long-lived system in the top-left has mass to restructure when an attribution proves wrong; a young system in the bottom-right has a handful of use cases and little code, so a wrong guess is corrected by the same regrouping the previous section described — a transform, not a rewrite. **The place where the drivers are hardest to know is the place where knowing them wrong costs least** — not a lucky accident, but the coupling-cost bet holding at both ends of the grid.

What the register produces changes with the organizational axis too, and it is worth saying because the output is easy to mistake for a failure of the method. When the conversation surfaces a driver no one has settled — an ownership two teams both claim, a boundary no one has drawn — an established organization reads it as a governance finding: a decision the business needs to make, located exactly. A young company reads the same gap as an open strategic question: it has not yet decided what will vary, so the boundary cannot be drawn yet, and the register records the question rather than faking an answer. At the far greenfield corner the method is doing less decomposing than something else — it is a readiness instrument, telling the founders which structural questions they are still guessing at. The register there is not a map of the code; it is a list of the bets the business has not consciously placed.

One caution belongs with the borrowed history a startup leans on. A founder's previous companies and the incumbents' evolution are realized data, and they beat a whiteboard guess — but they mislead in exactly the case that matters most, when the young company's whole thesis is that the incumbents' volatility no longer applies. Borrowed history is a prior to hold loosely and mark low-confidence in the register, not a fact to attribute against as though the business had lived it. Which returns the method to its one honest rule: it does not invent the drivers, it elicits them, records them, and lets the history — borrowed at first, the system's own soon enough — confirm or correct what the conversation claimed.

---

## The recovery triple

**When something is invalidated — a step fails after earlier steps have changed state — there are three responses, and the methodology names all three where most discourse names only the first.**

- **BER (Backward Error Recovery; long name: *compensate-by-inverse*) — compensate by an inverse action. Release the held seat, void the authorization, reverse the entry. The classic rollback or saga shape.**
- **FER (Forward Error Recovery; long name: *degrade-and-continue*) — continue with degraded state rather than undoing. Defaults under partial failure, a notification queued for retry while the booking stands, a value allowed to decay through `fresh → stale → expired`.**
- **Design-out — change the model so the invalidation cannot arise. An immutable log corrected by appending rather than overwriting; a reservation model where two bookings of one seat is structurally impossible; an idempotent operation safe to repeat.**

**Which applies is a judgment across four axes — reversibility, forward-progress value, domain shape, coordination cost — and mixed strategies are normal: a system can use BER for money, FER for telemetry, and design-out for collaborative state, coherently, at once.** The spiral surfaces which response each altitude reaches for; the full selection mechanism is the Architecture Synthesis module's work.

---

## Designing out contention

Design-out earns a second look where the invalidation is a race — two processes reaching for the same state at once. The recovery triple's instinct, change the model so the bad state cannot arise, has a specific shape here, and it is one principle with a small family of tactics. The principle: **move the contention to a single named coordination point, and make the conflicting state impossible to write rather than something detected after it is written.**

The tactics are the ways to make it impossible:

- **Derive, don't store — a value you can recompute from authoritative facts is not stored at all, so it has no second copy to fall out of step; availability is the absence of an active reservation, never a flag that says *free*.**
- **Single-writer fields — a field with exactly one owning operation needs no coordination, because nothing else can race it.**
- **The guarded transition — the one field several processes do write, the workflow's state, changes only as a guarded transition, so the conflict is resolved at the single point it lives and nowhere else.**
- **Declarative constraints** — push the impossibility into the store: a uniqueness or exclusion constraint makes two bookings of one seat a write the database refuses, so the race is lost by construction, not by a check.
- **Serialized intake** — where order itself is the hazard, a per-entity queue makes a new event meet only a fully-processed prior one, never a half-applied one.

Each tactic removes a race by removing the thing that could be in two states at once. What is left needing coordination is the irreducible business contention, and the methodology funnels it to one visible transition where it is designed out rather than locked around. **Locking is the admission that the conflict was left constructible; design-out is the decision that it never was.**

### The contention the tactics do not remove

The five tactics all remove a race between two *writers*, and single-writer ownership is the very thing that hides the second kind. **A field with one writer cannot be raced; a decision that *reads* it can still go stale.** Operation A reads a field that operation B owns, decides on the value it saw, and commits after B has moved it. Nothing was written twice — the write that did happen was authorized by a fact that had already expired. Call it **read-write staleness**, to keep it apart from the write-write races above.

Four cases, and the tactics answer three:

| Conflict | The answer |
|---|---|
| Write-write, on different fields | single-writer ownership — no conflict to resolve |
| Write-write, on the workflow's state | the guarded transition |
| Read-write, on a fact with a unique key | a declarative constraint |
| **Read-write, on a predicate over a set** | **design-out, but by materializing the predicate — see below** |

**Where the claim is reshapeable, design-out still wins** — and that is the existing stance applied to a new case, not a new stance. *No booking overlaps these dates* is a predicate only until the thing actually claimed is written down as a row per interval claimed, at which point an exclusion constraint refuses the overlap and the race is lost by construction rather than detected after the fact. Reach for the reshape before reaching for a check around it.

The fourth row is where the interval reshape runs out, and where two of the tactics above pull against each other. *This customer holds fewer than six tickets for this event*, *reserved capacity is still under the cap* — a claim about a **set**, and the set includes rows that do not exist yet. A constraint cannot hold a row that has not been written, and a lock taken over the rows you counted does not cover the one a concurrent operation is about to add. The guard is narrower than the decision, which is why the interval reshape has nothing to work with here: counts and sums do not become rows.

**Design-out still reaches it, by a different tactic.** Materialize the predicate as one guarded field and put the guard in the write: an update that increments a stored count *and* carries `where count < limit` in the same statement, rejecting when it matches nothing. That is the guarded transition, applied to a count rather than to a workflow state, and the race is lost by construction exactly as it is there. The reshape was never into rows; it is into a single field one guard can sit on.

The price is the honest limit, and it is a collision between two tactics rather than an absence. **Derive, don't store** says the count should not exist, because it is recomputable from the bookings themselves. **The guarded transition** says it must exist, because a guard needs a field. Storing it means every capability that can change the predicate has to maintain it in the same transaction — a cancellation decrements only when its own guarded transition succeeds — and a capability that forgets leaves the stored count and the facts quietly disagreeing, which is the drift derive-don't-store exists to prevent. The alternative keeps the facts authoritative and pays elsewhere: validate the read set at commit, carrying the facts the decision rested on into the write and failing if any of them moved. An append-only log gets this one cheaply, since a query over events already selects the event that would invalidate it, phantom included; a mutable store has to be given the handle deliberately.

Either way, what is left is real. Two operations competing for one guest's booking budget genuinely conflict, and serializing them at that one field is the domain's own truth rather than a lock standing in for a design nobody did. **The tactics are a discipline, not a closure: they remove every race that can be designed away, and what remains is small, named, and priced rather than assumed absent.**

---

## Reading the spiral

**That is the whole vocabulary.** The spiral now applies it — four passes through one running example, event ticketing, at successive altitudes. Pass 1 takes a single use case, *buy a ticket*, and answers the decisions Spiral 0 raised, in full. Pass 2 lets workflows emerge as use cases multiply. Pass 3 lets subsystems emerge as workflows cluster. Pass 4 reaches the whole platform.

**One thing to watch as you read: how little is new after the first pass.** The vocabulary does not grow; each altitude reuses it and adds only the small delta that altitude makes visible. The passes get shorter as they climb, and that is deliberate — not the book running out of things to say, but the telescope doing exactly what it claims. Keep that in view; by the end it will be the clearest evidence the methodology offers about itself.

The spiral begins at the smallest unit of the work: one customer, one seat, one event.
