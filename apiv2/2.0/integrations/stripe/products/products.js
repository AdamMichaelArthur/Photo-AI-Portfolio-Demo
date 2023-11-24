import Stripe from '../stripe.js'

export default class Products extends Stripe {

  constructor(){
    super();
  }

	async createProduct(name ="", description =""){
		var query = { name: name };
		if(description !== ""){
			query["description"] = description;
		}
		if(name === ""){
			return false;
		}
		query["metadata"] = {
			"createdBy":"saas-product-2",
			"name": name,
			"description": description
		}
  		return await this.stripe.products.create(query);
	}

	async getProduct(productId =""){
		return await this.stripe.products.retrieve(productId);
	}

	async updateProduct(productId ="", name ="", priceId ="", description =""){
		var update = {}
		if(name !== "") { update["name"] = name }
		if(priceId !== "") { update["default_price"] = priceId }
		if(description !== "") { update["description"] = description }
		return await this.stripe.products.update(productId, update);
	}

	async getAllProducts(){
		let products = [];
		let hasMore = true;
		let starting_after = { }
		let query = { limit: 100, ... starting_after }
		while(hasMore){
			let results = await this.stripe.products.list(query);
			if(results["has_more"] === false){
				hasMore = false;
			} else {
				query["starting_after"] = results.data[results.data.length - 1]["id"];
			}
			products = results.data.concat(products);
		}
		return products;
	}

	async deleteProduct(productId){
		return await this.stripe.products.del(productId);
	}

}