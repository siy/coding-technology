# Leaf Pattern

**Purpose**: Atomic operations that cannot be decomposed further. One operation, no composition.

## Definition

A Leaf performs exactly one of:
1. **Business logic computation** - Pure domain logic
2. **I/O operation** - External system interaction, inside an I/O step's factory

Leaves are the building blocks. All other patterns compose leaves.

## Business Logic Leaves

### Simple Computation

```java
private User mapToUser(ResultSet rs) throws SQLException {
    return new User(
        UserId.unsafe(UUID.fromString(rs.getString("id"))),
        Email.unsafe(rs.getString("email")),
        rs.getString("display_name")
    );
}
```

### Business Rule Validation

```java
private Result<ValidOrder> validateOrderLimits(Order order) {
    if (order.total().isGreaterThan(Money.of(10000, USD))) {
        return OrderError.ExceedsLimit.INSTANCE.result();
    }
    if (order.items().size() > MAX_ITEMS_PER_ORDER) {
        return OrderError.TooManyItems.INSTANCE.result();
    }
    return Result.success(new ValidOrder(order));
}
```

### Domain Calculation

```java
private Money calculateTax(Money subtotal, TaxRate rate) {
    return subtotal.multiply(rate.value());
}

private int calculateLoyaltyPoints(Order order) {
    return (int) (order.total().amount() / 10);
}
```

## I/O Leaves

An I/O leaf is an I/O step: an interface whose static factory takes the infrastructure and implements the step with a lambda. It sits nested in its use case, or in an `io` package once it outgrows the file. Library types and `lift` appear only inside such factories, and an I/O step never composes other steps.

### Database Query

```java
interface FindUser {
    Promise<Option<User>> apply(Email email);

    static FindUser findUser(JdbcTemplate jdbcTemplate) {
        return email -> Promise.lift(t -> StorageError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
                                     () -> Option.from(jdbcTemplate.query("SELECT * FROM users WHERE email = ?",
                                                                          FindUser::mapToUser,
                                                                          email.value())
                                                                   .stream()
                                                                   .findFirst()));
    }

    private static User mapToUser(ResultSet rs, int rowNum) throws SQLException {
        return new User(UserId.unsafe(UUID.fromString(rs.getString("id"))),
                        Email.unsafe(rs.getString("email")),
                        rs.getString("display_name"));
    }
}
```

### Database Insert

```java
interface SaveUser {
    Promise<UserId> apply(User user);

    static SaveUser saveUser(JdbcTemplate jdbcTemplate) {
        return user -> Promise.lift(t -> StorageError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
                                    () -> insert(jdbcTemplate, user));
    }

    private static UserId insert(JdbcTemplate jdbcTemplate, User user) {
        jdbcTemplate.update("INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)",
                            user.id().value(),
                            user.email().value(),
                            user.displayName());
        return user.id();
    }
}
```

### HTTP Request

```java
interface FetchExchangeRate {
    Promise<ExchangeRate> apply(Currency from, Currency to);

    static FetchExchangeRate fetchExchangeRate(RestClient restClient) {
        return (from, to) -> Promise.lift(t -> RateError.ServiceFailure.FACTORY.apply(Causes.fromThrowable(t)),
                                          () -> restClient.get()
                                                          .uri("/rates?from={from}&to={to}", from.code(), to.code())
                                                          .retrieve()
                                                          .body(ExchangeRate.class));
    }
}
```

### Message Queue

```java
interface PublishOrderPlaced {
    Promise<Unit> apply(OrderPlaced event);

    static PublishOrderPlaced publishOrderPlaced(RabbitTemplate rabbitTemplate) {
        return event -> Promise.lift(t -> OrderError.PublishFailed.FACTORY.apply(Causes.fromThrowable(t)),
                                     () -> rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY, event));
    }
}
```

The step names say what the step does for the business (`FindUser`, `PublishOrderPlaced`); the technology shows only in the factory's parameter type.

## Thread Safety

**Leaf operations are thread-safe through confinement.** Each leaf operation executes independently without shared mutable state.

- **Business logic leaves**: Pure functions or thread-confined mutable state
- **I/O leaves**: Framework handles thread safety (connection pools, etc.)

```java
// OK - Mutable local state (thread-confined)
private User mapToUser(ResultSet rs) throws SQLException {
    var attributes = new HashMap<String, String>();  // Thread-confined
    // Build user from result set
    return new User(...);  // Immutable result
}
```

**Rule:** Leaf operations can use mutable local state internally, but must return immutable results.

## Critical Rules

### 1. One Operation Per Leaf

Each leaf does ONE thing:

```java
// ❌ WRONG - two operations in one leaf
public Promise<User> loadAndValidateUser(UserId id) {
    return Promise.lift(() -> {
        User user = fetchUser(dsl, id);
        if (user.isLocked()) {
            throw new UserLockedException();
        }
        return user;
    });
}

// ✅ CORRECT - Separate leaves
public Promise<User> loadUser(UserId id) {
    return Promise.lift(
        t -> StorageError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
        () -> fetchUser(dsl, id)
    );
}

public Result<User> validateNotLocked(User user) {
    if (user.isLocked()) {
        return UserError.Locked.INSTANCE.result();
    }
    return Result.success(user);
}
```

### 2. No Composition in Leaves

Don't call other leaves or compose operations:

```java
// ❌ WRONG - Composition in leaf
public Promise<User> loadUserWithProfile(UserId id) {
    return loadUser(id)  // Calling another operation
        .flatMap(this::loadProfile)
        .map(this::combineUserProfile);
}

// ✅ CORRECT - Leaf does only I/O
public Promise<User> loadUser(UserId id) {
    return Promise.lift(
        t -> StorageError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
        () -> fetchUser(dsl, id)
    );
}

// ✅ CORRECT - Composition in Sequencer pattern
public Promise<UserProfile> loadUserWithProfile(UserId id) {
    return loadUser(id)
        .flatMap(this::loadProfile)
        .map(this::combineUserProfile);
}
```

