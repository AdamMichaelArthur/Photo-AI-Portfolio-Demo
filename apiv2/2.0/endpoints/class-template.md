import Base from '@base'

export default class Template extends Base {

	constructor(){
		super();
	}

	async test(){
		this.response.reply("works");
	}

	//  A catch all for all request types: will respond to GET, POST, PUT, PATCH, DELETE
	async Users(){
		this.response.reply("works");
	}

	//  Now, this endpoint will only respond if this is a POST request
	async Users(){
		this.httpVerb = "POST"
		this.response.reply("works");
	}

	//  You can also define endpoints by putting the request method before the endpoint, using camelCase

	// Responsds to POST /Users
	postUsers(){

	}

	// Responds to GET /Users
	getUsers(){

	}

	// Responds to PUT /Users
	putUsers(){

	}

	// Responds to PATCH /Users
	patchUsers(){

	}

	// Responds to DELETE /Users
	deleteUsers(){

	}

	// Routes are case sensitive
	POST /users -> returns 404
	POST /Users -> returns 200


}

