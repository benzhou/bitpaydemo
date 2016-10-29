'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var bitcore = require('bitcore-lib');

var logger = require('./logger');
var config = require('./config');

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
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
  this.bus = null;

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

    try{
      self.bus = self.node.openBus();

      self.bus.on('tx', function(message) {
        self.log.info('BitPayDemoService => received tx event:', message);
      });
    }catch(e){
      self.log.info('BitPayDemoService => Error when start event bus:', e);
      self.log.info('BitPayDemoService => Cleaning.');
      if(self.bus){
        self.bus.close();
      }

      //Closing DB connecting.
      dbConn.close(function() {
        self.log.info('BitPayDemoService => Cleaned.');
        
        //re-throw to cause the node to shut down.
        throw e;
      });
    }

    setImmediate(callback);
  });
};

BitPayDemoService.prototype.stop = function(callback) {
  var self = this;
  self.log.info('BitPayDemoService => stop');

  var dbConn = mongoose.connection;

  if(dbConn){
    self.log.info('BitPayDemoService => stop => Shutting down db connection.');
    dbConn.close(function() {
      self.log.info('BitPayDemoService => stop => DB connection stopped.');

      if(self.bus){
        self.log.info('BitPayDemoService => stop => closing event bus.');
        self.bus.close();
        self.log.info('BitPayDemoService => stop => event bus closed.');
      }
      callback();
    });
  }else{
    if(self.bus){
      self.log.info('BitPayDemoService => stop => closing event bus.');
      self.bus.close();
      self.log.info('BitPayDemoService => stop => event bus closed.');
    }

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
    res.render('index', {
      baseUrl : '/' + self.getRoutePrefix() + '/'
    });
  });

  app.get('/api/products', function(req, res, next) {

    models.Product.find({}, function(err, products) {
      if(err){
        self.log.info('GET /products Error: ', err);
        return next(err);
      }

      res.json({
        products : products
      });
    });
  });

  app.post('/api/products',function(req, res, next) {
    var product = new models.Product({
      name : req.body.name,
      price : req.body.price,
      quantity : req.body.quantity,
    });

    product.save(function(err) {
      if(err){
        return next(err);
      }

      res.json({
        sucess : true
      });
    });
  });

  //util function to follow DRY principle.
  var getPaymentAddress = function() {
      self.addressIndex++;
      //var address = self.hdPrivateKey.derive(self.addressIndex).privateKey.toAddress();
      var address = new bitcore.Address(self.hdPublicKey.derive(self.addressIndex).publicKey, self.node.network);
      self.log.info('New invoice with address:', address.toString());
      var hash = address.hashBuffer.toString('hex');

      return {
        address: address.toString(),
        hash  : hash
      };
  };

  app.post('/api/gopay', function(req, res, next) {
    var productId = req.body.productId;
    
    if(!req.body || !req.body.productId){
      return next({
        httpStatusCode : 400,
        message : 'Product Id is required.'
      });
    }

    //Lookup the product is being purchased.
    models.Product.findOne({_id: new ObjectId(productId)}, function(err, product) {
      if(err){
        return next(err);
      }

      if(!product){
        return next({
          httpStatusCode : 400,
          message : "invalid product"
        });
      }

      var addrObj = getPaymentAddress();

      var transaction = new models.Transaction({
        productId : new ObjectId(productId),
        toAddress : addrObj.address,
        amount : product.price,
        open   : true
      });

      transaction.save(err, function() {
        if(err){
          return next({
            httpStatusCode : 500,
            message : 'Not able to initiate this request.'
          });
        }

        res.json({
          amount : product.price,
          address : addrObj.address,
          hash    : addrObj.hash
        });
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
    var addrObj = getPaymentAddress(amount);

    res.render('payment', {
      amount : amount / 1e8,
      address : addrObj.address,
      hash    : addrObj.hash,
      baseUrl : '/' + self.getRoutePrefix() + '/'
    });
  });


  //Catch all unmatched routes. 404
  app.use(function(req, res) {
    res.status(404).render('404');
  });

  //API error handler, return JSON object
  app.use('/api', function(err, req, res, next) {
    res.json(err.httpStatusCode || 500, {
        success : false,
        message : err.message
    });
  });
};

BitPayDemoService.prototype.getRoutePrefix = function() {
  this.log.info('BitPayDemoService => getRoutePrefix');
  return 'demoservice';
};



module.exports = BitPayDemoService;