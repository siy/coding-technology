# Part 8: Testing in Practice

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 8 of 9

**Previous:** [Part 7: Testing Philosophy & Evolution](part-07-testing-philosophy.md) | **Next:** [Part 9: Building Production Systems](part-09-production-systems.md)

---

## Overview

This part covers practical testing techniques: organizing large test suites, complete worked examples, and migrating from traditional unit testing to integration-first testing.

**What you'll learn:**
- How to organize large test counts without drowning in complexity
- What to test where (value objects, leaves, use cases, adapters)
- Complete worked example: RegisterUser from stub to production
- How to migrate existing unit test suites
- The testing pyramid for this technology

**Prerequisites:** [Part 7: Testing Philosophy & Evolution](part-07-testing-philosophy.md)

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

**Part 9: Production Systems**

Now that you know how to test, let's put it all together: complete use case walkthrough from requirements to deployment, project structure, and framework integration.

**[Continue to Part 9: Production Systems →](part-09-production-systems.md)**

---

**Copyright © 2025 Sergiy Yevtushenko**

This work is licensed under the [MIT License](https://github.com/siy/coding-technology/blob/main/LICENSE).

---

## Summary: Testing in Practice

You've learned how to apply evolutionary testing at scale:

**Organization techniques:**
- Nested test classes for scenario grouping
- Parameterized tests for data-driven variants
- Property-based testing for systematic coverage
- Multiple test files for large use cases

**Coverage strategy:**
- Value objects: 100% (unit tests)
- Business leaves: 100% if complex, skip if trivial
- Use cases: 90%+ (integration test vectors)
- Adapters: Success + error modes (contract tests)

**Complete process:**
- Start with stub factory
- Add validation layer
- Implement steps incrementally
- Tests stay green throughout
- End with production-ready, comprehensive coverage

**Migration path:**
- Add integration tests first
- Identify redundant unit tests
- Remove brittle, mock-heavy tests
- Keep complex leaf tests and value object tests
- Refactor remaining tests into scenarios

**The inverted pyramid:**
- More integration tests than unit tests
- Tests verify composition, not fragments
- Higher confidence, less brittleness

---

## What's Next?

**Part 9: Building Production Systems**

Now that you know how to test, let's put it all together: complete use case walkthrough from requirements to deployment, project structure, and framework integration.

**[Continue to Part 9: Building Production Systems →](part-09-production-systems.md)**

---

**Series Navigation**

[← Part 7: Testing Philosophy & Evolution](part-07-testing-philosophy.md) | [Index](INDEX.md) | [Part 9: Building Production Systems →](part-09-production-systems.md)

---

**Copyright © 2025 Sergiy Yevtushenko**

This work is licensed under the [MIT License](https://github.com/siy/coding-technology/blob/main/LICENSE).
