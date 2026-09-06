# Project Organization

**Purpose**: Structure projects using vertical slicing for maximum cohesion and minimum coupling.

## Vertical Slicing Philosophy

Each use case is self-contained. Shared value objects live in `domain/shared`, everything else stays in the use case package.

## Package Structure

```
com.example.app/
├── usecase/
│   ├── registeruser/          # Self-contained vertical slice
│   │   ├── RegisterUser.java  # Interface + Request + Response + ValidRequest + Steps
│   │   └── RegistrationError.java (if errors are use-case specific)
│   ├── loginuser/
│   │   └── LoginUser.java
│   └── placeorder/
│       ├── PlaceOrder.java
│       └── OrderError.java
├── domain/
│   └── shared/                # ONLY reusable value objects
│       ├── Email.java
│       ├── Password.java
│       ├── UserId.java
│       └── Money.java
└── adapter/
    ├── rest/                  # Inbound (HTTP)
    │   ├── UserController.java
    │   └── OrderController.java
    ├── persistence/           # Outbound (Database)
    │   ├── UserRepositoryAdapter.java
    │   └── OrderRepositoryAdapter.java
    └── messaging/             # Outbound (Queues/Events)
        └── EmailServiceAdapter.java
```

## The Telescope Rule

**When this rule fires.** Whenever the input carries placement information, the package path is *derived*,
not chosen. Placement information is present when the input names subsystems or workflows, describes a
process grouping, or when the codebase already has a package tree with sibling use cases. In that case:

- **Build phase** — derive the package path from the telescope before writing the first file. A use case
  with no siblings sits flat; a workflow package exists only where several use cases cohere under one
  change driver; a subsystem exists only where workflows cluster. Do not invent a level the input does not
  support, and do not omit one it does.
- **Verification phase** — check the path you produced back against that same input, as an explicit step.
  State the derivation: which level came from which fact.

**Why it is a skill obligation and not a lint rule.** The package path is the only record in the codebase of
which use cases cohere under which change driver. A checker compares two things; here the code holds one.
`jbct lint` therefore cannot verify placement and no rule in it tries — the ARCH family checks dependency
direction, the lift zone, use-case coupling and slice internals, none of which is placement. Authoring time
is the only moment when both the requirements and the code are in hand, which makes this check yours.

