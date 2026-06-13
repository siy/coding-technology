# Chapter 8: Basic Patterns & Structure

## What You'll Learn

- When to extract functions (mechanical rules, not judgment calls)
- How to keep code at a single level of abstraction
- The three basic patterns: Leaf, Condition, Iteration
- Zone-based naming conventions

**Prerequisites:** [Chapter 7: Null Policy & Error Recovery](ch06-null-policy-recovery.md)

---

## Single Pattern Per Function

Every function implements exactly one pattern from a fixed catalog: Leaf, Sequencer, Fork-Join, Condition, or Iteration. (Aspects are the exception—they decorate other patterns.) Each pattern maps directly to a BPMN flow construct:

| Pattern | BPMN Construct | Structural Role |
|---------|---------------|-----------------|
| **Leaf** | Task / Service Task | Atomic operation, one responsibility |
| **Sequencer** | Sequence Flow | Dependent steps in order |
| **Fork-Join** | Parallel Gateway | Independent concurrent operations |
| **Condition** | Exclusive Gateway | Routing, no transformation |
| **Iteration** | Multi-Instance Activity | Collection processing |
| **Aspects** | Event Sub-Process | Cross-cutting concerns wrapping logic |

This is not a metaphor — JBCT grew from functional programming, BPMN grew from business process modeling, and they converged because they describe the same thing: how work flows through a system. If you can draw it as a BPMN diagram, you can write it as JBCT code. The structure is the same.

**Why?** Cognitive load. When reading a function, you should recognize its shape immediately. If it's a Sequencer, you know it chains dependent steps linearly. If it's Fork-Join, you know it runs independent operations and combines results. Mixing patterns within a function creates mixed abstraction levels and forces readers to hold multiple mental models simultaneously.

This rule has a mechanical benefit: it makes refactoring deterministic. When a function grows beyond one pattern, you extract the second pattern into its own function. There's no subjective judgment about "is this too complex?" — if you're doing two patterns, split it. In BPMN terms: each method is one Task, one Gateway, or one Sub-Process — not a mix.

**Why by criteria:**
- **Mental Overhead**: One pattern per function means immediate recognition - no mental model switching (+2)
- **Complexity**: Mechanical refactoring rule eliminates subjective debates about "too complex" (+2)
- **Design Impact**: Forces proper abstraction layers - no mixing orchestration with computation (+2)

### The Pain of Mixed Patterns

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

This function starts as a Sequencer (validate -> fetch -> compute -> format), but `fetchUserData` and `fetchSalesData` are independent, so we suddenly do a Fork-Join in the middle. Mixed abstraction levels. Hard to test. Unclear at a glance what the function does.

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

Now `generateReport` is a pure Sequencer (validate -> fetch -> compute -> format), and `fetchReportData` is a pure Fork-Join. Each function has one clear job.

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
- **Mental Overhead**: Flat composition chains scan linearly - no descending into nested logic (+2)
- **Business/Technical Ratio**: Named functions document intent; anonymous lambdas hide it (+2)
- **Complexity**: Each function testable in isolation; buried lambda logic requires testing through container (+2)

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
    return isActiveAdministrator(user)
            ? Promise.success(user)
            : AccessError.InsufficientPermissions.INSTANCE.promise();
}

