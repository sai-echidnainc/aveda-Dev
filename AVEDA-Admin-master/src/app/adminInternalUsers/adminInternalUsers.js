angular.module( 'orderCloud.adminInternalUsers', [] )

    .config( AdminInternalUsersConfig )
    .factory( 'AdminScopeListService', AdminScopeListService )
    .factory('AdminInternalUsersService', AdminInternalUsersService)
    .factory('AdminCRUDInternalUsersService', AdminCRUDInternalUsersService)
    .controller( 'AdminInternalUsersCtrl', AdminInternalUsersController )
    .controller( 'AdminCreateInternalUsersCtrl', AdminCreateInternalUsersController )
    .controller( 'AdminEditInternalUserCtrl', AdminEditInternalUserController )
;

function AdminInternalUsersConfig( $stateProvider ) {
    $stateProvider
        .state( 'base.adminInternalUsers', {
            url: '/internal-users/:accessLevel',
            data:{ pageTitle: 'Administer Internal Users' },

            views: {
                '': {
                    template: '<article id="AdminInternalUsers" ui-view am-layout="vertical"></article>'
                },
                '@base.adminInternalUsers': {
                    templateUrl:'adminInternalUsers/templates/adminInternalUsers.tpl.html',
                    controller:'AdminInternalUsersCtrl',
                    controllerAs: 'adminInternalUsers',
                    resolve: {
                        UserList: function( $stateParams, AdminInternalUsersService ) {
                            //If no access level was defined... use CSR
                            $stateParams.accessLevel = $stateParams.accessLevel ? $stateParams.accessLevel : 'CSR';
                            return AdminInternalUsersService.ListUsers($stateParams.accessLevel)
                                .then(function(users){
                                    return users;
                                })
                                .catch(function(){
                                    //
                                })
                        }
                    }
                }
            }
        })
        .state( 'base.adminInternalUsers.create', {
            url: '/create',
            templateUrl:'adminInternalUsers/templates/adminInternalUsers.create.tpl.html',
            controller:'AdminCreateInternalUsersCtrl',
            controllerAs: 'adminCreateInternalUsers',
            resolve: {
                AvedaSalons: function( AvedaSalonsService ) {
                    return AvedaSalonsService.GetAvedaSalons()
                        .then(function(salons) {
                            return salons;
                        })
                        .catch(function() {
                            //
                        })
                },
                AccessLevelData: function( $state, $stateParams, AdminScopeListService, AvedaSalons ) {
                    switch($stateParams.accessLevel) {
                        case 'CSR':
                            return true;
                        case 'RegionVP':
                            return resolveRegionList(AdminScopeListService, AvedaSalons);
                        case 'POD':
                            return resolvePODList(AdminScopeListService, AvedaSalons);
                        case 'SDP':
                            return resolveSDPList( $state, AdminScopeListService, AvedaSalons );
                        default:
                            return false;
                    }
                }
            }
        })
        .state( 'base.adminInternalUsers.edit', {
            url: '/edit/:id',
            templateUrl:'adminInternalUsers/templates/adminInternalUsers.edit.tpl.html',
            controller:'AdminEditInternalUserCtrl',
            controllerAs: 'adminEditInternalUser',
            resolve: {
                SelectedUser: function( $stateParams, Users ) {
                    return Users.Get("AvedaBuyer", $stateParams.id)
                        .then(function(user){
                            return user;
                        })
                        .catch(function(){
                            //
                        })
                },
                AvedaSalons: function( AvedaSalonsService ) {
                    return AvedaSalonsService.GetAvedaSalons()
                        .then(function(salons) {
                            return salons;
                        })
                        .catch(function() {
                            //
                        })
                },
                AccessLevelData: function( $state, $stateParams, AdminScopeListService, AvedaSalons ) {
                    switch($stateParams.accessLevel) {
                        case 'CSR':
                            return true;
                        case 'RegionVP':
                            return resolveRegionList(AdminScopeListService, AvedaSalons);
                        case 'POD':
                            return resolvePODList(AdminScopeListService, AvedaSalons);
                        case 'SDP':
                            return true;
                        default:
                            return false;
                    }
                }
            }
        })
}

