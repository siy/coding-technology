# Parse, Don't Validate

## What You'll Learn

- Why validation should be inseparable from construction
- How to use factory methods with `Result<T>` returns
- Cross-field validation techniques
- Real-world validation scenarios
- How to adopt this incrementally in existing codebases

**Prerequisites:** [The Four Return Types](four-return-types.md)

---

## The Principle

Most Java code validates data after construction. You create an object with raw values, then call a `validate()` method that might throw exceptions or return error lists. This approach is backwards.

**The principle:** Make invalid states unrepresentable. If construction succeeds, the object is valid by definition. Validation is parsing - converting untyped or weakly-typed input into strongly typed domain objects that enforce invariants at the type level.

**Why by criteria:**
- **Mental Overhead**: No "remember to validate" - type system guarantees validity (+2)
- **Reliability**: Compiler enforces that invalid objects cannot be constructed (+3)
- **Design Impact**: Business invariants concentrated in factories, not scattered (+2)
- **Complexity**: Single validation point per type eliminates redundant checks (+1)

---

## The Traditional (Wrong) Approach

```java
// DON'T: Validation separated from construction
public class Email {
    private final String value;

    public Email(String value) {
        this.value = value;  // accepts anything
    }

    public boolean isValid() {  // Caller must remember to check
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
- You can't distinguish "null" from "malformed" from "too long"

---

## The Parse-Don't-Validate Approach

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

The constructor is private (or package-private). The only way to get an `Email` is through the static factory `email()`, which returns `Result<Email>`. If you have an `Email` instance, it's valid - no separate check needed.

> **Note:** As of current Java versions, records do not support declaring the canonical constructor as private. Rely on team discipline and code review to ensure value objects are only constructed through their factory methods. Direct `new Email(...)` calls stand out immediately and are easy to catch.

> **Library Value Objects:** For common types like email, URL, and UUID, Pragmatica Core provides production-ready implementations in `org.pragmatica.lang.vo`. The examples in this chapter demonstrate the *pattern* — for production use, prefer the library VOs over hand-rolled versions.

---

## Naming Conventions

**Factory naming**: Factories are always named after their type, lowercase-first (camelCase):

```java
Email.email(raw)
Password.password(raw)
AccountId.accountId(raw)
```

This creates a natural, readable call site that's grep-friendly and allows static imports: because each factory is named for its own type, many of them can be statically imported into one scope without the collisions a shared name like `of` would cause.

**Validated input naming**: Use the `Valid` prefix for types representing validated inputs:

```java
// DO: Use Valid prefix
record ValidRequest(Email email, Password password) { ... }
record ValidUser(Email email, HashedPassword hashed) { ... }

// DON'T: Use Validated prefix (too verbose)
record ValidatedRequest(...)
```

---

## Optional Fields with Validation

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

---

## Normalization in Factories

Factories can normalize input as part of parsing:

```java
public static Result<Email> email(String raw) {
    return Verify.ensure(raw, Verify.Is::present)
                 .map(String::trim)           // Remove whitespace
                 .map(String::toLowerCase)    // Lowercase for comparison
                 .filter(INVALID_EMAIL, EMAIL_PATTERN.asMatchPredicate())
                 .map(Email::new);
}
```

Now all `Email` instances are trimmed and lowercased. Domain logic never worries about case or whitespace.

---

## Where Validation Belongs

**Clear rule for validation placement:**

| Validation Type | Where | Example |
|-----------------|-------|---------|
| **Single-field invariants** | Value object factory | Email format, password strength, ID format |
| **Cross-field invariants** | ValidRequest factory | Password doesn't contain email, date range valid |
| **External state invariants** | Use case step | Email uniqueness (DB), credit check (external service) |

**Rationale:**
- Value objects enforce invariants that depend only on the field's own value
- ValidRequest enforces invariants that require multiple fields but no external state
- Use cases handle invariants that require external lookups (database, services)

```java
// Value object: single-field invariant
public record Email(String value) {
    public static Result<Email> email(String raw) { /* format check only */ }
}

// ValidRequest: cross-field invariant
public record ValidRegistration(Email email, Password password) {
    public static Result<ValidRegistration> validRegistration(Email email, Password pwd) {
        // Check password doesn't contain email local part
    }
}

// Use case step: external state invariant
interface CheckEmailUnique {
    Promise<Email> apply(Email email);  // DB lookup
}
```

---

## Cross-Field Validation with Result.all()

Use `Result.all()` to validate independent fields, then add cross-field rules:

**Example: Password must not contain email local part**

```java
record ValidRegistration(Email email, Password password) {
    private static final Cause PASSWORD_CONTAINS_EMAIL =
        Causes.cause("Password cannot contain email local part");

