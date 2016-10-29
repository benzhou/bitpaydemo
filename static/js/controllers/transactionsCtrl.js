(function(){
	"use strict";

	var bitpaydemo = angular.module('bitpaydemo');

	bitpaydemo.controller('transactionsCtrl', [
		'$scope',
		'$rootScope',
		'$log',
		'$state',
		'transactionsServices',
		function($scope, $rootScope, $log, $state, transactionsServices){
			transactionsServices.get().$promise.then(function(result){
				$scope.trans = result.transactions;
			});
	}]);
})();