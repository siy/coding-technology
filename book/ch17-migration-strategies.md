# Chapter 17: Migration Strategies

This chapter provides a practical playbook for adopting JBCT in existing codebases. Whether you're working with a legacy monolith or a modern Spring Boot application, you'll learn how to migrate incrementally without disrupting ongoing development.

---

## Assessment: Is Your Codebase Ready?

Before migrating, evaluate your starting point.

### Readiness Checklist

| Factor | Ready | Needs Work |
|--------|-------|------------|
| Java version | 17+ (records, sealed interfaces) | Upgrade first |
| Build tool | Maven or Gradle | Any modern build tool |
| Test coverage | Some tests exist | Add tests before refactoring |
| Team size | Any | Larger teams need more coordination |
| Release cycle | Regular releases | Establish before major changes |

### Code Smell Indicators

These patterns indicate high-value migration targets:

```java
// 1. Validation scattered across layers
@PostMapping("/users")
public ResponseEntity<?> createUser(@RequestBody UserDto dto) {
    if (dto.getEmail() == null || dto.getEmail().isEmpty()) {
        return ResponseEntity.badRequest().body("Email required");
    }
    if (!dto.getEmail().contains("@")) {
        return ResponseEntity.badRequest().body("Invalid email");
    }
    // ... more validation
    userService.create(dto);  // Service also validates!
}

// 2. Null checks everywhere
public Order processOrder(Order order) {
    if (order == null) return null;
    if (order.getCustomer() == null) return null;
    if (order.getCustomer().getAddress() == null) {
        throw new ValidationException("Address required");
    }
    // ... actual logic buried under null checks
}

// 3. Exception-based control flow
public User findUser(Long id) {
    try {
        return repository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    } catch (DataAccessException e) {
        throw new ServiceException("Database error", e);
    }
}

// 4. Mixed concerns in services
@Service
public class UserService {
    public User register(UserDto dto) {
        // Validation
        validateEmail(dto.getEmail());
        validatePassword(dto.getPassword());

        // Business logic
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new EmailExistsException();
        }

        // Infrastructure
        String hashedPassword = passwordEncoder.encode(dto.getPassword());
        User user = new User(dto.getEmail(), hashedPassword);
        return userRepository.save(user);
    }
}
```

---

## Migration Phases

### Phase 1: Value Objects Only (Week 1-2)

**Goal:** Introduce parse-don't-validate without changing existing code structure.

**What to do:**
1. Add Pragmatica Lite dependency
2. Create value objects for commonly validated fields
3. Use value objects in new code
4. Gradually replace primitives in existing code

**Start with these value objects:**
- Email
- Password
- UserId / CustomerId / OrderId
- Money / Currency
- Phone number

**Example: Adding Email value object**

```java
// NEW: Value object
public record Email(String value) {
    private static final Pattern PATTERN = Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$");
    private static final Cause INVALID = Causes.cause("Invalid email format");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notBlank)
            .map(String::trim)
            .map(String::toLowerCase)
            .flatMap(Verify.ensureFn(INVALID, Verify.Is::matches, PATTERN))
            .map(Email::new);
    }
}

// EXISTING: Service method (unchanged initially)
@Service
public class UserService {
    public User register(String email, String password) {
        // Existing validation still here
        if (email == null || !email.contains("@")) {
            throw new ValidationException("Invalid email");
        }
        // ... rest of method
    }
}

// NEW: Parallel method using value object
public Result<User> registerValidated(Email email, Password password) {
    // No validation needed - email and password are already valid
    return checkEmailUnique(email)
        .flatMap(e -> hashPassword(password))
        .map(hashed -> createUser(email, hashed));
}
```

**Migration pattern:**
1. Create value object
2. Add parallel method accepting value object
3. Update callers one by one
4. Delete old method when all callers migrated

### Phase 2: Result in New Code (Week 3-4)

**Goal:** Stop adding new exception-based code.

**Team agreement:**
- All new methods return `Result<T>` or `Promise<T>` for fallible operations
- New validation uses value object factories
- Exceptions only at adapter boundaries (wrapping external libraries)

**Example: New feature with Result**

