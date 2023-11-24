import Google from '../google.js'


import fs  from 'fs';
import { google } from 'googleapis';
const TOKEN_PATH = '2.0/n/integrations/google/token.json';
const CREDENTIALS_PATH = '2.0/n/integrations/google/credentials.json';
import voca from 'voca'
import Excel from 'exceljs';
import { Readable } from 'stream';// = require('stream').Readable; 

function bufferToStream(buffer) { 
  var stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
}

export default class Drive extends Google {

	constructor(initializers =null){
		try {
			super(initializers, "/integrations/google/drive/", "drive");
		} catch(err){
			console.error("Unable to initialize", err);
		}

		// try {
		// 	var credentials = fs.readFileSync(CREDENTIALS_PATH);
		// } catch(err){
		// 	return console.log('Error loading client secret file:', err);
		// }

		// this.credentials = JSON.parse(credentials);
		// console.log(35, this.credentials);

		// var auth = this.authorize(this.credentials);
		// this.drive = google.drive({version: 'v3', auth});

	}

	authorize(refresh_token ="") {

	  var oAuth2Client = new google.auth.OAuth2(
		    process.env.GOOGLE_OAUTH_CLIENT_ID,
		    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
		    process.env.GOOGLE_REDIRECT
		);

	  oAuth2Client = oAuth2Client;
	  oAuth2Client.setCredentials({ refresh_token: refresh_token } )
	  this.drive = google.drive({
			    version: 'v3',
			    auth: oAuth2Client,
	  });

	  return oAuth2Client
	}

	async createDashboardSpreadsheet(user_id =""){

		if(user_id == ""){
			user_id = this.user_id;
		}
		// Step 1: Get a valid Google Token
		var googleToken = await this.database.tables.googleTokens.findByUserId(user_id);

		// There's a chance we don't have a valid token.  If this is the case, googleToken will be false.
		if(!googleToken){
			return this.errors.error("google-token", "We don't have a valid Google Token for this user.  Go to Settings and Link a Google Account to fix this error.");
		}

		// If we do have a toke, this function loads this.drive and makes it available for our use.
		this.authorize(googleToken.refresh_token);

		// Check and see if a spreadsheet already exists.

		var hasExistingDashboard = await this.database.tables.googleSheets.findByUserId(user_id);

		if(hasExistingDashboard.length > 0){
			// We have an existing dashboard -- return it;
			return this.response.reply(hasExistingDashboard);
		}

		// If not, we'll create an empty spreadsheet

		var emptySpreadsheet = [
		        {
		            "sheetname": "Readme",
		            "sheetdata": [
		                {
		                    "Important Information": "This spreadsheet is temporary while the Google Spreadsheet dashboard builds.  Spreadsheet is updated every day at Midnight PST (San Francisco Time)",
		                    "Note": "This sheet will dissapear when the Dashboard fully loads"
		                }
		            ]
		        }
		]
		
		// Not using await here is intentional.  When the file is ready, data will be returned to the client.
		this.convertJsonToExcel(emptySpreadsheet, (spreadsheetId) => {
			console.log(104, spreadsheetId);
			this.database.tables.googleSheets.createSheet(user_id, spreadsheetId);
		});		


	}

	async list(){
		
	}

	async test(){

		//return this.response.reply({ "sheets": "this.body.sheets" });

		// const hasRequiredParameters = this.requiredParams(["sheets"], []);
		// if(!hasRequiredParameters){
		// 			return;
		// }

		// if(!Array.isArray(this.body.sheets)){
		// 	return this.errors.error("Sheets must be an array");
		// }

		// // This code takes the SQL Statments and puts them into a JSON
		// // Object that Json2Excel conversion function understands
		// var dashboard = [];
		// for(var sheet of this.body.sheets){
		// 	if(typeof sheet.sheetname == 'undefined'){
		// 		return this.errors.error("Each sheet must have a key 'sheetname' with a value that represents the sheetname");
		// 	}

		// 	if(typeof sheet.sql == 'undefined'){
		// 		return this.errors.error("Each sheet must have a sql statement.");
		// 	}

		// 	var sql = sheet.sql;
		// 	var data = [];
		// 	try {
		// 		var data = await this.database.rawQuery(sql);

		// 	} catch(err){
		// 		return this.errors.error("Problem with the SQL", err);
		// 	}
		// 	sheet["sheetdata"] = data;
		// }

		// // By now, we've got our database data -- now we convert it into
		// // an excel file as a filebuffer
		// this.convertJsonToExcel(this.body.sheets);


		//
	}

	async dashboard(){
		const hasRequiredParameters = this.requiredParams(["sheets"], []);
		if(!hasRequiredParameters){
					return;
		}

		if(!Array.isArray(this.body.sheets)){
			return this.errors.error("Sheets must be an array");
		}

		// This code takes the SQL Statments and puts them into a JSON
		// Object that Json2Excel conversion function understands
		var dashboard = [];
		for(var sheet of this.body.sheets){
			if(typeof sheet.sheetname == 'undefined'){
				return this.errors.error("Each sheet must have a key 'sheetname' with a value that represents the sheetname");
			}

		}

		this.convertJsonToExcel(this.body.sheets);		
	}

