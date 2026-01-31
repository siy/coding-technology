package org.pragmatica.training.rtb;

import org.pragmatica.lang.Option;
import org.pragmatica.lang.Result;
import org.pragmatica.training.rtb.legacy.LegacyAuctionService;
import org.pragmatica.training.rtb.legacy.LegacyAuctionService.AuctionRequest;
import org.pragmatica.training.rtb.legacy.LegacyAuctionService.AuctionResult;
import org.pragmatica.training.rtb.legacy.LegacyBidCache;
import org.pragmatica.training.rtb.legacy.LegacyBidCache.CachedBid;
import org.pragmatica.training.rtb.legacy.LegacyBidParser;

/// Exercise: Wrap legacy code with modern Result/Option API.
///
/// This exercise demonstrates:
/// 1. Result.lift() for wrapping throwing methods
/// 2. Option.option() for wrapping nullable returns
/// 3. Converting between Result and legacy exceptions
public final class AdoptionExercise {

    private AdoptionExercise() {}

    // ========== Exercise 1: Wrap Throwing Method ==========

    /// Implement: Wrap the legacy parser with Result.
    ///
    /// @param parser the legacy parser to wrap
    /// @param json the JSON to parse
    /// @return Result containing Bid or ParseError
    ///
    /// Hint: Use Result.lift(() -> parser.parse(json))
    ///       Then map the LegacyBid to Bid
    ///       Then mapError to ParseError
    public static Result<Bid> parseWithResult(LegacyBidParser parser, String json) {
        // TODO: Implement
        throw new UnsupportedOperationException("Implement parseWithResult");
    }

    // ========== Exercise 2: Wrap Nullable Method ==========

    /// Implement: Wrap the legacy cache lookup with Option.
    ///
    /// @param cache the legacy cache
    /// @param id the bid ID to look up
    /// @return Option containing Bid if found
    ///
    /// Hint: Use Option.option(cache.getBid(id))
    ///       Then map CachedBid to Bid
    public static Option<Bid> findInCache(LegacyBidCache cache, String id) {
        // TODO: Implement
        throw new UnsupportedOperationException("Implement findInCache");
    }

    // ========== Exercise 3: Option to Result ==========

    /// Implement: Convert cache lookup to Result with specific error.
    ///
    /// @param cache the legacy cache
    /// @param id the bid ID to look up
    /// @return Result containing Bid or NotFound error
    ///
    /// Hint: Call findInCache, then use toResult(() -> new NotFound(id))
    public static Result<Bid> getFromCache(LegacyBidCache cache, String id) {
        // TODO: Implement
        throw new UnsupportedOperationException("Implement getFromCache");
    }

    // ========== Exercise 4: Wrap Legacy Service ==========

    /// Implement: Wrap the legacy auction service with Result.
    ///
    /// @param service the legacy service
    /// @param request the auction request
    /// @return Result containing Bid (from AuctionResult) or appropriate error
    ///
    /// Hint: Use Result.lift(() -> service.processAuction(request))
    ///       Map AuctionResult to Bid
    ///       mapError to convert AuctionException to AdoptionError
    public static Result<Bid> processAuction(LegacyAuctionService service, AuctionRequest request) {
        // TODO: Implement
        throw new UnsupportedOperationException("Implement processAuction");
    }

    // ========== Exercise 5: Expose to Legacy Callers ==========

    /// Implement: Create an adapter that exposes Result-based code to legacy callers.
    ///
    /// @param result the Result to convert
    /// @return the Bid if successful
    /// @throws BidException if the result is a failure
    ///
    /// Hint: Use result.orElseThrow(cause -> new BidException(...))
    public static Bid toThrowingApi(Result<Bid> result) throws BidException {
        // TODO: Implement
        throw new UnsupportedOperationException("Implement toThrowingApi");
    }

    /// Exception for legacy callers.
    public static class BidException extends Exception {
        public BidException(String message) {
            super(message);
        }
    }
}
