# Part 5: Testing Strategy & Evolutionary Approach

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 5 of 6

**Previous:** [Part 4: Advanced Patterns & Testing](part-04-advanced-patterns.md) | **Next:** [Part 6: Production Systems](part-06-production-systems.md)

---

## Introduction

You've learned patterns. You've seen composition. Now the critical question: **How do we test this?**

Traditional testing wisdom says "write unit tests for every class." But this technology is different. Our code is functional compositions - Sequencers chaining steps, Fork-Joins running parallel operations, value objects enforcing invariants. Testing isolated components misses the point: **we need to test composition**.

This part introduces **evolutionary testing** - an approach that treats your use case as a living organism that grows from stub to production, with tests evolving alongside. Instead of fragmenting your business logic into isolated unit tests, you test **behavior end-to-end**, stubbing only at the adapter boundaries.

**What you'll learn:**
- Why integration-first testing aligns with functional composition
- The evolutionary process: stub everything → implement incrementally → production-ready
- How to organize large test suites without drowning in complexity
- Test utilities that eliminate boilerplate
- When you still need unit tests (spoiler: less often than you think)
- How to migrate from traditional unit testing

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

## Managing Large Test Counts

### The "Problem"

Comprehensive testing generates many tests:

```
UserLoginTest: 35 tests
RegisterUserTest: 42 tests
UpdateProfileTest: 28 tests
...
```

**This is not a problem - it's honest complexity.** 35 tests = 35 real scenarios.

But we need organization to stay sane.

---

### Strategy 1: Nested Test Classes

**Group tests by scenario type:**

```java
class UserLoginTest {
    private UserLogin useCase;
    private CheckCredentials stubCreds;
    private CheckAccountStatus stubStatus;
    private GenerateToken stubToken;

    @BeforeEach
    void setup() {
        stubCreds = vr -> Result.success(new Credentials("user-1"));
        stubStatus = c -> Result.success(new Account(c.userId(), true));
        stubToken = acc -> Result.success(new Response("token-" + acc.userId()));
        useCase = UserLogin.userLogin(stubCreds, stubStatus, stubToken);
    }

    @Nested class HappyPath {
        @Test void execute_succeeds_forValidInput() { /* ... */ }
        @Test void execute_succeeds_withOptionalReferral() { /* ... */ }
    }

    @Nested class ValidationFailures {
        @Test void execute_fails_forInvalidEmail() { /* ... */ }
        @Test void execute_fails_forWeakPassword() { /* ... */ }
        @Test void execute_fails_forInvalidReferral() { /* ... */ }
        @Test void execute_aggregatesMultipleErrors() { /* ... */ }
    }

    @Nested class StepFailures {
        @Test void execute_fails_whenCredentialsInvalid() { /* ... */ }
        @Test void execute_fails_whenAccountInactive() { /* ... */ }
        @Test void execute_fails_whenAccountLocked() { /* ... */ }
        @Test void execute_fails_whenTokenGenerationFails() { /* ... */ }
    }

    @Nested class BranchConditions {
        @Test void execute_applysPremiumDiscount_forPremiumReferral() { /* ... */ }
        @Test void execute_requiresStrongPassword_forPremiumAccount() { /* ... */ }
        @Test void execute_sendsNotification_forFirstLogin() { /* ... */ }
    }

    @Nested class EdgeCases {
        @Test void execute_handlesNullReferral() { /* ... */ }
        @Test void execute_handlesEmptyStrings() { /* ... */ }
        @Test void execute_handlesExtremelyLongInputs() { /* ... */ }
    }
}
```

**Benefits:**
- IDE collapses nested classes - scan at high level
- Clear categorization - find tests by scenario type
- Shared setup per category (can override @BeforeEach in nested class)
- Test report groups meaningfully

---

### Strategy 2: Parameterized Tests

**Collapse similar tests into data-driven variants:**

