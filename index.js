'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var bitcore = require('bitcore-lib');

var logger = require('./logger');
var config = require('./config');

var mongoose = require('mongoose');
var models = require('./models');

//Catch uncaught exceptions.
process.on('uncaughtException', function (err) {
    logger.error("uncaughtException - err: ", err);
});

var BitPayDemoService = function(options) {
  EventEmitter.call(this);

  //logger.debug('BitPayDemoService => constructor => options', util.inspect(options, false, null));
  this.node = options.node;
  this.name = options.name;
  this.log = this.node.log;

  /*
  this.hdPrivateKey = new bitcore.HDPrivateKey(this.node.network);
  this.log.info('Using key:', this.hdPrivateKey);
  */
 
  var hdPrivateKey = new bitcore.HDPrivateKey(this.node.network);
  this.hdPublicKey = hdPrivateKey.hdPublicKey;
  this.addressIndex = 0;
};

util.inherits(BitPayDemoService, EventEmitter);

BitPayDemoService.dependencies = ['bitcoind'];

BitPayDemoService.prototype.start = function(callback) {
  var self = this;

  this.log.info('BitPayDemoService => start');
  this.log.info('Starting to connect DB.');

  mongoose.connect(config.db.connectionString);

  var dbConn = mongoose.connection;
  dbConn.on('error', function(e) {
    self.log.info('BitPayDemoService => Error when connecting to DB. Connection Error: ', e);
    setImmediate(callback);
  });
  dbConn.once('open', function() {
    // we're connected!
    self.log.info('BitPayDemoService => DB connected successfully.');
    setImmediate(callback);
  });
};

BitPayDemoService.prototype.stop = function(callback) {
  this.log.info('BitPayDemoService => stop');

  var dbConn = mongoose.connection;

  if(dbConn){
    this.log.info('BitPayDemoService => stop => Shutting down db connection.');
    dbConn.close(function() {
      this.log.info('BitPayDemoService => stop => DB connection stopped.');
      callback();
    });
  }else{
    setImmediate(callback);
  }
};

BitPayDemoService.prototype.getAPIMethods = function() {
  this.log.info('BitPayDemoService => getAPIMethods');
  return [];
};

BitPayDemoService.prototype.getPublishEvents = function() {
  this.log.info('BitPayDemoService => getPublishEvents');
  return [];
};

BitPayDemoService.prototype.setupRoutes = function(app, express) {
  this.log.info('BitPayDemoService => setupRoutes');
  var self = this;

  //Setup express-handlebar
  app.engine('handlebars', exphbs({}));
  app.set('view engine', 'handlebars');
  app.set('views', __dirname + '/views');
  
  app.use('/static', express.static(__dirname + '/static'));
  app.use(bodyParser.urlencoded());
  
  /*
  Setup Routes
  */
  
  app.get('/', function(req, res) {
    res.render('index', {});
  });

  app.get('/products', function(req, res, next) {

    models.Product.find({}, function(err, products) {
      if(err){
        self.log.info('GET /products Error: ', err);
        return next(err);
      }

      res.render('products', {
        products : products
      });
    });
  });


  app.post('/gopay', function(req, res, next) {
    var amount = req.body.amount;
    
    //if amount is null or 0, or not a valid floating number, we don't continue process
    if(!amount || !/^[+-]?\d+(\.\d+)?$/gi.test(amount)){
      return res.status(400).render('payment-invalid');
    }

    amount = parseFloat(amount) * 1e8;
    self.addressIndex++;

    //var address = self.hdPrivateKey.derive(self.addressIndex).privateKey.toAddress();
    var address = new bitcore.Address(self.hdPublicKey.derive(self.addressIndex).publicKey, self.node.network);
    self.log.info('New invoice with address:', address);
    var hash = address.hashBuffer.toString('hex');

    res.render('payment', {
      amount : amount / 1e8,
      address : address,
      hash    : hash,
      baseUrl : '/' + self.getRoutePrefix() + '/'
    });
  });

  app.use(function(req, res) {
    res.status(404).render('404');
  });
};

BitPayDemoService.prototype.getRoutePrefix = function() {
  this.log.info('BitPayDemoService => getRoutePrefix');
  return 'demoservice';
};



module.exports = BitPayDemoService;