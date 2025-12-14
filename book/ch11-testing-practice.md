# Chapter 11: Testing in Practice

## What You'll Learn

- How to organize large test counts without drowning in complexity
- What to test where (value objects, leaves, use cases, adapters)
- Complete worked example: RegisterUser from stub to production
- How to migrate from traditional unit testing

**Prerequisites:** [Chapter 10: Testing Philosophy](ch10-testing-philosophy.md)

---

## Managing Large Test Counts

### The "Problem"

Comprehensive testing generates many tests:

```
UserLoginTest: 35 tests
RegisterUserTest: 42 tests
UpdateProfileTest: 28 tests
```

**This is not a problem - it's honest complexity.** 35 tests = 35 real scenarios.

But we need organization to stay sane.

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
        @Test void execute_aggregatesMultipleErrors() { /* ... */ }
    }

    @Nested class StepFailures {
        @Test void execute_fails_whenCredentialsInvalid() { /* ... */ }
        @Test void execute_fails_whenAccountInactive() { /* ... */ }
        @Test void execute_fails_whenTokenGenerationFails() { /* ... */ }
    }

    @Nested class EdgeCases {
        @Test void execute_handlesNullReferral() { /* ... */ }
        @Test void execute_handlesEmptyStrings() { /* ... */ }
    }
}
```

**Benefits:**
- IDE collapses nested classes - scan at high level
- Clear categorization - find tests by scenario type
- Shared setup per category
- Test report groups meaningfully

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
    "ALLUPPERCASE, NoLowercase"
})
void execute_fails_forWeakPassword(String password, String expectedReason) {
    var request = TestData.request().withPassword(password).build();

    useCase.execute(request)
           .onSuccess(Assertions::fail)
           .onFailure(cause -> assertTrue(cause.message().contains(expectedReason)));
}
```

**Reduces:** 5 individual tests -> 1 parameterized test with 5 values.

### Strategy 3: Test Organization in Files

**Large use cases -> multiple test files:**

```
usecase/
|-- userlogin/
    |-- UserLogin.java (implementation)
    |-- UserLoginValidationTest.java (validation scenarios)
    |-- UserLoginFlowTest.java (happy path + step failures)
    |-- UserLoginEdgeCasesTest.java (edge cases)
```

**Guideline:** Keep individual test files under 500 lines.

---

## What to Test Where

### Coverage Criteria by Component Type

**1. Value Objects: 100% Coverage (Unit Tests)**

```java
class EmailTest {
    @Test void email_accepts_validFormat() { }
    @Test void email_rejects_missingAt() { }
    @Test void email_rejects_missingDomain() { }
    @Test void email_normalizesToLowercase() { }
    @Test void email_trimsWhitespace() { }
}
```

**Why 100%?** Value objects are pure, isolated, easy to test. No excuse for gaps.

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

**3. Use Cases: 90%+ Coverage (Integration Test Vectors)**

```java
class RegisterUserTest {
    // Happy path
    @Test void execute_succeeds_forValidInput() { }

    // Validation failures
    @Test void execute_fails_forInvalidEmail() { }
    @Test void execute_fails_forWeakPassword() { }

    // Step failures
    @Test void execute_fails_whenEmailAlreadyExists() { }
    @Test void execute_fails_whenPasswordHashingFails() { }

    // Branch conditions
    @Test void execute_sendsWelcomeEmail_forNewUser() { }
}
```

**Why 90%+?** Use cases are the behavior. Incomplete coverage = incomplete understanding.

**4. Adapters: Success + Error Modes (Contract Tests)**

```java
class JooqUserRepositoryTest {
    @Test void findById_succeeds_whenUserExists() { }
    @Test void findById_returnsEmpty_whenUserNotFound() { }
    @Test void findById_wrapsException_whenDatabaseFails() { }
}
```

**In use case tests:** Stub adapters. Don't test database interaction 30 times.

---

## The Testing Pyramid

```
             /\
            /  \
           /____\ E2E Tests (few)
          /      \ - Through REST layer
         /        \ - Real database (Testcontainers)
        /__________\ Integration Tests (many)
       /            \ - Use case test vectors
      /              \ - All business logic assembled
     /                \ - Only adapters stubbed
    /__________________\ Unit Tests (some)
   /                    \ - Value objects (all)
  /                      \ - Complex business leaves
 /                        \ - Adapter contracts
/--------------------------\
```

**This is inverted from traditional pyramid** - we have MORE integration tests than unit tests.

**Why?** Because our business logic is composition. Testing fragments misses the point.

---

## Complete Worked Example: RegisterUser

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
@Test
void execute_succeeds_forValidInput() {
    var useCase = RegisterUser.registerUser();
    var request = new Request("john@example.com", "Valid123");

    useCase.execute(request)
           .await()
           .onFailure(Assertions::fail)
           .onSuccess(response -> assertEquals("stub-user-id", response.userId()));
}
```

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
    var request = new Request("bad", "Valid123");
    useCase.execute(request).await().onSuccess(Assertions::fail);
}
```

