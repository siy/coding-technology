---
tags: [codereview, java, patterns, bestpractices]
canonical_url: https://pragmatica.dev/articles/pattern-based-code-review
description: How structural patterns transform code review from art into engineering
published: true
---

# From Subjective Opinions to Systematic Analysis: Pattern-Based Code Review

**How structural patterns transform code review from art into engineering**

---

## The Problem with Traditional Code Review

Code review discussions often devolve into debates about style, naming preferences, and subjective "readability." Two experienced developers can look at the same function and have completely opposite opinions about whether it's "clean" or "messy."

This subjectivity creates real problems:
- Review quality depends on reviewer mood and experience
- Feedback is inconsistent across team members
- Discussions become defensive rather than constructive
- Junior developers struggle to internalize vague guidance like "make it more readable"

What if code review could be as systematic as running a test suite?

---

## The Key Insight: Patterns Enable Decomposition

When code follows well-defined structural patterns, something remarkable happens: **functions become decomposable into discrete, analyzable parts**.

Consider a function that follows no particular pattern. To review it, you must:
- Hold the entire function in your head
- Trace all possible execution paths
- Infer the author's intent from implementation details
- Make subjective judgments about "complexity"

Now consider a function that implements exactly one pattern from a known catalog. Suddenly you can:
- Immediately recognize the structure
- Apply pattern-specific review criteria
- Verify each component independently
- Make objective assessments against clear standards

**Patterns transform code review from holistic judgment into component analysis.**

---

## The Pattern Catalog: A Reviewer's Toolkit

Every function implements exactly one of these patterns:

### 1. Leaf
The atomic unit -- a function that does one thing with no internal steps.

**Business Leaf:** Pure computation, no I/O
```java
public Money calculateDiscount(Money price, double discountRate) {
    return price.multiply(discountRate);
}
```

**Adapter Leaf:** I/O operation that bridges to external systems
```java
public User findByEmail(String email) throws DatabaseException {
    try (var conn = dataSource.getConnection();
         var stmt = conn.prepareStatement(FIND_BY_EMAIL_SQL)) {
        stmt.setString(1, email);
        var rs = stmt.executeQuery();
        return rs.next() ? mapToUser(rs) : null;
    } catch (SQLException e) {
        throw new DatabaseException("Failed to find user by email", e);
    }
}
```

### 2. Sequencer
A chain of 2-5 dependent steps where each step's output feeds the next.

```java
public OrderConfirmation processOrder(OrderRequest request) {
    ValidatedOrder validated = validateOrder(request);
    InventoryReservation reservation = reserveInventory(validated);
    PaymentResult payment = processPayment(reservation);
    return confirmOrder(payment);
}
```

### 3. Fork-Join
Parallel independent operations combined into a single result.

```java
public Dashboard loadDashboard(Long userId) {
    CompletableFuture<UserProfile> profileFuture = 
        CompletableFuture.supplyAsync(() -> userService.getProfile(userId));
    CompletableFuture<List<Order>> ordersFuture = 
        CompletableFuture.supplyAsync(() -> orderService.getRecentOrders(userId));
    CompletableFuture<List<Notification>> notificationsFuture = 
        CompletableFuture.supplyAsync(() -> notificationService.getUnread(userId));

    CompletableFuture.allOf(profileFuture, ordersFuture, notificationsFuture).join();

    return new Dashboard(
        profileFuture.join(),
        ordersFuture.join(),
        notificationsFuture.join()
    );
}
```

### 4. Condition
Branching based on a discriminator -- if/else or switch.

```java
public double calculateShippingRate(Order order) {
    if (order.isPremiumCustomer()) {
        return calculatePremiumRate(order);
    } else if (order.getWeight() > HEAVY_THRESHOLD) {
        return calculateHeavyItemRate(order);
    } else {
        return calculateStandardRate(order);
    }
}
```

### 5. Iteration
Collection processing via loops or streams.

```java
public List<OrderSummary> getPendingOrderSummaries(List<Order> orders) {
    return orders.stream()
        .filter(Order::isPending)
        .map(this::toSummary)
        .collect(Collectors.toList());
}
```

---

## Pattern-Based Review: The Checklist Approach

Once you recognize a function's pattern, you apply pattern-specific review criteria. This replaces vague "is it readable?" with concrete checklists.

