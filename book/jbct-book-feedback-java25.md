# JBCT Book Feedback (Java 25 Updated)

## 0. JBCT introduction
The abbreviation `JBCT` must be with decoding (Java Backend Coding Technology) when it appears firs time in the text. Reader does not have to infer that.

## 1. Direct Answer / High-Level Verdict

Net: the book is strong. For a mid–senior Java backend dev, it is usable as a primary guide to “JBCT + Pragmatica-Lite as a way of working”.

Major strengths:
- Clear conceptual skeleton: four return types, parse-don’t-validate, explicit error types, null policy, patterns (Leaf / Sequencer / Fork-Join / Aspects), thread safety, testing, migration strategy.
- Code examples are realistic and consistent with the theory.
- The zone separation (domain vs adapters) and vertical slicing are concrete and enforceable.
- Testing and thread-safety chapters are unusually good for a Java methodology book.

Issues to fix:
- Audience definition is off: the book claims “Prerequisites: None” but clearly targets mid-/senior engineers familiar with modern Java 25 fundamentals, lambdas, records, sealed types, pattern matching, and basic FP.
- Senior-level topics are missing: performance characteristics, cancellation semantics, backpressure, integration with `CompletableFuture`/Reactor, transactional boundaries, observability.
- Some design rules are stated as absolutes without a canonical exceptions matrix.
- Code examples occasionally violate earlier naming or pattern rules.
- Some clarity/consistency issues across chapters.

The book is close to being the canonical JBCT reference. Remaining work is structural tightening and advanced-topic supplementation.

## 2. Concise Reasoning / Systematic Pass Over Issues

### 2.1 Audience, Prerequisites, Positioning

**Issue A1: “Prerequisites: None” is misleading.**  
The book uses Java 25 idioms: pattern switches, records, sealed interfaces, virtual threads (implicitly relevant), and modern FP style.  
Fix: State global prerequisites upfront: “Mid-/senior Java backend developers, Java 25+, comfortable with lambdas, generics, and basic FP patterns.”

---

### 2.2 Conceptual Model: Four Return Types and Rules

**Issue C1: Boundaries and nesting rules are under-documented.**  
Provide a single page “Return Type Matrix” with:
- Allowed: `T`, `Option<T>`, `Result<T>`, `Promise<T>`, `Result<Option<T>>`, `Promise<Option<T>>`
- Discouraged: return types tied to framework semantics
- Forbidden: `Promise<Result<T>>`, `Promise<Option<Result<T>>>`, and other double-monads that break flow semantics.

**Issue C2: FP boundaries not explicit.**  
State clearly that JBCT uses *pragmatic* monads; monad laws are not required; purity is not a goal; predictability is.

---

### 2.3 Parse-Don't-Validate and Value Objects

**Issue V2: Validation placement guidelines not explicit.**  
Provide a clear rule:
- Value object: single-field or atomic invariants.  
- ValidRequest: cross-field invariants.  
- Use case: invariants depending on external state (DB uniqueness, credit checks).

---

### 2.4 Error Handling and Null Policy

**Issue E1: Incomplete guidance on programming errors vs business errors.**  
Add explicit rules:
- Business domain failures → `Result<T>` with typed `Cause`
- The only case when exceptions are allowed - if there is no meaningful way to recover and application must be terminated.
- Adapter boundaries → mapping null or exceptions into `Option` or `Result`

**Issue E2: Null policy not consolidated.**  
State in one place:  
“No null crosses domain boundaries. Incoming null is mapped to `Option.None`; outbound domain null is forbidden.”

---

### 2.5 Patterns: Leaf / Sequencer / Fork-Join / Aspects

**Issue P1: Examples occasionally break rules.**  
Initial mixed-pattern examples should be explicitly marked as anti-patterns.

**Issue P2: Fork-Join examples omit DB-level dependency warnings.**  
Add caution that type-level independence is not the same as infra-level independence (locking, rate limits).

**Issue P3: Aspects lack operational semantics.**  
Add:
- Timeout semantics (logical timeout vs actual cancellation).  
- Retry + idempotency rules.  
- Deterministic composition order of aspects.

---

### 2.7 Testing

Add:
- Guidance for scaling tests across large services.  
- Distinguish “fast integration tests” vs “slow integration tests”.  
- Patterns for testing async Promise-based flows with timeouts.

---

### 2.8 Migration

Add an interoperability section:
- `Optional<T>` → `Option<T>`  
- `CompletableFuture<T>` → `Promise<T>`  
- Exceptions → `Cause` mapping  
- Transitional adapter layer examples

---

### 2.9 Style, Language, Structure

Issues:
- Tone oscillation between basic and senior-level explanation.  
- Repetition of key concepts across chapters.  
- Minor naming inconsistencies vs your own rules.

Fix:
- Compress early FP explanations.  
- Make naming consistent throughout.  

---

## 3. Alternatives / Perspectives

### 3.3 Tangential Suggestions

Tangential: extract a “JBCT in 60 minutes” onboarding micro-book.
