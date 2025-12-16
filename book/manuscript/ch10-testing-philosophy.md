# Chapter 10: Testing Philosophy

## What You'll Learn

- Why integration-first testing aligns with functional composition
- The evolutionary process: stub everything -> implement incrementally -> production-ready
- How to handle complex test inputs with builders and factories
- When you still need unit tests

**Prerequisites:** [Chapter 9: Thread Safety](ch09-thread-safety.md)

---

## The Problem with Traditional Testing

### Traditional Approach: Component-Focused

Most Java testing follows this pattern:

```java
// Separate tests for each component
class ValidateInputTest {
    @Test void emailValidation() { /* ... */ }
    @Test void passwordValidation() { /* ... */ }
    // 10 tests
}

class CheckCredentialsTest {
    @Test void validCredentials() { /* ... */ }
    @Test void invalidCredentials() { /* ... */ }
    // 5 tests
}

class CheckAccountStatusTest {
    @Test void activeAccount() { /* ... */ }
    @Test void inactiveAccount() { /* ... */ }
    // 3 tests
}

class GenerateTokenTest {
    @Test void tokenGeneration() { /* ... */ }
    // 4 tests
}

// Total: 22 tests, never testing them TOGETHER
```

**Problems:**
1. **Doesn't test composition** - Steps work individually but fail when chained
2. **Doesn't test error propagation** - How do failures bubble through the chain?
3. **Doesn't test actual behavior** - Tests verify components, not use cases
4. **Brittle** - Interface changes break all tests, even when behavior unchanged
5. **False confidence** - All tests pass, production fails because integration untested

### What We Actually Want to Test

When a user calls `UserLogin.execute(request)`, we care about:

- **Does the request get validated correctly?**
- **Do all steps execute in order?**
- **Does each step failure propagate correctly?**
- **Do branch conditions work as expected?**
- **Does the complete behavior match requirements?**

These are **integration questions**, not unit questions.

---

## Philosophy: Integration-First Testing

### The Core Principle

**Test assembled use cases, not isolated components.**

Your use case is a composition of steps. Test the composition. Stub only at adapter boundaries (database, HTTP, external services). Test all business logic together.

**Why by criteria:**
- **Mental Overhead**: One test suite per use case, not per component (+2). Test names directly map to scenarios.
- **Business/Technical Ratio**: Tests read like behavior specifications, not technical assertions (+3).
- **Reliability**: Tests verify actual end-to-end behavior, not isolated fragments (+3).
- **Complexity**: Fewer test contexts, clearer boundaries (business vs adapters) (+2).

### The Three Testing Layers

**1. Value Objects: Unit Tests (100% coverage)**

Value objects are pure, isolated, and enforce invariants. Test them comprehensively:

```java
class EmailTest {
    @ParameterizedTest
    @ValueSource(strings = {"bad", "no@domain", "@missing", "CAPS@TEST.COM"})
    void email_rejectsInvalidFormat(String raw) {
        Email.email(raw).onSuccess(Assertions::fail);
    }

    @Test
    void email_normalizesToLowercase() {
        Email.email("USER@EXAMPLE.COM")
             .onSuccess(email -> assertEquals("user@example.com", email.value()));
    }
}
```

**Why unit test here?** Value objects have zero dependencies. They're pure functions. Unit testing is natural.

**2. Business Leaves: Unit Tests if Complex**

Simple business leaves (single calculation, simple transformation) don't need isolated tests - they're covered by use case integration tests.

Complex business leaves (rich algorithms, many branches) deserve unit tests:

```java
class PricingEngineTest {
    @Test void volumeDiscount_appliesAtThreshold() { /* ... */ }
    @Test void combinedDiscounts_stackCorrectly() { /* ... */ }
    @Test void edgeCases_handleGracefully() { /* ... */ }
}
```

**Guideline:** If a leaf has 3+ conditional branches or complex logic, write unit tests.

**3. Use Cases: Integration Tests (Test Vectors)**

The heart of your testing: test complete use case behavior with all steps assembled, only adapters stubbed.

```java
class UserLoginTest {
    CheckCredentials mockCredentials;
    CheckAccountStatus mockStatus;
    GenerateToken mockToken;
    UserLogin useCase;

    @BeforeEach
    void setup() {
        mockCredentials = vr -> Result.success(new Credentials("user-1"));
        mockStatus = c -> Result.success(new Account(c.userId(), true));
        mockToken = acc -> Result.success(new Response("token-" + acc.userId()));
        useCase = UserLogin.userLogin(mockCredentials, mockStatus, mockToken);
    }

    @Test
    void execute_succeeds_forValidInput() {
        var request = new Request("john@example.com", "Valid123", null);

        useCase.execute(request)
               .onFailure(Assertions::fail)
               .onSuccess(response -> assertEquals("token-user-1", response.token()));
    }
}
```

