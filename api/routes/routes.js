var express = require('express');
var router = express.Router();
var has = require("../classes/permissions.js");

var ctrl = require('../controllers/routes.js');

router.post("/routes", ctrl.createRoutes);		// Send Data to the server
// router.put("/routes", ctrl.updateRoutes);		// Creates a record
// router.get("/routes/id/:id", ctrl.listRoutes);	// Provides a paginated list
// router.patch("/routes/id/:id/key/:key/value/:value", ctrl.editRoutes);
// 															// Allows you to update a single key/value pair
// 															// in the mongo document
// router.delete("/routes/id/:id", ctrl.deleteRoutes)	
 
module.exports = router
