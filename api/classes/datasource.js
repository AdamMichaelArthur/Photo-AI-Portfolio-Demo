/*
	A note about the security model

	Collections must be explicitely designated as "public" in order for database results to return records
	that are not owned by the user or organization.

	Data in "public" collections should have no privacy or security concerns whatsoever, and should be considered
	as exposed to the public for anyone to find.  Sensitive or private data should never be stored in one of these collections

	The API and Frontend allows for search modified such as "all" and "account" which affect the scope of the results that
	are returned.  These modifiders are disallowed for private collections

	var public_collections = [
		"bounties"
	]

	var account_collections = [

	]

	var user_collections = [
		"users"
	]

*/

var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var helpers = require("@classes/helpers.js")
var voca = require("voca");
const fs = require('fs');
var mongo = require("@classes/mongo.js");
var Pagination = require("@classes/pagination.js");
var Paginationv2 = require("@classes/paginationv2.js");
var excel = require("@classes/excelimport.js");
var multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
var base64 = require('base-64');
var pluralize = require('pluralize')
var moment = require('moment');
const util = require('util');
var bounties = require("@classes/bounties");

const extractDomain = require("extract-domain");
var psl = require('psl');

var datasource_file = './classes/datasources.json'
var mongoose = require( 'mongoose');

//mongoose.set('debug', true);

//mongoose.set('debug', true);

const Schema = mongoose.Schema;

var datasources = fs.readFileSync(datasource_file);

//... Make impor unique
datasources.datasource = [...new Set(datasources.datasource)]

var schemas = JSON.parse(datasources).datasource; 

for(var i = 0; i < schemas.length; i++){
	registerSchema(schemas[i])
}

router.post("/import/*", upload.any(), importExcel);
router.post("/exceltojson/*", upload.any(), exceltojson);

router.all("/*/page/:page/id/:id", routeDataSource);

var specialCases = ["progress", "completed", "sort", "search", "clone", "distinct", "distinctids", "export", "array", "arrayall",
"arrayrm", "arrayrmall", "arraypatch", "arrayput", "autocomplete", "all", "swap", "aggregate", "account", "dates", "calendar", 
"key", "owner","getkeys","selected","nextselected","prevselected", "mergefields","emailfields", "count", "bulk", "selectall"]

for(var i = 0; i < specialCases.length; i++){
	router.all(`datasource/:datasource/${specialCases[i]}/id/:id`, routeDataSource);
}

router.all("/*", routeDataSource);

function registerSchema(schemaName){
	var datasourceSchema = new mongoose.Schema({
		created: { type: Date, default: Date.now },
		modified: { type: Date, default: Date.now, required: true },
		created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
		modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
		owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	}, { strict: false });

	schemaName = voca.capitalize(schemaName)
	try {
		mongoose.model(schemaName, datasourceSchema);
	} catch (err){
		// Display error here
	}
}

var Datasource = "";

function checkDatasource(datasource){
	if(!schemas.includes(datasource)){
		schemas.push(datasource);

		var data = {
			"datasource": schemas
		}

		let updatedSchemas = JSON.stringify(data);
		fs.writeFileSync(datasource_file, updatedSchemas);	
		console.log("Datasource not found -- added");
		registerSchema(datasource);
	}
	return voca.capitalize(datasource);
}

async function routeDataSource(req, res){


	// Check and see if we have to get all records
	var getAllRecordsByAccount = false;
	var getAllRecords = false;
	var searchModifier = {}

	// Check authentication here
	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)

	res.locals.datasource = datasource;
	res.locals.response = {};

	var model = mongoose.model(modelName);
		for(var i = 0; i < specialCases.length; i++){
		var bSearch = helpers.getPathTrue(req.params[0], specialCases[i])
			if(bSearch){
				console.log(134, bSearch, specialCases[i]);
				switch(specialCases[i]){
					case "progress":
						console.log(109)
						return progress(req, res);
					case "completed":
						return completed(req, res);
					case "selectall":
						return selectall(req, res, model);
					case "count":
						return aggregateCount(req, res);
					case "aggregate":
						return aggregate(req, res);
					case "sort":
						return getWithSort(req, res, next, model);
					case "search":
						return search(req, res)
					case "clone":
						return clone(req, res);
					case "distinct":
						return distinct(req, res);
					case "distinctids":
						return distinctids(req, res);
					case "export":
						return exportExcel(req, res, next, model);
					case "array":
						return addToArray(req, res);
					case "arrayall":
						return addToArrayInAllDocuments(req, res);
					case "arrayrm":
						return removeMatchFromArray(req, res);
					case "arraypatch":
						return patchElementMatchInArray(req, res);
					case "arrayput":
						return putElementMatchInArray(req, res);
					case "arrayrmall":
						return removeMatchFromArrayInAllDocuments(req, res);
					case "autocomplete":
						return autocomplete(req, res);
					case "account":
						return getbyaccount(req, res, next, model);
					case "owner":
						return getbyaccount(req, res, next, model, "accountId");
					case "selected":
						return getselecteddocuments(req, res, next, model);
					case "all":
					{
						console.log(184);
						// To Do: Add a layer of security here to ensure the user has permission to access database-wide records
						// This should only be allowed for site-admin level users, or hard-coded exceptions if there is a need for
						// non-admin level users to access database-wide data
						return getall(req, res, next, model);
					}
					case "swap":
						return swap(req, res);
					
					case "dates":
						return datesbetween(req, res, next, model);
					case "calendar":
						return await updateCalendarItem(req, res, next, model);
					case "key":
						return await getOneByKeyValuePair(req, res, next, model)
					case "getkeys":
						return await getKeysForSearchQuery(req, res, next, model)
					case "nextselected":
						return await getNextSelectedItem(req, res, next, model);
					case "prevselected":
						return await getPrevSelectedItem(req, res, next, model);
					case "mergefields":
						return getSelectedMergeFields(req, res, next, model);					
					case "emailfields":
						return getEmailFields(req, res, next, model);
					case "bulk":
						return bulkInsert(req, res, next, model);
					case "id":
						return getDocumentById(req, res, next, model);
				}
			}
		}

	var method = req.method;
	console.log(210, method)
	switch(method){
		case "GET":
			return get(req, res, next, model);
			break
		case "POST":
			return await post(req, res, next, model);
			break;
		case "DELETE":
			return await del(req, res, next, model);
			break;
		case "PATCH":
			return await patch(req, res, next, model);
			break;
		case "PUT":
			return put(req, res, next, model);
			break;
	}

	return error(req, res, next, 1001, "Unable to route request");
	// Figure out what our verb is
}

function securityCheck(){

}

function getDataSource(req){
	return helpers.getRoute(req);
}

function get(req, res, next, model){

	console.log(204, "here");

	var xbody = req.headers["x-body"];
	var keys = req.body
	if(typeof xbody != 'undefined'){
		keys = xbody.split(",");
	}
	
	if(Array.isArray(keys) == false)
		keys = [];

	var filter = { }
	var id = helpers.getParameter(req.params[0], "id");

	if(typeof id != 'undefined'){
		// We're just getting one.getting one
		model.findOne({"_id":mongoose.Types.ObjectId(id)}, function(err, doc){
			res.locals.response = doc;
			next(req, res);
		}).lean();
		return;
	}

	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

	console.log(267, req.body, xbody)

	var filterIndex = voca.search(fullUrl, "filter");
	if(filterIndex != -1){
		var Filter = helpers.getParameter(fullUrl, "filter");
		var filterStr = base64.decode(Filter);
		filterStr = voca.replaceAll(filterStr, "'", "\"");
		filter = Object.assign(filter, JSON.parse(filterStr));
	}

	var jsonBody = filter;

	for (const [key, value] of Object.entries(jsonBody)) {
	  //console.log(`${key}: ${value}`);
	  if(voca.includes(key, "_id")){
	  	jsonBody[key] = mongoose.Types.ObjectId(value)
	  }
	}

	filter = jsonBody;
	
	var getrecords = 10;
	var max_records = voca.search(fullUrl, "max_records");
	if(max_records != -1){
		getrecords = parseInt(helpers.getParameter(fullUrl, "max_records"));
	} else {
		getrecords = 10000;
	}

	getrecords = 10000;
	console.log(294, getrecords, filter, keys)
	
	try {
		Pagination.listByPage(req, res, model, getrecords, filter, keys);
	} catch (err) { }
}

function getmaxrecords(req, res){
	console.log(197, "get max records called");
	var xbody = req.headers["x-body"];
	var keys = req.body
	if(typeof xbody != 'undefined'){
		keys = xbody.split(",");
	}

	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)
	var model = mongoose.model(modelName);
	var max_records = parseInt(req.params.max_records);

	try {
		console.log(205, "Listing here");
		Pagination.listByPage(req, res, model, max_records, {created_by: null}, keys);
	} catch (err) { }
}

function getall(req, res, next, model){

	console.log(330, 'get all called', keys);
	// Do a security check to ensure the account has permission to do this.

	var xbody = req.headers["x-body"];
	var keys = req.body
	if(typeof xbody != 'undefined'){
		keys = xbody.split(",");
	}

	if(Array.isArray(keys) == false)
		keys = [];

	var max_records = helpers.getParameter(req.params[0], "max_records");
	
	if(typeof max_records == 'undefined')
		max_records = 10;
	else
		max_records = parseInt(max_records);
	
	if(max_records == -1){
		max_records = 10000;
	}

	

	var filter = { }
	var id = helpers.getParameter(req.params[0], "id");
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

	var filterIndex = voca.search(fullUrl, "filter");
	if(filterIndex != -1){
		var filter = helpers.getParameter(fullUrl, "filter");

		var filterStr = base64.decode(filter);

		filterStr = voca.replaceAll(filterStr, "'", "\"");

		filter = JSON.parse(filterStr);
	}
	
	for (const [key, value] of Object.entries(filter)) {
	  if(voca.includes(key, "_id")){
	  	console.log(371, typeof value)
	  	console.log(372, typeof "Test");
	  	if(typeof value == "string")
	  		filter[key] = mongoose.Types.ObjectId(value)
	  }
	}

	function replaceMatchInObject(obj, key, value, search){
    
    if(obj == search){
      console.log(1966, obj, search)
      obj = value;
      return value;
    }
    return false;
  }

	function iterateThroughObj(res, obj){


    var keys = Object.keys(obj)
    //console.log(1975, obj, typeof obj[]);
    for(var i = 0; i < keys.length; i++){
      if(typeof  obj[keys[i]] == 'object'){
        iterateThroughObj(res, obj[keys[i]])
      } else {
        //console.log(1982, obj[keys[i]])
        var replace = replaceMatchInObject(obj[keys[i]], keys[i], mongoose.Types.ObjectId(res.locals.user._id), "$res.locals.user._id")
        if(replace != false){
          obj[keys[i]] = replace
          console.log(860, obj[keys[i]])

        }
      }
    }
  }

  iterateThroughObj(res, filter);

	console.log(417, filter);
	try {
		Pagination.listByPage(req, res, model, max_records, filter, keys, true);
	} catch (err) { }
}



function getbyaccount(req, res, next, model, filterKey ="owner"){

	var xbody = req.headers["x-body"];
	var keys = req.body
	if(typeof xbody != 'undefined'){
		keys = xbody.split(",");
	}

	if(Array.isArray(keys) == false)
		keys = [];

	var max_records = helpers.getParameter(req.params[0], "max_records");
	
	if(typeof max_records == 'undefined')
		max_records = 10;
	else
		max_records = parseInt(max_records);

	var filter = { }
	filter[filterKey] = mongoose.Types.ObjectId(res.locals.user.accountId)

	var id = helpers.getParameter(req.params[0], "id");
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

	var filterIndex = voca.search(fullUrl, "filter");
	if(filterIndex != -1){
		var Filter = helpers.getParameter(fullUrl, "filter");
		//console.log(246, filter);
		var filterStr = base64.decode(Filter);
		//console.log(248, filterStr);
		filterStr = voca.replaceAll(filterStr, "'", "\"");

		filter = Object.assign(JSON.parse(filterStr), filter);
		filter["owner"] = mongoose.Types.ObjectId(filter.owner);

	}

	var jsonBody = filter;

	for (const [key, value] of Object.entries(jsonBody)) {
	  //console.log(`${key}: ${value}`);
	  if(voca.includes(key, "_id")){
	  	if(typeof value == "string")
	  		jsonBody[key] = mongoose.Types.ObjectId(value)
	  }
	}

	filter = jsonBody;

	//console.log(386, filter);
	console.log(452, util.inspect(filter, false, null, true /* enable colors */))

	
	try {
		Pagination.listByPage(req, res, model, max_records, filter, keys, true);
	} catch (err) { }
}


