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
	var originalUrl = getProtocolWithHost(req) + req.originalUrl

	var maxrecords = defaultLimit*defaultLimit;
	var maxByHalf = Math.ceil(maxrecords / 2)
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

	if(key != 0){
		var sortObj = {}
		sortObj[sortOrderRev] = key;
	} 

	var countTotalReverse = await model.countDocuments(searchObjRev);
	var countTotal = countTotalReverse;
	var totalPages = Math.ceil(countTotal / defaultLimit)
	if(totalPages > 10)
		totalPages = 10;

	var maxLimit = totalPages * defaultLimit;

	var idsForward = await model.find(searchObj, requestedRecords)
		.sort(sort)
		.limit(maxLimit)
		.lean()


	resultsForward = await model.find(searchObj, requestedRecords)
		.sort(sort)
		.limit(defaultLimit)
		.lean()

	console.log(139, searchObj);
	
	var searchObjRev = { 
		... searchObj
	}

	if(key != 0){
		var sortObj = {}
		sortObj[sortOrderRev] = key;
		searchObjRev[sortKey] = sortObj;

	} 
	// This gives us all records behind the key, if present

	var idsReverse = await model.find(searchObjRev, requestedRecords)
		.sort(sortRev)
		.limit(maxLimit)
		.lean()

	var dates = []

	for(var i = 0; i < idsReverse.length; i++){
		var mesh = voca.substr(idsReverse[i]["_id"], 20) + "--" + idsReverse[i]['release_for_bounty']
		//dates.push(mesh)
	}

	//dates.push("PAGE 1")
	//dates.push(createPageObj(idsForward[0][sortKey], 1))
	// Page Break == defaultLimit
/*
        "pages": [
            {
                "_id": "5e6517af6d8171505762c146",
                "page_number": 1,
                "page_endpoint": "http://localhost:3000/api/datasource/brand/all/page/1/id/5e6517af6d8171505762c146"
            },
*/
	function createPageObj(id, page_number){
		var origUrl = req.originalUrl;

		origUrl = clearParameters(origUrl, "page", getParameter(origUrl, "page"))
		origUrl = clearParameters(origUrl, "id", getParameter(origUrl, "id"));
		var baseUrl = `${req.protocol}://${req.get("host")}` + process.env.API_VERSION
		return {
                "_id": id,
                "page_number": page_number,
                "page_endpoint": `${baseUrl}${origUrl}/page/${page_number}/id/${id}`
            }
	}

	var counter = 0;
	pageCounter = 0;

	if(typeof getParameter(req.originalUrl, "page") != 'undefined'){
		pageCounter = parseInt(getParameter(req.originalUrl, "page"))
	} else {
		pageCounter = 1;
	}

	for(var i = 0; i < idsForward.length; i++){
		if((counter == defaultLimit)||(counter == 0)){
			if(counter != 0)
				dates.push(createPageObj(idsForward[i][sortKey], pageCounter))
			counter = 0;
			pageCounter++;
		}
		counter++;
		var mesh = voca.substr(idsForward[i]["_id"], 20) + "--" + idsForward[i]['release_for_bounty']
	}

	idsReverse = idsReverse.reverse();

	var revMesh = [];
	counter = 0;
	pageCounter = 1;
	var revPages = [];
	for(var i = 0; i < idsReverse.length; i++){
		if((counter == defaultLimit)||(counter == 0)){
			revMesh.push("PAGE BREAK", pageCounter);
			revPages.push(createPageObj(idsReverse[i][sortKey], pageCounter))
			pageCounter++;
			counter = 0;
		}
		var mesh = voca.substr(idsReverse[i]["_id"], 20) + "--" + idsReverse[i]['release_for_bounty']
		revMesh.push(mesh);
		counter++;
	}

	if(typeof getParameter(req.originalUrl, "page") == 'undefined'){
		dates = revPages
	} else if (getParameter(req.originalUrl, "page") == '1'){
		for(var y = 0; y < revPages.length; y++){
			dates.unshift(revPages[y])
		}
		//dates.unshift(revPages)
	} else {
		revPages = revPages.reverse();
		for(var y = 0; y < revPages.length; y++){
			dates.unshift(revPages[y])
		}		
	}

	var respObj = {
		"Result": "Success",
	    "Error": 0,
	    "ErrorDetails": {
	        "Error": 0,
	        "Description": "The operation was successful"
	    },
	    "SearchObj":searchObj	
	}

	var curPage = getParameter(req.originalUrl, "page");
	var prePage = parseInt(curPage) - 1;
	var nxtPage = parseInt(curPage) + 1;
	var ttlPage = Math.ceil(countTotalForward / defaultLimit)
	console.log(258, curPage);
	if(typeof curPage == 'undefined'){
		curPage = 1;
		prePage = 1;
		nxtPage = 2;
	} else {
		curPage = parseInt(curPage)
	}

	var pagi = {
		"number_of_pages": ttlPage,
        "current_page": curPage,
        "previous_page": prePage,
        "next_page": nxtPage,
        "total_records": countTotalForward
    }

	//respObj["mesh"] = revMesh;
	//respObj["revPages"] = revPages
	respObj[getParameter(req.originalUrl, "datasource")] = resultsForward
	respObj["pagination"] = {
		... pagi,
		pages: dates
	}
	respObj["headers"] = requestedKeys
	respObj = {
		... respObj,
		... getDisplayHeaders(requestedKeys, resultsForward)
	}

	res.status(200);
	res.json(respObj)
}

