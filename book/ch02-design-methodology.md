# Chapter 2: Design Methodology

**Based on:** JBCT v3.0.0 | **Pragmatica Core:** 1.0.0-rc1

## An Emerging Direction

A new direction in software design is emerging. Independent practitioners — from different languages, domains, and traditions — are converging on the same insight: **business processes, not data entities, are the natural unit of software decomposition.**

For decades, we started with data. Identify the entities — User, Order, Product. Define their attributes and relationships. Attach behavior. Build services that operate on shared objects. This data-first approach, formalized in Domain-Driven Design's tactical patterns, produces shared entity models that serve multiple contexts. The coupling is inherent: change a shared entity, and every consumer is affected.

A growing number of practitioners are reaching the same alternative conclusion independently:

- Scott Wlaschin models domains as **workflows** with typed inputs and outputs, composing small functions into complete use cases. His phrase "make illegal states unrepresentable" captures the type-driven approach.

- Rico Fritzsche models domains as **contextual decisions**, not shared entities. Each feature slice owns its own state reconstruction. Entities become "flexible, context-dependent manifestations" — a `Seat` is a row and number in booking, a reservation status in availability, a price category in pricing.

- Roman Weis proposes focusing "100% on behavior — the commands" instead of finding the perfect aggregate root. Business logic belongs in scoped, task-based commands.

- Sandro Mancuso's **Interaction-Driven Design** starts from external usage (use cases), letting the domain model emerge from actual needs rather than speculative entity modeling.

- Jimmy Bogard's **Vertical Slice Architecture** organizes code by features, not layers. "Minimize coupling between slices, maximize coupling in a slice."

- Debasish Ghosh expresses behavior as **pure function compositions** rather than object methods, with immutable types and explicit side effects.

What these approaches share:

- **Processes over entities** — behavior is the primary decomposition unit
- **Per-context types** — data structures shaped by the process that uses them
- **Functional composition** — small, pure, testable functions composed into workflows
- **No shared domain model** — domain knowledge distributed across processes, not centralized in entity classes

This is convergent evolution — the same pressures (complex domains, evolving requirements, distributed systems, AI-assisted development) producing the same structural adaptations. JBCT formalizes this direction into a complete methodology with patterns, tooling, and implementation guidance.

---

## Process-First Design

The design activity in JBCT is identifying **processes** and their boundaries. A process has:

- **Typed input** — what triggers it and what data it needs
- **Typed output** — what success looks like
- **Typed failures** — what can go wrong
- **Steps** — sub-processes with their own typed boundaries

Data types are derived from processes, not the other way around.

### Use Case Identification

Use cases are business processes with clear triggers and outcomes. Identification from requirements is mechanical:

- Each "user can..." or "system shall..." is a candidate use case
- Verb phrases map to use cases: "register," "login," "place order," "generate report"
- A use case is too big if it has independent sub-outcomes — split it
- A use case is too small if it can't fail independently — merge it into the parent

**Boundary test:**

| Question | Classification |
|----------|---------------|
| Can this be triggered independently? | Use case |
| Does it always happen as part of something else? | Step |
| Is it a pure computation with no I/O? | Leaf |

### The Questions Framework

For each identified use case, ask:

1. **What triggers this process?**
2. **What data does it need?** → Request record
3. **What does success look like?** → Response record
4. **What can go wrong?** → Error types (sealed Cause)
5. **What are the steps?** → Step interfaces
6. **Which steps depend on each other?** → Sequencer vs Fork-Join
7. **Are there conditional paths?** → Condition pattern
8. **Is there collection processing?** → Iteration pattern

These questions are concrete and answerable. They don't require deep domain expertise to ask or architectural experience to answer. The structure of the code emerges from the answers.

---

## Worked Example: E-Commerce Checkout

Let's apply the methodology to a realistic feature: placing an order in an e-commerce system.

### Identifying the Process

From the requirements, a customer can place an order. Applying the questions:

1. **Trigger:** Customer submits an order
2. **Input data:** Customer ID, list of items with quantities, shipping address, payment method
3. **Success:** Order confirmation with order ID and estimated delivery date
4. **Failures:** Invalid items, insufficient inventory, payment failure, invalid address
5. **Steps:** Validate → check inventory → process payment → create order → send confirmation
6. **Dependencies:** Inventory check and payment are independent of each other; order creation depends on both
7. **Conditional paths:** None in the main flow (premium vs standard shipping could be a Condition in a sub-step)
8. **Collection processing:** Validating each item in the cart

