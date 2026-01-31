package org.pragmatica.training.rtb;

import org.pragmatica.lang.Result;

import java.math.BigDecimal;

import static org.pragmatica.lang.Verify.ensure;

/// A validated bid amount in the RTB domain.
///
/// Invariants:
/// - Value is non-null
/// - Value is non-negative
/// - Value does not exceed MAXIMUM
///
/// @param value the bid amount, guaranteed valid
public record BidAmount(BigDecimal value) implements Comparable<BidAmount> {

    /// Maximum allowed bid amount (e.g., $10,000 CPM)
    public static final BigDecimal MAXIMUM = new BigDecimal("10000");

    /// Minimum bid amount (zero)
    public static final BidAmount MINIMUM = new BidAmount(BigDecimal.ZERO);

    /// Create a BidAmount from a BigDecimal, validating invariants.
    ///
    /// @param value the raw decimal value
    /// @return Result containing valid BidAmount or error
    public static Result<BidAmount> bidAmount(BigDecimal value) {
        return ensure(value, v -> v != null, BidError.EMPTY_INPUT)
            .flatMap(v -> ensure(v, val -> val.compareTo(BigDecimal.ZERO) >= 0,
                val -> new BidError.NegativeAmount(val.toPlainString())))
            .flatMap(v -> ensure(v, val -> val.compareTo(MAXIMUM) <= 0,
                val -> new BidError.ExceedsMaximum(val.toPlainString(), MAXIMUM.toPlainString())))
            .map(BidAmount::new);
    }

    /// Parse a BidAmount from string input.
    ///
    /// @param input the string to parse
    /// @return Result containing valid BidAmount or error
    public static Result<BidAmount> parse(String input) {
        return ensure(input, s -> s != null && !s.isBlank(), BidError.EMPTY_INPUT)
            .flatMap(s -> Result.lift(() -> new BigDecimal(s.strip()))
                .mapError(_ -> new BidError.InvalidFormat(s)))
            .flatMap(BidAmount::bidAmount);
    }

    /// Add another bid amount to this one.
    public Result<BidAmount> add(BidAmount other) {
        return bidAmount(value.add(other.value));
    }

    /// Check if this bid beats another bid.
    public boolean beats(BidAmount other) {
        return compareTo(other) > 0;
    }

    @Override
    public int compareTo(BidAmount other) {
        return value.compareTo(other.value);
    }

    @Override
    public String toString() {
        return "$" + value.toPlainString();
    }
}
