# Session 2: Core Principles

**Duration:** 2 hours

---

## Slide 1: Session 2 Overview

### Today's Focus:

1. **Parse, Don't Validate** - make invalid states unrepresentable
2. **Value Objects** - types with meaning and guarantees
3. **Sealed Interfaces** - exhaustive error handling
4. **JBCT Tooling** - CLI and Maven plugin setup

---

**SPEAKER NOTES:**

> Session 2 goes deeper into the principles behind JBCT. Session 1 introduced the four return types. Now we learn *why* they matter and how to design types that make incorrect code impossible.
>
> Parse Don't Validate is the core insight. Instead of checking if data is valid, we *parse* raw input into types that can only exist if valid.
>
> We'll build value objects and compose them into larger structures. Code examples continue from our RTB domain.

---

## Slide 2: The Validation Problem

### Traditional Approach:

```java
public class BidRequest {
    private String userId;
    private String siteId;
    private double bidFloor;

    public boolean isValid() {
        return userId != null && !userId.isBlank()
            && siteId != null && !siteId.isBlank()
            && bidFloor >= 0;
    }
}
```

### Problems:
1. Object can exist in invalid state
2. Caller must remember to call `isValid()`
3. No guarantee validation happened
4. Invalid object can be passed around

---

**SPEAKER NOTES:**

> Traditional validation looks like this. Object exists, then you check if it's valid. But between construction and validation, the object is in an undefined state.
>
> Anyone can forget to call isValid(). The compiler won't remind them. The invalid object can travel through your codebase, causing problems far from where it was created.
>
> This is called "shotgun parsing" - validation spread across multiple places, none of them authoritative.

---

## Slide 3: Parse, Don't Validate

### The Principle:

> "Use types that can only be constructed from valid data"

### JBCT Approach:

```java
public record BidRequest(UserId userId, AdPlacement placement, BidAmount floor) {
    // No validation needed - components are already valid
    // If you have a BidRequest, it IS valid
}
```

### Key Insight:
- Validation happens **once**, at construction
- After that, type guarantees validity
- Invalid BidRequest **cannot exist**

---

**SPEAKER NOTES:**

> Parse Don't Validate flips the model. Instead of "create then validate", we "parse to create". The parsing either succeeds and gives you a valid object, or fails with an error.
>
> Look at this BidRequest. It takes UserId, AdPlacement, BidAmount. Each of these is a value object that can only be constructed from valid data. If you have a BidRequest instance, every field is guaranteed valid.
>
> No isValid() method. No null checks. The type IS the validation.

---

## Slide 4: Value Objects - The Building Blocks

### What Makes a Value Object:

1. **Immutable** - cannot be changed after creation
2. **Validated** - invariants checked at construction
3. **Factory method** - returns `Result<T>`, not `T`
4. **Equality by value** - two objects with same data are equal

### Java Implementation:

```java
public record SiteId(String value) {
    public static Result<SiteId> siteId(String value) {
        return ensure(value, s -> s != null && !s.isBlank(), SiteError.EMPTY_SITE_ID)
            .flatMap(s -> ensure(s, SiteId::isValidFormat,
                v -> new SiteError.InvalidSiteId(v)))
            .map(SiteId::new);
    }

    private static boolean isValidFormat(String s) {
        return s.matches("^[a-z0-9-]+$");
    }
}
```

---

**SPEAKER NOTES:**

> Value objects are the atoms of Parse Don't Validate. Every domain concept gets its own type.
>
> Records are perfect for this. Immutable by default. Value equality built in.
>
> The key is the factory method. It's `static Result<SiteId> siteId(...)` not `new SiteId(...)`. You can't construct a SiteId directly - you must go through the factory, which validates.
>
> Notice the return type. Result, not SiteId. Construction can fail. That's explicit in the API.

---

## Slide 5: Why Not Just Validate in Constructor?

### Constructor Validation Problems:

