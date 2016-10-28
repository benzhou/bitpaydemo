(function (angular) {
    "use strict";

    angular.module("bitpaydemo", [
        "ui.router",
        "ngResource",
        'ngStorage',
        "ui.bootstrap",
        "bitpayDemo.config",
    ]).constant('AUTH_EVENTS', {
      loginSuccess: 'auth-login-success',
      logoutSuccess: 'auth-logout-success'
    }).config(["$urlRouterProvider","$stateProvider", "$locationProvider",
        function($urlRouterProvider, $stateProvider, $locationProvider) {
            $locationProvider.html5Mode(true);
            $urlRouterProvider.when("","/test").when("/","/test").otherwise("/notfound");

            $stateProvider.state("root", {
                url : "",
                abstract: true,
                templateUrl: "/partials/root.html",
                onEnter: function(){
                  //console.log("enter root");
                }
            }).state("root.index", {
                url : "^/index",
                templateUrl: "/partials/index.html",
                controller: "indexCtrl",
                data : { requireLogin : true},
                onEnter: function(){
                  //console.log("enter root.index");
                }
            }).state("otherwise", {
                url : "/notfound",
                templateUrl: "/partials/404.html",
                data : { requireLogin : false},
                onEnter: function(){
                  //console.log("enter not found");
                }
            });
    
        }]).config(function ($httpProvider) {
        
          $httpProvider.interceptors.push(function ($timeout, $q, $injector) {
            var loginModal, $http, $state;

            // this trick must be done so that we don't receive
            // `Uncaught Error: [$injector:cdep] Circular dependency found`
            $timeout(function () {
              //loginModal = $injector.get('loginModal');
              $http = $injector.get('$http');
              $state = $injector.get('$state');
            });

            return {
              responseError: function (rejection) {
                if (rejection.status !== 401) {
                  return rejection;
                }

                var deferred = $q.defer();

                /*
                loginModal()
                  .then(function () {
                    deferred.resolve( $http(rejection.config) );
                  })
                  .catch(function () {
                    $state.go('root.index');
                    deferred.reject(rejection);
                  });
                */
                $state.go('root.login');
                deferred.reject(rejection);

                return deferred.promise;
              }
            };
          });
        
        }).run(['$rootScope', '$state', '$stateParams', '$log', 'sessionService', function($rootScope, $state, $stateParams, $log, sessionService){
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;

            sessionService.bootstrap();

            $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
                var requireLogin = toState.data.requireLogin;

                if (requireLogin && typeof $rootScope.currentUser === 'undefined') {
                  event.preventDefault();
                  $state.intercepted = toState;
                  return $state.go('root.login');
                }
            });

            // add previous state property
            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
                //$log.log("$stateChangeSuccess");
                //$log.log(fromState);
                //$log.log(toState);
                $state.previous = fromState;
            });
        }]);
})(angular);