function filterByKey(req, res, next, model){

}

async function post(req, res, next, model){	
	// Create a new record with the json body

	var jsonBody = req.body;

	for (const [key, value] of Object.entries(jsonBody)) {
	  //console.log(`${key}: ${value}`);
	  if(voca.includes(key, "_id")){
	  	if(value.length == 24)
	  		jsonBody[key] = mongoose.Types.ObjectId(value)
	  }
	}

	if(Array.isArray(jsonBody)){
		console.log("We have an array");
		for(var i = 0; i < jsonBody.length; i++){
			var payload = jsonBody[i]
			var db = new mongo(model, res.locals.user, res);
			res.locals.response = await db.mongoCreate(payload)

		}
	} else {
	  var db = new mongo(model, res.locals.user, res);
	}

	console.log(339, jsonBody, req.originalUrl)
	var result = await db.mongoCreate(jsonBody)

	// This could screw up flextable.  Hope not -- please check
	jsonBody["_id"] = result["_id"];
	if(result)
		res.locals.response = jsonBody;
	else 
		res.locals.response = false;
	
	return next(req, res);
}

async function put(req, res, next, model){
	var id = helpers.getParameter(req.params[0], "id");
	var jsonBody = req.body;

	for (const [key, value] of Object.entries(jsonBody)) {
	  //console.log(`${key}: ${value}`);
	  if(voca.includes(key, "_id")){
	  	console.log(472, key, value)
	  	if(value.length == 0)
	  		continue;
	  	jsonBody[key] = mongoose.Types.ObjectId(value)
	  }

	  // This is necessary because the entire object will be replaced.
	  if(voca.includes(key, "_by")){
	  	console.log(472, key, value)
	  	if(value.length == 0)
	  		continue;
	  	jsonBody[key] = mongoose.Types.ObjectId(value)
	  }

	  if(voca.includes(key, "owner")){
	  	console.log(472, key, value)
	  	if(value.length == 0)
	  		continue;
	  	jsonBody[key] = mongoose.Types.ObjectId(value)
	  }

	}

	console.log(479, model.collection.collectionName)

	var doc = await mongoose.connection.db.collection(model.collection.collectionName).updateOne(
  		{_id: mongoose.Types.ObjectId(id)},
  		{ $set: jsonBody });

	console.log(443, doc.result)
	// var doc = await model.findById(id);
	// 	doc.set(key, value);
	// 	doc.markModified(key);
	// await doc.save();

	res.locals.response = doc
	next(req, res);
}

/*
	We use PATCH to update a key/value pair for the associated
	Mongo document.

	So, for example, if we have a URL request that looks like this:
	PATCH https://www.saas-product.com/v1.0/api/datasource/test5/id/:id
	BODY:
	{
		key: "test",
		value: "newdata"
	}
*/

async function patch(req, res, next, model){

	var id = helpers.getParameter(req.params[0], "id");

	console.log(389, id);
	var jsonBody = req.body;
	var key = jsonBody["key"];
	var value = jsonBody["value"];

	if(voca.includes(key, "_id")){
	  	value = mongoose.Types.ObjectId(value)
	  }

	var updateObj = { }
	updateObj[key] = value
	console.log(371, id, updateObj);
	var doc = await mongoose.connection.db.collection(model.collection.collectionName).updateOne(
  		{_id: mongoose.Types.ObjectId(id)},
  		{ $set: updateObj });
	
	console.log(385, doc.result);
	// var doc = await model.findById(id);
	// 	doc.set(key, value);
	// 	doc.markModified(key);
	// await doc.save();

	res.locals.response = doc
	next(req, res);
}

async function del(req, res, next, model){

	var id = helpers.getParameter(req.params[0], "id");
	try {
	  var doc = await model.deleteOne({ _id: mongoose.Types.ObjectId(id) });
	  console.log("Delete result:", doc);
	} catch (error) {
	  console.error("Error:", error);
	}

	//
	//var doc = await model.deleteOne({ _id: mongoose.Types.ObjectId(id) });
	console.log(152, { _id: mongoose.Types.ObjectId(id) }, req.params[0], doc);
	res.locals.response = { "deleted":true }
	next(req, res);
}

/*
	Clone is a bit tricky...because I want the newly inserted document to automatically
	sort itself right after the document it was created by.  Everything is sorted based 
	on it's _id, so we need to hack this a little bit to make it be just a little bit greater
	than it's source _id
*/
async function clone(req, res){

	/*
	Returns a new ObjectId value. The 12-byte ObjectId value consists of:

	a 4-byte timestamp value, representing the ObjectId’s creation, measured in seconds since the Unix epoch
	a 5-byte random value
	a 3-byte incrementing counter, initialized to a random value
	*/

	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource);
	var model = mongoose.model(modelName);
	res.locals.datasource = datasource;
	var id = helpers.getParameter(req.params[0], "id");

	var newId = createCustomMongoId(id, 1);

	var doc = await model.findById(id).select('-created_by -modified_by -_id -owner -created -modified -__v').lean()
	var db = new mongo(model, res.locals.user, res);
	var created = false;

	//while(created == false){
		created = await db.mongoCreate(doc, newId)
		while(created == false)
		{
			console.log(239, "created is false");
			newId = createCustomMongoId(newId, 1);
			created = await db.mongoCreate(doc, newId)	
			// res.locals.response = created;
			// created = true;
			// return next(req, res);
		}		
		
	//}

	res.locals.response = {}
	return next(req, res);
}

async function swap(req, res){

}

function error(res, res, next, errno, msg){
	console.log(errno, msg);
}

async function search(req, res){

	var all = helpers.getParameter(req.params[0], "all");

	if(typeof all == 'undefined')
		all = false;
	console.log(577, all);

	var searchaggregate = helpers.getParameter(req.params[0], "searchaggregate");

//	console.log(580, typeof aggregate);

	var searchKey = helpers.getParameter(req.params[0], "search");
	var searchValue = helpers.getParameter(req.params[0], searchKey);
	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource);
	var model = mongoose.model(modelName);
	res.locals.datasource = datasource;

	if(typeof searchaggregate == 'undefined')
		searchaggregate = false;
	else {
		var aggregateStr = base64.decode(searchaggregate);
		aggregateStr = voca.replaceAll(aggregateStr, "$res.locals.user._id", res.locals.user._id)
		aggregateStr = voca.replaceAll(aggregateStr, "$res.locals.user.skill", JSON.stringify(res.locals.user.skill));

		var aggregate = eval(aggregateStr);
		var searchobj = {}
		
		if (isNaN(searchValue)) {
		    // searchTerm is not a number
		    searchobj[searchKey] = new RegExp(searchValue, "i");
		  } else {
		    searchobj[searchKey] = parseInt(searchValue);
		  }

		aggregate.unshift( { "$match": searchobj } )
		searchaggregate = aggregate
	}

	console.log(599, searchaggregate)

	var searchResults = await Pagination.searchByPattern(req, res, model, searchKey, searchValue, all, searchaggregate);
	res.locals.response = searchResults;
	return next(req, res);
}

async function autocomplete(req, res){
	
	var searchKey = helpers.getParameter(req.params[0], "autocomplete");
	var searchValue = helpers.getParameter(req.params[0], searchKey);
	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource);
	var model = mongoose.model(modelName);
	var query = {}
	query[searchKey] = {$regex: searchValue, $options: 'i'};
	var select = {}
	select[searchKey] = 1
	select["_id"] = 0;
	model.find(query, select, function(err, model){
		var response = []
		for(var i = 0; i < model.length; i++)
		{
			var result = model[i];
			response.push(result[searchKey])
			console.log(258, result);
		}
		let unique = [...new Set(response)];
		res.send(unique)
	}).limit(8).lean()
}

async function distinct(req, res){

	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

	var filterIndex = voca.search(fullUrl, "all");
	var getAll = {}

	var filter = null;
	if(filterIndex == -1){
		var body = Object.keys(req.body)
		if(body[0] == "filter"){
			filter = req.body["filter"];
		}
	}

	var jsonBody = filter;

	if(jsonBody != null){
	for (const [key, value] of Object.entries(jsonBody)) {
	  if(voca.includes(key, "_id")){
	  	jsonBody[key] = mongoose.Types.ObjectId(value)
	  }
	}
		filter = jsonBody;
	}

	//filter = jsonBody;

	if((filterIndex == -1) && (filter == null)){
		getAll = { "created_by":res.locals.user._id }
	} else {
		if(filter != null){
			getAll = filter;
		}
	}

	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)
	res.locals.datasource = datasource;
	res.locals.response = {};
	var model = mongoose.model(modelName);
	var key = helpers.getParameter(req.params[0], "distinct")
	var distinctData = await model.distinct(key, getAll);
	res.locals.response = distinctData
	return next(req, res);
}

async function distinctids(req, res){

	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var filterIndex = voca.search(fullUrl, "all");
	var getAll = {}

	var filter = null;
	if(filterIndex == -1){
		var body = Object.keys(req.body)
		if(body[0] == "filter"){
			filter = req.body["filter"];
		}
	}

	if((filterIndex == -1) && (filter == null)){
		getAll = { "created_by":res.locals.user._id }
	} else {
		if(filter != null){
			getAll = filter;
		}
	}

	var datasource = getDataSource(req);
	var modelName = getDataSource(req);
	res.locals.datasource = datasource;
	res.locals.response = {};

	var key = helpers.getParameter(req.params[0], "distinctids")
	var keys = {}
	keys[key] = 1;

	//var distinctData = await model.find(key, getAll, {"brand_name":1});
	var distinctData = await mongoose.connection.db.collection(modelName).find(getAll, {projection: keys}).toArray();

	res.locals.response = distinctData
	return next(req, res);
}
/*
	Adds an element to an array inside of a mongo document
*/
async function addToArray(req, res){

	var datasource = getDataSource(req);

	console.log(548, datasource);
	
	var modelName = checkDatasource(datasource)

	var id = helpers.getParameter(req.params[0], "id");

	res.locals.datasource = datasource;
	res.locals.response = {};

	var model = mongoose.model(modelName);

	var elementToAdd = req.body.value;
	var key = req.body.key;
	var value = req.body.value;

	if(voca.includes(req.params[0], "pluralize")){
		key = voca.lowerCase(key);
		key = pluralize(key);
	}

	var objToPush = {}
	objToPush[key] = value;

	// Object needs to be a reference and not a copy, this not requiring a return value
	function replaceMatchInObject(obj, key, value, search){
		
		if(obj == search){
			console.log(1966, obj, search)
			obj = value;
			return value;
		}
		return false;
	}

	function iterateThroughObj(obj){
		var keys = Object.keys(obj)
		//console.log(1975, obj, typeof obj[]);
		for(var i = 0; i < keys.length; i++){
			if(typeof  obj[keys[i]] == 'object'){
				iterateThroughObj(obj[keys[i]])
			} else {
				//console.log(1982, obj[keys[i]])
				var replace = replaceMatchInObject(obj[keys[i]], keys[i], mongoose.Types.ObjectId(res.locals.user._id), "$res.locals.user._id")
				if(replace != false){
					obj[keys[i]] = replace
					console.log(860, obj[keys[i]])

				}
			}
		}
	}

	iterateThroughObj(objToPush)

	console.log(888, objToPush);

	console.log(694,  { _id: id }, 
	    { $push: objToPush })

	var result = await model.update(
	    { _id: id }, 
	    { $push: objToPush },
	);

	console.log(701, result);
	
	res.locals.datasource = datasource;
	res.locals.response = {};

	return next(req, res);
}

async function addToArrayInAllDocuments(req, res){

	console.log(571)
	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)

	var id = helpers.getParameter(req.params[0], "id");

	res.locals.datasource = datasource;
	res.locals.response = {};

	var model = mongoose.model(modelName);

	var elementToAdd = req.body.value;
	var key = req.body.key;
	var value = req.body.value;

	if(voca.includes(req.params[0], "pluralize")){
		key = voca.lowerCase(key);
		key = pluralize(key);
	}

	var objToPush = {}
	objToPush[key] = value;

	var filter = getFilter(req);

	// var filterIndex = voca.search(fullUrl, "filter");
	// if(filterIndex != -1){
	// 	var filter = helpers.getParameter(fullUrl, "filter");
	// 	var filterStr = base64.decode(filter);
	// 	filterStr = voca.replaceAll(filterStr, "'", "\"");
	// 	filter = JSON.parse(filterStr);
	// }

	var result = await model.update(
	    filter, 
	    { $push: objToPush },
	    { multi: true}
	);

	console.log(612, datasource, objToPush);

	console.log(414, result);

	res.locals.datasource = datasource;
	res.locals.response = {};

	return next(req, res);
}