### Reviewing a Leaf

| Check | Question |
|-------|----------|
| **Single Responsibility** | Does it do exactly one thing? |
| **Purity (Business)** | No side effects? Same inputs -> same output? |
| **Error Handling (Adapter)** | Are low-level exceptions wrapped in domain exceptions? |
| **Naming** | Does the name describe the transformation? |
| **Size** | Small enough to understand at a glance? |

### Reviewing a Sequencer

| Check | Question |
|-------|----------|
| **Step Count** | 2-5 steps? (More suggests extraction needed) |
| **Dependency** | Does each step genuinely depend on the previous? |
| **Single Pattern** | No hidden Fork-Join or Condition inside steps? |
| **Abstraction Level** | Are all steps at the same abstraction level? |
| **Error Flow** | Is it clear what happens when each step fails? |

### Reviewing a Fork-Join

| Check | Question |
|-------|----------|
| **Independence** | Are branches truly independent? No shared mutable state? |
| **Thread Safety** | Are all inputs immutable or thread-safe? |
| **Completeness** | Does the combiner handle all branch results? |
| **Error Handling** | What happens if one branch fails? |
| **Infrastructure** | Any hidden dependencies (DB locks, rate limits, connection pools)? |

### Reviewing a Condition

| Check | Question |
|-------|----------|
| **Exhaustiveness** | Are all cases covered? Is there a sensible default? |
| **Balance** | Are branches roughly equal in complexity? |
| **Extraction** | Should complex branches be extracted to named methods? |
| **Nesting** | Are conditions nested too deeply? (Max 2 levels) |

### Reviewing an Iteration

| Check | Question |
|-------|----------|
| **Transformation Clarity** | Is the mapping operation obvious? |
| **Filter Predicate** | Is the filter condition clear or should it be a named method? |
| **Side Effects** | No side effects inside map/filter/forEach? |
| **Null Safety** | Are null elements handled? |

---

## The Meta-Review: Pattern Violations

Beyond pattern-specific checks, reviewers should watch for structural violations:

### Mixed Patterns
A function that starts as a Sequencer but contains an inline Fork-Join:

```java
// BAD: Mixed patterns -- Sequencer contains inline Fork-Join
public OrderResult processOrder(OrderRequest request) {
    ValidatedOrder validated = validateOrder(request);
    
    // Suddenly doing parallel work inline
    CompletableFuture<User> userFuture = 
        CompletableFuture.supplyAsync(() -> userService.getUser(validated.getUserId()));
    CompletableFuture<Product> productFuture = 
        CompletableFuture.supplyAsync(() -> productService.getProduct(validated.getProductId()));
    CompletableFuture.allOf(userFuture, productFuture).join();
    
    OrderContext context = new OrderContext(userFuture.join(), productFuture.join());
    return finalizeOrder(context);
}
```

**Review feedback:** "Extract the parallel fetch into a separate method like `fetchOrderContext()`."

```java
// GOOD: Clean -- Sequencer with extracted Fork-Join
public OrderResult processOrder(OrderRequest request) {
    ValidatedOrder validated = validateOrder(request);
    OrderContext context = fetchOrderContext(validated);  // Fork-Join hidden here
    return finalizeOrder(context);
}

private OrderContext fetchOrderContext(ValidatedOrder validated) {
    // Fork-Join pattern in its own method
    CompletableFuture<User> userFuture = 
        CompletableFuture.supplyAsync(() -> userService.getUser(validated.getUserId()));
    CompletableFuture<Product> productFuture = 
        CompletableFuture.supplyAsync(() -> productService.getProduct(validated.getProductId()));
    CompletableFuture.allOf(userFuture, productFuture).join();
    
    return new OrderContext(userFuture.join(), productFuture.join());
}
```

### Violated Abstraction Levels
Mixing high-level orchestration with low-level details:

```java
// BAD: Mixed abstraction levels
public void processUserRegistration(RegistrationRequest request) {
    // High-level step
    User user = createUser(request);
    
    // Suddenly low-level details
    String welcomeHtml = "<html><body><h1>Welcome " + user.getName() + "!</h1>"
        + "<p>Your account has been created.</p>"
        + "<a href='" + baseUrl + "/verify?token=" + user.getVerificationToken() + "'>Verify</a>"
        + "</body></html>";
    
    emailService.send(user.getEmail(), "Welcome!", welcomeHtml);
    
    // Back to high-level
    auditService.logRegistration(user);
}
```

