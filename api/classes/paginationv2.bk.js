var helpers = require("@classes/helpers.js");
var mongoose = require("mongoose");
var apiVersion = "";
var voca = require("voca");
const util = require('util');
var base64 = require('base-64');

exports.listByPage = async function(
  req,
  res,
  model,
  defaultLimit =10,
  searchModifier ={},
  requestedKeys =[],
  searchall =false,
  sort ={ _id: 1 },
  key =0
)
{
	var user = res.locals.user;
	var createdBy = res.locals.user._id;

	var maxrecords = defaultLimit*defaultLimit;

	var sortRev = {}

	var sortOrder = "$gte";
	var sortOrderRev = "$lte";
	var sortKeys = Object.keys(sort);
	var idSort = 1;
	var idSortRev = -1;
	if(sort[sortKeys[0]] == "asc")
	{
		sortRev[sortKeys[0]] = "desc"
		idSort = -1;
		idSortRev = 1;
	} else if (sort[sortKeys[0]] == "desc"){
		sortRev[sortKeys[0]] = "asc"
		sortOrder = "$lte";
		sortOrderRev = "$gte"
	}

	/* Create our search object */

	/* This is our default option.  It causes the .find() operation to 
		only return results that were created by the authenticated user
		making this request.
	*/
	var searchObj = {
		created_by: createdBy
	}

	/* This allows us to expand our result set to either all records owned 
		by the account of the authenticated user, or even site-wide, depending
		on the use case
	*/
	if(searchall != false){
		// Cause the .find() operation to return all records
		if(searchall == "all"){
			searchObj = {}
		}

		// Cause the .find() operation to return all records belonging to the authenticated users
		// account.  This will include all records created by users who are under the same account
		if(searchall == "account"){
			searchObj = {
				owner: user.accountId
			}
		}
	}

	/*	The search modifier allows the frontend to send application specific filtering as
		applies against the result set.
	*/
	if(Object.keys(searchModifier).length != 0){
		searchObj = {
			... searchModifier,
			... searchObj
		}
	}

	var sortKey = sortKeys[0];

	if(key != 0){
		// A positioning key was passed, we need to base our search with that as our zero index
		var sortObj = {}
		sortObj[sortOrder] = key
		searchObj[sortKey] = sortObj
	} 
	//else {
	// 	// We did not get a positioning key.  This means this is a first-page request
	// 	key = sortKey
	// }



	var requestedRecords = {
		_id: 1
	}
	// This causes records to be returned with the sort key included in the result set
	requestedRecords[sortKey] = 1;

	// This ensures that we return all requested record fields
	var bDeleteKeyFromReturnedResults = true;
	for(var i = 0; i < requestedKeys.length; i++){
		if(requestedKeys[i] != sortKey){
			requestedRecords[requestedKeys[i]] = 1;
		} else {
			bDeleteKeyFromReturnedResults = false;
		}
	}
	if(requestedKeys.length == 0){
		bDeleteKeyFromReturnedResults = false;
	}

	var countTotalForward = await model.countDocuments(searchObj);
	// This gives us all records in front of the key, if present

	//var idSearch = {}
	//idSearch[sortOrder] = helpers.getParameter(req.originalUrl, "id");
	//searchObj["_id"] = idSearch

	// sort = {
	// 	...sort,
	// 	"_id":idSort
	// }

	var idsForward = await model.find(searchObj, requestedRecords)
		.sort(sort)
		.limit(defaultLimit+1)
		.lean()

		console.log(135, searchObj);

	var searchObjRev = { 
		... searchObj
	}
	if(key != 0){
		var sortObj = {}
		sortObj[sortOrderRev] = key;
		searchObjRev[sortKey] = sortObj;

	} 

	var countTotalReverse = await model.countDocuments(searchObjRev);
	var countTotal = countTotalForward + countTotalReverse;
	var totalPages = Math.ceil(countTotal / defaultLimit)
	// This gives us all records behind the key, if present

	var idsReverse = await model.find(searchObjRev, requestedRecords)
		.sort(sortRev)
		.limit(defaultLimit+1)
		.lean()

	var first = idsReverse[0];

	if(idsReverse.length > 0){
		var firstItemKey = idsReverse[0][sortKey];
		var firstItemId = idsReverse[0]["_id"];
	}
	else 
		firstItemKey = "";

	if(idsForward.length > 0){
		//console.log(165, idsForward.length);
		var lastItemKey = idsForward[idsForward.length-1][sortKey]
		var lastItemId = idsForward[idsForward.length-1]["_id"]
		//console.log(168, lastItemKey);
	}
	else{
		lastItemId = "";
		lastItemKey = "";
	}
	
	 var pagination = getPages(
	 	req, 
	 	"datasource", 
	 	1, 
	 	1, 
	 	totalPages, 
	 	countTotal,
	 	firstItemKey,
	 	lastItemKey,
	 	key,
	 	firstItemId,
	 	lastItemId,
	 	sortKey,
	 	idsForward[0][sortKey],
	 	idsForward[0]["_id"],
	 	idsForward)
	
	var dates = []
	for(var i = 0; i < idsForward.length; i++){
		var mesh = voca.substr(idsForward[i]["_id"], 20) + "--" + idsForward[i]['release_for_bounty']
		dates.push(mesh)
	}

	res.status(200);
	res.json({
		pagination,
		countForward: dates
	});
}

