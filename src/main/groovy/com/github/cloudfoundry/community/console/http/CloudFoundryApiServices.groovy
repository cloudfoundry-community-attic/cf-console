package com.github.cloudfoundry.community.console.http

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.env.Environment
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE

@Component
class CloudFoundryApiServices {

    private final HttpClient httpClient
    private final String apiBaseUri

    @Autowired
    def CloudFoundryApiServices(Environment env, HttpClient httpClient) {
        this.apiBaseUri = env.getRequiredProperty("endpoints.api")
        this.httpClient = httpClient
    }

    def constructHttpConfig(token, expandConfiguration, parentId) {
        final String resourceId = "${parentId}${expandConfiguration.resource}"
        final String apiPath = "${apiBaseUri}${expandConfiguration.path}"
        return {
            id resourceId
            path apiPath
            headers authorization: token, accept: APPLICATION_JSON_VALUE
            queryParams 'inline-relations-depth': expandConfiguration.depth
            onSuccess expandConfiguration.onSuccess
            onError expandConfiguration.onError
        }
    }

    def collectNonDelegatedRequests(exchange, expansions, token) {
        final result = []
        expansions.each { expandConfiguration ->
            findResource(expandConfiguration, exchange, { exchangeItem ->
                if (expandConfiguration.conditional == null || expandConfiguration.conditional(exchange.resources, exchangeItem)) {
                    expandConfiguration.path = "${exchangeItem.entity."${expandConfiguration.resource}_url"}"
                    result.add(constructHttpConfig(token, expandConfiguration, exchangeItem.metadata.guid))
                }
            })
        }
        return result
    }

    def collectDelegatedRequests(exchange, expansions, token) {
        final result = [:]
        expansions.each({ expandConfiguration ->
            findResource(expandConfiguration, exchange, { exchangeItem ->
                expandConfiguration.path = "${exchangeItem.entity."${expandConfiguration.resource}_url"}"
                result.put(expandConfiguration.path, loadResource(token, expandConfiguration))
            })
        })
        return result
    }

    def findResource(expandConfiguration, exchange, closure) {
        if (exchange.entity && exchange.entity."${expandConfiguration.resource}_url") {
            closure(exchange)
        } else if (exchange.resources) {
            exchange.resources.each { exchangeItem ->
                findResource(expandConfiguration, exchangeItem, closure)
            }
        }
        return exchange
    }

    def loadResource(String token, ExpandConfiguration root) {
        final exchange = httpClient.get {
            path "${apiBaseUri}${root.path}"
            headers authorization: token, accept: APPLICATION_JSON_VALUE
            queryParams 'inline-relations-depth': root.depth
        }
        final expansionRequests = collectNonDelegatedRequests(exchange, root.expansions.findAll { expandConfiguration -> expandConfiguration.expansions.size() == 0 }, token)
        final expansionExchange = httpClient.get(expansionRequests.toArray() as Closure[])
        final processedExpansions = collectDelegatedRequests(exchange, root.expansions.findAll { expandConfiguration -> expandConfiguration.expansions.size() > 0 }, token)
        root.expansions.each { expandConfiguration ->
            if (processedExpansions.get(expandConfiguration.path) != null) {
                findResource(expandConfiguration, exchange, { exchangeItem ->
                    final processedExpansionResults = processedExpansions.get(exchangeItem.entity."${expandConfiguration.resource}_url")
                    exchangeItem.entity."${expandConfiguration.resource}" = processedExpansionResults.resources == null ? processedExpansionResults.entity : processedExpansionResults.resources
                })
            } else {
                findResource(expandConfiguration, exchange, { exchangeItem ->
                    def future = expansionExchange.findFutureById("${exchangeItem.metadata.guid}${expandConfiguration.resource}")
                    if (future != null) {
                        exchangeItem.entity."${expandConfiguration.resource}" = future.resources == null ? future.entity : future.resources
                    }
                })
            }
        }
        return root.onSuccess ? root.onSuccess(exchange) : exchange
    }

    def loadResource(ExpandConfiguration root) {
        loadResource(SecurityContextHolder.context.authentication.details.token.parseAccessToken(), root)
    }

}
