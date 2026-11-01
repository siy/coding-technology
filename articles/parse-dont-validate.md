---
tags: [java, validation, designpatterns, cleancode]
canonical_url: https://pragmatica.dev/articles/parse-dont-validate
description: Making invalid states unrepresentable through validation at construction time
published: true
---

# Parse, Don't Validate: Making Invalid States Unrepresentable

**Why validation should happen at construction, not consumption**

---

## The Validation Problem

Every Java developer has written code like this:

```java
public void processOrder(Order order) {
    if (order == null) {
        throw new IllegalArgumentException("Order cannot be null");
    }
    if (order.getEmail() == null || order.getEmail().isBlank()) {
        throw new ValidationException("Email is required");
    }
    if (!isValidEmail(order.getEmail())) {
        throw new ValidationException("Invalid email format");
    }
    if (order.getItems() == null || order.getItems().isEmpty()) {
        throw new ValidationException("Order must have items");
    }
    // Finally, the actual business logic...
}
```

This defensive programming style has become so common we barely notice it. But there are serious problems lurking here.

**The Same Validation, Everywhere**

Does `sendConfirmation(email)` validate the email? Does `updateUserEmail(email)` validate it? Does `notifySupport(email)` validate it? Either every method validates (duplication), or some don't (bugs waiting to happen).

**Validation and Logic Interleaved**

The actual business logic is buried under validation checks. What does this method *do*? Hard to tell at a glance.

**Invalid States Can Exist**

You can create an `Order` object with a null email, pass it around, store it, and only discover the problem when some method finally validates it. By then, debugging is a nightmare.

---

## The Insight: Parsing vs. Validating

