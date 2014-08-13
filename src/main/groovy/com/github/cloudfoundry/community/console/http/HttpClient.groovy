package com.github.cloudfoundry.community.console.http

import static java.lang.String.format
import static org.apache.commons.codec.binary.Base64.encodeBase64String
import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE
import groovy.util.logging.Slf4j

import java.security.SecureRandom
import java.security.cert.CertificateException
import java.security.cert.X509Certificate
import java.util.concurrent.Callable
import java.util.concurrent.ExecutorService
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.X509TrustManager

import org.apache.http.conn.scheme.Scheme
import org.apache.http.conn.ssl.SSLSocketFactory
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.ParameterizedTypeReference
import org.springframework.core.env.Environment
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.RestTemplate

import com.fasterxml.jackson.databind.ObjectMapper

@Component
@Slf4j
class HttpClient {

    private final static Logger LOG = LoggerFactory.getLogger(HttpClient.class)

    private final authHeader

    private final RestTemplate restTemplate
    private final ObjectMapper objectMapper
    private final ExecutorService pool

    @Autowired
    def HttpClient(Environment environment, RestTemplate restTemplate, ObjectMapper objectMapper, ExecutorService pool) {
        authHeader = "Basic ${encodeBase64String("${environment.getProperty("credentials.id")}:${environment.getProperty("credentials.secret")}".getBytes())}"
        this.pool = pool
        this.restTemplate = restTemplate
        this.objectMapper = objectMapper
    }

    def get(Closure closure) {
        HttpClientDsl.newInstance(authHeader, closure, HttpMethod.GET, restTemplate, objectMapper)
    }

    def get(Closure... closures) {
        HttpClientDsl.newInstance(authHeader, HttpMethod.GET, restTemplate, objectMapper, pool, closures)
    }

    def post(Closure closure) {
        HttpClientDsl.newInstance(authHeader, closure, HttpMethod.POST, restTemplate, objectMapper)
    }

    def put(Closure closure) {
        HttpClientDsl.newInstance(authHeader, closure, HttpMethod.PUT, restTemplate, objectMapper)
    }

    def delete(Closure closure) {
        HttpClientDsl.newInstance(authHeader, closure, HttpMethod.DELETE, restTemplate, objectMapper)
    }

    static class HttpClientDsl {

        private final RestTemplate restTemplate
        private final ObjectMapper objectMapper
        private final HttpMethod httpMethod
        private final String authHeader
        private String path
        private String id
        private Object body
        private Closure onSuccess
        private Closure onError
        private Map<String, String> headers
        private Map<String, String> uriParams = [:]
        private Map<String, String> queryParams

        def HttpClientDsl(String authHeader, httpMethod, restTemplate, objectMapper) {
            this.authHeader = authHeader
            this.httpMethod = httpMethod
            this.restTemplate = restTemplate
			def requestFactory = ignoreCertAndHostVerification();
			restTemplate.setRequestFactory(requestFactory);
			this.objectMapper = objectMapper
        }
		
		def ignoreCertAndHostVerification() {
			SLContext sslContext = null;
		
			TrustManager[] trustAllCerts = new TrustManager[] { new X509TrustManager(){
			    public X509Certificate[] getAcceptedIssuers(){ return null }
			    public void checkClientTrusted(X509Certificate[] certs, String authType){}
			    public void checkServerTrusted(X509Certificate[] certs, String authType){}
			}}
	
			try {
			    sslContext = SSLContext.getInstance("TLS");
			    sslContext.init(null, trustAllCerts, new SecureRandom());
			    HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.getSocketFactory());
			} catch (Exception e) {
			    
			}
			
			HttpClient httpClient = HttpClientBuilder.create()
				.setSSLSocketFactory(new SSLConnectionSocketFactory(sslContext, new AllowAllHostnameVerifier());)
				.build();
			return new HttpComponentsClientHttpRequestFactory(httpClient);
		}