/*
	Adds an element to an array inside of a mongo document
*/
async function removeMatchFromArray(req, res){

	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)

	var id = helpers.getParameter(req.params[0], "id");

	res.locals.datasource = datasource;
	res.locals.response = {};

	var model = mongoose.model(modelName);

	var elementToAdd = req.body.value;
	var key = req.body.key;

	var objToPull = {}
	objToPull[req.body.key] = req.body.value;
	var result = await model.update(
	    { _id: mongoose.Types.ObjectId(id) },
	    { $pull: objToPull },
	    { multi: false }
	);

	console.log(786, result);
	
	res.locals.datasource = datasource;
	res.locals.response = result.result;

	return next(req, res);
}

/*
	Searches for matches in an array and updates the element
*/
async function patchElementMatchInArray(req, res){
	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)

	var id = helpers.getParameter(req.params[0], "id");

	res.locals.datasource = datasource;
	res.locals.response = {};

	var model = mongoose.model(modelName);

	var elementToAdd = req.body.value;
	var key = req.body.key;

	var objToMatch = {}
	objToMatch[`${req.body.arrayName}.${req.body.matchKey}`] = req.body.matchValue;
	objToMatch["_id"] = mongoose.Types.ObjectId(id)
	console.log(934, objToMatch);

	var updateValue = req.body.updateValue;
	if(typeof updateValue == "string"){
		updateValue = `"${updateValue}"`
	}

	if(typeof updateValue == "object"){
		updateValue = JSON.stringify(updateValue)
	}

	console.log(942, typeof updateValue)
	// We need to put quotes around req.body.updateValue if its a string... 
	var objToUpdate = JSON.parse(`{ "$set": { "${req.body.arrayName}.$.${req.body.updateKey}": ${updateValue} } }`);
	
	//objToUpdate[req.body.updateKey] = req.body.updateValue;

	console.log(940, objToMatch, objToUpdate)
	var result = await model.updateOne(
	    objToMatch,
	    objToUpdate,
	    { multi: false }
	);

	console.log(786, result);
	
	res.locals.datasource = datasource;
	res.locals.response = result.result;

	return next(req, res);
}

/*
	Searches for matches in an array and add the body to the array element
*/
async function putElementMatchInArray(req, res){

	console.log(974)
	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)

	var id = helpers.getParameter(req.params[0], "id");

	res.locals.datasource = datasource;
	res.locals.response = {};

	var model = mongoose.model(modelName);

	var elementToAdd = req.body.value;
	var key = req.body.key;

	var objToMatch = {}
	objToMatch[`${req.body.arrayName}.${req.body.matchKey}`] = req.body.matchValue;
	objToMatch["_id"] = mongoose.Types.ObjectId(id)
	console.log(934, objToMatch);

	var updateValue = req.body.updateValue;
	if(typeof updateValue != "object"){
		// This only works if the update value is an object
	}

	console.log(942, typeof updateValue)
	// We need to put quotes around req.body.updateValue if its a string... 
	var objToUpdate = { "$set": { "parts.$": updateValue[req.body.mergeKey] } }

	console.log(1000, objToUpdate)
	
	//objToUpdate[req.body.updateKey] = req.body.updateValue;

	console.log(940, objToMatch, objToUpdate)
	var result = await model.updateOne(
	    objToMatch,
	    objToUpdate,
	    { multi: false }
	);

	console.log(786, result);
	
	res.locals.datasource = datasource;
	res.locals.response = result.result;

	return next(req, res);
}

async function removeMatchFromArrayInAllDocuments(req, res){

	// if filter is null, match = { }
	// if not null, base64_decode, { }
	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)

	var id = helpers.getParameter(req.params[0], "id");

	res.locals.datasource = datasource;
	res.locals.response = {};

	var model = mongoose.model(modelName);

	var elementToAdd = req.body.value;
	var key = req.body.key;

	var objToPull = {}
	objToPull[req.body.key] = req.body.value;
	var result = await model.update(
		{},
	    { $pull: objToPull },
	    { multi: true }
	);


	res.locals.datasource = datasource;
	res.locals.response = {};

	return next(req, res);

}


function createCustomMongoId(oldId, increment){

	var newId = "";
	while(newId.length != 24){
	var buffer = Buffer.from(String(oldId), "hex")
	var timestamp = buffer.slice(0, 4);
	var randomValue = buffer.slice(4, 9);
	var counter = buffer.slice(9, 12);

	var Timestamp = timestamp.readUIntBE(0, 4);
	var RandomValue = randomValue.readUIntBE(0, 5)
	var Counter = counter.readUIntBE(0, 3) + increment

	newId = Timestamp.toString(16) + RandomValue.toString(16) + Counter.toString(16)
	increment++;
	}
	
	return newId;
}

async function getExcelDataFromRequestBody(req, res){
	var data = req.files[0].buffer
	var ExcelImport = new excel(data);
	var importData = await ExcelImport.loadWorkbook();
	return importData;
}

async function preflightCheck(req, res){

	var importData = await getExcelDataFromRequestBody(req, res)
	for(var i = 1; i < importData.length; i++){
		var doc = validateRowData(importData[i]);
	}

	function validateRowData(row){
		var docKeys = Object.keys(doc);
		for(var y = 0; y < docKeys.length; y++){
			var value = doc[docKeys[y]];
			value = voca.replaceAll(value, `\/,`, "%*%")
		}
	}

}

async function validateExcel(req, res){

	var requirements = {
		headers: ["Keyword"],
		cells: [{
			"A1":"Keyword"
		}]
	}

}

/*
{
"validation":{
  "sheets":[
     {
        "collection_name":"default",
        "required_keys":["Test 1", "Test 2", "Test 3"]
     }
  ]
}
}
*/

function harmonize(keys, excelData){

	for(var i = 0; i < required_keys.length; i++){

	}

	// In this function, we will take headers that are close to a required key, but not exact,
	// and harmoze the import data
	// examples would be: required key "Keyword"
	// we would accept "keyword", "Keywords", "keywords" as synonymouse with "Keyword"
	return excelData;
}

function validateWorksheet(validation, collectionName, excelData, req, res){

	if(excelData.length == 0){
		return excelImportError(req, res, { 
					"error_no":3,
					"error_desc":"There was an error with the excel file itself.  The converted data had a length of zero.  See datasource.js line 916 for more context"
				})		
	}

	var hasRequiredKeys = false;
	var required_keys = [];

	var bSheetHasValidation = false;

			var sheet = validation
			console.log(965, sheet, collectionName, sheet.collection_name)

				if(typeof sheet["required_keys"] != 'undefined'){	
					if(Array.isArray(sheet["required_keys"]) == true){
						required_keys = sheet["required_keys"];
						hasRequiredKeys = true;
					}
				}	
			bSheetHasValidation = true;
			
	console.log(980, bSheetHasValidation);
	// First, check and make sure that if we have any required keys, that they are in the document
	var keys = Object.keys(excelData[0])

	if(keys.length == 0){
		return excelImportError(req, res, { 
			"error_no":6,
				"error_desc":`The sheet titled '${collectionName}' is missing data.  Check 'row 2' in the excel file and make sure it is not empty`
		})		
	}

	console.log(986, keys)
	var missing_keys = []
	//required_keys = harmonize(keys)

	if(hasRequiredKeys){
		for(var i = 0; i < required_keys.length; i++){
			var required_key = required_keys[i];
			var index_of_required_key = keys.indexOf(required_key)
			//console.log(989, required_key, index_of_required_key)
			if(index_of_required_key == -1){
				//console.log(missing_keys)
				missing_keys.push(required_key)
				//console.log(missing_keys)
			}
		}

		if(missing_keys.length > 0){
			console.log(997, "returning false")
			return excelImportError(req, res, { 
						"error_no":5,
						"error_desc":`The sheet titled '${collectionName}' is missing required headers: ${missing_keys.toString()}`
					})				
		}
	}

	console.log(1007);

	return true;

}

function getCollectionName(sheetname){
		var collectionName = voca.replace(sheetname, " ", "");
		collectionName = voca.replace(collectionName, "(", "");
		collectionName = voca.replace(collectionName, ")", "");
		collectionName = voca.lowerCase(collectionName);
		return collectionName;
}

function parseImportedData(importData){
	var importDataAr = [];
	var importDataVals = Object.values(importData);

	var user = res.locals.user;

	for(var i = 0; i < Object.keys(importData).length; i++){
		importDataAr.push(importDataVals[i])
	}	


}

async function getCollectionNames(filter){
	if(typeof filter.sheetNamesToDatasource == "boolean"){
		if(filter.sheetNamesToDatasource){
			// We're going to insert each sheet into MongoDB with the sheet
			// name as the collection name
			//sheetNames = 
			importData = await ExcelImport.loadWorkbook(false);

			//console.log(803, util.inspect(importData, false, null, true /* enable colors */))
			var keys = Object.keys(importData);

			sheetNames = [];
			for(var i = 0; i < keys.length; i++){
				sheetNames.push(keys[i])
				var collectionName = voca.replace(keys[i], " ", "");
				collectionName = voca.replace(collectionName, "(", "");
				collectionName = voca.replace(collectionName, ")", "");
				collectionName = voca.lowerCase(collectionName);
				collectionNames.push(collectionName)
			}
		}
	} else {
		collectionNames.push(datasource)
	}	
}

async function getWorkbookData(req, res, filter, fileBuffer, x){

	console.log(1249, "getting workbook data")
	var validation = false;

	if(typeof filter.validation != 'undefined'){
		validation = true;
	}

	var bySheets = true;

	var type = "xlsx";

	var isCsv = voca.indexOf(req.files[x]["originalname"], ".csv")

	if(req.files[x].buffer[0] == 255){
		if(req.files[x].buffer[254]){
			return excelImportError(req, res, { 
				"error_no":10,
				"error_desc":`The file '${req.files[x]["originalname"]} has a .csv extension but is not a properly formatted .csv file.  If you downloaded this file from ahrefs, make sure you selected the option 'For Open Office, Libre & Other (UTF-8)`
		});
		}
	}

	if(isCsv != -1)
		type = "csv";
	//console.log(1065, req.files[x].buffer.compare())
	var data = req.files[x].buffer

	console.log(1276, "Loading workbook into excel object")
	var ExcelImport = new excel(data, {}, type);
	var importData = [await ExcelImport.loadWorkbook(bySheets)];

	console.log(1280, "data loaded");

	var sheetnames = [];
	if(bySheets == true)
		sheetnames = Object.keys(importData[0]);
	else {
		sheetnames = [ExcelImport.firstSheetName];
	}

	var importDataAsValues = Object.values(importData[0])

	//console.log(1075, filter.validation.sheets);

	//console.log(1289, validation)

	var sheets = [];
	for(var i = 0; i < sheetnames.length; i++){
		//console.log(1029, sheetnames[i], i);
		consolidateRows(importDataAsValues[i])
		var sheet = {
			"sheetname":sheetnames[i],
			"sheetdata": importDataAsValues[i],
			"collection_name" : getCollectionName(sheetnames[i])
		}
		
		var defaultValidation = {}
		if(validation){
		if(typeof filter.validation.sheets != 'undefined'){
			if(Array.isArray(filter.validation.sheets)){
				//console.log(1088, filter.validation.sheets.length)
				for(var x = 0; x < filter.validation.sheets.length; x++){
					if(typeof filter.validation.sheets[x].sheetname == 'undefined')
						filter.validation.sheets[x].sheetname = sheetnames[i]
					if(sheetnames[i] == filter.validation.sheets[x].sheetname){
						sheet = { ... sheet, ... filter.validation.sheets[x] }
					}
					if(filter.validation.sheets[x].default == true){
						console.log(1335, defaultValidation)
						defaultValidation = { ... filter.validation.sheets[x] }
					}
				}
			}
		}
		
	}
	sheets.push(sheet)
	}

	//console.log(1346, util.inspect(filter, false, null, true /* enable colors */))

	//console.log(1365, validation);//, util.inspect(filter, false, null, true /* enable colors */))

	delete defaultValidation.sheetname;
	delete defaultValidation.default;
	// Ensure every sheet has a default validation object if one was provided
	for(sheet in sheets){
		//console.log(1346, sheet);
		if(typeof sheets[sheet].primary_key == 'undefined'){
			sheets[sheet] = { ... sheets[sheet], ... defaultValidation }
		}
	}

	

	//for(sheet of sheets){
	//	console.log(1359, filter)
	if(validation == true){
		for(f of filter.validation.sheets){
			for(s of sheets){
				if(f.sheetname ==s.sheetname){
					//console.log(1361, f, 1362, s);	
					if(f.primary_key != s.primary_key){
						s.primary_key = f.primary_key
					}
				}
			}
		}
	}
		
		//console.log(1346, sheet);
		//
		// if(typeof sheet.primary_key == 'undefined'){
		// 	sheet = { ... sheet, ... defaultValidation }
		// }
	//}

	var entireWorkbookRaw = sheets;

	for(var i = 0; i < entireWorkbookRaw.length; i++){
		var sheetRows = entireWorkbookRaw[i]
		//console.log(1110, sheetRows.sheetdata);
		for(var y = 0; y < sheetRows.sheetdata.length; y++){
			var doc = createDocumentFromRow(sheetRows.sheetdata[y]);
			entireWorkbookRaw[i].sheetdata[y] = doc;
		}
	}

	if(validation)
	{
		var validWorkbook = validateWorkbook(req, res, entireWorkbookRaw, x)
		if(validWorkbook == false)
			return false;

		if(typeof filter.validation.sheets[0].collection_name == 'undefined')
			entireWorkbookRaw[0].collection_name = res.locals.datasource
	} else {
		entireWorkbookRaw[0].collection_name = res.locals.datasource
	}

	// The default collection name is based on the name of the tab in the excel spreadsheet
	// This can be overridden by adding a 
	//console.log(1134, entireWorkbookRaw[0].collection_name)



	return entireWorkbookRaw;
}

