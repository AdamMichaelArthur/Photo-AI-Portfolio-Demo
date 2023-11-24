var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var helpers = require('@classes/helpers')
var ctrl = require('@controllers/hubspot_staging/contact.js');

// get all contact
router.get("/hubspot/contact/getAllContacts", ctrl.getAllContacts, validation.checkInput({}),
    validation.checkOutput({"all_contacts":"Object"}));


 // get recently update   
router.get("/hubspot/getRecentlyUpdated", ctrl.getRecentlyUpdated, validation.checkInput({}),
    validation.checkOutput({"all_updates":"Object"}));


// get contact by id
router.get("/hubspot/getContactById/contact_id/:contact_id", ctrl.getContactById, validation.checkInput({}),
    validation.checkOutput({"contactby_id":"Object"}));



//Get Contact by Email
router.get("/hubspot/getContactByEmail/email/:email", ctrl.getContactByEmail, validation.checkInput({}),
    validation.checkOutput({"contactby_email":"Object"}));


// Create A Contact
router.post("/hubspot/createContact", ctrl.createContact, validation.checkInput({
        "firstname":"String", 
        "lastname":"String",
        "email":"String"
    }), validation.checkOutput({"contact":"Object"}))




// delete A Contact by id
router.delete("/hubspot/deleteContactById/contact_id/:contact_id", ctrl.deleteContactById, validation.checkInput({}),
   validation.checkOutput({}));


// Search Contact 
router.get("/hubspot/search/:query", ctrl.searchContact, validation.checkInput({}),
   validation.checkOutput({}));

module.exports = router