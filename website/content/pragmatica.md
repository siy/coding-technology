# Pragmatica

Pragmatica Core is a small functional library for Java: `Result`, `Option`, and `Promise` — three types that replace `null`, checked exceptions, and `CompletableFuture` chains with something composable. Each carries an error channel, each supports the same `map`/`flatMap` vocabulary, and failures are values instead of control flow you have to remember to catch.

It exists because Java's built-ins don't hold up under composition. `Optional` has no error channel — you know something is missing but not why. `CompletableFuture` turns exceptions into control flow, and its API sprawls across `thenApply`, `thenCompose`, and `exceptionally`. Pragmatica Core replaces all three with one consistent shape.

The library lives at [pragmaticalabs/pragmatica](https://github.com/pragmaticalabs/pragmatica) (the `core/` module of the Pragmatica monorepo; formerly `siy/pragmatica-lite`). Maven coordinates: `org.pragmatica-lite:core`.

Java Backend Coding Technology is written against Pragmatica Core — its four return types, `T`, `Option<T>`, `Result<T>`, `Promise<T>`, are the implementation foundation. Read [JBCT](/java/jbct/) for how the method uses it.
