angular.module( 'orderCloud.avedaSalons', [] )

    .factory('AvedaSalonsService', AvedaSalonsService)
;

function AvedaSalonsService( $q, UserGroups ) {
    var service = {
        GetAvedaSalons: _getAvedaSalons
    };

    function _getAvedaSalons() {
        var deferred = $q.defer(),
            avedaSalons = [],
            pageCount = 1;

        function gatherAllSalons() {
            UserGroups.List("AvedaBuyer", "SoldTo-", pageCount, 100).then(function(data) {
                angular.forEach(data.Items, function (salon) {
                    salon.Hierarchy = JSON.parse(salon.Description);
                    avedaSalons.push(salon);
                });
                //as long as there are more pages of salons to load, recursively call gatherAllSalons after increasing pageCount
                if (data.Meta.TotalPages > data.Meta.Page) {
                    pageCount++;
                    gatherAllSalons();
                } else {
                    deferred.resolve(avedaSalons);
                }
            });
        }

        gatherAllSalons();

        return deferred.promise;
    }

    return service;
}