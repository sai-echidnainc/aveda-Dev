angular.module('orderCloud.browse', [])

	.directive('avedaBrowse', avedaBrowseDirective)
	.controller('avedaBrowseCtrl', avedaBrowseController)
;

function avedaBrowseDirective() {
	var obj = {
		restrict:'E',
		templateUrl:'browse/templates/browse.directive.tpl.html',
		controller: 'avedaBrowseCtrl',
		controllerAs: 'browse',
		replace:true
	};
	return obj;
}

function avedaBrowseController() {
	var vm = this;

	vm.showSubs = function(cat) {
		if (cat.showSubs) cat.ShowSubs = true;
	};

	vm.categories = [
		{
			Name: 'Hair Care'
		},
		{
			Name: 'Styling',
			ShowSubs: false,
			Subs: [
				{
					Name:'Shampoo'
				},
				{
					Name:'Conditioner'
				},
				{
					Name:'Treatment'
				},
				{
					Name:'Styling'
				},
				{
					Name:'Men'
				},
				{
					Name:'Hair Color'
				},
				{
					Name:'Collections',
					ShowSubs: false,
					Subs: [
						{
							Name: 'invati'
						},
						{
							Name: 'dry remedy'
						},
						{
							Name: 'litres'
						},
						{
							Name: 'rosemary mint'
						},
						{
							Name: 'shampure'
						},
						{
							Name: 'smooth infusion'
						}
					]
				}
			]
		},
		{
			Name: 'Skin Care'
		},
		{
			Name: 'Body'
		},
		{
			Name: 'Men'
		},
		{
			Name: 'Make-up'
		},
		{
			Name: 'Purefume'
		},
		{
			Name: 'Gifts'
		},
		{
			Name: 'New'
		}
	];

}