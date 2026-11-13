---
name: JBCT
description: Java Backend Coding Technology skill for designing, implementing, and reviewing functional Java backend code. Use when working with Result, Option, Promise types, value objects, use cases, or when asked about JBCT patterns, monadic composition, parse-don't-validate, structural patterns (Leaf, Sequencer, Fork-Join), or functional Java backend architecture.
---

# Java Backend Coding Technology (JBCT)

A methodology for writing predictable, testable Java backend code optimized for human-AI collaboration.

## When to Use This Skill

Activate this skill when:
- **Learning JBCT principles** and patterns
- **Quick reference** for API usage and examples
- **Understanding patterns** and when to use them
- Working with `Result<T>`, `Option<T>`, `Promise<T>` types
- Questions about monadic composition, error handling, or validation patterns

**For implementation work:** Use `jbct-coder` subagent (Task tool with `subagent_type: "jbct-coder"`)
**For code review:** Use `jbct-reviewer` subagent (Task tool with `subagent_type: "jbct-reviewer"`)
**For automated checking:** Use `jbct` CLI tool (format, lint, check commands)

## How to Load This Skill (index)

This file is an index. Read it, then load **only** the files your task needs. Every file below is
under 24 KB, so each can be read whole. Rules live in exactly one place; on conflict, the
Pragmatica Core source headers win, then the [JBCT book](https://pragmatica.dev/java/jbct/course/).

| Task touches | Load |
|---|---|
| Any Pragmatica Core API: `Result`/`Option`/`Promise` combinators, `Verify`, intent annotations, built-in value objects, parsing, resilience utilities | `reference/source-and-tooling.md` (Source-Anchored Chapters: read the source header first), plus the `jbct` CLI and subagent guidance |
| Return types, forbidden and warning patterns, parse-don't-validate, validation utilities | `reference/core-rules.md` |
| Use case shape, thread safety, lambdas, decomposition, data flow, growing context, the six structural patterns | `reference/composition.md` |
| Type conversions, aggregation, exceptions, recovery (BER/FER/design-out), typed errors, Wrapped/Terminal causes, Core library value objects, static imports, fluent failures | `reference/errors-and-api.md` |
| Naming (zone verbs, predicates), project structure and vertical slicing, testing | `reference/naming-structure-testing.md` |
| T, Option, Result, Promise in depth | `fundamentals/four-return-kinds.md` |
| Value object patterns | `fundamentals/parse-dont-validate.md` |
| Typed failures with Cause | `fundamentals/no-business-exceptions.md` |
| Atomic operations | `patterns/leaf.md` |
| Sequential composition | `patterns/sequencer.md` |
| Context-preserving stages (mapWith/flatMapWith/ensureWith, stage-accretion records) | `patterns/knowledge-gathering.md` |
| Parallel operations | `patterns/fork-join.md` |
| Branching logic | `patterns/condition.md` |
| Collection processing | `patterns/iteration.md` |
| Cross-cutting concerns | `patterns/aspects.md` |
| Use cases: Anatomy and conventions | `use-cases/structure.md` |
| Full RegisterUser walkthrough | `use-cases/complete-example.md` |
| Test strategies and assertions | `testing/patterns.md` |
| Vertical slicing, package layout | `project-structure/organization.md` |
| The `jbct-coder` agent's rule body (condensed rules, then API, patterns, testing, structure) | `reference/coder-rules.md`, `reference/coder-api-patterns.md` |

Agents: `jbct-coder` (implementation) and `jbct-reviewer` (review); see `reference/source-and-tooling.md`.

### Documentation
- **[JBCT book](https://pragmatica.dev/java/jbct/course/)** - Complete technical reference (JBCT book)
- **../../TECHNOLOGY.md** - High-level pattern catalog
- **../../CHANGELOG.md** - Version history and changes

Repository: https://github.com/siy/coding-technology

## Implementation Workflow

1. **Define use case interface** with Request, Response, and execute signature
2. **Create validated request** with static factory using `Result.all()`
3. **Define steps** as single-method interfaces (nested in use case)
4. **Create value objects** with validation in static factories
5. **Implement factory method** returning lambda with composition chain
6. **Write tests** starting with validation, then happy path, then failure cases

**💡 Tip:** For automatic generation following this workflow, use the **jbct-coder** subagent.

## Common Mistakes to Avoid

❌ Using business exceptions instead of `Result`/`Promise`
❌ Nested records in use case factories (use lambdas)
❌ `Void` type parameter (use `Unit`; `void` return is OK for fire-and-forget)
❌ `Promise<Result<T>>` (redundant nesting)
❌ Separate validation methods (parse at construction)
❌ Public constructors on value objects
❌ Complex logic in lambdas (extract to methods)
❌ `Validated` prefix (use `Valid`)

**💡 Tip:** For automated code review checking these mistakes, use the **jbct-reviewer** subagent.

## Self-Validation Checkpoint

Before considering JBCT code complete, verify ALL of these:

### Zero Tolerance (must pass)
- [ ] No `*Impl` classes
- [ ] No `null` checks in business logic
- [ ] No `throw`/`catch` in business logic
- [ ] No `Void` type parameter (use `Unit`; `void` return OK for fire-and-forget)
- [ ] No `Result.failure()` or `Promise.failure()` (use `cause.result()`/`cause.promise()`)
- [ ] No multi-statement lambdas in map/flatMap

### Pattern Compliance
- [ ] Each method implements exactly ONE pattern
- [ ] Sequencer chains ≤5 steps
- [ ] Fork-Join inputs are immutable
- [ ] Growing context uses intermediate records (not nested closures)

### Data Flow
- [ ] Every method has clear input → output
- [ ] No hidden state mutations
- [ ] Dependencies injected via factory parameters

### Naming
- [ ] Factory methods: `TypeName.typeName(...)` on every record (`Result<Self>` if any invariant, `Self` if none; a local record inside a factory method is exempt)
- [ ] Validated types: `Valid` prefix (not `Validated`)
- [ ] Errors: past tense (`NotFound`, `Failed`, `Expired`)

### Structure
- [ ] Use case = interface + factory + steps
- [ ] Value objects = record + static factory returning `Result<T>`
- [ ] Errors = sealed interface with enum for fixed messages
