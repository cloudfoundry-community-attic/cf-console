package com.github.cloudfoundry.community.console.services

import com.github.cloudfoundry.community.console.http.HttpClient
import com.github.cloudfoundry.community.console.models.Token
import com.github.cloudfoundry.community.console.models.User
import groovy.util.logging.Slf4j
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.env.Environment
import org.springframework.stereotype.Service
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap

@Service
@Slf4j
class UaaServices {

    private final HttpClient httpClient
    private final String uaaEndpoint
    private final String apiEndpoint

    @Autowired
    def UaaServices(Environment env, HttpClient httpClient) {
        this.uaaEndpoint = env.getProperty("endpoints.uaa")
        this.apiEndpoint = env.getProperty("endpoints.api")
        this.httpClient = httpClient
    }

    def Token userToken(String username, String password) {
        final info = httpClient.get { path "$apiEndpoint/info" }
        log.debug("Retrieved authentication endpoint -> ${info.authorization_endpoint}")
        final MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
        requestBody.add("grant_type", "password");
        requestBody.add("username", username);
        requestBody.add("password", password);

        final token = httpClient.post {
            path "${info.authorization_endpoint}/oauth/token"
            body requestBody
            headers 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }

        [
                tokenType: token.token_type,
                accessToken: token.access_token,
                refreshToken: token.refresh_token
        ]
    }

    def User uaaUser(Token userToken) {
        final uaaUser = httpClient.get {
            path "${uaaEndpoint}/userinfo"
            headers 'Authorization': "${userToken.tokenType} ${userToken.accessToken}"
        }

        [
                id: uaaUser.user_id,
                name: uaaUser.user_name,
                email: uaaUser.email
        ]
    }

}
