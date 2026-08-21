# Appendix B: Reference Cards

*One card per instrument. Definitions live in Foundations; these are for the desk.*

## Card 1 — Process-first

**The unit of design is the process, not the entity.** What you design is a thing that *happens* — a trigger producing an outcome — not a thing that *is*.

**Types belong to processes.** A "customer" in *buy ticket* is the shape buying needs; a "customer" in registration is the shape registering needs. What is genuinely common — an identifier, a money amount, its change-driver set independent of any one process — factors out into a small shared value object. Everything else is local.

**Six properties specify a process, at every altitude:** trigger · typed input · typed output · typed failures · steps · dependencies. The granularity changes as you climb; the list does not.

**A process is an act of knowledge gathering.** It begins knowing only its trigger and input; each step acquires one more piece of what it needs, and it ends — success or failure — the moment it knows enough to answer. Typed failures and short-circuiting are the process recognizing it is done.

*Not a ban on entities:* one earns its place when a business invariant genuinely spans more than one field, and its role is to guard that invariant during persistence.

## Card 2 — The shapes

| Shape | The domain statement |
|---|---|
| `T` | exists unconditionally — no absence, no failure, no waiting |
| `Option<T>` | may or may not exist; absence is a domain fact, not an error |
| `Result<T>` | may or may not have produced it; failure is typed, synchronous |
| `Promise<T>` | arrives later, and may fail |

Asynchrony **emerges from leaves** — any operation touching I/O is a `Promise` and it propagates outward. Not decided at the top.

**Parse, don't validate:** the type carries a claim, construction enforces it, so process bodies need no defensive checks. Enforcement levels, strongest first: type-level · construction-level · runtime-level · convention-level. The commitment is identical; only the teeth differ.

## Card 3 — The patterns

| Pattern | Shape of work |
|---|---|
| **Leaf** | atomic: a boundary crossing or a pure computation |
| **Sequencer** | steps in order, each feeding the next, short-circuit on first failure |
| **Fork-Join** | independent steps in parallel, joined |
| **Condition** | a branch on a business fact — typed, never a bare boolean |
| **Iteration** | a step applied across a collection |
| **Aspects** | cross-cutting wrappers: business (audit, compliance) and technical (logging, tracing, retries) |

**Each function implements exactly one pattern; mixing patterns is the signal to split.**

**Step composition, two substrates:** *direct* — a step calls the next and composes on the returned value. *Event-based* — a step publishes a typed fact and the next is triggered by it. Not a timing distinction, not an altitude distinction. Which one is an architectural choice.

## Card 4 — The telescope

**Use case** (one trigger, one outcome) → **workflow** (one business outcome) → **subsystem** (one business concern) → **system**. Stops at the system on purpose: above it the composing force is organizational, not cohesion the code can express.

| Transition | Change-driver character |
|---|---|
| use cases → workflow | a business policy (reservation rules, refund rules) |
| workflows → subsystem | a domain concern (the booking domain, the pricing model) |
| subsystems → system | the product boundary + operational envelope |

**A unit's composition at one altitude is a Leaf at the altitude above** — the patterns recur because the structure is fractal, which is also how the code is organized.

**Two operations, kept distinct:** *within-altitude composition* is the patterns and happens everywhere, including inside a use case. *Cross-altitude grouping* is change-driver cohesion and happens only where a level forms from the one below.

**Use case or workflow?** Not the number of steps — **whether a step could stand alone under its own trigger, and whether state has to outlive a single invocation.** *Hold a seat* is a use case; *book and pay* is a workflow.

**A use case fires from one of three sources:** an external request, a published event, or another use case composing it as a step. Most of a mature system's use cases are triggered by other use cases.

## Card 5 — The change driver

**A change driver is a reason code changes: a force that, when it moves, forces the code to move with it.** A boundary is right when everything inside changes for the same reason, and nothing outside changes for that reason.

**Two ways to find it.** *Ask forward* — who or what would ask for this to change? Each independent decision authority is a driver. *Measure backward* — version-control history records how the system actually changed; files changing together share a driver, and cadence is a further tell. **Co-change is partly endogenous**, since the current structure forces some of it: measure the co-change that *crosses a boundary*, and trust the coupling that survives a known restructure.

**The cohesion test, both directions at once:** does this one change force ***all*** of these, and ***only*** these, to change? (Completeness · Purity.)

**Driver attribution** — attribute each use case to its driver once, then the use cases sharing a driver fall out as the groups. Turns a quadratic similarity search into a **quasi-linear partition**.

**The register** — a plain table, use case against driver. Triple duty: the grouping itself; the completeness-and-purity checklist; and what version-control history can confirm. A use case in two columns is a sighting, not an error — an adapter or a boundary.

**Two cautions.** Similarity is not a change driver. And a cohesive unit may legitimately answer to more than one — cohesion is carrying exactly the drivers the job requires, not the fewest.

**And two in-band limits.** A trust boundary can require splitting what changes together — there the boundary governs. A concern that co-changes with everything (telemetry) partitions nothing.

*Convergent lineage:* Parnas (hide what is likely to change) · Löwy (decompose by what varies) · Loth (the Independent Variation Principle).

