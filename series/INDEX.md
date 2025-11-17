# Java Backend Coding Technology: Complete Learning Series

**Based on:** [CODING_GUIDE.md](../CODING_GUIDE.md) v2.0.0

## About This Series

This nine-part series teaches you how to write backend Java code that's predictable, testable, and optimized for human-AI collaboration. Whether you're a junior developer learning functional composition or a senior engineer evaluating architectural approaches, this series provides a complete, progressive education in structural standardization.

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
- Quick Reference: pattern decision tree, type transformations, naming conventions
- What makes code "AI-ready"
- Evaluation Framework: objective criteria for every decision
- Try It Now exercises: observing patterns in your existing code

**Key takeaway:** Code structure is a business decision, not a preference. Mechanical rules enable teams to scale.

---

### [Part 2: The Four Return Types](part-02-four-return-types.md)
**~20 min read** | *The foundation: four types that cover everything*

Learn why exactly four return types are sufficient and when to use each one.

**Topics:**
- Spring to JBCT Translation: mapping familiar patterns (@Service, @Repository, etc.)
- The Four Return Kinds: T, Option<T>, Result<T>, Promise<T>
- Why Not Java Standard Library? Comparing to Optional, CompletableFuture, exceptions
- Type conversions and lifting
- Promise thread safety guarantees
- Quick Reference for choosing types

**Key takeaway:** Signatures tell you everything about function behavior. Four types eliminate ambiguity.

---

### [Part 3: Parse, Don't Validate](part-03-parse-dont-validate.md)
**~20 min read** | *Make invalid states unrepresentable*

Master the principle of validation through construction using factory methods.

**Topics:**
- Parse, Don't Validate: making invalid states unrepresentable
- Factory naming conventions (Email.email, Password.password)
- Cross-field validation with Result.all()
- Real-World Validation: dependent rules, business constraints
- Normalization in factories
- Optional fields with validation: Result<Option<T>>
- Migrating Existing Codebases: incremental adoption strategy
- Pragmatica Lite Validation Utilities: Verify.Is predicates, Parse subpackage

**Key takeaway:** If an instance exists, it's valid. No defensive checks needed.

---

### [Part 4: Error Handling & Composition](part-04-error-handling.md)
**~25 min read** | *Errors as values, clean composition*

Complete the core principles with error handling, null policy, and composition rules.

**Topics:**
- No Business Exceptions: errors as typed values (when exceptions are still OK)
- Null Policy: when null is acceptable at adapter boundaries
- Error Recovery Patterns: fallback values, graceful degradation
- Basic Testing: functional assertions with onSuccess/onFailure
- Monadic Composition Rules: lambda guidelines, forbidden patterns
- Pragmatica Lite API Reference: conversions, aggregation, lift methods
- Common Mistakes to Avoid

**Key takeaway:** Business failures aren't exceptional—they're expected. Type them, don't throw them.

---

### [Part 5: Basic Patterns & Structure](part-05-basic-patterns.md)
**~50 min read** | *Your first building blocks*

Learn the structural rules and basic patterns that handle 80% of your daily coding tasks.

**Topics:**
- Single Pattern Per Function: one responsibility, mechanical refactoring
- Single Level of Abstraction: no complex logic in lambdas
- Zone-Based Abstraction Framework: three zones for consistent naming (Derrick Brandt)
- Naming Conventions: factory methods, validated inputs, zone-based verbs
- Leaf: the atomic unit of processing
- Condition: branching as values
- Iteration: functional collection processing

**Key takeaway:** Most code is simple transformations, lookups, and conditionals. Master these patterns and you can write clear, testable code for common scenarios.

---

### [Part 6: Advanced Patterns](part-06-advanced-patterns.md)
**~50 min read** | *Composing patterns for real use cases*

Compose basic patterns into sophisticated workflows for complex business logic.

**Topics:**
- Sequencer: chaining dependent steps (the workhorse pattern)
- Fork-Join: parallel composition and independence validation
- Aspects: cross-cutting concerns without mixing concerns
- Thread Safety Quick Reference: pattern-by-pattern guarantees
- Monadic terminology established: transitioning from Smart Wrappers

**Key takeaway:** Real use cases are compositions of simple patterns. The Sequencer pattern structures 90% of business logic.

---

