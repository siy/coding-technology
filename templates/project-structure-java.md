Project Structure (Java, Hexagonal)

Build Tool
- Prefer Gradle Kotlin DSL. Maven acceptable if org standards require it.

Modules (optional, but recommended for larger systems)
- `:domain`  -  pure Java (no Spring), business rules, unit tests only.
- `:application`  -  use cases, ports, orchestrations.
- `:adapters`  -  inbound (web), outbound (persistence, messaging, clients).
- `:bootstrap`  -  Spring Boot app, configuration, main class.

Single‑module Alternative
- Use packages mirroring the layers (see docs/03-architecture.md Packaging).

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