### 3. Framework Independence for Business Logic

Business logic leaves must not depend on frameworks:

```java
// ❌ WRONG - Framework dependency in business logic
import org.springframework.stereotype.Component;

@Component
public class TaxCalculator {
    public Money calculateTax(Money amount) { ... }
}

// ✅ CORRECT - Pure business logic
public class TaxCalculator {
    public Money calculateTax(Money amount, TaxRate rate) {
        return amount.multiply(rate.value());
    }
}
```

### 4. Lift Exceptions in I/O Step Factories

Always wrap throwing code in the I/O step's factory, and nowhere else:

```java
// ✅ CORRECT
static LoadUser loadUser(JdbcTemplate jdbcTemplate) {
    return id -> Promise.lift(
        t -> StorageError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),  // Exception → Cause mapping
        () -> jdbcTemplate.queryForObject(...)
    );
}
```

## Testing Leaves

### Testing Business Logic Leaves

```java
@Test
void calculateTax_applies_correctRate() {
    Money subtotal = Money.of(100, USD);
    TaxRate rate = TaxRate.of(0.15);

    Money tax = taxCalculator.calculateTax(subtotal, rate);

    assertEquals(Money.of(15, USD), tax);
}
```

### Testing I/O Leaves with Stubs

Call the step's factory with a stubbed library object, then apply the step:

```java
@Test
void loadUser_succeeds_whenUserExists() {
    UserId id = UserId.random();
    User expected = TestData.user(id);

    // Stub the library the factory takes
    when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq(id.value())))
        .thenReturn(expected);

    LoadUser.loadUser(jdbcTemplate)
            .apply(id)
            .await()
            .onFailure(Assertions::fail)
            .onSuccess(user -> assertEquals(expected, user));
}

@Test
void loadUser_fails_whenUserNotFound() {
    UserId id = UserId.random();

    when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq(id.value())))
        .thenThrow(new EmptyResultDataAccessException(1));

    LoadUser.loadUser(jdbcTemplate)
            .apply(id)
            .await()
            .onSuccess(Assertions::fail);  // Should fail
}
```

## Common Leaf Patterns

### Option Return for Lookups

```java
public Promise<Option<Theme>> findTheme(UserId id) {
    return Promise.lift(
        t -> StorageError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
        () -> Option.option(fetchTheme(dsl, id))
    );
}
```

### Result Return for Validation

```java
public Result<ValidOrder> checkInventory(Order order) {
    for (Item item : order.items()) {
        int available = inventory.getStock(item.productId());
        if (available < item.quantity()) {
            return OrderError.InsufficientStock.of(
                item.productId(),
                available
            ).result();
        }
    }
    return Result.success(new ValidOrder(order));
}
```

### Promise<Unit> for Side Effects

```java
public Promise<Unit> sendEmail(Email to, String subject, String body) {
    return Promise.lift(
        t -> EmailError.SendFailed.FACTORY.apply(Causes.fromThrowable(t)),
        () -> {
            mailer.send(to.value(), subject, body);
            return Unit.unit();
        }
    );
}
```

### Batch Operations

```java
public Promise<List<User>> loadUsers(List<UserId> ids) {
    return Promise.lift(
        t -> StorageError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
        () -> jdbcTemplate.query(
            "SELECT * FROM users WHERE id IN (?)",
            new Object[]{ids.stream().map(UserId::value).toList()},
            this::mapToUser
        )
    );
}
```

## Anti-Patterns

### ❌ Several Operations In One Leaf

```java
// DON'T - Business logic + I/O in same leaf
public Promise<Order> validateAndSaveOrder(Order order) {
    return Promise.lift(() -> {
        if (order.items().isEmpty()) {
            throw new InvalidOrderException();
        }
        return insertOrder(dsl, order);
    });
}
```

### ❌ Composition in Leaf

```java
// DON'T - Composing other operations
public Promise<User> loadUserWithDefaults(UserId id) {
    return loadUser(id)
        .recover(e -> loadDefaultUser());
}
```

### ❌ Framework Coupling in Business Logic

```java
// DON'T - @Autowired in business logic
public class OrderValidator {
    @Autowired
    private DSLContext dsl;

    public Result<Order> validate(Order order) { ... }
}
```

### ❌ Uncaught Exceptions in I/O Steps

```java
// DON'T - Let exceptions escape
public Promise<User> loadUser(UserId id) {
    return Promise.promise(() ->
        // SQLException not wrapped - will cause runtime error
        Result.success(jdbcTemplate.queryForObject(...))
    );
}
```

## When to Use Leaf Pattern

- Implementing I/O steps (database access)
- Calling remote services over HTTP
- Writing pure business logic functions
- Implementing validation rules
- Calculating derived values
- Mapping between types

## Composition with Other Patterns

Leaves are composed by higher-level patterns:

- **Sequencer** - Chains multiple leaves
- **Fork-Join** - Runs leaves in parallel
- **Condition** - Routes between leaves
- **Iteration** - Maps leaf over collection
- **Aspects** - Wraps leaf with cross-cutting concerns

## Related

- [sequencer.md](sequencer.md) - Chaining leaves sequentially
- [fork-join.md](fork-join.md) - Running leaves in parallel
- [../fundamentals/four-return-kinds.md](../fundamentals/four-return-kinds.md) - Return type selection
- [../fundamentals/no-business-exceptions.md](../fundamentals/no-business-exceptions.md) - Exception lifting
