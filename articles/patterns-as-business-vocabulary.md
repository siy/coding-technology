---
tags: [java, architecture, softwaredesign, communication]
canonical_url: https://pragmatica.dev/patterns-as-business-vocabulary
description: How structural patterns create a shared language between developers and domain experts
published: true
---

# Code as Requirements: Making Business Logic Readable to Domain Experts

**When patterns become vocabulary, code becomes communication**

---

## The Translation Problem

Watch a developer explain code to a product manager:

> "So this method calls the user service, then if the user exists, we iterate over their orders, filtering for pending ones, and then for each we check the inventory service asynchronously, and then..."

The PM's eyes glaze over. They asked "how does order processing work?" and got implementation details instead.

Now watch the same conversation with pattern-aware code:

> "Order processing has five steps: validate the request, check inventory, reserve items, process payment, and confirm. Steps 2 and 3 run in parallel since they're independent."

Same functionality. Completely different conversation.

---

## Patterns as Vocabulary

When code follows well-defined structural patterns, something remarkable happens: **the code structure mirrors the business process**.

Consider these five patterns:

| Pattern | Business Meaning |
|---------|-----------------|
| **Leaf** | "Do this one thing" |
| **Sequencer** | "Do these steps in order" |
| **Fork-Join** | "Do these things simultaneously" |
| **Condition** | "Depending on X, do either A or B" |
| **Iteration** | "Do this for each item" |

These aren't just code structures--they're how business people already think about processes:

- "First validate, then process, then confirm" -> **Sequencer**
- "Fetch user profile and fetch orders at the same time" -> **Fork-Join**
- "If premium customer, apply discount; otherwise standard pricing" -> **Condition**
- "Apply this rule to each line item" -> **Iteration**

---

## Reading Code as Business Process

When every method implements exactly one pattern, code becomes scannable:

```java
public interface ProcessOrder {
    Promise<Confirmation> execute(OrderRequest request);

    static ProcessOrder create(
        ValidateOrder validate,
        CheckInventory checkInventory,
        ReserveItems reserveItems,
        ProcessPayment processPayment,
        ConfirmOrder confirm
    ) {
        return request -> validate.apply(request)
            .flatMap(valid -> checkAndReserve(checkInventory, reserveItems, valid))
            .flatMap(reserved -> processPayment.apply(reserved))
            .flatMap(paid -> confirm.apply(paid));
    }

    private static Promise<ReservedOrder> checkAndReserve(
        CheckInventory check,
        ReserveItems reserve,
        ValidOrder order
    ) {
        return check.apply(order)
            .flatMap(available -> reserve.apply(available));
    }
}
```

A product manager can read this:
1. Validate the order
2. Check and reserve inventory (substeps: check availability, then reserve)
3. Process payment
4. Confirm order

No implementation details. Just business steps.

---

## The Structure-to-Requirement Mapping

Each pattern maps directly to requirement language:

### Sequencer -> "Then" Statements

Requirement: "The system shall validate the user, then check their subscription status, then grant access."

```java
return validateUser(credentials)
    .flatMap(this::checkSubscription)
    .flatMap(this::grantAccess);
```

Three "then" statements, three `flatMap` calls. Direct mapping.

### Fork-Join -> "And" Statements (Parallel)

Requirement: "The dashboard displays user profile AND recent orders AND notifications."

```java
return Promise.all(
    fetchProfile(userId),
    fetchRecentOrders(userId),
    fetchNotifications(userId)
).map(Dashboard::new);
```

Three independent things needed together. Fork-Join.

### Condition -> "If/Otherwise" Statements

Requirement: "If the customer is premium, apply the loyalty discount. Otherwise, apply standard pricing."

```java
return customer.isPremium()
    ? applyLoyaltyDiscount(order)
    : applyStandardPricing(order);
```

Direct translation.

### Iteration -> "For Each" Statements

Requirement: "For each line item, calculate the item total including applicable taxes."

```java
return items.stream()
    .map(this::calculateItemTotal)
    .collect(toList());
```

"For each" becomes `.stream().map()`.

---

## Naming That Communicates

When methods are named in business terms, code reads like specifications:

```java
// Business-friendly names
validateOrder()
checkInventoryAvailability()
reserveItems()
processPayment()
sendConfirmation()

// Technical names (harder to map to requirements)
doValidation()
callInventoryService()
updateDatabase()
runPaymentFlow()
triggerNotification()
```

The first set lets you trace requirements to code. The second requires translation.

---

## The Step Interface Pattern

Define each business step as its own interface:

