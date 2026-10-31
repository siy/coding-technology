# Project Organization

**Purpose**: Structure projects using vertical slicing for maximum cohesion and minimum coupling.

## Vertical Slicing Philosophy

Each use case is self-contained: its business logic, validation, errors and I/O steps stay in its own package. Code leaves the use case package only when a second user appears, and then only as high as the lowest common ancestor of its users — into `shared` if it is business code, into `io` if it touches the outside world.

## Package Structure

The package tree is the design's tree. Every package carries a business name — a use case, or a grouping of use cases the design discovered. There are no layer packages: no `usecase`, `domain`, `adapter`, or `config`. Two names are reserved, and both name a *role* a package plays at whatever node it sits:

- **`shared`** — business code used by more than one of the node's descendants.
- **`io`** — code that touches the outside world: database, network, files, clock. It holds **leaves only**.

```
com.example.app/
├── registeruser/                  # use case (vertical slice)
│   ├── RegisterUser.java          # @UseCase interface: request, response, steps, factory
│   ├── RegistrationError.java     # sealed error interface
│   └── io/                        # I/O steps used only by this use case (once they outgrow the file)
│       └── SaveUser.java
├── getuserprofile/
│   ├── GetUserProfile.java
│   └── ProfileError.java
├── shared/                        # business code used by both use cases
│   ├── Email.java
│   └── UserId.java
└── io/                            # I/O used by both use cases
    └── LoadUser.java
```

### Business Names Only

Names say what the code does for the business, never which technology or pattern implements it. `LoadUser`, not `JooqUserRepository`; `SaveUser`, not `UserDao`; no `Impl`, `Service`, `Manager`, `Helper`, `Util`, `Controller`, `Adapter`, `Gateway`, `Client`, and no `Jooq*`/`Jpa*`/`Jdbc*`/`Postgres*`/`Http*`/`Rest*` prefixes on declared types. Packages follow the same rule: no `repository`, `controller`, `impl`, `util`, `common`. A step's name is its contract, a Zone-2 intent verb (`LoadUser`, `SaveOrder`, `ReserveInventory`, `ChargePayment`); the technology appears only where it is used — in the parameter types of an I/O step's factory (`DSLContext`, `HttpClient`). Library types as parameter types are fine; declared types never carry them.

### The Use Case Anchor

The tree looks the same above a use case (groupings of use cases) and below it (steps that grew their own packages). The use case interface carries `@UseCase`, which marks where one ends and the other begins:

```java
@UseCase
public interface RegisterUser {
    ...
}
```

On Aether, the slice interface's `@Slice` annotation serves as the same anchor. There is no marker supertype: never a `UseCase` or `Step` interface to extend.

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
`jbct lint` checks the structure rules that the tree and the code alone can decide — import direction, `io`
holding leaves, I/O types and `lift` staying in I/O code — in modules whose `jbct.mode` is `business`; code
that is not a business backend (a runtime, a library, tooling) declares `jbct.mode = "infrastructure"` and the
structure rules do not apply to it. Lint cannot check *which* use cases belong under which workflow. Authoring time is the only
moment when both the requirements and the code are in hand, which makes that check yours.

