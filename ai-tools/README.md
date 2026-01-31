# AI Tooling for JBCT

Claude Code integration for Java Backend Coding Technology - skills, agents, and commands for AI-assisted development.

## Overview

JBCT provides four AI tools for Claude Code:

| Tool | Type | Purpose |
|------|------|---------|
| **jbct** | Skill | Learning, quick reference, understanding patterns |
| **jbct-coder** | Subagent | Code generation following JBCT patterns |
| **jbct-reviewer** | Subagent | Code review for JBCT compliance |
| **jbct-review** | Skill/Command | Parallel review with 10 focused workers |

## Installation

### Quick Install (All Tools)

```bash
# Clone repository
git clone https://github.com/siy/coding-technology.git
cd coding-technology/ai-tools

# Install skills and agents
cp -r skills agents ~/.claude/
```

### Verify Installation

```bash
ls ~/.claude/skills/jbct/SKILL.md
ls ~/.claude/skills/jbct-review/SKILL.md
ls ~/.claude/agents/jbct-coder.md
ls ~/.claude/agents/jbct-reviewer.md
```

---

## JBCT Skill

**Purpose:** Learning JBCT principles, quick reference, understanding patterns.

**Activation:** Automatic when working with `Result`, `Option`, `Promise` types, value objects, use cases, or JBCT patterns.

### When to Use

- Learning JBCT principles and patterns
- Quick reference for API usage and examples
- Understanding when to use which pattern
- Questions about monadic composition, error handling, or validation

### Structure

The skill uses progressive detalization:

```
jbct/
├── SKILL.md                      # Entry point with quick reference
├── fundamentals/                 # Core principles
│   ├── four-return-kinds.md     # T, Option, Result, Promise
│   ├── parse-dont-validate.md   # Value object patterns
│   └── no-business-exceptions.md # Typed failures with Cause
├── patterns/                     # Six structural patterns
│   ├── leaf.md                  # Atomic operations
│   ├── sequencer.md             # Sequential composition
│   ├── fork-join.md             # Parallel operations
│   ├── condition.md             # Branching logic
│   ├── iteration.md             # Collection processing
│   └── aspects.md               # Cross-cutting concerns
├── use-cases/                    # Use case design
│   ├── structure.md             # Anatomy and conventions
│   └── complete-example.md      # RegisterUser walkthrough
├── testing/                      # Testing strategies
│   └── patterns.md              # Functional assertions
└── project-structure/            # Project organization
    └── organization.md          # Vertical slicing
```

### Quick Reference Topics

The skill provides immediate access to:

- **Four Return Kinds**: `T`, `Option<T>`, `Result<T>`, `Promise<T>`
- **Parse, Don't Validate**: Making invalid states unrepresentable
- **Six Structural Patterns**: Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects
- **Use Case Design**: Factories, validated inputs, step composition
- **Naming Conventions**: Factory methods, validated inputs, error types
- **Testing Patterns**: Functional assertions with `onSuccess`/`onFailure`

### Example Interactions

```
User: "How do I create a value object with validation?"
Claude: [Uses jbct skill to explain parse-don't-validate pattern with example]

User: "When should I use Result vs Promise?"
Claude: [Uses jbct skill to explain Four Return Kinds decision tree]

User: "Show me Fork-Join pattern"
Claude: [Uses jbct skill to show Promise.all/Result.all examples]
```

---

## JBCT Coder Subagent

**Purpose:** Autonomous code generation following JBCT patterns.

**Invocation:** `"Use jbct-coder to implement..."` or Task tool with `subagent_type: "jbct-coder"`

### Capabilities

- **Complete use case implementations** with all components
- **Value objects** with validation and error types
- **Adapters** with proper exception handling
- **Test suites** following JBCT patterns
- **Deterministic code generation** following all JBCT rules

### What It Generates

| Component | Description |
|-----------|-------------|
| Use case interface | Request, Response, execute signature |
| ValidRequest | Static factory with `Result.all()` |
| Step interfaces | Single-method interfaces for composition |
| Value objects | Parse-don't-validate pattern |
| Error types | Sealed interfaces with Cause |
| Factory method | Lambda-returning factory |
| Tests | Validation, happy path, failure cases |

### Example Usage

```
User: "Use jbct-coder to implement a RegisterUser use case"

Claude: [Generates complete implementation]
- RegisterUser interface with Request/Response
- ValidRequest with email/password validation
- CheckEmail, HashPassword, SaveUser steps
- RegistrationError sealed interface
- registerUser() factory returning lambda
- RegisterUserTest with all test cases
```

### Generation Algorithm

The coder follows a deterministic algorithm:

1. **Parse requirements** → Extract entities, operations, constraints
2. **Design structure** → Map to JBCT patterns
3. **Generate value objects** → Parse-don't-validate factories
4. **Generate use case** → Interface, steps, factory
5. **Generate tests** → Validation, happy path, failures
6. **Verify compliance** → Check against JBCT rules

---

## JBCT Reviewer Subagent

**Purpose:** Comprehensive code review for JBCT compliance.

**Invocation:** `"Use jbct-reviewer to check..."` or Task tool with `subagent_type: "jbct-reviewer"`

