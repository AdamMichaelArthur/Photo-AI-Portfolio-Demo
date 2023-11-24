var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var ctrl = require('@controllers/ecommerce/customers.js');

router.post("/customers", has.permission("write"), validation.checkInput({
	// Input validation fields here
}), ctrl.createCustomers, validation.checkOutput({
	// Input validation fields here
}));

router.get("/Customers", has.permission("read"), ctrl.listCustomers); 						// Returns a paginated list of images
router.get("/Customers/page/:page/id/:id", has.permission("read"), ctrl.listCustomers); 		// Returns a paginated list of images


// router.put("/customers", has.permission("write"), ctrl.updateCustomers);					// Creates a record
// router.get("/customers/id/:id", has.permission("read"), ctrl.listCustomers);				// Provides a paginated list
// router.patch("/customers/id/:id/key/:key/value/:value", has.permission("write"), ctrl.editCustomers);
// 															// Allows you to update a single key/value pair
// 															// in the mongo document
// router.delete("/customers/id/:id", has.permission("delete"), ctrl.deleteCustomers)	

module.exports = router
