var express = require('express');
var router = express.Router();
var has = require("../classes/permissions.js");

var ctrl = require('../controllers/roles.js');

router.post("/roles", ctrl.createRoles);		// Send Data to the server
router.get("/roles", ctrl.getRoles);
// router.put("/roles", ctrl.updateRoles);		// Creates a record
// router.get("/roles/id/:id", ctrl.listRoles);	// Provides a paginated list
// router.patch("/roles/id/:id/key/:key/value/:value", ctrl.editRoles);
// 															// Allows you to update a single key/value pair
// 															// in the mongo document
// router.delete("/roles/id/:id", ctrl.deleteRoles)	

module.exports = router
