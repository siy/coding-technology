# Appendix C: Glossary

This glossary defines key terms used throughout the book.

For the methodology vocabulary — *change driver*, *telescope*, *altitude*, *use case*, *workflow*, *data as residue*, and the rest — see the glossary in the companion *Process-First Design*, which owns those conceptual terms. This appendix covers the Pragmatica-level and JBCT-specific terms that book does not.

---

## A

**Adapter**
A component that bridges between external systems and the domain. Adapters implement step interfaces and wrap external I/O in Promise types. Examples: repositories, HTTP clients, message queue producers.

**Adapter Zone**
The architectural layer containing adapters. Converts between external representations (JSON, SQL) and domain types. The only place where Promise.lift() should appear.

**Aggregation**
Combining multiple Result or Promise values into one. `Result.all()` accumulates all failures. `Promise.all()` fails fast on first failure.

**Aspects Pattern**
A structural pattern for cross-cutting concerns like retry, timeout, logging, and audit. Implemented as wrapper functions that compose around a core operation.

---

## B

**Bifurcation**
Handling both success and failure cases. Methods like `fold()` and `apply()` accept two handlers - one for each outcome.

---

## C

**Cause**
A typed error value in Pragmatica Core. Represents why an operation failed. Defined as sealed interfaces for exhaustive handling. Preferred over exceptions for business errors.

**Chain**
A sequence of monadic operations connected by `flatMap()`. Each step receives the previous step's success value. Failures short-circuit the chain.

**Clean Architecture**
Uncle Bob's architectural style with concentric layers and the dependency rule. JBCT can be implemented within Clean Architecture.

**CompositeCause**
A Cause containing multiple sub-causes. Created by `Result.all()` when multiple validations fail. Allows collecting all errors instead of stopping at first.

**Condition Pattern**
A structural pattern for routing based on a discriminator value. Implemented with switch expressions. Each branch returns the same type.

---

## D

**Dependency Inversion**
Dependencies point toward abstractions, not implementations. In JBCT, use cases depend on step interfaces (abstractions), adapters implement them.

**Domain Zone**
The architectural layer containing pure business logic. Contains use cases, value objects, and step interfaces. No framework dependencies.

---

## E

**Error Accumulation**
Collecting all errors instead of stopping at the first. `Result.all()` accumulates failures into CompositeCause.

**Exception Wrapping**
Converting exceptions to Cause values at adapter boundaries. Done with `Promise.lift()` or `Result.lift()`.

**External Zone**
Everything outside your application: databases, external APIs, message queues, file systems.

---

## F

**Factory Method**
A static method that creates instances of value objects or use cases. Value object factories return `Result<T>` to enforce validation.

**Fail-Fast**
Stopping at the first failure. `flatMap()` chains and `Promise.all()` are fail-fast.

**flatMap**
The monadic bind operation. Chains dependent operations. If input is failure, skips the operation. Prevents nested monads (`Result<Result<T>>`).

**Fn1, Fn2, Fn3**
Functional interfaces in Pragmatica Core for functions with 1, 2, or 3 parameters. Similar to Java's Function but with better composition.

**Fork-Join Pattern**
A structural pattern for parallel independent operations. Uses `Promise.all()` to run operations concurrently and combine results.

---

## G

**Guard Clause**
Early return on invalid input. In JBCT, replaced by parse-don't-validate: validation happens in value object factories, not guard clauses.

---

## H

**Happy Path**
The execution path when all operations succeed. In JBCT, the happy path is the default - failures are handled explicitly.

**Hexagonal Architecture**
Ports and Adapters architecture. Domain at center, adapters at edges. JBCT's step interfaces are similar to ports.

**Hide the Machinery, Keep the Meaning**
JBCT's twin property: technical detail is pushed to adapters and Aspects (the machinery hidden), while business facts are preserved in types and combinators (the meaning kept) — return types state fallibility and absence, `Option` parameters state domain optionality, `flatMap` states dependency, `all()` states independence, sealed `Cause` hierarchies state the failure catalog, `*State` sums state the lifecycle. The code reads twice: as Java by the compiler, as the business process by the reader. The inventory table is in From Process to Patterns.

---

## I

**Immutability**
Objects that cannot be modified after creation. Java records are immutable by default. Essential for thread safety in JBCT.

**Iteration Pattern**
A structural pattern for processing collections. Uses `Promise.allOf()` for parallel processing or stream operations for sequential.

---

## J

**JBCT**
Java Backend Coding Technology. A methodology for writing maintainable backend Java code using functional composition and explicit error handling.

---

## L

**Leaf Pattern**
A structural pattern for atomic operations with no dependencies. Typically adapters wrapping external I/O with `Promise.lift()`.