private boolean isActiveAdministrator(User user) {
    return user.isActive() && user.hasPermission("admin");
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

Now the top-level chain reads linearly: fetch -> check access -> load dashboard -> build response. Each step is named, testable, and at a single abstraction level.

### Allowed in Lambdas

**Method references:**
```java
.map(Email::new)
.flatMap(this::saveUser)
.map(User::id)
```

**Single method call with parameter forwarding:**
```java
.flatMap(user -> checkPermissions(requiredRole, user))
.map(order -> calculateTotal(taxRate, order))
```

### Forbidden in Lambdas

- Conditionals (`if`, ternary, `switch`)
- Try-catch blocks
- Multi-statement blocks
- Object construction beyond simple factory calls

**No ternaries** (they are the Condition pattern):
```java
// DON'T: Ternary in lambda
.flatMap(user -> user.isPremium()
    ? applyPremiumDiscount(user)
    : applyStandardDiscount(user))

// DO: Extract to named function
.flatMap(this::applyApplicableDiscount)

private Result<Discount> applyApplicableDiscount(User user) {
    return user.isPremium()
        ? applyPremiumDiscount(user)
        : applyStandardDiscount(user);
}
```

---

## The Three-Zone Framework

Maintaining "single level of abstraction" becomes mechanical when you think of your codebase in three distinct zones, each with its own vocabulary:

**Zone 1 (Use Case Level)** - High-level business goals:
- `RegisterUser.execute()`, `ProcessOrder.execute()`, `LoadDashboard.execute()`
- One Zone 1 function per use case - the entry point

**Zone 2 (Orchestration Level)** - Coordinating steps that break down the goal:
- Step interfaces in Sequencer/Fork-Join patterns
- Verbs: `validate`, `process`, `handle`, `transform`, `apply`, `check`, `load`, `save`, `manage`, `configure`, `initialize`
- Examples: `ValidateInput.apply()`, `ProcessPayment.apply()`, `HandleNotification.apply()`

**Zone 3 (Implementation Level)** - Concrete technical operations:
- Business and adapter leaves
- Verbs: `get`, `set`, `fetch`, `parse`, `calculate`, `convert`, `hash`, `format`, `encode`, `decode`, `extract`, `split`, `join`, `log`, `send`, `receive`, `read`, `write`, `add`, `remove`
- Examples: `hashPassword()`, `parseJson()`, `fetchFromDatabase()`, `calculateTax()`

**The key insight:** Functions at each zone should only call functions from the same zone or one level down. Zone 2 functions call other Zone 2 steps or Zone 3 leaves. Zone 3 leaves perform atomic operations. This creates natural layering.

**Example - Maintaining zone consistency:**

```java
// GOOD - All steps at Zone 2 (orchestration level)
public Promise<Response> execute(Request request) {
    return ValidRequest.validRequest(request)              // Zone 2: validate
                       .async()
                       .flatMap(this::processCredentials)  // Zone 2: process
                       .flatMap(this::saveUser)            // Zone 2: save
                       .flatMap(this::sendConfirmation);   // Zone 2: send
}

// BAD - Mixing Zone 2 and Zone 3 in same chain
public Promise<Response> execute(Request request) {
    return ValidRequest.validRequest(request)              // Zone 2
                       .async()
                       .flatMap(this::hashPassword)        // Zone 3 - too specific!
                       .flatMap(this::saveUser)            // Zone 2
                       .flatMap(this::fetchConfirmToken);  // Zone 3 - too specific!
}
```

In the bad example, `hashPassword` and `fetchConfirmToken` are Zone 3 operations (concrete technical details). They should be wrapped in Zone 2 steps like `processCredentials` and `sendConfirmation`.

### The Stepdown Rule Test

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

---

## Gap Detection Through Patterns

When you model business processes using patterns, **gaps become visible**. The patterns validate requirements, not just implement them.

**How patterns reveal gaps:**
- **Missing validation:** Building a Sequencer but nothing validates the input before step 1? Gap found.
- **Unclear dependencies:** Are these a Sequencer (dependent) or Fork-Join (independent)? If unknown, process isn't defined.
- **Missing error handling:** Every Leaf can fail. What happens when this fails?
- **Inefficient flows:** Sequential process described but steps are independent? Should be Fork-Join.

**Discovery questions by pattern:**

| Pattern | Key Questions |
|---------|--------------|
| **Leaf** | What does it do? Can it fail? Sync or async? |
| **Condition** | What determines the path? Mutually exclusive? Default? |
| **Iteration** | Stop on first failure? Order matters? Can parallelize? |

Advanced patterns (Sequencer, Fork-Join, Aspects) covered in Chapter 9.

---

## Pattern: Leaf

**Definition:** A **Leaf** (an atomic operation with no substeps) is the smallest unit of processing - a function that does one thing and has no internal steps. It's either a business leaf (pure computation) or an adapter leaf (I/O or side effects).

**Rationale (by criteria):**
- **Mental Overhead**: Atomic operations have no internal steps to track - immediate comprehension (+2)
- **Business/Technical Ratio**: Business leaves are pure domain logic; adapter leaves isolate technical concerns (+2)
- **Complexity**: Single responsibility per leaf - no hidden interactions (+2)
- **Reliability**: Pure business leaves are deterministic and easily testable (+1)

### Business Leaves

Business leaves are pure functions that transform data or enforce business rules:

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
    return new OrderSummary(order.id(),
                            order.totalAmount(),
                            order.items().size());
}
```

If there's no I/O and no side effects, it's a business leaf. Keep each leaf focused on one transformation or one business rule.

### Adapter Leaves

Adapter leaves integrate with external systems: databases, HTTP clients, message queues, file systems. They map foreign errors to domain Causes.

```java
public interface UserRepository {
    Promise<Option<User>> findByEmail(Email email);
}