function resolveRegionList( AdminScopeListService, AvedaSalons ) {
    return AdminScopeListService.GetRegionList(AvedaSalons)
        .then(function(regions) {
            return regions;
        })
        .catch(function() {
            //
        })
}

function resolvePODList( AdminScopeListService, AvedaSalons ) {
    return AdminScopeListService.GetPODList(AvedaSalons)
        .then(function(pods) {
            return pods;
        })
        .catch(function() {
            //
        })
}

function resolveSDPList( $state, AdminScopeListService, AvedaSalons ) {
    return AdminScopeListService.GetAvailableSDPList(AvedaSalons)
        .then(function(spds) {
            return spds;
        })
        .catch(function(message) {
            $state.go('base.adminInternalUsers');
        })
}

function AdminScopeListService( $q, UserGroups, Users, AdminInternalUsersService ) {
    var service = {
        GetRegionList: _getRegionList,
        GetPODList: _getPODList,
        GetAvailableSDPList: _getAvailableSDPList
    };

    function _assignRegionVPToRegion(user, regionID) {
        var deferred = $q.defer();

        var queue = [];
        angular.forEach(avedaSalons, function(salon) {
            if (regionID == salon.Hierarchy.RegionID.toString()) {
                var assignment = {
                    "userGroupID": salon.ID,
                    "userID": user.ID,
                    "buyerID": "AvedaBuyer"
                };
                queue.push((function() {
                    var d = $q.defer();
                    UserGroups.SaveMemberAssignment("AvedaBuyer",assignment).then(function() {
                        d.resolve();
                    });
                    return d.promise;
                })());
            }
        });

        $q.all(queue).then(function() {
            deferred.resolve(user);
        });

        return deferred.promise;
    }

    function _removeRegionVPFromRegion(user, regionID) {
        var deferred = $q.defer();

        var queue = [];
        angular.forEach(avedaSalons, function(salon) {
            if (regionID == salon.Hierarchy.RegionID.toString()) {
                queue.push((function() {
                    var d = $q.defer();
                    UserGroups.DeleteMemberAssignment("AvedaBuyer", salon.ID, user.ID).then(function() {
                        d.resolve();
                    });
                    return d.promise;
                })());
            }
        });

        $q.all(queue).then(function() {
            deferred.resolve(user);
        });

        return deferred.promise;
    }

    function _getRegionList(salons) {
        var deferred = $q.defer();
        //TODO: how are we using regions here?  if at all? - Well, someone switched around regions and regionIDList - regionIDList simply tells us which ones have been found so we don't duplicate
        var regions = [];
        var regionIDList = [];
        angular.forEach(salons, function(salon) {
            if (regionIDList.indexOf(salon.Hierarchy.RegionID) == -1) {
                regionIDList.push(salon.Hierarchy.RegionID);
                regions.push({ID: salon.Hierarchy.RegionID, Name: salon.Hierarchy.RegionName});
            }
        });
        deferred.resolve(regions);
        return deferred.promise;
    }

    function _getPODList(salons) {
        var deferred = $q.defer();

        var PODs = [];
        var PODIDList = [];
        angular.forEach(salons, function(salon) {
            if (PODIDList.indexOf(salon.Hierarchy.PODID) == -1) {
                PODIDList.push(salon.Hierarchy.PODID);
                PODs.push({ID: salon.Hierarchy.PODID, Name: salon.Hierarchy.PODName});
            }
        });
        deferred.resolve(PODs);
        return deferred.promise;
    }

    function _getAvailableSDPList(salons) {
        var deferred = $q.defer();

        AdminInternalUsersService.ListUsers('SDP').then(function(sdps) {
            var existingSDPIDs = [];
            angular.forEach(sdps, function(sdp) {
                existingSDPIDs.push(sdp.ID.replace('SDP-', ''));
            });

            var availableSPDs = [];
            var availableSPDIDList = [];
            angular.forEach(salons, function(salon) {
                if (availableSPDIDList.indexOf(salon.Hierarchy.SalesPersonID) == -1 && existingSDPIDs.indexOf(salon.Hierarchy.SalesPersonID.toString()) == -1) {
                    availableSPDIDList.push(salon.Hierarchy.SalesPersonID);
                    availableSPDs.push({ID: salon.Hierarchy.SalesPersonID, Name: salon.Hierarchy.SalesPersonName});
                }
            });
            if (availableSPDs.length) {
                deferred.resolve(availableSPDs);
            } else {
                deferred.reject('All SDP Users have been created');
            }
        });

        return deferred.promise;
    }

    return service;
}

