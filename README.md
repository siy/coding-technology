# Java Backend Coding Technology

> **Version 2.2.0** | [Full Changelog](CHANGELOG.md)

Executable business process specifications. Code that reads like a business process, because it is one. A framework-agnostic methodology for writing predictable, testable Java backend code optimized for human-AI collaboration.

## Here's What Changes

<table>
<tr>
<th>Without JBCT</th>
<th>With JBCT</th>
</tr>
<tr>
<td>

```java
// Hidden failure modes, unclear control flow
public User findUser(String userId) throws NotFoundException {
    long id;
    try {
        id = Long.parseLong(userId);
    } catch (NumberFormatException e) {
        throw new IllegalArgumentException("Invalid user ID");
    }

    User user = repository.findById(id);
    if (user == null) {
        throw new NotFoundException("User not found: " + id);
    }

    return user;
    // Multiple failure modes hidden in throws
    // Caller must read docs to know what exceptions to catch
}
```

</td>
<td>

```java
// Parse don't validate - invalid states unrepresentable
public record UserId(long value) {
    // private UserId {}  // Not yet supported in Java

    public static Result<UserId> userId(String raw) {
        return Number.parseLong(raw)
                     .map(UserId::new);
    }
}

public interface FindUser {
    Promise<User> execute(UserId id);
}

// Usage
UserId.userId(userIdStr)
      .async()
      .flatMap(findUser::execute)
      // Parsing errors: Result<UserId>
      // Not found errors: Promise<User>
      // All failures typed, compiler enforces handling
```

</td>
</tr>
</table>

**Result:** Parse-don't-validate makes invalid states impossible. Typed errors eliminate hidden exceptions. Type signatures document failure modes.

## Why "Technology"?

In industrial manufacturing, **technology** is the structured method of producing goods with reliably consistent quality within reliably consistent time. It's not just tools. It's the engineered process that ensures stable output under defined conditions. Technology emphasizes predictability, repeatability, and control.

Traditional software development relies on "best practices." These are subjective guidelines that often contradict each other, leaving developers to make judgment calls on every decision. Should this be a service or a helper? When is a class too complex? How should errors flow? These questions consume cognitive energy and produce inconsistent results across teams, projects, and even within the same codebase. It's "art" more than engineering.

**Java Backend Coding Technology** transforms this into a technology. Less art, more engineering. It provides mechanical rules that eliminate subjective debates: unified code structure from functions to packages; clearly defined approaches to testing, logging, and interaction with external code; five objective criteria that replace "it depends" with measurable standards. The result is code that looks the same whether you wrote it, a colleague wrote it, or AI generated it. Predictable, testable, and optimized for both human and AI collaboration.

## 🚀 Quick Start

**New to this technology?** Start with the learning series:

