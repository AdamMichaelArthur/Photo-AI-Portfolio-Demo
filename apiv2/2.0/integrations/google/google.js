import Base from '@base'

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
	
	constructor(initializers =null, route =null, className =null){
		if((route == null)&&(className == null)){
			super(initializers, "/integrations/google/", "google");	
		} else {
			super(initializers, route, className);
	}

	}

	async getGoogleToken(){
		var tokens = await this.database.tables.googleTokens.getAllTokens();
		return this.response.reply(tokens);
	}


}