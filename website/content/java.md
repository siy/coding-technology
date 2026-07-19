# Java

This is the Java realization of the series: the same methodology, made concrete in one language.

## Java is a realization, not a lock-in

Process-First Design and Architecture Synthesis derive a process structure and an architecture from business intent — neither one mentions a programming language. Java Backend Coding Technology (JBCT) is what happens when those decisions get written down in Java. The patterns, the five evaluation criteria, and the discipline behind them are language-portable; Java is simply the language this series realizes them in first.

## Three pieces

**Java Backend Coding Technology** is the coding technology: typed failures, parse-don't-validate, composition patterns, a fixed catalog of structural patterns. Free course on this site; the book on Leanpub.

**Pragmatica Core** is the library JBCT is written against: `Result`, `Option`, `Promise` — functional types with an error channel, not `Optional` and `CompletableFuture` stretched to cover what they weren't built for.

**Pragmatica Aether** is where the same composition runs: a distributed Java runtime, still under active development, that keeps deployment topology out of business logic.

## Links

- [JBCT](/java/jbct/)
- [Pragmatica](/java/pragmatica/)
- [Aether](/java/aether/)
