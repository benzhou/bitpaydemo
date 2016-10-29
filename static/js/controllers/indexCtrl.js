(function(){
	"use strict";

	var bitpaydemo = angular.module('bitpaydemo');

	bitpaydemo.controller('indexCtrl', [
		'$scope',
		'$rootScope',
		'$log',
		'$state',
		'productsServices',
		function($scope, $rootScope, $log, $state, productsServices){
			productsServices.get().$promise.then(function(result){
				$scope.products = result.products;
			});

			$scope.buy = function(product) {
				$log.log('product: ', product);
				$state.go('root.buy', {id : product._id, price : product.price});
			};
	}]);
})();