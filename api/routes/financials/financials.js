var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var ctrl = require('@controllers/financials/financials.js');

router.post("/financials", has.permission("write"), validation.checkInput({
	// Input validation fields here
}), ctrl.createFinancials, validation.checkOutput({
	// Input validation fields here
}));

router.post("/financials/card", has.permission("write"), validation.checkInput({
	"cc_num":"String",
	"exp_month":"String",
	"exp_year":"String",
	"billing_zip":"String",
	"ccv":"String",
	"first_name":"String",
	"last_name":"String"
}), ctrl.addCard, validation.checkOutput({
	"_id":"Object"
}));

router.delete("/financials/card/id/:id", has.permission("delete"), validation.checkInput({}), ctrl.deleteCard, validation.checkOutput({
	"_id":"Object"
}));

router.put("/financials/cards", has.permission("read"), ctrl.listCards); 						
//router.get("/financials/card/page/:page/id/:id", has.permission("read"), ctrl.listFinancials); 		

// Stripe

// This links the customer account with their stripe account
router.post("/financials/stripe", has.permission("write"), validation.checkInput({
	"test_key":"String",
	"prod_key":"String",
	"assoc_email":"String"
}), ctrl.linkStripeAccount, validation.checkOutput({
	"stripe_account_linked":"Boolean"
}))

router.post("/financials/plans", has.permission("write"), validation.checkInput({

}), ctrl.createPlans, validation.checkOutput({

}));

router.get("/financials/plans", has.permission("read"), validation.checkInput({

}), ctrl.listPlans, validation.checkOutput({

}));

router.put("/financials/plans", has.permission("write"), validation.checkInput({

}), ctrl.editPlans, validation.checkOutput({

}));





module.exports = router
