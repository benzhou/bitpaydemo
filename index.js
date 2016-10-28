'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');

var logger = require('./logger');

//Catch uncaught exceptions.
process.on('uncaughtException', function (err) {
    logger.error("uncaughtException - err: ", err);
});

var BitPayDemoService = function(options) {
  EventEmitter.call(this);

  logger.debug('BitPayDemoService => constructor => options', util.inspect(options, false, null));
  this.node = options.node;
  this.name = options.name;
};

util.inherits(BitPayDemoService, EventEmitter);

BitPayDemoService.dependencies = ['bitcoind'];

BitPayDemoService.prototype.start = function(callback) {
  logger.debug('BitPayDemoService => start');
  setImmediate(callback);
};

BitPayDemoService.prototype.stop = function(callback) {
  logger.debug('BitPayDemoService => stop');
  setImmediate(callback);
};

BitPayDemoService.prototype.getAPIMethods = function() {
  logger.debug('BitPayDemoService => getAPIMethods');
  return [];
};

BitPayDemoService.prototype.getPublishEvents = function() {
  logger.debug('BitPayDemoService => getPublishEvents');
  return [];
};

BitPayDemoService.prototype.setupRoutes = function(app, express) {
  logger.debug('BitPayDemoService => setupRoutes');
  var self = this;

  //Setup express-handlebar
  app.engine('handlebars', exphbs({}));
  app.set('view engine', 'handlebars');
  
  app.use('/static', express.static(__dirname + '/static'));
  app.use(bodyParser.urlencoded());
  /*
  Setup Routes
  */
  
  app.get('/', function(req, res) {
    res.render('index', {});
  });

  app.post('/gopay', function(req, res, next) {
    var amount = req.body.amount;
    
    //if amount is not passed in or is 0, we don't continue process
    if(!amount || !/^[+-]?\d+(\.\d+)?$/gi.test(amount)){
      return res.status(400).render('payment-invalid');
    }

    amount = parseFloat(amount) * 1e8;

    res.render('payment', {
      amount : amount
    });
  });

  app.use(function(req, res) {
    res.status(404).render('404');
  });
};

BitPayDemoService.prototype.getRoutePrefix = function() {
  logger.debug('BitPayDemoService => getRoutePrefix');
  return 'demoservice';
};



module.exports = BitPayDemoService;