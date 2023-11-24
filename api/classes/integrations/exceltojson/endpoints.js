
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
var mongoose = require("mongoose");

router.post("/upload", upload.any(), exceltojson);

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

var options = {
    "validation": {
        "sheets": 
        [
            {
                "primary_key": "Songs",
                "method": "update",
                "default": true,
                "sheetname": "Top Videos"
            },
            {
                "primary_key": "Album Name",
                "method": "update",
                "sheetname": "Discography"
            },
            {
                "primary_key": "Question",
                "method": "update",
                "sheetname": "Most Searched For Questions"
            },
            {
                "primary_key": "Song Title",
                "method": "update",
                "sheetname": "Most Searched For Songs"
            }
		] 
	}
}

async function getWorkbookData(req, res, filter, fileBuffer, x){

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

	var ExcelImport = new excel(data, {}, type);
	var importData = [await ExcelImport.loadWorkbook(bySheets)];

	var sheetnames = [];
	if(bySheets == true)
		sheetnames = Object.keys(importData[0]);
	else {
		sheetnames = [ExcelImport.firstSheetName];
	}

	var importDataAsValues = Object.values(importData[0])

	//console.log(1346, util.inspect(importDataAsValues, false, null, true /* enable colors */))


	// We need to delete empty objects...empty
	var deletedObjs = 0;
	for(var value of importDataAsValues){

		var pos = 0;
		for(obj of value){
			if(JSON.stringify(obj) == "{}"){
				value.splice(pos, 1);
				deletedObjs++;
			}	
			pos++;
			if(deletedObjs > 1000){
				value.splice(1000, value.length - 1000);
			}
		}
	}

	var sheets = [];

	for(var i = 0; i < sheetnames.length; i++){

		consolidateRows(importDataAsValues[i])
		//console.log(169)
		var sheet = {
			"sheetname":sheetnames[i],
			"sheetdata": importDataAsValues[i],
			"collection_name" : getCollectionName(sheetnames[i])
		}
		
		//console.log(175, "consolidate rows finished");

		var defaultValidation = {}
		if(validation){
		if(typeof filter.validation.sheets != 'undefined'){
			if(Array.isArray(filter.validation.sheets)){
				//console.log(1088);//, filter.validation.sheets.length)
				for(var x = 0; x < filter.validation.sheets.length; x++){
					//console.log(1089, 1089, x);
					if(typeof filter.validation.sheets[x].sheetname == 'undefined')
						filter.validation.sheets[x].sheetname = sheetnames[i]
					if(sheetnames[i] == filter.validation.sheets[x].sheetname){
						sheet = { ... sheet, ... filter.validation.sheets[x] }
					}
					if(filter.validation.sheets[x].default == true){
						//console.log(1335, defaultValidation)
						//console.log(185, filter.validation.sheets[x])
						if(sheetnames[i] == filter.validation.sheets[x].sheetname){
							defaultValidation = { ... filter.validation.sheets[x] }
						}
						
					}
				}
			}
		}		
	}
	//console.log(203);
	sheets.push(sheet)
	//console.log(205);
	}

	//console.log(1346, util.inspect(filter, false, null, true /* enable colors */))

	delete defaultValidation.sheetname;
	delete defaultValidation.default;
//	delete defaultValidation.primary_key

	// Ensure every sheet has a default validation object if one was provided
	for(sheet in sheets){
		//console.log(1346, sheet);
		if(typeof sheets[sheet].primary_key == 'undefined'){
			sheets[sheet] = { ... sheets[sheet], ... defaultValidation }
		}
	}

	//console.log(1365, util.inspect(filter, false, null, true /* enable colors */))

	//for(sheet of sheets){
	//	console.log(1359, filter)
	if(validation){
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
		//console.log(1110, sheetRows.sheetdata.length);
		for(var y = 0; y < sheetRows.sheetdata.length; y++){
			var doc = createDocumentFromRow(sheetRows.sheetdata[y]);
			entireWorkbookRaw[i].sheetdata[y] = doc;
			//console.log(1111, sheetRows.sheetdata.length);
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

function getCollectionName(sheetname){
		var collectionName = voca.replace(sheetname, " ", "");
		collectionName = voca.replace(collectionName, "(", "");
		collectionName = voca.replace(collectionName, ")", "");
		collectionName = voca.lowerCase(collectionName);
		return collectionName;
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

	// It's empty -- can't possibly be invalid unless an empty sheet is invalid
	if(sheet.sheetdata.length == 0){
	 	return true;
	}

	if(typeof sheet.primary_key == 'undefined'){
		// This sheet wasn't provided a validation object.  No validation is performed;
		return true;
	}

	var keys = Object.keys(sheet.sheetdata[0])

	var bHasPrimaryKey = false;
	for(var key of keys){
		if(key == sheet.primary_key){
			bHasPrimaryKey = true;
		}
	}

	if(bHasPrimaryKey == false){
		return excelImportError(req, res, { 
				"error_no":20,
				"error_desc":`The sheet is missing ${sheet.primary_key} in ${sheet.sheetname}.  Check Row 1, starting with A1, to make sure all required headers are supplied`

			});
	}

	if(typeof sheet.primary_key != 'undefined'){
		// We defined a primary key...let's make sure it's in the spreadsheet
		var primary_key = sheet.primary_key
		console.log(1159, fileIndex, req.files[fileIndex-1])
		console.log(331, req.files);

		if(keys.indexOf(primary_key) == -1){
			try {
			return excelImportError(req, res, { 
				"error_no":1,
				"error_desc":`The file "${req.files[fileIndex-1]["originalname"]}" is missing a required column: '${sheet.primary_key}' in sheet "${sheet.sheetname}"`
		});
		} catch (err) {
			return excelImportError(req, res, { 
				"error_no":2,
				"error_desc":err.toString()
			});
		}
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

function removeLinks(parent){
		var parentObj = parent;

		function iterate(obj){
		var keys = Object.keys(obj);
		for(key of keys){

		// if(typeof obj["hyperlink"] != 'undefined'){
		// 	obj = {"works":true}
		// 	console.log(377, )
		// }

		if (typeof obj[key] === 'object' && obj[key] !== null) {
		        iterate(obj[key], obj)
		   }
		}
	}

	iterate(parentObj)
	return parentObj;
}
	

async function exceltojson(req, res){

	var user = res.locals.user;
	var filter = getExcelImportParameters(req, res, req.query.params);

	if(!filter)
		return false;

	var writeResultsAr = [];

	var errors = 0;
	for(var i = 0; i < req.files.length; i++){
		var fileBuffer = req.files[i];
	
	var entireWorkbook = await getWorkbookData(req, res, filter, fileBuffer, i);

	entireWorkbook = removeLinks(entireWorkbook)

	//const iterate = (obj, parent) => {

	//	obj = {}
		// return;

		// var keys = Object.keys(obj);
		// for(key of keys){

		// 	if(typeof obj["hyperlink"] != 'undefined'){
		// 		console.log(390, obj["text"]);
	 //     		//return {"works":true}
	 //     		parent = {"works":true}
	 //     		break;
	 //     	}
	 //     	//console.log(387, `key: ${key}, value: ${obj[key]}`)

		// 	if (typeof obj[key] === 'object' && obj[key] !== null) {
	 //            iterate(obj[key], obj)
	 //        }
		// }
	//}

	//console.log(406, typeof entireWorkbook);

	//iterate(entireWorkbook, null)

	//console.log(406, entireWorkbook);
	//console.log(1272, entireWorkbook);

	// If entireWorkbook is false, there was an error loading the workbook.  An
	// error has already been returned to the client, so the only thing left to do
	// here is return.
	if(entireWorkbook == false){
		errors++;
		continue;
	}
	}

	if(errors == 0){
		res.locals.response = entireWorkbook;
		next(req, res);
	}

}

var breaker = 0;

function createDocumentFromRow(doc){
		// breaker++;
		// if(breaker > 1000){
		// 	console.log(486);
		// 	process.exit(1);
		// 	console.log(398)
		// }

		//console.log(393)
		var docKeys = Object.keys(doc);
		for(var y = 0; y < docKeys.length; y++){

			var value = doc[docKeys[y]];

			//console.log(1746, util.inspect(value, false, null, true /* enable colors */))
			// Links are very common -- Excel automatically created objects
			if(typeof value == 'object'){
				//console.log(420, value);
				if(typeof value.hyperlink != 'undefined'){
					// We definitely have a link...convert it
					value = value.text
				} else if(typeof value.text != 'undefined'){
					value = value.text;
				}
				
				if(typeof value.richText != 'undefined'){
				var textOnly = ''
					for(var richTextItem of value.richText){
						textOnly += richTextItem.text
					}
					value = textOnly;
					//console.log(1765, textOnly)
				}

			}

			//console.log(1757, util.inspect(value, false, null, true /* enable colors */))

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
				console.log(978, doc[docKeys[y]]);
				for(var t = 0; t < doc[docKeys[y]].length; t++){
					if(!isNaN(doc[docKeys[y]][t]))
						doc[docKeys[y]][t] = Number(doc[docKeys[y]][t])
				}
			} else
				doc[docKeys[y]] = voca.replaceAll(doc[docKeys[y]], "/,", ",")
			//console.log(697, value, Number.isNaN(parseInt(value)))
			if(!Number.isNaN(parseInt(value))){
				if(voca.isDigit(value))
					doc[docKeys[y]] = parseInt(value);
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

		var breaker = 0;
		top:
		while(true){
			breaker++;
			if(breaker > 1000){
				console.log(464, 'break triggered');
				break;
			}

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
	// function consolidateRows(excelImportData){

	// 	var headerColumn = 0;

	// 	top:
	// 	while(true){
	// 	for(var i = 0; i < excelImportData.length; i++){
	// 		var row = excelImportData[i];
	// 		if(i < excelImportData.length)
	// 			var nextRow = excelImportData[i+1]
	// 		else nextRow = null;

	// 		if ((typeof Object.values(row)[0] != 'undefined') || (Object.values(row)[0] != '')){
	// 			if(nextRow != null){
	// 			if ((typeof Object.values(nextRow)[0] == 'undefined') || (Object.values(nextRow)[0] == '')){

	// 				var mergedObject = mergeObjectsByArrayStrategy(Object.keys(row)[0], row, nextRow, excelImportData, i)

	// 				if(mergedObject != false)
	// 					excelImportData[i] = mergedObject
	// 				excelImportData.splice(i+1, 1)
	// 				continue top;
	// 			}
	// 		} else {

	// 		}
	// 		}
	// 	}
	// 	break;
	// 	}

	// 	// Takes the data from rowToGive and puts it into the rowToReceive around.  rowToReceive[header] should be typeof undefined
	// 	function mergeObjectsByArrayStrategy(headerColumn, rowToReceive, rowToGive, arrayToSplice, pos){

	// 		if(rowToGive == null)
	// 			return false;

	// 		// if(typeof rowToGive[headerColumn] !== 'undefined')
	// 		// 	return false;

	// 		var rowToReceiveValues = Object.values(rowToReceive)
	// 		var rowToReceiveKeys = Object.keys(rowToReceive)
	// 		var rowToGiveValues = Object.values(rowToGive)

	// 		for(var i = 0; i < rowToReceiveValues.length; i++){
	// 			var rowToReceiveValue = rowToReceiveValues[i];
	// 			var rowToGiveValue = rowToGiveValues[i]
	// 			//console.log(1045, rowToGiveValue)
	// 			if(typeof rowToGiveValue == 'undefined')
	// 				continue;
	// 			if(rowToGiveValue == '')
	// 				continue;
	// 			if(i != 0){
	// 				if(Array.isArray(rowToReceiveValue)){

	// 					rowToReceiveValue.push(rowToGiveValue)
	// 				} else {
	// 					rowToReceiveValue = [rowToReceiveValue, rowToGiveValue]
	// 				}
	// 				rowToReceive[rowToReceiveKeys[i]] = rowToReceiveValue
	// 			}
	// 		}
		
	// 		return rowToReceive
	// 		}
	

	// 		function iterateThroughObject(obj){
	// 			var keys = Object.keys(obj);
	// 			for(var key of keys){
	// 				//console.log(510, key);
	// 				if(typeof obj[key] == 'object'){
	// 					if(Array.isArray(obj[key]) == false){
	// 						iterateThroughObject(obj[key])
	// 					} else {
	// 						var pos = 0;
	// 						for(arrItem of obj[key]){
	// 							if(arrItem == ""){
	// 								obj[key].splice(pos, 1);
	// 								iterateThroughObject(obj);
	// 							}
	// 							if(Array.isArray(arrItem)){
	// 								// We shouldn't have nested arrays.  Merge it with the parent array
									
	// 								var tmpAr = [... new Set( Array(arrItem)[0])]; // Create a new memory object;
									
	// 								obj[key].splice(pos, 1)
	// 								obj[key] = [ ... new Set(obj[key].concat(tmpAr))];

	// 								iterateThroughObject(obj[key])
	// 							}
	// 							pos++;
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 		iterateThroughObject(excelImportData)
	// 		iterateThroughObject(excelImportData)
	// 		iterateThroughObject(excelImportData)
	// 		iterateThroughObject(excelImportData)
	// 		// function mergeDuplicateArraysAndDeleteEmptyStrings(excelImportData){
	// 		// 		top:
	// 		// 		while(true){
	// 		// 		for(var i = 0; i < excelImportData.length; i++){
	// 		// 			var row = excelImportData[i];
	// 		// 			if(i < excelImportData.length)
	// 		// 				var nextRow = excelImportData[i+1]
	// 		// 			else nextRow = null;

	// 		// 			if ((typeof Object.values(row)[0] != 'undefined') || (Object.values(row)[0] != '')){
	// 		// 				if(nextRow != null){
	// 		// 				if ((typeof Object.values(nextRow)[0] == 'undefined') || (Object.values(nextRow)[0] == '')){


								
	// 		// 					continue top;
	// 		// 				}
	// 		// 			} else {

	// 		// 			}
	// 		// 			}
	// 		// 		}
	// 		// 		break;
	// 		// 		}
	// 		// }
	// 	console.log(1344, util.inspect(excelImportData, false, null, true /* enable colors */))
	// }

function getExcelImportParameters(req, res, params){
	try {
		var filterStr = base64.decode(params);
		} catch (err){
		return excelImportError(req, res, { 
			"error_no":3,
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
			"error_no":4,
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

	console.log(785, error);

   var defaultErrorResponse = helpers.defaultErrorResponseObject();
  defaultErrorResponse.Error = error.error_no;
  defaultErrorResponse.ErrorDetails.Error = error.error_no;
  defaultErrorResponse.ErrorDetails.Description = error.error_desc;
  res.json(defaultErrorResponse);

  console.log(794, defaultErrorResponse)
	return false;
}

function defaultError(req, res, error){

  var defaultErrorResponse = helpers.defaultErrorResponseObject();
  defaultErrorResponse.error = error.err_no;
  defaultErrorResponse.ErrorDetails.Error = error.err_no;
  defaultErrorResponse.ErrorDetails.Description = error.error_desc;
  res.json(defaultErrorResponse);

	return false;
}

function next(req, res){
	var defaultResponseObject = helpers.defaultResponseObject("spreadsheet")
	defaultResponseObject["spreadsheet"] = res.locals.response;
	res.status(200);
	res.json(defaultResponseObject);
}

module.exports = router