# From Process to Patterns

**Based on:** JBCT v4.7.0 | **Pragmatica Core:** 1.0.0-rc1

## What You'll Learn

- The **process** as the unit of design — its six properties, and why types belong to processes rather than to shared entities
- Backend processes as **knowledge gathering** — each step adds a piece of knowledge until there is enough to answer
- The **data dependency graph (DDG)** and how its operators map directly to JBCT patterns and Pragmatica code
- The **telescope** — how use cases, workflows, subsystems, and systems emerge, and the one test that groups them
- **What earns a place in code** — when a workflow materializes, when an entity is justified, and why shared code is exposed coupling rather than reuse
- Why pattern selection follows from the process, not from preference
- **Hide the machinery, keep the meaning** — the inventory of business facts the code preserves, and the second reading it enables

**Prerequisites:** [Introduction](introduction.md)

---

This chapter is the design half of JBCT: how you decide what a process *is* before writing a line of it, and how that decision determines the code. JBCT is design-to-code in one method — you do not need a second book to design a use case. (A companion volume, *Process-First Design*, develops the same ideas language-neutrally and in more depth; it is optional further reading, not a prerequisite.)

It builds in five moves: the process as the unit of design, a process seen as knowledge gathering, that view captured as a data dependency graph, the telescope that organizes processes once there are many, and the rule for what earns a place in code — a materialized workflow, an entity, or a shared module. Each move is concrete and Java-first.

## The Process Is the Unit of Design

JBCT designs around **processes, not entities.** The unit of design is a thing that *happens* — a trigger producing an outcome — not a thing that *is*. `RegisterUser`, `PlaceOrder`, `TransferFunds` are processes; `User`, `Order`, `Account` are not where design starts. Data structures are shaped by the processes that use them, not by a domain model that exists before any use.

The immediate consequence is that **types belong to processes.** The "user" `RegisterUser` needs is the shape registration needs — an email, a password, a chosen handle. The "user" a login process needs is a different shape — a credential and a lookup key. They share a noun, not a type. What is *genuinely* common — an identifier, a money amount, something that means exactly the same wherever it appears — becomes a small shared value object (`CustomerId`, `Money`). Everything else is local to the process that uses it.

This is the opposite of the entity-first habit, where one shared `User` model serves every process and grows a field for each new need. That habit has a real advantage — no duplication, one place to look — and a real cost: every process is coupled to every other through the shared shape, so a change made for one risks all of them. JBCT takes the decoupling, and what looks like the duplication it trades for is mostly not duplication at all — per-process types vary for different reasons — on the bet that at backend scale the coupling cost is the one that bites. Entities still earn their place when a business invariant spans more than one field and the combination must be guarded on every write — they simply stop being where design begins.

### A Process Has Six Properties

Name these six and a process is specified. They are the same six at every scale, which is what makes the telescope below possible:

- **Trigger** — what makes it run: a request, a scheduled tick, an event, a human approval resolving. The transport (HTTP versus a queue) is not the trigger; the *outcome* defines the process.
- **Typed input** — what it needs to begin, as a precise type carrying exactly that and no more.
- **Typed output** — what it produces on success.
- **Typed failures** — the closed, enumerable set of ways it can fail, each a named domain fact carried in the type, not an exception raised elsewhere.
- **Steps** — its internal operations, named in domain terms.
- **Dependencies** — which steps must precede which, which can run in parallel, which are conditional.

The first four are the use case's signature — `Promise<Output> apply(Input)`, with the failures carried inside the type rather than thrown. The last two — steps and dependencies — are what the rest of this chapter turns into code.

### Data Follows Process

Why types belong to processes comes down to the question you ask of the domain. Ask "what data *exists*?" and the answer is entities — one `Customer`, one `Order`, a shared shape every process must accept. Ask "what does *this* process need to *know*?" and the answer is per-process types: the smallest input the trigger carries, the typed knowledge each step adds, the closed set of facts — failures included — that let the process answer.

So in JBCT, **data follows process.** You do not model `Order` and then write `PlaceOrder` against it; you write down what `PlaceOrder` must know — valid items, secured inventory, cleared payment — and the types fall out of that. An `Order` record may well appear, but as the output `PlaceOrder` produces, not as a pre-existing model the process is forced to fit. The same noun in two processes is two types, unless they genuinely mean the same thing — and "genuinely the same" is a high bar, reserved for value objects.

## Processes as Knowledge Gathering

