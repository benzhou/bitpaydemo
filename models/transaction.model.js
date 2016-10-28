var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transactionSchema = new Schema({
	toAddress   : { type: String, required : true},
	fromAddress : String,
	amount  : { type: Number, required : true},
	createdOn : { type: Date, default: Date.now }
});

var Transaction = mongoose.model('Thing', transactionSchema);

module.export = Transaction;