function validateWorkbook(req, res, workbook, fileIndex){

	for(var i = 0; i < workbook.length; i++){
		var validSheet = validateWorksheet(req, res, workbook[i], fileIndex)
		if(!validSheet){
			return false;
		}
	}
	return true;
}

function validateWorksheet(req, res, sheet, fileIndex){

	var keys = Object.keys(sheet.sheetdata[0])

	if(typeof sheet.primary_key != 'undefined'){
		// We defined a primary key...let's make sure it's in the spreadsheet
		var primary_key = sheet.primary_key
		console.log(1159, fileIndex, req.files[fileIndex-1])
		if(keys.indexOf(primary_key) == -1){
			return excelImportError(req, res, { 
				"error_no":1,
				"error_desc":`The file "${req.files[fileIndex-1]["originalname"]}" is missing a required column: '${sheet.primary_key}' in sheet "${sheet.sheetname}"`
		});
	}
	}

	// If we didn't supply any required keys, then anything goes!  Return true;
	if(typeof sheet.required_keys == 'undefined'){
		return true;
	}

	// https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
	// let intersection = sheet.required_keys.filter(x => keys.includes(x));
	// let difference = sheet.required_keys
	// 		.filter(x => !keys.includes(x))
	//		.concat(keys.filter(x => !sheet.required_keys.includes(x)));

	let difference = sheet.required_keys.filter(x => !keys.includes(x));

	if(difference.length > 0){
		return excelImportError(req, res, { 
			"error_no":2,
			"error_desc":`The sheet ${sheet.sheetname} is missing a required columns: '${difference.toString()}'`
		});
	}

	//console.log(1181, keys);

	//let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index)
	
	//console.log(1183, findDuplicates(keys));

	return true;
}

async function exceltojson(req, res){
	var datasource = req.params[0]
	res.locals.datasource = datasource
	var user = res.locals.user;
	var filter = getExcelImportParameters(req, res, req.query.params);

	//var datasourceFilter = getExcelImportParameters(req, res, req.query.params);

	//console.log(1257, filter);

	

	if(!filter)
		return false;

	//console.log(1210, req.files.length)

	var writeResultsAr = [];

	var errors = 0;
	for(var i = 0; i < req.files.length; i++){
		var fileBuffer = req.files[i];
	
	var entireWorkbook = await getWorkbookData(req, res, filter, fileBuffer, i);

	//console.log(1272, entireWorkbook);

	// If entireWorkbook is false, there was an error loading the workbook.  An
	// error has already been returned to the client, so the only thing left to do
	// here is return.
	if(entireWorkbook == false){
		errors++;
		continue;
	}
	}

	console.log(1507, util.inspect(entireWorkbook, false, null, true /* enable colors */))
	if(errors == 0){
		res.locals.response = entireWorkbook;
		next(req, res);
	}

}

async function importExcel(req, res){

	var bSendResponse = true;
	// If we have a really big file, let's return early.
	if(req.get("content-length") > 10000000){
		var datasource = req.params[0]
		res.locals.datasource = datasource
		var user = res.locals.user;
		res.locals.response = { "import": true, results: "Large Upload Started" }
		next(req, res);
		bSendResponse = false;
	}

	console.log(1248, "import excel");

	var datasource = req.params[0]
	res.locals.datasource = datasource
	var user = res.locals.user;
	var filter = getExcelImportParameters(req, res, req.query.params);

	//var datasourceFilter = getExcelImportParameters(req, res, req.query.params);

	//console.log(1257, filter);

	

	if(!filter)
		return false;

	//console.log(1210, req.files.length)

	var writeResultsAr = [];

	var errors = 0;
	console.log(1532, req.files);
	for(var i = 0; i < req.files.length; i++){
		var fileBuffer = req.files[i];
	
	var entireWorkbook = await getWorkbookData(req, res, filter, fileBuffer, i);

	console.log(1272, "Entire Workbook Loaded");

	// If entireWorkbook is false, there was an error loading the workbook.  An
	// error has already been returned to the client, so the only thing left to do
	// here is return.
	if(entireWorkbook == false){
		errors++;
		continue;
	}

	//console.log(1507, util.inspect(entireWorkbook, false, null, true /* enable colors */))


	var results = await putWorkbookIntoDatabase(entireWorkbook, user, filter)
	results[0]["filedata"] = { ... req.files[i] }

	console.log(1251, results);

	try {
		delete results[0]["filedata"]["buffer"];
		delete results[0].writeresults.upserted;
		delete results[0].writeresults.lastOp;
		delete results[0].writeresults.ConcernErrors;
		delete results[0].writeresults.insertedIds;
	} catch(err){
		// We really don't care if it fails
		//console.log(1218, results[0])
	}
		writeResultsAr.push(results);
	}

	if(errors == 0){
		if(bSendResponse){
			res.locals.response = { "import": true, results: entireWorkbook }
			next(req, res);
		}
	}
}

async function putWorkbookIntoDatabase(workbook, user, filter){
	var results = [];
	console.log(1574, "Putting workbook into database");
	for(var i = 0; i < workbook.length; i++){
		var result = await putSheetIntoDatabase(workbook[i], user, filter)
		results.push(result)
	}
	return results;
}

async function putSheetIntoDatabase(sheet, user, filter){

	// Let's check and see if there are any preprocessors
	console.log(1239, "Putting Sheet into database", filter);
	console.log(1240, util.inspect(sheet.sheetname, false, null, true /* enable colors */));

	var secondary_key = null;
	var exclude_search = null;
	var exclude_update = null;

	for(var i = 0; i < filter.validation.sheets.length; i++){
		if(filter.validation.sheets[i].primary_key == sheet.primary_key){

			if(filter.validation.sheets[i].exclude_search != 'undefined'){
				exclude_search = filter.validation.sheets[i].exclude_search
			}

			if(filter.validation.sheets[i].exclude_update != 'undefined'){
				exclude_update = filter.validation.sheets[i].exclude_update
			}

			if(filter.validation.sheets[i].preprocessing != 'undefined'){
				// We have a preprocessor...let's apply the filter to the data
				if(filter.validation.sheets[i].preprocessing == "extractdomains"){
					sheet.sheetdata = extractdomains(sheet.sheetdata);
					secondary_key = "domain"
				}

				if(filter.validation.sheets[i].preprocessing == "filterhunterinput"){
					sheet.sheetdata = filterhunterinput(sheet.sheetdata, filter);
				}

				if(filter.validation.sheets[i].preprocessing == "manual_keyword_upload_for_linkbuilding"){
					console.log(1296, "preprocessing", filter)
					sheet.sheetdata = await manual_keyword_upload_for_linkbuilding(sheet.sheetdata, filter, user);
				}
			}			
		}
	}

	var filterCpy = { ... filter }
	delete filterCpy.validation;
	console.log(1721, filter);

	var model = mongoose.model(checkDatasource(sheet.collection_name))
	console.log(1722, sheet.collection_name, sheet.sheetname);

	if(filter.sheetNamesToDatasource == true){
		model = mongoose.model(checkDatasource(sheet.sheetname))
	}

	var db = new mongo(model, user)
	var docs = sheet.sheetdata;

	console.log(1315, "inserting", sheet.method, docs.length, "records");

	if(typeof sheet.method == 'undefined'){
		sheet.method = "update"
	}

	if(sheet.method == "update"){
		var results = await db.mongoCreateManyOnDuplicateKeyUpdate(docs, filterCpy, sheet.primary_key, secondary_key, exclude_search, exclude_update);
		console.log(1729, sheet.sheetname)
		return { 'sheet': sheet.sheetname, 'writeresults': results };
	}
	if(sheet.method == "insert"){
		console.log(1737, sheet.sheetname)
		var results = await db.mongoCreateMany(docs, filterCpy, sheet.primary_key);
		return { 'sheet': sheet.sheetname, 'writeresults': results };
		return results;
	}
	return false;
}

async function manual_keyword_upload_for_linkbuilding(sheet, filter, user){

	console.log(1321, filter);

	var model = mongoose.model("Bounty")
	var db = new mongo(model, user)
	var Bounty = new bounties({}, db, user);

	for(var i = 0; i < sheet.length; i++){
		var rowData = sheet[i];
		var keys = Object.keys(rowData);
		var values = Object.values(rowData);
		for(var y = 0; y < keys.length; y++){
			var key = keys[y];
			var value = values[y]

			if(key == 'URL'){
				//var parsed = psl.parse(value);
				//rowData = { ... rowData, ... parsed }
				//sheet[i] = rowData
				var bounty_id = await Bounty.searchForBountyIfNotExistsCreateWithLink(filter.brand_id, value, rowData["Keyword"]);
				rowData["bounty_id"] = bounty_id;
			}
		}
		rowData["bKeywordDeployed"] = true

	}


	return sheet;
}

function filterhunterinput(sheet){

	var referring_domainsBulKData = []

	for(var i = 0; i < sheet.length; i++){
		var rowData = sheet[i];
		var keys = Object.keys(rowData);
		var values = Object.values(rowData);
		for(var y = 0; y < keys.length; y++){
			var key = keys[y];
			var value = values[y]
			if(key == 'Email address'){
				var parsed = { "Email" : value }
				rowData = { ... rowData, ... parsed }
				sheet[i] = rowData
			}

			if(key == 'Domain name'){
				var parsed = psl.parse(value);
				parsed.domain = parsed.input;
				rowData = { ... rowData, ... parsed }
				sheet[i] = rowData
				referring_domainsBulKData.push(parsed);
			}
		}
		rowData["downloads"] = 0
	}


	return sheet;
}

function extractdomains(sheet){
	for(var i = 0; i < sheet.length; i++){
		var rowData = sheet[i];
		var keys = Object.keys(rowData);
		var values = Object.values(rowData);
		for(var y = 0; y < keys.length; y++){
			var key = keys[y];
			var value = values[y]
			if(key == 'Referring Page URL'){
				var url = voca.replaceAll(value, "https://", "")
				url = voca.replaceAll(url, "http://", "");
				var firstForwardSlash = voca.indexOf(url, "/");
				var endPos = url.length;
				if(firstForwardSlash != -1)
					endPos = firstForwardSlash;
				var domain = voca.substring(url, 0, endPos);
				var parsed = psl.parse(domain);
				parsed.domain = parsed.input;
				rowData = { ... rowData, ... parsed }
				sheet[i] = rowData
			}
		}
		rowData["downloads"] = 0
	}
	//console.log(1295, util.inspect(sheet, false, null, true /* enable colors */))
	return sheet;

}


