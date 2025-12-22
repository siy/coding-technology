# Java Backend Coding Technology
## Unified Code Through Functional Composition

---

## Table of Contents

### Part I: Foundations

**[Chapter 1: Introduction - Code Unification](ch01-introduction.md)**
- Why code unification matters in the AI era
- The problems JBCT solves
- The five evaluation criteria for design decisions
- Foundational concepts: side effects, composition, monads

**[Chapter 2: The Four Return Types](ch02-four-return-types.md)**
- `T`, `Option<T>`, `Result<T>`, `Promise<T>`
- Type selection criteria
- Type conversions and lifting
- Core operations: map, flatMap, fold

**[Chapter 3: Pragmatica Lite Essentials](ch03-pragmatica-lite-essentials.md)**
- Library philosophy and design goals
- Type factories and conversions
- Validation utilities (Verify.Is, Parse)
- Exception handling with lift

---

### Part II: Core Principles

**[Chapter 4: Parse, Don't Validate](ch04-parse-dont-validate.md)**
- Value objects that enforce invariants
- Factory method patterns
- Cross-field validation
- Normalization during construction

**[Chapter 5: Error Handling & Composition](ch05-error-handling.md)**
- Sealed interfaces for typed errors
- Error accumulation with Result.all()
- Short-circuit vs accumulation
- Composing error handlers

**[Chapter 6: Null Policy & Recovery](ch06-null-policy-recovery.md)**
- Null only at adapter boundaries
- Option for intentional absence
- Recovery patterns: or, orElse, recover
- Selective error recovery with switch

---

### Part III: Patterns

**[Chapter 7: Basic Patterns (Leaf, Condition, Iteration)](ch07-basic-patterns.md)**
- Three-zone architecture (External, Adapter, Domain)
- Leaf pattern for atomic I/O
- Condition pattern for routing
- Iteration pattern for collections
- Zone-based naming conventions

**[Chapter 8: Advanced Patterns (Sequencer, Fork-Join, Aspects)](ch08-advanced-patterns.md)**
- Sequencer: linear dependent chains (2-5 rule)
- Fork-Join: parallel independent operations
- Aspects: cross-cutting concerns (retry, timeout, audit)
- Compensation pattern for rollback

**[Chapter 9: Thread Safety & Immutability](ch09-thread-safety.md)**
- Safety guarantees by pattern
- Promise resolution semantics
- Mutable state boundaries
- Common thread safety mistakes

---

### Part IV: Testing

**[Chapter 10: Testing Philosophy](ch10-testing-philosophy.md)**
- Integration-first testing
- Evolutionary testing process
- Test data builders
- Testing pyramid for JBCT

**[Chapter 11: Testing in Practice](ch11-testing-practice.md)**
- Test organization with nested classes
- Parameterized tests for validation
- Stub implementations for step interfaces
- Async testing patterns

---

### Part V: Production Systems

**[Chapter 12: Complete Example - RegisterUser](ch12-registeruser-example.md)**
- Requirements to implementation walkthrough
- Value objects: Email, Password
- Use case with step interfaces
- Full test suite

**[Chapter 13: Complete Example - PlaceOrder](ch13-placeorder-example.md)**
- E-commerce domain
- Fork-Join for inventory checks
- Compensation for payment failures
- Best-effort notifications

**[Chapter 14: Focused Examples](ch14a-publisharticle-example.md)**
- [PublishArticle](ch14a-publisharticle-example.md): Condition pattern for routing
- [TransferFunds](ch14b-transferfunds-example.md): Aspects composition

**[Chapter 15: Project Structure & Framework Integration](ch15-project-structure.md)**
- Vertical slicing philosophy
- Package organization
- Module boundaries (when needed)
- File structure guidelines: import ordering, member ordering, utility interfaces
- Spring Boot + JOOQ integration

---

### Part VI: Adoption

**[Chapter 16: Systematic Application Guide](ch16-systematic-application.md)**
- 8 checkpoints for coding and review
- Violation → Fix patterns
- Application order for new code
- Review completeness checklist

**[Chapter 17: Migration Strategies](ch17-migration-strategies.md)**
- 4-phase migration playbook
- Team adoption strategies
- Bridging old and new code
- Common resistance and responses

**[Chapter 18: Comparison with Other Approaches](ch18-comparison.md)**
- vs Traditional Layered Architecture
- vs Hexagonal Architecture
- vs Clean Architecture
- vs Railway-Oriented Programming
- vs vavr and Arrow-kt

**[Chapter 19: Troubleshooting & FAQ](ch19-troubleshooting-faq.md)**
- Debugging monadic chains
- Common mistakes and fixes
- IDE setup recommendations
- Frequently asked questions

---

### Appendices

**[Appendix A: Pragmatica Lite Core API Reference](appendix-a-api-reference.md)**
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
Chapters 1-3 → Chapter 4 → Chapter 7 → Chapter 12 → Appendix D

**Experienced Developer:**
Chapter 1 → Chapters 7-8 → Chapter 16 → Chapter 17

**Team Lead/Architect:**
Chapter 1 → Chapter 15 → Chapters 16-18

**Coming from FP background:**
Chapter 3 → Chapter 18 → Chapters 7-8 → Chapter 15

---

**Total:** 19 chapters + 3 appendices
**Estimated reading time:** 8-12 hours
**Practice exercises:** 24 (with solutions)
