---
tags: [testing, java, softwaredevelopment, bestpractices]
canonical_url: https://pragmatica.dev/integration-first-testing
description: Why testing composition beats testing components, and how to build reliable test suites
published: true
---

# Integration-First Testing: Why You Should Test Composition, Not Components

**The case against unit test obsession**

---

## The Unit Testing Trap

The traditional testing pyramid tells us: lots of unit tests, fewer integration tests, even fewer end-to-end tests. The reasoning seems sound--unit tests are fast, isolated, and pinpoint failures precisely.

But there's a problem. In practice, many teams with high unit test coverage still have unreliable systems. Tests pass, but production breaks. Why?

**Unit tests verify components work in isolation. They don't verify components work together.**

Consider a typical service:

```java
public class OrderService {
    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    public OrderResult processOrder(Order order) {
        InventoryReservation reservation = inventoryService.reserve(order);
        PaymentResult payment = paymentService.charge(order, reservation);
        notificationService.notify(order, payment);
        return new OrderResult(order.id(), payment.transactionId());
    }
}
```

The unit test approach mocks each dependency:

```java
@Test
void processOrder_success() {
    // Arrange: mock everything
    when(inventoryService.reserve(any())).thenReturn(mockReservation);
    when(paymentService.charge(any(), any())).thenReturn(mockPayment);
    doNothing().when(notificationService).notify(any(), any());

    // Act
    OrderResult result = orderService.processOrder(order);

    // Assert
    verify(inventoryService).reserve(order);
    verify(paymentService).charge(order, mockReservation);
    verify(notificationService).notify(order, mockPayment);
}
```

This test passes. But what does it actually verify?

- That `inventoryService.reserve()` is called? The mock guarantees that.
- That the services work together correctly? No--we mocked away all real behavior.
- That the data flows correctly between steps? Only superficially.

We've written a test that verifies our code calls methods in a certain order. We haven't tested that processing an order *actually works*.

---

## The Integration-First Alternative

What if we flipped the pyramid? Instead of testing components in isolation, test the *composition* of components:

```java
@Test
void processOrder_reservesInventoryAndChargesPayment() {
    // Real inventory logic, real payment logic
    // Only external I/O (database, HTTP) is stubbed

    InventoryService inventory = new InMemoryInventoryService(initialStock);
    PaymentService payment = new StubPaymentService(PaymentResult::success);
    NotificationService notifications = new RecordingNotificationService();

    OrderService orderService = new OrderService(inventory, payment, notifications);

    OrderResult result = orderService.processOrder(order);

    // Assert real behavior
    assertThat(inventory.getStock(product)).isEqualTo(initialStock - order.quantity());
    assertThat(notifications.getSent()).contains(expectedNotification);
}
```

This test verifies:
- Inventory is actually reserved (not just that a method was called)
- Payment processes with the reserved inventory
- Notification is sent with correct data
- The entire flow works as a unit

---

## Why This Works Better

### 1. Tests Verify Behavior, Not Implementation

Mock-heavy unit tests are tightly coupled to implementation. Refactor the internals, and tests break--even if behavior is unchanged.

Integration tests verify outcomes. Refactor freely; if behavior is preserved, tests pass.

### 2. Real Bugs Surface

The bugs that escape to production are rarely "this method doesn't work." They're:
- Data passed incorrectly between components
- Edge cases in component interaction
- Ordering dependencies
- State management across operations

Integration tests catch these. Unit tests with mocks don't.

### 3. Fewer Tests, More Coverage

One integration test through `OrderService.processOrder()` exercises:
- Input validation
- Inventory reservation logic
- Payment processing logic
- Notification formatting
- Error handling paths

Compare to unit tests: separate tests for each component, each mock scenario, each edge case--exponentially more tests for the same coverage.

### 4. Easier Refactoring

When you refactor with unit tests, you often rewrite tests too. With integration tests, you verify the refactored code still produces correct outcomes. Tests become refactoring enablers, not obstacles.

---

## The Stub Strategy

