# Part 3: Basic Patterns & Structure

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 3 of 5

**Previous:** [Part 2: Core Principles](part-02-core-principles.md) | **Next:** [Part 4: Advanced Patterns & Testing](part-04-advanced-patterns.md)

---

## Overview

You've mastered the four return types and core principles. Now we'll learn the **structural rules** and **basic patterns** that handle 80% of your daily coding tasks.

By the end of this part, you'll understand:
- When to extract functions (mechanical rules, not judgment calls)
- How to keep code at a single level of abstraction
- The three basic patterns: Leaf, Condition, Iteration
- Where to place code in your codebase

These patterns are your building blocks. Master them, and you can write clear, testable code for most scenarios.

---

## Single Pattern Per Function

Every function implements exactly one pattern from a fixed catalog: Leaf, Sequencer, Fork-Join, Condition, or Iteration. (Aspects are the exception - they decorate other patterns.)

**Why?** Cognitive load. When reading a function, you should recognize its shape immediately. If it's a Sequencer, you know it chains dependent steps linearly. If it's Fork-Join, you know it runs independent operations and combines results. Mixing patterns within a function creates mixed abstraction levels and forces readers to hold multiple mental models simultaneously.

This rule has a mechanical benefit: it makes refactoring deterministic. When a function grows beyond one pattern, you extract the second pattern into its own function. There's no subjective judgment about "is this too complex?" - if you're doing two patterns, split it.

**Why by criteria:**
- **Mental Overhead**: One pattern per function means immediate recognition - no mental model switching (+2).
- **Complexity**: Mechanical refactoring rule eliminates subjective debates about "too complex" (+2).
- **Design Impact**: Forces proper abstraction layers - no mixing orchestration with computation (+2).

### Example Violation

```java
// DON'T: Mixing Sequencer and Fork-Join
public Result<Report> generateReport(ReportRequest request) {
    return ValidRequest.validate(request)
        .flatMap(valid -> {
            // Sequencer starts here
            var userData = fetchUserData(valid.userId());
            var salesData = fetchSalesData(valid.dateRange());

            // Wait, now we're doing Fork-Join?
            return Result.all(userData, salesData)
                .flatMap((user, sales) -> computeMetrics(user, sales))
                .flatMap(this::formatReport);  // Back to Sequencer
        });
}
```

This function starts as a Sequencer (validate → fetch user → fetch sales → compute → format), but `fetchUserData` and `fetchSalesData` are independent, so we suddenly do a Fork-Join in the middle. Mixed abstraction levels. Hard to test. Unclear at a glance what the function does.

### Corrected

```java
// DO: One pattern per function
public Result<Report> generateReport(ReportRequest request) {
    return ValidRequest.validate(request)
        .flatMap(this::fetchReportData)
        .flatMap(this::computeMetrics)
        .flatMap(this::formatReport);
}

private Result<ReportData> fetchReportData(ValidRequest request) {
    // This function is a Fork-Join
    return Result.all(fetchUserData(request.userId()),
                      fetchSalesData(request.dateRange()))
                 .map(ReportData::new);
}
```

Now `generateReport` is a pure Sequencer (validate → fetch → compute → format), and `fetchReportData` is a pure Fork-Join. Each function has one clear job.

### Mechanical Refactoring

If you're writing a Sequencer and realize step 3 needs to do a Fork-Join internally, extract step 3 into its own function that implements Fork-Join. The original Sequencer stays clean.

**Rule of thumb**: One pattern per function. If you see two patterns, extract one.

---

## Single Level of Abstraction

**The rule:** No complex logic inside lambdas. Lambdas passed to `map`, `flatMap`, and similar combinators may contain only:
- Method references (e.g., `Email::new`, `this::processUser`)
- Single method calls with parameter forwarding (e.g., `param -> someMethod(outerParam, param)`)

**Why?** Lambdas are composition points, not implementation locations. When you bury logic inside a lambda, you hide abstraction levels and make the code harder to read, test, and reuse. Extract complex logic to named functions - the name documents intent, the function becomes testable in isolation, and the composition chain stays flat and readable.

**Why by criteria:**
- **Mental Overhead**: Flat composition chains scan linearly - no descending into nested logic (+2).
- **Business/Technical Ratio**: Named functions document intent; anonymous lambdas hide it (+2).
- **Complexity**: Each function testable in isolation; buried lambda logic requires testing through container (+2).

### Anti-Pattern

