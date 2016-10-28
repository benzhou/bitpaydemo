(function (root) {
    'use strict';
    var __hasOwn = {}.hasOwnProperty;

    function constantify (str) {
        return str.replace(/^[^A-Za-z]/, '_$&')
            .replace(/[A-Z]/g, '_$&')
            .replace(/[^A-Za-z0-9]/g, '_')
            .toUpperCase();
    }
    root.configGen = function (namespace, constantName, config) {
        if (typeof namespace !== 'string') {
            throw new Error('namespace must be a string');
        }

        if (typeof constantName !== 'string') {
            throw new Error('constantName must be a string');
        }

        if (typeof config !== 'object') {
            throw new Error('config must be an object');
        }

        var mod = angular.module(namespace, []).constant(constantName, config);
        /*
        for (var key in config) {
            if (__hasOwn.call(config, key)) {
                mod.constant(constantify(key), config[key]);
            }
        }
        */
        return mod;
    };
}(this));