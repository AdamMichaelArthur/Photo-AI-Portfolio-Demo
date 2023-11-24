var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var helpers = require('@classes/helpers')
var ctrl = require('@controllers/hubspot_staging/hubspot.js');

// Hubspot Contact Api Start
// get all contact
router.get("/hubspot/getAllContacts", ctrl.getAllContacts, validation.checkInput({}),
    validation.checkOutput({ "all_contacts": "Object" }));

router.get("/hubspot/refreshAccessToken", ctrl.refreshAccessToken, validation.checkInput({}),
    validation.checkOutput({ "all_contacts": "Object" }));

// get recently update contacts
router.get("/hubspot/getRecentlyUpdatedContacts", ctrl.getRecentlyUpdatedContacts, validation.checkInput({}),
    validation.checkOutput({ "all_updated_contacts": "Object" }));

// get contact by id
router.get("/hubspot/getContactById/contact_id/:contact_id", ctrl.getContactById, validation.checkInput({}),
    validation.checkOutput({ "contactby_id": "Object" }));

// get insights by contact_id
router.post("/hubspot/getInsights/contact_id/:contact_id", ctrl.getInsights, 
    validation.checkInput({ "campaign":"String"}),
    validation.checkOutput({ "insights": "Object" }));

router.get("/hubspot/updateInsights/contact_id/:contact_id", ctrl.updateInsights, validation.checkInput({}),
    validation.checkOutput({ "insights": "Object" }));

//Get Contact by Email
router.get("/hubspot/getContactByEmail/email/:email", ctrl.getContactByEmail, validation.checkInput({}),
    validation.checkOutput({ "contactby_email": "Object" }));

// Create A Contact
router.post("/hubspot/createContact", ctrl.createContact, validation.checkInput({
    "firstname": "String",
    "lastname": "String",
    "email": "String"
}), validation.checkOutput({ "contact": "Object" }))

// delete A Contact by id
router.delete("/hubspot/deleteContactById/contact_id/:contact_id", ctrl.deleteContactById,
    validation.checkInput({}),
    validation.checkOutput({ "contact": "Object" }));

// Search Contact 
router.get("/hubspot/search/:query", ctrl.searchContact,
    validation.checkInput({}),
    validation.checkOutput({"contact_list": "Object"}));

// Update a contact by Id route starts
router.post("/hubspot/updateContactById/contact_id/:contact_id", ctrl.updateContactById,
    validation.checkInput({
        "property": "String",
        "value": "String"
    }),
    validation.checkOutput({"updated_contact": "Object"}));

// Update a contact by Id route ends

// Update a contact by Email route starts

router.post("/hubspot/updateContactByEmail/email/:email", ctrl.updateContactByEmail,
    validation.checkInput({
        "firstname": "String",
        "lastname": "String",
        "email": "String"
    }),
    validation.checkOutput({"updated_contact": "Object"}));

// Update a contact by Email route ends

// Create or update a contact route starts


router.post("/hubspot/createOrUpdateAContact/email/:email", ctrl.createOrUpdateContactByEmail,
    validation.checkInput({
        "firstname": "String",
        "lastname": "String",
        "email": "String"
    }),
    validation.checkOutput({"updated_or_created_contact": "Object"}));

// Create or update a contact route ends

// Batch Create or Update contacts route starts

router.post("/hubspot/createOrUpdateBatchContacts", ctrl.createOrUpdateBatchContacts,
    validation.checkInput({"batch_contacts": "Array"}),
    validation.checkOutput({"batch_contacts_response": "Object"}));

// Batch Create or Update contacts route ends

// Get recently created contacts route starts

router.get("/hubspot/getRecentlyCreatedContacts", ctrl.getRecentlyCreatedContacts,
    validation.checkInput({}),
    validation.checkOutput({"recent_contacts": "Object"}));

// Get recently created contacts route ends

// Get contacts by emails route starts

router.get("/hubspot/getContactsByEmails", ctrl.getContactsByEmails,
    validation.checkInput({"emails": "Array"}),
    validation.checkOutput({"contacts_by_emails": "Object"}));

// Get contacts by emails route ends

// Get lifecycle stage matrix route starts

router.get("/hubspot/getLifeCycleStageMatrix/:fromTimestamp/:toTimestamp", ctrl.getLifeCycleStageMatrix,
    validation.checkInput({}),
    validation.checkOutput({"lifeCycleStageMatrix": "Object"}));

// Get lifecycle stage matrix route ends

// **********Start Contact List by imran **********
//Create a new contact list
router.post("/hubspot/contact_list/createcontactlist", ctrl.createContactList, validation.checkInput({
        "name":"String", 
        "dynamic":"Boolean",
        "filters":"Array"
    }), validation.checkOutput({"contact_list":"Object"}))

 //Get contact list