```java
@ParameterizedTest
@ValueSource(strings = {"bad", "no@domain", "@missing", "user@", "CAPS@TEST.COM"})
void execute_fails_forInvalidEmail(String invalidEmail) {
    var request = TestData.request().withEmail(invalidEmail).build();

    useCase.execute(request)
           .onSuccess(Assertions::fail);
}

@ParameterizedTest
@CsvSource({
    "weak, TooShort",
    "alllowercase, NoUppercase",
    "ALLUPPERCASE, NoLowercase",
    "NoDigits123, Missing special char"
})
void execute_fails_forWeakPassword(String password, String expectedReason) {
    var request = TestData.request().withPassword(password).build();

    useCase.execute(request)
           .onSuccess(Assertions::fail)
           .onFailure(cause -> assertTrue(cause.message().contains(expectedReason)));
}
```

**What collapsed:**
- 5 individual `@Test` methods → 1 parameterized test with 5 values
- 4 password tests → 1 parameterized test with 4 CSV rows

**Reduces:** Test count from 40 to 25, same coverage.

---

### Strategy 3: Property-Based Testing

**For systematic variations, use property-based testing:**

```java
@Property
void execute_succeeds_forAllValidInputs(
    @ForAll("validEmails") String email,
    @ForAll("validPasswords") String password
) {
    var request = TestData.request()
                          .withEmail(email)
                          .withPassword(password)
                          .build();

    useCase.execute(request)
           .onFailure(cause -> fail("Should succeed for valid inputs: " + cause.message()));
}

@Provide
Arbitrary<String> validEmails() {
    return Arbitraries.strings()
                      .alpha()
                      .ofMinLength(3)
                      .ofMaxLength(20)
                      .map(s -> s + "@example.com");
}

@Provide
Arbitrary<String> validPasswords() {
    // Generate passwords matching validation rules
    return Combinators.combine(
        Arbitraries.strings().alpha().numeric(),
        Arbitraries.of("!", "@", "#", "$")
    ).as((base, special) -> base + special + "A1");
}
```

**What collapsed:**
- 20 example-based valid input tests → 1 property test (100 generated examples)

**Libraries:** jqwik (recommended), QuickTheories, junit-quickcheck

---

### Strategy 4: Test Organization in Files

**Large use cases → multiple test files:**

```
usecase/
├── userlogin/
    ├── UserLogin.java (implementation)
    ├── UserLoginValidationTest.java (validation scenarios)
    ├── UserLoginFlowTest.java (happy path + step failures)
    ├── UserLoginBranchesTest.java (conditional logic)
    └── UserLoginEdgeCasesTest.java (edge cases, performance)
```

**Split by:**
- Validation vs flow vs branches
- Sync vs async variants
- Normal cases vs edge cases

**Guideline:** Keep individual test files under 500 lines.

---

## What to Test Where

### Coverage Criteria by Component Type

**1. Value Objects: 100% Coverage (Unit Tests)**

```java
// Email.java - all validation rules
class EmailTest {
    @Test void email_accepts_validFormat() { }
    @Test void email_rejects_missingAt() { }
    @Test void email_rejects_missingDomain() { }
    @Test void email_rejects_invalidDomain() { }
    @Test void email_normalizesToLowercase() { }
    @Test void email_trimsWhitespace() { }
}
```

**Why 100%?** Value objects are pure, isolated, easy to test. No excuse for gaps.

---

**2. Business Leaves: 100% if Complex, Skip if Trivial (Unit Tests)**

**Complex leaf (write unit tests):**
```java
class PricingEngine {
    Result<Price> calculatePrice(Order order) {
        // 50 lines, 8 branches, complex discounting logic
    }
}

// Deserves dedicated PricingEngineTest with 20+ tests
```

**Trivial leaf (covered by integration):**
```java
static Price applyTax(Price base) {
    return new Price(base.amount().multiply(TAX_RATE));
}

// No dedicated test - covered when use case tested
```

**Guideline:** If leaf has 3+ branches or 20+ lines, write unit tests.

---

**3. Use Cases: 90%+ Coverage (Integration Test Vectors)**

```java
// Test all paths through the sequencer
class RegisterUserTest {
    // Happy path
    @Test void execute_succeeds_forValidInput() { }

    // Validation failures (all validation rules)
    @Test void execute_fails_forInvalidEmail() { }
    @Test void execute_fails_forWeakPassword() { }
    // ... (all validation scenarios)

    // Step failures
    @Test void execute_fails_whenEmailAlreadyExists() { }
    @Test void execute_fails_whenPasswordHashingFails() { }
    @Test void execute_fails_whenDatabaseSaveFails() { }

    // Branch conditions
    @Test void execute_sendsWelcomeEmail_forNewUser() { }
    @Test void execute_skipsColdWelcome_forReferredUser() { }
}
```