```java
// DON'T DO THIS
public record SiteId(String value) {
    public SiteId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Invalid site ID");
        }
    }
}
```

### Problems:
1. **Throws exception** - forces try-catch everywhere
2. **Loses information** - exception message is string, not typed
3. **Breaks composition** - can't chain with flatMap
4. **Hidden failure mode** - constructor "looks" like it always works

---

**SPEAKER NOTES:**

> You might think: why not validate in the constructor? Throw if invalid?
>
> Three problems. First, exceptions force try-catch everywhere you construct. Verbose, error-prone.
>
> Second, exception message is a string. Caller doesn't know *what* went wrong programmatically. Was it null? Wrong format? Too long?
>
> Third, you can't compose. With Result, you chain: parse A, then B, then combine. With exceptions, each step needs its own try-catch.

---

## Slide 6: Primitive Obsession

### The Anti-Pattern:

```java
// Everywhere in codebase:
String siteId = "...";
String userId = "...";
String adSlotId = "...";

// Easy to mix up:
void processBid(String siteId, String userId, String adSlotId) { }

// Oops - wrong order, compiles fine:
processBid(userId, siteId, adSlotId);
```

### With Value Objects:

```java
void processBid(SiteId siteId, UserId userId, AdSlotId adSlotId) { }

// Compiler catches the mistake:
processBid(userId, siteId, adSlotId); // ERROR: type mismatch
```

---

**SPEAKER NOTES:**

> Primitive obsession is using String, int, double for everything. Site ID is String. User ID is String. Slot ID is String. All interchangeable to the compiler.
>
> You call a method with three strings. Mix up the order? Compiles fine. Runtime bug. Maybe silent data corruption.
>
> With value objects, each concept has its own type. Mix them up? Compiler error. Immediate feedback. No runtime surprises.
>
> This is why JBCT insists on value objects. Not bureaucracy - safety.

---

## Slide 7: Composed Value Objects

### Example: AdPlacement

An ad placement needs:
- **Site ID** - where the ad appears (validated format)
- **Slot ID** - specific position on page (validated)
- **Dimensions** - width × height (positive integers)
- **Position** - above fold, below fold, etc.

### Composed Value Object:

```java
public record AdPlacement(
    SiteId siteId,
    SlotId slotId,
    Dimensions dimensions,
    AdPosition position
) {
    public static Result<AdPlacement> adPlacement(
        String siteId, String slotId, int width, int height, String position
    ) {
        return Result.all(
            SiteId.siteId(siteId),
            SlotId.slotId(slotId),
            Dimensions.dimensions(width, height),
            AdPosition.parse(position)
        ).map(AdPlacement::new);
    }
}
```

---

**SPEAKER NOTES:**

> Now let's see how value objects compose into larger structures.
>
> AdPlacement has four components, each a validated value object. SiteId and SlotId are validated strings. Dimensions ensures width and height are positive. AdPosition is an enum parsed from string.
>
> The factory uses `Result.all()` - combines multiple Results. If any fails, the whole thing fails with that error. If all succeed, we get all values and construct AdPlacement.
>
> Notice: raw inputs are primitives (String, int). Output is fully validated AdPlacement. The parsing boundary is clear.

---

## Slide 8: Result.all() - Combining Validations

### Pattern: Parallel Validation

```java
// All validations run, collect all that succeed/fail
Result.all(
    validateA(input),
    validateB(input),
    validateC(input)
).map((a, b, c) -> new Combined(a, b, c));
```

### Behavior:
- All Results evaluated
- If any fails → returns first failure
- If all succeed → map receives all values

### vs. flatMap Chain:

```java
// Sequential - stops at first failure
validateA(input)
    .flatMap(a -> validateB(input)
        .flatMap(b -> validateC(input)
            .map(c -> new Combined(a, b, c))));
```

---

**SPEAKER NOTES:**

