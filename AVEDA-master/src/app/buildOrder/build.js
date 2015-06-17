angular.module( 'orderCloud.buildOrder', [] )

	.config( BuildConfig )
	.controller( 'BuildCtrl', BuildController )

;

function BuildConfig( $stateProvider ) {
	$stateProvider.state( 'base.build', {
		url: '/build',
		templateUrl:'build/templates/build.tpl.html',
		controller:'BuildCtrl',
		controllerAs: 'build',
		views: {
			'': {
				templateUrl:'buildOrder/templates/build.tpl.html',
				controller:'BuildCtrl',
				controllerAs: 'build'
			},
			'top@base': {
				templateUrl: 'buildOrder/templates/build.top.tpl.html'
			},
			'left@base': {
				templateUrl: 'buildOrder/templates/build.left.tpl.html'
			},
			'right@base': {
				templateUrl: 'buildOrder/templates/build.right.tpl.html'
			},
			'bottom@base': {
				templateUrl: 'buildOrder/templates/build.bottom.tpl.html'
			}
		},
		data:{ pageTitle: 'Build' }
	});
}

function BuildController( ) {}
