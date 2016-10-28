"use strict";

var config = {
  LOGGER : {
    LEVEL : "debug"
  },
  db : {
      connectionString :  "mongodb://" + (process.env.MONGODB_ADDR || "localhost") + ":27017/bitpaydemo",
      poolSize :          10
  }
};

module.exports = config;

