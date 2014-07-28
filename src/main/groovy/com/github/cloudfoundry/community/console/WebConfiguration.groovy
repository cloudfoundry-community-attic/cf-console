package com.github.cloudfoundry.community.console

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.joda.JodaModule
import com.github.jknack.handlebars.context.FieldValueResolver
import com.github.jknack.handlebars.context.JavaBeanValueResolver
import com.github.jknack.handlebars.context.MapValueResolver
import com.github.jknack.handlebars.springmvc.HandlebarsViewResolver
import org.apache.http.impl.client.HttpClientBuilder
import org.apache.http.impl.client.HttpClients
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.PropertySource
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.http.converter.HttpMessageConverter
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
import org.springframework.web.client.RestTemplate
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter
import org.springframework.web.servlet.view.UrlBasedViewResolver

import java.util.concurrent.ExecutorService
import java.util.concurrent.SynchronousQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit

import static com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY
import static com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS

@Configuration
@PropertySource("classpath:cf-console.properties.xml")
@ComponentScan("com.github.cloudfoundry.community.console")
@EnableWebMvc
class WebConfiguration extends WebMvcConfigurerAdapter {

    @Override
    def void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer.favorPathExtension(false).favorParameter(true)
    }

    @Override
    def void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        converters.add(getJsonMessageConverter())
    }

    @Bean
    def MappingJackson2HttpMessageConverter getJsonMessageConverter() {
        new MappingJackson2HttpMessageConverter(objectMapper: getObjectMapper())
    }

    @Bean
    def ObjectMapper getObjectMapper() {
        final ObjectMapper mapper = new ObjectMapper(serializationInclusion: NON_EMPTY)
        mapper.registerModule(new JodaModule())
        mapper.configure(WRITE_DATES_AS_TIMESTAMPS, false)
        return mapper
    }

    @Bean
    @SuppressWarnings("unchecked")
    public HandlebarsViewResolver getHandlebarsViewResolver() {
        new HandlebarsViewResolver(
                failOnMissingFile: true,
                cache: true,
                valueResolvers: [MapValueResolver.INSTANCE, FieldValueResolver.INSTANCE, JavaBeanValueResolver.INSTANCE],
                prefix: "WEB-INF/views",
                suffix: ".hbs");
    }

    @Bean(name = "threadPool", destroyMethod = "shutdown")
    public ExecutorService getTaskExecutor() {
        return new ThreadPoolExecutor(0, 100, 60L, TimeUnit.SECONDS, new SynchronousQueue<Runnable>());
    }

    @Bean
    def RestTemplate getRestTemplate() {
        new RestTemplate(requestFactory: new HttpComponentsClientHttpRequestFactory(HttpClients.createDefault()))
    }

}