```java
// DON'T: Complex logic inside lambda
return fetchUser(userId)
    .flatMap(user -> {
        if (user.isActive() && user.hasPermission("admin")) {
            return loadAdminDashboard(user)
                .map(dashboard -> {
                    var summary = new Summary(
                        dashboard.metrics(),
                        dashboard.alerts().stream()
                            .filter(Alert::isUrgent)
                            .toList()
                    );
                    return new Response(user, summary);
                });
        } else {
            return AccessError.InsufficientPermissions.INSTANCE.promise();
        }
    });
```

This lambda contains: conditional logic, nested map, stream processing, object construction. Mixed abstraction levels. Hard to test. Hard to read.

### Correct Approach

```java
// DO: Extract to named functions
return fetchUser(userId)
    .flatMap(this::checkAdminAccess)
    .flatMap(this::loadAdminDashboard)
    .map(this::buildResponse);

private Promise<User> checkAdminAccess(User user) {
    return user.isActive() && user.hasPermission("admin")
        ? Promise.success(user)
        : AccessError.InsufficientPermissions.INSTANCE.promise();
}

private Promise<Dashboard> loadAdminDashboard(User user) {
    return dashboardService.loadDashboard(user);
}

private Response buildResponse(Dashboard dashboard) {
    var urgentAlerts = filterUrgentAlerts(dashboard.alerts());
    var summary = new Summary(dashboard.metrics(), urgentAlerts);
    return new Response(dashboard.user(), summary);
}

private List<Alert> filterUrgentAlerts(List<Alert> alerts) {
    return alerts.stream()
        .filter(Alert::isUrgent)
        .toList();
}
```

Now the top-level chain reads linearly: fetch → check access → load dashboard → build response. Each step is named, testable, and at a single abstraction level.

### Allowed Simple Lambdas

**Method reference:**
```java
// DO: Method reference
.map(Email::new)
.flatMap(this::saveUser)
.map(User::id)
```

**Single method call with parameter forwarding:**
```java
// DO: Simple parameter forwarding
.flatMap(user -> checkPermissions(requiredRole, user))
.map(order -> calculateTotal(taxRate, order))
```

### Forbidden in Lambdas

**No ternaries** (they are the Condition pattern, violates Single Pattern per Function):
```java
// DON'T: Ternary in lambda (violates Single Pattern per Function)
.flatMap(user -> user.isPremium()
    ? applyPremiumDiscount(user)
    : applyStandardDiscount(user))

// DO: Extract to the named function
.flatMap(this::applyApplicableDiscount)

private Result<Discount> applyApplicableDiscount(User user) {
    return user.isPremium()
        ? applyPremiumDiscount(user)
        : applyStandardDiscount(user);
}
```

**No conditionals whatsoever:**
```java
// DON'T: Any conditional logic in lambda
.flatMap(user -> {
    if (user.isPremium()) {
        return applyPremiumDiscount(user);
    } else {
        return applyStandardDiscount(user);
    }
})

// DO: Extract to the named function
.flatMap(this::applyApplicableDiscount)
```

### Why This Matters for AI

Single level of abstraction makes code generation deterministic. When an AI sees a `flatMap`, it knows to generate either a method reference or a simple parameter-forwarding lambda - nothing else. No decisions about "is this ternary simple enough?" When reading code, the AI can parse the top-level structure without descending into nested lambda logic. Humans benefit identically: scan the chain to understand flow, dive into named functions only when needed.

---

## Pattern: Leaf

**Definition:** A Leaf is the smallest unit of processing - a function that does one thing and has no internal steps. It's either a business leaf (pure computation) or an adapter leaf (I/O or side effects).

**Rationale (by criteria):**
- **Mental Overhead**: Atomic operations have no internal steps to track - immediate comprehension (+2).
- **Business/Technical Ratio**: Business leaves are pure domain logic; adapter leaves isolate technical concerns (+2).
- **Complexity**: Single responsibility per leaf - no hidden interactions (+2).
- **Reliability**: Pure business leaves are deterministic and easily testable (+1).

### Business Leaves

Business leaves are pure functions that transform data or enforce business rules. Common examples:

```java
// Simple calculation leaf
public static Price calculateDiscount(Price original, Percentage rate) {
    return original.multiply(rate);
}

// Domain rule enforcement leaf
public static Result<Unit> checkInventory(Product product, Quantity requested) {
    return product.availableQuantity().isGreaterThanOrEqual(requested)
        ? Result.unitResult()
        : InsufficientInventory.cause(product.id(), requested);
}

// Data transformation leaf
public static OrderSummary toSummary(Order order) {
    return new OrderSummary(
        order.id(),
        order.totalAmount(),
        order.items().size()
    );
}
```