Every backend process is fundamentally an act of **knowledge gathering**. Each step acquires a piece of knowledge. The process ends — successfully or not — when enough knowledge has accumulated to formulate an answer.

In PlaceOrder:

1. **Validation** gathers knowledge: "the inputs are well-formed"
2. **Inventory check** gathers knowledge: "the items are available"
3. **Payment processing** gathers knowledge: "the funds are secured"
4. **Order creation** gathers knowledge: "the order is persisted"
5. **Confirmation** gathers knowledge: "the customer is notified"

A failure at any step is also knowledge. A declined payment tells the process "funds are not available" — and that's enough to formulate the answer "order cannot be placed." The process doesn't need to continue gathering knowledge once it has enough to respond, whether that response is success or failure.

This reframes data modeling entirely. Instead of asking "what data exists in the system?" (which produces entity diagrams), you ask "what does this process need to know?" (which produces dependency graphs). The first question leads to shared entities. The second leads to per-process types — exactly what JBCT produces.

---

## Data Dependency Graphs

The knowledge-gathering view has a formal structure: the **data dependency graph** (DDG). A DDG describes what a process needs to know and how those pieces of knowledge relate to each other.

Three operators define the structure:

| Operator | Meaning | JBCT Pattern | Code |
|----------|---------|-------------|------|
| **Sequential** | Need A before gathering B | Sequencer | `a.flatMap(b)` |
| **ALL(A, B)** | Need both, they're independent | Fork-Join | `Promise.all(a, b)` |
| **ANY(A, B)** | Either source suffices | Condition / fallback | `a.orElse(b)` |

Between operators, **transformation functions** convert one piece of knowledge into another — these are Leaf operations (pure business logic, validation, mapping).

### PlaceOrder as a DDG

The PlaceOrder process expressed as a dependency graph:

```
PlaceOrder = Confirm(Create(ALL(InventoryStatus, PaymentResult)))
```

Reading right to left: gather inventory status and payment result independently (ALL), create the order from both, then confirm. Each node is a piece of knowledge; each operator describes the dependency relationship.

This maps directly to the JBCT code that implements it:

```java
return ValidRequest.validRequest(request)
                   .async()
                   .flatMap(valid -> Promise.all(           // ALL
                       checkInventory.apply(valid),          //   InventoryStatus
                       processPayment.apply(valid))          //   PaymentResult
                       .map(ReservedOrder::new))             // Transform
                   .flatMap(createOrder::apply)               // Sequential
                   .flatMap(sendConfirmation::apply);         // Sequential
```

The code structure mirrors the knowledge dependency structure. `Promise.all()` IS the `ALL` operator — it gathers independent pieces of knowledge in parallel. `flatMap` IS sequential dependency — each step needs the previous step's knowledge before it can proceed.

### DDG for Validation

Even validation has a DDG. `Result.all()` in the `ValidRequest` factory is an `ALL` operation — gather all validation results independently, fail if any knowledge is "this input is invalid":

```
ValidRequest = ALL(CustomerId, ValidItems, ShippingAddress, PaymentMethod)
```

```java
Result.all(
    CustomerId.customerId(raw.customerId()),
    ValidItem.validateAll(raw.items()),
    ShippingAddress.shippingAddress(raw.shippingAddress()),
    PaymentMethod.paymentMethod(raw.paymentMethod())
).map(ValidRequest::new);
```

The `ALL` operator here accumulates all failures rather than short-circuiting — `Result.all` gathers all the knowledge about what's wrong, not just the first problem.

### DDG Guides Pattern Selection

When designing a new process, sketching the DDG before writing code makes pattern selection mechanical:

1. Write down what the process needs to know (the knowledge pieces)
2. Draw the dependencies: which pieces depend on others? Which are independent?
3. Map to operators: dependencies become Sequential, independent pieces become ALL, fallback sources become ANY
4. The code writes itself from the graph

This is why JBCT eliminates architecture — the DDG IS the architecture, and it's determined by the problem, not by the developer's preferences.

---

## The Telescope: Organizing Many Processes

One process is one process. Real systems have hundreds, and JBCT organizes them with a single structure used at four scales — a **telescope**:

- A **use case** is one business operation: one trigger, one outcome (`BuyTicket`).
- A **workflow** is a composition of use cases for one business outcome (booking: hold a seat, take payment, confirm).
- A **subsystem** is a cluster of workflows forming one business concern (the booking domain).
- A **system** is the composition of subsystems — the whole platform.

