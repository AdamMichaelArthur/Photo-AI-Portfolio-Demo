import { Base, ResponseError } from '@base'
import Main from '../main.js'
import DocumentStandard from "@database/Mongo/document-standards.js";

export default class User extends Main {

  constructor(){
    super();
  }

  async test(str ='', num =0, bVar =false, opt =0){
    this.response.reply("works");
    return true;
  }

  async saveOpenAIAPIKey(openAIAPIKey =''){

  	let collection = this.database.db.collection("integrationopenai");
  	let document = {
  		apiKey: openAIAPIKey
  	}

  	var doc = new DocumentStandard(this.user, document).getStandardDocument();
  	doc.accessLevel = "system";

  	let query = { created_by: this.user._id }
  	let update = { $set: doc }
  	let options = { "upsert": true }

	try {
		var result = await collection.updateOne(query, update, options )
	} catch(err){

	}

  	this.response.reply( { "api_key": openAIAPIKey } );
  }

  async getOpenAIAPIKey(){
  	let collection = this.database.db.collection("integrationopenai");
  	let query = { created_by: this.user._id }
	try {
		var result = await collection.findOne(query)
	} catch(err){

	}  	
	this.response.reply({ api_key: result.apiKey });

  }


}