### Phase 3-6: Add Steps Incrementally

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
    @BeforeEach
    void setup() {
        CheckEmailUniqueness stubUniqueness = vr -> Promise.success(vr);
        HashPassword stubHash = vr -> Promise.success(new HashedPassword("hash"));
        SaveUser stubSave = hp -> Promise.success(new User("user-1"));
        SendWelcomeEmail stubEmail = u -> Promise.success(u);

        useCase = RegisterUser.registerUser(stubUniqueness, stubHash, stubSave, stubEmail);
    }

    @Nested class HappyPath {
        @Test void execute_succeeds_forValidInput() { /* ... */ }
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

## Migration Guide: From Traditional to Evolutionary

### Step 1: Add Integration Tests

Start by adding integration test vectors for key scenarios:

```java
// Keep existing unit tests
class CheckCredentialsTest {
    @Test void validCredentials_succeeds() { /* ... */ }
}

// Add new integration tests
class UserLoginTest {
    @Test void execute_succeeds_forValidInput() { /* ... */ }
    @Test void execute_fails_whenCredentialsInvalid() { /* ... */ }
}
```

### Step 2: Identify Redundancy

As you add integration tests, notice which unit tests become redundant.

**Question:** Is the unit test adding value beyond the integration test?
- If **NO** -> Delete unit test
- If **YES** (complex logic, many branches) -> Keep unit test

### Step 3: Remove Redundant Unit Tests

**Keep:**
- Complex business leaf tests
- Value object tests (always)
- Edge case tests not covered by integration

**Delete:**
- Simple step tests (covered by integration)
- Mock-heavy tests (testing mocking framework more than logic)
- Tests that break on refactoring

### Step 4: End State

```
Before Migration:
|-- 60 unit tests (component-focused)
|-- 5 integration tests
|-- Many mocks, brittle tests

After Migration:
|-- 30 integration tests (behavior-focused)
|-- 10 value object unit tests
|-- 5 complex leaf unit tests
|-- No mocks of business logic
```

**Result:** Fewer tests, better coverage, more confidence, less brittleness.

---

## Test Speed Classification

### Fast Tests vs Slow Tests

| Test Type | Speed | What's Stubbed | When to Run |
|-----------|-------|----------------|-------------|
| **Unit tests** | < 10ms each | Nothing (pure functions) | Every build |
| **Fast integration** | < 100ms each | Real business logic, stubbed adapters | Every build |
| **Slow integration** | 100ms - 1s | Real adapters (DB, HTTP) | Pre-commit, CI |
| **E2E tests** | > 1s | Nothing (full stack) | CI only |

**Organize test suites:**

```java
// Fast tests - run always
@Tag("fast")
class UserLoginTest { /* stubbed adapters */ }

// Slow tests - run before commit
@Tag("slow")
class UserLoginIntegrationTest { /* real database */ }
```

**Maven/Gradle configuration:**
```xml
<!-- Run fast tests by default -->
<excludedGroups>slow</excludedGroups>
```

### Testing Async Promise-Based Flows

**Basic pattern - use `.await()`:**
```java
@Test
void async_succeeds() {
    useCase.execute(request)
           .await()  // Blocks until resolved
           .onFailure(Assertions::fail)
           .onSuccess(response -> assertEquals("expected", response.value()));
}
```

**With timeout for slow operations:**
```java
@Test
void async_completesWithinTimeout() {
    useCase.execute(request)
           .await(TimeSpan.seconds(5))  // Fail if takes > 5s
           .onFailure(cause -> {
               if (cause instanceof CoreError.Timeout) {
                   fail("Operation timed out");
               }
               fail("Unexpected error: " + cause.message());
           })
           .onSuccess(response -> assertNotNull(response));
}
```

**Testing timeout behavior:**
```java
@Test
void timeout_failsSlowOperation() {
    // Simulate slow operation
    var slowStep = input -> Promise.<Output>promise(promise -> {
        // Never resolves
    });

    var useCase = UseCase.create(slowStep);

    useCase.execute(request)
           .timeout(TimeSpan.millis(100))
           .await()
           .onSuccess(Assertions::fail)  // Should not succeed
           .onFailure(cause -> assertInstanceOf(CoreError.Timeout.class, cause));
}
```

**Testing parallel operations (Fork-Join):**
```java
@Test
void forkJoin_completesAllBranches() {
    var results = Promise.all(
        Promise.success("a"),
        Promise.success("b"),
        Promise.success("c")
    ).await();

    results.onFailure(Assertions::fail)
           .onSuccess((a, b, c) -> {
               assertEquals("a", a);
               assertEquals("b", b);
               assertEquals("c", c);
           });
}
```

---

## Key Takeaways

1. **Organize by scenario** - Nested classes, parameterized tests
2. **Value objects: 100%** - Unit tests, always
3. **Complex leaves: 100%** - Unit tests if 3+ branches
4. **Use cases: 90%+** - Integration tests with stubbed adapters
5. **Adapters: Contract tests** - Success + error modes only
6. **Migrate incrementally** - Add integration first, then remove redundant unit tests

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 4.3: Test suite organization
- Exercise 4.4: Migration from traditional testing

---

## What's Next

[Chapter 12](ch12-registeruser-example.md) presents the complete RegisterUser use case - from requirements to production code, demonstrating all patterns working together.
