var helpers = require("@classes/helpers.js");
var mongoose = require("mongoose");
var apiVersion = "";
var voca = require("voca");
const util = require('util');
var base64 = require('base-64');

function print(num, msg){
	console.log(num, msg)
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
		if(searchModifier)
			iterateThroughObj(res, searchModifier)
		
		console.log(116, searchModifier);

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
	//console.log(126, totalPages)
	//if(totalPages > 10)
	//	totalPages = 10;
	//console.log(126, totalPages)

	var maxLimit = totalPages * defaultLimit;

	//console.log(130, maxLimit);
	console.log(128, searchObj, sort);

	var curPage = getCurrentPage(req.originalUrl)

	var forwardLimit = (defaultLimit*defaultLimit)

	console.log(178, searchObj, requestedRecords)

	var idsForward = await model.find(searchObj, requestedRecords)
		.sort(sort)
		.limit(forwardLimit)
		.lean()

	resultsForward = await model.find(searchObj, requestedRecords)
		.sort(sort)
		.limit(defaultLimit)
		.lean()

	console.log(154, resultsForward);

	//console.log(139, searchObj, requestedRecords);
	
	//console.log(155, resultsForward)

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

	//console.log(345, util.inspect(idsReverse, false, null, true /* enable colors */));
	//console.log(345, util.inspect(idsReverse, { showHidden: false, depth: null }));

	function createPageObj(id, page_number){

		console.log(178, id);

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
			//if(counter != 0)
				dates.push(createPageObj(idsForward[i][sortKey], pageCounter))
			counter = 0;
			pageCounter++;
		}
		counter++;
	}

	idsReverse = idsReverse.reverse();

	counter = 0;
	pageCounter = 1;
	var revPages = [];
	for(var i = 0; i < idsReverse.length; i++){

		if((counter == defaultLimit)||(counter == 0)){
			revPages.push(createPageObj(idsReverse[i][sortKey], pageCounter))
			pageCounter++;
			counter = 0;
		}
		var mesh = voca.substr(idsReverse[i]["_id"], 20) + "--" + idsReverse[i]['release_for_bounty']
		counter++;
	}

	if(typeof getParameter(req.originalUrl, "page") == 'undefined'){
		dates = revPages
	} else if (getParameter(req.originalUrl, "page") == '1'){
		for(var y = 0; y < revPages.length; y++){
			//dates.unshift(revPages[y])
		}
	} else {
		revPages = revPages.reverse();
		for(var y = 0; y < revPages.length; y++){
			//dates.unshift(revPages[y])
		}		
	}

	dates = dates.concat(revPages)

	var sortedDates = [];//dates.concat([])

	for(var i = 1; i < dates.length+1; i++){

		var page_i = dates[i-1]["page_number"]

		for(var y = 1; y < dates.length+1; y++){
			var page_y = dates[y-1]["page_number"]
			if(page_y == page_i){

				sortedDates[page_i-1] = dates[y-1]
				//console.log(sortedDates[page_i-1])
			}
			// //try {
			// 	if(typeof dates[y-1]["page_number"] != 'undefined'){
			// 	var page_y = dates[y-1]["page_number"]
			// //} catch (err){

			// //}
			// if(page_y == page_i)
			// 	sortedDates.push(dates[i])

			// }
		}
	}

	//dates = sortedDates
	//pages = sortedDates
	
	dates = sortedDates;

	// console.log(230, dates)
	// //dates.concat(revPages)
	// console.log(231, revPages)

	

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

    dates = dates.filter(function (el) {
  		return el != null;
	});

    if(curPage < 6){
    if(dates.length > 10){
    	dates = dates.splice(0, 10);
    }
	} else if ((curPage > 5)){
    	dates.splice(0, curPage-5);
    	console.log(315, dates);
    	// When we started, curPage correlated with the index.  Now it does not
    	var pageIndex = 0;
    	for(var i = 0; i < dates.length; i++){
    		if(dates[i]["page_number"] == curPage){
    			pageIndex = i;
    		}
    	}
    	console.log(323, pageIndex, curPage, dates.length)
    	dates.splice(pageIndex+6, 10);
    	//console.log(315, dates);
    	//dates = dates.splice(10, dates.length);
	}

	console.log(329);



//}

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

	var respObj2 = sortResponseDataByHeaders(respObj, getParameter(req.originalUrl, "datasource"))

	// Check for empty rows and ensure each 
	//console.log(345, util.inspect(respObj2, false, null, true /* enable colors */));

	// // Ensure the main data object has key/value pairs for all requested fields -- even if the database returned empty
 //        for(var i = 0; i < items.length; i++){
 //          var item = items[i]
 //          for(var y = 0; y < responseObject["headers"].length; y++){
 //            var header = responseObject["headers"][y];
 //            var bHeaderPresent = false;
 //            for (const [key, value] of Object.entries(item)) {
 //              console.log(`${header}, ${key}: ${value}`);
 //              if(header == key){
 //                bHeaderPresent = true;
 //              }
 //            }
 //            if(bHeaderPresent == false){
 //              item[header] = "";
 //            }
 //          }
 //        }

	res.status(200);
	res.json(respObj2)
}

