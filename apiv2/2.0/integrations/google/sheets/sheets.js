import Google from '../google.js'

export default class Sheets extends Google {

	constructor(initializers =null){
		try {
			super(initializers, "/integrations/google/sheets/", "sheets");
		} catch(err){
			console.error("Unable to initialize", err);
		}
	}

	/* Endpoints */
	async openGoogleSheets(){

	}

	/* Creates a new Google Sheet */
	async createGoogleSheet(){

	}

	/* Finds the users Dashboard */
	async findByUserId(user_id){
		
	}

	// Exports a Dashboard to sheets
	async exportDashboardToSheets(){

		//return this.response.reply( {"sheetId": "result", "link": "clickableLink" } );
		// Construct a JSON Object that represents the data we're exporting
		//const projects = await this.database.getAll();
		//this.isRequest = true;

		const projects = await this.database.tables.projects.getProjects(this.user_id);

		
		// const asins = await this.database.tables.projects.getAsins(this.user_id);
		// const keywords = await this.database.tables.projects.getKeywords(this.user_id);
		// const ranks = await this.database.tables.projects.getRanks(this.user_id);

		// const spreadsheetAsJson = {
		// 	"sheets": [
		// 		{ "info": [] },
		// 		{ "projects" : projects },
		// 		{ "asins": asins },
		// 		{ "keywords": keywords },
		// 		{ "ranks": ranks }
		// 	]
		// }

		// // Determine if an existing Spreadsheet exists
		// var currentReportSheet = await this.database.tables.sheets.getByUserId();

		// var sheetId = null;
		// if(currentReportSheet == null){
		// 	sheetId = await this.uploadSpreadsheet(spreadsheetAsJson);
		// 	if(!sheetId){
		// 		return false;
		// 	}
		// } else {
		// 	sheetId = await this.replaceSpreadsheet(currentReportSheet, spreadsheetAsJson);
		// 	if(!sheetId){
		// 		return false;
		// 	}
		// 	result = sheetId;
		// }

		// Get a link to the spreadsheet
		//const clickableLink = await this.getLinkFromSpreadsheetId(result);

		return this.response.reply( projects );
	}

}