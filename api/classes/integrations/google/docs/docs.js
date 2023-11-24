/*
	This file creates implements wrapper functions around Google Docs.

	With this file you can CRUD Google Docs


*/

const fs = require('fs');
const {google} = require('googleapis');
const TOKEN_PATH = 'api/classes/integrations/google/token.json';
const drive = require("@classes/integrations/google/drive/drive.js")

module.exports = class GoogleDocs {

	oAuthClient = null;
	docs = null;
	drive = null;
	spreadsheetId = null;
	credentials = null;
	token = null;
	documentId = null;

	constructor(){
		try {
			var credentials = fs.readFileSync('api/classes/integrations/google/credentials.json');
		} catch(err){
			return console.log('Error loading client secret file:', err);
		}

		this.credentials = JSON.parse(credentials);
		var auth = this.authorize(this.credentials);
		this.docs = google.docs({version: 'v1', auth });
		this.drive = new drive()
		console.log(34, "Constructor finished");
	}

	/*	@param title
	 *
	 *	Creates a new Google Document and returns the document id
	 *
	*/
	async createDocument(title ="Test"){
		try{
			var res = await this.docs.documents.create({ title: title } )
		} catch(err){
			return console.log('The API returned an error: ' + err);
		}

		try {
			//console.log(50, this.drive);
			var permissions = await this.drive.updatePermissions(res.data.documentId);
			console.log(52, permissions);
		} catch(err){
			return console.log(50, 'docs.js', 'Unable to set permissions for the newly created file' + err);
		}

		this.documentId = res.data.documentId;

		return res.data.documentId;
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

	// Appends text to the bottom of the document
	insertText(text) {
		if(this.documentId == null){
			console.error("You must supply a google doc id before you can use insertText")
			return false;
		}
	}

	// Replaces every occurance of placeHolder with text
	replaceAllText(placeHolder, text){
		if(this.documentId == null){
			console.error("You must supply a google doc id before you can use replaceAllText")
			return false;
		}
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