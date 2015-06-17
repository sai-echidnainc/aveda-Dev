angular.module( 'orderCloud.avedaUsers', [] )

    .factory('AvedaUsersService', AvedaUsersService)
;

function AvedaUsersService( $q, Users, UserGroups ) {
    var service = {
        GetUserDetails: _getUserDetails
    };

    function _getUserDetails(userID) {
        var deferred = $q.defer();

        Users.Get("AvedaBuyer", userID).then(function(user) {
            getUserFields(user);
        });

        function getUserFields(user) {
            Users.ListUserFields("AvedaBuyer", user.ID, 1, 100).then(function(data) {
                //user.UserFields = data.Items;
                user.Permissions = [];
                user.UserFields = {};
                angular.forEach(data.Items, function(item) {
                    if (item.Name.indexOf('Permission-') == 0) {
                        user.Permissions.push(item.Name.split('Permission-')[1]);
                    }
                    else if (item.Name == 'Regions' || item.Name == "PODs") {
                        user.UserFields[item.Name] = JSON.parse(item.Value);
                    }
                    else if (item.Value) {
                        user.UserFields[item.Name] = item.Value;
                    }
                });
                listAllSalonAssignments(user);
            });
        }

        function listAllSalonAssignments(user) {
            var pageCount = 1;
            user.Groups = [];

            function gatherAllSalonAssignments(user) {
                UserGroups.ListMemberAssignments("AvedaBuyer", user.ID, null, pageCount, 100).then(function(data) {
                    angular.forEach(data.Items, function (group) {
                        user.Groups.push(group.UserGroupID);
                    });
                    //as long as there are more pages of salons to load, recursively call gatherAllSalons after increasing pageCount
                    if (data.Meta.TotalPages > data.Meta.Page) {
                        pageCount++;
                        gatherAllSalonAssignments();
                    } else {
                        console.log(user);
                        deferred.resolve(user);
                    }
                });
            }
            gatherAllSalonAssignments(user);
        }

        return deferred.promise;
    }

    return service;
}