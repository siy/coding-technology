package org.pragmatica.training.rtb;

import org.pragmatica.lang.Result;

/// Exercise: Implement bid amount parsing.
///
/// Requirements:
/// 1. Return Result<BidAmount> (not BidAmount, not Optional, not throwing)
/// 2. Reject null input → BidError.EMPTY_INPUT
/// 3. Reject blank input → BidError.EMPTY_INPUT
/// 4. Reject non-numeric input → BidError.InvalidFormat
/// 5. Reject negative values → BidError.NegativeAmount
/// 6. Reject values > 10000 → BidError.ExceedsMaximum
///
/// Hints:
/// - Use Verify.ensure() for validation
/// - Use Result.lift() to catch exceptions from BigDecimal parsing
/// - Use flatMap() to chain validations
/// - Use mapFailure() to transform exception-based errors to domain errors
public final class BidAmountExercise {

    private BidAmountExercise() {}

    /// Parse a bid amount from string input.
    ///
    /// @param input the string to parse (may be null, blank, invalid, etc.)
    /// @return Result containing valid BidAmount or specific error
    public static Result<BidAmount> parseBidAmount(String input) {
        // TODO: Implement this method
        //
        // Step 1: Check input is not null and not blank
        //         → return failure(BidError.EMPTY_INPUT) if invalid
        //
        // Step 2: Parse to BigDecimal
        //         → return failure(new BidError.InvalidFormat(input)) if not a number
        //
        // Step 3: Validate business rules via BidAmount.bidAmount()
        //         → handles negative and maximum checks
        //
        // Example structure:
        // return Verify.ensure(input, ..., BidError.EMPTY_INPUT)
        //     .flatMap(s -> Result.lift(...).mapFailure(...))
        //     .flatMap(BidAmount::bidAmount);

        throw new UnsupportedOperationException("Implement this method");
    }
}
