# Parse, Don't Validate

**Core Principle**: Validation is parsing. If an object instance exists, it must be valid.

> `Email` below is a *teaching example* for the pattern. In production code, use the built-in
> `org.pragmatica.lang.vo.Email` (see `vo/package-info.java` for the full built-in VO catalog);
> hand-roll only domain-specific types.

## The Pattern

**Traditional validation** (❌ Wrong):
```java
public record Email(String value) {
    public Result<Email> validate() {
        if (value == null || !value.matches(PATTERN)) {
            return EmailError.Invalid.INSTANCE.result();
        }
        return Result.success(this);
    }
}

// Problem: Can construct invalid emails
Email bad = new Email(null);  // Compiles, but invalid!
```

**Parse, Don't Validate** (✅ Correct), from the book:

<!-- book:pdv-approach -->
```java
// DO: Validation IS construction
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Fn1<Cause, String> INVALID_EMAIL =
        Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::present)
                     .map(String::trim)
                     .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
                     .map(Email::new);
    }
}

// Client code gets the Result:
Result<Email> result = Email.email(input);
// If this is a Success, the Email is valid. Guaranteed.
```

The static factory `email()`, which returns `Result<Email>`, is the only intended way to get an `Email`. If you have an `Email` that came through it, it's valid - no separate check needed.

> **Note:** As of current Java versions, records do not support declaring the canonical constructor as private. Rely on team discipline and code review to ensure value objects are only constructed through their factory methods. Direct `new Email(...)` calls stand out immediately and are easy to catch.

> **Library Value Objects:** For common types like email, URL, and UUID, Pragmatica Core provides production-ready implementations in `org.pragmatica.lang.vo`. The examples in this chapter demonstrate the *pattern* — for production use, prefer the library VOs over hand-rolled versions.
<!-- /book:pdv-approach -->

## Key Elements

### 1. The Factory Is the Only Intended Path

A record's canonical constructor cannot be made private: it must be at least as accessible as
the record, so `private Email {}` (or a package-private `Email {}` in a public record) is a
compile error. Nothing stops `new Email(...)`; the guarantee comes from discipline and review.
A direct `new Email(...)` outside the factory is easy to spot and is the thing to flag.

### 2. Static Factory Method

Factory named after type (lowercase-first):

```java
public static Result<Email> email(String raw) { ... }
public static Result<Password> password(String raw) { ... }
public static Result<UserId> userId(String raw) { ... }
```

### 3. Validation = Construction

All validation happens during parsing:

```java
public static Result<Email> email(String raw) {
    return Verify.ensure(raw, Verify.Is::present)         // Check not null/blank
        .map(String::trim)                               // Normalize
        .filter(INVALID_EMAIL,                           // Validate format
                EMAIL_PATTERN.asMatchPredicate())
        .map(Email::new);                                // Construct only if valid
}
```

## Complete Examples

### Simple Value Object

```java
public record UserId(UUID value) {
    private static final Cause USER_ID_REQUIRED = Causes.cause("User ID is required");

    public static Result<UserId> userId(String raw) {
        return Verify.ensure(raw, Verify.Is::present, USER_ID_REQUIRED)
            .map(String::trim)
            .flatMap(UserId::parseUuid)
            .map(UserId::new);
    }

    public static Result<UserId> userId(UUID value) {
        return Verify.ensure(value, Verify.Is::notNull, USER_ID_REQUIRED)
            .map(UserId::new);
    }

    // The parse failure is carried, not replaced: mapError uses its argument
    private static Result<UUID> parseUuid(String raw) {
        return Network.parseUUID(raw)
            .mapError(cause -> Causes.cause("Invalid user ID: " + raw, Option.some(cause)));
    }
}
```

### Complex Value Object with Multiple Rules

```java
public record Password(String value) {
    private static final int MIN_LENGTH = 8;
    private static final Pattern HAS_DIGIT = Pattern.compile(".*\\d.*");
    private static final Pattern HAS_UPPER = Pattern.compile(".*[A-Z].*");

    private static final Cause TOO_SHORT =
        Causes.cause("Password too short (min " + MIN_LENGTH + ")");
    private static final Cause NO_DIGIT =
        Causes.cause("Password must contain digit");
    private static final Cause NO_UPPER =
        Causes.cause("Password must contain uppercase");

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

### Composite Value Object

```java
public record Credentials(Email email, Password password) {
    public static Result<Credentials> credentials(String emailRaw, String passwordRaw) {
        return Result.all(Email.email(emailRaw),
                         Password.password(passwordRaw))
                     .map(Credentials::new);
    }
}
```

## Naming Conventions

### Factory Methods

Named after type, lowercase-first:

```java
Email.email(String)
Password.password(String)
UserId.userId(String)
OrderId.orderId(Long)
```

### Error Causes

Use constants with descriptive names:

```java
private static final Fn1<Cause, String> INVALID_EMAIL =
    Causes.forOneValue("Invalid email: %s");

