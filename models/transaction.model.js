'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Note: This Transaction represents the store transaction. not bitcoin transaction.
 * 
 */
var transactionSchema = new Schema({
	productId   : { type :  Schema.Types.ObjectId, required : true},
	toAddress   : { type: String, required : true},
	fromAddress : String,
	amount  	: { type: Number, required : true},
	amountPaid  : { type: Number, default : 0	},
	open 		: { type: Boolean, default : false},
	openedOn  : { type: Date, default: Date.now },
	closedOn  : { type: Date },
	createdOn : { type: Date, default: Date.now }
});

var Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;