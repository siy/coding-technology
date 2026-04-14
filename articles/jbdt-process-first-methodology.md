---
title: "Java Backend Design Technology: A Process-First Methodology"
description: "From Requirements to Code in Eight Questions"
tags: [java, architecture, design, programming]
canonical_url: https://pragmatica.dev/
published: true
---

# Java Backend Design Technology: A Process-First Methodology

*From Requirements to Code in Eight Questions*

Every backend system is a collection of processes, not a collection of entities.

This sounds obvious when stated plainly. Yet the dominant design methodology for twenty years has been entity-first: identify User, Order, Product. Define their attributes. Attach behavior. Build services that operate on shared objects. The result is a system where every feature is coupled to every other feature through shared data models — and where every new requirement triggers an architecture discussion.

A different approach is gaining traction. Independent practitioners across five languages — F#, Rust, Java, Scala, .NET — have independently converged on the same structural insight: start with behavior, derive data. Design around what the system *does*, not what it *stores*. Six of them are documented in [The Quiet Consensus](https://dev.to/siy/the-quiet-consensus-5hhk), but the pattern extends far beyond those six.

Structured programming eliminated goto debates by making control flow mechanical. This methodology does the same for design: it makes most architectural decisions mechanical, determined by the problem rather than by the developer's preferences.

