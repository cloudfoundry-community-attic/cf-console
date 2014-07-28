package com.github.cloudfoundry.community.console.http

import groovy.transform.Canonical

@Canonical
class ExpandConfiguration {

    String resource
    String path
    int depth = 0
    Closure onSuccess
    Closure onError
    Closure conditional
    List<ExpandConfiguration> expansions = []

    static ExpandConfigurationBuilder newBuilder(){
        new ExpandConfigurationBuilder()
    }

}
