Examples (Java 25, Maven)

Overview
- Multi-module Maven project under `examples/` with three modules:
  - `usecase-userlogin-sync`  -  synchronous use case implemented with `Result<T>`.
  - `usecase-userlogin-async`  -  asynchronous use case implemented with `Promise<T>`.
  - `usecase-internal-service`  -  internal service integration example.
- Code follows TECHNOLOGY.md conventions: nested Request/Response, parse‑don't‑validate, per‑field VO factories, steps as single‑method interfaces, sequencer in execute().

Notes
- The code references Pragmatica Lite types (`Option`, `Result`, `Promise`, `Causes`, `Verify`).
- Pragmatica Lite Core 0.11.1 is available on Maven Central.
- Java 25 is configured via Maven compiler properties. Adjust to your local JDK if needed.

Layout
- `com.example.app.usecase.userlogin.UserLogin`  -  use case with nested API and validated input.
- `com.example.app.domain.shared.*`  -  shared value objects (Email, Password, ReferralCode) with static factories.

Build
- Pragmatica Lite Core `org.pragmatica-lite:core:0.9.0` is declared in parent POM and available from Maven Central.
- Package: `mvn -q -f examples/pom.xml -DskipTests package`
- Test: `mvn -q -f examples/pom.xml test`
