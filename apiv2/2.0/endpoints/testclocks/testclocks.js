import { Base, ResponseError } from '@base'
import { MongoClient, ObjectId } from 'mongodb';

export default class Testclocks extends Base {

  constructor(){
    super();
  }

  async attachStripeClockCustomerToAccount(stripe_id ="", account_id ="", subscription_id =""){

  	var result = await this.database.mongo.updateOne(
      { _id: new ObjectId(account_id) }, 
      { $set: { 
        stripe_id: stripe_id,
        subscription_id: subscription_id
      } }

      , "accounts", { upsert: false });
  	this.response.reply(result);

  }

  async test(){
    
    return true;
  }

}