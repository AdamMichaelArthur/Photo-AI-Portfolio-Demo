import Stripe from '../stripe.js'

export default class Prices extends Stripe {

  constructor(){
    super();
  }

  async createPrice(productId ="", priceDouble =0, interval ='month', currency ='usd', displayName =""){
  	//priceDouble = priceDouble.toFixed(2);
  	let priceInt = priceDouble;

  	let query = {
  	  unit_amount: priceInt,
	  product: productId,
	  currency: currency,
	  recurring: { 'interval' : interval }
  	}

	query["metadata"] = { "createdBy":"saas-product" }
	if(displayName !== ""){
		query["metadata"]["displayName"] = displayName
	}

	const price = await this.stripe.prices.create(query);
	return price;
  }

  async getPrice(priceId){
  	return await this.stripe.prices.retrieve(priceId);
  }

  async updatePrice(priceId ="", query){
  	return await this.stripe.prices.update(priceId, query );
  }

  async listPrices(){
		let prices = [];
		let hasMore = true;
		let starting_after = { }
		let query = { limit: 100, ... starting_after }
		while(hasMore){
			let results = await this.stripe.prices.list(query);
			if(results["has_more"] === false){
				hasMore = false;
			} else {
				query["starting_after"] = results.data[results.data.length - 1]["id"];
			}
			prices = results.data.concat(prices);
		}
		return prices;
  }



}