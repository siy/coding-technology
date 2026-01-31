package org.pragmatica.training.rtb;

import org.pragmatica.lang.Result;

/// An ad placement describing where an ad will appear.
///
/// Combines validated site, slot, dimensions, and position into a single
/// guaranteed-valid object. If you have an AdPlacement, all components are valid.
///
/// @param siteId the site where the ad appears
/// @param slotId the specific slot on the page
/// @param dimensions the size of the ad slot
/// @param position the position on the page
public record AdPlacement(
    SiteId siteId,
    SlotId slotId,
    Dimensions dimensions,
    AdPosition position
) {

    /// Create an AdPlacement from raw inputs, validating all components.
    ///
    /// @param siteId raw site ID string
    /// @param slotId raw slot ID string
    /// @param width ad width in pixels
    /// @param height ad height in pixels
    /// @param position position string (e.g., "above_fold")
    /// @return Result containing valid AdPlacement or first validation error
    public static Result<AdPlacement> adPlacement(
        String siteId,
        String slotId,
        int width,
        int height,
        String position
    ) {
        return Result.all(
            SiteId.siteId(siteId),
            SlotId.slotId(slotId),
            Dimensions.dimensions(width, height),
            AdPosition.parse(position)
        ).map(AdPlacement::new);
    }

    /// Create an AdPlacement from already-validated components.
    /// Use when you already have validated value objects.
    public static AdPlacement of(SiteId siteId, SlotId slotId, Dimensions dimensions, AdPosition position) {
        return new AdPlacement(siteId, slotId, dimensions, position);
    }

    /// Check if this placement is premium (above fold with standard size).
    public boolean isPremium() {
        return position.isPremium() && dimensions.isStandardSize();
    }

    /// Get a display string for logging/debugging.
    @Override
    public String toString() {
        return "%s/%s@%s[%s]".formatted(siteId, slotId, position, dimensions);
    }
}
