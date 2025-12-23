# Java Backend Coding Technology

> **Version 2.0.6** | [Full Changelog](CHANGELOG.md)

A framework-agnostic methodology for writing predictable, testable Java backend code optimized for human-AI collaboration.

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

### 1. Convert One Value Object

Pick your most-validated field (email, phone, user ID).

**Before:**
```java
// DTO with validation annotations
public class UserRequest {
    @NotBlank @Email
    private String email;  // Can still be constructed with invalid data
    // getter/setter
}

// Validation happens at controller, but domain code has no guarantees
```

**After:**
```java
// Validation = construction
public record Email(String value) {
    // private Email {}  // Not yet supported in Java

    private static final Cause EMAIL_REQUIRED = Causes.cause("Email is required");
    private static final Fn1<Cause, String> EMAIL_BLANK = Causes.forOneValue("Email cannot be blank: %s");
    private static final Fn1<Cause, String> INVALID_FORMAT = Causes.forOneValue("Invalid email format: %s");

    public static Result<Email> email(String raw) {
        return Verify.ensure(EMAIL_REQUIRED, raw, Verify.Is::notNull)
            .filter(EMAIL_BLANK, Verify.Is::notBlank)
            .filter(INVALID_FORMAT, PATTERN.asMatchPredicate())
            .map(Email::new);
    }
}
// Impossible to create invalid Email - type system guarantees it
```

**Win:** Business logic only sees valid emails. No defensive `if (email == null)` checks.

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
        .flatMap(opt -> opt.async(USER_NOT_FOUND)); // Replace missing value with corresponding business error
}
// Compiler forces caller to handle the failure case
```

**Win:** Failures are type-safe. No hidden exceptions. Async I/O explicit in return type.

### 3. Convert One Test

Make one test more readable using functional assertions.

**Before:**
```java
@Test
void testEmailValidation() {
    try {
        validateEmail("invalid");
        fail("Should have thrown exception");
    } catch (ValidationException e) {
        assertTrue(e.getMessage().contains("email"));
    }
}
// Verbose, requires manual assertion, easy to forget fail()
```

**After:**
```java
@Test
void email_rejectsInvalidFormat() {
    Email.email("invalid")
         .onSuccess(Assertions::fail);  // Fail if unexpectedly succeeds
}

@Test
void email_acceptsValidFormat() {
    Email.email("user@example.com")
         .onFailure(Assertions::fail)  // Fail if unexpectedly fails
         .onSuccess(email -> assertEquals("user@example.com", email.value()));
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
  - Current version: 2.0.6 (2025-12-22)
  - Major release: Thread safety, concurrency, and 9-part series restructuring
  - Semantic versioning for documentation releases

## 🔧 Tools

### AI Tools

#### Claude Code Skill

**[skills/jbct/](skills/jbct/)** - Comprehensive JBCT skill for Claude Code:
- Design, implement, and review JBCT code
- Progressive detalization: quick reference → detailed patterns → advanced topics
- Covers Four Return Kinds, Parse Don't Validate, all six structural patterns
- Project structure, naming conventions, testing patterns
- **Installation**: `cp -r skills/jbct ~/.claude/skills/`

**Usage**: Claude Code will automatically activate the skill when working with Result/Option/Promise types, value objects, use cases, or JBCT patterns.

#### Claude Code Subagents

Ready-to-use configurations for specialized code assistance:

- **[jbct-coder.md](jbct-coder.md)** - Code generation subagent
  - Generates JBCT-compliant code from requirements
  - Enforces Four Return Kinds, Parse Don't Validate, structural patterns
  - **Installation**: Download and place in `~/.claude/agents/jbct-coder.md`

- **[jbct-reviewer.md](jbct-reviewer.md)** - Code review subagent
  - Reviews code for JBCT compliance and best practices
  - Checks patterns, naming conventions, project structure
  - Provides actionable feedback with examples
  - **Installation**: Download and place in `~/.claude/agents/jbct-reviewer.md`

**Usage**: After installation, Claude Code will automatically use these subagents when appropriate, or invoke explicitly: `"Use jbct-coder to implement..."` or `"Use jbct-reviewer to check..."`

### CLI Tools

#### JBCT CLI & Maven Plugin

**[jbct-cli](https://github.com/siy/jbct-cli)** - Code formatting and linting tools for JBCT:
- `jbct format` - Format Java code to JBCT style (chain alignment, import grouping)
- `jbct lint` - Check JBCT compliance with 33 lint rules
- `jbct check` - Combined format + lint (recommended for CI)
- `jbct init` - Scaffold new JBCT project with AI tools
- Maven plugin for build integration

**Quick Install (Linux/macOS):**
```bash
curl -fsSL https://raw.githubusercontent.com/siy/jbct-cli/main/install.sh | sh
```

**Requirements:** Java 25+

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
├── skills/                      # Claude Code skills
│   └── jbct/                    # JBCT skill
│       ├── SKILL.md             # Skill definition
│       └── README.md            # Installation instructions
├── jbct-coder.md                # Claude Code subagent: code generation
├── jbct-reviewer.md             # Claude Code subagent: code review
├── examples/                    # Java code examples
│   └── [Maven projects demonstrating patterns]
├── sources/                     # Research materials
│   ├── articles/                # Reference articles
│   ├── code/                    # Code snippets
│   └── patterns/                # Pattern documentation
├── templates/                   # Reusable templates
└── PL_IMPROVEMENTS.md           # Pragmatica Lite enhancement backlog
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

**Six Patterns**: All code fits one pattern:
1. **Leaf** - Atomic operation (business logic or I/O adapter)
2. **Sequencer** - Chain dependent steps (2-5 steps)
3. **Fork-Join** - Parallel independent operations
4. **Condition** - Branching as values
5. **Iteration** - Functional combinators over collections
6. **Aspects** - Cross-cutting concerns (retry, timeout, metrics)

**Vertical Slicing**: Each use case is self-contained. Business logic isolated per use case, not centralized.

## 🔗 Related Projects

- **[Pragmatica Lite Core](https://central.sonatype.com/artifact/org.pragmatica-lite/core)** - The foundational library providing `Option`, `Result`, `Promise`, and functional utilities

**Maven:**
```xml
<dependency>
   <groupId>org.pragmatica-lite</groupId>
   <artifactId>core</artifactId>
   <version>0.8.5</version>
</dependency>
```

**Gradle:**
```gradle
implementation 'org.pragmatica-lite:core:0.8.5'
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

**Version:** 2.0.6 | **Last Updated:** 2025-12-22 | **[Full Changelog](CHANGELOG.md)**

**Copyright © 2025 Sergiy Yevtushenko. Released under the [MIT License](LICENSE).**
