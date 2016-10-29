(function(){
	"use strict";

	var bitpaydemo = angular.module('bitpaydemo');

	bitpaydemo.factory('productsServices', [
            '$resource',
            'bitpayDemoConfig',
        function($resource, bitpayDemoConfig){
            var apiConfig = bitpayDemoConfig.API;
            return $resource([apiConfig.URL, "/products"].join('')); //endpoint);
        }
    ]).factory('buyServices', [
            '$resource',
            'bitpayDemoConfig',
        function($resource, bitpayDemoConfig){
            var apiConfig = bitpayDemoConfig.API;
            return $resource([apiConfig.URL, "/gopay"].join('')); //endpoint);
        }
    ]);
})();