function AdminInternalUsersService( $q, Users ) {
    var service = {
        ListUsers: _listUsers
    };

    //TODO: We'll want to cache these lists by accessLevel so we can pull a list out if it's already been gotten or doesn't need to be updated
    function _listUsers(accessLevel) {
        var deferred = $q.defer(),
            users = [],
            pageCount = 1,
            prefix = accessLevel + '-';

        function gatherUsers() {
            Users.List("AvedaBuyer", prefix, pageCount, 100).then(function(data) {
                users = users.concat(data.Items);
                if (data.Meta.TotalPages > data.Meta.Page) {
                    pageCount++;
                    gatherUsers();
                } else {
                    deferred.resolve(users);
                }
            });
        }

        gatherUsers();

        return deferred.promise;
    }

    return service;
}

function AdminCRUDInternalUsersService( $q, UserGroups, Users, AvedaSalonsService ) {
    var service = {
        CreateNewUser: _createNewUser,
        UpdateUser: _updateUser,
        DeleteUser: _deleteUser
    };

    var avedaSalons;
    AvedaSalonsService.GetAvedaSalons().then(function(salons) {
        avedaSalons = salons;
    });

    function _createNewUser(user) {
        var deferred = $q.defer();

        user.ID = user.AccessLevel + '-' + (user.AccessLevel != 'SDP' ? randomString() : user.SDPChoice.ID);

        if (user.AccessLevel == 'SDP') {
            user.FirstName = user.SDPChoice.Name.split(' ')[0];
            user.LastName = user.SDPChoice.Name.split(' ')[1];
        }

        Users.Create("AvedaBuyer", user)
            .then(setUserPassword)
            .catch(function(ex) {
                deferred.reject(ex);
            });

        function setUserPassword(u) {
            Users.ChangePassword("AvedaBuyer", u.ID, user.Password)
                .then(setAccessLevel(u));
        }

        function setAccessLevel(u) {
            Users.SetUserFieldValue("AvedaBuyer", u.ID, "AccessLevel", user.AccessLevel)
                .then(setUserScope(u));
        }

        function setUserScope(u) {
            if (['RegionVP', 'POD'].indexOf(user.AccessLevel) == -1) return assignToSalons(u);

            var assignedString =  JSON.stringify(user[user.AccessLevel == 'RegionVP' ? 'Regions' : 'PODs']);
            Users.SetUserFieldValue("AvedaBuyer", u.ID, (user.AccessLevel == 'RegionVP' ? 'Regions' : 'PODs'), assignedString)
                .then(assignToSalons(u));
        }

        function assignToSalons(u) {
            var queue = [];

            angular.forEach(avedaSalons, function(salon) {
                var assignToSalon = function() {
                    var assignment = {
                        "userGroupID": salon.ID,
                        "userID": u.ID,
                        "buyerID": "AvedaBuyer"
                    };
                    queue.push((function() {
                        var d = $q.defer();
                        UserGroups.SaveMemberAssignment("AvedaBuyer",assignment).then(function() {
                            d.resolve();
                        });
                        return d.promise;
                    })());
                };
                if (user.AccessLevel == 'CSR') {
                    assignToSalon();
                } else if (user.AccessLevel == "RegionVP" && (user.Regions.indexOf(salon.Hierarchy.RegionID.toString()) > -1)) {
                    assignToSalon();
                } else if (user.AccessLevel == "POD" && (user.PODs.indexOf(salon.Hierarchy.PODID.toString()) > -1)) {
                    assignToSalon();
                } else if (user.AccessLevel == "SDP" && (user.ID.indexOf(salon.Hierarchy.SalesPersonID.toString()) > -1)) {
                    assignToSalon();
                }
            });

            $q.all(queue).then(function() {
                deferred.resolve(u);
            });
        }

        return deferred.promise;
    }

    function _updateUser(user) {
        var deferred = $q.defer();

        user.ID = user.AccessLevel + '-' + (user.AccessLevel != 'SDP' ? randomString() : user.SDPChoice.ID);

        if (user.AccessLevel == 'SDP') {
            user.FirstName = user.SDPChoice.Name.split(' ')[0];
            user.LastName = user.SDPChoice.Name.split(' ')[1];
        }

        Users.Update("AvedaBuyer", user)
            .then(setUserScope)
            .catch(function(ex) {
                deferred.reject(ex);
            });

        function setUserScope(u) {
            if (['RegionVP', 'POD'].indexOf(user.AccessLevel) == -1) return continueFn();

            function continueFn() {
                var deferred = $q.defer();

                deferred.resolve(u);

                return deferred.promise;
            }

            var assignedString =  JSON.stringify(user[user.AccessLevel == 'RegionVP' ? 'Regions' : 'PODs']);
            Users.SetUserFieldValue("AvedaBuyer", u.ID, (user.AccessLevel == 'RegionVP' ? 'Regions' : 'PODs'), assignedString)
                .then(assignToSalons(u));
        }

        function assignToSalons(u) {
            var queue = [];

            angular.forEach(avedaSalons, function(salon) {
                var assignToSalon = function() {
                    var assignment = {
                        "userGroupID": salon.ID,
                        "userID": u.ID,
                        "buyerID": "AvedaBuyer"
                    };
                    queue.push((function() {
                        var d = $q.defer();
                        UserGroups.SaveMemberAssignment("AvedaBuyer",assignment).then(function() {
                            d.resolve();
                        });
                        return d.promise;
                    })());
                };
                if (user.AccessLevel == 'CSR') {
                    assignToSalon();
                } else if (user.AccessLevel == "RegionVP" && (user.Regions.indexOf(salon.Hierarchy.RegionID.toString()) > -1)) {
                    assignToSalon();
                } else if (user.AccessLevel == "POD" && (user.PODs.indexOf(salon.Hierarchy.PODID.toString()) > -1)) {
                    assignToSalon();
                } else if (user.AccessLevel == "SDP" && (user.ID.indexOf(salon.Hierarchy.SalesPersonID.toString()) > -1)) {
                    assignToSalon((user.ID.indexOf(salon.Hierarchy.SalesPersonID.toString()) > -1));
                } else if (user.Groups.indexOf(salon.ID) > -1) {
                    queue.push((function() {
                        var d = $q.defer();
                        UserGroups.DeleteMemberAssignment("AvedaBuyer", salon.ID, user.ID).then(function() {
                            d.resolve();
                        });
                        return d.promise;
                    })());
                }
            });

            $q.all(queue).then(function() {
                deferred.resolve(u);
            });
        }

        return deferred.promise;
    }

    function _deleteUser(userID) {
        return Users.Delete("AvedaBuyer", userID);
    }

    function _assignRegionVPToRegion(user, regionID) {
        var deferred = $q.defer();

        var queue = [];
        angular.forEach(avedaSalons, function(salon) {
            if (regionID == salon.Hierarchy.RegionID.toString()) {
                var assignment = {
                    "userGroupID": salon.ID,
                    "userID": user.ID,
                    "buyerID": "AvedaBuyer"
                };
                queue.push((function() {
                    var d = $q.defer();
                    UserGroups.SaveMemberAssignment("AvedaBuyer",assignment).then(function() {
                        d.resolve();
                    });
                    return d.promise;
                })());
            }
        });

        $q.all(queue).then(function() {
            deferred.resolve(user);
        });

        return deferred.promise;
    }

    function _removeRegionVPFromRegion(user, regionID) {
        var deferred = $q.defer();

        var queue = [];
        angular.forEach(avedaSalons, function(salon) {
            if (regionID == salon.Hierarchy.RegionID.toString()) {
                queue.push((function() {
                    var d = $q.defer();
                    UserGroups.DeleteMemberAssignment("AvedaBuyer", salon.ID, user.ID).then(function() {
                        d.resolve();
                    });
                    return d.promise;
                })());
            }
        });

        $q.all(queue).then(function() {
            deferred.resolve(user);
        });

        return deferred.promise;
    }

    function randomString() {
        var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var string_length = 8;
        var randomstring = '';
        for (var i=0; i<string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum,rnum+1);
        }
        return randomstring;
    }

    return service;
}

