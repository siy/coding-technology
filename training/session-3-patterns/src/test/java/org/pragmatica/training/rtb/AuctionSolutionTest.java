package org.pragmatica.training.rtb;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.pragmatica.lang.Cause;
import org.pragmatica.lang.Result;
import org.pragmatica.training.rtb.solutions.AuctionSolution;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Auction Solution Tests")
class AuctionSolutionTest {

    private Cause extractCause(Result<?> result) {
        return result.fold(cause -> cause, _ -> fail("Expected failure"));
    }

    @Nested
    @DisplayName("Exercise 1: Leaf Methods")
    class LeafMethods {

        @Test
        @DisplayName("checkDeadline accepts future deadline")
        void acceptsFutureDeadline() {
            Instant future = Instant.now().plusSeconds(10);
            Result<Instant> result = AuctionSolution.checkDeadlineExercise(future);

            assertTrue(result.isSuccess());
            assertEquals(future, result.unwrap());
        }

        @Test
        @DisplayName("checkDeadline rejects past deadline")
        void rejectsPastDeadline() {
            Instant past = Instant.now().minusSeconds(10);
            Result<Instant> result = AuctionSolution.checkDeadlineExercise(past);

            assertTrue(result.isFailure());
            assertInstanceOf(AuctionError.DeadlinePassed.class, extractCause(result));
        }

        @Test
        @DisplayName("applyFloor accepts bid at floor")
        void acceptsBidAtFloor() {
            BigDecimal bid = new BigDecimal("5.00");
            BigDecimal floor = new BigDecimal("5.00");

            Result<BigDecimal> result = AuctionSolution.applyFloorExercise(bid, floor);

            assertTrue(result.isSuccess());
            assertEquals(bid, result.unwrap());
        }

        @Test
        @DisplayName("applyFloor accepts bid above floor")
        void acceptsBidAboveFloor() {
            BigDecimal bid = new BigDecimal("10.00");
            BigDecimal floor = new BigDecimal("5.00");

            Result<BigDecimal> result = AuctionSolution.applyFloorExercise(bid, floor);

            assertTrue(result.isSuccess());
            assertEquals(bid, result.unwrap());
        }

        @Test
        @DisplayName("applyFloor rejects bid below floor")
        void rejectsBidBelowFloor() {
            BigDecimal bid = new BigDecimal("3.00");
            BigDecimal floor = new BigDecimal("5.00");

            Result<BigDecimal> result = AuctionSolution.applyFloorExercise(bid, floor);

            assertTrue(result.isFailure());
            assertInstanceOf(AuctionError.BelowFloor.class, extractCause(result));
        }
    }

    @Nested
    @DisplayName("Exercise 2: Sequencer Pattern")
    class SequencerPattern {

        @Test
        @DisplayName("evaluateBid succeeds with valid inputs")
        void evaluatesValidBid() {
            BidResponse response = new BidResponse("dsp-1", new BigDecimal("10.00"), "<ad/>");
            SimpleBidRequest request = new SimpleBidRequest(
                "req-1", "user-1",
                new BigDecimal("5.00"),
                Instant.now().plusSeconds(10),
                false
            );

            Result<Bid> result = AuctionSolution.evaluateBidExercise(response, request);

            assertTrue(result.isSuccess());
            assertEquals("dsp-1", result.unwrap().dspId());
            assertEquals(new BigDecimal("10.00"), result.unwrap().amount());
        }

        @Test
        @DisplayName("evaluateBid applies premium multiplier")
        void appliesPremiumMultiplier() {
            BidResponse response = new BidResponse("dsp-1", new BigDecimal("10.00"), "<ad/>");
            SimpleBidRequest request = new SimpleBidRequest(
                "req-1", "user-1",
                new BigDecimal("5.00"),
                Instant.now().plusSeconds(10),
                true  // Premium
            );

            Result<Bid> result = AuctionSolution.evaluateBidExercise(response, request);

            assertTrue(result.isSuccess());
            // 10.00 * 1.5 = 15.00
            assertEquals(0, new BigDecimal("15.00").compareTo(result.unwrap().amount()));
        }

        @Test
        @DisplayName("evaluateBid fails on past deadline")
        void failsOnPastDeadline() {
            BidResponse response = new BidResponse("dsp-1", new BigDecimal("10.00"), "<ad/>");
            SimpleBidRequest request = new SimpleBidRequest(
                "req-1", "user-1",
                new BigDecimal("5.00"),
                Instant.now().minusSeconds(10),  // Past
                false
            );

            Result<Bid> result = AuctionSolution.evaluateBidExercise(response, request);

            assertTrue(result.isFailure());
            assertInstanceOf(AuctionError.DeadlinePassed.class, extractCause(result));
        }

