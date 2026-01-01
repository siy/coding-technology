---
tags: [java, ddd, designpatterns, cleancode]
canonical_url: https://pragmatica.dev/value-objects-cookbook
description: Practical patterns for building value objects with validation, normalization, and cross-field rules
published: true
---

# Value Objects in Practice: From Theory to Copyable Code

**A cookbook for validation, normalization, and cross-field rules**

---

## What's a Value Object?

A value object is an object defined by its attributes, not its identity. Two `Email` objects with the same value are equal, regardless of where they were created.

More importantly for us: **value objects are the perfect place to encapsulate validation**.

```java
// Instead of passing raw strings everywhere
void sendEmail(String email, String subject, String body)

// Pass validated value objects
void sendEmail(Email email, Subject subject, Body body)
```

With value objects, if you have an `Email`, it's valid. Period.

---

## Recipe 1: Simple Validated Value Object

The basic pattern for value objects with validation:

```java
public record Email(String value) {
    private static final Pattern PATTERN =
        Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    private static final Cause EMAIL_REQUIRED =
        Causes.cause("Email is required");
    private static final Fn1<Cause, String> INVALID_FORMAT =
        Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull, EMAIL_REQUIRED)
            .filter(INVALID_FORMAT, PATTERN.asMatchPredicate())
            .map(Email::new);
    }
}
```

**Key elements:**
- Factory method `email()` returns `Result<Email>`, not `Email`
- Validation happens inside the factory
- Error messages are constants (not created per call)
- Constructor is not exposed publicly (team discipline until Java supports private record constructors)

**Usage:**
```java
Email.email("user@example.com")
    .onSuccess(email -> sendWelcome(email))
    .onFailure(cause -> log.warn("Invalid email: {}", cause.message()));
```

---

## Recipe 2: Value Object with Normalization

Often you want to normalize data during construction:

```java
public record Email(String value) {
    private static final Pattern PATTERN =
        Pattern.compile("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$");

    private static final Cause EMAIL_REQUIRED = Causes.cause("Email is required");
    private static final Fn1<Cause, String> INVALID_FORMAT =
        Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull, EMAIL_REQUIRED)
            .map(String::trim)           // Remove whitespace
            .map(String::toLowerCase)    // Normalize case
            .filter(INVALID_FORMAT, PATTERN.asMatchPredicate())
            .map(Email::new);
    }
}
```

Now `"  USER@Example.COM  "` becomes `"user@example.com"`. Every `Email` in your system is normalized identically.

**Common normalizations:**
- `String::trim` -- remove leading/trailing whitespace
- `String::toLowerCase` -- normalize case
- `String::toUpperCase` -- for codes, identifiers
- Custom: strip special characters, format phone numbers, etc.

---

## Recipe 3: Numeric Range Validation

For numbers with constraints:

```java
public record Age(int value) {
    private static final Cause AGE_REQUIRED = Causes.cause("Age is required");
    private static final Cause AGE_OUT_OF_RANGE =
        Causes.cause("Age must be between 0 and 150");

    public static Result<Age> age(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull, AGE_REQUIRED)
            .flatMap(Number::parseInt)  // Uses parse utility
            .filter(AGE_OUT_OF_RANGE, v -> Verify.Is.between(v, 0, 150))
            .map(Age::new);
    }

    public static Result<Age> age(int value) {
        return Verify.ensure(value, Verify.Is::between, 0, 150, AGE_OUT_OF_RANGE)
            .map(Age::new);
    }
}
```

Note the two factory methods: one for parsing strings (from user input), one for known integers (from database).

---

## Recipe 4: Length-Constrained Strings

For strings with length requirements:

```java
public record Username(String value) {
    private static final int MIN_LENGTH = 3;
    private static final int MAX_LENGTH = 30;
    private static final Pattern VALID_CHARS = Pattern.compile("^[a-zA-Z0-9_-]+$");

    private static final Cause USERNAME_REQUIRED =
        Causes.cause("Username is required");
    private static final Cause USERNAME_TOO_SHORT =
        Causes.cause("Username must be at least " + MIN_LENGTH + " characters");
    private static final Cause USERNAME_TOO_LONG =
        Causes.cause("Username must be at most " + MAX_LENGTH + " characters");
    private static final Cause INVALID_CHARACTERS =
        Causes.cause("Username can only contain letters, numbers, underscores, and hyphens");

    public static Result<Username> username(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull, USERNAME_REQUIRED)
            .map(String::trim)
            .filter(USERNAME_TOO_SHORT, s -> s.length() >= MIN_LENGTH)
            .filter(USERNAME_TOO_LONG, s -> s.length() <= MAX_LENGTH)
            .filter(INVALID_CHARACTERS, VALID_CHARS.asMatchPredicate())
            .map(Username::new);
    }
}
```

