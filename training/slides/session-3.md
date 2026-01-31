# Session 3: Patterns

**Duration:** 2 hours

---

## Slide 1: Session 3 Overview

### Today's Focus:

1. **Leaf Pattern** - atomic, single-purpose methods
2. **Condition Pattern** - branching without nesting
3. **Iteration Pattern** - processing collections
4. **Three-Zone Architecture** - External, Adapter, Domain
5. **Sequencer Pattern** - 2-5 step workflows
6. **Fork-Join Pattern** - parallel operations

**Code examples:** Building the complete bid evaluation pipeline

---

**SPEAKER NOTES:**

> Session 3 is about structure. Sessions 1 and 2 taught types and validation. Now we organize code into composable pieces.
>
> Six patterns. Each solves a specific structural problem. Together they cover virtually any business logic.
>
> We'll build the bid evaluation pipeline from our example domain. From receiving a request to selecting a winning bid. Real complexity, clean structure.

---

## Slide 2: The Problem with Large Methods

### Typical "Do Everything" Method:

```java
public Bid evaluateBid(BidRequest request, BidResponse response) {
    // 1. Validate request (15 lines)
    if (request == null || response == null) { ... }
    if (!request.deadline().isAfter(Instant.now())) { ... }

    // 2. Check targeting (20 lines)
    boolean matches = false;
    for (var criteria : request.targeting()) {
        if (criteria instanceof Geographic geo) { ... }
        else if (criteria instanceof Demographic demo) { ... }
        // ... more cases
    }

    // 3. Calculate bid (10 lines)
    BigDecimal base = response.amount();
    if (placement.isPremium()) { base = base.multiply(...); }
    // ... adjustments

    // 4. Apply floor (5 lines)
    if (base.compareTo(request.floor()) < 0) { ... }

    return new Bid(...);
}
```

**50+ lines, 4 responsibilities, hard to test**

---

**SPEAKER NOTES:**

> Here's what most code looks like. One method doing everything. Validation, business logic, calculations, all mixed together.
>
> 50 lines. Multiple responsibilities. You want to test targeting logic? You need the whole method. You want to change floor handling? Hope you don't break validation.
>
> This is the "God method" anti-pattern. JBCT patterns break it into composable pieces.

---

## Slide 3: The Leaf Pattern

### Definition:

> A **Leaf** is a method that does ONE thing with NO side effects and returns a Result/Option/Promise

### Characteristics:
- **Single responsibility** - one clear purpose
- **Pure function** - same inputs → same outputs
- **5-15 lines** - fits on one screen
- **Named for what it does** - verb phrase

### Example:

```java
/// Check if bid amount meets the floor price requirement.
Result<BidAmount> applyFloorPrice(BidAmount bid, BidAmount floor) {
    return ensure(bid, b -> b.compareTo(floor) >= 0,
        () -> new BidError.BelowFloor(bid, floor));
}
```

---

**SPEAKER NOTES:**

> Leaf is the fundamental pattern. One method, one job. No side effects.
>
> This method checks floor price. That's it. Doesn't validate the request. Doesn't check targeting. Just: is bid >= floor?
>
> 5 lines. Trivially testable. Reusable. You can compose it with other Leafs to build complex flows.
>
> Name is a verb phrase: "apply floor price". Not "floorCheck" or "validateFloor". Clear action.

---

## Slide 4: Leaf Pattern Examples

### Example 1: Targeting Match

```java
/// Check if user matches geographic targeting.
Result<UserId> matchGeographic(UserId user, Geographic targeting) {
    return userLocationService.getCountry(user)
        .flatMap(country -> ensure(country, c -> c.equals(targeting.country()),
            () -> new TargetingError.CountryMismatch(country, targeting.country())));
}
```

### Example 2: Bid Adjustment

```java
/// Apply premium multiplier for above-fold placements.
BidAmount applyPremiumMultiplier(BidAmount base, AdPlacement placement) {
    return placement.isPremium()
        ? new BidAmount(base.value().multiply(PREMIUM_MULTIPLIER))
        : base;
}
```

### Example 3: Deadline Check

