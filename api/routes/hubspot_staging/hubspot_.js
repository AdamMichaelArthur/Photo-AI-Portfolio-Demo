var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var helpers = require('@classes/helpers')
var ctrl = require('@controllers/hubspot_staging/hubspot.js');

router.get("/hubspot/getAllContacts", ctrl.getAllContacts, validation.checkInput({}),
	validation.checkOutput({"all_contacts":"Object"}));

router.get("/hubspot/getRecentlyUpdated", ctrl.getRecentlyUpdated, validation.checkInput({}),
    validation.checkOutput({"all_updates":"Object"}));

router.get("/hubspot/getContactById/contact_id/:contact_id", ctrl.getContactById, validation.checkInput({}),
    validation.checkOutput({"all_updates":"Object"}));

router.get("/hubspot/GetContactByEmail/email_id/:email_id", ctrl.GetContactByEmail, validation.checkInput({}),
    validation.checkOutput({"all_updates":"Object"}));

module.exports = router

