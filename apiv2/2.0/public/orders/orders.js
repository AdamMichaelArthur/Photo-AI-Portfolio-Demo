import { Base, ResponseError } from '@base'
import * as util from "util";

export default class Listings extends Base {

	constructor(){
		super();
	}

	async placePendingOrder(){
		console.log(135, util.inspect(this.body, false, null, true /* enable colors */));

		let orders = this.database.db.collection('orders');
		this.body["orderAccepted"] = false;
		for(var foodItem of this.body.foodItems){
			foodItem["display_price"] = "";
		}
		orders.insertOne(this.body);
	}

}