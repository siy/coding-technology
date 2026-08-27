# Project Structure & Framework Integration

## What You'll Learn

- Vertical slicing philosophy and package organization
- The telescope rule: how the package tree grows as the design discovers altitudes
- Module promotion: when a package boundary becomes a compile-time boundary
- File structure guidelines: import ordering, member ordering, utility interfaces
- Framework integration with Spring Boot and JOOQ
- Where types go (placement rules)

**Prerequisites:** [More Examples](publisharticle-example.md)

---

## Vertical Slicing Philosophy

This technology organizes code around **vertical slices** - each use case is self-contained with its own business logic, validation, and error handling. Unlike architectures that centralize all business logic into one functional core, we **isolate business logic within each use case package**.

**Why vertical slicing (by criteria):**
- **Complexity**: Minimizes coupling between unrelated features (+3)
- **Business/Technical Ratio**: Package names reflect domain use cases, not technical layers (+2)
- **Mental Overhead**: All related code in one place - less navigation (+2)
- **Design Impact**: Forces proper boundaries - business logic cannot leak between use cases (+2)

---

## Package Structure

```
com.example.app/
|-- usecase/
|   |-- registeruser/              # Use case 1 (vertical slice)
|   |   |-- RegisterUser.java      # Use case interface + factory
|   |   |-- RegistrationError.java # Sealed error interface
|   |   |-- [internal types]       # ValidRequest, intermediate records
|   |
|   |-- getuserprofile/            # Use case 2 (vertical slice)
|       |-- GetUserProfile.java
|       |-- ProfileError.java
|       |-- [internal types]
|
|-- domain/
|   |-- shared/                    # Reusable value objects only
|       |-- Email.java
|       |-- Password.java
|       |-- UserId.java
|
|-- adapter/
|   |-- rest/                      # Inbound adapters (HTTP)
|   |   |-- UserController.java
|   |
|   |-- persistence/               # Outbound adapters (DB)
|       |-- JooqUserRepository.java
|
|-- config/                        # Framework configuration
    |-- UseCaseConfig.java
```

---

## Package Placement Rules

### Use Case Packages

`com.example.app.usecase.<usecasename>`:
- Use case interface and factory method
- Error types specific to this use case (sealed interface)
- Step interfaces (nested in use case interface)
- Internal validation types (ValidRequest, intermediate records)

**Rule**: If a type is used only by this use case, it stays here.

### Domain Shared

`com.example.app.domain.shared`:
- Value objects reused across multiple use cases

**Rule**: Move here immediately when a second use case needs the same value object.

**Anti-pattern**: Don't create this upfront - let reuse drive the move.

### Adapter Packages

`com.example.app.adapter.*`:
- `adapter.rest` - HTTP controllers, request/response DTOs
- `adapter.persistence` - Database repositories, ORM entities
- `adapter.messaging` - Message queue consumers/producers
- `adapter.external` - HTTP clients for external services

**Rule**: Adapters implement step interfaces from use cases.

### Config Package

`com.example.app.config`:
- Spring/framework configuration
- Bean wiring, dependency injection setup

**Rule**: No business logic, only infrastructure configuration.

---

## The Telescope Rule: How Structure Grows

The layout above is a snapshot, not a starting point. A new codebase has no workflows or subsystems yet - only use cases, sitting flat. Structure is not designed up front; it **grows as the design discovers it**, and the package tree grows with it. JBCT calls this the **telescope rule**: the same altitudes that organize the design - use case, workflow, subsystem, system ([From Process to Patterns](from-process-to-patterns.md)) - organize the packages. As the design discovers a higher altitude, a package level **telescopes open** to hold it.

The rule is mechanical, which is the point: placement stops being a matter of taste.

**A new app is flat.** Every use case is a package directly under `usecase`; the only shared package is the system-wide `domain.shared`. This is the structure shown above.

```
com.example.app/
|-- usecase/
|   |-- holdseat/
|   |-- confirmseat/
|   |-- releaseexpiredholds/
|   |-- searchevents/
|-- domain/shared/
```

