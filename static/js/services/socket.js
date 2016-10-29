(function(){
	"use strict";

	var bitpaydemo = angular.module('bitpaydemo');

	bitpaydemo.factory('bitPaySocket', function(socketFactory) {
        return socketFactory();
    });
})();