```java
/// Verify auction deadline hasn't passed.
Result<Instant> checkDeadline(Instant deadline) {
    return ensure(deadline, d -> d.isAfter(Instant.now()),
        BidError.DEADLINE_PASSED);
}
```

---

**SPEAKER NOTES:**

> Three Leaf examples from our domain.
>
> Geographic match: get user's country, check against targeting. Returns Result - might fail if user not found or doesn't match.
>
> Premium multiplier: pure calculation. Takes base amount and placement, returns adjusted amount. No Result needed - can't fail.
>
> Deadline check: verify we still have time. Simple predicate wrapped in ensure.
>
> Each is independent. Testable in isolation. Composable with others.

---

## Slide 5: The Condition Pattern

### Problem: Nested If-Else

```java
// DON'T DO THIS
if (condition1) {
    if (condition2) {
        if (condition3) {
            doSomething();
        } else {
            handleCase3();
        }
    } else {
        handleCase2();
    }
} else {
    handleCase1();
}
```

### Solution: Guard Clauses + Pattern Matching

```java
// DO THIS
if (!condition1) return handleCase1();
if (!condition2) return handleCase2();
if (!condition3) return handleCase3();
return doSomething();
```

---

**SPEAKER NOTES:**

> Nested conditions are hard to read. Each level adds mental overhead. Easy to get lost.
>
> Guard clauses flatten the structure. Early returns for each failure case. Happy path at the bottom.
>
> Rule: if you're more than 2 levels deep, refactor. Use guard clauses or extract to separate methods.

---

## Slide 6: Condition with Sealed Types

### Pattern Matching for Targeting:

```java
/// Evaluate if user matches targeting criteria.
Result<UserId> matchTargeting(UserId user, TargetingCriteria criteria) {
    return switch (criteria) {
        case Geographic geo -> matchGeographic(user, geo);
        case Demographic demo -> matchDemographic(user, demo);
        case Behavioral behav -> matchBehavioral(user, behav);
        case Contextual ctx -> matchContextual(user, ctx);
        case Combined combined -> matchCombined(user, combined);
    };
}
```

### Benefits:
- **Exhaustive** - compiler ensures all cases handled
- **Flat** - no nesting, each case is one line
- **Extensible** - add new variant → compiler errors show where to update

---

**SPEAKER NOTES:**

> Pattern matching with sealed types is the cleanest condition handling.
>
> Switch on the sealed interface. Each variant gets its own case. Compiler enforces exhaustiveness.
>
> Each case delegates to a Leaf method. Switch stays short - just dispatch, no logic.
>
> Add a new targeting type later? Compiler shows you every switch that needs updating. Can't forget.

---

## Slide 7: The Iteration Pattern

### Processing Collections with Result:

```java
/// Evaluate all bids and collect valid ones.
Result<List<Bid>> evaluateBids(List<BidResponse> responses, BidRequest request) {
    List<Bid> validBids = new ArrayList<>();

    for (var response : responses) {
        Result<Bid> result = evaluateSingleBid(response, request);
        result.onSuccess(validBids::add);
        // Failures are silently dropped - DSP didn't match or bid too low
    }

    return validBids.isEmpty()
        ? Result.failure(BidError.NO_BIDS)
        : Result.success(validBids);
}
```

### Alternative: Stream with Filter

```java
Result<List<Bid>> evaluateBids(List<BidResponse> responses, BidRequest request) {
    var validBids = responses.stream()
        .map(r -> evaluateSingleBid(r, request))
        .filter(Result::isSuccess)
        .map(Result::unwrap)
        .toList();

    return validBids.isEmpty()
        ? Result.failure(BidError.NO_BIDS)
        : Result.success(validBids);
}
```

---

**SPEAKER NOTES:**

> Iteration with Results needs care. What do you do with failures?
>
> In bid evaluation, failures are normal. A bidder might not match targeting, or bid below floor. We want all successful bids, ignore failures.
>
> Two approaches. Explicit loop with onSuccess - clear what happens. Stream with filter - more concise.
>
> Key: decide upfront what failures mean. Collect and report? Silently drop? Fail entire operation?

---

## Slide 8: Three-Zone Architecture

### The Three Zones:

```
┌─────────────────────────────────────────────────────────┐
│                    EXTERNAL ZONE                         │
│  Raw HTTP, JSON, external service responses              │
│  Types: String, JsonNode, byte[]                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼ Parse
┌─────────────────────────────────────────────────────────┐
│                    ADAPTER ZONE                          │
│  Validation, parsing, error mapping                      │
│  Types: Result<T>, Option<T>                            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼ Unwrap (or propagate)
┌─────────────────────────────────────────────────────────┐
│                    DOMAIN ZONE                           │
│  Pure business logic, value objects                      │
│  Types: BidRequest, AdPlacement, BidAmount              │
└─────────────────────────────────────────────────────────┘
```

---

**SPEAKER NOTES:**

> Three-zone architecture organizes code by trust level.
>
> External zone: raw data from outside. Strings, JSON, HTTP bodies. Untrusted. Could be anything.
>
> Adapter zone: parsing and validation. This is where "Parse Don't Validate" happens. Raw data becomes value objects or errors.
>
> Domain zone: pure business logic. All data is validated. No null checks needed. Just business rules.
>
> Parsing happens at the boundary. Once in domain zone, you work with guaranteed-valid types.

---

## Slide 9: Three-Zone Example

### External Zone (Controller):

```java
@PostMapping("/bid")
public ResponseEntity<String> handleBidRequest(@RequestBody String json) {
    return bidRequestAdapter.parseBidRequest(json)
        .flatMap(bidService::processBid)
        .fold(
            error -> ResponseEntity.badRequest().body(error.message()),
            bid -> ResponseEntity.ok(serializeBid(bid))
        );
}
```

### Adapter Zone:

```java
Result<BidRequest> parseBidRequest(String json) {
    return parseJson(json, BidRequestDto.class)
        .flatMap(this::toDomain);
}
```

### Domain Zone:

```java
Result<Bid> processBid(BidRequest request) {
    // Pure business logic - request is guaranteed valid
    return evaluateTargeting(request)
        .flatMap(this::queryDsps)
        .flatMap(this::selectWinner);
}
```

---

**SPEAKER NOTES:**

> Here's three-zone in practice.
>
> Controller receives raw JSON string. External zone. Calls adapter to parse.
>
> Adapter parses JSON to DTO, then converts DTO to domain objects. Each step returns Result. Errors propagate automatically.
>
> Domain receives BidRequest - guaranteed valid. No validation here. Pure business logic.
>
> Notice: error handling in one place (controller). Domain code is clean. Adapter handles messy parsing.

---

## Slide 10: The Sequencer Pattern

### Definition:

> **Sequencer** chains 2-5 operations where each step depends on the previous

### Structure:

```java
Result<Output> process(Input input) {
    return step1(input)           // Result<A>
        .flatMap(this::step2)     // A -> Result<B>
        .flatMap(this::step3)     // B -> Result<C>
        .map(this::step4);        // C -> Output (can't fail)
}
```

### Rules:
- **2-5 steps** - more than 5? Break into sub-sequencers
- **Each step is a Leaf** - single responsibility
- **Named descriptively** - sequence name describes the workflow

---

**SPEAKER NOTES:**

> Sequencer is chained operations. Step 2 uses step 1's result. Step 3 uses step 2's result.
>
> flatMap for steps that can fail. map for pure transformations at the end.
>
> 2-5 steps rule. More than 5? Your method does too much. Extract sub-workflows.
>
> This is the replacement for procedural code. Instead of sequential statements with if-checks, we have typed composition.

---

## Slide 11: Sequencer Example - Bid Evaluation

### The Flow:

```java
/// Evaluate a single bid response against the request.
Result<Bid> evaluateBid(BidResponse response, BidRequest request) {
    return checkDeadline(request.deadline())           // Step 1: Time check
        .flatMap(_ -> matchTargeting(request))         // Step 2: Targeting
        .flatMap(_ -> applyFloorPrice(                 // Step 3: Floor
            response.amount(), request.floorPrice()))
        .flatMap(amount -> calculateFinalBid(          // Step 4: Adjustments
            amount, request.placement()))
        .map(amount -> Bid.bid(                        // Step 5: Create result
            response.dspId(), amount, response.adMarkup()));
}
```

