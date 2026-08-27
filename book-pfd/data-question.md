# The Data Question

*The design is done. Every use case is named, every driver attributed, every failure typed — and someone asks the question that has been waiting the whole time: fine, but what does the database look like? The answer is not a diagram anybody drew. It is what the processes left behind. That residue has a shape, the shape holds under pressure, and it gives way in exactly three places. This chapter is those three places.*

---

## What this chapter does

*Foundations* derived the model in a few paragraphs and then moved on, because the derivation is short: data is the residue a process leaves behind, persistence begins at an identity, fields fasten to that identity as steps learn them, a field exists only if some operation produces it and some operation reads it, and each field is written by the one operation that owns it. That is the whole model. It fits on a card, and Card 6 is that card.

**A model that short invites the suspicion that something was skipped.** It arrives without an entity-relationship diagram, without aggregate boundaries, without the modelling session everyone expects, and the natural reading is that the method deferred the hard part rather than dissolved it. This chapter takes the derivation and pushes it until it breaks. It does break — in three places, and only three — and each break has an answer that costs something specific and nameable.

The chapter is not a defence. **The places where the model gives way are more interesting than the places it holds**, because two of the three turn out to cost nothing at all, and the third is a genuine pressure the methodology has to absorb rather than argue away.

## Three occasions, and only three

The claim that draws fire is that the whole record never comes together. Stated flatly it is false, and any reporting query refutes it. Stated precisely it is the load-bearing claim in the model.

The precise form: **the whole assembles freely; what never assembles is a shared write path.** Decomposition here constrains write authority, not read shape. *Foundations* already says so in passing — each field is *written by that one owner and read by anyone* — and that half-sentence is the whole asymmetry. Reads may assemble anything. Writes stay partitioned by owner, always.

Once the claim is stated that way, the exceptions enumerate. **The whole materializes on exactly three occasions, and they sort by whether the assembled whole has a writer:**

| Occasion | Writer | What it costs |
|---|---|---|
| The read path — a report, an export, any query spanning owners | none | nothing; no writer means no coupling |
| A cross-field invariant spanning owners | one, the new parent | a guard, and the closure it binds |
| Erasure | universal, and keyed by a different identity | the model's own single-writer property |

The rest of this chapter walks that ladder. The first rung is free, the second is priced, and the third is where the methodology owes an honest answer.

## Assembly without a writer

A month-end report reads a booking's seat, its holder, its price tier, its payment reference and its cancellation status, all at once, from five owners. That is the whole record, materialized. **It costs nothing, because nothing about assembling a record for reading creates a path along which two processes can conflict.**

This is worth stating plainly because the fear behind the objection is real, and it is not about reading. The fear is the shared mutable model: the `Booking` class every process loads, mutates and saves, where one team's new field breaks another team's write. Reading assembles a value and discards it. There is no second copy to fall out of step, no write to order against another write, no lock to take. **A read is a photograph, not a claim.**

Two consequences follow, and they are the reason the read path deserves a paragraph rather than a footnote.

The first is that read and write may legitimately have different shapes. If a query pattern is heavy enough and stable enough, projecting the fields it wants into a shape built for it is an ordinary move, not a compromise of the model — the projection has no writer either, and it is derived from facts that keep their owners. The Architecture Synthesis module turns that into a decision with a name, unified or separated, and gives the conditions under which separating earns its cost. **The property belongs here; the decision belongs there.**

The second is a caution the free rung hides. **A read that feeds a decision is not free** — it is the read-write staleness this chapter returns to at the end, and the report is only harmless because nobody writes anything on the strength of it.

## The closure, not the entity

The second occasion is the one *Foundations* names as the case where a record earns its place: a new rule appears that must hold across fields owned by different operations. A ticket cannot be marked *refunded* unless its payment is *settled* and its seat is *released*. Three owners, one rule.

