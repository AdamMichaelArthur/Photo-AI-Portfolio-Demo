var helpers = require('@classes/helpers')
var mongoose = require('mongoose');
var Model = mongoose.model('zzEndpointzz');
var hasPermission = require("@classes/permissions.js");
var Authentication = require('@classes/authentication.js');
var Pagination = require("@classes/pagination.js");
var Communication = require("@classes/communication.js")

/*	Required Body Params
	
*/
module.exports.createzzEndpointzz = async function(req, res, next)
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

module.exports.listzzEndpointzz = async function(req, res) 
{
	var user = res.locals.user
	var owner = user.accountId;
	
	try {
		var results = await Pagination.listByPage(req, res, Model);
	} catch (err)
	{
	}
}

module.exports.updatezzEndpointzz = async function(req, res) 
{
	
}

module.exports.editzzEndpointzz = async function(req, res) 
{
	
}

module.exports.deletezzEndpointzz = async function(req, res) 
{
	
}
