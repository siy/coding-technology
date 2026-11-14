# Interceptors (Cross-Cutting Method Behavior)

Retry, circuit breaking, rate limiting, caching and the like are attached to a slice method with a qualifier, the same way a resource is requested. No built-in method annotations ship: you declare one annotation per concern, naming the interceptor class and its config section. See [custom-qualifiers.md](custom-qualifiers.md) for the `@ResourceQualifier` mechanism.

```java
@ResourceQualifier(type = RetryMethodInterceptor.class, config = "retry.payment")
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RetryPayment {}
```

```java
@Slice
public interface Ordering {
    @LogCalls
    @BreakOnPaymentOutage
    @RetryPayment
    Promise<OrderPlaced> placeOrder(PlaceOrder request);
}
```

## The seven interceptor classes

| Class | Concern |
|-------|---------|
| `RetryMethodInterceptor` | retry a failed call |
| `CircuitBreakerMethodInterceptor` | stop calling a failing dependency |
| `RateLimitMethodInterceptor` | limit call rate |
| `MetricsMethodInterceptor` | record call metrics |
| `LoggingMethodInterceptor` | log calls |
| `CacheMethodInterceptor` | return a stored result without calling the method |
| `IdempotencyMethodInterceptor` | key repeat calls |

## Ordering

Composition is compile-time and deterministic: the generated factory wraps the method in nested `intercept(...)` calls, the first annotation on the method is the outermost wrapper and the last is innermost. In the example above, logging wraps the breaker, which wraps the retry. The chain is fixed by the source, so reordering it needs a rebuild; a deployment tunes only each interceptor's config section.

## Key

`@Key` on a parameter or record component marks what the cache or idempotency interceptor keys on:

```java
@WithQuoteCache
Promise<Quote> quote(@Key QuoteRequest request);
```

Cache changes behavior rather than only observing it (it can skip the call), so it wraps reads.

## Config

Settings live in the section the annotation names (`config = "retry.payment"` reads `[retry.payment]`), in `resources.toml` or `aether.toml` like any other section. The book marks interceptor config keys as checked at rc5 and to be re-verified before GA, so look them up in the resource reference rather than copying keys from memory.

A declared retry is a repeat source: the retried method must be idempotent (see [inter-slice.md](../patterns/inter-slice.md)).