If there's no I/O and no side effects, it's a business leaf. Keep each leaf focused on one transformation or one business rule.

### Adapter Leaves

Adapter leaves integrate with external systems: databases, HTTP clients, message queues, file systems. They map foreign errors to domain Causes:

```java
public interface UserRepository {
    Promise<Option<User>> findByEmail(Email email);
}

// Adapter leaf implementation
class PostgresUserRepository implements UserRepository {
    private final DataSource dataSource;

    public Promise<Option<User>> findByEmail(Email email) {
        return Promise.lift(
            e -> RepositoryError.DatabaseFailure.cause(e),
            () -> {
                try (var conn = dataSource.getConnection();
                     var stmt = conn.prepareStatement("SELECT * FROM users WHERE email = ?")) {

                    stmt.setString(1, email.value());
                    var rs = stmt.executeQuery();

                    return rs.next() ? mapUser(rs) : null;
                }
            }
        ).map(Option::option);
    }

    private User mapUser(ResultSet rs) throws SQLException {
        // Mapping logic; SQLException handled by Promise.lift()
        return new User(/* ... */);
    }
}
```

The adapter catches `SQLException` and wraps it in `RepositoryError.DatabaseFailure`, a domain `Cause`. Callers never see `SQLException`.

### Placement Rules

**If a leaf is only used by one caller**, keep it nearby (same file, same package).

**If it's reused**, move it immediately to the nearest `shared` package. Don't defer - tech debt accumulates when shared code stays in wrong locations.

### Common Mistakes

**DON'T mix abstraction levels in a leaf:**
```java
// DON'T: This "leaf" is actually doing multiple steps
public static Result<Email> email(String raw) {
    var normalized = raw.trim().toLowerCase();
    if (!isValid(normalized)) {
        logValidationFailure(normalized);  // Side effect!
        return EmailError.INVALID.result();
    }
    return Result.success(new Email(normalized));
}
```

This leaf has a side effect (logging) mixed with validation logic. Extract logging to an Aspect decorator if needed.

**DON'T let adapter leaves leak foreign types:**
```java
// DON'T: SQLException leaks into business logic
Promise<Option<User>> findByEmail(Email email) throws SQLException {
    // Business logic should never see SQLException
}
```

Wrap all foreign exceptions in domain Causes within the adapter.

### Framework Independence

Adapter leaves form the bridge between business logic and framework-specific code. This isolation is critical for maintaining framework-agnostic business logic.

**Strongly prefer adapter leaves for all I/O operations**: database access, HTTP calls, file system operations, message queues. This ensures you can swap frameworks (Spring → Micronaut, JDBC → JOOQ) without touching business logic - only rewrite the adapters.

However, dependencies on specific libraries for business functionality (encryption libraries, complex mathematical computations, specialized algorithms) are acceptable within business logic when they're essential to the domain.

**The key distinction**: I/O adapters isolate infrastructure choices; domain libraries implement business requirements.

### Best Practice

```java
// DO: Keep leaves focused
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forValue("Invalid email");

    // DO: One clear responsibility
    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .map(String::trim)
            .map(String::toLowerCase)
            .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, EMAIL_PATTERN))
            .map(Email::new);
    }
}
```

Linear flow, clear responsibility, no side effects, foreign errors properly wrapped.

---

## Pattern: Condition

**Definition:** Condition represents branching logic based on data. The key: express conditions as values, not control-flow side effects. Keep branches at the same abstraction level.

**Rationale (by criteria):**
- **Mental Overhead**: Conditions as expressions - evaluates to single value, not control flow scatter (+2).
- **Business/Technical Ratio**: Branch logic mirrors domain rules, not imperative jumps (+2).
- **Complexity**: Same abstraction level per branch - prevents tangled logic (+2).
- **Reliability**: Type-checked branches ensure all cases return compatible types (+2).

### Simple Conditional

```java
// DO: Condition as expression returning the monad
Result<Discount> calculateDiscount(Order order) {
    return order.isPremiumUser()
        ? premiumDiscount(order)      // returns Result<Discount>
        : standardDiscount(order);    // returns Result<Discount>
}
```

Both branches return the same type (`Result<Discount>`), so the ternary is just choosing which function to call. No mixed abstractions.

