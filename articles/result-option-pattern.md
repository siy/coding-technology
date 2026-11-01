---
tags: [java, functionalprogramming, types, validation]
canonical_url: https://pragmatica.dev/articles/result-option-pattern
description: Understanding when to use T, Option, Result, and Result<Option> for precise domain modeling
published: true
---

# The Type That Says It All: Understanding Result\<Option\<T\>\>

**Expressing required, optional, and failed states with precision**

---

## The Three States Problem

Consider a user profile with an optional phone number. What are the possible states?

1. **Phone number is valid**: "+1-555-123-4567"
2. **Phone number is absent**: User didn't provide one
3. **Phone number is invalid**: User provided "abc123"

Now try to represent this with `Optional<String>`:

```java
Optional<String> phoneNumber = getPhoneNumber();
```

This conflates states 2 and 3. An empty `Optional` means... what? Not provided? Or provided but invalid?

What about `String` with nulls?

```java
String phoneNumber = getPhoneNumber(); // null means... ?
```

Same problem. `null` could mean absent or invalid.

---

## The Type-State Matrix

Different types express different guarantees:

| Type | Can be absent? | Can fail? | Meaning |
|------|---------------|-----------|---------|
| `T` | No | No | Always present, always valid |
| `Option<T>` | Yes | No | Might be absent, but if present, valid |
| `Result<T>` | No | Yes | Always attempted, might fail |
| `Result<Option<T>>` | Yes | Yes | Might be absent OR might fail |

Each type answers different questions:
- `Email email` -- "This is a valid email"
- `Option<Email>` -- "There might be an email, but if there is, it's valid"
- `Result<Email>` -- "We tried to get/validate an email, and here's what happened"
- `Result<Option<Email>>` -- "This field is optional, but if provided, must be valid"

---

## When to Use Each

### Use `T`: Required, Always Valid

```java
public record User(UserId id, Email email, Username username) {
    // Every User has an ID, email, and username. No nulls. No optionality.
}
```

These fields are mandatory. A `User` without an `Email` isn't a valid user.

### Use `Option<T>`: Optional, Always Valid If Present

```java
public record UserProfile(
    UserId id,
    Email email,
    Option<PhoneNumber> phone,      // Optional
    Option<Address> address          // Optional
) {}
```

Phone and address are optional. But if a `PhoneNumber` exists, it's valid--you can't have an `Option` containing an invalid phone number because `PhoneNumber` validates on construction.

### Use `Result<T>`: Required, Might Fail

```java
public static Result<Email> email(String raw) {
    // Parsing might fail, but we always try
    return Verify.ensure(raw, Verify.Is::present)
        .filter(INVALID_FORMAT, PATTERN.asMatchPredicate())
        .map(Email::new);
}
```

We're trying to create an `Email`. We'll either succeed or fail, but we always attempt it.

### Use `Result<Option<T>>`: Optional, Might Fail If Provided

```java
public static Result<Option<PhoneNumber>> phoneNumber(String raw) {
    if (raw == null || raw.isBlank()) {
        return Result.success(Option.none());  // Absent is OK
    }
    // If provided, must be valid
    return validate(raw)
        .map(PhoneNumber::new)
        .map(Option::some);
}
```

This says: "Phone number is optional. But if you provide one, it better be valid."

---

## The Validation Distinction

The key insight: **absence is not failure**.

When a user leaves the phone field blank:
- That's not an error
- They chose not to provide a phone number
- We should accept this gracefully

When a user types "abc123" in the phone field:
- That's an error
- They tried to provide a phone number but got it wrong
- We should report the validation failure

`Result<Option<T>>` distinguishes these cases:

```java
Result<Option<PhoneNumber>> result = PhoneNumber.phoneNumber(userInput);

result.fold(
    cause -> showError(cause.message()),  // Validation failed
    optPhone -> optPhone.fold(
        () -> {}, // No phone provided - that's fine
        phone -> showPhone(phone.formatted())  // Valid phone
    )
);
```

---

## Composition Patterns

### Composing Multiple Optional Validated Fields

```java
public record ContactInfo(
    Email email,
    Option<PhoneNumber> phone,
    Option<Address> address
) {
    public static Result<ContactInfo> validate(ContactRequest raw) {
        return Result.all(
            Email.email(raw.email()),                    // Required
            PhoneNumber.phoneNumber(raw.phone()),        // Optional but validated
            Address.address(raw.address())               // Optional but validated
        ).map(ContactInfo::new);
    }
}
```

`Result.all` collects all validation errors. You get:
- `Success(ContactInfo)` if everything valid
- `Failure(CompositeCause)` listing all validation errors

### Cross-Field Validation with Optional Fields

```java
public record BusinessProfile(
    CompanyName name,
    Option<TaxId> taxId,
    Option<VatNumber> vatNumber
) {
    private static final Cause TAX_OR_VAT_REQUIRED =
        Causes.cause("Either Tax ID or VAT number is required for businesses");

    public static Result<BusinessProfile> validate(BusinessRequest raw) {
        return Result.all(
            CompanyName.companyName(raw.name()),
            TaxId.taxId(raw.taxId()),
            VatNumber.vatNumber(raw.vatNumber())
        ).flatMap(BusinessProfile::validateAtLeastOneId);
    }

    private static Result<BusinessProfile> validateAtLeastOneId(
        CompanyName name,
        Option<TaxId> taxId,
        Option<VatNumber> vatNumber
    ) {
        if (taxId.isEmpty() && vatNumber.isEmpty()) {
            return TAX_OR_VAT_REQUIRED.result();
        }
        return Result.success(new BusinessProfile(name, taxId, vatNumber));
    }
}
```