private static final Cause TOO_SHORT =
    Causes.cause("Password too short");
```

## Validated Inputs

Apply same pattern to use case inputs:

```java
public interface RegisterUser {
    record Request(String email, String password) {}

    // Validated input with Valid prefix
    record ValidRequest(Email email, Password password) {
        // Factory method
        static Result<ValidRequest> validRequest(Request raw) {
            return Result.all(Email.email(raw.email()),
                             Password.password(raw.password()))
                         .map(ValidRequest::new);
        }
    }
}
```

**Naming**: Use `Valid` prefix (not `Validated`):
- `ValidRequest` ✅
- `ValidUser` ✅
- `ValidCredentials` ✅
- ~~`ValidatedRequest`~~ ❌

## Benefits

### Type Safety

```java
// The intended way in - and the only one review should let through
Result<Email> result = Email.email("test@example.com");
result.onSuccess(validEmail -> {
    // validEmail is guaranteed valid here
});
```

### Composability

```java
// Combine validated values
Result<ValidRequest> validated =
    Result.all(Email.email(emailRaw),
              Password.password(passwordRaw),
              UserId.userId(userIdRaw))
          .map(ValidRequest::new);
```

### No Defensive Checks

```java
public void sendEmail(Email to, String subject) {
    // No need to check if 'to' is valid - type guarantees it
    emailService.send(to.value(), subject);
}
```

### Clear Error Aggregation

```java
Result<ValidRequest> result = ValidRequest.validRequest(request);

result.onFailure(cause -> {
    if (cause instanceof CompositeCause composite) {
        // Multiple validation failures collected
        composite.causes().forEach(System.err::println);
    }
});
```

## Common Patterns

### Optional Fields

From the book: a field that is optional but must be valid when present is `Result<Option<T>>`,
built with `Verify.ensureOption()` - never `Option<Result<T>>`.

<!-- book:optional-fields -->
What if a field is optional but must be valid when present? Use `Result<Option<T>>` with `Verify.ensureOption()`:

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
}
```

The `Verify.ensureOption()` method (Pragmatica Core 0.9.0+) handles this pattern elegantly:
- If the `Option` is empty, succeeds with `Option.none()` - no validation needed
- If present and valid, succeeds with `Option.some(value)`
- If present and invalid, fails with the provided cause

**Caller semantics:**
- `Failure(cause)`: Invalid input (provided but doesn't match pattern)
- `Success(None)`: No value provided (valid state)
- `Success(Some(code))`: Valid code provided
<!-- /book:optional-fields -->

### Collections

```java
public record OrderItems(List<Item> items) {
    private static final Cause NO_ITEMS = Causes.cause("Order must have at least one item");

    public static Result<OrderItems> orderItems(List<String> rawItems) {
        // Validate each item
        List<Result<Item>> itemResults = rawItems.stream()
            .map(Item::item)
            .toList();

        // Collect all results
        return Result.allOf(itemResults)
            .filter(NO_ITEMS, list -> !list.isEmpty())
            .map(OrderItems::new);
    }
}
```

## Anti-Patterns

### ❌ Separate Validation Method

```java
// DON'T DO THIS
public record Email(String value) {
    public Result<Email> validate() { ... }  // Wrong!
}
```

### ❌ Public Constructor with Invalid States

```java
// DON'T DO THIS
public record Email(String value) {
    public Email {  // Public constructor
        if (value == null) {
            throw new IllegalArgumentException();  // Runtime failure
        }
    }
}
```

### ❌ Mutable Validation State

```java
// DON'T DO THIS
public class Email {
    private String value;
    private boolean valid = false;

    public void validate() {
        valid = checkFormat(value);
    }
}
```

## Related

- [four-return-kinds.md](four-return-kinds.md) - Using Result<T> for validation
- [no-business-exceptions.md](no-business-exceptions.md) - Typed failures instead of exceptions
- [../use-cases/structure.md](../use-cases/structure.md) - ValidRequest pattern
- [../testing/patterns.md](../testing/patterns.md) - Testing value objects
