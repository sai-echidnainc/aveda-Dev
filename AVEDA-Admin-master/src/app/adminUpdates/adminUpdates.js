angular.module( 'orderCloud.adminUpdates', [] )

	.config( AdminUpdatesConfig )
	.factory('AdminUpdatesService', AdminUpdatesService)
	.controller( 'AdminUpdatesListCtrl', AdminUpdatesListController )
	.controller( 'AdminUpdatesDetailCtrl', AdminUpdatesDetailController )
	.controller( 'AdminUpdatesCreateCtrl', AdminUpdatesCreateController )
;

function AdminUpdatesConfig( $stateProvider ) {
	$stateProvider
		.state( 'base.adminUpdates', {
			url: '/updates',
			data:{ pageTitle: 'Administer Updates' },
			views: {
				'': {
					template: '<article id="AdminUpdates" ui-view am-layout="vertical" am-padding></article>'
				},
				'@base.adminUpdates': {
					templateUrl: 'adminUpdates/templates/adminUpdates.list.tpl.html',
					resolve: {
						UpdatesArticles: function( AdminUpdatesService ) {
							return AdminUpdatesService.List().catch(function(message) {
								return true;
							});
						}
					},
					controller: 'AdminUpdatesListCtrl',
					controllerAs: 'adminUpdatesList'
				}
			}
		})
		.state( 'base.adminUpdates.create', {
			url: '/create',
			templateUrl:'adminUpdates/templates/adminUpdates.create.tpl.html',
			controller: 'AdminUpdatesCreateCtrl',
			controllerAs: 'adminUpdatesCreate'
		})
		.state( 'base.adminUpdates.detail', {
			url: '/:id',
			templateUrl:'adminUpdates/templates/adminUpdates.detail.tpl.html',
			controller:'AdminUpdatesDetailCtrl',
			controllerAs:'adminUpdatesDetail',
			resolve: {
				UpdatesItem: function( $state, $stateParams, AdminUpdatesService ) {
					return AdminUpdatesService.Get($stateParams.id)
						.then(function(update) {
							return update;
						})
						.catch(function() {
							$state.go('base.adminUpdates');
						})
				}
			}
		})
	;
}

function AdminUpdatesService( $q, UserFields ) {
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
			f.Update = JSON.parse(f.DefaultValue);
			deferred.resolve(f);
		}).catch(function() {
			deferred.reject( 'Update Not Found.' );
		});
		return deferred.promise;
	}

	function _list() {
		var deferred = $q.defer(),
			updates = [];

		UserFields.List('Updates', 1, 100).then( function(fields) {
			angular.forEach(fields.Items, function(f) {
				if (f.ID.indexOf('Update') == 0) {
					f.Update = JSON.parse(f.DefaultValue);
					updates.push(f);
				}
			});
			if (updates.length) {
				deferred.resolve(updates);
			} else {
				deferred.reject('No Articles Found');
			}
		});
		return deferred.promise;
	}

	function _create(update) {
		var deferred = $q.defer();
		update.Timestamp = new Date();
		getNextID().then(function(nextID) {
			var field = {
				"DefaultValue": JSON.stringify(update),
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
			UserFields.Create(field).then(function(u) {
				deferred.resolve(u);
			}).catch(function(ex) {
				deferred.reject(ex);
			});
		});
		return deferred.promise;
	}

	function _update( item ) {
		var deferred = $q.defer();
		item.Update.Timestamp = new Date();
		item.DefaultValue = JSON.stringify(item.Update);

		UserFields.Update(item).then(function(data) {
			data.Update = JSON.parse(data.DefaultValue);
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
		var greatestID = "Updates00000";
		_list().then(function(updates) {
			angular.forEach(updates, function(update) {
				if (update.ID > greatestID) greatestID = update.ID;
			});
			var ID = 'Updates';
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

function AdminUpdatesListController( UpdatesArticles ) {
	var vm = this;
	vm.updates = UpdatesArticles;
}

function AdminUpdatesDetailController( $state, UpdatesItem, AdminUpdatesService ) {
	var vm = this;
	vm.editing = false;
	vm.item = angular.copy(UpdatesItem);

	vm.toggleEdit = function() {
		vm.item = angular.copy(UpdatesItem);
		vm.editing = !vm.editing;
	};

	vm.update = function( ) {
		AdminUpdatesService.Update( vm.item ).then(function(data) {
			vm.item = data;
			$state.reload();
		})
	};

	vm.delete = function( ) {
		AdminUpdatesService.Delete( vm.item).then(function() {
			$state.go('base.adminUpdates',{},{reload:true});
		})
	}
}

function AdminUpdatesCreateController( $state, AdminUpdatesService ) {
	var vm = this;
	vm.update = {
		/*Title:		null,*/
		Timestamp:	null,
		Body:		null
	};
	vm.submit = function() {
		AdminUpdatesService.Create( vm.update ).then(function(data) {
			$state.go('base.adminUpdates.detail', {id: data.ID})
		});
	}
}

