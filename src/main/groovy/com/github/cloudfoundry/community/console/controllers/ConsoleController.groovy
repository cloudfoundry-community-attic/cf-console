package com.github.cloudfoundry.community.console.controllers

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

import static org.springframework.http.MediaType.TEXT_HTML_VALUE
import static org.springframework.web.bind.annotation.RequestMethod.GET

@Controller
class ConsoleController {

    @RequestMapping(value = "/index", method = GET, produces = TEXT_HTML_VALUE)
    def String showConsole(){
        "cf-console"
    }

}
