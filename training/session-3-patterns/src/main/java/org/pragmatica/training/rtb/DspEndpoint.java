package org.pragmatica.training.rtb;

import org.pragmatica.lang.Result;

import java.net.URI;

import static org.pragmatica.lang.Verify.ensure;

/// A Demand-Side Platform endpoint for RTB queries.
///
/// @param id unique identifier for this DSP
/// @param url the endpoint URL for bid requests
/// @param timeoutMs maximum time to wait for response
public record DspEndpoint(String id, URI url, long timeoutMs) {

    /// Default timeout for DSP queries (50ms)
    public static final long DEFAULT_TIMEOUT_MS = 50;

    /// Create a DSP endpoint with default timeout.
    public static Result<DspEndpoint> dspEndpoint(String id, String url) {
        return dspEndpoint(id, url, DEFAULT_TIMEOUT_MS);
    }

    /// Create a DSP endpoint with custom timeout.
    public static Result<DspEndpoint> dspEndpoint(String id, String url, long timeoutMs) {
        return ensure(id, s -> s != null && !s.isBlank(), AuctionError.INVALID_DSP_ID)
            .flatMap(_ -> parseUri(url))
            .flatMap(uri -> ensure(timeoutMs, t -> t > 0,
                _ -> new AuctionError.InvalidTimeout(timeoutMs))
                .map(_ -> new DspEndpoint(id, uri, timeoutMs)));
    }

    private static Result<URI> parseUri(String url) {
        return Result.lift(() -> URI.create(url))
            .mapError(_ -> new AuctionError.InvalidDspUrl(url));
    }

    @Override
    public String toString() {
        return id + "@" + url;
    }
}
