angular.module( 'orderCloud.promotions', [] )

	.config( PromotionsConfig )
	.controller( 'PromotionsCtrl', PromotionsController )
	.directive( 'promotionsWidget', PromotionsWidgetDirective)
;

function PromotionsConfig( $stateProvider ) {
	$stateProvider.state( 'base.promotions', {
		url: '/promotions',
		templateUrl:'promotions/templates/promotions.tpl.html',
		controller:'PromotionsCtrl',
		controllerAs: 'promotions',
		data:{ pageTitle: 'Promotions' }
	});
}

function PromotionsController( ) {}

function PromotionsWidgetDirective( ) {
	var obj = {
		controller: 'PromotionsCtrl',
		controllerAs: 'promotionsDirective',
		templateUrl: 'promotions/templates/promotions.widget.tpl.html',
		replace: true
	};
	return obj;
}