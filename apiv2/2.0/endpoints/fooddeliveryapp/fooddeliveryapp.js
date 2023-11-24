import { Base, ResponseError } from '@base'
import DocumentStandard from "@database/Mongo/document-standards.js";

export default class Fooddeliveryapp extends Base {

  constructor(){
    super();
  }

  async getApiKey(){
        /* Note -- the roadmap is to completely reconsider how we interact with the database */
        const apiKey = this.generateApiKey();
        var doc = new DocumentStandard(this.user, {api_key: apiKey}).getStandardDocument();
        this.database.collection = "api_keys";
        await this.database.insertOne({api_key: apiKey})
        return this.response.reply( {api_key: apiKey} );
  }

  async listApiKeys(){
    return this.response.reply( "works");
  }

  async list(){

    console.log(21, this.user); 
    //let results = await this.database.findOne({ owner: this.user["_id"] }, 'api_keys',  {})

    var doc = new DocumentStandard(this.user, {}).getStandardDocument();
    return this.response.reply( doc );
  }

}