"But integration tests are slow!" They don't have to be.

The key is **stubbing at the right boundary**: external I/O only.

```
+---------------------------------------------+
|  Your Application                           |
|  +---------------------------------------+  |
|  |  Business Logic (tested fully)        |  |
|  |  - Use cases                          |  |
|  |  - Domain services                    |  |
|  |  - Value objects                      |  |
|  +------------------+--------------------+  |
|                     |                       |
|  +------------------v--------------------+  |
|  |  Adapters (stubbed in tests)          |  |
|  |  - Database repositories              |  |
|  |  - HTTP clients                       |  |
|  |  - Message queues                     |  |
|  +---------------------------------------+  |
+---------------------------------------------+
```

**Stub adapters, test everything else.**

Adapters are thin--they translate between your domain and external systems. Their logic is minimal: convert domain objects to SQL, parse HTTP responses, format messages. Stub them with simple implementations:

```java
// In-memory repository stub
public class InMemoryUserRepository implements UserRepository {
    private final Map<UserId, User> users = new ConcurrentHashMap<>();

    @Override
    public Promise<Option<User>> findById(UserId id) {
        return Promise.success(Option.option(users.get(id)));
    }

    @Override
    public Promise<UserId> save(User user) {
        users.put(user.id(), user);
        return Promise.success(user.id());
    }
}
```

These stubs are fast (no I/O), deterministic (no network flakes), and exercise real logic paths.

---

## The Evolutionary Testing Process

Integration-first doesn't mean "write integration tests and hope." It's a systematic process:

### Phase 1: Stub Everything, Verify Composition

Start with all adapters stubbed. Test that the use case composes correctly:

```java
@Test
void registerUser_happyPath() {
    // All stubs return success
    CheckEmailUniqueness checkEmail = req -> Promise.success(req);
    HashPassword hashPassword = pwd -> Result.success(new HashedPassword("hashed"));
    SaveUser saveUser = user -> Promise.success(new UserId("user-123"));

    RegisterUser useCase = RegisterUser.create(checkEmail, hashPassword, saveUser);

    useCase.execute(validRequest)
        .await()
        .onFailure(Assertions::fail)
        .onSuccess(response -> {
            assertEquals("user-123", response.userId().value());
        });
}
```

### Phase 2: Add Failure Scenarios

Replace stubs with failure-producing versions one at a time:

```java
@Test
void registerUser_failsWhenEmailExists() {
    CheckEmailUniqueness failingCheck = req ->
        RegistrationError.EMAIL_EXISTS.promise();

    // ... other stubs succeed

    useCase.execute(validRequest)
        .await()
        .onSuccess(Assertions::fail);  // Should not succeed
}
```

### Phase 3: Replace Stubs with Real Logic

As you implement adapter logic, replace stubs with real implementations:

```java
@Test
void registerUser_withRealPasswordHashing() {
    CheckEmailUniqueness checkEmail = req -> Promise.success(req);
    HashPassword hashPassword = new BCryptHashPassword(encoder);  // Real implementation
    SaveUser saveUser = new InMemoryUserRepository();  // Still stubbed I/O

    // Test now exercises real password hashing
}
```

### Phase 4: Production Configuration

Eventually, your production wiring uses real adapters:

```java
@Configuration
public class ProductionConfig {
    @Bean
    RegisterUser registerUser(
        JooqUserRepository repository,
        BCryptHashPassword hasher,
        SmtpEmailSender emailSender
    ) {
        return RegisterUser.create(
            new DatabaseEmailChecker(repository),
            hasher,
            repository
        );
    }
}
```

---

## Organizing Many Tests

Integration-first generates many test scenarios. Organize them systematically:

### Nested Classes by Scenario Type

