# Appendix A: The Design Worksheet

*The method at operating altitude. Part A is the sheet you fill in, one bite at a time; Part B is the reference you consult while filling it. Foundations and the four spiral passes are the full treatment; nothing here is new, and everything here is enough.*

**One rule governs the whole sheet: nothing about the business without the business.** The questions below are not a design puzzle to solve at your desk. Most of them are interview questions, and the register is the transcript.

## Part A — The sheet

### Step 1 · Take one operation and finish it

You never decompose the whole vision at once, because you never have to. Take one operation — *book a seat* — and complete its six properties. Then take the next.

| Property | Your answer |
|---|---|
| **Trigger** — what makes it run: an external request, a published event, or another use case invoking it. Not the transport. | |
| **Typed input** — the least the trigger can carry, as a precise type | |
| **Typed output** — what it produces on success | |
| **Typed failures** — the enumerable, closed set of ways it can fail, each a named domain fact | |
| **Steps** — the internal sequence, named in domain terms | |
| **Dependencies** — what must precede what, what can run in parallel, what is conditional | |

**Filling this in is already verification, not only specification.** A flaw shows up as a property you cannot complete — an outcome with no failure named for it, a step needing a fact no earlier step produces — and it shows up now, on one page, before a line is written.

### Step 2 · Check the altitude

Before going further, decide what you are holding. **The discriminator is not the number of steps; it is whether a step could stand alone under its own trigger, and whether state has to outlive a single invocation.**

- Steps are patterns only, meaningless alone, no state between them → **use case**. *Hold a seat.*
- A step is independently triggerable, or state must survive between steps → **workflow**, and the workflow owns that state. *Book and pay for a reservation.*

### Step 3 · Attribute it to a change driver

Ask the business the one question this altitude forces: **who, or what, would ask for this to change?** Each independent decision authority is a driver — a stakeholder or team, a regulator, an external partner on its own release schedule, a pricing policy, a technical concern such as storage.

Write one line in the **change-driver register**:

| Use case | Driver | Confidence | Source |
|---|---|---|---|
| | | measured / elicited / low-confidence prior | git history / interview / borrowed |

*Never re-interrogate a driver already named.* Once it is in the register, the next use case answering to it is filed under it. That economy is the whole discipline.

**Mark the confidence honestly.** Where the volatility is already realized, the driver is a fact you can measure and version-control history confirms or corrects it. Where it is not, the same question returns a prediction, and businesses are routinely wrong about their own future. Record it as a low-confidence prior, marked as such, and let co-change history promote it later.

### Step 4 · Let the data precipitate

Do not model entities. For each step that learns something durable, record what it fastens to which identity:

| Field | Identity it attaches to | Owner (the operation that creates it) | Readers |
|---|---|---|---|

Two gates apply to every row:

- **A field exists if and only if some operation can produce it and some operation will read it.** Capturing-for-later is itself a process and passes cleanly — name its producer and its consumer. What the gate forbids is the orphan: a field carried because a diagram had a box for it.
- **Every field has exactly one writer**, except the one carrying the workflow's state. That one is a state machine, and writing it is a guarded transition, not an overwrite.

### Step 5 · Choose a recovery response

For every step that can be invalidated after earlier steps have changed state, name one of three. **Check design-out first.**

| Invalidated step | Response | Why |
|---|---|---|
| | design-out / BER / FER | |

Mixed strategies are normal: BER for money, FER for telemetry, design-out for collaborative state, coherently, at once.

### Step 6 · Climb when the register tells you to

You do not design a hierarchy. Watch the register: the use cases sharing a driver are already a group. Give the group a name and it is a workflow. The workflows sharing a concern are a cluster; name it and it is a subsystem.

Before accepting any grouping, run both directions of the test:

- **Completeness** — is every unit this driver governs inside the group, or are some scattered elsewhere, so one change has to chase them across modules?
- **Purity** — is only what this driver governs inside, or is a foreign unit riding along, leaking its unrelated changes in?

> **The sharpened test asks both at once: does this one change force *all* of these, and *only* these, to change?**

Pass both and the group is cohesive. Pass one and it is not.

### Step 7 · Leave the trail

The register *is* the trail, and it does triple duty: it is the grouping itself, it is the completeness-and-purity checklist, and it is what version-control history can confirm. Keep it live.

Two entries deserve a note beside them:

- A use case landing in **two columns** is not an error but a sighting — an adapter or a boundary, the place to look for essential coupling.
- A driver the conversation **could not settle** is an output, not a failure. An established organization reads it as a governance finding: a decision the business needs to make, located exactly. A young company reads it as an open strategic question, and the register records the question rather than faking an answer.

## Part B — The reference

### The shapes (what a value's type says the domain knows)

- **`T`** — the value exists, unconditionally. No absence, no failure, no waiting.
- **`Option<T>`** — it may or may not exist, and its absence is a domain fact, not an error.
- **`Result<T>`** — the operation may or may not have produced it; failure is a typed outcome, synchronous.
- **`Promise<T>`** — it arrives later and may fail.

