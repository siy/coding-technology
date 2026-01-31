package org.pragmatica.training.rtb.solutions;

import org.pragmatica.lang.Option;
import org.pragmatica.lang.Result;
import org.pragmatica.training.rtb.AdoptionError;
import org.pragmatica.training.rtb.AdoptionExercise.BidException;
import org.pragmatica.training.rtb.Bid;
import org.pragmatica.training.rtb.legacy.LegacyAuctionService;
import org.pragmatica.training.rtb.legacy.LegacyAuctionService.AuctionRequest;
import org.pragmatica.training.rtb.legacy.LegacyBidCache;
import org.pragmatica.training.rtb.legacy.LegacyBidParser;

/// Solutions to the Adoption exercises.
public final class AdoptionSolution {

    private AdoptionSolution() {}

    // ========== Exercise 1: Wrap Throwing Method ==========

    public static Result<Bid> parseWithResult(LegacyBidParser parser, String json) {
        return Result.lift(() -> parser.parse(json))
            .map(legacy -> Bid.bid(legacy.dspId(), legacy.amount(), legacy.markup()))
            .mapError(cause -> new AdoptionError.ParseError(cause.message()));
    }

    // ========== Exercise 2: Wrap Nullable Method ==========

    public static Option<Bid> findInCache(LegacyBidCache cache, String id) {
        return Option.option(cache.getBid(id))
            .map(cached -> Bid.bid(cached.dspId(), cached.amount(), cached.markup()));
    }

    // ========== Exercise 3: Option to Result ==========

    public static Result<Bid> getFromCache(LegacyBidCache cache, String id) {
        return findInCache(cache, id)
            .toResult(new AdoptionError.NotFound(id));
    }

    // ========== Exercise 4: Wrap Legacy Service ==========

    public static Result<Bid> processAuction(LegacyAuctionService service, AuctionRequest request) {
        return Result.lift(() -> service.processAuction(request))
            .map(result -> Bid.bid(result.winnerId(), result.amount(), result.markup()))
            .mapError(cause -> mapAuctionError(cause.message()));
    }

    private static AdoptionError mapAuctionError(String message) {
        // Parse error from message - in real code you'd have better error handling
        if (message.contains("deadline")) {
            return AdoptionError.DEADLINE_PASSED;
        } else if (message.contains("No bids")) {
            return AdoptionError.NO_BIDS;
        } else if (message.contains("No valid")) {
            return new AdoptionError.NoValidBids(message);
        }
        return new AdoptionError.InvalidRequest(message);
    }

    // ========== Exercise 5: Expose to Legacy Callers ==========

    public static Bid toThrowingApi(Result<Bid> result) throws BidException {
        if (result.isSuccess()) {
            return result.unwrap();
        }
        // Extract cause using fold
        String message = result.fold(cause -> cause.message(), _ -> "");
        throw new BidException(message);
    }
}