function replaceKeyInQueryString(originalUrl, originalKey, newKey ="", id, sortKey, firstKey){
	//console.log(210, "originalUrl:", originalUrl, "originalKey:", originalKey, "newKey:", newKey, 
	//	"id:", id, "sortKey:", sortKey, "firstKey:", firstKey);
	var newUrl = originalKey;

	if(originalKey == 0){

		var keyUrlPattern = "/key/" + base64.encode(newKey) + "/id/" + id
		var newUrl =  originalUrl + keyUrlPattern;// + "/originalKey/" + originalKey + "/" + "newKey" + "/" + newKey 
		newUrl = newUrl + "/prev/" + base64.encode(firstKey);
		return newUrl
	} else {
	//console.log(210, "originalUrl:", originalUrl, "originalKey:", originalKey, "newKey:", newKey, 
	//	"id:", id, "sortKey:", sortKey, "firstKey:", firstKey);		
	console.log();
		// Replace the /prev with firstKey
		var oldPrev = helpers.getParameter(originalUrl, "prev");
		//console.log(223, "oldPrev", base64.decode(oldPrev));
		var newPrev = base64.encode(firstKey);
		//console.log(225, "newPrev", base64.decode(newPrev));
		newUrl = voca.replace(newUrl, oldPrev, newPrev)
	}

	var oldId = helpers.getParameter(originalUrl, "id");
	
	var oldKeyEnc = base64.encode(originalKey)
	var newKeyEnc = base64.encode(newKey)
	newUrl = voca.replace(originalUrl, oldKeyEnc, newKeyEnc)
	newUrl = voca.replace(newUrl, oldId, id)
	newUrl = voca.replace(newUrl, oldPrev, base64.encode(originalKey))
	//newUrl = newUrl + "/originalKey/" + originalKey + "/" + "newKey" + "/" + newKey 
	return newUrl;
}

function clearParameters(src, parameter, value){
	var tmpa = "/" + parameter + "/" + value;
	var tmp =  voca.replace(src, tmpa, "");
	return tmp;	
}

function addParameter(src, parameter, value){
	var tmp = src + "/" + parameter + "/" + value;
	return tmp;	
}



