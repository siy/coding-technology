# Testing in Practice

## What You'll Learn

- How to organize large test counts without drowning in complexity
- What to test where (value objects, leaves, use cases, adapters)
- Complete worked example: RegisterUser from stub to production
- How to migrate from traditional unit testing

**Prerequisites:** [Testing Philosophy](testing-philosophy.md)

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

### Why the Counts Stay Isolated

The reason the counts stay manageable is structural, not just organizational. Each use case answers to one change driver, so its tests exercise one process and stub its steps; they do not reach into any shared object, because there is none. Two consequences follow.

Adding behavior **adds** a test class without touching the existing ones. A new use case is a new file with its own stubs and its own nested scenarios; the tests already written do not depend on it or break when it lands. New work is additive, and so is its test surface.

The contrast is the entity-first god-object. When one `User` or `Order` class carries the logic of every operation, its test suite accumulates the scenarios of every driver at once — login, registration, profile update, deactivation all piling onto the same fixture — and a change made for one of them can redden tests for the others. The use-case structure pays the same total number of tests (the scenarios are real either way), but it pays them in isolated files that fail independently, where the god-object pays them in one suite that fails together.

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

**Count decisions, not branches.** The guideline is a serviceable proxy, and it fails in
one direction: a branch count cannot see a decision expressed as *data*. A rule that
resolves a limit by looking up two enumerations -- seven loan types against five credit
tiers -- is thirty-five distinct answers wrapped in three or four conditionals. By branch
count it rates borderline. By decision count it is the most combinatorial thing in the
system.

Ask instead: **how many distinct outcomes can this reach, and over what input space?** The
number takes thirty seconds to work out, it is available before any test exists, and it
tells you two things a branch count cannot -- how many vectors you need, and which
combinations cannot occur at all. `PriceCalculator` in
[PlaceOrder](placeorder-example.md) has eighteen nominal combinations, of which three are
structurally impossible; the fifteen that remain go in a table, where a missing row is a
hole you can see.

**A branch the composition cannot reach is usually a design problem, not a testing one.**
Occasionally a branch goes untested for a reason that is not cost. Consider a two-branch
rule that reads the clock:

```java
// inside the use case
var sameDay = cutoffPolicy.acceptsSameDay(Instant.now());
```

Two branches, so the guideline says skip it. But a composition test reaches exactly one of
them, and *which* one depends on what time the suite runs. The after-hours path is not
expensive to reach; it is unreachable, and the suite quietly changes its mind at the
cutoff.

The fix is not a unit test for a two-branch leaf. It is that the clock is an undeclared
dependency -- and once it is a parameter like any other step, both branches are reachable
at the composition and the guideline's original answer turns out to be right after all.
The test you could not write is how you found the hidden dependency.

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

**What the number should be made of.** A percentage says how much was executed, not whether the
right things were established. Walk the composition chain and check off four items, which is the
operational form of *four facts live at the composition* from [Testing Philosophy](testing-philosophy.md):

| Obligation | One per | Present when |
|---|---|---|
| Success path | use case | the chain runs end to end and the response is assembled |
| Validation failure | use case | malformed input is rejected before any step runs |
| I/O failure | **each** step reaching outside the process | that step is unavailable and the use case says so |
| Absorbed failure | **each** dropped failure | the drop is asserted on the call, since it leaves no trace in the response |

The two "per each" rows are the ones most often short-changed. A use case that loads an account
and then persists a payment has two I/O obligations, and covering one of them is not covering
both:

```java
class ProcessRepaymentTest {
    @Test void execute_succeeds_forRegularPayment() { }        // success path

    @Test void execute_fails_forNegativePayment() { }          // validation
    @Test void execute_fails_forZeroPayment() { }

    @Test void execute_fails_whenAccountNotFound() { }         // I/O #1 -- the load
    @Test void execute_fails_whenPersistenceFails() { }        // I/O #2 -- the write

    // ... plus the domain behavior that belongs here rather than at a leaf
}
```

What is **not** on the list is as important. Do not add a failure test per step: short-circuiting
belongs to `flatMap` and the failure's content belongs to the rule that produces it. A chain of
nine steps does not owe nine failure tests -- the one above owes four, and the rest of its suite
earns its place by testing behavior, not plumbing.

**4. Adapters: Success + Error Modes (Contract Tests)**

```java
class JooqUserRepositoryTest {
    @Test void findById_succeeds_whenUserExists() { }
    @Test void findById_returnsEmpty_whenUserNotFound() { }
    @Test void findById_wrapsException_whenDatabaseFails() { }
}
```

**In use case tests:** Stub adapters. Don't test database interaction 30 times.

**And note what that stubbing owes.** Every stub in a use case test is an *assumption about
a boundary*: that the real adapter succeeds that way, fails that way, and translates a
transport exception into that typed failure. Nothing in the use case tests checks any of
it. The contract test is what makes the stub honest, and a suite of integration-first tests
without adapter contract tests is a suite whose stubs nobody has verified.

The third case above is the one that matters most, and it is the one most often missing:
the translation from an exception at the boundary to a typed failure inside the domain is
the adapter's entire job, and no use case test can reach it. Worked in full for
`InventoryChecker` in [PlaceOrder](placeorder-example.md).

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

**Question:** Does the leaf carry its own space?
- If **NO** (a projection - its space is a subspace of the parent's vectors) -> Delete unit test
- If **YES** (enumerable classes of its own, or an invariant over an unbounded domain) -> Keep unit test

### Step 3: Remove Redundant Unit Tests

**Keep:**
- Leaf tests that carry their own space - enumerable-class vectors and invariant tests, boundary rows included
- Value object tests (always)

**Delete:**
- Projection-leaf tests (the parent's vectors pin them)
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

    var useCase = UseCase.useCase(slowStep);

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
- Exercise 4.3: Testing Async Behavior

---

## What's Next

[Complete Example - RegisterUser](registeruser-example.md) presents the complete RegisterUser use case - from requirements to production code, demonstrating all patterns working together.
