angular.module( 'orderCloud.dashboard', [] )

	.config( DashboardConfig )
	.controller( 'DashboardCtrl', DashboardController )

;

function DashboardConfig( $stateProvider ) {
	$stateProvider.state( 'base.dashboard', {
		url: '/dashboard',
		templateUrl:'dashboard/templates/dashboard.tpl.html',
		controller:'DashboardCtrl',
		controllerAs: 'dashboard',
		data:{ pageTitle: 'Dashboard' }
	});
}

function DashboardController( ) {
	var vm = this;
}
