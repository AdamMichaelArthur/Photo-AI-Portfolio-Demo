import { Base, ResponseError } from '@base'
import Billings from '@integrations/stripe/billings/billings.js'

import {
  setTimeout,
  setImmediate,
  setInterval,
} from 'timers/promises';

export default class Playground extends Base {

  constructor(){
    super();
  }

  async test(str ='', num =0, bVar =false, opt =0){
    this.response.reply("works");
    return true;
  }

  async longtime(){
    this.timeout = 5000;

    await setTimeout(15000);

    this.response.reply(10000);

    return true;
  }

  async integrationtest(str =''){

  	const billings = new Billings();
  	var result = await billings.createCreditNote("12345");

  	console.log(20, result);
  	if(result === false){
  		return this.errors.error("invalid_function_call", "Billings Returned False");
  	}

  	this.response.reply("works");
  	return true;
  }

}