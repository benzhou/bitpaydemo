'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transactionSchema = new Schema({
	productId   : { type :  mongoose.Types.ObjectId, required : true},
	toAddress   : { type: String, required : true},
	fromAddress : String,
	amount  : { type: Number, required : true},
	open 	: { type: Boolean, default : false},
	openedOn  : { type: Date, default: Date.now },
	closedOn  : { type: Date },
	createdOn : { type: Date, default: Date.now }
});

var Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;