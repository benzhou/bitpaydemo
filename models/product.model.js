'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
	name   		: { type: String, required : true},
	price  		: { type: Number, required : true},
	quantity  	: { type: Number, required : true},
	createdOn 	: { type: Date, default: Date.now }
});

var Product = mongoose.model('Thing', productSchema);

module.exports = Product;