The altitudes are not declared up front; they **emerge from multiplicity.** You start with use cases. When several cohere, a workflow appears. When several workflows cohere, a subsystem appears. You let the structure reveal itself rather than forcing a hierarchy before there is anything to organize. The same six properties describe a unit at every altitude — a workflow has a trigger, typed input and output, typed failures, steps, and dependencies, exactly as a use case does — and a unit at one altitude is a single Leaf to the altitude above. The patterns recur because the structure is fractal.

### The One Grouping Test

What makes units "cohere"? One question, asked at every transition up the telescope:

> What business change would force all of these to change together?

If a single business force would rewrite them all, they belong together. The test has two halves, and a grouping is right only when both hold:

- **Completeness** — is *every* unit that force governs inside the group, or are some scattered elsewhere, so one change has to chase them across modules? (The smell is shotgun surgery.)
- **Purity** — is *only* what that force governs inside, or is something unrelated riding along, so its changes leak in as accidental coupling?

Sharpened to one line: *does this one change force all of these, and only these, to change?* Pass both halves and the group is cohesive. The driver's character shifts as you climb — a business policy groups use cases into a workflow, a domain concern groups workflows into a subsystem, the product boundary groups subsystems into a system — but the test is identical at every rung.

That is the design rule. Its realization in the package tree — how directories telescope open as altitudes are discovered, and where shared code lives — is the **telescope rule** of [Project Structure](project-structure.md).

---

## Materialization: When Structure Earns Code

Process-first has a default and a few exceptions. The default is plain: use cases, the per-process types each one needs, and a small shared kernel of value objects. Three other things — a workflow as a *code entity*, an entity, and a piece of *shared* code — are introduced only when they **earn it**. Adding them by reflex is how accidental structure accumulates; each has a test for whether it has earned its place.

### A Workflow Is Logical Until It Earns a Trigger

A workflow composes use cases for one business outcome, but composition is not the same as a code entity. Most workflows are **logical**: there is no orchestrator object. The use cases run on their own triggers, and what binds them into a workflow is a shared, usually persisted, **state machine** they advance — `free → held → confirmed → fulfilled`. `HoldSeat`, `ConfirmSeat`, and `ReleaseHold` are not invoked by a `ReservationWorkflow` class; each fires on its own trigger (a request, a payment event, a scheduled sweep) and moves the seat to its next legal state. The workflow is real, but it lives *as* that state machine spread across its use cases, not as code that runs them.

Make the state machine **explicit**. A logical workflow almost always has one, and leaving it implicit — the legal transitions scattered as ad-hoc checks inside each use case — is exactly how illegal transitions slip through. Lift it into one place: a state type and its legal transitions, the workflow's spine, shared by the use cases that move it. Name that state type with a **`*State`** suffix — `HoldState`, `BookingState`, `SeatState` — and keep its variants bare (`Free`, `Held`, `Confirmed`, `Cancelled`, never `HeldState`): the suffix marks the sealed sum of lifecycle states a guarded transition advances, distinct from the entity, its value-object representation, and its use-case policy, so a reader who meets `…State` knows it is the workflow's spine and not a DTO. It joins JBCT's suffix-by-role family (`*Request`, `*Response`, `Cause`); reserve it for the lifecycle sum that transitions guard — a config snapshot or a UI holder is not a `*State`, and using the suffix there only dilutes the signal. (Where that shared machine sits in the package tree — the workflow's `shared` — is the telescope rule's job; see [Project Structure & Framework Integration](project-structure.md).)

A workflow **materializes** into a code entity only when it gains a **trigger of its own** — an entry point distinct from any single use case's: a schedule ("each night, settle the day's holds"), an event ("on `payment.captured`, run fulfilment"), or an explicit orchestration call. Then it takes the *same shape as a use case*, one altitude up — a functional interface plus a factory — except that its **steps are the use cases it composes** (a use case is a Leaf to the workflow, per the telescope):

```java
public interface SettleHolds {                    // materialized: its own nightly trigger
    record Request(BusinessDay day) {}
    record Settled(int confirmed, int released) {}

    Promise<Settled> execute(Request request);

    // Its steps are use cases - one altitude up from a use case's adapter steps.
    static SettleHolds settleHolds(ListExpiredHolds listExpired,
                                   ConfirmSeat confirm,
                                   ReleaseHold release) {
        return request -> listExpired.apply(request.day())
                                     .flatMap(holds -> settle(holds, confirm, release));
    }
}
```

