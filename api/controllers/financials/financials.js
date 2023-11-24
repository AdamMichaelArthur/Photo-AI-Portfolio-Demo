var helpers = require('@classes/helpers')
var mongoose = require('mongoose');
var Model = mongoose.model('Financials');
var hasPermission = require("@classes/permissions.js");
var Authentication = require('@classes/authentication.js');
var Pagination = require("@classes/pagination.js");
var Communication = require("@classes/communication.js")
var Stripe = require("@classes/stripe.js");
/*	Required Body Params
	
*/
module.exports.createFinancials = async function(req, res, next)
{
	var endpoint = res.locals.route
	var user = res.locals.user;
	var jsonBody = res.locals.jsonBody
	
	var model = {
		owner: user.accountId,
		created_by: user._id,
		modified_by: user._id
	}

	model = await helpers.mongoCreate(res, Model, model)
	if(model == false)
		return;
 
	res.locals.response = { } 

	return next();
}

module.exports.linkStripeAccount = async function(req, res, next) {
	var tripe = new Stripe(res.locals.user, res);
	await tripe.linkStripeAccount(res.locals.jsonBody.test_key)
	res.locals.response = {stripe_account_linked:true}
	return next();
}

module.exports.listFinancials = async function(req, res) 
{
	var user = res.locals.user
	var owner = user.accountId;
	
	try {
		var results = await Pagination.listByPage(req, res, Model);
	} catch (err)
	{
		console.log(err);
	}
}

module.exports.listCards = async function(req, res){
	res.locals.response = { }

	var stripe = new Stripe(res.locals.user);
	var stripe_api_key = await stripe.getStripeApiKey()
	res.locals.response = stripe_api_key;
	res.send(res.locals.response)
	//return next();
}

module.exports.addCard = async function(req, res, next){

	// We're not going to store the credit card data in our db
	// Instead, we'll store a token, and only charge the token
	// when we want to charge the card.  So ultimately this
	// will depend on an integration with our cc provider, which
	// in this case will be stripe

	res.locals.response = { } 

	model = await helpers.mongoCreate(res, Model, res.locals.jsonBody)
	if(model == false)
		return;
 
	res.locals.response = { 
		"_id":model._id
	} 

	return next();
}

module.exports.deleteCard = async function(req, res, next){
	res.locals.response = { } 
	var id = req.params["id"];
	var model = await helpers.mongoDelete(res, Model, id)
	if(model == false)
		return;
	res.locals.response._id = model._id;
	return next();
}

module.exports.createPlans = async function(req, res, next){

}

module.exports.listPlans = async function(req, res, next){

}

module.exports.editPlans = async function(req, res, next){

}

module.exports.deletePlans = async function(req, res, next){

}

