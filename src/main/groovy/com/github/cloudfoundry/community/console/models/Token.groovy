package com.github.cloudfoundry.community.console.models

import groovy.transform.EqualsAndHashCode
import groovy.transform.ToString

@ToString(includeNames = true)
@EqualsAndHashCode
class Token {

    def String tokenType, accessToken, refreshToken

    def String parseAccessToken(){
        "${tokenType} ${accessToken}"
    }

    def String parseRefreshToken(){
        "${tokenType} ${refreshToken}"
    }

}
