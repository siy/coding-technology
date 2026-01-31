package org.pragmatica.training.rtb;

import org.pragmatica.lang.Option;
import org.pragmatica.lang.Promise;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.io.TimeSpan;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/// Demonstration of the four return types in JBCT.
///
/// Run this class to see live examples of:
/// - T (plain value)
/// - Option<T> (maybe absent)
/// - Result<T> (might fail with reason)
/// - Promise<T> (async, might fail)
public final class FourTypesDemo {

    public static void main(String[] args) {
        System.out.println("=== JBCT Four Return Types Demo ===\n");

        demonstratePlainValue();
        demonstrateOption();
        demonstrateResult();
        demonstratePromise();
    }

    // ========== Type 1: T (Plain Value) ==========

    /// Always succeeds, always has value.
    /// Like String.toUpperCase() - cannot fail.
    static String formatBidAmount(BidAmount amount) {
        return "Bid: " + amount.value().toPlainString() + " CPM";
    }

    static void demonstratePlainValue() {
        System.out.println("--- Type 1: T (Plain Value) ---");

        var amount = new BidAmount(new BigDecimal("5.50"));
        String formatted = formatBidAmount(amount);

        System.out.println("Input: " + amount);
        System.out.println("Output: " + formatted);
        System.out.println("Note: No failure possible, always returns String\n");
    }

    // ========== Type 2: Option<T> (Maybe Absent) ==========

    private static final Map<String, BidAmount> bidCache = new ConcurrentHashMap<>();

    static {
        bidCache.put("user-123", new BidAmount(new BigDecimal("2.50")));
    }

    /// Lookup might not find anything - that's fine, not an error.
    static Option<BidAmount> findCachedBid(String userId) {
        return Option.option(bidCache.get(userId));
    }

    static void demonstrateOption() {
        System.out.println("--- Type 2: Option<T> (Maybe Absent) ---");

        // Case 1: Found
        Option<BidAmount> found = findCachedBid("user-123");
        System.out.println("Lookup 'user-123': " +
            found.fold(() -> "not cached", BidAmount::toString));

        // Case 2: Not found (this is normal, not an error)
        Option<BidAmount> notFound = findCachedBid("user-999");
        System.out.println("Lookup 'user-999': " +
            notFound.fold(() -> "not cached", BidAmount::toString));

        // Using fold for default value
        BidAmount withDefault = notFound.fold(() -> BidAmount.MINIMUM, v -> v);
        System.out.println("With default: " + withDefault);
        System.out.println("Note: Empty Option is valid result, not failure\n");
    }

    // ========== Type 3: Result<T> (Might Fail) ==========

    static void demonstrateResult() {
        System.out.println("--- Type 3: Result<T> (Might Fail) ---");

        String[] inputs = {"100", "abc", "-5", "50000", null, "  42  "};

        for (String input : inputs) {
            Result<BidAmount> result = BidAmount.parse(input);

            String status = result.fold(
                failure -> "FAILED: " + failure.message(),
                success -> "SUCCESS: " + success
            );

            System.out.printf("Parse '%s' → %s%n", input, status);
        }

        // Chaining example
        System.out.println("\nChaining example:");
        Result<String> chained = BidAmount.parse("25.50")
            .map(amount -> "Winning bid: " + amount)
            .onSuccess(msg -> System.out.println("  Side effect: " + msg))
            .onFailure(err -> System.out.println("  Would log error: " + err.message()))
            .map(String::toUpperCase);

        String finalValue = chained.fold(_ -> "(failed)", v -> v);
        System.out.println("  Final: " + finalValue);
        System.out.println("Note: Caller knows WHY it failed, not just that it failed\n");
    }

    // ========== Type 4: Promise<T> (Async) ==========

    /// Simulates async DSP query with latency.
    static Promise<BidAmount> queryDsp(String dspName, long latencyMs) {
        return Promise.promise(resolver -> {
            // Simulate network latency
            try {
                Thread.sleep(latencyMs);
                // Simulate response
                var amount = new BigDecimal(Math.random() * 10).setScale(2, RoundingMode.HALF_UP);
                resolver.resolve(Result.success(new BidAmount(amount)));
            } catch (InterruptedException e) {
                resolver.resolve(Result.failure(new BidError.Timeout(latencyMs, 100)));
            }
        });
    }

    static void demonstratePromise() {
        System.out.println("--- Type 4: Promise<T> (Async) ---");

        // Single async call
        System.out.println("Single DSP query:");
        Promise<BidAmount> single = queryDsp("DSP-A", 50);

        single.onResult(result ->
            System.out.println("  DSP-A responded: " +
                result.fold(err -> "error: " + err.message(), BidAmount::toString))
        );

        // Wait for completion
        Result<BidAmount> result = single.await(TimeSpan.timeSpan(1).seconds());
        System.out.println("  Awaited result: " + result.fold(
            err -> "error: " + err.message(),
            BidAmount::toString));

        // Parallel queries (preview of Session 3)
        System.out.println("\nParallel DSP queries:");
        var dspA = queryDsp("DSP-A", 30);
        var dspB = queryDsp("DSP-B", 50);
        var dspC = queryDsp("DSP-C", 20);

        Promise.all(dspA, dspB, dspC)
            .map((a, b, c) -> "All bids: " + a + ", " + b + ", " + c)
            .onResult(res ->
                System.out.println("  " + res.fold(
                    err -> "Some DSP failed: " + err.message(),
                    msg -> msg
                ))
            )
            .await(TimeSpan.timeSpan(1).seconds());

        System.out.println("Note: Same semantics as Result, but async\n");
    }
}