1. **[Series Index](series/INDEX.md)** - Overview and navigation for the 9-part learning series
2. **[Part 1: Foundations](series/part-01-foundations.md)** - Mental model and core ideas
3. **[Part 2: The Four Return Types](series/part-02-four-return-types.md)** - T, Option, Result, Promise
4. **[Part 3: Parse, Don't Validate](series/part-03-parse-dont-validate.md)** - Making invalid states unrepresentable
5. **[Part 4: Error Handling & Composition](series/part-04-error-handling.md)** - Errors as values, null policy, monadic rules
6. **[Part 5: Basic Patterns](series/part-05-basic-patterns.md)** - Leaf, Condition, Iteration
7. **[Part 6: Advanced Patterns](series/part-06-advanced-patterns.md)** - Sequencer, Fork-Join, Aspects
8. **[Part 7: Testing Philosophy](series/part-07-testing-philosophy.md)** - Integration-first, evolutionary testing
9. **[Part 8: Testing in Practice](series/part-08-testing-practice.md)** - Organization, examples, migration
10. **[Part 9: Production Systems](series/part-09-production-systems.md)** - Complete walkthrough, project structure, frameworks

**Need the complete reference?** See **[CODING_GUIDE.md](CODING_GUIDE.md)** - comprehensive technical documentation with all patterns, principles, and examples.

## ⚡ Quick Wins: Start Small

**Don't want to learn a whole new paradigm?** You don't have to. Here are three changes you can make today that provide immediate value:

### 1. Convert One Request Object

Pick a request DTO that validates multiple fields.

**Before:**
```java
// DTO with validation annotations
public class CreateUserRequest {
    @NotBlank @Size(min = 3, max = 50)
    private String username;

    @NotBlank @javax.validation.constraints.Email
    private String email;

    // getters, setters...
    // Validation at controller layer — domain code has no guarantees
}
```

**After:**
```java
// Domain-specific value object
public record Username(String value) {
    private static final Cause BLANK = Causes.cause("Username is required");
    private static final Cause TOO_SHORT = Causes.cause("Username must be at least 3 characters");

    public static Result<Username> username(String raw) {
        return Verify.ensure(raw, Verify.Is::present, BLANK)
                     .map(String::trim)
                     .filter(TOO_SHORT, v -> v.length() >= 3)
                     .map(Username::new);
    }
}

// Email provided by Pragmatica Core (org.pragmatica.lang.vo.Email)
// Validated, RFC 5321 compliant — ready to use

// Composite request — validation errors accumulate
public record CreateUserRequest(Username username, Email email) {
    public static Result<CreateUserRequest> request(String rawName, String rawEmail) {
        return Result.all(Username.username(rawName),
                          Email.email(rawEmail))
                     .map(CreateUserRequest::new);
    }
}
// If constructed, every field is guaranteed valid
```

**Win:** Library VOs for common types (`Email`, `Url`, `Uuid`). Domain VOs for your specific rules. `Result.all()` accumulates all validation errors — users see every problem at once.

### 2. Convert One Service Method

Pick a method that can fail in business-meaningful ways.

**Before:**
```java
public User findUser(String id) throws UserNotFoundException {
    User user = repository.findById(id);
    if (user == null) {
        throw new UserNotFoundException(id);
    }
    return user;
}
// Caller doesn't know it throws without reading docs/code
```

**After:**
```java
public Promise<User> findUser(UserId id) {
    return repository.findById(id)  // Returns Promise<Option<User>>
                     .flatMap(opt -> opt.async(USER_NOT_FOUND));
}
// Compiler forces caller to handle the failure case
```

**Win:** Failures are type-safe. No hidden exceptions. Async I/O explicit in return type.

### 3. Convert One Test

Make one test more readable using functional assertions.

**Before:**
```java
@Test
void testUsernameValidation() {
    try {
        validateUsername("ab");
        fail("Should have thrown exception");
    } catch (ValidationException e) {
        assertTrue(e.getMessage().contains("username"));
    }
}
// Verbose, requires manual assertion, easy to forget fail()
```

**After:**
```java
@Test
void username_rejectsTooShort() {
    Username.username("ab")
            .onSuccess(Assertions::fail);  // Fail if unexpectedly succeeds
}

@Test
void username_acceptsValidInput() {
    Username.username("alice")
            .onFailure(Assertions::fail)  // Fail if unexpectedly fails
            .onSuccess(name -> assertEquals("alice", name.value()));
}
```

**Win:** Clear test intent. No try-catch boilerplate. Better failure messages.

---

**That's it.** Three small changes. Each takes 10 minutes. Each provides immediate value. You don't have to rewrite your whole app—adopt incrementally.

## 📚 Documentation

### For Developers

- **[CODING_GUIDE.md](CODING_GUIDE.md)** - Complete technical reference (100+ pages)
  - Core concepts: Four Return Kinds, Parse-Don't-Validate, No Business Exceptions
  - Pattern catalog: Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects
  - Evaluation framework: Five objective criteria for code decisions
  - Naming conventions, testing patterns, project structure
  - Complete use case walkthrough with Spring Boot and JOOQ integration

- **[series/](series/)** - Progressive learning path (9 parts)
  - Parts 2-4 cover core principles (split for digestibility)
  - Parts 7-8 cover comprehensive testing strategy
  - Designed for sequential reading
  - Builds concepts incrementally
  - Ideal for onboarding and teaching

### For Managers & Decision Makers

- **[MANAGEMENT_PERSPECTIVE.md](MANAGEMENT_PERSPECTIVE.md)** - Business case for structural standardization
  - ROI of predictable code structure
  - Risk reduction through mechanical refactoring rules
  - Team velocity improvements with reduced subjective debates
  - Onboarding time reduction

### Changelog & Versioning

- **[CHANGELOG.md](CHANGELOG.md)** - Version history following [Keep a Changelog](https://keepachangelog.com/)
  - Current version: 2.2.0 (2026-03-27)
  - Golden formatting patterns, Pragmatica Core 1.0.0-rc1, 37 lint rules
  - Semantic versioning for documentation releases

## 🔧 Tools

JBCT provides comprehensive tooling for AI-assisted development and automated compliance checking.

### AI Tools

**[AI Tooling Documentation](AI-TOOLING.md)** - Complete guide to Claude Code integration:

| Tool | Purpose |
|------|---------|
| **jbct skill** | Learning, quick reference, pattern understanding |
| **jbct-coder** | Autonomous code generation following JBCT patterns |
| **jbct-reviewer** | Code review for JBCT compliance |
| **jbct-review** | Parallel review with 10 focused workers (`/jbct-review` command) |

**Quick Install:**
```bash
# Install all AI tools
mkdir -p ~/.claude/skills ~/.claude/agents
cp -r skills/jbct skills/jbct-review ~/.claude/skills/
cp jbct-coder.md jbct-reviewer.md ~/.claude/agents/
```

### CLI Tools

**[CLI Documentation](CLI-TOOLING.md)** - Command-line formatting and linting:

| Command | Description |
|---------|-------------|
| `jbct format` | Format Java code to JBCT style |
| `jbct lint` | Check JBCT compliance (37 rules) |
| `jbct check` | Combined format + lint (recommended for CI) |
| `jbct init` | Scaffold new JBCT project |

**Quick Install (Linux/macOS):**
```bash
curl -fsSL https://raw.githubusercontent.com/siy/jbct-cli/main/install.sh | sh
```

### Maven Plugin

**[Maven Plugin Documentation](MAVEN-PLUGIN.md)** - Build integration:

```xml
<plugin>
    <groupId>org.pragmatica-lite</groupId>
    <artifactId>jbct-maven-plugin</artifactId>
    <version>0.4.6</version>
</plugin>
```

**Requirements:** Java 25+, Maven 3.9+

## 📂 Repository Structure

```
coding-technology/
├── CODING_GUIDE.md              # Complete technical reference
├── series/                       # 9-part learning series
│   ├── INDEX.md                 # Series overview and navigation
│   ├── part-01-foundations.md
│   ├── part-02-four-return-types.md
│   ├── part-03-parse-dont-validate.md
│   ├── part-04-error-handling.md
│   ├── part-05-basic-patterns.md
│   ├── part-06-advanced-patterns.md
│   ├── part-07-testing-philosophy.md
│   ├── part-08-testing-practice.md
│   └── part-09-production-systems.md
├── MANAGEMENT_PERSPECTIVE.md    # Business case and ROI
├── CHANGELOG.md                 # Version history
├── AI-TOOLING.md                # AI tools documentation
├── CLI-TOOLING.md               # CLI tools documentation
├── MAVEN-PLUGIN.md              # Maven plugin documentation
├── skills/                      # Claude Code skills
│   ├── jbct/                    # JBCT main skill
│   │   ├── SKILL.md             # Skill definition
│   │   └── README.md            # Installation instructions
│   └── jbct-review/             # Parallel review skill
│       └── SKILL.md             # /jbct-review command
├── jbct-coder.md                # Claude Code subagent: code generation
├── jbct-reviewer.md             # Claude Code subagent: code review
├── examples/                    # Java code examples
│   └── [Maven projects demonstrating patterns]
├── sources/                     # Research materials
│   ├── articles/                # Reference articles
│   ├── code/                    # Code snippets
│   └── patterns/                # Pattern documentation
├── templates/                   # Reusable templates
└── PL_IMPROVEMENTS.md           # Pragmatica Core enhancement backlog
```

## 🤝 Contributing

This repository documents a methodology, not a software project. Contributions welcome:

- **Experience reports** - How the technology worked in your project
- **Pattern discoveries** - New patterns or refinements
- **Examples** - Real-world use case implementations
- **Questions & discussions** - Open issues for clarification

## 📖 Key Concepts at a Glance

**Four Return Kinds**: Every function returns exactly one:
- `T` - Synchronous, cannot fail, always present
- `Option<T>` - Synchronous, cannot fail, might be absent
- `Result<T>` - Synchronous, can fail, present if success
- `Promise<T>` - Asynchronous, can fail

**Parse, Don't Validate**: Make invalid states unrepresentable. Validation is parsing - if construction succeeds, the object is valid.

**No Business Exceptions**: Business failures are expected outcomes, not exceptions. They flow through `Result` or `Promise` as typed `Cause` objects.

**Six Patterns = Six BPMN Constructs**: All code fits one pattern, each mapping directly to a BPMN flow construct:

| Pattern | BPMN Construct | Role |
|---------|---------------|------|
| **Leaf** | Task | Atomic operation (business logic or I/O adapter) |
| **Sequencer** | Sequence Flow | Chain dependent steps (2-5 steps) |
| **Fork-Join** | Parallel Gateway | Parallel independent operations |
| **Condition** | Exclusive Gateway | Branching as values |
| **Iteration** | Multi-Instance Activity | Functional combinators over collections |
| **Aspects** | Event Sub-Process | Cross-cutting concerns (retry, timeout, metrics) |

If you can draw it as a BPMN diagram, you can write it as JBCT code. The structure is the same.

**Vertical Slicing**: Each use case is self-contained. Business logic isolated per use case, not centralized.

## 🔗 Related Projects

- **[Pragmatica Core](https://central.sonatype.com/artifact/org.pragmatica-lite/core)** - The foundational library providing `Option`, `Result`, `Promise`, and functional utilities

**Maven:**
```xml
<dependency>
   <groupId>org.pragmatica-lite</groupId>
   <artifactId>core</artifactId>
   <version>1.0.0-rc1</version>
</dependency>
```

**Gradle:**
```gradle
implementation 'org.pragmatica-lite:core:1.0.0-rc1'
```

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

You are free to:
- Use this methodology in commercial and non-commercial projects
- Modify and adapt the documentation and examples
- Distribute and share the content
- Create derivative works

## Support

If you find this useful, consider [sponsoring](https://github.com/sponsors/siy).

---

**Version:** 2.2.0 | **Last Updated:** 2026-03-27 | **[Full Changelog](CHANGELOG.md)**

**Copyright © 2025 Sergiy Yevtushenko. Released under the [MIT License](LICENSE).**
