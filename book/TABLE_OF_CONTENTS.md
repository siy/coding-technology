# Java Backend Coding Technology
## Unified Code Through Functional Composition

**Based on:** JBCT v3.1.0 | **Pragmatica Core:** 1.0.0-rc1

---

## Table of Contents

### Part I: Foundations

**[Chapter 1: Introduction - Code Unification](ch01-introduction.md)**
- Why code unification matters in the AI era
- The problems JBCT solves
- The five evaluation criteria for design decisions
- Foundational concepts: side effects, composition, monads

**[Chapter 2: From Process to Patterns](ch02-design-methodology.md)**
- Backend processes as knowledge gathering
- The data dependency graph (DDG)
- Mapping DDG operators to JBCT patterns and Pragmatica code
- Pointer to the companion *Process-First Design* book for the full design methodology

**[Chapter 3: The Four Return Types](ch02-four-return-types.md)**
- `T`, `Option<T>`, `Result<T>`, `Promise<T>`
- Type selection criteria
- Type conversions and lifting
- Core operations: map, flatMap, fold

**[Chapter 4: Pragmatica Core Essentials](ch03-pragmatica-lite-essentials.md)**
- Library philosophy and design goals
- Type factories and conversions
- Validation utilities (Verify.Is, Parse)
- Exception handling with lift

---

### Part II: Core Principles

**[Chapter 5: Parse, Don't Validate](ch04-parse-dont-validate.md)**
- Value objects that enforce invariants
- Factory method patterns
- Cross-field validation
- Normalization during construction

**[Chapter 6: Error Handling & Composition](ch05-error-handling.md)**
- Sealed interfaces for typed errors
- Error accumulation with Result.all()
- Short-circuit vs accumulation
- Composing error handlers

**[Chapter 7: Null Policy & Recovery](ch06-null-policy-recovery.md)**
- Null only at adapter boundaries
- Option for intentional absence
- Recovery patterns: or, orElse, recover
- Selective error recovery with switch

---

### Part III: Patterns

**[Chapter 8: Basic Patterns (Leaf, Condition, Iteration)](ch07-basic-patterns.md)**
- Three-zone architecture (External, Adapter, Domain)
- Leaf pattern for atomic I/O
- Condition pattern for routing
- Iteration pattern for collections
- Zone-based naming conventions

**[Chapter 9: Advanced Patterns (Sequencer, Fork-Join, Aspects)](ch08-advanced-patterns.md)**
- Sequencer: linear dependent chains (2-5 rule)
- Fork-Join: parallel independent operations
- Aspects: cross-cutting concerns (retry, timeout, audit)
- Compensation pattern for rollback

**[Chapter 9b: Knowledge-Gathering Pipelines](ch08b-knowledge-gathering-pipelines.md)**
- Growing context: stage records as compiler-checked progress proofs
- The `mapWith` / `flatMapWith` / `ensureWith` family
- Gating vs. evidence: when a check accretes its result

**[Chapter 10: Thread Safety & Immutability](ch09-thread-safety.md)**
- Safety guarantees by pattern
- Promise resolution semantics
- Mutable state boundaries
- Common thread safety mistakes

---

### Part IV: Testing

**[Chapter 11: Testing Philosophy](ch10-testing-philosophy.md)**
- Integration-first testing
- Evolutionary testing process
- Test data builders
- Testing pyramid for JBCT

**[Chapter 12: Testing in Practice](ch11-testing-practice.md)**
- Test organization with nested classes
- Parameterized tests for validation
- Stub implementations for step interfaces
- Async testing patterns

---

### Part V: Production Systems

**[Chapter 13: Complete Example - RegisterUser](ch12-registeruser-example.md)**
- Requirements to implementation walkthrough
- Value objects: Email, Password
- Use case with step interfaces
- Full test suite

**[Chapter 14: Complete Example - PlaceOrder](ch13-placeorder-example.md)**
- E-commerce domain
- Fork-Join for inventory checks
- Compensation for payment failures
- Best-effort notifications

**[Chapter 15a: Focused Examples](ch14a-publisharticle-example.md)**
- [PublishArticle](ch14a-publisharticle-example.md): Condition pattern for routing
- [TransferFunds](ch14b-transferfunds-example.md): Aspects composition

**[Chapter 16: Project Structure & Framework Integration](ch15-project-structure.md)**
- Vertical slicing philosophy
- Package organization
- Module boundaries (when needed)
- File structure guidelines: import ordering, member ordering, utility interfaces
- Spring Boot + JOOQ integration

---

### Part VI: Adoption

**[Chapter 17: Systematic Application Guide](ch16-systematic-application.md)**
- 8 checkpoints for coding and review
- Violation → Fix patterns
- Application order for new code
- Review completeness checklist

**[Chapter 18: Migration Strategies](ch17-migration-strategies.md)**
- 4-phase migration playbook
- Team adoption strategies
- Bridging old and new code
- Common resistance and responses

**[Chapter 19: Comparison with Other Approaches](ch18-comparison.md)**
- vs Traditional Layered Architecture
- vs Hexagonal Architecture
- vs Clean Architecture
- vs Railway-Oriented Programming
- vs vavr and Arrow-kt

**[Chapter 20: Troubleshooting & FAQ](ch19-troubleshooting-faq.md)**
- Debugging monadic chains
- Common mistakes and fixes
- IDE setup recommendations
- Frequently asked questions

---

### Appendices

**[Appendix A: Pragmatica Core API Reference](appendix-a-api-reference.md)**
- Type conversions table
- Creating instances
- Exception handling (lift methods)
- Aggregation (all/any/allOf)
- Common methods reference

**[Appendix B: Exercises and Solutions](appendix-b-exercises.md)**
- 24 exercises across 6 parts
- 3 difficulty levels (⭐ to ⭐⭐⭐)
- Full solutions with explanations

**[Appendix C: Glossary](appendix-c-glossary.md)**
- 50+ terms defined
- Quick reference table

---

### Supporting Materials

- [Chapter Summaries](chapter-summaries.md)
- [Diagrams](diagrams.md)
- [Restructuring Map](restructuring-map.md) (internal reference)

---

## Reading Paths

**New to JBCT:**
Chapter 1 → Chapter 2 → Chapters 3-4 → Chapter 5 → Chapter 8 → Chapter 13

**Experienced Developer:**
Chapter 1 → Chapter 2 → Chapters 8-9 → Chapter 17 → Chapter 18

**Team Lead/Architect:**
Chapter 1 → Chapter 2 → Chapter 16 → Chapters 17-19

**Coming from FP background:**
Chapter 2 → Chapter 4 → Chapter 19 → Chapters 8-9 → Chapter 16

---

**Total:** 20 chapters + 3 appendices
**Estimated reading time:** 8-12 hours
**Practice exercises:** 24 (with solutions)
