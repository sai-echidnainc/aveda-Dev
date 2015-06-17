angular.module( 'orderCloud', [
	'ngMaterial',
	'templates-app',
	'ngSanitize',
	'ngAnimate',
	'ngMessages',
	'ngTouch',
	'ui.router',
	'orderCloud.sdk',
	'orderCloud.base',
	'orderCloud.dashboard'
])

	.config( Routing )
	.config( ErrorHandling )
	.controller( 'AppCtrl', AppCtrl )
	.constant('ocscope', 'FullAccess')
	.constant('appname', 'OrderCloud')
	.directive('avedaLogo', avedaLogoDirective)
	.constant('authurl', 'https://testauth.ordercloud.io/oauth/token')
	.constant('apiurl', 'https://testapi.ordercloud.io/v1')
	.constant('clientid', '018ddfbd-aff8-413a-8518-f45fc774619b')
;

function AppCtrl( $scope ) {
	var vm = this;
	$scope.$on('$stateChangeSuccess', function( event, toState, toParams, fromState, fromParams ){
		if ( angular.isDefined( toState.data.pageTitle ) ) {
			vm.pageTitle = 'Aveda | ' + toState.data.pageTitle;
		}
	});
}

function avedaLogoDirective() {
	var template = ['<figure><h1 class="visuallyhidden">Aveda</h1>',
		'<svg version="1.1" id="AvedaLogo" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 348.1 72" enable-background="new 0 0 348.1 72" xml:space="preserve">',
			'<g fill="{{AvedaLogo.fillColor}}">',
				'<path d="M336.1,68.2l-23.2-46.8l-24.6,46.8h-12.2L312.8,0l35.4,68.2H336.1z M319.6,52.7c0-3.8-3.2-6.8-7-6.8c-3.9,0-7,3-7,6.8	c0,3.7,3.1,6.8,7,6.8C316.4,59.5,319.6,56.4,319.6,52.7z"/>',
				'<path d="M263.2,36.1c0,13.7-7.8,22.4-26.9,22.4H229V13h7.3C255.8,13,263.2,22,263.2,36.1z M273.8,36.1c0-20-10.7-32.9-38.2-32.9 h-18.7v65h18.7C262.1,68.2,273.8,55.6,273.8,36.1z"/>',
				'<polygon points="197.2,68.2 197.2,58.9 161.1,58.9 161.1,40.4 192.2,40.4 192.2,31.2 161.1,31.2 161.1,12.5 196.7,12.5 196.7,3.2 149.3,3.2 149.3,68.2"/>',
				'<polygon points="133.8,3.2 122.3,3.2 98.8,47.5 76,3.2 63.6,3.2 98.5,72"/>',
				'<path d="M59.9,68.1L36.7,21.3L12.2,68.1H0L36.7,0L72,68.1H59.9z M43.6,52.6c0-3.7-3.1-6.7-7-6.7c-3.9,0-7,3-7,6.7	c0,3.8,3.1,6.8,7,6.8C40.4,59.4,43.6,56.4,43.6,52.6z"/>',
			'</g>',
		'</svg></figure>'];
	var obj = {
		template: template.join(''),
		replace:true,
		link: function(scope, element, attrs) {
			scope.AvedaLogo = {
				'fillColor': attrs.color
			};
		}
	};
	return obj;
}
function Routing( $urlRouterProvider, $urlMatcherFactoryProvider ) {
	$urlMatcherFactoryProvider.strictMode(false);
	$urlRouterProvider.otherwise( '/dashboard' );
	//$locationProvider.html5Mode(true);
	//TODO: For HTML5 mode to work we need to always return index.html as the entry point on the serverside
}

function ErrorHandling( $provide ) {
	$provide.decorator('$exceptionHandler', handler );

	function handler( $delegate, $injector ) {
		return function $broadcastingExceptionHandler( ex, cause ) {
			ex.status != 500 ?
				$delegate( ex, cause ) :
				( function() {
					try {
						//TODO: implement track js
						console.log(JSON.stringify( ex ));
						//trackJs.error("API: " + JSON.stringify(ex));
					}
					catch ( ex ) {
						console.log(JSON.stringify( ex ));
					}
				})();
			$injector.get( '$rootScope' ).$broadcast( 'exception', ex, cause );
		}
	}
}