**A workflow appears, and the tree expands.** When several use cases cohere under one change driver - a reservation policy governing hold, confirm, and release - a workflow package appears and those use cases **move under it**. A level that did not exist now sits between `usecase` and the slices it groups.

```
com.example.app/
|-- usecase/
|   |-- reservation/                # workflow package (appeared)
|   |   |-- holdseat/               # use cases moved under it
|   |   |-- confirmseat/
|   |   |-- releaseexpiredholds/
|   |   |-- shared/                 # shared *within* reservation
|   |-- searchevents/               # still flat - in no workflow yet
|-- domain/shared/                  # shared across everything
```

**A subsystem appears, and it expands again.** When workflows cluster under a domain concern - booking, pricing - a subsystem package appears and the workflows move under it.

```
com.example.app/
|-- booking/                        # subsystem package (appeared)
|   |-- reservation/                # workflow
|   |   |-- holdseat/
|   |   |-- confirmseat/
|   |   |-- releaseexpiredholds/
|   |   |-- shared/                 # shared within reservation
|   |-- checkout/                   # another workflow in booking
|   |   |-- ...
|   |-- shared/                     # shared across the booking subsystem
|-- pricing/                        # another subsystem
|-- domain/shared/                  # shared across everything (system altitude)
```

The same move, one altitude up; a **system** boundary does it once more - when two products or bounded contexts must coexist, subsystems group under a system module and one more level telescopes open, with `domain.shared` as its root. Each level appears only when something earns it: one use case is not a workflow, one workflow is not a subsystem. Do not create empty levels in anticipation.

### Shared code lives at the lowest common ancestor

This generalizes a rule you already know - *move a reused element to the nearest `shared` package* ([Null Policy & Error Recovery](null-policy-recovery.md)) - now that there is more than one altitude to be near. **The nearest shared package is the lowest common ancestor of the element's users.**

- Used by two use cases in one workflow → that workflow's `shared`.
- Used across two workflows in a subsystem → that subsystem's `shared`.
- Used across subsystems → `domain.shared` at the root.

`domain.shared` is simply the top of this hierarchy - the system-altitude shared package - and the tiered placement (`domain/<module>/` then `domain/shared/`) is this same rule seen at two levels. Shared code **floats up, never down**: when a new user appears at a higher altitude, lift the element to the new lowest common ancestor; never push it down speculatively, and never park it in `domain.shared` "just in case." Promote on a shared *change driver*, never on resemblance: code that merely looks alike but answers to different drivers belongs apart, not in `shared` (see [From Process to Patterns](from-process-to-patterns.md)).

**The altitude of a shared element measures the blast radius of changing it.** Something that had to climb to `domain.shared` is reachable by the whole system; something in a workflow's `shared` is reachable by that workflow alone. Where shared code sits tells you how far a change to it can travel.

**Worked example: a workflow's state machine.** When a workflow's use cases are transitions of a shared state machine (free -> held -> confirmed), the machine is shared logic - the state type and its legal transitions, used by every transition use case. Its users are those use cases, so its lowest common ancestor is the workflow package: the machine lives in that package's `shared`, and the use cases depend *up* on it, never sideways into one another.

This is the case where sharing is not premature. The minimal-sharing rule guards against *accidental* sharing; a state machine is *essential* coupling - the transitions are bound by the domain itself (a seat cannot be confirmed before it is held), so representing that bond once, in one shared machine, is correct. Not sharing it would only duplicate the machine across the use cases, where the copies drift. This is the cohesion test of [From Process to Patterns](from-process-to-patterns.md) seen in the package tree: the transitions share one change driver - the machine's rules - so they belong together; here the rule is just where that shared logic goes.

**A materialized workflow lives at its workflow package.** When a workflow earns a trigger of its own ([From Process to Patterns](from-process-to-patterns.md)) - a schedule, an event, an orchestration call - it becomes a slice at the workflow level (`reservation/settleholds/`, beside the use cases it composes), and its factory depends on those use cases as its steps. It is a Leaf to the subsystem above, exactly as a use case is a Leaf to its workflow. Composing its own use cases is ownership, not the sideways dependency the next rule forbids.

