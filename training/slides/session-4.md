# Session 4: Adoption & Integration

**Duration:** 2 hours

---

## Session Overview

**Goal:** Successfully integrate JBCT into existing codebases

**Topics:**
1. Migration strategies
2. Boundary handling
3. Testing patterns
4. Team adoption

---

## The Migration Paradox

**Problem:** Can't rewrite everything at once

**Solution:** Incremental adoption
- New code uses Result/Option
- Legacy code wrapped at boundaries
- Gradual migration inward

**Key insight:** Result and exceptions coexist peacefully

---

## Slide 4: Boundary Pattern

```java
// Calling legacy code from Result-based code
public Result<Bid> processLegacyBid(String bidJson) {
    return Result.lift(() -> legacyParser.parse(bidJson))
        .mapError(e -> new ParseError(e.getMessage()));
}

// Calling Result-based code from legacy code
public Bid processModernBid(BidRequest request) throws BidException {
    return evaluateBid(request)
        .orElseThrow(cause -> new BidException(cause.message()));
}
```

---

## Slide 5: Result.lift() - Your Migration Tool

```java
// Wrap any throwing operation
Result<URI> uri = Result.lift(() -> URI.create(urlString));

// With custom error mapping
Result<BidConfig> config = Result.lift(() -> loadConfig(path))
    .mapError(e -> new ConfigError(e.getMessage()));

// Chain with other operations
Result<Bid> bid = Result.lift(() -> parseJson(json))
    .flatMap(this::validateBid)
    .map(this::enrichBid);
```

---

## Slide 6: Converting Null Returns

```java
// Legacy code that returns null
public class LegacyCache {
    public Bid getBid(String id) { ... } // returns null if not found
}

// Modern wrapper
public Option<Bid> findBid(String id) {
    return Option.option(legacyCache.getBid(id));
}

// Or with Result for richer errors
public Result<Bid> getBid(String id) {
    return Option.option(legacyCache.getBid(id))
        .toResult(() -> new BidNotFound(id));
}
```

---

## Slide 7: Exposing Result to Legacy Callers

```java
// Modern service
public class BidService {
    public Result<Bid> evaluateBid(BidRequest request) { ... }
}

// Legacy adapter
public class BidServiceAdapter {
    private final BidService service;

    public Bid evaluateBid(BidRequest request) throws BidException {
        return service.evaluateBid(request)
            .orElseThrow(cause -> toBidException(cause));
    }

    private BidException toBidException(Cause cause) {
        return switch (cause) {
            case BidError.DeadlinePassed _ -> new DeadlineException();
            case BidError.BelowFloor bf -> new FloorException(bf.bid(), bf.floor());
            default -> new BidException(cause.message());
        };
    }
}
```

---

## Slide 8: Testing Pure Functions

```java
@Test
void validBidSucceeds() {
    BidRequest request = validRequest();
    BidResponse response = validResponse();

    Result<Bid> result = evaluateBid(response, request);

    assertTrue(result.isSuccess());
    assertEquals("dsp-1", result.unwrap().dspId());
}

@Test
void expiredDeadlineFails() {
    BidRequest request = expiredRequest();
    BidResponse response = validResponse();

    Result<Bid> result = evaluateBid(response, request);

    assertTrue(result.isFailure());
    assertInstanceOf(DeadlinePassed.class, extractCause(result));
}
```

---

## Slide 9: Testing Error Paths

```java
private Cause extractCause(Result<?> result) {
    return result.fold(cause -> cause, _ -> fail("Expected failure"));
}

@Test
void belowFloorReportsCorrectValues() {
    Result<Bid> result = applyFloor(new BigDecimal("3.00"), new BigDecimal("5.00"));

    assertTrue(result.isFailure());
    Cause cause = extractCause(result);

    assertInstanceOf(BelowFloor.class, cause);
    BelowFloor error = (BelowFloor) cause;
    assertEquals("3.00", error.bid());
    assertEquals("5.00", error.floor());
}
```

---

## Slide 10: Property-Based Testing

```java
import static org.pragmatica.testing.Arbitrary.*;
import static org.pragmatica.testing.PropertyTest.*;

@Test
void validBidsAlwaysExceedFloor() {
    var amounts = longs(1, 200).map(BigDecimal::valueOf);

    Result<PropertyResult> result = forAll(amounts, amounts)
        .tries(1000)
        .check((floor, bid) -> {
            Result<BigDecimal> r = applyFloor(bid, floor);
            return bid.compareTo(floor) >= 0
                ? r.isSuccess()
                : r.isFailure();
        });

    assertTrue(result.isSuccess());
    assertInstanceOf(PropertyResult.Passed.class, result.unwrap());
}
```

---

## Slide 11: Testing Async Code

```java
@Test
void auctionCompletesWithValidBids() {
    var service = new AuctionService(mockClient(), testDsps());
    var request = validRequest();

    Promise<Bid> promise = service.processAuction(request);

    // Wait with timeout
    Result<Bid> result = promise.await(TimeSpan.timeSpan(1).seconds());

    assertTrue(result.isSuccess());
    assertNotNull(result.unwrap().dspId());
}
```

---

## Slide 12: Team Adoption Strategy

**Phase 1: Foundation (Week 1-2)**
- Learn Result, Option, Promise basics
- Practice leaf methods
- Code review checklist

**Phase 2: Application (Week 3-4)**
- Apply patterns in new code
- Wrap legacy boundaries
- Pair programming sessions

**Phase 3: Expansion (Month 2+)**
- Migrate high-value legacy code
- Share patterns across team
- Establish team conventions

---

## Slide 13: JBCT CLI in CI/CD

**Maven plugin configuration:**

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
        </execution>
    </executions>
    <configuration>
        <failOnError>false</failOnError>  <!-- Start with warnings -->
    </configuration>
