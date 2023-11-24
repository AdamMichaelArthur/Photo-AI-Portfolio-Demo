var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var ctrl = require('@controllers/email/email.js');
var route = "email";

router.post("/email/send", ctrl.sendMail, validation.checkInput({
	"emailTo":"String",
	"type":"String",
	"subject":"String",
	"msg":"String"}),

validation.checkOutput({ "status": "String" }));


router.post("/email/support/send", ctrl.sendSupportEmail, validation.checkInput({
	"emailTo":"String",
	"type":"String",
	"subject":"String",
	"msg":"String"}),

validation.checkOutput({ "status": "String" }));



router.post("/email/sendScheduleEmail", ctrl.sendScheduleEmail, validation.checkInput({
	"emailTo":"String",
	"type":"String",
	"subject":"String",
	"msg":"String"}),

validation.checkOutput({ "status": "String" }));

module.exports = router