The instinct is to say the entity has an invariant, and to conclude that the entity was real all along. **What the rule binds is not the entity. It is its own closure — the fields the invariant spans, plus anything transitively bound by another invariant sharing a field.** That closure is normally a proper subset of everything hanging off the id, often a small one. A booking may carry twenty fields and have exactly three inside any invariant closure; the other seventeen keep their single writers and their independence, and no rule has any opinion about them.

**The entity is what you get by assuming every closure on an id is one closure.** That assumption is the fossilizing move: it takes a real constraint over three fields and promotes it to a boundary over twenty, and then every future change to any of the twenty has to argue with a guard that was never about it. The seam appears at the invariant and nowhere else, and the closure is the precise statement of *nowhere else*.

There is a formal reason the closure is where the cost lands, and it explains a limit the methodology has otherwise only asserted. **Decomposing state by owner is lossless with respect to data and lossy with respect to constraints.** Every fact survives the split — the fields are all still there, each with its writer. A predicate over a single field survives it too, because the field has one home and the check has one place to sit. A predicate over several fields does not survive: it has to be re-imposed across the pieces, which means a join, or a spanning transaction, or a guard held by something above them. Nothing was lost from the data and something was genuinely lost from the constraints, and that asymmetry is the whole of what a spanning invariant costs.

## Three responses to a spanning invariant

*Foundations* gives one answer — a new owner absorbs the closure — and presents it as the answer. It is the third of three, and reaching for it first concedes more than the rule asks. **The responses run in increasing order of how much decomposition they preserve, and the first that fits is the one to take.**

**Change the invariant's modality.** Not every rule has to hold at every commit. Where the business tolerates a window, the invariant can be held at reconciliation instead — a detecting process finds the violation and a forward recovery repairs it, and no writer is ever shared. This is the cheapest response and the one with a price that must be stated rather than assumed: **inside the window the invariant is observably violated, and someone is looking at the violation.** Who that is, and for how long, is a business question with a business answer. A refund reconciled nightly is often fine; a seat double-sold for an hour is not.

**Push it into the store.** A uniqueness or exclusion constraint makes the violating write impossible rather than detectable. The application never assembles a whole and never holds a guard; the store refuses the write and the race is lost by construction. This works whenever the invariant is expressible declaratively over rows, which is more often than teams expect and is the same tactic *Designing out contention* reaches for below.

**Materialize the closure.** A new owning process appears above the fields the invariant binds, owns the cross-part guard and the right to read the parts, and nothing else. **A spanning rule adds a parent; it does not edit the children.** The parts keep their write logic untouched and run inside the new process as steps, and the only new code is the guard the invariant requires. That is the whole answer to the worry that a new rule forces a rewrite of everything it touches.

**Materialization is forced only when all three fail** — the closure covers most of the record, the rule must hold at every commit, and it is not declaratively expressible. That is a real corner, and it is the ledger corner this chapter reaches at the end. Naming all three narrows the concession rather than widening it: most spanning rules never get to the third response.

## How ownership moves

Who owns a field is fixed at the moment it is created. **Ownership is not frozen there. It has a lifecycle, and that lifecycle is what lets the model grow without rewriting itself.**

A datum is *minted* when an operation first needs an identity to remember past its own run: the id, owned by the operation that creates it. It *accretes* as later operations fasten fields to that id, each owned by the operation that produces it, written by that one owner and read by anyone. It *transitions* when its workflow state changes — the state machine is ownership in motion, each transition owned by the operation that performs it, all of them coordinated at the single state field. And over the system's life one of two things happens to it: it is absorbed, or it is emancipated.

**Absorption is the third response above, seen as a motion.** The pieces are not rewritten; a new owning process appears over them and takes them as its parts.

**Emancipation is the same motion run backward.** A field one operation owned acquires a second, independent reason to change — another authority now writes it too, or it starts to vary on its own cadence. It leaves its old owner and becomes its own, the others reaching it through the shared primitive it has become. Absorption gathers the pieces an invariant binds; emancipation releases the piece a driver has split. What restructures in both is the ownership, not the data's existence — the field's values persist; their owner changes. Where the new owner lives in a different store, that re-home is a schema migration: the deliberate, rare, costed coordination point the data model named, never a free byproduct of the redraw. In a system already built, emancipation is a refactoring move with a name: the god-object is a field-cluster several drivers came to own at once, and prying loose the one whose driver has diverged is this same motion performed after the fact.