function getDisplayHeaders(requestedKeys, items){

    headers = requestedKeys;
    var parsedHeaders = [];
    var addDataForm = [];
    var displayHeaders = [];

    var standardKeys = [
        "created_by",
        "modified_by",
        "_id",
        "owner",
        "created",
        "modified",
        "__v"
    ];

    console.log(requestedKeys, items);

    for (var i = 0; i < headers.length; i++) {
        var typeKey = [headers[i]][0];
        var obj = items[0];
        var type = voca.capitalize(typeof obj[typeKey]);

        //console.log(306, typeKey, obj, type);
         if (Array.isArray(obj[typeKey])) type = "Array";

        var header = {
          field_label: voca.titleCase(voca.replaceAll(headers[i], "_", " ")),
          field_name: voca.lowerCase(voca.snakeCase(headers[i])),
          type: type
        };

        if (type == "String") {
          // Check and see if this is a datetime

          var isDate = Date.parse(obj[typeKey]);
          var noSpaces = obj[typeKey].indexOf(" ");
          if (!isNaN(isDate)&&(noSpaces == -1)) {                     //1607040720000 
            //console.log(624, isDate, obj[typeKey]); //978303600000
            // We've got a valid date
            header.type = "Date";
            header.formType = {
              controlType: "date"
            };
          } else {
            header.type = "String";
            header.formType = {
              controlType: "text"
            };
          }
        }

        if (header.type == "Number") {
          header.formType = {
            controlType: "number"
          };
        }

        if (header.type == "Array") {
          header.formType = {
            controlType: "select",
            options: obj[typeKey]
          };
        }

        if (header.type == "Boolean") {
          header.formType = {
            controlType: "checkbox",
            options: ["True", "False"]
          };
        }
        
        if(header.type == "Undefined"){
          header.type = "String";
          header.formType = {
            controlType: "text"
          };
        }

        if (!standardKeys.includes(headers[i])) {
          parsedHeaders.push(headers[i]);
          addDataForm.push(header);
          displayHeaders.push(header.field_label);
        }
      }

      return {
      	addDataForm:addDataForm,
      	displayHeaders:displayHeaders
      }
}

function getNextPageLink(origUrl, key, sortBy, idsForward){
	// sort is preserved identically across all paginatied requests
	// filter is preserved identically across all paginatied requests
	// key is updated
	origUrl = clearParameters(origUrl, 'prev', getParameter(origUrl, 'prev'))
	origUrl = clearParameters(origUrl, 'date', getParameter(origUrl, 'date'))


	var keyValue = getParameter(origUrl, 'key');
	if(key != 0){
		origUrl = replaceParameter(origUrl, 'key', keyValue, base64.encode(idsForward[idsForward.length-1][sortBy]))
	} else {
		origUrl = `${origUrl}/key/${base64.encode(idsForward[idsForward.length-1][sortBy])}`; 
	}
	// Add in the previous first page first id
	origUrl += ("/prev/" + idsForward[0][sortBy]);
	return origUrl;
}

