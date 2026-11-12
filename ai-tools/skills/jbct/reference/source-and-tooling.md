# JBCT Reference: Source-Anchored Chapters, CLI, Subagents

> Part of the `jbct` skill; loaded on demand from the index in `../SKILL.md`. Text moved verbatim from the former single-file SKILL.md.

## Source-Anchored Chapters (read this first)

Parts of this skill live in the **class-level header comments of Pragmatica Core source files** —
the single source of truth that cannot drift from the API. When a task touches one of these
areas, READ THE SOURCE HEADER before writing code:

| Chapter | Source of truth |
|---------|----------------|
| Core monads: combinator maps, construction, aggregation, conversions | `org/pragmatica/lang/Result.java`, `Option.java`, `Promise.java` headers |
| Validation: `ensure` families, full `Is` predicate catalog, `ensureOption`, `combine` | `org/pragmatica/lang/Verify.java` header |
| Intent annotations: when void/blocking/null is legitimate, decision procedures | `org/pragmatica/lang/Contract.java`, `TerminalOperation.java`, `NullReturn.java` headers |
| Built-in value objects: catalog, factories, validation rules | `org/pragmatica/lang/vo/package-info.java` (+ per-class headers) |
| Exception-safe parsing: wrapper catalog | `org/pragmatica/lang/parse/package-info.java` |
| Utilities: failure vocabulary, resilience (Retry/CircuitBreaker/RateLimiter/Idempotency), memoization, scheduling | `org/pragmatica/lang/utils/package-info.java` |

**Resolution order** (first that succeeds):
0. **`jbct doc <ClassOrPackage>`** — if the jbct CLI is available (`jbct --version`), this is the
   preferred shortcut: `jbct doc Verify`, `jbct doc org.pragmatica.lang.vo`, `jbct doc Result --api`.
   It applies the local-then-download resolution below automatically.
1. **Local checkout (preferred if present)** — if a local pragmatica checkout exists, read
   `<checkout>/core/src/main/java/<path>` directly. In sibling layouts (e.g. working inside
   `coding-technology/`) this is **`../pragmatica/core/src/main/java/<path>`**; inside the pragmatica
   repo itself it is `core/src/main/java/<path>`.
2. **Download if no local checkout** — fetch the Pragmatica Core sources for the project's declared
   core version, then read the header:
   - Maven Central sources jar:
     `mvn dependency:get -Dartifact=org.pragmatica-lite:core:<version>:jar:sources` then
     `unzip -p ~/.m2/repository/org/pragmatica-lite/core/<version>/core-<version>-sources.jar org/pragmatica/lang/Verify.java | head -120`
   - or GitHub release / raw:
     `https://raw.githubusercontent.com/pragmaticalabs/pragmatica/main/core/src/main/java/<path>`
3. **Degrade gracefully** — proceed with this file's summaries plus imitation of neighboring code,
   and say in your report that source chapters were unreachable.

Read only the class header (first ~120 lines), not whole implementation files.

## JBCT CLI Tool

JBCT CLI provides automated formatting and compliance checking. Every finding names the rule
that produced it: `JBCT-RET-*` (return types), `JBCT-VO-*` (value objects), `JBCT-EX-*`
(exceptions), `JBCT-NAM-*` (naming), `JBCT-LAM-*` (lambdas), `JBCT-STY-*` (style),
`JBCT-LOG-*` (logging), `JBCT-MIX-*` (I/O in domain).

**Check if installed:**
```bash
jbct --version
```

**Usage:**
```bash
jbct format src/main/java     # Format to JBCT style
jbct lint src/main/java       # Check JBCT compliance
jbct check src/main/java      # Combined format + lint
jbct init --slice my-service   # Scaffold new slice project
jbct add-slice <name>          # Add slice to existing project
jbct add-event <name>          # Add event scaffolding
jbct add-persistence           # Add PostgreSQL persistence support
```

**If not installed, suggest:**
```
💡 JBCT CLI automates formatting and lint checks for JBCT compliance.
   Install: curl -fsSL https://raw.githubusercontent.com/siy/jbct-cli/main/install.sh | sh
   Requires: Java 25+
   More info: https://github.com/siy/jbct-cli
```

## When to Use Specialized Subagents

This skill provides quick reference and learning resources. For complex implementation and review tasks, use specialized subagents:

### Use jbct-coder Subagent When:
- **Generating complete use case implementations** with all components
- **Creating value objects** with validation and error types
- **Implementing adapters** with proper exception handling
- **Writing tests** following JBCT patterns
- **Need deterministic code generation** following all JBCT rules

**How to invoke:** Use Task tool with `subagent_type: "jbct-coder"`

**What it provides:**
- Complete use case structure (interface, factory, steps)
- Validated request types with `Result.all()`
- Value objects with parse-don't-validate pattern
- Error types as sealed interfaces
- Comprehensive test suites (validation, happy path, failures)
- Step-by-step code generation with explanations

### Use jbct-reviewer Subagent When:
- **Reviewing existing code** for JBCT compliance
- **Validating patterns** (Leaf, Sequencer, Fork-Join, etc.)
- **Checking naming conventions** and structure
- **Identifying violations** with specific fixes
- **Need comprehensive checklist-based analysis**

**How to invoke:** Use Task tool with `subagent_type: "jbct-reviewer"`

**What it provides:**
- Four Return Kinds compliance check
- Parse-don't-validate pattern validation
- Null policy enforcement
- Pattern recognition and verification
- Naming convention compliance
- Detailed violation reports with corrections

### Use This Skill When:
- **Learning JBCT principles** and patterns
- **Looking up API usage** examples
- **Quick reference** for type conversions
- **Understanding when to use** which pattern
- **Exploring patterns** with examples

### Specialized Subagents
- **../../jbct-coder.md** - Autonomous code generation agent (invoke with Task tool)
  - Generates complete use cases with validation, tests, and adapters
  - Follows deterministic algorithms for consistent output
  - Includes evolutionary testing strategy
- **../../jbct-reviewer.md** - Autonomous code review agent (invoke with Task tool)
  - Comprehensive JBCT compliance checking
  - Pattern validation and naming convention enforcement
  - Detailed violation reports with fixes