> Two patterns for combining validations. `Result.all()` runs all in parallel - useful when validations are independent.
>
> flatMap chain runs sequential - second only runs if first succeeds. Use when later validations depend on earlier results.
>
> For AdPlacement, validations are independent. Site ID validity doesn't depend on slot ID. So we use `all()`.
>
> Both return first failure. For collecting all errors, there's `Result.allErrors()` - but usually first error is enough.

---

## Slide 9: Sealed Interfaces for Errors

### The Problem with String Errors:

```java
// What can go wrong?
Result<AdPlacement> result = AdPlacement.parse(...);
result.onFailure(err -> {
    // err.message() is "Invalid site ID: xyz"
    // How do we handle different cases programmatically?
});
```

### Sealed Interface Solution:

```java
public sealed interface PlacementError extends Cause {
    record InvalidSiteId(String value) implements PlacementError { }
    record InvalidSlotId(String value) implements PlacementError { }
    record InvalidDimensions(int width, int height) implements PlacementError { }
    record UnknownPosition(String value) implements PlacementError { }
}
```

---

**SPEAKER NOTES:**

> Errors need structure too. String message tells human what's wrong. But code needs to *handle* different errors differently.
>
> Sealed interfaces are perfect. Define all possible error types. Compiler knows the complete list. Pattern matching ensures you handle all cases.
>
> Each error type carries relevant data. InvalidSiteId has the bad value. InvalidDimensions has width and height. Structured, not just strings.

---

## Slide 10: Exhaustive Error Handling

### Pattern Matching with Sealed Types:

```java
PlacementError error = ...;

String response = switch (error) {
    case InvalidSiteId(var id) -> "Unknown site: " + id;
    case InvalidSlotId(var id) -> "Invalid slot: " + id;
    case InvalidDimensions(var w, var h) ->
        "Bad dimensions: " + w + "x" + h;
    case UnknownPosition(var pos) -> "Unknown position: " + pos;
};
// Compiler ensures all cases covered!
```

### Add New Error Type:
```java
record SlotNotAvailable(SlotId slot) implements PlacementError { }
// Compiler ERROR: switch not exhaustive
// Must add case for SlotNotAvailable
```

---

**SPEAKER NOTES:**

> Pattern matching with sealed types is powerful. Switch on the error, handle each case. Compiler verifies exhaustiveness.
>
> Add a new error type later? Every switch that doesn't handle it becomes a compile error. You can't forget to update handling code.
>
> This is why we prefer sealed interfaces over exception hierarchies. Explicit, exhaustive, compiler-verified.

---

## Slide 11: Sealed Interfaces for Variants

### Example: TargetingCriteria

```java
public sealed interface TargetingCriteria {
    record Geographic(Country country, Option<Region> region)
        implements TargetingCriteria {}

    record Demographic(AgeRange ageRange, Option<Gender> gender)
        implements TargetingCriteria {}

    record Behavioral(Set<InterestCategory> interests)
        implements TargetingCriteria {}

    record Contextual(Set<ContentCategory> categories)
        implements TargetingCriteria {}

    record Combined(List<TargetingCriteria> criteria)
        implements TargetingCriteria {}
}
```

---

**SPEAKER NOTES:**

> Sealed interfaces aren't just for errors - they model domain variants beautifully.
>
> TargetingCriteria can be geographic, demographic, behavioral, contextual, or a combination. Each variant has different data.
>
> Combined allows nesting - "users in France AND interested in sports". The type system represents this naturally.
>
> When processing, switch on TargetingCriteria type. Compiler ensures you handle all cases.

---

## Slide 12: Option for Optional Fields

### When Absence is Normal:

```java
record Geographic(Country country, Option<Region> region) { }
```

### Why Not Null?

```java
// With null:
Geographic geo = new Geographic(country, null);
geo.region().toLowerCase(); // NPE!

// With Option:
Geographic geo = new Geographic(country, Option.empty());
geo.region()
   .map(Region::code)
   .fold(() -> "national", code -> code);
// Always safe
```

