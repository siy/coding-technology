# Glossary

The methodology's vocabulary, defined once. These terms are the shared spine the companion volumes build on: *Java Backend Coding Technology* gives each its Java realization and keeps its own appendix for the Pragmatica-level terms this glossary does not cover. A term's home section is named in parentheses.

---

## A

**Absorption.** The growth move by which a cross-field invariant spanning several parts summons a new owning process that wraps them: the parts keep their own write-logic and run inside the new owner as steps, while it owns only the cross-part guard. The dual of *emancipation*. (How ownership moves.)

**Accretion.** How an entity comes to be — fields attach to an id one at a time as processes learn durable facts, so the stored record is a running total of what has been committed about that id, never authored as a whole. (Where data comes from.)

**Altitude.** A level of the telescope: use case, workflow, subsystem, or system. Altitudes are not imposed; they emerge as units at one level cohere into a unit at the next. (The telescope.)

**Aspects.** The pattern for cross-cutting concerns that wrap operations uniformly — business cross-cutting (audit, compliance) is part of the design; technical cross-cutting (logging, tracing, retries) is supplied by the runtime. (The patterns.)

## B

**BER (Backward Error Recovery).** The first member of the recovery triple: undo an invalidated step by an inverse action — release the held seat, void the authorization. The classic rollback or saga shape. Series long name: *compensate-by-inverse*. (The recovery triple.)

**Boundary contract.** What a subsystem owns at its edge — what another subsystem must send to ask it for something, what it returns, which failures it exposes — composed from its internal types rather than invented anew (*composed-not-invented*). (Spiral 3.)

## C

**Change driver.** A reason code changes: a force that, when it moves, forces the code to move with it. A boundary is right when everything inside changes for the same reason and nothing outside changes for that reason. Distinct from a *trigger*, and itself not fixed — change drivers evolve as the business does. (Finding the change driver.)

**Change-driver cohesion.** The grouping criterion: units cohere when a single change driver governs them, so one change would force all of them, and only them, to change together. Tested along two axes, *completeness* and *purity*, and made operational by *driver attribution*. (The telescope; Finding the change driver.)

**Completeness.** One axis of the cohesion test: is every unit a driver governs inside the group, or are some scattered elsewhere so one change must chase them across modules — the smell of shotgun surgery? (The telescope.)

**Condition.** The pattern that branches on a business fact, routing between legitimate alternatives; typed, never a bare boolean where the fact carries meaning. (The patterns.)

## D

**Data as residue.** The claim that data is not designed but precipitates from processes: a field exists only because some operation writes it and some operation reads it, so stored state is downstream of process, not prior to it. (Where data comes from.)

**Derive, don't store.** Prefer recomputing a value from authoritative facts over storing a redundant copy that can drift — availability is the absence of an active reservation, never a stored `free` flag. A tactic of design-out. (Designing out contention.)

**Design-out.** Changing the model so an invalidation cannot arise rather than recovering after the fact — the third member of the recovery triple, and, for races, a family of tactics that move contention to one coordination point and make the conflicting state unconstructible. (The recovery triple; Designing out contention.)

**Direct step composition.** Wiring steps by calling the next on the value the previous returns, the chain written out, output feeding input. Contrast *event-based step composition*. (Foundations.)

**Driver attribution.** Attributing each use case to the change driver that moves it, then grouping the use cases that share one — the move that replaces a pairwise *do these belong together?* comparison with a single labeling pass and a sort. What makes cohesion *quasi-linear*. (Finding the change driver.)

## E

**Emancipation.** The growth move by which a field or part that gains its own independent change driver separates from its old owner to become its own. The dual of *absorption*. (How ownership moves.)

**Event-based step composition.** Wiring steps by having one publish a typed fact that triggers the next, rather than calling it on a return value. Both are Promise-based and non-blocking; the difference is whether coordination rides the return path or a published fact. (Foundations.)

## F

**FER (Forward Error Recovery).** The second member of the recovery triple: continue with degraded state rather than undoing — a notification queued for retry while the booking stands, a value allowed to decay through fresh → stale → expired. Series long name: *degrade-and-continue*. (The recovery triple.)

**Fork-Join.** The pattern for independent steps run in parallel and joined. (The patterns.)

**The shapes.** The four type-honest shapes a value can have: `T` (exists unconditionally), `Option<T>` (may be absent, as a domain fact), `Result<T>` (may have failed, synchronously), `Promise<T>` (arrives later and may fail). (Foundations.)

**The four-way split.** That an entity-first aggregate fuses identity, lifecycle state, representation, and policy, while process-first keeps them apart — id, state machine, value object, and use cases — so each varies independently. (Where data comes from.)

## H

**Honest limit.** The acknowledged edge of the data-as-residue claim: in domains dense with cross-field invariants (a ledger, a tax engine) stored state has real structure and a record genuinely earns its place; data is minimized there, not eliminated. (Where data comes from.)

## I

