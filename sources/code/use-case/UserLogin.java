interface UserLogin extends UseCase.WithResult<UserLogin.Response, UserLogin.Request> {
    // Public API
    record Request(String email, String password, String referral) {}
    record Response(String token) {}

    // Internal validated input (not exposed externally)
    record ValidRequest(Email email, Password password, Option<ReferralCode> referral) {
        static Result<ValidRequest> validRequest(Request raw) {
            return Result.all(Email.email(raw.email()),
                              Password.password(raw.password())
                              parseReferral(raw.referral()))
                         .flatMap(ValidRequest::validRequest);
        }

        // Cross-field validation lives in factory method
        private Result<ValidRequest> validRequest(Emain email, Password password, Option<ReferralCode> referral) {
            // Example: password must not contain email local-part
            return !password.contains(email.localPart()) // Use domain helper on Email VO
                    ? Result.success(new ValidRequest(email, password, referral))
                    : Result.failure(Causes.of("Password must not contain email local-part"));
        }

        // Optional field parsing helper
        private static Result<Option<ReferralCode>> parseReferral(String raw) {
            if (raw == null || raw.isBlank()) {
                return Result.success(Option.none());
            }
            return ReferralCode.referralCode(raw).map(Option::option);
        }
    }

    // Use case factory and execute
    static UserLogin userLogin(CheckCredentials checkCredentials,
                               CheckAccountStatus checkAccountStatus,
                               GenerateToken generateToken) {
        record userLogin(CheckCredentials checkCredentials, CheckAccountStatus checkAccountStatus, GenerateToken generateToken) implements UserLogin {
            public Result<Response> execute(Request request) {
                return ValidRequest.validRequest(request)
                                   .flatMap(checkCredentials())
                                   .flatMap(checkAccountStatus())
                                   .flatMap(generateToken());
            }
        }
        return new userLogin(checkCredentials, checkAccountStatus, generateToken);
    }
}