### Rule: Use Option when absence is valid business case

---

**SPEAKER NOTES:**

> Geographic targeting has country (required) and region (optional). Some campaigns target whole country, some specific regions.
>
> With null, you must remember to check. Forget once? NullPointerException somewhere unexpected.
>
> With Option, the type forces you to handle both cases. Can't call methods on the value without unwrapping. fold() requires both branches.
>
> Rule: if field can legitimately be absent, use Option. Null is for "this should never be null" cases only - and those should probably be validated anyway.

---

## Slide 13: Complete BidRequest

### Putting It All Together:

```java
public record BidRequest(
    RequestId id,
    UserId userId,
    AdPlacement placement,
    List<TargetingCriteria> targeting,
    BidAmount floorPrice,
    Instant deadline
) {
    public static Result<BidRequest> bidRequest(
        String id, String userId, AdPlacement placement,
        List<TargetingCriteria> targeting, String floorPrice, Instant deadline
    ) {
        return Result.all(
            RequestId.requestId(id),
            UserId.userId(userId),
            Result.success(placement),  // Already validated
            Result.success(targeting),   // Already validated
            BidAmount.parse(floorPrice),
            validateDeadline(deadline)
        ).map(BidRequest::new);
    }

    private static Result<Instant> validateDeadline(Instant deadline) {
        return ensure(deadline, d -> d.isAfter(Instant.now()),
            BidError.DEADLINE_PASSED);
    }
}
```

---

**SPEAKER NOTES:**

> BidRequest is our top-level aggregate. It's composed entirely of validated parts.
>
> Notice: placement and targeting are already value objects. We wrap in `Result.success()` to include in `all()`. No re-validation needed.
>
> Deadline validation is special - it's time-sensitive. Must be in future when request is created.
>
> If you have a BidRequest instance, everything is valid. ID exists, user exists, placement is complete, floor price is positive, deadline is future. All guaranteed by construction.

---

## Slide 14: JBCT CLI Introduction

### Installation:

```bash
# Install via Maven
mvn dependency:get -Dartifact=org.pragmatica.jbct:jbct-cli:0.6.0

# Or download directly
curl -L https://... -o jbct
chmod +x jbct
```

### Basic Commands:

```bash
# Check code against JBCT rules
jbct check src/

# Format code to JBCT style
jbct format src/

# Initialize new project with jbct.toml
jbct init
```

---

**SPEAKER NOTES:**

> JBCT provides a CLI tool that validates your code against the patterns we're learning.
>
> `jbct check` is the main command. It analyzes your code and reports violations. 37 rules covering return types, error handling, naming, structure.
>
> `jbct format` auto-fixes what it can. Formatting, import ordering, some structural issues.
>
> `jbct init` creates a config file. We'll look at that next.

---

## Slide 15: jbct.toml Configuration

### Configuration File:

```toml
# jbct.toml - JBCT configuration

[project]
name = "rtb-training"
java-version = "25"

[rules]
# Which rules to enable (default: all)
enabled = ["all"]

# Rules to disable
disabled = []

[rules.return-types]
# Require Result for methods that can fail
require-result = true
# Require Option for nullable returns
require-option = true

[rules.naming]
# Factory method naming: type() not of() or create()
factory-style = "type-name"

[format]
# Indentation
indent-size = 4
use-tabs = false
```

---

**SPEAKER NOTES:**

> Configuration lives in jbct.toml at project root. TOML format - simple, readable.
>
> Rules section controls which checks run. By default all 37 rules enabled. Disable specific ones if needed - but think hard before doing so.
>
> Key rules: require-result means methods that can fail must return Result. require-option means nullable returns must be Option.
>
> Factory style enforces naming. `bidAmount()` not `BidAmount.of()` or `BidAmount.create()`. Consistency across codebase.

---

## Slide 16: Maven Plugin Integration

### pom.xml Configuration:

