package org.pragmatica.training.rtb;

import org.pragmatica.lang.Result;

import static org.pragmatica.lang.Verify.ensure;

/// Ad slot dimensions (width × height) in pixels.
///
/// Invariants:
/// - Width is positive (> 0)
/// - Height is positive (> 0)
/// - Neither dimension exceeds MAX_SIZE
///
/// @param width the width in pixels, guaranteed positive
/// @param height the height in pixels, guaranteed positive
public record Dimensions(int width, int height) {

    /// Maximum allowed dimension (standard limit for ad sizes)
    public static final int MAX_SIZE = 4096;

    /// Common standard ad sizes
    public static final Dimensions LEADERBOARD = new Dimensions(728, 90);
    public static final Dimensions MEDIUM_RECTANGLE = new Dimensions(300, 250);
    public static final Dimensions WIDE_SKYSCRAPER = new Dimensions(160, 600);
    public static final Dimensions MOBILE_BANNER = new Dimensions(320, 50);

    /// Create Dimensions from raw values, validating all invariants.
    ///
    /// @param width the width in pixels
    /// @param height the height in pixels
    /// @return Result containing valid Dimensions or specific error
    public static Result<Dimensions> dimensions(int width, int height) {
        return validateDimension("width", width)
            .flatMap(w -> validateDimension("height", height)
                .map(h -> new Dimensions(w, h)));
    }

    private static Result<Integer> validateDimension(String name, int value) {
        return ensure(value, v -> v > 0,
                _ -> new PlacementError.InvalidDimension(name, value))
            .flatMap(v -> ensure(v, val -> val <= MAX_SIZE,
                _ -> new PlacementError.DimensionTooLarge(name, value, MAX_SIZE)));
    }

    /// Calculate the area in pixels.
    public int area() {
        return width * height;
    }

    /// Check if this is a standard IAB ad size.
    public boolean isStandardSize() {
        return equals(LEADERBOARD)
            || equals(MEDIUM_RECTANGLE)
            || equals(WIDE_SKYSCRAPER)
            || equals(MOBILE_BANNER);
    }

    @Override
    public String toString() {
        return width + "x" + height;
    }
}
