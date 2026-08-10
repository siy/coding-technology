# Replacing fold() with Dedicated Monadic Methods

## Overview

The `fold()` method is a fundamental operation on `Option<T>`, `Result<T>`, and `Promise<T>` that transforms both cases (empty/present, failure/success) into a single result type. While powerful, `fold()` often obscures intent and creates verbose, nested code.

This document analyzes patterns where dedicated monadic methods provide clearer, more idiomatic alternatives to `fold()`.

## The Problem with fold()

### Cognitive Load

```java
// What does this do? You must read both lambdas to understand
option.fold(
    () -> new NotFoundError(id).promise(),
    order -> validateCancellable(order, request)
)
```

The reader must:
1. Understand fold's signature (empty case first, present case second for Option)
2. Parse both lambda bodies
3. Mentally reconstruct the control flow

### Inconsistent Parameter Order

```java
// Option: empty first, present second
option.fold(Supplier<R> empty, Fn1<R, T> present)

// Result/Promise: failure first, success second
result.fold(Fn1<R, Cause> failure, Fn1<R, T> success)
```

This inconsistency increases cognitive overhead when switching between types.

### Nested Complexity

When fold lambdas contain additional monadic operations:

```java
option.fold(
    () -> Result.success(none()),
    template -> TemplateProcessor.compile(template)
                                 .map(Option::some)
)
```

The nesting creates visual noise and obscures the primary operation.

---

## Transformation Patterns

### Pattern 1: Option → Promise with Error on Empty

**Before (fold):**
```java
private Promise<OrderWithContext> findAndValidateOrder(ValidCancelOrderRequest validRequest) {
    return repository()
        .findById(validRequest.orderId().value())
        .fold(
            () -> orderNotFound(validRequest),
            order -> validateCancellable(order, validRequest)
        );
}

private Promise<OrderWithContext> orderNotFound(ValidCancelOrderRequest validRequest) {
    return new CancelOrderError.OrderNotFound(validRequest.orderId().value()).promise();
}
```

**After (toResult + async + flatMap):**
```java
private Promise<OrderWithContext> findAndValidateOrder(ValidCancelOrderRequest validRequest) {
    return repository()
        .findById(validRequest.orderId().value())
        .toResult(orderNotFound(validRequest))
        .async()
        .flatMap(order -> validateCancellable(order, validRequest));
}

private Cause orderNotFound(ValidCancelOrderRequest validRequest) {
    return new CancelOrderError.OrderNotFound(validRequest.orderId().value());
}
```

**Why this is better:**
- Intent is explicit: convert Option to Result with specific error, then lift to Promise
- Error factory returns `Cause` (pure data), not `Promise<T>` (no async wrapping for error creation)
- Linear flow: `toResult` → `async` → `flatMap`
- Each operation does one thing

**Alternative (async with Cause):**
```java
return repository()
    .findById(validRequest.orderId().value())
    .async(orderNotFound(validRequest))  // Option.async(Cause) lifts directly to Promise
    .flatMap(order -> validateCancellable(order, validRequest));
```

---

### Pattern 2: Option → Result with Default Value

**Before (fold):**
```java
private Result<Option<TemplateProcessor>> compileBodyProcessor(Option<String> body) {
    return body.fold(
        () -> Result.success(none()),
        template -> TemplateProcessor.compile(template)
                                     .map(Option::some)
    );
}
```

**After (map + or):**
```java
private Result<Option<TemplateProcessor>> compileBodyProcessor(Option<String> body) {
    return body.map(TemplateProcessor::compile)
               .map(result -> result.map(Option::some))
               .or(Result.success(none()));
}
```

**Why this is better:**
- Empty case handling moves to `.or()` at the end
- The transformation chain shows the happy path clearly
- `.or()` semantically matches "provide default if empty"

**Pattern breakdown:**
1. `body.map(TemplateProcessor::compile)` → `Option<Result<TemplateProcessor>>`
2. `.map(result -> result.map(Option::some))` → `Option<Result<Option<TemplateProcessor>>>`
3. `.or(Result.success(none()))` → `Result<Option<TemplateProcessor>>`

---

### Pattern 3: Option → Result with Parsing

**Before (fold):**
```java
public static Result<PatternGenerator> parse(String seqSpec) {
    return Option.option(seqSpec)
                 .map(String::trim)
                 .filter(s -> !s.isBlank())
                 .fold(
                     () -> Result.success(sequenceGenerator(1)),
                     s -> Number.parseLong(s)
                                .map(SequenceGenerator::sequenceGenerator)
                 );
}
```

