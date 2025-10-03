package com.example.app.domain.shared;

import org.pragmatica.lang.Option;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Verify;

import java.util.regex.Pattern;

import static org.pragmatica.lang.Verify.ensure;

public record ReferralCode(String value) {
    private static final Pattern REF = Pattern.compile("^[A-Z0-9]{6,12}$");

    // Pattern: optional-with-validation via Result<Option<T>>
    public static Result<Option<ReferralCode>> referralCode(String raw) {
        return raw == null
                ? Result.success(Option.none())
                : ensure(raw, Verify.Is::matches, REF).map(ReferralCode::new)
                                                      .map(Option::option);
    }
}
