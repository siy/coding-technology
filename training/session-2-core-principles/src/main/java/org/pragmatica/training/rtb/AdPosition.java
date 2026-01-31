package org.pragmatica.training.rtb;

import org.pragmatica.lang.Result;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.pragmatica.lang.Result.failure;
import static org.pragmatica.lang.Result.success;

/// Position of an ad slot on the page.
///
/// Positions affect viewability and pricing:
/// - ABOVE_FOLD: Visible without scrolling, highest value
/// - BELOW_FOLD: Requires scrolling, lower value
/// - SIDEBAR: Side of content, medium value
/// - FOOTER: Bottom of page, lowest value
public enum AdPosition {
    ABOVE_FOLD("above_fold"),
    BELOW_FOLD("below_fold"),
    SIDEBAR("sidebar"),
    FOOTER("footer");

    private final String code;

    /// Lookup map for parsing strings to enum values
    private static final Map<String, AdPosition> BY_CODE = Arrays.stream(values())
        .collect(Collectors.toMap(AdPosition::code, Function.identity()));

    AdPosition(String code) {
        this.code = code;
    }

    /// The wire format code for this position.
    public String code() {
        return code;
    }

    /// Parse an AdPosition from a string code.
    ///
    /// Accepts: "above_fold", "ABOVE_FOLD", "Above_Fold" (case-insensitive)
    ///
    /// @param code the string to parse
    /// @return Result containing AdPosition or UnknownPosition error
    public static Result<AdPosition> parse(String code) {
        if (code == null || code.isBlank()) {
            return failure(new PlacementError.UnknownPosition(""));
        }

        String normalized = code.strip().toLowerCase();
        AdPosition position = BY_CODE.get(normalized);

        return position != null
            ? success(position)
            : failure(new PlacementError.UnknownPosition(code));
    }

    /// Check if this position is considered premium (high viewability).
    public boolean isPremium() {
        return this == ABOVE_FOLD;
    }

    @Override
    public String toString() {
        return code;
    }
}
