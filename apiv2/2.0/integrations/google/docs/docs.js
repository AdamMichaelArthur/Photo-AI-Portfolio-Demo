import Google from '../google.js'



export default class Docs extends Google {

  constructor(){
    super();
  }

  async getAuthorizationUrl(user_id =""){

  	  const scopes = ["https://www.googleapis.com/auth/drive", 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/documents'];

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