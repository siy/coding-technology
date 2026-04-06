---
name: aether-coder
description: Aether slice development skill — designing, implementing, testing, and deploying slices on the Aether distributed runtime. Builds on JBCT patterns. Use when working with @Slice interfaces, Aether resources (@Sql, @PgSql, @Http, @Notify, streams, pub-sub), routes.toml, blueprint deployment, Forge development, schema migrations, k6 load testing, or any Aether slice development task.
---

# Aether Slice Development

Build slices for the Aether distributed runtime using JBCT patterns.

## When to Use This Skill

Activate when:
- Creating or modifying `@Slice` interfaces
- Working with Aether resources (`@Sql`, `@PgSql`, `@Http`, `@Notify`, streams, pub-sub, pg-notifications)
- Writing `routes.toml`, configuring `aether.toml`
- Schema migrations (`schema/` directory)
- Setting up Forge for local development
- Writing k6 load tests
- Deploying and scaling slices
- Inter-slice invocation patterns
- Error modeling with sealed `Cause` types mapped to HTTP status codes

## Delegation Model

This skill understands Aether-specific patterns. For Java code generation and review, delegate to specialized agents:

- **Implementation:** Use `jbct-coder` subagent — it knows JBCT patterns (Result/Option/Promise, factory naming, structural patterns). Provide Aether context (resource qualifiers, slice contract) in the prompt.
- **Review:** Use `jbct-reviewer` subagent — checks JBCT compliance. Supplement with Aether-specific checks (routes.toml consistency, error mapping completeness, resource wiring).
- **Formatting & Linting:** Use `jbct` CLI tool:
  ```bash
  jbct check src/main/java     # Format + lint (36 rules)
  jbct format src/main/java    # Format only
  jbct lint src/main/java      # Lint only
  ```

## Quick Reference

### Core Contract
- [Slice Interface & Factory](patterns/slice-contract.md) — @Slice, factory methods, single vs multi-method
- [Error Modeling](patterns/error-modeling.md) — sealed Cause types, HTTP status mapping
- [Inter-Slice Invocation](patterns/inter-slice.md) — dependency declaration, proxy wiring
- [Step Composition](patterns/step-composition.md) — Slice → Step → Leaf with transitive provisioning

### Resources
- [Database: @Sql & @PgSql](resources/database.md) — generic SQL, type-safe PostgreSQL persistence
- [HTTP Client: @Http](resources/http.md) — outbound HTTP with custom qualifiers
- [Notifications: @Notify](resources/notifications.md) — email/SMS sending
- [Pub-Sub Messaging](resources/pub-sub.md) — Publisher/Subscriber with custom qualifiers
- [Streaming](resources/streaming.md) — partitioned, ordered, replayable streams
- [PG LISTEN/NOTIFY](resources/pg-notifications.md) — real-time database change notifications
- [Configuration](resources/configuration.md) — config provisioning, secrets, dynamic updates
- [Custom Qualifiers](resources/custom-qualifiers.md) — defining your own @ResourceQualifier annotations

### Deployment & Testing
- [HTTP Routing: routes.toml](deployment/routes-toml.md) — route mapping, error codes
- [Schema Migrations](deployment/schema-migrations.md) — Flyway-style, multi-datasource
- [Forge & Local Development](deployment/forge.md) — run-forge.sh, PostgreSQL, dashboard
- [k6 Load Testing](deployment/k6-testing.md) — steady-state, ramp-up, spike patterns
- [Deployment & Scaling](deployment/deploy-and-scale.md) — blueprint, CLI, strategies
- [Configuration Reference](deployment/aether-toml.md) — full aether.toml reference

### Important Notes

- `@Codec` is NOT needed on slice types. The slice processor generates serialization codecs automatically.
- All slice methods must return `Promise<T>`.
- Pub-Sub, Streaming, Scheduled, PG LISTEN/NOTIFY all use `@ResourceQualifier` custom annotations — there are no shortcut annotations for these.
- Built-in shortcut annotations exist only for: `@Sql` (database), `@PgSql` (PostgreSQL persistence), `@Http` (HTTP client), `@Notify` (notifications).

## Self-Validation Checkpoint

Before considering a slice complete:

### Slice Contract
- [ ] Interface annotated with `@Slice`
- [ ] Factory method: lowercase-first name matching interface
- [ ] All methods return `Promise<T>`
- [ ] Request/Response records nested in interface
- [ ] Error types as sealed `Cause` hierarchy

### Routing
- [ ] `routes.toml` exists with prefix, routes, and error mapping
- [ ] All public methods have routes
- [ ] All error types have HTTP status mappings
- [ ] `default` error status defined (typically 500)

### Resources
- [ ] All resource qualifiers have matching `aether.toml` config sections
- [ ] Secrets use `${secrets:path}` (not hardcoded)
- [ ] Database connections pooled (default config sufficient)

### Schema
- [ ] Migration files in `schema/` if using `@Sql` or `@PgSql`
- [ ] Sequential version numbers (`V001__`, `V002__`)
- [ ] Idempotent where possible (CREATE IF NOT EXISTS)

### Testing
- [ ] Unit tests for validation, happy path, failure cases
- [ ] `jbct check` passes (format + 36 lint rules)
- [ ] Forge smoke test with curl
- [ ] k6 steady-state test at expected load

### JBCT Compliance
Delegate to `jbct-reviewer` for thorough check, or run:
```bash
jbct lint src/main/java
```