**Why 90%+?** Use cases are the behavior. Incomplete coverage = incomplete understanding.

---

**4. Adapters: Success + Error Modes (Contract Tests)**

```java
// Test that adapter correctly wraps framework
class JooqUserRepositoryTest {
    @Test void findById_succeeds_whenUserExists() {
        // Verify correct SQL, correct domain object mapping
    }

    @Test void findById_returnsEmpty_whenUserNotFound() {
        // Verify Option.empty() returned, not exception
    }

    @Test void findById_wrapsException_whenDatabaseFails() {
        // Verify SQLException wrapped in domain Cause
    }
}
```

**Why contract tests?** Adapters bridge frameworks to domain. Test the contract, not implementation.

**In use case tests:** Stub adapters. Don't test database interaction 30 times.

---

### The Testing Pyramid for This Technology

```
       /\
      /  \   E2E Tests (few)
     /____\  - Through REST/messaging layer
    /      \ - Real database (Testcontainers)
   /        \ - Smoke tests, critical paths
  /__________\
  /          \ Integration Tests (many)
 /            \ - Use case test vectors
/              \ - All business logic assembled
/________________\ - Only adapters stubbed
/                  \ Unit Tests (some)
/                    \ - Value objects (all)
/______________________\ - Complex business leaves
                         - Adapter contracts
```

**This is inverted from traditional pyramid** - we have MORE integration tests than unit tests.

**Why?** Because our business logic is composition. Testing fragments misses the point.

---

## Complete Worked Example

Let's walk through evolutionary testing for a complete use case.

### Use Case: Register User

**Requirements:**
- Validate email, password
- Check email uniqueness
- Hash password
- Save user to database
- Send welcome email

---

### Phase 1: Stub Everything

```java
public interface RegisterUser {
    record Request(String email, String password) {}
    record Response(String userId) {}

    Promise<Response> execute(Request request);

    static RegisterUser registerUser() {
        return request -> Promise.success(new Response("stub-user-id"));
    }
}
```

**Test:**

```java
class RegisterUserTest {
    @Test
    void execute_succeeds_forValidInput() {
        var useCase = RegisterUser.registerUser();
        var request = new Request("john@example.com", "Valid123");

        var response = awaitSuccess(useCase.execute(request));
        assertEquals("stub-user-id", response.userId());
    }
}
```

✅ **Test passes**

---

### Phase 2: Add Validation

```java
record ValidRequest(Email email, Password password) {
    static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()))
                     .map(ValidRequest::new);
    }
}

static RegisterUser registerUser() {
    return request -> ValidRequest.validRequest(request)
                                  .async()
                                  .map(_ -> new Response("stub-user-id"));
}
```

**Add validation tests:**

```java
@Test
void execute_fails_forInvalidEmail() {
    var useCase = RegisterUser.registerUser();
    var request = new Request("bad", "Valid123");

    assertFailureType(awaitOrFail(useCase.execute(request)), ValidationError.class);
}

@Test
void execute_fails_forWeakPassword() {
    var useCase = RegisterUser.registerUser();
    var request = new Request("john@example.com", "weak");

    assertFailureType(awaitOrFail(useCase.execute(request)), ValidationError.class);
}
```

✅ **All tests pass**

---

### Phase 3: Add CheckEmailUniqueness

```java
interface CheckEmailUniqueness {
    Promise<ValidRequest> apply(ValidRequest request);
}

static RegisterUser registerUser(CheckEmailUniqueness checkUniqueness) {
    return request -> ValidRequest.validRequest(request)
                                  .async()
                                  .flatMap(checkUniqueness::apply)
                                  .map(_ -> new Response("stub-user-id"));
}
```

**Update tests:**

```java
@BeforeEach
void setup() {
    CheckEmailUniqueness stubUniqueness = vr -> Promise.success(vr);
    useCase = RegisterUser.registerUser(stubUniqueness);
}
```

**Add failure scenario:**

