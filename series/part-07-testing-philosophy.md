# Part 7: Testing Philosophy & Evolution

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 7 of 9

**Previous:** [Part 9: Advanced Patterns](part-06-advanced-patterns.md) | **Next:** [Part 8: Testing in Practice](part-08-testing-practice.md)

---

## Introduction

You've learned patterns. You've seen composition. Now the critical question: **How do we test this?**

Traditional testing wisdom says "write unit tests for every class." But this technology is different. Our code is functional compositions - Sequencers chaining steps, Fork-Joins running parallel operations, value objects enforcing invariants. Testing isolated components misses the point: **we need to test composition**.

This part introduces **evolutionary testing** - an approach that treats your use case as a living organism that grows from stub to production, with tests evolving alongside. Instead of fragmenting your business logic into isolated unit tests, you test **behavior end-to-end**, stubbing only at the adapter boundaries.

**What you'll learn:**
- Why integration-first testing aligns with functional composition
- The evolutionary process: stub everything → implement incrementally → production-ready
- How to handle complex test inputs with builders and factories
- When you still need unit tests (spoiler: less often than you think)

**Prerequisites:** Parts 1-4, especially understanding of Sequencer, Fork-Join, and value objects.

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

Not everything is integration-tested the same way:

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

**Test naming convention:** Follow the pattern `methodName_outcome_condition`:
- `email_rejectsInvalidFormat` - method name, what happens, under what condition
- `email_normalizesToLowercase` - method name, outcome, implicit condition (always)
- `execute_succeeds_forValidInput` - clear, readable, searchable

**Thread Safety in Tests:**

Mutable test state is acceptable because **test execution is single-threaded**. Each test runs in isolation with its own mutable accumulators, call logs, or test data builders:

```java
@Test
void execute_appliesDiscounts_inCorrectOrder() {
    var callLog = new ArrayList<String>();  // Mutable test state - safe

    DiscountRule bogo = createLoggingRule("BOGO", callLog);
    DiscountRule percent = createLoggingRule("PERCENT", callLog);

    calculateDiscounts.apply(new CartWithRules(cart, List.of(bogo, percent)))
        .await()
        .onFailure(Assertions::fail);

    assertEquals(List.of("BOGO", "PERCENT"), callLog);  // Verify call order
}
```

This doesn't violate production immutability rules - tests are inherently sequential, and mutable test fixtures are confined to single test method scope.

**Why unit test here?** Value objects have zero dependencies. They're pure functions. Unit testing is natural.

**2. Business Leaves: Unit Tests if Complex**

Simple business leaves (single calculation, simple transformation) don't need isolated tests - they're covered by use case integration tests.

Complex business leaves (rich algorithms, many branches) deserve unit tests:

```java
class PricingEngineTest {
    @Test void volumeDiscount_appliesAtThreshold() { /* ... */ }
    @Test void combinedDiscounts_stackCorrectly() { /* ... */ }
    @Test void edgeCases_handleGracefully() { /* ... */ }
    // 20+ tests for complex pricing logic
}
```

**Guideline:** If a leaf has 3+ conditional branches or complex logic, write unit tests.

**Important:** If your leaf needs complex test setup or extensive mocking, it's probably not a leaf—extract the business logic to a separate function.

**3. Use Cases: Integration Tests (Test Vectors)**

**Test vectors:** comprehensive sets of input/output pairs systematically covering all decision paths and edge cases.

The heart of your testing: test complete use case behavior with all steps assembled, only adapters stubbed.

```java
class UserLoginTest {
    // Stubs for adapter leaves
    CheckCredentials mockCredentials;
    CheckAccountStatus mockStatus;
    GenerateToken mockToken;

    UserLogin useCase;

    @BeforeEach
    void setup() {
        // Assemble use case with stubbed adapters
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

    // More test vectors below...
}
```

This tests **real behavior**: validation → credentials → status → token, with error propagation.

---

## The Evolutionary Testing Process

### Overview

Instead of writing tests after implementation, evolve them **alongside** implementation:

```
Phase 1: Stub Everything
    ↓
Phase 2: Implement & Test Validation
    ↓
Phase 3-N: Implement Steps Incrementally
    ↓
Final: Production-Ready
```

At each phase, **all tests remain green**. You're not breaking and fixing - you're growing.

---

### Phase 1: Stub Everything

**Goal:** Establish test structure before implementing anything.

**Step 1:** Create use case interface with factory returning stub implementation:

