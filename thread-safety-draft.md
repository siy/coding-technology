# Thread Safety and Concurrency Considerations

## Thread Safety Guarantees and Rules

### Core Guarantees

**Promise Resolution:**
- Promise resolution is thread-safe and happens exactly once
- Multiple threads can attempt resolution; only first succeeds
- Resolution serves as synchronization point for all attached transformations
- Transformations (`map`, `flatMap`) execute after resolution in attachment order
- Side effects (`onSuccess`, `onFailure`) execute asynchronously and independently

**Pattern Safety:**
- All patterns except Fork-Join are safe regarding local mutable state
- Fork-Join requires immutable inputs due to parallel execution

**Input Data Immutability:**
- All input data passed to nested steps MUST be treated as immutable and read-only
- This ensures thread safety guarantees remain intact during step execution
- Mutating input data violates thread confinement and breaks safety guarantees

### Immutability Requirements by Context

**MUST be immutable:**
- Data passed between parallel operations (Fork-Join pattern)
- Data crossing Promise boundaries when parallel execution is possible
- Value objects used as map keys or in collections
- Response types returned from use cases (may be cached/reused)
- Input parameters to nested steps (read-only contract)

**CAN be mutable (thread-confined):**
- Local state within single operation (Leaf, Sequencer step, Condition branch)
- Accumulators in Iteration pattern (single-threaded iteration)
- Working objects within adapter boundaries (before domain conversion)
- Builder objects constructing immutable results
- State machines processing single request

**Key principle:** Mutability is safe when state is **thread-confined** (accessed by single thread). Sequential patterns guarantee isolation between steps.

### Pattern-Specific Safety Rules

**Leaf, Sequencer, Condition, Iteration:**
- Local mutable state is safe (thread-confined to operation)
- Input parameters must remain immutable (read-only)
- Result must be immutable when crossing Promise boundary

**Fork-Join:**
- All inputs MUST be immutable (parallel execution, no synchronization)
- Shared mutable state causes data races
- If shared context needed, use Sequencer instead

**Example - Safe mutable accumulator:**
```java
private DiscountResult applyRules(Cart cart, List<DiscountRule> rules) {
    var mutableCart = cart.toMutable();  // Local working copy
    var applied = new ArrayList<>();     // Local accumulator

    for (var rule : rules) {
        applied.add(rule.apply(mutableCart));
    }

    return new DiscountResult(
        mutableCart.toImmutable(),  // Immutable result
        List.copyOf(applied)
    );
}
```

**Why safe:** `mutableCart` and `applied` are local variables, never shared. Input `cart` remains unmodified.

**Example - Unsafe Fork-Join:**
```java
// ❌ WRONG: Shared mutable state
private final DiscountContext context = new DiscountContext();

Promise<Result> calculate() {
    return Promise.all(
        applyBogo(cart, context),      // DATA RACE
        applyPercentOff(cart, context)  // DATA RACE
    ).map(this::merge);
}

// ✅ CORRECT: Immutable inputs
Promise<Result> calculate(Cart cart) {
    return Promise.all(
        applyBogo(cart),
        applyPercentOff(cart)
    ).map(this::mergeDiscounts);
}
```

### When to Choose Immutability vs. Mutability

**Prefer immutability (default):**
- Data crossing Promise boundaries in Fork-Join
- Objects used as keys or in collections
- Data shared across multiple use cases
- Long-lived objects (cached, stored)
- All value objects and domain types

**Prefer mutability (specific cases):**
- Complex accumulation within single operation
- Performance-critical loops (proven bottleneck)
- Working with mutable framework objects
- Builder patterns constructing immutable results
- State machines with clear boundaries

**Rule of thumb:** Start with immutable records. Use mutability only within operation boundaries when it significantly simplifies logic.

### Common Mistakes

**❌ Mutating input data:**
```java
private Result<Cart> applyDiscount(Cart cart, Discount discount) {
    cart.setSubtotal(cart.subtotal().subtract(discount.amount()));  // WRONG
    return Result.success(cart);
}
```

**✅ Create new instance:**
```java
private Result<Cart> applyDiscount(Cart cart, Discount discount) {
    var newSubtotal = cart.subtotal().subtract(discount.amount());
    return Result.success(new Cart(newSubtotal, cart.items()));
}
```