The shape is deliberately identical to a use case's — interface + factory depending on its steps — and only the altitude differs: here the steps are use cases, not adapters. No trigger of its own, no materialized workflow: leave it logical and let the state machine carry the coupling.

### An Entity Earns Code at a Persistence Edge or a Cross-Field Invariant

Entities are not where design begins (the process is), but two conditions earn one:

- **A persistence edge.** When state is written to a store, the entity is the composite that *every* write passes through, so the store can never hold a combination the domain forbids. It is the guard at the boundary, not a model threaded through the process.
- **A cross-field invariant.** When a whole assembled from individually-valid fields can still be invalid — a booking whose seat and event must belong to the same venue, a range whose end must follow its start — the *combination* needs guarding, not each field alone. That guard is the entity.

Either condition, or both, earns an entity; with neither, you have value objects and per-process types, which is the default. An entity introduced without one of these is the entity-first model creeping back in under another name.

### What an Entity Fuses, and What JBCT Keeps Apart

The split this protects is finer than entity-versus-value-object. An entity-first aggregate fuses four things that vary for different reasons: the **identity** (who this is), the **lifecycle state** (where it sits in its workflow), the **representation** (what fields are stored), and the **policy** (the rules each operation applies). JBCT keeps them apart — the id is minted by its creating operation, the state is a state machine whose transitions the domain binds, the representation is a value object behind a stable interface, and the policy lives in the use cases. The value object is the part people fear is lost when the aggregate goes; it is not. Encapsulating a representation behind a constructed, validated type *is* a value object — the aggregate merely adds policy to it, and that addition is the whole difference. A change to the representation then lands in one value type while every operation that only reads it through the interface is untouched, and a change to a policy lands in one use case while the shared object an aggregate would force every driver to edit does not exist. The change is the same size as entity-first; its blast radius is not.

Persistence follows the same split. JBCT writes per operation — a step interface returning `Promise<T>` for exactly the fields that operation owns — not by loading a whole aggregate through an ORM and writing it back. There is no object whose shape is welded to a table, so the schema cannot leak into the code through a mapping that quietly drifts; the persistence edge above is a guard on one write, not a round-trip of the entire record.

### Shared Code Is Exposed Coupling — Similarity Is Not a Reason to Share

Moving code into a `shared` location is not a tidiness move; it is a **claim about the domain**: that these users are bound by one change driver and will change together. Shared code is *intrinsic coupling made visible* — which is precisely when sharing is correct, as with the state machine above, whose transitions the domain itself binds.

One refinement sharpens *which* sharing is correct: split shared code by read versus write. A shared **read** or pure computation — a Leaf, a value object, a lookup every use case calls — couples nothing; it is legitimate reuse, and a call graph thick with shared *reads* is not a tangle. The coupling lives in the shared **write**. Process-first allows exactly one legitimate shared write per resource: the guarded transition on its state machine. Every other shared mutation is accidental coupling, and it goes home to the use case whose change driver owns it. When you inherit a mesh of endpoints calling shared methods several layers deep, classify the methods this way — the reads stay shared, the writes collapse to one guarded transition apiece — and the mesh resolves into the use-case hierarchy it always was, read by the wrong key.

The corollary is what most reuse instincts get wrong: **code similarity must not drive placement.** Two functions that look alike — even identical today — may answer to *different* change drivers, and folding them into one shared place couples what the domain leaves separate. The next change for one user then forces a flag, a parameter, or a branch onto the other; the duplication you "removed" returns as accidental coupling and shotgun edits. DRY is about one piece of *knowledge*, not one piece of *text*. Before promoting anything to `shared`, ask the cohesion question of its users: *do they change together, for the same reason?* If yes, the coupling is essential — share it. If they merely resemble one another, leave the copies apart; coincidental similarity is not coupling, and forcing it into one place manufactures the very coupling you meant to avoid.

---

## Hide the Machinery, Keep the Meaning

JBCT's promise is usually told as one move: technical noise is pushed to the edges so the business flow stands out. That is half of it. The other half is the one that compounds: **the business facts survive the translation into code.** Every structural choice does double duty — it executes, and it states something the business said. Together the halves are the method's actual property: **hide the machinery, keep the meaning.**

The statements are not comments and not documentation. They live in types and combinators, so the compiler checks them and refactoring cannot silently erase them:

| The code says | The business fact it states |
|---|---|
| returns `T` | this step cannot fail and always has an answer |
| returns `Option<T>` | absence is a normal domain outcome, not a failure |
| returns `Result<T>` | this can fail for a business reason, and the reasons are enumerated |
| returns `Promise<T>` | this leaves the process's own hands; time and failure are both in play |
| `Option<T>` parameter or field | the domain itself makes this optional — legitimately absent, never "maybe null" |
| `ValidRequest` parameter | the trust boundary is behind us; this data is already proven |
| `map(...)` | a pure transformation — a calculation that cannot fail |
| `flatMap(...)` | a dependent step — it needs the previous answer and may itself fail; order is load-bearing |
| `recover(...)` / `orElse(...)` | the fallback policy, in the order the business ranks it |
| `onSuccess(...)` / `onFailure(...)` | observation only — audit, notification; the outcome does not gate on it |
| `Result.all(...)` | independent validations — every failure matters, so all are reported |
| `Promise.all(...)` | independent work — these steps do not need each other, and may run in parallel |
| sealed `Cause` hierarchy | the complete catalog of this operation's business failure modes |
| `*State` sealed sum | the lifecycle — every legal state enumerated, transitions the only writes |
| no `Result` in the signature | the failure was designed out — it cannot occur; the strongest statement of all |

Read the table as a whole and the consequence appears: **JBCT code reads twice.** The compiler reads it as Java. A person — or an AI assistant — reads it as the business process: which steps depend on which, what can fail and why, what is optional, what runs independently, what is merely observed. Hand a JBCT codebase to a newcomer with no documentation and the process is recoverable — not the vague flow, the *annotated* process: failure catalog, fallback policies, lifecycles, trust boundaries. Documentation drifts; types compile.

The claim has a boundary, and it sits exactly where the first half operates. The types carry the *process* semantics; the purely technical detail — which store, which client, which retry budget — is hidden in adapters and Aspects, where it belongs. Technical failures do travel the same `Result`/`Promise` channels as business failures; keeping the two distinguishable is the `Cause` hierarchy's job.

This is also the half of "AI-friendly" that determinism alone does not deliver. Deterministic structure means an assistant *generates* the right shape; preserved meaning means an assistant *reading* the code recovers the intent instead of guessing it. Generation and comprehension, both directions.

Most of this table's vocabulary arrives over the next chapters — the four return types first, then the patterns. Return to it as the constructs land; it is the map of what your code will be saying.

---

## Key Takeaways

- The **unit of design is the process, not the entity.** Types belong to processes; what is genuinely common becomes a small shared value object. Data follows process.
- A process has **six properties** — trigger, typed input, typed output, typed failures, steps, dependencies. Name them and it is specified.
- A backend process is **knowledge gathering**: each step adds a piece of knowledge, and the process ends — in success or failure — once it has enough to answer.
- The **data dependency graph** turns that view into structure. Its three operators map mechanically onto JBCT patterns and Pragmatica code: **Sequential → Sequencer → `flatMap`**, **ALL → Fork-Join → `Promise.all`**, **ANY → Condition/fallback → `recover`**.
- Sketch the DDG before writing code and pattern selection becomes mechanical — the code mirrors the knowledge-dependency structure rather than any architectural preference.
- Many processes organize by the **telescope** — use case, workflow, subsystem, system — grouped by one test: *what change would force all of these, and only these, to change together?*
- **Structure earns code.** A workflow stays logical — a state machine across its use cases — until it gains a trigger of its own, then materializes as an interface + factory whose steps are those use cases. An entity is justified only by a persistence edge or a cross-field invariant.
- **Shared code is exposed coupling, not reuse.** Promote to `shared` because users share a change driver, never because code looks alike — similar code governed by different drivers belongs apart.
- **Hide the machinery, keep the meaning.** Every structural choice states a business fact; the inventory table is this chapter's capstone. Code reads twice — as Java by the compiler, as the process by the reader — and documentation drifts while types compile.

---

## What's Next

[The Four Return Types](four-return-types.md) introduces the four return types — `T`, `Option<T>`, `Result<T>`, `Promise<T>` — the vocabulary every pattern in this book is written in.

---

## Further Reading

- Sergiy Yevtushenko, [Hidden Anatomy of Backend Applications: Data Dependencies](https://medium.com/swlh/hidden-anatomy-of-backend-applications-data-dependencies-5e4ce735b0e1) — the data-dependency-graph view in article form.
- The companion book *Process-First Design* — the same design method developed language-neutrally and in more depth. Optional: this chapter is self-contained for Java.
