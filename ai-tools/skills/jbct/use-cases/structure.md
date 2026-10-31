# Use Case Structure

**Purpose**: Define the anatomy of a JBCT use case with proper structure, naming, and composition.

## Basic Template

```java
@UseCase
public interface UseCaseName {
    // Input from external world
    record Request(String field1, String field2) {}

    // Output to external world
    record Response(String result) {}

    Promise<Response> execute(Request request);

    // Validated input (Valid prefix, not Validated)
    record ValidRequest(ValueObject1 vo1, ValueObject2 vo2) {
        static Result<ValidRequest> validRequest(Request raw) {
            return Result.all(
                ValueObject1.valueObject1(raw.field1()),
                ValueObject2.valueObject2(raw.field2())
            ).map(ValidRequest::new);
        }
    }

    // Steps as single-method interfaces
    interface Step1 { Promise<Intermediate> apply(ValidRequest valid); }
    interface Step2 { Promise<Result> apply(Intermediate intermediate); }

    // Factory method returns lambda
    static UseCaseName useCaseName(Step1 step1, Step2 step2) {
        return request -> ValidRequest.validRequest(request)
            .async()
            .flatMap(step1::apply)
            .flatMap(step2::apply)
            .map(result -> new Response(result.value()));
    }
}
```

## Key Elements

### 1. Interface Declaration

```java
@UseCase
public interface RegisterUser {
    Promise<Response> execute(Request request);    // async use case
    // Result<Response> execute(Request request);  // sync use case
}
```

`@UseCase` anchors the use case in the package tree. There is no marker supertype to extend; the single abstract `execute` method is what the factory's lambda implements.

### 2. Request Record

External input - uses primitive types or strings:

```java
record Request(String email, String password, String referralCode) {}
```

**Not** domain types - validation happens in ValidRequest factory.

### 3. Response Record

External output - can use domain types or primitives:

```java
record Response(UserId userId, ConfirmationToken token) {}
```

### 4. ValidRequest Record

Parsed, validated input with domain types:

```java
record ValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {
    static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(
            Email.email(raw.email()),
            Password.password(raw.password()),
            ReferralCode.referralCode(raw.referralCode())
        ).map(ValidRequest::new);
    }
}
```

**Critical**: Use `Valid` prefix (not `Validated`).

### 5. Step Interfaces

Single-method interfaces for each step:

```java
interface CheckEmailUniqueness { Promise<ValidRequest> apply(ValidRequest valid); }
interface CreateValidUser { Promise<ValidUser> apply(ValidRequest valid); }
interface SaveUser { Promise<User> apply(ValidUser validUser); }
interface GenerateToken { Promise<Response> apply(User user); }
```

**Nested** inside use case interface, each with its own static factory. An I/O step's factory takes the infrastructure and implements the step with a lambda; library types appear only there:

```java
interface SaveUser {
    Promise<User> apply(ValidUser validUser);

    static SaveUser saveUser(DSLContext dsl) { ... }
}
```

When a step outgrows the file, the same interface moves out unchanged (I/O steps to `<usecase>/io/`, business steps to the use case package). No new type is introduced for the move.

### 6. Factory Method

Returns lambda directly (NOT nested record):

```java
// ✅ CORRECT - Returns lambda
static RegisterUser registerUser(CheckEmailUniqueness check, CreateValidUser create, SaveUser save, GenerateToken token) {
    return request -> ValidRequest.validRequest(request)
        .async()
        .flatMap(check::apply)
        .flatMap(create::apply)
        .flatMap(save::apply)
        .flatMap(token::apply);
}

// ❌ WRONG - Nested record implementation
static RegisterUser registerUser(CheckEmailUniqueness check, CreateValidUser create, SaveUser save, GenerateToken token) {
    record registerUser(CheckEmailUniqueness check, CreateValidUser create, SaveUser save, GenerateToken token) implements RegisterUser {
        @Override
        public Promise<Response> execute(Request request) { ... }
    }
    return new registerUser(check, create, save, token);
}
```

**Rule**: Records are for data, lambdas are for behavior.

## Complete Example