### Dependencies point up the telescope

The existing dependency rules still hold (use cases depend on shared domain code; adapters depend on use cases; never the reverse). The telescope adds one:

**Dependencies point up the tree, never sideways.** A use case may depend on shared code at its own altitude or any ancestor's. It must **not** import from a sibling workflow's package. Two workflows that need each other interact through a use case or step interface at their common ancestor - not by reaching into one another's slices. An import that crosses sideways between workflow packages is a visible smell: the telescope makes the wrong dependency wrong on sight.

### The reorg is a deliberate refactor

Expanding a level moves files - imports change, git records the move, parallel branches may conflict on moved files. Do the move **when the workflow is confirmed**, not on a hunch: reactively, the way the design discovers the altitude, never speculatively. It is cheap with an IDE's package-move refactor, but it is not free; batch it as one commit.

**Why this matters (by criteria):**
- **Mental Overhead**: placement becomes an algorithm - lowest common ancestor - not a judgment call (+3)
- **Complexity**: sideways coupling between features surfaces as a sideways import (+2)
- **Business/Technical Ratio**: the package tree mirrors the business hierarchy at every altitude (+2)

---

## Module Promotion

The package tree already carries every boundary the design produced. Gradle/Maven modules add no structure of their own: a module boundary *promotes* an existing boundary from convention, checked by lint, to enforcement, checked by the compiler. Two facts make the promotion safe and the choice free.

**Module boundaries coincide with derived boundaries.** A legal cut lies on a telescope node (use case, workflow, subsystem) or on a stratum root (`usecase/`, `domain/`, `adapter/`, `config`). A module boundary anywhere else is a structure the design never produced.

**Promotion is content-invariant.** Same packages, same files, same imports - only build wiring changes. No line of Java can observe the choice, which is why it sits below the normalization boundary ([Introduction](introduction.md)). Every vertical cut is also well-formed by construction: the lowest-common-ancestor rule already placed shared code at ancestor nodes, so dependencies point up the tree and no cut can sever one.

### When to Promote

The default is no modules: package conventions plus lint enforce direction. Promote when a driver demands compile-time enforcement:

- **Deployment topology (forced).** Multiple deployment units force cuts at the deployment boundaries. The architecture makes this decision, not the build.
- **Ownership divergence (elective).** More than one team owning different subtrees on different change cadences. Headcount alone is not a driver - one team of eight still wants a single module.
- **Independent publication (elective).** A library released on its own cycle is its own module.
- **Dependency-direction enforcement (elective).** Compile-time proof that domain code cannot import adapters.

### Which Level to Cut

A module boundary taxes every change that crosses it: build configuration, API ceremony, version coordination. Promote boundaries where cross-boundary change is rare; keep packages where it is frequent.

| Cut | Verdict |
|-----|---------|
| No modules | The default - one team, one deployable |
| Subsystem per module | The natural promotion point: subsystems are the units of ownership and deployment, the slowest-moving boundaries |
| Workflow per module | Only when one subsystem hosts several teams |
| Use case per module | Never - use cases are the unit of change, and this puts the compile-time wall where churn is highest |

### The Layer Cut

The cuts above follow the business hierarchy. A second, orthogonal cut follows the strata, which exist as top-level packages and are therefore also legal promotions:

```
:domain          # Pure Java - value objects
:application     # Use cases and step interfaces
:adapters        # Adapter implementations
:bootstrap       # Main class, configuration
```

Its drivers are the last two above: dependency-direction enforcement and independent publication of domain types. The two cuts compose - a system with both drivers ends with subsystem-by-stratum modules.

### Module Dependencies

```
domain         -> (no dependencies)
  |
application    -> domain
  |
adapters       -> application, domain
  |
bootstrap      -> adapters, application, domain
```

One sub-decision the vertical cut surfaces: adapters are organized by technical kind (`adapter.rest`, `adapter.persistence`), not by business subtree. A deployment-forced cut requires adapters to follow their subsystem - the adapter tree telescopes with it. An ownership-driven cut may keep one shared adapters module.