function isNumber(str) {
				  // Use the parseFloat function to check if the string can be parsed into a number
				  // If it can be parsed, it's a valid number
				  return !isNaN(parseFloat(str)) && isFinite(str);
}

				function convertToNumber(str) {
				  // Use parseFloat to convert the string to a number
				  return parseFloat(str);
				}


function createDocumentFromRow(doc){

		var docKeys = Object.keys(doc);
		for(var y = 0; y < docKeys.length; y++){

			var value = doc[docKeys[y]];

			//console.log(1746, util.inspect(value, false, null, true /* enable colors */))
			// Links are very common -- Excel automatically created objects
			if(typeof value == 'object'){
				if(typeof value.hyperlink != 'undefined'){
					// We definitely have a link...convert it
					value = value.hyperlink
				} else if(typeof value.text != 'undefined'){
					value = value.text;
				}
			}

			//if(typeof value === 'string'){
				if(isNumber(value)){
					console.log(1757, docKeys[y], value, convertToNumber(value));
				}	
			//}
			

			if(Array.isArray(value))
			{
				doc[docKeys[y]] = value;
				continue;
			}
			value = voca.replaceAll(value, `\/,`, "%*%")
			//console.log(974, value);
			// Look for " ,", and if present, convert to array
			if(voca.includes(value, "||")){

				doc[docKeys[y]] = voca.split(value, "||");
				//console.log(978, doc[docKeys[y]]);
				for(var t = 0; t < doc[docKeys[y]].length; t++){
					if(!isNaN(doc[docKeys[y]][t]))
						doc[docKeys[y]][t] = Number(doc[docKeys[y]][t])
				}
			} else
				doc[docKeys[y]] = voca.replaceAll(doc[docKeys[y]], "/,", ",")
			
			if(isNumber(value)){
				console.log(697, docKeys[y], value, convertToNumber(value))
				doc[docKeys[y]] = convertToNumber(value);
			}
			
			
			if(!Number.isNaN(parseInt(value))){
				if(voca.isDigit(value)){
					console.log(1907, value);
					doc[docKeys[y]] = convertToNumber(value);
				}
			}
			
			//console.log(1783, doc[docKeys[y]], value)

			if(doc[docKeys[y]] == "[object Object]"){
				doc[docKeys[y]] = value;
			}
				if(value == 'true')
					doc[docKeys[y]] = true
				if(value == 'false')
					doc[docKeys[y]] = false
			
		}


		//console.log(1757, util.inspect(doc, false, null, true /* enable colors */))

		return doc;
	}

	function consolidateRows(excelImportData){

		//console.log(1276, "Consolidating rows", excelI);

		var headerColumn = 0;

		top:
		while(true){
		for(var i = 0; i < excelImportData.length; i++){
			var row = excelImportData[i];
			if(i < excelImportData.length)
				var nextRow = excelImportData[i+1]
			else nextRow = null;

			if ((typeof Object.values(row)[0] != 'undefined') || (Object.values(row)[0] != '')){
				if(nextRow != null){
				if ((typeof Object.values(nextRow)[0] == 'undefined') || (Object.values(nextRow)[0] == '')){

					var mergedObject = mergeObjectsByArrayStrategy(Object.keys(row)[0], row, nextRow, excelImportData, i)

					if(mergedObject != false)
						excelImportData[i] = mergedObject
					excelImportData.splice(i+1, 1)
					continue top;
				}
			} else {

			}
			}
		}
		break;
		}

		// Takes the data from rowToGive and puts it into the rowToReceive around.  rowToReceive[header] should be typeof undefined
		function mergeObjectsByArrayStrategy(headerColumn, rowToReceive, rowToGive, arrayToSplice, pos){

			if(rowToGive == null)
				return false;

			// if(typeof rowToGive[headerColumn] !== 'undefined')
			// 	return false;

			var rowToReceiveValues = Object.values(rowToReceive)
			var rowToReceiveKeys = Object.keys(rowToReceive)
			var rowToGiveValues = Object.values(rowToGive)

			for(var i = 0; i < rowToReceiveValues.length; i++){
				var rowToReceiveValue = rowToReceiveValues[i];
				var rowToGiveValue = rowToGiveValues[i]
				//console.log(1045, rowToGiveValue)
				if(typeof rowToGiveValue == 'undefined')
					continue;
				if(rowToGiveValue == '')
					continue;
				if(i != 0){
					if(Array.isArray(rowToReceiveValue)){

						rowToReceiveValue.push(rowToGiveValue)
					} else {
						rowToReceiveValue = [rowToReceiveValue, rowToGiveValue]
					}
					rowToReceive[rowToReceiveKeys[i]] = rowToReceiveValue
				}
			}
		
			return rowToReceive
			}
	
		//console.log(1344, util.inspect(excelImportData, false, null, true /* enable colors */))
	}

function getExcelImportParameters(req, res, params){
	try {
		var filterStr = base64.decode(params);
		} catch (err){
		return excelImportError(req, res, { 
			"error_no":1,
			"error_desc":"Unable to parse the parameters that were passed in the url.  Specifically the base64 decoding failed."
		})
	}

	filterStr = voca.replaceAll(filterStr, "'", "\"");
	var bMergeFilter = false;
	//console.log(1140, filterStr);

	try {
		var filter = JSON.parse(filterStr);
		bMergeFilter = true;
	} catch (err){
		return excelImportError(req, res, { 
			"error_no":2,
			"error_desc":"Unable parse the URL parameters into a JSON Object.  The 'params=' URL parametere is a base64-encoded JSON object.  In this case the JSON.parse() function failed"
		})
	}

	for (const [key, value] of Object.entries(filter)) {
	  if(voca.includes(key, "_id")){
	  	filter[key] = mongoose.Types.ObjectId(value)
	  }
	}

	//console.log(1151, filter);
	return filter;
}

function excelImportError(req, res, error){

	console.log(1521, error);

   var defaultErrorResponse = helpers.defaultErrorResponseObject();
  defaultErrorResponse.error = error.err_no;
  defaultErrorResponse.ErrorDetails.Error = error.err_no;
  defaultErrorResponse.ErrorDetails.Description = error.error_desc;
  res.json(defaultErrorResponse);

	return false;
}

var exclude = "-_id -created_by -modified_by -owner -__v -created -modified"

// async function exportExcel(req, res, next, model){

// 	var datasource = helpers.getParameter(req.params[0], "export");
// 	res.locals.datasource = datasource

// 	var modelName = checkDatasource(datasource)
// 	var model = mongoose.model(modelName);
// 	//var data = await model.find({}).lean().select(exclude);

// 	var data = await model.find({created_by:res.locals.user._id}).lean().select(exclude);

// 	if(data == null)
// 		return;

// 	var headers = [];
// 	var keys = Object.keys(data[0])
// 	for(var i = 0; i < keys.length; i++){
// 		headers.push({
// 			header: keys[i],
// 			key: keys[i]
// 		})
// 	}

// 	const Excel = require('exceljs');
// 	var workbook = new Excel.Workbook();

// 	var sheet = workbook.addWorksheet(res.locals.datasource);
// 	sheet.columns = headers;

// 	for(var i = 1; i < data.length; i++){
// 		var dbRow = data[i];
// 		var row = {}
// 		row['id'] = i;
// 		for(var y = 0; y < keys.length; y++){
// 			var value = dbRow[keys[y]];
// 			if(typeof value != "object"){
// 				row[keys[y]] = dbRow[keys[y]]
// 			}
// 			else
// 			{
// 				if(Array.isArray(value)){
// 					row[keys[y]] = voca.replaceAll(value.toString(), ",", ", ");
// 				}
// 			}
// 		}
// 		sheet.addRow(row);
// 	}

// 	// write to a new buffer
// 	workbook.xlsx.writeBuffer()
// 	  .then(function(buffer) {
// 	    // done
// 	    res.header('content-type','application/vnd.ms-excel');
// 		res.header('content-disposition', `attachment; filename=${modelName}.xlsx`);
//             res.status(200);
//             res.send(buffer);
// 	  });
// }

async function exportExcel(req, res, next, model){

	var datasource = helpers.getParameter(req.params[0], "export");
	res.locals.datasource = datasource

	var modelName = checkDatasource(datasource)
	var model = mongoose.model(modelName);

	var data = await model.find({created_by:res.locals.user._id}).lean().select(exclude).sort({_id:1});
	if(data == null)
		return;

	var headers = [];
	var keys = Object.keys(data[0])
	for(var i = 0; i < keys.length; i++){
		headers.push({
			header: keys[i],
			key: keys[i]
		})
	}

	const Excel = require('exceljs');
	var workbook = new Excel.Workbook();

	var sheet = workbook.addWorksheet(res.locals.datasource);
	sheet.columns = headers;

	for(var i = 0; i < data.length; i++){
		var dbRow = data[i];
		var row = {}
		row['id'] = i;
		for(var y = 0; y < keys.length; y++){
			var value = dbRow[keys[y]];
			if(typeof value != "object"){
				row[keys[y]] = dbRow[keys[y]]
			}
			else
			{
				if(Array.isArray(value)){
					row[keys[y]] = voca.replaceAll(value.toString(), ",", ", ");
				}
			}
		}
		sheet.addRow(row);
	}

	// write to a new buffer
	workbook.xlsx.writeBuffer()
	  .then(function(buffer) {
	    // done
	    res.header('content-type','application/vnd.ms-excel');
		res.header('content-disposition', `attachment; filename=${modelName}.xlsx`);
            res.status(200);
            res.send(buffer);
	  });
}

/*
	This takes data and returns an aggregated result.
	Note, this is a potentially huge security vulnerability
	Because it will return results for anything submitted.
	To-Do: add security
*/


async function getAggregateCount(aggregate, modelName, model){


	console.log(1939, util.inspect(aggregate, false, null, true /* enable colors */))
	aggregate.push({ $group: { _id: null, n: { $sum: 1 } } })

	//aggregate.splice(3, 1)

	console.log(2053, util.inspect(aggregate, false, null, true /* enable colors */))

	try {
		var count = await model.aggregate(aggregate);
	} catch(err){
		console.log(2058, count);
	}

	console.log(2061, count);

	if(Array.isArray(count)){
		if(count.length == 0)
			return 0;
		if(typeof count[0]['n'] === 'undefined'){
			return count.length;
		}
		
		console.log(1718, count[0]['n']);

		return count[0]['n']
	} else
	return 0;
}

async function aggregateCount(req, res){
	return aggregate(req, res, true);
}

