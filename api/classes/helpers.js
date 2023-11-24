var mongoose = require('mongoose');

exports.defaultResponseObject = function(endpoint)
{
	if(endpoint == null)
		throw Error ('You must provide an endpoint definition to defaultResponseObject');
	// We throw an error here because if you don't provide an endpoint, it will cause
	// unexpected behavior at other parts of the program.

	var defaultResponseObject = {
		"Result":"Success",
		"Error": 0,
		"ErrorDetails" : {
			"Error":0,
			"Description":"The operation was successful"
		}
	}
	defaultResponseObject[endpoint] = {}
	return defaultResponseObject
}

exports.defaultErrorResponseObject = function(error, description)
{
	var defaultResponseObject = {
		"Result":"Failure",
		"Error": error,
		"ErrorDetails" : {
			"Error":error,
			"Description":description
		}
	}
	return defaultResponseObject
}

exports.errorOut = function(res, object) {
	res.status(400);
	res.json(object);
}

exports.validatePostedData = function(req, res, properBody)
{
	var reqBody = req.body;

	var keysInReqBody = {};
	// This ensures that no unsupported keys/data is posted in the JSON req.body
	for (var key in reqBody) {
    if (reqBody.hasOwnProperty(key)) {
        // First, let's test the existence of the key with the proper body
        if(properBody[key] == null)
        	return fail(res, 510, "\'"+key+"\'" + " is not a supported key");
        
        keysInReqBody[key] = key;
    	}
	}

	var optionalParameters = 0;
    // Now we must do the opposite, and make sure every properBodyKey is in the reqBody
    for (var key in properBody) {
    if (properBody.hasOwnProperty(key)) {
        //console.log(key + " -> " + properBody[key]);
        // First, let's test the existence of the key with the proper body
    	//console.log(key, keysInReqBody[key]);

    	var bCheckRequired = true;
    	if(typeof properBody[key] == 'object'){
			console.log("WE have an object", properBody)
			if(properBody[key].optional == true){
				console.log("We have an optional key")
				bCheckRequired = false;
			}
		}

    	if((keysInReqBody[key] == null)&&(bCheckRequired == true))
    		return fail(res, 511, "Required Parameter Missing: \'"+key+"\'");
		}

		// Now we need to check and make sure the TYPES match
		var bCheckType = true;
		var type = properBody[key];
		if(bCheckRequired == false){
			type = properBody[key].type
			if(reqBody[key] == null)
			{
				// Parameter not supplied -- skip checking
				optionalParameters++;
				bCheckType = false;
			}
			// reqBody[key] = 
		}

		if(bCheckType == true){
		if(type == "String"){
			if (typeof reqBody[key] !== 'string'){
				return fail(res, 512, "TypeCheck Failed.  Expecting a string for key: " + key);
			}
		}
		if(type == "Boolean"){
			if (typeof reqBody[key] !== 'boolean'){
				return fail(res, 512, "TypeCheck Failed.  Expecting a boolean for key: " + key);
			}
		}
		if(type == "Number"){
			if (typeof reqBody[key] !== 'number'){
				return fail(res, 512, "TypeCheck Failed.  Expecting a number for key: " + key);
			}
		}

		if(type == "Array"){
			if (reqBody[key].constructor !== Array){
				return fail(res, 512, "TypeCheck Failed.  Expecting an array for key: " + key);
			}
		}

		// In the case of object, this should be another embedded JSON object
		// We SHOULD be doing recursive checking, all the way down the line
		// For future implementation
		if(type == "Object"){
			if (typeof reqBody[key] !== 'object'){
				return fail(res, 512, "TypeCheck Failed.  Expecting a JSON Object for key: " + key);
			}
		}
		}
	}

	// Let's check and make sure that the number of objects
	// in the request body match
	var reqBodyKeys = (Object.keys(reqBody).length + optionalParameters)
	var prpBodyKeys = Object.keys(properBody).length

	if(reqBodyKeys != prpBodyKeys)
	{
		var properBodyStr = JSON.stringify(properBody);
		properBodyStr = replaceAll(properBodyStr, "\"", "'");
		return fail(res, 510, "The posted JSON Body does not match the correct definition: " + properBodyStr);
	}

	function replaceAll(str, find, replace) {
	    return str.replace(new RegExp(find, 'g'), replace);
	}

	function fail(res, error, description)
	{
		var defaultErrorResponse = module.exports.defaultErrorResponseObject(error, description)
		res.status(500);
		res.json(defaultErrorResponse)
		return false;
	}

	return reqBody;
}


