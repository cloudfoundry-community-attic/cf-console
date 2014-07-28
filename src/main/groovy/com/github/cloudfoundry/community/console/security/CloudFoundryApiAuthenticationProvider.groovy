package com.github.cloudfoundry.community.console.security

import com.github.cloudfoundry.community.console.models.Token
import com.github.cloudfoundry.community.console.models.User
import com.github.cloudfoundry.community.console.services.UaaServices
import groovy.util.logging.Slf4j
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.AuthenticationException
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.stereotype.Component

@Component
@Slf4j
class CloudFoundryApiAuthenticationProvider implements AuthenticationProvider {

    private final UaaServices uaaServices

    @Autowired
    def CloudFoundryApiAuthenticationProvider(UaaServices uaaServices) {
        this.uaaServices = uaaServices
    }

    @Override
    Authentication authenticate(Authentication authentication) throws AuthenticationException {
        if (authentication.isAuthenticated()) {
            return authentication
        }
        final String username = authentication.name
        final String password = authentication.credentials.toString()
        try {
            final Token token = uaaServices.userToken(username, password)
            final User user = uaaServices.uaaUser(token)
            final auth = new UsernamePasswordAuthenticationToken(authentication.principal, authentication.credentials, [new SimpleGrantedAuthority("CF_USER")])
            auth.setDetails([token: token, user: user])
            return auth
        } catch (Exception e) {
            log.error("Invalid username or password provided. ${username} ${password}", e)
            throw new BadCredentialsException("Invalid username or password provided.")
        }
    }

    @Override
    boolean supports(Class<?> aClass) {
        UsernamePasswordAuthenticationToken.equals(aClass)
    }

}
