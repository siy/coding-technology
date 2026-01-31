package org.pragmatica.training.rtb;

import org.pragmatica.lang.Cause;

/// Domain errors for the adoption session.
/// Demonstrates mapping legacy exceptions to sealed error types.
public sealed interface AdoptionError extends Cause {

    // Parser errors
    record ParseError(String detail) implements AdoptionError {
        @Override public String message() { return "Parse error: " + detail; }
    }

    // Cache errors
    record NotFound(String id) implements AdoptionError {
        @Override public String message() { return "Bid not found: " + id; }
    }

    // Auction errors
    record InvalidRequest(String reason) implements AdoptionError {
        @Override public String message() { return "Invalid request: " + reason; }
    }

    record DeadlinePassed() implements AdoptionError {
        public static final DeadlinePassed INSTANCE = new DeadlinePassed();
        @Override public String message() { return "Auction deadline has passed"; }
    }

    record NoBids() implements AdoptionError {
        public static final NoBids INSTANCE = new NoBids();
        @Override public String message() { return "No bids provided"; }
    }

    record NoValidBids(String reason) implements AdoptionError {
        @Override public String message() { return "No valid bids: " + reason; }
    }

    // Convenience constants
    AdoptionError DEADLINE_PASSED = DeadlinePassed.INSTANCE;
    AdoptionError NO_BIDS = NoBids.INSTANCE;
}
