---
Author: Sergiy Yevtushenko
Type: Feature
Scope: SE
Status: Draft
Discussion: TBD
Created: 2025/01/19
Updated: 2025/01/19
Template: 2.0
---

# Private Canonical Constructors in Records

## Summary

Enable record declarations to specify private canonical constructors, allowing records to enforce construction exclusively through static factory methods while preserving all record benefits (immutability, automatic `equals()`/`hashCode()`/`toString()`, pattern matching).

## Goals

- Allow record canonical constructors to be declared `private`, decoupling public API from internal representation
- Support the factory method pattern with validation for records, enabling "parse, don't validate" approach
- Preserve all existing record semantics (immutability, structural equality, pattern matching, serialization)
- Maintain backward compatibility with existing records that use public constructors
- Enable value object patterns where construction guarantees invariants

## Non-Goals

- Not changing record equality semantics, accessor methods, or `toString()` behavior
- Not removing the option for public constructors (backward compatibility requirement)
- Not introducing new syntax beyond the `private` modifier on canonical constructors
- Not changing pattern matching or deconstruction semantics
- Not addressing compact constructor access modifiers (separate concern)

## Motivation

### The Parse-Don't-Validate Pattern

Modern functional programming practices emphasize "parse, don't validate" - the principle that validation should produce a validated type, not a boolean. When validation succeeds, construction occurs; invalid input never produces an instance. This makes invalid states unrepresentable.

Records are ideal for implementing value objects following this pattern, but Java currently prohibits private canonical constructors. This forces awkward workarounds that compromise either record benefits or encapsulation.

### Current Limitation and Impact

The Java Language Specification currently requires:

> "A canonical constructor declaration must not have more restrictive access than the record class."

This means:
- Public record → public canonical constructor (mandatory)
- Package-private record → package-private or public constructor
- Private record → any visibility

**Problem:** You cannot have a public record type with validation-enforcing construction.

### Real-World Use Case: Email Value Object

Consider a typical domain value object:

```java
// DESIRED: Public type, private constructor, factory validation
public record Email(String value) {

    // ILLEGAL IN CURRENT JAVA - canonical constructor cannot be private
    private Email {
        // Validation happens here
    }

    public static Result<Email> email(String raw) {
        return validateEmail(raw)
            .map(Email::new);  // Intended to be the only way to construct
    }

    private static Result<String> validateEmail(String raw) {
        if (raw == null || !raw.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return Result.failure(ValidationError.invalidEmail(raw));
        }
        return Result.success(raw.toLowerCase().trim());
    }
}
```

**Current Reality:** The canonical constructor `Email(String value)` must be public, making this code compile:

```java
Email email = new Email("not-validated-or-normalized");  // BYPASSES VALIDATION!
```

### Current Workarounds and Their Costs

#### Workaround 1: Package-Private Record + Public Factory Class

```java
// EmailFactory.java
public final class EmailFactory {
    record EmailRecord(String value) {}  // Package-private record

    public static Result<EmailRecord> email(String raw) {
        return validateEmail(raw).map(EmailRecord::new);
    }
}
```

**Costs:**
- Loses "Email" as the type name (becomes `EmailRecord` or similar)
- Requires two classes per value object (factory + record)
- Pattern matching requires type casting or extra indirection
- Serialization becomes complex (record is not the public type)
- Clutters package with internal types

#### Workaround 2: Sealed Interface + Hidden Record

```java
public sealed interface Email permits Email.EmailImpl {
    String value();

    record EmailImpl(String value) implements Email {}

    static Result<Email> email(String raw) {
        return validateEmail(raw).map(EmailImpl::new);
    }
}
```

**Costs:**
- Verbose: 3 declarations (interface, record, factory) for one concept
- Pattern matching requires cast: `if (email instanceof Email.EmailImpl(var v))`
- Interface overhead for simple data container
- More complex than necessary for value objects

#### Workaround 3: Regular Class

```java
public final class Email {
    private final String value;

    private Email(String value) {
        this.value = value;
    }

    public String value() { return value; }

    public static Result<Email> email(String raw) {
        return validateEmail(raw).map(Email::new);
    }

    @Override public boolean equals(Object obj) { /* ... */ }
    @Override public int hashCode() { /* ... */ }
    @Override public String toString() { /* ... */ }
}
```

**Costs:**
- Loses all record benefits (automatic `equals()`, `hashCode()`, `toString()`, accessors)
- Verbose boilerplate (15+ lines for simple value object)
- No pattern matching support
- No compile-time guarantee of immutability
- Manual implementation of structural equality