<!-- book:telescope-rule -->
The layout above is a snapshot, not a starting point. A new codebase has no workflows or subsystems yet - only use cases, sitting flat. Structure is not designed up front; it **grows as the design discovers it**, and the package tree grows with it. JBCT calls this the **telescope rule**: the same altitudes that organize the design - use case, workflow, subsystem, system ([From Process to Patterns](https://pragmatica.dev/java/jbct/course/from-process-to-patterns/)) - organize the packages. As the design discovers a higher altitude, a package level **telescopes open** to hold it.

The rule is mechanical, which is the point: placement stops being a matter of taste.

**A new app is flat.** Every use case is a package directly under the application root, and the only shared package is the root's `shared`.

```
com.example.app/
|-- holdseat/
|-- confirmseat/
|-- releaseexpiredholds/
|-- searchevents/
|-- shared/
|-- io/
```

**A workflow appears, and the tree expands.** When several use cases cohere under one change driver - a reservation policy governing hold, confirm, and release - a workflow package appears and those use cases **move under it**. A level that did not exist now sits between the root and the slices it groups.

```
com.example.app/
|-- reservation/                    # workflow package (appeared)
|   |-- holdseat/                   # use cases moved under it
|   |-- confirmseat/
|   |-- releaseexpiredholds/
|   |-- shared/                     # shared *within* reservation (its state machine)
|   |-- io/                         # I/O shared within reservation (seat storage)
|-- searchevents/                   # still flat - in no workflow yet
|-- shared/                         # shared across everything
|-- io/
```

**A subsystem appears, and it expands again.** When workflows cluster under a domain concern - booking, pricing - a subsystem package appears and the workflows move under it.

```
com.example.app/
|-- booking/                        # subsystem package (appeared)
|   |-- reservation/                # workflow
|   |   |-- holdseat/
|   |   |-- confirmseat/
|   |   |-- releaseexpiredholds/
|   |   |-- shared/
|   |   |-- io/
|   |-- checkout/                   # another workflow in booking
|   |   |-- ...
|   |-- shared/                     # shared across the booking subsystem
|-- pricing/                        # another subsystem
|-- shared/                         # shared across everything (system altitude)
|-- io/
```

The same move, one altitude up; a **system** boundary does it once more - when two products or bounded contexts must coexist, subsystems group under a system package and one more level telescopes open. Each level appears only when something earns it: one use case is not a workflow, one workflow is not a subsystem. Do not create empty levels in anticipation, and do not leave loose files in a grouping package — it holds its children, its `shared`, its `io`, and nothing else, with one exception below.

### Shared code lives at the lowest common ancestor

This generalizes a rule you already know - *move a reused element to the nearest `shared` package* ([Null Policy & Error Recovery](https://pragmatica.dev/java/jbct/course/null-policy-recovery/)) - now that there is more than one altitude to be near. **The nearest shared package is the lowest common ancestor of the element's users.**

- Used by two use cases in one workflow → that workflow's `shared`.
- Used across two workflows in a subsystem → that subsystem's `shared`.
- Used across subsystems → the root's `shared`.

I/O follows the same rule: a step that talks to the database for one use case lives in that use case's `io`; once the workflow's use cases share it, it moves to the workflow's `io`. The root's `shared` and `io` are simply the top of the hierarchy. Shared code **floats up, never down**: when a new user appears at a higher altitude, lift the element to the new lowest common ancestor; never push it down speculatively, and never park it at the root "just in case." Promote on a shared *change driver*, never on resemblance: code that merely looks alike but answers to different drivers belongs apart, not in `shared` (see [From Process to Patterns](https://pragmatica.dev/java/jbct/course/from-process-to-patterns/)).

**The altitude of a shared element measures the blast radius of changing it.** Something that had to climb to the root is reachable by the whole system; something in a workflow's `shared` is reachable by that workflow alone. Where shared code sits tells you how far a change to it can travel.

**Worked example: a workflow's state machine.** When a workflow's use cases are transitions of a shared state machine (free -> held -> confirmed), the machine is shared logic - the state type and its legal transitions, used by every transition use case. Its users are those use cases, so its lowest common ancestor is the workflow package: the machine lives in that package's `shared`, and the use cases depend *up* on it, never sideways into one another.

This is the case where sharing is not premature. The minimal-sharing rule guards against *accidental* sharing; a state machine is *essential* coupling - the transitions are bound by the domain itself (a seat cannot be confirmed before it is held), so representing that bond once, in one shared machine, is correct. Not sharing it would only duplicate the machine across the use cases, where the copies drift. This is the cohesion test of [From Process to Patterns](https://pragmatica.dev/java/jbct/course/from-process-to-patterns/) seen in the package tree: the transitions share one change driver - the machine's rules - so they belong together; here the rule is just where that shared logic goes.

**A materialized workflow lives in its workflow package.** When a workflow earns a trigger of its own ([From Process to Patterns](https://pragmatica.dev/java/jbct/course/from-process-to-patterns/)) - a schedule, an event, an orchestration call - it becomes a use case of the workflow itself: `reservation/SettleHolds.java`, annotated `@UseCase`, directly in the workflow package above the use cases it composes. Its factory depends on those use cases as its steps, so composing them is a dependency *down* its own subtree. It is the one anchored type a grouping package may hold, and it is a Leaf to the subsystem above, exactly as a use case is a Leaf to its workflow.

### Dependencies point up the telescope

One rule covers every import between the application's own packages:

**A package may import an ancestor, a `shared` or `io` package at itself or any ancestor, or anything inside its own subtree. Nothing else.** In particular it must **not** import from a sibling: not a sibling use case, not a sibling workflow, not a sibling step's sub-package. Two workflows that need each other interact through a use case or step interface at their common ancestor - not by reaching into one another's slices. An import that crosses sideways is a visible smell: the telescope makes the wrong dependency wrong on sight.

Business code may refer to an `io` step as a *type* — the use case's factory takes it as a parameter — but never calls an `io` factory; that is assembly's job. I/O types themselves (`DSLContext`, an HTTP client, `java.nio`) appear only in `io` packages or inside a nested step's factory, and so does `lift`, which turns a foreign exception into a `Cause`.

Every rule in this section can be checked from the package tree and the code alone; jbct-lint checks them in a module whose `jbct.mode` is `business`. Code that is not a business backend — a runtime, a library, the tooling itself — declares `jbct.mode = "infrastructure"`: the structure rules do not apply to it, and every other JBCT rule still does.

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

**Module boundaries coincide with derived boundaries.** A legal cut lies on a telescope node: a use case, a workflow, a subsystem. A module boundary anywhere else is a structure the design never produced.

**Promotion is content-invariant.** Same packages, same files, same imports - only build wiring changes. No line of Java can observe the choice, which is why it sits below the normalization boundary ([Introduction](https://pragmatica.dev/java/jbct/course/introduction/)). Every cut is also well-formed by construction: the lowest-common-ancestor rule already placed shared code and shared I/O at ancestor nodes, so dependencies point up the tree and no cut can sever one.

### When to Promote

The default is no modules: package conventions enforce direction, including keeping I/O types out of business code, and jbct-lint checks them in modules with `jbct.mode = "business"`. Promote when a driver demands a compile-time wall:

- **Deployment topology (forced).** Multiple deployment units force cuts at the deployment boundaries. The architecture makes this decision, not the build.
- **Ownership divergence (elective).** More than one team owning different subtrees on different change cadences. Headcount alone is not a driver - one team of eight still wants a single module.
- **Independent publication (elective).** A library released on its own cycle is its own module.

### Which Level to Cut

A module boundary taxes every change that crosses it: build configuration, API ceremony, version coordination. Promote boundaries where cross-boundary change is rare; keep packages where it is frequent.

| Cut | Verdict |
|-----|---------|
| No modules | The default - one team, one deployable |
| Subsystem per module | The natural promotion point: subsystems are the units of ownership and deployment, the slowest-moving boundaries |
| Workflow per module | Only when one subsystem hosts several teams |
| Use case per module | Never - use cases are the unit of change, and this puts the compile-time wall where churn is highest |

A cut takes a node's whole subtree, its `io` included: I/O travels with the business code it serves.
<!-- /book:module-promotion -->

## Placement Rules

### Use Case Package

`com.example.app.<usecase>` (or deeper, once groupings appear — see the telescope rule):
- The use case interface with `@UseCase`, its Request/Response records, and its factory
- Step interfaces, nested in the use case interface, each with its own static factory
- The use case's sealed error interface
- Internal validation types (ValidRequest, intermediate records, value objects only it uses)

```
com.example.app.registeruser/
├── RegisterUser.java          # nests CheckEmailUniqueness, CreateValidUser, SaveUser, GenerateToken
├── RegistrationError.java
└── ConfirmationToken.java     # value object used only here
```

**Rule**: If a type is used only by this use case, it stays here.

### `shared`

`<node>.shared`: business code — value objects, shared errors, a workflow's state machine, a business step — used by more than one descendant of the node.

```
com.example.app.shared/
├── Email.java      # Used by RegisterUser, LoginUser, UpdateProfile
├── Password.java   # Used by RegisterUser, LoginUser, ChangePassword
└── UserId.java     # Used by most use cases
```

**Rule**: Move here when a second user appears, never before. The node is the lowest common ancestor of the users.

### `io`

`<node>.io`: I/O steps — step interfaces whose static factories talk to a database, a remote service, the file system — and their helper types (row mappers, wire records, the step's own error type).

**Rule**: `io` holds leaves only. When an I/O operation grows into a composition (authorize, then capture, then record), the composition is business logic and moves out of `io`; its sub-steps stay in `io` as leaves.

### Endpoints and Assembly

Inbound endpoints and the wiring that assembles use cases from their steps are generated by the runtime. Hand-written assembly exists only in plain Java programs and in tests — a `main` that calls each use case's factory with its steps — and lives at the root. There are no hand-written controllers and no configuration classes.

## Where Steps Go

A step starts as an interface nested in the use case, with a static factory that implements it. An I/O step's factory takes the infrastructure and implements the step with a lambda; that factory is the only place the library's types appear. When a step outgrows the use case file, **the step interface itself moves out, unchanged** — the same type, carrying its factory. Nothing is renamed and no new type appears; the use case's factory keeps the same parameter type and gains one import.

| Placement | When |
|-----------|------|
| Nested in the use case interface | The default. The step is a leaf, or a short composition, and needs no types of its own. |
| Own file — `io/` for an I/O step, the use case package for a business step | The step needs a type of its own (a row mapper, a wire record, an error type), or it has sub-steps of its own (it is a Sequencer or Fork-Join one level down). |
| Own sub-package — `io/<intent>/`, or `<usecase>/<intent>/` | A group of files belongs to the step: its sub-steps, their types, their I/O. The sub-package is laid out like a use case package. |
| `shared/` or `io/` at the lowest common ancestor | A second use case needs it. |

Each move has a reverse, taken when its reason goes away: a sub-package down to one file folds back into a file; a step that lost its sub-steps folds back into the use case; a step with one user left moves back down to it. A move is a deliberate refactor in one commit, made when the change is confirmed, not on a hunch.

Name a step's sub-package after its intent — `payment/`, `fraudcheck/` — never after a mechanism: no `impl/`, `steps/`, `internal/`, or `util/`. Two sub-packages inside one use case never import each other; they meet only through the use case.

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

**Step Interface (moved to its own file):**
1. The abstract method
2. Static factory method(s)
3. Private static helpers

**Utility Interface:**
1. Constants
2. Static methods
3. `unused` record (always last—prevents implementation)
<!-- /book:member-ordering -->

## Business Code and I/O Code

### Business code

Use case factories, business steps, value objects, `shared` packages.

- Define business operations, validate inputs, compose steps, return business types
- Depends only on Pragmatica Core, the JDK's non-I/O types, ancestors, `shared`/`io` packages on its path, and its own subtree
- Refers to an `io` step only as a *type* — the use case's factory takes it as a parameter — and never calls an `io` factory
- Never calls `lift`

### I/O code

`io` packages and the factories of nested I/O steps.

- Database, HTTP, messaging, file system, clock
- `lift` turns a foreign exception into a `Cause` here, and nowhere else
- Library types (`DSLContext`, `HttpClient`, `java.nio`) appear here, and nowhere else
- Leaves only: an I/O step never composes other steps

### Imports point up the tree

A package may import an ancestor, a `shared` or `io` package at itself or any ancestor, or anything inside its own subtree. Nothing else — never a sibling use case, a sibling workflow, or a sibling step's sub-package.

## Example: Complete Use Case Package

```
com.example.app.registeruser/
└── RegisterUser.java
```

```java
// Single file contains:
@UseCase
public interface RegisterUser {
    record Request(String email, String password, String referralCode) {}

    record Response(UserId userId, ConfirmationToken token) {}

    Promise<Response> execute(Request request);

    record ValidRequest(Email email, Password password, Option<ReferralCode> referralCode) {
        static Result<ValidRequest> validRequest(Request raw) { ... }
    }

    interface CheckEmailUniqueness {
        Promise<ValidRequest> apply(ValidRequest valid);

        interface FindUser {
            Promise<Option<User>> apply(Email email);

            static FindUser findUser(DSLContext dsl) { ... }
        }

        static CheckEmailUniqueness checkEmailUniqueness(FindUser findUser) { ... }
    }

    interface CreateValidUser {
        Promise<ValidUser> apply(ValidRequest valid);

        interface HashPassword {
            Result<HashedPassword> apply(Password password);

            static HashPassword hashPassword(BCryptPasswordEncoder encoder) { ... }
        }

        static CreateValidUser createValidUser(HashPassword hashPassword) { ... }
    }

    interface SaveUser {
        Promise<User> apply(ValidUser validUser);

        static SaveUser saveUser(DSLContext dsl) { ... }
    }

    interface GenerateToken {
        Promise<Response> apply(User user);

        static GenerateToken generateToken(HttpClient httpClient) { ... }
    }

    static RegisterUser registerUser(CheckEmailUniqueness checkEmail,
                                     CreateValidUser createValidUser,
                                     SaveUser saveUser,
                                     GenerateToken generateToken) {
        return request -> ValidRequest.validRequest(request)
                                      .async()
                                      .flatMap(checkEmail::apply)
                                      .flatMap(createValidUser::apply)
                                      .flatMap(saveUser::apply)
                                      .flatMap(generateToken::apply);
    }
}
```

## I/O Step Factory

The factory takes the infrastructure and returns a lambda. The library and `lift` appear only inside it. An I/O step is a leaf: it loads, and the decision on what it loaded stays in business code — here, `CheckEmailUniqueness` turns a present user into `EMAIL_ALREADY_REGISTERED`:

```java
interface FindUser {
    Promise<Option<User>> apply(Email email);

    static FindUser findUser(DSLContext dsl) {
        return email -> Promise.lift(t -> RegistrationError.DatabaseFailure.FACTORY.apply(Causes.fromThrowable(t)),
                                     () -> dsl.selectFrom(USERS)
                                              .where(USERS.EMAIL.eq(email.value()))
                                              .fetchOptional()
                                              .map(FindUser::toUser))
                           .map(Option::from);
    }
}
```

When `FindUser` grows a type of its own, it moves to `registeruser/io/FindUser.java` — the same interface and factory, now a top-level type. When a second use case needs it, it moves again, to the `io` package at the lowest common ancestor of both. From `io`, it references `RegistrationError.DatabaseFailure.FACTORY` across a package boundary, so that `FACTORY` must be declared `public static final` — record members are package-private by default, even in a record nested in an interface.

```
registeruser/
├── RegisterUser.java          # CheckEmailUniqueness's factory still takes FindUser; one import added
├── RegistrationError.java
└── io/
    └── FindUser.java          # moved unchanged
```

## Assembly

Endpoints and assembly are generated by the runtime. In a plain Java program, assembly is a few lines at the root — the only place that calls an `io` factory:

```java
var registerUser = RegisterUser.registerUser(CheckEmailUniqueness.checkEmailUniqueness(FindUser.findUser(dsl)),
                                             CreateValidUser.createValidUser(HashPassword.hashPassword(encoder)),
                                             SaveUser.saveUser(dsl),
                                             GenerateToken.generateToken(httpClient));
```

A test passes lambdas instead of calling the I/O factories:

```java
var registerUser = RegisterUser.registerUser(valid -> Promise.success(valid),
                                             valid -> Promise.success(testValidUser),
                                             validUser -> Promise.success(testUser),
                                             user -> Promise.success(testResponse));
```

## Migration Patterns

### Adding New Use Case

1. Create `newfeature/NewFeature.java` under the application root (or under its workflow package, if one exists)
2. Annotate the interface `@UseCase`; define Request, Response, ValidRequest
3. Nest the step interfaces, each with its static factory; I/O step factories take the infrastructure
4. Implement the use case factory
5. Endpoints and assembly are generated; in plain Java and tests, assemble at the root

### Extracting Shared Code

When a value object or a step is needed by 2+ use cases:

1. Move from `feature/ValueObject.java`
2. To `shared/ValueObject.java` (business code) or `io/LoadThing.java` (I/O step) at the lowest common ancestor of the users
3. Update imports in use cases

### Splitting Large Use Case

If use case has 6+ steps:

1. Identify logical substeps
2. Group them under a step that composes them (a Sequencer or Fork-Join one level down)
3. Move that step per *Where Steps Go*: own file, then own sub-package named for its intent

## Testing Structure

Tests mirror the package tree:

```
src/test/java/com/example/app/
├── registeruser/
│   └── RegisterUserTest.java      # lambdas for steps
├── shared/
│   ├── EmailTest.java
│   ├── PasswordTest.java
│   └── UserIdTest.java
└── io/
    └── LoadUserTest.java          # integration test against a real database
```

## Anti-Patterns

### ❌ Layer Packages

```
// DON'T
com.example/
├── usecase/
├── domain/
├── adapter/
└── config/
```

### ❌ Technical Names

```java
// DON'T: technology and pattern in the name
class JooqUserRepository implements LoadUser { ... }
class UserController { ... }
class RegisterUserImpl implements RegisterUser { ... }
class UserService { ... }
```

### ❌ New Type Introduced to Extract a Step

```java
// DON'T: the step interface moves out unchanged; no wrapper, no implementing class
public class SaveUserStep implements RegisterUser.SaveUser { ... }
```

### ❌ Validator Instead of a Value Object

```
// DON'T
com.example.app.shared/
└── EmailValidator.java       # Use an Email value object instead
```

### ❌ Unearned or Mechanism-Named Levels

```
// DON'T
com.example.app.user.registration.validation/
└── EmailValidator.java       # no workflow earned `user`; `validation` names a mechanism
```

### ❌ Sideways Import

```java
// DON'T: a use case importing a sibling use case
package com.example.app.reservation.confirmseat;

import com.example.app.reservation.holdseat.HoldSeat;
```

### ❌ I/O in Business Code

```java
// DON'T: business code calling an io factory, or lifting exceptions
static RegisterUser registerUser(DSLContext dsl) {
    var saveUser = SaveUser.saveUser(dsl);
    ...
}
```

### ❌ Framework in Business Code

```
// DON'T
package com.example.app.shared;

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
