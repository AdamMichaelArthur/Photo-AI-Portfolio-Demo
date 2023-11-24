import { Base, ResponseError } from '@base'
import DocumentStandard from "@database/Mongo/document-standards.js";
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis';
import dayjs from 'dayjs';
import { MongoClient, ObjectId } from 'mongodb';

import {
  setTimeout,
  setImmediate,
  setInterval,
} from 'timers/promises';


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

export default class GoogleOAuth extends Base {

	credentials = {
	  gmail: {
	    client_id: process.env.GMAIL_OAUTH_CLIENT_ID,
	    project_id: process.env.GMAIL_PROJECT_ID,
	    auth_uri: "https://accounts.google.com/o/oauth2/auth",
	    token_uri: "https://oauth2.googleapis.com/token",
	    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
	    client_secret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
	    redirect_uris: ['https://app.saas-product.com/v2.0/public/callbacks/google/gmail/authorized']
	  }
	};

	getOAuthClient(redirect_uri){
	    try {
	
		    var oauth2Client = new OAuth2Client(
		      this.credentials.gmail.client_id,
		      this.credentials.gmail.client_secret,
		      [redirect_uri]
		    );
		  } catch(err){

		    return false;

		  }
  	return oauth2Client
	}

	async getToken(code, oauth2Client){
		    try {
      var token = await oauth2Client.getToken(code);
    } catch (err) {
      console.log(31, err);

      return false;
    }
    	return token;
	}
	

	async getAccountInfo(user_id){
		    let accountCollection = this.database.db.collection('accounts');
    let accountInfo = await accountCollection.findOne( { owner: new ObjectId(user_id) } );
    return accountInfo;
	}
	
	constructor(){
		super();
		this.auth = new google.auth.OAuth2(
		  credentials.web.client_id,
		  credentials.web.client_secret,
		  credentials.web.redirect_uris[0]
		);
	}

	// In public routes, we don't have fine-tuned control over what is sent -- so we disable some of the conveniences we have
	// for our internal routes.  We accept pretty much anything, and dump it all into the body object.

	// For example, this endpoint: /public/callbacks/google/demo/help/tryme/working/true?code=12345&mike=text
	// Will call this demo function.  
	// The body object will look like this: 
	/*
	    "help": "tryme",	// From URL parameter help
	    "working": "true",	// From URL parameter working
	    "code": "12345",	// From Query String Parameter code
	    "mike": "text",		// From Query String Parameter mike
	    "test": true,		// From the request body
	    "baby": "five"		// From the request body
    */
	demo(){
		this.response.reply(this.body);
		return true;
	}

	  async longtime(){
	    this.timeout = 15000;

	    await setTimeout(2500);

	    this.response.reply(10000);

	    return true;
	  }
	
	authorized(){

		this.response.reply("code_received");

		let token;
		if(typeof this.body.code !== 'undefined'){

			this.auth.getToken(this.body.code, (err, token) => {
			  if (err) {
			    console.error('Error retrieving access token:', err);
			    return;
			  }

			let query = { 
				"user_id": new ObjectId(this.body.state)
			}

			let update = {
				"$set": { ... token, user_id: new ObjectId(this.body.state) }
			}

			this.response.reply(update)

			this.database.mongo.updateOne(query, update, "youtube_auth_tokens", { "upsert": true } );

			});
		} else {
			// Redirect to render error
			return false;
		}
		
	}

}
 