---

## Database Patterns

When reading from databases, you often have nullable columns:

```java
public Promise<Option<User>> findById(UserId id) {
    return Promise.lift(
        DatabaseError::fromException,
        () -> jdbcTemplate.queryForObject(
            "SELECT * FROM users WHERE id = ?",
            new Object[]{id.value()},
            this::mapRow
        )
    ).map(Option::option);  // Wrap nullable result in Option
}
```

When writing to databases with optional fields:

```java
public Promise<UserId> save(User user) {
    return Promise.lift(
        DatabaseError::fromException,
        () -> jdbcTemplate.update(
            "INSERT INTO users (email, phone) VALUES (?, ?)",
            user.email().value(),
            user.phone().map(PhoneNumber::value).orElse(null)  // Option to nullable
        )
    );
}
```

---

## API Patterns

### Request Parsing

```java
public record CreateUserRequest(
    String email,      // Required in JSON
    String phone,      // Optional in JSON (null or missing)
    String address     // Optional in JSON
) {}

public record ValidCreateUser(
    Email email,
    Option<PhoneNumber> phone,
    Option<Address> address
) {
    public static Result<ValidCreateUser> validate(CreateUserRequest raw) {
        return Result.all(
            Email.email(raw.email()),
            PhoneNumber.phoneNumber(raw.phone()),
            Address.address(raw.address())
        ).map(ValidCreateUser::new);
    }
}
```

### Response Building

```java
public record UserResponse(
    String email,
    String phone,      // null if not present
    String address     // null if not present
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.email().value(),
            user.phone().map(PhoneNumber::value).orElse(null),
            user.address().map(Address::formatted).orElse(null)
        );
    }
}
```

The pattern: strict types internally, permissive at boundaries.

---

## Testing Patterns

```java
@Test
void phoneNumber_acceptsNull() {
    PhoneNumber.phoneNumber(null)
        .onFailure(Assertions::fail)
        .onSuccess(opt -> assertTrue(opt.isEmpty()));
}

@Test
void phoneNumber_acceptsBlank() {
    PhoneNumber.phoneNumber("   ")
        .onFailure(Assertions::fail)
        .onSuccess(opt -> assertTrue(opt.isEmpty()));
}

@Test
void phoneNumber_validatesIfProvided() {
    PhoneNumber.phoneNumber("invalid")
        .onSuccess(Assertions::fail);  // Should fail validation
}

@Test
void phoneNumber_parsesValidInput() {
    PhoneNumber.phoneNumber("+1-555-123-4567")
        .onFailure(Assertions::fail)
        .onSuccess(opt -> {
            assertTrue(opt.isPresent());
            assertEquals("+15551234567", opt.get().normalized());
        });
}
```

---

## Mental Model

Think of `Result<Option<T>>` as answering two questions:

1. **Was the validation attempted successfully?** -> `Result` layer
   - `Success` = validation ran without errors
   - `Failure` = validation found problems

2. **Is there a value?** -> `Option` layer
   - `Some(value)` = value was provided and valid
   - `None` = value was not provided (which is acceptable)

```
Input: null or blank
  -> Result.success(Option.none())
  -> "Not provided, and that's OK"

Input: "invalid-data"
  -> Result.failure(validationError)
  -> "Provided, but invalid"

Input: "valid-data"
  -> Result.success(Option.some(parsed))
  -> "Provided and valid"
```

---

## Common Mistakes

### Mistake 1: Using Option for Validation

```java
// Wrong: Option can't express "invalid"
public static Option<Email> email(String raw) {
    return isValid(raw) ? Option.some(new Email(raw)) : Option.none();
}
// Caller can't tell: was it empty input or invalid input?
```

### Mistake 2: Using Result for Pure Optionality

```java
// Wrong: Result suggests something failed
public static Result<PhoneNumber> getDefaultPhone() {
    return config.defaultPhone() == null
        ? PHONE_NOT_CONFIGURED.result()  // This isn't really a failure
        : Result.success(new PhoneNumber(config.defaultPhone()));
}

// Right: Option for pure optionality
public static Option<PhoneNumber> getDefaultPhone() {
    return Option.option(config.defaultPhone()).map(PhoneNumber::new);
}
```

### Mistake 3: Nested Results

```java
// Wrong: Double failure channel
Result<Result<User>> badType = ...;

// Right: Flatten
Result<User> goodType = outerResult.flatMap(identity());
```

---

## Conclusion

The type system is your ally in expressing domain semantics:

- **`T`** -- Required, always valid
- **`Option<T>`** -- Optional, always valid if present
- **`Result<T>`** -- Required, might fail validation
- **`Result<Option<T>>`** -- Optional, might fail if provided

When you choose the right type, your code says exactly what you mean. No ambiguity about what `null` means. No hidden failure modes. The types document the domain.

`Result<Option<T>>` is the precise tool for a common situation: "this field is optional, but if you provide it, it must be valid." Use it when that's exactly what you mean.

---

*Want to explore more about type-driven domain modeling? Check out [Java Backend Coding Technology](https://pragmatica.dev) for a complete methodology built on these principles.*