**❌ Sharing mutable state across steps:**
```java
private final Accumulator shared = new Accumulator();

Promise<Result> process() {
    return step1(shared)  // WRONG: shared across steps
        .flatMap(r -> step2(shared));
}
```

**✅ Pass immutable data, create local mutable state:**
```java
Promise<Result> process() {
    return step1()
        .flatMap(this::step2);
}

private Promise<Result> step1() {
    var local = new Accumulator();  // Thread-confined
    // ... use local
    return Promise.success(local.toImmutable());
}
```

### Testing Considerations

Mutable test state is acceptable (test execution is single-threaded):

```java
@Test
void execute_appliesDiscounts_inCorrectOrder() {
    var callLog = new ArrayList<String>();  // Mutable test state

    DiscountRule bogo = createLoggingRule("BOGO", callLog);
    DiscountRule percent = createLoggingRule("PERCENT", callLog);

    calculateDiscounts.apply(new CartWithRules(cart, List.of(bogo, percent)))
        .await()
        .onFailure(Assertions::fail);

    assertEquals(List.of("BOGO", "PERCENT"), callLog);
}
```

---

## Implementation of Typical Patterns

This section demonstrates implementation of patterns that might seem incompatible with JBCT at first glance.

### Builder Pattern

**Challenge:** Builders use mutable state, but JBCT emphasizes immutability.

**Solution:** Use builders within operation boundaries, return immutable results.

```java
// Use case step using builder pattern
public Promise<EnrichedRequest> execute(ValidRequest req) {
    return Promise.lift(
        EnrichmentError.Failed::cause,
        () -> buildEnrichedRequest(req)
    );
}

private EnrichedRequest buildEnrichedRequest(ValidRequest req) {
    var builder = new RequestEnricher();  // Mutable, thread-confined

    builder.setEmail(req.email());
    builder.setPassword(req.password());
    builder.applyDefaults();
    builder.enrichFromContext();

    return builder.build();  // Returns immutable result
}

// Mutable builder (used only within operation)
private static class RequestEnricher {
    private Email email;
    private Password password;
    private Timezone timezone;
    private Language language;

    void setEmail(Email email) {
        this.email = email;
    }

    void setPassword(Password password) {
        this.password = password;
    }

    void applyDefaults() {
        this.timezone = Timezone.UTC;
        this.language = Language.ENGLISH;
    }

    void enrichFromContext() {
        if (email.domain().equals("company.com")) {
            this.timezone = Timezone.CORPORATE;
            this.language = Language.CORPORATE_DEFAULT;
        }
    }

    EnrichedRequest build() {
        return new EnrichedRequest(email, password, timezone, language);
    }
}
```

**Key points:**
- Builder created fresh for each invocation
- Mutable state confined to `buildEnrichedRequest()` call
- Result is immutable record
- Thread-safe through confinement

### State Machine Pattern

**Challenge:** State machines maintain mutable state, tracking current state and transitions.

**Solution:** Encapsulate state machine within operation, return immutable result capturing final state.

```java
// Use case step implementing order processing state machine
public Promise<ProcessedOrder> execute(Order order) {
    return Promise.lift(
        OrderError.ProcessingFailed::cause,
        () -> processOrder(order)
    );
}

private ProcessedOrder processOrder(Order order) {
    var stateMachine = new OrderStateMachine(order);

    stateMachine.validate();
    stateMachine.calculateTotals();
    stateMachine.applyTaxes();
    stateMachine.checkInventory();
    stateMachine.reserve();

    return stateMachine.buildResult();
}

// State machine with mutable state (thread-confined)
private static class OrderStateMachine {
    private final Order order;
    private OrderState state;
    private Money subtotal;
    private Money tax;
    private List<ValidationError> errors;

    OrderStateMachine(Order order) {
        this.order = order;
        this.state = OrderState.RECEIVED;
        this.errors = new ArrayList<>();
    }

    void validate() {
        if (order.items().isEmpty()) {
            errors.add(new ValidationError("Empty order"));
            state = OrderState.INVALID;
            return;
        }
        state = OrderState.VALIDATED;
    }

    void calculateTotals() {
        if (state != OrderState.VALIDATED) {
            return;
        }
        subtotal = order.items().stream()
            .map(LineItem::price)
            .reduce(Money.zero(), Money::add);
        state = OrderState.TOTALS_CALCULATED;
    }

    void applyTaxes() {
        if (state != OrderState.TOTALS_CALCULATED) {
            return;
        }
        tax = subtotal.multiply(order.taxRate());
        state = OrderState.TAXES_APPLIED;
    }

    void checkInventory() {
        if (state != OrderState.TAXES_APPLIED) {
            return;
        }
        // Check inventory logic...
        state = OrderState.INVENTORY_CHECKED;
    }

    void reserve() {
        if (state != OrderState.INVENTORY_CHECKED) {
            return;
        }
        // Reserve inventory...
        state = OrderState.RESERVED;
    }

    ProcessedOrder buildResult() {
        return new ProcessedOrder(
            order.id(),
            state,
            subtotal,
            tax,
            List.copyOf(errors)
        );
    }
}

enum OrderState {
    RECEIVED, VALIDATED, TOTALS_CALCULATED,
    TAXES_APPLIED, INVENTORY_CHECKED, RESERVED, INVALID
}
```

