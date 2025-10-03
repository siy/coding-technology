package com.example.app.usecase.userlogin;

import org.junit.jupiter.api.Test;
import org.pragmatica.lang.Result;

import static org.junit.jupiter.api.Assertions.*;

class UserLoginAsyncValidationTest {

    @Test
    void validRequest_succeeds_forValidInput() {
        var req = new UserLogin.Request("john.doe@example.com", "S3cur3-P@ssw0rd", "REF123");

        Result<UserLogin.ValidRequest> result = UserLogin.ValidRequest.validRequest(req);

        assertTrue(result.isSuccess());
    }

    @Test
    void validRequest_fails_forInvalidInput() {
        var req = new UserLogin.Request("bad", "short", "bad-code");

        var result = UserLogin.ValidRequest.validRequest(req);

        assertTrue(result.isFailure());
        assertTrue(result.fold(c -> c.message(), ok -> "").contains("Composite"));
    }
}

