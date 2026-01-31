package org.pragmatica.training.rtb;

import org.pragmatica.lang.Result;

import java.math.BigDecimal;
import java.time.Instant;

import static org.pragmatica.lang.Result.success;
import static org.pragmatica.lang.Verify.ensure;

/// Evaluates bids using the Sequencer pattern.
///
/// The evaluation pipeline:
/// 1. Check deadline hasn't passed
/// 2. Verify targeting matches (simplified for demo)
/// 3. Apply floor price check
/// 4. Apply premium multiplier if applicable
public final class BidEvaluator {

    private BidEvaluator() {}

    /// Evaluate a bid response against a request.
    /// Uses Sequencer pattern: 4 steps chained with flatMap.
    ///
    /// @param response the DSP's bid response
    /// @param request the original bid request
    /// @return Result containing valid Bid or evaluation error
    public static Result<Bid> evaluateBid(BidResponse response, SimpleBidRequest request) {
        return checkDeadline(request.deadline())                    // Step 1
            .flatMap(_ -> checkTargeting(response, request))        // Step 2
            .flatMap(_ -> applyFloorPrice(response.amount(), request.floorPrice())) // Step 3
            .map(amount -> applyPremiumMultiplier(amount, request)) // Step 4
            .map(finalAmount -> Bid.bid(response.dspId(), finalAmount, response.adMarkup()));
    }

    // ========== Leaf Methods ==========

    /// Step 1: Verify auction deadline hasn't passed.
    static Result<Instant> checkDeadline(Instant deadline) {
        return ensure(deadline, d -> d.isAfter(Instant.now()),
            AuctionError.DEADLINE_PASSED);
    }

    /// Step 2: Verify targeting matches (simplified - always matches for demo).
    static Result<String> checkTargeting(BidResponse response, SimpleBidRequest request) {
        // In real implementation, this would check user targeting criteria
        // For demo purposes, we just verify the DSP ID matches a basic format
        return ensure(response.dspId(),
            id -> id != null && !id.isBlank(),
            _ -> new AuctionError.TargetingMismatch("invalid DSP"));
    }

    /// Step 3: Verify bid meets floor price.
    static Result<BigDecimal> applyFloorPrice(BigDecimal bidAmount, BigDecimal floorPrice) {
        return ensure(bidAmount,
            amount -> amount.compareTo(floorPrice) >= 0,
            amount -> new AuctionError.BelowFloor(
                amount.toPlainString(),
                floorPrice.toPlainString()));
    }

    /// Step 4: Apply premium placement multiplier.
    static BigDecimal applyPremiumMultiplier(BigDecimal amount, SimpleBidRequest request) {
        return request.isPremium()
            ? amount.multiply(SimpleBidRequest.PREMIUM_MULTIPLIER)
            : amount;
    }
}