```java
@Test
void execute_fails_whenEmailExists() {
    CheckEmailUniqueness failing = vr -> UserError.EmailExists.INSTANCE.promise();
    var useCase = RegisterUser.registerUser(failing);
    var request = new Request("john@example.com", "Valid123");

    assertFailureType(awaitOrFail(useCase.execute(request)), UserError.EmailExists.class);
}
```

✅ **All tests pass**

---

### Phase 4-6: Continue Adding Steps

After fully implementing:

```java
static RegisterUser registerUser(CheckEmailUniqueness checkUniqueness,
                                 HashPassword hashPassword,
                                 SaveUser saveUser,
                                 SendWelcomeEmail sendEmail) {
    return request -> ValidRequest.validRequest(request)
                                  .async()
                                  .flatMap(checkUniqueness::apply)
                                  .flatMap(hashPassword::apply)
                                  .flatMap(saveUser::apply)
                                  .flatMap(sendEmail::apply)
                                  .map(user -> new Response(user.id()));
}
```

**Final test suite:**

```java
class RegisterUserTest {
    private RegisterUser useCase;

    @BeforeEach
    void setup() {
        CheckEmailUniqueness stubUniqueness = vr -> Promise.success(vr);
        HashPassword stubHash = vr -> Promise.success(new HashedPassword("hash"));
        SaveUser stubSave = hp -> Promise.success(new User("user-1"));
        SendWelcomeEmail stubEmail = u -> Promise.success(u);

        useCase = RegisterUser.registerUser(stubUniqueness, stubHash, stubSave, stubEmail);
    }

    @Nested class HappyPath {
        @Test void execute_succeeds_forValidInput() {
            var request = TestData.request().build();
            var response = awaitSuccess(useCase.execute(request));
            assertEquals("user-1", response.userId());
        }
    }

    @Nested class ValidationFailures {
        @Test void execute_fails_forInvalidEmail() { /* ... */ }
        @Test void execute_fails_forWeakPassword() { /* ... */ }
    }

    @Nested class StepFailures {
        @Test void execute_fails_whenEmailExists() { /* ... */ }
        @Test void execute_fails_whenHashingFails() { /* ... */ }
        @Test void execute_fails_whenSaveFails() { /* ... */ }
        @Test void execute_fails_whenEmailSendingFails() { /* ... */ }
    }
}
```

**Total:** 8 integration tests, complete behavior coverage, only adapters stubbed.

---

## Comparison to Traditional Unit Testing

### Scenario: Same Use Case (RegisterUser)

**Traditional Approach:**

```
ValidRequestTest.java (6 tests)
CheckEmailUniquenessTest.java (3 tests)
HashPasswordTest.java (4 tests)
SaveUserTest.java (5 tests)
SendWelcomeEmailTest.java (3 tests)
RegisterUserIntegrationTest.java (2 tests)

Total: 23 tests across 6 files
```

**What's tested:**
- ✅ Each component in isolation
- ❌ Composition of components
- ❌ Error propagation through chain
- ❌ Actual end-to-end behavior

**What breaks tests:**
- Interface changes (all component tests)
- Step reordering (integration tests)
- Refactoring (extract sub-sequencer breaks mocks)

---

**Evolutionary Approach:**

```
RegisterUserTest.java (8 tests)
EmailTest.java (unit tests for value object)
PasswordTest.java (unit tests for value object)

Total: 8 integration tests + value object units
```

**What's tested:**
- ✅ Complete end-to-end behavior
- ✅ All error paths through composition
- ✅ Real sequencing and propagation
- ✅ Value object invariants

**What breaks tests:**
- Breaking changes to public API (Request/Response)
- Broken business logic

**What doesn't break tests:**
- Refactoring (extract sub-sequencer)
- Step reordering
- Internal interface changes

---

### Coverage Comparison

**Traditional:**
- Line coverage: 95%
- Branch coverage: 88%
- Integration coverage: **20%** (only 2 integration tests)

**Evolutionary:**
- Line coverage: 95%
- Branch coverage: 90%
- Integration coverage: **100%** (all tests are integration tests)

**Which is better?** Evolutionary. High line coverage with low integration coverage = false confidence.

---

## Migration Guide: From Traditional to Evolutionary

### You Have Existing Unit Tests

**Don't panic. Don't delete everything. Evolve.**

---

**Step 1: Add Integration Tests**

