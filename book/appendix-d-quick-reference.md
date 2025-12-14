# Appendix D: Quick Reference Cards

Tear-out reference cards for daily use.

---

## Card 1: Return Type Selection

```
┌─────────────────────────────────────────────────────────┐
│                RETURN TYPE DECISION                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Can it fail?                                            │
│     NO  → Is value optional?                             │
│              NO  → Return T                              │
│              YES → Return Option<T>                      │
│     YES → Is it async/IO?                                │
│              NO  → Return Result<T>                      │
│              YES → Return Promise<T>                     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  EXAMPLES                                                │
│                                                          │
│  T           calculateSum(int a, int b)                  │
│  Option<T>   findInCache(Key key)                        │
│  Result<T>   Email.email(String raw)                     │
│  Promise<T>  fetchUser(UserId id)                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 2: Type Conversions

```
┌─────────────────────────────────────────────────────────┐
│                TYPE CONVERSIONS                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  LIFTING (Safe - adds information)                       │
│                                                          │
│  Option → Result    option.toResult(cause)               │
│  Option → Promise   option.async(cause)                  │
│  Result → Promise   result.async()                       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  LOWERING (Use sparingly - loses information)            │
│                                                          │
│  Promise → Result   promise.await()         // blocks    │
│  Result → Option    result.option()         // loses err │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  FAILURE CREATION (Prefer Cause methods)                 │
│                                                          │
│  cause.result()     // Result<T> failure                 │
│  cause.promise()    // Promise<T> failure                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 3: Common Operations

```
┌─────────────────────────────────────────────────────────┐
│                COMMON OPERATIONS                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  TRANSFORMATION                                          │
│                                                          │
│  .map(fn)        Transform success value                 │
│  .flatMap(fn)    Chain operations (fn returns M<T>)      │
│  .filter(c, p)   Validate with predicate                 │
│  .mapToUnit()    Discard value, keep success/failure     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ERROR HANDLING                                          │
│                                                          │
│  .recover(fn)    Handle failure (fn: Cause -> M<T>)      │
│  .or(value)      Provide fallback value                  │
│  .orElse(m)      Provide fallback monad                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CALLBACKS                                               │
│                                                          │
│  .onSuccess(c)   Run on success                          │
│  .onFailure(c)   Run on failure                          │
│  .onResult(c)    Run on either                           │
│  .fold(f, s)     Transform both cases (failure, success) │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 4: Aggregation

```
┌─────────────────────────────────────────────────────────┐
│                AGGREGATION                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Result.all(r1, r2, ...)                                 │
│     → Accumulates ALL failures into CompositeCause       │
│     → Use for independent validations                    │
│                                                          │
│  Promise.all(p1, p2, ...)                                │
│     → Runs in parallel, fails fast on first failure      │
│     → Use for independent async operations               │
│                                                          │
│  Result.allOf(List<Result<T>>)                           │
│     → Combines list of results into Result<List<T>>      │
│                                                          │
│  Promise.allOf(List<Promise<T>>)                         │
│     → Combines list of promises, waits for all           │
│     → Returns Promise<List<Result<T>>>                   │
│                                                          │
│  Promise.any(p1, p2, ...)                                │
│     → Returns first success, cancels others              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 5: Pattern Selection