### [Part 7: Testing Philosophy & Evolution](part-07-testing-philosophy.md)
**~25 min read** | *Integration-first testing*

Learn why testing composition beats testing components, and how to evolve tests alongside implementation.

**Topics:**
- The Problem with Traditional Testing: why component-focused tests fail
- Philosophy: Integration-First Testing
- The Three Testing Layers: value objects, leaves, use cases
- The Evolutionary Testing Process: stub → validate → implement → production
- Handling Complex Input Objects: builders, canonical vectors, factories

**Key takeaway:** Test assembled use cases, not isolated components. Stub only at adapter boundaries.

---

### [Part 8: Testing in Practice](part-08-testing-practice.md)
**~25 min read** | *Organization, examples, migration*

Apply evolutionary testing at scale with practical techniques and complete examples.

**Topics:**
- Managing Large Test Counts: nested classes, parameterized tests, property-based testing
- What to Test Where: coverage criteria by component type
- Complete Worked Example: RegisterUser from stub to production
- Comparison to Traditional Unit Testing
- Migration Guide: from traditional to evolutionary
- The Testing Pyramid for this technology

**Key takeaway:** More integration tests than unit tests. Higher confidence, less brittleness.

---

### [Part 9: Building Production Systems](part-09-production-systems.md)
**~50 min read** | *From patterns to production-ready code*

Build a complete use case from requirements to deployment and learn how to integrate with real frameworks.

**Topics:**
- Complete Use Case Walkthrough: RegisterUser from requirements to tests
- Project Structure & Package Organization: vertical slicing, placement rules
- Module Organization: multi-module projects, when to use them
- Framework Integration: connecting to Spring Boot and JOOQ
- Conclusion: where to go next

**Key takeaway:** This isn't academic theory. It's a complete approach to building production systems that scales with your team.

---

## Learning Paths

### Fast Track (Senior Developers)
Already familiar with functional programming? Skip Part 1 and start with [Part 2: The Four Return Types](part-02-four-return-types.md).

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

**Version 2.0.0** (2025-11-13)
- **Series restructured from 6 to 9 parts:**
  - Part 2 split into 2A (Four Return Types), 2B (Parse Don't Validate), 2C (Error Handling)
  - Part 5 split into 5A (Testing Philosophy), 5B (Testing Practice)
  - Improved learning progression with focused, digestible sections
- **100% parity with CODING_GUIDE.md v2.0.0:**
  - Quick Reference: pattern decision tree, type transformations, testing patterns (Part 1)
  - Null Policy comprehensive coverage (Part 2C)
  - Error Recovery Patterns: fallback values, graceful degradation (Part 2C)
  - Expanded Monadic Composition Rules: lambda guidelines, forbidden patterns (Part 2C)
  - Pragmatica Lite API Reference: conversions, aggregation, utilities (Part 2A, 2C)
  - Zone-Based Abstraction Framework with Derrick Brandt attribution (Part 3)
  - Naming Conventions: factory methods, validated inputs, zone-based verbs (Part 2B, 3)
  - Thread Safety Quick Reference: pattern-by-pattern guarantees (Part 4)
  - Module Organization: multi-module projects, Gradle/Maven examples (Part 6)
- **Thread Safety and Concurrency additions:**
  - Immutability and Thread Confinement section (Part 1)
  - Promise resolution thread safety guarantees (Part 2A)
  - Fork-Join independence and thread safety unified view (Part 4)
  - Thread safety notes for all patterns (Parts 3, 4)
  - Mutable test state acceptability explanation (Part 5A)
- Enhanced documentation for easier adoption
- Progressive terminology transition: Smart Wrappers → monads across series
- Added Spring to JBCT Translation table (Part 2A)
- Added real-world validation examples (Part 2B)
- Added migration strategy for existing codebases (Part 2B, 2C)

**Version 1.1.0** (2025-10-06)
- Added Part 5: Testing Strategy & Evolutionary Approach
- Series expanded from 5 to 6 parts
- Comprehensive testing strategy with integration-first philosophy
- Evolutionary testing process documentation
- Former Part 5 is now Part 6

**Version 1.0.0** (2025-10-04)
- Initial series split from CODING_GUIDE.md v1.1.0
- Added foundational concepts section for junior developers
- Organized into progressive learning modules

---

**Ready to start?** Begin with [Part 1: Introduction & Foundations](part-01-foundations.md)
