# Fork-Join Pattern

**Purpose**: Execute multiple independent operations in parallel, then combine results.

## Definition

Fork-Join runs operations concurrently when they don't depend on each other's outputs.

```java
return Promise.all(operation1, operation2, operation3)
    .map((result1, result2, result3) -> combine(result1, result2, result3));
```

## Structure

### Parallel Operations with Promise.all

```java
public Promise<Dashboard> loadDashboard(UserId userId) {
    return Promise.all(
        fetchProfile.apply(userId),
        fetchPreferences.apply(userId),
        fetchRecentOrders.apply(userId)
    ).map((profile, prefs, orders) ->
        new Dashboard(profile, prefs, orders)
    );
}
```

### Up to 15 Parallel Operations

Promise.all supports 1-15 operations:

```java
// 2 operations
Promise.all(op1, op2)
    .map((r1, r2) -> combine(r1, r2));

// 3 operations
Promise.all(op1, op2, op3)
    .map((r1, r2, r3) -> combine(r1, r2, r3));

// ... up to 15 operations
```

### allOrCancel — Parallel with Cancellation

`Promise.allOrCancel()` behaves like `Promise.all()` but **cancels remaining promises** on first failure. Use when outstanding operations become pointless after any failure.

```java
// Cancel remaining if any fails — no wasted work
Promise.allOrCancel(
    chargePayment.apply(order),
    reserveInventory.apply(order),
    notifyWarehouse.apply(order)
).map(this::confirmOrder);
```

Both `all()` and `allOrCancel()` have instance variants for for-comprehension style:

```java
promise.all(fn1, fn2, fn3).map(combine);            // fail-fast, no cancel
promise.allOrCancel(fn1, fn2, fn3).map(combine);     // fail-fast + cancel remaining
```

## With Result.all for Validation

```java
public Result<ValidRequest> validate(Request request) {
    return Result.all(
        Email.email(request.email()),
        Password.password(request.password()),
        UserId.userId(request.userId())
    ).map(ValidRequest::new);
}
```

**Key difference**: `Result.all` accumulates all failures (CompositeCause), while `Promise.all` fails fast on first error. Use `Promise.allOrCancel` to also cancel remaining promises on failure.

## Thread Safety

**Fork-Join requires strict immutability.** All parallel operations must receive immutable inputs. Shared mutable state creates data races.

### ❌ Data Race Example

```java
// WRONG - Shared mutable context
private final DiscountContext context = new DiscountContext();

Promise.all(
    applyBogo(cart, context),      // Mutates context
    applyPercentOff(cart, context)  // DATA RACE - concurrent mutation
).map(this::merge);
```

### ✅ Correct: Immutable Inputs

```java
// CORRECT - Immutable cart passed to both
Promise.all(
    applyBogo(cart),          // cart is immutable
    applyPercentOff(cart)     // cart is immutable
).map(this::mergeDiscounts);
```

**Rule:** If parallel operations share any data, that data MUST be immutable (records, immutable collections, value objects).

## Critical Rules

### 1. Operations Must Be Independent

```java
// ✅ CORRECT - All independent
Promise.all(
    fetchUser.apply(userId),
    fetchTheme.apply(userId),
    fetchLanguage.apply(userId)
).map(combine);

// ❌ WRONG - step2 depends on step1 result
Promise.all(
    step1.apply(input),
    step2.apply(input)  // Actually needs step1's output
).map(combine);

// ✅ CORRECT - Use Sequencer
step1.apply(input)
    .flatMap(step2::apply);
```

### 2. Combine Results with map

```java
Promise.all(fetchA, fetchB, fetchC)
    .map((a, b, c) -> new Combined(a, b, c));
```

### 3. Don't Nest Fork-Joins

```java
// ❌ WRONG - Nested Promise.all
Promise.all(
    fetchA,
    Promise.all(fetchB, fetchC).map(combine)
).map(flatten);

// ✅ CORRECT - Flat structure
Promise.all(fetchA, fetchB, fetchC)
    .map((a, b, c) -> combine(a, b, c));
```

## Common Patterns

### Enrich Entity with Multiple Sources

```java
public Promise<EnrichedUser> enrichUser(UserId id) {
    return Promise.all(
        loadUser.apply(id),
        loadProfile.apply(id),
        loadPermissions.apply(id)
    ).map((user, profile, permissions) ->
        new EnrichedUser(user, profile, permissions)
    );
}
```

