import { Base, ResponseError } from '@base'
import Sysadmin from "@plans/sysadmin/sysadmin.js"

export default class Administration extends Sysadmin {

  constructor(){
  	super()
	Object.assign(this, new Base());

  }

  async listAvailableCallbacks(){

  }

  async getApiKey(){

     const apiKey = this.generateApiKey();
     this.database.apiKeys.save(apiKey);

     return this.response.reply( {api_key: apiKey } );

    return true;
  }

  async getAuthenticatedCallback(service =''){

    // Generate a new api key
    const apiKey = this.generateApiKey();

    // Save it
    this.database.apiKeys.save(apiKey)

    let base = process.env.BASE_URL;
    let version = process.env.VERSION;
    let prodPrefix = process.env.PROD_PREFIX ;
    let serviceName = process.env.SERVICE_NAME;
    var protocol = "https://";
    // Construct a callback url
    if(process.env.LOCAL === "true"){
      base = ""; version = ""; protocol = "http://"
    }


    const publicCallback = protocol + base + "/" + prodPrefix + version + serviceName + "public/callbacks/" + service + "/" + "api_key/" + apiKey 
    return this.response.reply( { "callbackUrl": publicCallback } );

  	//var newApiKey = this.generateApiKey();
  	//this.database.mongo.authenticated.apiKeys.insert(newApiKey);
  	//console.log(24, this.global);
  }

}