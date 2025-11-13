# Part 3: Parse, Don't Validate

**Series:** [Java Backend Coding Technology](INDEX.md) | **Part:** 3 of 9

**Previous:** [Part 2: The Four Return Types](part-02-four-return-types.md) | **Next:** [Part 4: Error Handling & Composition](part-04-error-handling.md)

---

## Overview

This part teaches the "parse, don't validate" principle: making invalid states unrepresentable through factory methods that enforce invariants at construction time.

By the end of this part, you'll understand:
- Why validation should be inseparable from construction
- How to use factory methods with `Result<T>` returns
- Cross-field validation techniques
- Real-world validation scenarios
- How to adopt this incrementally in existing codebases

**Prerequisites:** [Part 2: The Four Return Types](part-02-four-return-types.md)

---

## Parse, Don't Validate

Most Java code validates data after construction. You create an object with raw values, then call a `validate()` method that might throw exceptions or return error lists. This is backwards.

**The principle:** Make invalid states unrepresentable. If construction succeeds, the object is valid by definition. Validation is parsing - converting untyped or weakly-typed input into strongly typed domain objects that enforce invariants at the type level.

**Why by criteria:**
- **Mental Overhead**: No "remember to validate" - type system guarantees validity (+2).
- **Reliability**: Compiler enforces that invalid objects cannot be constructed (+3).
- **Design Impact**: Business invariants concentrated in factories, not scattered (+2).
- **Complexity**: Single validation point per type eliminates redundant checks (+1).

### The Traditional (Wrong) Approach

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

**Problems:**
- You can construct invalid `Email` objects
- Validation is a separate step that callers might forget
- The `isValid()` method returns a boolean, discarding information about what's wrong
- You can't distinguish "null" from "malformed" from "too long" without checking conditions individually

### The Parse-Don't-Validate Approach

```java
// DO: Validation IS construction
public record Email(String value) {
    // private Email {}  // Not yet supported in Java

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

### Naming Conventions

**Factory naming**: Factories are always named after their type, lowercase-first (camelCase). This creates a natural, readable call site: `Email.email(...)`, `Password.password(...)`, `AccountId.accountId(...)`.

It's slightly redundant but:
- **Unambiguous**: You know exactly what's being created
- **Grep-friendly**: Searching for "Email.email" finds all construction sites
- **Allows static imports**: `import static Email.email` lets you write `email(raw)` while preserving context

**Validated input naming**: Use the `Valid` prefix (not `Validated`) for types representing validated inputs or intermediate data:

```java
// DO: Use Valid prefix
record ValidRequest(Email email, Password password) { ... }
record ValidUser(Email email, HashedPassword hashed) { ... }

