var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var helpers = require('@classes/helpers')
var ctrl = require('@controllers/accounts.js');

router.post("/register", ctrl.createAccount);

// /user is a restricted route and is used for creating additional users for the master account
router.post("/user", has.permission("write"), ctrl.createUser)

// Invites a user to create a sub-account
router.post("/invite", has.permission("write"), validation.checkInput({
		email:"String"
}), ctrl.invite, validation.checkOutput({
		email_sent:"Boolean"
}))

// Accepts an invitation to create a sub-account
router.post("/accept", has.permission("write"), validation.checkInput({
		email:"String",
		first_name:"String",
		last_name:"String",
		phone:"String"
}), ctrl.invite, validation.checkOutput({
		email_sent:"Boolean"
}))

module.exports = router