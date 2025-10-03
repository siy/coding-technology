package com.example.app.usecase.userlogin;

import org.junit.jupiter.api.Test;
import org.pragmatica.lang.Promise;
import org.pragmatica.lang.Result;

import static org.junit.jupiter.api.Assertions.*;

class UserLoginAsyncFlowTest {

    @Test
    void execute_sequencer_happyPath_async() {
        UserLogin.CheckCredentials creds = vr -> Promise.success(new UserLogin.Credentials("u-1"));
        UserLogin.CheckAccountStatus status = c -> Promise.success(new UserLogin.Account(c.userId(), true));
        UserLogin.GenerateToken token = acc -> Promise.success(new UserLogin.Response("token-for-" + acc.userId()));

        var uc = UserLogin.userLogin(creds, status, token);

        Result<UserLogin.Response> result = uc.execute(new UserLogin.Request("john.doe@example.com", "S3cur3-P@ssw0rd", "REF123")).await();

        assertTrue(result.isSuccess());
        assertEquals("token-for-u-1", result.unwrap().token());
    }
}

