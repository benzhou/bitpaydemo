(function(){
	"use strict";

	var bitpaydemo = angular.module('bitpaydemo');

	bitpaydemo.controller('loginCtrl', [
		'$scope',
		'$rootScope',
		'$log',
		'$state',
		'$timeout',
		'appEvents',
		'LABELS',
		'accountServices',
		'sessionService',
		function($scope, $rootScope, $log, $state, $timeout, appEvents, LABELS, accountServices, sessionService){
			if(sessionService.isLoggedIn()){
				$state.go("root.merchant.home");
			}

			$scope.login = function(credentials){
				$rootScope.$broadcast(appEvents.SHOW_LOADING);
				
				accountServices.login({}, credentials).then(function(result){
					sessionService.login(result.data.account);
					
					if(result.data.account.passwordReset){
						$state.go("resetPassword");
					}else{
						$state.go("root.merchant.home");
					}
				}).catch(function(e){
					$log.debug("Login error");
					$log.debug(e);
				}).finally(function(){
					
				});
			};
	}]);
})();