async function aggregate(req, res, count =false){

	console.log(2070);
	var xbody = req.headers["x-body"];
	var keys = req.body
	if(typeof xbody != 'undefined'){
		keys = xbody.split(",");
	}

	if(Array.isArray(keys) == false)
		keys = [];

	var aggregateStr = base64.decode(req.body.aggregate)
	aggregateStr = voca.replaceAll(aggregateStr, "$res.locals.user._id", JSON.stringify(mongoose.Types.ObjectId(res.locals.user._id)))
	aggregateStr = voca.replaceAll(aggregateStr, "$res.locals.user.skill", JSON.stringify(res.locals.user.skill));
	aggregateStr = voca.replaceAll(aggregateStr, "$res.locals.user.accountId", JSON.stringify(res.locals.user.accountId));
	//aggregateStr = voca.replaceAll(aggregateStr, "$res.locals.user._id", JSON.stringify(res.locals.user.skill));

	//console.log(1840, util.inspect(aggregateStr, false, null, true /* enable colors */))

	var aggregate = eval(aggregateStr);

	function iterateThroughObject(obj, parentKey =null){
		if(obj === null){
			return;
		}

		console.log(2091, obj);
		for (const [key, value] of Object.entries(obj)) {

			//console.log(1845, typeof(value), value, key)

			if(typeof(value) == "object"){
				iterateThroughObject(value, key)
			} else {
				
				if(voca.indexOf(value, "$") == -1){
				if(value != "$_id"){
				if(voca.includes(key, "_id")){
					console.log(2141, key, value)
					if(value !== 1){
				  		obj[key] = mongoose.Types.ObjectId(value);
				  	}
				  	console.log(2142, obj[key]);
				  }
 				if(voca.includes(key, "_by")){
					console.log(2151, key, value)
					if(value !== 1){
				  		obj[key] = mongoose.Types.ObjectId(value);
				  	}
				  	console.log(2142, obj[key]);
				  }	
				  if(voca.includes(key, "inhouse")){
				  	obj[key] = mongoose.Types.ObjectId(value)
				  }
				  		
				}

			}

			if(parentKey == "owner"){
				console.log(1867, parentKey,value)
				if(value.length == 24){
				  		console.log(1862, key, value)
				  		obj[key] = mongoose.Types.ObjectId(value)
				  	}
			}

			if(parentKey == "process.pipeline"){
				  	//console.log(1860, key, value)
				  	if(value.length == 24){
				  		console.log(1862, key, value)
				  		obj[key] = mongoose.Types.ObjectId(value)
				  	}
				  }
			}
		}		
	}

	if(aggregate != null){
		for(var i = 0; i < aggregate.length; i++){
			iterateThroughObject(aggregate[i])
		}
	}

	//console.log(1731, util.inspect(aggregate, false, null, true /* enable colors */))

	// This function is intended to ensure the string will only return results for the account
	//aggregate = reduceResultsByPermissions(aggregateStr)

	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)
	var model = mongoose.model(modelName);

	//var documentCount = await getAggregateCount([].concat(aggregate), modelName, model);

	// look and see if we're on a page ... ala page/1/id/60a275a27b479949ee12d30f
	// if so, add to the $match stage to make _id: gt: id
	var page = helpers.getParameter(req.params[0], "page");
	if(typeof page == 'undefined'){
		page = req.params['page']
	}

	var max_records = parseInt(helpers.getParameter(req.params[0], "max_records"));
	if(isNaN(max_records))
		max_records = 20;

	if(count == true){
		aggregate.push({ $count: "count" })
	}

	
	var aggregateClone = Array.from(aggregate)
	var aggregateClone2 = Array.from(aggregate)

	// We need to look for a /page/ and /id in the URL
	//console.log(2051, page, req.params);

	if(typeof page != 'undefined'){
		// We've got a paginated request...
		page = parseInt(page)
		var startingId = req.params["id"];
		//console.log(2056, startingId);
		aggregate.unshift({ '$match' : { '_id': {'$gte': mongoose.Types.ObjectId(startingId) } } } )
	} else {
		// Adding this resolved a serious pagination bug.  This fixes the issue
		aggregate.unshift({ '$match' : { '_id': {'$gte': mongoose.Types.ObjectId("000000000000000000000001") } } } )
		page = 1;
	}
	
	console.log(2180, util.inspect(aggregate, false, null, true /* enable colors */))

	try {
		res.locals.response = await model.aggregate(aggregate).limit(max_records);
	} catch(err){
		console.log(1312, err);
	}

	console.log(2074, util.inspect(res.locals.response, false, null, true /* enable colors */))

	var definitions = null;

	if(res.locals.response.length > 0)
		var definitions = await Paginationv2.getDisplayHeaders(keys,res.locals.response);

	var defaultResponseObject = helpers.defaultResponseObject(res.locals.datasource)
	defaultResponseObject[res.locals.datasource] = res.locals.response;
	defaultResponseObject["datasource"] = res.locals.datasource
	defaultResponseObject["headers"] = keys;
	if(definitions != null){
		defaultResponseObject["addDataForm"] = definitions["addDataForm"]
		defaultResponseObject["displayHeaders"] = definitions["displayHeaders"];
	} else {
		defaultResponseObject["displayHeaders"] = []
		defaultResponseObject["addDataForm"] = []
	}

	//console.log(2096, util.inspect(aggregateClone, false, null, true /* enable colors */))

	if(res.locals.response.length == 0){
			res.status(200);
			res.json(defaultResponseObject);
			return;
	}

	var firstId = res.locals.response[0]["_id"];
	var lastId = res.locals.response[res.locals.response.length-1]["_id"];

	const maxObjectId = mongoose.Types.ObjectId('ffffffffffffffffffffffff');
	const minObjectId = mongoose.Types.ObjectId.createFromHexString('000000000000000000000001');

	console.log(2219, firstId, res.locals.response);
	try { var testMinId = mongoose.Types.ObjectId(firstId); } catch(err){ }
	try { var testMaxId = mongoose.Types.ObjectId(lastId); } catch(err){ }

	if(typeof testMinId === 'undefined'){
		firstId = minObjectId
	}
	
	if(typeof testMaxId === 'undefined'){
		lastId = maxObjectId
	}

	console.log(2329, defaultResponseObject[datasource])
	for(let myItem of defaultResponseObject[datasource]){
		console.log(2331, myItem);
		myItem['requested_by'] = res.locals.user._id;
		console.log(2332, myItem['requested_by'], res.locals.user._id)
	}

	// If this is the inital page load, do this.
	if(page == 1)
		defaultResponseObject["pagination"] = await calculateInitialAggregationPages([ ... aggregateClone2 ], max_records, modelName, model, req, res, firstId, lastId, page)
	else 
		defaultResponseObject["pagination"] = await calculateSubsequentAggregationPages([ ... aggregateClone ], max_records, modelName, model, req, res, firstId, lastId, page)

	res.status(200);
	res.json(defaultResponseObject);

}

