package com.example.app.usecase.userlogin;

import com.example.app.domain.shared.Email;
import com.example.app.domain.shared.Password;
import com.example.app.domain.shared.ReferralCode;
import org.pragmatica.lang.Option;
import org.pragmatica.lang.Promise;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Unit;
import org.pragmatica.lang.utils.Causes;

// Minimal UseCase variants for illustration; align with TECHNOLOGY.md
// Pattern: Use case (async) with nested API; Sequencer with Promise
public interface UserLogin {
    // Public API
    record Request(String email, String password, String referral) {}

    record Response(String token) {}

    // Execute method (sync example). Return kind reflects semantics.
    Promise<Response> execute(Request request);

    // Internal validated input (not part of public API)
    // Pattern: Parse, don't validate — factories return Result<ValidRequest>
    record ValidRequest(Email email, Password password, Option<ReferralCode> referral) {
        // Pattern: Composite validation — Result.all accumulates per-field errors (CompositeCause)
        public static Result<ValidRequest> validRequest(Request raw) {
            return Result.all(Email.email(raw.email()),
                              Password.password(raw.password()),
                              ReferralCode.referralCode(raw.referral()))
                         .flatMap(ValidRequest::validRequest);
        }

        // Component-based factory: perform cross-field checks, then construct
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

    // Pattern: Steps as single-method interfaces returning Promise
    interface CheckCredentials {
        Promise<Credentials> apply(ValidRequest validRequest);
    }

    interface CheckAccountStatus {
        Promise<Account> apply(Credentials credentials);
    }

    interface GenerateToken {
        Promise<Response> apply(Account account);
    }

    // Domain fragments used only by this use case; keep minimal
    record Credentials(String userId) {}

    record Account(String userId, boolean active) {}

    // Factory named after type (lowerCamel)
    static UserLogin userLogin(CheckCredentials checkCredentials,
                               CheckAccountStatus checkAccountStatus,
                               GenerateToken generateToken) {

        record userLogin(CheckCredentials checkCredentials,
                         CheckAccountStatus checkAccountStatus,
                         GenerateToken generateToken
        ) implements UserLogin {
            @Override
            public Promise<Response> execute(Request request) {
                // Pattern: Lift sync validation to Promise, then sequencer with async steps
                // Alternate: ValidRequest.validRequest(request).async()
                return Promise.promise(() -> ValidRequest.validRequest(request))
                              .flatMap(checkCredentials::apply)
                              .flatMap(checkAccountStatus::apply)
                              .flatMap(generateToken::apply);
            }
        }

        return new userLogin(checkCredentials, checkAccountStatus, generateToken);
    }
}
