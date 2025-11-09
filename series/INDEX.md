# Java Backend Coding Technology: Complete Learning Series

**Based on:** [CODING_GUIDE.md](../CODING_GUIDE.md) v1.8.2

## About This Series

This six-part series teaches you how to write backend Java code that's predictable, testable, and optimized for human-AI collaboration. Whether you're a junior developer learning functional composition or a senior engineer evaluating architectural approaches, this series provides a complete, progressive education in structural standardization.

**Who this is for:**
- Junior developers learning backend development
- Mid-level engineers seeking to improve code quality and maintainability
- Senior developers evaluating functional approaches for their teams
- Anyone working with AI coding assistants and struggling with structural consistency

**What you'll learn:**
- How to make code structure predictable and deterministic
- Functional composition patterns that eliminate common bugs
- How to structure code for optimal AI collaboration
- Complete patterns for building production-ready backend systems

**Prerequisites:**
- Basic Java knowledge (records, interfaces, generics)
- Familiarity with modern Java features (switch expressions, pattern matching helpful but not required)
- Understanding of REST APIs and databases (for later parts)

## The Series

### [Part 1: Introduction & Foundations](part-01-foundations.md)
**~45 min read** | *Start here if you're new to functional composition*

Understand why structural standardization matters in the AI era and learn the foundational concepts that make everything else work.

**Topics:**
- The engineering scalability crisis: why traditional approaches fail
- Foundational concepts: Smart Wrappers (monads), composition, side effects (explained for beginners)
- Progressive terminology: starting with "Smart Wrappers", gradually introducing "monad"
- What makes code "AI-ready"
- Evaluation Framework: objective criteria for every decision
- Try It Now exercises: observing patterns in your existing code

**Key takeaway:** Code structure is a business decision, not a preference. Mechanical rules enable teams to scale.

---

### [Part 2: Core Principles](part-02-core-principles.md)
**~60 min read** | *The non-negotiable rules*

Master the four return types and three fundamental principles that form the foundation of the technology.

**Topics:**
- Spring to JBCT Translation: mapping familiar patterns (@Service, @Repository, etc.)
- The Four Return Kinds: T, Option<T>, Result<T>, Promise<T>
- Why Not Java Standard Library? Comparing to Optional, CompletableFuture, exceptions
- Parse, Don't Validate: making invalid states unrepresentable
- Real-World Validation: cross-field, dependent, business rules
- Migrating Existing Codebases: incremental adoption strategy
- No Business Exceptions: errors as typed values (when exceptions are still OK)
- Basic Testing: functional assertions with onSuccess/onFailure
- Pragmatica Lite Quick Reference: common imports and patterns

**Key takeaway:** Everything in this technology flows from these four types and three principles. Master these, and patterns become obvious.

---

### [Part 3: Basic Patterns & Structure](part-03-basic-patterns.md)
**~50 min read** | *Your first building blocks*

Learn the structural rules and basic patterns that handle 80% of your daily coding tasks.

**Topics:**
- Single Pattern Per Function: one responsibility, mechanical refactoring
- Single Level of Abstraction: no complex logic in lambdas
- Leaf: the atomic unit of processing
- Condition: branching as values
- Iteration: functional collection processing

**Key takeaway:** Most code is simple transformations, lookups, and conditionals. Master these patterns and you can write clear, testable code for common scenarios.

---

### [Part 4: Advanced Patterns](part-04-advanced-patterns.md)
**~50 min read** | *Composing patterns for real use cases*

Compose basic patterns into sophisticated workflows for complex business logic.

**Topics:**
- Sequencer: chaining dependent steps (the workhorse pattern)
- Fork-Join: parallel composition and independence validation
- Aspects: cross-cutting concerns without mixing concerns
- Monadic terminology established: transitioning from Smart Wrappers

**Key takeaway:** Real use cases are compositions of simple patterns. The Sequencer pattern structures 90% of business logic.

---

### [Part 5: Testing Strategy & Evolutionary Approach](part-05-testing-strategy.md)
**~50 min read** | *Master comprehensive testing for functional composition*

Learn the evolutionary testing strategy that grows tests alongside implementation, testing composition rather than isolated components. (Basic testing patterns are introduced in Part 2; this part covers advanced strategy.)

**Topics:**
- Evolutionary Testing Process: from stubs to production-ready
- Integration-First Philosophy: why test assembled use cases
- Test Organization: nested classes, builders, canonical vectors
- Handling Complex Inputs: test data builders and factories
- What to Test Where: value objects, leaves, use cases, adapters
- Migration Guide: from traditional unit testing

**Key takeaway:** Test behavior end-to-end, not components in isolation. Integration tests with only adapters stubbed provide highest confidence with least brittleness.

---

### [Part 6: Building Production Systems](part-06-production-systems.md)
**~50 min read** | *From patterns to production-ready code*

Build a complete use case from requirements to deployment and learn how to integrate with real frameworks.

**Topics:**
- Complete Use Case Walkthrough: RegisterUser from requirements to tests
- Project Structure & Package Organization: vertical slicing, placement rules
- Framework Integration: connecting to Spring Boot and JOOQ
- Conclusion: where to go next

**Key takeaway:** This isn't academic theory. It's a complete approach to building production systems that scales with your team.

---

## Learning Paths

### Fast Track (Senior Developers)
Already familiar with functional programming? Skip Part 1 and start with [Part 2: Core Principles](part-02-core-principles.md).

### Complete Learning (Recommended)
New to functional composition or want comprehensive understanding? Read sequentially from Part 1 through Part 6.

### Reference Use
Looking for specific patterns? Jump directly to the relevant part using the topic list above, then follow cross-references as needed.

## Relationship to Other Documents

**[CODING_GUIDE.md](../CODING_GUIDE.md)**: The complete technical reference. Use this for quick lookup after completing the series.

**[MANAGEMENT_PERSPECTIVE.md](../MANAGEMENT_PERSPECTIVE.md)**: The business case for structural standardization. Share this with engineering leadership to build organizational support.

## Getting Help

- **Technical questions**: Refer to [CODING_GUIDE.md](../CODING_GUIDE.md) for detailed API reference
- **Business case**: See [MANAGEMENT_PERSPECTIVE.md](../MANAGEMENT_PERSPECTIVE.md) for ROI analysis
- **Feedback**: [GitHub Issues](https://github.com/siy/coding-technology/issues)

## Series Version

**Version 1.8.2** (2025-01-09)
- Simplified documentation for average Java developers
- Progressive terminology transition: Smart Wrappers → monads across series
- Added Spring to JBCT Translation table (Part 2)
- Added Quick Wins section for incremental adoption
- Moved basic testing from Part 5 to Part 2 for earlier verification
- Added real-world validation examples (Part 2)
- Added migration strategy for existing codebases (Part 2)

**Version 1.1.0** (2025-01-07)
- Added Part 5: Testing Strategy & Evolutionary Approach
- Series expanded from 5 to 6 parts
- Comprehensive testing strategy with integration-first philosophy
- Evolutionary testing process documentation
- Former Part 5 is now Part 6

**Version 1.0.0** (2025-10-05)
- Initial series split from CODING_GUIDE.md v1.1.0
- Added foundational concepts section for junior developers
- Organized into progressive learning modules

---

**Ready to start?** Begin with [Part 1: Introduction & Foundations](part-01-foundations.md)