This article presents **Java Backend Design Technology** (JBDT) — the design phase of [Java Backend Coding Technology](https://pragmatica.dev/) (JBCT). It's a concrete, repeatable process for going from requirements to code structure. No entity diagrams. No aggregate boundaries. No architecture review boards. Just eight questions and the types that emerge from the answers.

---

## The Questions Framework

For any feature, ask these eight questions. The answers produce the code structure mechanically.

1. **What triggers this process?**
2. **What data does it need?** — this becomes the Request record
3. **What does success look like?** — this becomes the Response record
4. **What can go wrong?** — these become error types (sealed interface with enum for fixed messages, records for contextual errors)
5. **What are the steps?** — these become step interfaces
6. **Which steps depend on each other?** — dependencies become sequential chains; independent steps become parallel operations
7. **Are there conditional paths?** — these become branching logic
8. **Is there collection processing?** — this becomes iteration

That's the entire design process. No other questions need answering. Pattern selection, type placement, error strategy — all determined by these eight answers.

Let's see it work.

---

## Applying the Framework: Place an Order

Requirements: a customer places an order with items, a shipping address, and a payment method. The system checks inventory, processes payment, creates the order, and sends confirmation.

**Question 1 — What triggers this?** A customer submits an order.

**Question 2 — What data does it need?** Customer ID, list of items with quantities, shipping address, payment method.

```java
record Request(String customerId, List<OrderItem> items,
               String shippingAddress, String paymentMethod) {}
record OrderItem(String productId, int quantity) {}
```

**Question 3 — What does success look like?** An order confirmation with an ID and estimated delivery.

```java
record Response(String orderId, LocalDate estimatedDelivery) {}
```

**Question 4 — What can go wrong?** Invalid inputs, insufficient inventory, payment declined.

```java
sealed interface PlaceOrderError extends Cause {
    enum General implements PlaceOrderError {
        EMPTY_CART("Cart is empty"),
        INVALID_ADDRESS("Shipping address is invalid");
        // ...
    }
    record InsufficientInventory(String productId, int requested, int available)
            implements PlaceOrderError { /* ... */ }
    record PaymentDeclined(String reason)
            implements PlaceOrderError { /* ... */ }
}
```

**Question 5 — What are the steps?** Validate the request. Check inventory. Process payment. Create order. Send confirmation.

**Question 6 — Which steps depend on each other?** Validation must happen first. Inventory check and payment processing are independent of each other. Order creation depends on both succeeding. Confirmation depends on the order being created.

This directly produces the composition:

```java
static PlaceOrder placeOrder(CheckInventory checkInventory,
                             ProcessPayment processPayment,
                             CreateOrder createOrder,
                             SendConfirmation sendConfirmation) {
    return request -> ValidRequest.validRequest(request)
                                  .async()
                                  .flatMap(valid -> reserveOrder(checkInventory, processPayment, valid))
                                  .flatMap(createOrder::apply)
                                  .flatMap(sendConfirmation::apply);
}

private static Promise<ReservedOrder> reserveOrder(CheckInventory checkInventory,
                                                   ProcessPayment processPayment,
                                                   ValidRequest valid) {
    return Promise.all(checkInventory.apply(valid),
                       processPayment.apply(valid))
                  .map(ReservedOrder::new);
}
```

**Questions 7 and 8** — no conditional paths or collection processing in the main flow.

Notice what happened. We didn't draw a class diagram. We didn't debate which aggregate owns what. We didn't create a shared `Order` entity used by every feature. We asked eight questions, wrote down the answers, and the code structure emerged.

Notice also: `ValidateCart`, `ProcessPayment`, `InsufficientInventory`, `PaymentDeclined` — these are exactly the words a domain expert would use when describing this process. The shared vocabulary between developers and business emerged directly from the design process, without dedicated modeling sessions. This is DDD's ubiquitous language in practice — emerging naturally rather than being constructed.

---

## A Second Example: Publish Article

To show this isn't specific to e-commerce, let's design a content publishing feature.

Requirements: an author submits an article. The system validates the content, checks for duplicates, generates a slug, and publishes to multiple platforms.

Walking through the questions quickly:

1. **Trigger:** Author submits article
2. **Data needed:** Title, body, tags, author ID, target platforms
3. **Success:** Published URLs for each platform
4. **Failures:** Invalid content, duplicate title, platform rejection
5. **Steps:** Validate → check duplicates → generate slug → publish to platforms
6. **Dependencies:** Validation and duplicate check are independent. Slug generation depends on both. Publishing to each platform is independent (parallel).
7. **Conditional paths:** If a platform rejects, continue with others (best-effort)
8. **Collection processing:** Publishing to multiple platforms

```java
static PublishArticle publishArticle(ValidateContent validate,
                                     CheckDuplicates checkDups,
                                     GenerateSlug generateSlug,
                                     PlatformPublisher publisher) {
    return request -> validateArticle(validate, checkDups, request)
                          .flatMap(generateSlug::apply)
                          .flatMap(article -> publisher.publishAll(article, request.platforms()));
}

private static Promise<ValidArticle> validateArticle(ValidateContent validate,
                                                     CheckDuplicates checkDups,
                                                     Request request) {
    return Promise.all(validate.apply(request),
                       checkDups.apply(request))
                  .map(ValidArticle::new);
}
```

Different domain, same eight questions, same mechanical process. The structure is determined by the answers, not by preferences.

---

## Why It Works: Processes as Knowledge Gathering

There's a deeper structure underneath the eight questions.

Every backend process is fundamentally an act of **knowledge gathering**. Each step acquires a piece of knowledge. The process ends — successfully or not — when enough knowledge has accumulated to formulate an answer.

In PlaceOrder:

- **Validation** gathers knowledge: "the inputs are well-formed"
- **Inventory check** gathers knowledge: "the items are available"
- **Payment processing** gathers knowledge: "the funds are secured"
- **Order creation** gathers knowledge: "the order is persisted"

A failure at any step is also knowledge. A declined payment tells the process "funds are not available" — and that's enough to formulate the answer "order cannot be placed." The process doesn't need to continue once it has enough knowledge to respond.

This reframes data modeling entirely. Instead of asking "what data exists in the system?" (which produces entity diagrams), you ask "what does this process need to know?" The first question leads to shared entities. The second leads to per-process types — exactly what the methodology produces.

---

## Data Dependency Graphs

The knowledge-gathering view has a formal structure. Three operators describe how pieces of knowledge relate:

- **Sequential** — need A before gathering B. "Validate first, then check inventory."
- **ALL(A, B)** — need both, they're independent. "Check inventory AND process payment."
- **ANY(A, B)** — either source suffices. "Get credit score from internal system OR external bureau."

Between operators, transformation functions convert one piece of knowledge into another — pure business logic.

### A Detailed Example: Resolve Customer Credit

A lending system needs to make a credit decision. The process:

1. Attempt to get the customer's credit score from the internal scoring system
2. If internal scoring is unavailable, fall back to an external credit bureau
3. Independently, retrieve the customer's payment history
4. Combine credit score and payment history to calculate a risk assessment
5. Apply lending policy to produce the final decision

As a data dependency graph:

```
CreditDecision = ApplyPolicy(
                     Assess(
                         ALL(
                             ANY(InternalScore, ExternalBureau),
                             PaymentHistory
                         )
                     )
                 )
```

Reading from the inside out:

- `ANY(InternalScore, ExternalBureau)` — gather credit score from whichever source responds successfully first, any response is equally correct.
- `ALL(..., PaymentHistory)` — gather the credit score (from either source) AND the payment history independently, in parallel.
- `Assess(...)` — transform both pieces of knowledge into a risk assessment. Pure function, no I/O.
- `ApplyPolicy(...)` — transform the risk assessment into a lending decision. Pure function.

This maps directly to code:

```java
static ResolveCredit resolveCredit(InternalScoring internal,
                                   ExternalBureau external,
                                   PaymentHistoryService history,
                                   RiskAssessor assessor,
                                   LendingPolicy policy) {
    return request -> gatherCreditData(internal, external, history, request)
                          .map(assessor::assess)
                          .map(policy::apply);
}

private static Promise<CreditData> gatherCreditData(InternalScoring internal,
                                                    ExternalBureau external,
                                                    PaymentHistoryService history,
                                                    Request request) {
    return Promise.all(obtainCreditScore(internal, external, request),
                       history.retrieve(request.customerId()))
                  .map(CreditData::new);
}

private static Promise<CreditScore> obtainCreditScore(InternalScoring internal,
                                                      ExternalBureau external,
                                                      Request request) {
    return internal.score(request)
                   .orElse(() -> external.score(request));
}
```

Three methods, one pattern each. `resolveCredit` is the Sequencer (gather → assess → decide). `gatherCreditData` is the Fork-Join — the `ALL` operator gathering independent pieces of knowledge in parallel. `obtainCreditScore` is the fallback — the `ANY` operator trying the internal source first, falling back to external. The sequential `.map` calls are transformations that convert gathered knowledge into the final answer.

The DDG notation captures more useful information than an entity-relationship diagram. An ER diagram tells you what data exists. A DDG tells you what a process needs to know, where it gets that knowledge, and what depends on what. The code writes itself from the graph.

---

## When Requirements Change

The product owner says: "We need to check for fraud before processing payment."

In an entity-first design, this triggers questions: Does the Order entity need a fraud status? Where does the fraud check live in the service layer? Do we need a new aggregate?

In process-first design, the response is mechanical:

1. Add a new step interface: `CheckFraud`
2. Ask question 6: does fraud check depend on other steps? It needs the validated request — so it comes after validation.
3. Is it independent of other steps? It's independent of inventory check but payment should wait for it.
4. Insert it into the composition:

```java
static PlaceOrder placeOrder(CheckInventory checkInventory,
                             ProcessPayment processPayment,
                             CreateOrder createOrder,
                             SendConfirmation sendConfirmation,
                             CheckFraud checkFraud) {
    return request -> ValidRequest.validRequest(request)
                                  .async()
                                  .flatMap(valid -> reserveOrder(checkInventory, processPayment, checkFraud, valid))
                                  .flatMap(createOrder::apply)
                                  .flatMap(sendConfirmation::apply);
}

private static Promise<ReservedOrder> reserveOrder(CheckInventory checkInventory,
                                                   ProcessPayment processPayment,
                                                   CheckFraud checkFraud,
                                                   ValidRequest valid) {
    return Promise.all(checkInventory.apply(valid),
                       verifyAndPay(checkFraud, processPayment, valid))
                  .map(ReservedOrder::new);
}

private static Promise<PaymentResult> verifyAndPay(CheckFraud checkFraud,
                                                   ProcessPayment processPayment,
                                                   ValidRequest valid) {
    return checkFraud.apply(valid)
                     .flatMap(_ -> processPayment.apply(valid));
}
```

One new step interface. One change to the composition. No restructuring. No entity changes. No architecture discussion.

This is what mechanical design evolution looks like: patterns are used from the start, so evolution is adding and recomposing — never restructuring.

---

## When Processes Meet Persistence

"But what about the database? Don't you end up with entities anyway?"

Yes — and that's fine. The difference is how they get there.

Multiple use cases converge on the same database tables. `PlaceOrder` writes order rows. `CancelOrder` updates the status column. `TrackOrder` reads shipping info. `GenerateInvoice` reads billing fields. The `orders` table is the union of what these processes need.

But this entity **emerged** from process convergence. It wasn't designed upfront. Every column has a known consumer — the process that needed it. No speculative fields "just in case." When a new process needs something new, you add it, and you know exactly why.

The key insight: **entities are discovered, not invented.** They're the natural intersection of processes that share persistence — a composition of views, not a universal model.

This isn't always the case. In event-sourced systems, entities may never materialize into a single flat record. Each process folds the event stream into exactly the shape it needs — different state reconstructions for different contexts (Rico Fritzsche explores this in depth in [Beyond Aggregates](https://levelup.gitconnected.com/beyond-aggregates-lean-functional-event-sourcing-1f008cf236fc)). Whether your entities live as database rows, event folds, or CQRS projections, the principle holds: they're composed from process needs, not designed ahead of time.

---

## Practical Consequences

**Design meetings get shorter.** When the methodology is mechanical, there's less to debate. "What are the use cases? What are the answers to the eight questions?" produces a design in minutes, not hours. Architects are freed to focus on genuinely hard problems — infrastructure, scaling, cross-system integration — instead of mediating aggregate boundary debates.

**The six JBCT structural patterns map directly to BPMN constructs** — code written using these patterns is structurally equivalent to a business process diagram. For the full pattern-BPMN mapping, see the [JBCT series](https://pragmatica.dev/).

**Testing becomes a side effect of design.** Every step interface is a test seam. Stub it, test the composition. The design produces testable code by construction — no special effort required.

**AI-assisted development benefits directly.** Given the eight questions answered, an AI assistant produces structurally correct code because the design space is fully constrained. There's essentially one valid structure for a given set of answers.

---

## Try It

Pick a feature from your current project. Ask the eight questions. Write down the Request, Response, error types, and step interfaces before writing any implementation code.

Notice how the structure emerges from the answers — not from architectural decisions or entity modeling. Notice how the types you name are the words your domain expert would use. Notice how you didn't need to debate anything.

That's JBDT in practice.

---

## Going Deeper

Java Backend Design Technology is the design phase of [Java Backend Coding Technology](https://pragmatica.dev/) — a complete methodology covering design, implementation patterns, testing strategy, and tooling. JBDT has been validated against a 326,000-line distributed runtime ([Aether](https://github.com/pragmaticalabs/pragmatica)) and formalized into a [comprehensive learning series](https://pragmatica.dev/).

If you've independently arrived at similar conclusions from your own domain, language, or tradition — I'd like to hear about it. The convergence is the interesting part.

---

*Further reading:*
- [The Quiet Consensus](https://dev.to/siy/the-quiet-consensus-5hhk) — the convergent evolution toward process-first design
- [Hidden Anatomy of Backend Applications: Data Dependencies](https://medium.com/swlh/hidden-anatomy-of-backend-applications-data-dependencies-5e4ce735b0e1) — the DDG formalism
- Scott Wlaschin, *[Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/)* — workflows with typed boundaries in F#
- Rico Fritzsche, *[Beyond Aggregates: Lean, Functional Event Sourcing](https://levelup.gitconnected.com/beyond-aggregates-lean-functional-event-sourcing-1f008cf236fc)* — aggregateless design with event sourcing