---

## Recipe 5: Password with Multiple Rules

When you have multiple validation rules that should all be checked:

```java
public record Password(String value) {
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;

    private static final Cause PASSWORD_REQUIRED =
        Causes.cause("Password is required");
    private static final Cause TOO_SHORT =
        Causes.cause("Password must be at least " + MIN_LENGTH + " characters");
    private static final Cause TOO_LONG =
        Causes.cause("Password must be at most " + MAX_LENGTH + " characters");
    private static final Cause MISSING_UPPERCASE =
        Causes.cause("Password must contain an uppercase letter");
    private static final Cause MISSING_LOWERCASE =
        Causes.cause("Password must contain a lowercase letter");
    private static final Cause MISSING_DIGIT =
        Causes.cause("Password must contain a digit");

    public static Result<Password> password(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull, PASSWORD_REQUIRED)
            .filter(TOO_SHORT, s -> s.length() >= MIN_LENGTH)
            .filter(TOO_LONG, s -> s.length() <= MAX_LENGTH)
            .filter(MISSING_UPPERCASE, s -> s.chars().anyMatch(Character::isUpperCase))
            .filter(MISSING_LOWERCASE, s -> s.chars().anyMatch(Character::isLowerCase))
            .filter(MISSING_DIGIT, s -> s.chars().anyMatch(Character::isDigit))
            .map(Password::new);
    }

    public int length() {
        return value.length();
    }
}
```

---

## Recipe 6: Composite Value Object

When a value object contains other value objects:

```java
public record PhoneNumber(CountryCode countryCode, String localNumber) {

    public static Result<PhoneNumber> phoneNumber(String countryCode, String localNumber) {
        return Result.all(
            CountryCode.countryCode(countryCode),
            validateLocalNumber(localNumber)
        ).map(PhoneNumber::new);
    }

    private static Result<String> validateLocalNumber(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull, Causes.cause("Local number required"))
            .map(s -> s.replaceAll("[^0-9]", ""))  // Strip non-digits
            .filter(Causes.cause("Local number must be 7-15 digits"),
                    s -> Verify.Is.lenBetween(s, 7, 15));
    }

    public String formatted() {
        return "+" + countryCode.value() + " " + localNumber;
    }
}

public record CountryCode(String value) {
    private static final Pattern PATTERN = Pattern.compile("^[1-9][0-9]{0,2}$");
    private static final Fn1<Cause, String> INVALID =
        Causes.forOneValue("Invalid country code: %s");

    public static Result<CountryCode> countryCode(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull)
            .map(String::trim)
            .filter(INVALID, PATTERN.asMatchPredicate())
            .map(CountryCode::new);
    }
}
```

---

## Recipe 7: Cross-Field Validation

When validation depends on multiple fields together:

```java
public record DateRange(LocalDate start, LocalDate end) {
    private static final Cause START_REQUIRED = Causes.cause("Start date is required");
    private static final Cause END_REQUIRED = Causes.cause("End date is required");
    private static final Cause END_BEFORE_START =
        Causes.cause("End date must be after start date");
    private static final Cause RANGE_TOO_LONG =
        Causes.cause("Date range cannot exceed 1 year");

    public static Result<DateRange> dateRange(LocalDate start, LocalDate end) {
        return Result.all(
            Verify.ensure(start, Verify.Is::notNull, START_REQUIRED),
            Verify.ensure(end, Verify.Is::notNull, END_REQUIRED)
        ).flatMap((s, e) -> validateRange(s, e));
    }

    private static Result<DateRange> validateRange(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) {
            return END_BEFORE_START.result();
        }
        if (ChronoUnit.DAYS.between(start, end) > 365) {
            return RANGE_TOO_LONG.result();
        }
        return Result.success(new DateRange(start, end));
    }

    public long days() {
        return ChronoUnit.DAYS.between(start, end);
    }
}
```

---

## Recipe 8: Optional Field with Validation

When a field is optional but must be valid if present:

```java
public record ReferralCode(String value) {
    private static final Pattern PATTERN = Pattern.compile("^[A-Z0-9]{6,10}$");
    private static final Fn1<Cause, String> INVALID =
        Causes.forOneValue("Invalid referral code format: %s");

    public static Result<Option<ReferralCode>> referralCode(String raw) {
        if (raw == null || raw.isBlank()) {
            return Result.success(Option.none());
        }
        return Verify.ensure(raw, Verify.Is::notNull)
            .map(String::trim)
            .map(String::toUpperCase)
            .filter(INVALID, PATTERN.asMatchPredicate())
            .map(ReferralCode::new)
            .map(Option::some);
    }

    public boolean isPremium() {
        return value.startsWith("PREM");
    }
}
```

