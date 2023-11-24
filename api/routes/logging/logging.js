var express = require('express');
var router = express.Router();
var validation = require("@classes/validation.js")
var ctrl = require('@controllers/logging/logging.js');
var route = "logging";

router.post("/logging/create", ctrl.create, validation.checkInput({
	"screen":"String",
	"subview":"String",
	"function":"String",
	"msg":"String",
	"line":"Number",
	"file":"String"
}
),
validation.checkOutput({ "status": "String" }));

router.post("/logging/find", ctrl.find, validation.checkInput({
	"queryData":"Object"
}
),
validation.checkOutput({ "status": "Array" }));

module.exports = router