// Adapter leaf implementation
class PostgresUserRepository implements UserRepository {
    private final DataSource dataSource;

    public Promise<Option<User>> findByEmail(Email email) {
        return Promise.lift(RepositoryError.DatabaseFailure::new,
                            () -> {
                                try (var conn = dataSource.getConnection();
                                     var stmt = conn.prepareStatement(
                                         "SELECT * FROM users WHERE email = ?")) {

                                    stmt.setString(1, email.value());
                                    var rs = stmt.executeQuery();

                                    return rs.next() ? mapUser(rs) : null;
                                }
                            }).map(Option::option);
    }

    private User mapUser(ResultSet rs) throws SQLException {
        return new User(/* ... */);
    }
}
```

The adapter catches `SQLException` and wraps it in `RepositoryError.DatabaseFailure`, a domain `Cause`. Callers never see `SQLException`.

### Thread Safety

Leaf operations are **thread-safe through confinement** - each invocation operates independently with its own local state. Mutable local variables (accumulators, builders, working objects) are safe within a leaf because they never escape the function scope. Input parameters must be treated as read-only.

### Placement Rules

**If a leaf is only used by one caller**, keep it nearby (same file, same package).

**If it's reused**, move it immediately to the nearest `shared` package. Don't defer - tech debt accumulates when shared code stays in wrong locations.

---

## Pattern: Condition

**Definition:** Condition represents branching logic based on data. The key: express conditions as values, not control-flow side effects. Keep branches at the same abstraction level.

**Rationale (by criteria):**
- **Mental Overhead**: Conditions as expressions - evaluates to single value, not control flow scatter (+2)
- **Business/Technical Ratio**: Branch logic mirrors domain rules, not imperative jumps (+2)
- **Complexity**: Same abstraction level per branch - prevents tangled logic (+2)
- **Reliability**: Type-checked branches ensure all cases return compatible types (+2)

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

Use `filter` for cleaner composition when applicable:

```java
// DON'T: Ternary in lambda
return fetchUser(userId)
    .flatMap(user -> user.isActive()
        ? processActiveUser(user)
        : UserError.InactiveAccount.INSTANCE.result());

// DO: Using filter (preferred)
return fetchUser(userId)
    .filter(User::isActive, UserError.InactiveAccount.INSTANCE)
    .flatMap(this::processActiveUser);
