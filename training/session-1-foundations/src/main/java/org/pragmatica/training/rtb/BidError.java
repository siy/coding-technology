package org.pragmatica.training.rtb;

import org.pragmatica.lang.Cause;

/// Errors that can occur during bid processing.
/// Sealed interface ensures all error types are known at compile time.
public sealed interface BidError extends Cause {

    /// Input was null or blank
    record EmptyInput() implements BidError {
        @Override
        public String message() {
            return "Bid amount input is empty";
        }
    }

    /// Input could not be parsed as a number
    record InvalidFormat(String input) implements BidError {
        @Override
        public String message() {
            return "Cannot parse bid amount: '%s'".formatted(input);
        }
    }

    /// Bid amount is negative
    record NegativeAmount(String input) implements BidError {
        @Override
        public String message() {
            return "Bid amount cannot be negative: %s".formatted(input);
        }
    }

    /// Bid amount exceeds maximum allowed
    record ExceedsMaximum(String input, String maximum) implements BidError {
        @Override
        public String message() {
            return "Bid amount %s exceeds maximum %s".formatted(input, maximum);
        }
    }

    /// DSP did not respond in time
    record Timeout(long elapsedMs, long limitMs) implements BidError {
        @Override
        public String message() {
            return "DSP timeout after %dms (limit: %dms)".formatted(elapsedMs, limitMs);
        }
    }

    /// No bids received from any DSP
    record NoBids() implements BidError {
        @Override
        public String message() {
            return "No bids received from any DSP";
        }
    }

    // Singleton instances for stateless errors
    BidError EMPTY_INPUT = new EmptyInput();
    BidError NO_BIDS = new NoBids();
}
