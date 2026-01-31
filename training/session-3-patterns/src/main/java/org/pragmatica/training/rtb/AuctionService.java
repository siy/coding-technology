package org.pragmatica.training.rtb;

import org.pragmatica.lang.Promise;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.io.TimeSpan;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

import static org.pragmatica.lang.Result.failure;
import static org.pragmatica.lang.Result.success;

/// Orchestrates RTB auctions using patterns:
/// - Fork-Join for parallel DSP queries
/// - Iteration for bid evaluation
/// - Sequencer for overall flow
public final class AuctionService {

    private final DspClient dspClient;
    private final List<DspEndpoint> dsps;

    public AuctionService(DspClient dspClient, List<DspEndpoint> dsps) {
        this.dspClient = dspClient;
        this.dsps = dsps;
    }

    /// Process a complete auction.
    /// Combines: Fork-Join (query DSPs) → Iteration (evaluate) → select winner
    public Promise<Bid> processAuction(SimpleBidRequest request) {
        return queryAllDsps(request)                              // Fork-Join
            .map(responses -> evaluateAllBids(responses, request)) // Iteration
            .flatMap(Promise::resolved)                            // Lift Result to Promise
            .flatMap(bids -> Promise.resolved(selectWinner(bids))); // Select best
    }

    /// Fork-Join: Query all DSPs in parallel.
    /// Uses Promise.allOf - collect all results, filter successes.
    public Promise<List<BidResponse>> queryAllDsps(SimpleBidRequest request) {
        List<Promise<BidResponse>> queries = dsps.stream()
            .map(dsp -> queryDsp(dsp, request))
            .toList();

        return Promise.allOf(queries)
            .map(results -> results.stream()
                .filter(Result::isSuccess)
                .map(Result::unwrap)
                .toList());
    }

    /// Query a single DSP with timeout.
    Promise<BidResponse> queryDsp(DspEndpoint dsp, SimpleBidRequest request) {
        return dspClient.sendBidRequest(dsp, request)
            .timeout(TimeSpan.timeSpan(dsp.timeoutMs()).millis())
            .mapError(_ -> new AuctionError.DspTimeout(dsp.id(), dsp.timeoutMs()));
    }

    /// Iteration: Evaluate all responses, collect valid bids.
    /// Invalid bids are filtered out (floor, targeting, etc.)
    public Result<List<Bid>> evaluateAllBids(List<BidResponse> responses, SimpleBidRequest request) {
        List<Bid> validBids = responses.stream()
            .map(response -> BidEvaluator.evaluateBid(response, request))
            .filter(Result::isSuccess)
            .map(Result::unwrap)
            .toList();

        return validBids.isEmpty()
            ? failure(AuctionError.NO_BIDS)
            : success(validBids);
    }

    /// Select the winning bid (highest amount).
    public Result<Bid> selectWinner(List<Bid> bids) {
        return bids.stream()
            .max(Comparator.comparing(Bid::amount))
            .map(Result::success)
            .orElse(failure(AuctionError.NO_BIDS));
    }

    /// Interface for DSP communication (for testing).
    public interface DspClient {
        Promise<BidResponse> sendBidRequest(DspEndpoint dsp, SimpleBidRequest request);
    }

    /// Simple in-memory mock client for testing.
    public static DspClient mockClient(java.util.function.Function<DspEndpoint, BidResponse> responseGenerator) {
        return (dsp, request) -> Promise.promise(resolver -> {
            try {
                // Simulate network delay
                Thread.sleep(10);
                BidResponse response = responseGenerator.apply(dsp);
                resolver.resolve(success(response));
            } catch (Exception e) {
                resolver.resolve(failure(new AuctionError.DspQueryFailed(dsp.id(), e.getMessage())));
            }
        });
    }
}
