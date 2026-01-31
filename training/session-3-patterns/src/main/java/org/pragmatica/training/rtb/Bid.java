package org.pragmatica.training.rtb;

import java.math.BigDecimal;

/// A validated bid from a DSP.
///
/// @param dspId the DSP that submitted this bid
/// @param amount the bid amount
/// @param adMarkup the ad creative markup
public record Bid(String dspId, BigDecimal amount, String adMarkup) implements Comparable<Bid> {

    /// Create a bid from validated components.
    public static Bid bid(String dspId, BigDecimal amount, String adMarkup) {
        return new Bid(dspId, amount, adMarkup);
    }

    /// Check if this bid beats another.
    public boolean beats(Bid other) {
        return amount.compareTo(other.amount) > 0;
    }

    @Override
    public int compareTo(Bid other) {
        return amount.compareTo(other.amount);
    }

    @Override
    public String toString() {
        return "%s:$%s".formatted(dspId, amount.toPlainString());
    }
}
