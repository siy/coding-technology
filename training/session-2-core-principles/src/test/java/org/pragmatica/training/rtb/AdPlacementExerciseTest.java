package org.pragmatica.training.rtb;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.pragmatica.lang.Cause;
import org.pragmatica.lang.Result;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("AdPlacement Exercise Tests")
class AdPlacementExerciseTest {

    private Cause extractCause(Result<?> result) {
        return result.fold(cause -> cause, _ -> fail("Expected failure but got success"));
    }

    @Nested
    @DisplayName("Exercise 1: SlotId validation")
    class SlotIdExercise {

        @Test
        @DisplayName("accepts valid slot ID")
        void acceptsValid() {
            Result<SlotId> result = AdPlacementExercise.slotIdExercise("header-banner-1");
            assertTrue(result.isSuccess());
            assertEquals("header-banner-1", result.unwrap().value());
        }

        @Test
        @DisplayName("accepts alphanumeric with hyphens")
        void acceptsAlphanumeric() {
            Result<SlotId> result = AdPlacementExercise.slotIdExercise("slot123-abc");
            assertTrue(result.isSuccess());
        }

        @Test
        @DisplayName("rejects null")
        void rejectsNull() {
            Result<SlotId> result = AdPlacementExercise.slotIdExercise(null);
            assertTrue(result.isFailure());
            assertInstanceOf(PlacementError.EmptySlotId.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects blank")
        void rejectsBlank() {
            Result<SlotId> result = AdPlacementExercise.slotIdExercise("   ");
            assertTrue(result.isFailure());
            assertInstanceOf(PlacementError.EmptySlotId.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects exceeding max length")
        void rejectsLong() {
            String longId = "a".repeat(33);
            Result<SlotId> result = AdPlacementExercise.slotIdExercise(longId);
            assertTrue(result.isFailure());
            assertInstanceOf(PlacementError.InvalidSlotId.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects invalid characters")
        void rejectsInvalidChars() {
            Result<SlotId> result = AdPlacementExercise.slotIdExercise("slot@123");
            assertTrue(result.isFailure());
            assertInstanceOf(PlacementError.InvalidSlotId.class, extractCause(result));
        }
    }

    @Nested
    @DisplayName("Exercise 2: Dimensions validation")
    class DimensionsExercise {

        @Test
        @DisplayName("accepts valid dimensions")
        void acceptsValid() {
            Result<Dimensions> result = AdPlacementExercise.dimensionsExercise(300, 250);
            assertTrue(result.isSuccess());
            assertEquals(300, result.unwrap().width());
            assertEquals(250, result.unwrap().height());
        }

        @Test
        @DisplayName("accepts maximum dimensions")
        void acceptsMax() {
            Result<Dimensions> result = AdPlacementExercise.dimensionsExercise(4096, 4096);
            assertTrue(result.isSuccess());
        }

        @Test
        @DisplayName("rejects zero width")
        void rejectsZeroWidth() {
            Result<Dimensions> result = AdPlacementExercise.dimensionsExercise(0, 250);
            assertTrue(result.isFailure());
            assertInstanceOf(PlacementError.InvalidDimension.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects negative height")
        void rejectsNegativeHeight() {
            Result<Dimensions> result = AdPlacementExercise.dimensionsExercise(300, -1);
            assertTrue(result.isFailure());
            assertInstanceOf(PlacementError.InvalidDimension.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects width exceeding max")
        void rejectsWidthTooLarge() {
            Result<Dimensions> result = AdPlacementExercise.dimensionsExercise(5000, 250);
            assertTrue(result.isFailure());
            assertInstanceOf(PlacementError.DimensionTooLarge.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects height exceeding max")
        void rejectsHeightTooLarge() {
            Result<Dimensions> result = AdPlacementExercise.dimensionsExercise(300, 9999);
            assertTrue(result.isFailure());
            assertInstanceOf(PlacementError.DimensionTooLarge.class, extractCause(result));
        }
    }

    @Nested
    @DisplayName("Exercise 3: AdPosition parsing")
    class AdPositionExercise {

        @Test
        @DisplayName("parses above_fold")
        void parsesAboveFold() {
            Result<AdPosition> result = AdPlacementExercise.adPositionExercise("above_fold");
            assertTrue(result.isSuccess());
            assertEquals(AdPosition.ABOVE_FOLD, result.unwrap());
        }

        @Test
        @DisplayName("parses case-insensitive")
        void parsesCaseInsensitive() {
            Result<AdPosition> result = AdPlacementExercise.adPositionExercise("ABOVE_FOLD");
            assertTrue(result.isSuccess());
            assertEquals(AdPosition.ABOVE_FOLD, result.unwrap());
        }

        @Test
        @DisplayName("parses all positions")
        void parsesAll() {
            assertTrue(AdPlacementExercise.adPositionExercise("below_fold").isSuccess());
            assertTrue(AdPlacementExercise.adPositionExercise("sidebar").isSuccess());
            assertTrue(AdPlacementExercise.adPositionExercise("footer").isSuccess());
        }

        @Test
        @DisplayName("rejects unknown position")
        void rejectsUnknown() {
            Result<AdPosition> result = AdPlacementExercise.adPositionExercise("middle");
            assertTrue(result.isFailure());
            assertInstanceOf(PlacementError.UnknownPosition.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects null")
        void rejectsNull() {
            Result<AdPosition> result = AdPlacementExercise.adPositionExercise(null);
            assertTrue(result.isFailure());
            assertInstanceOf(PlacementError.UnknownPosition.class, extractCause(result));
        }
    }

    @Nested
    @DisplayName("Exercise 4: AdPlacement composition")
    class AdPlacementExerciseTests {

        @Test
        @DisplayName("creates valid placement")
        void createsValid() {
            Result<AdPlacement> result = AdPlacementExercise.adPlacementExercise(
                "example-site",
                "header-banner",
                728, 90,
                "above_fold"
            );

            assertTrue(result.isSuccess());
            AdPlacement placement = result.unwrap();
            assertEquals("example-site", placement.siteId().value());
            assertEquals("header-banner", placement.slotId().value());
            assertEquals(728, placement.dimensions().width());
            assertEquals(90, placement.dimensions().height());
            assertEquals(AdPosition.ABOVE_FOLD, placement.position());
        }

        @Test
        @DisplayName("fails on invalid site ID")
        void failsInvalidSite() {
            Result<AdPlacement> result = AdPlacementExercise.adPlacementExercise(
                "INVALID_SITE!",
                "header-banner",
                728, 90,
                "above_fold"
            );
            assertTrue(result.isFailure());
        }

        @Test
        @DisplayName("fails on invalid slot ID")
        void failsInvalidSlot() {
            Result<AdPlacement> result = AdPlacementExercise.adPlacementExercise(
                "example-site",
                "slot@invalid",
                728, 90,
                "above_fold"
            );
            assertTrue(result.isFailure());
        }

        @Test
        @DisplayName("fails on invalid dimensions")
        void failsInvalidDimensions() {
            Result<AdPlacement> result = AdPlacementExercise.adPlacementExercise(
                "example-site",
                "header-banner",
                -1, 90,
                "above_fold"
            );
            assertTrue(result.isFailure());
        }

        @Test
        @DisplayName("fails on invalid position")
        void failsInvalidPosition() {
            Result<AdPlacement> result = AdPlacementExercise.adPlacementExercise(
                "example-site",
                "header-banner",
                728, 90,
                "unknown"
            );
            assertTrue(result.isFailure());
        }
    }
}