**Usage in a composite:**
```java
public record ValidRegistration(Email email, Password password, Option<ReferralCode> referralCode) {

    public static Result<ValidRegistration> validate(RegistrationRequest raw) {
        return Result.all(
            Email.email(raw.email()),
            Password.password(raw.password()),
            ReferralCode.referralCode(raw.referralCode())
        ).map(ValidRegistration::new);
    }
}
```

---

## Recipe 9: Enumerated Value Object

When valid values are from a fixed set:

```java
public record Currency(String code) {
    private static final Set<String> VALID_CODES = Set.of(
        "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD"
    );

    private static final Cause CURRENCY_REQUIRED =
        Causes.cause("Currency code is required");
    private static final Fn1<Cause, String> UNSUPPORTED =
        Causes.forOneValue("Unsupported currency: %s");

    public static Result<Currency> currency(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull, CURRENCY_REQUIRED)
            .map(String::trim)
            .map(String::toUpperCase)
            .filter(UNSUPPORTED, VALID_CODES::contains)
            .map(Currency::new);
    }

    // Pre-built constants for common use
    public static final Currency USD = new Currency("USD");
    public static final Currency EUR = new Currency("EUR");
    public static final Currency GBP = new Currency("GBP");
}
```

---

## Recipe 10: ID Value Object

For type-safe IDs that prevent mixing up different entity IDs:

```java
public record UserId(String value) {
    private static final Cause USER_ID_REQUIRED =
        Causes.cause("User ID is required");
    private static final Cause USER_ID_INVALID =
        Causes.cause("User ID must be a valid UUID");

    public static Result<UserId> userId(String raw) {
        return Verify.ensure(raw, Verify.Is::notNull, USER_ID_REQUIRED)
            .map(String::trim)
            .flatMap(s -> Network.parseUUID(s)  // Validates UUID format
                .mapError(_ -> USER_ID_INVALID))
            .map(uuid -> new UserId(uuid.toString()));
    }

    public static UserId generate() {
        return new UserId(UUID.randomUUID().toString());
    }
}

public record OrderId(String value) {
    // Similar structure, but now OrderId and UserId are different types
    // You can't accidentally pass a UserId where OrderId is expected
}
```

---

## Testing Value Objects

Value object tests are straightforward:

```java
class EmailTest {

    @Test
    void email_succeedsForValidFormat() {
        Email.email("user@example.com")
            .onFailure(Assertions::fail)
            .onSuccess(email -> assertEquals("user@example.com", email.value()));
    }

    @Test
    void email_normalizesToLowercase() {
        Email.email("USER@EXAMPLE.COM")
            .onSuccess(email -> assertEquals("user@example.com", email.value()));
    }

    @Test
    void email_trimsWhitespace() {
        Email.email("  user@example.com  ")
            .onSuccess(email -> assertEquals("user@example.com", email.value()));
    }

    @Test
    void email_rejectsNull() {
        Email.email(null).onSuccess(Assertions::fail);
    }

    @Test
    void email_rejectsInvalidFormat() {
        Email.email("not-an-email").onSuccess(Assertions::fail);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "no-at-sign", "@no-local", "no-domain@"})
    void email_rejectsInvalidFormats(String invalid) {
        Email.email(invalid).onSuccess(Assertions::fail);
    }
}
```

---

## When NOT to Use Value Objects

Not everything needs to be a value object:

**Skip value objects for:**
- Purely internal data that never crosses boundaries
- Simple primitives with no validation (e.g., boolean flags)
- Temporary computation results

**Use value objects for:**
- Data from external sources (user input, API responses, database)
- Domain concepts with invariants
- Values shared across multiple use cases

---

## Conclusion

Value objects are more than DDD theory--they're practical tools for:
- **Centralizing validation** -- write it once in the factory
- **Normalizing data** -- consistent format throughout your system
- **Self-documenting types** -- `Email` is clearer than `String`
- **Compile-time safety** -- can't mix up `UserId` and `OrderId`

Start with the most-used primitives in your codebase (email, user ID, money amounts) and gradually expand. Each value object you add is one less place where validation bugs can hide.

---

*Want to learn how value objects fit into larger patterns for predictable, testable code? Check out [Java Backend Coding Technology](https://pragmatica.dev) for a complete methodology built on these principles.*
