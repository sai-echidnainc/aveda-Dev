angular.module( 'orderCloud.base', [
	'ui.router'
])

	.config(BaseConfig)
	.controller( 'BaseCtrl', BaseController)

;

function BaseConfig( $stateProvider ) {
	$stateProvider.state( 'base', {
		abstract: true,
		url: '',
		resolve: {
			isAuthenticated: function( Auth, $state ) {
				return Auth.IsAuthenticated().catch( function() {
						$state.go( 'login' );
					}
				);
			}
		},
		views: {
			'': {
				templateUrl: 'base/templates/base.tpl.html',
				controller: 'BaseCtrl',
				controllerAs: 'base'
			},
			'top@base': {
				templateUrl: 'base/templates/base.top.tpl.html'
			},
			'left@base': {
				templateUrl: 'base/templates/base.left.tpl.html'
			},
			'right@base': {
				templateUrl: 'base/templates/base.right.tpl.html'
			},
			'bottom@base': {
				templateUrl: 'base/templates/base.bottom.tpl.html'
			}
		}
	});
}

function BaseController( $state, Users ) {
	var vm = this;
	vm.swiped = 'none';
	vm.showMobileSearch = false;
	vm.searchType = 'Products';

	vm.searchTypes = [
		"Products",
		"Salons"
	];

	vm.setSearchType = function(type) {
		vm.searchType = type;
	};

	vm.drawers = {
		left: false,
		right: false
	};

	vm.onDropdownToggle = function() { //TODO: this isn't really working
		vm.showMobileSearch = false;
		vm.closeDrawers();
	};

	vm.toggleSearch = function() {
		vm.closeDrawers();
		vm.showMobileSearch = !vm.showMobileSearch;
	};

	vm.toggleDrawer = function(drawer) {
		vm.showMobileSearch = false;
		angular.forEach(vm.drawers, function(value, key) {
			if (key != drawer) vm.drawers[key] = false;
		});
		vm.drawers[drawer] = !vm.drawers[drawer];
	};

	vm.logout = function() {
		Users.Logout();
		$state.go( 'login' );
	};

	vm.closeDrawers = function() {
		angular.forEach(vm.drawers, function(value, key) {
			vm.drawers[key] = false;
		});
	}
}
