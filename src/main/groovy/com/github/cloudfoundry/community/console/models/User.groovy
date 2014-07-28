package com.github.cloudfoundry.community.console.models

import groovy.transform.EqualsAndHashCode
import groovy.transform.ToString

@ToString(includeNames = true)
@EqualsAndHashCode
class User {

    def String id, name, email

}