```

---

## Pattern: Iteration

**Definition:** Iteration processes collections, streams, or recursive structures. Prefer functional combinators over explicit loops. Keep transformations pure.

**Rationale (by criteria):**
- **Mental Overhead**: Declarative combinators state intent; imperative loops require tracing (+2)
- **Business/Technical Ratio**: map/filter express business logic; loops are iteration mechanics (+2)
- **Complexity**: Functional composition eliminates index management and loop state (+2)
- **Reliability**: Pure transformations have no side effects - deterministic and testable (+2)

### Mapping Collections

```java
// Transforming a list of raw inputs to domain objects
Result<List<Email>> parseEmails(List<String> rawEmails) {
    return Result.allOf(rawEmails.stream()
                                 .map(Email::email)
                                 .toList());
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
```

**Parallel (when orders are independent):**
```java
// Process orders in parallel
Promise<List<Receipt>> processOrders(List<Order> orders) {
    return Promise.allOf(orders.stream()
                               .map(this::processOrder)
                               .toList());
}
```

Use parallel when operations are independent.

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

**DON'T use imperative loops when combinators exist:**
```java
// DON'T: Imperative accumulation
List<Result<Email>> results = new ArrayList<>();
for (String raw : rawEmails) {
    results.add(Email.email(raw));
}

// DO: Declarative collection
Result<List<Email>> emails = Result.allOf(
    rawEmails.stream().map(Email::email).toList()
);
```

---

## Naming Conventions

Consistent naming reduces cognitive load and makes code self-documenting.

### Factory Method Naming

Factories are always named after their type, lowercase-first (camelCase):

```java
Email.email("user@example.com")
Password.password("Secret123")
AccountId.accountId("ACC-001")
UserId.userId(raw)
```

This pattern is grep-friendly: searching for `Email.email` finds all email construction sites.

### Validated Input Naming

Use the `Valid` prefix (not `Validated`) for types representing validated inputs:

```java
// DO: Use Valid prefix
record ValidRequest(Email email, Password password) {
    static Result<ValidRequest> validRequest(Request raw) { ... }
}

// DON'T: Use Validated prefix (too verbose)
record ValidatedRequest(...)
```

### Zone-Based Naming Vocabulary

**Zone 2 Verbs (Step Interfaces - Orchestration):**

| Verb | When to Use | Example |
|------|-------------|---------|
| `validate` | Checking rules/constraints | `ValidateInput` |
| `process` | Transforming or interpreting data | `ProcessPayment` |
| `handle` | Coordinating reactions to events | `HandleRefund` |
| `load` | Retrieving data for use | `LoadUserProfile` |
| `save` | Persisting changes | `SaveOrder` |
| `check` | Verifying conditions | `CheckInventory` |

**Zone 3 Verbs (Leaves - Implementation):**

| Verb | Typical Use | Example |
|------|-------------|---------|
| `get` | Retrieve a value | `getTimestamp()` |
| `fetch` | Pull from external source | `fetchWeatherData()` |
| `parse` | Break down structured input | `parseJson()` |
| `calculate` | Perform computation | `calculateTax()` |
| `hash` | Cryptographic transformation | `hashPassword()` |
| `format` | Build structured output | `formatDate()` |
| `send` | Transmit over network | `sendEmail()` |

### Test Naming

Follow the pattern: `methodName_outcome_condition`

```java
void validRequest_succeeds_forValidInput()
void validRequest_fails_forInvalidEmail()
void execute_succeeds_forValidInput()
void execute_fails_whenEmailAlreadyExists()
```

---

## Key Takeaways

1. **Single Pattern Per Function** - One pattern per function, extract if you see two
2. **Single Level of Abstraction** - No complex logic in lambdas, only method references or simple forwarding
3. **Leaf** - Atomic unit: pure computation (business) or I/O (adapter)
4. **Condition** - Branching as values, same type from all branches
5. **Iteration** - Functional combinators over collections, pure transformations
6. **Zone-based naming** - Use appropriate verbs for each abstraction level

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 3.1: Pattern identification
- Exercise 3.2: Leaf extraction
- Exercise 3.4: Zone-based naming

---

## What's Next

[Chapter 9](ch08-advanced-patterns.md) covers advanced patterns - Sequencer, Fork-Join, and Aspects - that compose these basic patterns into sophisticated workflows.