function AdminInternalUsersController( $stateParams, UserList ) {
    var vm = this;
    vm.accessLevel = $stateParams.accessLevel;
    vm.userList = UserList;
}

function AdminCreateInternalUsersController( $state, $stateParams, AdminCRUDInternalUsersService, AccessLevelData ) {
    var vm = this;
    vm.accessLevel = $stateParams.accessLevel;
    vm.accessLevelData = AccessLevelData;

    function clearUser(accessLevel) {
        vm.newUser = {
            ID: null,
            UserName: null,
            FirstName: null,
            LastName: null,
            Email: null,
            Phone: null,
            Password: null,
            TermsAccepted: "0001-01-01T00:00:00",
            Active: true,
            AccessLevel: vm.accessLevel
        };
        switch(accessLevel) {
            case 'RegionVP':
                vm.newUser.Regions = [];
                break;
            case 'POD':
                vm.newUser.PODs = [];
                break;
            case 'SDP':
                vm.newUser.SDPChoice = null;
                break;
            default:
                break;
        }
    }
    clearUser(vm.accessLevel);

    vm.createNewUser = function() {
        AdminCRUDInternalUsersService.CreateNewUser(vm.newUser)
            .then(function() {
                $state.go('base.adminInternalUsers',{accessLevel: vm.accessLevel}, {reload:true});
            })
            .catch(function() {
                //
            })
        ;
    };
}

function AdminEditInternalUserController( $state, $stateParams, AdminCRUDInternalUsersService, AccessLevelData, SelectedUser ) {
    var vm = this;
    vm.accessLevel = $stateParams.accessLevel;
    vm.accessLevelData = AccessLevelData;

    vm.newUser = SelectedUser;
    switch(vm.accessLevel) {
        case 'RegionVP':
            vm.newUser.Regions = vm.newUser.UserFields.Regions;
            break;
        case 'POD':
            vm.newUser.PODs = vm.newUser.UserFields.PODs;
            break;
        case 'SDP':
            vm.newUser.SDPChoice = {ID: vm.newUser.ID.replace('SDP-', ''), Name: (vm.newUser.FirstName + ' ' + vm.newUser.LastName)};
            break;
        default:
            break;
    }

    vm.updateUser = function() {
        AdminCRUDInternalUsersService.UpdateUser(vm.newUser).then(function(u) {
            $state.go('base.adminInternalUsers', {}, {reload: true});
        })
    };

    vm.deleteUser = function() {
        AdminCRUDInternalUsersService.DeleteUser(vm.newUser.ID).then(function() {
            $state.go('base.adminInternalUsers', {}, {reload: true});
        });
    };
}