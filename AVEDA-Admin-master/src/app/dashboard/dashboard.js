angular.module( 'orderCloud.dashboard', [] )

	.config( DashboardConfig )
	.controller( 'DashboardCtrl', DashboardController )
	.factory( 'Hierarchy', HierarchyService)
;

function DashboardConfig( $stateProvider ) {
	$stateProvider.state( 'base.dashboard', {
		url: '/dashboard',
		templateUrl:'dashboard/templates/dashboard.tpl.html',
		controller:'DashboardCtrl',
		controllerAs: 'dashboard',
		data:{ pageTitle: 'Dashboard' }
	});
}

function DashboardController( $q, $timeout, Hierarchy, UserGroups, Users, Addresses, UserFields ) {
	var vm = this;
	vm.dropdown = false;

	vm.soldTos = Hierarchy.SoldTos();
	vm.UserFields = Hierarchy.UserFields();

	vm.createUserFields = function() {
		angular.forEach(vm.UserFields, function(field) {
			var field = {
				"DefaultValue": null,
				"Lines": 0,
				"Width": 0,
				"MaxLength": 1000,
				"MaskedInput": null,
				"ControlType": "Text",
				"ID": field,
				"ListOrder": 0,
				"Name": field,
				"Required": false,
				"DisplayToUser": false
			};
			UserFields.Create(field).then(function(result) {
				var assignment = {
					"BuyerID": "AvedaBuyer",
					"UserFieldID": result.ID
				};
				UserFields.SaveUserFieldAssignment(assignment);
			});
		});
	};

	vm.createCustomerGroup = function() {
		var group1 = {
			"ID": "CustomerGrp1-101",
			"Name": "CustomerGrp1-101",
			"Description": ""
		};
		var group2 = {
			"ID": "CustomerGrp1-107",
			"Name": "CustomerGrp1-107",
			"Description": ""
		};

		UserGroups.Create("AvedaBuyer", group1);
		UserGroups.Create("AvedaBuyer", group2);
	};

	vm.createBaseHierarchy = function() {
		console.log('Starting the hierarchy!');

		var index = 0;
		var soldToLength = vm.soldTos.length;

		function create() {
			var group = {
				"ID": vm.soldTos[index]["CustomerNumber-Sold-To"].toString(),
				"Name": vm.soldTos[index]["Name"],
				"Description": JSON.stringify(
					{
						RegionID: vm.soldTos[index]["RegionID"],
						RegionName: vm.soldTos[index]["RegionName"],
						PODID: vm.soldTos[index]["PODID"],
						PODName: vm.soldTos[index]["PODName"],
						SalesPersonID: vm.soldTos[index]["SDPID"],
						SalesPersonName: vm.soldTos[index]["SDPName"]
					}
				),
				"ReportingGroup": true
			};

			UserGroups.Create("AvedaBuyer", group).then(function(g) {
				createUser(g);
			});
		}

		function createUser(g) {
			var user = {
				"ID": vm.soldTos[index].ContactID.toString(),
				"Username": vm.soldTos[index].ContactID.toString(),
				"FirstName": vm.soldTos[index]["ContactPerson-FirstName"],
				"LastName": vm.soldTos[index]["ContactPerson-Name"],
				"Email": vm.soldTos[index]["E-Mail"],
				"Phone": vm.soldTos[index]["Telephone"],
				"TermsAccepted": "0001-01-01T00:00:00",
				"Active": true
			};

			Users.Create("AvedaBuyer", user).then(function(u) {
				assignUserToSalon(u, g);
			});
		}

		function assignUserToSalon(u, g) {
			var assignment = {
				"userGroupID": vm.soldTos[index]["CustomerNumber-Sold-To"].toString(),
				"userID": vm.soldTos[index].ContactID.toString(),
				"buyerID": "AvedaBuyer"
			};
			UserGroups.SaveMemberAssignment("AvedaBuyer", assignment).then(function(a) {
				assignUserToCustomerGroup(u, g);
			});
		}

		function assignUserToCustomerGroup(u, g) {
			var assignment = {
				"userGroupID": "CustomerGrp1-" + vm.soldTos[index].CustomerGrp1.toString(),
				"userID": vm.soldTos[index].ContactID.toString(),
				"buyerID": "AvedaBuyer"
			};
			UserGroups.SaveMemberAssignment("AvedaBuyer", assignment).then(function(a) {
				assignUserFields(u, g);
			});
		}

		function assignUserFields(u, g) {
			var queue = [];

			if (vm.soldTos[index]["SalesOrganization"]) queue.push({Field: "SalesOrganization", Value: vm.soldTos[index]["SalesOrganization"].toString()});
			if (vm.soldTos[index]["DistributionChannel"]) queue.push({Field: "DistributionChannel", Value: vm.soldTos[index]["DistributionChannel"].toString()});
			if (vm.soldTos[index]["Division"]) queue.push({Field: "Division", Value: vm.soldTos[index]["Division"].toString()});
			if (vm.soldTos[index]["SalonAdmin"]) queue.push({Field: "AccessLevel", Value: "SalonAdmin"});
			if (vm.soldTos[index]["CustomerGroup"]) queue.push({Field: "CustomerGroup", Value: vm.soldTos[index]["CustomerGroup"].toString()});
			if (vm.soldTos[index]["TermsOfPayment"]) queue.push({Field: "TermsOfPayment", Value: vm.soldTos[index]["TermsOfPayment"].toString()});
			if (vm.soldTos[index]["DeliveryPlant"]) queue.push({Field: "DeliveryPlant", Value: vm.soldTos[index]["DeliveryPlant"].toString()});
			if (vm.soldTos[index]["CustomerGrp2"]) queue.push({Field: "CustomerGroup2", Value: vm.soldTos[index]["CustomerGrp2"].toString()});
			if (vm.soldTos[index]["HeadOfficeTexts-ShippingNotes"]) queue.push({Field: "ShippingNotes", Value: vm.soldTos[index]["HeadOfficeTexts-ShippingNotes"].toString()});
			if (vm.soldTos[index]["Classification"]) queue.push({Field: "Classification", Value: vm.soldTos[index]["Classification"].toString()});

			function assignAll(fields) {
				var deferred = $q.defer();
				var promise = deferred.promise;

				function assignOne(data) {
					return function() {
						return Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), data.Field, data.Value);
					}
				}

				deferred.resolve();

				return fields.reduce(function(promise, event) {
					return promise.then(assignOne(event));
				}, promise);
			}

			assignAll(queue).then(function() {
				createSalonAddress(u, g);
			});

			/*queue.push((function() {
				var d = $q.defer();
				Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), "SalesOrganization", vm.soldTos[index]["SalesOrganization"].toString()).then(function() {
					d.resolve();
				});
				return d.promise;
			})());*/

			/*queue.push((function() {
				var d = $q.defer();
				Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), "DistributionChannel", vm.soldTos[index]["DistributionChannel"].toString()).then(function() {
					d.resolve();
				});
				return d.promise;
			})());*/

			/*queue.push((function() {
				var d = $q.defer();
				Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), "Division", vm.soldTos[index]["Division"].toString()).then(function() {
					d.resolve();
				});
				return d.promise;
			})());*/

			/*queue.push((function() {
				var d = $q.defer();
				Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), "AccessLevel", "SalonAdmin").then(function() {
					d.resolve();
				});
				return d.promise;
			})());*/

			/*queue.push((function() {
				var d = $q.defer();
				Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), "CustomerGroup", vm.soldTos[index]["CustomerGroup"].toString()).then(function() {
					d.resolve();
				});
				return d.promise;
			})());*/

			/*queue.push((function() {
				var d = $q.defer();
				Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), "TermsOfPayment", vm.soldTos[index]["TermsOfPayment"]).then(function() {
					d.resolve();
				});
				return d.promise;
			})());*/

			/*queue.push((function() {
				var d = $q.defer();
				Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), "DeliveryPlant", vm.soldTos[index]["DeliveryPlant"].toString()).then(function() {
					d.resolve();
				});
				return d.promise;
			})());*/

			/*if (vm.soldTos[index]["CustomerGrp2"]) {
				queue.push((function() {
					var d = $q.defer();
					Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), "CustomerGroup2", vm.soldTos[index]["CustomerGrp2"].toString()).then(function() {
						d.resolve();
					});
					return d.promise;
				})());
			}*/

			/*queue.push((function() {
				var d = $q.defer();
				Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), "ShippingNotes", vm.soldTos[index]["HeadOfficeTexts-ShippingNotes"]).then(function() {
					d.resolve();
				});
				return d.promise;
			})());*/

			/*queue.push((function() {
				var d = $q.defer();
				Users.SetUserFieldValue("AvedaBuyer", vm.soldTos[index].ContactID.toString(), "Classification", vm.soldTos[index]["Classification"]).then(function() {
					d.resolve();
				});
				return d.promise;
			})());*/

			/*$q.all(queue).then(function() {
				createSalonAddress(u, g);
			});*/
		}

		function createSalonAddress(u, g) {
			var address = {
				"ID": vm.soldTos[index]["CustomerNumber-Sold-To"].toString(),
				"AddressName": vm.soldTos[index]["Name"],
				"CompanyName": null,
				"FirstName": null,
				"LastName": null,
				"Street1": vm.soldTos[index]["Street/HouseNumber"],
				"Street2": vm.soldTos[index]["Suppl"],
				"City": vm.soldTos[index]["City"],
				"State": vm.soldTos[index]["Region"],
				"Zip": vm.soldTos[index]["PostalCode"].toString(),
				"Country": vm.soldTos[index]["Country"],
				"Phone": vm.soldTos[index]["Telephone"]
			};

			Addresses.Create("AvedaBuyer", address).then(function(add) {
				assignAddressToSalon(u, g, add);
			});
		}

		function assignAddressToSalon(u, g, add) {
			var addAssignment = {
				"BuyerID": "AvedaBuyer",
				"UserID": null,
				"UserGroupID": vm.soldTos[index]["CustomerNumber-Sold-To"].toString(),
				"AddressID": vm.soldTos[index]["CustomerNumber-Sold-To"].toString(),
				"IsShipping": (vm.soldTos[index]["CustomerNumber-Sold-To"].toString() == vm.soldTos[index]["PartnerFunction-Ship-ToID"].toString()),
				"IsBilling": true
			};
			Addresses.SaveAddressAssignment("AvedaBuyer", addAssignment).then(function(ass) {
				if (vm.soldTos[index]["CustomerNumber-Sold-To"].toString() != vm.soldTos[index]["PartnerFunction-Ship-ToID"].toString()) {
					createShipToAddress(u, g);
				}
				else if (vm.soldTos[index]["CustomerNumber-Sold-To"].toString() != vm.soldTos[index]["PartnerFunction-PayerID"].toString()) {
					createBillToAddress(u, g);
				}
				else {
					repeat();
				}
			});
		}

		function createShipToAddress(u, g) {
			var shipAddress = {
				"ID": vm.soldTos[index]["PartnerFunction-Ship-ToID"].toString(),
				"AddressName": vm.soldTos[index]["Ship-ToName"],
				"CompanyName": null,
				"FirstName": null,
				"LastName": null,
				"Street1": vm.soldTos[index]["Ship-ToStreetHouseNumber"],
				"Street2": vm.soldTos[index]["Ship-ToSuppl"],
				"City": vm.soldTos[index]["Ship-ToCity"],
				"State": vm.soldTos[index]["Ship-ToRegion"],
				"Zip": vm.soldTos[index]["Ship-ToPostalCode"].toString(),
				"Country": vm.soldTos[index]["Ship-ToCountry"],
				"Phone": null
			};

			Addresses.Create("AvedaBuyer", shipAddress).then(function(shipAdd) {
				assignShipAddressToSalon(u, g, shipAdd);
			});
		}

		function assignShipAddressToSalon(u, g, shipAdd) {
			var shipAddAssignment = {
				"BuyerID": "AvedaBuyer",
				"UserID": null,
				"UserGroupID": vm.soldTos[index]["CustomerNumber-Sold-To"].toString(),
				"AddressID": vm.soldTos[index]["PartnerFunction-Ship-ToID"].toString(),
				"IsShipping": true,
				"IsBilling": false
			};
			Addresses.SaveAddressAssignment("AvedaBuyer", shipAddAssignment).then(function(ass) {
				if (vm.soldTos[index]["CustomerNumber-Sold-To"].toString() != vm.soldTos[index]["PartnerFunction-PayerID"].toString()) {
					createBillToAddress(u, g);
				}
				else {
					repeat();
				}
			});
		}

		function createBillToAddress(u, g) {
			var billAddress = {
				"ID": vm.soldTos[index]["PartnerFunction-PayerID"].toString(),
				"AddressName": vm.soldTos[index]["PayerName"],
				"CompanyName": null,
				"FirstName": null,
				"LastName": null,
				"Street1": vm.soldTos[index]["PayerStreetHouseNumber"],
				"Street2": vm.soldTos[index]["PayerSuppl"],
				"City": vm.soldTos[index]["PayerCity"],
				"State": vm.soldTos[index]["PayerRegion"],
				"Zip": vm.soldTos[index]["PayerPostalCode"].toString(),
				"Country": vm.soldTos[index]["PayerCountry"],
				"Phone": null
			};

			Addresses.Create("AvedaBuyer", billAddress).then(function(billAdd) {
				assignBillAddressToSalon(u, g, billAdd);
			});
		}

		function assignBillAddressToSalon(u, g, billAdd) {
			var billAddAssignment = {
				"BuyerID": "AvedaBuyer",
				"UserID": null,
				"UserGroupID": vm.soldTos[index]["CustomerNumber-Sold-To"].toString(),
				"AddressID": vm.soldTos[index]["PartnerFunction-PayerID"].toString(),
				"IsShipping": false,
				"IsBilling": true
			};
			Addresses.SaveAddressAssignment("AvedaBuyer", billAddAssignment).then(function(ass) {
				repeat();
			});
		}

		function repeat() {
			index++;
			if (index < soldToLength) {
				create(index);
			}
		}

		create(index);
	};
}

