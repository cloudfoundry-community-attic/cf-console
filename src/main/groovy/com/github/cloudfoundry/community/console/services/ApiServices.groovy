package com.github.cloudfoundry.community.console.services

import com.github.cloudfoundry.community.console.http.HttpClient
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class ApiServices {

    private final HttpClient httpClient
    private final String apiEndpoint

    @Autowired
    def ApiServices(@Value("endpoints.api") String apiEndpoint, HttpClient httpClient) {
        this.apiEndpoint = apiEndpoint
        this.httpClient = httpClient
    }


}