### Pattern Matching

Using Java's switch expressions:

```java
Result<ShippingCost> calculateShipping(Order order, ShippingMethod method) {
    return switch (method) {
        case STANDARD -> standardShipping(order);
        case EXPRESS -> expressShipping(order);
        case OVERNIGHT -> overnightShipping(order);
    };
}
```

Each case returns `Result<ShippingCost>`. The switch expression evaluates to a single result.

### Nested Conditions

Avoid deep nesting by extracting subdecisions into named functions:

```java
// DON'T: Nested ternaries
return user.isPremium()
    ? (order.total().greaterThan(THRESHOLD)
        ? largeOrderPremiumDiscount(order)
        : smallOrderPremiumDiscount(order))
    : (order.total().greaterThan(THRESHOLD)
        ? largeOrderStandardDiscount(order)
        : smallOrderStandardDiscount(order));
```

Extract:
```java
// DO: Extract nested logic
Result<Discount> calculateDiscount(User user, Order order) {
    return user.isPremium()
        ? premiumDiscount(order)
        : standardDiscount(order);
}

private Result<Discount> premiumDiscount(Order order) {
    return order.total().greaterThan(THRESHOLD)
        ? largeOrderPremiumDiscount(order)
        : smallOrderPremiumDiscount(order);
}

private Result<Discount> standardDiscount(Order order) {
    return order.total().greaterThan(THRESHOLD)
        ? largeOrderStandardDiscount(order)
        : smallOrderStandardDiscount(order);
}
```

Now each function has one level of branching. Much clearer.

### Condition with Monads

Use `map`, `flatMap`, and `filter` to keep types consistent. Never use ternaries in lambdas - they violate Single Pattern per Function.

```java
// DON'T: Ternary in lambda (violates Single Pattern per Function)
return fetchUser(userId)
    .flatMap(user -> user.isActive()
        ? processActiveUser(user)
        : UserError.InactiveAccount.INSTANCE.result()
    );

// DO: Extract condition to named function
return fetchUser(userId)
    .flatMap(this::processIfActive);

private Result<ProcessedUser> processIfActive(User user) {
    return user.isActive()
        ? processActiveUser(user)
        : UserError.InactiveAccount.INSTANCE.result();
}
```

Or use `filter` for even cleaner composition:
```java
// DO: Using filter (preferred when applicable)
return fetchUser(userId)
    .filter(User::isActive, UserError.InactiveAccount.INSTANCE)
    .flatMap(this::processActiveUser);
```

### Common Mistakes

**DON'T mix abstraction levels in branches:**
```java
// DON'T: One branch is a leaf, the other is a whole sequence
return user.isPremium()
    ? Result.success(PREMIUM_DISCOUNT)  // Leaf: just a value
    : fetchStandardDiscountRules()      // Sequencer: fetch → compute → validate
        .flatMap(this::computeDiscount)
        .flatMap(this::validateDiscount);
```

Extract the complex branch:
```java
// DO: Both branches are leaves
return user.isPremium()
    ? Result.success(PREMIUM_DISCOUNT)
    : calculateStandardDiscount(user);

private Result<Discount> calculateStandardDiscount(User user) {
    return fetchStandardDiscountRules()
        .flatMap(this::computeDiscount)
        .flatMap(this::validateDiscount);
}
```

**DON'T use conditionals to hide missing error handling:**
```java
// DON'T: Silently returning the empty result
Result<Data> fetchData(Source source) {
    return source.isAvailable()
        ? source.getData()
        : Result.success(Data.EMPTY);  // Is this a business rule or a hack?
}
```

Be explicit: is empty data a valid outcome, or should unavailable sources fail?

```java
// DO: Explicit semantics
Result<Data> fetchData(Source source) {
    return source.isAvailable()
        ? source.getData()
        : DataError.SourceUnavailable.INSTANCE.result();
}
```

---

## Pattern: Iteration

**Definition:** Iteration processes collections, streams, or recursive structures. Prefer functional combinators over explicit loops. Keep transformations pure.

**Rationale (by criteria):**
- **Mental Overhead**: Declarative combinators state intent; imperative loops require tracing (+2).
- **Business/Technical Ratio**: map/filter express business logic; loops are iteration mechanics (+2).
- **Complexity**: Functional composition eliminates index management and loop state (+2).
- **Reliability**: Pure transformations have no side effects - deterministic and testable (+2).

### Mapping Collections

