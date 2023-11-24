var helpers = require('@classes/helpers')
var mongoose = require('mongoose');
var Model = mongoose.model('Hugo');
var hasPermission = require("@classes/permissions.js");
var Authentication = require('@classes/authentication.js');
var Pagination = require("@classes/pagination.js");
var Communication = require("@classes/communication.js")
var Hugo = require("@classes/hugo.js");
/*	Required Body Params
	
*/
module.exports.createHugo = async function(req, res, next)
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
 
 	var hugo = new Hugo(user.accountId, model._id)
 	hugo.createHugoSite(req.body.siteName)
	res.locals.response = { } 

	return next();
}

module.exports.listHugo = async function(req, res) 
{
	var hugo = new Hugo();
	hugo.getHugoContent("");
	res.send({});
}

module.exports.updateHugo = async function(req, res) 
{
	
}

module.exports.editHugo = async function(req, res) 
{
	
}

module.exports.deleteHugo = async function(req, res) 
{
	
}
