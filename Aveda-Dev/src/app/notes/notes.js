angular.module( 'orderCloud.notes', [] )

    .factory( 'NotesService', NotesService)
    .directive( 'notes', NotesDirective)
    .controller( 'NotesCtrl', NotesController)
;

function NotesService( $q, UserFields ) {
    var service = {
        List: _list,
        Create: _create,
        Delete: _delete
    };

    //TODO: this list will be based on the specific salon, not just all user fields under the distributor
    function _list() {
        var deferred = $q.defer(),
            notes = [];

        UserFields.List('Note', 1, 100).then( function(fields) {
            angular.forEach(fields.Items, function(f) {
                if (f.ID.indexOf('Note') == 0) {
                    f.Note = JSON.parse(f.DefaultValue);
                    notes.push(f);
                }
            });
            if (notes.length) {
                notes.sort(orderByDateDesc);
                deferred.resolve(notes);
            } else {
                deferred.reject('No Notes Found');
            }
        });
        return deferred.promise;
    }

    //TODO: need to assign the user field to the salon after creation
    function _create(note) {
        var deferred = $q.defer();
        note.Timestamp = new Date();
        getNextID().then(function(nextID) {
            var field = {
                "DefaultValue": JSON.stringify(note),
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
            UserFields.Create(field).then(function(n) {
                deferred.resolve(n);
            }).catch(function(ex) {
                deferred.reject(ex);
            });
        });
        return deferred.promise;
    }

    function _delete(note) {
        return UserFields.Delete(note.ID);
    }

    function getNextID() {
        var deferred = $q.defer();
        var greatestID = "Note00000";
        _list().then(function(articles) {
            angular.forEach(articles, function(article) {
                if (article.ID > greatestID) greatestID = article.ID;
            });
            var ID = 'Note';
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

    function orderByDateDesc(a,b) {
        if (a.Note.Timestamp > b.Note.Timestamp)
            return -1;
        if (a.Note.Timestamp < b.Note.Timestamp)
            return 1;
        return 0;
    }

    return service;
}

function NotesDirective() {
    var directive = {
        restrict: 'E',
        replace: true,
        controller: 'NotesCtrl',
        controllerAs: 'notes',
        templateUrl: 'notes/templates/notes.tpl.html'
    };

    return directive;
}

function NotesController( NotesService ) {
    var vm = this;

    function init() {
        NotesService.List()
            .then(function(notes) {
                vm.notes = notes;
            })
            .catch(function() {
                vm.notes = null;
            })
        ;
    }
    init();

    vm.creatingNote = false;

    function setBlankNote() {
        vm.note = {
            Timestamp: null,
            Body: null
        };
    }
    setBlankNote();

    vm.createNote = function() {
        vm.creatingNote = true;
    };

    vm.cancelNote = function() {
        vm.creatingNote = false;
        setBlankNote();
    };

    vm.saveNote = function() {
        NotesService.Create(vm.note)
            .then(function(note) {
                vm.creatingNote = false;
                setBlankNote();
                init();
            })
            .catch(function() {
                console.log('error creating note')
            })
        ;
    };

    vm.deleteNote = function(note) {
        NotesService.Delete(note)
            .then(function() {
                init();
            })
        ;
    };

    vm.showAllNotes = false;
    vm.toggleShowAll = function() {
        vm.showAllNotes = !vm.showAllNotes;
    };
}