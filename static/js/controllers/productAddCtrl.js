(function(){
	"use strict";

	var bitpaydemo = angular.module('bitpaydemo');

	bitpaydemo.controller('productAddCtrl', [
		'$scope',
		'$rootScope',
		'$log',
		'$state',
		'$stateParams',
		'sessionService',
		'productsServices',
		function($scope, $rootScope, $log, $state, $stateParams,
			sessionService, productsServices){
			
			$scope.createEditProduct = function(product){	
				var toSave = {
						name: product.name,
						price : product.price,
						quantity : product.quantity
					};

				productsServices.save({}, toSave).$promise.then(function(result){
					$log.debug(result);
					
					$state.go("root.index");
				}).catch(function(e){
					$log.debug("error");
					$log.debug(e);
					$scope.errmsg = e.data.message;

				}).finally(function(){
					
				});
			};
	}]);
})();