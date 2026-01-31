package org.pragmatica.training.rtb.solutions;

import org.pragmatica.lang.Result;
import org.pragmatica.training.rtb.BidAmount;
import org.pragmatica.training.rtb.BidError;

import java.math.BigDecimal;

import static org.pragmatica.lang.Verify.ensure;

/// Solution to the BidAmountExercise.
/// Compare with your implementation after completing the exercise.
public final class BidAmountSolution {

    private BidAmountSolution() {}

    /// Solution: Parse a bid amount from string input.
    ///
    /// This implementation demonstrates:
    /// 1. Using Verify.ensure() for null/blank validation
    /// 2. Using Result.lift() to safely parse BigDecimal
    /// 3. Using mapError() to convert exceptions to domain errors
    /// 4. Using flatMap() to chain to domain validation
    public static Result<BidAmount> parseBidAmount(String input) {
        return ensure(input, s -> s != null && !s.isBlank(), BidError.EMPTY_INPUT)
            .flatMap(s -> Result.lift(() -> new BigDecimal(s.strip()))
                .mapError(_ -> new BidError.InvalidFormat(s)))
            .flatMap(BidAmount::bidAmount);
    }

    /// Alternative solution using all() for multi-step validation.
    /// This style becomes more useful when you need access to intermediate values.
    public static Result<BidAmount> parseBidAmountAlt(String input) {
        return ensure(input, s -> s != null, BidError.EMPTY_INPUT)
            .flatMap(s -> ensure(s, str -> !str.isBlank(), BidError.EMPTY_INPUT))
            .map(String::strip)
            .flatMap(s -> Result.lift(() -> new BigDecimal(s))
                .mapError(_ -> new BidError.InvalidFormat(s)))
            .flatMap(BidAmount::bidAmount);
    }
}
