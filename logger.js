"use strict";

var bunyan = require('bunyan');
var config = require("./config");
var pjson = require("./package.json");

config.version = pjson.version;

var logLevel = config.LOGGER.LEVEL;

var logger = (function(){
        var log = bunyan.createLogger({
            level: logLevel.toLowerCase(),
            name: pjson.name
        });

        return log;
    })();
    
logger.info("logging level has been set to %s", logLevel.toLowerCase());

module.exports = logger;