# Chapter 18: Comparison with Other Approaches

JBCT doesn't exist in isolation. This chapter compares it to other architectural approaches you may encounter, helping you understand where JBCT fits and what it borrows from or rejects in other methodologies.

---

## Traditional Layered Architecture

The most common Java backend architecture.

### Structure

```
Controller Layer     → Receives HTTP requests, validates DTOs
    ↓
Service Layer        → Business logic, transactions, orchestration
    ↓
Repository Layer     → Database access, queries
    ↓
Entity Layer         → JPA entities, data structures
```

### Example

```java
@RestController
public class UserController {
    @Autowired private UserService userService;

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserDto dto) {
        User user = userService.createUser(dto);
        return ResponseEntity.ok(toDto(user));
    }
}

@Service
public class UserService {
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Transactional
    public User createUser(CreateUserDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new EmailExistsException();
        }
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        return userRepository.save(user);
    }
}

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
}
```

### What JBCT Changes

| Aspect | Layered | JBCT |
|--------|---------|------|
| Error handling | Exceptions | Result/Promise with Cause |
| Validation | @Valid + manual checks | Parse-don't-validate |
| Business logic location | Service layer | Use case interface |
| Data flow | Mutable entities | Immutable value objects |
| Dependencies | Field injection | Constructor injection via factory |

### What JBCT Keeps

- Separation of concerns (different responsibility per layer)
- Controllers at the boundary
- Repository pattern for data access

### Verdict

JBCT refines layered architecture rather than replacing it. The layers still exist, but with explicit error handling and immutable data flow.

---

## Hexagonal Architecture (Ports and Adapters)

Popularized by Alistair Cockburn. Core idea: business logic at the center, adapters at the edges.

### Structure

```
                    ┌─────────────────────┐
   HTTP Adapter ───→│                     │←─── Database Adapter
                    │   Domain / Core     │
  Queue Adapter ───→│   (Business Logic)  │←─── External API Adapter
                    │                     │
                    └─────────────────────┘
                           ↑   ↑
                        Ports (Interfaces)
```

### Example

```java
// Port (interface defined by domain)
public interface UserRepository {
    Optional<User> findByEmail(Email email);
    void save(User user);
}

// Domain service (pure business logic)
public class UserRegistrationService {
    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;

    public User register(Email email, Password password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new EmailAlreadyExistsException(email);
        }
        HashedPassword hashed = passwordHasher.hash(password);
        User user = new User(email, hashed);
        userRepository.save(user);
        return user;
    }
}

// Adapter (implements port)
public class JpaUserRepository implements UserRepository {
    private final JpaUserEntityRepository jpaRepo;

    @Override
    public Optional<User> findByEmail(Email email) {
        return jpaRepo.findByEmail(email.value())
            .map(this::toDomain);
    }
}
```

### What JBCT Borrows

- **Ports concept** → Step interfaces
- **Adapters concept** → Adapter leaves
- **Domain at center** → Use cases with pure business logic
- **Dependency inversion** → Steps injected into use case factory

### What JBCT Adds

- **Explicit error handling** - Hexagonal doesn't prescribe how to handle errors
- **Functional composition** - Hexagonal uses imperative style
- **Typed failures** - Cause types instead of exceptions
- **Structural patterns** - Leaf, Sequencer, Fork-Join provide composition vocabulary

### Key Difference

Hexagonal focuses on **where** code lives (inside vs outside the hexagon). JBCT focuses on **how** code composes (patterns, error handling, data flow).

### Verdict

JBCT and Hexagonal are complementary. Use Hexagonal for high-level architecture, JBCT for implementation patterns within that architecture.

---

## Clean Architecture

Uncle Bob's architecture with explicit dependency rules.

### Structure

```
┌───────────────────────────────────────────────┐
│              Frameworks & Drivers              │
│  ┌───────────────────────────────────────┐    │
│  │           Interface Adapters           │    │
│  │  ┌───────────────────────────────┐    │    │
│  │  │        Application Layer       │    │    │
│  │  │  ┌───────────────────────┐    │    │    │
│  │  │  │     Domain Layer      │    │    │    │
│  │  │  │     (Entities)        │    │    │    │
│  │  │  └───────────────────────┘    │    │    │
│  │  └───────────────────────────────┘    │    │
│  └───────────────────────────────────────┘    │
└───────────────────────────────────────────────┘
```

