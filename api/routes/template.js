var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var ctrl = require('@controllers/zzendpointzz/zzendpointzz.js');
var route = "zzendpointzz";

router.post("/zzendpointzz", has.permission("write"), validation.checkInput({
	// Input validation fields here
}), ctrl.createzzEndpointzz, validation.checkOutput({
	// Input validation fields here
}));

router.get("/zzendpointzz", has.permission("read"), ctrl.listzzEndpointzz); 						// Returns a paginated list of images
router.get("/zzendpointzz/page/:page/id/:id", has.permission("read"), ctrl.listzzEndpointzz); 		// Returns a paginated list of images


// router.put("/zzendpointzz", has.permission("write"), ctrl.updatezzEndpointzz);					// Creates a record
// router.get("/zzendpointzz/id/:id", has.permission("read"), ctrl.listzzEndpointzz);				// Provides a paginated list
// router.patch("/zzendpointzz/id/:id/key/:key/value/:value", has.permission("write"), ctrl.editzzEndpointzz);
// 															// Allows you to update a single key/value pair
// 															// in the mongo document
// router.delete("/zzendpointzz/id/:id", has.permission("delete"), ctrl.deletezzEndpointzz)	

module.exports = router