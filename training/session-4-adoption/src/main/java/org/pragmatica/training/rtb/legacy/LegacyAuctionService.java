package org.pragmatica.training.rtb.legacy;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/// Simulates a legacy auction service with traditional exception-based API.
/// This represents code that callers might need to use from modern code.
public final class LegacyAuctionService {

    private final LegacyBidParser parser = new LegacyBidParser();

    /// Process an auction request.
    /// @throws AuctionException if auction fails
    public AuctionResult processAuction(AuctionRequest request) throws AuctionException {
        if (request == null) {
            throw new AuctionException("Request cannot be null", ErrorCode.INVALID_REQUEST);
        }

        if (request.deadline().isBefore(Instant.now())) {
            throw new AuctionException("Auction deadline has passed", ErrorCode.DEADLINE_PASSED);
        }

        if (request.bids() == null || request.bids().isEmpty()) {
            throw new AuctionException("No bids provided", ErrorCode.NO_BIDS);
        }

        // Find highest bid above floor
        LegacyBidParser.LegacyBid winner = null;
        for (String bidJson : request.bids()) {
            try {
                LegacyBidParser.LegacyBid bid = parser.parse(bidJson);
                if (bid.amount().compareTo(request.floorPrice()) >= 0) {
                    if (winner == null || bid.amount().compareTo(winner.amount()) > 0) {
                        winner = bid;
                    }
                }
            } catch (LegacyBidParser.BidParseException e) {
                // Skip invalid bids
            }
        }

        if (winner == null) {
            throw new AuctionException("No valid bids above floor", ErrorCode.NO_VALID_BIDS);
        }

        return new AuctionResult(winner.dspId(), winner.amount(), winner.markup());
    }

    /// Legacy auction request.
    public record AuctionRequest(
        String requestId,
        BigDecimal floorPrice,
        Instant deadline,
        List<String> bids
    ) {}

    /// Legacy auction result.
    public record AuctionResult(String winnerId, BigDecimal amount, String markup) {}

    /// Legacy error codes.
    public enum ErrorCode {
        INVALID_REQUEST,
        DEADLINE_PASSED,
        NO_BIDS,
        NO_VALID_BIDS,
        INTERNAL_ERROR
    }

    /// Legacy exception with error code.
    public static class AuctionException extends Exception {
        private final ErrorCode errorCode;

        public AuctionException(String message, ErrorCode errorCode) {
            super(message);
            this.errorCode = errorCode;
        }

        public ErrorCode getErrorCode() {
            return errorCode;
        }
    }
}