```java
public interface ProcessOrder {
    Promise<Confirmation> execute(OrderRequest request);

    // Each step is an explicit interface
    interface ValidateOrder {
        Result<ValidOrder> apply(OrderRequest request);
    }

    interface CheckInventory {
        Promise<InventoryStatus> apply(ValidOrder order);
    }

    interface ReserveItems {
        Promise<ReservedOrder> apply(InventoryStatus status);
    }

    interface ProcessPayment {
        Promise<PaymentReceipt> apply(ReservedOrder order);
    }

    interface ConfirmOrder {
        Promise<Confirmation> apply(PaymentReceipt receipt);
    }
}
```

Now requirements traceability is mechanical:
- Requirement: "Validate order" -> `ValidateOrder` interface
- Requirement: "Check inventory" -> `CheckInventory` interface
- And so on.

---

## Error Types as Business Concepts

Errors also map to business language:

```java
public sealed interface OrderError extends Cause {
    // Business concept: order validation failed
    record ValidationFailed(List<String> violations) implements OrderError {
        @Override public String message() {
            return "Order validation failed: " + String.join(", ", violations);
        }
    }

    // Business concept: items not available
    enum InsufficientInventory implements OrderError {
        INSTANCE;
        @Override public String message() {
            return "One or more items are out of stock";
        }
    }

    // Business concept: payment declined
    record PaymentDeclined(String reason) implements OrderError {
        @Override public String message() {
            return "Payment declined: " + reason;
        }
    }
}
```

When a PM asks "what can go wrong with orders?", you can show them:
- Validation failed (bad input)
- Insufficient inventory (items unavailable)
- Payment declined (payment processor rejected)

These are business concepts, not technical errors.

---

## Documentation Through Types

Compare traditional documentation:

```java
/**
 * Processes an order request.
 *
 * @param request The order to process
 * @return The confirmation if successful
 * @throws ValidationException if the order is invalid
 * @throws InventoryException if items are unavailable
 * @throws PaymentException if payment fails
 */
public Confirmation processOrder(OrderRequest request) throws ...
```

With self-documenting types:

```java
public Promise<Confirmation> processOrder(OrderRequest request)
// Return type tells you: async operation that might fail
// ProcessOrder interface shows the steps
// OrderError interface shows what can go wrong
```

The types *are* the documentation. They can't go stale because they are the implementation.

---

## The Requirements Review

With pattern-based code, you can do something remarkable: **requirements review of code**.

Gather the product owner and show them the use case:

```java
return validateOrder(request)          // "First we validate"
    .async()
    .flatMap(this::checkInventory)     // "Then check inventory"
    .flatMap(this::reserveItems)       // "Then reserve items"
    .flatMap(this::processPayment)     // "Then charge payment"
    .flatMap(this::confirm);           // "Finally confirm"
```

Ask: "Does this match how order processing should work?"

They can actually answer. They might say:
- "Wait, shouldn't we check inventory before payment?"
- "Can checking and reserving happen together?"
- "What about fraud checking? Where does that go?"

You're having a productive conversation about business logic, not implementation details.

---

## Practical Benefits

### 1. Faster Onboarding

New developers read the use case flow before diving into step implementations. They understand *what* happens before *how*.

### 2. Easier Requirements Changes

PM: "We need to add a fraud check before payment."

Developer: "Got it--new step between inventory and payment."

```java
.flatMap(this::checkInventory)
.flatMap(this::reserveItems)
.flatMap(this::checkFraud)      // New step
.flatMap(this::processPayment)
```

The change is localized and obvious.

### 3. Better Estimates

"How long to add referral tracking?"

Look at the structure: it's a new Leaf step after confirmation. One new interface, one implementation. The pattern tells you the scope.

### 4. Audit Trails

When code structure matches process structure, auditors can trace requirements through the system. "Show me where fraud checking happens" has a direct answer.

---

## Getting Started

1. **Map your process**: Draw the business flow as boxes and arrows.

2. **Identify patterns**:
   - Sequential boxes -> Sequencer
   - Parallel boxes -> Fork-Join
   - Decision diamonds -> Condition
   - Loop symbols -> Iteration

3. **Name in business terms**: Use the same words your PM uses.

4. **Create step interfaces**: One interface per box in your diagram.

5. **Show the result**: Walk through the code with a non-developer. Can they follow it?

---

## Conclusion

Code doesn't have to be a foreign language to business stakeholders. When structured around patterns that mirror business thinking--sequential steps, parallel activities, conditional branches, iterative processes--code becomes a form of executable specification.

The five patterns (Leaf, Sequencer, Fork-Join, Condition, Iteration) aren't just programming constructs. They're the vocabulary of process description that business people already use.

When your code uses this vocabulary:
- Requirements map directly to structure
- Changes are localized and predictable
- Stakeholders can review logic, not just results
- Documentation stays current (it's the code)

Code becomes communication. That's the goal.

---

*Want to learn more about building code that communicates? Check out [Java Backend Coding Technology](https://pragmatica.dev) for a complete methodology built on structural patterns and clear abstractions.*
