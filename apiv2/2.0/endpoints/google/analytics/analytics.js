import { Base, ResponseError } from '@base'
import Google from '../google.js'



export default class Analytics extends Google {

  constructor(){
    super();
  }

  async getAuthorizationUrl(){

  	  const scopes = ['https://www.googleapis.com/auth/analytics', 'https://www.googleapis.com/auth/userinfo.email', 'openid'];

	  const oauth2Client = this.getOAuthClient("https://app.saas-product.com/v2.0/public/callbacks/google/analytics/authorized");

	  var stateInformation = String(this.user._id);

	  console.log(20, oauth2Client);

	  try {
	  var authUrl = await oauth2Client.generateAuthUrl({
	    access_type: "offline",
	    scope: scopes,
	    prompt: "consent",
	    state: stateInformation
	  });
	} catch(err){
		console.log(30,err);
	}

  	this.response.reply({ "redirect_uri": authUrl } );

	}

  async authorize() {

  	let redirectUrl = await this.integrations.google.analytics.getAuthorizationUrl(this.user._id) 
  	this.response.reply({ "redirect_uri": redirectUrl } );

	}

}