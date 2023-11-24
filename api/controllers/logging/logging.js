var helpers = require('@classes/helpers')
var mongoose = require('mongoose');
var Model = mongoose.model('Logging');
//var hasPermission = require("@classes/permissions.js");
//var Authentication = require('@classes/authentication.js');
//var Pagination = require("@classes/pagination.js");

// ToDo: Add validation checking
module.exports.create = async function(req, res, next) {
	var user = res.locals.user	
	var log = {}
	var jsonBody = req.body
	
	log.screen = jsonBody.screen
	log.subview = jsonBody.subview
	log.function = jsonBody.function
	log.msg = jsonBody.msg
	log.line = jsonBody.line
	log.file = jsonBody.file

	try{
		logData = await helpers.mongoCreate(res, Model, log)
	} catch (error){
		res.send(error);
	}
	
	res.locals.response = { "status": "worked" }
	return next();
	/*		
	var endpoint = helpers.getRoute(req);
	var response = helpers.defaultResponseObject(endpoint);
	var user = res.locals.user	
	var model = res.locals[endpoint]
	var fs = require	('fs');
	*/
	//var properResponse = {
}

module.exports.find = async function(req, res, next) {
	/*
	"screen":"String",
	"subview":"String",
	"function":"String",
	"msg":"String",
	"line":"Number",
	"file":"String"
	*/
	var queryBody = req.body.queryData
	var qryScreen
	var lstQuery = []

	if(queryBody.screen) {
		var dctQuery = {"screen":queryBody.screen}
		lstQuery.push(dctQuery)
	}

	if(queryBody.subview) {
		var dctQuery = {"subview":queryBody.subview}
		lstQuery.push(dctQuery)
	}

	if(queryBody.function) {
		var dctQuery = {"function":queryBody.function}
		lstQuery.push(dctQuery)
	}

	if(queryBody.msg) {
		var dctQuery = {"msg":queryBody.msg}
		lstQuery.push(dctQuery)
	}

	if(queryBody.file) {
		var dctQuery = {"file":queryBody.file}
		lstQuery.push(dctQuery)
	}

	if(queryBody.line) {
		var dctQuery = {"line":queryBody.line}
		lstQuery.push(dctQuery)
	}

	// now process the date string(s)
	if(queryBody.startDate) {
		var dctQuery = {"created":{"$gte":queryBody.startDate}}
		lstQuery.push(dctQuery)
	}

	if(queryBody.endDate) {
		var dctQuery = {"created":{"$lte":queryBody.endDate}}
		lstQuery.push(dctQuery)
	}

	xxxx = yyyy
	var user = res.locals.user	

	try{
		//var log = await Model.find({created_by:mongoose.Types.ObjectId(res.locals.user._id)})
		var log = await Model.find({"$and":lstQuery})
	} catch (err) {
		res.status(404)
		return res.send("Not found");
	}
	

	res.locals.response = { "status": log }
	return next();
}
