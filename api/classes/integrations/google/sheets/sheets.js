/*
	This file creates implements wrapper functions around Google Sheets, and creates a mechianism
	where we can supply a JSON object and insert it at the bottom of the row, or, optionally, search
	for and replace a row with a provided key.

	We require that all spreadsheets have a header row.  There is no requirement that headers be unique,
	but in the case where there are multiple identical headers headers, an array should be supplied.
	Each element in the array will be inserted based on the first position of the header.

	So, for example, if we have a JSON Object like this:
	{
		"spreadsheet": {
			header: [
				"Item 1", "Item 2", "Item 3"
			]
		}
	} 

	This would translate in the spreadsheet as:

	A0	header 	header 	header
		Item 1	Item 2	Item 3
*/

const fs = require('fs');
const {google} = require('googleapis');
const TOKEN_PATH = 'api/classes/integrations/google/token.json';
const drive = require("@classes/integrations/google/drive/drive.js")

module.exports = class GoogleSheets {

	oAuthClient = null;
	sheets = null;
	spreadsheetId = null;
	credentials = null;
	token = null;

	constructor(){
		try {
			var credentials = fs.readFileSync('api/classes/integrations/google/credentials.json');
		} catch(err){
			return console.log('Error loading client secret file:', err);
		}

		this.credentials = JSON.parse(credentials);
		var auth = this.authorize(this.credentials);
		this.sheets = google.sheets({version: 'v4', auth });
		this.drive = new drive();
	}

	async createSpreadsheet(documentTitle ="untitled"){
		const requestBody = {
			properties: {
				"title":documentTitle,
			},
		};
		
		try {
			var spreadsheetId = await this.sheets.spreadsheets.create({ requestBody, fields: 'spreadsheetId' });
		} catch(err){
			console.log(59, err);
		}

		this.spreadsheetId = spreadsheetId.data

		try {
			await this.drive.updatePermissions(this.spreadsheetId.spreadsheetId);
		} catch(err){
			return console.log(69, 'sheets.js', 'Unable to set permissions for the newly created file' + err);
		}

		return this.spreadsheetId

	}

	/*	@param buffer
	 *	- A file buffer containing an Excel Spreadsheet
	 *
	 *	Uploads the buffer into Google Drive, then converts it into a Google Spreadsheet
	 *
	*/
	async createSpreadsheetFromFile(buffer){

	}

	async batchUpdate(spreadsheetId){
		// POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}:batchUpdate

	}

	authorize(credentials) {

	  const {client_secret, client_id, redirect_uris} = this.credentials.installed;
	  const oAuth2Client = new google.auth.OAuth2(
	      client_id, client_secret, redirect_uris[0]);

	  // Check if we have previously stored a token.
	  try {
	  	var token = fs.readFileSync(TOKEN_PATH);
	  } catch(err){
	  	return getNewToken(oAuth2Client, callback);
	  }

	  this.oAuth2Client = oAuth2Client;
	  this.token = JSON.parse(token)
	  this.oAuth2Client.setCredentials(this.token);

	  return oAuth2Client

	}

	getNewToken(oAuth2Client, callback) {
	  const authUrl = oAuth2Client.generateAuthUrl({
	    access_type: 'offline',
	    scope: SCOPES,
	  });
	  console.log('Authorize this app by visiting this url:', authUrl);
	  const rl = readline.createInterface({
	    input: process.stdin,
	    output: process.stdout,
	  });
	  rl.question('Enter the code from that page here: ', (code) => {
	    rl.close();
	    oAuth2Client.getToken(code, (err, token) => {
	      if (err) return console.error('Error while trying to retrieve access token', err);
	      oAuth2Client.setCredentials(token);
	      // Store the token to disk for later program executions
	      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
	        if (err) return console.error(err);
	        console.log('Token stored to', TOKEN_PATH);
	      });
	      callback(oAuth2Client);
	    });
	  });
	}

}