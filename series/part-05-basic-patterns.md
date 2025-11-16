# Part 5: Basic Patterns & Structure

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 5 of 9

**Previous:** [Part 4: Error Handling & Composition](part-04-error-handling.md) | **Next:** [Part 6: Advanced Patterns](part-06-advanced-patterns.md)

---

## Overview

You've mastered the four return types and core principles. Now we'll learn the **structural rules** and **basic patterns** that handle 80% of your daily coding tasks.

By the end of this part, you'll understand:
- When to extract functions (mechanical rules, not judgment calls)
- How to keep code at a single level of abstraction
- The three basic patterns: Leaf, Condition, Iteration
- Where to place code in your codebase

These patterns are your building blocks. Master them, and you can write clear, testable code for most scenarios.

**Building on Part 2:** You've learned about Smart Wrappers (Option, Result, Promise)—the monadic types that control when operations run. In Part 3, we'll use both terms interchangeably to build familiarity with the functional programming terminology. These monads are the foundation for all patterns in this part.

---

## Single Pattern Per Function

Every function implements exactly one pattern from a fixed catalog: Leaf, Sequencer, Fork-Join, Condition, or Iteration. (Aspects are the exception - they decorate other patterns.)

**Why?** Cognitive load. When reading a function, you should recognize its shape immediately. If it's a Sequencer, you know it chains dependent steps linearly. If it's Fork-Join, you know it runs independent operations and combines results. Mixing patterns within a function creates mixed abstraction levels and forces readers to hold multiple mental models simultaneously.

This rule has a mechanical benefit: it makes refactoring deterministic. When a function grows beyond one pattern, you extract the second pattern into its own function. There's no subjective judgment about "is this too complex?" - if you're doing two patterns, split it.

**Why by criteria:**
- **Mental Overhead**: One pattern per function means immediate recognition - no mental model switching (+2).
- **Complexity**: Mechanical refactoring rule eliminates subjective debates about "too complex" (+2).
- **Design Impact**: Forces proper abstraction layers - no mixing orchestration with computation (+2).

### Why This Rule Exists: The Pain of Mixed Patterns

Before showing violations, understand the **concrete problems** that mixing patterns causes:

**Testing becomes brittle:**
```java
// Mixed pattern function
public Result<Report> generateReport(ReportRequest request) {
    // Validates, fetches in parallel, computes, formats - all in one
}

// To test, you need:
// 1. Valid request setup
// 2. Mock for fetchUserData
// 3. Mock for fetchSalesData
// 4. Verify computeMetrics logic
// 5. Verify formatReport logic
// Can't test parts independently - it's all or nothing
```

**Debugging is unclear:**
```java
// Stack trace points to generateReport() line 45
// But which step failed? Validation? Fork-Join fetch? Compute? Format?
// You can't tell without stepping through the whole function
```

**Code review is confusing:**
```java
// Reviewer: "Wait, why are we fetching user and sales sequentially
//            if they're independent?"
// You: "We're not, there's a Fork-Join in the middle"
// Reviewer: "Oh, I didn't see that buried in the lambda"
```

**Reuse is impossible:**
```java
// Another use case needs the same Fork-Join fetch logic
// But it's buried inside generateReport()
// Can't reuse it - have to copy-paste or refactor
```

**With single pattern per function:**
- Each function is independently testable
- Patterns are reusable across use cases
- Failures are localized (stack trace says "fetchReportData failed")
- Structure is predictable and scannable

### Example Violation

```java
// DON'T: Mixing Sequencer and Fork-Join
public Result<Report> generateReport(ReportRequest request) {
    return ValidRequest.validRequest(request)
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
    return ValidRequest.validRequest(request)
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

**Forbidden:**
- Conditionals (`if`, ternary, `switch`)
- Try-catch blocks
- Multi-statement blocks
- Object construction beyond simple factory calls

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

**Use switch expressions for type matching:**

When working with errors or type hierarchies, use pattern matching switch expressions in named methods:

```java
// DON'T: instanceof chain in lambda
.recover(cause -> {
    if (cause instanceof NotFound) {
        return useDefault();
    }
    if (cause instanceof Timeout) {
        return useDefault();
    }
    return cause.promise();
})

// DO: Extract to named method with switch expression
.recover(this::recoverExpectedErrors)

private Promise<Data> recoverExpectedErrors(Cause cause) {
    return switch (cause) {
        case NotFound ignored, Timeout ignored -> useDefault();
        default -> cause.promise();
    };
}
```

**Extract error constants:**

```java
// DON'T: Inline construction with fixed strings
private Promise<User> recoverNetworkError(Cause cause) {
    return switch (cause) {
        case NetworkError.Timeout ignored ->
            new ServiceUnavailable("Timed out").promise();
        default -> cause.promise();
    };
}