### Each Step is a Leaf:
- `checkDeadline` - verify time remains
- `matchTargeting` - verify user matches
- `applyFloorPrice` - verify bid meets minimum
- `calculateFinalBid` - apply adjustments
- `Bid.bid` - create final bid object

---

**SPEAKER NOTES:**

> Real sequencer for bid evaluation. Five steps, each a Leaf.
>
> Deadline check first - fail fast if auction expired.
>
> Targeting match - does this user qualify?
>
> Floor price - is bid high enough?
>
> Final calculation - adjust for premium placement, etc.
>
> Create bid object - assemble the result.
>
> Any step fails? Whole evaluation fails with that step's error. No explicit error handling in the sequencer.

---

## Slide 12: The Fork-Join Pattern

### Definition:

> **Fork-Join** executes multiple independent operations in parallel, then combines results

### When to Use:
- Operations are **independent** - don't depend on each other
- You need **all results** (or all that succeed)
- Time matters - **parallel is faster** than sequential

### Example Use Case:
Querying multiple DSPs simultaneously

---

**SPEAKER NOTES:**

> Fork-Join is for parallel work. You have multiple independent tasks. Run them all at once, combine results.
>
> This is essential for performance. Query 10 external services. Sequential would take 500ms. Parallel takes 50ms - the slowest service.
>
> Two variants: all must succeed, or collect successes. In bidding, we want all successful bids - some services might timeout.

---

## Slide 13: Fork-Join with Promise

### Query Multiple DSPs:

```java
/// Query all DSPs in parallel and collect successful bids.
Promise<List<BidResponse>> queryAllDsps(BidRequest request, List<DspEndpoint> dsps) {
    // Fork: launch all queries
    List<Promise<BidResponse>> queries = dsps.stream()
        .map(dsp -> queryDsp(dsp, request)
            .timeout(TimeSpan.timeSpan(50).millis()))
        .toList();

    // Join: collect successful responses
    return Promise.allSuccesses(queries);
}

/// Query a single DSP.
Promise<BidResponse> queryDsp(DspEndpoint dsp, BidRequest request) {
    return httpClient.post(dsp.url(), request)
        .map(BidResponse::fromJson);
}
```

### `Promise.allSuccesses` vs `Promise.all`:
- `all` - fails if ANY fails
- `allSuccesses` - returns list of successes, ignores failures

---

**SPEAKER NOTES:**

> Fork phase: create a Promise for each DSP query. Each has independent timeout.
>
> Join phase: `Promise.allSuccesses` waits for all to complete, collects successes.
>
> Failed/timed-out DSPs are silently dropped. We get bids from whoever responds in time.
>
> Alternative: `Promise.all` fails if any fails. Use when you need all responses or nothing.

---

## Slide 14: Complete Pipeline Example

### Combining All Patterns:

```java
/// Process a complete RTB auction.
Promise<AuctionResult> processAuction(String rawRequest) {
    // Adapter: parse external input
    return parseBidRequest(rawRequest)
        .toPromise()
        // Domain: fork to DSPs
        .flatMap(request -> queryAllDsps(request, getDsps())
            // Domain: evaluate each response
            .map(responses -> evaluateAllBids(responses, request))
            // Domain: select winner
            .flatMap(bids -> selectWinner(bids, request)));
}

/// Evaluate all bid responses (Iteration)
Result<List<Bid>> evaluateAllBids(List<BidResponse> responses, BidRequest request) {
    return responses.stream()
        .map(r -> evaluateBid(r, request))  // Sequencer for each
        .filter(Result::isSuccess)
        .map(Result::unwrap)
        .collect(collectingAndThen(toList(),
            bids -> bids.isEmpty()
                ? Result.failure(BidError.NO_BIDS)
                : Result.success(bids)));
}
```

---

**SPEAKER NOTES:**

> Complete pipeline using all patterns.
>
> Adapter parses raw JSON to BidRequest. toPromise() lifts Result into Promise for async chain.
>
> Fork-Join queries DSPs in parallel.
>
> Iteration evaluates each response using Sequencer.
>
> Final step selects winner from valid bids.
>
> Each piece is a pattern. Composable, testable, readable.