```java
// Transforming a list of raw inputs to domain objects
Result<List<Email>> parseEmails(List<String> rawEmails) {
    return Result.allOf(
        rawEmails.stream()
            .map(Email::email)
            .toList()
    );
}
```

`Result.allOf` aggregates a `List<Result<Email>>` into `Result<List<Email>>`. If any email is invalid, you get a `CompositeCause` with all failures.

### Filtering and Transforming

```java
List<ActiveUser> activeUsers(List<User> users) {
    return users.stream()
        .filter(User::isActive)
        .map(this::toActiveUser)
        .toList();
}

private ActiveUser toActiveUser(User user) {
    return new ActiveUser(user.id(), user.email());
}
```

Pure transformation, no side effects, returns `List<ActiveUser>` (type `T`, not `Result`, because this can't fail).

### Async Iteration

When processing collections with async operations, decide between sequential and parallel:

**Sequential:**
```java
// Process orders one at a time
Promise<List<Receipt>> processOrders(List<Order> orders) {
    return orders.stream()
        .reduce(
            Promise.success(new ArrayList<Receipt>()),
            (promiseAcc, order) -> promiseAcc.flatMap(acc -> addReceipt(acc, order)),
            (p1, p2) -> p1  // Won't be used in sequential reduction
        );
}

private Promise<List<Receipt>> addReceipt(List<Receipt> acc, Order order) {
    return processOrder(order).map(receipt -> {
        acc.add(receipt);
        return acc;
    });
}
```

**Parallel (when orders are independent):**
```java
// Process orders in parallel
Promise<List<Receipt>> processOrders(List<Order> orders) {
    return Promise.allOf(
        orders.stream()
            .map(this::processOrder)
            .toList()
    );
}
```

Use parallel when operations are independent. The order in the returned List corresponds to the order of the input list of Promises.

### Common Mistakes

**DON'T mix side effects into stream operations:**
```java
// DON'T: Side effect in the map
users.stream()
    .map(user -> {
        logger.info("Processing user: {}", user.id());  // Side effect!
        return processUser(user);
    })
    .toList();
```

Extract side effects to an Aspect (logging) or keep them out of transformation logic.

**DON'T use imperative loops when combinators exist:**
```java
// DON'T: Imperative accumulation
List<Result<Email>> results = new ArrayList<>();
for (String raw : rawEmails) {
    results.add(Email.email(raw));
}
// Then manually aggregate results...
```

Use `Result.allOf`:
```java
// DO: Declarative collection
Result<List<Email>> emails = Result.allOf(
    rawEmails.stream().map(Email::email).toList()
);
```

**DO keep iteration focused on transformation:**
```java
// DO: Pure transformation
List<OrderSummary> summarize(List<Order> orders) {
    return orders.stream()
        .map(this::toOrderSummary)
        .toList();
}

private OrderSummary toOrderSummary(Order order) {
    return new OrderSummary(
        order.id(),
        order.total(),
        order.itemCount()
    );
}
```

---

## Summary: Your Basic Toolkit

You now have the structural rules and basic patterns that cover 80% of daily coding:

**Structural rules:**
1. **Single Pattern Per Function**: One pattern per function, extract if you see two
2. **Single Level of Abstraction**: No complex logic in lambdas, only method references or simple forwarding

**Basic patterns:**
1. **Leaf**: Atomic unit - either pure computation (business) or I/O (adapter)
2. **Condition**: Branching as values, same type from all branches
3. **Iteration**: Functional combinators over collections, pure transformations

These patterns handle:
- Simple calculations and transformations (Leaf)
- Database access and external calls (Adapter Leaf)
- Business rules with branching (Condition)
- Processing lists and collections (Iteration)

---

## What's Next?

In [Part 4: Advanced Patterns & Testing](part-04-advanced-patterns.md), we'll compose these basic patterns into sophisticated workflows:

- **Sequencer**: Chaining dependent steps (the workhorse of use case implementation)
- **Fork-Join**: Parallel composition for independent operations
- **Aspects**: Adding cross-cutting concerns without mixing responsibilities
- **Testing**: Functional assertions with onSuccess/onFailure

The basic patterns you just learned are building blocks. Part 4 shows you how to combine them into complete use cases.

---

**Series Navigation**

[← Part 2: Core Principles](part-02-core-principles.md) | [Index](INDEX.md) | [Part 4: Advanced Patterns & Testing →](part-04-advanced-patterns.md)

---

**Version:** 1.0.0 (2025-10-05) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)
