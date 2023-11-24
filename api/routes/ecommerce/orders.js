var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var ctrl = require('@controllers/ecommerce/orders.js');

router.post("/orders", has.permission("write"), validation.checkInput({
	// Input validation fields here
}), ctrl.createOrders, validation.checkOutput({
	// Input validation fields here
}));

//router.get("/Orders", has.permission("read"), ctrl.listOrders); 						// Returns a paginated list of images
//router.get("/Orders/page/:page/id/:id", has.permission("read"), ctrl.listOrders); 		// Returns a paginated list of images


// router.put("/orders", has.permission("write"), ctrl.updateOrders);					// Creates a record
// router.get("/orders/id/:id", has.permission("read"), ctrl.listOrders);				// Provides a paginated list
// router.patch("/orders/id/:id/key/:key/value/:value", has.permission("write"), ctrl.editOrders);
// 															// Allows you to update a single key/value pair
// 															// in the mongo document
// router.delete("/orders/id/:id", has.permission("delete"), ctrl.deleteOrders)	

module.exports = router
