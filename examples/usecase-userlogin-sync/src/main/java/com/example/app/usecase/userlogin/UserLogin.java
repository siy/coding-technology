package com.example.app.usecase.userlogin;

import com.example.app.domain.shared.Email;
import com.example.app.domain.shared.Password;
import com.example.app.domain.shared.ReferralCode;
import org.pragmatica.lang.Option;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Unit;
import org.pragmatica.lang.utils.Causes;

// Minimal UseCase variants for illustration; align with TECHNOLOGY.md

// Pattern: Use case with nested Request/Response and Sequencer in execute()
public interface UserLogin {
    // Public API
    record Request(String email, String password, String referral) {}

    record Response(String token) {}

    // Execute method (sync example). Return kind reflects semantics.
    Result<Response> execute(Request request);

    // Internal validated input (not part of public API)
    // Pattern: Parse, don't validate  -  factories return Result<ValidRequest>
    record ValidRequest(Email email, Password password, Option<ReferralCode> referral) {
        // Pattern: Composite validation  -  Result.all accumulates per-field errors (CompositeCause)
        public static Result<ValidRequest> validRequest(Request raw) {
            return Result.all(Email.email(raw.email()),
                              Password.password(raw.password()),
                              ReferralCode.referralCode(raw.referral()))
                         .flatMap(ValidRequest::validRequest);
        }

        // Pattern: Cross-field checks before construction; construct only if all pass
        public static Result<ValidRequest> validRequest(Email email,
                                                        Password password,
                                                        Option<ReferralCode> referral) {

            return passwordNoEmailLocalPart(email, password)
                    .map(_ -> new ValidRequest(email, password, referral));
        }

        private static Result<Unit> passwordNoEmailLocalPart(Email email, Password password) {
            return password.contains(email.localPart())
                    ? Causes.cause("Password must not include email local-part").result()
                    : Result.unitResult();
        }
    }

    // Pattern: Steps as single-method interfaces returning the use case monad
    interface CheckCredentials {
        Result<Credentials> apply(ValidRequest validRequest);
    }

    interface CheckAccountStatus {
        Result<Account> apply(Credentials credentials);
    }

    interface GenerateToken {
        Result<Response> apply(Account account);
    }

    // Domain fragments used only by this use case; keep minimal
    record Credentials(String userId) {}

    record Account(String userId, boolean active) {}

    // Factory named after type (lowerCamel)
    static UserLogin userLogin(CheckCredentials checkCredentials,
                               CheckAccountStatus checkAccountStatus,
                               GenerateToken generateToken) {

        return request -> ValidRequest.validRequest(request)
                                      .flatMap(checkCredentials::apply)
                                      .flatMap(checkAccountStatus::apply)
                                      .flatMap(generateToken::apply);
    }
}
