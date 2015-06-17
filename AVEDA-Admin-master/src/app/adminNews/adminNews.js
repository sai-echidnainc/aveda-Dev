angular.module( 'orderCloud.adminNews', []  )

	.config( AdminNewsConfig )
	.factory('AdminNewsService', AdminNewsService)
	.controller( 'AdminNewsListCtrl', AdminNewsListController )
	.controller( 'AdminNewsDetailCtrl', AdminNewsDetailController )
	.controller( 'AdminNewsCreateCtrl', AdminNewsCreateController )
;

function AdminNewsConfig( $stateProvider ) {
	$stateProvider
		.state( 'base.adminNews', {
			url: '/news',
			data:{ pageTitle: 'Administer News' },
			views: {
				'': {
					template: '<article id="AdminNews" ui-view am-layout="vertical" am-padding></article>'
				},
				'@base.adminNews': {
					templateUrl: 'adminNews/templates/adminNews.list.tpl.html',
					resolve: {
						NewsArticles: function( AdminNewsService ) {
							return AdminNewsService.List().catch(function(message) {
								return true;
							});
						}
					},
					controller: 'AdminNewsListCtrl',
					controllerAs: 'adminNewsList'
				}
			}
		})
		.state( 'base.adminNews.create', {
			url: '/create',
			templateUrl:'adminNews/templates/adminNews.create.tpl.html',
			controller: 'AdminNewsCreateCtrl',
			controllerAs: 'adminNewsCreate'
		})
		.state( 'base.adminNews.detail', {
			url: '/:id',
			templateUrl:'adminNews/templates/adminNews.detail.tpl.html',
			controller:'AdminNewsDetailCtrl',
			controllerAs:'adminNewsDetail',
			resolve: {
				NewsItem: function( $state, $stateParams, AdminNewsService ) {
					return AdminNewsService.Get($stateParams.id)
						.then(function(article) {
							return article;
						})
						.catch(function() {
							$state.go('base.adminNews');
						})
				}
			}
		})
	;
}

function AdminNewsService( $q, UserFields ) {
	var service = {
		Get: _get,
		List: _list,
		Create: _create,
		Update: _update,
		Delete: _delete
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

	function _create(article) {
		var deferred = $q.defer();
		article.Timestamp = new Date();
		getNextID().then(function(nextID) {
			var field = {
				"DefaultValue": JSON.stringify(article),
				"Lines": 0,
				"Width": 0,
				"MaxLength": 9999,
				"MaskedInput": null,
				"ControlType": "Text",
				"ID": nextID,
				"ListOrder": 0,
				"Name": nextID,
				"Label": nextID,
				"Required": false,
				"DisplayToUser": false
			};
			UserFields.Create(field).then(function(a) {
				deferred.resolve(a);
			}).catch(function(ex) {
				deferred.reject(ex);
			});
		});
		return deferred.promise;
	}

	function _update( item ) {
		var deferred = $q.defer();
		item.Article.Timestamp = new Date();
		item.DefaultValue = JSON.stringify(item.Article);

		UserFields.Update(item).then(function(data) {
			data.Article = JSON.parse(data.DefaultValue);
			deferred.resolve(data);
		}).catch(function(ex) {
			deferred.reject(ex);
		});

		return deferred.promise;
	}

	function _delete( item ) {
		return UserFields.Delete(item.ID);
	}

	function getNextID() {
		var deferred = $q.defer();
		var greatestID = "News00000";
		_list().then(function(articles) {
			angular.forEach(articles, function(article) {
				if (article.ID > greatestID) greatestID = article.ID;
			});
			var ID = 'News';
			var greatestIDNumber = +(greatestID.match(/\d+/)[0]);
			for (var i = 0; i < (5 - (greatestIDNumber.toString().length)); i++) {
				ID += '0';
			}
			ID += (greatestIDNumber + 1);
			deferred.resolve(ID);
		}).catch(function() {
			deferred.resolve(greatestID);
		});
		return deferred.promise;
	}

	return service;
}

function AdminNewsListController( NewsArticles ) {
	var vm = this;
	vm.articles = NewsArticles;
}

function AdminNewsDetailController( $state, NewsItem, AdminNewsService ) {
	var vm = this;
	vm.editing = false;
	vm.item = angular.copy(NewsItem);

	vm.toggleEdit = function() {
		vm.item = angular.copy(NewsItem);
		vm.editing = !vm.editing;
	};

	vm.update = function( ) {
		AdminNewsService.Update( vm.item ).then(function(data) {
			vm.item = data;
			$state.reload();
		});
	};

	vm.delete = function( ) {
		AdminNewsService.Delete( vm.item).then(function() {
			$state.go('base.adminNews',{},{reload:true});
		})
	}
}

function AdminNewsCreateController( $state, AdminNewsService ) {
	var vm = this;
	vm.article = {
		Title:		null,
		Timestamp:	null,
		Body:		null
	};
	vm.submit = function() {
		AdminNewsService.Create( vm.article ).then(function(data) {
			$state.go('base.adminNews.detail', {id: data.ID})
		});
	}
}

