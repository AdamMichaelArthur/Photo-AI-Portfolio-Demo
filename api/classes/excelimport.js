

const Excel = require('exceljs');
const util = require('util')
var streamBuffers = require('stream-buffers');

const { Readable } = require('stream');

module.exports = class ExcelImport {

	bWorksheetNameValidationPassed = true;
	bWorksheetHeadersValidationpassed = true;
	bUseValidation = false;
	worksheetMissingNames = [];
	worksheetMissingHeaders = [];
	firstSheetName = "";
	type = "xlsx";

	constructor(workbook, validation ={}, type ="xlsx"){
		this.data = workbook;
		this.workbook = new Excel.Workbook();
		this.documents = {}
		this.keys = [];
		this.validation = validation;
		this.bUseValidation = this.bUseValidation
		this.firstSheetName = "";
		this.type = type;
	}

	async loadWorkbook(datasourcesFromSheetNames =false){
		var result;

		if(this.type == "xlsx")
			result = await this.workbook.xlsx.load(this.data);
		if(this.type == "csv"){

			const stream = Readable.from(this.data.toString());
			result = await this.workbook.csv.read(stream);			
		}
		this.documents = this.iterateThroughSheets(datasourcesFromSheetNames);
		return this.documents;
	}

	iterateThroughSheets(datasourcesFromSheetNames =false){
		var _self = this;
		//var t = 0;
		var merged = {}
		var documents = [];
		var tests = [];
		var multipleDatasource = {};

		this.workbook.eachSheet(function(worksheet, sheetId) {
			multipleDatasource[worksheet.name] = [];
		});

		this.workbook.eachSheet((worksheet, sheetId) => {
			//t++;
			// Iterate through each worksheet
				var sheetRows = _self.iterateThroughSheet(worksheet)
				var name = worksheet.name
				if(this.firstSheetName == "")
					this.firstSheetName = name;

				var t = {}
				merged[name] = sheetRows
				
				//console.log(30, sheetRows)
				for(var y = 0; y < sheetRows.length; y++){
					var row = sheetRows[y];
					//console.log(row);
					var doc = {}
					for(var t = 0; t < row.length; t++){
						var column = row[t];
						var bAlreadyInserted = false;
						if(typeof doc[_self.keys[t]] != 'undefined'){
							// We have duplicate column data
							if(Array.isArray(doc[_self.keys[t]])){
								//if(column != '')
									doc[_self.keys[t]].push(column)
								bAlreadyInserted = true;
							} else {
								doc[_self.keys[t]] = [ doc[_self.keys[t]] ];
							}
						}

						if(Array.isArray(doc[_self.keys[t]])){
							if(bAlreadyInserted == false)
								//if(column != '')
									doc[_self.keys[t]].push(column)
						} else {
							//if(column != '')
								doc[_self.keys[t]] = column;
						}
					}
					documents.push(doc)
					
					if(datasourcesFromSheetNames){
						multipleDatasource[worksheet.name].push(doc);
					}
				}

			});

		if(datasourcesFromSheetNames){
			return multipleDatasource
		}

		return documents;
	}

	iterateThroughSheet(worksheet){
		var name = worksheet.name;
		//if(this.bUseValidation){
		//	if(typeof(this.validation["name"] == 'undefined')){
		//		bWorksheetNameValidationPassed = false;
		//	}
		//}

		var rowsAr = this.iterateThroughRows(worksheet, name);
		var saveObj = { name: rowsAr }
		saveObj[name] = rowsAr;
		return rowsAr;
	}

	iterateThroughRows(worksheet, name){
		var _self = this;
		var allRows = [];
		worksheet.eachRow({ includeEmpty: true	}, function(row, rowNumber) {
		  if(rowNumber != 1){
		  	var res = _self.parseRow(row.values);
		  	if(res != -1){
		  		//console.log(130, res);

		  		allRows.push(res);
		  	}
		  } else {
		  	_self.keys = _self.parseKeys(row.values);
		  	//if(this.bUseValidation){
			//  	for(var i = 0; i < _self.keys.length; i++){
			//  		var headerIndex = this.validation["name"]["headers"].indexOf(_self.keys[i])
			//  		if(headerIndex == -1){
			//  			this.bWorksheetHeadersValidationpassed = false;
			//  			this.worksheetMissingHeaders.push(_self.keys[i])
			//  		}
			//  	}
			//}
		  }
		});
		return allRows
	}

	parseKeys(keys){
		keys = this.filterUndefined(keys);
		return keys;
	}

	filterUndefined(row){
		for(var i = 0; i < row.length; i++){
			if(typeof row[i] === 'undefined'){
				row.splice(i, 1);
			}
		}
		return row;
	}

	parseRow(row){
		const origRow =  [...row];
		origRow.shift()
		row = this.filterUndefined(row)
		// Make sure our keys match, etc.
		if(row.length != this.keys.length){
			// We need to adjust for empty rows...
			for(var i = 0; i < origRow.length; i++){
				if(typeof origRow[i] == 'undefined'){
					origRow[i] = "";
				}

				if(origRow[i] == null){
					origRow[i] = "";
				}
				// Hyperlinks are very common -- both Excel and Google Spreadsheets adds them automatically.  
				// Other types of cells as objects are also common.  We just want the text in these scenarios.
				if(typeof origRow[i] == "object"){
					if(typeof origRow[i]["hyperlink"] !== 'undefined'){
						origRow[i] = origRow[i]["text"]
					} else if (typeof origRow[i]["text"] !== 'undefined'){
						origRow[i] = origRow[i]["text"]
					}

					if(typeof origRow[i]["formula"] !== 'undefined'){
						origRow[i] = origRow[i]["result"]
					}
				}
			}
			row = origRow
		}
		return row;
	}

//{
// 	required_sheet_names: [ "Sheet1", "Sheet 2"],
// 	required_sheet_headers: [
// 		{
// 			"Sheet1" : {
// 				"primary_key":"Keywords",
// 				"headers": [
// 					"Parent Topic",
// 					"Slug",
// 					"Sub Topic",
// 					"Keyword"
// 				]
// 		},
// 			"Sheet2" : {
// 				"primary_key":"Column 1",
// 				"headers": [
// 					"Column 1",
// 					"Column 2",
// 					"Column 3",
// 					"Column 4"
// 				]
// 		}
// 	]
// }
	validate(jsonValidation){

	}
}