router.get("/hubspot/contact_list/getcontactlist", ctrl.getContactList, validation.checkInput({}),
    validation.checkOutput({ "contact_list": "Object" }));

router.get("/hubspot/contact_list/id/list_id", ctrl.getContactListById, validation.checkInput({}),
    validation.checkOutput({ "contact_list": "Object" }));

router.get("/hubspot/contact_list/removecontentfromlist", ctrl.removeContactFromList, validation.checkInput({}), 
    validation.checkOutput({"contact_list":"Object"}))

router.get("/hubspot/contact_list/addcontentfromlist", ctrl.addContactFromList, validation.checkInput({}), 
    validation.checkOutput({"contact_list":"Object"}))

router.get("/hubspot/contact_list/getrecentlyaddedcontactstolist", ctrl.getRecentlyAddedContactsToList, validation.checkInput({}), 
    validation.checkOutput({"contact_list":"Object"}))

router.get("/hubspot/contact_list/getcontactsinlist", ctrl.getContactsInList, validation.checkInput({}), 
    validation.checkOutput({"contact_list":"Object"}))

router.get("/hubspot/contact_list/getdynamiccontactlistsactive", ctrl.getDynamicContactListsActive, validation.checkInput({}), 
    validation.checkOutput({"contact_list":"Object"}))

router.get("/hubspot/contact_list/updatecontactlist", ctrl.updateContactList, validation.checkInput({}), 
    validation.checkOutput({"contact_list":"Object"}))

router.get("/hubspot/contact_list/deletecontactlist", ctrl.deleteContactList, validation.checkInput({}), 
    validation.checkOutput({"contact_list":"Object"}))

router.get("/hubspot/contact_list/getgroupofcontactlists", ctrl.getGroupOfContactLists, validation.checkInput({}), 
    validation.checkOutput({"contact_list":"Object"}))

router.get("/hubspot/contact_list/getstaticcontactlists", ctrl.getStaticContactLists, validation.checkInput({}), 
    validation.checkOutput({"contact_list":"Object"}))
// **********Contact List**********
// Hubspot Contact Api End

// **********End Contact List**********

 
// ********** Start Hubspot Contact Properties Api  by salma**********

//Get All Contacts Properties
router.get("/hubspot/contacts_properties/allContactssProperties", ctrl.getAllContactsProperties,
    validation.checkInput({}),
    validation.checkOutput({"allContactss_Properties": "Object"}));

//Get a Contact Property by name
router.get("/hubspot/contacts_properties/getPropertyByName/:property_name", ctrl.getPropertyByName,
    validation.checkInput({}),
    validation.checkOutput({"properties": "Object"}));

// Create a contact property
router.post("/hubspot/contacts_properties/createContactsProperties", 
    ctrl.createContactsProperties, validation.checkInput({
    
        "name": String,
        "label": String,
        "groupName": String,
        "type": String,
        "fieldType": String
      
}), validation.checkOutput({ "contacts_Properties": "Object" }))

// Update a contact property by name 
router.put("/hubspot/contacts_properties/updatePropertyByName/:property_name", ctrl.updateContactsProperties, validation.checkInput({
    "name": String,
    "label": String,
    "description": String,
    "groupName": String,
    "type": String,
    "fieldType": String,
    "formField": Boolean,
    "displayOrder": Number
}), validation.checkOutput({ "updateProperty_ByName": "Object" }))

// Delete a contact property /properties/v1/contacts/properties/named/:property_name
router.delete("/hubspot/contacts_properties/deletePropertyByName/:property_name", ctrl.deletePropertyByName,
    validation.checkInput({}),
    validation.checkOutput({ "delete_property": "Object" }));

//Get Contact Property Groups
router.get("/hubspot/contacts_properties/contacts/groups", ctrl.getContactsGroups,
    validation.checkInput({}),
    validation.checkOutput({"contacts_groups": "Object"}));

// Get Contact Property Group Details 
router.get("/hubspot/contacts_properties/contacts/groups/named/:groupName", ctrl.getContactsGroupsDetailsasync,
    validation.checkInput({}),
    validation.checkOutput({"contacts_groupsDetails": "Object"}));

// Update a contact property group
router.put("/hubspot/contacts_properties/contacts/groups/named/:group_name", ctrl.updateContactPropertyGroup, validation.checkInput({
    "displayName": String
}), validation.checkOutput({ "contact_property": "Object" }))

// Update a contact property group
router.post("/hubspot/contacts_properties/contacts/groups/", ctrl.createContactPropertyGroup, 
    validation.checkInput({
    "displayName": "String",
    "name": "String"
}), validation.checkOutput({ "contact_property": "Object" }))


