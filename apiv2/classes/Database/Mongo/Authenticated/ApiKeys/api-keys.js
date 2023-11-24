import Authenticated from '../authenticated.js'

export default class ApiKeys extends Authenticated {

	collection = "api_keys";

	constructor(){
		super();
	}

	save(api_key){
		this.insertOne({ "api_key": api_key } );
	}

	apiKey(api_key){
		return this.insertOne({ "api_key": api_key } );
	}
	
}