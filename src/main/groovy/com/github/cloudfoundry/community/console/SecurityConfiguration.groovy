package com.github.cloudfoundry.community.console

import com.github.cloudfoundry.community.console.security.CloudFoundryApiAuthenticationProvider
import com.github.cloudfoundry.community.console.services.UaaServices
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter

@Configuration
@EnableWebSecurity
class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Autowired
    private final UaaServices uaaServices

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .authenticationProvider(new CloudFoundryApiAuthenticationProvider(uaaServices))
                .csrf().disable()
                .authorizeRequests().antMatchers("/static/**").permitAll().anyRequest().authenticated()
                .and()
                .formLogin()
                .defaultSuccessUrl("/index", true)
                .passwordParameter("password")
                .usernameParameter("username")
                .loginPage("/login")
                .failureUrl("/login?status=failed")
                .permitAll()
    }
}