// DO: Extract as constants
private static final Cause TIMEOUT = new ServiceUnavailable("User service timed out");

private Promise<User> recoverNetworkError(Cause cause) {
    return switch (cause) {
        case NetworkError.Timeout ignored -> TIMEOUT.promise();
        default -> cause.promise();
    };
}
```

### Why This Matters for AI

Single level of abstraction makes code generation deterministic. When an AI sees a `flatMap`, it knows to generate either a method reference or a simple parameter-forwarding lambda - nothing else. No decisions about "is this ternary simple enough?" When reading code, the AI can parse the top-level structure without descending into nested lambda logic. Humans benefit identically: scan the chain to understand flow, dive into named functions only when needed.

### The Three-Zone Framework

> **Credit:** This zone-based approach is adapted from [Derrick Brandt's systematic method for writing clean code](https://medium.com/@brandt.a.derrick/how-to-write-clean-code-actually-5205963ec524), customized for JBCT patterns.

Maintaining "single level of abstraction" becomes mechanical when you think of your codebase in three distinct zones, each with its own vocabulary:

**Zone 1 (Use Case Level)** - High-level business goals:
- `RegisterUser.execute()`, `ProcessOrder.execute()`, `LoadDashboard.execute()`
- One Zone 1 function per use case - the entry point

**Zone 2 (Orchestration Level)** - Coordinating steps that break down the goal:
- Step interfaces in Sequencer/Fork-Join patterns (covered in Part 4)
- Verbs: `validate`, `process`, `handle`, `transform`, `apply`, `check`, `load`, `save`, `manage`, `configure`, `initialize`
- Examples: `ValidateInput.apply()`, `ProcessPayment.apply()`, `HandleNotification.apply()`

**Zone 3 (Implementation Level)** - Concrete technical operations:
- Business and adapter leaves (this part's focus)
- Verbs: `get`, `set`, `fetch`, `parse`, `calculate`, `convert`, `hash`, `format`, `encode`, `decode`, `extract`, `split`, `join`, `log`, `send`, `receive`, `read`, `write`, `add`, `remove`
- Examples: `hashPassword()`, `parseJson()`, `fetchFromDatabase()`, `calculateTax()`

**The key insight:** Functions at each zone should only call functions from the same zone or one level down. Zone 2 functions call other Zone 2 steps or Zone 3 leaves. Zone 3 leaves perform atomic operations. This creates natural layering.

**Example - Maintaining zone consistency:**

```java
// ✅ GOOD - All steps at Zone 2 (orchestration level)
public Promise<Response> execute(Request request) {
    return ValidRequest.validRequest(request)  // Zone 2: validate
        .async()
        .flatMap(this::processCredentials)      // Zone 2: process
        .flatMap(this::saveUser)                // Zone 2: save
        .flatMap(this::sendConfirmation);       // Zone 2: send (orchestration)
}

// ❌ BAD - Mixing Zone 2 and Zone 3 in same chain
public Promise<Response> execute(Request request) {
    return ValidRequest.validRequest(request)  // Zone 2
        .async()
        .flatMap(this::hashPassword)            // Zone 3 - too specific!
        .flatMap(this::saveUser)                // Zone 2
        .flatMap(this::fetchConfirmToken);      // Zone 3 - too specific!
}
```

In the bad example, `hashPassword` and `fetchConfirmToken` are Zone 3 operations (concrete technical details). They should be wrapped in Zone 2 steps like `processCredentials` and `sendConfirmation`.

**The Stepdown Rule Test**

A simple way to verify your abstraction levels: read your code aloud by adding "to" before each function. It should sound like a natural narrative:

```java
// Reading this aloud:
// "To execute, we validate the request,
//  then we process payment,
//  then we send confirmation."
return ValidRequest.validRequest(request)
    .async()
    .flatMap(this::processPayment)
    .flatMap(this::sendConfirmation);
```

If adding "to" makes it sound awkward or overly detailed ("to hash password, then to save to database, then to fetch from cache"), you're mixing abstraction levels.

**Zone-based naming** is covered in detail in the next section. For now, remember: Zone 2 verbs describe *what* you're doing (business intent), Zone 3 verbs describe *how* (technical operations).

---

## Pattern: Leaf

**Definition:** A **Leaf** (an atomic operation with no substeps) is the smallest unit of processing - a function that does one thing and has no internal steps. It's either a business leaf (pure computation) or an adapter leaf (I/O or side effects).

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
// Unit is a singleton type (empty record with exactly one instance)
// Represents "successful computation with no meaningful return value"
// Result.unitResult() returns success with Unit value
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

Adapter leaves integrate with external systems: databases, HTTP clients, message queues, file systems. They map foreign errors to domain Causes.

**Building on Part 2:** This applies the Promise.lift exception handling pattern introduced in Part 2 to database adapters.

```java
public interface UserRepository {
    Promise<Option<User>> findByEmail(Email email);
}

