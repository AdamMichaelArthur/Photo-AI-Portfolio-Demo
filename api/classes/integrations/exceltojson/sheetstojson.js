
/*
	This is designed to take a URL from Google sheets and convert it into a JSON document
	The intention is to produce a JSON document identical to if it was downloaded
	and uploaded as an Excel Document.
*/

async function getWorkbookData(sheetsUrl =''){
	if(sheetsUrl == ''){
		return error('The URL provided was empty');

		
	}

	var importDataAsValues = Object.values(["","",""])

	consolidateRows(importDataAsValues[i])

		var sheet = {
			"sheetname":sheetnames[i],
			"sheetdata": importDataAsValues[i],
			"collection_name" : getCollectionName(sheetnames[i])
		}

}

	function consolidateRows(excelImportData){

		console.log(1276, "Consolidating rows", excelImportData);

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

function error(msg){

}