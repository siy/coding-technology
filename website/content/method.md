# Method

Process-First Design and Architecture Synthesis are the stack-independent half of this series. They derive a system's shape before any code gets written, using nothing that depends on a programming language.

## The pipeline

Business intent goes into Process-First Design, which asks what the application does and derives its process structure — the unit of design is the process, not the entity. The output goes into Architecture Synthesis, which asks where computation happens: service-level objectives, constraints, and six architecture axes derive a deployment topology instead of a designer picking one from a catalog. An architecture derived this way is not fixed; it is re-derived when the inputs change.

The next layer, where these decisions become running Java code, lives on the [Java half](/java/) of this site.

## Methodology, not framework

Neither book asks you to adopt a library or a runtime. Both are procedures: a fixed set of questions, applied to your business and your service-level objectives, that produce a specific answer for your system. Nothing here locks you into a stack.

## Free here, or as a book

Both methods have a free course edition on this site: [Process-First Design](/method/pfd/course/) and [Architecture Synthesis](/method/architecture-synthesis/course/), each walking the book chapter by chapter with an exercise you run on a system you own. The books carry the full argument as continuous prose, on Leanpub.

## Links

- [Process-First Design](/method/pfd/)
- [Architecture Synthesis](/method/architecture-synthesis/)
- [Glossary](/method/glossary/)
- [Counterexamples](/method/counterexamples/)
