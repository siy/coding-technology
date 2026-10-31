# Complete Use Case Example: RegisterUser

Complete walkthrough of implementing a user registration use case from start to finish.

## Requirements

- Accept email, password and an optional referral code
- Validate email format, password strength and referral code
- Check email not already registered
- Create the user with a hashed password
- Save user to database
- Generate a confirmation token
- Return user ID and confirmation token

## Step 1: Define Use Case Interface

```java
package com.example.app.registeruser;

import org.pragmatica.lang.Promise;
import org.pragmatica.lang.Result;

@UseCase
public interface RegisterUser {
    record Request(String email, String password, String referralCode) {}

    record Response(UserId userId, ConfirmationToken token) {}

    Promise<Response> execute(Request request);
}
```

## Step 2: Create Value Objects

### Email

```java
package com.example.app.shared;

public record Email(String value) {
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    private static final Fn1<Cause, String> INVALID_EMAIL =
        Causes.forOneValue("Invalid email: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::present)
            .map(String::trim)
            .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
            .map(Email::new);
    }
}
```

### Password

```java
package com.example.app.shared;

public record Password(String value) {
    private static final int MIN_LENGTH = 8;
    private static final Pattern HAS_DIGIT = Pattern.compile(".*\\d.*");
    private static final Pattern HAS_UPPER = Pattern.compile(".*[A-Z].*");

    private static final Cause TOO_SHORT =
        Causes.cause("Password too short (min " + MIN_LENGTH + ")");
    private static final Cause NO_DIGIT =
        Causes.cause("Password must contain digit");
    private static final Cause NO_UPPER =
        Causes.cause("Password must contain uppercase letter");

    public static Result<Password> password(String raw) {
        return Verify.ensure(raw, Verify.Is::present)
            .map(String::trim)
            .filter(TOO_SHORT, s -> s.length() >= MIN_LENGTH)
            .filter(NO_DIGIT, HAS_DIGIT.asMatchPredicate())
            .filter(NO_UPPER, HAS_UPPER.asMatchPredicate())
            .map(Password::new);
    }
}
```

### UserId

```java
package com.example.app.shared;

import org.pragmatica.lang.parse.Network;

public record UserId(UUID value) {
    public static Result<UserId> userId(String raw) {
        return Network.parseUUID(raw)
            .map(UserId::new);
    }

    public static UserId random() {
        return new UserId(UUID.randomUUID());
    }
}
```

## Step 3: Create ValidRequest

```java
@UseCase
public interface RegisterUser {
    // ... Request, Response ...

    record ValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {
        static Result<ValidRequest> validRequest(Request raw) {
            return Result.all(Email.email(raw.email()),
                              Password.password(raw.password()),
                              ReferralCode.referralCode(raw.referralCode()))
                         .map(ValidRequest::new);
        }
    }
}
```

## Step 4: Define Steps

```java
@UseCase
public interface RegisterUser {
    // ... records ...

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
}
```

## Step 5: Implement Factory Method

```java
@UseCase
public interface RegisterUser {
    // ... all records and interfaces ...

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

## Step 6: Implement the Step Factories

Each step's static factory is its implementation. An I/O step's factory takes the infrastructure and implements the step with a lambda; the library types and `lift` appear only inside these factories, and the use case's factory above never sees them. Where a step needs both a lookup and a decision, the lookup is a nested I/O leaf and the decision stays in the step's business code.

```java
@UseCase
public interface RegisterUser {
    // ... records, execute, factory ...

    interface CheckEmailUniqueness {
        Promise<ValidRequest> apply(ValidRequest valid);

        interface FindUser {
            Promise<Option<User>> apply(Email email);

            static FindUser findUser(DSLContext dsl) {
                return email -> Promise.lift(t -> RegistrationError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
                                             () -> dsl.selectFrom(USERS)
                                                      .where(USERS.EMAIL.eq(email.value()))
                                                      .fetchOptional()
                                                      .map(FindUser::toUser))
                                   .map(Option::from);
            }
        }

        static CheckEmailUniqueness checkEmailUniqueness(FindUser findUser) {
            return valid -> findUser.apply(valid.email())
                                    .flatMap(user -> checkPresence(user, valid));
        }

        static Promise<ValidRequest> checkPresence(Option<User> user, ValidRequest valid) {
            return user.isPresent()
                   ? RegistrationError.General.EMAIL_ALREADY_REGISTERED.promise()
                   : Promise.success(valid);
        }
    }

    interface CreateValidUser {
        Promise<ValidUser> apply(ValidRequest valid);

        interface HashPassword {
            Result<HashedPassword> apply(Password password);

            static HashPassword hashPassword(BCryptPasswordEncoder encoder) {
                return password -> Result.lift1(t -> RegistrationError.PasswordHashingFailed.FACTORY.apply(Causes.fromThrowable(t)),
                                                encoder::encode,
                                                password.value())
                                         .map(HashedPassword::new);
            }
        }

        static CreateValidUser createValidUser(HashPassword hashPassword) {
            return valid -> hashPassword.apply(valid.password())
                                        .map(hashed -> new ValidUser(valid.email(), hashed, valid.referralCode()))
                                        .async();
        }
    }

    interface SaveUser {
        Promise<User> apply(ValidUser validUser);

        static SaveUser saveUser(DSLContext dsl) {
            return user -> Promise.lift(t -> RegistrationError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
                                        () -> insertUser(dsl, user));
        }

