package org.pragmatica.training.rtb.legacy;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/// Simulates a legacy cache that returns null for missing entries.
/// This is the kind of code you'll find in existing codebases.
public final class LegacyBidCache {

    private final Map<String, CachedBid> cache = new ConcurrentHashMap<>();

    /// Get a cached bid by ID.
    /// @return the cached bid, or null if not found
    public CachedBid getBid(String id) {
        return cache.get(id);
    }

    /// Store a bid in the cache.
    public void putBid(String id, CachedBid bid) {
        cache.put(id, bid);
    }

    /// Remove a bid from the cache.
    /// @return the removed bid, or null if not present
    public CachedBid removeBid(String id) {
        return cache.remove(id);
    }

    /// Check if a bid exists.
    public boolean hasBid(String id) {
        return cache.containsKey(id);
    }

    /// Clear all cached bids.
    public void clear() {
        cache.clear();
    }

    /// Legacy cached bid representation.
    public record CachedBid(
        String dspId,
        BigDecimal amount,
        String markup,
        long cachedAt
    ) {
        public static CachedBid create(String dspId, BigDecimal amount, String markup) {
            return new CachedBid(dspId, amount, markup, System.currentTimeMillis());
        }
    }
}
