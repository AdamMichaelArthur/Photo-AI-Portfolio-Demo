import { Base, ResponseError, Optional } from '@base'
import Integrations from '../integrations.js'
import stripePackage from 'stripe';
import util from "util";

import {
  setTimeout,
  setImmediate,
  setInterval,
} from 'timers/promises';

const stripe_key = process.env.stripe_key
const stripe = stripePackage(stripe_key);

export default class Stripe extends Integrations {

  constructor(){
    super();
    this.stripe = stripe;
  }

  // This is used to automatically sync our plans on stripe
  async syncPlans(planObjectId ={}, requestSession){

  	let plansAr = requestSession.plans;
  	await setTimeout(2000);

  	this.integrations = {}
  	Object.assign(this.integrations, requestSession.integrations)
  	this.requestSession = requestSession;
  	var numPlans = 0;
  	if(plansAr.length > 0){
  	for(var plan of plansAr){
  		await this.syncPlan(plan)
  		numPlans = numPlans + plan.prices.length;
  		//plan.prices = [];
  	}
  	}


  	 var pObj = { ... requestSession }
  	 var rsDoc = requestSession.removeObjects(pObj);
  	 requestSession.serializeObj(requestSession.classQuery, rsDoc, requestSession.database);
    }

  async syncPlan(plan){


  	let productId = plan["productId"];

  	if(typeof productId === 'undefined'){
  		// Every plan is represented by a "stripe product" which has a "productId"
      console.log(53, "Creating Product", plan.displayName);
  		productId = await this.integrations.stripe.products.createProduct(plan.displayName);
  		plan["productId"] = productId;
  	}

  	var bIsValidPriceArray = false;
  	if(Array.isArray(plan.prices)){
  		if(plan.prices.length > 0){
  			bIsValidPriceArray = true;
  		}
  	}

  	if(!bIsValidPriceArray){
  		console.log(62, "Creating plans");
  		await this.createPlanPrices(plan, productId["id"], plan.displayName);
  	} else {
  		console.log(63, "Updating plans");
  		await this.updatePlanPrices(plan, productId["id"], plan.displayName);
  	}

  }

  async createPlanPrices(plan, productId, displayName){
  	plan.prices = [];
  	for(var frequency of plan.allowedFrequencies){
  		// For every frequency, we have a price
  		var frequencyPrice = plan["frequencyCosts"][frequency];

      // Javascript doesn't have great type checking.  This probably isn't necessary, but I'm doing it just in case.  
      frequencyPrice = Number(frequencyPrice.toFixed(2))

      // Multiple by 100.  Stripe measures plans in the lowest currency unit.  We define them in our classes in decimal format.  
      frequencyPrice = frequencyPrice * 100;

      console.log(86, frequencyPrice);

  		var price = await this.integrations.stripe.prices.createPrice(productId, frequencyPrice, frequency, plan.currency, displayName);
  		plan.prices.push(price);
  	}

  }

	async updatePlanPrices(plan, productId, displayName){

	  	// Iterate through plan prices
	  	for(let planPrice of plan.prices){
	  		// Get the remote price of this planPrice object
	  		try {
	  			var { unit_amount } = await this.integrations.stripe.prices.getPrice(planPrice["id"]);
	  		} catch(err){
	  			var unit_amount = -1;
	  		}

	  		//console.log(96, unit_amount, planPrice["unit_amount"]);

	  		if(unit_amount === planPrice["unit_amount"]){
	  			// The remote price and the local price match.  In this condition, we do nothing as there has been no price change.
	  			continue;
	  		}

	  		
	  		const new_unit_amount = planPrice["unit_amount"];
	  		console.log(100, "Price mismatch detected", productId, new_unit_amount, plan.frequency, plan.currency);
	  		//planPrice["id"] = "don't understand";
        if(typeof plan.frequency === 'undefined'){
          plan.frequency = month;
        }
        
        try {
	  		  var tmpPlanPrice = await this.integrations.stripe.prices.createPrice(productId, new_unit_amount, plan.frequency, plan.currency, displayName);
        } catch(err){
          console.log(121, err)
        }
	  		
	  		// Setting planPrice = tmpPlanPrice won't work -- because planPrice is a reference and tmpPlanPrice is a new object.  
	  		// If we overrwrite that reference, it won't serialize when we need it to.  So, instead, we iterate through each
	  		// key and set them individually. 

	  		for(let key of Object.keys(tmpPlanPrice)){
	  			planPrice[key] = tmpPlanPrice[key];
	  		}


	  	}
	}

  
}

export { Stripe as Stripe, Optional as Optional }