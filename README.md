# Java Backend Coding Technology

> **Version 1.6.2** | [Full Changelog](CHANGELOG.md)

A framework-agnostic methodology for writing predictable, testable Java backend code optimized for human-AI collaboration.

## 🚀 Quick Start

**New to this technology?** Start with the learning series:

1. **[Series Index](series/INDEX.md)** - Overview and navigation for the 6-part learning series
2. **[Part 1: Foundations](series/part-01-foundations.md)** - Mental model and core ideas
3. **[Part 2: Core Principles](series/part-02-core-principles.md)** - Four return types, parse-don't-validate, no business exceptions
4. **[Part 3: Basic Patterns](series/part-03-basic-patterns.md)** - Leaf, Condition, Iteration
5. **[Part 4: Advanced Patterns](series/part-04-advanced-patterns.md)** - Sequencer, Fork-Join, Aspects, Testing basics
6. **[Part 5: Testing Strategy](series/part-05-testing-strategy.md)** - Evolutionary testing, integration-first approach, test organization
7. **[Part 6: Production Systems](series/part-06-production-systems.md)** - Complete use case walkthrough, project structure, framework integration

**Need the complete reference?** See **[CODING_GUIDE.md](CODING_GUIDE.md)** - comprehensive technical documentation with all patterns, principles, and examples.

## 📚 Documentation

### For Developers

- **[CODING_GUIDE.md](CODING_GUIDE.md)** - Complete technical reference (100+ pages)
  - Core concepts: Four Return Kinds, Parse-Don't-Validate, No Business Exceptions
  - Pattern catalog: Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects
  - Evaluation framework: Five objective criteria for code decisions
  - Naming conventions, testing patterns, project structure
  - Complete use case walkthrough with Spring Boot and JOOQ integration

- **[series/](series/)** - Progressive learning path (6 parts, ~25 pages each)
  - Part 5 covers comprehensive testing strategy
  - Designed for sequential reading
  - Builds concepts incrementally
  - Ideal for onboarding and teaching

### For Managers & Decision Makers

- **[EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)** - Executive brief: Restoring predictability in engineering delivery (2-3 pages)
  - Diagnostic checklist: 5 friction signals
  - Observable outcomes with proxy metrics
  - Side-by-side code comparisons with cognitive load analysis
  - Evidence-based adoption path

- **[MANAGEMENT_PERSPECTIVE.md](MANAGEMENT_PERSPECTIVE.md)** - Detailed business case for structural standardization
  - ROI of predictable code structure
  - Risk reduction through mechanical refactoring rules
  - Team velocity improvements with reduced subjective debates
  - Onboarding time reduction

### Changelog & Versioning

- **[CHANGELOG.md](CHANGELOG.md)** - Version history following [Keep a Changelog](https://keepachangelog.com/)
  - Current version: 1.6.2
  - Semantic versioning for documentation releases

## 🔧 For AI Collaboration

**Claude Code Subagents** - Ready-to-use configurations for specialized code assistance:

- **[jbct-coder.md](https://raw.githubusercontent.com/siy/coding-technology/main/jbct-coder.md)** - Code generation subagent
  - Generates JBCT-compliant code from requirements
  - Enforces Four Return Kinds, Parse Don't Validate, structural patterns
  - **Installation**: Download and place in `~/.claude/agents/jbct-coder.md`

- **[jbct-reviewer.md](https://raw.githubusercontent.com/siy/coding-technology/main/jbct-reviewer.md)** - Code review subagent
  - Reviews code for JBCT compliance and best practices
  - Checks patterns, naming conventions, project structure
  - Provides actionable feedback with examples
  - **Installation**: Download and place in `~/.claude/agents/jbct-reviewer.md`

**Usage**: After installation, Claude Code will automatically use these subagents when appropriate, or invoke explicitly: `"Use jbct-coder to implement..."` or `"Use jbct-reviewer to check..."`

## 📂 Repository Structure

```
coding-technology/
├── CODING_GUIDE.md              # Complete technical reference
├── series/                       # 6-part learning series
│   ├── INDEX.md                 # Series overview and navigation
│   ├── part-01-foundations.md
│   ├── part-02-core-principles.md
│   ├── part-03-basic-patterns.md
│   ├── part-04-advanced-patterns.md
│   ├── part-05-testing-strategy.md
│   └── part-06-production-systems.md
├── MANAGEMENT_PERSPECTIVE.md    # Business case and ROI
├── CHANGELOG.md                 # Version history
├── jbct-coder.md                # Claude Code subagent: code generation
├── jbct-reviewer.md             # Claude Code subagent: code review
├── examples/                    # Java code examples
│   └── [Maven projects demonstrating patterns]
├── sources/                     # Research materials
│   ├── articles/               # Reference articles
│   ├── code/                   # Code snippets
│   └── patterns/               # Pattern documentation
├── templates/                   # Reusable templates
└── PL_IMPROVEMENTS.md          # Pragmatica Lite enhancement backlog
```

## 🎯 What This Technology Provides

**Objective evaluation criteria** - Five measurable standards replace subjective "best practices":
1. Mental Overhead - Items you must remember
2. Business/Technical Ratio - Domain concepts vs framework noise
3. Design Impact - Enforces good patterns or allows bad ones?
4. Reliability - Compiler-verified or developer-remembered?
5. Complexity - Elements, connections, hidden coupling

**Mechanical refactoring rules** - No more "is this too complex?" debates. When a function does two patterns, split it. When validation logic appears twice, extract value object. When a component is reused, move to shared package.

**Unified structure** - Code looks the same whether you wrote it, a colleague wrote it, or AI generated it. Use cases read like business processes. Errors are domain concepts, not stack traces.

**Framework independence** - Business logic has zero framework dependencies. Adapters live at the edges. Swap Spring for Micronaut, JDBC for JOOQ - only rewrite adapters, not business logic.

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

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

You are free to:
- Use this methodology in commercial and non-commercial projects
- Modify and adapt the documentation and examples
- Distribute and share the content
- Create derivative works

---

**Version:** 1.6.1 | **Last Updated:** 2025-01-17 | **[Full Changelog](CHANGELOG.md)**

**Copyright © 2025 Sergiy Yevtushenko. Released under the [MIT License](LICENSE).**