Start by adding integration test vectors for key scenarios:

```java
// Keep existing unit tests
class CheckCredentialsTest {
    @Test void validCredentials_succeeds() { /* ... */ }
    // 5 existing unit tests
}

// Add new integration tests
class UserLoginTest {
    @Test void execute_succeeds_forValidInput() { /* ... */ }
    @Test void execute_fails_whenCredentialsInvalid() { /* ... */ }
    // 10 new integration tests
}
```

---

**Step 2: Identify Redundancy**

As you add integration tests, notice which unit tests become redundant:

```java
// Unit test
class CheckCredentialsTest {
    @Test void validCredentials_succeeds() {
        var result = checkCreds.apply(validRequest);
        assertTrue(result.isSuccess());
    }
}

// Integration test covers this
class UserLoginTest {
    @Test void execute_succeeds_forValidInput() {
        // This tests CheckCredentials as part of real flow
        useCase.execute(validRequest).onSuccess(/* ... */);
    }
}
```

**Question:** Is the unit test adding value beyond the integration test?
- If **NO** → Delete unit test
- If **YES** (complex logic, many branches) → Keep unit test

---

**Step 3: Remove Redundant Unit Tests**

Delete unit tests that only verify "step works in isolation" when integration tests verify "step works in real composition."

**Keep:**
- Complex business leaf tests (rich algorithms)
- Value object tests (always)
- Edge case tests not covered by integration

**Delete:**
- Simple step tests (covered by integration)
- Mock-heavy tests (testing mocking framework more than logic)
- Tests that break on refactoring (brittle)

---

**Step 4: Refactor Remaining Tests**

Convert isolated unit tests into integration test scenarios:

```java
// Before: Isolated unit test
class CheckAccountStatusTest {
    @Test void inactiveAccount_fails() {
        var status = new Account("user-1", false);
        var result = checkStatus.apply(credentials);
        assertTrue(result.isFailure());
    }
}

// After: Integration test scenario
class UserLoginTest {
    @Test void execute_fails_whenAccountInactive() {
        CheckAccountStatus inactiveStub = c -> new Account(c.userId(), false);
        var useCase = UserLogin.userLogin(stubCreds, inactiveStub, stubToken);

        useCase.execute(validRequest).onSuccess(Assertions::fail);
    }
}
```

---

**Step 5: End State**

```
Before Migration:
├── 60 unit tests (component-focused)
├── 5 integration tests
└── Many mocks, brittle tests

After Migration:
├── 30 integration tests (behavior-focused)
├── 10 value object unit tests
├── 5 complex leaf unit tests
└── No mocks of business logic
```

**Result:** Fewer tests, better coverage, more confidence, less brittleness.

---

## Summary: The Evolutionary Testing Philosophy

### Key Principles

1. **Test assembled use cases, not isolated components**
   Business logic is composition. Test the composition.

2. **Stub only at adapter boundaries**
   Database, HTTP, external services. Never stub business logic.

3. **Evolve tests alongside implementation**
   Start with stubs, incrementally replace, tests stay green.

4. **Organize by scenario, not by component**
   Nested classes, parameterized tests, property-based tests.

5. **Use utilities to manage complexity**
   Test data builders, stub factories, assertion helpers.

6. **Unit test value objects and complex leaves**
   Pure, isolated components deserve unit tests.

7. **Integration test use cases comprehensively**
   Every validation rule, every step failure, every branch, every edge case.

---

### What You've Learned

✅ **Why integration-first testing** aligns with functional composition
✅ **The evolutionary process** from stub to production
✅ **How to handle complex inputs** with builders and factories
✅ **How to organize large test suites** without drowning
✅ **What to test where** (value objects vs leaves vs use cases vs adapters)
✅ **Test utilities** that eliminate boilerplate
✅ **Migration path** from traditional unit testing

---

### What's Next

**Part 6: Production Systems**

Now that you know how to test, let's put it all together: complete use case walkthrough from requirements to deployment, project structure, and framework integration.

**[Continue to Part 6: Production Systems →](part-06-production-systems.md)**

---

**Copyright © 2025 Sergiy Yevtushenko**

This work is licensed under the [MIT License](https://github.com/siy/coding-technology/blob/main/LICENSE).