// Delete a contact property group
router.delete("/hubspot/contacts_properties/contacts/groups/named/:group_name", ctrl.deleteContactPropertyGroup,
    validation.checkInput({}),
    validation.checkOutput({ "delete_group": "Object" }));

// ********** End Hubspot Contact Properties Api  **********



// ********** Start Hubspot Companies Api  by salma **********

// Create A Company
router.post("/hubspot/companies/create_company", ctrl.createCompany, validation.checkInput({
        "name": String,"description":String
      
}), validation.checkOutput({ "create_company": "Object" }))

//Update a Company
router.put("/hubspot/companies/:companyId", ctrl.updateCompanyId, validation.checkInput({
    "name": String,"value":String
  
}), validation.checkOutput({ "update_companyId": "Object" }))

//Delete a Company 
router.delete("/hubspot/companies/:companyId", ctrl.deleteCompanyId,
    validation.checkInput({}),
    validation.checkOutput({ "delete_companyId": "Object" }));

//Get all companies
router.get("/hubspot/companies/allcompanies", ctrl.getAllCompanies,
    validation.checkInput({}),
    validation.checkOutput({"all_companies": "Object"}));

// Get recently modified and created companies

router.get("/hubspot/companies/recentlycreatedmodified", ctrl.getRecentlyCreatedModified,
    validation.checkInput({}),
    validation.checkOutput({"modified": "Object"}));

//Get Recently Created Companies

router.get("/hubspot/companies/recentlyCreatedCompanies", ctrl.getRecentlyCreatedCompanies,
    validation.checkInput({}),
    validation.checkOutput({"created": "Object"}));

// Search for companies by domain
router.post("/hubspot/companies/domains/:domain", ctrl.searchForCompaniesByDomain,
    validation.checkInput({
        "limit": Number,
        "requestOptions": Object,
        "offset": Object 
    }),
    validation.checkOutput({"domains": "Object"}));

//Get a Company
router.get("/hubspot/companies/companiesbyId/:companyId", ctrl.getcompaniesbyId,
    validation.checkInput({}),
    validation.checkOutput({"companyby_id": "Object"}));


//Get Contacts at a Company
router.get("/hubspot/companies/contacts/:companyId", ctrl.getContactsByCompaniesbyId,
    validation.checkInput({}),
    validation.checkOutput({"contactsby_companiesbyId": "Object"}));

//Get Contact IDs at a Company
router.get("/hubspot/companies/contactsId/:companyId", ctrl.getContactsIdCompanie,
    validation.checkInput({}),
    validation.checkOutput({"ContactsId_byCompanie": "Object"}))

//Add Contact to Company 
router.put("/hubspot/companies/contactsId/:companyId/contacts/:vid", ctrl.addContactToCompany ,
    validation.checkInput({}),
    validation.checkOutput({"addContactToCompany": "Object"}));

//Remove Contact from Company  /companies/v2/companies/:companyId/contacts/:vid

router.delete("/hubspot/companies/contactsId/:companyId/contacts/:vid", ctrl.deleteContact,
    validation.checkInput({}),
    validation.checkOutput({ "remove_contact ": "Object" }));

// ********** End Hubspot Companies Api **********


// **********Start Hubspot Timeline Api  by salma **********

//Get Timeline all Event Types

router.get("/hubspot/timeline/event-types", ctrl.getTimelineEventTypes,
    validation.checkInput({}),
    validation.checkOutput({"event-types": "Object"}))


//Create or update a timeline event
router.put("/hubspot/timeline/event", ctrl.CreateTimelineEvent,
    validation.checkInput({
        "id": String,
        "eventTypeId": Number,
        "webinarName": String,
        "webinarId": String,
        "email": String
      }),
    validation.checkOutput({"event": "Object"}))

// Get Timeline Event by event-type-id  and   event-id
////GET /integrations/v1/:application-id/timeline/event/:event-type-id/:event-id
router.get("/hubspot/timeline/eventtypeid/:eventtypeid/eventid/:eventid", ctrl.getTimelineEvent,
    validation.checkInput({}),
    validation.checkOutput({"timeline_event": "Object"}))



// Create or update a group of timeline events
router.put("/hubspot/timeline/group_of_eevents", ctrl.CreateTimelineGroupOfEvent,
    validation.checkInput({
        "eventWrappers": Array
      }),
    validation.checkOutput({"group_of_eevents": "Object"}))

//Get Timeline Event Types by applicaion id 
router.get("/hubspot/timeline/timeline/event-types", ctrl.getTimelineEventType,
    validation.checkInput({}),
    validation.checkOutput({"TimelineEvent_Type": "Object"}))

// Create a new Timeline Event Type  POST /integrations/v1/:application-id/timeline/event-types

