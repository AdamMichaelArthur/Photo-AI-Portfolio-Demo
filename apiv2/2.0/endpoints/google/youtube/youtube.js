import Base from '@base'

import { google } from 'googleapis';

// These are app credentials
const credentials = {
  "web":{
    "client_id":"1002938566232-prjrbjktklhdmq7ocrgnl8d65hctluf7.apps.googleusercontent.com",
    "project_id":"adamsapi",
    "auth_uri":"https://accounts.google.com/o/oauth2/auth",
    "token_uri":"https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
    "client_secret":"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",
    "redirect_uris":["https://app.contentbounty.com/v2.0/api/public/callbacks/google/authorized"]
  }
}

export default class Youtube extends Base {

	scope = 'https://www.googleapis.com/auth/youtube.upload';

	constructor(){
		super();
		this.auth = new google.auth.OAuth2(
		  credentials.web.client_id,
		  credentials.web.client_secret,
		  credentials.web.redirect_uris[0]
		);
	}

	/* Initiate an authorization flow for YouTube */
	initiateAuthorizationFlow(){

		var authorizeUrl;
		try {
	authorizeUrl = this.auth.generateAuthUrl({
		  access_type: 'offline',
		  scope: this.scope,
		  state: this.user._id.toString()
	}); } catch(err){
		console.log(37, err);
	}
	
	this.response.reply(authorizeUrl);
	}

	/* */
	

}