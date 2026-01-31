package org.pragmatica.training.rtb;

import org.pragmatica.lang.Result;

import java.util.regex.Pattern;

import static org.pragmatica.lang.Verify.ensure;

/// A validated ad slot identifier in the RTB domain.
///
/// Invariants:
/// - Value is non-null and non-blank
/// - Value contains only alphanumeric characters and hyphens
/// - Value length is between 1 and 32 characters
///
/// @param value the slot ID string, guaranteed valid
public record SlotId(String value) {

    /// Maximum length for slot ID
    public static final int MAX_LENGTH = 32;

    /// Pattern for valid slot ID characters (alphanumeric and hyphen)
    private static final Pattern VALID_PATTERN = Pattern.compile("^[a-zA-Z0-9-]+$");

    /// Create a SlotId from a raw string, validating all invariants.
    ///
    /// @param value the raw string value
    /// @return Result containing valid SlotId or specific error
    public static Result<SlotId> slotId(String value) {
        return ensure(value, s -> s != null && !s.isBlank(), PlacementError.EMPTY_SLOT_ID)
            .map(String::strip)
            .flatMap(s -> ensure(s, v -> v.length() <= MAX_LENGTH,
                v -> new PlacementError.InvalidSlotId(v, "exceeds max length " + MAX_LENGTH)))
            .flatMap(s -> ensure(s, v -> VALID_PATTERN.matcher(v).matches(),
                v -> new PlacementError.InvalidSlotId(v, "contains invalid characters")))
            .map(SlotId::new);
    }

    @Override
    public String toString() {
        return value;
    }
}
