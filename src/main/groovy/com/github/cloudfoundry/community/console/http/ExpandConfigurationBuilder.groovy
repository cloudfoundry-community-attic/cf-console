package com.github.cloudfoundry.community.console.http

/**
 * Created by klm31131 on 28/07/14.
 */
class ExpandConfigurationBuilder extends BuilderSupport {

    def expansions = []

    @Override
    protected void setParent(Object parent, Object child) {
        parent.expansions << child
    }

    @Override
    protected Object createNode(Object name) {
        null
    }

    @Override
    protected Object createNode(Object name, Object value) {
        null
    }

    @Override
    protected Object createNode(Object name, Map attributes) {
        if(name == 'expansion' || name == 'root'){
            new ExpandConfiguration(attributes)
        }else{
            null
        }
    }

    @Override
    protected Object createNode(Object name, Map attributes, Object value) {
        return null
    }

}
