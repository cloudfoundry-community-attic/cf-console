package com.github.cloudfoundry.community.console.controllers

import com.github.cloudfoundry.community.console.http.CloudFoundryApiServices
import com.github.cloudfoundry.community.console.http.ExpandConfiguration
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE
import static org.springframework.web.bind.annotation.RequestMethod.GET

@RestController
@RequestMapping("/api/v2/organizations")
class OrganizationsController {

    private final CloudFoundryApiServices api

    @Autowired
    def OrganizationsController(CloudFoundryApiServices api) {
        this.api = api
    }

    @RequestMapping(method = GET, produces = APPLICATION_JSON_VALUE)
    def loadOrganizations(@RequestParam(value = "active", required = false) String activeOrganizationId) {
        final firstOrganization = { organizations, organization ->
            if (activeOrganizationId != null) {
                return organization.metadata.guid == activeOrganizationId
            } else {
                return organizations[0] == organization
            }
        }
        final config = ExpandConfiguration.newBuilder().root(path: '/v2/organizations') {
            expansion(resource: 'spaces', conditional: firstOrganization)
            expansion(resource: 'users', conditional: firstOrganization)
        }
        api.loadResource(config)
    }

}