**Key points:**
- State machine created fresh per order
- Mutable state (state field, subtotal, tax, errors) confined to processing
- State transitions controlled by sequential method calls
- Immutable result captures final state
- Thread-safe through confinement

### Strategy Pattern

**Challenge:** Strategy pattern with strategies that need to accumulate state.

**Solution:** Each strategy operates on immutable input, maintains local mutable state, returns immutable result.

```java
// Use case step applying discount strategy
public Promise<DiscountResult> execute(CartWithRules data) {
    return Promise.lift(
        DiscountError.CalculationFailed::cause,
        () -> applyStrategy(data)
    );
}

private DiscountResult applyStrategy(CartWithRules data) {
    var strategy = selectStrategy(data.cart(), data.rules());
    return strategy.apply(data.cart(), data.rules());
}

private DiscountStrategy selectStrategy(Cart cart, List<DiscountRule> rules) {
    return hasExclusiveRules(rules)
        ? new ExclusiveStrategy()
        : new StackingStrategy();
}

// Strategy interface
interface DiscountStrategy {
    DiscountResult apply(Cart cart, List<DiscountRule> rules);
}

// Strategy with internal accumulator
class StackingStrategy implements DiscountStrategy {
    @Override
    public DiscountResult apply(Cart cart, List<DiscountRule> rules) {
        var applicable = filterApplicable(cart, rules);
        return applyAllRules(cart, applicable);
    }

    private List<DiscountRule> filterApplicable(Cart cart, List<DiscountRule> rules) {
        return rules.stream()
            .filter(rule -> rule.isApplicable(cart))
            .toList();
    }

    private DiscountResult applyAllRules(Cart cart, List<DiscountRule> rules) {
        var mutableCart = cart.toMutable();  // Local working copy
        var applied = new ArrayList<AppliedDiscount>();

        for (var rule : rules) {
            applied.add(rule.apply(mutableCart));
        }

        return new DiscountResult(
            mutableCart.toImmutable(),
            List.copyOf(applied)
        );
    }
}

// Alternative strategy
class ExclusiveStrategy implements DiscountStrategy {
    @Override
    public DiscountResult apply(Cart cart, List<DiscountRule> rules) {
        var exclusive = selectBestExclusive(cart, rules);
        return applyExclusiveRule(cart, exclusive);
    }

    private DiscountRule selectBestExclusive(Cart cart, List<DiscountRule> rules) {
        return rules.stream()
            .filter(rule -> rule.type() == RuleType.EXCLUSIVE)
            .filter(rule -> rule.isApplicable(cart))
            .max(Comparator.comparing(rule -> rule.estimateDiscount(cart)))
            .orElseThrow();
    }

    private DiscountResult applyExclusiveRule(Cart cart, DiscountRule rule) {
        var mutableCart = cart.toMutable();
        var applied = rule.apply(mutableCart);

        return new DiscountResult(
            mutableCart.toImmutable(),
            List.of(applied)
        );
    }
}

// Mutable cart for calculation phase
class MutableCart {
    private Money subtotal;
    private final List<LineItem> items;

    MutableCart(Money subtotal, List<LineItem> items) {
        this.subtotal = subtotal;
        this.items = new ArrayList<>(items);
    }

    void applyDiscount(Money amount) {
        this.subtotal = subtotal.subtract(amount);
    }

    Money subtotal() {
        return subtotal;
    }

    List<LineItem> items() {
        return items;
    }

    ImmutableCart toImmutable() {
        return new ImmutableCart(subtotal, List.copyOf(items));
    }
}

// Immutable cart for boundaries
record ImmutableCart(Money subtotal, List<LineItem> items) {
    MutableCart toMutable() {
        return new MutableCart(subtotal, items);
    }
}
```

