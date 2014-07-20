/**
 *  route.js
 **/
define(['app'], function (app) {
	return app.config(['$stateProvider', '$routeProvider', '$urlRouterProvider', 
		function($stateProvider, $routeProvider, $urlRouterProvider) {
		console.log('routes.js - called');
		
		var navigation = {
			templateUrl: 'partials/navigation.html',
			controller: 'navigationController'
		};

		$stateProvider
		.state('application-log', {
			url: '/app-log/:organizationId/applications/:applicationId/instances/:instanceId/:fileName',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/application/log.html',
					controller: 'appLogController'
				}
			}
		})
		.state('application-settings', {
			url: '/app-settings/:organizationId/applications/:applicationId',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/application/settings.html',
					controller: 'appSettingsController'
				}
			}
		})
		.state('app-spaces', {
			url: '/app-spaces/:organizationId',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/space/application-spaces.html',
					controller: 'appSpacesController'
				}
			}
		})
		.state('space-settings', {
			url: '/space-settings/:organizationId/spaces/:spaceId',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/space/settings.html',
					controller: 'spaceController'
				}
			}
		})
		.state('create-space', {
			url: '/create-space/:organizationId',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/space/create-space.html',
					controller: 'spaceController'
				}
			}
		})
		.state('create-organisation', {
			url: '/create-org/:organizationId',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/organisation/create.html',
					controller: 'organisationController'
				}
			}			
		})
		.state('organisation-settings', {
			url: '/org-settings/:organizationId',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/organisation/settings.html',
					controller: 'organisationController'
				}
			}	
		})
		.state('users', {
			url: '/users/:organizationId',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/organisation/users.html',
					controller: 'usersController'
				}
			}
		})		
		.state('create-user', {
			url: '/organization/:organizationId/users',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/organisation/create-user.html',
					controller: 'organisationUserController'
				}
			}
		})
		.state('marketplace', {
			url: '/marketplace/:organizationId',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/marketplace/marketplace.html',
					controller: 'marketPlaceController'	
				}
			}			
		})
		.state('userinfo', {
			url: '/userinfo/:organizationId',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/user/user-info.html',
					controller: 'userInfoController'
				}
			}
		})
		.state('login', {
			url: '/login',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/user/login.html',
					controller: 'loginController'
				}
			}
		})
		.state('register', {
			url: '/register',
			views: {
				'navigation': navigation,
				'body': {
					templateUrl: 'partials/user/register.html',
					controller: 'registerController'
				}
			}
		});
	}]);
});