	convertJsonToExcel(spreadsheet =null, callback =null){


		console.log(107, spreadsheet);

		if(spreadsheet == null){
			return false;
		}

    var workbook = new Excel.Workbook();

    var importData = spreadsheet;

    if(Array.isArray(importData) == false){
      return this.errors.error("The request body should be an array");
    }

    for(var sheet of importData){
      const sheetname = sheet.sheetname;
      const sheetdata = sheet.sheetdata;
      var columnMaps = sheet.columnMaps;
      if(typeof columnMaps == 'undefined'){
      	columnMaps = {}
      }
      if(sheetdata.length == 0){
        continue;
      }
      const headers = this.getHeaders(sheetdata[0], columnMaps);
      if(headers.length == 0){
        continue;
      }

      console.log(136, headers);

      var keys = Object.keys(sheetdata[0])
      // var maps = Object.keys(columnMaps)
      // for(var key of keys){
      // 	for(var map of maps){
      // 		if(map == key){

      // 		}
      // 	}
      // }

      var sheet = workbook.addWorksheet(sheetname);
      sheet.columns = headers;
      sheet = this.insertRows(sheetdata, keys, sheet);
      
    }

    workbook.xlsx.writeBuffer()
      .then((buffer) => {
      	console.log(143, "Uploading To Drive");
		return this.uploadToDrive("dashboard", buffer, callback);
      });
	}

  async uploadToDrive(filename, buffer, callback =null){

    var mimetype = `mimetype = "application/vnd.google-apps.spreadsheett"`
    var res = await this.uploadSpreadsheetFromBuffer(buffer, filename, mimetype);
    var fileId = res.data.id;
    var url = `https://docs.google.com/spreadsheets/d/${fileId}`
    console.log(24, callback);
    if(callback != null){
    	callback(fileId);
    }
    this.res.status(200);
    return this.res.json( {"dashboard":url } );

  }

  getHeaders(sheetdata, maps){
    var headers = [];
    var keys = Object.keys(sheetdata)
    for(var i = 0; i < keys.length; i++){
    	var header = keys[i];
    	for(var map of Object.keys(maps)){
    		console.log(179, header, map)
    		if(map == header){
    			header = maps[map];
    		}
    	}

      headers.push({
        header: header,
        key: keys[i]
      })
    }   
    return headers;
  }

  insertRows(data, keys, sheet){
    for(var i = 0; i < data.length; i++){
      var dbRow = data[i];
      var row = {}
      row['id'] = i;
      for(var y = 0; y < keys.length; y++){
        var value = dbRow[keys[y]];
        if(typeof value != "object"){
          row[keys[y]] = dbRow[keys[y]]

          console.log(101, row[keys[y]], isNumeric(row[keys[y]]));
          if(isNumeric(row[keys[y]])){
              row[keys[y]] = parseFloat(row[keys[y]]);
            }
            console.log(103, row[keys[y]]);
        }
        else
        {
          if(Array.isArray(value)){
            row[keys[y]] = voca.replaceAll(value.toString(), ",", ", ");
            console.log(101, isNumeric(row[keys[y]]));
            if(isNumeric(row[keys[y]])){
              row[keys[y]] = parseFloat(row[keys[y]]);
            }
          }
        }
      }
      sheet.addRow(row);
    }
    return sheet;

  function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
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

	async updatePermissions(fileId){
		var permissions = [{ 'type': 'anyone', 'role': 'writer' }];

		for(var permission of permissions){
			try {
				var res = await this.drive.permissions.create({
		            resource: permission,
		            fileId: fileId,
		            fields: 'id',
		            sendNotificationEmail: false});
			
				console.log(40, res);
			} catch(err){
	        	console.log('Error changing permission:', err);
	        }
    	}
	}

		/*	Uploads Files That Are 5mb or less
	 *	@param buffer
	 *	@param filename
	 *	@param filetype
	*/
	async uploadSpreadsheetFromBuffer(buffer, filename, filetype){
		
		//var fileMetadata = { name: filename }
		var media = {
  			mimeType: filetype,
  			body: bufferToStream(buffer)
		};

		const fileMetadata = {
		    'title': 'My Report',
		    'mimeType': 'application/vnd.google-apps.spreadsheet',
		    "name":filename
		};

		const resource = {
			resource: fileMetadata,
			media: media,
			fields: 'id'
		}



		try {
			var res = await this.drive.files.create( resource );
		} catch(err){
			console.log(124, "Upload Small File Failed", err)
			return false;
		}

		return res;
	}
	async demo(){
		this.response.reply("Works");
	}
}