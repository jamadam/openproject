module.exports = function($scope, $sce, LABEL_MAX_CHARS, KEY_CODES) {
  var scope = $scope;
  scope.$watch('groups', refreshFilteredGroups);
  scope.$watch('selectedId', selectTitle);

  function refreshFilteredGroups() {
    if(scope.groups){
      initFilteredModels();
    }
  }

  function selectTitle() {
    angular.forEach(scope.filteredGroups, function(group) {
      if(group.models.length) {
        angular.forEach(group.models, function(model){
          model.highlighted = model.id == scope.selectedId;
        });
      }
    });
  }

  function initFilteredModels() {
    scope.filteredGroups = angular.copy(scope.groups);
    angular.forEach(scope.filteredGroups, function(group) {
      group.models = group.models.map(function(model){
        return {
          label: model[0],
          labelHtml: $sce.trustAsHtml(truncate(model[0], LABEL_MAX_CHARS)),
          id: model[1],
          highlighted: false
        };
      });
    });
  }

  function labelHtml(label, filterBy) {
    filterBy = filterBy.toLowerCase();
    label = truncate(label, LABEL_MAX_CHARS);
    if(label.toLowerCase().indexOf(filterBy) >= 0) {
      var labelHtml = label.substr(0, label.toLowerCase().indexOf(filterBy))
        + "<span class='filter-selection'>" + label.substr(label.toLowerCase().indexOf(filterBy), filterBy.length) + "</span>"
        + label.substr(label.toLowerCase().indexOf(filterBy) + filterBy.length);
    } else {
      var labelHtml = label;
    }
    return $sce.trustAsHtml(labelHtml);
  }

  function truncate(text, chars) {
    if (text.length > chars) {
      return text.substr(0, chars) + "...";
    }
    return text;
  }

  function modelIndex(models) {
    return models.map(function(model){
      return model.id;
    }).indexOf(scope.selectedId);
  }

  function performSelect() {
    scope.transitionMethod(scope.selectedId);
  }

  function nextNonEmptyGroup(groups, currentGroupIndex) {
    currentGroupIndex = (currentGroupIndex == undefined) ? -1 : currentGroupIndex;
    while(currentGroupIndex < groups.length - 1) {
      if(groups[currentGroupIndex + 1].models.length) {
        return groups[currentGroupIndex + 1];
      }
      currentGroupIndex = currentGroupIndex + 1;
    }
    return null;
  }

  function previousNonEmptyGroup(groups, currentGroupIndex) {
    while(currentGroupIndex > 0) {
      if(groups[currentGroupIndex - 1].models.length) {
        return groups[currentGroupIndex - 1];
      }
      currentGroupIndex = currentGroupIndex - 1;
    }
    return null;
  }

  function getModelPosition(groups, selectedId) {
    for(var group_index = 0; group_index < groups.length; group_index++) {
      var models = groups[group_index].models;
      var model_index = modelIndex(models);
      if(model_index >= 0) {
        return {
          group: group_index,
          model: model_index
        };
      }
    }
    return false;
  }

  function selectNext() {
    var groups = scope.filteredGroups;
    if(!scope.selectedId) {
      var nextGroup = nextNonEmptyGroup(groups);
      scope.selectedId = nextGroup ? nextGroup.models[0].id : 0;
    } else {
      var position = getModelPosition(groups, scope.selectedId);
      if (!position) return;
      var models = groups[position.group].models;

      if(position.model == models.length - 1){ // It is the last in the group
        var nextGroup = nextNonEmptyGroup(groups, position.group);
        if(nextGroup) {
          scope.selectedId = nextGroup.models[0].id;
        }
      } else {
        scope.selectedId = models[position.model + 1].id;
      }
    }
  }

  function selectPrevious() {
    var groups = scope.filteredGroups;
    if(scope.selectedId) {
      var position = getModelPosition(groups, scope.selectedId);
      if (!position) return;
      var models = groups[position.group].models;

      if(position.model == 0){ // It is the last in the group
        var previousGroup = previousNonEmptyGroup(groups, position.group);
        if(previousGroup) {
          scope.selectedId = previousGroup.models[previousGroup.models.length - 1].id;
        }
      } else {
        scope.selectedId = models[position.model - 1].id;
      }
    }
  }

  function preventDefault(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  angular.element('#title-filter').bind('click', function(event) {
    preventDefault(event);
  });

  scope.handleSelection = function(event) {
    switch(event.which) {
      case KEY_CODES.enter:
        performSelect();
        preventDefault(event);
        break;
      case KEY_CODES.down:
        selectNext();
        preventDefault(event);
        break;
      case KEY_CODES.up:
        selectPrevious();
        preventDefault(event);
        break;
      default:
        break;
    }
  };

  scope.reload = function(modelId, newTitle) {
    scope.selectedTitle = newTitle;
    scope.reloadMethod(modelId);
    scope.$emit('hideAllDropdowns');
  };

  scope.filterModels = function(filterBy) {
    initFilteredModels();

    scope.selectedId = 0;
    angular.forEach(scope.filteredGroups, function(group) {
      if(filterBy.length) {
        group.filterBy = filterBy;
        group.models = group.models.filter(function(model){
          return model.label.toLowerCase().indexOf(filterBy.toLowerCase()) >= 0;
        });

        if(group.models.length) {
          angular.forEach(group.models, function(model){
            model['labelHtml'] = labelHtml(model.label, filterBy);
          });
          if(!scope.selectedId) {
            group.models[0].highlighted = true;
            scope.selectedId = group.models[0].id;
          }
        }
      }
    });
  };
}