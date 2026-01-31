package org.pragmatica.training.rtb;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.pragmatica.lang.Cause;
import org.pragmatica.lang.Option;
import org.pragmatica.lang.Result;
import org.pragmatica.training.rtb.legacy.LegacyAuctionService;
import org.pragmatica.training.rtb.legacy.LegacyAuctionService.AuctionRequest;
import org.pragmatica.training.rtb.legacy.LegacyBidCache;
import org.pragmatica.training.rtb.legacy.LegacyBidCache.CachedBid;
import org.pragmatica.training.rtb.legacy.LegacyBidParser;
import org.pragmatica.training.rtb.solutions.AdoptionSolution;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Adoption Solution Tests")
class AdoptionSolutionTest {

    private Cause extractCause(Result<?> result) {
        return result.fold(cause -> cause, _ -> fail("Expected failure"));
    }

    @Nested
    @DisplayName("Exercise 1: Wrap Throwing Method")
    class WrapThrowingMethod {

        private final LegacyBidParser parser = new LegacyBidParser();

        @Test
        @DisplayName("parses valid JSON to Bid")
        void parsesValidJson() {
            String json = "{\"dspId\":\"dsp-1\",\"amount\":10.00,\"markup\":\"<ad/>\"}";

            Result<Bid> result = AdoptionSolution.parseWithResult(parser, json);

            assertTrue(result.isSuccess());
            assertEquals("dsp-1", result.unwrap().dspId());
        }

        @Test
        @DisplayName("returns ParseError for invalid JSON")
        void returnsParseErrorForInvalidJson() {
            String json = "invalid";

            Result<Bid> result = AdoptionSolution.parseWithResult(parser, json);

            assertTrue(result.isFailure());
            assertInstanceOf(AdoptionError.ParseError.class, extractCause(result));
        }

        @Test
        @DisplayName("returns ParseError for null input")
        void returnsParseErrorForNull() {
            Result<Bid> result = AdoptionSolution.parseWithResult(parser, null);

            assertTrue(result.isFailure());
            assertInstanceOf(AdoptionError.ParseError.class, extractCause(result));
        }
    }

    @Nested
    @DisplayName("Exercise 2: Wrap Nullable Method")
    class WrapNullableMethod {

        private LegacyBidCache cache;

        @BeforeEach
        void setUp() {
            cache = new LegacyBidCache();
        }

        @Test
        @DisplayName("returns Option with bid when found")
        void returnsSomeWhenFound() {
            cache.putBid("bid-1", CachedBid.create("dsp-1", new BigDecimal("10.00"), "<ad/>"));

            Option<Bid> result = AdoptionSolution.findInCache(cache, "bid-1");

            assertTrue(result.isPresent());
            assertEquals("dsp-1", result.unwrap().dspId());
        }

        @Test
        @DisplayName("returns empty Option when not found")
        void returnsEmptyWhenNotFound() {
            Option<Bid> result = AdoptionSolution.findInCache(cache, "nonexistent");

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("Exercise 3: Option to Result")
    class OptionToResult {

        private LegacyBidCache cache;

        @BeforeEach
        void setUp() {
            cache = new LegacyBidCache();
        }

        @Test
        @DisplayName("returns success when found")
        void returnsSuccessWhenFound() {
            cache.putBid("bid-1", CachedBid.create("dsp-1", new BigDecimal("10.00"), "<ad/>"));

            Result<Bid> result = AdoptionSolution.getFromCache(cache, "bid-1");

            assertTrue(result.isSuccess());
            assertEquals("dsp-1", result.unwrap().dspId());
        }

        @Test
        @DisplayName("returns NotFound error when not found")
        void returnsNotFoundWhenNotFound() {
            Result<Bid> result = AdoptionSolution.getFromCache(cache, "nonexistent");

            assertTrue(result.isFailure());
            Cause cause = extractCause(result);
            assertInstanceOf(AdoptionError.NotFound.class, cause);
            assertEquals("nonexistent", ((AdoptionError.NotFound) cause).id());
        }
    }

    @Nested
    @DisplayName("Exercise 4: Wrap Legacy Service")
    class WrapLegacyService {

        private final LegacyAuctionService service = new LegacyAuctionService();

        @Test
        @DisplayName("returns winning bid on success")
        void returnsWinningBid() {
            String bidJson = "{\"dspId\":\"dsp-1\",\"amount\":10.00,\"markup\":\"<ad/>\"}";
            AuctionRequest request = new AuctionRequest(
                "req-1",
                new BigDecimal("5.00"),
                Instant.now().plusSeconds(60),
                List.of(bidJson)
            );

            Result<Bid> result = AdoptionSolution.processAuction(service, request);

            assertTrue(result.isSuccess());
            assertEquals("dsp-1", result.unwrap().dspId());
        }

        @Test
        @DisplayName("returns DeadlinePassed when deadline passed")
        void returnsDeadlinePassed() {
            String bidJson = "{\"dspId\":\"dsp-1\",\"amount\":10.00,\"markup\":\"<ad/>\"}";
            AuctionRequest request = new AuctionRequest(
                "req-1",
                new BigDecimal("5.00"),
                Instant.now().minusSeconds(60),
                List.of(bidJson)
            );

            Result<Bid> result = AdoptionSolution.processAuction(service, request);

            assertTrue(result.isFailure());
            assertInstanceOf(AdoptionError.DeadlinePassed.class, extractCause(result));
        }

        @Test
        @DisplayName("returns NoBids when no bids provided")
        void returnsNoBids() {
            AuctionRequest request = new AuctionRequest(
                "req-1",
                new BigDecimal("5.00"),
                Instant.now().plusSeconds(60),
                List.of()
            );

            Result<Bid> result = AdoptionSolution.processAuction(service, request);

            assertTrue(result.isFailure());
            assertInstanceOf(AdoptionError.NoBids.class, extractCause(result));
        }
    }

    @Nested
    @DisplayName("Exercise 5: Expose to Legacy Callers")
    class ExposeToLegacyCallers {

        @Test
        @DisplayName("returns bid on success")
        void returnsBidOnSuccess() throws Exception {
            Bid bid = Bid.bid("dsp-1", new BigDecimal("10.00"), "<ad/>");
            Result<Bid> result = Result.success(bid);

            Bid returned = AdoptionSolution.toThrowingApi(result);

            assertEquals("dsp-1", returned.dspId());
        }

        @Test
        @DisplayName("throws exception on failure")
        void throwsOnFailure() {
            Result<Bid> result = Result.failure(new AdoptionError.NotFound("bid-1"));

            assertThrows(AdoptionExercise.BidException.class,
                () -> AdoptionSolution.toThrowingApi(result));
        }
    }
}