**The hierarchy absorption builds is the telescope, read from the data side.** A part is owned data together with the process that owns it, and a part is a Leaf to its parent — the same fractal the altitudes are made of. And the invariant that summoned the parent is a change driver: it is the single reason all the parts must now change together. So absorption is an altitude emerging, driven from the data rather than from policy, and the force that groups use cases into a workflow is the force that gathers fields under a record.

## Severance

Absorption and emancipation both move ownership. There is a third motion, and it moves something else.

**Sometimes the facts must stay and the identity must go.** A customer exercises a right to be forgotten; the booking cannot simply vanish, because the venue's accounts for that quarter are built on it and the tax authority has its own opinion about how long they live. What is destroyed is not the accretion. It is the link between a person and the accretion — after which the facts remain, correct and owned as before, attached to an identity that no longer names anybody.

**Severance is not a motion of ownership.** No field changes owner; every writer keeps its field and its rules. What is withdrawn is the seed. The id was the one piece of state that needed no other, the thing every field was a fact *about*, and severance cuts what the id refers to while leaving the id in place. The accretion degrades to anonymous aggregate: still a coordinate, still consistent, no longer about a person.

It is also the only motion in the model whose driver is not the business. Minting, accretion, absorption and emancipation all answer to somebody who wants the system to do something. **Severance answers to a regulation, and the design has to accommodate a change driver that no stakeholder asked for and none can negotiate with.**

## Retention

*Foundations* says each attached field carries four things: a name, an owner, the operations permitted on it, and the fact that it can be created at all. A fifth follows from the second rather than joining the list.

**A field's lifespan is its owner's lifespan.** The operation that creates a field creates it for a purpose, and that purpose answers to an authority — a tax obligation, a consent, a contractual term, a legitimate interest that expires. Retention is not an extra property somebody remembers to attach. It is what you get by asking the owning operation how long its output stays useful and who says so.

The consequence is that **retention is per-field, because ownership is.** A booking's payment reference answers to years of financial record-keeping. Its marketing-contact preference answers to a consent that can be withdrawn this afternoon. Its seat assignment stops mattering when the event ends. One record, three lifespans, and no contradiction — because there was never one lifecycle to contradict.

This is where entity-first pays a cost that is easy to miss. **A row has one lifecycle, so an entity model has to pick one, and then every field whose real answer differs is either kept too long or deleted too early.** Teams discover this as a compliance problem and treat it as a data-retention project bolted on afterwards, when it was a modelling consequence all along. Per-field ownership hands per-field lifespan over for free, and the change driver behind it — the authority that sets the period — lands in the register like any other.

The model is indifferent to the kind of state it holds: a configuration value is owned state like any other — written by operations rather than by a business capability, read by anyone, on its own cadence, under its own authority.

## Erasure

Erasure is the third occasion, and it is the one that presses hardest. It breaks two of the model's rules at once, and the honest thing is to name both before answering.

**It is keyed differently.** The accretion is keyed by an id some process minted — a booking, a payment, a ticket. Erasure is keyed by the *data subject*, an identity that cuts across every one of those, plus the logs, the queues, the warehouse and the backups. Establishing which facts belong to one person is exactly the cross-cutting map the methodology otherwise never has to draw, because every other question is answered by asking one operation about its own field.

**It is a universal writer.** Every other field in the system has one owning operation, which is what made coordination unnecessary. Erasure writes all of them, regardless of owner. The single-writer property that carries most of this chapter's argument does not hold for this one process.

Three tactics answer it, in the methodology's own vocabulary.