### Defining the Boundary

The answers give us the typed boundary immediately:

```java
@Slice
public interface PlaceOrder {
    record Request(String customerId, List<OrderItem> items,
                   String shippingAddress, String paymentMethod) {}
    record OrderItem(String productId, int quantity) {}
    record Response(String orderId, LocalDate estimatedDelivery) {}

    Promise<Response> placeOrder(Request request);
}
```

### Validation as Construction

Each input field that can be invalid becomes a value object:

```java
record ValidRequest(CustomerId customerId, List<ValidItem> items,
                    ShippingAddress address, PaymentMethod payment) {
    static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(
            CustomerId.customerId(raw.customerId()),
            ValidItem.validateAll(raw.items()),
            ShippingAddress.shippingAddress(raw.shippingAddress()),
            PaymentMethod.paymentMethod(raw.paymentMethod())
        ).map(ValidRequest::new);
    }
}
```

`CustomerId`, `ShippingAddress`, `PaymentMethod` are not shared entities — they model exactly what *this* process needs to validate about its inputs.

### Pattern Selection from Data Flow

The dependency analysis (question 6) determines the pattern:

- Validation must happen first → **Sequencer**
- Inventory check and payment are independent → **Fork-Join**
- Order creation depends on both succeeding → **Sequencer**
- Confirmation depends on order creation → **Sequencer**

```java
static PlaceOrder placeOrder(CheckInventory checkInventory,
                              ProcessPayment processPayment,
                              CreateOrder createOrder,
                              SendConfirmation sendConfirmation) {
    return request -> ValidRequest.validRequest(request)
                                   .async()
                                   .flatMap(valid -> Promise.all(
                                       checkInventory.apply(valid),
                                       processPayment.apply(valid))
                                       .map(ReservedOrder::new))
                                   .flatMap(createOrder::apply)
                                   .flatMap(sendConfirmation::apply);
}
```

### Error Types from Failure Analysis

Each failure mode (question 4) becomes a type:

```java
sealed interface PlaceOrderError extends Cause {
    enum General implements PlaceOrderError {
        EMPTY_CART("Cart is empty"),
        INVALID_ADDRESS("Shipping address is invalid");
        private final String msg;
        General(String msg) { this.msg = msg; }
        @Override public String message() { return msg; }
    }
    record InsufficientInventory(String productId, int requested, int available)
            implements PlaceOrderError {
        public String message() {
            return "Insufficient inventory for " + productId +
                   ": requested " + requested + ", available " + available;
        }
    }
    record PaymentDeclined(String reason) implements PlaceOrderError {
        public String message() { return "Payment declined: " + reason; }
    }
}
```

### What We Didn't Do

Notice what was *not* required:

- We didn't define a `Product` entity with 50 fields
- We didn't debate which aggregate owns what
- We didn't create a shared `Order` object used by every feature
- We didn't build a repository pattern
- We didn't draw a class diagram

We defined one process with its own types. If "Cancel Order" needs different data about orders, it will define its own types — no conflict, no coupling.

---

## Data Follows Process

The PlaceOrder example illustrates a fundamental principle: **every record type is owned by a process.** Shared types exist only for validated domain concepts (value objects).

### Design Flow

1. Identify use case → define `Request` and `Response` records
2. Identify validation → define `ValidRequest` with factory
3. Identify steps → each step defines its own input/output types if needed
4. Identify errors → define sealed `Cause` hierarchy
5. Only then: extract shared value objects when 2+ use cases validate the same concept

### Why This Eliminates the "Domain Model" Problem

Traditional approaches produce shared entity models that every feature must conform to. This creates:

- **God objects** — `User` with 50 fields because every feature needs something different
- **Mapping layers** — DTO → Entity → DTO because the entity doesn't fit any feature perfectly
- **Aggregate boundary debates** — endless architecture discussions about who owns what
- **Coupling** — changing one feature breaks another because they share the same entity

Process-first design eliminates all of these. Each use case's types ARE its domain model, scoped to exactly what it needs. A `RegisterUser.ValidRequest(Email, Password)` contains the domain knowledge relevant to registration. A `LoginUser.ValidRequest(Email, Password)` is independently evolvable.

The key reframe: data types are not models of what exists in the database. They're models of **what a process needs to know.** Entity modeling asks "What is a Seat?" Process modeling asks "What does this process need to know about seats?" Entity modeling produces one answer that fits no process perfectly. Process modeling produces exactly the right answer for each process.