---

## Slide 15: Pattern Selection Guide

### Decision Tree:

```
What are you doing?
│
├─ Single operation, can fail?
│  └─ LEAF: one method, returns Result<T>
│
├─ Branching on type or condition?
│  └─ CONDITION: pattern match or guard clauses
│
├─ Processing a collection?
│  └─ ITERATION: stream or loop with Result handling
│
├─ Sequential steps, each using previous result?
│  └─ SEQUENCER: flatMap chain, 2-5 steps
│
├─ Independent parallel operations?
│  └─ FORK-JOIN: Promise.all or Promise.allSuccesses
│
└─ Crossing trust boundary?
   └─ THREE-ZONE: External → Adapter → Domain
```

---

**SPEAKER NOTES:**

> Use this guide when structuring code.
>
> Single operation? Leaf. Keep it small and focused.
>
> Multiple cases to handle? Condition. Pattern match if sealed, guards otherwise.
>
> Collection to process? Iteration. Decide what to do with failures upfront.
>
> Steps that depend on each other? Sequencer. 2-5 steps max.
>
> Independent parallel work? Fork-Join. Choose all vs allSuccesses.
>
> Raw external data? Three-Zone. Parse at the boundary.

---

## Slide 16: Exercise - Build Auction Pipeline

### Your Task (25 minutes):

1. Open `session-3-patterns` module
2. Implement the following:
   - `BidEvaluator.evaluateBid()` - Sequencer with 4 steps
   - `AuctionService.queryDsps()` - Fork-Join pattern
   - `AuctionService.selectWinner()` - find highest valid bid
   - `AuctionService.processAuction()` - combine all pieces

3. Tests in `AuctionServiceTest.java`

### Run: `mvn test -pl session-3-patterns`

---

**SPEAKER NOTES:**

> Exercise time. Build the auction pipeline using all patterns.
>
> BidEvaluator uses Sequencer pattern. Four steps: deadline, targeting, floor, final calculation.
>
> AuctionService.queryDsps uses Fork-Join. Query multiple DSPs in parallel.
>
> selectWinner finds highest bid from valid bids. Simple iteration.
>
> processAuction combines everything. Parse → query → evaluate → select.
>
> Tests provided.

---

## Slide 17: Key Takeaways

### Session 3 Summary:

1. **Leaf** - atomic method, one job, 5-15 lines
2. **Condition** - guard clauses, pattern matching, flat
3. **Iteration** - decide failure handling upfront
4. **Three-Zone** - parse at boundary, pure domain
5. **Sequencer** - 2-5 dependent steps, flatMap chain
6. **Fork-Join** - parallel independence, combine results

### The Meta-Pattern:
**Large methods → composed small methods**

### Next Session:
**Adoption & Integration** - AI, CI/CD, team workflow

---

**SPEAKER NOTES:**

> Six patterns. That's the toolkit.
>
> Leaf is the atom. Everything composes from Leafs.
>
> Condition handles branching cleanly.
>
> Iteration handles collections with explicit failure strategy.
>
> Three-Zone separates parsing from logic.
>
> Sequencer chains dependent operations.
>
> Fork-Join parallelizes independent operations.
>
> The meta-pattern: break large methods into small composed methods. Each pattern tells you how.

---

## Slide 18: Homework

### Before Session 4:

1. **Read** book chapters 7-8 on structural patterns
2. **Identify** in your codebase:
   - One "God method" that needs breaking up
   - One place where parallel execution would help
   - One parsing boundary that should be explicit

3. **Run** `jbct check` - review pattern violations

### Bring to Session 4:
The God method you identified (we'll refactor it)

---

**SPEAKER NOTES:**

> Homework. Read chapters 7-8 on patterns.
>
> Find a God method in your codebase. Something doing too much. We'll use it as example in Session 4.
>
> Find a parallelization opportunity. Sequential calls that could be parallel.
>
> Find a messy parsing boundary. Raw data handling mixed with business logic.
>
> jbct check will flag pattern violations. Review what it finds.
>
> See you in Session 4 for adoption and integration.
