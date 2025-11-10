# Part 6: Building Production Systems

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 6 of 6

**Previous:** [Part 5: Testing Strategy](part-05-testing-strategy.md) | **Complete Series:** [Index](INDEX.md)

---

## Overview

You've learned the principles, patterns, and testing approaches. Now we'll bring everything together by building a complete production system from requirements to deployment.

By the end of this part, you'll see:
- **Complete Use Case**: RegisterUser from requirements through implementation and tests
- **Project Structure**: How to organize packages and modules for vertical slicing
- **Framework Integration**: Connecting functional code to Spring Boot and JOOQ
- **Next Steps**: Where to go from here

This is where theory becomes practice.

---

## Complete Use Case Walkthrough

Let's build `RegisterUser` from scratch, following the technology step-by-step.

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
        return request -> ValidRequest.validRequest(request)
                                      .async()
                                      .flatMap(checkEmail::apply)
                                      .flatMap(valid -> hashPassword.apply(valid.password())
                                                                    .async()
                                                                    .map(hashed -> new ValidUser(
                                                                        valid.email(),
                                                                        hashed,
                                                                        valid.referralCode())))
                                      .flatMap(saveUser::apply)
                                      .flatMap(generateToken::apply);
    }
}
```

This is a **Sequencer pattern**: validate → check uniqueness → hash password → save → generate token. Five steps, clearly defined.

### Step 2: Validated Request

Nested record with the factory method:

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

This is **Fork-Join pattern**: validate three fields independently, collect results. If all succeed, construct ValidRequest. If any fail, collect all errors in CompositeCause.

### Step 3: Value Objects (Business Leaves)

**Email:**
```java
package com.example.app.domain.shared;

import org.pragmatica.lang.*;

public record Email(String value) {
    // private Email {}  // Not yet supported in Java

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

**Leaf pattern**: atomic validation, returns Result<Email>. Parse-don't-validate principle applied.

**Password:**
```java
package com.example.app.domain.shared;

import org.pragmatica.lang.*;

public record Password(String value) {
    // private Password {}  // Not yet supported in Java

    private static final Fn1<Cause, String> TOO_SHORT = Causes.forValue("Password must be at least 8 characters");
    private static final Fn1<Cause, String> MISSING_UPPERCASE = Causes.forValue("Password must contain uppercase letter");
    private static final Fn1<Cause, String> MISSING_DIGIT = Causes.forValue("Password must contain digit");

    public static Result<Password> password(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .flatMap(Verify.ensureFn(TOO_SHORT, Verify.Is::lenBetween, 8, 128))
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
    // private ReferralCode {}  // Not yet supported in Java

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

Returns `Result<Option<ReferralCode>>`: validation can fail (Result), and if successful, value may be absent (Option).

All three live in `com.example.app.domain.shared` because they're reusable across use cases.

### Step 4: Step Interfaces

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
    Promise<UserId> apply(ValidUser user);
}

// Step 4: Generate a confirmation token
public interface GenerateToken {
    Promise<Response> apply(UserId userId);
}
```

Supporting types:
```java
record ValidUser(Email email, HashedPassword hashed, Option<ReferralCode> refCode) {}
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

**Condition pattern**: check if email exists, branch to success or failure.

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

Uses `Result.lift1` to handle potential exceptions from BCrypt.

**SaveUser (adapter leaf):**
```java
class JooqUserRepository implements SaveUser {
    private final DSLContext dsl;