**Review feedback:** "Extract email content generation to a separate method or template."

```java
// GOOD: Clean -- consistent abstraction level
public void processUserRegistration(RegistrationRequest request) {
    User user = createUser(request);
    sendWelcomeEmail(user);
    auditService.logRegistration(user);
}

private void sendWelcomeEmail(User user) {
    String content = emailTemplates.renderWelcome(user);
    emailService.send(user.getEmail(), "Welcome!", content);
}
```

### Incorrect Pattern Choice
Using Sequencer when Fork-Join is appropriate (sequential operations that are actually independent):

```java
// BAD: Sequential when parallel is possible
public ReportData gatherReportData(Long userId) {
    UserProfile profile = userService.getProfile(userId);      // 200ms
    List<Order> orders = orderService.getOrders(userId);       // 300ms  
    AccountBalance balance = accountService.getBalance(userId); // 150ms
    // Total: 650ms sequential
    
    return new ReportData(profile, orders, balance);
}
```

**Review feedback:** "These fetches are independent -- use parallel execution to reduce latency."

```java
// GOOD: Parallel execution for independent operations
public ReportData gatherReportData(Long userId) {
    CompletableFuture<UserProfile> profileFuture = 
        CompletableFuture.supplyAsync(() -> userService.getProfile(userId));
    CompletableFuture<List<Order>> ordersFuture = 
        CompletableFuture.supplyAsync(() -> orderService.getOrders(userId));
    CompletableFuture<AccountBalance> balanceFuture = 
        CompletableFuture.supplyAsync(() -> accountService.getBalance(userId));
    
    CompletableFuture.allOf(profileFuture, ordersFuture, balanceFuture).join();
    // Total: ~300ms parallel
    
    return new ReportData(
        profileFuture.join(), 
        ordersFuture.join(), 
        balanceFuture.join()
    );
}
```

### The "God Method" -- Multiple Patterns Jumbled Together

```java
// BAD: Multiple patterns mixed together
public Invoice generateInvoice(Long orderId) {
    Order order = orderRepository.findById(orderId);  // Leaf
    if (order == null) {                              // Condition starts
        throw new OrderNotFoundException(orderId);
    }
    
    List<InvoiceLine> lines = new ArrayList<>();      // Iteration starts
    for (LineItem item : order.getItems()) {
        Product product = productService.getProduct(item.getProductId());  // Another Leaf
        if (product.isTaxable()) {                    // Nested Condition
            lines.add(createTaxableLine(item, product));
        } else {
            lines.add(createNonTaxableLine(item, product));
        }
    }
    
    double subtotal = 0;                              // Another Iteration
    for (InvoiceLine line : lines) {
        subtotal += line.getAmount();
    }
    
    if (order.hasDiscount()) {                        // Another Condition
        subtotal = applyDiscount(subtotal, order.getDiscount());
    }
    
    return new Invoice(order.getId(), lines, subtotal);
}
```

**Review feedback:** "This method mixes at least 4 patterns. Extract: `fetchOrder()`, `buildInvoiceLines()`, `calculateSubtotal()`, `applyDiscountIfPresent()`."

```java
// GOOD: Clean -- one pattern per method, composed as Sequencer
public Invoice generateInvoice(Long orderId) {
    Order order = fetchOrder(orderId);
    List<InvoiceLine> lines = buildInvoiceLines(order);
    double subtotal = calculateSubtotal(lines);
    double finalAmount = applyDiscountIfPresent(subtotal, order);
    return new Invoice(order.getId(), lines, finalAmount);
}

private Order fetchOrder(Long orderId) { /* Leaf */ }
private List<InvoiceLine> buildInvoiceLines(Order order) { /* Iteration */ }
private double calculateSubtotal(List<InvoiceLine> lines) { /* Iteration */ }
private double applyDiscountIfPresent(double subtotal, Order order) { /* Condition */ }
```

---

## Practical Review Workflow

### Step 1: Pattern Recognition
Before reading implementation details, identify the pattern:
- See sequential method calls with data passing between them? -> **Sequencer**
- See `CompletableFuture.allOf()` or parallel streams? -> **Fork-Join**
- See `if/else` or `switch` as the main structure? -> **Condition**
- See loops or stream operations? -> **Iteration**
- None of the above, just one operation? -> **Leaf**