### Impact on Codebases

Value objects appear throughout domain-driven design:
- Email, Password, UserId, OrderId, PhoneNumber, ZipCode
- Money, Quantity, Percentage, Measurement
- DateRange, TimeWindow, Coordinate, Address

A typical backend application has 20-50 value objects. Current workarounds mean:
- **40-100 extra classes** (workaround 1 or 2)
- **300-750 lines of boilerplate** (workaround 3)
- **Inconsistent patterns** across codebase
- **Cognitive overhead** remembering which workaround each type uses

### Comparison to Other Languages

**Kotlin** supports private constructors in data classes:

```kotlin
data class Email private constructor(val value: String) {
    companion object {
        fun create(raw: String): Result<Email> =
            validateEmail(raw).map(::Email)
    }
}
```

**Scala 3** supports private constructors in case classes (records equivalent):

```scala
case class Email private(value: String)

object Email {
  def apply(raw: String): Either[Error, Email] =
    validateEmail(raw).map(new Email(_))
}
```

Both languages recognize that data immutability and construction encapsulation are orthogonal concerns.

### Alignment with Java Evolution

Recent Java features move toward making invalid states unrepresentable:
- **Pattern matching** (JEP 394, 405, 420, 427, 440, 441): Type-safe deconstruction
- **Sealed classes** (JEP 409): Exhaustive hierarchies
- **Records** (JEP 395): Immutable data carriers

Private record constructors complete this vision: **validated construction + immutable representation + type-safe access = unrepresentable invalid states**.

### Industry Adoption of "Parse, Don't Validate"

This pattern has become standard practice:
- **Rust:** `Result` type + private struct fields
- **Haskell:** Smart constructors + opaque types
- **F#:** Validation combinators + private constructors
- **TypeScript:** Branded types + factory functions

Java records are well-positioned to support this pattern natively.

## Description

> **Note on Code Examples:** The examples in this JEP use functional types (`Result<T>`, `Option<T>`, `Promise<T>`) from the Pragmatica Core library to demonstrate validation patterns. These types are not part of this proposal - they serve only to illustrate realistic use cases for private constructors in value object implementations.
>
> **Maven:**
> ```xml
> <dependency>
>     <groupId>org.pragmatica-lite</groupId>
>     <artifactId>core</artifactId>
>     <version>0.8.5</version>
> </dependency>
> ```
>
> **Gradle:**
> ```gradle
> implementation 'org.pragmatica-lite:core:0.8.5'
> ```
>
> Library documentation: https://central.sonatype.com/artifact/org.pragmatica-lite/core

### Syntax

Allow the `private` modifier on canonical record constructors:

```java
public record Email(String value) {
    private Email {  // Private canonical constructor
        Objects.requireNonNull(value, "Email value cannot be null");
    }

    public static Result<Email> email(String raw) {
        return validateAndNormalize(raw).map(Email::new);
    }
}
```

### Semantics

**Access Control:**
- Private canonical constructors are accessible only within the record class body
- Static factory methods within the record can invoke the private constructor
- External code (including subpackages) cannot construct instances directly
- Constructor reference `Email::new` is accessible only within the record class

**Compilation:**
- Record components remain public (no change)
- Generated accessor methods remain public (no change)
- `equals()`, `hashCode()`, `toString()` work identically (based on component values)
- Pattern matching and deconstruction work identically

**No Impact on:**
- Record serialization (canonical constructor visibility is metadata for `ObjectInputStream`)
- Pattern matching (`instanceof Email(var v)` works as before)
- Reflection (`Constructor.setAccessible(true)` bypasses access control, as with all private constructors)

### Examples

#### Basic Value Object with Validation

```java
public record Email(String value) {
    private Email {
        // Constructor validation (defensive check, should never fail if factory used)
        Objects.requireNonNull(value, "Email value cannot be null");
    }

    public static Result<Email> email(String raw) {
        if (raw == null || raw.isBlank()) {
            return Result.failure(ValidationError.emailRequired());
        }

        String normalized = raw.toLowerCase().trim();

        if (!normalized.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            return Result.failure(ValidationError.invalidEmailFormat(raw));
        }

        return Result.success(new Email(normalized));
    }
}
```

**Usage:**

