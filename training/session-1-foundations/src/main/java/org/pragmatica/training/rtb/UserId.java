package org.pragmatica.training.rtb;

import org.pragmatica.lang.Cause;
import org.pragmatica.lang.Result;

import java.util.regex.Pattern;

import static org.pragmatica.lang.Verify.ensure;

/// A validated user identifier in the RTB domain.
///
/// Invariants:
/// - Value is non-null
/// - Value is non-blank
/// - Value contains only alphanumeric characters and hyphens
/// - Value length is between 1 and 64 characters
///
/// @param value the user ID string, guaranteed valid
public record UserId(String value) {

    /// Maximum length for user ID
    public static final int MAX_LENGTH = 64;

    /// Pattern for valid user ID characters
    private static final Pattern VALID_PATTERN = Pattern.compile("^[a-zA-Z0-9-]+$");

    /// Errors specific to UserId validation
    public sealed interface UserIdError extends Cause {

        record Empty() implements UserIdError {
            @Override
            public String message() {
                return "User ID cannot be empty";
            }
        }

        record InvalidCharacters(String value) implements UserIdError {
            @Override
            public String message() {
                return "User ID contains invalid characters: '%s'".formatted(value);
            }
        }

        record TooLong(int length, int maxLength) implements UserIdError {
            @Override
            public String message() {
                return "User ID too long: %d characters (max: %d)".formatted(length, maxLength);
            }
        }

        UserIdError EMPTY = new Empty();
    }

    /// Create a UserId from a raw string, validating all invariants.
    ///
    /// @param value the raw string value
    /// @return Result containing valid UserId or specific error
    public static Result<UserId> userId(String value) {
        return ensure(value, s -> s != null && !s.isBlank(), UserIdError.EMPTY)
            .map(String::strip)
            .flatMap(s -> ensure(s, v -> v.length() <= MAX_LENGTH,
                v -> new UserIdError.TooLong(v.length(), MAX_LENGTH)))
            .flatMap(s -> ensure(s, v -> VALID_PATTERN.matcher(v).matches(),
                v -> new UserIdError.InvalidCharacters(v)))
            .map(UserId::new);
    }

    @Override
    public String toString() {
        return value;
    }
}
