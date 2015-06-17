angular.module( 'orderCloud.updates', [] )

    .factory( 'UrgentUpdatesService', UrgentUpdatesService)
    .directive( 'urgentUpdates', UrgentUpdatesDirective)
    .controller( 'UrgentUpdatesCtrl', UrgentUpdatesController)
;

function UrgentUpdatesService( $q, UserFields ) {
    var service = {
        List: _list
    };

    function _list() {
        var deferred = $q.defer(),
            updates = [];

        UserFields.List('Updates', 1, 100).then( function(fields) {
            angular.forEach(fields.Items, function(f) {
                if (f.ID.indexOf('Updates') == 0) {
                    f.Update = JSON.parse(f.DefaultValue);
                    updates.push(f);
                }
            });
            if (updates.length) {
                updates.sort(orderByDateDesc);
                deferred.resolve(updates);
            } else {
                deferred.reject('No Updates Found');
            }
        });
        return deferred.promise;
    }

    function orderByDateDesc(a,b) {
        if (a.Update.Timestamp > b.Update.Timestamp)
            return -1;
        if (a.Update.Timestamp < b.Update.Timestamp)
            return 1;
        return 0;
    }

    return service;
}

function UrgentUpdatesDirective() {
    var directive = {
        restrict: 'E',
        replace: true,
        controller: 'UrgentUpdatesCtrl',
        controllerAs: 'urgentUpdates',
        template: template()
    };

    function template() {
        return [
            '<div am-block="aveda-update" ng-show="urgentUpdates.updates">',
                '<div am-block="3"><p><b>URGENT UPDATE</b></p></div>',
                '<div am-block="9"><p>{{urgentUpdates.displayedUpdate.Body}}</p></div>',
            '</div>'
        ].join('');
    }

    return directive;
}

function UrgentUpdatesController( $timeout, UrgentUpdatesService ) {
    var vm = this;
    vm.displayedUpdate = "";
    vm.updateIndex = 0;

    UrgentUpdatesService.List()
        .then(function(updates) {
            vm.updates = updates;
            setDisplayedUpdate();
        })
        .catch(function() {
            vm.updates = null;
        })
    ;

    function setDisplayedUpdate() {
        function onTimeout() {
            vm.displayedUpdate = vm.updates[vm.updateIndex].Update;

            if (vm.updateIndex != (vm.updates.length -1)) {
                vm.updateIndex++;
            }
            else {
                vm.updateIndex = 0;
            }

            $timeout(onTimeout, 5000);
        }

        $timeout(onTimeout, 0);
    }
}