This tests **real behavior**: validation -> credentials -> status -> token, with error propagation.

---

## The Evolutionary Testing Process

### Overview

Instead of writing tests after implementation, evolve them **alongside** implementation:

```
Phase 1: Stub Everything
    |
Phase 2: Implement & Test Validation
    |
Phase 3-N: Implement Steps Incrementally
    |
Final: Production-Ready
```

At each phase, **all tests remain green**. You're not breaking and fixing - you're growing.

### Phase 1: Stub Everything

**Goal:** Establish test structure before implementing anything.

**Step 1:** Create use case interface with factory returning stub implementation:

```java
public interface UserLogin {
    record Request(String email, String password, String referral) {}
    record Response(String token) {}

    Result<Response> execute(Request request);

    static UserLogin userLogin() {
        return request -> Result.success(new Response("stub-token"));
    }
}
```

**Step 2:** Write initial tests:

```java
class UserLoginTest {
    @Test
    void execute_succeeds_forValidInput() {
        var useCase = UserLogin.userLogin();
        var request = new Request("john@example.com", "Valid123", null);

        useCase.execute(request)
               .onSuccess(response -> assertEquals("stub-token", response.token()));
    }
}
```

### Phase 2: Implement Validation

**Step 1:** Add validated request with validation logic:

```java
record ValidRequest(Email email, Password password, Option<ReferralCode> referral) {
    static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()),
                          ReferralCode.referralCode(raw.referral()))
                     .map(ValidRequest::new);
    }
}
```

**Step 2:** Update factory to use validation:

```java
static UserLogin userLogin() {
    return request -> ValidRequest.validRequest(request)
                                  .map(_ -> new Response("stub-token"));
}
```

**Step 3:** Add validation test vectors:

```java
@Test
void execute_fails_forInvalidEmail() {
    var useCase = UserLogin.userLogin();
    var request = new Request("bad-email", "Valid123", null);

    useCase.execute(request)
           .onSuccess(Assertions::fail);
}

@Test
void execute_aggregatesMultipleErrors() {
    var useCase = UserLogin.userLogin();
    var request = new Request("bad", "weak", "invalid-ref");

    useCase.execute(request)
           .onSuccess(Assertions::fail)
           .onFailure(cause -> assertInstanceOf(Causes.CompositeCause.class, cause));
}
```

### Phase 3-N: Continue Expanding

Repeat for each remaining step:
- Add step interface
- Update factory to accept dependency
- Update existing test stubs
- Add step failure scenarios

---

## Handling Complex Input Objects

### Test Data Builders

**Fluent API for constructing test data:**

```java
public class TestData {
    public static RequestBuilder request() {
        return new RequestBuilder();
    }

    public static class RequestBuilder {
        private String email = "default@example.com";
        private String password = "DefaultValid123";
        private String referral = null;

        public RequestBuilder withEmail(String email) {
            this.email = email;
            return this;
        }

        public RequestBuilder withPassword(String password) {
            this.password = password;
            return this;
        }

        public Request build() {
            return new Request(email, password, referral);
        }
    }
}
```

**Usage:**
```java
var request = TestData.request().build();
var invalidEmail = TestData.request().withEmail("bad").build();
```

### Canonical Test Vectors

**Pre-defined test data constants:**

```java
public interface TestVectors {
    Request VALID = new Request("user@example.com", "Valid123", null);
    Request INVALID_EMAIL = new Request("bad", "Valid123", null);
    Request WEAK_PASSWORD = new Request("user@example.com", "weak", null);
    Request MULTIPLE_ERRORS = new Request("bad", "weak", "invalid");
}
```

### Which Approach to Use?

- **Canonical Vectors:** Simple use cases, few fields, limited variations
- **Factory Methods:** Medium complexity, systematic field variations
- **Builders:** Complex objects, many optional fields, many combinations

---

## Key Takeaways

1. **Test composition, not components** - Use case is what matters
2. **Stub only adapters** - Database, HTTP, external services
3. **Evolve tests with implementation** - Always green, never break-and-fix
4. **Three layers** - Value objects (unit), complex leaves (unit), use cases (integration)
5. **Use test data utilities** - Builders, vectors, factories reduce boilerplate

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 4.1: Building test data builders
- Exercise 4.2: Evolutionary testing walkthrough

---

## What's Next

[Chapter 11](ch11-testing-practice.md) covers testing in practice - organizing large test suites, the complete RegisterUser example, and migrating from traditional unit testing.
