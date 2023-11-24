






var helpers = require('@classes/helpers')
var mongoose = require('mongoose');
var Model = mongoose.model('Products');
var hasPermission = require("@classes/permissions.js");
var Authentication = require('@classes/authentication.js');
var Pagination = require("@classes/pagination.js");
var Communication = require("@classes/communication.js")

/*	Required Body Params
	
*/
module.exports.createProducts = async function(req, res, next)
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

module.exports.listProducts = async function(req, res) 
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

module.exports.searchProducts = async function(req, res) {
	// var user = res.locals.user
	// var owner = user.accountId;
	
	// try {
	// 	var results = await mongo.mongoSearch(req, res, Model);
	// } catch (err)
	// {
	// 	console.log(err);
	// }	
}

module.exports.uploadProducts = async function(req, res) {
	
}

module.exports.updateProducts = async function(req, res) 
{
	
}

module.exports.editProducts = async function(req, res) 
{
	
}

module.exports.deleteProducts = async function(req, res) 
{
	
}
