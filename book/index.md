# Java Backend Coding Technology

**Free web edition** of the complete JBCT book. For a portable PDF with cover art, see [Get the PDF](https://leanpub.com/jbct-book).

---

## Part I: Foundations

| Chapter | Description |
|---------|-------------|
| [Chapter 1: Introduction - Code Unification](ch01-introduction.md) | Why structural standardization matters in the AI era and what JBCT sets out to solve. |
| [Chapter 2: From Process to Patterns](ch02-design-methodology.md) | Process-first design methodology — how to go from requirements to code structure mechanically. |
| [Chapter 3: The Four Return Types](ch02-four-return-types.md) | Why exactly four return types are sufficient and when to use each one. |
| [Chapter 4: Pragmatica Core Essentials](ch03-pragmatica-lite-essentials.md) | The minimal Pragmatica Core API surface you need to get started. |

---

## Part II: Core Principles

| Chapter | Description |
|---------|-------------|
| [Chapter 5: Parse, Don't Validate](ch04-parse-dont-validate.md) | Make invalid states unrepresentable using factory-method construction. |
| [Chapter 6: Error Handling & Composition](ch05-error-handling.md) | Errors as typed values, clean monadic composition, and when exceptions are still acceptable. |
| [Chapter 7: Null Policy & Error Recovery](ch06-null-policy-recovery.md) | When null is acceptable at adapter boundaries and how to recover gracefully. |

---

## Part III: Patterns

| Chapter | Description |
|---------|-------------|
| [Chapter 8: Basic Patterns & Structure](ch07-basic-patterns.md) | Leaf, Condition, Iteration — the three building blocks that handle 80% of daily coding. |
| [Chapter 9: Advanced Patterns](ch08-advanced-patterns.md) | Sequencer, Fork-Join, and Aspects for composing sophisticated workflows. |
| [Chapter 9b: Knowledge-Gathering Pipelines](ch08b-knowledge-gathering-pipelines.md) | Specialised pattern for assembling context from multiple independent sources. |
| [Chapter 10: Thread Safety](ch09-thread-safety.md) | Thread-safety guarantees per pattern and how Promise handles concurrency. |

---

## Part IV: Testing

| Chapter | Description |
|---------|-------------|
| [Chapter 11: Testing Philosophy](ch10-testing-philosophy.md) | Integration-first testing — why testing composition beats testing components. |
| [Chapter 12: Testing in Practice](ch11-testing-practice.md) | Organisation, parameterised tests, and the evolutionary stub-to-production workflow. |

---

## Part V: Production Systems

| Chapter | Description |
|---------|-------------|
| [Chapter 13: Complete Example - RegisterUser](ch12-registeruser-example.md) | A full use case walkthrough from requirements through tests. |
| [Chapter 14: Complete Example - PlaceOrder](ch13-placeorder-example.md) | Multi-step order placement with Fork-Join and error recovery. |
| [Chapter 15a: Focused Example - PublishArticle](ch14a-publisharticle-example.md) | External-service integration using the Sequencer pattern. |
| [Chapter 15b: Focused Example - TransferFunds](ch14b-transferfunds-example.md) | Transactional safety and rollback with typed errors. |
| [Chapter 16: Project Structure & Framework Integration](ch15-project-structure.md) | Vertical slicing, package layout, and connecting to Spring Boot and JOOQ. |

---

## Part VI: Adoption

| Chapter | Description |
|---------|-------------|
| [Chapter 17: Systematic Application Guide](ch16-systematic-application.md) | Eight checkpoints for coding and review that enforce 100% JBCT compliance. |
| [Chapter 18: Migration Strategies](ch17-migration-strategies.md) | Incremental adoption — how to migrate existing codebases without a big-bang rewrite. |
| [Chapter 19: Comparison with Other Approaches](ch18-comparison.md) | How JBCT compares to traditional OO, Spring idioms, and other functional styles. |
| [Chapter 20: Troubleshooting & FAQ](ch19-troubleshooting-faq.md) | Common mistakes, compiler errors, and answers to frequently asked questions. |

---

## Appendices

| Appendix | Description |
|----------|-------------|
| [Appendix A: Pragmatica Core API Reference](appendix-a-api-reference.md) | Complete API reference for Result, Option, Promise, and utility types. |
| [Appendix B: Exercises and Solutions](appendix-b-exercises.md) | Practice exercises for each major topic with worked solutions. |
| [Appendix C: Glossary](appendix-c-glossary.md) | Definitions for every term used throughout the book. |

---

## Beyond the web edition

- Prefer a file? [PDF/EPUB on Leanpub](https://leanpub.com/jbct-book) — $25, updates included.
- The design methodology upstream of JBCT: [Process-First Design](../books.html) — the condensed edition is free.
- Adopting with a team? [Work with us](../CONTACT.html) — assessment, training, adoption sprints.
