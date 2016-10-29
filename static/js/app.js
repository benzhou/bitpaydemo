(function (angular) {
    "use strict";

    angular.module("bitpaydemo", [
        "ui.router",
        "ngResource",
        'ngStorage',
        "ui.bootstrap",
        "bitpayDemo.config",
        'monospaced.qrcode',
        'btford.socket-io',
    ]).constant('AUTH_EVENTS', {
      loginSuccess: 'auth-login-success',
      logoutSuccess: 'auth-logout-success'
    }).config(["$urlRouterProvider","$stateProvider", "$locationProvider",
        function($urlRouterProvider, $stateProvider, $locationProvider) {
            //$locationProvider.html5Mode(true);
            
            $stateProvider.state("root", {
                url : "",
                abstract: true,
                templateUrl: "static/partials/root.html",
                onEnter: function(){
                  //console.log("enter root");
                }
            }).state("root.index", {
                url : "^/index",
                templateUrl: "static/partials/index.html",
                controller: "indexCtrl",
                data : { requireLogin : false},
            }).state("root.productsAdd", {
                url : "^/products/add",
                templateUrl: "static/partials/productAdd.html",
                controller: "productAddCtrl",
                data : { requireLogin : false},
            }).state("root.buy", {
                url : "^/buy/:id",
                templateUrl: "static/partials/buy.html",
                controller: "buyCtrl",
                data : { requireLogin : false},
            }).state("root.trans", {
                url : "^/transactions",
                templateUrl: "static/partials/transactions.html",
                controller: "transactionsCtrl",
                data : { requireLogin : false},
            }).state("root.payment-success", {
                url : "^/success",
                templateUrl: "static/partials/paymentSuccess.html",
                controller: "paymentSuccessCtrl",
                data : { requireLogin : false},
            }).state("otherwise", {
                url : "/notfound",
                templateUrl: "static/partials/404.html",
                onEnter: function(){
                  //console.log("enter not found");
                }
            });

            $urlRouterProvider.when("", "/index").otherwise("/notfound");
  
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
              /*responseError: function (rejection) {
                if (rejection.status !== 401) {
                  return rejection;
                }

                var deferred = $q.defer();

                
                loginModal()
                  .then(function () {
                    deferred.resolve( $http(rejection.config) );
                  })
                  .catch(function () {
                    $state.go('root.index');
                    deferred.reject(rejection);
                  });
                
                $state.go('root.login');
                deferred.reject(rejection);

                return deferred.promise;
              }*/
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


