angular.module( 'orderCloud.login', [
	'ui.router'
])

	.config(LoginConfig)
	.controller( 'LoginCtrl', LoginController)

;

function LoginConfig( $stateProvider, $urlMatcherFactoryProvider ) {
	$urlMatcherFactoryProvider.strictMode(false);
	$stateProvider.state( 'login', {
		url: '/login',
		templateUrl: 'login/templates/login.tpl.html',
		controller: 'LoginCtrl',
		controllerAs: 'login',
		resolve: {
			isAuthenticated: function( Auth, $state ) {
				return Auth.IsAuthenticated()
					.then( function() {
						$state.go( 'base.dashboard' );
					})
					.catch( function() {
						return true;
					})
			}
		},
		data:{ pageTitle: 'Login' }
	});
}

function LoginController( $state, Users ) {
	var vm = this;
	vm.tab = 'login';

	vm.submit = function( creds ) {
		Users.Login( creds ).then(
			function() {
				$state.go( 'base.dashboard' );
			}).catch(function( ex ) {
				console.dir( ex );
			});
	};
	vm.setTab = function(tab) {
		vm.tab = tab;
	}
}
