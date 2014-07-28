package com.github.cloudfoundry.community.console.controllers

import com.github.cloudfoundry.community.console.http.CloudFoundryApiServices
import com.github.cloudfoundry.community.console.http.ExpandConfiguration
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

import javax.servlet.http.HttpServletRequest

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE
import static org.springframework.web.bind.annotation.RequestMethod.GET

@RestController
@RequestMapping("/api")
class ApiProxyController {

    private final CloudFoundryApiServices api

    @Autowired
    def ApiProxyController(CloudFoundryApiServices api) {
        this.api = api
    }

    @RequestMapping(value = "/**", method = GET, produces = APPLICATION_JSON_VALUE)
    def proxyRequest(HttpServletRequest request, @RequestParam(value = "expand", required = false) List<String> expansions){
        if("/api/".length() + 1 > request.pathInfo.length()){
            throw new IllegalArgumentException("Invalid CloudFoundry API URI provided.")
        }
        final config = ExpandConfiguration.newBuilder().root(path: request.pathInfo["/api".length() .. request.pathInfo.length()-1]){
            expansions.each {
                if(it.contains(":")){
                    final resource = new StringTokenizer(it, ":")
                    expansion(resource: resource.nextToken()){
                        final subResource = new StringTokenizer(resource.nextToken(), " AND ")
                        while(subResource.hasMoreTokens()){
                            expansion(resource: subResource.nextToken())
                        }
                    }
                }else{
                    expansion(resource: it)
                }
            }
        }
        api.loadResource(config)
    }

}
