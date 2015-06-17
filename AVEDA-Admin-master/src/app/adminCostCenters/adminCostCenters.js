angular.module( 'orderCloud.adminCostCenters', [] )

    .config( AdminCostCentersConfig )
    .factory('AdminCostCentersService', AdminCostCentersService)
    .controller( 'AdminCostCentersListCtrl', AdminCostCentersListController )
    .controller( 'AdminCostCentersDetailCtrl', AdminCostCentersDetailController )
    .controller( 'AdminCostCentersCreateCtrl', AdminCostCentersCreateController )
;

function AdminCostCentersConfig( $stateProvider ) {
    $stateProvider
        .state( 'base.adminCostCenters', {
            url: '/costcenters',
            data:{ pageTitle: 'Administer Cost Centers' },
            views: {
                '': {
                    template: '<article id="AdminCostCenters" ui-view am-layout="vertical" am-padding></article>'
                },
                '@base.adminCostCenters': {
                    templateUrl: 'adminCostCenters/templates/adminCostCenters.list.tpl.html',
                    resolve: {
                        CostCentersList: function( AdminCostCentersService ) {
                            return AdminCostCentersService.List().catch(function(costcenters) {
                                return true;
                            });
                        }
                    },
                    controller: 'AdminCostCentersListCtrl',
                    controllerAs: 'adminCostCentersList'
                }
            }
        })
        .state( 'base.adminCostCenters.create', {
            url: '/create',
            templateUrl:'adminCostCenters/templates/adminCostCenters.create.tpl.html',
            controller: 'AdminCostCentersCreateCtrl',
            controllerAs: 'adminCostCentersCreate'
        })
        .state( 'base.adminCostCenters.detail', {
            url: '/:id',
            templateUrl:'adminCostCenters/templates/adminCostCenters.detail.tpl.html',
            controller:'AdminCostCentersDetailCtrl',
            controllerAs:'adminCostCentersDetail',
            resolve: {
                CostCenterDetail: function( $state, $stateParams, AdminCostCentersService ) {
                    return AdminCostCentersService.Get($stateParams.id)
                        .then(function(costcenter) {
                            return costcenter;
                        })
                        .catch(function() {
                            $state.go('base.adminCostCenters');
                        })
                }
            }
        })
    ;
}

function AdminCostCentersService($q, buyerid, CostCenters) {
    var service = {
        Get: _get,
        List: _list,
        Create: _create,
        Update: _update,
        Delete: _delete
    };

    function _get(id) {
        var deferred = $q.defer();
        CostCenters.Get(buyerid, id).then(function(cc) {
            deferred.resolve(cc);
        }).catch(function() {
            deferred.reject( 'Cost Center Not Found.' );
        });
        return deferred.promise;
    }

    function _list() {
        var deferred = $q.defer();

        CostCenters.List(buyerid, null, 1, 100).then( function(costCenters) {
            if (costCenters.Items && costCenters.Items.length) {
                deferred.resolve(costCenters.Items);
            } else {
                deferred.reject('No Cost Centers Found');
            }
        });
        return deferred.promise;
    }

    function _create(costCenter) {
        var deferred = $q.defer();

        CostCenters.Create(buyerid, costCenter).then(function(cc) {
            deferred.resolve(cc);
        }).catch(function(ex) {
            deferred.reject(ex)
        });
        return deferred.promise;
    }

    function _update(costCenter) {
        var deferred = $q.defer();

        CostCenters.Update(buyerid, costCenter).then(function(cc) {
            deferred.resolve(cc);
        }).catch(function(ex) {
            deferred.reject(ex);
        });
        return deferred.promise;
    }

    function _delete(costCenter) {
        return CostCenters.Delete(buyerid, costCenter.ID);
    }

    return service;
}

function AdminCostCentersListController(CostCentersList) {
    var vm = this;
    vm.costCenters = CostCentersList;
}

function AdminCostCentersDetailController($state, CostCenterDetail, AdminCostCentersService) {
    var vm = this;
    vm.editing = false;
    vm.costCenter = angular.copy(CostCenterDetail);

    vm.toggleEdit = function() {
        vm.costCenter = angular.copy(CostCenterDetail);
        vm.editing = !vm.editing;
    };

    vm.update = function() {
        AdminCostCentersService.Update( vm.costCenter ).then(function(data) {
            vm.costCenter = data;
            $state.reload();
        });
    };

    vm.delete = function() {
        AdminCostCentersService.Delete(vm.costCenter).then(function() {
            $state.go('base.adminCostCenters',{},{reload:true});
        });
    };
}

function AdminCostCentersCreateController($state, AdminCostCentersService) {
    var vm = this;
    vm.costCenter = {
        "ID": null,
        "Name": null,
        "Description": null
    };

    vm.submit = function() {
        AdminCostCentersService.Create(vm.costCenter).then(function(data) {
            $state.go('base.adminCostCenters.detail', {id: data.ID});
        });
    };
}