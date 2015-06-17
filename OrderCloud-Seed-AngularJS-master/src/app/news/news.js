angular.module( 'orderCloud.news', [] )

	.config( NewsConfig )
	.factory('NewsService', NewsService)
	.controller( 'NewsListCtrl', NewsListController )
	.controller( 'NewsDetailCtrl', NewsDetailController )
	.directive( 'newsWidget', NewsWidgetDirective )
	.controller( 'NewsWidgetCtrl', NewsWidgetController )
	.directive( 'recentNews', RecentNewsDirective )
	.controller( 'RecentNewsCtrl', RecentNewsController )
;

function NewsConfig( $stateProvider ) {
	$stateProvider
		.state( 'base.news', {
			url: '/news',
			data:{ pageTitle: 'Administer News' },
			views: {
				'' : {
					template: '<article id="News" ui-view am-layout="vertical" am-padding></article>'
				},
				'@base.news': {
					templateUrl: 'news/templates/news.list.tpl.html',
					resolve: {
						NewsArticles: function( NewsService ) {
							return NewsService.List().catch(function(message) {
								return true;
							});
						}
					},
					controller: 'NewsListCtrl',
					controllerAs: 'newsList'
				}
			}
		})
		.state( 'base.news.detail', {
			url: '/:id',
			templateUrl:'news/templates/news.detail.tpl.html',
			controller:'NewsDetailCtrl',
			controllerAs:'newsDetail',
			resolve: {
				NewsItem: function( $state, $stateParams, NewsService ) {
					return NewsService.Get($stateParams.id)
						.then(function(article) {
							return article;
						})
						.catch(function() {
							$state.go('base.news.list');
						})
				}
			}
		})
	;
}

function NewsService( $q, UserFields ) {
	var service = {
		Get: _get,
		List: _list,
		Recent: _recent
	};

	function _get(id) {
		var deferred = $q.defer();
		UserFields.Get(id).then(function(f) {
			f.Article = JSON.parse(f.DefaultValue);
			deferred.resolve(f);
		}).catch(function() {
			deferred.reject( 'Article Not Found.' );
		});
		return deferred.promise;
	}

	function _list() {
		var deferred = $q.defer(),
			articles = [];

		UserFields.List('News', 1, 100).then( function(fields) {
			angular.forEach(fields.Items, function(f) {
				if (f.ID.indexOf('News') == 0) {
					f.Article = JSON.parse(f.DefaultValue);
					articles.push(f);
				}
			});
			if (articles.length) {
				deferred.resolve(articles);
			} else {
				deferred.reject('No Articles Found');
			}
		});
		return deferred.promise;
	}

	function _recent() {
		var deferred = $q.defer();
		var count = 0;
		var timeNow = new Date();
		var recent = new Date(timeNow.setDate(timeNow.getDate()-7));

		_list().then(function(articles) {
			angular.forEach(articles, function(item) {
				var articleDate = new Date(item.Article.Timestamp);
				if (articleDate > recent) {
					count++;
				}
			});
			if (count) {
				deferred.resolve(count);
			} else {
				deferred.reject("No recent articles");
			}
		}).catch(function() {
			deferred.reject("No articles found");
		});

		return deferred.promise;
	}

	return service;
}

function NewsListController( NewsArticles ) {
	var vm = this;
	vm.articles = NewsArticles;
}

function NewsDetailController( NewsItem ) {
	var vm = this;
	vm.item = NewsItem;
}

function NewsWidgetDirective( ) {
	var directive = {
		restrict: 'E',
		templateUrl:'news/templates/news.widget.tpl.html',
		controller: 'NewsWidgetCtrl',
		controllerAs: 'newsWidget',
		replace:true
	};

	return directive;
}

function NewsWidgetController( NewsService ) {
	var vm = this;
	NewsService.List()
		.then(function (NewsArticles) {
			vm.articles = NewsArticles;
		})
		.catch(function () {

		})
	;
}

function RecentNewsDirective( ) {
	var directive = {
		restrict: 'E',
		controller: 'RecentNewsCtrl',
		controllerAs: 'recentNews',
		template: "<span ng-show='recentNews.count'>{{recentNews.count}}</span>"
	};

	return directive;
}

function RecentNewsController(NewsService) {
	var vm = this;

	NewsService.Recent()
		.then(function(count) {
			vm.count = count;
		})
		.catch(function() {
			vm.count = 0;
		})
	;
}