**Fan-out** treats erasure as a Fork-Join over per-owner *forget this subject* Leaves. Each owner still writes only its own fields, so the single-writer property survives at every leaf; what is universal is the composition, not the writes. The cross-cutting map exists, but it exists as a design-time artifact — the change-driver register already lists every owner, so the fan-out is read off something the method produced anyway. **This is the faithful answer, and it has to be proved complete rather than assumed:** completeness and purity, the same test the register applies to use cases, applied to data.

**Crypto-shredding** is design-out. Encrypt every subject-linked field under a per-subject key and erasure destroys the key, which collapses a universal write into a single-writer write on one field. It is also the only tactic that reaches an immutable log or an offline backup, and that matters more than it first appears. **The recovery triple offers an immutable log corrected by appending as a design-out tactic, and a right to erasure cannot be honoured against one.** Those two commitments collide directly, and a book that recommends both owes the reader the collision. Where both apply, the key is the only thing that can be destroyed, so the log keeps its integrity and its subject-linked contents become unreadable.

**Severance** is the case above: usually the facts cannot be removed at all, and only the link is destroyed.

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

## The same shape, reached from the other side

The model in this chapter was derived from ownership: who writes a field, and what follows from the answer. It is not the first route to this shape, and it would be a poor argument if it were.

Relational theory arrived at the same decomposition decades earlier from an entirely different question. Asking what makes a relation *irreducible* — Date and Darwen's line of work — yields relations that cannot be split further without losing information, which in practice means one fact per relation, each with its own key. **The sixth normal form reached by that route and the accretion reached by this one describe the same stored shape, and neither knew about the other.** Anchor modelling builds a working method on it, and bitemporal ledger designs land nearby for reasons of their own: a fact, its identity, its time, and no composite row anybody has to author as a whole.

One distinction keeps the corroboration honest, because the two decompositions are not decomposing the same thing. **Normalization decomposes relations; this chapter decomposes write authority.** They coincide in shape and diverge in what they permit: nothing here forbids two fields with different owners from sharing a physical row, and *Foundations* says so directly — two processes writing different fields of one row are uncoupled at runtime, sharing only a schema. Storage layout is a separate decision, taken later and for different reasons. What the model constrains is who may write, not where the bytes sit. The data this chapter models is the system's state; the form its persistence takes is outside the methodology's scope, and deliberately so.

**That the two routes converge is the corroboration, not the derivation.** Normalization reached it by asking what update anomalies a schema permits; process-first reaches it by asking who owns each fact. The same argument shape appears elsewhere in this book — several independent thinkers arriving at change-driver decomposition from different starting points — and it carries the same weight here. A structure that only one route reaches is a preference. A structure two unrelated routes reach is a property of the problem.

## The honest limit

In a domain dense with invariants that span many fields at once — a ledger, a tax engine, a settlement system — the closures stop being small and start overlapping until they cover most of the record. The rules must hold at every commit, they are not expressible as constraints over rows, and reconciliation windows are exactly what the domain exists to prevent. All three responses fail, materialization is forced, and the record that results has real structure that is not per-process accretion.

**The claim does not break there; it changes magnitude.** Data is not eliminated in such a domain, it is minimized to the invariants that genuinely span — which is a smaller record than an entity-first model would have drawn, arrived at by knowing exactly which fields the rules bind and leaving the rest alone. The closure is still doing its work; there is simply more of it.

What is worth being clear about is how much software lives there. Most line-of-business systems are process-rich and invariant-poor: many operations, few rules that span owners, and a long history of being modelled entity-first out of habit rather than fit. **A methodology should be judged by where it is honest about its edges, and this is the edge.**

What is left, everywhere else, is a system whose stored state is the residue of its processes, whose every field has a creator and a lifespan, whose reads may assemble anything and whose writes never share a path, and whose every coupling is a word the business actually says.

That residue has a derivable shape. Grain, transaction boundaries, identity, what is enforced where — each follows from the closures, the owners, and the lifespans this chapter has named, the way topology follows from cadence divergence. That derivation is synthesis work, and it belongs to *Architecture Synthesis*; what this chapter owes it is the register, complete.