**id as seed.** That persisted state begins at an identity — the one field that needs no other, minted by an operation — and grows outward from it; you can have an id with no fields, but never a field with no id. (Where data comes from.)

**Independent Variation Principle (IVP).** Yannick Loth's criterion: unify elements with the same change-driver assignment, separate those with different ones. Process-First Design reaches the same partition from the process side. (The telescope.)

**Information hiding.** Parnas's criterion: decompose by hiding the design decisions most likely to change, so the module list follows the change list rather than the flowchart. (Finding the change driver.)

**Iteration.** The pattern for a step applied across a collection. (The patterns.)

## L

**Leaf.** The atomic unit of composition: a boundary crossing (I/O, an external call) or a pure computation. Everything else composes Leaves. (The patterns.)

## O

**Ownership.** The relation that every datum has one creating owner — the operation that mints it; writes are owned, reads are open. Ownership has a lifecycle (minted, accreted, transitioned, then absorbed or emancipated) and restructures around stable data as the system grows. (How ownership moves.)

## P

**Parse, don't validate.** Enforce a type's claim at construction so an invalid value cannot exist, letting downstream code trust the value without re-checking. Enforcement has four levels; the Java implementation uses the construction level — a non-public constructor and a factory returning `Result<T>`. (Foundations.)

**Process.** The unit of design: a thing that happens — a trigger producing an outcome — and an act of knowledge gathering. Types belong to processes, not the reverse. (Introduction; Foundations.)

**Purity.** One axis of the cohesion test: is only what a driver governs inside the group, or is a foreign unit riding along so its unrelated changes leak in as accidental coupling? (The telescope.)

## Q

**Quasi-linear cohesion.** The property *driver attribution* buys: because each use case is placed by its own driver rather than weighed against every other, the cost of keeping a decomposition cohesive grows quasi-linearly with the number of use cases — a labeling pass and a sort — instead of quadratically, as pairwise comparison would. (Finding the change driver.)

## R

**Read-write staleness.** The contention single-writer ownership does not remove: an operation reads a field another operation owns, decides on the value it saw, and commits after that value has moved. Nothing is written twice — the write that happens was authorized by an expired fact. Reshapeable claims design out; a predicate over a set (a count, a sum) includes rows that do not exist yet, and designs out only by materializing the predicate as one guarded field, which every capability changing it must then maintain. (Designing out contention.)

**Recovery triple.** The three responses to an invalidated step — BER (compensate), FER (continue degraded), and design-out (make the invalidation impossible) — where most discourse names only the first. (The recovery triple.)

## S

**Semantic potential.** William Jackson's term for a type's capacity to carry a business statement rather than merely a layout; the shapes are the first place the methodology spends it. (Foundations.)

**Sequencer.** The pattern for steps in order, each feeding the next, short-circuiting on the first failure. (The patterns.)

**Shared primitive.** What actually couples two processes — an id, a state enum, the value type of a field they both touch — each of which is a word the business actually says. Two processes writing different fields of one row are not coupled by co-location. (Where data comes from.)

**The patterns.** The sufficient set of composition primitives, the same six at every altitude: Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects. (Foundations.)

**State machine.** The single field several processes write — the workflow's state (free, held, confirmed, cancelled) — written only as a typed transition, never an overwrite, so the one point needing coordination is the transition. Its type is named with a `*State` suffix, variants bare — a rule the companion *Java Backend Coding Technology* makes explicit. (Where data comes from; Designing out contention.)

**Subsystem.** A coherent business concern, a cluster of workflows cohering under one domain driver; a Leaf to its system. (The telescope.)

**System.** The composition of subsystems and the top of the telescope; above it is the enterprise, governed by organizational forces that code structure cannot express. (The telescope; Closing.)

## T

**Telescope.** The methodology's organizing structure: the same vocabulary at successive scales — use case, workflow, subsystem, system — where a unit's composition at one altitude is a Leaf at the altitude above. (The telescope.)

**Trigger.** What fires a use case: an external request, a published event, or the invocation of another use case or workflow. Distinct from a change driver, which is what forces a use case to *change*. (The telescope.)

## U

**Use case.** One business operation — one trigger, one outcome — and the floor of the telescope, composed internally from the patterns and never from steps that could be triggered on their own. Deliberately not the classic (Jacobson/Cockburn) use case: trigger-centric rather than actor-centric, and a structural unit rather than a narrative document. (The telescope.)

## V

**Volatility-based decomposition.** Löwy's criterion: decompose by what varies, not by function; encapsulate the volatile and leave the nature of the business alone. (Finding the change driver.)

## W

**Within-altitude composition / cross-altitude grouping.** The two operations that recur at every altitude: composition (how units at an altitude compose into one, via the patterns) and grouping (how units of the level below cohere to form one, via change-driver cohesion). (The telescope.)

**Workflow.** A composition of use cases for one business outcome, cohering under one business policy; a Leaf to its subsystem. The altitude at which a step becomes independently triggerable and state must survive between steps — the workflow owns that spanning state machine. (The telescope.)