Asynchrony emerges from leaves: any operation touching I/O is a `Promise`, and it propagates outward. It is not decided at the top.

**Parse, don't validate.** A type carries a claim and construction enforces it, so a process body needs no defensive checks. Enforcement has levels — type-level, construction-level, runtime-level, convention-level — and the commitment is identical across all of them; only the teeth differ.

### The patterns (how steps compose, at every altitude)

- **Leaf** — an atomic unit: a boundary crossing or a pure computation. Everything else composes Leaves.
- **Sequencer** — steps in order, each feeding the next, short-circuiting on the first failure.
- **Fork-Join** — independent steps run in parallel and joined.
- **Condition** — a branch on a business fact, typed, never a bare boolean where the fact carries meaning.
- **Iteration** — a step applied across a collection.
- **Aspects** — cross-cutting concerns wrapping operations uniformly: business (audit, compliance — part of the design) and technical (logging, tracing, retries — supplied by the runtime).

**Each function implements exactly one pattern; mixing patterns is the signal to split.**

How steps reach one another is a second question with two answers — **direct step composition** (a step calls the next, composing on the returned value) and **event-based step composition** (a step publishes a typed fact and the next is triggered by it). Not a timing distinction and not an altitude distinction; the methodology names both and prefers neither.

### The telescope (the altitudes, and what forms each)

| Altitude | What it is | Formed by |
|---|---|---|
| **Use case** | one business operation, one trigger, one outcome | nothing — it is the floor |
| **Workflow** | a composition of use cases for one business outcome | a business policy |
| **Subsystem** | a coherent business concern, a cluster of workflows | a domain concern |
| **System** | the composition of subsystems | the product boundary + operational envelope |

**A unit's composition at one altitude is a Leaf at the altitude above.** The patterns recur because the structure is fractal. The book stops at the system on purpose: above it the composing force is organizational, not change-driver cohesion the code can express.

Keep two operations distinct: **within-altitude composition** is the patterns, and happens at every altitude including the use case. **Cross-altitude grouping** is change-driver cohesion, and happens only where a level forms from the one below.

### Finding the change driver

**Two ways, and they check each other.**

- **Ask forward, at the desk:** who or what would ask for this to change? Parnas sharpens it — what is the riskiest decision here, the one that would ripple widest? Löwy sharpens it again — what varies over time for one user, and across users now; what would a competitor do differently?
- **Measure backward, on an existing codebase:** version-control history does not lie about how the system actually changes. Files changing together in the same commits share a driver. Cadence is a further tell — parts that change weekly do not belong with parts that change yearly.

Two cautions, mirror images of each other:

- **Similarity is not a change driver.** Code that looks alike, even identical today, may answer to different drivers; merging it couples what the domain leaves separate.
- **A cohesive unit may legitimately answer to more than one driver.** An adapter changes when either side changes, and splitting it destroys the mediation it exists for. Cohesion is not about the *number* of drivers but about carrying exactly the ones the job requires.

**Why attribution rather than comparison.** Deciding cohesion pairwise is quadratic in the number of use cases and re-run from scratch every time one is added. Attribute each use case to its driver once and cohesion stops being a comparison and becomes a sort — one pass to attach the labels, then the use cases sharing a driver fall out as the groups. That is **quasi-linear cohesion**, and it is why the register scales.

### The recovery triple (per invalidation)

- **Design-out** — change the model so the invalidation cannot arise: an append-only log, a reservation model where double-booking is structurally impossible, an idempotent operation. **Check this first.**
- **BER** (*compensate-by-inverse*) — compensate by an inverse action: release the seat, void the authorization, reverse the entry.
- **FER** (*degrade-and-continue*) — continue with degraded state rather than undoing: defaults under partial failure, a notification queued for retry, a value decaying through `fresh → stale → expired`.

Which applies is a judgment across four axes — reversibility, forward-progress value, domain shape, coordination cost.

### Designing out contention

Where the invalidation is a race, one principle with a family of tactics: **move the contention to a single named coordination point, and make the conflicting state impossible to write rather than something detected after it is written.**

- **Derive, don't store** — a value recomputable from authoritative facts has no second copy to fall out of step.
- **Single-writer fields** — one owning operation means nothing can race it.
- **The guarded transition** — the one field several processes write changes only as a guarded transition.
- **Declarative constraints** — push the impossibility into the store; the race is lost by construction, not by a check.
- **Serialized intake** — where order itself is the hazard, a per-entity queue.

**These remove write-write races only.** A field with one writer cannot be raced; a decision that *reads* it can still go stale — **read-write staleness**. Ask it of every decision on the sheet: which facts did this read, who owns them, and does the decision still hold if one moved between the read and the commit? Reshapeable claims still design out (an interval becomes a row per interval claimed, refused by an exclusion constraint). A predicate over a *set* — a count, a sum — has no unique key to constrain: validate the read set at commit, or accept a locked counter row and name its cost.

> **Locking is the admission that the conflict was left constructible; design-out is the decision that it never was.**
