# Chapter 12: Complete Example - RegisterUser

## What You'll Learn

- Complete use case from requirements to implementation
- How all patterns work together in practice
- Step-by-step evolutionary development

**Prerequisites:** [Chapter 11: Testing in Practice](ch11-testing-practice.md)

---

## Requirements

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

---

## Step 1: Use Case Interface

```java
package com.example.app.usecase.registeruser;

import org.pragmatica.lang.*;

public interface RegisterUser {
    record Request(String email, String password, String referralCode) {}
    record Response(UserId userId, ConfirmationToken token) {}

    Promise<Response> execute(Request request);

    interface CheckEmailUniqueness {
        Promise<ValidRequest> apply(ValidRequest valid);
    }

    interface CreateValidUser {
        Promise<ValidUser> apply(ValidRequest valid);
    }

    interface SaveUser {
        Promise<User> apply(ValidUser validUser);
    }

    interface GenerateToken {
        Promise<Response> apply(User user);
    }

    static RegisterUser registerUser(CheckEmailUniqueness checkEmail,
                                     CreateValidUser createValidUser,
                                     SaveUser saveUser,
                                     GenerateToken generateToken) {
        return request -> ValidRequest.validRequest(request)
                                      .async()
                                      .flatMap(checkEmail::apply)
                                      .flatMap(createValidUser::apply)
                                      .flatMap(saveUser::apply)
                                      .flatMap(generateToken::apply);
    }
}
```

This is a **Sequencer pattern**: validate -> check uniqueness -> create user -> save -> generate token.

---

## Step 2: Validated Request

```java
record ValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {

    public static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()),
                          ReferralCode.referralCode(raw.referralCode()))
                     .map(ValidRequest::new);
    }
}
```

This is **Fork-Join pattern**: validate three fields independently, collect results.

---

## Step 3: Value Objects

**Email:**
```java
package com.example.app.domain.shared;

public record Email(String value) {
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL =
        Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
                     .map(String::trim)
                     .map(String::toLowerCase)
                     .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
                     .map(Email::new);
    }
}
```

**Password:**
```java
public record Password(String value) {
    private static final Cause TOO_SHORT =
        Causes.cause("Password must be at least 8 characters");
    private static final Cause MISSING_UPPERCASE =
        Causes.cause("Password must contain uppercase letter");
    private static final Cause MISSING_DIGIT =
        Causes.cause("Password must contain digit");

    public static Result<Password> password(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
                     .filter(TOO_SHORT, s -> Verify.Is.lenBetween(s, 8, 128))
                     .flatMap(Password::ensureUppercase)
                     .flatMap(Password::ensureDigit)
                     .map(Password::new);
    }

    private static Result<String> ensureUppercase(String raw) {
        return contains(raw, Character::isUpperCase)
                ? Result.success(raw)
                : MISSING_UPPERCASE.result();
    }

    private static Result<String> ensureDigit(String raw) {
        return contains(raw, Character::isDigit)
                ? Result.success(raw)
                : MISSING_DIGIT.result();
    }

    private static boolean contains(CharSequence sequence, IntPredicate predicate) {
        return sequence.chars().anyMatch(predicate);
    }
}
```

**ReferralCode (optional-with-validation):**
```java
public record ReferralCode(String value) {
    private static final Pattern PATTERN = Pattern.compile("^[A-Z0-9]{6}$");
    private static final Cause INVALID_FORMAT = Causes.cause("Invalid referral code format");

    public static Result<Option<ReferralCode>> referralCode(String raw) {
        return Verify.ensureOption(
            Option.option(raw).map(String::trim).filter(s -> !s.isEmpty()),
            PATTERN.asMatchPredicate(),
            INVALID_FORMAT
        ).map(opt -> opt.map(ReferralCode::new));
    }

    public boolean isPremium() {
        return value.startsWith("VIP");
    }
}
```

The `Verify.ensureOption()` method (Pragmatica Lite 0.9.0+) handles `Result<Option<ReferralCode>>` elegantly: if the `Option` is empty, succeeds with `Option.none()`; if present and valid, succeeds with `Option.some(value)`; if present and invalid, fails.

---

## Step 4: Step Implementations

**CheckEmailUniqueness (adapter leaf):**
```java
interface CheckEmailUniqueness {
    Promise<ValidRequest> apply(ValidRequest request);

    static CheckEmailUniqueness checkEmailUniqueness(UserRepository repository) {
        return request -> repository.findByEmail(request.email())
                                    .flatMap(user -> checkPresence(user, request));
    }

    static Promise<ValidRequest> checkPresence(Option<User> user, ValidRequest request) {
        return user.isPresent()
                ? RegistrationError.General.EMAIL_ALREADY_REGISTERED.promise()
                : Promise.success(request);
    }
}
```