---

## File Structure Guidelines

Beyond package organization, JBCT standardizes the internal structure of source files. This ensures consistency and enables automated linting.

**Scope:** Use case interfaces, step implementations, value objects, error interfaces, and utility interfaces. Adapters are excluded—they are too framework-specific.

### Import Ordering

```
1. java.*
2. javax.*
3. org.pragmatica.*
4. third-party (org.*, com.* - alphabetically)
5. project imports
6. (blank line)
7. static imports (same grouping order)
```

### Member Ordering by File Type

**Use Case Interface:**
1. Public API (Request, Response records)
2. Execute method
3. Internal types (ValidRequest + validation helpers)
4. Step interfaces
5. Domain fragments (records used only by this use case)
6. Factory method

**Value Object:**
1. Public constants (named instances, shared sentinels)
2. Constructor (if explicit)
3. Methods - factory, accessors, and helpers (relative order not enforced; keep conversion pairs like `toJson`/`fromJson` together)
4. Private implementation constants (validation patterns, private formatters) - conventionally at the bottom, near their use

**Error Interface:**
1. Enum variants (fixed-message errors, grouped)
2. Record variants (errors carrying data)

**Step Implementation:**
1. Dependencies (final fields)
2. Constructor
3. Interface method(s)
4. Private helpers

**Utility Interface:**
1. Constants
2. Static methods
3. `unused` record (always last—prevents implementation)

### Utility Interface Pattern

Utility interfaces replace utility classes. The `sealed` modifier with an `unused` record prevents implementation:

```java
public sealed interface ValidationUtils {

    Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{10,14}$");

    static Result<String> normalizePhone(String raw) {
        return Verify.ensure(raw, Verify.Is::present)
                     .map(s -> s.replaceAll("[\\s\\-()]", ""))
                     .filter(INVALID_PHONE, PHONE_PATTERN.asMatchPredicate());
    }

    record unused() implements ValidationUtils {}
}
```

**Key points:**
- **Less ceremony than a utility class.** A class needs `private ValidationUtils() {}` to stop
  instantiation, `public static` on every method, and `public static final` on every constant. The
  interface needs one placeholder record, `static` on methods, and a bare declaration for constants,
  because interface members are implicitly public and interface fields implicitly `static final`.
  The placeholder costs less than the private constructor it replaces, and the saving grows with
  every member.
- **`sealed` prevents the constant-interface antipattern.** Interface *fields are* inherited by
  implementors, so without `sealed` a `class X implements ValidationUtils {}` pulls `PHONE_PATTERN`
  into X's own namespace — the misuse *Effective Java* names. Static *methods* are not inherited, so
  on a utility interface holding only methods `sealed` states intent rather than blocking anything;
  the moment one constant appears it is a real guard. Seal them uniformly and the distinction never
  has to be relitigated per file.
- `unused` record satisfies the permit requirement every sealed type carries — without it the file
  does not compile, failing with *sealed class must have subclasses*. The name is a compiler-forced
  placeholder and is exempt from the naming rules; see *Compiler-Forced Declarations* in Basic
  Patterns.

### Section Separation

Use blank lines to separate logical sections. Comments are optional—use only when they add clarity.

---

## Framework Integration

### Complete Example: Spring REST -> Use Case -> JOOQ

#### 1. Use Case (Functional Core)

```java
public interface GetUserProfile {
    record Request(String userId) {}
    record Response(String userId, String email, String displayName) {
        static Response fromUser(User user) {
            return new Response(user.id().value(),
                                user.email().value(),
                                user.displayName());
        }
    }

    Promise<Response> execute(Request request);

    interface FetchUser {
        Promise<User> apply(UserId userId);
    }

    static GetUserProfile getUserProfile(FetchUser fetchUser) {
        return request -> UserId.userId(request.userId())
                                .async()
                                .flatMap(fetchUser::apply)
                                .map(Response::fromUser);
    }
}
```

Pure business logic. No framework dependencies.

