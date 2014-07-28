package com.github.cloudfoundry.community.console

import org.springframework.security.web.context.AbstractSecurityWebApplicationInitializer
import org.springframework.web.WebApplicationInitializer
import org.springframework.web.context.ContextLoaderListener
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext
import org.springframework.web.filter.CharacterEncodingFilter
import org.springframework.web.servlet.DispatcherServlet

import javax.servlet.ServletContext
import javax.servlet.ServletException
import javax.servlet.ServletRegistration

class WebBootstrap implements WebApplicationInitializer {

    @Override
    void onStartup(ServletContext container) throws ServletException {
        final AnnotationConfigWebApplicationContext webContext = new AnnotationConfigWebApplicationContext(servletContext: container)
        webContext.register(WebConfiguration, SecurityConfiguration)
        container.addListener(new ContextLoaderListener(webContext))

        final ServletRegistration.Dynamic dispatcher = container.addServlet("dispatcher", new DispatcherServlet(webContext))
        dispatcher.setLoadOnStartup(0)
        dispatcher.addMapping("/*")

        container.getServletRegistration("default").addMapping("/static/*")

        final CharacterEncodingFilter characterEncodingFilter = new CharacterEncodingFilter(encoding: "UTF-8", forceEncoding: true)
        container.addFilter("characterEncodingFilter", characterEncodingFilter).addMappingForServletNames(null, false, "dispatcher")
    }

}