```java
public interface UserLogin {
    record Request(String email, String password, String referral) {}
    record Response(String token) {}

    Result<Response> execute(Request request);

    // Factory returns stub that always succeeds
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

**Status:** ✅ Test passes (trivial, but structure is correct)

---

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
void execute_fails_forWeakPassword() {
    var useCase = UserLogin.userLogin();
    var request = new Request("john@example.com", "weak", null);

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

**Status:** ✅ Happy path still green, validation failures tested

---

### Phase 3: Implement First Step

**Step 1:** Define step interface:

```java
interface CheckCredentials {
    Result<Credentials> apply(ValidRequest request);
}

record Credentials(String userId) {}
```

**Step 2:** Update factory to accept step dependency:

```java
static UserLogin userLogin(CheckCredentials checkCredentials) {
    return request -> ValidRequest.validRequest(request)
                                  .flatMap(checkCredentials::apply)
                                  .map(creds -> new Response("stub-token"));
}
```

**Step 3:** Update tests with stub:

```java
@BeforeEach
void setup() {
    CheckCredentials stubCreds = vr -> Result.success(new Credentials("user-1"));
    useCase = UserLogin.userLogin(stubCreds);
}
```

**Step 4:** Add step failure scenarios:

```java
@Test
void execute_fails_whenCredentialsInvalid() {
    CheckCredentials failingCreds = vr -> UserLoginError.InvalidCredentials.INSTANCE.result();
    var useCase = UserLogin.userLogin(failingCreds);
    var request = new Request("john@example.com", "Valid123", null);

    useCase.execute(request)
           .onSuccess(Assertions::fail)
           .onFailure(cause -> assertInstanceOf(UserLoginError.InvalidCredentials.class, cause));
}
```

**Status:** ✅ All previous tests still green, new failure scenario added

---

### Phase 4-N: Continue Expanding

Repeat for each remaining step:
- Add step interface
- Update factory to accept dependency
- Update existing test stubs
- Add step failure scenarios

Example for `CheckAccountStatus`:

```java
@Test
void execute_fails_whenAccountInactive() {
    CheckCredentials stubCreds = vr -> Result.success(new Credentials("user-1"));
    CheckAccountStatus failingStatus = c -> UserLoginError.AccountInactive.INSTANCE.result();
    GenerateToken stubToken = acc -> Result.success(new Response("token"));

    var useCase = UserLogin.userLogin(stubCreds, failingStatus, stubToken);
    var request = new Request("john@example.com", "Valid123", null);

    useCase.execute(request)
           .onSuccess(Assertions::fail)
           .onFailure(cause -> assertInstanceOf(UserLoginError.AccountInactive.class, cause));
}
```

---

### Final Phase: Production Ready

**What you end up with:**
- ✅ All business logic implemented
- ✅ Only adapter leaves stubbed (database, HTTP, external services)
- ✅ Comprehensive test vector coverage (all scenarios)
- ✅ Tests serve as living documentation

**Test suite structure:**
```
UserLoginTest
├── Happy Path (1 test)
├── Validation Failures (5 tests)
├── Step Failures
│   ├── Credentials invalid (2 tests)
│   ├── Account inactive (1 test)
│   └── Token generation fails (1 test)
├── Branch Conditions (3 tests)
└── Edge Cases (4 tests)

Total: 17 integration tests covering complete behavior
```

---

## Handling Complex Input Objects

### The Problem

As use cases grow, test data construction becomes verbose:

```java
// Painful to write repeatedly
var request = new Request(
    "john.doe@example.com",
    "SecureP@ssw0rd123",
    "REF-PREMIUM-2024",
    true,
    "192.168.1.1",
    Instant.now(),
    Map.of("tracking", "utm_source=test")
);
```

Multiply this by 30 test vectors = maintenance nightmare.

---

### Solution 1: Test Data Builders

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
        private boolean consent = true;
        private String ip = "127.0.0.1";
        private Instant timestamp = Instant.now();
        private Map<String, String> metadata = Map.of();

        public RequestBuilder withEmail(String email) {
            this.email = email;
            return this;
        }

        public RequestBuilder withPassword(String password) {
            this.password = password;
            return this;
        }

        public RequestBuilder withReferral(String referral) {
            this.referral = referral;
            return this;
        }

        public Request build() {
            return new Request(email, password, referral, consent, ip, timestamp, metadata);
        }
    }
}
```

**Usage:**

