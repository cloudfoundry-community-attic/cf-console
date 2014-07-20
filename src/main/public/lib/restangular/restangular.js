(function() {

var module = angular.module('restangular', []);

module.provider('Restangular', function() {
        // Configuration
        var Configurer = {};
        Configurer.init = function(object, config) {
            /**
             * Those are HTTP safe methods for which there is no need to pass any data with the request.
             */

            object.configuration = config;

            var safeMethods= ["get", "head", "options", "trace"];
            config.isSafe = function(operation) {
              return _.contains(safeMethods, operation.toLowerCase());
            };

            var absolutePattern = /^https?:\/\//i;
            config.isAbsoluteUrl = function(string) {
              return string && absolutePattern.test(string);
            }
            /**
             * This is the BaseURL to be used with Restangular
             */
            config.baseUrl = _.isUndefined(config.baseUrl) ? "" : config.baseUrl;
            object.setBaseUrl = function(newBaseUrl) {
                config.baseUrl = /\/$/.test(newBaseUrl)
                  ? newBaseUrl.substring(0, newBaseUrl.length-1)
                  : newBaseUrl;
                return this;
            };

            /**
             * Sets the extra fields to keep from the parents
             */
            config.extraFields = config.extraFields || [];
            object.setExtraFields = function(newExtraFields) {
              config.extraFields = newExtraFields;
              return this;
            };

            /**
             * Some default $http parameter to be used in EVERY call
            **/
            config.defaultHttpFields = config.defaultHttpFields || {};
            object.setDefaultHttpFields = function(values) {
              config.defaultHttpFields = values;
              return this;
            };

            config.withHttpValues = function(httpLocalConfig, obj) {
              return _.defaults(obj, httpLocalConfig, config.defaultHttpFields);
            };

            config.encodeIds = _.isUndefined(config.encodeIds) ? true : config.encodeIds;
            object.setEncodeIds = function(encode) {
                config.encodeIds = encode;
            }

            config.defaultRequestParams = config.defaultRequestParams || {
                get: {},
                post: {},
                put: {},
                remove: {},
                common: {}
            };

            object.setDefaultRequestParams = function(param1, param2) {
              var methods = [],
                  params = param2 || param1;
              if (!_.isUndefined(param2)) {
                if (_.isArray(param1)) {
                  methods = param1;
                } else {
                  methods.push(param1);
                }
              } else {
                methods.push('common');
              }

              _.each(methods, function (method) {
                config.defaultRequestParams[method] = params;
              });
              return this;
            }

            object.requestParams = config.defaultRequestParams;


            config.defaultHeaders = config.defaultHeaders || {};
            object.setDefaultHeaders = function(headers) {
              config.defaultHeaders = headers;
              object.defaultHeaders = config.defaultHeaders;
              return this;
            };

            object.defaultHeaders = config.defaultHeaders;

            /**
             * Method overriders will set which methods are sent via POST with an X-HTTP-Method-Override
             **/
            config.methodOverriders = config.methodOverriders || [];
            object.setMethodOverriders = function(values) {
              var overriders = _.extend([], values);
              if (config.isOverridenMethod('delete', overriders)) {
                overriders.push("remove");
              }
              config.methodOverriders = overriders;
              return this;
            };

            config.isOverridenMethod = function(method, values) {
              var search = values || config.methodOverriders;
              return !_.isUndefined(_.find(search, function(one) {
                return one.toLowerCase() === method.toLowerCase();
              }));
            };

            /**
             * Sets the URL creator type. For now, only Path is created. In the future we'll have queryParams
            **/
            config.urlCreator = config.urlCreator || "path";
            object.setUrlCreator = function(name) {
              if (!_.has(config.urlCreatorFactory, name)) {
                  throw new Error("URL Path selected isn't valid");
              }

              config.urlCreator = name;
              return this;
            };

            /**
             * You can set the restangular fields here. The 3 required fields for Restangular are:
             *
             * id: Id of the element
             * route: name of the route of this element
             * parentResource: the reference to the parent resource
             *
             *  All of this fields except for id, are handled (and created) by Restangular. By default,
             *  the field values will be id, route and parentResource respectively
             */
            config.restangularFields = config.restangularFields || {
                id: "id",
                route: "route",
                parentResource: "parentResource",
                restangularCollection: "restangularCollection",
                cannonicalId: "__cannonicalId",
                etag: "restangularEtag",
                selfLink: "href",
                get: "get",
                getList: "getList",
                put: "put",
                post: "post",
                remove: "remove",
                head: "head",
                trace: "trace",
                options: "options",
                patch: "patch",
                getRestangularUrl: "getRestangularUrl",
                putElement: "putElement",
                addRestangularMethod: "addRestangularMethod",
                getParentList: "getParentList",
                clone: "clone",
                ids: "ids",
                httpConfig: '_$httpConfig'
            };
            object.setRestangularFields = function(resFields) {
                config.restangularFields =
                  _.extend(config.restangularFields, resFields);
                return this;
            };

            config.setFieldToElem = function(field, elem, value) {
              var properties = field.split('.');
              var idValue = elem;
              _.each(_.initial(properties), function(prop) {
                idValue[prop] = {};
                idValue = idValue[prop];
              });
              idValue[_.last(properties)] = value;
              return this;
            };

            config.getFieldFromElem = function(field, elem) {
              var properties = field.split('.');
              var idValue = angular.copy(elem);
              _.each(properties, function(prop) {
                if (idValue) {
                  idValue = idValue[prop];
                }
              });
              return idValue;
            };

            config.setIdToElem = function(elem, id) {
              config.setFieldToElem(config.restangularFields.id, elem, id);
              return this;
            };

            config.getIdFromElem = function(elem) {
              return config.getFieldFromElem(config.restangularFields.id, elem);
            };

            config.isValidId = function(elemId) {
                return "" !== elemId && !_.isUndefined(elemId) && !_.isNull(elemId)
            }

            config.setUrlToElem = function(elem, url) {
              config.setFieldToElem(config.restangularFields.selfLink, elem, url);
              return this;
            }

            config.getUrlFromElem = function(elem) {
              return config.getFieldFromElem(config.restangularFields.selfLink, elem);
            }

            config.useCannonicalId = _.isUndefined(config.useCannonicalId) ? false : config.useCannonicalId;
            object.setUseCannonicalId = function(value) {
                config.useCannonicalId = value;
                return this;
            }

            config.getCannonicalIdFromElem = function(elem) {
              var cannonicalId = elem[config.restangularFields.cannonicalId];
              var actualId = config.isValidId(cannonicalId) ?
                  cannonicalId : config.getIdFromElem(elem);
              return actualId;
            };

            /**
             * Sets the Response parser. This is used in case your response isn't directly the data.
             * For example if you have a response like {meta: {'meta'}, data: {name: 'Gonto'}}
             * you can extract this data which is the one that needs wrapping
             *
             * The ResponseExtractor is a function that receives the response and the method executed.
             */

            config.responseExtractor = config.responseExtractor || function(data, operation,
                    what, url, response, deferred) {
                return data;
            };

            object.setResponseExtractor = function(extractor) {
              config.responseExtractor = extractor;
              return this;
            };

            object.setResponseInterceptor = object.setResponseExtractor;

            /**
             * Response interceptor is called just before resolving promises.
             */


            /**
             * Request interceptor is called before sending an object to the server.
             */
            config.fullRequestInterceptor = config.fullRequestInterceptor || function(element, operation,
              path, url, headers, params, httpConfig) {
                return {
                  element: element,
                  headers: headers,
                  params: params,
                  httpConfig: httpConfig
                };
            };

            object.setRequestInterceptor = function(interceptor) {
              config.fullRequestInterceptor = function(elem, operation, path, url, headers, params, httpConfig) {
                return {
                  headers: headers,
                  params: params,
                  element: interceptor(elem, operation, path, url),
                  httpConfig: httpConfig
                }
              };
              return this;
            };

            object.setFullRequestInterceptor = function(interceptor) {
              config.fullRequestInterceptor = interceptor;
              return this;
            };

            config.errorInterceptor = config.errorInterceptor || function() {};

            object.setErrorInterceptor = function(interceptor) {
              config.errorInterceptor = interceptor;
              return this;
            };

            config.onBeforeElemRestangularized = config.onBeforeElemRestangularized || function(elem) {
              return elem;
            }
            object.setOnBeforeElemRestangularized = function(post) {
              config.onBeforeElemRestangularized = post;
              return this;
            };

            /**
             * This method is called after an element has been "Restangularized".
             *
             * It receives the element, a boolean indicating if it's an element or a collection
             * and the name of the model
             *
             */
            config.onElemRestangularized = config.onElemRestangularized || function(elem) {
              return elem;
            };
            object.setOnElemRestangularized = function(post) {
              config.onElemRestangularized = post;
              return this;
            };

            /**
             * Depracated. Don't use this!!
             */
            object.setListTypeIsArray = function(val) {

            };

            config.shouldSaveParent = config.shouldSaveParent || function() {
                return true;
            };
            object.setParentless = function(values) {
                if (_.isArray(values)) {
                    config.shouldSaveParent = function(route) {
                        return !_.contains(values, route);
                    }
                } else if (_.isBoolean(values)) {
                    config.shouldSaveParent = function() {
                        return !values;
                    }
                }
                return this;
            };

            /**
             * This lets you set a suffix to every request.
             *
             * For example, if your api requires that for JSon requests you do /users/123.json, you can set that
             * in here.
             *
             *
             * By default, the suffix is null
             */
            config.suffix = _.isUndefined(config.suffix) ? null : config.suffix;
            object.setRequestSuffix = function(newSuffix) {
                config.suffix = newSuffix;
                return this;
            };

            /**
             * Add element transformers for certain routes.
             */
            config.transformers = config.transformers || {};
            object.addElementTransformer = function(type, secondArg, thirdArg) {
                var isCollection = null;
                var transformer = null;
                if (arguments.length === 2) {
                    transformer = secondArg;
                } else {
                    transformer = thirdArg;
                    isCollection = secondArg;
                }

                var typeTransformers = config.transformers[type];
                if (!typeTransformers) {
                    typeTransformers = config.transformers[type] = [];
                }

                typeTransformers.push(function(coll, elem) {
                    if (_.isNull(isCollection) || (coll == isCollection)) {
                        return transformer(elem);
                    }
                    return elem;
                });
            };

            object.extendCollection = function(route, fn) {
              return object.addElementTransformer(route, true, fn);
            };

            object.extendModel = function(route, fn) {
              return object.addElementTransformer(route, false, fn);
            };

            config.transformElem = function(elem, isCollection, route, Restangular) {
                var typeTransformers = config.transformers[route];
                var changedElem = elem;
                if (typeTransformers) {
                    _.each(typeTransformers, function(transformer) {
                       changedElem = transformer(isCollection, changedElem);
                    });
                }
                return config.onElemRestangularized(changedElem,
                  isCollection, route, Restangular);
            };

            config.fullResponse = _.isUndefined(config.fullResponse) ? false : config.fullResponse;
            object.setFullResponse = function(full) {
                config.fullResponse = full;
                return this;
            };



            //Internal values and functions
            config.urlCreatorFactory = {};

            /**
             * Base URL Creator. Base prototype for everything related to it
             **/

             var BaseCreator = function() {
             };

             BaseCreator.prototype.setConfig = function(config) {
                 this.config = config;
                 return this;
             };

             BaseCreator.prototype.parentsArray = function(current) {
                var parents = [];
                while(current) {
                    parents.push(current);
                    current = current[this.config.restangularFields.parentResource];
                }
                return parents.reverse();
            };

            function RestangularResource(config, $http, url, configurer) {
              var resource = {};
              _.each(_.keys(configurer), function(key) {
                  var value = configurer[key];

                  // Add default parameters
                  value.params = _.extend({}, value.params,
                          config.defaultRequestParams[value.method.toLowerCase()]);
                  // We don't want the ? if no params are there
                  if (_.isEmpty(value.params)) {
                    delete value.params;
                  }

                  if (config.isSafe(value.method)) {

                      resource[key] = function() {
                          return $http(_.extend(value, {
                              url: url
                          }));
                      }

                  } else {

                      resource[key] = function(data) {
                          return $http(_.extend(value, {
                              url: url,
                              data: data
                          }));
                      }

                  }
              });

              return resource;
            }

            BaseCreator.prototype.resource = function(current, $http, localHttpConfig, callHeaders, callParams, what, etag, operation) {

                var params = _.defaults(callParams || {}, this.config.defaultRequestParams.common);
                var headers = _.defaults(callHeaders || {}, this.config.defaultHeaders);

                if (etag) {
                    if (!config.isSafe(operation)) {
                      headers['If-Match'] = etag;
                    } else {
                      headers['If-None-Match'] = etag;
                    }
                }

                var url = this.base(current);

                if (what) {
                  var add = '';
                  if (!/\/$/.test(url)) {
                    add += '/';
                  }
                  add += what;
                  url += add;
                }

                if (this.config.suffix
                  && url.indexOf(this.config.suffix, url.length - this.config.suffix.length) === -1) {

                    url += this.config.suffix;
                }

                current[this.config.restangularFields.httpConfig] = undefined;


                return RestangularResource(this.config, $http, url, {
                    getList: this.config.withHttpValues(localHttpConfig,
                      {method: 'GET',
                      params: params,
                      headers: headers}),

                    get: this.config.withHttpValues(localHttpConfig,
                      {method: 'GET',
                      params: params,
                      headers: headers}),

                    put: this.config.withHttpValues(localHttpConfig,
                      {method: 'PUT',
                      params: params,
                      headers: headers}),

                    post: this.config.withHttpValues(localHttpConfig,
                      {method: 'POST',
                      params: params,
                      headers: headers}),

                    remove: this.config.withHttpValues(localHttpConfig,
                      {method: 'DELETE',
                      params: params,
                      headers: headers}),

                    head: this.config.withHttpValues(localHttpConfig,
                      {method: 'HEAD',
                      params: params,
                      headers: headers}),

                    trace: this.config.withHttpValues(localHttpConfig,
                      {method: 'TRACE',
                      params: params,
                      headers: headers}),

                    options: this.config.withHttpValues(localHttpConfig,
                      {method: 'OPTIONS',
                      params: params,
                      headers: headers}),

                    patch: this.config.withHttpValues(localHttpConfig,
                      {method: 'PATCH',
                      params: params,
                      headers: headers})
                });
            };

            /**
             * This is the Path URL creator. It uses Path to show Hierarchy in the Rest API.
             * This means that if you have an Account that then has a set of Buildings, a URL to a building
             * would be /accounts/123/buildings/456
            **/
            var Path = function() {
            };

            Path.prototype = new BaseCreator();

            Path.prototype.base = function(current) {
                var __this = this;
                return  _.reduce(this.parentsArray(current), function(acum, elem) {
                    var elemUrl;
                    var elemSelfLink = __this.config.getUrlFromElem(elem);
                    if (elemSelfLink) {
                      if (__this.config.isAbsoluteUrl(elemSelfLink)) {
                        return elemSelfLink;
                      } else {
                        elemUrl = elemSelfLink;
                      }
                    } else {
                      elemUrl = elem[__this.config.restangularFields.route];

                      if (elem[__this.config.restangularFields.restangularCollection]) {
                        var ids = elem[__this.config.restangularFields.ids];
                        if (ids) {
                          elemUrl += "/" + ids.join(",");
                        }
                      } else {
                          var elemId;
                          if (__this.config.useCannonicalId) {
                              elemId = __this.config.getCannonicalIdFromElem(elem);
                          } else {
                              elemId = __this.config.getIdFromElem(elem);
                          }

                          if (config.isValidId(elemId)) {
                              elemUrl += "/" + (__this.config.encodeIds ? encodeURIComponent(elemId) : elemId);
                          }
                      }
                    }

                    return acum + "/" + elemUrl;

                }, this.config.baseUrl);
            };



            Path.prototype.fetchUrl = function(current, what) {
                var baseUrl = this.base(current);
                if (what) {
                    baseUrl += "/" + what;
                }
                return baseUrl;
            };



            config.urlCreatorFactory.path = Path;

        }

        var globalConfiguration = {};

        Configurer.init(this, globalConfiguration);




       this.$get = ['$http', '$q', function($http, $q) {

          function createServiceForConfiguration(config) {
              var service = {};

              var urlHandler = new config.urlCreatorFactory[config.urlCreator]();
              urlHandler.setConfig(config);

              function restangularizeBase(parent, elem, route) {
                  elem[config.restangularFields.route] = route;
                  elem[config.restangularFields.getRestangularUrl] = _.bind(urlHandler.fetchUrl, urlHandler, elem);
                  elem[config.restangularFields.addRestangularMethod] = _.bind(addRestangularMethodFunction, elem);
                  elem[config.restangularFields.clone] = _.bind(copyRestangularizedElement, elem, elem);
                  elem.withHttpConfig = _.bind(withHttpConfig, elem);

                  // RequestLess connection
                  elem.one = _.bind(one, elem, elem);
                  elem.all = _.bind(all, elem, elem);
                  elem.several = _.bind(several, elem, elem);
                  elem.oneUrl = _.bind(oneUrl, elem, elem);
                  elem.allUrl = _.bind(allUrl, elem, elem);

                  if (parent && config.shouldSaveParent(route)) {
                      var parentId = config.getIdFromElem(parent);
                      var parentUrl = config.getUrlFromElem(parent);

                      var restangularFieldsForParent = _.union(
                        _.values( _.pick(config.restangularFields, ['route', 'parentResource']) ),
                        config.extraFields
                      );
                      var parentResource = _.pick(parent, restangularFieldsForParent);

                      if (config.isValidId(parentId)) {
                          config.setIdToElem(parentResource, parentId);
                      }
                      if (config.isValidId(parentUrl)) {
                          config.setUrlToElem(parentResource, parentUrl);
                      }

                      elem[config.restangularFields.parentResource] = parentResource;
                  } else {
                    elem[config.restangularFields.parentResource] = null;
                  }
                  return elem;
              }



              function one(parent, route, id) {
                  var elem = {};
                  config.setIdToElem(elem, id);
                  return restangularizeElem(parent, elem , route);
              }


              function all(parent, route) {
                  return restangularizeCollection(parent, [] , route, true);
              }

              function several(parent, route, ids) {
                var collection = [];
                collection[config.restangularFields.ids] =
                  Array.prototype.splice.call(arguments, 2);
                return restangularizeCollection(parent, collection , route, true);
              }

              function oneUrl(parent, route, url) {
                  var elem = {};
                  config.setUrlToElem(elem, url);
                  return restangularizeElem(parent, elem , route);
              }


              function allUrl(parent, route, url) {
                  var elem = {};
                  config.setUrlToElem(elem, url);
                  return restangularizeCollection(parent, elem , route, true);
              }
              // Promises
              function restangularizePromise(promise, isCollection) {
                  promise.call = _.bind(promiseCall, promise);
                  promise.get = _.bind(promiseGet, promise);
                  promise[config.restangularFields.restangularCollection] = isCollection;
                  if (isCollection) {
                      promise.push = _.bind(promiseCall, promise, "push");
                  }
                  return promise;
              }

              function promiseCall(method) {
                  var deferred = $q.defer();
                  var callArgs = arguments;
                  this.then(function(val) {
                      var params = Array.prototype.slice.call(callArgs, 1);
                      var func = val[method];
                      func.apply(val, params);
                      deferred.resolve(val);
                  });
                  return restangularizePromise(deferred.promise, this[config.restangularFields.restangularCollection]);
              }

              function promiseGet(what) {
                  var deferred = $q.defer();
                  this.then(function(val) {
                      deferred.resolve(val[what]);
                  });
                  return restangularizePromise(deferred.promise, this[config.restangularFields.restangularCollection]);
              }

              function resolvePromise(deferred, response, data) {

                // Trigger the full response interceptor.
                if (config.fullResponse) {
                  return deferred.resolve(_.extend(response, {
                    data: data
                  }));
                } else {
                  deferred.resolve(data);
                }
              }


              // Elements

              function stripRestangular(elem) {
                return _.omit(elem, _.values(_.omit(config.restangularFields, 'id')));
              }

              function addCustomOperation(elem) {
                  elem.customOperation = _.bind(customFunction, elem);
                  _.each(["put", "post", "get", "delete"], function(oper) {
                      _.each(["do", "custom"], function(alias) {
                          var callOperation = oper === 'delete' ? 'remove' : oper;
                          var name = alias + oper.toUpperCase();
                          var callFunction;

                          if (callOperation !== 'put' && callOperation !== 'post') {
                              callFunction = customFunction;
                          } else {
                              callFunction = function(operation, elem, path, params, headers) {
                                return _.bind(customFunction, this)(operation, path, params, headers, elem);
                              }
                          }
                          elem[name] = _.bind(callFunction, elem, callOperation);
                      });
                  });
                  elem.customGETLIST = _.bind(fetchFunction, elem);
                  elem.doGETLIST = elem.customGETLIST;
              }

              function copyRestangularizedElement(fromElement) {
                  var copiedElement = angular.copy(fromElement);
                  return restangularizeElem(copiedElement[config.restangularFields.parentResource],
                          copiedElement, copiedElement[config.restangularFields.route]);
              }

              function restangularizeElem(parent, element, route, collection) {
                  var elem = config.onBeforeElemRestangularized(element, false, route);

                  var localElem = restangularizeBase(parent, elem, route);

                  if (config.useCannonicalId) {
                      localElem[config.restangularFields.cannonicalId] = config.getIdFromElem(localElem)
                  }

                  if (collection) {
                      localElem[config.restangularFields.getParentList] = function() {
                          return collection;
                      }
                  }


                  localElem[config.restangularFields.restangularCollection] = false;
                  localElem[config.restangularFields.get] = _.bind(getFunction, localElem);
                  localElem[config.restangularFields.getList] = _.bind(fetchFunction, localElem);
                  localElem[config.restangularFields.put] = _.bind(putFunction, localElem);
                  localElem[config.restangularFields.post] = _.bind(postFunction, localElem);
                  localElem[config.restangularFields.remove] = _.bind(deleteFunction, localElem);
                  localElem[config.restangularFields.head] = _.bind(headFunction, localElem);
                  localElem[config.restangularFields.trace] = _.bind(traceFunction, localElem);
                  localElem[config.restangularFields.options] = _.bind(optionsFunction, localElem);
                  localElem[config.restangularFields.patch] = _.bind(patchFunction, localElem);

                  addCustomOperation(localElem);
                  return config.transformElem(localElem, false, route, service);
              }

              function restangularizeCollection(parent, element, route) {
                  var elem = config.onBeforeElemRestangularized(element, true, route);

                  var localElem = restangularizeBase(parent, elem, route);
                  localElem[config.restangularFields.restangularCollection] = true;
                  localElem[config.restangularFields.post] = _.bind(postFunction, localElem, null);
                  localElem[config.restangularFields.head] = _.bind(headFunction, localElem);
                  localElem[config.restangularFields.trace] = _.bind(traceFunction, localElem);
                  localElem[config.restangularFields.putElement] = _.bind(putElementFunction, localElem);
                  localElem[config.restangularFields.options] = _.bind(optionsFunction, localElem);
                  localElem[config.restangularFields.patch] = _.bind(patchFunction, localElem);
                  localElem[config.restangularFields.get] = _.bind(getById, localElem);
                  localElem[config.restangularFields.getList] = _.bind(fetchFunction, localElem, null);

                  addCustomOperation(localElem);
                  return config.transformElem(localElem, true, route, service);
              }

              function getById(id, reqParams, headers){
                  return this.customGET(id.toString(), reqParams, headers);
              }

              function putElementFunction(idx, params, headers) {
                  var __this = this;
                  var elemToPut = this[idx];
                  var deferred = $q.defer();
                  elemToPut.put(params, headers).then(function(serverElem) {
                      var newArray = copyRestangularizedElement(__this);
                      newArray[idx] = serverElem;
                      deferred.resolve(newArray);
                  }, function(response) {
                      deferred.reject(response);
                  });

                  return restangularizePromise(deferred.promise, true)
              }

              function parseResponse(resData, operation, route, fetchUrl, response, deferred) {
                  var data = config.responseExtractor(resData, operation, route, fetchUrl, response, deferred);
                  var etag = response.headers("ETag");
                  if (data && etag) {
                      data[config.restangularFields.etag] = etag;
                  }
                  return data;
              }


              function fetchFunction(what, reqParams, headers) {
                  var __this = this;
                  var deferred = $q.defer();
                  var operation = 'getList';
                  var url = urlHandler.fetchUrl(this, what);
                  var whatFetched = what || __this[config.restangularFields.route];


                  var request = config.fullRequestInterceptor(null, operation,
                      whatFetched, url, headers || {}, reqParams || {}, this[config.restangularFields.httpConfig] || {});

                  urlHandler.resource(this, $http, request.httpConfig, request.headers, request.params, what,
                          this[config.restangularFields.etag], operation).getList().then(function(response) {
                      var resData = response.data;
                      var data = parseResponse(resData, operation, whatFetched, url, response, deferred);
                      var processedData = _.map(data, function(elem) {
                          if (!__this[config.restangularFields.restangularCollection]) {
                              return restangularizeElem(__this, elem, what, data);
                          } else {
                              return restangularizeElem(__this[config.restangularFields.parentResource],
                                elem, __this[config.restangularFields.route], data);
                          }

                      });

                      processedData = _.extend(data, processedData);
                      if (!__this[config.restangularFields.restangularCollection]) {
                          resolvePromise(deferred, response, restangularizeCollection(__this, processedData, what));
                      } else {
                          resolvePromise(deferred, response, restangularizeCollection(__this[config.restangularFields.parentResource], processedData, __this[config.restangularFields.route]));
                      }
                  }, function error(response) {
                      if ( config.errorInterceptor(response) !== false ) {
                          deferred.reject(response);
                      }
                  });

                  return restangularizePromise(deferred.promise, true);
              }

              function withHttpConfig(httpConfig) {
                 this[config.restangularFields.httpConfig] = httpConfig;
                 return this;
              }

              function elemFunction(operation, what, params, obj, headers) {
                  var __this = this;
                  var deferred = $q.defer();
                  var resParams = params || {};
                  var route = what || this[config.restangularFields.route];
                  var fetchUrl = urlHandler.fetchUrl(this, what);

                  var callObj = obj || this;
                  var etag = callObj[config.restangularFields.etag];
                  if (_.isObject(callObj)) {
                      callObj = stripRestangular(callObj);
                  }
                  var request = config.fullRequestInterceptor(callObj, operation, route, fetchUrl,
                    headers || {}, resParams || {}, this[config.restangularFields.httpConfig] || {});

                  var okCallback = function(response) {
                      var resData = response.data;
                      var elem = parseResponse(resData, operation, route, fetchUrl, response, deferred);
                      if (elem) {

                        if (operation === "post" && !__this[config.restangularFields.restangularCollection]) {
                          resolvePromise(deferred, response, restangularizeElem(__this, elem, what));
                        } else {
                          resolvePromise(deferred, response, restangularizeElem(__this[config.restangularFields.parentResource], elem, __this[config.restangularFields.route]));
                        }

                      } else {
                        resolvePromise(deferred, response, undefined);
                      }
                  };

                  var errorCallback = function(response) {
                      if ( config.errorInterceptor(response) !== false ) {
                          deferred.reject(response);
                      }
                  };
                  // Overring HTTP Method
                  var callOperation = operation;
                  var callHeaders = _.extend({}, request.headers);
                  var isOverrideOperation = config.isOverridenMethod(operation);
                  if (isOverrideOperation) {
                    callOperation = 'post';
                    callHeaders = _.extend(callHeaders, {'X-HTTP-Method-Override': operation === 'remove' ? 'DELETE' : operation});
                  }

                  if (config.isSafe(operation)) {
                    if (isOverrideOperation) {
                      urlHandler.resource(this, $http, request.httpConfig, callHeaders, request.params,
                        what, etag, callOperation)[callOperation]({}).then(okCallback, errorCallback);
                    } else {
                      urlHandler.resource(this, $http, request.httpConfig, callHeaders, request.params,
                        what, etag, callOperation)[callOperation]().then(okCallback, errorCallback);
                    }
                  } else {
                      urlHandler.resource(this, $http, request.httpConfig, callHeaders, request.params,
                        what, etag, callOperation)[callOperation](request.element).then(okCallback, errorCallback);
                  }

                  return restangularizePromise(deferred.promise);
              }

              function getFunction(params, headers) {
                  return _.bind(elemFunction, this)("get", undefined, params, undefined, headers);
              }

              function deleteFunction(params, headers) {
                  return _.bind(elemFunction, this)("remove", undefined, params, undefined, headers);
              }

              function putFunction(params, headers) {
                  return _.bind(elemFunction, this)("put", undefined, params, undefined, headers);
              }

              function postFunction(what, elem, params, headers) {
                  return _.bind(elemFunction, this)("post", what, params, elem, headers);
              }

             function headFunction(params, headers) {
               return _.bind(elemFunction, this)("head", undefined, params, undefined, headers);
             }

             function traceFunction(params, headers) {
               return _.bind(elemFunction, this)("trace", undefined, params, undefined, headers);
             }

             function optionsFunction(params, headers) {
               return _.bind(elemFunction, this)("options", undefined, params, undefined, headers);
             }

             function patchFunction(elem, params, headers) {
               return _.bind(elemFunction, this)("patch", undefined, params, elem, headers);
             }

             function customFunction(operation, path, params, headers, elem) {
                 return _.bind(elemFunction, this)(operation, path, params, elem, headers);
             }

             function addRestangularMethodFunction(name, operation, path, defaultParams, defaultHeaders, defaultElem) {
                 var bindedFunction;
                 if (operation === 'getList') {
                     bindedFunction = _.bind(fetchFunction, this, path);
                 } else {
                     bindedFunction = _.bind(customFunction, this, operation, path);
                 }

                 var createdFunction = function(params, headers, elem) {
                     var callParams = _.defaults({
                         params: params,
                         headers: headers,
                         elem: elem
                     }, {
                         params: defaultParams,
                         headers: defaultHeaders,
                         elem: defaultElem
                     });
                     return bindedFunction(callParams.params, callParams.headers, callParams.elem);
                 };

                 if (config.isSafe(operation)) {
                     this[name] = createdFunction;
                 } else {
                     this[name] = function(elem, params, headers) {
                         return createdFunction(params, headers, elem);
                     }
                 }

             }

             function withConfigurationFunction(configurer) {
                 var newConfig = angular.copy(globalConfiguration);
                 Configurer.init(newConfig, newConfig);
                 configurer(newConfig);
                 return createServiceForConfiguration(newConfig);
             }


              Configurer.init(service, config);

              service.copy = _.bind(copyRestangularizedElement, service);

              service.withConfig = _.bind(withConfigurationFunction, service);

              service.one = _.bind(one, service, null);

              service.all = _.bind(all, service, null);

              service.several = _.bind(several, service, null);

              service.oneUrl = _.bind(oneUrl, service, null);

              service.allUrl = _.bind(allUrl, service, null);

              service.restangularizeElement = _.bind(restangularizeElem, service);

              service.restangularizeCollection = _.bind(restangularizeCollection, service);

              service.entityId = function(entity) {
          var link = relations(entity, 'self');
          if (link != undefined) {
            entity.id = link.href.substring(link.href.lastIndexOf('/') + 1, link.href.length);
          }
          return entity;
        };

        var relations = function(entity, relation) {
          if (entity.links.length > 0) {
            for (var i = 0; i < entity.links.length; i++) {
              var position = -1;
              if (entity.links[i].rel !== 'self') {
                position = entity.links[i].rel.lastIndexOf('.') + 1;
              } else {
                position = 0;
              }
              var length = entity.links[i].rel.length;
              if (position !== -1) {
                var rel = entity.links[i].rel.substring(position, length);
                if (rel === relation) {
                  return entity.links[i];
                }
              }
            }
          }
          return undefined;
        };

        service.self = function (entity) {
          if (angular.isDefined(entity.links)) {
            for (var i = 0; i < entity.links.length; i++) {
              var position = -1;
              if (entity.links[i].rel === 'self') {
                return entity.links[i];
              }
            }
          } 
          return null;
        };

        service.getUriHeader = function () {
          return { 'Content-Type': 'text/uri-list; charset=UTF-8' };
        };

              return service;
          }

          return createServiceForConfiguration(globalConfiguration);

        }];
    }
);

})();