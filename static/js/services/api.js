(function(){
	"use strict";

	var bitpaydemo = angular.module('bitpaydemo');

	bitpaydemo.factory('productsServices', [
            '$resource',
            'bitpayDemoConfig',
        function($resource, tenacityConfig){
            var apiConfig = tenacityConfig.API;
            return $resource(
                [apiConfig.URL, "/account"].join(''), //endpoint
                {},
                {
                    login      : { method: "POST", url : [apiConfig.URL, "/authenticate"].join("")}
                    //adminLogout     : { method: "GET", url : [apiConfig.URL, "/auth/adminToken/invalidate"].join('')},
                    //adminAuthToken  : { method: "GET", url : [apiConfig.URL, "/auth/adminToken"].join('')}
                }
            );
        }
    ]);
})();