**Lift**
Converting a value or operation to a monadic context. `Result.lift()` wraps throwing code in Result. `result.async()` lifts Result to Promise.

---

## M

**map**
Transform the success value while preserving the container. Does not flatten nested containers - use `flatMap()` when the mapper returns a monadic type.

**Monad**
A design pattern for chaining operations that may have side effects. Option, Result, and Promise are all monads. The key operation is `flatMap()`.

---

## O

**Option**
A type representing a value that may be absent. Use when absence is normal, not an error. Convert to Result when absence should be an error.

---

## P

**Parse, Don't Validate**
A principle: instead of validating data and proceeding with raw types, parse data into validated types that make invalid states unrepresentable.

**Port**
In Hexagonal Architecture, an interface defining how the domain interacts with the outside world. Similar to JBCT's step interfaces.

**Pragmatica Core**
A minimal Java library providing Option, Result, Promise, and Cause types. The foundation for JBCT patterns.

**Promise**
A type representing an asynchronous operation that may fail. Combines async execution with explicit error handling.

**Pure Function**
A function with no side effects that always returns the same output for the same input. Value object factories should be pure.

---

## R

**Railway-Oriented Programming (ROP)**
An error handling approach using "two-track" types. Success track and failure track. JBCT uses this model via Result and Promise.

**Record**
Java's immutable data class (since Java 14). Used for value objects, requests, responses, and error types in JBCT.

**recover**
Handle failures and potentially convert to success. Takes a function `Cause -> M<T>` that can either provide a fallback value or re-throw.

**Result**
A type representing a synchronous operation that may fail. Contains either a success value or a Cause.

**Result.all**
Combines multiple Results, accumulating all failures into CompositeCause. Use for independent validations.

---

## S

**Sealed Interface**
Java's restricted inheritance (since Java 17). All implementations must be known at compile time. Used for Cause types and exhaustive switch expressions.

**Sequencer Pattern**
A structural pattern for linear chains of dependent operations. Each step depends on the previous step's output. Uses `flatMap()` chains.

**Short-Circuit**
Stopping execution at the first failure. `flatMap()` chains short-circuit. `Result.all()` does not short-circuit.

**State (`*State`) and the State Machine**
The lifecycle states a workflow advances through, modeled as a sealed sum type named with a `*State` suffix — `HoldState`, `BookingState`, `SeatState` — with bare variants (`Free`, `Held`, `Confirmed`, `Cancelled`). It is the single field several use cases write, changed only through a guarded transition, never an overwrite, so the one point needing coordination is the transition. The suffix is reserved for this lifecycle sum, not every mutable holder. See *Process-First Design*'s glossary for the methodology-level definition.

**Step Interface**
A functional interface defining one operation in a use case. Declared inside the use case interface. Implemented by adapters.

**Stub**
A test double that returns predetermined values. In JBCT, typically lambdas implementing step interfaces.

---

## T

**Three Zones**
JBCT's architectural model: External (outside systems), Adapter (boundary translation), Domain (pure business logic).

**TimeSpan**
Pragmatica Core's duration type. Created with fluent API: `TimeSpan.timeSpan(5).seconds()`.

**Type Lifting**
Converting from a lower type to a higher one: `T` → `Option` → `Result` → `Promise`. Safe direction that adds information.

---

## U

**Unit**
A type with a single value, representing "no meaningful result". Used instead of `Void` for operations that succeed but return nothing.

**Use Case**
A single business operation exposed as a functional interface. Contains Request/ValidRequest/Response records and step interfaces.

---

## V

**Validation**
Checking that data meets requirements. In JBCT, validation happens in value object factories, returning `Result<T>`.

**Value Object**
An immutable object representing a domain concept. Created through factory methods that enforce validation. Examples: Email, Money, UserId.

**Verify**
Pragmatica Core utility class for validation predicates. `Verify.ensure()` creates Result from predicate. `Verify.Is` provides common predicates.

---

## W

**Wrapper**
A function that adds behavior around another function. Used in the Aspects pattern for cross-cutting concerns.

---

## Quick Reference

| Term | One-Line Definition |
|------|---------------------|
| Adapter | Bridges external systems to domain |
| Cause | Typed error value |
| flatMap | Chain dependent operations |
| Fork-Join | Parallel independent operations |
| Leaf | Atomic adapter operation |
| map | Transform success value |
| Option | Value that may be absent |
| Parse, Don't Validate | Create validated types, not checked raw data |
| Promise | Async operation that may fail |
| Result | Sync operation that may fail |
| Sequencer | Linear chain of dependent steps |
| Step Interface | One operation in a use case |
| Unit | Type for "no result" |
| Use Case | Single business operation |
| Value Object | Immutable validated domain concept |
