package org.pragmatica.training.rtb;

import org.pragmatica.lang.Cause;

/// Errors that can occur during ad placement validation.
/// Sealed interface ensures all error types are known at compile time.
public sealed interface PlacementError extends Cause {

    /// Slot ID was null or blank
    record EmptySlotId() implements PlacementError {
        @Override
        public String message() {
            return "Slot ID cannot be empty";
        }
    }

    /// Slot ID contains invalid characters or exceeds max length
    record InvalidSlotId(String value, String reason) implements PlacementError {
        @Override
        public String message() {
            return "Invalid slot ID '%s': %s".formatted(value, reason);
        }
    }

    /// Dimension value is not positive
    record InvalidDimension(String dimension, int value) implements PlacementError {
        @Override
        public String message() {
            return "Invalid %s: %d (must be positive)".formatted(dimension, value);
        }
    }

    /// Dimension exceeds maximum allowed
    record DimensionTooLarge(String dimension, int value, int max) implements PlacementError {
        @Override
        public String message() {
            return "%s %d exceeds maximum %d".formatted(dimension, value, max);
        }
    }

    /// Ad position string could not be parsed
    record UnknownPosition(String value) implements PlacementError {
        @Override
        public String message() {
            return "Unknown ad position: '%s'".formatted(value);
        }
    }

    /// Site ID was invalid (delegates to BidError)
    record InvalidSiteId(String value) implements PlacementError {
        @Override
        public String message() {
            return "Invalid site ID: '%s'".formatted(value);
        }
    }

    // Singleton instances for stateless errors
    PlacementError EMPTY_SLOT_ID = new EmptySlotId();
}