    public Promise<UserId> apply(ValidUser user) {
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

Uses `Promise.lift` to handle JOOQ exceptions, converts to domain Cause.

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

Sealed interface ensures exhaustive pattern matching. Each error is a typed value, not an exception.

### Step 7: Testing

> **Note:** This section shows basic test examples. For comprehensive testing strategy including evolutionary testing, test organization, and utilities, see **[Part 5: Testing Strategy](part-05-testing-strategy.md)**.

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
                .onSuccess(Assertions::fail);
}

@Test
void validRequest_fails_forInvalidReferralCode() {
    var request = new Request("user@example.com", "Valid1234", "abc");

    ValidRequest.validRequest(request)
                .onSuccess(Assertions::fail);
}

@Test
void validRequest_succeeds_forValidInput() {
    var request = new Request("user@example.com", "Valid1234", "ABC123");

    ValidRequest.validRequest(request)
                .onFailure(Assertions::fail)
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

## Project Structure & Package Organization

### Vertical Slicing Philosophy

This technology organizes code around **vertical slices** - each use case is self-contained with its own business logic, validation, and error handling. Unlike architectures that centralize all business logic into one functional core, we **isolate business logic within each use case package**. This creates clear boundaries and prevents coupling between unrelated features.

**Why vertical slicing (by criteria):**
- **Complexity**: Minimizes coupling between unrelated features - each slice independent (+3).
- **Business/Technical Ratio**: Package names reflect domain use cases, not technical layers (+2).
- **Mental Overhead**: All related code in one place - less navigation across packages (+2).
- **Design Impact**: Forces proper boundaries - business logic cannot leak between use cases (+2).

### Package Structure

The standard package layout:

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

## Framework Integration

This technology is framework-agnostic, but you still need to connect it to the real world. Here's how to bridge the functional core to Spring Boot and JOOQ.

### Complete Example: Spring REST → Use Case → JOOQ

**Use Case:** `GetUserProfile` - fetch a user profile by ID.

**Layers:**
1. REST controller (adapter in)
2. Use case (functional core)
3. JOOQ repository (adapter out)

#### 1. Use Case (Functional Core)

```java
package com.example.app.usecase.getuserprofile;

import org.pragmatica.lang.*;

public interface GetUserProfile {
    record Request(String userId) {}
    record Response(String userId, String email, String displayName) {}

    Promise<Response> execute(Request request);

    interface FetchUser {
        Promise<User> apply(UserId userId);
    }

    static GetUserProfile getUserProfile(FetchUser fetchUser) {
        return request -> UserId.userId(request.userId())
                                .async()
                                .flatMap(fetchUser::apply)
                                .map(user -> new Response(
                                    user.id().value(),
                                    user.email().value(),
                                    user.displayName()
                                ));
    }
}
```

Pure business logic. No framework dependencies.

#### 2. REST Controller (Adapter In)

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

Thin adapter: extract path variable → create Request → call use case → map Response/Cause to HTTP.

#### 3. JOOQ Repository (Adapter Out)

**Production example:** This uses the exception handling patterns introduced in Parts 2-3, demonstrating Promise.lift with JOOQ.

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

Wraps JOOQ exceptions in domain Causes. Business logic never sees DataAccessException.

#### 4. Wiring (Spring Config)

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

Spring autowires the repository into the use case factory.

### Summary

- **Controller**: Imperative, thin adapter. Converts HTTP → Request, Response/Cause → HTTP.
- **Use case**: Functional, pure business logic. No framework dependencies.
- **Repository**: Imperative, thin adapter. Converts JOOQ → domain types, exceptions → Cause.

The functional core (use case + domain types) is framework-independent. You could swap Spring for Micronaut, Ktor, or plain Servlets - just rewrite the adapters, not the business logic.

---

## Conclusion

This technology isn't about learning new tools or frameworks. It's about reducing the number of decisions you make so you can focus on the decisions that matter - the business logic.

By constraining return types to exactly four kinds, enforcing parse-don't-validate, eliminating business exceptions, and mandating one pattern per function, we compress the design space. There's essentially one good way to structure a use case, one good way to validate input, one good way to handle errors, one good way to compose async operations.

### The Impact

This compression has compound benefits:

**Code becomes predictable** - you recognize patterns at a glance.

**Refactoring becomes mechanical** - the rules tell you when and how to split functions.

**Technical debt becomes rare** - prevention is built into the structure.

**Business logic becomes clear** - domain concepts aren't buried in framework ceremony or mixed abstraction levels.

### Why This Matters in the AI Era

When AI generates code, it needs a well-defined target structure. When humans read AI-generated code, they need to recognize patterns instantly. When teams collaborate across humans and AI, they need a shared vocabulary that both understand without translation overhead.

The technology is simple: four return types, parse-don't-validate, no business exceptions, one pattern per function, clear package layout, mechanical refactoring. The impact compounds: unified structure, minimal debt, close business modeling, deterministic generation, tooling-friendly code.

### Getting Started

Start small. Pick one use case. Apply the rules. See how it feels. Then expand. The rules stay the same whether you're building a monolith or a microservice, a synchronous API or an event-driven system, a greenfield project or refactoring legacy code.

The goal isn't perfect code. It's code that's easy to understand, easy to change, easy to test, and easy to generate. Code that humans and AI can collaborate on without friction.

Write code that explains itself. Let structure carry intent. Focus on business logic, not technical ceremony.

That's the technology.

---

## Where to Go Next

### Reference Materials

- **[Complete Technical Guide](../CODING_GUIDE.md)**: Full reference with all patterns, rules, and examples
- **[Management Perspective](../MANAGEMENT_PERSPECTIVE.md)**: Business case for structural standardization
- **[Pragmatica Lite Core Library](https://central.sonatype.com/artifact/org.pragmatica-lite/core)**: The foundational library for Option, Result, Promise

### Practice Exercises

1. **Convert an existing use case**: Take a simple REST endpoint and refactor it following the patterns
2. **Build RegisterUser**: Implement the complete example from this guide
3. **Add Aspects**: Wrap a use case with retry, timeout, or metrics decorators
4. **Test functionally**: Replace traditional assertions with onSuccess/onFailure patterns

### Community & Support

- **GitHub Issues**: [Report issues or ask questions](https://github.com/siy/coding-technology/issues)
- **Share your experience**: Document your adoption journey to help others

### Next Level

Once comfortable with the basics:
- Experiment with complex Fork-Join scenarios
- Build custom Aspects for your domain
- Explore vertical slice architecture at scale
- Contribute patterns you've discovered

---

## Final Thoughts

You now have a complete toolkit:
- Four return types that handle every scenario
- Parse-don't-validate for iron-clad domain models
- Six patterns that cover 95% of backend code
- Testing approaches that match functional style
- Package organization for vertical slicing
- Framework integration strategies

The journey from here is practice. Build use cases. Make mistakes. Refactor mechanically. Watch patterns emerge. See how deterministic structure accelerates both human and AI development.

Welcome to the future of backend development. Code that's predictable, testable, and ready for AI collaboration.

---

**Series Navigation**

[← Part 4: Advanced Patterns & Testing](part-04-advanced-patterns.md) | [Series Index](INDEX.md) | [Complete Guide →](../CODING_GUIDE.md)

---

**Version:** 1.0.0 (2025-10-05) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)

**Series Complete!** Return to [Index](INDEX.md) to review any part or see [CODING_GUIDE.md](../CODING_GUIDE.md) for the complete reference.
