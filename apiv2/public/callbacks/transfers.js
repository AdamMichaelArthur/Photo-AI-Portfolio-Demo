import { Base, ResponseError } from '@base'

export default class Transfers extends Base {

	exampleData = {
		"Working":true
	}

	constructor(){
		super();
	}

	demo(){
		this.response.reply("test");
		return true;
	}

}
 