Dependencies point inward. Inner layers don't know about outer layers.

### Example

```java
// Entity (innermost)
public class User {
    private UserId id;
    private Email email;
    private HashedPassword password;

    public boolean canLogin(Password attempt, PasswordHasher hasher) {
        return hasher.verify(attempt, this.password);
    }
}

// Use Case (application layer)
public class RegisterUserUseCase {
    private final UserGateway userGateway;
    private final PasswordHasher passwordHasher;

    public RegisterUserResponse execute(RegisterUserRequest request) {
        Email email = new Email(request.email);
        if (userGateway.existsByEmail(email)) {
            return RegisterUserResponse.failure("Email exists");
        }
        // ... rest of use case
    }
}

// Gateway interface (application layer, implemented by adapter)
public interface UserGateway {
    boolean existsByEmail(Email email);
    void save(User user);
}
```

### What JBCT Borrows

- **Use case as first-class concept** → UseCase interface
- **Dependency rule** → Use cases don't depend on adapters
- **Request/Response models** → Request/ValidRequest/Response records

### What JBCT Changes

| Aspect | Clean Architecture | JBCT |
|--------|-------------------|------|
| Use case return | Response objects | Result/Promise |
| Error handling | Response codes or exceptions | Typed Cause |
| Entity behavior | Rich domain model | Value objects + pure functions |
| Composition | Imperative orchestration | Monadic chains |

### Key Difference

Clean Architecture prescribes **dependency direction** but not **composition style**. JBCT prescribes both.

### Verdict

JBCT can be implemented within Clean Architecture. The layers map naturally:
- Entities → Value objects
- Use Cases → Use case interfaces
- Interface Adapters → Adapter leaves
- Frameworks → Spring configuration

---

## Railway-Oriented Programming

Scott Wlaschin's approach from F#, using "two-track" types for error handling.

### Concept

```
Success Track:  ───●───────●───────●───────●─── → Success
                   │       │       │       │
                   ↓       ↓       ↓       ↓
Failure Track:  ───────────────────────────────→ Failure
```

Each function either stays on success track or switches to failure track.

### Example (F# style in Java)

```java
public Result<User> registerUser(String email, String password) {
    return validateEmail(email)           // Success or Failure
        .flatMap(this::validatePassword)  // Continue or stay failed
        .flatMap(this::checkUniqueness)   // Continue or stay failed
        .flatMap(this::createUser);       // Continue or stay failed
}
```

### What JBCT Borrows

- **Two-track model** → `Result<T>` is exactly this
- **flatMap for composition** → Same chaining style
- **Errors as values** → Cause instead of exceptions

### What JBCT Adds

- **Four tracks, not two** - T, Option, Result, Promise for different semantics
- **Structural patterns** - Named patterns (Sequencer, Fork-Join) beyond just chaining
- **Aggregation** - Result.all() for parallel validation
- **Async integration** - Promise extends the model to async operations

### Key Difference

ROP is a technique for error handling. JBCT is a complete methodology including project structure, testing, and team practices.

### Verdict

JBCT incorporates ROP as its error handling model, then builds a full methodology around it.

---

## vavr (formerly Javaslang)

Functional programming library for Java.

### What vavr Provides

```java
import io.vavr.control.Try;
import io.vavr.control.Either;
import io.vavr.control.Option;

// Try - captures exceptions
Try<Integer> result = Try.of(() -> Integer.parseInt(input));

// Either - success or failure with typed error
Either<Error, User> user = findUser(id);

// Option - presence or absence
Option<User> maybeUser = Option.of(nullableUser);

// Pattern matching
String message = Match(result).of(
    Case($Success($()), "Parsed"),
    Case($Failure($()), "Failed")
);
```

### Comparison

| Feature | vavr | Pragmatica Lite |
|---------|------|-----------------|
| Option type | `Option<T>` | `Option<T>` |
| Error type | `Either<L, R>` or `Try<T>` | `Result<T>` with `Cause` |
| Async type | None (use CompletableFuture) | `Promise<T>` |
| Collections | Immutable collections | Uses Java collections |
| Pattern matching | Built-in DSL | Standard switch expressions |
| Tuples | Tuple1-8 | Use records |

