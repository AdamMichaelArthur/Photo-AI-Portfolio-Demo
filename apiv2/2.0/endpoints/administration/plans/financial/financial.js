import { Base, ResponseError } from '@base'
import Plans from '../plans.js'

export default class Financial extends Plans {

  constructor(){
    super();
  }

  async test(){

	const product = await this.integrations.stripe.products.createProduct("My Test Product", "My Great Plan");
	var price = await this.integrations.stripe.prices.createPrice(product["id"], 350, 'month', 'usd');
	return this.response.reply( { "product": product, "price": price } )	
	
  }


}