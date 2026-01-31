package org.pragmatica.training.rtb;

import java.math.BigDecimal;
import java.time.Instant;

/// Simplified bid request for Session 3 pattern exercises.
///
/// @param requestId unique identifier for this auction
/// @param userId the user to target
/// @param floorPrice minimum acceptable bid
/// @param deadline when the auction must complete
/// @param isPremium whether this is a premium placement
public record SimpleBidRequest(
    String requestId,
    String userId,
    BigDecimal floorPrice,
    Instant deadline,
    boolean isPremium
) {
    /// Premium placement multiplier (1.5x)
    public static final BigDecimal PREMIUM_MULTIPLIER = new BigDecimal("1.5");

    /// Create a simple bid request for testing.
    public static SimpleBidRequest simpleBidRequest(
        String requestId,
        String userId,
        BigDecimal floorPrice,
        Instant deadline,
        boolean isPremium
    ) {
        return new SimpleBidRequest(requestId, userId, floorPrice, deadline, isPremium);
    }

    /// Create a request with reasonable defaults.
    public static SimpleBidRequest withDefaults(String requestId, String userId) {
        return new SimpleBidRequest(
            requestId,
            userId,
            new BigDecimal("1.00"),
            Instant.now().plusMillis(100),
            false
        );
    }
}