// Adapter leaf implementation
class PostgresUserRepository implements UserRepository {
    private final DataSource dataSource;

    public Promise<Option<User>> findByEmail(Email email) {
        return Promise.lift(
            RepositoryError.DatabaseFailure::new,
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

### Thread Safety

Leaf operations are **thread-safe through confinement** - each invocation operates independently with its own local state. Mutable local variables (accumulators, builders, working objects) are safe within a leaf because they never escape the function scope. Input parameters must be treated as read-only (see Part 1: [Immutability and Thread Confinement](part-01-foundations.md#immutability-and-thread-confinement)).

### Placement Rules

**If a leaf is only used by one caller**, keep it nearby (same file, same package).

**If it's reused**, move it immediately to the nearest `shared` package. Don't defer - tech debt accumulates when shared code stays in wrong locations. (See Part 6 for `domain.shared` package organization details.)

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
    // private Email {}  // Not yet supported in Java

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forOneValue("Invalid email");

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

### Condition with Smart Wrappers (Monads)

Use `map`, `flatMap`, and `filter` on your monadic types (Result, Option, Promise) to keep types consistent. Never use ternaries in lambdas - they violate Single Pattern per Function.

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
// Process orders one at a time (sequential iteration)
Promise<List<Receipt>> processOrders(List<Order> orders) {
    Promise<List<Receipt>> result = Promise.success(List.of());

    for (Order order : orders) {
        result = result.flatMap2(this::appendReceipt, order);
    }

    return result;
}

private Promise<List<Receipt>> appendReceipt(List<Receipt> receipts, Order order) {
    return processOrder(order)
               .map(receipt -> appendToList(receipts, receipt));
}

private <T> List<T> appendToList(List<T> list, T element) {
    var newList = new ArrayList<>(list);
    newList.add(element);
    return List.copyOf(newList);  // Return immutable
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

### Thread Safety

Sequential iteration is **thread-safe through single-threaded execution** - operations execute one at a time, making local mutable accumulators safe (like `receipts.add(receipt)` in the sequential example above). Parallel iteration requires **immutable inputs** (same rules as Fork-Join pattern in Part 4) - each operation must work independently without shared mutable state.

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

## Naming Conventions

Consistent naming reduces cognitive load and makes code self-documenting. JBCT uses specific conventions that make structure obvious at a glance.

### Factory Method Naming

Factories are always named after their type, lowercase-first (camelCase). This creates natural, readable call sites:

```java
Email.email("user@example.com")
Password.password("Secret123")
AccountId.accountId("ACC-001")
UserId.userId(raw)
```

The intentional redundancy (`Email.email`) enables conflict-free static imports while remaining clear:

```java
import static com.example.domain.Email.email;

// At call site - clear what's being created
var result = email(raw);
```

This pattern is grep-friendly: searching for `Email.email` finds all email construction sites.

### Validated Input Naming

Use the `Valid` prefix (not `Validated`) for types representing validated inputs:

```java
// DO: Use Valid prefix
record ValidRequest(Email email, Password password) {
    static Result<ValidRequest> validRequest(Request raw) { ... }
}

record ValidUser(Email email, HashedPassword hashed) {}
record ValidCredentials(Email email, HashedPassword hashed) {}

// DON'T: Use Validated prefix (too verbose, no additional semantics)
record ValidatedRequest(...)  // ❌
record ValidatedUser(...)      // ❌
```

**Rationale:** `Valid` is concise and conveys the same meaning. The past-tense form adds no semantic value—both indicate the data passed validation.

### Acronym Naming

Treat acronyms as normal words using camelCase, not all-uppercase. This improves readability:

```java
// DO: Treat acronyms as words
HttpClient client;
XmlParser parser;
sendJsonRequest(data);
setRestApiUrl(url);
validateHtmlContent(html);

// DON'T: All-caps acronyms break readability
HTTPClient client;
XMLParser parser;
sendJSONRequest(data);
setRESTAPIURL(url);
validateHTMLContent(html);
```

**Why:** Code is read far more often than written. Smooth camelCase reads faster than mixed-case breaks.

### Test Naming

Follow the pattern: `methodName_outcome_condition`

```java
void validRequest_succeeds_forValidInput()
void validRequest_fails_forInvalidEmail()
void execute_succeeds_forValidInput()
void execute_fails_whenEmailAlreadyExists()
```

This makes test intent immediately clear: what's being tested, expected outcome, and condition triggering that outcome.

### Zone-Based Naming Vocabulary

> **Credit:** Adapted from [Derrick Brandt's systematic approach](https://medium.com/@brandt.a.derrick/how-to-write-clean-code-actually-5205963ec524).

Earlier we introduced the three-zone framework. Each zone has its own verb vocabulary that signals abstraction level:

**Zone 2 Verbs (Step Interfaces - Orchestration):**

Use these when naming step interfaces:

| Verb | When to Use | Example |
|------|-------------|---------|
| `validate` | Checking rules/constraints | `ValidateInput` |
| `process` | Transforming or interpreting data | `ProcessPayment` |
| `handle` | Coordinating reactions to events | `HandleRefund` |
| `transform` | Converting between representations | `TransformOrder` |
| `apply` | Changing state using parameters | `ApplyDiscount` |
| `check` | Verifying conditions | `CheckInventory` |
| `load` | Retrieving data for use | `LoadUserProfile` |
| `save` | Persisting changes | `SaveOrder` |
| `manage` | Supervising lifecycle | `ManageSession` |
| `configure` | Setting up with options | `ConfigureSettings` |
| `initialize` | Preparing for first use | `InitializeConnection` |

**Zone 3 Verbs (Leaves - Implementation):**

Use these when naming leaf functions:

| Verb | Typical Use | Example |
|------|-------------|---------|
| `get` | Retrieve a value | `getTimestamp()` |
| `set` | Assign a value | `setHeader()` |
| `fetch` | Pull from external source | `fetchWeatherData()` |
| `parse` | Break down structured input | `parseJson()` |
| `format` | Build structured output | `formatDate()` |
| `calculate` | Perform computation | `calculateTax()` |
| `convert` | Transform between types | `convertToUtc()` |
| `hash` | Cryptographic transformation | `hashPassword()` |
| `encode`/`decode` | Serialization | `decodeToken()` |
| `extract` | Pull piece from structure | `extractDomain()` |
| `split`/`join` | String/array manipulation | `splitPath()`, `joinTags()` |
| `log` | Track information | `logError()` |
| `send` | Transmit over network | `sendEmail()` |
| `receive` | Handle incoming data | `receivePayload()` |
| `read` | Access from file/disk | `readConfigFile()` |
| `write` | Persist to disk | `writeLogToFile()` |
| `add` | Append or increment | `addItemToCart()` |
| `remove` | Delete or detach | `removeUser()` |

**Naming Patterns by Zone:**

Zone 2 (step interfaces):
```java
interface ValidateInput { ... }    // Zone 2 verb
interface ProcessPayment { ... }   // Zone 2 verb
interface HandleNotification { ... }  // Zone 2 verb
```

Zone 3 (leaves):
```java
// verb + specific noun
private Hash hashPassword(Password pwd) { ... }
private Data fetchFromCache(Key key) { ... }

// verb + preposition + object
private Unit saveToDatabase(User user) { ... }
```

**Anti-pattern - Mixing Zones:**

```java
// ❌ WRONG - Step interface using Zone 3 verb
interface FetchUserData { ... }  // Too specific - "fetch" is Zone 3

// ✅ CORRECT - Zone 2 verb
interface LoadUserData { ... }   // Appropriately general - "load" is Zone 2
```

**Why This Matters:**
- **Consistency**: Same verb for same abstraction level across codebase
- **Readability**: Name immediately signals whether it's orchestration or implementation
- **AI-friendly**: Clear vocabulary makes code generation deterministic
- **Self-documenting**: Function name reveals its role in the architecture

When unsure about naming, consult the zone verb tables. If you're writing a step interface, reach for Zone 2 verbs. If writing a leaf, use Zone 3 verbs.

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

## Common Mistakes

**Leaf Pattern:**
- ❌ Mixing patterns (e.g., Leaf doing iteration internally - extract iteration to separate function)
- ❌ Complex logic in leaves (if it has 5+ branches, it's not atomic)

**Condition Pattern:**
- ❌ Using if-else instead of switch expressions (less clear, more verbose)
- ❌ Side effects in branches (branches should return values, not mutate state)

**Iteration Pattern:**
- ❌ Mutable state in stream operations (breaks functional semantics)
- ❌ Using imperative loops when `.map()`, `.filter()`, `.reduce()` work

**Key insight:** Each pattern has one job. Mixed patterns within a function = split into multiple functions.

---

## What's Next?

In [Part 6: Advanced Patterns & Testing](part-06-advanced-patterns.md), we'll compose these basic patterns into sophisticated workflows:

- **Sequencer**: Chaining dependent steps (the workhorse of use case implementation)
- **Fork-Join**: Parallel composition for independent operations
- **Aspects**: Adding cross-cutting concerns without mixing responsibilities
- **Testing**: Functional assertions with onSuccess/onFailure

The basic patterns you just learned are building blocks. Part 4 shows you how to combine them into complete use cases.

---

**Series Navigation**

[← Part 4: Error Handling & Composition](part-04-error-handling.md) | [Index](INDEX.md) | [Part 6: Advanced Patterns →](part-06-advanced-patterns.md)

---

**Version:** 2.0.0 (2025-11-13) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)
