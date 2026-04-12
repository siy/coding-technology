# Part 0: Design Methodology

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 0 of 10 | **Next:** [Part 1: Introduction & Foundations](part-01-foundations.md)

---

## An Emerging Direction in Software Design

Software design is shifting. Independent practitioners — from different languages, domains, and traditions — are converging on the same insight: business processes, not data entities, are the natural unit of software decomposition.

Scott Wlaschin models domains as workflows with typed inputs and outputs, composing small functions into complete use cases ([Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/)). Rico Fritzsche models domains as contextual decisions, where each feature slice owns its own state reconstruction and entities are "flexible, context-dependent manifestations" ([How to Model Domain Logic Without Shared Entities](https://levelup.gitconnected.com/how-to-model-domain-logic-without-shared-entities-05c938eee73f)). Roman Weis proposes focusing "100% on behavior — the commands" instead of finding the perfect aggregate root ([Alternative Approach to DDD](https://medium.com/codex/lets-build-business-software-an-alternative-approach-to-the-standard-ddd-implementation-47e586b5f81f)). Sandro Mancuso's Interaction-Driven Design starts from external usage, letting the domain model emerge from actual needs ([Introducing IDD](https://www.codurance.com/publications/2017/12/08/introducing-idd)). Jimmy Bogard's Vertical Slice Architecture organizes code by features, not layers ([Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)).

What these approaches share:

- **Processes over entities** — behavior is the primary decomposition unit
- **Per-context types** — data structures shaped by the process that uses them
- **Functional composition** — small, pure, testable functions composed into workflows
- **No shared domain model** — domain knowledge distributed across processes, not centralized in entity classes

This is convergent evolution — the same pressures producing the same structural adaptations. JBCT is one mature expression of this direction, with formalized patterns, tooling, and implementation guidance.

This part teaches the design methodology: how to go from requirements to code structure before writing any implementation.

---

## Process-First Design

Traditional approaches begin with data: identify entities (User, Order, Product), define their attributes, attach behavior to them. This creates shared objects that serve multiple contexts — and the coupling that comes with it.

JBCT begins with processes. A process has:

- **Typed input** — what triggers it and what data it needs
- **Typed output** — what success looks like
- **Typed failures** — what can go wrong
- **Steps** — sub-processes with their own typed boundaries

The design activity is identifying processes and their boundaries. Everything else — data types, patterns, error handling — follows mechanically.

### A Worked Example: E-Commerce Checkout

Imagine you're building an e-commerce system. The traditional approach starts with entities: `Customer`, `Order`, `Product`, `Payment`, `Inventory`. You'd define their attributes, their relationships, and then build services that operate on them.

The process-first approach starts differently. You ask: **what processes does this system need to support?**

From the requirements, you identify:

- Place Order
- Process Payment
- Reserve Inventory
- Send Order Confirmation
- Cancel Order
- Generate Invoice

Each of these is a use case with clear boundaries. Let's design "Place Order" step by step.

### Step 1: Define the Process Boundary

Ask the questions framework:

1. **What triggers this process?** → Customer submits an order
2. **What data does it need?** → Customer ID, list of items with quantities, shipping address, payment method
3. **What does success look like?** → Order confirmation with order ID and estimated delivery
4. **What can go wrong?** → Invalid items, insufficient inventory, payment failure, invalid address

This gives us immediately:

```java
@Slice
public interface PlaceOrder {
    record Request(String customerId, List<OrderItem> items,
                   String shippingAddress, String paymentMethod) {}
    record OrderItem(String productId, int quantity) {}
    record Response(String orderId, LocalDate estimatedDelivery) {}
}
```

### Step 2: Identify Validation

What needs to be validated before the process can proceed?

- Customer ID must be valid
- Items list must be non-empty
- Each quantity must be positive
- Shipping address must be valid
- Payment method must be recognized

This becomes a `ValidRequest` with a factory:

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

Notice: each field becomes a value object with its own validation. `CustomerId`, `ShippingAddress`, `PaymentMethod` are not shared entities — they're specific to what this process needs to know.

### Step 3: Identify Steps and Their Dependencies

5. **What are the steps?**
   - Validate the request (already defined)
   - Check inventory availability
   - Process payment
   - Create the order record
   - Send confirmation

6. **Which steps depend on each other?**
   - Validation must happen first
   - Inventory check and payment processing are independent of each other → Fork-Join
   - Creating the order record depends on both succeeding → Sequencer
   - Sending confirmation depends on the order being created → Sequencer

The pattern structure emerges from the data flow:

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

### Step 4: Define Error Types

4. **What can go wrong?** → Each failure mode becomes a type:

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

**Notice what we didn't do:**

- We didn't define a `Product` entity with 50 fields
- We didn't debate which aggregate owns what
- We didn't create a shared `Order` object used by every feature
- We didn't build a repository pattern

We defined one process with its own types. If "Cancel Order" needs different data about orders, it will define its own types — no conflict, no coupling.

---

## Data Follows Process

The PlaceOrder example illustrates a fundamental principle: **every record type is owned by a process.** Shared types exist only for validated domain concepts (value objects).

The design flow:

1. Identify use case → define `Request` and `Response` records
2. Identify validation → define `ValidRequest` with factory
3. Identify steps → each step defines its own types if needed
4. Identify errors → define sealed `Cause` hierarchy
5. Only then: extract shared value objects when 2+ use cases validate the same concept

Consider a `Seat` concept in a ticketing system. In booking context, a seat is a row and number. In reservation context, it's a status and timestamp. In pricing context, it's a category and base price. Three different records, three different processes. No shared entity, no conflict, no coupling. Each process models exactly what it needs.

### When to Share

Value objects move to `domain/shared/` only when actually reused:

- `Email` is used by RegisterUser, LoginUser, ResetPassword → shared
- `OrderId` is used by PlaceOrder, CancelOrder, TrackOrder → shared
- `ReservedOrder` is used only by PlaceOrder internally → stays in the use case

The rule is simple: **start specific, extract when reused.** Don't speculate about future reuse.

---

## Design by Elimination

Once you identify the process and its data flow, most "design decisions" are already made:

| Question | Answer |
|----------|--------|
| What pattern? | Determined by step dependencies (sequential → Sequencer, independent → Fork-Join) |
| What return type? | Determined by the decision tree (can fail? async? optional?) |
| Where do types go? | Request/Response/Error nested in use case; shared VOs in `domain/shared/` |
| How to handle errors? | Sealed Cause hierarchy; enum for fixed, records for contextual |
| How to test? | Integration-first: stub steps, test the composition |

What's left to decide:

- **Naming** — guided by zone-based vocabulary (Part 5)
- **Step granularity** — guided by "one pattern per method"
- **Value object extraction timing** — guided by "2+ use cases" rule

These are small, local decisions — not architectural ones. The design process has eliminated the need for architecture.

---

## Composition at Scale

Larger processes compose smaller ones using the same rules. There is no point at which the methodology requires different concepts.

- **Single use case:** Request → ValidRequest → Steps → Response
- **Multi-step process:** Use case → Step interfaces → Each step is its own composition
- **Cross-domain process:** Higher-level use case with other use cases as step dependencies

A reporting query that spans "user" and "order" data is just another use case with its own `ReportRequest` and `ReportResult` records. It doesn't need access to other use cases' domain models — it defines its own dedicated domain model for this particular process.

### Example: Order Fulfillment Process

"Fulfill Order" composes several existing use cases:

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

Same rules. Same patterns. Same scale. Each sub-process is independently testable, independently evolvable, and defines its own types for its own context.

---

## BPMN as Shared Language

Since the six JBCT patterns map directly to BPMN constructs, the design process has a natural shared notation:

| Pattern | BPMN Construct | In Our Example |
|---------|---------------|----------------|
| Leaf | Task | "Check inventory for item X" |
| Sequencer | Sequence Flow | validate → (reserve + pay) → create → confirm |
| Fork-Join | Parallel Gateway | inventory check ∥ payment processing |
| Condition | Exclusive Gateway | premium vs standard shipping |
| Iteration | Multi-Instance | validate each item in cart |
| Aspects | Event Sub-Process | retry policy on payment |

**Design workflow:**

1. Describe the business process with a domain expert
2. Each element maps to a pattern and a method
3. Types emerge from the flow: inputs, outputs, decision criteria
4. Gap detection: if a BPMN element has no method, something is missing

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

- Use case names: `RegisterUser`, `PlaceOrder`, `CancelSubscription`
- Value objects: `Email`, `OrderId`, `ShippingAddress`
- Error types: `EmailAlreadyRegistered`, `InsufficientInventory`, `PaymentDeclined`
- Step interfaces: `ValidateCart`, `ProcessPayment`, `ReserveInventory`

The language isn't constructed in separate modeling sessions — it's a direct byproduct of use case identification and type definition. When a domain expert says "we need to check inventory before processing payment," that sentence maps directly to step interfaces and their ordering in the composition chain.

---

## Why Now

Several forces make process-first design practical where it wasn't before:

- **Functional programming went mainstream** — Java records, sealed interfaces, pattern matching. The language supports typed composition natively.
- **Practitioners report tactical DDD patterns showing wear at scale** — aggregates becoming God objects, bounded contexts becoming organizational politics, entity models fighting domain evolution.
- **Distributed systems demand it** — microservices and serverless naturally align with process-based decomposition.
- **AI-assisted development rewards deterministic patterns** — AI generates better code when the structure is mechanical and the design space is constrained.

---

## Try It: Design a Use Case

Pick a feature from your current project and apply the questions framework:

1. What triggers this process?
2. What data does it need?
3. What does success look like?
4. What can go wrong?
5. What are the steps?
6. Which steps depend on each other?
7. Are there conditional paths?
8. Is there collection processing?

Write down the Request, Response, ValidRequest, and error types before writing any implementation code. Notice how the structure emerges from the answers — not from architectural decisions.

---

**Next:** [Part 1: Introduction & Foundations](part-01-foundations.md) — Learn the implementation building blocks: the four return kinds, monadic composition, and the evaluation framework.

---

## Further Reading

- Scott Wlaschin, [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/) (Pragmatic Programmers)
- Debasish Ghosh, [Functional and Reactive Domain Modeling](https://www.manning.com/books/functional-and-reactive-domain-modeling) (Manning)
- Rico Fritzsche, [How to Model Domain Logic Without Shared Entities](https://levelup.gitconnected.com/how-to-model-domain-logic-without-shared-entities-05c938eee73f)
- Rico Fritzsche, [Beyond Aggregates: Lean, Functional Event Sourcing](https://levelup.gitconnected.com/beyond-aggregates-lean-functional-event-sourcing-1f008cf236fc)
- Roman Weis, [Alternative Approach to DDD](https://medium.com/codex/lets-build-business-software-an-alternative-approach-to-the-standard-ddd-implementation-47e586b5f81f)
- Sandro Mancuso, [Introducing Interaction-Driven Design](https://www.codurance.com/publications/2017/12/08/introducing-idd)
- Jimmy Bogard, [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- James Hickey, [Stop Pretending To Do Domain-Driven Design](https://www.jamesmichaelhickey.com/stop-pretending-domain-driven-design/)
