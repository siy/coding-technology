package org.pragmatica.training.rtb.solutions;

import org.pragmatica.lang.Result;
import org.pragmatica.training.rtb.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

import static org.pragmatica.lang.Result.failure;
import static org.pragmatica.lang.Result.success;
import static org.pragmatica.lang.Verify.ensure;

/// Solutions to the Auction exercises.
public final class AuctionSolution {

    private AuctionSolution() {}

    // ========== Exercise 1: Leaf Methods ==========

    public static Result<Instant> checkDeadlineExercise(Instant deadline) {
        return ensure(deadline, d -> d.isAfter(Instant.now()),
            AuctionError.DEADLINE_PASSED);
    }

    public static Result<BigDecimal> applyFloorExercise(BigDecimal bid, BigDecimal floor) {
        return ensure(bid, b -> b.compareTo(floor) >= 0,
            b -> new AuctionError.BelowFloor(b.toPlainString(), floor.toPlainString()));
    }

    // ========== Exercise 2: Sequencer Pattern ==========

    public static Result<Bid> evaluateBidExercise(BidResponse response, SimpleBidRequest request) {
        return checkDeadlineExercise(request.deadline())
            .flatMap(_ -> applyFloorExercise(response.amount(), request.floorPrice()))
            .map(amount -> applyPremiumMultiplier(amount, request))
            .map(finalAmount -> Bid.bid(response.dspId(), finalAmount, response.adMarkup()));
    }

    private static BigDecimal applyPremiumMultiplier(BigDecimal amount, SimpleBidRequest request) {
        return request.isPremium()
            ? amount.multiply(SimpleBidRequest.PREMIUM_MULTIPLIER)
            : amount;
    }

    // ========== Exercise 3: Iteration Pattern ==========

    public static Result<List<Bid>> evaluateAllBidsExercise(
        List<BidResponse> responses,
        SimpleBidRequest request
    ) {
        List<Bid> validBids = responses.stream()
            .map(response -> evaluateBidExercise(response, request))
            .filter(Result::isSuccess)
            .map(Result::unwrap)
            .toList();

        return validBids.isEmpty()
            ? failure(AuctionError.NO_BIDS)
            : success(validBids);
    }

    // ========== Exercise 4: Selection ==========

    public static Result<Bid> selectWinnerExercise(List<Bid> bids) {
        return bids.stream()
            .max(Comparator.comparing(Bid::amount))
            .map(Result::success)
            .orElse(failure(AuctionError.NO_BIDS));
    }
}
