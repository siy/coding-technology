package org.pragmatica.training.rtb;

import java.math.BigDecimal;

/// Response from a DSP containing their bid.
///
/// @param dspId the DSP that submitted this response
/// @param amount the bid amount
/// @param adMarkup the ad creative to display if this bid wins
public record BidResponse(String dspId, BigDecimal amount, String adMarkup) {

    /// Create a bid response.
    public static BidResponse bidResponse(String dspId, BigDecimal amount, String adMarkup) {
        return new BidResponse(dspId, amount, adMarkup);
    }

    /// Convert to a Bid (after validation).
    public Bid toBid() {
        return Bid.bid(dspId, amount, adMarkup);
    }

    @Override
    public String toString() {
        return "BidResponse[%s: $%s]".formatted(dspId, amount.toPlainString());
    }
}
