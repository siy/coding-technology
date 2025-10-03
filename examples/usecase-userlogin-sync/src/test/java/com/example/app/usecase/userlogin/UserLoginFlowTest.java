package com.example.app.usecase.userlogin;

import org.junit.jupiter.api.Test;
import org.pragmatica.lang.Result;

import static org.junit.jupiter.api.Assertions.*;

class UserLoginFlowTest {

    @Test
    void execute_sequencer_happyPath() {
        UserLogin.CheckCredentials creds = vr -> Result.success(new UserLogin.Credentials("u-1"));
        UserLogin.CheckAccountStatus status = c -> Result.success(new UserLogin.Account(c.userId(), true));
        UserLogin.GenerateToken token = acc -> Result.success(new UserLogin.Response("token-for-" + acc.userId()))
                ;

        var uc = UserLogin.userLogin(creds, status, token);

        var result = uc.execute(new UserLogin.Request("john.doe@example.com", "S3cur3-P@ssw0rd", "REF123"));

        assertTrue(result.isSuccess());
        assertEquals("token-for-u-1", result.unwrap().token());
    }
}

