
const fs = require('fs');
const {google} = require('googleapis');
const TOKEN_PATH = 'api/classes/integrations/google/token.json';
const voca = require("voca");
const util = require("util");

var Readable = require('stream').Readable; 

function bufferToStream(buffer) { 
  var stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
}

module.exports = class GoogleDrive {

	oAuthClient = null;
	drive = null;
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
		this.drive = google.drive({version: 'v3', auth});
	}

	/*	Changes a Drive File so that anyone with the link can open the file
	 *	@param fileId	The fileId of the drive item
	 *
	 *
	*/
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

	/*	Syncronizes our local folders with Google Drive 
	 *
	 *	Read the files at the directory path
	 *	If the files are a .docx or .xlsx file, it uploads them to Google Drive
	 *	Returns an array of the filenames that were uploaded
	*/
        async syncLocalDocumentsWithDrive(path){

        // Need to check against existing files to make sure we don't create duplicates.
                var filesUploaded = [];
                if(voca.endsWith(path, "/")){
                        path = voca.slice(path, 0, path.length-1)
                }

                  // .docx mime type application/vnd.openxmlformats-officedocument.wordprocessingml.document
                  // .xlsx mime time application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
                  var files = fs.readdirSync(path);

                  for(var file of files){
                                var mimetype = null;

                                if((file.indexOf(".docx") != -1)){
                                        mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                }

                                if((file.indexOf(".xlsx") != -1)){
                                    mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                }

                                if((file.indexOf(".txt") != -1)){
                                	mimetype = "text/plain"
                                }

                                if(mimetype != null){
                                        var buffer = fs.readFileSync(path + "/" + file);
                                        try {
                                                var res = await this.uploadSmallFile(buffer, file, mimetype);
                                                } catch(err){
                                                        console.log(82, err);
                                                }
                                                filesUploaded.push({ "filename": file, "id": res.data.id } )
												await new Promise(resolve => setTimeout(resolve, 1000));
                                                await this.updatePermissions(res.data.id);
                                        }
                                }

                    return filesUploaded;
        }

    // // First let's check out paths
    // console.log(1023, local_folder_path, box_folder);

    // var fullLocalPath = process.env.BASE_DIR + local_folder_path + "/";

    // console.log(1027, fullLocalPath);

    // //First, check and see if the local_folder_path exists on this device
    // var bLocalPathExists = fs.existsSync(fullLocalPath);

    // if(bLocalPathExists == false){
    //   // We need to create the local directory.  This is mostly for local testing -- it should already exist on the server
    //   var res = fs.mkdirSync(fullLocalPath, { recursive: true });
    //   console.log(1033, "Creating", fullLocalPath);
    // }

    // //  var localPath = localFolder + "/" + body.source.name.replace(/[^a-z0-9-.]/gi, '_').toLowerCase();
    // // Get all of the files in the directory
    // var allFiles = await this.listAll(box_folder);
    // //console.log(1041, allFiles);

    // for(const file of allFiles){
    //   var urlFriendlyFilename = file.name.replace(/[^a-z0-9-.]/gi, '_').toLowerCase();
    //   var fullLocalFilePath = fullLocalPath + urlFriendlyFilename;
    //   console.log(1046, fullLocalFilePath);
    //   if(!fs.existsSync(fullLocalFilePath)){
    //     console.log('The files', fullLocalFilePath, 'does not exist on this device');
    //     console.log("Downloading...", file.id)
    //     await this.downloadFile(file.id, fullLocalFilePath)
    //     console.log("Download Complete");
    //   }
    // }

  //}

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

	async createFile(){
	}

	/*	Uploads Files That Are 5mb or less
	 *	@param buffer
	 *	@param filename
	 *	@param filetype
	*/
	async uploadSmallFile(buffer, filename, filetype){
		
		var fileMetadata = { name: filename }
		var media = {
  			mimeType: filetype,
  			body: bufferToStream(buffer)
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

	/*	Uploads a new version of the file
	 *	@param fileId
	 *	@param buffer
	 *	@param filename
	 *	@param filetype
	*/
	async updateSmallFile(fileId, buffer, filetype){

		var media = {
  			mimeType: filetype,
  			body: bufferToStream(buffer)
		};

		const resource = {
			fileId: fileId,
			media: media
		}

		//console.log(240, util.inspect(resource, false, null, true /* enable colors */))

		try {
			var res = await this.drive.files.update( resource );
		} catch(err){
			console.log(242, "Upload Small File Failed", err)
			return false;
		}

		return res;
	}

	resumeableUpload(){

	}

	createFolder(){

	}

	downloadFile(){

	}

	changePermission(){

	}

	async updateTitle(fileId, newTitle) {
	  const requestBody = {
	    name: newTitle
	  };

	  const params = {
	    fileId: fileId,
	    resource: requestBody
	  };

	  console.log(287, params);
	  
	  try {
	    const response = await this.drive.files.update(params);
	    console.log('File title updated:', response.data.name);
	  } catch (error) {
	    console.error('Error updating file title:', error);
	  }
	}

}