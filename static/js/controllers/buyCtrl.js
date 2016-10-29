(function(){
	"use strict";

	var bitpaydemo = angular.module('bitpaydemo');

	bitpaydemo.controller('buyCtrl', [
		'$scope',
		'$rootScope',
		'$log',
		'$state',
		'$stateParams',
		'sessionService',
		'buyServices',
		function($scope, $rootScope, $log, $state, $stateParams,
			sessionService, buyServices){
			
			$scope.v = 5;
			$scope.e = 'M';
			$scope.s = '274';

			if(!$stateParams.id){
				return $state.go('root.index');
			}

			var toSave = {
				productId : $stateParams.id,
				amount : $stateParams.price
			};

			buyServices.save({}, toSave).$promise.then(function(result){
				$log.debug(result);
				
				$scope.qrData = ['bitcoin:', result.address,'?amount=', result.amount].join('');
				$scope.address = result.address;
				$scope.amount = result.amount;
				
			}).catch(function(e){
				$log.debug("error");
				$log.debug(e);
				$scope.errmsg = e.data.message;

			}).finally(function(){
				
			});
	}]);
})();