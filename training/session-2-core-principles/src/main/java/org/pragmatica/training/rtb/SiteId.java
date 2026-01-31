package org.pragmatica.training.rtb;

import org.pragmatica.lang.Result;

import java.util.regex.Pattern;

import static org.pragmatica.lang.Verify.ensure;

/// A validated site identifier in the RTB domain.
///
/// Invariants:
/// - Value is non-null and non-blank
/// - Value contains only lowercase alphanumeric characters and hyphens
/// - Value length is between 1 and 64 characters
/// - Value starts with a letter
///
/// @param value the site ID string, guaranteed valid
public record SiteId(String value) {

    /// Maximum length for site ID
    public static final int MAX_LENGTH = 64;

    /// Pattern for valid site ID (lowercase alphanumeric, hyphens, starts with letter)
    private static final Pattern VALID_PATTERN = Pattern.compile("^[a-z][a-z0-9-]*$");

    /// Error for empty input
    private static final PlacementError EMPTY = new PlacementError.InvalidSiteId("");

    /// Create a SiteId from a raw string, validating all invariants.
    ///
    /// @param value the raw string value
    /// @return Result containing valid SiteId or specific error
    public static Result<SiteId> siteId(String value) {
        return ensure(value, s -> s != null && !s.isBlank(), EMPTY)
            .map(s -> s.strip().toLowerCase())
            .flatMap(s -> ensure(s, v -> v.length() <= MAX_LENGTH,
                v -> new PlacementError.InvalidSiteId(v)))
            .flatMap(s -> ensure(s, v -> VALID_PATTERN.matcher(v).matches(),
                v -> new PlacementError.InvalidSiteId(v)))
            .map(SiteId::new);
    }

    @Override
    public String toString() {
        return value;
    }
}