**Key points:**
- Strategy selected based on input
- Each strategy instance created fresh (stateless)
- Strategies use local mutable state (MutableCart, accumulators)
- Input cart remains immutable (read-only)
- Results are immutable
- Thread-safe through confinement

### Accumulator Pattern

**Challenge:** Accumulating results across multiple operations (e.g., validation errors, metrics).

**Solution:** Use mutable accumulator within single operation, return immutable result.

```java
// Use case step validating and collecting errors
public Result<ValidatedOrder> execute(Order order) {
    return validateOrder(order);
}

private Result<ValidatedOrder> validateOrder(Order order) {
    var validator = new OrderValidator();

    validator.checkOrderId(order.id());
    validator.checkItems(order.items());
    validator.checkCustomer(order.customerId());
    validator.checkShippingAddress(order.shippingAddress());

    return validator.buildResult(order);
}

// Accumulator with mutable state
private static class OrderValidator {
    private final List<ValidationError> errors = new ArrayList<>();

    void checkOrderId(OrderId id) {
        if (id == null) {
            errors.add(new ValidationError("Order ID required"));
        }
    }

    void checkItems(List<LineItem> items) {
        if (items.isEmpty()) {
            errors.add(new ValidationError("Order must have items"));
        }

        var duplicates = findDuplicates(items);
        if (!duplicates.isEmpty()) {
            errors.add(new ValidationError("Duplicate items: " + duplicates));
        }
    }

    void checkCustomer(CustomerId customerId) {
        if (customerId == null) {
            errors.add(new ValidationError("Customer ID required"));
        }
    }

    void checkShippingAddress(Address address) {
        if (address == null) {
            errors.add(new ValidationError("Shipping address required"));
        }
    }

    Result<ValidatedOrder> buildResult(Order order) {
        if (errors.isEmpty()) {
            return Result.success(new ValidatedOrder(order));
        }

        return ValidationFailed.cause(List.copyOf(errors)).result();
    }

    private List<Sku> findDuplicates(List<LineItem> items) {
        return items.stream()
            .collect(Collectors.groupingBy(LineItem::sku, Collectors.counting()))
            .entrySet().stream()
            .filter(e -> e.getValue() > 1)
            .map(Map.Entry::getKey)
            .toList();
    }
}
```

**Key points:**
- Validator created fresh for each order
- Mutable errors list accumulates validation failures
- Input order remains immutable
- Result contains immutable error list
- Thread-safe through confinement

### Complete Use Case Example

Combining patterns in complete use case:

```java
public interface ApplyDiscounts {
    record Request(CartId cartId, List<CouponCode> coupons) {}
    record Response(DiscountedCart cart, List<AppliedDiscount> applied) {}

    Promise<Response> execute(Request request);

    interface FetchCart {
        Promise<Cart> apply(ValidRequest request);
    }

    interface LoadRules {
        Promise<CartWithRules> apply(Cart cart);
    }

    interface CalculateDiscounts {
        Promise<DiscountResult> apply(CartWithRules data);
    }

    interface SaveCart {
        Promise<Response> apply(DiscountResult result);
    }

    static ApplyDiscounts applyDiscounts(
        FetchCart fetchCart,
        LoadRules loadRules,
        CalculateDiscounts calculateDiscounts,
        SaveCart saveCart
    ) {
        return request -> ValidRequest.validRequest(request)
            .async()
            .flatMap(fetchCart::apply)        // Sequencer pattern
            .flatMap(loadRules::apply)
            .flatMap(calculateDiscounts::apply)  // Uses strategy + accumulator
            .flatMap(saveCart::apply);
    }
}
```

**Demonstrates:**
- Sequencer pattern (linear composition)
- Strategy pattern (CalculateDiscounts selects strategy)
- Accumulator pattern (collecting applied discounts)
- Builder pattern (constructing enriched data)
- All using thread-confined mutable state safely
