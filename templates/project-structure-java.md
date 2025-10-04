Project Structure (Java Backend Coding Technology)

Build Tool
- Prefer Gradle Kotlin DSL. Maven acceptable if org standards require it.

Modules (optional, but recommended for larger systems)
- `:domain`  -  pure Java, value objects, no framework dependencies
- `:application`  -  use cases (vertical slices), step interfaces
- `:adapters`  -  inbound (web), outbound (persistence, messaging, clients)
- `:bootstrap`  -  Spring Boot app, configuration, main class

Single‑module Alternative (recommended for smaller systems)
- Use packages for organization: `usecase`, `domain.shared`, `adapter`, `config`
- Simpler build, faster iteration, package discipline enforces boundaries

Baseline Dependencies
- Spring Boot starter web/validation/actuator; persistence (JPA/jOOQ) as needed.
- Observability: Micrometer + OTel exporter.
- Testing: JUnit5, Mockito, AssertJ, Testcontainers.

Key Conventions
- Constructor injection; no field injection.
- Records/immutables for DTOs where practical.
- RFC7807 for error responses; global exception handler.
- Flyway for DB migrations; separate `schema` and `data` locations if needed.
- Profiles: `local`, `test`, `staging`, `prod`.

CI Essentials
- Build → test → static analysis → dependency scan → package → publish image.
- Cache dependencies; fail fast on quality gate violations.