```java
// Default valid request
var request = TestData.request().build();

// Customize specific fields
var invalidEmail = TestData.request()
                           .withEmail("bad")
                           .build();

var weakPassword = TestData.request()
                           .withPassword("weak")
                           .build();

// Complex customization
var premiumReferral = TestData.request()
                              .withEmail("vip@example.com")
                              .withReferral("PREMIUM-2024")
                              .build();
```

**Benefits:**
- Default values handle 80% of test setup
- Only specify what's different per test
- Refactor-friendly (add field, update builder, all tests compile)

---

### Solution 2: Canonical Test Vectors

**Pre-defined test data constants:**

```java
public interface TestVectors {
    // Valid scenarios
    Request VALID = new Request("user@example.com", "Valid123", null, true, "127.0.0.1");
    Request VALID_WITH_REFERRAL = new Request("user@example.com", "Valid123", "REF123", true, "127.0.0.1");

    // Invalid scenarios
    Request INVALID_EMAIL = new Request("bad", "Valid123", null, true, "127.0.0.1");
    Request WEAK_PASSWORD = new Request("user@example.com", "weak", null, true, "127.0.0.1");
    Request MULTIPLE_ERRORS = new Request("bad", "weak", "invalid", false, null);

    // Edge cases
    Request NO_CONSENT = new Request("user@example.com", "Valid123", null, false, "127.0.0.1");
    Request SUSPICIOUS_IP = new Request("user@example.com", "Valid123", null, true, "0.0.0.0");
}
```

**Usage:**

```java
@Test
void execute_succeeds_forValidInput() {
    useCase.execute(TestVectors.VALID)
           .onSuccess(response -> assertNotNull(response.token()));
}

@Test
void execute_fails_forInvalidEmail() {
    useCase.execute(TestVectors.INVALID_EMAIL)
           .onSuccess(Assertions::fail);
}
```

**Benefits:**
- DRY (Don't Repeat Yourself)
- Named vectors document intent
- Easy to add new canonical cases
- Refactor-friendly

---

### Solution 3: Factory Methods

**Helper methods for common variations:**

```java
public class TestRequests {
    private static final String DEFAULT_PASSWORD = "DefaultValid123";
    private static final String DEFAULT_EMAIL = "default@example.com";

    public static Request withEmail(String email) {
        return new Request(email, DEFAULT_PASSWORD, null);
    }

    public static Request withPassword(String password) {
        return new Request(DEFAULT_EMAIL, password, null);
    }

    public static Request withReferral(String referral) {
        return new Request(DEFAULT_EMAIL, DEFAULT_PASSWORD, referral);
    }

    public static Request withBoth(String email, String password) {
        return new Request(email, password, null);
    }
}
```

**Usage:**

```java
@Test
void execute_fails_forInvalidEmail() {
    useCase.execute(TestRequests.withEmail("bad"))
           .onSuccess(Assertions::fail);
}
```

---

### Which Approach to Use?

**Canonical Vectors:** Simple use cases, few fields, limited variations
**Factory Methods:** Medium complexity, systematic field variations
**Builders:** Complex objects, many optional fields, many combinations

**Often: Combine them:**

```java
// Canonical for common cases
Request valid = TestVectors.VALID;

// Builder for complex customization
Request customized = TestData.request()
                             .from(TestVectors.VALID)
                             .withEmail("custom@test.com")
                             .build();
```

---


---

## Summary: Philosophy and Process

You've learned the evolutionary testing approach:

**Key principles:**
- Test assembled use cases, not isolated components
- Stub only at adapter boundaries (database, HTTP, etc.)
- Evolve tests alongside implementation - always green
- Use test data builders and canonical vectors for complex inputs
- Unit test value objects comprehensively
- Integration test use cases with test vectors

**The evolutionary process:**
1. Phase 1: Stub everything - establish structure
2. Phase 2: Implement validation - add validation tests
3. Phases 3-N: Add steps incrementally - expand scenarios
4. Final: Production-ready with comprehensive coverage

**Benefits:**
- Tests verify actual behavior, not implementation details
- Less brittle - refactoring doesn't break tests
- Clear boundaries - business logic vs adapters
- Living documentation - tests show all scenarios

---

## What's Next?

In [Part 8: Testing in Practice](part-08-testing-practice.md), you'll learn advanced organization techniques, complete worked examples, and how to migrate from traditional unit testing.

---

**Series Navigation**

[← Part 9: Advanced Patterns](part-06-advanced-patterns.md) | [Index](INDEX.md) | [Part 8: Testing in Practice →](part-08-testing-practice.md)

---

**Version:** 2.0.0 (2025-01-13) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)
