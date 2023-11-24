import { Base, ResponseError } from '@base'
import Google from '../google.js'



export default class Docs extends Google {

  constructor(){
    super();
  }

  async getAuthorizationUrl(){

	  const scopes = ["https://www.googleapis.com/auth/drive", 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/userinfo.email', 'openid'];

	  const oauth2Client = this.getOAuthClient("https://app.saas-product.com/v2.0/public/callbacks/google/docs/authorized");

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

}