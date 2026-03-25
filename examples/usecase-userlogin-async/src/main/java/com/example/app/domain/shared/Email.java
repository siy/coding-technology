package com.example.app.domain.shared;

import org.pragmatica.lang.Cause;
import org.pragmatica.lang.Functions.Fn1;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Verify;
import org.pragmatica.lang.utils.Causes;

import java.util.regex.Pattern;

import static org.pragmatica.lang.Verify.ensure;

public record Email(String value) {
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Fn1<Cause, String> MISSING_EMAIL = Causes.forOneValue("Missing email address");
    private static final Fn1<Cause, String> INVALID_EMAIL = Causes.forOneValue("Invalid email address %s");

    // Pattern: VO factory named after type; normalize + ensure invariants
    public static Result<Email> email(String raw) {
        return ensure(MISSING_EMAIL, raw, Verify.Is::present)
                .map(String::trim)
                .filter(INVALID_EMAIL, Verify.Is::notEmpty)
                .filter(INVALID_EMAIL, EMAIL.asMatchPredicate())
                .map(Email::new);
    }

    // Helper used by cross-field checks
    public String localPart() {
        var at = value.indexOf('@');

        return at > 0
                ? value.substring(0, at)
                : value;
    }
}