router.post("/hubspot/timeline/createTimelineEventType", ctrl.createTimelineEventType,
    validation.checkInput({
        "name": String,
        "applicationId":String,
        "objectType":String,
        "headerTemplate": String,
        "detailTemplate":String
      }),
    validation.checkOutput({"createTimeline_EventType": "Object"}))




// Update a Timeline Event Type
//PUT /integrations/v1/:application-id/timeline/event-types/:event-type-id

// {
//     "name": "Renamed Event Type",
//     "applicationId": 86753,
//     "headerTemplate": "# Title for event {{appId}}\nThis is an event for {{objectType}}",
//     "detailTemplate": "This event happened on {{#formatDate timestamp}}{{/formatDate}}",
//     "objectType": "CONTACT"
//   }


//Delete a timeline Event Type
//DELETE /integrations/v1/:application-id/timeline/event-types/:event-type-id


//Get Properties for Timeline Event Type
//GET /integrations/v1/:application-id/timeline/event-types/:event-type-id/properties

//Create Property for Timeline Event Type
//POST /integrations/v1/:application-id/timeline/event-types/:event-type-id/properties
// {
//     "name":"NumericProperty",
//     "label":"Numeric Property",
//     "propertyType":"Numeric"
//   }


//Update Property for Timeline Event Type
//PUT /integrations/v1/:application-id/timeline/event-types/:event-type-id/properties

// {
//     "id":3,
//     "name":"size",
//     "propertyType":"Enumeration",
//     "label":"Size"
//   }


//Delete Property for Timeline Event Type
//DELETE /integrations/v1/:application-id/timeline/event-types/:event-type-id/properties/:property-id





// ********** End Hubspot Timeline Api End **********

router.post("/hubspot/companies/properties/createcompanypropertie", ctrl.createCompanyPropertie, validation.checkInput({
        "name":"String", 
        "label":"String",
        "description":"String",
        "groupName":"String",
        "type":"String",
        "fieldType":"String"
    }), validation.checkOutput({"company_propertie":"Object"}))

router.get("/hubspot/companies/properties/getcompanypropertie", ctrl.getCompanyPropertie, validation.checkInput({}),
    validation.checkOutput({ "company_propertie": "Object" }));

router.get("/hubspot/companies/properties/named/:property_name", ctrl.getCompanyPropertieByName, validation.checkInput({}),
    validation.checkOutput({ "company_propertie": "Object" }));

router.put("/hubspot/companies/properties/named/:update_by_name", ctrl.updateCompanyPropertieByName, validation.checkInput({
        "name":"String", 
        "label":"String",
        "description":"String",
        "groupName":"String",
        "type":"String",
        "fieldType":"String"
    }),validation.checkOutput({ "company_propertie": "Object" }));

router.delete("/hubspot/companies/properties/named/:property_name", ctrl.deleteCompanyPropertieByName, validation.checkInput({}),
    validation.checkOutput({ "company_propertie": "Object" }));

router.get("/hubspot/companies/properties/groups", ctrl.getCompanyPropertyGroups, validation.checkInput({}),
    validation.checkOutput({ "company_groups": "Object" }));

router.post("/hubspot/companies/properties/group", ctrl.createCompanyPropertyGroup, validation.checkInput({
        "name":"String", 
        "displayName":"String"
    }), validation.checkOutput({"company_groups":"Object"}))

router.put("/hubspot/companies/properties/group/named/:group_by_name", ctrl.updateCompanyPropertyGroupByName, validation.checkInput({
        "name":"String", 
        "displayName":"String"
    }),validation.checkOutput({ "company_groups": "Object" }));

router.delete("/hubspot/companies/properties/group/named/:group_by_name", 
    ctrl.deleteCompanyPropertyGroupByName, validation.checkInput({}),
    validation.checkOutput({ "company_groups": "Object" }));
// Hubspot Company Properties Api End

router.post("/hubspot/generateRandomEmail", ctrl.generateRandomEmail, validation.checkInput({}),
    validation.checkOutput({ "email": "String" }));

router.get("/hubspot/getAllWorkflows", ctrl.getAllWorkflows, validation.checkInput({}),
    validation.checkOutput({ "workflows": "Object" }));

router.get("/hubspot/getWorkflow/:workflowId", ctrl.getWorkflow, validation.checkInput({}),
    validation.checkOutput({ "workflow": "Object" }));

router.post("/hubspot/createWorkflow/", ctrl.createWorkflow, validation.checkInput({workflow:"Object"}),
    validation.checkOutput({ "workflow": "Object" }));

// ********** Hubspot Webhoots Api Start **********

// ********** Hubspot Webhoots Api End **********
module.exports = router