```java
// NEW FEATURE: Apply discount code
public interface ApplyDiscount {
    Result<DiscountedPrice> apply(OrderId orderId, DiscountCode code);
}

// Implementation
public class ApplyDiscountImpl implements ApplyDiscount {
    @Override
    public Result<DiscountedPrice> apply(OrderId orderId, DiscountCode code) {
        return findOrder(orderId)
            .flatMap(order -> validateCode(code, order))
            .map(discount -> calculateDiscountedPrice(order, discount));
    }

    private Result<Order> findOrder(OrderId id) {
        return Option.option(orderRepository.findById(id.value()))
            .toResult(OrderError.NOT_FOUND);
    }

    private Result<Discount> validateCode(DiscountCode code, Order order) {
        return discountRepository.findByCode(code.value())
            .toResult(DiscountError.INVALID_CODE)
            .filter(DiscountError.EXPIRED, d -> !d.isExpired())
            .filter(DiscountError.MIN_ORDER, d -> order.total().isGreaterThan(d.minOrder()));
    }
}
```

**Bridging old and new:**

```java
// Controller bridges exception world to Result world
@PostMapping("/orders/{orderId}/discount")
public ResponseEntity<?> applyDiscount(
    @PathVariable String orderId,
    @RequestBody DiscountRequest request
) {
    return Result.all(
        OrderId.orderId(orderId),
        DiscountCode.discountCode(request.code())
    )
    .flatMap((oid, code) -> applyDiscount.apply(oid, code))
    .fold(
        cause -> toErrorResponse(cause),
        price -> ResponseEntity.ok(price)
    );
}
```

### Phase 3: Extract Use Cases (Week 5-8)

**Goal:** Separate business logic from framework code.

**Process:**
1. Identify a service method with clear business logic
2. Extract to use case interface
3. Move implementation to use case factory
4. Convert service to thin adapter

**Before: Fat service**

```java
@Service
public class OrderService {
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentGateway paymentGateway;
    @Autowired private NotificationService notificationService;

    @Transactional
    public Order placeOrder(OrderDto dto) {
        // Validation
        if (dto.getItems().isEmpty()) {
            throw new ValidationException("Order must have items");
        }

        // Check inventory
        for (ItemDto item : dto.getItems()) {
            if (!inventoryService.hasStock(item.getProductId(), item.getQuantity())) {
                throw new InsufficientStockException(item.getProductId());
            }
        }

        // Process payment
        PaymentResult payment;
        try {
            payment = paymentGateway.charge(dto.getPaymentMethod(), calculateTotal(dto));
        } catch (PaymentException e) {
            throw new OrderException("Payment failed", e);
        }

        // Create order
        Order order = new Order(dto.getCustomerId(), dto.getItems(), payment.getTransactionId());
        orderRepository.save(order);

        // Send notification (best effort)
        try {
            notificationService.sendOrderConfirmation(order);
        } catch (Exception e) {
            log.warn("Failed to send notification", e);
        }

        return order;
    }
}
```

**After: Use case + thin service**

```java
// Use case interface
public interface PlaceOrder {
    Promise<OrderConfirmation> execute(OrderRequest request);

    interface CheckInventory {
        Promise<ValidOrder> apply(ValidOrder order);
    }

    interface ProcessPayment {
        Promise<PaymentConfirmation> apply(ValidOrder order);
    }

    interface SaveOrder {
        Promise<OrderId> apply(ValidOrder order, PaymentConfirmation payment);
    }

    interface SendNotification {
        Promise<Unit> apply(OrderId orderId);
    }

    static PlaceOrder placeOrder(
        CheckInventory checkInventory,
        ProcessPayment processPayment,
        SaveOrder saveOrder,
        SendNotification sendNotification
    ) {
        return request -> ValidOrder.validOrder(request)
            .async()
            .flatMap(checkInventory::apply)
            .flatMap(order -> processPayment.apply(order)
                .map(payment -> Pair.of(order, payment)))
            .flatMap(pair -> saveOrder.apply(pair.first(), pair.second()))
            .onSuccess(orderId -> sendNotification.apply(orderId)
                .onFailure(e -> { /* log but don't fail */ }))
            .map(OrderConfirmation::new);
    }
}

// Thin service (adapter)
@Service
public class OrderService {
    private final PlaceOrder placeOrder;

    public OrderService(
        InventoryChecker inventoryChecker,
        PaymentProcessor paymentProcessor,
        JooqOrderRepository orderRepository,
        EmailNotificationSender notificationSender
    ) {
        this.placeOrder = PlaceOrder.placeOrder(
            inventoryChecker,
            paymentProcessor,
            orderRepository,
            notificationSender
        );
    }

    public Order placeOrder(OrderDto dto) {
        return placeOrder.execute(toRequest(dto))
            .await()
            .fold(
                cause -> { throw toException(cause); },
                confirmation -> toOrder(confirmation)
            );
    }
}
```

