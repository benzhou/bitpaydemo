'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var BitPayDemoService = function(options) {
  EventEmitter.call(this);

  this.node = options.node;
  this.name = options.name;
};

util.inherits(BitPayDemoService, EventEmitter);

BitPayDemoService.dependencies = ['bitcoind'];

BitPayDemoService.prototype.start = function(callback) {
  setImmediate(callback);
};

BitPayDemoService.prototype.stop = function(callback) {
  setImmediate(callback);
};

BitPayDemoService.prototype.getAPIMethods = function() {
  return [];
};

BitPayDemoService.prototype.getPublishEvents = function() {
  return [];
};

BitPayDemoService.prototype.setupRoutes = function(app, express) {
  var self = this;

  app.use(bodyParser.urlencoded({extended: true}));

  app.use('/', express.static(__dirname + '/static'));

  app.post('/invoice', function(req, res, next) {
    self.addressIndex++;
    self.amount = parseFloat(req.body.amount) * 1e8;
    res.status(200).send(self.filterInvoiceHTML());
  });
};

BitPayDemoService.prototype.getRoutePrefix = function() {
  return 'demo-api';
};



module.exports = BitPayDemoService;