package org.pragmatica.training.rtb;

import org.pragmatica.lang.Result;

/// Exercise: Build value objects following Parse Don't Validate.
///
/// This exercise reinforces the core principles:
/// 1. Value objects are immutable (records)
/// 2. Factory methods return Result, not raw type
/// 3. Validation happens at construction
/// 4. Use Result.all() to combine independent validations
///
/// Your tasks:
/// 1. Implement slotIdExercise() - validate slot ID
/// 2. Implement dimensionsExercise() - validate width/height
/// 3. Implement adPositionExercise() - parse position enum
/// 4. Implement adPlacementExercise() - combine all validations
public final class AdPlacementExercise {

    private AdPlacementExercise() {}

    /// Exercise 1: Validate a slot ID.
    ///
    /// Requirements:
    /// - Not null or blank → PlacementError.EMPTY_SLOT_ID
    /// - Max 32 characters → InvalidSlotId with "exceeds max length 32"
    /// - Only alphanumeric and hyphens → InvalidSlotId with "contains invalid characters"
    ///
    /// Hint: Use Pattern.compile("^[a-zA-Z0-9-]+$") for validation
    public static Result<SlotId> slotIdExercise(String value) {
        // TODO: Implement this method
        throw new UnsupportedOperationException("Implement slotIdExercise");
    }

    /// Exercise 2: Validate dimensions.
    ///
    /// Requirements:
    /// - Width > 0 → InvalidDimension("width", value)
    /// - Height > 0 → InvalidDimension("height", value)
    /// - Width <= 4096 → DimensionTooLarge("width", value, 4096)
    /// - Height <= 4096 → DimensionTooLarge("height", value, 4096)
    ///
    /// Hint: Create a helper method validateDimension(String name, int value)
    public static Result<Dimensions> dimensionsExercise(int width, int height) {
        // TODO: Implement this method
        throw new UnsupportedOperationException("Implement dimensionsExercise");
    }

    /// Exercise 3: Parse an ad position from string.
    ///
    /// Requirements:
    /// - Case-insensitive matching
    /// - Valid values: "above_fold", "below_fold", "sidebar", "footer"
    /// - Invalid/null → UnknownPosition(value)
    ///
    /// Hint: Create a Map<String, AdPosition> for lookup
    public static Result<AdPosition> adPositionExercise(String value) {
        // TODO: Implement this method
        throw new UnsupportedOperationException("Implement adPositionExercise");
    }

    /// Exercise 4: Combine all validations into AdPlacement.
    ///
    /// Requirements:
    /// - Use Result.all() to validate all components
    /// - SiteId.siteId() for site validation (already implemented)
    /// - Your slotIdExercise() for slot validation
    /// - Your dimensionsExercise() for dimensions
    /// - Your adPositionExercise() for position
    ///
    /// Hint: Result.all(r1, r2, r3, r4).map(AdPlacement::new)
    public static Result<AdPlacement> adPlacementExercise(
        String siteId,
        String slotId,
        int width,
        int height,
        String position
    ) {
        // TODO: Implement this method
        throw new UnsupportedOperationException("Implement adPlacementExercise");
    }
}