function getPrevPageLink(origUrl, key, sortBy, idsForward){
	console.log(206, 'prev', getParameter('prev'));
	var tmpUrl = origUrl;
	origUrl = clearParameters(origUrl, 'prev', getParameter(origUrl, 'prev'))
	origUrl = clearParameters(origUrl, 'date', getParameter(origUrl, 'date'))
		
	// sort is preserved identically across all paginatied requests
	// filter is preserved identically across all paginatied requests
	// key is updated
	var keyValue = getParameter(origUrl, 'key');
	if(key != 0){
		console.log(222, base64.decode(keyValue));
		var replacementKey = base64.encode(getParameter(tmpUrl, "prev"));

		//origUrl = replaceParameter(origUrl, 'key', keyValue, base64.encode(idsForward[idsForward.length-1][sortBy]))
		//if(typeof base64.decode(getParameter(tmpUrl, "prev")) != 'undefined'){
			origUrl = replaceParameter(
				origUrl, 
				'key', 
				keyValue, 
				replacementKey)

		if(replacementKey == 'dW5kZWZpbmVk'){
			console.log(234)
			origUrl = clearParameters(origUrl, 'key', getParameter(origUrl, 'key'))
		} else {
			console.log(237, replacementKey)
		}
		//} else {

		//}
		origUrl += ("/prev/" + getParameter(tmpUrl, "prev"))
		//origUrl += ("/date/" + idsForward[0][sortBy]);
		
	} else {
		origUrl = `${origUrl}`; 
	}
	return origUrl;
}

function getProtocolWithHost(req){
	return `${req.protocol}://${req.get("host")}` +
      process.env.API_VERSION;
}


function getParameter(origUrl, key){
	return helpers.getParameter(origUrl, key);
}

function replaceParameter(src, parameter, oldValue, newValue){
	var tmp =  voca.replace(src, `${parameter}/${oldValue}`, `${parameter}/${newValue}`);
	return tmp;	
}

function clearParameters(src, parameter, value){
	var tmpa = "/" + parameter + "/" + value;
	var tmp =  voca.replaceAll(src, tmpa, "");
	return tmp;	
}

function addParameter(src, parameter, value){
	var tmp = src + "/" + parameter + "/" + value;
	return tmp;	
}

function getPages(
	req, 
	firstItemKey,
	lastItemKey,
	origKey,
	lastItemId,
	sortKey,
	firstId,
	idsForward
	){

	var nextPageUrl = "";
	if(origKey == 0){
		lastPageUrl = req.originalUrl;
	}
	else {
		var prevPageKey = helpers.getParameter(req.originalUrl, "prev");
		var currentKey = helpers.getParameter(req.originalUrl, "key");
		var lastPageUrl = clearParameters(req.originalUrl, "prev", prevPageKey)
		var prevKey = helpers.getParameter(req.originalUrl, "prev")
		var prevId = helpers.getParameter(req.originalUrl, "id")
		lastPageUrl = clearParameters(req.originalUrl, "key", helpers.getParameter(req.originalUrl, "key"))
		lastPageUrl = clearParameters(lastPageUrl, "id", helpers.getParameter(lastPageUrl, "id"))
		lastPageUrl = clearParameters(lastPageUrl, "prev", helpers.getParameter(lastPageUrl, "prev"))
		lastPageUrl = lastPageUrl + "/key/" + base64.encode(helpers.getParameter(req.originalUrl, "firstId"));
	}
	
	if(origKey == 0){
		console.log(294);
		nextPageUrl = req.originalUrl
		nextPageUrl = clearParameters(nextPageUrl,	 "prev", helpers.getParameter(nextPageUrl, "prev"))
		nextPageUrl = addParameter(nextPageUrl, "key", base64.encode(lastItemKey))
		nextPageUrl = addParameter(nextPageUrl, "id", base64.encode(lastItemId));
		nextPageUrl = nextPageUrl + "/prev/" + base64.encode("0");
		nextPageUrl = nextPageUrl + "/prev_id/" + base64.encode("0");
		nextPageUrl = addParameter(nextPageUrl, "firstId", idsForward[0][sortKey])
		nextPageUrl = addParameter(nextPageUrl, "lastId", idsForward[idsForward.length-1][sortKey])
	} else {
		nextPageUrl = req.originalUrl
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
	}
	return {
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