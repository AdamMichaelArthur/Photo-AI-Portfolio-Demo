var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var ctrl = require('@controllers/ecommerce/products.js');

router.post("/products", has.permission("write"), validation.checkInput({
	// Input validation fields here
	"title": "String",
    "date": "String",
    "tags": "Array",
    "categories": "Array",
    "images": "Array",
    "thumbnailImage": "String",
    "comparePrice": "Number",
    "actualPrice": "Number",
    "inStock": "Boolean",
    "options": "Object",
    "variants": "Array"
}), ctrl.createProducts, validation.checkOutput({
	// Input validation fields here
}));

router.get("/products", has.permission("read"), ctrl.listProducts); 						// Returns a paginated list of images
router.get("/products/page/:page/id/:id", has.permission("read"), ctrl.listProducts); 		// Returns a paginated list of images


// router.put("/products", has.permission("write"), ctrl.updateProducts);					// Creates a record
// router.get("/products/id/:id", has.permission("read"), ctrl.listProducts);				// Provides a paginated list
// router.patch("/products/id/:id/key/:key/value/:value", has.permission("write"), ctrl.editProducts);
// 															// Allows you to update a single key/value pair
// 															// in the mongo document
// router.delete("/products/id/:id", has.permission("delete"), ctrl.deleteProducts)	

module.exports = router