### Phase 4: Adapter Isolation (Week 9-12)

**Goal:** All I/O wrapped in adapter leaves with Promise.lift.

**Identify adapters:**
- Database repositories
- HTTP clients
- Message queue producers/consumers
- File system access
- Cache clients

**Example: Repository adapter**

```java
// Step interface
public interface SaveUser {
    Promise<UserId> apply(ValidUser user);
}

// Adapter implementation
@Repository
public class JooqUserRepository implements SaveUser {
    private final DSLContext dsl;

    @Override
    public Promise<UserId> apply(ValidUser user) {
        return Promise.lift(
            RepositoryError.DatabaseFailure::new,
            () -> {
                String id = dsl.insertInto(USERS)
                    .set(USERS.EMAIL, user.email().value())
                    .set(USERS.PASSWORD_HASH, user.passwordHash().value())
                    .returningResult(USERS.ID)
                    .fetchSingle()
                    .value1();
                return new UserId(id);
            }
        );
    }
}
```

---

## Interoperability with Java Standard Library

### `Optional<T>` → `Option<T>`

```java
// Direct conversion
Optional<User> javaOptional = repository.findById(id);
Option<User> option = Option.from(javaOptional);

// In adapter methods
public Option<User> findById(UserId id) {
    return Option.from(jpaRepository.findById(id.value()));
}

// Back to Optional (for framework integration)
Optional<User> back = option.toOptional();
```

### `CompletableFuture<T>` → `Promise<T>`

```java
// Wrapping CompletableFuture in adapter
public Promise<User> fetchUser(UserId id) {
    var promise = Promise.<User>promise();

    CompletableFuture<User> cf = httpClient.getUser(id.value());
    cf.whenComplete((result, error) -> {
        if (error != null) {
            promise.fail(Causes.fromThrowable(error));
        } else {
            promise.succeed(result);
        }
    });

    return promise;
}

// Helper method for common pattern
public static <T> Promise<T> fromCompletableFuture(
        CompletableFuture<T> cf,
        Fn1<Cause, Throwable> errorMapper) {
    var promise = Promise.<T>promise();
    cf.whenComplete((result, error) -> {
        if (error != null) {
            promise.fail(errorMapper.apply(error));
        } else {
            promise.succeed(result);
        }
    });
    return promise;
}
```

### Exceptions → Cause Mapping

**In adapters - use Promise.lift:**
```java
public Promise<User> findUser(UserId id) {
    return Promise.lift(
        DatabaseError::new,  // Exception → Cause
        () -> jdbcTemplate.queryForObject(SQL, mapper, id.value())
    );
}
```

**Custom exception mapping:**
```java
public Promise<Payment> processPayment(PaymentRequest request) {
    return Promise.lift(
        this::mapPaymentException,  // Custom mapper
        () -> paymentGateway.charge(request)
    );
}

private Cause mapPaymentException(Throwable t) {
    return switch (t) {
        case InsufficientFundsException e -> new PaymentError.InsufficientFunds(e.getMessage());
        case CardDeclinedException e -> new PaymentError.CardDeclined(e.getMessage());
        case NetworkException e -> new PaymentError.ServiceUnavailable(e.getMessage());
        default -> Causes.fromThrowable(t);
    };
}
```

### Transitional Adapter Layer

During migration, create adapter methods that bridge old and new code:

```java
// Legacy service (throws exceptions)
public class LegacyUserService {
    public User findUser(String id) throws UserNotFoundException {
        // ... legacy implementation
    }
}

// JBCT adapter wrapping legacy service
public class UserServiceAdapter implements FindUser {
    private final LegacyUserService legacy;

    @Override
    public Promise<User> apply(UserId id) {
        return Promise.lift(
            this::mapLegacyError,
            () -> legacy.findUser(id.value())
        );
    }

    private Cause mapLegacyError(Throwable t) {
        return switch (t) {
            case UserNotFoundException e -> UserError.NotFound.INSTANCE;
            default -> Causes.fromThrowable(t);
        };
    }
}
```

**Gradual replacement:**
1. Create adapter wrapping legacy service
2. Use adapter in new JBCT code
3. Eventually replace legacy service with JBCT implementation
4. Remove adapter when migration complete