## Card 6 — Where data comes from

**Data is not a thing you design. It is the residue a process leaves behind.** There is no data-modelling step to perform.

**The id is the seed.** Persistence enters when a process first needs to remember something past its own run, and the first thing that exists is an identity and nothing else. Identity is the one piece of state that needs no other: every field is a fact about an identity; an identity is a fact about nothing but itself.

**The entity is an accretion, not a schema** — a running total of what processes have committed about one id, assembled by independent steps, never authored as a whole. The table someone wants to draw on day one is the integral of the accretions, written before the function.

**Every field carries four things:** a name · an owner (the operation that creates it) · the permitted operations · the fact that it can be created at all. A field exists if and only if some operation produces it and some operation reads it. Capturing-for-later passes the gate — name the producer and the consumer. The gate forbids only the orphan.

**One writer per field**, except the workflow's state field, which is a state machine written by guarded transition. So the single point needing coordination is the transition.

**Ownership has a lifecycle:** *mint* → *accrete* → *transition* → **absorb** (a spanning invariant summons a parent that takes the parts as steps — a spanning rule adds a parent; it does not edit the children) or **emancipate** (a field acquires a second independent reason to change and leaves its old owner).

**The whole assembles freely; what never assembles is a shared write path.** Reads may assemble anything, writes stay partitioned by owner. The whole materializes on exactly three occasions: the **read path** (no writer, so no cost), a **spanning invariant** (one writer, the new parent), and **erasure** (a universal writer, keyed by the data subject).

**A spanning rule binds its *invariant closure***, not the entity — the fields it spans plus anything transitively bound by an invariant sharing a field. Three responses, cheapest first: change the invariant's **modality** (hold it at reconciliation; price the window), push it into the **store** (a constraint refuses the write), or **materialize the closure** (absorption). Materialization is forced only when all three fail.

**Retention follows ownership** — a field's lifespan is set by the authority its owning operation answers to, so lifespan is per-field. **Severance** withdraws the identity while the facts stay: a motion of the seed, not of ownership.

*The honest limit:* in a domain dense with invariants spanning many fields — a ledger, a tax engine — stored state has real structure and a record genuinely earns its place. The claim changes magnitude there; it does not break.

## Card 7 — Recovery, and designing out contention

**Three responses to an invalidation. Check design-out first.**

- **Design-out** — change the model so it cannot arise: append-only correction, a structurally impossible double-booking, an idempotent operation.
- **BER** (*compensate-by-inverse*) — release the seat, void the authorization, reverse the entry.
- **FER** (*degrade-and-continue*) — defaults under partial failure, queue-for-later, `fresh → stale → expired`.

Judged across four axes: reversibility · forward-progress value · domain shape · coordination cost. **Mixed strategies are normal** — BER for money, FER for telemetry, design-out for collaborative state, at once.

**Where the invalidation is a race**, one principle: *move the contention to a single named coordination point, and make the conflicting state impossible to write rather than something detected after it is written.* Tactics: derive-don't-store · single-writer fields · the guarded transition · declarative constraints · serialized intake.

**Those tactics remove write-write races only.** A field with one writer cannot be raced; a decision that *reads* it can still go stale — **read-write staleness**. Where the claim is reshapeable it designs out: an interval becomes a row per interval claimed, and an exclusion constraint refuses the overlap. A predicate over a *set* — a count, a sum — includes rows that do not exist yet, so nothing can be constrained and no lock over the rows you counted covers the next one. Two answers: materialize the predicate as one guarded field and put the guard in the write (`where count < limit`) — the guarded transition applied to a count, design-out at the price of every capability maintaining that field in the same transaction; or validate the read set at commit, keeping the facts authoritative and carrying them into the write.

> **Locking is the admission that the conflict was left constructible; design-out is the decision that it never was.**

## Card 8 — Attribution across contexts

Two independent axes decide what the interview can return: whether the drivers are **written in the artifact**, and whether anyone **remembers** them.

| | Established org — memory | New org — no memory |
|---|---|---|
| **Brownfield** — git carries the drivers | Richest: history measures, people corroborate | History holds the drivers, no one remembers — reading the register *builds* the memory |
| **Greenfield** — no artifact yet | No code history, but real domain experience | Neither record nor memory; the register begins as bets not yet placed |

**Evidence is richest where the cost of being wrong is highest, and thinnest where it is lowest.** A large system has mass to restructure when an attribution proves wrong; a young one has a handful of use cases, so a wrong guess is corrected by regrouping — a transform, not a rewrite. **The place where drivers are hardest to know is the place where knowing them wrong costs least.**

**The output changes with the organizational axis.** An unsettled driver reads as a *governance finding* in an established organization — a decision the business needs to make, located exactly — and as an *open strategic question* in a young one, where the register records the question rather than faking an answer.

*Borrowed history* — a founder's previous companies, the incumbents' evolution — is realized data and beats a whiteboard guess, but misleads in exactly the case that matters most: when the young company's whole thesis is that the incumbents' volatility no longer applies. Hold it loosely and mark it low-confidence.