```java
@UseCase
public interface RegisterUser {
    record Request(String email, String password, String referralCode) {}

    record Response(UserId userId, ConfirmationToken token) {}

    Promise<Response> execute(Request request);

    record ValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {
        static Result<ValidRequest> validRequest(Request raw) {
            return Result.all(Email.email(raw.email()),
                              Password.password(raw.password()),
                              ReferralCode.referralCode(raw.referralCode()))
                         .map(ValidRequest::new);
        }
    }

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

## Naming Conventions

### Factory Method Name

Lowercase-first, same as type:

```java
RegisterUser.registerUser(...)
GetUserProfile.getUserProfile(...)
PlaceOrder.placeOrder(...)
```

### ValidRequest

Use `Valid` prefix:
- `ValidRequest` ✅
- `ValidCredentials` ✅
- `ValidOrder` ✅
- ~~`ValidatedRequest`~~ ❌

### Step Interfaces

Descriptive action names:
- `CheckEmailUniqueness`
- `SaveUser`
- `LoadProfile`
- `SendNotification`

## Variations

### Sync Use Case

```java
@UseCase
public interface ValidateOrder {
    record Request(String orderId) {}
    record Response(boolean isValid) {}

    Result<Response> execute(Request request);

    interface FindOrder { Result<Order> apply(OrderId orderId); }

    // Factory returns lambda with Result
    static ValidateOrder validateOrder(FindOrder findOrder) {
        return request -> OrderId.orderId(request.orderId())
            .flatMap(findOrder::apply)
            .map(order -> new Response(order.isValid()));
    }
}
```

### No Validation Needed

```java
@UseCase
public interface GetUserById {
    record Request(String userId) {}
    record Response(User user) {}

    Promise<Response> execute(Request request);

    // No ValidRequest - direct parsing
    static GetUserById getUserById(LoadUser loadUser) {
        return request -> UserId.userId(request.userId())
            .async()
            .flatMap(loadUser::apply)
            .map(Response::new);
    }
}
```

### Multiple Valid Records

```java
@UseCase
public interface TransferMoney {
    record Request(String fromAccount, String toAccount, String amount) {}

    record ValidAccounts(AccountId from, AccountId to) {
        static Result<ValidAccounts> validAccounts(String from, String to) {
            return Result.all(AccountId.accountId(from),
                             AccountId.accountId(to))
                         .map(ValidAccounts::new);
        }
    }

    record ValidAmount(Money amount) {
        static Result<ValidAmount> validAmount(String raw) {
            return Money.money(raw).map(ValidAmount::new);
        }
    }

    // Combine both
    record ValidRequest(ValidAccounts accounts, ValidAmount amount) {
        static Result<ValidRequest> validRequest(Request raw) {
            return Result.all(
                ValidAccounts.validAccounts(raw.fromAccount(), raw.toAccount()),
                ValidAmount.validAmount(raw.amount())
            ).map(ValidRequest::new);
        }
    }
}
```

## Assembly

Endpoints and assembly are generated by the runtime; there are no hand-written controllers or configuration classes.

### Plain Java and Tests

Assembly is a call at the root that passes each step's factory result - the only place I/O factories are called:

```java
var registerUser = RegisterUser.registerUser(CheckEmailUniqueness.checkEmailUniqueness(FindUser.findUser(dsl)),
                                             CreateValidUser.createValidUser(HashPassword.hashPassword(encoder)),
                                             SaveUser.saveUser(dsl),
                                             GenerateToken.generateToken(httpClient));
```

A test passes lambdas instead: `RegisterUser.registerUser(valid -> Promise.success(valid), ...)`.

## Anti-Patterns

### ❌ Nested Record in Factory

```java
// DON'T
static RegisterUser registerUser(CheckEmailUniqueness check, CreateValidUser create, SaveUser save, GenerateToken token) {
    record registerUser(CheckEmailUniqueness check, CreateValidUser create, SaveUser save, GenerateToken token) implements RegisterUser {
        @Override
        public Promise<Response> execute(Request request) { ... }
    }
    return new registerUser(check, create, save, token);
}
```

### ❌ Public ValidRequest Constructor

```java
// DON'T
record ValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {
    // Public constructor allows bypassing validation!
}
```

### ❌ Framework Dependencies in Use Case

```java
// DON'T
public interface RegisterUser {
    @Autowired
    private DSLContext dsl;  // Framework coupling!
}
```

### ❌ Business Logic in Factory

```java
// DON'T
static RegisterUser registerUser(SaveUser saveUser) {
    return request -> {
        // Complex business logic here - extract to steps!
        if (request.email().contains("@")) {
            ...
        }
    };
}
```

## Related

- [complete-example.md](complete-example.md) - Full RegisterUser walkthrough
- [../patterns/sequencer.md](../patterns/sequencer.md) - Composition pattern
- [../fundamentals/parse-dont-validate.md](../fundamentals/parse-dont-validate.md) - ValidRequest pattern