exports.validateResponseData = function(res, responseBody, properBody)
{
	var reqBody = responseBody;

	var keysInReqBody = {};
	// This ensures that no unsupported keys/data is posted in the JSON req.body
	for (var key in reqBody) {
    if (reqBody.hasOwnProperty(key)) {
        // First, let's test the existence of the key with the proper body
        if(properBody[key] == null)
        	return fail(res, 610, "\'"+key+"\'" + " is not a supported key");
        
        keysInReqBody[key] = key;
    	}
	}

    // Now we must do the opposite, and make sure every properBodyKey is in the reqBody
    for (var key in properBody) {
    if (properBody.hasOwnProperty(key)) {
        //console.log(key + " -> " + properBody[key]);
        // First, let's test the existence of the key with the proper body
    	//console.log(key, keysInReqBody[key]);
    	if(keysInReqBody[key] == null)
    		return fail(res, 611, "Required Object Missing: \'"+key+"\'");
		}

		// Now we need to check and make sure the TYPES match
		var type = properBody[key];

		if(type == "String"){
			if (typeof reqBody[key] !== 'string'){
				return fail(res, 612, "TypeCheck Failed.  Expecting a string for object: " + key);
			}
		}
		if(type == "Boolean"){
			if (typeof reqBody[key] !== 'boolean'){
				return fail(res, 612, "TypeCheck Failed.  Expecting a boolean for object: " + key);
			}
		}
		if(type == "Number"){
			if (typeof reqBody[key] !== 'number'){
				return fail(res, 612, "TypeCheck Failed.  Expecting a number for object: " + key);
			}
		}

		//console.log(174, reqBody[key].constructor)
		//if(reqBody[key].constructor == Function){

		try {
			var test = reqBody[key].toObject()
			console.log(176, typeof test)
			//if(typeof test === Array)
				reqBody[key] = test;
		} catch (err){
			// Do nothing
		}
		//}
		if(type == "Array"){
			if (reqBody[key].constructor !== Array){
				console.log(`--${reqBody[key].constructor}--`);
				return fail(res, 612, "TypeCheck Failed.  Expecting an array for object: " + key);
			}
		}

		// In the case of object, this should be another embedded JSON object
		// We SHOULD be doing recursive checking, all the way down the line
		// For future implementation
		if(type == "Object"){
			if (typeof reqBody[key] !== 'object'){
				return fail(res, 612, "TypeCheck Failed.  Expecting a JSON Object for key: " + key);
			}
		}
	}

	// Let's check and make sure that the number of objects
	// in the request body match
	var reqBodyKeys = Object.keys(reqBody).length
	var prpBodyKeys = Object.keys(properBody).length

	if(reqBodyKeys != prpBodyKeys)
	{
		var properBodyStr = JSON.stringify(properBody);
		properBodyStr = replaceAll(properBodyStr, "\"", "'");
		return fail(res, 610, "The expected JSON response does not match the correct definition: " + properBodyStr);
	}

	function replaceAll(str, find, replace) {
	    return str.replace(new RegExp(find, 'g'), replace);
	}

	function fail(res, error, description)
	{
		var defaultErrorResponse = module.exports.defaultErrorResponseObject(error, description)
		res.status(500);
		res.json(defaultErrorResponse)
		return false;
	}

	return reqBody;
}

exports.success = function(res, respObj)
{
	res.status(200);
	res.json(respObj);	
}

exports.error = function(res, error, description)
{
	var defaultErrorResponse = module.exports.defaultErrorResponseObject(error, description)
	res.status(500);
	res.json(defaultErrorResponse)
}

exports.mongoCreate = async function(res, Model, model) {

		var user = res.locals.user;

		var obj = {
			owner: user.accountId,
			created_by: user._id,
			modified_by: user._id
		}

		let merged = {...obj, ...model} 
		try {
			model = await Model.create(merged)
			return model;
		} catch(err) {
			var error = module.exports.mongoError(null, err)
			module.exports.error(res, error.code, error.message);
			return false;
		}
}