    static Result<ValidRegistration> validRegistration(String emailRaw,
                                                       String passwordRaw) {
        return Result.all(Email.email(emailRaw),
                         Password.password(passwordRaw))
                     .flatMap(ValidRegistration::checkPasswordNotContainsEmail);
    }

    private static Result<ValidRegistration> checkPasswordNotContainsEmail(
            Email email, Password pwd) {
        String localPart = email.value().split("@")[0];
        return pwd.value().contains(localPart)
            ? PASSWORD_CONTAINS_EMAIL.result()
            : Result.success(new ValidRegistration(email, pwd));
    }
}
```

**Pattern:**
1. Validate individual fields with `Result.all()` → accumulates per-field errors
2. Use `.flatMap()` to add cross-field validation → fail-fast on cross-field rules
3. Extract cross-field logic to named methods
4. Only construct if all validation passes

---

## Real-World Validation Scenarios

### Date Range Validation

```java
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

### Business Rule Validation

```java
public record ValidOrder(OrderId id, Money total, List<LineItem> items) {
    private static final Fn1<Cause, Money> TOTAL_MISMATCH =
        Causes.forOneValue("Order total does not match line items. Expected: %s");

    public static Result<ValidOrder> validOrder(OrderId id,
                                                Money total,
                                                List<LineItem> items) {
        return total.equals(calculateTotal(items))
            ? Result.success(new ValidOrder(id, total, items))
            : TOTAL_MISMATCH.apply(calculateTotal(items)).result();
    }

    private static Money calculateTotal(List<LineItem> items) {
        return items.stream()
                    .map(LineItem::subtotal)
                    .reduce(Money.ZERO, Money::add);
    }
}
```

### Collecting Multiple Errors

```java
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
    }
}
```

---

## Pragmatica Core Validation Utilities

**Reach for a predicate from the catalog before writing the comparison by hand.** A predicate
from `Verify.Is` is tested once, in the library, for every codebase that calls it. The same
comparison written inline is tested here, by you, and can be wrong here. Both forms produce
the same `Result<T>`, so the choice costs nothing at the call site and moves decidable surface
out of code you own into code that already carries its own tests.

The exception is narrow and real: a condition specific to your domain has no catalog
equivalent and is written inline. That is a business leaf like any other, and it owes a leaf's
tests.

**Verify.Is Predicates:**
```java
// Instead of custom lambdas:
.flatMap(s -> s.length() >= 8 ? Result.success(s) : Result.failure(...))

// Use filter with standard predicates:
.filter(TOO_SHORT, s -> Verify.Is.lenBetween(s, 8, 128))
```

Common predicates: `notNull`, `notBlank`, `lenBetween`, `matches`, `positive`, `nonNegative`, `between`, `greaterThan`, `lessThan`, `contains`.

**Parse Subpackage:**
```java
import org.pragmatica.lang.parse.Number;
import org.pragmatica.lang.parse.DateTime;
import org.pragmatica.lang.parse.Network;

Number.parseInt(raw)              // Result<Integer>
DateTime.parseLocalDate(raw)      // Result<LocalDate>
Network.parseUUID(raw)            // Result<UUID>
```

**Example:**
```java
public record Age(int value) {
    public static Result<Age> age(String raw) {
        return Number.parseInt(raw)
                     .filter(Causes.cause("Age 0-150"),
                             v -> Verify.Is.between(v, 0, 150))
                     .map(Age::new);
    }
}
```

---

## Adopting Incrementally

**Don't refactor everything at once.** Adopt incrementally at boundaries.

**1. New features first** - Use parse-don't-validate for all new code

**2. Keep existing validation at controller boundaries:**
```java
// BEFORE: Spring controller with @Valid
@PostMapping("/register")
public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest dto) {
    var request = new RegisterUser.Request(dto.email(), dto.password());
    return registerUser.execute(request)
                       .fold(this::errorResponse, this::successResponse);
}

// AFTER: Fully migrated
@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody RegisterUser.Request raw) {
    return registerUser.execute(raw)
        .fold(this::errorResponse, this::successResponse);
}
```

**3. Gradually move validation from services to value objects:**
- Find a service method with manual validation
- Extract that validation into a value object factory
- Update callers to use the value object
- Repeat

---

## Key Takeaways

1. **Validation IS construction** - If an instance exists, it's valid
2. **Factory methods return `Result<T>`** - Success means valid object
3. **`Result.all()` accumulates errors** - Show all problems at once
4. **Normalization in factories** - Trim, lowercase, etc. happen once
5. **`Result<Option<T>>`** - For optional values that must validate when present
6. **Adopt incrementally** - Start at boundaries, work inward

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 2.1: PhoneNumber value object
- Exercise 2.2: DateRange aggregate validation
- Exercise 2.3: Error accumulation vs short-circuit

---

## What's Next

[Error Handling & Composition](error-handling.md) covers error handling - how to define typed errors, compose them, and handle failures cleanly without exceptions.
