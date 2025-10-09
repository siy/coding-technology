---
tags: [AI, Java, coding-technology]
published: true
description: "Revolutionary technology for writing deterministic, AI-friendly, high quality Java backend code using functional patterns, vertical slicing, and minimal set of rules."
---

# Java Backend Coding Technology: Writing Code in the Era of AI

**Version:** 1.5.0 | **Repository:** [github.com/siy/coding-technology](https://github.com/siy/coding-technology) | **Changelog:** [CHANGELOG.md](https://github.com/siy/coding-technology/blob/main/CHANGELOG.md)

## Introduction: Code in a New Era

Software development is changing faster than ever. AI-powered code generation tools have moved from experimental novelty to daily workflow staple in just a few years. We now write code alongside - and increasingly with - intelligent assistants that can generate entire functions, refactor modules, and suggest architectural patterns. This shift creates new challenges that traditional coding practices weren't designed to handle.

Historically, code has carried a heavy burden of personal style. Every developer brings preferences about naming, structure, error handling, and abstraction. Teams spend countless hours in code review debating subjective choices. Style guides help, but they can't capture the deeper structural decisions that make code readable or maintainable. When AI generates code, it inherits these same inconsistencies - we just don't know whose preferences it's channeling or why it made particular choices.

This creates a context problem. When you read AI-generated code, you're reverse-engineering decisions made by a model trained on millions of examples with conflicting styles. When AI reads your code to suggest changes, it must infer your intentions from the structure that may not clearly express them. The cognitive overhead compounds: developers burn mental cycles translating between their mental model, the code's structure, and what the AI "thinks" the code means.

Meanwhile, technical debt accumulates silently. Small deviations from the good structure - a validation check here, an exception there, a bit of mixed abstraction levels - seem harmless in isolation. But they compound. Refactoring becomes risky. Testing becomes difficult. The codebase becomes a collection of special cases rather than a coherent system. 

> Traditional approaches don't provide clear, mechanical rules for when to refactor or how to structure new code, so these decisions remain subjective and inconsistent.

This technology proposes a different approach: **reduce the space of valid choices until there's essentially one good way to do most things**. Not through rigid frameworks or heavy ceremony, but through a small set of rules that make structure predictable, refactoring mechanical, and business logic clearly separated from technical concerns.

The benefits compound:

**Unified structure** means humans can read AI-generated code without guessing about hidden assumptions, and AI can read human code without inferring structure from context. A use case looks the same whether you wrote it, your colleague wrote it, or an AI assistant generated it. The structure carries the intent.

**Minimal technical debt** emerges naturally because refactoring rules are built into the technology. When a function grows beyond one clear responsibility, the rules tell you exactly how to split it. When a component gets reused, there's one obvious place to move it. Debt doesn't accumulate because prevention is cheaper than cleanup.

**Close business modeling** happens when you're not fighting technical noise. Value objects enforce domain invariants at construction time. Use cases read like business processes because each step does one thing. Errors are domain concepts, not stack traces. Product owners can read the code structure and recognize their requirements.

**Requirement discovery** becomes systematic. When you structure code as validation → steps → composition, gaps become obvious. Missing validation rules surface when you define value objects. Unclear business logic reveals itself when you can't name a step clearly. Edge cases emerge when you model errors as explicit types. The structure itself asks the right questions: What can fail here? What invariants must hold? What happens when this is missing? Validating answers for compatibility is mechanical - if a new requirement doesn't fit the existing step structure, you know immediately whether it's a new concern or a modification to existing logic.

**Asking correct questions** becomes easy because the technology provides a framework for inquiry. When discussing requirements with domain experts, you can ask: "What validation rules apply to this field?" (maps to value object factories). "What happens if this step fails?" (maps to error types). "Can these operations run in parallel?" (maps to Fork-Join vs. Sequencer). "Is this value optional or required?" (maps to `Option<T>` vs `T`). The questions are grounded in structure, not abstraction, so answers are concrete and immediately implementable.

**Business logic as a readable language** happens when patterns become vocabulary. The four return types, parse-don't-validate, and the fixed pattern catalog form a Business Logic Expression Language - a consistent way to express domain concepts in code. When you use the same patterns everywhere, business logic becomes immediately apparent in all necessary details. The structure itself tells the story: a Sequencer shows process steps, Fork-Join reveals parallel operations, `Result<Option<T>>` declares "optional but must be valid when present." Anyone who somewhat understands the domain can pick up a new codebase virtually instantly. No more narrow specializations where only one developer understands "their" module. A large part of the code becomes universally readable. Fresh onboarding happens in days, not months - developers spend time learning the domain, not deciphering structural choices.

**Tooling and automation** become dramatically simpler when the structure is predictable. Code generators don't need to infer patterns - there's one pattern for validation, one for composition, one for error handling. Static analysis can verify properties mechanically: does this function return exactly one of the four allowed types? Does validation happen before construction? Are errors properly typed? AI assistants can generate more accurate code because the target structure is well-defined and consistent.

**Deterministic code generation** becomes possible when the mapping from requirements to code is mechanical. Given a use case specification - inputs, outputs, validation rules, steps - there's essentially one correct structure. Different developers (or AI assistants) should produce nearly identical implementations. This isn't about stifling creativity; it's about channeling creativity into business logic rather than structural decisions.

This guide presents the complete technology: the rules, the patterns, the rationale, and the practices. It's framework-agnostic by design - these principles work whether you're building REST APIs with Spring, message processors with plain Java, or anything in between. The framework lives at the edges; the business logic remains pure, testable, and independent.

We'll start with core concepts - the building blocks that make everything else possible. Then we'll explore the pattern catalog that covers almost every situation you'll encounter. A detailed use case walkthrough shows how the pieces fit together. Framework integration demonstrates how to bridge this functional core to the imperative world of web frameworks and databases. Finally, we'll examine common mistakes and how to avoid them.

The goal isn't to give you more tools. It's to give you fewer decisions to make, so you can focus on the problems that actually matter.

---

## Why This Technology Works: The Evaluation Framework

Every rule and pattern in this technology is evaluated against five objective criteria. These replace subjective "readability" arguments with measurable comparisons:

1. **Mental Overhead** - "Don't forget to..." and "Keep in mind..." items you must track. This appears as things developers must remember because the compiler can't catch them. Lower is better.

2. **Business/Technical Ratio** - Balance between domain concepts and framework/infrastructure noise. Higher domain visibility with less technical boilerplate is better.

3. **Design Impact** - Whether an approach improves design consistency or breaks it. Does it enforce good patterns or allow bad ones?

4. **Reliability** - Does the compiler catch mistakes, or must you remember? Type safety that makes invalid states unrepresentable eliminates entire classes of bugs.

5. **Complexity** - Number of elements, connections, and especially hidden coupling. Fewer moving parts and explicit dependencies are better.

These criteria aren't preferences - they're measurable attributes. When we say "don't use business exceptions," we can prove why:
- **Mental Overhead**: Checked exceptions force signature pollution; unchecked are invisible (+2 for Result-based)
- **Reliability**: Exception paths are hidden from type checker; Result makes them explicit (+1 for Result-based)
- **Complexity**: Exception hierarchies create cross-package coupling (+1 for Result-based)

Similarly, "parse don't validate":
- **Mental Overhead**: No "remember to validate" - invalid states are unrepresentable (+1)
- **Reliability**: Compiler enforces validity through types, not runtime checks (+1)
- **Design Impact**: Business invariants encoded in type system, not scattered (+1)

Throughout this guide, major rules reference these criteria. The goal: replace endless "best practices" with five measurable standards.

---

## Core Concepts

> **Note:** This section uses **Pragmatica Lite Core** library as an underlying functional style library.
> The library is available on Maven Central: https://central.sonatype.com/artifact/org.pragmatica-lite/core
> 
> ```xml
> <dependency>
>    <groupId>org.pragmatica-lite</groupId>
>    <artifactId>core</artifactId>
>    <version>0.8.0</version>
> </dependency>
> ```

### The Four Return Kinds

Every function in this technology returns exactly one of four types. Not "usually" or "preferably" - exactly one, always. This isn't arbitrary restriction; it's intentional compression of complexity into type signatures.

**Why by criteria:**
- **Mental Overhead**: Hidden error channels (exceptions), hidden optionality (null), hidden asynchrony (blocking I/O) all force developers to remember behavior not expressed in signatures. Explicit return types eliminate this (+3).
- **Reliability**: Compiler verifies error handling, null safety, and async boundaries when encoded in types (+3).
- **Complexity**: Four types cover all scenarios - no guessing about combinations or special cases (+2).

**`T`**  - Synchronous, cannot fail, value always present.

Use this when the operation is pure computation with no possibility of failure or missing data. Mathematical calculations, transformations of valid data, simple getters. If you can't think of a way this function could fail or return nothing, it returns `T`.

```java
public record FullName(String value) {
    public String initials() {  // returns String (T)
        return value.chars()
            .filter(Character::isUpperCase)
            .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
            .toString();
    }
}
```

**`Option<T>`**  - Synchronous, cannot fail, value may be missing.

Use this when absence is a valid outcome, but failure isn't possible. Lookups that might not find anything, optional configuration, nullable database columns when null is semantically meaningful (not just "we don't know"). The key: missing data is normal business behavior, not an error.

```java
// Finding an optional user preference
public interface PreferenceRepository {
    Option<Theme> findThemePreference(UserId id);  // might not be set
}
```

**`Result<T>`**  - Synchronous, can fail, represents business or validation errors.

Use this when an operation might fail for business or validation reasons. Parsing input, enforcing invariants, business rules that can be violated. Failures are represented as typed `Cause` objects, not exceptions. Every failure path is explicit in the return type.

```java
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forValue("Invalid email format: {}");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .map(String::trim)
            .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, EMAIL_PATTERN))
            .map(Email::new);
    }
}
```

**`Promise<T>`**  - Asynchronous, can fail, represents eventual success or failure.

Use this for any I/O operation, external service call, or computation that might block. `Promise<T>` is semantically equivalent to `Result<T>` but asynchronous - failures are carried in the Promise itself, not nested inside it. This is Java's answer to Rust's `Future<Result<T>>` without the nesting problem.

```java
public interface AccountRepository {
    Promise<Account> findById(AccountId id);  // async lookup, can fail
}
```

**Why exactly four?**

These four types form a complete basis for composition. You can lift "up" when needed (`Option` to `Result` to `Promise`), but you never nest the same concern twice (`Promise<Result<T>>` is forbidden). Each type represents one orthogonal concern:
- Synchronous vs. asynchronous (now vs. later)
- Can fail vs cannot fail (error channel present or absent)
- Value vs optional value (presence guaranteed or not)

Traditional Java mixes these concerns. A method returning `User` might throw exceptions (hidden error channel), return null (hidden optionality), or block on I/O (hidden asynchrony). You can't tell from the signature. With these four types, the signature tells you everything about the function's behavior before you read a line of implementation.

This clarity is what makes AI-assisted development tractable. When generating code, an AI doesn't need to infer whether error handling is needed - the return type declares it. When reading code, a human doesn't need to trace execution paths to find hidden failure modes - they're in the type signature.

### Parse, Don't Validate

Most Java code validates data after construction. You create an object with raw values, then call a `validate()` method that might throw exceptions or return error lists. This is backwards.

**The principle:** Make invalid states unrepresentable. If construction succeeds, the object is valid by definition. Validation is parsing - converting untyped or weakly-typed input into strongly typed domain objects that enforce invariants at the type level.

**Why by criteria:**
- **Mental Overhead**: No "remember to validate" - type system guarantees validity (+2).
- **Reliability**: Compiler enforces that invalid objects cannot be constructed (+3).
- **Design Impact**: Business invariants concentrated in factories, not scattered across codebase (+2).
- **Complexity**: Single validation point per type eliminates redundant checks (+1).

Traditional validation:
```java
// DON'T: Validation separated from construction
public class Email {
    private final String value;

    public Email(String value) {
        this.value = value;  // accepts anything
    }

    public boolean isValid() {  // The caller must remember to check
        return value != null && value.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    }
}

// Client code must validate manually:
Email email = new Email(input);
if (!email.isValid()) {
    throw new ValidationException("Invalid email");
}
```

Problems: You can construct invalid `Email` objects. Validation is a separate step that callers might forget. The `isValid()` method returns a boolean, discarding information about what's wrong. You can't distinguish "null" from "malformed" from "too long" without checking conditions individually.

Parse-don't-validate approach:
```java
// DO: Validation IS construction
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forValue("Invalid email format: {}");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .map(String::trim)
            .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, EMAIL_PATTERN))
            .map(Email::new);
    }
}

// Client code gets the Result:
Result<Email> result = Email.email(input);
// If this is a Success, the Email is valid. Guaranteed.
```

The constructor is private (or package-private). The only way to get an `Email` is through the static factory `email()`, which returns `Result<Email>`. If you have an `Email` instance, it's valid - no separate check needed. The type system enforces this.

**Note:** As of current Java versions, records do not support declaring the canonical constructor as private. This limitation means the constructor remains accessible within the same package. Future Java versions may address this. Until then, rely on team discipline and code review to ensure value objects are only constructed through their factory methods. The good news: violations are highly visible in code - since all components are normally constructed via factory methods, any direct `new Email(...)` call stands out immediately. This makes the issue easy to catch using automated static analysis checks or by instructing AI code review tools to flag direct constructor usage for value objects.

**Naming convention:** Factories are always named after their type, lowercase-first (camelCase). This creates a natural, readable call site: `Email.email(...)`, `Password.password(...)`, `AccountId.accountId(...)`. It's slightly redundant but unambiguous and grep-friendly. The intentional redundancy enables conflict-free static imports - `import static Email.email` allows you to write `email(raw)` at call sites while preserving context, since the factory name itself indicates what's being created. (See [Naming Conventions](#naming-conventions) for complete naming guidelines.)

**Optional fields with validation:**

What if a field is optional but must be valid when present? For example, a referral code that's not required but must match a pattern if provided.

Use `Result<Option<T>>` - validation can fail (Result), and if it succeeds, the value might be absent (Option).

```java
public record ReferralCode(String value) {
    private static final String PATTERN = "^[A-Z0-9]{6}$";

    public static Result<Option<ReferralCode>> referralCode(String raw) {
        return isAbsent(raw)
            ? Result.success(Option.none())
            : validatePresent(raw);
    }

    private static boolean isAbsent(String raw) {
        return raw == null || raw.isEmpty();
    }

    private static Result<Option<ReferralCode>> validatePresent(String raw) {
        return Verify.ensure(raw.trim(), Verify.Is::matches, PATTERN)
                     .map(ReferralCode::new)
                     .map(Option::some);
    }
}
```

If `raw` is null or empty, we succeed with `Option.none()`. If it's present, we validate and wrap in `Option.some()`. If validation fails, the `Result` itself is a failure. Callers get clear semantics: failure means invalid input, success with `none()` means no value provided, success with `some()` means valid value.

**Normalization:** Factories can normalize input (trim whitespace, lowercase email domains, etc.) as part of parsing. This keeps invariants in one place and ensures all instances are normalized consistently.

**Why this matters for AI:** When an AI generates a value object, the structure is mechanical: private constructor, static factory named after type, `Result<T>` or `Result<Option<T>>` return type, validation via `Verify` combinators. No guessing about where validation happens or how errors are reported.

### No Business Exceptions

Business failures are not exceptional - they're expected outcomes of business rules. An invalid email isn't an exception; it's a normal case of bad input. An account being locked isn't an exception; it's a business state.

**The rule:** Business logic never throws exceptions for business failures. All failures flow through `Result` or `Promise` as typed `Cause` objects.

**Why by criteria:**
- **Mental Overhead**: Checked exceptions pollute signatures (+1 for Result). Unchecked exceptions are invisible - must read implementation (+2 for Result).
- **Business/Technical Ratio**: Exception stack traces are technical noise; typed Causes are domain concepts (+2 for Result).
- **Reliability**: Exceptions bypass type checker; Result makes all failures explicit and compiler-verified (+3 for Result).
- **Complexity**: Exception hierarchies create cross-package coupling (+1 for Result).

Traditional exception-based code:
```java
// DON'T: Exceptions for business logic
public User loginUser(String email, String password) throws
        InvalidEmailException,
        InvalidPasswordException,
        AccountLockedException,
        CredentialMismatchException {

    if (!isValidEmail(email)) {
        throw new InvalidEmailException(email);
    }
    
    if (!isValidPassword(password)) {
        throw new InvalidPasswordException();
    }

    User user = userRepo.findByEmail(email)
        .orElseThrow(() -> new CredentialMismatchException());

    if (user.isLocked()) {
        throw new AccountLockedException(user.getId());
    }
    
    if (!passwordMatches(user, password)) {
        throw new CredentialMismatchException();
    }

    return user;
}
```

Problems: Checked exceptions pollute signatures and force callers to handle or rethrow. Unchecked exceptions are invisible in signatures - you can't tell what might fail without reading implementation. Exception hierarchies create coupling. Stack traces are expensive and often irrelevant for business failures. Testing requires catching exceptions and inspecting types.

Result-based code:
```java
// DO: Failures as typed values
public Result<User> loginUser(String emailRaw, String passwordRaw) {
    return Result.all(Email.email(emailRaw),
                      Password.password(passwordRaw))
                 .flatMap(this::validateAndCheckStatus);
}

private Result<User> validateAndCheckStatus(Email email, Password password) {
    return checkCredentials(email, password)
                 .flatMap(this::checkAccountStatus);
}

private Result<User> checkCredentials(Email email, Password password) {
    return userRepo.findByEmail(email)
                   .flatMap(user -> validatePassword(user, password));
}

private Result<User> validatePassword(User user, Password password) {
    return passwordMatches(user, password)
        ? Result.success(user)
        : LoginError.InvalidCredentials.INSTANCE.result();
}

private Result<User> checkAccountStatus(User user) {
    return user.isLocked()
        ? new LoginError.AccountLocked(user.id()).result()
        : Result.success(user);
}
```

Every failure is a `Cause`. The `LoginError` is a sealed interface defining the failure modes:

```java
public sealed interface LoginError extends Cause {
    record AccountLocked(UserId userId) implements LoginError {
        @Override
        public String message() {
            return "Account is locked: " + userId;
        }
    }

    enum InvalidCredentials implements LoginError {
        INSTANCE;

        @Override
        public String message() {
            return "Invalid email or password";
        }
    }
}
```

Failures compose: `Result.all(Email.email(...), Password.password(...))` collects validation failures into a `CompositeCause` automatically. If both email and password are invalid, the caller gets both errors, not just the first one encountered.

**Adapter exceptions:** Foreign code (libraries, frameworks, databases) throws exceptions. Adapter leaves catch these and convert them to `Cause` objects.

The Pragmatica library provides `lift()` methods for each monad type to handle exception-to-Cause conversion:

```java
public interface UserRepository {
    Promise<Option<User>> findByEmail(Email email);
}

// Implementation (adapter leaf)
class JpaUserRepository implements UserRepository {
    public Promise<Option<User>> findByEmail(Email email) {
        return Promise.lift(
            RepositoryError::fromDatabaseException,
            () -> entityManager.createQuery("SELECT u FROM User u WHERE u.email = :email", UserEntity.class)
                               .setParameter("email", email.value())
                               .getResultList()
                               .stream()
                               .findFirst()
                               .map(this::toDomain)
                               .orElse(Option.none())
        );
    }
}
```

The `lift()` methods handle try-catch boilerplate and exception-to-Cause conversion automatically or via provided exception-to-cause mapping function. Each monad type provides its own `lift()` method: `Option.lift()`, `Result.lift()`, and `Promise.lift()`. The adapter wraps checked `PersistenceException` in a domain `Cause` (`RepositoryError.DatabaseFailure`). Business logic never sees `PersistenceException` - only domain errors.

**Why this matters:** Errors are just data. You compose them with `map`, `flatMap`, and `all()` like any other value. Testing is easy - assert on `Cause` types without catching exceptions. AI can generate error handling mechanically because the pattern is always the same: `SomeCause.INSTANCE.result()` or `SomeCause.INSTANCE.promise()`.

### Single Pattern Per Function

Every function implements exactly one pattern from a fixed catalog: Leaf, Sequencer, Fork-Join, Condition, or Iteration. (Aspects are the exception - they decorate other patterns.)

**Why?** Cognitive load. When reading a function, you should recognize its shape immediately. If it's a Sequencer, you know it chains dependent steps linearly. If it's Fork-Join, you know it runs independent operations and combines results. Mixing patterns within a function creates mixed abstraction levels and forces readers to hold multiple mental models simultaneously.

This rule has a mechanical benefit: it makes refactoring deterministic. When a function grows beyond one pattern, you extract the second pattern into its own function. There's no subjective judgment about "is this too complex?" - if you're doing two patterns, split it.

**Why by criteria:**
- **Mental Overhead**: One pattern per function means immediate recognition - no mental model switching (+2).
- **Complexity**: Mechanical refactoring rule eliminates subjective debates about "too complex" (+2).
- **Design Impact**: Forces proper abstraction layers - no mixing orchestration with computation (+2).

### Single Level of Abstraction

**The rule:** No complex logic inside lambdas. Lambdas passed to `map`, `flatMap`, and similar combinators may contain only:
- Method references (e.g., `Email::new`, `this::processUser`)
- Single method calls with parameter forwarding (e.g., `param -> someMethod(outerParam, param)`)

**Why?** Lambdas are composition points, not implementation locations. When you bury logic inside a lambda, you hide abstraction levels and make the code harder to read, test, and reuse. Extract complex logic to named functions - the name documents intent, the function becomes testable in isolation, and the composition chain stays flat and readable.

**Why by criteria:**
- **Mental Overhead**: Flat composition chains scan linearly - no descending into nested logic (+2).
- **Business/Technical Ratio**: Named functions document intent; anonymous lambdas hide it (+2).
- **Complexity**: Each function testable in isolation; buried lambda logic requires testing through container (+2).

**Anti-pattern:**
```java
// DON'T: Complex logic inside lambda
return fetchUser(userId)
    .flatMap(user -> {
        if (user.isActive() && user.hasPermission("admin")) {
            return loadAdminDashboard(user)
                .map(dashboard -> {
                    var summary = new Summary(
                        dashboard.metrics(),
                        dashboard.alerts().stream()
                            .filter(Alert::isUrgent)
                            .toList()
                    );
                    return new Response(user, summary);
                });
        } else {
            return AccessError.InsufficientPermissions.INSTANCE.promise();
        }
    });
```

This lambda contains: conditional logic, nested map, stream processing, object construction. Mixed abstraction levels. Hard to test. Hard to read.

**Correct approach:**
```java
// DO: Extract to named functions
return fetchUser(userId)
    .flatMap(this::checkAdminAccess)
    .flatMap(this::loadAdminDashboard)
    .map(this::buildResponse);

private Promise<User> checkAdminAccess(User user) {
    return user.isActive() && user.hasPermission("admin")
        ? Promise.success(user)
        : AccessError.InsufficientPermissions.INSTANCE.promise();
}

private Promise<Dashboard> loadAdminDashboard(User user) {
    return dashboardService.loadDashboard(user);
}

private Response buildResponse(Dashboard dashboard) {
    var urgentAlerts = filterUrgentAlerts(dashboard.alerts());
    var summary = new Summary(dashboard.metrics(), urgentAlerts);
    return new Response(dashboard.user(), summary);
}

private List<Alert> filterUrgentAlerts(List<Alert> alerts) {
    return alerts.stream()
        .filter(Alert::isUrgent)
        .toList();
}
```

Now the top-level chain reads linearly: fetch → check access → load dashboard → build response. Each step is named, testable, and at a single abstraction level.

**Allowed simple lambdas:**

Method reference:
```java
// DO: Method reference
.map(Email::new)
.flatMap(this::saveUser)
.map(User::id)
```

Single method call with parameter forwarding:
```java
// DO: Simple parameter forwarding
.flatMap(user -> checkPermissions(requiredRole, user))
.map(order -> calculateTotal(taxRate, order))
```

**Forbidden in lambdas:**

No ternaries (they are the Condition pattern, violates Single Pattern per Function):
```java
// DON'T: Ternary in lambda (violates Single Pattern per Function)
.flatMap(user -> user.isPremium()
    ? applyPremiumDiscount(user)
    : applyStandardDiscount(user))

// DO: Extract to the named function
.flatMap(this::applyApplicableDiscount)

private Result<Discount> applyApplicableDiscount(User user) {
    return user.isPremium()
        ? applyPremiumDiscount(user)
        : applyStandardDiscount(user);
}
```

No conditionals whatsoever:
```java
// DON'T: Any conditional logic in lambda
.flatMap(user -> {
    if (user.isPremium()) {
        return applyPremiumDiscount(user);
    } else {
        return applyStandardDiscount(user);
    }
})

// DO: Extract to the named function
.flatMap(this::applyApplicableDiscount)
```

**Why this matters for AI:** Single level of abstraction makes code generation deterministic. When an AI sees a `flatMap`, it knows to generate either a method reference or a simple parameter-forwarding lambda - nothing else. No decisions about "is this ternary simple enough?" When reading code, the AI can parse the top-level structure without descending into nested lambda logic. Humans benefit identically: scan the chain to understand flow, dive into named functions only when needed.

**Example violation:**
```java
// DON'T: Mixing Sequencer and Fork-Join
public Result<Report> generateReport(ReportRequest request) {
    return ValidRequest.validate(request)
        .flatMap(valid -> {
            // Sequencer starts here
            var userData = fetchUserData(valid.userId());
            var salesData = fetchSalesData(valid.dateRange());

            // Wait, now we're doing Fork-Join?
            return Result.all(userData, salesData)
                .flatMap((user, sales) -> computeMetrics(user, sales))
                .flatMap(this::formatReport);  // Back to Sequencer
        });
}
```

This function starts as a Sequencer (validate → fetch user → fetch sales → compute → format), but `fetchUserData` and `fetchSalesData` are independent, so we suddenly do a Fork-Join in the middle. Mixed abstraction levels. Hard to test. Unclear at a glance what the function does.

**Corrected:**
```java
// DO: One pattern per function
public Result<Report> generateReport(ReportRequest request) {
    return ValidRequest.validate(request)
        .flatMap(this::fetchReportData)
        .flatMap(this::computeMetrics)
        .flatMap(this::formatReport);
}

private Result<ReportData> fetchReportData(ValidRequest request) {
    // This function is a Fork-Join
    return Result.all(fetchUserData(request.userId()),
                      fetchSalesData(request.dateRange()))
                 .map(ReportData::new);
}
```

Now `generateReport` is a pure Sequencer (validate → fetch → compute → format), and `fetchReportData` is a pure Fork-Join. Each function has one clear job.

**Mechanical refactoring:** If you're writing a Sequencer and realize step 3 needs to do a Fork-Join internally, extract step 3 into its own function that implements Fork-Join. The original Sequencer stays clean.

### Monadic Composition Rules

The four return kinds compose via `map`, `flatMap`, `filter`, and aggregation combinators (`all`, `any`). Understanding when to lift and how to avoid nesting is essential.

**Lifting:** You can lift a "lower" type into a "higher" one at call sites:
- `T` → `Option<T>` (via `Option.option(value)`)
- `T` → `Result<T>` (via `Result.success(value)`)
- `T` → `Promise<T>` (via `Promise.success(value)`)
- `Option<T>` → `Result<T>` (via `option.toResult(cause)` or `option.await(cause)`)
- `Option<T>` → `Promise<T>` (via `option.async(cause)` or `option.async()`)
- `Result<T>` → `Promise<T>` (via `result.async()`)

You lift when composing functions that return different types:

```java
// Sync validation (Result) lifted into async flow (Promise)
public Promise<Response> execute(Request request) {
    return ValidRequest.validate(request)
                       .async()  // Result has dedicated async() method to convert to Promise
                       .flatMap(step1::apply)  // step1 returns Promise
                       .flatMap(step2::apply); // step2 returns Promise
}
```

**Forbidden nesting:** `Promise<Result<T>>` is not allowed. `Promise<T>` already carries failures - nesting `Result` inside creates two error channels and forces callers to unwrap twice. If a function is async and can fail, it returns `Promise<T>`, period.

Wrong:
```java
// DON'T: Nested error channels
Promise<Result<User>> loadUser(UserId id) { /* ... */ }

// Caller must unwrap twice:
loadUser(id)
    .flatMap(resultUser -> resultUser.match(
        user -> Promise.success(user),
        Cause::promise
    ));  // Absurd ceremony
```

Right:
```java
// DO: One error channel
Promise<User> loadUser(UserId id) { /* ... */ }

// Caller just chains:
return loadUser(id).flatMap(nextStep);
```

**Allowed nesting:** `Result<Option<T>>` is permitted sparingly for "optional value that can fail validation." This represents: "If present, must be valid. If absent, that's fine." Example: optional referral code that must match a pattern when provided.

```java
Result<Option<ReferralCode>> refCode = ReferralCode.referralCode(input);
// Success(None) = not provided, valid
// Success(Some(code)) = provided and valid
// Failure(cause) = provided but invalid
```

Avoid `Option<Result<T>>` - it means "maybe there's a result, and that result might have failed," which is backwards. Just use `Result<Option<T>>`.

**Aggregation:** Use `Result.all(...)` or `Promise.all(...)` to combine multiple independent operations:

```java
// Validation: collect multiple field validations
Result<ValidRequest> validated = Result.all(Email.email(raw.email()),
                                             Password.password(raw.password()),
                                             ReferralCode.referralCode(raw.referralCode()))
                                       .flatMap(ValidRequest::new);

// Async: run independent queries in parallel
Promise<Report> report = Promise.all(userRepo.findById(userId),
                                     orderRepo.findByUser(userId),
                                     inventoryService.getAvailableItems())
                                .flatMap(this::generateReport);
```

If any input fails, `all()` fails immediately (fail-fast for Promise) or collects failures (CompositeCause for Result).

**Why these rules?** They prevent complexity explosion. With exactly four return types and clear composition rules, you can always tell how to combine two functions by looking at their signatures. AI code generation becomes mechanical - given input and output types, there's one obvious way to compose.

---

## Patterns Reference

### Leaf

**Definition:** A Leaf is the smallest unit of processing - a function that does one thing and has no internal steps. It's either a business leaf (pure computation) or an adapter leaf (I/O or side effects).

**Rationale (by criteria):**
- **Mental Overhead**: Atomic operations have no internal steps to track - immediate comprehension (+2).
- **Business/Technical Ratio**: Business leaves are pure domain logic; adapter leaves isolate technical concerns (+2).
- **Complexity**: Single responsibility per leaf - no hidden interactions (+2).
- **Reliability**: Pure business leaves are deterministic and easily testable (+1).

**Business leaves** are pure functions that transform data or enforce business rules. Common examples:

```java
// Simple calculation leaf
public static Price calculateDiscount(Price original, Percentage rate) {
    return original.multiply(rate);
}

// Domain rule enforcement leaf
public static Result<Unit> checkInventory(Product product, Quantity requested) {
    return product.availableQuantity().isGreaterThanOrEqual(requested)
        ? Result.unitResult()
        : InsufficientInventory.cause(product.id(), requested);
}

// Data transformation leaf
public static OrderSummary toSummary(Order order) {
    return new OrderSummary(
        order.id(),
        order.totalAmount(),
        order.items().size()
    );
}
```

If there's no I/O and no side effects, it's a business leaf. Keep each leaf focused on one transformation or one business rule.

**Adapter leaves** integrate with external systems: databases, HTTP clients, message queues, file systems. They map foreign errors to domain Causes:

```java
public interface UserRepository {
    Promise<Option<User>> findByEmail(Email email);
}

// Adapter leaf implementation
class PostgresUserRepository implements UserRepository {
    private final DataSource dataSource;

    public Promise<Option<User>> findByEmail(Email email) {
        return Promise.lift(
            e -> RepositoryError.DatabaseFailure.cause(e),
            () -> {
                try (var conn = dataSource.getConnection();
                     var stmt = conn.prepareStatement("SELECT * FROM users WHERE email = ?")) {

                    stmt.setString(1, email.value());
                    var rs = stmt.executeQuery();

                    return rs.next() ? mapUser(rs) : null;
                }
            }
        ).map(Option::option);
    }

    private User mapUser(ResultSet rs) throws SQLException {
        // Mapping logic; SQLException handled by Promise.lift()
        return new User(/* ... */);
    }
}
```

The adapter catches `SQLException` and wraps it in `RepositoryError.DatabaseFailure`, a domain `Cause`. Callers never see `SQLException`.

**Placement:** If a leaf is only used by one caller, keep it nearby (same file, same package). If it's reused, move it immediately to the nearest `shared` package. Don't defer - tech debt accumulates when shared code stays in wrong locations.

**Anti-patterns:**

DON'T mix abstraction levels in a leaf:
```java
// DON'T: This "leaf" is actually doing multiple steps
public static Result<Email> email(String raw) {
    var normalized = raw.trim().toLowerCase();
    if (!isValid(normalized)) {
        logValidationFailure(normalized);  // Side effect!
        return EmailError.INVALID.result();
    }
    return Result.success(new Email(normalized));
}
```

This leaf has a side effect (logging) mixed with validation logic. Extract logging to an Aspect decorator if needed.

DON'T let adapter leaves leak foreign types:
```java
// DON'T: SQLException leaks into business logic
Promise<Option<User>> findByEmail(Email email) throws SQLException {
    // Business logic should never see SQLException
}
```

Wrap all foreign exceptions in domain Causes within the adapter.

**Framework independence:** Adapter leaves form the bridge between business logic and framework-specific code. This isolation is critical for maintaining framework-agnostic business logic. Strongly prefer adapter leaves for all I/O operations (database access, HTTP calls, file system operations, message queues). This ensures you can swap frameworks (Spring → Micronaut, JDBC → JOOQ) without touching business logic - only rewrite the adapters.

However, dependencies on specific libraries for business functionality (encryption libraries, complex mathematical computations, specialized algorithms) are acceptable within business logic when they're essential to the domain. The key distinction: I/O adapters isolate infrastructure choices; domain libraries implement business requirements.

DO keep leaves focused:
```java
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forValue("Invalid email");

    // DO: One clear responsibility
    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .map(String::trim)
            .map(String::toLowerCase)
            .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, EMAIL_PATTERN))
            .map(Email::new);
    }
}
```

Linear flow, clear responsibility, no side effects, foreign errors properly wrapped.

### Sequencer

**Definition:** A Sequencer chains dependent steps linearly using `map` and `flatMap`. Each step's output feeds the next step's input. This is the primary pattern for use case implementation.

**Rationale (by criteria):**
- **Mental Overhead**: Linear flow, 2-5 steps fits short-term memory capacity - predictable structure (+3).
- **Business/Technical Ratio**: Steps mirror business process language - reads like requirements (+3).
- **Complexity**: Fail-fast semantics, each step isolated and testable (+2).
- **Design Impact**: Forces proper step decomposition, prevents monolithic functions (+2).

**The 2-5 rule:** A Sequencer should have 2 to 5 steps. Fewer than 2, and it's probably just a Leaf. More than 5, and it needs decomposition - extract sub-sequencers or group steps.

> The rule is intended to limit local complexity. It is derived from the average size of short-term memory - 7 +- 2 elements.

**Domain requirements take precedence:** Some functions inherently require more steps because the domain demands it. Value object factories may need multiple validation and normalization steps to ensure invariants - this is correct because the validation logic must be concentrated in one place. Fork-Join patterns may need to aggregate 6+ independent results because that's what the domain requires. Don't artificially fit domain logic into numeric rules. The 2-5 guideline helps you recognize when to consider refactoring, but domain semantics always win. 

Sync example:
```java
public interface ProcessOrder {
    record Request(String orderId, String paymentToken) {}
    record Response(OrderConfirmation confirmation) {}

    Result<Response> execute(Request request);

    interface ValidateInput { 
        Result<ValidRequest> apply(Request raw); 
    }
    interface ReserveInventory { 
        Result<Reservation> apply(ValidRequest req); 
    }
    interface ProcessPayment { 
        Result<Payment> apply(Reservation reservation); 
    }
    interface ConfirmOrder { 
        Result<Response> apply(Payment payment); 
    }

    static ProcessOrder processOrder(
        ValidateInput validate,
        ReserveInventory reserve,
        ProcessPayment processPayment,
        ConfirmOrder confirm
    ) {
        record processOrder(
            ValidateInput validate,
            ReserveInventory reserve,
            ProcessPayment processPayment,
            ConfirmOrder confirm
        ) implements ProcessOrder {
            public Result<Response> execute(Request request) {
                return validate.apply(request)        // Step 1
                    .flatMap(reserve::apply)          // Step 2
                    .flatMap(processPayment::apply)   // Step 3
                    .flatMap(confirm::apply);         // Step 4
            }
        }
        return new processOrder(validate, reserve, processPayment, confirm);
    }
}
```

Four steps, each a single-method interface. The `execute()` body reads top-to-bottom: validate → reserve → process payment → confirm. Each step returns `Result<T>`, so we chain with `flatMap`. If any step fails, the chain short-circuits and returns the failure.

Async example (same structure, different types):
```java
public Promise<Response> execute(Request request) {
    return ValidateInput.validate(request)  // returns Result<ValidInput>
        .async()                            // lift to Promise<ValidInput>
        .flatMap(reserve::apply)            // returns Promise<Reservation>
        .flatMap(processPayment::apply)     // returns Promise<Payment>
        .flatMap(confirm::apply);           // returns Promise<Response>
}
```

Validation is synchronous (returns `Result`), so we lift it to `Promise` using `.async()`. The rest of the chain is async.

**When to extract sub-sequencers:**

If a step grows complex internally, extract it to its own interface with a nested structure. Suppose `processPayment` actually needs to: authorize card → capture funds → record transaction. That's three dependent steps - a Sequencer. Extract:

```java
// Original step interface
interface ProcessPayment {
    Promise<Payment> apply(Reservation reservation);
}

// Implementation delegates to a sub-sequencer
class CreditCardPaymentProcessor implements ProcessPayment {
    private final AuthorizeCard authorizeCard;
    private final CaptureFunds captureFunds;
    private final RecordTransaction recordTransaction;

    public Promise<Payment> apply(Reservation reservation) {
        return authorizeCard.apply(reservation)
            .flatMap(captureFunds::apply)
            .flatMap(recordTransaction::apply);
    }
}
```

Now `CreditCardPaymentProcessor` is itself a Sequencer with three steps. The top-level use case remains a clean 4-step chain.

**Anti-patterns:**

DON'T nest logic inside flatMap (violates Single Level of Abstraction):
```java
// DON'T: Business logic buried in lambda
return validate.apply(request)
    .flatMap(valid -> {
        if (valid.isPremiumUser()) {
            return applyDiscount(valid)
                .flatMap(reserve::apply);
        } else {
            return reserve.apply(valid);
        }
    })
    .flatMap(processPayment::apply);
```

The conditional logic is hidden inside the lambda. Extract it:

```java
// DO: Extract to the named function (Single Level of Abstraction)
return validate.apply(request)
    .flatMap(this::applyDiscountIfEligible)
    .flatMap(reserve::apply)
    .flatMap(processPayment::apply);

private Result<ValidRequest> applyDiscountIfEligible(ValidRequest request) {
    return request.isPremiumUser()
        ? applyDiscount(request)
        : Result.success(request);
}
```

DON'T mix Fork-Join inside a Sequencer without extraction:
```java
// DON'T: Suddenly doing Fork-Join mid-sequence (violates Single Pattern + SLA)
return validate.apply(request)
    .flatMap(valid -> {
        var userPromise = fetchUser(valid.userId());
        var productPromise = fetchProduct(valid.productId());
        return Promise.all(userPromise, productPromise)
            .flatMap((user, product) -> reserve.apply(user, product));
    })
    .flatMap(processPayment::apply);
```

Extract the Fork-Join:

```java
// DO: Extract Fork-Join to its own step
return validate.apply(request)
    .flatMap(this::fetchUserAndProduct)  // Fork-Join inside this step
    .flatMap(reserve::apply)
    .flatMap(processPayment::apply);

private Promise<ReservationInput> fetchUserAndProduct(ValidRequest request) {
    return Promise.all(fetchUser(request.userId()),
                       fetchProduct(request.productId()))
                  .map(ReservationInput::new);
}
```

DO keep the sequence flat and readable:
```java
// DO: Linear, one step per line
return validate.apply(request)
    .flatMap(step1::apply)
    .flatMap(step2::apply)
    .flatMap(step3::apply)
    .flatMap(step4::apply);
```

### Fork-Join

**Definition:** Fork-Join (also known as Fan-Out-Fan-In) executes independent operations concurrently and combines their results. Use it when you have parallel work with no dependencies between branches.

**Rationale (by criteria):**
- **Mental Overhead**: Parallel execution explicit in structure - no hidden concurrency (+2).
- **Complexity**: Independence constraint acts as design validator - forces proper data organization (+3).
- **Reliability**: Type system prevents dependent operations from being parallelized (+2).
- **Design Impact**: Reveals coupling issues - dependencies surface as compile errors (+3).

**Two flavors:**

1. **Result.all(...)**  -  Synchronous aggregation (not concurrent, just collects multiple Results):
```java
// Validating multiple independent fields
Result<ValidRequest> validated = Result.all(Email.email(raw.email()),
                                             Password.password(raw.password()),
                                             AccountId.accountId(raw.accountId()))
                                        .flatMap((email, password, accountId) ->
                                            ValidRequest.create(email, password, accountId)
                                        );
```

If all succeed, you get a tuple of values to pass to the combiner. If any fail, you get a `CompositeCause` containing all failures (not just the first).

2. **Promise.all(...)**  -  Parallel async execution:
```java
// Running independent I/O operations in parallel
Promise<Dashboard> buildDashboard(UserId userId) {
    return Promise.all(userService.fetchProfile(userId),
                       orderService.fetchRecentOrders(userId),
                       notificationService.fetchUnread(userId))
                  .map(this::createDashboard);
}

private Dashboard createDashboard(Profile profile,
                                   List<Order> orders,
                                   List<Notification> notifications) {
    return new Dashboard(profile, orders, notifications);
}
```

All three fetches run concurrently. The Promise completes when all inputs complete successfully or fails immediately if any input fails.

**Special Fork-Join cases:**

Beyond the standard `Result.all()` and `Promise.all()`, there are specialized fork-join methods for specific aggregation needs. The parallel execution pattern remains the same, but the outcome differs:

1. **Promise.allOf(Collection<Promise<T>>)** - Parallel execution with the resilient collection:
```java
// Fetching data from the dynamic number of sources, collecting all outcomes
Promise<Report> generateSystemReport(List<ServiceId> services) {
    var healthChecks = services.stream()
                               .map(healthCheckService::check)
                               .toList();

    return Promise.allOf(healthChecks)
                  .map(this::createReport);
}

private Report createReport(List<Result<HealthStatus>> results) {
    var successes = results.stream()
                           .filter(Result::isSuccess)
                           .map(Result::value)
                           .toList();
    var failures = results.stream()
                          .filter(Result::isFailure)
                          .map(Result::cause)
                          .toList();
    return new Report(successes, failures);
}
```

Returns `Promise<List<Result<T>>>`  -  unlike `Promise.all()` which fails fast, `allOf()` waits for all promises to complete and collects both successes and failures. Use when you need comprehensive results even if some operations fail (monitoring, reporting, batch processing).

2. **Promise.any(Promise<T>...)** - Parallel execution with first-success wins:
```java
// Racing multiple data sources, using the first successful response
Promise<ExchangeRate> fetchRate(Currency from, Currency to) {
    return Promise.any(
        primaryRateProvider.getRate(from, to),
        secondaryRateProvider.getRate(from, to),
        fallbackRateProvider.getRate(from, to)
    );
}
```

Returns the first successfully completed Promise, canceling remaining operations. Use for redundancy scenarios: failover between services, racing multiple data sources, or timeout alternatives.

**When to use Fork-Join:**

- Independent data fetching (parallel I/O)
- Validation of multiple fields with no cross-field dependencies
- Aggregating results from multiple services

**When NOT to use Fork-Join:**

- When operations have dependencies (use Sequencer)
- When you need results sequentially for logging/debugging (use Sequencer)
- When one operation's input depends on another's output (definitely Sequencer)

**Design validation through independence:**

Fork-Join has a crucial constraint: **all branches must be truly independent**. This constraint acts as a design quality check. When you try to write a Fork-Join and discover hidden dependencies, it reveals design issues:

- **Data redundancy:** If branch A needs data from branch B, maybe that data should be provided upfront, not fetched separately.
- **Incorrect data organization:** Dependencies often signal that data is split across sources when it should be colocated.
- **Missing abstraction:** Hidden dependencies may indicate a missing concept that would eliminate the coupling.

Example design issue uncovered by Fork-Join:
```java
// Attempting Fork-Join reveals a problem
Promise.all(
    fetchUserProfile(userId),           // Returns User
    fetchUserPreferences(userId)        // Needs User.timezone from profile!
)
```

The dependency reveals that `UserPreferences` should either:
1. Be fetched together with `User` (they're part of the same aggregate)
2. Not need `User.timezone` (incorrect data organization - timezone should be stored with preferences)
3. Accept `timezone` as explicit input (surfacing the dependency in the type signature)

When Fork-Join feels forced or unnatural, trust that instinct - it's often exposing a design problem that should be fixed, not worked around.

**Anti-patterns:**

DON'T use Fork-Join when there are hidden dependencies:
```java
// DON'T: These aren't actually independent
Promise.all(
    allocateInventory(orderId),   // Might lock inventory
    chargePayment(paymentToken)   // Should only charge if inventory succeeds
).flatMap((inventory, payment) -> confirmOrder(inventory, payment));
```

If inventory allocation fails, we've already charged the customer. These steps have a logical dependency: charge only after successful allocation. Use a Sequencer.

DON'T ignore errors in Fork-Join branches:
```java
// DON'T: Silently swallowing failures
Promise.all(
    fetchPrimary(id).recover(err -> Option.none()),  // Hides failure
    fetchSecondary(id).recover(err -> Option.none())
).flatMap((primary, secondary) -> /* ... */);
```

If both fail, the combiner gets two `none()` values with no indication that anything went wrong. Let failures propagate or model the "best-effort" case explicitly:

```java
// DO: Model best-effort explicitly
record DataSources(Option<Primary> primary, Option<Secondary> secondary) {}

Promise.all(fetchPrimary(id).map(Option::some).recover(err -> Promise.success(Option.none())),
            fetchSecondary(id).map(Option::some).recover(err -> Promise.success(Option.none())))
       .map(DataSources::new);
```

Now the type says "we tried to fetch both, either might be missing," and the combiner can decide whether to proceed or fail based on business rules.

DO keep Fork-Join local and focused:
```java
// DO: Fork-Join in its own function, combiner extracted (Single Level of Abstraction)
private Promise<ReportData> fetchReportData(ReportRequest request) {
    return Promise.all(userRepo.findById(request.userId()),
                       salesRepo.findByDateRange(request.startDate(), request.endDate()),
                       inventoryRepo.getSnapshot(request.warehouseId()))
                  .map(this::buildReportData);
}

private ReportData buildReportData(User user, List<Sale> sales, Inventory inventory) {
    return new ReportData(user, sales, inventory);
}

// Called from a Sequencer:
public Promise<Report> generateReport(ReportRequest request) {
    return ValidRequest.validate(request)
                  .async()
                  .flatMap(this::fetchReportData)  // Fork-Join extracted
                  .flatMap(this::computeMetrics)
                  .flatMap(this::formatReport);
}
```

### Condition

**Definition:** Condition represents branching logic based on data. The key: express conditions as values, not control-flow side effects. Keep branches at the same abstraction level.

**Rationale (by criteria):**
- **Mental Overhead**: Conditions as expressions - evaluates to single value, not control flow scatter (+2).
- **Business/Technical Ratio**: Branch logic mirrors domain rules, not imperative jumps (+2).
- **Complexity**: Same abstraction level per branch - prevents tangled logic (+2).
- **Reliability**: Type-checked branches ensure all cases return compatible types (+2).

Simple conditional:
```java
// DO: Condition as expression returning the monad
Result<Discount> calculateDiscount(Order order) {
    return order.isPremiumUser()
        ? premiumDiscount(order)      // returns Result<Discount>
        : standardDiscount(order);    // returns Result<Discount>
}
```

Both branches return the same type (`Result<Discount>`), so the ternary is just choosing which function to call. No mixed abstractions.

Pattern matching (with Java's switch expressions):
```java
Result<ShippingCost> calculateShipping(Order order, ShippingMethod method) {
    return switch (method) {
        case STANDARD -> standardShipping(order);
        case EXPRESS -> expressShipping(order);
        case OVERNIGHT -> overnightShipping(order);
    };
}
```

Each case returns `Result<ShippingCost>`. The switch expression evaluates to a single result.

**Nested conditions:** Avoid deep nesting by extracting subdecisions into named functions:

```java
// DON'T: Nested ternaries
return user.isPremium()
    ? (order.total().greaterThan(THRESHOLD)
        ? largeOrderPremiumDiscount(order)
        : smallOrderPremiumDiscount(order))
    : (order.total().greaterThan(THRESHOLD)
        ? largeOrderStandardDiscount(order)
        : smallOrderStandardDiscount(order));
```

Extract:
```java
// DO: Extract nested logic
Result<Discount> calculateDiscount(User user, Order order) {
    return user.isPremium()
        ? premiumDiscount(order)
        : standardDiscount(order);
}

private Result<Discount> premiumDiscount(Order order) {
    return order.total().greaterThan(THRESHOLD)
        ? largeOrderPremiumDiscount(order)
        : smallOrderPremiumDiscount(order);
}

private Result<Discount> standardDiscount(Order order) {
    return order.total().greaterThan(THRESHOLD)
        ? largeOrderStandardDiscount(order)
        : smallOrderStandardDiscount(order);
}
```

Now each function has one level of branching. Much clearer.

**Condition with monads:** Use `map`, `flatMap`, and `filter` to keep types consistent. Never use ternaries in lambdas - they violate Single Pattern per Function.

```java
// DON'T: Ternary in lambda (violates Single Pattern per Function)
return fetchUser(userId)
    .flatMap(user -> user.isActive()
        ? processActiveUser(user)
        : UserError.InactiveAccount.INSTANCE.result()
    );

// DO: Extract condition to named function
return fetchUser(userId)
    .flatMap(this::processIfActive);

private Result<ProcessedUser> processIfActive(User user) {
    return user.isActive()
        ? processActiveUser(user)
        : UserError.InactiveAccount.INSTANCE.result();
}
```

Or use `filter` for even cleaner composition:
```java
// DO: Using filter (preferred when applicable)
return fetchUser(userId)
    .filter(User::isActive, UserError.InactiveAccount.INSTANCE)
    .flatMap(this::processActiveUser);
```

**Anti-patterns:**

DON'T mix abstraction levels in branches:
```java
// DON'T: One branch is a leaf, the other is a whole sequence
return user.isPremium()
    ? Result.success(PREMIUM_DISCOUNT)  // Leaf: just a value
    : fetchStandardDiscountRules()      // Sequencer: fetch → compute → validate
        .flatMap(this::computeDiscount)
        .flatMap(this::validateDiscount);
```

Extract the complex branch:
```java
// DO: Both branches are leaves
return user.isPremium()
    ? Result.success(PREMIUM_DISCOUNT)
    : calculateStandardDiscount(user);

private Result<Discount> calculateStandardDiscount(User user) {
    return fetchStandardDiscountRules()
        .flatMap(this::computeDiscount)
        .flatMap(this::validateDiscount);
}
```

DON'T use conditionals to hide missing error handling:
```java
// DON'T: Silently returning the empty result
Result<Data> fetchData(Source source) {
    return source.isAvailable()
        ? source.getData()
        : Result.success(Data.EMPTY);  // Is this a business rule or a hack?
}
```

Be explicit: is empty data a valid outcome, or should unavailable sources fail?

```java
// DO: Explicit semantics
Result<Data> fetchData(Source source) {
    return source.isAvailable()
        ? source.getData()
        : DataError.SourceUnavailable.INSTANCE.result();
}
```

### Iteration

**Definition:** Iteration processes collections, streams, or recursive structures. Prefer functional combinators over explicit loops. Keep transformations pure.

**Rationale (by criteria):**
- **Mental Overhead**: Declarative combinators state intent; imperative loops require tracing (+2).
- **Business/Technical Ratio**: map/filter express business logic; loops are iteration mechanics (+2).
- **Complexity**: Functional composition eliminates index management and loop state (+2).
- **Reliability**: Pure transformations have no side effects - deterministic and testable (+2).

Mapping collections:
```java
// Transforming a list of raw inputs to domain objects
Result<List<Email>> parseEmails(List<String> rawEmails) {
    return Result.allOf(
        rawEmails.stream()
            .map(Email::email)
            .toList()
    );
}
```

`Result.allOf` aggregates a `List<Result<Email>>` into `Result<List<Email>>`. If any email is invalid, you get a `CompositeCause` with all failures.

Filtering and transforming:
```java
List<ActiveUser> activeUsers(List<User> users) {
    return users.stream()
        .filter(User::isActive)
        .map(this::toActiveUser)
        .toList();
}

private ActiveUser toActiveUser(User user) {
    return new ActiveUser(user.id(), user.email());
}
```

Pure transformation, no side effects, returns `List<ActiveUser>` (type `T`, not `Result`, because this can't fail).

**Async iteration:** When processing collections with async operations, decide between sequential and parallel:

Sequential:
```java
// Process orders one at a time
Promise<List<Receipt>> processOrders(List<Order> orders) {
    return orders.stream()
        .reduce(
            Promise.success(new ArrayList<Receipt>()),
            (promiseAcc, order) -> promiseAcc.flatMap(acc -> addReceipt(acc, order)),
            (p1, p2) -> p1  // Won't be used in sequential reduction
        );
}

private Promise<List<Receipt>> addReceipt(List<Receipt> acc, Order order) {
    return processOrder(order).map(receipt -> {
        acc.add(receipt);
        return acc;
    });
}
```

Parallel (when orders are independent):
```java
// Process orders in parallel
Promise<List<Receipt>> processOrders(List<Order> orders) {
    return Promise.allOf(
        orders.stream()
            .map(this::processOrder)
            .toList()
    );
}
```

Use parallel when operations are independent. The order in the returned List corresponds to the order of the input list of Promises.

**Anti-patterns:**

DON'T mix side effects into stream operations:
```java
// DON'T: Side effect in the map
users.stream()
    .map(user -> {
        logger.info("Processing user: {}", user.id());  // Side effect!
        return processUser(user);
    })
    .toList();
```

Extract side effects to an Aspect (logging) or keep them out of transformation logic.

DON'T use imperative loops when combinators exist:
```java
// DON'T: Imperative accumulation
List<Result<Email>> results = new ArrayList<>();
for (String raw : rawEmails) {
    results.add(Email.email(raw));
}
// Then manually aggregate results...
```

Use `Result.allOf`:
```java
// DO: Declarative collection
Result<List<Email>> emails = Result.allOf(
    rawEmails.stream().map(Email::email).toList()
);
```

DO keep iteration focused on transformation:
```java
// DO: Pure transformation
List<OrderSummary> summarize(List<Order> orders) {
    return orders.stream()
        .map(this::toOrderSummary)
        .toList();
}

private OrderSummary toOrderSummary(Order order) {
    return new OrderSummary(
        order.id(),
        order.total(),
        order.itemCount()
    );
}
```

### Aspects (Decorators)

**Definition:** Aspects are higher-order functions that wrap steps or use cases to add cross-cutting concerns - retry, timeout, logging, metrics - without changing business semantics.

**Rationale (by criteria):**
- **Mental Overhead**: Cross-cutting concerns separated from business logic - clear responsibilities (+3).
- **Business/Technical Ratio**: Business logic stays pure; technical concerns isolated in decorators (+3).
- **Complexity**: Composable aspects via higher-order functions - no framework magic (+2).
- **Design Impact**: Business logic independent of retry/metrics/logging - testable separately (+3).

**Placement:**
- **Local concerns:** Wrap individual steps when the aspect applies to just that step. Example: retry only on external API calls.
- **Cross-cutting concerns:** Wrap the entire `execute()` method. Example: metrics for the whole use case.

**Example: Retry aspect on a step**

```java
public interface FetchUserProfile {
    Promise<Profile> apply(UserId userId);
}

// Step implementation
class UserServiceClient implements FetchUserProfile {
    public Promise<Profile> apply(UserId userId) {
        return httpClient.get("/users/" + userId.value())
            .map(this::parseProfile);
    }
}

// Applying a retry aspect at construction:
static ProcessUserData processUserData(..., UserServiceClient userServiceClient, ...) { {
    // Values also can come from passed config
    var retryPolicy = RetryPolicy.builder()
        .maxAttempts(3)                     
        .backoff(exponential(100, 2.0))
        .build();

    var fetchWithRetry = withRetry(retryPolicy, userServiceClient);

    return new processUserData(
        validateInput,
        fetchWithRetry,  // Decorated step
        processData
    );
}
```

The retry aspect wraps the `UserServiceClient` step. If it fails, the aspect retries, according to the policy. The rest of the use case is unaware - it just calls `fetchUserProfile.apply(userId)`.

**Example: Metrics aspect on use case**

```java
public interface LoginUser {
    Promise<LoginResponse> execute(LoginRequest request);

    static LoginUser loginUser(...) {
        ...
        var rawUseCase = new loginUser(...);
        var metricsPolicy = MetricsPolicy.metricsPolicy("user_login");
        return withMetrics(metricsPolicy, rawUseCase);
    }
}
```

The `withMetrics` decorator wraps the entire use case. It records execution time, success/failure counts, etc., for every invocation of `execute()`.

**Composing multiple aspects:**

Order matters. Typical ordering (outermost to innermost):
1. Metrics/Logging (outermost - observe everything)
2. Timeout (global deadline)
3. CircuitBreaker (fail-fast if the system is degraded)
4. Retry (per-attempt)
5. RateLimit (throttle requests)
6. Business logic (innermost)

```java
var decoratedStep = withMetrics(metricsPolicy,
    withTimeout(timeoutPolicy,
        withCircuitBreaker(breakerPolicy,
            withRetry(retryPolicy, rawStep)
        )
    )
);
```

Or use a helper:
```java
var decoratedStep = composeAspects(
    List.of(
        metrics(metricsPolicy),
        timeout(timeoutPolicy),
        circuitBreaker(breakerPolicy),
        retry(retryPolicy)
    ),
    rawStep
);
```

**Testing:** Test aspects in isolation with synthetic steps. Use case tests remain aspect-agnostic - they test business logic, not retry behavior or metrics.

```java
// Aspect test (isolated)
@Test
void retryAspect_retriesOnFailure() {
    var failingStep = new FlakyStep(2); //Fail times
    var retryPolicy = RetryPolicy.maxAttempts(3);
    var decorated = withRetry(retryPolicy, failingStep);

    var result = decorated.apply(input).await();

    assertTrue(result.isSuccess());
    assertEquals(3, failingStep.invocationCount());  // Failed twice, succeeded on 3rd
}

// Use case test (aspect-agnostic)
@Test
void loginUser_success() {
    var useCase = LoginUser.loginUser(
        mockValidate,
        mockCheckCreds,
        mockGenerateToken
    );

    var result = useCase.execute(validRequest).await();

    assertTrue(result.isSuccess());
    // No assertions about retries, timeouts, etc.
}
```

**Anti-patterns:**

DON'T mix aspect logic into business logic:
```java
// DON'T: Retry logic inside the step
Promise<Profile> fetchProfile(UserId id) {
    return retryWithBackoff(() ->
        httpClient.get("/users/" + id.value())
    ).map(this::parseProfile);
}
```

Extract to an aspect decorator.

DON'T apply aspects inconsistently:
```java
// DON'T: Some steps have retry, some don't, no clear reason
var step1 = withRetry(policy, rawStep1);
var step2 = rawStep2;  // Why no retry?
var step3 = withRetry(policy, rawStep3);
```

Be deliberate. If only external calls need retry, document that. If every step should have metrics, apply it at the use case level.

DO keep aspects composable and reusable:
```java
// DO: Aspects as higher-order functions that decorate steps
static <I, O> Fn1<I, Promise<O>> withTimeout(TimeSpan timeout, Fn1<I, Promise<O>> step) {
    return input -> step.apply(input).timeout(timeout);
}

static <I, O> Fn1<I, Promise<O>> withRetry(RetryPolicy policy, Fn1<I, Promise<O>> step) {
    return input -> retryLogic(policy, () -> step.apply(input));
}

// Compose by wrapping:
var decorated = withTimeout(timeSpan(5).seconds(),
                    withRetry(retryPolicy, rawStep));
```

---

## Testing Patterns

Testing functional code uses a different approach than traditional imperative testing. Instead of interrogating state with `isSuccess()`/`isFailure()`, we use functional bifurcation with `onSuccess`/`onFailure` callbacks.

### Core Testing Pattern

**For expected failures** - use `.onSuccess(Assertions::fail)`:
```java
@Test
void validation_fails_forInvalidInput() {
    var request = new Request("invalid-data");

    ValidRequest.validate(request)
                .onSuccess(Assertions::fail);  // Fail if unexpectedly succeeds
}
```

**For expected successes** - use `.onFailure(Assertions::fail).onSuccess(assertions)`:
```java
@Test
void validation_succeeds_forValidInput() {
    var request = new Request("valid@example.com", "Valid1234");

    ValidRequest.validate(request)
                .onFailure(Assertions::fail)  // Fail if unexpectedly fails
                .onSuccess(valid -> {
                    assertEquals("valid@example.com", valid.email().value());
                    // Additional assertions...
                });
}
```

**For async operations** - use `.await()` then apply the pattern:
```java
@Test
void execute_succeeds_forValidInput() {
    UseCase useCase = UseCase.create(stub1, stub2);
    var request = new Request("data");

    useCase.execute(request)
           .await()                     // Wait for operation
           .onFailure(Assertions::fail)
           .onSuccess(response -> assertEquals("expected", response.value()));
}
```

### Benefits of This Approach

1. **No intermediate variables**: No `var result = ...` clutter
2. **Functional bifurcation**: Explicitly specify behavior for each outcome
3. **Method references**: Use `Assertions::fail` instead of `() -> Assertions.fail()`
4. **Clear intent**: The test structure mirrors the functional flow

See [Naming Conventions](#naming-conventions) for test naming patterns.

### Testing with Stubs

Use type declarations instead of casts for stub implementations:

```java
// DO: Type declaration
CheckEmailUniqueness checkEmail = req -> Promise.success(req);
HashPassword hashPassword = pwd -> Result.success(new HashedPassword("hashed"));

// DON'T: Cast
var checkEmail = (CheckEmailUniqueness) req -> Promise.success(req);
```

This makes the code cleaner and leverages type inference properly.

---

## Naming Conventions

Consistent naming reduces cognitive overhead and improves readability. This technology uses specific conventions that make code scannable and predictable.

### Factory Method Naming

Factories are always named after their type, lowercase-first (camelCase). This creates a natural, readable call site:

```java
Email.email("user@example.com")
Password.password("Secret123")
AccountId.accountId("ACC-001")
```

The intentional redundancy (`Email.email`) enables conflict-free static imports:
```java
import static com.example.domain.Email.email;

// At call site:
var result = email(raw);  // Clear what's being created
```

This pattern is grep-friendly and unambiguous - searching for `Email.email` finds all email construction sites.

**Implementation patterns:**

**Value objects** (records) — Always use records for serializable data types:
```java
record Email(String value) {
    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .map(String::trim)
            .map(Email::new);
    }
}
```

**Use cases and steps** (lambdas) — Return lambdas for behavioral components that don't require serialization:
```java
public interface RegisterUser extends UseCase.WithPromise<Response, Request> {
    // Factory returns lambda implementing the interface
    static RegisterUser registerUser(CheckEmail checkEmail, CreateUser createUser) {
        return request -> ValidRequest.validRequest(request)
                                      .async()
                                      .flatMap(checkEmail::apply)
                                      .flatMap(createUser::apply);
    }
}
```

**Rationale:** Value objects (Request, Response, domain records) need serialization for API contracts and persistence. Use cases and steps are created at assembly time and never serialized—lambdas are sufficient and lighter-weight than record implementations.

### Acronym Naming

Treat acronyms as normal words using camelCase, not all-uppercase. This improves readability by making acronyms blend naturally into identifiers.

**Rationale:** Code is read far more often than it's written. Optimize for reading by making text flow smoothly.

**Examples:**
```java
// DO: Treat acronyms as words
HttpClient client;
XmlParser parser;
sendJsonRequest(data);
setRestApiUrl(url);
validateHtmlContent(html);

// DON'T: All-caps acronyms break readability
HTTPClient client;
XMLParser parser;
sendJSONRequest(data);
setRESTAPIURL(url);
validateHTMLContent(html);
```

**Why by criteria:**
- **Mental Overhead**: Smooth camelCase reads faster than mixed case breaks (+2).
- **Complexity**: Consistent casing rules - no special cases for acronyms (+1).

**Edge case - Two-letter acronyms:** Use lowercase for better flow:
```java
// DO
IoException
IdGenerator

// DON'T
IOException  // Harder to scan in mixed context
IDGenerator
```

> **Source:** [Daniel Moka on LinkedIn](https://www.linkedin.com/posts/danielmoka_clean-code-tip-name-acronyms-as-normal-words-activity-7380843966650474496-vNzK)

### Test Naming

Follow the pattern: `methodName_outcome_condition`

```java
void validRequest_succeeds_forValidInput()
void validRequest_fails_forInvalidEmail()
void execute_succeeds_forValidInput()
void execute_fails_whenEmailAlreadyExists()
```

This makes test intent immediately clear: what's being tested, expected outcome, and condition triggering that outcome.

---

## Project Structure & Package Organization

### Vertical Slicing Philosophy

This technology organizes code around **vertical slices** - each use case is self-contained with its own business logic, validation, and error handling. Unlike architectures that centralize all business logic into one functional core, we **isolate business logic within each use case package**. This creates clear boundaries and prevents coupling between unrelated features.

**Why vertical slicing (by criteria):**
- **Complexity**: Minimizes coupling between unrelated features - each slice independent (+3).
- **Business/Technical Ratio**: Package names reflect domain use cases, not technical layers (+2).
- **Mental Overhead**: All related code in one place - less navigation across packages (+2).
- **Design Impact**: Forces proper boundaries - business logic cannot leak between use cases (+2).

### Package Structure

The standard package layout follows this pattern:

```
com.example.app/
├── usecase/
│   ├── registeruser/              # Use case 1 (vertical slice)
│   │   ├── RegisterUser.java      # Use case interface + factory
│   │   ├── RegistrationError.java # Sealed error interface
│   │   └── [internal types]       # ValidRequest, intermediate records
│   │
│   └── getuserprofile/            # Use case 2 (vertical slice)
│       ├── GetUserProfile.java
│       ├── ProfileError.java
│       └── [internal types]
│
├── domain/
│   └── shared/                    # Reusable value objects only
│       ├── Email.java
│       ├── Password.java
│       ├── UserId.java
│       └── [other VOs]
│
├── adapter/
│   ├── rest/                      # Inbound adapters (HTTP)
│   │   ├── UserController.java
│   │   └── [other controllers]
│   │
│   └── persistence/               # Outbound adapters (DB, external APIs)
│       ├── JooqUserRepository.java
│       └── [other repositories]
│
└── config/                        # Framework configuration
    ├── UseCaseConfig.java
    └── [other configs]
```

### Package Placement Rules

**Use Case Packages** (`com.example.app.usecase.<usecasename>`):
- Use case interface and factory method
- Error types specific to this use case (sealed interface)
- Step interfaces (nested in use case interface)
- Internal validation types (ValidRequest, intermediate records)
- **Rule**: If a type is used only by this use case, it stays here

**Domain Shared** (`com.example.app.domain.shared`):
- Value objects reused across multiple use cases
- **Rule**: Move here immediately when a second use case needs the same value object
- **Anti-pattern**: Don't create this upfront - let reuse drive the move

**Adapter Packages** (`com.example.app.adapter.*`):
- `adapter.rest` - HTTP controllers, request/response DTOs
- `adapter.persistence` - Database repositories, ORM entities
- `adapter.messaging` - Message queue consumers/producers
- `adapter.external` - HTTP clients for external services
- **Rule**: Adapters implement step interfaces from use cases

**Config Package** (`com.example.app.config`):
- Spring/framework configuration
- Bean wiring, dependency injection setup
- **Rule**: No business logic, only infrastructure configuration

### Module Organization (Optional)

For larger systems, split into Gradle/Maven modules:

```
:domain          # Pure Java - value objects, no framework deps
:application     # Use cases and step interfaces
:adapters        # All adapter implementations
:bootstrap       # Main class, configuration, framework setup
```

**When to use modules:**
- Team size > 5 developers
- Multiple deployment units from same codebase
- Enforcing compile-time dependency boundaries
- Independent library publication

**For smaller systems:**
- Single module with packages is sufficient
- Simpler build, faster iteration
- Package discipline enforces boundaries

### Key Principles

**1. Vertical Slicing:**
Each use case package is a vertical slice containing everything needed for that feature. Business logic doesn't leak across use case boundaries.

**2. Minimal Sharing:**
Only share value objects when truly reusable. Premature sharing creates coupling.

**3. Framework at Edges:**
Business logic (use cases, domain) has zero framework dependencies. Adapters and config handle framework integration.

**4. Clear Dependencies:**
- Use cases depend on: domain.shared
- Adapters depend on: use cases (implement step interfaces)
- Config depends on: use cases + adapters (wires them together)
- **Never**: use case depending on adapter, adapter depending on another adapter

**5. Adapter Isolation:**
All I/O operations live in adapters. This enables framework swapping (Spring → Micronaut, JDBC → JOOQ) without touching business logic.

### Example: Where Things Go

**Creating a new Email value object:**
- First use case: Put in `usecase.registeruser` package
- Second use case needs it: Move to `domain.shared`

**Creating a new use case:**
```
com.example.app.usecase.updateprofile/
├── UpdateProfile.java       # Interface + factory
├── UpdateError.java         # Errors
└── ValidUpdateRequest.java  # Internal validation
```

**Implementing database access:**
```
com.example.app.adapter.persistence/
└── JooqProfileRepository.java  # implements UpdateProfile.SaveProfile
```

**Wiring in Spring:**
```
com.example.app.config/
└── ProfileConfig.java  # @Bean methods connecting pieces
```

---

## Use Case Walkthrough

Let's build a complete use case from scratch: `RegisterUser`. We'll follow the technology step-by-step, showing validation, steps, error handling, and testing.

### Requirements

**Use case:** Register a new user account.

**Inputs (raw):**
- Email (string)
- Password (string)
- Referral code (optional string)

**Outputs:**
- User ID
- Confirmation token

**Validation rules:**
- Email: not null, valid format, lowercase normalized
- Password: not null, min 8 chars, at least one uppercase, one digit
- Referral code: optional; if present, must be exactly 6 uppercase alphanumeric characters

**Cross-field rules:**
- Email must not be registered yet

**Steps:**
1. Validate input
2. Check email uniqueness (async, database)
3. Hash password (sync, expensive computation)
4. Save the user to the database (async)
5. Generate confirmation token (async, calls external service)

**Async flow:** Steps 2, 4, 5 are async. Use `Promise<Response>`.

### Step 1: Package and Use Case Interface

Package: `com.example.app.usecase.registeruser`

```java
package com.example.app.usecase.registeruser;

import org.pragmatica.lang.*;

public interface RegisterUser {
    record Request(String email, String password, String referralCode) {}
    record Response(UserId userId, ConfirmationToken token) {}

    Promise<Response> execute(Request request);

    static RegisterUser registerUser(
        CheckEmailUniqueness checkEmail,
        HashPassword hashPassword,
        SaveUser saveUser,
        GenerateToken generateToken
    ) {
        record registerUser(
            CheckEmailUniqueness checkEmail,
            HashPassword hashPassword,
            SaveUser saveUser,
            GenerateToken generateToken
        ) implements RegisterUser {
            public Promise<Response> execute(Request request) {
                return ValidRequest.validRequest(request)
                    .async()
                    .flatMap(checkEmail::apply)
                    .flatMap(this::hashPasswordForUser)
                    .flatMap(saveUser::apply)
                    .flatMap(generateToken::apply);
            }

            private Promise<ValidatedUser> hashPasswordForUser(ValidRequest request) {
                return hashPassword.apply(request.password())
                    .async()
                    .map(hashed -> toValidatedUser(request, hashed));
            }

            private ValidatedUser toValidatedUser(ValidRequest request, HashedPassword hashed) {
                return new ValidatedUser(request.email(), hashed, request.referralCode());
            }
        }
        return new registerUser(checkEmail, hashPassword, saveUser, generateToken);
    }
}
```

### Step 2: Validated Request

Nested record with the factory method which builds `ValidRequest` from raw `Request`.

```java
record ValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {

    // From raw Request: parse per-field VOs
    public static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()),
                          ReferralCode.referralCode(raw.referralCode()))
                     .flatMap(ValidRequest::new);
    }
}
```

If we had cross-field rules (e.g., "premium referral codes require 10+ char passwords"), we'd add them in the second factory, with the same name but accepting already valid individual fields:

```java
public static Result<ValidRequest> validRequest(
    Email email,
    Password password,
    Option<ReferralCode> referralCode
) {
    return Result.all(checkPremiumPasswordRequirement(password, referralCode))
                 .map(_ -> toValidRequest(email, password, referralCode));
}

private static ValidRequest toValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {
    return new ValidRequest(email, password, referralCode);
}

private static Result<Unit> checkPremiumPasswordRequirement(
    Password password,
    Option<ReferralCode> referralCode
) {
    return referralCode.match(
        code -> checkPremiumPassword(code, password),
        Result::unitResult
    );
}

private static Result<Unit> checkPremiumPassword(ReferralCode code, Password password) {
    return isPremiumWithWeakPassword(code, password)
        ? RegistrationError.WeakPasswordForPremium.INSTANCE.result()
        : Result.unitResult();
}

private static boolean isPremiumWithWeakPassword(ReferralCode code, Password password) {
    return code.isPremium() && password.length() < 10;
}
```

For simplicity, we'll skip cross-field checks in this example.

### Step 3: Value Objects (Business Leaves)

**Email:**
```java
package com.example.app.domain.shared;

import org.pragmatica.lang.*;

public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forValue("Invalid email format: {}");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .map(String::trim)
            .map(String::toLowerCase)
            .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, EMAIL_PATTERN))
            .map(Email::new);
    }
}
```

**Password:**
```java
package com.example.app.domain.shared;

import org.pragmatica.lang.*;

public record Password(String value) {
    private static final Fn1<Cause, String> TOO_SHORT = Causes.forValue("Password must be at least 8 characters");
    private static final Fn1<Cause, String> MISSING_UPPERCASE = Causes.forValue("Password must contain uppercase letter");
    private static final Fn1<Cause, String> MISSING_DIGIT = Causes.forValue("Password must contain digit");

    public static Result<Password> password(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .flatMap(Verify.ensureFn(TOO_SHORT, Verify.Is::minLength, 8))
            .flatMap(ensureUppercase())
            .flatMap(ensureDigit())
            .map(Password::new);
    }

    private static Fn1<Result<String>, String> ensureUppercase() {
        return raw -> raw.chars().anyMatch(Character::isUpperCase)
            ? Result.success(raw)
            : MISSING_UPPERCASE.apply(raw).result();
    }

    private static Fn1<Result<String>, String> ensureDigit() {
        return raw -> raw.chars().anyMatch(Character::isDigit)
            ? Result.success(raw)
            : MISSING_DIGIT.apply(raw).result();
    }

    public int length() {
        return value.length();
    }
}
```

**ReferralCode (optional-with-validation):**
```java
package com.example.app.domain.shared;

import org.pragmatica.lang.*;

public record ReferralCode(String value) {
    private static final String REFERRAL_PATTERN = "^[A-Z0-9]{6}$";

    public static Result<Option<ReferralCode>> referralCode(String raw) {
        return switch (raw) {
            case null, "" -> Result.success(Option.none());
            default -> Verify.ensure(raw.trim(), Verify.Is::matches, REFERRAL_PATTERN)
                .map(ReferralCode::new)
                .map(Option::some);
        };
    }

    public boolean isPremium() {
        return value.startsWith("VIP");
    }
}
```

All three live in `com.example.app.domain.shared` because they're reusable across use cases.

### Step 4: Steps (Interfaces)

```java
// Step 1: Check email uniqueness
public interface CheckEmailUniqueness {
    Promise<ValidRequest> apply(ValidRequest request);
}

// Step 2: Hash password (sync, so we lift in the sequencer)
public interface HashPassword {
    Result<HashedPassword> apply(Password password);
}

// Step 3: Save the user
public interface SaveUser {
    Promise<UserId> apply(ValidatedUser user);
}

// Step 4: Generate a confirmation token
public interface GenerateToken {
    Promise<Response> apply(UserId userId);
}
```

Supporting types:
```java
record ValidatedUser(Email email, HashedPassword hashed, Option<ReferralCode> refCode) {}
record HashedPassword(String value) {}
record UserId(String value) {}
record ConfirmationToken(String value) {}
```

### Step 5: Step Implementations

**CheckEmailUniqueness (adapter leaf):**
```java
class EmailUniquenessChecker implements CheckEmailUniqueness {
    private final UserRepository userRepo;

    public Promise<ValidRequest> apply(ValidRequest request) {
        return userRepo.existsByEmail(request.email())
            .flatMap(exists -> checkNotExists(exists, request));
    }

    private Promise<ValidRequest> checkNotExists(boolean exists, ValidRequest request) {
        return exists
            ? RegistrationError.EmailAlreadyRegistered.INSTANCE.promise()
            : Promise.success(request);
    }
}
```

**HashPassword (business leaf):**
```java
class BcryptPasswordHasher implements HashPassword {
    private final BCryptPasswordEncoder encoder;

    public Result<HashedPassword> apply(Password password) {
        return Result.lift1(
            RegistrationError.PasswordHashingFailed::cause,
            encoder::encode,
            password.value()
        ).map(HashedPassword::new);
    }
}
```

**SaveUser (adapter leaf):**
```java
class JooqUserRepository implements SaveUser {
    private final DSLContext dsl;

    public Promise<UserId> apply(ValidatedUser user) {
        return Promise.lift(
            RepositoryError.DatabaseFailure::cause,
            () -> {
                String id = dsl.insertInto(USERS)
                    .set(USERS.EMAIL, user.email().value())
                    .set(USERS.PASSWORD_HASH, user.hashed().value())
                    .set(USERS.REFERRAL_CODE, user.refCode().map(ReferralCode::value).orElse(null))
                    .returningResult(USERS.ID)
                    .fetchSingle()
                    .value1();

                return new UserId(id);
            }
        );
    }
}
```

**GenerateToken (adapter leaf):**
```java
class TokenServiceClient implements GenerateToken {
    private final HttpClient httpClient;

    public Promise<Response> apply(UserId userId) {
        return httpClient.post("/tokens/confirm", Map.of("userId", userId.value()))
            .map(resp -> buildResponse(userId, resp))
            .recover(this::mapTokenError);
    }

    private Response buildResponse(UserId userId, Map<String, String> resp) {
        return new Response(userId, new ConfirmationToken(resp.get("token")));
    }

    private Promise<Response> mapTokenError(Throwable err) {
        return RegistrationError.TokenGenerationFailed.cause(err).promise();
    }
}
```

### Step 6: Errors

```java
package com.example.app.usecase.registeruser;

import org.pragmatica.lang.Cause;

public sealed interface RegistrationError extends Cause {

    enum EmailAlreadyRegistered implements RegistrationError {
        INSTANCE;

        @Override
        public String message() {
            return "Email already registered";
        }
    }

    enum WeakPasswordForPremium implements RegistrationError {
        INSTANCE;

        @Override
        public String message() {
            return "Premium referral codes require passwords of at least 10 characters";
        }
    }

    record PasswordHashingFailed(Throwable cause) implements RegistrationError {
        @Override
        public String message() {
            return "Password hashing failed";
        }
    }

    record TokenGenerationFailed(Throwable cause) implements RegistrationError {
        @Override
        public String message() {
            return "Token generation failed";
        }
    }
}
```

### Step 7: Testing

**Validation tests:**
```java
@Test
void validRequest_fails_forInvalidEmail() {
    var request = new Request("not-an-email", "Valid1234", null);

    ValidRequest.validRequest(request)
                .onSuccess(Assertions::fail);
}

@Test
void validRequest_fails_forWeakPassword() {
    var request = new Request("user@example.com", "weak", null);

    ValidRequest.validRequest(request)
                .onSuccess(Asseertions::fail);
}

@Test
void validRequest_fails_forInvalidReferralCode() {
    var request = new Request("user@example.com", "Valid1234", "abc");

    ValidRequest.validRequest(request)
                .onSuccess(Addertions::fail);
}

@Test
void validRequest_succeeds_forValidInput() {
    var request = new Request("user@example.com", "Valid1234", "ABC123");

    ValidRequest.validRequest(request)
                .onFailue(Assertions::fail)
                .onSuccess(valid -> {
                    assertEquals("user@example.com", valid.email().value());
                    assertTrue(valid.referralCode().isPresent());
                });
}
```

**Happy path test (with stubs):**
```java
@Test
void execute_succeeds_forValidInput() {
    CheckEmailUniqueness checkEmail = req -> Promise.success(req);
    HashPassword hashPassword = pwd -> Result.success(new HashedPassword("hashed"));
    SaveUser saveUser = user -> Promise.success(new UserId("user-123"));
    GenerateToken generateToken = id -> Promise.success(
        new Response(id, new ConfirmationToken("token-456"))
    );

    var useCase = RegisterUser.registerUser(checkEmail, hashPassword, saveUser, generateToken);
    var request = new Request("user@example.com", "Valid1234", null);

    useCase.execute(request)
          .await()
          .onFailure(Assertions::fail)
          .onSuccess(response -> {
              assertEquals("user-123", response.userId().value());
              assertEquals("token-456", response.token().value());
          });
}
```

**Failure scenario:**
```java
@Test
void execute_fails_whenEmailAlreadyExists() {
    CheckEmailUniqueness checkEmail = req ->
        RegistrationError.EmailAlreadyRegistered.INSTANCE.promise();
    HashPassword hashPassword = pwd -> Result.success(new HashedPassword("hashed"));
    SaveUser saveUser = user -> Promise.success(new UserId("user-123"));
    GenerateToken generateToken = id -> Promise.success(
        new Response(id, new ConfirmationToken("token-456"))
    );

    var useCase = RegisterUser.registerUser(checkEmail, hashPassword, saveUser, generateToken);
    var request = new Request("existing@example.com", "Valid1234", null);

    useCase.execute(request)
          .await()
          .onSuccess(Assertions::fail);
}
```

---

## Framework Integration

This technology is framework-agnostic, but you still need to connect it to the real world: HTTP endpoints, databases, message queues. Here's how to bridge the functional core to an imperative framework (Spring Boot example).

### Complete Example: Spring REST → Use Case → JOOQ

**Use Case:** `GetUserProfile`  - fetch a user profile by ID.

**Layers:**
1. REST controller (adapter in)
2. Use case (functional core)
3. JOOQ repository (adapter out)

**1. Use Case (functional core):**

```java
package com.example.app.usecase.getuserprofile;

import org.pragmatica.lang.*;

public interface GetUserProfile {
    record Request(String userId) {}
    record Response(String userId, String email, String displayName) {}

    Promise<Response> execute(Request request);

    interface FetchUser { Promise<User> apply(UserId userId); }

    static GetUserProfile getUserProfile(FetchUser fetchUser) {
        record getUserProfile(FetchUser fetchUser) implements GetUserProfile {
            public Promise<Response> execute(Request request) {
                return UserId.userId(request.userId())
                    .async()
                    .flatMap(fetchUser::apply)
                    .map(this::toResponse);
            }

            private Response toResponse(User user) {
                return new Response(
                    user.id().value(),
                    user.email().value(),
                    user.displayName()
                );
            }
        }
        return new getUserProfile(fetchUser);
    }
}
```

**2. REST Controller (adapter in):**

```java
package com.example.app.adapter.rest;

import com.example.app.usecase.getuserprofile.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final GetUserProfile getUserProfile;

    public UserController(GetUserProfile getUserProfile) {
        this.getUserProfile = getUserProfile;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        var request = new GetUserProfile.Request(userId);

        return getUserProfile.execute(request)
            .await()  // Block (or use reactive types in real Spring WebFlux)
            .match(
                response -> ResponseEntity.ok(response),
                cause -> toErrorResponse(cause)
            );
    }

    private ResponseEntity<?> toErrorResponse(Cause cause) {
        return switch (cause) {
            case ProfileError.UserNotFound _ ->
                ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", cause.message()));

            case ProfileError.InvalidUserId _ ->
                ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", cause.message()));

            default ->
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        };
    }
}
```

The controller is a thin adapter: extract path variable → create `Request` → call use case → map `Response`/`Cause` to HTTP status/body. No business logic here.

**3. JOOQ Repository (adapter out):**

```java
package com.example.app.adapter.persistence;

import com.example.app.usecase.getuserprofile.*;
import org.jooq.*;
import org.pragmatica.lang.*;
import org.springframework.stereotype.Repository;

import static com.example.db.tables.Users.USERS;

@Repository
public class JooqUserRepository implements GetUserProfile.FetchUser {
    private final DSLContext dsl;

    public JooqUserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public Promise<User> apply(UserId userId) {
        return Promise.lift(
            ProfileError.DatabaseFailure::cause,
            () -> dsl.selectFrom(USERS)
                .where(USERS.ID.eq(userId.value()))
                .fetchOptional()
        ).flatMap(optRecord ->
            optRecord
                .map(this::toDomain)
                .orElse(ProfileError.UserNotFound.INSTANCE.promise())
        );
    }

    private Promise<User> toDomain(Record record) {
        return Result.all(
            UserId.userId(record.get(USERS.ID)),
            Email.email(record.get(USERS.EMAIL)),
            Result.success(record.get(USERS.DISPLAY_NAME))
        ).async()
         .map(User::new);
    }
}
```

The repository wraps JOOQ exceptions in domain `Cause` objects. Business logic never sees `DataAccessException`.

**4. Wiring (Spring config):**

```java
package com.example.app.config;

import com.example.app.usecase.getuserprofile.*;
import com.example.app.adapter.persistence.JooqUserRepository;
import org.springframework.context.annotation.*;

@Configuration
public class UseCaseConfig {

    @Bean
    public GetUserProfile getUserProfile(JooqUserRepository repository) {
        return GetUserProfile.getUserProfile(repository);
    }
}
```

Spring autowires the repository into the use case factory. The use case is a bean, injected into the controller.

**Summary:**

- **Controller:** Imperative, thin adapter. Converts HTTP → `Request`, `Response`/`Cause` → HTTP.
- **Use case:** Functional, pure business logic. No framework dependencies.
- **Repository:** Imperative, thin adapter. Converts JOOQ → domain types, exceptions → `Cause`.

The functional core (use case + domain types) is framework-independent. You could swap Spring for Micronaut, Ktor, or plain Servlets - just rewrite the adapters, not the business logic.

---

## Conclusion

This technology isn't about learning new tools or frameworks. It's about reducing the number of decisions you make so you can focus on the decisions that matter - the business logic.

By constraining return types to exactly four kinds, enforcing parse-don't-validate, eliminating business exceptions, and mandating one pattern per function, we compress the design space. There's essentially one good way to structure a use case, one good way to validate input, one good way to handle errors, one good way to compose async operations.

This compression has compound benefits. Code becomes predictable - you recognize patterns at a glance. Refactoring becomes mechanical - the rules tell you when and how to split functions. Technical debt becomes rare - prevention is built into the structure. Business logic becomes clear - domain concepts aren't buried in framework ceremony or mixed abstraction levels.

In the AI era, this matters more than ever. When AI generates code, it needs a well-defined target structure. When humans read AI-generated code, they need to recognize patterns instantly. When teams collaborate across humans and AI, they need a shared vocabulary that both understand without translation overhead.

The technology is simple: four return types, parse-don't-validate, no business exceptions, one pattern per function, clear package layout, mechanical refactoring. The impact compounds: unified structure, minimal debt, close business modeling, deterministic generation, tooling-friendly code.

Start small. Pick one use case. Apply the rules. See how it feels. Then expand. The rules stay the same whether you're building a monolith or a microservice, a synchronous API or an event-driven system, a greenfield project or refactoring legacy code.

The goal isn't perfect code. It's code that's easy to understand, easy to change, easy to test, and easy to generate. Code that humans and AI can collaborate on without friction.

Write code that explains itself. Let structure carry intent. Focus on business logic, not technical ceremony.

That's the technology.

---

## Version History

For detailed changelog of all versions, see [CHANGELOG.md](https://github.com/siy/coding-technology/blob/main/CHANGELOG.md).

---

**Copyright © 2025 Sergiy Yevtushenko**

This work is licensed under the [MIT License](https://github.com/siy/coding-technology/blob/main/LICENSE). You are free to use, modify, and distribute this content in commercial and non-commercial projects.