</plugin>
```

Run: `mvn jbct:check`

> **Speaker notes:**
> - JBCT isn't just guidelines - it's enforceable through tooling
> - The plugin performs static analysis: checks return types, validates factory methods return Result, detects null returns, etc.
> - Key insight: `failOnError=false` lets you see violations without breaking builds - essential for brownfield projects
> - Binds to `verify` phase by default, so runs with `mvn verify` or explicitly with `mvn jbct:check`
> - Reports show exactly which patterns are violated and where - actionable feedback

---

## Slide 14: Gradual Enforcement

**Phase 1: Observe (Week 1-2)**
```xml
<failOnError>false</failOnError>
```
- Runs checks, reports violations as warnings
- Team sees what needs fixing without blocking builds

**Phase 2: Enforce new code (Week 3+)**
```xml
<includes>
    <include>**/new/**</include>
</includes>
<failOnError>true</failOnError>
```
- New packages must comply
- Legacy code still allowed

**Phase 3: Full enforcement**
```xml
<failOnError>true</failOnError>
```

> **Speaker notes:**
> - This mirrors the team adoption phases - tooling supports the process
> - Phase 1 is critical: teams see the gap between current state and target without pressure
> - Phase 2 uses includes/excludes to draw a line: "everything after this date must comply"
> - Common pattern: new features in new packages, legacy stays untouched initially
> - Phase 3 typically happens when most code already passes - flipping the switch is a formality
> - Anti-pattern: going straight to Phase 3 - creates resistance, teams disable the plugin

---

## Slide 15: GitHub Actions Integration

```yaml
name: JBCT Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Run JBCT checks
        run: mvn jbct:check

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: jbct-report
          path: target/jbct-report.html
```

> **Speaker notes:**
> - Runs on every push and PR - catches violations before merge
> - `if: always()` ensures report is uploaded even when checks fail - you need to see what broke
> - Reports are downloadable artifacts - reviewers can see exactly what needs fixing
> - Pro tip: add as required check on protected branches once team is ready for enforcement
> - Can also post summary as PR comment using additional actions

---

## Slide 16: GitLab CI Integration

```yaml
stages:
  - build
  - validate
  - test

build:
  stage: build
  script:
    - mvn compile

jbct-check:
  stage: validate
  script:
    - mvn jbct:check
  artifacts:
    when: always
    paths:
      - target/jbct-report.html
    reports:
      codequality: target/jbct-report.json

test:
  stage: test
  script:
    - mvn test
```

> **Speaker notes:**
> - Separate `validate` stage makes JBCT status visible in pipeline view
> - `when: always` - same principle as GitHub, always capture the report
> - GitLab's `codequality` report integration shows violations inline in merge requests
> - Validation runs after compile but before tests - fail fast on structural issues
> - Teams often add `allow_failure: true` during Phase 1 - pipeline stays green while team observes

---

## Slide 17: Code Review Checklist

```
□ No raw null returns - use Option
□ No checked exceptions - use Result
□ Value objects validate at creation
□ Sealed error hierarchies for domain errors
□ Error types are specific and descriptive
□ fold/map/flatMap instead of if/else
□ Leaf methods are single-purpose
□ Sequencer chains are readable
```

---

## Slide 18: Common Migration Anti-patterns

**Anti-pattern 1: Wrapping too deep**
```java
// Bad: wrapping internal code
Result<Result<Bid>> nested = ...
```

**Anti-pattern 2: Unwrapping too early**
```java
// Bad: breaking the chain
Bid bid = validateBid(response).unwrap();  // throws!
return enrichBid(bid);
```

**Anti-pattern 3: Ignoring errors**
```java
// Bad: silent failure
return validateBid(response).fold(_ -> null, bid -> bid);
```

---

## Slide 19: The Right Unwrap Patterns

```java
// At API boundaries (controllers)
return processRequest(req)
    .fold(
        cause -> errorResponse(cause),
        bid -> successResponse(bid)
    );

// In tests
assertTrue(result.isSuccess());
Bid bid = result.unwrap();  // Safe after isSuccess check

// With default value (when appropriate)
BigDecimal amount = parseAmount(input)
    .fold(_ -> BigDecimal.ZERO, a -> a);
```

---

## Slide 20: Example - Complete Request Flow

```java
public class RtbController {
    private final AuctionService auctionService;

    public Response handleBidRequest(Request httpRequest) {
        return parseBidRequest(httpRequest)
            .toPromise()
            .flatMap(auctionService::processAuction)
            .await(TimeSpan.timeSpan(120).millis())
            .fold(
                cause -> toErrorResponse(cause),
                bid -> toSuccessResponse(bid)
            );
    }
}
```

---

## Slide 21: Measuring Success

**Code metrics:**
- Reduced null checks
- Fewer try-catch blocks
- Smaller method sizes

**Runtime metrics:**
- Fewer NullPointerExceptions
- Better error messages in logs
- Easier debugging

**Team metrics:**
- Faster code reviews
- More confident refactoring
- Better onboarding

---

## Slide 22: Summary

**Migration:** Incremental, boundary-focused

**Testing:** Pure functions are easy to test

**Adoption:** Phase-based, team-supported

**CI/CD:** Gradual enforcement with JBCT Maven plugin

**Key tools:**
- `Result.lift()` for wrapping legacy
- `Option.option()` for null conversion
- `mvn jbct:check` for automated validation

**Next:** Apply these patterns in your codebase!

---

## Session 4 Exercise

**Task:** Create a legacy adapter layer

1. Wrap a throwing parser with `Result.lift()`
2. Convert null-returning lookup to `Option`
3. Create adapter exposing Result methods to legacy callers
4. Write comprehensive tests for success and error paths

**Time:** 30 minutes