**After (map + or):**
```java
public static Result<PatternGenerator> parse(String seqSpec) {
    return Option.option(seqSpec)
                 .map(String::trim)
                 .filter(s -> !s.isBlank())
                 .map(s -> Number.parseLong(s)
                                 .<PatternGenerator>map(SequenceGenerator::sequenceGenerator))
                 .or(Result.success(sequenceGenerator(1)));
}
```

**Why this is better:**
- Default value (empty spec → default generator) at the end is intuitive
- Type witness `.<PatternGenerator>` makes the generic conversion explicit
- Linear flow without branching lambdas

---

### Pattern 4: Result with Side Effects + Fallback

**Before (fold):**
```java
private Option<AetherConfig> loadConfigFile(Path path) {
    return ConfigLoader.load(path)
                       .fold(
                           cause -> logConfigError(cause.message()),
                           Option::option
                       );
}

private Option<AetherConfig> logConfigError(String message) {
    log.error("Failed to load config: {}", message);
    return Option.none();
}
```

**After (onFailure + option):**
```java
private Option<AetherConfig> loadConfigFile(Path path) {
    return ConfigLoader.load(path)
                       .onFailure(cause -> log.error("Failed to load config: {}", cause.message()))
                       .option();
}
```

**Why this is better:**
- Side effect (logging) is explicit with `onFailure`
- Conversion to Option is a single method call
- No need for helper method that only logs and returns empty
- `Result.option()` semantically means "discard error info, keep value if present"

---

### Pattern 5: Result with Complex Fallback

**Before (fold):**
```java
private static SharedLibraryClassLoader createSharedLibraryLoader(AetherNodeConfig config) {
    return config.frameworkPath().fold(
        () -> new SharedLibraryClassLoader(AetherNode.class.getClassLoader()),
        path -> FrameworkClassLoader.fromDirectory(path)
                                    .fold(
                                        cause -> {
                                            log.warn("Failed: {}. Falling back.", cause.message());
                                            return new SharedLibraryClassLoader(AetherNode.class.getClassLoader());
                                        },
                                        loader -> {
                                            log.info("Using FrameworkClassLoader with {} JARs", loader.getLoadedJars().size());
                                            return new SharedLibraryClassLoader(loader);
                                        }
                                    )
    );
}
```

**After (onFailure + map + or):**
```java
private static SharedLibraryClassLoader createSharedLibraryLoader(AetherNodeConfig config) {
    return config.frameworkPath().fold(
        () -> new SharedLibraryClassLoader(AetherNode.class.getClassLoader()),
        path -> FrameworkClassLoader.fromDirectory(path)
                                    .onFailure(cause -> log.warn("Failed: {}. Falling back.", cause.message()))
                                    .map(loader -> {
                                        log.info("Using FrameworkClassLoader with {} JARs", loader.getLoadedJars().size());
                                        return new SharedLibraryClassLoader(loader);
                                    })
                                    .or(new SharedLibraryClassLoader(AetherNode.class.getClassLoader()))
    );
}
```

**Why this is better:**
- Nested fold eliminated
- Side effects (logging) separated from transformations
- Fallback value explicit with `.or()`
- Each line does one thing

**Note:** The outer fold remains because Option's empty case creates a different instance than the inner Result's fallback. This is intentional - the outer fold distinguishes "no config" from "config failed to load."

---

### Pattern 6: Option → Promise (Immediate Lift)

**Before (fold):**
```java
public Promise<byte[]> resolve(Artifact artifact) {
    return dht.get(metaKey(artifact))
              .flatMap(metaOpt -> metaOpt.flatMap(ArtifactMetadata::fromBytes)
                                         .fold(
                                             () -> new ArtifactStoreError.NotFound(artifact).promise(),
                                             meta -> resolveChunks(artifact, meta)
                                         ));
}
```

**After (async with Cause):**
```java
public Promise<byte[]> resolve(Artifact artifact) {
    return dht.get(metaKey(artifact))
              .flatMap(metaOpt -> metaOpt.flatMap(ArtifactMetadata::fromBytes)
                                         .async(new ArtifactStoreError.NotFound(artifact))
                                         .flatMap(meta -> resolveChunks(artifact, meta)));
}
```

**Why this is better:**
- `Option.async(Cause)` is purpose-built for "lift to Promise, fail if empty"
- Error creation is synchronous (no `.promise()` wrapper)
- Clear intent: empty Option becomes failed Promise

---

### Pattern 7: Option → Value with Map and Default

**Before (fold):**
```java
private String buildRollingUpdateResponse(AetherNode node, String updateId) {
    return node.rollingUpdateManager()
               .getUpdate(updateId)
               .fold(
                   () -> "{\"error\":\"Update not found\",\"updateId\":\"" + updateId + "\"}",
                   this::buildRollingUpdateJson
               );
}
```

