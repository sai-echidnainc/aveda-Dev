angular.module( 'orderCloud.adminSalons', [] )

    .config( AdminSalonsConfig )
    .factory('AdminSalonsService', AdminSalonsService)
    .controller( 'AdminSalonsCtrl', AdminSalonsController )
    .controller( 'AdminSalonsDetailCtrl', AdminSalonsDetailController )
    .controller( 'AdminSalonsCreateUserCtrl', AdminSalonsCreateUserController )
;

function AdminSalonsConfig( $stateProvider ) {
    $stateProvider
        .state( 'base.adminSalons', {
            url: '/manage-salons',
            data: { pageTitle: 'Administer Salons' },
            views: {
                '': {
                    template: '<article id="AdminSalons" ui-view am-layout="vertical"></article>'
                },
                '@base.adminSalons': {
                    templateUrl: 'adminSalons/templates/adminSalons.tpl.html',
                    controller: 'AdminSalonsCtrl',
                    controllerAs: 'adminSalons',
                    resolve: {
                        AvedaSalons: function( AvedaSalonsService ) {
                            return AvedaSalonsService.GetAvedaSalons()
                                .then(function(salons) {
                                    return salons;
                                })
                                .catch(function() {
                                    //
                                })
                        }
                    }
                }
            }
        })
        .state( 'base.adminSalons.detail', {
            url: '/:soldToID',
            templateUrl: 'adminSalons/templates/adminSalons.detail.tpl.html',
            controller: 'AdminSalonsDetailCtrl',
            controllerAs: 'adminSalonsDetail',
            resolve: {
                SalonDetail: function ( $stateParams, UserGroups ) {
                    return UserGroups.Get("AvedaBuyer", $stateParams.soldToID)
                        .then(function(salon) {
                            return salon;
                        })
                        .catch(function() {
                            //
                        })
                },
                SalonUsers: function ( $stateParams, AdminSalonsService, SalonDetail ) {
                    return AdminSalonsService.GetSalonUsers($stateParams.soldToID)
                        .then(function(salonUsers) {
                            return salonUsers;
                        })
                        .catch(function() {
                            //
                        })
                }
            }
        })
        .state( 'base.adminSalons.createSalonUser', {
            url: '/:soldToID/create-user',
            templateUrl: 'adminSalons/templates/adminSalons.create-user.tpl.html',
            controller: 'AdminSalonsCreateUserCtrl',
            controllerAs: 'adminSalonsCreateUser',
            resolve: {
                TemplateUser: function ( $stateParams, AdminSalonsService ) {
                    return AdminSalonsService.GetSalonTemplateUser($stateParams.soldToID)
                        .then(function(templateUser) {
                            return templateUser;
                        })
                        .catch(function() {
                            //
                        })
                }
            }
        })
    ;
}

function AdminSalonsService( $q, Users, UserGroups, AvedaUsersService) {
    var service = {
        GetSalonUsers: _getSalonUsers,
        GetSalonTemplateUser: _getTemplateUser,
        CreateNewSalonUser: _createNewSalonUser
    };

    function _getSalonUsers(salonID) {
        var deferred = $q.defer();

        var salonUsers = [];
        var queue = [];

        var pageCount = 1;
        function gatherAllSalonAssignments() {
            UserGroups.ListMemberAssignments("AvedaBuyer", null, salonID, pageCount, 100).then(function(data) {
                angular.forEach(data.Items, function (item) {
                    queue.push((function() {
                        var d = $q.defer();
                        AvedaUsersService.GetUserDetails(item.UserID).then(function(user) {
                            if (!user.UserFields.AccessLevel || user.UserFields.AccessLevel == 'Template' || user.UserFields.AccessLevel == 'SalonAdmin' || user.UserFields.AccessLevel == 'SalonStylist') {
                                salonUsers.push(user);
                            }
                            d.resolve();
                        });
                        return d.promise;
                    })());
                });
                if (data.Meta.TotalPages > data.Meta.Page) {
                    pageCount++;
                    gatherAllSalonAssignments();
                } else {
                    console.log();
                    $q.all(queue).then(function() {
                        deferred.resolve(salonUsers);
                    });
                }
            });
        }
        gatherAllSalonAssignments();

        return deferred.promise;
    }

    function _getTemplateUser(salonID) {
        var deferred = $q.defer();

        var templateUser;
        var queue = [];

        var pageCount = 1;
        function gatherAllSalonAssignments() {
            UserGroups.ListMemberAssignments("AvedaBuyer", null, salonID, pageCount, 100).then(function(data) {
                angular.forEach(data.Items, function (item) {
                    queue.push((function() {
                        var d = $q.defer();
                        AvedaUsersService.GetUserDetails(item.UserID).then(function(user) {
                            //TODO: remove the !user.UserFields.AccessLevel once the template users actually have AccessLevel
                            if (!user.UserFields.AccessLevel || user.UserFields.AccessLevel == 'Template') {
                                templateUser = user;
                            }
                            d.resolve();
                        });
                        return d.promise;
                    })());
                });
                if (data.Meta.TotalPages > data.Meta.Page) {
                    pageCount++;
                    gatherAllSalonAssignments();
                } else {
                    console.log();
                    $q.all(queue).then(function() {
                        deferred.resolve(templateUser);
                    });
                }
            });
        }
        gatherAllSalonAssignments();

        return deferred.promise;
    }

    function _createNewSalonUser(user) {
        var deferred = $q.defer();

        user.ID = user.AccessLevel + '-' + randomString();

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
                .then(assignToSalons(u));
        }

        function assignToSalons(u) {
            var assignment = {
                "userGroupID": user.SalonID,
                "userID": u.ID,
                "buyerID": "AvedaBuyer"
            };
            UserGroups.SaveMemberAssignment("AvedaBuyer",assignment).then(function() {
                deferred.resolve(u);
            })
        }

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

function AdminSalonsController( AvedaSalons ) {
    var vm = this;
    vm.salons = AvedaSalons;
}

function AdminSalonsDetailController( SalonDetail, SalonUsers ) {
    var vm = this;
    vm.salon = SalonDetail;
    vm.salonUsers = SalonUsers;
}

function AdminSalonsCreateUserController( $state, $stateParams, TemplateUser, AdminSalonsService ) {
    var vm = this;
    vm.templateUser = TemplateUser;

    vm.userTypes = [
        {
            Name:"Salon Admin",
            AccessLevel: "SalonAdmin"
        },
        {
            Name:"Salon Stylist",
            AccessLevel: "SalonStylist"
        }
    ];

    function clearUser() {
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
            AccessLevel: null,
            SalonID: $stateParams.soldToID
        };
    }
    clearUser();

    vm.createNewSalonUser = function() {
        AdminSalonsService.CreateNewSalonUser(vm.newUser).then(function(user) {
            $state.go('base.adminSalons.detail', {soldToID: $stateParams.soldToID}, {reload: true});
        });
    };
}