// DON'T: Use Validated prefix (too verbose, no additional semantics)
record ValidatedRequest(...)
record ValidatedUser(...)
```

The `Valid` prefix is concise and conveys the same meaning. The past-tense `Validated` adds no semantic value - both indicate data has passed validation

```java
// Usage examples
Result<Email> email = Email.email("user@example.com");
Result<Password> password = Password.password("Secret123");
Result<UserId> userId = UserId.userId("abc-123");
```

### Optional Fields with Validation

What if a field is optional but must be valid when present? For example, a referral code that's not required but must match a pattern if provided.

Use `Result<Option<T>>` - validation can fail (Result), and if it succeeds, the value might be absent (Option).

```java
public record ReferralCode(String value) {
    // private ReferralCode {}  // Not yet supported in Java

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

If `raw` is null or empty, we succeed with `Option.none()`. If it's present, we validate and wrap in `Option.some()`. If validation fails, the `Result` itself is a failure.

**Caller semantics are crystal clear:**
- `Failure(cause)`: Invalid input (provided but doesn't match pattern)
- `Success(None)`: No value provided (valid state)
- `Success(Some(code))`: Valid code provided

### Normalization in Factories

Factories can normalize input (trim whitespace, lowercase email domains, etc.) as part of parsing. This keeps invariants in one place and ensures all instances are normalized consistently.

```java
public static Result<Email> email(String raw) {
    return Verify.ensure(raw, Verify.Is::notNull)
        .map(String::trim)           // Normalize: remove whitespace
        .map(String::toLowerCase)    // Normalize: lowercase for comparison
        .flatMap(Verify.ensureFn(INVALID_EMAIL, Verify.Is::matches, EMAIL_PATTERN))
        .map(Email::new);
}
```

Now all `Email` instances are guaranteed to be trimmed and lowercased. Domain logic never worries about case-insensitive comparison or leading/trailing spaces - it's handled once, at construction time.

### Cross-Field Validation with Result.all()

Parse-don't-validate handles complex validation beyond single fields. What if validation depends on multiple fields together? Use `Result.all()` to validate independent fields, then add cross-field rules.

**Example: Password must not contain email local part**

```java
record ValidRegistration(Email email, Password password) {
    // Factory validates fields independently, then checks cross-field rule
    static Result<ValidRegistration> validRegistration(String emailRaw, String passwordRaw) {
        return Result.all(Email.email(emailRaw),
                          Password.password(passwordRaw))
            .flatMap((email, pwd) -> {
                // Cross-field rule: password can't contain email local part
                String localPart = email.value().split("@")[0];
                if (pwd.value().contains(localPart)) {
                    return RegistrationError.PasswordContainsEmail.INSTANCE.result();
                }
                return Result.success(new ValidRegistration(email, pwd));
            });
    }
}
```

**Benefits:**
- Both fields validated independently first (accumulates all per-field errors)
- Cross-field rule only checked if both fields individually valid
- Type system ensures you can't create `ValidRegistration` with invalid data
- Clear separation: per-field validation in value objects, cross-field rules in aggregate validators

**Example: Premium features require stronger password**

```java
record ValidRequest(Email email, Password password, Option<PremiumCode> premiumCode) {
    static Result<ValidRequest> validRequest(Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()),
                          PremiumCode.premiumCode(raw.premiumCode()))
            .flatMap((email, pwd, premium) -> {
                // Cross-field rule: premium code requires 12+ char password
                if (premium.isPresent() && pwd.value().length() < 12) {
                    return RequestError.PremiumRequiresStrongPassword.INSTANCE.result();
                }
                return Result.success(new ValidRequest(email, pwd, premium));
            });
    }
}
```

**Pattern:**
1. Validate individual fields with `Result.all()` → accumulates per-field errors
2. Use `.flatMap()` to add cross-field validation → fail-fast on cross-field rules
3. Only construct if all validation passes

This keeps validation close to the data while handling complex business rules cleanly.

### Why This Matters for AI

When an AI generates a value object, the structure is mechanical:
1. Private constructor
2. Static factory named after type
3. `Result<T>` or `Result<Option<T>>` return type
4. Validation via `Verify` combinators
5. Normalization in the pipeline

No guessing about where validation happens or how errors are reported. The AI learns the pattern once and applies it consistently.

### Pragmatica Lite Validation Utilities

Pragmatica Lite Core provides built-in utilities that eliminate boilerplate in value object validation:

**Verify.Is Predicates** - 20+ ready-to-use validation predicates:
```java
// Instead of custom lambdas:
.flatMap(s -> s.length() >= 8 ? Result.success(s) : Result.failure(...))

// Use standard predicates:
.flatMap(Verify.ensureFn(TOO_SHORT, Verify.Is::lenBetween, 8, 128))
```

**Common predicates:** `notNull`, `notBlank`, `lenBetween`, `matches`, `positive`, `nonNegative`, `between`, `greaterThan`, `lessThan`, `contains`.

**Parse Subpackage** - Exception-safe JDK API wrappers:
```java
import org.pragmatica.lang.parse.Number;
import org.pragmatica.lang.parse.DateTime;
import org.pragmatica.lang.parse.Network;

// Instead of: Result.lift(Integer::parseInt, raw)
Number.parseInt(raw)              // Result<Integer>

// Instead of: Result.lift(LocalDate::parse, raw)
DateTime.parseLocalDate(raw)      // Result<LocalDate>

// Instead of: Result.lift(UUID::fromString, raw)
Network.parseUUID(raw)            // Result<UUID>
```

**Example using utilities:**
```java
public record Age(int value) {
    public static Result<Age> age(String raw) {
        return Number.parseInt(raw)
            .flatMap(Verify.ensureFn(Causes.cause("Age 0-150"),
                                     Verify.Is::between, 0, 150))
            .map(Age::new);
    }
}
```

For comprehensive list, see main [Coding Guide](../CODING_GUIDE.md#pragmatica-lite-validation-and-parsing-utilities).

---

**Pragmatica Lite Quick Reference**

Common imports and methods you'll use throughout this series:

```java
// Core types
import org.pragmatica.lang.Option;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Promise;
import org.pragmatica.lang.Unit;

// Error handling
import org.pragmatica.lang.error.Cause;
import org.pragmatica.lang.error.Causes;

// Validation
import org.pragmatica.lang.validation.Verify;

// Parsing utilities
import org.pragmatica.lang.parse.Number;
import org.pragmatica.lang.parse.DateTime;
import org.pragmatica.lang.parse.Network;

// Functions
import org.pragmatica.lang.Functions.Fn1;
import org.pragmatica.lang.Functions.Fn2;
```

**Common patterns:**
- `Result.success(value)` - Create success
- `Result.failure(cause)` or `cause.result()` - Create failure
- `Result.all(r1, r2, ...)` - Parallel validation, collect all errors
- `Result.allOf(list)` - Aggregate list of Results
- `Verify.ensure(value, predicate)` - Validate value
- `Verify.ensureFn(cause, predicate, params...)` - Validate with custom error
- `Causes.forValue("message: {}")` - Create cause factory
- `Number.parseInt(raw)`, `DateTime.parseLocalDate(raw)` - Safe parsing

---

### Real-World Validation Scenarios

The basic examples above validate single fields independently. Real applications have more complex requirements: cross-field validation, dependent rules, and business constraints that span multiple values.

**Cross-field validation** - One field depends on another:

```java
// Date range where end must be after start
public record DateRange(LocalDate start, LocalDate end) {
    private static final Fn1<Cause, LocalDate> END_BEFORE_START =
        date -> Causes.cause("End date must be after start date: " + date);

    public static Result<DateRange> dateRange(LocalDate start, LocalDate end) {
        return Verify.ensure(start, Verify.Is::notNull)
            .flatMap(_ -> Verify.ensure(end, Verify.Is::notNull))
            .flatMap(_ -> Verify.ensure(end, isAfter(start), END_BEFORE_START))
            .map(_ -> new DateRange(start, end));
    }

    private static Predicate<LocalDate> isAfter(LocalDate start) {
        return end -> end.isAfter(start);
    }
}
```

**Dependent validation** - Second field's validity depends on first:

```java
// Password must not contain username (case-insensitive)
public record ValidCredentials(Username username, Password password) {
    private static final Fn1<Cause, String> PASSWORD_CONTAINS_USERNAME =
        pass -> Causes.cause("Password must not contain username");

    public static Result<ValidCredentials> credentials(String usernameRaw, String passwordRaw) {
        return validateIndependently(usernameRaw, passwordRaw)
            .flatMap(ValidCredentials::validatePasswordDependency);
    }

    private static Result<Tuple2<Username, Password>> validateIndependently(String usernameRaw, String passwordRaw) {
        return Result.all(Username.username(usernameRaw),
                          Password.password(passwordRaw));
    }

    private static Result<ValidCredentials> validatePasswordDependency(Username user, Password pass) {
        String userLower = user.value().toLowerCase();
        String passLower = pass.value().toLowerCase();

        return passLower.contains(userLower)
            ? PASSWORD_CONTAINS_USERNAME.apply(pass.value()).result()
            : Result.success(new ValidCredentials(user, pass));
    }
}
```

**Business rule validation** - Complex domain invariants:

```java
// Order total must match sum of line items
public record ValidOrder(OrderId id, Money total, List<LineItem> items) {
    private static final Fn1<Cause, Money> TOTAL_MISMATCH =
        actual -> Causes.cause("Order total does not match line items. Expected: " + actual);

    public static Result<ValidOrder> validOrder(OrderId id, Money total, List<LineItem> items) {
        Money calculated = items.stream()
            .map(LineItem::subtotal)
            .reduce(Money.ZERO, Money::add);

        return calculated.equals(total)
            ? Result.success(new ValidOrder(id, total, items))
            : TOTAL_MISMATCH.apply(calculated).result();
    }
}
```

**Collecting multiple errors with Result.all():**

```java
// Validate user registration - collect all field errors
public record ValidRegistration(Email email, Password password, Age age) {
    public static Result<ValidRegistration> validate(String emailRaw,
                                                      String passwordRaw,
                                                      String ageRaw) {
        return Result.all(Email.email(emailRaw),
                          Password.password(passwordRaw),
                          Age.age(ageRaw))
                     .map(ValidRegistration::new);
        // If any field fails, Result.all() accumulates ALL errors
        // User sees "Invalid email AND password too short AND age out of range"
        // Not just the first error
    }
}
```

**Key insight:** Use `Result.all()` for independent field validation (collects all errors), then use `flatMap` chains for dependent validation (fail-fast when one field depends on another being valid first).

### Adopting Incrementally in Existing Codebases

**Don't refactor everything at once.** Parse-don't-validate works best when adopted incrementally at boundaries.

**Strategy:**

**1. New features first** - Use parse-don't-validate from day one for all new code:
```java
// New feature: payment processing
public record CardNumber(String value) {
    // private CardNumber {}  // Not yet supported in Java

    public static Result<CardNumber> cardNumber(String raw) {
        return Verify.ensure(raw, Verify.Is::notBlank)
            .flatMap(Verify.ensureFn(INVALID, Verify.Is::matches, CARD_PATTERN))
            .map(CardNumber::new);
    }
}
```

**2. Keep existing validation at controller boundaries** - Don't remove `@Valid` annotations immediately. Add a parsing layer:
```java
// BEFORE: Existing Spring controller with @Valid
@RestController
public class UserController {
    private final RegisterUser registerUser;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest dto) {
        // @Valid handles Spring-level DTO validation
        // Add new parsing layer that converts DTO → use case request
        var request = new RegisterUser.Request(dto.email(), dto.password());
        return registerUser.execute(request)
            .fold(this::errorResponse, this::successResponse);
    }
}

// AFTER: Fully migrated - use case request directly
@RestController
public class UserController {
    private final RegisterUser registerUser;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterUser.Request raw) {
        return registerUser.execute(raw)     // Validation happens inside use case
            .fold(this::errorResponse, this::successResponse);
    }
}

// Inside RegisterUser use case - validation layer
public record ValidRequest(Email email, Password password) {
    public static Result<ValidRequest> validRequest(RegisterUser.Request raw) {
        return Result.all(Email.email(raw.email()),
                          Password.password(raw.password()))
                     .map(ValidRequest::new);
    }
}
```

**3. Gradually move validation from services to value objects:**
- Find a service method with manual validation
- Extract that validation into a value object factory method
- Update callers to use the value object
- Repeat for next field

**Example migration:**
```java
// Before: Validation in service
@Service
public class UserService {
    public User registerUser(String emailRaw, String passwordRaw) {
        if (emailRaw == null || !emailRaw.matches(EMAIL_PATTERN)) {
            throw new ValidationException("Invalid email");
        }
        // ... more validation, then business logic
    }
}

// After: Validation in value objects
public class UseCase implements RegisterUser {
    public Result<UserId> execute(ValidRequest request) {
        // request.email() and request.password() are already validated
        // Business logic only sees valid data
    }
}
```

**Key insight:** Start at the edges (controllers, API boundaries) and work inward. Your existing service layer can stay mostly unchanged while you build the new domain layer alongside it. Over time, the service layer shrinks as logic moves to use cases and value objects.

---


---

## Summary: Validation Through Types

You've learned the "parse, don't validate" principle:

**Key insights:**
- Validation IS construction - if an instance exists, it's valid
- Factory methods return `Result<T>` - success means valid object
- `Result.all()` handles cross-field validation with error accumulation
- Normalization happens in factories (trim, lowercase, etc.)
- `Result<Option<T>>` for optional values that must validate when present
- Adopt incrementally at boundaries, working inward

**Benefits:**
- Type system guarantees validity - no defensive checks needed
- Single validation point per type - DRY principle
- Clear error reporting - typed Causes, not boolean flags
- AI-friendly pattern - mechanical factory structure

---

## What's Next?

In [Part 9: Error Handling & Composition](part-04-error-handling.md), you'll learn how to handle errors as values, avoid business exceptions, and compose operations cleanly.

---

**Series Navigation**

[← Part 2: The Four Return Types](part-02-four-return-types.md) | [Index](INDEX.md) | [Part 9: Error Handling & Composition →](part-04-error-handling.md)

---

**Version:** 2.0.0 (2025-01-13) | **Part of:** [Java Backend Coding Technology Series](INDEX.md)
