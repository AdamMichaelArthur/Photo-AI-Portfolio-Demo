import Stripe from '../stripe.js'

export default class Core extends Stripe {

  constructor(){
    super();
  }

  async getBalance(){
  	return await this.stripe.balance.retrieve();
  }
}