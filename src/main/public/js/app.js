define(['angular',
	'router',
	'restangular',
	'services/services',
	'directives/directives',
	'providers/providers',
	'filters/filters',
	'factories/factories',
	'controllers/controllers',
	'directives/tableDirective',
	'angularui'],
	function (angular) {

	'use strict';

	return angular.module('myApp', [
		'ui.router.compat',
		'restangular',
		'services',
		'directives',
		'providers',
		'filters',
		'factories',
		'controllers',
		'directive.table',
		'ui.bootstrap'
	]).config(function(RestangularProvider, $httpProvider, appUrlManipulationProvider, REST_API) {
		console.log('app.js called');
		
		$httpProvider.interceptors.push('responseInterceptor');

        RestangularProvider.setDefaultHeaders({ 
			"Content-Type" : "application/json;charset=UTF-8",
			"Accept" :"application/json;charset=UTF-8" });
		RestangularProvider.setBaseUrl(REST_API);		
		RestangularProvider.setResponseExtractor(function(response, operation, what, url) {
			// Maybe needs to be configured
			return response;
		});

		RestangularProvider.setRequestInterceptor(function(request, operation, route) {
			// Maybe needs to be configured
			return request;
		});

	}).constant('REST_API', 'http://localhost:8080/cfmc/api');
});