function sortResponseDataByHeaders(respObj, dataKey){

	// 
	var headers = respObj["headers"]

	for(var i = 0; i < respObj[dataKey].length; i++){

		var sortedObj = { _id: respObj[dataKey][i]["_id"] }

		for(var y = 0; y < headers.length; y++){
			// console.log(288, headers[y])
			// console.log(289, respObj[dataKey][i])
			// console.log(290, respObj[dataKey][i][headers[y]])
			//sortedObj[ "brand_name" ] = 
			var varName = headers[y]
			sortedObj[varName] = respObj[dataKey][i][varName]
//			console.log(292, respObj[dataKey][i][varName])
		}

		respObj[dataKey][i] = sortedObj
	}

	return { ... respObj }
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

    console.log(427,  requestedKeys, items);
    if(items.length == 0){
    	let displayHeaders = [];
    	for(let requestedKey of requestedKeys){
    		displayHeaders.push(voca.titleCase(voca.replaceAll(requestedKey, "_", " ")))
    	}
    	return  {
      	addDataForm: [],
      	displayHeaders: displayHeaders
    	}
    }
    
    for (var i = 0; i < headers.length; i++) {
        var typeKey = [headers[i]][0];
        var obj = items[0];
        console.log(432, obj, headers[i] )
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
          if (!isNaN(isDate)&&(noSpaces == -1)) {                     
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

        if(requestedKeys.includes(headers[i])){
        	if(standardKeys.includes(headers[i])){
        		// We have a specifically requested a normally hidden key.  Let's return it. 
        		parsedHeaders.push(headers[i]);
        		header.type = "String";
          			header.formType = {
            		controlType: "text"
          		};
          		addDataForm.push(header);
          		displayHeaders.push(header.field_label);
        	}
        }
      }

      console.log(497, displayHeaders);

      return {
      	addDataForm:addDataForm,
      	displayHeaders:displayHeaders
      }
}

function getNextPageLink(origUrl, key, sortBy, idsForward){

}

function getPrevPageLink(origUrl, key, sortBy, idsForward){

}

function getProtocolWithHost(req){
	return `${req.protocol}://${req.get("host")}` +
      process.env.API_VERSION;
}

function getCurrentPage(origUrl){
	console.log(380, origUrl)
	var pageString = getParameter(origUrl, "page");
	console.log(511, pageString)
	if(typeof pageString == 'undefined')
		return 1;

	return parseInt(getParameter(origUrl, "page"))
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

/*
		"pages": [
            {
                "_id": "60a275a27b479949ee12d30f",
                "page_number": 1,
                "page_endpoint": "http://localhost:3000/api/datasource/bounty/all/page/1/id/60a275a27b479949ee12d30f"
            },
            {
                "_id": "60a275a27b479949ee12d320",
                "page_number": 2,
                "page_endpoint": "http://localhost:3000/api/datasource/bounty/all/page/2/id/60a275a27b479949ee12d320"
            },
            {
                "_id": "60a275a27b479949ee12d32a",
                "page_number": 3,
                "page_endpoint": "http://localhost:3000/api/datasource/bounty/all/page/3/id/60a275a27b479949ee12d32a"
            },
            {
                "_id": "60a275a27b479949ee12d334",
                "page_number": 4,
                "page_endpoint": "http://localhost:3000/api/datasource/bounty/all/page/4/id/60a275a27b479949ee12d334"
            },
            {
                "_id": "60a275a27b479949ee12d33e",
                "page_number": 5,
                "page_endpoint": "http://localhost:3000/api/datasource/bounty/all/page/5/id/60a275a27b479949ee12d33e"
            },
            {
                "_id": "60c113371f2f501e28cc92f8",
                "page_number": 6,
                "page_endpoint": "http://localhost:3000/api/datasource/bounty/all/page/6/id/60c113371f2f501e28cc92f8"
            },
            {
                "_id": "60c113371f2f501e28cc9302",
                "page_number": 7,
                "page_endpoint": "http://localhost:3000/api/datasource/bounty/all/page/7/id/60c113371f2f501e28cc9302"
            },
            {
                "_id": "60c113371f2f501e28cc930c",
                "page_number": 8,
                "page_endpoint": "http://localhost:3000/api/datasource/bounty/all/page/8/id/60c113371f2f501e28cc930c"
            },
            {
                "_id": "60c113371f2f501e28cc9316",
                "page_number": 9,
                "page_endpoint": "http://localhost:3000/api/datasource/bounty/all/page/9/id/60c113371f2f501e28cc9316"
            },
            {
                "_id": "60c113371f2f501e28cc9320",
                "page_number": 10,
                "page_endpoint": "http://localhost:3000/api/datasource/bounty/all/page/10/id/60c113371f2f501e28cc9320"
            }
        ]
*/

exports.aggregatePagination = async function(){



}

exports.getDisplayHeaders = async function(requestedKeys, items){

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
          if (!isNaN(isDate)&&(noSpaces == -1)) {                     
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

        if(header.type == "Object"){
          header.type = "String";
          header.formType = {
            controlType: "text"
          };

          console.log(562, header)
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