        def static newInstance(String authHeader, HttpMethod httpMethod, RestTemplate restTemplate, ObjectMapper objectMapper, ExecutorService pool, Closure... closures) {
            def futures = closures.collect { closure ->
                HttpClientDsl httpClientDsl = new HttpClientDsl(authHeader, httpMethod, restTemplate, objectMapper)
                closure.delegate = httpClientDsl
                closure()
                def future = pool.submit({ httpClientDsl.exchange() } as Callable)
                [id: httpClientDsl.id ?: httpClientDsl.path, result: { future.get(5, TimeUnit.SECONDS) }]
            }
            def findFuture = { id ->
                futures.find { future -> future.id == id}?.result()
            }
            [findFutureById: findFuture, list: futures]
        }

        def static newInstance(String authHeader, Closure closure, HttpMethod httpMethod, RestTemplate restTemplate, ObjectMapper objectMapper) {
            HttpClientDsl httpClientDsl = new HttpClientDsl(authHeader, httpMethod, restTemplate, objectMapper)
            closure.delegate = httpClientDsl
            def closureComposition = closure >> httpClientDsl.exchange
            closureComposition()
        }

        def id(String id) {
            this.id = id
        }

        def path(String path) {
            this.path = path
        }

        def headers(Map<String, String> headers) {
            this.headers = headers
        }

        def body(Object body) {
            this.body = body
        }

        def onSuccess(Closure transform){
            this.onSuccess = transform
        }

        def onError(Closure transform) {
            this.onError = transform;
        }

        def uriParams(Map<String, String> uriParams) {
            this.uriParams = uriParams
        }

        def queryParams(Map<String, String> queryParams) {
            this.queryParams = queryParams
        }

        def exchange = {
            final uri = path
            final httpHeaders = new HttpHeaders()
            log.info(headers.toString())
            if (headers) {
                headers.each { key, value -> httpHeaders.add(key, value) }
            }
            if(!httpHeaders.containsKey("Authorization")){
                log.info("Adding client authorization. ${authHeader}")
                httpHeaders.add("Authorization", authHeader)
            }
            if(!httpHeaders.containsKey("Accept")){
                httpHeaders.add("Accept", APPLICATION_JSON_VALUE)
            }
            log.info(httpHeaders.toString())
            HttpEntity httpEntity = new HttpEntity(httpHeaders)
            if (queryParams) {
                uri = "$uri?"
                queryParams.eachWithIndex { key, value, index ->
                    uri = "$uri$key=$value"
                    if ((index + 1) < queryParams.size()) {
                        uri = "$uri&"
                    }
                }
            }
            log.info(body.toString())
            if (body) {
                httpEntity = new HttpEntity(body, httpHeaders)
            }
            try {
                log.info("Performing new request to ${uri}")
                final exchange = restTemplate.exchange(uri, httpMethod, httpEntity, new ParameterizedTypeReference<Map<String, Object>>() {})
                if (exchange.getStatusCode().value() < 300) {
                    return onSuccess ? onSuccess(exchange.getBody()) : exchange.getBody()
                } else if (onError) {
                    return onError(exchange.getBody())
                }
                throw new HttpClientException(exchange.getHeaders(), exchange.getStatusCode(), exchange.getBody())
            } catch (HttpClientErrorException e) {
                if (onError) {
                    return onError(objectMapper.readValue(e.getResponseBodyAsString(), objectMapper.getTypeFactory().constructMapType(HashMap.class, String.class, Object.class)))
                }
                LOG.error(format("HTTP call resulted in a %s status with body %s.", e.getStatusCode(), e.getResponseBodyAsString()), e)
                final body = e.getResponseBodyAsString() == null || e.getResponseBodyAsString().length() == 0 ? new HashMap<String, Object>() : objectMapper.readValue(e.getResponseBodyAsString(), objectMapper.getTypeFactory().constructMapType(HashMap.class, String.class, Object.class));
                throw new HttpClientException(e.responseHeaders, e.statusCode, body)
            }
        }
    }

}