exports.mongoDelete = async function(res, Model, id) {
		try {
			var model = await Model.findByIdAndRemove(id)
			return model
		} catch (err) {
			console.log(err);
			var error = module.exports.mongoError(null, err)
			module.exports.error(res, error.code, error.message);
			return false;
		}
}

exports.mongoCreateOnDuplicateKeyUpdate = async function(res, Model, model){
		
		console.log("here 2");
		var user = res.locals.user;

		var obj = {
			owner: user.accountId,
			created_by: user._id,
			modified_by: user._id
		}

		let merged = {...obj, ...model} 

		try {
			model = await Model.findOneAndUpdate(merged, {upsert: true, new: true, runValidators: true})
			console.log("model", model);
			return model;
		} catch (err) {
			console.log("err", err);
			return false;
		}
}

exports.mongoError = function(bError, error) {

		if(bError == null){
			var bError = { 
				error: false,
				message: "There was an error",
				code: 0
			}
		}

		bError.error = true;
		var errorName = "";

		
		for (var key in error) {

		    if (error.hasOwnProperty(key)) {
		        if(key == "name")
		        	errorName = error[key];
		    }
		}

		if(errorName == "MongoError")
		{
			bError.code = error.code;
			bError.message = error.errmsg			
		} else if 	(errorName == "ValidationError")
		{
			bError.code = 7000;

			for (var key in error.errors) {
		    if (error.errors.hasOwnProperty(key)) {
		        bError.message = error.errors[key].message;

		    }
		} 
		} else {
			console.log(error);
			bError.code = 7001;
			bError.message = "There is a problem with the phone number";
		}

		
		return bError;
}

exports.getEndpoint = function(req) {
	var endpoint = req.path.slice(1, req.path.length);
	var slashIdx = endpoint.lastIndexOf("/");
	var fullEndpoint = endpoint.substr(slashIdx+1, endpoint.length-slashIdx-1)
	return fullEndpoint;
}

exports.getDir = function(str) {
	var endpoint = str.slice(1, str.length);
	var slashIdx = endpoint.lastIndexOf("/");
	var fullEndpoint = endpoint.substr(slashIdx+1, endpoint.length-slashIdx-1)
	return fullEndpoint;
}

exports.getRoute = function(req) {
	var endpoint = req.path.slice(1, req.path.length);
	var slashIdx = endpoint.indexOf("/");
	if(slashIdx == -1)
		slashIdx = endpoint.length;
	var fullroute = endpoint.substr(0, slashIdx)
	return fullroute;
}

exports.getParameter = function(str, parameter){
	var params = str.split("/");
	for(var i = 0; i < params.length; i++){
		if(params[i] == parameter)
			if(i+1 < params.length)
				return params[i+1];
	}
}

exports.getPathTrue = function(str, path){
	var params = str.split("/");
	for(var i = 0; i < params.length; i++){
		if(params[i] == path)
		{
			return true;
		}
	}
	return false;
}

exports.futureISODateByDays = function(daysInFuture) {
	var date = new Date()
	date.setDate(date.getDate() + daysInFuture);
	date = date.toISOString();
	return date;
}

exports.futureISODateByHours = function(hoursInFuture) {
	var date = new Date()
	date.setDate(date.getDate() + hoursInFuture);
	date = date.toISOString();
	return date;
}

exports.futureISODateByMinutes = function(minutesInFuture) {
	var date = new Date()
	date.setMinutes(date.getMinutes() + minutesInFuture);
	date = date.toISOString();
	return date;
}


exports.ISODateNow = function() {
	var date = new Date()
	date.setMinutes(date.getMinutes());
	date = date.toISOString();
	return date;
}

var mongo = require("@classes/mongo.js");

exports.log = function(user, msg, screen, subview, fnctn, line, file){

	// if(verbose == null)
	// 	var verbose = false;

	var log = {}

	log.screen = screen
	log.subview = subview
	log.function = fnctn
	log.msg = msg
	log.line = line
	log.file = file

	var model = mongoose.model("Logging");
	var db = new mongo(model, user)

	console.log(log);
	// var logObj = {
	// 	"msg":msg,
	// 	"verbose":verbose,
	// 	"function":fnction,
	// 	"file":file
	// };

	// Not doing await here because that could really slow everything down
	db.mongoCreateNoWait(log)

}