### Context-Specific Entities

Consider a `Seat` concept in a ticketing system:

| Context | What a "Seat" is | Record |
|---------|-------------------|--------|
| Booking | A location to select | `record Seat(int row, int number)` |
| Reservation | A time-limited hold | `record Seat(Uuid id, Instant reservedUntil)` |
| Pricing | A cost calculation input | `record Seat(Uuid id, SeatCategory category, int basePriceCents)` |

Three different records, three different processes. No shared entity, no conflict, no coupling. Each process models exactly what it needs.

### When to Share

Value objects move to `domain/shared/` only when actually reused:

- `Email` is used by RegisterUser, LoginUser, ResetPassword → **shared**
- `OrderId` is used by PlaceOrder, CancelOrder, TrackOrder → **shared**
- `ReservedOrder` is used only by PlaceOrder internally → **stays in use case**

The rule: start specific, extract when reused. Don't speculate about future reuse.

---

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
| **ANY(A, B)** | Either source suffices | Condition / fallback | `a.recover(b)` |

Between operators, **transformation functions** convert one piece of knowledge into another — these are Leaf operations (pure business logic, validation, mapping).

### PlaceOrder as a DDG

The PlaceOrder process expressed as a dependency graph:

```
PlaceOrder = Confirm(Create(ALL(InventoryStatus, PaymentResult)))
```

Reading right to left: gather inventory status and payment result independently (ALL), create the order from both, then confirm. Each node is a piece of knowledge; each operator describes the dependency relationship.

This maps directly to the code already in this chapter:

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

## Design by Elimination

Once you identify the process and its data flow, most "design decisions" are already made:

| Question | Answer |
|----------|--------|
| What pattern? | Determined by step dependencies |
| What return type? | Determined by the decision tree (Chapter 3) |
| Where do types go? | Request/Response/Error in use case; shared VOs in `domain/shared/` |
| How to handle errors? | Sealed Cause hierarchy |
| How to test? | Integration-first: stub steps, test the composition |
| What is the data model? | The data dependency graph — what knowledge does this process need to formulate its answer |

What remains:

- **Naming** — guided by zone-based vocabulary (Chapter 8)
- **Step granularity** — guided by "one pattern per method"
- **Value object extraction timing** — guided by "2+ use cases" rule

These are small, local decisions. The design process has eliminated the need for architecture.

---

## Composition at Scale

Larger processes compose smaller ones using the same rules. There is no point at which the methodology requires different concepts.

- **Single use case:** Request → ValidRequest → Steps → Response
- **Multi-step process:** Use case → Step interfaces → Each step is its own composition
- **Cross-domain process:** Higher-level use case with other use cases as step dependencies

A reporting query spanning "user" and "order" data is just another use case with its own `ReportRequest` and `ReportResult`. It defines its own domain model for this particular process.

### Example: Order Fulfillment

"Fulfill Order" composes several existing processes:

```java
static FulfillOrder fulfillOrder(ReserveInventory reserve,
                                  ChargePayment charge,
                                  ScheduleShipment schedule,
                                  NotifyCustomer notify) {
    return request -> ValidFulfillment.validFulfillment(request)
                                       .async()
                                       .flatMap(valid -> Promise.all(
                                           reserve.apply(valid),
                                           charge.apply(valid))
                                           .map(FulfillmentContext::new))
                                       .flatMap(schedule::apply)
                                       .flatMap(notify::apply);
}
```

Same rules, same patterns. In Aether, this principle operates at deployment scale: Slice (top-level use case) → Step (sub-process) → Leaf (atomic operation). The methodology scales by recursion, not by adding new concepts.

---

## BPMN as Shared Language

Since the six JBCT patterns map directly to BPMN constructs, the design process has a natural shared notation:

| Pattern | BPMN Construct | PlaceOrder Example |
|---------|---------------|-------------------|
| Leaf | Task | "Check inventory for item X" |
| Sequencer | Sequence Flow | validate → (reserve + pay) → create → confirm |
| Fork-Join | Parallel Gateway | inventory check ∥ payment processing |
| Condition | Exclusive Gateway | premium vs standard shipping |
| Iteration | Multi-Instance | validate each item in cart |
| Aspects | Event Sub-Process | retry policy on payment gateway |

**Design workflow with domain experts:**

