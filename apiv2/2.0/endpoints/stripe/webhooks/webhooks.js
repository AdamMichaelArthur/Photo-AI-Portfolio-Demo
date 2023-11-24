import { Base, ResponseError } from '@base'
import Stripe from '../stripe.js'
import Sysadmin from '@plans/sysadmin/sysadmin.js'

export default class Webhooks extends Sysadmin {

  constructor(){
    super();
    Object.assign(this, new Stripe());
  }

  async test(){

  	this.myVariable = "Works?";

  	this.test.httpVerb = "GET";

    this.response.reply("works");
    return true;
  }


  async nextcheck(){
  	this.response.reply("ok");
  	
  }
}