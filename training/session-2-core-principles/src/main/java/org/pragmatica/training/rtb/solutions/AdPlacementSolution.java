package org.pragmatica.training.rtb.solutions;

import org.pragmatica.lang.Result;
import org.pragmatica.training.rtb.*;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.pragmatica.lang.Result.failure;
import static org.pragmatica.lang.Result.success;
import static org.pragmatica.lang.Verify.ensure;

/// Solutions to the AdPlacement exercises.
/// Compare with your implementation after completing the exercises.
public final class AdPlacementSolution {

    private AdPlacementSolution() {}

    private static final int SLOT_ID_MAX_LENGTH = 32;
    private static final int DIMENSION_MAX = 4096;
    private static final Pattern SLOT_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9-]+$");
    private static final Map<String, AdPosition> POSITION_MAP = Arrays.stream(AdPosition.values())
        .collect(Collectors.toMap(p -> p.code().toLowerCase(), Function.identity()));

    /// Solution 1: SlotId validation
    public static Result<SlotId> slotIdExercise(String value) {
        return ensure(value, s -> s != null && !s.isBlank(), PlacementError.EMPTY_SLOT_ID)
            .map(String::strip)
            .flatMap(s -> ensure(s, v -> v.length() <= SLOT_ID_MAX_LENGTH,
                v -> new PlacementError.InvalidSlotId(v, "exceeds max length " + SLOT_ID_MAX_LENGTH)))
            .flatMap(s -> ensure(s, v -> SLOT_ID_PATTERN.matcher(v).matches(),
                v -> new PlacementError.InvalidSlotId(v, "contains invalid characters")))
            .map(SlotId::new);
    }

    /// Solution 2: Dimensions validation
    public static Result<Dimensions> dimensionsExercise(int width, int height) {
        return validateDimension("width", width)
            .flatMap(w -> validateDimension("height", height)
                .map(h -> new Dimensions(w, h)));
    }

    private static Result<Integer> validateDimension(String name, int value) {
        return ensure(value, v -> v > 0,
                _ -> new PlacementError.InvalidDimension(name, value))
            .flatMap(v -> ensure(v, val -> val <= DIMENSION_MAX,
                _ -> new PlacementError.DimensionTooLarge(name, value, DIMENSION_MAX)));
    }

    /// Solution 3: AdPosition parsing
    public static Result<AdPosition> adPositionExercise(String value) {
        if (value == null || value.isBlank()) {
            return failure(new PlacementError.UnknownPosition(value == null ? "" : value));
        }

        String normalized = value.strip().toLowerCase();
        AdPosition position = POSITION_MAP.get(normalized);

        return position != null
            ? success(position)
            : failure(new PlacementError.UnknownPosition(value));
    }

    /// Solution 4: AdPlacement composition
    public static Result<AdPlacement> adPlacementExercise(
        String siteId,
        String slotId,
        int width,
        int height,
        String position
    ) {
        return Result.all(
            SiteId.siteId(siteId),
            slotIdExercise(slotId),
            dimensionsExercise(width, height),
            adPositionExercise(position)
        ).map(AdPlacement::new);
    }
}