### Key Differences

1. **vavr is a library, JBCT is a methodology** - vavr provides types, JBCT provides patterns, structure, and practices.

2. **Error typing** - vavr's Either has generic left type. Pragmatica Lite's Result always uses Cause, providing consistent error handling.

3. **Async story** - vavr doesn't provide async primitives. JBCT's Promise integrates error handling with async operations.

4. **Simplicity** - vavr includes many FP features (persistent collections, pattern matching DSL, streams). Pragmatica Lite focuses on the minimum needed for JBCT.

### When to Use vavr

- You want immutable collections
- You're building a library with FP patterns
- You need persistent data structures
- You want pattern matching DSL

### When to Use Pragmatica Lite

- You're building backend services
- You want a complete methodology (not just types)
- You need integrated async support
- You prefer simplicity over features

### Verdict

vavr is a more comprehensive FP library. Pragmatica Lite is purpose-built for JBCT. You could use vavr to implement JBCT patterns, but you'd need to add your own Promise type and establish your own structural patterns.

---

## Arrow-kt (Kotlin)

Functional programming library for Kotlin.

### What Arrow Provides

```kotlin
// Either for errors
fun divide(a: Int, b: Int): Either<DivisionError, Int> =
    if (b == 0) DivisionError.DivideByZero.left()
    else (a / b).right()

// Validated for accumulating errors
fun validateUser(name: String, age: Int): ValidatedNel<ValidationError, User> =
    ValidatedNel.applicative<ValidationError>().mapN(
        validateName(name),
        validateAge(age)
    ) { (n, a) -> User(n, a) }

// Effect for async
suspend fun fetchUser(id: UserId): Either<Error, User> =
    either { userRepository.findById(id).bind() }
```

### Why Mention It?

Arrow-kt demonstrates that these patterns work well in a JVM language. Key insights:

- **Kotlin's coroutines + Either** = Similar to `Promise<T>`
- **Validated type** = Similar to Result.all() accumulation
- **Typed errors** = Same as JBCT's Cause

### Verdict

If you're on Kotlin, Arrow-kt provides similar capabilities to JBCT. The concepts transfer, but the syntax differs due to language features (coroutines, extension functions, sealed classes).

---

## Summary: Where JBCT Fits

```
                    Architectural Style
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    Layered           Hexagonal           Clean
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    Implementation Style
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Imperative        Railway (ROP)         FP Library
   (exceptions)      (Result types)        (vavr, Arrow)
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                         JBCT
                           │
                    ┌──────┴──────┐
                    │             │
              Pragmatica     Structural
              Lite Core      Patterns
```

JBCT:
- Works within any architectural style (Layered, Hexagonal, Clean)
- Uses railway-oriented error handling
- Is simpler than full FP libraries
- Provides structural patterns other approaches lack
- Includes methodology beyond just types

---

## Exercises

1. **Map your architecture:** Does your current project use Layered, Hexagonal, or Clean Architecture? Where would JBCT patterns fit?

2. **Compare error handling:** Take one exception-based method in your codebase. Rewrite it using ROP style with Result. What errors were implicit?

3. **Evaluate vavr:** If you use vavr, identify which features you actually use. Could you replace it with Pragmatica Lite?

4. **Cross-language patterns:** If you have Kotlin services, compare how Arrow-kt's Either compares to JBCT's Result. Are the patterns similar?

---

## Summary

JBCT is not revolutionary - it combines proven ideas:

| Idea | Source |
|------|--------|
| Ports and Adapters | Hexagonal Architecture |
| Use Cases as first-class | Clean Architecture |
| Errors as values | Railway-Oriented Programming |
| Functional types | vavr, Arrow-kt, Haskell |
| Parse don't validate | Type-driven design |

What JBCT adds:
- **Unified methodology** - Architecture + implementation + testing
- **Structural patterns** - Named, composable patterns
- **Team practices** - Migration path, code review guidelines
- **AI optimization** - Predictable code for AI collaboration

The goal isn't originality - it's unification.