**After (map + or):**
```java
private String buildRollingUpdateResponse(AetherNode node, String updateId) {
    return node.rollingUpdateManager()
               .getUpdate(updateId)
               .map(this::buildRollingUpdateJson)
               .or(updateNotFoundJson(updateId));
}

private String updateNotFoundJson(String updateId) {
    return "{\"error\":\"Update not found\",\"updateId\":\"" + updateId + "\"}";
}
```

**Why this is better:**
- Happy path transformation in `.map()`
- Default/fallback with `.or()`
- Helper method makes error JSON reusable and testable
- Reading order matches logic: "get update, build JSON, or return error JSON"

---

### Pattern 8: Option in Promise Chain with Unit Result

**Before (fold):**
```java
public Promise<Unit> start() {
    return managementServer.fold(
                               () -> Promise.success(Unit.unit()),
                               ManagementServer::start
                           )
                           .flatMap(_ -> httpRouter.fold(
                               () -> Promise.success(Unit.unit()),
                               HttpRouter::start
                           ))
                           .flatMap(_ -> startClusterAsync());
}
```

**After (map + or with unitPromise):**
```java
public Promise<Unit> start() {
    return managementServer.map(ManagementServer::start)
                           .or(Promise.unitPromise())
                           .flatMap(_ -> httpRouter.map(HttpRouter::start)
                                                   .or(Promise.unitPromise()))
                           .flatMap(_ -> startClusterAsync());
}
```

**Why this is better:**
- Pattern is consistent: `option.map(action).or(noOpPromise)`
- `Promise.unitPromise()` is semantically clear: "success with no value"
- No lambda syntax for simple method references

---

## Decision Guide

### Use fold() when:
1. **Both cases produce fundamentally different types or logic paths** that can't be expressed as "transform then fallback"
2. **The empty/failure case requires complex computation** beyond providing a default value
3. **You're at a system boundary** converting to external types (HTTP responses, etc.)

### Replace fold() with dedicated methods when:

| Scenario | Before | After |
|----------|--------|-------|
| Option empty → error Promise | `opt.fold(() -> err.promise(), this::process)` | `opt.async(err).flatMap(this::process)` |
| Option empty → error Result | `opt.fold(() -> err.result(), this::process)` | `opt.toResult(err).flatMap(this::process)` |
| Option empty → default value | `opt.fold(() -> default, this::transform)` | `opt.map(this::transform).or(default)` |
| Result failure → log + Option | `res.fold(c -> { log(c); return none(); }, Option::some)` | `res.onFailure(this::log).option()` |
| Result failure → fallback | `res.fold(_ -> fallback, identity())` | `res.or(fallback)` |
| Result with side effects | `res.fold(c -> { log(c); return x; }, v -> { log(v); return y; })` | `res.onFailure(log).onSuccess(log).fold(...)` |

---

## Method Reference

### Option<T>
- `.toResult(Cause)` → `Result<T>` - convert to Result, empty becomes failure
- `.async(Cause)` → `Promise<T>` - convert to Promise, empty becomes failure
- `.map(Fn1<U, T>)` → `Option<U>` - transform if present
- `.or(T)` → `T` - unwrap with default value
- `.or(Supplier<T>)` → `T` - unwrap with lazy default

### Result<T>
- `.async()` → `Promise<T>` - lift to Promise
- `.option()` → `Option<T>` - discard error, keep value
- `.map(Fn1<U, T>)` → `Result<U>` - transform if success
- `.or(T)` → `T` - unwrap with fallback value
- `.onFailure(Consumer<Cause>)` → `Result<T>` - side effect on failure
- `.onSuccess(Consumer<T>)` → `Result<T>` - side effect on success

### Promise<T>
- `.map(Fn1<U, T>)` → `Promise<U>` - transform if success
- `.flatMap(Fn1<Promise<U>, T>)` → `Promise<U>` - chain async operations
- `.or(T)` → blocks and returns value or fallback
- `.onFailure(Consumer<Cause>)` → `Promise<T>` - side effect on failure
- `.onSuccess(Consumer<T>)` → `Promise<T>` - side effect on success

---

## Summary

The `fold()` method is a universal tool, but its generality comes at a cost:
- Both cases are equally prominent, even when one is trivial
- Lambda syntax adds visual noise
- Intent requires reading both branches

Dedicated methods encode intent directly:
- `toResult(Cause)` says "empty is an error"
- `async(Cause)` says "lift to async, empty is an error"
- `.map().or()` says "transform, with default if empty"
- `.onFailure()` says "side effect on error"

**Prefer dedicated methods. Reserve fold() for genuine bifurcation at boundaries.**