```xml
<plugin>
    <groupId>org.pragmatica.jbct</groupId>
    <artifactId>jbct-maven-plugin</artifactId>
    <version>0.6.0</version>
    <executions>
        <execution>
            <goals>
                <goal>check</goal>
            </goals>
            <phase>verify</phase>
        </execution>
    </executions>
</plugin>
```

### Usage:

```bash
# Run check during build
mvn verify

# Run check standalone
mvn jbct:check

# Auto-format
mvn jbct:format
```

---

**SPEAKER NOTES:**

> For CI/CD integration, use the Maven plugin. Same rules as CLI, integrated into build.
>
> Bind to verify phase - runs after tests, before install. Build fails if JBCT violations found.
>
> This is your quality gate. Code that violates JBCT patterns doesn't get merged. Automated enforcement.
>
> Team doesn't need to remember rules. Tool enforces them. Code review focuses on business logic, not style debates.

---

## Slide 17: Exercise - Build Value Objects

### Your Task:

1. Open `session-2-core-principles` module
2. Implement the following value objects:
   - `SlotId` - ad slot identifier (alphanumeric + dash, max 32 chars)
   - `Dimensions` - width × height (both positive, max 4096)
   - `AdPosition` - enum: ABOVE_FOLD, BELOW_FOLD, SIDEBAR, FOOTER

3. Implement `AdPlacement` combining these

### Tests provided in `AdPlacementTest.java`

### Run: `mvn test -pl session-2-core-principles`

---

**SPEAKER NOTES:**

> Exercise time. Apply the patterns we discussed to build value objects.
>
> SlotId is similar to SiteId from Session 1. Alphanumeric plus dashes, max 32 characters.
>
> Dimensions must have positive width and height. Max 4096 for each - standard ad size limit.
>
> AdPosition is an enum. Parse from string - "above_fold" becomes ABOVE_FOLD. Handle unknown values with Result.
>
> Finally, compose into AdPlacement. Use Result.all() to combine validations.
>
> Tests are provided. Green means done.

---

## Slide 18: Key Takeaways

### Session 2 Summary:

1. **Parse, Don't Validate** - construct only valid objects
2. **Value Objects** - immutable, validated, factory returns Result
3. **Primitive Obsession** - replace strings with typed IDs
4. **Sealed Interfaces** - exhaustive error handling
5. **Option** - explicit handling of absence
6. **Composition** - Result.all() combines validations
7. **Tooling** - CLI and Maven plugin enforce patterns

### Next Session:
**Structural Patterns** - Leaf, Sequencer, Fork-Join

---

**SPEAKER NOTES:**

> Recap. Parse Don't Validate is the foundation. If you remember one thing, remember this.
>
> Value objects are how you implement it. Factory methods return Result. Constructors are private or package-private.
>
> Sealed interfaces make error handling exhaustive. Compiler is your friend.
>
> Option makes absence explicit. No more null checks scattered everywhere.
>
> Tooling enforces everything. CI fails on violations. Patterns become habits.
>
> Next session: structural patterns. How to organize code into composable pieces. Leaf methods, sequencers, fork-join for parallel operations.

---

## Slide 19: Homework

### Before Session 3:

1. **Read** book chapters 4-6
2. **Run** `jbct check` on your real codebase
3. **Identify** 3 primitive-obsession cases in your code:
   - Strings that should be typed IDs
   - Ints that should be value objects
   - Nullables that should be Option

### Bring to Session 3:
List of primitives you'd convert to value objects

---

**SPEAKER NOTES:**

> Homework. Read chapters 4-6 on validation and error handling.
>
> Run jbct check on your real code. See what violations it finds. Don't fix yet - just observe.
>
> Most important: find primitive obsession. Where do you pass strings that have meaning? User IDs, order numbers, config values? Each is a candidate for value object.
>
> Bring your list. We'll discuss which ones matter most and how to prioritize migration.
>
> See you in Session 3.