```java
class RegisterUserTest {

    @Nested
    class HappyPath {
        @Test void succeeds_withValidInput() { }
        @Test void succeeds_withOptionalReferralCode() { }
    }

    @Nested
    class ValidationFailures {
        @Test void fails_withInvalidEmail() { }
        @Test void fails_withWeakPassword() { }
        @Test void fails_withMissingRequiredFields() { }
    }

    @Nested
    class StepFailures {
        @Test void fails_whenEmailAlreadyExists() { }
        @Test void fails_whenPasswordHashingFails() { }
        @Test void fails_whenDatabaseUnavailable() { }
    }
}
```

### Parameterized Tests for Input Variations

```java
@ParameterizedTest
@MethodSource("invalidEmails")
void rejectsInvalidEmailFormats(String invalidEmail) {
    var request = validRequest().withEmail(invalidEmail);
    useCase.execute(request).await().onSuccess(Assertions::fail);
}

static Stream<String> invalidEmails() {
    return Stream.of(
        "not-an-email",
        "@missing-local.com",
        "missing-domain@",
        "spaces in@email.com",
        ""
    );
}
```

### Test Data Builders

```java
class RequestBuilder {
    private String email = "valid@example.com";
    private String password = "ValidPassword123";

    RequestBuilder withEmail(String email) {
        this.email = email;
        return this;
    }

    Request build() {
        return new Request(email, password);
    }
}

// Usage
var request = new RequestBuilder().withEmail("invalid").build();
```

---

## When Unit Tests Still Make Sense

Integration-first doesn't mean zero unit tests. Unit tests are valuable for:

### Pure Functions with Complex Logic

```java
// This is pure computation--unit test it
public Money calculateDiscount(Order order, DiscountRules rules) {
    // Complex discount calculation logic
}

@Test
void calculateDiscount_appliesPercentageToSubtotal() { }

@Test
void calculateDiscount_capsAtMaximumDiscount() { }

@Test
void calculateDiscount_stacksMultipleRules() { }
```

### Value Object Validation

```java
@Test
void email_rejectsInvalidFormat() {
    Email.email("not-an-email").onSuccess(Assertions::fail);
}

@Test
void email_normalizesToLowercase() {
    Email.email("USER@EXAMPLE.COM")
        .onSuccess(email -> assertEquals("user@example.com", email.value()));
}
```

### Edge Cases in Algorithms

```java
@Test
void pricingAlgorithm_handlesEmptyCart() { }

@Test
void pricingAlgorithm_handlesSingleItem() { }

@Test
void pricingAlgorithm_handlesMaximumItems() { }
```

The pattern: unit test *pure logic*, integration test *composed behavior*.

---

## Metrics That Matter

How do you know your test suite is effective?

**Not useful:**
- Line coverage (you can have 100% coverage with useless tests)
- Number of unit tests (more isn't better)

**Useful:**
- **Failure detection rate**: Do tests catch bugs before production?
- **False positive rate**: How often do tests fail for non-bugs (flaky tests, refactoring)?
- **Time to failure**: How fast do you know something is broken?
- **Debugging time**: When a test fails, how quickly can you find the bug?

Integration tests optimized for these metrics beat unit test suites optimized for coverage.

---

## Getting Started

1. **Pick one use case** in your system.

2. **Write one integration test** that exercises the happy path with stubbed adapters.

3. **Add failure scenarios** for each step that can fail.

4. **Compare** to existing unit tests: which gives you more confidence?

5. **Expand** to more use cases as you see the benefits.

---

## Conclusion

The traditional testing pyramid optimizes for the wrong things: speed of individual tests and isolation of components. But software fails at the seams--where components meet.

Integration-first testing optimizes for what matters: confidence that your system works as a whole.

- Test composed behavior, not isolated components
- Stub at I/O boundaries, not between domain objects
- Verify outcomes, not method calls
- Write fewer tests that cover more behavior

Your tests should answer one question: "Does this system do what it's supposed to do?" Integration tests answer that question directly. Unit tests with mocks answer a different question: "Does this component call other components correctly?"

Focus on the question that matters.

---

*Want to learn more about testing strategies for functional composition? Check out [Java Backend Coding Technology](https://pragmatica.dev) for a complete methodology including evolutionary testing approaches.*