The phrase "parse, don't validate" comes from [Alexis King's influential article](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/). The core insight is simple but profound:

**Validation** checks if data is valid and returns a boolean or throws an exception. The data's type doesn't change--a `String` that passes email validation is still just a `String`.

**Parsing** transforms unstructured data into structured data. A `String` becomes an `Email`. If parsing succeeds, you have proof of validity in the type itself.

```java
// Validation: returns boolean, String remains String
boolean isValid = isValidEmail(emailString);
// You still have a String. Nothing prevents passing an invalid one later.

// Parsing: transforms String to Email
Result<Email> parsed = Email.email(emailString);
// If you have an Email, it's valid by construction. No further checks needed.
```

---

## Making Invalid States Unrepresentable

The goal is simple: **if an object exists, it's valid**. You achieve this by making the only way to create an object go through validation:

```java
public record Email(String value) {
    private static final Pattern PATTERN =
        Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    private static final Cause EMAIL_REQUIRED = Causes.cause("Email is required");
    private static final Fn1<Cause, String> INVALID_FORMAT =
        Causes.forOneValue("Invalid email format: %s");

    // Private constructor (conceptually--Java records don't support this yet)
    // private Email {}

    // Factory method: the ONLY way to create an Email
    public static Result<Email> email(String raw) {
        return Verify.ensure(raw, Verify.Is::present, EMAIL_REQUIRED)
            .map(String::trim)
            .map(String::toLowerCase)
            .filter(INVALID_FORMAT, PATTERN.asMatchPredicate())
            .map(Email::new);
    }
}
```

Now look at what this enables:

```java
public void sendConfirmation(Email email) {
    // No validation needed. If we have an Email, it's valid.
    mailer.send(email.value(), "Your order is confirmed", body);
}
```

The `Email` type *is* the validation. It's impossible to create an invalid `Email` (outside of reflection hacks). Every method that accepts `Email` knows it's dealing with valid data.

---

## The Pattern in Practice

### Value Objects with Validation

```java
public record Password(String value) {
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;
    private static final Pattern HAS_UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern HAS_LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern HAS_DIGIT = Pattern.compile("[0-9]");

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
        return Verify.ensure(raw, Verify.Is::present)
            .filter(TOO_SHORT, s -> s.length() >= MIN_LENGTH)
            .filter(TOO_LONG, s -> s.length() <= MAX_LENGTH)
            .filter(MISSING_UPPERCASE, s -> HAS_UPPERCASE.matcher(s).find())
            .filter(MISSING_LOWERCASE, s -> HAS_LOWERCASE.matcher(s).find())
            .filter(MISSING_DIGIT, s -> HAS_DIGIT.matcher(s).find())
            .map(Password::new);
    }
}
```

### Aggregating Multiple Validations

When you have multiple fields to validate, you want all errors, not just the first:

```java
public record ValidRegistration(Email email, Password password, Username username) {

    public static Result<ValidRegistration> validate(RegistrationRequest raw) {
        return Result.all(
            Email.email(raw.email()),
            Password.password(raw.password()),
            Username.username(raw.username())
        ).map(ValidRegistration::new);
    }
}
```

`Result.all()` collects all failures into a `CompositeCause`. If email and password are both invalid, the user sees both errors--much better UX than fixing one at a time.

### Cross-Field Validation

Sometimes validation depends on multiple fields together:

```java
public record DateRange(LocalDate start, LocalDate end) {
    private static final Cause END_BEFORE_START =
        Causes.cause("End date must be after start date");

    public static Result<DateRange> dateRange(LocalDate start, LocalDate end) {
        return Verify.ensure(end, e -> !e.isBefore(start), END_BEFORE_START)
            .map(_ -> new DateRange(start, end));
    }
}
```

### Optional Fields with Validation

What if a field is optional but must be valid if present?

```java
public record ValidOrder(
    Email email,
    List<OrderItem> items,
    Option<ReferralCode> referralCode  // Optional but validated
) {
    public static Result<ValidOrder> validate(OrderRequest raw) {
        return Result.all(
            Email.email(raw.email()),
            validateItems(raw.items()),
            validateOptionalReferral(raw.referralCode())
        ).map(ValidOrder::new);
    }

    private static Result<Option<ReferralCode>> validateOptionalReferral(String raw) {
        if (raw == null || raw.isBlank()) {
            return Result.success(Option.none());
        }
        return ReferralCode.referralCode(raw).map(Option::some);
    }
}
```

The type `Option<ReferralCode>` says exactly what it means: the referral code might be absent, but if present, it's valid.

---

## Normalization: More Than Just Validation

Factories can also normalize data:

```java
public static Result<Email> email(String raw) {
    return Verify.ensure(raw, Verify.Is::present, EMAIL_REQUIRED)
        .map(String::trim)           // Remove whitespace
        .map(String::toLowerCase)    // Normalize case
        .filter(INVALID_FORMAT, PATTERN.asMatchPredicate())
        .map(Email::new);
}
```

Now "  USER@Example.COM  " becomes "user@example.com". Every `Email` in your system is normalized the same way. No more case-sensitivity bugs in email comparisons.

---

## Benefits

### 1. Validation Happens Once

```java
// Old way: validation scattered everywhere
void methodA(String email) { validateEmail(email); ... }
void methodB(String email) { validateEmail(email); ... }
void methodC(String email) { /* forgot to validate */ ... }  // Bug!

// Parse, don't validate: validation at construction only
void methodA(Email email) { ... }  // Already valid
void methodB(Email email) { ... }  // Already valid
void methodC(Email email) { ... }  // Already valid
```

### 2. Types Document Requirements

```java
// What does this accept?
void processOrder(String email, String phone, String postalCode)

// Crystal clear
void processOrder(Email email, Phone phone, PostalCode postalCode)
```

### 3. Impossible Bugs

```java
// This bug is impossible when using Email type
if (email.contains("@")) {  // Forgot to validate first!
    sendTo(email);
}
```

### 4. Better Testing

```java
// Testing validation is straightforward
@Test
void email_rejectsInvalidFormat() {
    Email.email("not-an-email")
        .onSuccess(Assertions::fail);  // Fail if unexpectedly succeeds
}

@Test
void email_normalizesToLowercase() {
    Email.email("USER@Example.COM")
        .onFailure(Assertions::fail)
        .onSuccess(email -> assertEquals("user@example.com", email.value()));
}
```

---

## Common Objections

### "That's a lot of boilerplate"

It's more code than a simple `String`, yes. But consider:
- You write the validation once, use it everywhere
- The "boilerplate" is the validation logic you'd write anyway
- IDEs generate record boilerplate; validation is the only real code

### "What about DTOs from external systems?"

Parse at the boundary:

```java
@PostMapping("/orders")
public ResponseEntity<?> createOrder(@RequestBody OrderRequest request) {
    return ValidOrder.validate(request)   // Parse DTO to domain object
        .flatMap(orderService::process)
        .fold(this::toErrorResponse, this::toSuccessResponse);
}
```

The `OrderRequest` DTO accepts anything (it's the external contract). `ValidOrder` is your internal domain object where invariants hold.

### "Performance overhead?"

Pattern compilation should be static (done once). Object creation is negligible compared to I/O. In practice, this pattern often *improves* performance by eliminating redundant validation.

---

## The Business Logic Payoff

With parse-don't-validate, your business logic becomes pure and focused:

```java
// Before: defensive programming everywhere
public OrderConfirmation processOrder(Order order) {
    if (order == null) throw new IllegalArgumentException();
    if (order.getEmail() == null) throw new ValidationException();
    // ... 20 more validation checks
    // Finally, actual logic
}

// After: trust your types
public OrderConfirmation processOrder(ValidOrder order) {
    var reserved = inventoryService.reserve(order.items());
    var payment = paymentService.charge(order.paymentMethod(), order.total());
    return confirmationService.create(order, reserved, payment);
}
```

No validation, no null checks, no defensive programming. Just business logic.

---

## Getting Started

1. **Identify your primitive obsession**: Find methods that accept `String` for emails, phone numbers, IDs, etc.

2. **Create one value object**: Start with `Email` or `UserId`--something used widely.

3. **Add the factory method**: Return `Result<T>` with proper validation.

4. **Update signatures**: Change `String email` to `Email email` in method signatures.

5. **Watch the compiler guide you**: Every place that passes a raw `String` now needs to parse it first.

---

## Conclusion

The phrase "parse, don't validate" encapsulates a powerful idea: use your type system to make invalid states unrepresentable. When construction *is* validation:

- Invalid data can't exist in your domain model
- Every method can trust its inputs
- Validation happens once at the boundary
- Types become documentation

This isn't just about cleaner code--it's about building systems where entire categories of bugs become impossible.

---

*Want to explore more patterns for predictable, testable Java code? Check out [Java Backend Coding Technology](https://pragmatica.dev) for a complete methodology built on these principles.*
