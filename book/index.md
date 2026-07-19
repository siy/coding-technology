# Java Backend Coding Technology

**Free web edition** of the complete JBCT book. For a portable PDF with cover art, see [Get the PDF](https://leanpub.com/jbct-book).

---

## Part I: Foundations

| Chapter | Description |
|---------|-------------|
| [Introduction - Code Unification](introduction.md) | Why structural standardization matters in the AI era and what JBCT sets out to solve. |
| [From Process to Patterns](from-process-to-patterns.md) | Process-first design methodology — how to go from requirements to code structure mechanically. |
| [The Four Return Types](four-return-types.md) | Why exactly four return types are sufficient and when to use each one. |
| [Pragmatica Core Essentials](pragmatica-core-essentials.md) | The minimal Pragmatica Core API surface you need to get started. |

---

## Part II: Core Principles

| Chapter | Description |
|---------|-------------|
| [Parse, Don't Validate](parse-dont-validate.md) | Make invalid states unrepresentable using factory-method construction. |
| [Error Handling & Composition](error-handling.md) | Errors as typed values, clean monadic composition, and when exceptions are still acceptable. |
| [Null Policy & Error Recovery](null-policy-recovery.md) | When null is acceptable at adapter boundaries and how to recover gracefully. |

---

## Part III: Patterns

| Chapter | Description |
|---------|-------------|
| [Basic Patterns & Structure](basic-patterns.md) | Leaf, Condition, Iteration — the three building blocks that handle 80% of daily coding. |
| [Advanced Patterns](advanced-patterns.md) | Sequencer, Fork-Join, and Aspects for composing sophisticated workflows. |
| [Knowledge-Gathering Pipelines](knowledge-gathering-pipelines.md) | Specialised pattern for assembling context from multiple independent sources. |
| [Thread Safety](thread-safety.md) | Thread-safety guarantees per pattern and how Promise handles concurrency. |

---

## Part IV: Testing

| Chapter | Description |
|---------|-------------|
| [Testing Philosophy](testing-philosophy.md) | Integration-first testing — why testing composition beats testing components. |
| [Testing in Practice](testing-practice.md) | Organisation, parameterised tests, and the evolutionary stub-to-production workflow. |

---

## Part V: Production Systems

| Chapter | Description |
|---------|-------------|
| [Complete Example - RegisterUser](registeruser-example.md) | A full use case walkthrough from requirements through tests. |
| [Complete Example - PlaceOrder](placeorder-example.md) | Multi-step order placement with Fork-Join and error recovery. |
| [Focused Example - PublishArticle](publisharticle-example.md) | External-service integration using the Sequencer pattern. |
| [Focused Example - TransferFunds](transferfunds-example.md) | Transactional safety and rollback with typed errors. |
| [Project Structure & Framework Integration](project-structure.md) | Vertical slicing, package layout, and connecting to Spring Boot and JOOQ. |

---

## Part VI: Adoption

| Chapter | Description |
|---------|-------------|
| [Systematic Application Guide](systematic-application.md) | Eight checkpoints for coding and review that enforce 100% JBCT compliance. |
| [Migration Strategies](migration-strategies.md) | Incremental adoption — how to migrate existing codebases without a big-bang rewrite. |
| [Comparison with Other Approaches](comparison.md) | How JBCT compares to traditional OO, Spring idioms, and other functional styles. |
| [Troubleshooting & FAQ](troubleshooting-faq.md) | Common mistakes, compiler errors, and answers to frequently asked questions. |

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
