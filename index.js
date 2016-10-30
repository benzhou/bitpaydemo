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

  this.listeningAddresses = {};

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

      self.bus.on('bitcoind/rawtransaction', function(message) {
        self.log.info('BitPayDemoService => received bitcoind/rawtransaction event:', message);
      });

      self.node.services.bitcoind.on('tx', self.transactionHandler.bind(self));
      self.bus.on('bitcoind/addresstxid', function(data) {
        self.log.info('BitPayDemoService => received bitcoind/addresstxid event: address: ', data.address);

        if(self.listeningAddresses.hasOwnProperty(data.address)){
          self.log.info('========>  Found ! BitPayDemoService => received bitcoind/addresstxid event'); 
        }
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
        self.log.info('GET /api/products Error: ', err);
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

  app.get('/api/transactions', function(req, res, next) {
    models.Transaction.find().limit(10).sort({createdOn : -1}).exec(function(err, transactions) {
      if(err){
        self.log.info('GET /api/transactions Error: ', err);
        return next(err);
      }

      res.json({
        transactions : transactions
      });
    });
  });
           
  app.get('/api/transactions/:id([0-9a-fA-F]{24})', function(req, res, next) {
    models.Transaction.findOne({_id : req.params.id},function(err, t) {
      if(err){
        self.log.info('GET /api/transactions/:id Error: ', err);
        return next(err);
      }

      res.json({
        transaction : t
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

      transaction.save(function(err, t) {
        if(err){
          return next({
            httpStatusCode : 500,
            message : 'Not able to initiate this request.'
          });
        }

        self.log.info('POST /api/gopay => t: ', t);
        //Adding the address to the listening collection so later we can find it when we receive a tx event.
        self.listeningAddresses[addrObj.address] = {
          transactionId : t._id,
          productId : new ObjectId(productId),
          toAddress : addrObj.address,
          amount : product.price
        };

        res.json({
          tranId : t._id,
          amount : product.price,
          address : addrObj.address,
          hash    : addrObj.hash
        });
      });
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

/*
 * transactionHandler: this is the delegate when a transaction is received by your node
 */
BitPayDemoService.prototype.transactionHandler = function(txBuffer) {
  var self = this;
  var tx = bitcore.Transaction().fromBuffer(txBuffer);

  //this.log.info('BitPayDemoService => transactionHandler => received tx event. listening:', self.listeningAddresses);

  for (var i = 0; i < tx.outputs.length; i++) {
    self.transactionOutputHandler(tx.outputs[i], tx);
  }

};

/*
 * transactionInputHandler: helper for transactionHandler
 */
BitPayDemoService.prototype.transactionOutputHandler = function(output, tx) {
  var self = this;

  if (!output.script) {
    return;
  }
  var address = output.script.toAddress(self.node.network);

  if(!address){ return;}
  var addr = address.toString();
  //this.log.info('BitPayDemoService => transactionInputHandler => address:', addr);
  if (addr && this.listeningAddresses.hasOwnProperty(addr)) {
    self.log.info('BitPayDemoService => transactionInputHandler => found transaction for address:', addr);
    self.log.info('BitPayDemoService => transactionInputHandler => transaction:', tx);
    self.log.info('BitPayDemoService => transactionInputHandler => transaction:', tx.toJSON());
    self.log.info('BitPayDemoService => transactionInputHandler => output.satoshis:', output.satoshis);
    
    //Get the amount paid of this outputs. It may or may not same as what requested.
    var paid = bitcore.Unit.fromSatoshis(output.satoshis).bits;
    var tranId = self.listeningAddresses[addr].transactionId;

    models.Transaction.findOne({_id : tranId}, function(err, tran) {
      if(err){
        self.log.info('BitPayDemoService => transactionInputHandler => err occurred when look up transaction %s, err: %s', tranId, err);
        return;
      }

      if(!tran){
        self.log.info('BitPayDemoService => transactionInputHandler => can\'t find transaction %s', tranId);
        return;
      }

      if(!tran.open){
        self.log.info('BitPayDemoService => transactionInputHandler => transaction has been closed.', tranId);
        return;
      }

      //Once amount previously paid plus this time paid is greater equal than what was needed be to paid, we can close this store transaction.
      var amountBits = bitcore.Unit.fromBTC(tran.amount).bits;
      var amountPaidBits = bitcore.Unit.fromBTC(tran.amountPaid).bits;

      amountPaidBits = amountPaidBits + paid;

      self.log.info('BitPayDemoService => transactionInputHandler => amountPaidBits %s and amountBits %s.', amountPaidBits, amountBits);
      var shouldCloseTheTransaction = (amountPaidBits >= amountBits);
      if(shouldCloseTheTransaction){
        self.log.info('BitPayDemoService => transactionInputHandler => amount needed is paid, closing the store transaction.');
        tran.open = false;
        tran.closedOn = new Date();
      }

      tran.amountPaid = bitcore.Unit.fromBits(amountPaidBits).BTC;

      tran.save(function(err) {
        //Need to figure out what if at this point, we got an error to update our DB.
        //Retry? transaction happened, so we don't want to listen it anymore.
        if(shouldCloseTheTransaction){
          delete self.listeningAddresses[addr];
        }

        if(err){
          self.log.info('BitPayDemoService => transactionInputHandler => err when save store transaction %s, err: %s', tranId, err);
        }
      });
    });
  }
};



module.exports = BitPayDemoService;