---

## Team Adoption Strategies

### Strategy 1: Champion-Led

One developer becomes JBCT expert, writes initial examples, and reviews others' code.

**Pros:** Fast start, consistent patterns
**Cons:** Bottleneck, bus factor

### Strategy 2: New Feature First

All new features use JBCT. Existing code migrated only when touched.

**Pros:** No big-bang rewrite, natural adoption
**Cons:** Mixed codebase for longer, context switching

### Strategy 3: Vertical Slice

Pick one use case, migrate completely from controller to database.

**Pros:** Complete example to learn from, proves value end-to-end
**Cons:** Initial investment, may find integration issues late

### Recommendation

Combine strategies:
1. Champion writes first vertical slice (Strategy 3)
2. Team reviews and learns from example
3. All new features use JBCT (Strategy 2)
4. Gradual migration of existing code when touched

---

## Common Resistance and Responses

### "It's too different from what we know"

**Response:** The patterns are simpler than exception handling. Compare:

```java
// Exception-based (hidden control flow)
try {
    User user = findUser(id);
    if (user == null) throw new UserNotFoundException(id);
    Order order = createOrder(user, items);
    if (!paymentService.charge(order)) {
        throw new PaymentException("Failed");
    }
    return order;
} catch (UserNotFoundException e) {
    return handleUserNotFound(e);
} catch (PaymentException e) {
    return handlePaymentFailed(e);
} catch (Exception e) {
    return handleUnknown(e);
}

// JBCT (explicit flow)
return findUser(id)
    .flatMap(user -> createOrder(user, items))
    .flatMap(order -> chargePayment(order))
    .fold(this::handleError, identity());
```

### "We don't have time to rewrite everything"

**Response:** You don't have to. Start with value objects only (Phase 1). That's one week for immediate benefits. Each phase is incremental.

### "Our team doesn't know functional programming"

**Response:** JBCT isn't about FP. It's about making code predictable. The functional patterns are just the mechanism. Focus on:
- Every method declares its failure modes in the return type
- Invalid data cannot be constructed
- No hidden control flow

### "What about debugging?"

**Response:** Debugging is easier, not harder:
- Stack traces show the actual call chain (no exception jumps)
- Error causes are typed and carry context
- IDE breakpoints work normally in lambdas
- Logging can be added at any point in the chain

### "Performance overhead?"

**Response:** Negligible for business logic. Pragmatica Lite types are lightweight wrappers. The overhead is comparable to Optional. If you're writing code where object allocation matters (tight loops, real-time systems), JBCT isn't the right fit - but neither is typical Java web development.

---

## Migration Checklist

### Phase 1 Complete When:
- [ ] Pragmatica Lite added to project
- [ ] At least 5 value objects created
- [ ] One service method uses value objects
- [ ] Team has reviewed value object patterns

### Phase 2 Complete When:
- [ ] Team agreement: new code uses Result/Promise
- [ ] At least one new feature built with JBCT
- [ ] Controller bridges exception/Result boundary
- [ ] Error types defined for new feature

### Phase 3 Complete When:
- [ ] At least one use case extracted
- [ ] Use case has step interfaces
- [ ] Service is thin adapter
- [ ] Integration tests pass

### Phase 4 Complete When:
- [ ] All new adapters use Promise.lift
- [ ] Database access wrapped
- [ ] External HTTP calls wrapped
- [ ] Error mapping consistent across adapters

---

## Exercises

1. **Audit your codebase:** Find three methods with scattered validation. Which value objects would consolidate them?

2. **Plan Phase 1:** List the top 5 value objects your codebase needs. Prioritize by how many places validate the same data.

3. **Identify extraction candidates:** Find a service method with more than 50 lines. Can you identify the Sequencer pattern in it?

4. **Adapter inventory:** List all external dependencies (database, HTTP, message queue). Which ones throw checked exceptions?

---

## Summary

Migration to JBCT is incremental:

1. **Phase 1:** Value objects only - immediate validation benefits
2. **Phase 2:** Result in new code - stop adding exceptions
3. **Phase 3:** Extract use cases - separate concerns
4. **Phase 4:** Adapter isolation - complete the boundary

Key principles:
- Never big-bang rewrite
- Each phase delivers value independently
- Mixed codebase is acceptable during transition
- Team buy-in through working examples, not mandates