```java
// Valid usage (factory method)
Result<Email> result = Email.email("User@Example.COM  ");
result.onSuccess(email -> {
    System.out.println(email.value());  // "user@example.com" (normalized)
});

// Invalid usage (won't compile)
Email email = new Email("unchecked");  // COMPILATION ERROR: Email(String) has private access
```

#### Composite Value Object

```java
public record ValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {
    private ValidRequest {
        Objects.requireNonNull(email);
        Objects.requireNonNull(password);
        Objects.requireNonNull(referralCode);
    }

    public static Result<ValidRequest> from(Request raw) {
        return Result.all(
            Email.email(raw.email()),
            Password.password(raw.password()),
            ReferralCode.referralCode(raw.referralCode())
        ).map(ValidRequest::new);
    }
}

record Request(String email, String password, String referralCode) {}
```

**Benefit:** `ValidRequest` can only exist if all components are valid. Type system guarantees validity.

#### Non-Empty List

```java
public record NonEmptyList<T>(T head, List<T> tail) {
    private NonEmptyList {
        Objects.requireNonNull(head);
        Objects.requireNonNull(tail);
    }

    public static <T> Option<NonEmptyList<T>> fromList(List<T> list) {
        if (list == null || list.isEmpty()) {
            return Option.none();
        }
        return Option.some(new NonEmptyList<>(list.get(0), list.subList(1, list.size())));
    }

    public List<T> toList() {
        List<T> result = new ArrayList<>(tail.size() + 1);
        result.add(head);
        result.addAll(tail);
        return result;
    }
}
```

**Benefit:** Type system guarantees `NonEmptyList` is never empty. No runtime checks needed.

### Pattern Matching Interaction

Pattern matching and deconstruction remain unchanged:

```java
// Deconstruction works identically
if (email instanceof Email(var value)) {
    System.out.println("Email value: " + value);
}

// Switch pattern matching
String domain = switch (email) {
    case Email(var v) -> v.substring(v.indexOf('@') + 1);
};
```

**Note:** Deconstruction extracts component values, it does not reconstruct the record. Private constructor restriction does not affect pattern matching.

### Reflection Considerations

Reflection can bypass access control (as with all private members):

```java
Constructor<Email> ctor = Email.class.getDeclaredConstructor(String.class);
ctor.setAccessible(true);
Email email = ctor.newInstance("unchecked");  // Bypasses factory validation
```

**Recommendation:** This is consistent with existing Java reflection behavior. Security-sensitive code should already defend against reflection attacks. Records with private constructors are no more vulnerable than classes with private constructors.

### Serialization

Serialization frameworks (Jackson, GSON, etc.) use reflection to construct instances. Configuration may be required to direct frameworks to use factory methods instead of constructors.

**Java Serialization:** `ObjectInputStream` uses `Constructor.setAccessible(true)` to invoke constructors during deserialization, so private constructors do not break standard serialization.

**Framework Guidance:**
- Jackson: Use `@JsonCreator` on factory method
- GSON: Register custom `TypeAdapter`
- Modern frameworks: Prefer factory method construction (aligns with validation pattern)

## Alternatives

### Keep Current Restriction (Status Quo)

**Rejected:** Forces workarounds that compromise record benefits or encapsulation. Prevents idiomatic value object implementation.

### Introduce New Keyword (e.g., `sealed constructor`)

**Rejected:** Adds complexity without clear benefit. The `private` keyword already expresses intent.

### Allow Any Access Modifier on Canonical Constructor

**Considered:** Could allow `protected` and package-private.

**Decision:** Start with `private` only (most common use case). Future JEPs can consider relaxing to `protected` or package-private if demand exists. Conservative approach reduces risk.

### Introduce Builder-Only Records

**Rejected:** Builders are verbose for simple value objects. Factory methods are more concise and idiomatic for validated construction.

### Special "Value Object" Record Variant

**Rejected:** Adds language complexity. Private constructors achieve the same goal with existing mechanisms.

## Risks and Assumptions

### Risk: Breaking Deconstruction/Reconstruction Symmetry

**Concern:** Current design assumes "if you can deconstruct, you can reconstruct."

**Mitigation:** This assumption is already violated by records with validation in compact constructors (reconstruction may fail at runtime). Private constructors make this asymmetry explicit and compile-time enforced.

**Example of Current Asymmetry:**

```java
public record PositiveInt(int value) {
    public PositiveInt {
        if (value <= 0) throw new IllegalArgumentException("Must be positive");
    }
}

// Deconstruction succeeds
if (positiveInt instanceof PositiveInt(var v)) {
    // Reconstruction may fail
    PositiveInt reconstructed = new PositiveInt(v - 10);  // IllegalArgumentException!
}
```

