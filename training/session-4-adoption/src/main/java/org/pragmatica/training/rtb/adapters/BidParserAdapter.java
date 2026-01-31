package org.pragmatica.training.rtb.adapters;

import org.pragmatica.lang.Result;
import org.pragmatica.training.rtb.AdoptionError;
import org.pragmatica.training.rtb.Bid;
import org.pragmatica.training.rtb.legacy.LegacyBidParser;

/// Adapter that wraps the legacy BidParser with Result-based API.
/// Demonstrates Result.lift() for wrapping throwing code.
public final class BidParserAdapter {

    private final LegacyBidParser legacyParser = new LegacyBidParser();

    /// Parse a bid from JSON, returning Result instead of throwing.
    ///
    /// Uses Result.lift() to wrap the legacy throwing method.
    public Result<Bid> parse(String json) {
        return Result.lift(() -> legacyParser.parse(json))
            .map(legacy -> Bid.bid(legacy.dspId(), legacy.amount(), legacy.markup()))
            .mapError(cause -> new AdoptionError.ParseError(cause.message()));
    }
}
