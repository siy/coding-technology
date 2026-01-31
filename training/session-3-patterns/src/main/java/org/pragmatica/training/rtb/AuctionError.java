package org.pragmatica.training.rtb;

import org.pragmatica.lang.Cause;

/// Errors that can occur during RTB auction processing.
public sealed interface AuctionError extends Cause {

    /// Auction deadline has passed
    record DeadlinePassed() implements AuctionError {
        @Override
        public String message() {
            return "Auction deadline has passed";
        }
    }

    /// User does not match targeting criteria
    record TargetingMismatch(String reason) implements AuctionError {
        @Override
        public String message() {
            return "Targeting mismatch: " + reason;
        }
    }

    /// Bid amount is below floor price
    record BelowFloor(String bidAmount, String floorAmount) implements AuctionError {
        @Override
        public String message() {
            return "Bid %s is below floor %s".formatted(bidAmount, floorAmount);
        }
    }

    /// No valid bids received
    record NoBids() implements AuctionError {
        @Override
        public String message() {
            return "No valid bids received";
        }
    }

    /// DSP query failed
    record DspQueryFailed(String dspId, String reason) implements AuctionError {
        @Override
        public String message() {
            return "DSP %s query failed: %s".formatted(dspId, reason);
        }
    }

    /// DSP query timed out
    record DspTimeout(String dspId, long timeoutMs) implements AuctionError {
        @Override
        public String message() {
            return "DSP %s timed out after %dms".formatted(dspId, timeoutMs);
        }
    }

    /// Invalid DSP configuration
    record InvalidDspUrl(String url) implements AuctionError {
        @Override
        public String message() {
            return "Invalid DSP URL: " + url;
        }
    }

    /// Invalid DSP ID
    record InvalidDspId() implements AuctionError {
        @Override
        public String message() {
            return "DSP ID cannot be empty";
        }
    }

    /// Invalid timeout value
    record InvalidTimeout(long value) implements AuctionError {
        @Override
        public String message() {
            return "Invalid timeout: " + value;
        }
    }

    /// Failed to parse bid request
    record ParseError(String reason) implements AuctionError {
        @Override
        public String message() {
            return "Failed to parse bid request: " + reason;
        }
    }

    // Singleton instances
    AuctionError DEADLINE_PASSED = new DeadlinePassed();
    AuctionError NO_BIDS = new NoBids();
    AuctionError INVALID_DSP_ID = new InvalidDspId();
}