        private static User insertUser(DSLContext dsl, ValidUser user) {
            var userId = UserId.random();

            dsl.insertInto(USERS)
               .set(USERS.ID, userId.value())
               .set(USERS.EMAIL, user.email().value())
               .set(USERS.PASSWORD_HASH, user.hashed().value())
               .set(USERS.REFERRAL_CODE, user.refCode().map(ReferralCode::value).or(null))
               .execute();
            return new User(userId, user.email());
        }
    }

    interface GenerateToken {
        Promise<Response> apply(User user);

        static GenerateToken generateToken(HttpClient httpClient) {
            return user -> httpClient.post("/tokens/confirm", Map.of("userId", user.id().value().toString()))
                                     .map(resp -> new Response(user.id(), new ConfirmationToken(resp.get("token"))))
                                     .mapError(RegistrationError.TokenGenerationFailed.FACTORY);
        }
    }
}
```

The errors are the use case's own sealed `Cause`. Each `FACTORY` is `public`, because a step that moves to `registeruser/io/` references it from another package:

```java
package com.example.app.registeruser;

public sealed interface RegistrationError extends Cause {
    enum General implements RegistrationError {
        EMAIL_ALREADY_REGISTERED("Email already registered");

        private final String message;

        General(String message) {
            this.message = message;
        }

        @Override
        public String message() {
            return message;
        }
    }

    record PasswordHashingFailed(Cause origin, String message) implements RegistrationError, Cause.Wrapped {
        public static final Fn1<PasswordHashingFailed, Cause> FACTORY =
            Causes.forOneValue("Password hashing failed", PasswordHashingFailed::new);
    }

    record TokenGenerationFailed(Cause origin, String message) implements RegistrationError, Cause.Wrapped {
        public static final Fn1<TokenGenerationFailed, Cause> FACTORY =
            Causes.forOneValue("Token generation failed", TokenGenerationFailed::new);
    }

    record DatabaseFailure(Cause origin, String message) implements RegistrationError, Cause.Wrapped {
        public static final Fn1<DatabaseFailure, Cause> FACTORY =
            Causes.forOneValue("Database operation failed", DatabaseFailure::new);
    }
}
```

When a step outgrows the file - it needs a row mapper, a wire record, an error type of its own - the same interface moves to `registeruser/io/` unchanged, carrying its factory. No new type is introduced to extract it.

## Step 7: Assemble Use Case

Endpoints and assembly are generated by the runtime. In a plain Java program, assembly is one call at the root - the only place that calls the I/O factories:

```java
var registerUser = RegisterUser.registerUser(CheckEmailUniqueness.checkEmailUniqueness(FindUser.findUser(dsl)),
                                             CreateValidUser.createValidUser(HashPassword.hashPassword(encoder)),
                                             SaveUser.saveUser(dsl),
                                             GenerateToken.generateToken(httpClient));
```

## Step 8: Endpoints

There is no hand-written controller. The runtime generates the inbound endpoint from the use case's `Request`/`Response` and maps its typed errors (`RegistrationError.General.EMAIL_ALREADY_REGISTERED`, validation failures) to responses.

## Step 9: Write Tests

Tests pass lambdas for the steps; no I/O factory is called.

```java
class RegisterUserTest {
    @Test
    void execute_succeeds_withValidInput() {
        var useCase = RegisterUser.registerUser(valid -> Promise.success(valid),
                                                valid -> Promise.success(new ValidUser(valid.email(),
                                                                                       new HashedPassword("hashed"),
                                                                                       valid.referralCode())),
                                                validUser -> Promise.success(testUser()),
                                                user -> Promise.success(new Response(user.id(), testToken())));

        useCase.execute(validRequest())
               .await()
               .onFailure(Assertions::fail)
               .onSuccess(response -> {
                   assertNotNull(response.userId());
                   assertNotNull(response.token());
               });
    }

    @Test
    void execute_fails_whenEmailInvalid() {
        var request = new RegisterUser.Request("invalid", "ValidPass123", null);

        useCase.execute(request)
               .await()
               .onSuccess(Assertions::fail);
    }

    @Test
    void execute_fails_whenPasswordWeak() {
        var request = new RegisterUser.Request("test@example.com", "weak", null);

        useCase.execute(request)
               .await()
               .onSuccess(Assertions::fail);
    }

    @Test
    void execute_fails_whenEmailExists() {
        RegisterUser.CheckEmailUniqueness checkEmail = valid -> RegistrationError.General.EMAIL_ALREADY_REGISTERED.promise();

        var useCase = RegisterUser.registerUser(checkEmail, ...);

        useCase.execute(validRequest())
               .await()
               .onSuccess(Assertions::fail);
    }
}
```

## Project Structure

```
com.example.app/
├── registeruser/
│   ├── RegisterUser.java (@UseCase interface + all nested types, step factories included)
│   └── RegistrationError.java (sealed error interface)
└── shared/
    ├── Email.java
    ├── Password.java
    └── UserId.java
```

Once a step outgrows the file it moves out unchanged: `registeruser/io/SaveUser.java` for an I/O step, `registeruser/` for a business step, and to the `io` or `shared` package at the lowest common ancestor when a second use case needs it.

## Related

- [structure.md](structure.md) - Use case anatomy
- [../patterns/sequencer.md](../patterns/sequencer.md) - Composition pattern
- [../testing/patterns.md](../testing/patterns.md) - Testing strategies
- [../project-structure/organization.md](../project-structure/organization.md) - Package layout and step placement