### Review Areas

| Category | What It Checks |
|----------|----------------|
| Return Types | Four Return Kinds, no `Void`, no `Promise<Result<T>>` |
| Value Objects | Factory patterns, immutability, validation at construction |
| Use Cases | Structure, composition, lambda factories |
| Patterns | Correct use of Leaf, Sequencer, Fork-Join |
| Composition | Lambda complexity, fold() abuse, method references |
| Null Policy | Option usage, no null checks in business logic |
| Thread Safety | Immutability, no shared mutable state |
| Naming | Factory conventions, zone-appropriate verbs |
| Testing | Functional assertions, organization |

### Review Output Format

```markdown
# JBCT Code Review Summary

## 🎯 Overall JBCT Compliance
**Compliance Level**: ✅ COMPLIANT | ⚠️ PARTIAL | ❌ NON-COMPLIANT
**Recommendation**: ✅ APPROVE | ⚠️ APPROVE WITH CHANGES | ❌ REQUEST CHANGES

## 🔒 Critical JBCT Violations
[Violations with file:line, code quotes, fixes]

## ⚠️ JBCT Warnings
[Pattern misuse, structural issues]

## 🛠️ Suggestions
[Naming conventions, style improvements]

## 🧹 Nitpicks
[Minor formatting issues]
```

### Example Usage

```
User: "Use jbct-reviewer to check my RegisterUser implementation"

Claude: [Reviews all files, produces structured report]
- Checks return types
- Validates value object factories
- Verifies lambda complexity
- Reports findings with severity levels
```

---

## JBCT Review Command

**Purpose:** Thorough parallel review using 10 focused workers plus aggregation.

**Invocation:** `/jbct-review` command in Claude Code

### Usage

```
/jbct-review                              # Full codebase, all focus areas
/jbct-review src/main/java                # Specific path
/jbct-review --focus="Composition,Null"   # Specific areas only
/jbct-review src --focus="ValueObjects"   # Combined
```

### Focus Areas (10)

| Short Name | What It Checks |
|------------|----------------|
| `ValueObjects` | Factory patterns, immutability |
| `UseCases` | Structure, composition, lambda factories |
| `ReturnTypes` | Result/Promise, Void→Unit, no exceptions |
| `Structural` | Leaf, Sequencer, Fork-Join patterns |
| `Composition` | fold() abuse, lambda complexity |
| `Null` | Option usage, null policy |
| `ThreadSafety` | Immutability, shared state |
| `Naming` | Factory conventions, zones, acronyms |
| `Testing` | Assertions, organization |
| `CrossCutting` | Security, performance, logging |

### How It Works

```
1. Parse arguments (path, focus areas)
2. Discover all Java files in target path
3. Launch 10 parallel workers (one per focus area)
4. Each worker reviews ALL files for its specific area
5. Wait for all workers to complete
6. Launch aggregator to consolidate reports
7. Output unified report with deduplication
```

### Example Execution

```
User: /jbct-review src/main/java

1. Discover: 47 Java files found
2. Launch 10 parallel workers:
   - Worker 1: focus="Value Objects"
   - Worker 2: focus="Use Cases"
   - ...
   - Worker 10: focus="Cross-Cutting Concerns"
3. Wait for all workers
4. Aggregate results
5. Output: 3 Critical, 12 Warning, 8 Suggestion, 5 Nitpick
```

### Benefits

- **Thoroughness**: Narrow focus = deeper analysis
- **Speed**: Parallel execution of all 10 workers
- **Deduplication**: Aggregator removes duplicate findings
- **Balanced load**: Focus areas grouped for even distribution

---

## When to Use Which Tool

| Scenario | Tool |
|----------|------|
| Learning JBCT patterns | jbct skill (automatic) |
| Quick API reference | jbct skill |
| Implementing new use case | jbct-coder |
| Implementing value objects | jbct-coder |
| Writing tests | jbct-coder |
| Review single file | jbct-reviewer |
| Review PR/branch | jbct-review (`/jbct-review`) |
| Full codebase audit | jbct-review |
| Check specific patterns | jbct-review with `--focus` |

---

## Integration with JBCT CLI

For automated checks in CI/CD, use [JBCT CLI](../CLI-TOOLING.md):

```bash
# Check if installed
jbct --version

# Format + lint
jbct check src/main/java
```

The AI tools complement the CLI:
- **CLI**: Automated, fast, 37 lint rules, CI/CD integration
- **AI tools**: Context-aware, deeper analysis, explanations, code generation

---

## Pragmatica Lite Core

All tools use **Pragmatica Lite Core 0.11.2** for functional types.

```xml
<dependency>
   <groupId>org.pragmatica-lite</groupId>
   <artifactId>core</artifactId>
   <version>0.11.2</version>
</dependency>
```

Library documentation: https://central.sonatype.com/artifact/org.pragmatica-lite/core

---

## Resources

- [JBCT Coding Guide](../CODING_GUIDE.md) - Complete technical reference
- [CLI Tools](../CLI-TOOLING.md) - Command-line formatting and linting
- [Maven Plugin](../MAVEN-PLUGIN.md) - Build integration
- [GitHub Repository](https://github.com/siy/coding-technology)