### Step 2: Count the Patterns
If you identify more than one pattern in a single method, that's already a finding. Flag it for extraction.

### Step 3: Apply Pattern Checklist
Use the appropriate checklist. Check each criterion mechanically.

### Step 4: Verify Abstraction Consistency
Read through the method body. Are all statements at the same level of abstraction? High-level orchestration shouldn't mix with low-level implementation details.

### Step 5: Check Error Handling Consistency
- Are exceptions handled at the right level?
- Is null checking consistent?
- Are edge cases covered?

---

## Common Review Comments by Pattern

Having a vocabulary of pattern-based feedback makes reviews faster and more actionable:

| Pattern | Common Issue | Review Comment |
|---------|--------------|----------------|
| **Leaf** | Does too much | "This leaf has multiple responsibilities. Extract X into a separate method." |
| **Leaf** | Side effects in business logic | "This calculation method logs/saves data. Extract side effects." |
| **Sequencer** | Too many steps | "This has 8 steps. Group related steps into higher-level methods." |
| **Sequencer** | Independent steps | "Steps 2 and 3 don't depend on each other. Consider parallel execution." |
| **Fork-Join** | Shared mutable state | "These parallel branches share mutable state. Make inputs immutable." |
| **Fork-Join** | Missing error handling | "What happens if one future fails? Add error handling strategy." |
| **Condition** | Deep nesting | "3+ levels of nesting. Extract inner conditions to named methods." |
| **Condition** | Unbalanced branches | "The else branch is 50 lines. Extract to a method." |
| **Iteration** | Side effects in loop | "This forEach modifies external state. Consider using reduce or extract the mutation." |
| **Mixed** | Multiple patterns | "This method contains Sequencer + Condition + Iteration. Extract each pattern." |

---

## Benefits of Pattern-Based Review

### For Reviewers
- **Faster reviews:** Pattern recognition is instant; checklists are mechanical
- **Consistent feedback:** Same criteria applied every time
- **Objective discussions:** "This violates single-pattern rule" vs. "I don't like this"

### For Authors
- **Clear expectations:** Know what reviewers will check before submitting
- **Actionable feedback:** "Extract this Fork-Join" vs. "make it cleaner"
- **Faster iteration:** Fix specific issues, not vague concerns

### For Teams
- **Shared vocabulary:** "That's a Sequencer with a mixed-pattern violation"
- **Onboarding acceleration:** New developers learn patterns, not tribal knowledge
- **Reduced conflict:** Debates about style become discussions about patterns

---

## Implementing Pattern-Based Review

### Start Small
1. Introduce the five patterns in a team meeting
2. Start identifying patterns in PR descriptions: "This method is a Sequencer with 4 steps"
3. Use pattern vocabulary in review comments

### Create Team Standards
- Document your pattern catalog with examples from your codebase
- Agree on step count limits (e.g., Sequencers have 2-5 steps)
- Define what "same abstraction level" means for your domain

### Build Into Process
- Add pattern checklist to PR template
- Include pattern identification in code review training
- Create IDE snippets/templates for each pattern

### Evolve and Refine
- Collect common violations and create team-specific guidelines
- Build a library of "before/after" examples from real PRs
- Consider tooling: static analysis rules for obvious violations

---

## Conclusion

Traditional code review asks: "Is this code good?" -- a question with infinite subjective answers.

Pattern-based code review asks: "Is this a valid Sequencer? Does this Fork-Join have independent branches? Is this Leaf truly atomic?" -- questions with objective, verifiable answers.

When you recognize structural patterns, review transforms from art appreciation into engineering inspection. Every function has a recognizable shape. Every shape has specific criteria. Every criterion has a clear pass/fail answer.

The result: faster reviews, better feedback, and code that improves systematically rather than accidentally.

**The patterns aren't new -- you've been writing Sequencers, Fork-Joins, and Iterations your whole career. What's new is naming them, recognizing them explicitly, and using that recognition to make code review objective and systematic.**

---

*Want to dive deeper into pattern-based code structure? Check out [Java Backend Coding Technology](https://pragmatica.dev) for a complete methodology built on these principles.*
