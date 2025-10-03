Pragmatica Lite  -  Improvements Backlog

Scope
- Track library-level utilities that support this technology (aspects, helpers, docs). Business logic stays in app repos; aspects/utilities live in PL.

Aspect Primitives (decorators over Fn1<Out, In>)
- CompositeAspect
  - Compose multiple aspect decorators with explicit order; returns a single decorated Fn1.
  - Helpers: compose(listOf(aspects)), andThen(a, b), around(step, aspects...).
- TimeoutAspect
  - Result and Promise variants; per-attempt timeout when combined with Retry.
  - Policies: Duration, fail-fast vs fallback, deadline propagation.
- RetryAspect (exists; extend)
  - Backoff (exp/jitter), retry classifier, max attempts; per-attempt timeout interop.
  - Result/Promise parity; idempotency hint flag.
- CircuitBreakerAspect (exists; extend)
  - Result/Promise parity; standard metrics hooks; half-open strategy.
- RateLimitAspect
  - Token/leaky buckets; per-key limiting; async wait vs fail-fast.
- BulkheadAspect
  - Semaphore/queueing; queue length policy; backpressure signal.
- CacheAspect
  - Sync/async cache; key derivation; TTL/TTI; stampede protection.
- DeduplicationAspect
  - Idempotency-key based coalescing; window policy.
- MetricsAspect
  - RED metrics; low-cardinality labels (operation, useCase, step, outcome).
- LoggingAspect
  - Structured logs; correlation id propagation; success/failure summaries only.
- DeadlineAspect
  - Carry deadline through chain; convert to timeouts locally.
- CancellationAspect
  - Cancellation token; cooperative cancellation hooks for Promise.

Variant Strategy
- Some aspects should exist in two variants (Result and Promise) when both sync and async domains benefit (e.g., Metrics, Logging, Timeout in rare sync contexts).
- I/O‑specific aspects (e.g., Retry, CircuitBreaker, RateLimit, Bulkhead, Deadline, Cancellation) are Promise‑only by default.
- Option/T aspects are generally no‑ops unless purely observational (metrics/logging); prioritize Promise and Result surfaces first.

Core Utilities
- Aspect type
  - Decorator shape: Fn1<Out, In> -> Fn1<Out, In>, where Out ∈ {T, Option<T>, Result<T>, Promise<T>}.
  - Provide Result/Promise helpers; Option/T aspects are no-ops unless purely observational (metrics/logging).
- Config strategy
  - Policies as records; allow static configs and Supplier<Policy> per-call overrides.
- Error types
  - Standard technical Causes: Timeout, RateLimited, CircuitOpen, Cancelled.
- Promise integration
  - Ensure Promise.all works with decorated steps; docs for per-attempt vs global timeouts.
- Result utilities
  - Document CompositeCause accumulation; trace() integration with aspects.

Docs & Examples
- Usage patterns: withTimeout(policy, step), withRetry(policy, step), compose(aspects...).
- Recommended orderings: retry(with per-attempt timeout(step)); circuit-breaker outside; rate-limit outermost; metrics/logging outermost.
- Testing: aspects tested in isolation; business tests remain aspect-agnostic.

Open Questions
- Config discovery: local explicit policy vs environment (Context) injection.
- Idempotency: where to host utilities (dedup aspect vs domain pattern guidance).