async function calculateSubsequentAggregationPages(aggregate, limit, modelName, model, req, res, firstId, lastId, page){

	var origPage = page;
	console.log(2118, page, lastId);
  	var origAggregate = [ ... aggregate ];//JSON.parse(JSON.stringify(aggregate));

  	console.log(2257, util.inspect(aggregate, false, null, true /* enable colors */))

  	var origAr = Array.from(aggregate);
  	var origAr2 = [ ... aggregate ]

	var count = await getAggregateCount(aggregate, modelName, model);

	var pages = Math.ceil(count / limit)



	var ids = await getAggregateIds(origAr, limit, pages, firstId, modelName, model)

	  var route = req.originalUrl;

	  var routeIdPos = voca.indexOf(route, "/id/")
	  var routePagePos = voca.indexOf(route, "/page/");
	  route = voca.substr(route, 0, routePagePos);

	var prevPagesAr = await getReverseAggregateIds(origAr2, limit, pages, firstId, modelName, model, page, `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + route + "/page/{page_num}/id/{_id}")

	//console.log(2130, util.inspect(prevIds, false, null, true /* enable colors */))

	//console.log(2138, page);

	var currentPage = page;

	  var queryParams = req.originalUrl.lastIndexOf("?");
	  if (queryParams != -1) {
	    req.originalUrl = req.originalUrl.slice(0, queryParams);
	  }



	  


	var nextPageTemplateStr = `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + route + "/page/{page_num}/id/{_id}" 
	var prevPageTemplateStr = `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + route + "/page/{page_num}/id/{_id}"

	var nextPagesAr = generatePageArray(ids, nextPageTemplateStr, page);


	var startingPage = 1;
	if(page > 10){
		startingPage = page - 5;
	

	var spliceEnd = 6;//page - 5;
	//console.log(2166, startingPage, spliceEnd)

	//prevIds.reverse()
	//prevIds.splice(0, 6)

	}

	

	//var prevPagesAr = generatePrevPageArray(prevIds, prevPageTemplateStr, page);

	var allPages = [ ... prevPagesAr, ... nextPagesAr ]


	//console.log(2165, startingPage, prevPagesAr);
//console.log(2136, allPages);


	if((allPages.length > 10)&&(currentPage <= 5)){
		allPages.splice(10, allPages.length);
	}

	if((allPages.length > 10)&&(currentPage > 5)){

		console.log(2169, page);

		// Find the array index of the page
		var pageIndex = 0;
		for(var i = 0; i < allPages.length; i++){
			if(allPages[i]["page_number"] == page){
				pageIndex = i;
			}
		}

		console.log(2179, pageIndex, allPages[pageIndex])
		// Get rid of pageIndex - 5

		// This ensure we only have five pages after the current page
		if(pageIndex+5 > allPages.length)
			allPages.splice(pageIndex+5, allPages.length - 5);

		console.log(2209, allPages.length, pageIndex)

		// if(page > 10){
		
		// }

		if(allPages.length > 10){
			if(pageIndex+5 <= allPages.length){
				allPages.splice(pageIndex + 5, allPages.length)
				allPages.splice(0, pageIndex - 5)
			} else {
				//allPages.splice(pageIndex + 5, allPages.length)
				console.log(2221, allPages.length, pageIndex)
				allPages.splice(0, allPages.length - 10)
			}
		}

		console.log(2220, allPages.length, pageIndex)

	}


	return {
		"number_of_pages": pages,
        "current_page": page,
        "previous_page": 1,
        "next_page": currentPage + 1,
        "total_records": count,
        "next_page_endpoint": `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + route + "page/" + (currentPage + 1) + "/id/" + lastId,
        "prev_page_endpoint": `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + route + "page/" + (currentPage) + "/id/" + firstId,
        "post":req.body.aggregate,
 		"pages": allPages
	}
}

function generatePrevPageArray(idsAr, nextPageTemplateStr, startingPage){


	console.log(2228, idsAr, startingPage)

	var pageAr = [];

	for (var i = idsAr.length-1; i >= 0; i--){
		var page = {
			"_id" : idsAr[i]["_id"],
			"page_number":startingPage-i,
			"page_endpoint": voca.replace(voca.replace(nextPageTemplateStr, "{page_num}", String(startingPage-i)), "{_id}", idsAr[i]["_id"])
		}
		pageAr.push(page);
		console.log(2238, i, page)
	}

    
    for(var i = startingPage-1; i < idsAr.length; i++){
    	//console.log(2230, i, startingPage, startingPage+i);
    	var pageNum = startingPage+i;//startingPage + i;
    	// pageAr.push({
    	// 	"_id": idsAr[i]["_id"],
    	// 	"page_number":pageNum-1,
    	// 	"page_endpoint": voca.replace(voca.replace(nextPageTemplateStr, "{page_num}", String(pageNum-1)), "{_id}", idsAr[i]["_id"])
    	// })
    }

    //pageAr.splice(6, pageAr.length)

    return pageAr;
}

async function calculateInitialAggregationPages(aggregate, limit, modelName, model, req, res, firstId, lastId, page){

  	var origAggregate = aggregate;//JSON.parse(JSON.stringify(aggregate));
	
	const copied = [ ... aggregate ]

	var count = await getAggregateCount(copied, modelName, model);

	console.log(2423, count, limit);

	var pages = Math.ceil(count / limit)

	  	console.log(2257, util.inspect(aggregate, false, null, true /* enable colors */))


	var ids = await getAggregateIds(origAggregate, limit, pages, firstId, modelName, model)

	  var queryParams = req.originalUrl.lastIndexOf("?");
	  if (queryParams != -1) {
	    req.originalUrl = req.originalUrl.slice(0, queryParams);
	  }

	  var route = req.originalUrl;

	  var routeIdPos = voca.indexOf(route, "/id/")
	  var routePagePos = voca.indexOf(route, "/page/");
	  if(routeIdPos != -1)
	  	route = voca.substr(route, 0, routePagePos);

	var nextPageTemplateStr = `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + route + "/page/{page_num}/id/{_id}" 
	var prevPageTemplateStr = `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + route + "/page/{page_num}/id/{_id}"

	var pageAr = generatePageArray(ids, nextPageTemplateStr, page);


	// Calculate the number of pages
	
	// This will create a decmal value and round it UP to the nearest whole integer
	// So 35.1 pages becomes 36, 3.1 pages becomes 4, etc.

	  // Now, we need to get the _id's for the next n records

	  var prevPage = 1;
	  if(page > 2)
	  	prevPage = page-1;

	return {
		"number_of_pages": pages,
        "current_page": page,
        "previous_page": prevPage,
        "next_page": page + 1,
        "total_records": count,
        "next_page_endpoint": `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + route + "page/" + (page + 1) + "/id/" + lastId,
        "prev_page_endpoint": `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + route + "page/" + (page) + "/id/" + firstId,
        "post":req.body.aggregate,
 		"pages":pageAr
	}
}

async function getAggregateIds(agr, max_records, numPages, firstId, modelName, model){

	const aggregate = [ ... agr ]
	//console.log(2219, firstId)
	if(numPages > 10){
		numPages = 10;
	}
	// Add a match stage:
	console.log(2455, firstId);

	var filter = {
		"$match": { "_id": { "$gte": mongoose.Types.ObjectId(firstId) } },

		//"$limit": (max_records*numPages)
	}

	aggregate.unshift(filter);



	var newRoot = {
	    '$replaceRoot': {
	      'newRoot': {
	        '_id': '$_id'
	    }}
	  }

	aggregate.push(newRoot)
	aggregate.push({ "$limit": max_records*numPages } );
	
	console.log(2475, aggregate);
	var ids = await model.aggregate(aggregate);

	var pageIds = everyNthElement(ids, max_records);

	return pageIds;

	//console.log(2228, pageIds);

}

// here we want to take the firstId and get all of the ids less than it
async function getReverseAggregateIds(aggregate, max_records, numPages, firstId, modelName, model, pageNum, prevPageTemplateStr){

	const agr = Array.from(aggregate)

	//console.log(2269, util.inspect(aggregate, false, null, true /* enable colors */))

	//console.log(2219, firstId)
	if(numPages > 10){
		numPages = 10;
	}
	// Add a match stage:
	var filter = {
		"$match": { "_id": { "$lte": mongoose.Types.ObjectId(firstId) } },
		//"$limit": 10//(max_records*numPages)
	}

	agr.unshift({ "$sort" : { "_id": 1 } } )
	//agr.unshift(filter);

	var newRoot = {
	    '$replaceRoot': {
	      'newRoot': {
	        '_id': '$_id'
	    }}
	  }

	  var recordCount = max_records * pageNum - max_records;
	  if(recordCount <= max_records)
	  	recordCount = max_records

	agr.push(newRoot)

	agr.push({ "$limit": recordCount } );

	console.log(2521);
	var ids = await model.aggregate(agr);

	//console.log(2298, util.inspect(ids, false, null, true /* enable colors */))

	var pageIds = everyNthElement(ids, max_records);


	var pageAr = []
	for(var i = pageNum; i > 0; i--){
		var pageId = ids[i*max_records-max_records]
		if(typeof pageId != 'undefined'){
		pageAr.push({
    		"_id": pageId["_id"],
    		"page_number":i,
    		"page_endpoint": voca.replace(voca.replace(prevPageTemplateStr, "{page_num}", String(i)), "{_id}", pageId["_id"])
    	})

			//console.log(2401, "page_num", i, pageId);
		}
	}
	//console.log(2281, pageNum, ids.length);



	return pageAr.reverse();


}

function generatePageArray(idsAr, nextPageTemplateStr, startingPage){
	/*            {
                "_id": "61f309cb569a3b998fba8ba0",
                "page_number": 1,
                "page_endpoint": "http://localhost:3000/api/datasource/keywords/max_records/10/account/filter/eyAiYnJhbmRfaWQiOiAiNjE5MjdjYWQ1NjlhM2I5OThmZWI2Y2M5IiB9/page/1/id/61f309cb569a3b998fba8ba0"
            },
    */

    //console.log(2292, startingPage, typeof startingPage)

    var pageAr = [];
    for(var i = 0; i < idsAr.length; i++){
    	var pageNum = startingPage + i;
    	pageAr.push({
    		"_id": idsAr[i]["_id"],
    		"page_number":pageNum,
    		"page_endpoint": voca.replace(voca.replace(nextPageTemplateStr, "{page_num}", String(pageNum)), "{_id}", idsAr[i]["_id"])
    	})
    }

    if(pageAr.length > 10){
    	pageAr.splice(10, pageAr.length)
    }

    return pageAr;
}

// This function returns an array with every nth element
function everyNthElement(arr, n){
	if(arr.length == 0){
		return [];
	}

	var rval = [arr[0]];
	var counter = 0;
	for(var i = 0; i < arr.length; i++){
		if(counter >= n){
			rval.push(arr[i])
			counter = 0;
		}
		counter++;
	}
	return rval;
}

async function progress(req, res){

	console.log(1278)
	var xbody = req.headers["x-body"];
	var keys = req.body
	if(typeof xbody != 'undefined'){
		keys = xbody.split(",");
	}

	if(Array.isArray(keys) == false)
		keys = [];

	try {
		var aggregateStr = base64.decode(req.body.aggregate)
	} catch(err){
		console.log(1291, req.body.aggregate)
		aggregateStr = "";
		// I need to handle this error...
	}
	//console.log(800, aggregateStr);
	//console.log(801, res.locals.user.toObject().skill);
	var aggregate = eval(aggregateStr);//JSON.parse(aggregateStr);

	// Object needs to be a reference and not a copy, this not requiring a return value
	function replaceMatchInObject(obj, key, value, search){
		
		if(obj == search){
			console.log(1966, obj, search)
			obj = value;
			return value;
		}
		return false;
	}

	function iterateThroughObj(obj){
		var keys = Object.keys(obj)
		//console.log(1975, obj, typeof obj[]);
		for(var i = 0; i < keys.length; i++){
			if(typeof  obj[keys[i]] == 'object'){
				iterateThroughObj(obj[keys[i]])
			} else {
				//console.log(1982, obj[keys[i]])
				var replace = replaceMatchInObject(obj[keys[i]], "process.pipeline", mongoose.Types.ObjectId(res.locals.user._id), "$res.locals.user._id")
				if(replace != false){
					obj[keys[i]] = replace
					console.log(1985, obj[keys[i]])

				}
			}
		}
	}

	for(var i = 0; i < aggregate.length; i++)
		iterateThroughObj(aggregate[i])

    // while(true){
    //       top:
    //       for(var i = 0; i < aggregate.length; i++){
    //         var aggregateStage = aggregate[i];
    //         console.log(1968, aggregateStage);
    //         var keys = Object.keys(aggregateStage);
    //         for(var x = 0; x < keys.length; x++){
    //         	console.log(1971, keys[x])
    //         	if(keys[x] == '$project'){

    //         		var projectKeys = Object.values(aggregateStage[keys[x]])
    //         		console.log(1974, projectKeys)
    //         		for(var y = 0; y < projectKeys.length; y++){
    //         			var projectKey = projectKeys[y];
    //         			var projectValue = projectKey

    //         			if(projectValue == '$res.locals.user._id'){
    //         				console.log(1977, projectValue)

    //         			}
    //         		}
    //         	}
    //         }
    //       }
    //       break;
    //     }

	

	//aggregate[2]["$match"]["$and"][1]["process.pipeline"] = mongoose.Types.ObjectId(res.locals.user._id);
	
	//console.log(866, aggregate[2]["$match"]["$and"][1]["process.pipeline"]);
	//console.log(803, util.inspect(aggregate, false, null, true /* enable colors */))

	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)
	var model = mongoose.model(modelName);


	console.log(2690);
	//console.log(865, util.inspect(aggregate, false, null, true /* enable colors */))
	res.locals.response = await model.aggregate(aggregate);
	if(res.locals.response.length > 0){
		var definitions = await Paginationv2.getDisplayHeaders(keys,res.locals.response);
	} else {
		definitions = {
			"addDataForm":[],
			"displayHeaders":[]
		}
	}
	for(object in res.locals.response){
		var data = res.locals.response[object]
		//console.log(1319, data);
		for(key in data){
			//console.log(1322, key, data[key])
			if(data[key] == null)
				data[key] = "";
		}
	}


	var defaultResponseObject = helpers.defaultResponseObject(res.locals.datasource)
	defaultResponseObject[res.locals.datasource] = res.locals.response;
	defaultResponseObject["datasource"] = res.locals.datasource
	defaultResponseObject["headers"] = keys;
	defaultResponseObject["addDataForm"] = definitions["addDataForm"]
	defaultResponseObject["displayHeaders"] = definitions["displayHeaders"];
	defaultResponseObject["pagination"] = {
		"number_of_pages": 1,
        "current_page": 1,
        "previous_page": 1,
        "next_page": "",
        "total_records": 10,
 		"pages":[]
	}
	res.status(200);
	res.json(defaultResponseObject);

	//console.log(827, defaultResponseObject)
	//Paginationv2.listByPage(req, res, model, max_records, filter, keys, account, sort, key);

	//return next(req, res);
}

async function completed(req, res){

	var xbody = req.headers["x-body"];
	var keys = req.body
	if(typeof xbody != 'undefined'){
		keys = xbody.split(",");
	}

	if(Array.isArray(keys) == false)
		keys = [];

	var aggregateStr = base64.decode(req.body.aggregate)
	//console.log(800, aggregateStr);
	//console.log(801, res.locals.user.toObject().skill);
	var aggregate = eval(aggregateStr);//JSON.parse(aggregateStr);
	aggregate[2]["$match"]["$and"][1]["process.pipeline"] = mongoose.Types.ObjectId(res.locals.user._id);
	
	// console.log(866, aggregate[2]["$match"]["$and"][1]["process.pipeline"]);
	// console.log(803, util.inspect(aggregate, false, null, true /* enable colors */))

	var datasource = getDataSource(req);
	var modelName = checkDatasource(datasource)
	var model = mongoose.model(modelName);

	console.log(2759);
	res.locals.response = await model.aggregate(aggregate);

	var definitions = null;

	if(res.locals.response.length > 0)
		var definitions = await Paginationv2.getDisplayHeaders(keys,res.locals.response);
	

	var defaultResponseObject = helpers.defaultResponseObject(res.locals.datasource)
	defaultResponseObject[res.locals.datasource] = res.locals.response;
	defaultResponseObject["datasource"] = res.locals.datasource
	defaultResponseObject["headers"] = keys;
	if(definitions != null){
		defaultResponseObject["addDataForm"] = definitions["addDataForm"]
		defaultResponseObject["displayHeaders"] = definitions["displayHeaders"];
	} else {
		defaultResponseObject["displayHeaders"] = []
		defaultResponseObject["addDataForm"] = []
	}
	defaultResponseObject["pagination"] = {
		"number_of_pages": 1,
        "current_page": 1,
        "previous_page": 1,
        "next_page": "",
        "total_records": 10,
 		"pages":[]
	}
	res.status(200);
	res.json(defaultResponseObject);

	//console.log(827, defaultResponseObject)
	//Paginationv2.listByPage(req, res, model, max_records, filter, keys, account, sort, key);

	//return next(req, res);
}

function next(req, res){
	var defaultResponseObject = helpers.defaultResponseObject(res.locals.datasource)
	defaultResponseObject[res.locals.datasource] = res.locals.response;
	defaultResponseObject["datasource"] = res.locals.datasource
	res.status(200);
	res.json(defaultResponseObject);
}

function pushValueIntoArray(req, res, next, model){

}

function getFilter(req){
	var filter = { };
	var id = helpers.getParameter(req.params[0], "id");
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var filterIndex = voca.search(fullUrl, "filter");
	if(filterIndex != -1){
		var filter = helpers.getParameter(fullUrl, "filter");
		//console.log(246, filter);
		var filterStr = base64.decode(filter);
		//console.log(248, filterStr);
		filterStr = voca.replaceAll(filterStr, "'", "\"");
		
		filter = JSON.parse(filterStr);
	}
	return filter;
}

function getSort(req){
	var sort = { _id: 1 };
	var id = helpers.getParameter(req.params[0], "id");
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var filterIndex = voca.search(fullUrl, "sort");
	if(filterIndex != -1){
		var sortStr = helpers.getParameter(fullUrl, "sort");
		//console.log(246, sortStr);
		var filterStr = base64.decode(sortStr);
		//console.log(248, filterStr);
		filterStr = voca.replaceAll(filterStr, "'", "\"");
		
		sort = JSON.parse(filterStr);
	}
	return sort;	
}

function getKey(req){
	var id = helpers.getParameter(req.params[0], "id");
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var filterIndex = voca.search(fullUrl, "key");
	if(filterIndex != -1){
		var sort = helpers.getParameter(fullUrl, "key");
		return base64.decode(sort);
	}
	return 0;	
}

function getId(req){
	var id = helpers.getParameter(req.originalUrl, "id");
	return id;
	// var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	// var filterIndex = voca.search(fullUrl, "key");
	// if(filterIndex != -1){
	// 	var sort = helpers.getParameter(fullUrl, "key");
	// 	return base64.decode(sort);
	// }
	// return 0;	
}

function getWithSort(req, res, next, model)
{
	console.log(2913, "getWithSort");
	var xbody = req.headers["x-body"];
	var keys = req.body
	if(typeof xbody != 'undefined'){
		keys = xbody.split(",");
	}


	if(Array.isArray(keys) == false)
		keys = [];

	var max_records = helpers.getParameter(req.params[0], "max_records");
	var sort = helpers.getParameter(req.params[0], "sort");
	var account = helpers.getPathTrue(req.params[0], "account")
	if(account)
		account = "account";
	var all = helpers.getPathTrue(req.params[0], "all")
	if(all)
		account = "all"

	if(typeof max_records == 'undefined')
		max_records = 10;
	else
		max_records = parseInt(max_records);

	var filter = getFilter(req)

	var sort = getSort(req);

	var key = getId(req);//getKey(req);

	try {
		Paginationv2.listByPage(req, res, model, max_records, filter, keys, account, sort, key);
	} catch (err) { }	
}

// 	mongooseModel.count({"Date" : { "$lte" : endDate.format(), "$gte" : startDate.format() }}, function(err, count){
//     	var queryObject = mongooseModel.find(

//     		{ "Date" : { "$lte" : endDate.format(), "$gte" : startDate.format() } }

//     		)
//     									//.select('name')
//     								   .sort({ _id : 1})
//     								   .where({ customer_id : customer_id})
// 		callback(queryObject, count);
// 	}).where( { "customer_id" : customer_id } );;

async function datesbetween(req, res, next, model){
	/* We are expecting this in the json body:
	{

		startDate: ISODate(),
		endDate: ISODate(),
		_dateKey: String,
		scope: user, account, all
	}
	*/

	console.log(2806, "Dates Between Start")
	var startDate = req.body.startDate;
	var endDate = req.body.endDate;
	var _dateKey = req.body._dateKey;
	var scope = req.body.scope;

	if(typeof scope == 'undefined'){
		scope = "user";
	}

	if(res.locals.user.account_type == "admin")
		scope = "all"
	
	var scopeSearchObj = { }
	if(scope == "user"){
		scopeSearchObj["created_by"] = res.locals.user._id;
	} else if (scope == "account") {
		scopeSearchObj["owner"] = res.locals.user.accountId
	} else if (scope == "all"){
		scopeSearchObj = { }
	}

	var searchQuery = { }
	searchQuery[_dateKey] = {
		"$lte" : endDate, "$gte" : startDate 
	}

	var filter = { }
	if(req.body.filter != null){
		filter = req.body.filter
	}

	searchQuery = {
		... searchQuery,
		... scopeSearchObj,
		... filter
	}

	searchKeys = {}
	//searchKeys[_dateKey] = 1

	console.log(2806, "Performing Find", searchQuery)
	res.locals.response = await model.find(searchQuery, searchKeys);

	console.log(2806, "Dates Between End")
	return next(req, res);
}

async function updateCalendarItem(req, res, next, model){

	var keys = {}
	keys[req.body._dateKey] = 1;

	var doc = await model.findById(req.body._id, keys);

	var _newDateValue = moment(req.body._dateValue)
	var _existingDateValue = moment(doc[req.body._dateKey])

	_existingDateValue.date(_newDateValue.date());
	_existingDateValue.month(_newDateValue.month());
	_existingDateValue.year(_newDateValue.year());

	var updateObj = { }
	updateObj[req.body._dateKey] = _existingDateValue.toISOString()
	await mongoose.connection.db.collection(model.collection.collectionName).updateOne(
  		{_id: mongoose.Types.ObjectId(req.body._id)},
  		{ $set: updateObj });

	res.locals.response = 	{ 	
								"new_date" :_newDateValue.toISOString()
							}
	return next(req, res);
}

/*
 	This retrieves a single record, based on a search query provided in the request body.  This function uses
	the 'findOne' mongoose function, and as such results will return only the first matching query in the database
*/
async function getOneByKeyValuePair(req, res, next, model){
	var scope = req.body
	if(typeof scope == 'undefined'){
		// Should return an error here...
		scope = { }
	}
	var scopeSearchObj = { }
	//scopeSearchObj["created_by"] = mongoose.Types.ObjectId(res.locals.user._id);
	searchQuery = {
		created_by:mongoose.Types.ObjectId(res.locals.user._id),
		... scope
	}
	res.locals.response =  await model.findOne(searchQuery)
	return next(req, res);
}

/*
	In some instances it's useful to know the keys that are available for a given mongodb search query
	This performs a search and returns an array of the available root keys for a single document
*/
async function getKeysForSearchQuery(req, res, next, model){

	var scope = req.body
	if(typeof scope == 'undefined'){
		// Should return an error here...
		scope = { }
	}

	var jsonBody = req.body;

	if(jsonBody != null){
	for (const [key, value] of Object.entries(jsonBody)) {
	  if(voca.includes(key, "_id")){
	  	jsonBody[key] = mongoose.Types.ObjectId(value)
	  }
	}
		scope = jsonBody;
	}

	var scopeSearchObj = { }
	//scopeSearchObj["created_by"] = mongoose.Types.ObjectId(res.locals.user._id);
	searchQuery = {
		created_by:mongoose.Types.ObjectId(res.locals.user._id),
		... scope
	}

	var searchResult =  await model.findOne(searchQuery, {_id:0,created_by:0,modified_by:0,owner:0,__v:0}).lean()

	if(searchResult == null){
		res.locals.response = { }
	} else {
		res.locals.response = Object.keys(searchResult)
	}
	

	return next(req, res);	

}


async function getselecteddocuments(req, res, next, model){

	var datasource = getDataSource(req);

	var query = {
//		"created_by":res.locals.user,
		"selected":true
	}

	// The more I use mongoose the more I dislike it.  This is an example as to why
	var results = await model.find(query, {_id:1})
	var selectedIds = []
	for(var i = 0; i < results.length; i++){
		selectedIds.push(results[i]["_id"]);
	}

	res.locals.datasource = datasource;
	res.locals.response = selectedIds;
	return next(req, res);
}

async function getNextSelectedItem(req, res, next, model){
	var current_id = helpers.getParameter(req.params[0], "id");
	var filter = { "selected":true }
	if(typeof(current_id) != "undefined"){
		filter["_id"] = { $gt: current_id }
	}
	var searchResult =  await model.findOne( filter ).lean()
	res.locals.response = searchResult;
	return next(req, res);

}

async function getPrevSelectedItem(req, res, next, model){
	var current_id = helpers.getParameter(req.params[0], "id");
	var filter = { "selected":true }
	if(typeof(current_id) != "undefined"){
		filter["_id"] = { $lt: current_id }
	}
	var searchResult =  await model.findOne( filter ).sort({"_id":-1}).lean()
	res.locals.response = searchResult;
	return next(req, res);

}

async function getSelectedMergeFields(req, res, next, model){

	// The purpose here is to get a list of valid merge fields...
	var filter = { "selected":true }

	var searchResult =  await model.findOne( filter, {_id:0, created_by:0,modified_by:0,owner:0,selected:0}).lean()
	var mergeFields = [];
	var keys = Object.keys(searchResult);
	for(var i = 0; i < keys.length; i++){
		var filterIndex = voca.search(keys[i], "_id");
		if(filterIndex == -1){
			mergeFields.push(keys[i])
		}

	}

	res.locals.response = mergeFields;
	return next(req, res);	

}

// async function put(req, res, next, model){
// 	var id = helpers.getParameter(req.params[0], "id");
// 	var jsonBody = req.body;

// 	for (const [key, value] of Object.entries(jsonBody)) {
// 	  //console.log(`${key}: ${value}`);
// 	  if(voca.includes(key, "_id")){
// 	  	jsonBody[key] = mongoose.Types.ObjectId(value)
// 	  }
// 	}

// 	console.log(443, jsonBody)

// 	var doc = await mongoose.connection.db.collection(model.collection.collectionName).updateOne(
//   		{_id: mongoose.Types.ObjectId(id)},
//   		{ $set: jsonBody });

// 	// var doc = await model.findById(id);
// 	// 	doc.set(key, value);
// 	// 	doc.markModified(key);
// 	// await doc.save();

// 	res.locals.response = doc
// 	next(req, res);
// }

async function bulkInsert(req, res, next, model){

	console.log(2428, req.body);

	if(!Array.isArray(req.body)){
		// This needs to be an array
		return defaultError(req, res, {"err_no":10521,"error_desc":"Bulk Updates Must Be An Array in the request body"})
	}

	var jsonBody = req.body;

	for(var i = 0; i < jsonBody.length; i++){
		for (const [key, value] of Object.entries(jsonBody[i])) {
		  //console.log(`${key}: ${value}`);
		  if(voca.includes(key, "_id")){
		  	if(value.length == 0){
		  		continue;
		  	}
		  	jsonBody[i][key] = mongoose.Types.ObjectId(value)
		  }
		}
	}	

	var db = new mongo(model, res.locals.user, res);
	res.locals.response = await db.mongoCreateMany(jsonBody)
	next(req, res);

}

async function bulkUpdate(req, res, next, model){

	if(!Array.isArray(req.body)){
		// This needs to be an array
		return defaultError(req, res, {"err_no":10521,"error_desc":"Bulk Updates Must Be An Array in the request body"})
	}

	var id = helpers.getParameter(req.params[0], "id");
	var jsonBody = req.body;

	for(var i = 0; i < jsonBody.length; i++){
		for (const [key, value] of Object.entries(jsonBody[i])) {
		  //console.log(`${key}: ${value}`);
		  if(voca.includes(key, "_id")){
		  	jsonBody[i][key] = mongoose.Types.ObjectId(value)
		  } else {
		  	return defaultError(req, res, {"err_no":1052,"error_desc":"All array objects must have a _id key.  At least one array entry was found where the _id key was missing."})
		  }
		}
	}

	//model.collection.collectionName

    const bulkData = jsobBody.map(item => (
        {
            updateOne: {
                filter: {
                    "_id" : items["_id"],
                },
                update: item
            }
        }
    ));

    var res = await model.bulkWrite(bulkData);
    console.log(2439, res);

	console.log(1691, util.inspect(bulkData, false, null, true));

 	res.locals.response = { "bulk_write":"worked" }
 	next(req, res);

}

async function getDocumentById(req, res, next, model){
	var id = helpers.getParameter(req.params[0], "id");
		var filter = { _id: mongoose.Types.ObjectId(id) }

	var searchResult =  await model.findOne( filter ).lean()

 	res.locals.response[res.locals.datasource] = searchResult;
 	
 	next(req, res);	
}

function defaultError(req, res, error){

	console.log(1521, error);

   var defaultErrorResponse = helpers.defaultErrorResponseObject();
  defaultErrorResponse.error = error.err_no;
  defaultErrorResponse.ErrorDetails.Error = error.err_no;
  defaultErrorResponse.ErrorDetails.Description = error.error_desc;
  res.json(defaultErrorResponse);

	return false;
}

/* Version 2 only */
async function selectall(req, res, model){

	scope = { created_by: res.locals.user._id }
	console.log(3300, scope);

	// Determine our scope
	if(req.body.scope == "all"){
		res.locals.response = { "selectall":"selectall is now allowed for this scope" }
		next(req, res);
		return;
	}

	if(req.body.scope == "account"){

	}

	if(req.body.scope == "user"){

	}
	// First, determine if we have a find of an aggregate...

	var bIsAggregate = false;
	var bLookupDiscovered = false;
	var lookup = {}
	if(typeof req.body.aggregate !== 'undefined'){
		bIsAggregate = true;
		for(let stage of req.body.aggregate){
			for(let key of Object.keys(stage)){
				if(key == '$lookup'){
					bLookupDiscovered = true;
					lookup = stage[key];
				}
			}
		}
	}

	
	if(typeof req.body.filter === 'undefined'){
		res.locals.response = { "selectall":"unable to find appropriate filter" }
		next(req, res);
		return;
	}

	let filter = req.body.filter;
	console.log(3305, filter);
	filter = { ... scope }
	
	try {
		var result = await model.updateMany(filter, { selected: true });
	} catch(err){
		console.log(3331, err);
	}
	console.log(result);
	res.locals.response = { "selectall":"true" }
	next(req, res);
}

// async function getEmailFields(req, res, next, model){

// 	// The purpose here is to get a list of valid merge fields...
// 	var filter = { "selected":true }

// 	var searchResult =  await model.findOne( filter, {_id:0, created_by:0,modified_by:0,owner:0,selected:0}).lean()
// 	var mergeFields = [];
// 	var keys = Object.keys(searchResult);
// 	for(var i = 0; i < keys.length; i++){
// 		var filterIndex = voca.search(keys[i], "_id");
// 		if(filterIndex == -1){
// 			mergeFields.push(keys[i])
// 		}

// 	}

// 	res.locals.response = mergeFields;
// 	return next(req, res);	

// }














module.exports = router