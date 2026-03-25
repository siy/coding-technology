# Chapter 15: Project Structure & Framework Integration

## What You'll Learn

- Vertical slicing philosophy and package organization
- Module organization for larger systems
- File structure guidelines: import ordering, member ordering, utility interfaces
- Framework integration with Spring Boot and JOOQ
- Where types go (placement rules)

**Prerequisites:** [Chapter 14: More Examples](ch14a-publisharticle-example.md)

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

## Module Organization (Optional)

For larger systems, split into Gradle/Maven modules:

```
:domain          # Pure Java - value objects
:application     # Use cases and step interfaces
:adapters        # Adapter implementations
:bootstrap       # Main class, configuration
```

### When to Use Modules

- Team size > 5 developers
- Multiple deployment units from same codebase
- Enforcing compile-time dependency boundaries
- Independent library publication

### When Single Module is Sufficient

- Small to medium teams (< 5 developers)
- Monolithic deployment
- Package conventions provide sufficient structure

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
1. Static constants (patterns, cause factories)
2. Factory method
3. Helper methods

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
- `sealed` prevents external implementation
- `unused` record satisfies permit requirement
- No visibility modifiers needed (implicit `public`)

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

---

## Key Takeaways

1. **Vertical slices** - Each use case is self-contained
2. **Move to shared on reuse** - Not upfront
3. **Framework at edges** - Pure business logic in use cases
4. **Adapters implement step interfaces** - Clear contracts
5. **Modules when needed** - Don't prematurely modularize

---

## Exercises

See [Appendix B](appendix-b-exercises.md) for exercises on:
- Exercise 5.4: Package organization
- Exercise 6.2: Module setup

---

## What's Next

[Chapter 16](ch16-systematic-application.md) covers systematic application - checkpoints and checklists for writing and reviewing JBCT code.