```
┌─────────────────────────────────────────────────────────┐
│                PATTERN SELECTION                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SEQUENCER                                               │
│  When: Steps depend on previous results                  │
│  Code: a.flatMap(b).flatMap(c)                           │
│                                                          │
│  FORK-JOIN                                               │
│  When: Independent operations, need all results          │
│  Code: Promise.all(a, b, c).map(Combine::new)            │
│                                                          │
│  CONDITION                                               │
│  When: Route by discriminator value                      │
│  Code: switch (type) { case A -> ...; case B -> ...; }   │
│                                                          │
│  ITERATION                                               │
│  When: Process collection of items                       │
│  Code: Promise.allOf(items.map(this::process))           │
│                                                          │
│  ASPECTS                                                 │
│  When: Cross-cutting concerns (retry, timeout, audit)    │
│  Code: withRetry(withTimeout(operation))                 │
│                                                          │
│  LEAF                                                    │
│  When: Atomic adapter operation                          │
│  Code: Promise.lift(Error::new, () -> external.call())   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 6: Value Object Template

```
┌─────────────────────────────────────────────────────────┐
│                VALUE OBJECT TEMPLATE                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  public record Email(String value) {                     │
│      private static final Pattern PATTERN =              │
│          Pattern.compile("^[a-z0-9+_.-]+@[a-z0-9.-]+$"); │
│      private static final Cause INVALID =                │
│          Causes.cause("Invalid email format");           │
│                                                          │
│      public static Result<Email> email(String raw) {     │
│          return Verify.ensure(raw, Verify.Is::notBlank)  │
│              .map(String::trim)                          │
│              .map(String::toLowerCase)                   │
│              .flatMap(Verify.ensureFn(                   │
│                  INVALID, Verify.Is::matches, PATTERN))  │
│              .map(Email::new);                           │
│      }                                                   │
│  }                                                       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  USAGE                                                   │
│                                                          │
│  Email.email("USER@EXAMPLE.COM")                         │
│      → Result.success(Email("user@example.com"))         │
│                                                          │
│  Email.email("invalid")                                  │
│      → INVALID.result()                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 7: Use Case Template

```
┌─────────────────────────────────────────────────────────┐
│                USE CASE TEMPLATE                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  public interface DoSomething {                          │
│      Promise<Response> execute(Request request);         │
│                                                          │
│      record Request(String field1, String field2) {}     │
│      record ValidRequest(Field1 f1, Field2 f2) {         │
│          static Result<ValidRequest> validRequest(       │
│                  Request r) {                            │
│              return Result.all(                          │
│                  Field1.field1(r.field1()),              │
│                  Field2.field2(r.field2())               │
│              ).map(ValidRequest::new);                   │
│          }                                               │
│      }                                                   │
│      record Response(ResultId id) {}                     │
│                                                          │
│      interface Step1 {                                   │
│          Promise<Output1> apply(ValidRequest req);       │
│      }                                                   │
│      interface Step2 {                                   │
│          Promise<Output2> apply(Output1 input);          │
│      }                                                   │
│                                                          │
│      static DoSomething create(Step1 s1, Step2 s2) {     │
│          return request -> ValidRequest                  │
│              .validRequest(request)                      │
│              .async()                                    │
│              .flatMap(s1::apply)                         │
│              .flatMap(s2::apply)                         │
│              .map(Response::new);                        │
│      }                                                   │
│  }                                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 8: Error Types Template

```
┌─────────────────────────────────────────────────────────┐
│                ERROR TYPES TEMPLATE                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  public sealed interface UserError extends Cause {       │
│                                                          │
│      // Enum for simple errors                           │
│      enum Simple implements UserError {                  │
│          NOT_FOUND("User not found"),                    │
│          EMAIL_EXISTS("Email already registered");       │
│                                                          │
│          private final String msg;                       │
│          Simple(String msg) { this.msg = msg; }          │
│          @Override                                       │
│          public String message() { return msg; }         │
│      }                                                   │
│                                                          │
│      // Record for errors with context                   │
│      record InvalidField(String field, String reason)    │
│              implements UserError {                      │
│          @Override                                       │
│          public String message() {                       │
│              return "Invalid " + field + ": " + reason;  │
│          }                                               │
│      }                                                   │
│  }                                                       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  USAGE                                                   │
│                                                          │
│  UserError.Simple.NOT_FOUND.result()                     │
│  new UserError.InvalidField("age", "negative").promise() │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 9: Testing Patterns

