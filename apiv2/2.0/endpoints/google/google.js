import Base from '@base'

import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis';
import dayjs from 'dayjs';
import { MongoClient, ObjectId } from 'mongodb';

export default class Google extends Base {

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
	
	constructor(){
		super();
	}

	youtube(){
		this.response.reply("works");
		return true;
	}

	test(){
		this.response.reply("works");
		return true;
	}

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

	async getToken(code){
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
	
}