### Validate Multiple Fields

```java
public Result<ValidRegistration> validate(Registration reg) {
    return Result.all(
        Email.email(reg.email()),
        Password.password(reg.password()),
        Username.username(reg.username()),
        PhoneNumber.phoneNumber(reg.phone())
    ).map(ValidRegistration::new);
}
```

### Aggregate from Multiple Services

```java
public Promise<Report> generateReport(ReportId id) {
    return Promise.all(
        salesService.getMetrics(id),
        analyticsService.getStats(id),
        inventoryService.getStock(id)
    ).map((sales, analytics, stock) ->
        new Report(sales, analytics, stock)
    );
}
```

## Error Handling

### Fail-Fast Behavior

```java
// If any promise fails, entire Fork-Join fails immediately
Promise.all(operation1, operation2, operation3)
    .map(combine)
    .recover(cause -> handleFailure(cause));
```

### Optional Values

```java
// Handle optional results explicitly
Promise.all(
    fetchUser.apply(id),
    fetchTheme.apply(id).map(Option::option)  // Wrap in Option
).map((user, maybeTheme) ->
    new UserWithTheme(user, maybeTheme.orElse(Theme.DEFAULT))
);
```

## Testing Fork-Joins

```java
@Test
void loadDashboard_combinesAllData() {
    UserId id = UserId.random();
    User user = TestData.user(id);
    Theme theme = TestData.theme();
    List<Order> orders = TestData.orders(3);

    var fetchUser = stub(user);
    var fetchTheme = stub(theme);
    var fetchOrders = stub(orders);

    var useCase = LoadDashboard.loadDashboard(
        fetchUser, fetchTheme, fetchOrders
    );

    useCase.execute(new Request(id.value()))
           .await()
           .onFailure(Assertions::fail)
           .onSuccess(dashboard -> {
               assertEquals(user.email(), dashboard.userEmail());
               assertEquals(theme, dashboard.theme());
               assertEquals(3, dashboard.orders().size());
           });
}

@Test
void loadDashboard_fails_whenAnyOperationFails() {
    var fetchUser = failureStub(UserError.NotFound.INSTANCE);
    var fetchTheme = stub(TestData.theme());

    var useCase = LoadDashboard.loadDashboard(fetchUser, fetchTheme);

    useCase.execute(new Request(UserId.random().value()))
           .await()
           .onSuccess(Assertions::fail);
}
```

## Combining with Sequencer

```java
// Validate first (Fork-Join), then process sequentially
return Result.all(
        Email.email(request.email()),
        Password.password(request.password())
    )
    .map(ValidRequest::new)
    .async()                          // Switch to Promise
    .flatMap(checkAvailability::apply)  // Sequencer starts
    .flatMap(saveUser::apply);
```

## Performance Considerations

Fork-Join enables parallel execution:

```java
// Sequential: 3 × 100ms = 300ms
loadUser(id)
    .flatMap(u -> loadProfile(u.id()))
    .flatMap(p -> loadOrders(p.userId()));

// Parallel: max(100ms, 100ms, 100ms) = 100ms
Promise.all(
    loadUser(id),
    loadProfile(id),
    loadOrders(id)
).map(combine);
```

## Anti-Patterns

### ❌ Using Fork-Join for Dependent Operations

```java
// DON'T - step2 needs step1's output
Promise.all(step1, step2).map(combine);
```

### ❌ Ignoring Partial Results

```java
// DON'T - If one fails, you lose all results
Promise.all(fetchA, fetchB)
    .map(combine);

// DO - Use Promise.allOf for independent failures
Promise.allOf(List.of(fetchA, fetchB))
    .map(results -> combinePartial(results));

// DO - Use Promise.allOfOrCancel to also cancel remaining on first failure
Promise.allOfOrCancel(List.of(fetchA, fetchB))
    .map(results -> combinePartial(results));
```

### ❌ Excessive Parallelism

```java
// DON'T - Too many parallel operations to reason about

// DO - Group related operations
Promise.all(
    groupA(op1, op2, op3),
    groupB(op4, op5, op6),
    groupC(op7, op8, op9)
).map(combine);
```

## Related

- [sequencer.md](sequencer.md) - Sequential dependent operations
- [leaf.md](leaf.md) - Individual operations being forked
- [../fundamentals/four-return-kinds.md](../fundamentals/four-return-kinds.md) - Promise.all behavior
