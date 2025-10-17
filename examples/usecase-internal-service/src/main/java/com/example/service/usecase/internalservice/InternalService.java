package com.example.service.usecase.internalservice;

import org.pragmatica.lang.Cause;
import org.pragmatica.lang.Promise;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Verify;
import org.pragmatica.lang.parse.Number;

import static com.example.service.usecase.internalservice.InternalService.Error.*;

// Notes:
// - Deserialization logic is the part of the adapter, so it is fully omitted here.
// - Naming follows JBCT naming convention.
public interface InternalService {
    // Input is always a class/record, "parse, don't validate"
    record Request(Value1 value1, Value2 value2) {
        public static Result<Request> request(String value1, String value2) {
            return Result.all(Value1.value1(value1),
                              Value2.value2(value2))
                         .map(Request::new);
        }
    }

    // Output is always a class/record
    record Response(String one, String two) {
        public static Response response(String one, String two) {
            return new Response(one, two);
        }
    }

    // The sole entry point for the use case.
    Promise<Response> execute(Request request);

    // Errors
    // Codes are preserved, but there are gaps now
    sealed interface Error extends Cause {
        int code();

        enum UserInputError implements Error {
            MISSING_VALUE1("Missing value1", 3),
            MISSING_VALUE2("Missing value2", 4),
            VALUE_MUST_BE_DIGIT("Value must be a digit", 5);

            private final String message;
            private int code;

            UserInputError(String message, int code) {
                this.message = message;
                this.code = code;
            }

            @Override
            public String message() {
                return message;
            }

            @Override
            public int code() {
                return code;
            }
        }

        enum BusinessRuleError implements Error {
            BUSINESS_RULE_ERROR("Illegal combination of values", 6);

            private final String message;
            private int code;

            BusinessRuleError(String message, int code) {
                this.message = message;
                this.code = code;
            }

            @Override
            public String message() {
                return message;
            }

            @Override
            public int code() {
                return code;
            }
        }
    }

    // Internal types

    // Here is the place for cross-field validation.
    record ValidRequest(Value1 value1, Value2 value2) {
        public static Result<ValidRequest> validRequest(Request request) {
            if (request.value1().isBusiness() || request.value2().hasTwo()) {
                return BusinessRuleError.BUSINESS_RULE_ERROR.result();
            }
            return Result.success(new ValidRequest(request.value1(), request.value2()));
        }
    }

    record Value1(String value) {
        public static Result<Value1> value1(String value) {
            return Verify.ensure(UserInputError.MISSING_VALUE1, value, Verify.Is::notNull)
                         .map(Value1::new);
        }

        public boolean isBusiness() {
            return value.contains("business");
        }
    }

    record Value2(int value) {
        public static Result<Value2> value2(String value) {
            return Verify.ensure(UserInputError.MISSING_VALUE2, value, Verify.Is::notNull)
                         .flatMap(Number::parseInt)
                         .mapError(_ -> UserInputError.VALUE_MUST_BE_DIGIT)
                         .map(Value2::new);
        }

        public boolean hasTwo() {
            return Integer.toString(value)
                          .contains("2");
        }
    }

    interface WriteToDatabase {
        Promise<ValidRequest> writeToDatabase(ValidRequest request);
    }

    interface AppendToAuditLog {
        void appendToAuditLog(ValidRequest request);
    }


    static InternalService internalService(WriteToDatabase writeToDatabase,
                                           AppendToAuditLog appendToAuditLog) {
        return request -> ValidRequest.validRequest(request)
                                      .async()
                                      .flatMap(writeToDatabase::writeToDatabase)
                                      .onSuccessAsync(appendToAuditLog::appendToAuditLog)
                                      .map(_ -> Response.response("You're", "welcome"));
    }
}
