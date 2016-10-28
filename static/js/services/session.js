(function(){
	"use strict";

	var bitpaydemo = angular.module('bitpaydemo');

	bitpaydemo.factory('sessionService', [
            'bitpayDemoConfig',
            '$rootScope',
            '$localStorage',
            'AUTH_EVENTS',
        function(bitpayDemoConfig, $rootScope, $localStorage, AUTH_EVENTS){
            var isLoggedIn = function(){
                return !!$localStorage.currentUser && !!$localStorage.currentUser.token;
            },

            getCurrentUser = function(){
                return $rootScope.currentUser;
            },

            login = function(loggedUser){
                $rootScope.currentUser = loggedUser;
                $localStorage.currentUser = loggedUser;

                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            },

            bootstrap = function(){
                if($localStorage.currentUser){
                    $rootScope.currentUser = $localStorage.currentUser;
                    $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                }
            },

            logout = function(){
                delete $rootScope.currentUser;
                delete $localStorage.currentUser;

                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            };

            return {
                isLoggedIn          : isLoggedIn,
                getCurrentUser      : getCurrentUser,
                login               : login,
                logout              : logout,
                bootstrap           : bootstrap
            };
        }
    ]);
})();