<!-- book:telescope-rule -->
The layout above is a snapshot, not a starting point. A new codebase has no workflows or subsystems yet - only use cases, sitting flat. Structure is not designed up front; it **grows as the design discovers it**, and the package tree grows with it. JBCT calls this the **telescope rule**: the same altitudes that organize the design - use case, workflow, subsystem, system ([From Process to Patterns](https://pragmatica.dev/java/jbct/course/from-process-to-patterns/)) - organize the packages. As the design discovers a higher altitude, a package level **telescopes open** to hold it.

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

This generalizes a rule you already know - *move a reused element to the nearest `shared` package* ([Null Policy & Error Recovery](https://pragmatica.dev/java/jbct/course/null-policy-recovery/)) - now that there is more than one altitude to be near. **The nearest shared package is the lowest common ancestor of the element's users.**

- Used by two use cases in one workflow → that workflow's `shared`.
- Used across two workflows in a subsystem → that subsystem's `shared`.
- Used across subsystems → `domain.shared` at the root.

`domain.shared` is simply the top of this hierarchy - the system-altitude shared package - and the tiered placement (`domain/<module>/` then `domain/shared/`) is this same rule seen at two levels. Shared code **floats up, never down**: when a new user appears at a higher altitude, lift the element to the new lowest common ancestor; never push it down speculatively, and never park it in `domain.shared` "just in case." Promote on a shared *change driver*, never on resemblance: code that merely looks alike but answers to different drivers belongs apart, not in `shared` (see [From Process to Patterns](https://pragmatica.dev/java/jbct/course/from-process-to-patterns/)).

**The altitude of a shared element measures the blast radius of changing it.** Something that had to climb to `domain.shared` is reachable by the whole system; something in a workflow's `shared` is reachable by that workflow alone. Where shared code sits tells you how far a change to it can travel.

**Worked example: a workflow's state machine.** When a workflow's use cases are transitions of a shared state machine (free -> held -> confirmed), the machine is shared logic - the state type and its legal transitions, used by every transition use case. Its users are those use cases, so its lowest common ancestor is the workflow package: the machine lives in that package's `shared`, and the use cases depend *up* on it, never sideways into one another.

This is the case where sharing is not premature. The minimal-sharing rule guards against *accidental* sharing; a state machine is *essential* coupling - the transitions are bound by the domain itself (a seat cannot be confirmed before it is held), so representing that bond once, in one shared machine, is correct. Not sharing it would only duplicate the machine across the use cases, where the copies drift. This is the cohesion test of [From Process to Patterns](https://pragmatica.dev/java/jbct/course/from-process-to-patterns/) seen in the package tree: the transitions share one change driver - the machine's rules - so they belong together; here the rule is just where that shared logic goes.

**A materialized workflow lives at its workflow package.** When a workflow earns a trigger of its own ([From Process to Patterns](https://pragmatica.dev/java/jbct/course/from-process-to-patterns/)) - a schedule, an event, an orchestration call - it becomes a slice at the workflow level (`reservation/settleholds/`, beside the use cases it composes), and its factory depends on those use cases as its steps. It is a Leaf to the subsystem above, exactly as a use case is a Leaf to its workflow. Composing its own use cases is ownership, not the sideways dependency the next rule forbids.

### Dependencies point up the telescope

The existing dependency rules still hold (use cases depend on shared domain code; adapters depend on use cases; never the reverse). The telescope adds one:

**Dependencies point up the tree, never sideways.** A use case may depend on shared code at its own altitude or any ancestor's. It must **not** import from a sibling workflow's package. Two workflows that need each other interact through a use case or step interface at their common ancestor - not by reaching into one another's slices. An import that crosses sideways between workflow packages is a visible smell: the telescope makes the wrong dependency wrong on sight.

### The reorg is a deliberate refactor

Expanding a level moves files - imports change, git records the move, parallel branches may conflict on moved files. Do the move **when the workflow is confirmed**, not on a hunch: reactively, the way the design discovers the altitude, never speculatively. It is cheap with an IDE's package-move refactor, but it is not free; batch it as one commit.

**Why this matters (by criteria):**
- **Mental Overhead**: placement becomes an algorithm - lowest common ancestor - not a judgment call (+3)
- **Complexity**: sideways coupling between features surfaces as a sideways import (+2)
- **Business/Technical Ratio**: the package tree mirrors the business hierarchy at every altitude (+2)
<!-- /book:telescope-rule -->

## Module Promotion

<!-- book:module-promotion -->
The package tree already carries every boundary the design produced. Gradle/Maven modules add no structure of their own: a module boundary *promotes* an existing boundary from convention, checked by lint, to enforcement, checked by the compiler. Two facts make the promotion safe and the choice free.

**Module boundaries coincide with derived boundaries.** A legal cut lies on a telescope node (use case, workflow, subsystem) or on a stratum root (`usecase/`, `domain/`, `adapter/`, `config`). A module boundary anywhere else is a structure the design never produced.

**Promotion is content-invariant.** Same packages, same files, same imports - only build wiring changes. No line of Java can observe the choice, which is why it sits below the normalization boundary ([Introduction](https://pragmatica.dev/java/jbct/course/introduction/)). Every vertical cut is also well-formed by construction: the lowest-common-ancestor rule already placed shared code at ancestor nodes, so dependencies point up the tree and no cut can sever one.

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
<!-- /book:module-promotion -->

## Placement Rules

### Value Objects

**Used by 1 use case** → Inside use case package
```
com.example.usecase.registeruser/
└── ConfirmationToken.java
```

**Used by 2+ use cases** → `domain/shared`
```
com.example.domain.shared/
├── Email.java      # Used by RegisterUser, LoginUser, UpdateProfile
├── Password.java   # Used by RegisterUser, LoginUser, ChangePassword
└── UserId.java     # Used by most use cases
```

### Steps (Interfaces)

**Always** inside use case:
```
com.example.usecase.registeruser/
└── RegisterUser.java
    ├── interface CheckEmail { ... }
    ├── interface SaveUser { ... }
    └── interface SendEmail { ... }
```

### Error Types

**Use case specific** → Inside use case package
```
com.example.usecase.registeruser/
└── RegistrationError.java
```

**Shared errors** → `domain/shared`
```
com.example.domain.shared/
├── ValidationError.java
└── DatabaseError.java
```

### Adapters

**By direction and technology**:
- `adapter/rest/` - HTTP inbound
- `adapter/persistence/` - Database outbound
- `adapter/messaging/` - Queue/event outbound
- `adapter/external/` - Third-party API outbound

```
com.example.adapter.persistence/
├── UserRepositoryAdapter.java
├── OrderRepositoryAdapter.java
└── ProductRepositoryAdapter.java
```

## Import Ordering

<!-- book:import-ordering -->
```
1. java.*
2. javax.*
3. org.pragmatica.*
4. third-party (org.*, com.* - alphabetically)
5. project imports
6. (blank line)
7. static imports (same grouping order)
```
<!-- /book:import-ordering -->

## Member Ordering by File Type

<!-- book:member-ordering -->
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
<!-- /book:member-ordering -->

## What Each Layer Holds

### Use Case Layer

- Define business operations
- Validate inputs
- Compose steps
- Return domain types

**No dependencies**: Framework-free, pure business logic.

### Domain Layer

- Value objects
- Validation rules
- Domain calculations
- Shared error types

**No dependencies**: Only Pragmatica Core.

### Adapter Layer

- Framework integration
- I/O operations
- Exception lifting
- External service calls

**Dependencies allowed**: Spring, JOOQ, HTTP clients, etc.

## Example: Complete Use Case Package

```
com.example.usecase.registeruser/
└── RegisterUser.java

// Single file contains:
public interface RegisterUser extends UseCase.WithPromise<Response, Request> {
    record Request(String email, String password) {}

    record Response(UserId userId, ConfirmationToken token) {}

    record ValidRequest(Email email, Password password) {
        private ValidRequest {}
        static Result<ValidRequest> validRequest(Request raw) { ... }
    }

    interface CheckEmail { Promise<ValidRequest> apply(ValidRequest valid); }
    interface HashPassword { Promise<HashedPassword> apply(Password password); }
    interface SaveUser { Promise<User> apply(ValidRequest valid, HashedPassword hashed); }
    interface SendEmail { Promise<ConfirmationToken> apply(User user); }

    static RegisterUser registerUser(
        CheckEmail checkEmail,
        HashPassword hashPassword,
        SaveUser saveUser,
        SendEmail sendEmail
    ) {
        return request -> ValidRequest.validRequest(request)
            .async()
            .flatMap(checkEmail::apply)
            .flatMap(valid ->
                hashPassword.apply(valid.password())
                    .flatMap(hashed -> saveUser.apply(valid, hashed))
            )
            .flatMap(sendEmail::apply)
            .map(token -> new Response(user.id(), token));
    }
}
```

## Adapter Implementation

### Separate File per Step

```
com.example.adapter.persistence/
├── CheckEmailAvailabilityAdapter.java
├── SaveUserAdapter.java
└── LoadUserAdapter.java
```

### Example Adapter

```java
package com.example.adapter.persistence;

public class CheckEmailAvailabilityAdapter implements RegisterUser.CheckEmail {
    private final UserRepository userRepository;

    public CheckEmailAvailabilityAdapter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Promise<ValidRequest> apply(ValidRequest valid) {
        return Promise.lift(
            DatabaseError::cause,
            () -> {
                if (userRepository.existsByEmail(valid.email().value())) {
                    throw new EmailAlreadyExistsException();
                }
                return valid;
            }
        );
    }

    public static RegisterUser.CheckEmail checkEmail(UserRepository repo) {
        return new CheckEmailAvailabilityAdapter(repo);
    }
}
```

## Assembly Configuration

### Spring Boot Configuration

```java
@Configuration
public class UseCaseConfiguration {
    @Bean
    public RegisterUser registerUser(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        EmailService emailService
    ) {
        var checkEmail = CheckEmailAvailabilityAdapter.checkEmail(userRepository);
        var hashPassword = HashPasswordAdapter.hashPassword(passwordEncoder);
        var saveUser = SaveUserAdapter.saveUser(userRepository);
        var sendEmail = SendEmailAdapter.sendEmail(emailService);

        return RegisterUser.registerUser(
            checkEmail,
            hashPassword,
            saveUser,
            sendEmail
        );
    }

    @Bean
    public LoginUser loginUser(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        TokenService tokenService
    ) {
        var loadUser = LoadUserAdapter.loadUser(userRepository);
        var verifyPassword = VerifyPasswordAdapter.verifyPassword(passwordEncoder);
        var generateToken = GenerateTokenAdapter.generateToken(tokenService);

        return LoginUser.loginUser(loadUser, verifyPassword, generateToken);
    }
}
```

## Controller Layer

```
com.example.adapter.rest/
├── UserController.java
├── OrderController.java
└── dto/
    ├── RegisterUserRequest.java (optional DTO mapping)
    └── RegisterUserResponse.java
```

### Controller Example

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final RegisterUser registerUser;
    private final LoginUser loginUser;

    public UserController(RegisterUser registerUser, LoginUser loginUser) {
        this.registerUser = registerUser;
        this.loginUser = loginUser;
    }

    @PostMapping("/register")
    public Promise<ResponseEntity<RegisterUser.Response>> register(
        @RequestBody RegisterUser.Request request
    ) {
        return registerUser.execute(request)
            .map(ResponseEntity::ok)
            .recover(cause -> handleError(cause));
    }

    private Result<ResponseEntity<RegisterUser.Response>> handleError(Cause cause) {
        if (cause instanceof CompositeCause composite) {
            return Result.success(ResponseEntity.badRequest().build());
        }
        return Result.success(ResponseEntity.internalServerError().build());
    }
}
```

## Migration Patterns

### Adding New Use Case

1. Create `usecase/newfeature/NewFeature.java`
2. Define Request, Response, ValidRequest
3. Define step interfaces
4. Implement factory method
5. Create adapters in `adapter/` layer
6. Wire in configuration
7. Add controller endpoint

### Extracting Shared Value Object

When a value object is needed by 2+ use cases:

1. Move from `usecase/feature/ValueObject.java`
2. To `domain/shared/ValueObject.java`
3. Update imports in use cases

### Splitting Large Use Case

If use case has 6+ steps:

1. Identify logical substeps
2. Create new intermediate use cases
3. Compose in parent use case

## Testing Structure

```
src/test/java/
├── usecase/
│   └── registeruser/
│       └── RegisterUserTest.java
├── domain/
│   └── shared/
│       ├── EmailTest.java
│       ├── PasswordTest.java
│       └── UserIdTest.java
└── adapter/
    └── persistence/
        ├── CheckEmailAvailabilityAdapterTest.java
        └── SaveUserAdapterTest.java
```

## Anti-Patterns

### ❌ Centralized Domain Logic

```
// DON'T
com.example.domain/
└── user/
    ├── UserService.java      # Centralized logic
    ├── UserValidator.java
    └── UserRepository.java
```

### ❌ Shared Business Logic

```
// DON'T
com.example.usecase.shared/
└── EmailValidator.java       # Use value objects instead
```

### ❌ Deep Package Nesting

```
// DON'T
com.example.usecase.user.registration.validation/
└── EmailValidator.java
```

### ❌ Framework in Domain

```
// DON'T
package com.example.domain.shared;

import org.springframework.stereotype.Component;

@Component  // Framework dependency!
public record Email(String value) { ... }
```

## Benefits of Vertical Slicing

1. **High cohesion** - Related code stays together
2. **Low coupling** - Use cases don't depend on each other
3. **Easy navigation** - Find everything for a feature in one place
4. **Safe refactoring** - Changes isolated to single use case
5. **Clear boundaries** - Easy to see what's shared vs specific

## Related

- [../use-cases/structure.md](../use-cases/structure.md) - Use case anatomy
- [../use-cases/complete-example.md](../use-cases/complete-example.md) - Full example with structure
- [../fundamentals/parse-dont-validate.md](../fundamentals/parse-dont-validate.md) - Value object placement
