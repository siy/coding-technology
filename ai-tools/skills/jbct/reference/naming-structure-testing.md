# JBCT Reference: Naming, Structure, Testing

> Part of the `jbct` skill; loaded on demand from the index in `../SKILL.md`. Text moved verbatim from the former single-file SKILL.md.

## Naming Conventions

- **Factory methods**: `TypeName.typeName(...)` (lowercase-first). Every record has a type-named factory (`Profile.profile(...)`), no exceptions: `Result<Self>` if the record has any invariant, `Self` if it has none; a generator or framework that builds a record with `new`/`::new` instead of its factory is defective; a local record declared inside a factory method is outside the rule: it is instantiated once, inside that method, and cannot be instantiated anywhere else.
- **Validated inputs**: `Valid` prefix (not `Validated`): `ValidRequest`, `ValidUser`
- **Error types**: Past tense verbs: `EmailNotFound`, `AccountLocked`, `PaymentFailed`
- **State-machine state types**: `*State` suffix for the sealed sum of lifecycle states — `HoldState`, `BookingState`, `SeatState` — with variants kept bare (`Free`, `Held`, `Confirmed`, `Cancelled`, never `HeldState`). Reserve the suffix for the lifecycle sum a guarded transition advances, not every mutable holder; it joins the suffix-by-role family (`*Request`, `*Response`, `Cause`).
- **Test names**: `method_[scenario_]expectation` — at least two underscore-separated segments (`validate_rejectsEmpty`, or the fuller `register_succeeds_forNewEmail`)
- **Acronyms**: Treat as words (camelCase): `httpClient`, `apiKey` not `HTTPClient`, `APIKey`

### Zone-Based Naming (Abstraction Levels)

> **Source:** Adapted from [Derrick Brandt's systematic approach](https://medium.com/@brandt.a.derrick/how-to-write-clean-code-actually-5205963ec524).

Use zone-appropriate verbs to maintain consistent abstraction levels. The rule and the tables are
book-owned and reproduced below.

**Stepdown rule test:** Read code aloud with "to" before functions - should flow naturally:
```java
// "To execute, we validate the request, then process payment, then send confirmation"
return ValidRequest.validRequest(request)
                   .async()
                   .flatMap(this::processPayment)
                   .flatMap(this::sendConfirmation);
```

<!-- book:zone-verbs -->
**The zone is the constraint; the verb lists below are illustrative, not exhaustive.** A name is
correct when its verb matches the altitude it is declared at, not when it appears in a table. The
tables name representative verbs for each zone so the distinction has something concrete to stand
on — they were never meant as a closed vocabulary, and a census of real JBCT codebases found the
majority of production method names heading verbs no list contained.

The distinction that does the work is this: **Zone 2 names the intent, Zone 3 names the mechanism.**
A step interface says *what the workflow needs to happen*; a leaf says *how it is done*. `LoadUser`
is a step because loading is the intent; `fetchFromDatabase` and `findByEmail` are leaves because
fetching over a network and searching an index are mechanisms. This is why the anti-pattern below
is a real defect rather than a style preference.

**Zone 2 verbs (step interfaces — orchestration), representative:**

| Verb | When to Use | Example |
|------|-------------|---------|
| `validate` | Checking rules/constraints | `ValidateInput` |
| `process` | Transforming or interpreting data | `ProcessPayment` |
| `handle` | Coordinating reactions to events | `HandleRefund` |
| `load` | Retrieving data for use | `LoadUserProfile` |
| `save` | Persisting changes | `SaveOrder` |
| `check` | Verifying conditions | `CheckInventory` |

**Zone 3 verbs (leaves — implementation), representative:**

| Verb | Typical Use | Example |
|------|-------------|---------|
| `get` | Retrieve a value | `getTimestamp()` |
| `fetch` | Pull from external source | `fetchWeatherData()` |
| `find` | Search for a value that may be absent | `findByEmail()` |
| `parse` | Break down structured input | `parseJson()` |
| `calculate` | Perform computation | `calculateTax()` |
| `create` | Construct a value from parts | `createInvoice()` |
| `build` | Assemble a value incrementally | `buildQuery()` |
| `insert` | Write a new row or entry | `insertPayment()` |
| `hash` | Cryptographic transformation | `hashPassword()` |
| `format` | Build structured output | `formatDate()` |
| `send` | Transmit over network | `sendEmail()` |

**The primary test — do not mix zones.** A step interface that uses a Zone 3 verb has named a
mechanism where it owed an intent, and the mismatch is checkable without consulting any list: a step
interface named `FetchUserData` should be `LoadUserData`, because `fetch` commits the orchestration
layer to *how* the data arrives. This test catches real defects. Absence from a table does not — a
verb missing from both lists is unlisted, not wrong.
<!-- /book:zone-verbs -->

<!-- book:predicate-naming -->
Methods returning `boolean` take an `is`, `has`, or `can` prefix, and the set is closed — these
three, no others:

```java
boolean isExpired()        // state of the receiver
boolean hasBalance()       // possession of a part or property
boolean canWithdraw()      // permission or capability
```

The prefix says which question is being asked, so a caller reading `if (account.canWithdraw())`
knows a permission is being checked rather than a state inspected. Predicates never take a verb from
the zone tables: `checkExpiry()` returning `boolean` should be `isExpired()`.
<!-- /book:predicate-naming -->

## Project Structure (Vertical Slicing)

```
com.example.app/
├── usecase/
│   ├── registeruser/         # Self-contained vertical slice
│   │   ├── RegisterUser.java # Use case interface + factory
│   │   └── [internal types]  # ValidRequest, etc.
│   └── loginuser/
│       └── LoginUser.java
├── domain/
│   └── shared/               # Reusable value objects ONLY
│       ├── Email.java
│       ├── Password.java
│       └── UserId.java
└── adapter/
    ├── rest/                 # Inbound (HTTP)
    ├── persistence/          # Outbound (DB)
    └── messaging/            # Outbound (queues)
```

**Placement Rules:**
- Value objects used by single use case → inside use case package
- Value objects used by 2+ use cases → `domain/shared/`
- Steps (interfaces) → always inside use case
- Errors → sealed interface inside use case

## Testing Patterns

```java
// Test failures - use .onSuccess(Assertions::fail)
@Test
void validation_fails_forInvalidInput() {
    ValidRequest.validRequest(Request.request("invalid", "bad"))
                .onSuccess(Assertions::fail);
}

// Test successes - chain onFailure then onSuccess
@Test
void validation_succeeds_forValidInput() {
    ValidRequest.validRequest(Request.request("valid@example.com", "Valid1234"))
                .onFailure(Assertions::fail)
                .onSuccess(valid -> {
                    assertEquals("valid@example.com", valid.email().value());
                });
}

// Async tests - use .await() first
@Test
void execute_succeeds_forValidInput() {
    useCase.execute(request)
           .await()
           .onFailure(Assertions::fail)
           .onSuccess(response -> {
               assertEquals("expected", response.value());
           });
}
```