function HierarchyService() {
	var service = {
		UserFields: _userFields,
		SoldTos: _soldTos
	};

	function _userFields() {
		var uf = [
			"SalesOrganization",
			"DistributionChannel",
			"Division",
			"AccessLevel",
			"CustomerGroup",
			"TermsOfPayment",
			"DeliveryPlant",
			"OrderBlockSelectedAreas",
			"OrderBlockAllAreas",
			"CustomerGroup2",
			"ShippingNotes",
			"Classification",
			"Regions",
			"PODs"
		];

		return uf;
	}

	function _soldTos() {
		var soldTos = [
			{
				"SalesOrganization": 1450,
				"DistributionChannel": 10,
				"Division": 21,
				"CustomerNumber-Sold-To": 102615,
				"Name": "Salon Mystique",
				"Street/HouseNumber": "10950 CLUB WEST PKWY",
				"Suppl": "STE 150",
				"City": "Blaine",
				"PostalCode": 55449,
				"Country": "US",
				"Region": "MN",
				"Telephone": "763-767-2548",
				"E-Mail": "blankemail@sample.com",
				"ContactID": 858,
				"ContactPerson-Name": "Nielson",
				"ContactPerson-FirstName": "Cheryl",
				"ContactPerson-Description": "Owner",
				"CustomerGroup": 41,
				"TermsOfPayment": "ZCRD",
				"DeliveryPlant": 1010,
				"OrderBlock-SelectedSalesArea": null,
				"OrderBlock-AllSalesAreas": null,
				"CustomerGrp1": 101,
				"CustomerGrp2": null,
				"HeadOfficeTexts-ShippingNotes": "Closed on Mondays",
				"Classification": "Concept",
				"PartnerFunction-PayerID": 102615,
				"PayerName": "Salon Mystique",
				"PayerStreetHouseNumber": "10950 CLUB WEST PKWY",
				"PayerSuppl": "STE 150",
				"PayerCity": "Blaine",
				"PayerPostalCode": 55449,
				"PayerCountry": "US",
				"PayerRegion": "MN",
				"PartnerFunction-Ship-ToID": 102615,
				"Ship-ToName": "Salon Mystique",
				"Ship-ToStreetHouseNumber": "10950 CLUB WEST PKWY",
				"Ship-ToSuppl": "STE 150",
				"Ship-ToCity": "Blaine",
				"Ship-ToPostalCode": 55449,
				"Ship-ToCountry": "US",
				"Ship-ToRegion": "MN",
				"SDPName": "Ryan Torkelson",
				"SDPID": 900498,
				"PODName": "ASI Metro & Dakotas",
				"PODID": 21148,
				"RegionName": "ASI - CENTRAL: Greater Midwest",
				"RegionID": 21050
			},
			{
				"SalesOrganization": 1450,
				"DistributionChannel": 10,
				"Division": 21,
				"CustomerNumber-Sold-To": 300023,
				"Name": "Juut Edina",
				"Street/HouseNumber": "2670 SOUTHDALE CTR",
				"Suppl": "",
				"City": "Edina",
				"PostalCode": 55435,
				"Country": "US",
				"Region": "MN",
				"Telephone": "952-952-4343",
				"E-Mail": "invoices@juut.com",
				"ContactID": 2450,
				"ContactPerson-Name": "Wagner",
				"ContactPerson-FirstName": "David",
				"ContactPerson-Description": "Owner",
				"CustomerGroup": 41,
				"TermsOfPayment": "ZA30",
				"DeliveryPlant": 1010,
				"OrderBlock-SelectedSalesArea": null,
				"OrderBlock-AllSalesAreas": null,
				"CustomerGrp1": 107,
				"CustomerGrp2": null,
				"HeadOfficeTexts-ShippingNotes": "",
				"Classification": "Lifestyle Salon",
				"PartnerFunction-PayerID": 600092,
				"PayerName": "Juut Salonspa",
				"PayerStreetHouseNumber": "310 GROVELAND AVE",
				"PayerSuppl": "",
				"PayerCity": "Minneapolis",
				"PayerPostalCode": 55403,
				"PayerCountry": "US",
				"PayerRegion": "MN",
				"PartnerFunction-Ship-ToID": 300023,
				"Ship-ToName": "Juut",
				"Ship-ToStreetHouseNumber": "2670 SOUTHDALE CTR",
				"Ship-ToSuppl": "",
				"Ship-ToCity": "Edina",
				"Ship-ToPostalCode": 55435,
				"Ship-ToCountry": "US",
				"Ship-ToRegion": "MN",
				"SDPName": "Wendy Heie",
				"SDPID": 900524,
				"PODName": "ASI Metro & Northern MN",
				"PODID": 21147,
				"RegionName": "ASI - CENTRAL: Greater Midwest",
				"RegionID": 21050
			},
			{
				"SalesOrganization": 1450,
				"DistributionChannel": 10,
				"Division": 21,
				"CustomerNumber-Sold-To": 315102,
				"Name": "Salon Del Sol - Franklin",
				"Street/HouseNumber": "2601 Franklin Rd SW",
				"Suppl": "",
				"City": "Roanoke",
				"PostalCode": 24014,
				"Country": "US",
				"Region": "VA",
				"Telephone": "540-387-1900",
				"E-Mail": "stevestorersds@gmail.com",
				"ContactID": 195590,
				"ContactPerson-Name": "Latham",
				"ContactPerson-FirstName": "Bob",
				"ContactPerson-Description": "Owner",
				"CustomerGroup": 41,
				"TermsOfPayment": "ZCOD",
				"DeliveryPlant": 1500,
				"OrderBlock-SelectedSalesArea": null,
				"OrderBlock-AllSalesAreas": null,
				"CustomerGrp1": 101,
				"CustomerGrp2": null,
				"HeadOfficeTexts-ShippingNotes": "",
				"Classification": "Lifestyle Salon",
				"PartnerFunction-PayerID": 600140,
				"PayerName": "Salon Del Sol",
				"PayerStreetHouseNumber": "3101 Northside Ave",
				"PayerSuppl": "",
				"PayerCity": "Richmond",
				"PayerPostalCode": 23228,
				"PayerCountry": "US",
				"PayerRegion": "VA",
				"PartnerFunction-Ship-ToID": 410848,
				"Ship-ToName": "Salon Del Sol",
				"Ship-ToStreetHouseNumber": "11619 BUSY ST",
				"Ship-ToSuppl": "",
				"Ship-ToCity": "North Chesterfield",
				"Ship-ToPostalCode": 23236,
				"Ship-ToCountry": "US",
				"Ship-ToRegion": "VA",
				"SDPName": "Desaree Wallace",
				"SDPID": 900696,
				"PODName": "ASI Mid Atlantic",
				"PODID": 21109,
				"RegionName": "ASI - EAST: Southeast",
				"RegionID": 21020
			},
			{
				"SalesOrganization": 1450,
				"DistributionChannel": 10,
				"Division": 21,
				"CustomerNumber-Sold-To": 137971,
				"Name": "Kinship Salon",
				"Street/HouseNumber": "253 Clement ST",
				"Suppl": "",
				"City": "San Francisco",
				"PostalCode": 94118,
				"Country": "US",
				"Region": "CA",
				"Telephone": "415-735-9300",
				"E-Mail": "kinshipsalon@gmail.com",
				"ContactID": 834194,
				"ContactPerson-Name": "Hsu",
				"ContactPerson-FirstName": "Jimmy",
				"ContactPerson-Description": "Co-Owner",
				"CustomerGroup": 41,
				"TermsOfPayment": "ZCRD",
				"DeliveryPlant": 1520,
				"OrderBlock-SelectedSalesArea": null,
				"OrderBlock-AllSalesAreas": null,
				"CustomerGrp1": 101,
				"CustomerGrp2": null,
				"HeadOfficeTexts-ShippingNotes": "",
				"Classification": "Exclusive",
				"PartnerFunction-PayerID": 137971,
				"PayerName": "Kinship Salon",
				"PayerStreetHouseNumber": "253 Clement ST",
				"PayerSuppl": "",
				"PayerCity": "San Francisco",
				"PayerPostalCode": 94118,
				"PayerCountry": "US",
				"PayerRegion": "CA",
				"PartnerFunction-Ship-ToID": 137971,
				"Ship-ToName": "Kinship Salon",
				"Ship-ToStreetHouseNumber": "253 Clement ST",
				"Ship-ToSuppl": "",
				"Ship-ToCity": "San Francisco",
				"Ship-ToPostalCode": 94118,
				"Ship-ToCountry": "US",
				"Ship-ToRegion": "CA",
				"SDPName": "Alice Chin",
				"SDPID": 900356,
				"PODName": "ASI Northern CA",
				"PODID": 21160,
				"RegionName": "ASI - WEST: Northwest",
				"RegionID": 21055
			},
			{
				"SalesOrganization": 1450,
				"DistributionChannel": 10,
				"Division": 21,
				"CustomerNumber-Sold-To": 101198,
				"Name": "Barberia",
				"Street/HouseNumber": "939 Edgewater Blvd",
				"Suppl": "STE D",
				"City": "Foster City",
				"PostalCode": 94404,
				"Country": "US",
				"Region": "CA",
				"Telephone": "650-349-2414",
				"E-Mail": "info@barberiasalon.com",
				"ContactID": 2522,
				"ContactPerson-Name": "Demarco",
				"ContactPerson-FirstName": "Terry",
				"ContactPerson-Description": "Owner",
				"CustomerGroup": 41,
				"TermsOfPayment": "ZCRD",
				"DeliveryPlant": 1520,
				"OrderBlock-SelectedSalesArea": null,
				"OrderBlock-AllSalesAreas": null,
				"CustomerGrp1": 101,
				"CustomerGrp2": 101,
				"HeadOfficeTexts-ShippingNotes": "",
				"Classification": "Family",
				"PartnerFunction-PayerID": 101198,
				"PayerName": "Barberia",
				"PayerStreetHouseNumber": "939 Edgewater Blvd",
				"PayerSuppl": "STE D",
				"PayerCity": "Foster City",
				"PayerPostalCode": 94404,
				"PayerCountry": "US",
				"PayerRegion": "CA",
				"PartnerFunction-Ship-ToID": 101198,
				"Ship-ToName": "Barberia",
				"Ship-ToStreetHouseNumber": "939 Edgewater Blvd",
				"Ship-ToSuppl": "STE D",
				"Ship-ToCity": "Foster City",
				"Ship-ToPostalCode": 94404,
				"Ship-ToCountry": "US",
				"Ship-ToRegion": "CA",
				"SDPName": "Alice Chin",
				"SDPID": 900356,
				"PODName": "ASI Northern CA",
				"PODID": 21160,
				"RegionName": "ASI Northern CA",
				"RegionID": 21055
			}
		];

		return soldTos;
	}

	return service;
}