Private constructors simply formalize: **deconstruction is always safe, reconstruction requires validation.**

### Risk: Serialization Framework Breakage

**Concern:** Frameworks may assume public constructors.

**Mitigation:**
- Java built-in serialization uses reflection (not affected)
- Modern frameworks (Jackson 2.12+) support factory method construction
- Migration path: annotate factory methods with `@JsonCreator` or similar
- Frameworks can detect private constructors and look for factory methods by convention

### Risk: Reflection-Based Attacks

**Concern:** Reflection can bypass private constructor, violating invariants.

**Mitigation:**
- Existing problem with private constructors in classes
- Security-sensitive code already defends against reflection
- Security Manager (deprecated) or Module System can restrict reflective access
- Not a new vulnerability

### Assumption: Factory Method Convention

**Assumption:** Developers will adopt naming conventions for factory methods (e.g., `Email.email(...)`, `UserId.userId(...)`).

**Justification:**
- Existing convention in codebases using factory methods
- Clear and consistent: factory method name matches type name (lowercase)
- IDE support can suggest factory methods when constructor is private

### Assumption: Limited Scope (Canonical Constructor Only)

**Assumption:** This JEP addresses only canonical constructors, not compact constructors or auxiliary constructors.

**Justification:**
- Canonical constructor is the primary use case
- Compact constructors cannot be private (they delegate to canonical)
- Auxiliary constructors can already be private
- Focused scope reduces complexity and risk

## Dependencies

**None.** This proposal is self-contained and does not depend on other JEPs.

**Future Synergies:**
- **Pattern Matching Enhancements:** Private constructors + exhaustive matching = robust validation guarantees
- **Sealed Classes:** Sealed record hierarchies + private constructors = controlled type families
- **Inline Types (Project Valhalla):** Value objects with private constructors = efficient, validated primitives

## Testing

### Language Specification Tests

- Verify `private` modifier is accepted on canonical constructors
- Verify compilation error when external code attempts to invoke private constructor
- Verify constructor reference `Email::new` is accessible only within record class
- Verify pattern matching and deconstruction work identically

### Compatibility Tests

- Verify existing records (public constructors) compile and run unchanged
- Verify serialization/deserialization works with private constructors
- Verify reflection can invoke private constructors with `setAccessible(true)`

### Edge Cases

- Nested records with private constructors
- Generic records with private constructors
- Records in unnamed modules vs. named modules
- Local records with private constructors

### Framework Integration Tests

- Jackson: Deserialize records with private constructors using `@JsonCreator`
- GSON: Custom `TypeAdapter` with private constructor records
- JPA/Hibernate: Entity construction with private constructors (if applicable)

## Impact

### Compatibility

**Source Compatibility:** Fully backward compatible. Existing records compile unchanged.

**Binary Compatibility:** Fully backward compatible. Adding `private` to constructor does not affect bytecode of existing callers (they never called the constructor directly).

**Behavioral Compatibility:** No change to existing code behavior.

### Performance

**No impact.** Private constructors compile to identical bytecode as public constructors. Access control is compile-time only.

### Security

**Positive impact.** Enables immutable value objects with guaranteed invariants, reducing risk of invalid state propagation.

### Documentation

- Update JLS §8.10.4 (Record Constructor Declarations) to allow `private` modifier
- Update Java Language Tutorial (Records section)
- Add example to "Effective Java" style guides (recommended practice for value objects)

### Tooling

- IDEs: Suggest factory method creation when canonical constructor is made private
- Linters: Detect records with validation in compact constructor but public canonical constructor (suggest making private)
- Static analysis: Flag direct constructor invocation for records with private constructors (similar to Lombok `@Builder` detection)

---

## Summary of Changes

This JEP proposes allowing the `private` modifier on record canonical constructors to enable:

1. **Parse-don't-validate pattern:** Factory methods enforce validation; invalid instances cannot exist
2. **Value object idioms:** Immutable, validated data types with guaranteed invariants
3. **Reduced boilerplate:** Eliminate workarounds (factory classes, sealed interfaces, manual class implementations)
4. **Language consistency:** Align with Kotlin, Scala, and functional programming best practices

**Minimal risk, maximum benefit:** Backward compatible, no runtime overhead, solves real-world pain point.
