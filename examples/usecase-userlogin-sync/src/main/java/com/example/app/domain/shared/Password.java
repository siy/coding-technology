package com.example.app.domain.shared;

import org.pragmatica.lang.Cause;
import org.pragmatica.lang.Functions.Fn1;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Verify;
import org.pragmatica.lang.utils.Causes;

import java.util.function.IntPredicate;
import java.util.stream.Stream;

import static org.pragmatica.lang.Verify.ensure;
import static org.pragmatica.lang.Verify.ensureFn;

public record Password(String value) {
    private static final Fn1<Cause, String> MISSING_PASSWORD = Causes.forOneValue("Missing email address");
    private static final Fn1<Cause, String> TOO_SHORT_PASSWORD = Causes.forOneValue("Too short");
    private static final Fn1<Cause, String> NOT_DIVERSE_PASSWORD = Causes.forOneValue(
            "Password must contain at least one of each character type: lower case, upper case, digit, special character");
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_LENGTH = 255;
    private static final long DIVERSITY = 4;

    // Pattern: VO factory with chained ensures; domain-specific Causes
    public static Result<Password> password(String raw) {
        return ensure(MISSING_PASSWORD, raw, Verify.Is::notNull)
                .map(String::trim)
                .flatMap(ensureFn(TOO_SHORT_PASSWORD, Verify.Is::lenBetween, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH))
                .flatMap(ensureFn(NOT_DIVERSE_PASSWORD, Password::hasDiversity))
                .map(Password::new);
    }

    // Utility for cross-field validation
    public boolean contains(String fragment) {
        return value.contains(fragment);
    }

    public boolean isDiverse() {
        return hasDiversity(value);
    }

    private static boolean hasDiversity(String value) {
        IntPredicate letterOrDigit = Character::isLetterOrDigit;

        return Stream.of(value.chars().anyMatch(Character::isLowerCase),
                         value.chars().anyMatch(Character::isUpperCase),
                         value.chars().anyMatch(Character::isDigit),
                         value.chars().anyMatch(letterOrDigit.negate()))
                     .filter(Boolean::booleanValue)
                     .count() == DIVERSITY;
    }
}
