(function () {
    "use strict";

    angular.module('bitpaydemo').directive('navDirective', function(){
        return {
            scope : {},
            restrict: 'E',
            controller : function($scope, $rootScope, $state, $log, sessionService, AUTH_EVENTS){
               $scope.navbarCollapsed = true;

               $scope.user = sessionService.getCurrentUser();

               $rootScope.$on(AUTH_EVENTS.loginSuccess, function(){
                    $scope.user = sessionService.getCurrentUser();
               });

               $rootScope.$on(AUTH_EVENTS.logoutSuccess, function(){
                    delete $scope.user;
               });

               $scope.collapeClick = function(){
                 //$log.log("collapeClicked");
                 $scope.navbarCollapsed = !$scope.navbarCollapsed;
               };

               $scope.login = function(){
                $state.go('root.login');
               };

               $scope.logout = function(){
                 //$log.log("logout clicked");
                 sessionService.logout();
                 $state.go('root.index');
               };
            },
            templateUrl : '/partials/nav.html'
        };
    });
}());