function getPages(req, route, currentPage, 
	previousPage, totalPages, 
	countTotal,
	firstItemKey,
	lastItemKey,
	origKey,
	firstItemId,
	lastItemId,
	sortKey,
	firstKey,
	firstId,
	idsForward
	){
	console.log(236,
		"totalPages:",totalPages,
	 	"countTotal:",countTotal,
	 	"firstItemKey:",firstItemKey,
	 	"lastItemKey:",lastItemKey,
	 	"origKey:",origKey,
	 	"firstItemId:",firstItemId,
	 	"lastItemId:",lastItemId,
	 	"sortKey:",sortKey,
	 	"firstKey", firstKey,
	 	"firstId", firstId);
	var nextPageUrl = "";
	console.log();
	if(origKey == 0){
		lastPageUrl = req.originalUrl;
		
	}
	else {
		//lastPageUrl = replaceKeyInQueryString(req.originalUrl, origKey, firstItemKey, firstItemId,sortKey,firstKey);
		var prevPageKey = helpers.getParameter(req.originalUrl, "prev");
		var currentKey = helpers.getParameter(req.originalUrl, "key");
		var lastPageUrl = clearParameters(req.originalUrl, "prev", prevPageKey)
		var prevKey = helpers.getParameter(req.originalUrl, "prev")
		var prevId = helpers.getParameter(req.originalUrl, "id")
		//var prevPrev = 
		lastPageUrl = clearParameters(req.originalUrl, "key", helpers.getParameter(req.originalUrl, "key"))
		lastPageUrl = clearParameters(lastPageUrl, "id", helpers.getParameter(lastPageUrl, "id"))
		lastPageUrl = clearParameters(lastPageUrl, "prev", helpers.getParameter(lastPageUrl, "prev"))
		lastPageUrl = lastPageUrl + "/key/" + base64.encode(helpers.getParameter(req.originalUrl, "firstId"));
		//lastPageUrl = lastPageUrl + "/id/" + base64.decode(prevId);
		//lastPageUrl = lastPageUrl + "/prev/" + prevPrev
		//lastPageUrl = clearParameters(lastPageUrl, "prev", helpers.getParameter(lastPageUrl, ""))
		//console.log(280);
		//lastPageUrl = clearParameters(lastPageUrl, "id", helpers.getParameter(lastPageUrl, "id"))
		//console.log(282);
		//lastPageUrl = clearParameters(lastPageUrl, "key", helpers.getParameter(lastPageUrl, "key"))
		//lastPageUrl = lastPageUrl + "/key/" + prevPageKey + "/prev/" + base64.encode("none") 
		//voca.replace(req.originalUrl, prevPageKey, "none")
		//lastPageUrl = voca.replace(lastPageUrl, "/prev/none", "")
		//lastPageUrl = voca.replace(req.originalUrl, currentKey, prevPageKey);
		//lastPageUrl = voca.replace(lastPageUrl, "prevPageKey", "none")

		// change the lastPageUrl "key" to prevPageKey
		//console.log(266, base64.decode(prevPageKey));
	}
	
	if(origKey == 0){
		console.log(294);
		nextPageUrl = req.originalUrl
		nextPageUrl = clearParameters(nextPageUrl,	 "prev", helpers.getParameter(nextPageUrl, "prev"))
		nextPageUrl = addParameter(nextPageUrl, "key", base64.encode(lastItemKey))
		nextPageUrl = addParameter(nextPageUrl, "id", base64.encode(lastItemId));
		nextPageUrl = nextPageUrl + "/prev/" + base64.encode("0");
		nextPageUrl = nextPageUrl + "/prev_id/" + base64.encode("0");
		//console.log(326, idsForward);
		nextPageUrl = addParameter(nextPageUrl, "firstId", idsForward[0][sortKey])

		nextPageUrl = addParameter(nextPageUrl, "lastId", idsForward[idsForward.length-1][sortKey])
		//	console.log(296, nextPageUrl);
	} else {
		nextPageUrl = req.originalUrl
		console.log(298, helpers.getParameter(nextPageUrl, "prev"));
		
		nextPageUrl = clearParameters(nextPageUrl, "key", helpers.getParameter(nextPageUrl, "key"))
		nextPageUrl = clearParameters(nextPageUrl, "id", helpers.getParameter(nextPageUrl, "id"))
		nextPageUrl = clearParameters(nextPageUrl, "prev", helpers.getParameter(nextPageUrl, "prev"))
		nextPageUrl = clearParameters(nextPageUrl, "prev_id", helpers.getParameter(nextPageUrl, "prev_id"))
		nextPageUrl = clearParameters(nextPageUrl, "firstId", helpers.getParameter(nextPageUrl, "firstId"))
		nextPageUrl = clearParameters(nextPageUrl, "lastId", helpers.getParameter(nextPageUrl, "lastId"))
		nextPageUrl = addParameter(nextPageUrl, "prev_id", base64.encode(firstId));	
		nextPageUrl = addParameter(nextPageUrl, "prev", base64.encode(firstItemKey))
		nextPageUrl = addParameter(nextPageUrl, "key", base64.encode(lastItemKey))
		nextPageUrl = addParameter(nextPageUrl, "id", base64.encode(lastItemId));
		nextPageUrl = addParameter(nextPageUrl, "firstId", idsForward[0][sortKey])
		nextPageUrl = addParameter(nextPageUrl, "lastId", idsForward[idsForward.length-1][sortKey])
		// nextPageUrl = addParameter(nextPageUrl, "oprev_id", firstId);	
		// nextPageUrl = addParameter(nextPageUrl, "oprev", firstKey)
		// nextPageUrl = addParameter(nextPageUrl, "okey", lastItemKey)
		// nextPageUrl = addParameter(nextPageUrl, "oid", lastItemId);
		

		//, 
		//	origKey, lastItemKey, lastItemId,sortKey, firstKey);

		//nextPageUrl = clearParameters(nextPageUrl, "prev", helpers.getParameter(nextPageUrl, "prev"))
		//console.log(298, nextPageUrl);
		//nextPageUrl = nextPageUrl + "/prev/" + base64.encode(firstItemKey)
	}
	return {
    number_of_pages: totalPages,
    current_page: currentPage,
    previous_page: previousPage,
    next_page: currentPage + 1,
    total_records: countTotal,
    prev_page_endpoint:
      `${req.protocol}://${req.get("host")}` +
      process.env.API_VERSION +
      lastPageUrl,
    next_page_endpoint:
      `${req.protocol}://${req.get("host")}` +
      process.env.API_VERSION +
      nextPageUrl
  }
}