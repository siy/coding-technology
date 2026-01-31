package org.pragmatica.training.rtb.adapters;

import org.pragmatica.lang.Option;
import org.pragmatica.lang.Result;
import org.pragmatica.training.rtb.AdoptionError;
import org.pragmatica.training.rtb.Bid;
import org.pragmatica.training.rtb.legacy.LegacyBidCache;
import org.pragmatica.training.rtb.legacy.LegacyBidCache.CachedBid;

/// Adapter that wraps the legacy BidCache with Option/Result-based API.
/// Demonstrates Option.option() for wrapping null-returning methods.
public final class BidCacheAdapter {

    private final LegacyBidCache legacyCache;

    public BidCacheAdapter(LegacyBidCache legacyCache) {
        this.legacyCache = legacyCache;
    }

    /// Find a bid by ID, returning Option instead of nullable.
    ///
    /// Uses Option.option() to convert null to Option.empty().
    public Option<Bid> findBid(String id) {
        return Option.option(legacyCache.getBid(id))
            .map(cached -> Bid.bid(cached.dspId(), cached.amount(), cached.markup()));
    }

    /// Get a bid by ID, returning Result with specific error for not found.
    ///
    /// Uses Option.toResult() to convert empty to specific error.
    public Result<Bid> getBid(String id) {
        return findBid(id)
            .toResult(new AdoptionError.NotFound(id));
    }

    /// Store a bid in the cache.
    public void putBid(String id, Bid bid) {
        legacyCache.putBid(id, CachedBid.create(bid.dspId(), bid.amount(), bid.markup()));
    }

    /// Remove a bid from the cache.
    public Option<Bid> removeBid(String id) {
        return Option.option(legacyCache.removeBid(id))
            .map(cached -> Bid.bid(cached.dspId(), cached.amount(), cached.markup()));
    }
}
