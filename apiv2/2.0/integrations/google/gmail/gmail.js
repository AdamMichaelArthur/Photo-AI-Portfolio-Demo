import Google from '../google.js'
import { GoogleAuth } from "google-auth-library";
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library'

/* note: these credentials were created under the adam@inbrain.space email */
var credentials = {

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

export default class Gmail extends Google {

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

  async getProfile(token){

    var oauth2Client = new OAuth2Client(
      this.credentials.gmail.client_id,
      this.credentials.gmail.client_secret,
      this.credentials.gmail.redirect_uris[0]
    );

    oauth2Client.setCredentials(token);

    const oauth2 = await google.oauth2({
        auth: oauth2Client,
        version: 'v2'
      });

    try {
      var profile = await oauth2.userinfo.get();
    } catch(err){
      console.log(32, err);
      return false;
    }

    return profile.data;

  }

  async getAuthorizationUrl(user_id =""){

  	  const scopes = ["https://mail.google.com/", 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/userinfo.email'];

	  const oauth2Client = new OAuth2Client(
	    this.credentials.gmail.client_id,
	    this.credentials.gmail.client_secret,
	    this.credentials.gmail.redirect_uris[0]
	  );

	  var stateInformation = String(user_id);

	  const authUrl = await oauth2Client.generateAuthUrl({
	    access_type: "offline",
	    scope: scopes,
	    prompt: "consent",
	    state: stateInformation
	  });

	  return authUrl;

	}
  
}