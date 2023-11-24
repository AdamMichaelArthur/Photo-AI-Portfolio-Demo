var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var ctrl = require('@controllers/navigation/navigation.js');

 router.get("/sidebar", ctrl.sidebar, validation.checkInput({}), validation.checkOutput({
 	"navigation":"Array"
 }));

 router.put("/sidebar", validation.checkInput({
 	"role":"String",
	"sidebar":"Array"
}), ctrl.editSidebar, validation.checkOutput({

}));

 router.put("/account", validation.checkInput({
 	"role":"String",
	"sidebar":"Array"
}), ctrl.editAccount, validation.checkOutput({

}));

 router.get("/account", ctrl.account, validation.checkInput({}), validation.checkOutput({
 	"navigation":"Array"
 }));

 router.put("/dashboard", validation.checkInput({
 	"role":"String",
	"viewroute":"String"
}), ctrl.editDashboard, validation.checkOutput({

}));

router.get("/dashboard", ctrl.dashboard, validation.checkInput({}), validation.checkOutput({
 	"viewroute":"String"
 }));

router.post("/integrations/gmail/authorization", ctrl.getAuthorizationUrl, 
	validation.checkInput({"first":"String","last":"String","email":"String","brand_id":"String"}), validation.checkOutput({ "authURL": "String" }))

router.get("/integrations/gmail/redirect", ctrl.redirectGmail,
	validation.checkInput({}), validation.checkOutput({}))

module.exports = router
