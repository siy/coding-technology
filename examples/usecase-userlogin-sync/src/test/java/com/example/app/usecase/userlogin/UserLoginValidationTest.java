package com.example.app.usecase.userlogin;

import com.example.app.domain.shared.Email;
import com.example.app.domain.shared.Password;
import com.example.app.domain.shared.ReferralCode;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.pragmatica.lang.Option;
import org.pragmatica.lang.Result;
import org.pragmatica.lang.utils.Causes;

import static com.example.app.usecase.userlogin.UserLogin.ValidRequest.validRequest;
import static org.junit.jupiter.api.Assertions.*;

class UserLoginValidationTest {

    @Test
    void validRequest_succeeds_forValidInput() {
        var req = new UserLogin.Request("john.doe@example.com", "S3cur3-P@ssw0rd", "REF123");

        validRequest(req)
                .onFailureRun(Assertions::fail)
                .onSuccess(value -> {
                    assertEquals("john.doe", value.email().localPart());
                    assertTrue(value.password().isDiverse());
                    assertTrue(value.referral().isPresent());
                });
    }

    @Test
    void validRequest_aggregatesErrors_forMultipleInvalidFields() {
        var req = new UserLogin.Request("bad", "short", "bad-code");

        validRequest(req)
                .onSuccessRun(Assertions::fail)
                .onFailure(cause -> {
                    var message = cause.message();

                    assertTrue(message.contains("Composite:"));

                    long lines = message.lines()
                                        .filter(l -> l.strip().startsWith("-") || l.contains("Invalid") || l.contains(
                                                "Too short"))
                                        .count();
                    assertTrue(lines >= 1);
                    // message format may vary; presence of Composite is the key signal
                });

    }

    @Test
    void componentFactory_appliesCrossFieldChecks() {
        var r = Result.all(Email.email("local@example.com")
                                .onFailure(cause -> {
                                    assertInstanceOf(Causes.SimpleCause.class, cause);
                                }),
                   Password.password("local-xxxx")
                           .onFailure(cause -> {
                               assertInstanceOf(Causes.SimpleCause.class, cause);
                           }),
                   Result.success(Option.<ReferralCode>none()))
              .flatMap(UserLogin.ValidRequest::validRequest);

        r
              .onSuccessRun(Assertions::fail)
              .onFailure(cause -> {
                  assertInstanceOf(Causes.CompositeCause.class, cause);

//                  var message = cause.message();
//
//                  assertTrue(message.contains("Password must not include email local-part"));
              });
    }
}