```
┌─────────────────────────────────────────────────────────┐
│                TESTING PATTERNS                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SUCCESS ASSERTION                                       │
│                                                          │
│  result.onFailure(Assertions::fail)                      │
│        .onSuccess(value -> {                             │
│            assertEquals(expected, value.field());        │
│        });                                               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  FAILURE ASSERTION                                       │
│                                                          │
│  result.onSuccess(Assertions::fail);                     │
│  // Optionally check cause type:                         │
│  result.onFailure(cause ->                               │
│      assertTrue(cause instanceof ExpectedError));        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ASYNC ASSERTION                                         │
│                                                          │
│  promise.await()                                         │
│         .onFailure(Assertions::fail)                     │
│         .onSuccess(value -> {                            │
│             assertEquals(expected, value);               │
│         });                                              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  STUB PATTERNS                                           │
│                                                          │
│  Step SUCCESS = input -> Promise.success(output);        │
│  Step FAILURE = input -> ERROR.promise();                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 10: Verify.Is Predicates

```
┌─────────────────────────────────────────────────────────┐
│                VERIFY.IS PREDICATES                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  NULL / PRESENCE                                         │
│  Verify.Is::notNull                                      │
│                                                          │
│  STRING                                                  │
│  Verify.Is::notBlank       Has non-whitespace            │
│  Verify.Is::notEmpty       Length > 0                    │
│  Verify.Is::lenBetween     Length in range (inclusive)   │
│  Verify.Is::matches        Regex pattern                 │
│  Verify.Is::contains       Contains substring            │
│                                                          │
│  NUMERIC                                                 │
│  Verify.Is::positive       > 0                           │
│  Verify.Is::negative       < 0                           │
│  Verify.Is::nonNegative    >= 0                          │
│  Verify.Is::between        >= min && <= max              │
│  Verify.Is::greaterThan    > boundary                    │
│  Verify.Is::lessThan       < boundary                    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  USAGE                                                   │
│                                                          │
│  Verify.ensure(value, Verify.Is::notBlank)               │
│  Verify.ensure(age, Verify.Is::between, 0, 150)          │
│  Verify.ensureFn(CAUSE, Verify.Is::matches, PATTERN)     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 11: Parse Utilities

```
┌─────────────────────────────────────────────────────────┐
│                PARSE UTILITIES                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  org.pragmatica.lang.parse.Number                        │
│                                                          │
│  Number.parseInt(String)         → Result<Integer>       │
│  Number.parseLong(String)        → Result<Long>          │
│  Number.parseDouble(String)      → Result<Double>        │
│  Number.parseBigDecimal(String)  → Result<BigDecimal>    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  org.pragmatica.lang.parse.DateTime                      │
│                                                          │
│  DateTime.parseLocalDate(String)     → Result<LocalDate> │
│  DateTime.parseLocalDateTime(String) → Result<LocalDT>   │
│  DateTime.parseInstant(String)       → Result<Instant>   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  org.pragmatica.lang.parse.Network                       │
│                                                          │
│  Network.parseUUID(String)       → Result<UUID>          │
│  Network.parseURI(String)        → Result<URI>           │
│  Network.parseURL(String)        → Result<URL>           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Card 12: Code Review Checklist

```
┌─────────────────────────────────────────────────────────┐
│                CODE REVIEW CHECKLIST                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ZONE BOUNDARIES                                         │
│  [ ] Value objects at adapter entry points               │
│  [ ] Promise.lift() only in adapters                     │
│  [ ] No framework imports in domain                      │
│                                                          │
│  VALUE OBJECTS                                           │
│  [ ] Factory returns Result<T>                           │
│  [ ] Private/package constructor                         │
│  [ ] Immutable (use records)                             │
│  [ ] Cause constants, not inline strings                 │
│                                                          │
│  USE CASES                                               │
│  [ ] Interface with factory method                       │
│  [ ] Request/ValidRequest/Response records               │
│  [ ] Step interfaces for dependencies                    │
│  [ ] No direct I/O in factory method                     │
│                                                          │
│  ERROR HANDLING                                          │
│  [ ] No thrown exceptions for business errors            │
│  [ ] Sealed Cause hierarchy                              │
│  [ ] Exhaustive switch expressions                       │
│                                                          │
│  LAMBDAS                                                 │
│  [ ] Single expression or method reference               │
│  [ ] No multi-statement blocks                           │
│  [ ] No conditionals inside lambdas                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
