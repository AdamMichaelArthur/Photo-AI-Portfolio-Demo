var mongoose = require('mongoose');

var mongo = require('@classes/mongo.js')
/* mongo.js is a mini MongoDB ORD that is project-specific, designed to simplify common tasks 
	mongoCreate		model
	mongoDelete		_id
	mongoCreateOnDuplicateKeyUpdate		key | data
*/

module.exports = class Mongo {

	constructor(User) {
		this.model = mongoose.model("Products");
		this.mongo = new mongo(this.model, User)
		this.user = User;
		this.res = res;
	}

	addProduct(product) {
		var productModel = this.mongo.mongoCreate(product);
		if(productModel == false)
			return -1;
		return productModel._id;
	}

	removeProduct(idOrBarcodeOrCode) {
		// idOrBarcodeOrCode can be the _id database id of the product, a barcode, UPC, GTIN, etc or an item code
	}

	searchProducts(query) {

	}

	getProductById(id) {

	}


}