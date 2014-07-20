define(['angular'], function(angular) {
  var ngGridModule = angular.module('directive.table', []),
  Filters = {
    FILTER_GT:  { sign: '>', code:'gt',  fn: function(item, filter) { return parseInt(item, 10) > parseInt(filter, 10); }},
    FILTER_LT:  { sign: '<', code:'lt',  fn: function(item, filter) { return parseInt(item, 10) < parseInt(filter, 10); }},
    FILTER_IN:  { sign: ':', code:'in',  fn: function(item, filter) { return typeof item === 'string' ? item.indexOf(filter) !== -1 : filter == item; }},
    FILTER_NIN: { sign: '!', code:'nin', fn: function(item, filter) { return typeof item === 'string' ? item.indexOf(filter) === -1 : filter != item; }},
    FILTER_EQ:  { sign: '=', code:'eq',  fn: function(item, filter) { return filter == item; }},
    FILTER_NEQ: { sign: '~', code:'neq', fn: function(item, filter) { return filter != item; }}
  },
  FILTER_REGEX  = new RegExp("^\\s*([a-zA-Z]+)\\s*([" + Object.keys(Filters).map(function(filter) { return "\\" + Filters[filter].sign; }).join('') + "])\\s*(.+)$"),
  FILTER_ANY    = Filters.FILTER_IN,
  Templates = {
    header:   '<thead>' +
                '<th ng-repeat="head in ngGrid.header">' +
                  '<a ng-class="{disabled: !head.name}"  ng-click="sort(head.index)">' +
                    '<i ng-class="{ \'icon-arrow-up\'  : !!head.name && (ngGrid.predicate==head.name) && ngGrid.reverse' +
                                  ',\'icon-arrow-down\': head.name && (ngGrid.predicate==head.name) && !ngGrid.reverse}" ></i>' +
                    '{{head.title}} ' +
                  '</a>' +
                '</th>' +
              '</thead>',
    controls: '<div class="row" style="padding-bottom: 20px">' +
                '<div class="col-md-3">' +
                  '<select class="form-control" ng-options="option for option in ngGrid.limits" ng-model="ngGrid.limit"></select>' +
                '</div>' +
                '<div class="col-md-9">' +
                  '<div class="form-group" ng-class="{error: ngGrid.filterError}">' +
                    '<div class="controls">' + 
                      '<div class="pull-right">' +  
                        '<span class="add-on"><i class="icon-search"></i></span>' + 
                        '<input type="text" class="form-control" ng-model="ngGrid.filter" placeholder="{{i18n.filter}}" name="filter" />' +
                      '</div>' +
                    '</div>' +
                  '</div>' + 
                '</div>' + 
              '</div>',
    footer:   '<div class="row">' +
                '<div class="col-md-2">' + 
                  '<div class="pageNum">' +
                    '{{i18n.total}}{{ngGrid.filteredList(true).length}}' +
                  '</div>' +
                '</div>' +
                '<div class="col-md-10">' +
                  '<div class="pull-right">' +
                    '<ul class="pagination">' +
                      '<li ng-class="{disabled: ngGrid.page == 1}">' +
                        '<a ng-click="prev()">{{i18n.prev}}</a>' +
                      '</li>' +
                      '<li ng-repeat="pageIndex in ngGrid.filteredList() | ngGrid_filter_lastPage:ngGrid.limit | ngGrid_filter_toPages:ngGrid.maxPages:ngGrid.page" ng-class="{active: ngGrid.page==pageIndex, disabled: pageIndex==\'\u2026\'}">' +
                        '<a ng-click="page(pageIndex)">{{pageIndex}}</a></li>' +
                      '</li>' +
                      '<li ng-class="ngGrid.filteredList() | ngGrid_filter_lastPage:ngGrid.limit | ngGrid_filter_equal:ngGrid.page:\'disabled\'">' +
                        '<a ng-click="next()">{{i18n.next}}</a>' +
                      '</li>' +
                    '</ul>' +
                  '</div>' +
                '</div>',
    debug:    '<pre>pagination = {{ngGrid | json}}</pre>'
  };

  // the skip filter
  ngGridModule.filter('ngGrid_filter_skip', function() {
      return function(array, page, limit) {
        if (array !== undefined)
          return array.slice((page - 1) * limit);
      };
  });

  ngGridModule.filter('ngGrid_filter_forceLimit', function() {
    return function(list) {
      if(!this.ngGrid.forceLimit) return list;
      var limit = parseInt(this.ngGrid.limit, 10);

      if(list.length < limit) {
        var results = new Array(limit);
        list.map(function(item, key) { results[key] = item; });
        // not possible to have the new Array fields default to something, angular
        // would just find itself in a digest-loop
        return results;
      }
      return list;
    };
  });

  ngGridModule.filter('ngGrid_filter_lastPage', function() {
    return function(list, limit) {
      if(list && list.length)
        return Math.ceil(list.length / limit);
      return 0;
    };
  });

  ngGridModule.filter('ngGrid_filter_equal', function() {
    return function(a, b, klass) {
      return a === b ? klass : '';
    };
  });

  ngGridModule.filter('ngGrid_filter_toPages', function() {
    return function(length, count, page) {
      if(!length) return [];
      var results = [], index;
      if(length < count) {
        for (index = 1; index <= length; index++) {
          results.push(index);
        }
        return results;
      }

      var edge = (count-count%2)/2,
          low       = true,
          low_from  = 1,
          low_to    = edge,
          mid_from  = Math.max(1, page-edge),
          mid_to    = Math.min(length, page+edge),
          high      = true,
          high_from = length-edge+1,
          high_to   = length+1;

      if(mid_from - low_to <= 2) {
        low = false;
        mid_from = low_from;
      }

      if(high_from - mid_to <= 2) {
        high = false;
        mid_to = high_to - 1;
      }

      // building first part
      if(low) {
        for (index = low_from; index <= low_to; index++) {
          results.push(index);
        }
        results.push('\u2026');
      }

      // building middle part
      for (index = mid_from; index <= mid_to; index++) {
        results.push(index);
      }

      // building last part
      if(high) {
        results.push('\u2026');
        for (index = high_from; index < high_to; index++) {
          results.push(index);
        }
      }

      return results;
    };
  });

  // the row filter
  ngGridModule.filter('ngGrid_filter_rowFilter', function() {
    return function(list, row, code, needle) {
      // return list if it is no list or something
      if(!list || !list.length) return list;
      // else filter the list
      return list.filter(function(item) {
        // dont include if the row does not have the item
        if(!(row in item)) return false;
        var element = item[row];
        // run through all Filters
        return Object.keys(Filters).filter(function(filter) {
          return Filters[filter].code==code;
        }).reduce(function(value, filter) {
          return value && Filters[filter].fn(element, needle);
        }, true);
      });
    };
  });

  ngGridModule.filter('ngGrid_filter_anyRowFilter', function() {
      return function(array, filter) {
        var header = this.ngGrid.header,
            filter = angular.lowercase(filter);
        return array.filter(function(item) {
          return header.map(function(head) {
            return FILTER_ANY.fn(angular.lowercase(item[head.name]), filter);
          }).reduce(function(current, value) {
            return current || value;
          }, false);
        });
      };
  });

  // the main directive: ngGrid
  ngGridModule.directive('ngGrid',  function($compile) {
    return {
      compile: function compile(element) {
        var index             = 0,
            tr                = element.children('tbody').children('tr'),
            sourceExpression  = tr.attr('ng-repeat').match(/^\s*(.+)\s+in\s+(.*)\s*$/),
            baseExpression    = sourceExpression[2],
            itemExpression    = sourceExpression[1];

        tr.attr('ng-repeat', itemExpression + ' in ngGrid.filteredList() | orderBy:ngGrid.predicate:ngGrid.reverse | ngGrid_filter_skip:ngGrid.page:ngGrid.limit | limitTo:ngGrid.limit | ngGrid_filter_forceLimit');

        var header = [],
        filter_hash = {};

        angular.forEach(tr.children('td'), function(elm) {
          var column  = angular.element(elm),
              exp     = column.html().replace(/[{{}}\s]/g, ""),
              name    = column.attr('ng-grid-name'),
              title   = column.attr('ng-grid-title') || name;

          // build up a list of all header elements
          header.push({
            name: name,
            title: title,
            index: index
          });
          //console.log(header);
          if(name) {
            filter_hash[angular.lowercase(name)] = index;
            filter_hash[name] = index;
          }
          filter_hash[angular.lowercase(title)] = index;
          filter_hash[title] = index;

          column.attr('ngGrid-title', null);
          index ++;
        });

        var templates = {
          header  : angular.element(document.querySelector('template#ngGrid-grid-header')).html() || Templates.header
        , controls: angular.element(document.querySelector('template#ngGrid-grid-controls')).html() || Templates.controls
        , footer  : angular.element(document.querySelector('template#ngGrid-grid-footer')).html() || Templates.footer
        , debug   : angular.element(document.querySelector('template#ngGrid-grid-debug')).html() || Templates.debug
        };

        element.prepend(templates.header);

        return {
          pre: function preLink(scope) {
            var cache               = [],
              lastExpression        = null;

            scope.ngGrid = {
              expression      : baseExpression,
              debug           : element.attr('ngGrid-debug') !== undefined,   // kind of a debugging mode :-D
              forceLimit      : element.attr('ngGrid-forceLimit') !== undefined || element.attr('force-limit') !== undefined,   // force the size of the pages
              limit           : element.attr('ngGrid-limit')       || 10,      // max number of items on page
              limits          : [10, 20, 30, 60],
              page            : element.attr('ngGrid-page')        || 1,       // current page of the list
              maxPages        : element.attr('ngGrid-pagination')  || 5,       // max pages to show in pagination, half.floor() on edges
              filterError     : false,  // computed value, tells if filter is in an error state
              filter          : '',     // filter to be used with this grid
              header          : header, // header that was found for the grid
              filteredList  : function(ignoreCache) {
                if(!ignoreCache && scope.ngGrid.expression == lastExpression)
                  return cache;
                lastExpression  = scope.ngGrid.expression;
                cache           = scope.$eval(scope.ngGrid.expression);
                return cache;
              },
              unfilteredList  : function(ignoreCache) { return scope.$eval(baseExpression); }
            };

            scope.i18n = {
              next    : 'Next',
              prev    : 'Prev',
              total   : 'Total: ',
              filter  : 'Field:Item or Item'
            };

            if(scope.ngGrid.debug) {
              element.after($compile(templates.debug)(scope));
            }
            element.before($compile(templates.controls)(scope));
            element.after($compile(templates.footer)(scope));

            scope.$watch('ngGrid.limit', function() {
              if (scope.ngGrid.filteredList() !== undefined) {
                var lastPage = Math.ceil(scope.ngGrid.filteredList().length / scope.ngGrid.limit);
                if(scope.ngGrid.page > lastPage)
                  scope.ngGrid.page = Math.max(1, lastPage);  
              }            
            });

            scope.$watch('ngGrid.filter', function() {
              var filterExpression = '';
              scope.ngGrid.filterError = false;
              if (scope.ngGrid.filter) {
                var match = angular.lowercase(scope.ngGrid.filter).match(FILTER_REGEX);
                if(match) {
                  var head    = null,
                      row     = match[1].trim().replace(' ', '_'),
                      func    = match[2].trim(),
                      filter  = match[3].trim(),
                      filters = Object.keys(Filters).map(function(filter) {
                        return Filters[filter].sign == func ? Filters[filter].code : false;
                      }).filter(function(func) { return func; });
                  if (filter.length && row in filter_hash) {
                    head = scope.ngGrid.header[filter_hash[row]];
                  }
                  if (filters.length && filter && head) { // we do have a filter, a lookup target and a function to filter by
                      filterExpression = ' | ngGrid_filter_rowFilter:\'' + head.name + '\':\''+filters[0]+'\':\'' + filter + '\'';
                  } else {
                    scope.ngGrid.filterError = true;
                    filterExpression = '';
                  }
                } else {
                  filterExpression = ' | ngGrid_filter_anyRowFilter:\'' + scope.ngGrid.filter + '\'';
                }
              }
              scope.ngGrid.expression = baseExpression + filterExpression;
            });

            scope.sort = function(index) {
              var head = header[index];
              if(!head || !head.name) return;
              // if the grid is already sorted by this head and not in reverse mode:
              scope.ngGrid.reverse = (scope.ngGrid.predicate === head.name) && ! scope.ngGrid.reverse;
              // set sorting to this head
              scope.ngGrid.predicate = head.name;
            };

            scope.prev = function() {
              if(scope.ngGrid.page > 1) {
                scope.page(scope.ngGrid.page - 1);
              }
            };

            scope.next = function() {
              if(scope.ngGrid.page < Math.ceil(scope.ngGrid.filteredList().length / scope.ngGrid.limit)) {
                scope.page(scope.ngGrid.page + 1);
              }
            };

            scope.page = function(index) {
              if(typeof index === 'number')
                scope.ngGrid.page = index;
            };
          }
        };
      }
    };
  });
});