1. Describe the business process (whiteboard, BPMN tool, or conversation)
2. Each element maps to a pattern and a method
3. Types emerge from the flow: inputs, outputs, decision criteria
4. Gap detection: if a BPMN element has no corresponding method, something is missing

The code IS the business process specification. The design document and the implementation are the same artifact.

---

## Design Evolution

JBCT designs evolve mechanically:

| Change | Evolution |
|--------|-----------|
| New step in process | Add step interface, insert in chain |
| Step becomes complex | Decompose into sub-steps (same rules) |
| Steps become independent | Sequencer → Fork-Join |
| New use case needs shared concept | Extract value object to `domain/shared/` |
| Cross-cutting concern | Aspects pattern (wrapping, not mixing) |
| Process grows too large | Extract sub-process as separate use case |

No "refactoring to patterns" — patterns are used from the start. Evolution is adding, extracting, or recomposing — never restructuring. When patterns emerge across slices, extract them — but based on evidence, not speculation.

---

## Ubiquitous Language

DDD's most enduring contribution — **ubiquitous language** — remains essential. Developers and domain experts must share vocabulary to build correct software.

In JBCT, ubiquitous language emerges naturally from the design process:

- **Use case names:** `RegisterUser`, `PlaceOrder`, `CancelSubscription`
- **Value objects:** `Email`, `OrderId`, `ShippingAddress`
- **Error types:** `EmailAlreadyRegistered`, `InsufficientInventory`, `PaymentDeclined`
- **Step interfaces:** `ValidateCart`, `ProcessPayment`, `ReserveInventory`

The language isn't constructed in separate modeling sessions — it's a direct byproduct of use case identification and type definition. When a domain expert says "we need to check inventory before processing payment," that sentence maps directly to step interfaces and their ordering in the composition chain. The code reads like the conversation that produced it.

---

## Why Now

Several forces make process-first design practical where it wasn't before:

- **Functional programming went mainstream** — Java records, sealed interfaces, pattern matching. The language supports typed composition natively without framework overhead.
- **Practitioners report tactical DDD patterns showing wear at scale** — aggregates becoming God objects, bounded contexts becoming organizational politics, entity models fighting domain evolution.
- **Distributed systems demand it** — microservices and serverless naturally align with process-based decomposition. Each service IS a process.
- **AI-assisted development rewards deterministic patterns** — AI generates better code when the structure is mechanical and the design space is constrained. Process-first design is inherently AI-friendly.

---

## Summary

The design methodology is mechanical:

1. **Identify the process** — what triggers it, what it produces, what can go wrong
2. **Define typed boundaries** — Request, Response, ValidRequest, Error types
3. **Identify steps and dependencies** — patterns follow from data flow
4. **Compose** — the implementation writes itself

No entity modeling. No architecture debates. No aggregate boundaries. Just processes with typed boundaries, composed with six patterns, evolving by evidence.

The rest of this book teaches the building blocks that make this methodology possible: the four return types (Chapter 3), validation through construction (Chapter 5), the six structural patterns (Chapters 8-9), and production-ready examples that demonstrate the full cycle from requirements to deployment (Chapters 13-15).

---

## Further Reading

**Books:**
- Scott Wlaschin, *Domain Modeling Made Functional* (Pragmatic Programmers)
- Debasish Ghosh, *Functional and Reactive Domain Modeling* (Manning)

**Articles:**
- Rico Fritzsche, [How to Model Domain Logic Without Shared Entities](https://levelup.gitconnected.com/how-to-model-domain-logic-without-shared-entities-05c938eee73f)
- Rico Fritzsche, [Beyond Aggregates: Lean, Functional Event Sourcing](https://levelup.gitconnected.com/beyond-aggregates-lean-functional-event-sourcing-1f008cf236fc)
- Roman Weis, [Alternative Approach to DDD](https://medium.com/codex/lets-build-business-software-an-alternative-approach-to-the-standard-ddd-implementation-47e586b5f81f)
- Sandro Mancuso, [Introducing Interaction-Driven Design](https://www.codurance.com/publications/2017/12/08/introducing-idd)
- Jimmy Bogard, [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- James Hickey, [Stop Pretending To Do Domain-Driven Design](https://www.jamesmichaelhickey.com/stop-pretending-domain-driven-design/)
- Sergiy Yevtushenko, [Hidden Anatomy of Backend Applications: Data Dependencies](https://medium.com/swlh/hidden-anatomy-of-backend-applications-data-dependencies-5e4ce735b0e1)