        @Test
        @DisplayName("evaluateBid fails on bid below floor")
        void failsOnBidBelowFloor() {
            BidResponse response = new BidResponse("dsp-1", new BigDecimal("3.00"), "<ad/>");
            SimpleBidRequest request = new SimpleBidRequest(
                "req-1", "user-1",
                new BigDecimal("5.00"),
                Instant.now().plusSeconds(10),
                false
            );

            Result<Bid> result = AuctionSolution.evaluateBidExercise(response, request);

            assertTrue(result.isFailure());
            assertInstanceOf(AuctionError.BelowFloor.class, extractCause(result));
        }
    }

    @Nested
    @DisplayName("Exercise 3: Iteration Pattern")
    class IterationPattern {

        SimpleBidRequest validRequest = new SimpleBidRequest(
            "req-1", "user-1",
            new BigDecimal("5.00"),
            Instant.now().plusSeconds(10),
            false
        );

        @Test
        @DisplayName("evaluateAllBids returns valid bids")
        void returnsValidBids() {
            List<BidResponse> responses = List.of(
                new BidResponse("dsp-1", new BigDecimal("10.00"), "<ad1/>"),
                new BidResponse("dsp-2", new BigDecimal("15.00"), "<ad2/>")
            );

            Result<List<Bid>> result = AuctionSolution.evaluateAllBidsExercise(responses, validRequest);

            assertTrue(result.isSuccess());
            assertEquals(2, result.unwrap().size());
        }

        @Test
        @DisplayName("evaluateAllBids filters invalid bids")
        void filtersInvalidBids() {
            List<BidResponse> responses = List.of(
                new BidResponse("dsp-1", new BigDecimal("10.00"), "<ad1/>"),  // Valid
                new BidResponse("dsp-2", new BigDecimal("3.00"), "<ad2/>"),   // Below floor
                new BidResponse("dsp-3", new BigDecimal("20.00"), "<ad3/>")   // Valid
            );

            Result<List<Bid>> result = AuctionSolution.evaluateAllBidsExercise(responses, validRequest);

            assertTrue(result.isSuccess());
            assertEquals(2, result.unwrap().size());  // Only 2 valid bids
        }

        @Test
        @DisplayName("evaluateAllBids fails with no valid bids")
        void failsWithNoValidBids() {
            List<BidResponse> responses = List.of(
                new BidResponse("dsp-1", new BigDecimal("1.00"), "<ad1/>"),  // Below floor
                new BidResponse("dsp-2", new BigDecimal("2.00"), "<ad2/>")   // Below floor
            );

            Result<List<Bid>> result = AuctionSolution.evaluateAllBidsExercise(responses, validRequest);

            assertTrue(result.isFailure());
            assertInstanceOf(AuctionError.NoBids.class, extractCause(result));
        }

        @Test
        @DisplayName("evaluateAllBids fails with empty list")
        void failsWithEmptyList() {
            Result<List<Bid>> result = AuctionSolution.evaluateAllBidsExercise(List.of(), validRequest);

            assertTrue(result.isFailure());
            assertInstanceOf(AuctionError.NoBids.class, extractCause(result));
        }
    }

    @Nested
    @DisplayName("Exercise 4: Selection")
    class Selection {

        @Test
        @DisplayName("selectWinner returns highest bid")
        void returnsHighestBid() {
            List<Bid> bids = List.of(
                Bid.bid("dsp-1", new BigDecimal("10.00"), "<ad1/>"),
                Bid.bid("dsp-2", new BigDecimal("25.00"), "<ad2/>"),
                Bid.bid("dsp-3", new BigDecimal("15.00"), "<ad3/>")
            );

            Result<Bid> result = AuctionSolution.selectWinnerExercise(bids);

            assertTrue(result.isSuccess());
            assertEquals("dsp-2", result.unwrap().dspId());
            assertEquals(new BigDecimal("25.00"), result.unwrap().amount());
        }

        @Test
        @DisplayName("selectWinner fails with empty list")
        void failsWithEmptyList() {
            Result<Bid> result = AuctionSolution.selectWinnerExercise(List.of());

            assertTrue(result.isFailure());
            assertInstanceOf(AuctionError.NoBids.class, extractCause(result));
        }

        @Test
        @DisplayName("selectWinner handles single bid")
        void handlesSingleBid() {
            List<Bid> bids = List.of(
                Bid.bid("dsp-1", new BigDecimal("10.00"), "<ad/>")
            );

            Result<Bid> result = AuctionSolution.selectWinnerExercise(bids);

            assertTrue(result.isSuccess());
            assertEquals("dsp-1", result.unwrap().dspId());
        }
    }
}
