package org.pragmatica.training.rtb;

import java.math.BigDecimal;

/// A validated bid record.
public record Bid(String dspId, BigDecimal amount, String markup) {

    public static Bid bid(String dspId, BigDecimal amount, String markup) {
        return new Bid(dspId, amount, markup);
    }
}
