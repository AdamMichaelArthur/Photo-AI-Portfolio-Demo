var helpers = require('@classes/helpers')
var mongoose = require('mongoose');
var rolesModel = mongoose.model('Roles');
var hasPermission = require("@classes/permissions.js");
var Authentication = require('@classes/authentication.js');

// This function is designed to be called once, when an account is setup
// for the first time.  It sets up the permissions for the administrator
// account.  This ensures that the account creator has full access
// This code is called one time at startup
// This is by design
var bRunOnce = false;

var roles = [
	{"administrator":["read", "write", "delete"]},
	{"user":["read"]},
	{"collaborator":[]},
	{"customer":[]}
]

var user_options = {
	administrator: [
		"Addresses, Billing and Payments",
		"Account Info",
		"User Info",
		"Security"
	],
	user : [
		"User Info",
		"Security"
	],
	collaborator : [
		"Billing and Payments",
		"User Info",
		"Security"
	],
	customer : [
		"Addresses, Billing and Payments",
		"Order History",
		"Security"
	]
}


/*	By design, administrators have *full* access to every route
	As the project grows, this needs to be updated automatically
*/

async function updateRoles(role, permittedActionsAr, upsert, accountId){

	// First, get all of our routes
	var routesModel = mongoose.model("Routes");
	var routesAr = await routesModel.findOne({}).lean();
	if(routesAr == null)
		return;
	routesAr = routesAr.routes;
	var permissionsAr = [];
	for (const route of routesAr){
		var routePermissions = permittedActionsAr
		var rule = {
		 	"route":route, 
		 	"permissions":routePermissions
		 }
		permissionsAr.push(rule);
	}
	
	var roleModel = { "role" : role, allowed: permissionsAr}
	
	// if(userId != null)
	// 	roleModel.userId = userId;

	var criteria = {"role":role}
	if(accountId != null)
		criteria = {role:role, accountId: accountId}
	try{
		var update = await rolesModel.updateMany(criteria,
			roleModel, {upsert: upsert, setDefaultsOnInsert: true})
	} catch(err){

	}
}

//  This is something we want to run in development, but should really
//  not run in production, as it will reset any changes that a customer
//  might make.  Maybe, we make the defaults unchangeable and they can
//  make their own role if they want to...  To do: think about this
for (const role of roles){
	for (var role_def in role)
	{
		permissions = role[role_def]
		updateRoles(role_def, permissions, false);
	}
}

module.exports.createDefaultRoles = async function(accountId) {

	for (const role of roles){
	for (var role_def in role)
	{
		permissions = role[role_def];
		await updateRoles(role_def, permissions, true, accountId);
	}
	}
	
	return true;
}

module.exports.getRoles = async function(req, res, next) {
	 try{
	   var roles = await rolesModel.find({"accountId":res.locals.accountId})
	 } catch (err) {
	 	return false;
	}
	res.status(200);
	res.json(roles);
}

module.exports.createRoles = async function(req, res)
{
	var endpoint = helpers.getRoute(req);
	var user = res.locals.user;
	var model = res.locals[endpoint]
	
	var properBody = {
		"role":"String",
		"role_desc":"String"
	};

	var properResponse = {
	}

	var jsonBody = helpers.validatePostedData(req, res, properBody);
	if(jsonBody == false)
		return;

	var model = {
		owner: user.accountId,
		created_by: user._id,
		modified_by: user._id
	}

	model = await helpers.mongoCreate(res, Model, model)
	if(model == false)
		return;
 
	var response = helpers.defaultResponseObject(endpoint);
	//response[endpoint]._id = model._id;

	var jsonBody = helpers.validateResponseData(res, response[endpoint], properResponse);
	if(jsonBody == false)
		return;

	helpers.success(res, response);
}

module.exports.updateRoles = async function(req, res) 
{
	
}

module.exports.listRoles = async function(req, res) 
{
	
}
module.exports.editRoles = async function(req, res) 
{
	
}

module.exports.deleteRoles = async function(req, res) 
{
	
}
