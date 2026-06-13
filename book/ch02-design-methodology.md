# Chapter 2: From Process to Patterns

**Based on:** JBCT v3.1.0 | **Pragmatica Core:** 1.0.0-rc1

## What You'll Learn

- Backend processes as **knowledge gathering** — each step adds a piece of knowledge until there is enough to answer
- The **data dependency graph (DDG)** and how its operators map directly to JBCT patterns and Pragmatica code
- Why pattern selection follows from the process, not from preference

**Prerequisites:** [Chapter 1: Introduction](ch01-introduction.md)

---

JBCT is the coding half of a two-part methodology. The design half — how you discover a process, draw its boundary, derive per-process types instead of a shared domain model, and decompose at scale — is the subject of the companion book *Process-First Design* (PFD). This chapter does not reproduce that work. It takes the single design artifact the rest of JBCT builds on, a process viewed as **knowledge gathering** and captured as a **data dependency graph**, and shows how that artifact determines which patterns you write. For the full design treatment (use-case identification, data-follows-process, design by elimination, composition at scale, BPMN as shared language), see PFD.

One idea from that treatment is load-bearing here, so it is worth stating once: **data follows process.** Types are shaped by what a specific process needs to know, not by entities sitting in a database, so each process tends to own its types rather than share a central model. The question this chapter then answers is mechanical: given a process, which patterns implement it?

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

## Key Takeaways

- A backend process is **knowledge gathering**: each step adds a piece of knowledge, and the process ends — in success or failure — once it has enough to answer.
- The **data dependency graph** turns that view into structure. Its three operators map mechanically onto JBCT patterns and Pragmatica code: **Sequential → Sequencer → `flatMap`**, **ALL → Fork-Join → `Promise.all`**, **ANY → Condition/fallback → `recover`**.
- Sketch the DDG before writing code and pattern selection becomes mechanical — the code mirrors the knowledge-dependency structure rather than any architectural preference.
- This is the one design artifact JBCT depends on. The methodology that produces it — process discovery, per-process types, decomposition at scale — is the companion book *Process-First Design*.

---

## What's Next

[Chapter 3](ch02-four-return-types.md) introduces the four return types — `T`, `Option<T>`, `Result<T>`, `Promise<T>` — the vocabulary every pattern in this book is written in.

---

## Further Reading

- Sergiy Yevtushenko, [Hidden Anatomy of Backend Applications: Data Dependencies](https://medium.com/swlh/hidden-anatomy-of-backend-applications-data-dependencies-5e4ce735b0e1) — the data-dependency-graph view in article form.
- The companion book *Process-First Design* — the full design methodology this chapter bridges from.
