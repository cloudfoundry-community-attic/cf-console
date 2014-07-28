package com.github.cloudfoundry.community.console.controllers

import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam

import javax.servlet.http.HttpServletResponse

import static org.springframework.http.MediaType.TEXT_HTML_VALUE
import static org.springframework.web.bind.annotation.RequestMethod.GET
import static org.springframework.web.bind.annotation.RequestMethod.POST

@Controller
class LoginController {

    @RequestMapping(value = "/login", method = GET, produces = TEXT_HTML_VALUE)
    def String showLoginScreen() {
        "cf-login"
    }


    @RequestMapping("/logout")
    def void logout(HttpServletResponse response) {
        SecurityContextHolder.clearContext()
        response.sendRedirect("/index")
    }

}