**HashPassword (business leaf):**
```java
interface HashPassword {
    Result<HashedPassword> apply(Password password);

    static HashPassword hashPassword(BCryptPasswordEncoder encoder) {
        return password -> Result.lift1(RegistrationError.PasswordHashingFailed::new,
                                        encoder::encode,
                                        password.value())
                                 .map(HashedPassword::new);
    }
}
```

**SaveUser (adapter leaf):**
```java
class JooqUserRepository implements SaveUser {
    private final DSLContext dsl;

    public Promise<User> apply(ValidUser user) {
        return Promise.lift(RepositoryError.DatabaseFailure::cause,
                            () -> saveUser(user));
    }

    private User saveUser(ValidUser user) {
        String id = dsl.insertInto(USERS)
                       .set(USERS.EMAIL, user.email().value())
                       .set(USERS.PASSWORD_HASH, user.hashed().value())
                       .set(USERS.REFERRAL_CODE,
                            user.refCode().map(ReferralCode::value).orElse(null))
                       .returningResult(USERS.ID)
                       .fetchSingle()
                       .value1();

        return new User(new UserId(id), user.email());
    }
}
```

**GenerateToken (adapter leaf):**
```java
class TokenServiceClient implements GenerateToken {
    private final HttpClient httpClient;

    public Promise<Response> apply(User user) {
        return httpClient.post("/tokens/confirm",
                               Map.of("userId", user.id().value()))
                         .map(resp -> buildResponse(user.id(), resp))
                         .recover(this::mapTokenError);
    }

    private Response buildResponse(UserId userId, Map<String, String> resp) {
        return new Response(userId, new ConfirmationToken(resp.get("token")));
    }

    private Promise<Response> mapTokenError(Cause cause) {
        return RegistrationError.General.TOKEN_GENERATION_FAILED.promise();
    }
}
```

---

## Step 5: Error Types

```java
public sealed interface RegistrationError extends Cause {
    enum General implements RegistrationError {
        EMAIL_ALREADY_REGISTERED("Email already registered"),
        WEAK_PASSWORD_FOR_PREMIUM("Premium codes require 10+ char passwords"),
        TOKEN_GENERATION_FAILED("Token generation failed");

        private final String message;

        General(String message) {
            this.message = message;
        }

        @Override
        public String message() {
            return message;
        }
    }

    record PasswordHashingFailed(Throwable cause) implements RegistrationError {
        @Override
        public String message() {
            return "Password hashing failed: " + Causes.fromThrowable(cause);
        }
    }
}
```

Sealed interface ensures exhaustive pattern matching.

---

## Step 6: Tests

**Validation tests:**
```java
@Test
void validRequest_fails_forInvalidEmail() {
    var request = new Request("not-an-email", "Valid1234", null);

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

**Happy path test:**
```java
@Test
void execute_succeeds_forValidInput() {
    CheckEmailUniqueness checkEmail = req -> Promise.success(req);
    CreateValidUser createUser = req -> Promise.success(
        new ValidUser(req.email(), new HashedPassword("hashed"), req.referralCode()));
    SaveUser saveUser = user -> Promise.success(new User(new UserId("user-123"), user.email()));
    GenerateToken generateToken = user -> Promise.success(
        new Response(user.id(), new ConfirmationToken("token-456")));

    var useCase = RegisterUser.registerUser(checkEmail, createUser, saveUser, generateToken);
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
        RegistrationError.General.EMAIL_ALREADY_REGISTERED.promise();
    // ... other stubs

    useCase.execute(request)
          .await()
          .onSuccess(Assertions::fail);
}
```

---

## Pattern Summary

| Component | Pattern | Purpose |
|-----------|---------|---------|
| RegisterUser.execute | Sequencer | Chain dependent steps |
| ValidRequest.validRequest | Fork-Join | Validate independent fields |
| Email.email | Leaf | Atomic validation |
| Password.password | Leaf | Atomic validation with Sequencer internally |
| CheckEmailUniqueness | Leaf + Condition | Database check with branching |
| SaveUser | Adapter Leaf | Database write |
| RegistrationError | Sealed Interface | Typed error hierarchy |

---

## Key Takeaways

1. **Use case interface** - Contains factory, step interfaces, types
2. **Sequencer for main flow** - Chain steps with flatMap
3. **Fork-Join for validation** - Accumulate errors with Result.all()
4. **Value objects as Leaves** - Parse-don't-validate
5. **Adapters implement step interfaces** - JOOQ, HTTP clients
6. **Tests use stubs** - Only adapters stubbed

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 5.1: Extend RegisterUser with email verification
- Exercise 5.3: Add premium referral validation

---

## What's Next

[Chapter 13](ch13-placeorder-example.md) presents another complete example - PlaceOrder - demonstrating more complex patterns including Fork-Join for parallel data fetching.