#### 2. REST Controller (Adapter In)

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final GetUserProfile getUserProfile;

    public UserController(GetUserProfile getUserProfile) {
        this.getUserProfile = getUserProfile;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        var request = new GetUserProfile.Request(userId);

        return getUserProfile.execute(request)
            .await()
            .fold(this::toErrorResponse,
                  response -> ResponseEntity.ok(response));
    }

    private ResponseEntity<?> toErrorResponse(Cause cause) {
        return switch (cause) {
            case ProfileError.UserNotFound _ ->
                ResponseEntity.status(HttpStatus.NOT_FOUND)
                              .body(Map.of("error", cause.message()));

            case ProfileError.InvalidUserId _ ->
                ResponseEntity.status(HttpStatus.BAD_REQUEST)
                              .body(Map.of("error", cause.message()));

            default ->
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                              .body(Map.of("error", "Internal server error"));
        };
    }
}
```

Thin adapter: HTTP -> Request -> use case -> Response/Cause -> HTTP.

#### 3. JOOQ Repository (Adapter Out)

```java
@Repository
public class JooqUserRepository implements GetUserProfile.FetchUser {
    private final DSLContext dsl;

    public JooqUserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public Promise<User> apply(UserId userId) {
        return Promise.lift(ProfileError.DatabaseFailure::cause,
            () -> dsl.selectFrom(USERS)
                     .where(USERS.ID.eq(userId.value()))
                     .fetchOptional()
                     .map(this::toDomain)
                     .orElseThrow(() -> new NotFoundException()));
    }

    private User toDomain(Record record) {
        return new User(
            new UserId(record.get(USERS.ID)),
            new Email(record.get(USERS.EMAIL)),
            record.get(USERS.DISPLAY_NAME)
        );
    }
}
```

Wraps JOOQ exceptions in domain Causes.

#### 4. Wiring (Spring Config)

```java
@Configuration
public class UseCaseConfig {

    @Bean
    public GetUserProfile getUserProfile(JooqUserRepository repository) {
        return GetUserProfile.getUserProfile(repository);
    }
}
```

---

## Key Principles

### 1. Vertical Slicing

Each use case package is a vertical slice containing everything needed for that feature.

### 2. Minimal Sharing

Only share value objects when truly reusable. Premature sharing creates coupling.

### 3. Framework at Edges

Business logic (use cases, domain) has zero framework dependencies. Adapters handle framework integration.

### 4. Clear Dependencies

- Use cases depend on: domain.shared
- Adapters depend on: use cases (implement step interfaces)
- Config depends on: use cases + adapters (wires them together)
- **Never**: use case depending on adapter

### 5. Adapter Isolation

All I/O operations live in adapters. Framework swapping (Spring -> Micronaut) affects only adapters.

---

## Where Things Go

| Type | Location | Rationale |
|------|----------|-----------|
| Use case interface | `usecase.<name>` | Entry point for feature |
| Step interfaces | Inside use case | Part of use case contract |
| Errors (sealed) | `usecase.<name>` | Feature-specific |
| ValidRequest | `usecase.<name>` | Internal validation |
| Shared value objects | `domain.shared` | Reused across features |
| Controllers | `adapter.rest` | HTTP handling |
| Repositories | `adapter.persistence` | Database access |
| Config | `config` | Bean wiring |

This table is the flat base case. As the design discovers workflows and subsystems, use case packages nest under them and shared code settles at the lowest common ancestor of its users - see *The Telescope Rule* above.

---

## Key Takeaways

1. **Vertical slices** - Each use case is self-contained
2. **Move to shared on reuse** - Not upfront
3. **Framework at edges** - Pure business logic in use cases
4. **Adapters implement step interfaces** - Clear contracts
5. **Modules when needed** - Don't prematurely modularize
6. **The telescope rule** - Structure grows as the design discovers altitudes; use cases nest under workflows/subsystems, shared code lives at the lowest common ancestor, dependencies point up the tree

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 5.3: Project Structure

---

## What's Next

[Systematic Application Guide](systematic-application.md) covers systematic application - checkpoints and checklists for writing and reviewing JBCT code.
