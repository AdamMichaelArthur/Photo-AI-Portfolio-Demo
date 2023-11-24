var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var ctrl = require('@controllers/hugo/hugo.js');

router.post("/hugo", has.permission("write"), validation.checkInput({
	// Input validation fields here
	"siteName":"String"
}), ctrl.createHugo, validation.checkOutput({
	// Input validation fields here
}));

router.get("/hugo", has.permission("read"), ctrl.listHugo); 						// Returns a paginated list of images
router.get("/hugo/page/:page/id/:id", has.permission("read"), ctrl.listHugo); 		// Returns a paginated list of images


// router.put("/hugo", has.permission("write"), ctrl.updateHugo);					// Creates a record
// router.get("/hugo/id/:id", has.permission("read"), ctrl.listHugo);				// Provides a paginated list
// router.patch("/hugo/id/:id/key/:key/value/:value", has.permission("write"), ctrl.editHugo);
// 															// Allows you to update a single key/value pair
// 															// in the mongo document
// router.delete("/hugo/id/:id", has.permission("delete"), ctrl.deleteHugo)	

module.exports = router
