import { Base, ResponseError } from '@base'
import AvailablePlans from "@plans/plans.js"
import Voca from "voca";

export default class Plans extends Base {

  constructor(){
    super();
  }

  async getCurrentPlan(){
  	return this.response.reply( { current_plan: this.userAccount.plan } );
  }

  async getPlans(){
  	var availablePlans = new AvailablePlans();
    Object.assign(availablePlans, this);
  	return this.response.reply( { plans: await availablePlans.getPlans() , "userAccount": this.userAccount });
  }

  async changePlan(planFrom ='', planTo ='', prorationPolicy ='', frequency =''){
    
    console.log(23, "Change Plan", planFrom, planTo);

    // This gets a reference to the official Stripe SDK "stripe" object
    const stripe = this.integrations.stripe.stripe;
    const stripeCustomerId = this.userAccount.stripe_id;
    const stripePriceId = this.userAccount.price_id;
    const stripeSubscriptionId = this.userAccount.subscription_id;
    var subscriptionItems = this.userAccount.subscription_items;

    if(planTo === 'sysadmin'){
      //return this.errors.error("security", "You are not allowed to switch to this plan");
    }

    if(this.userAccount.plan === planTo){
      return this.errors.error("error", "You are already on this plan");
    }

    if(Voca.lowerCase(planTo) === "free"){
      // cancel_at_period_end
      // Cancel the current subscription at the end of the billing period
      // Add a free plan that starts immediately
        this.userAccount.subscriptionStatus = "Downgrades to free at the end of the current billing cycle";
        const subscription = await stripe.subscriptions.update( stripeSubscriptionId, { cancel_at_period_end: true } );
        console.log(46, this.userAccount);

/*
  cancel_at: 1699895262,
  cancel_at_period_end: true,
  canceled_at: 1697821662,
  cancellation_details: { comment: null, feedback: null, reason: 'cancellation_requested' },
  collection_method: 'charge_automatically',
  created: 1686676062,
  currency: 'usd',
  current_period_end: 1699895262,
  current_period_start: 1697216862,
*/
        this.userAccount.cancel_at = subscription.cancel_at;
        this.userAccount.current_period_end = subscription.current_period_end;
        this.userAccount.current_period_start = subscription.current_period_start;

        const cancelAt = new Date(subscription.cancel_at * 1000); // Multiply by 1000 to convert from seconds to milliseconds
        const cancelAtString = cancelAt.toDateString();
        this.userAccount.cancelNotification = `Your subscription will switch to the Free plan on ${cancelAtString}`
        this.userAccount.cancelAtString = cancelAtString;

        this.response.reply(`Your subscription will switch to the Free plan on ${cancelAtString}`);
        return true;
      /* 
              
          'sub_49ty4767H20z6a',
          {
            cancel_at_period_end: true,
          }
        );
      */
    }

    if(this.userAccount.subscriptionChanges >= 1){
      return this.errors.error("error", "To prevent duplicate and over-charging, paid plans can only be changed once per month.  You can downgrade to the free plan anytime"); 
    }

    // Verify that the plan is a valid plan 

  	

    // Step 1 -- get the current subscription 
    //console.log(this.integrations.stripe);

    /* Notes 5/31/2023

    The roadmap is to use the build-in integrations to handle stripe.  But, I'm going to grab the stripe object
    and interact directly with the stripe API here, so that I can get this functionality prototyped fasted.


    */

    // We've got a customer id and we should have a price_id 

    if(typeof this.userAccount.price_id === 'undefined'){
      return this.errors.error("subscription", "No subscription price is registered with this user.  This is probably a legacy account from the v1.0 api.  Attach a subscription and a price, and try again.")
    }

    if(typeof this.userAccount.stripe_id === 'undefined'){
      return this.errors.error("subscription", "No stripe customer id is registered with this user.  This is probably a legacy account from the v1.0 api.  Attach a customer id, and try again.")
    }


    if(typeof this.userAccount.subscription_id === 'undefined'){
      return this.errors.error("subscription", "No id is registered with this user.  This is probably a legacy account from the v1.0 api.  Attach a subscription, and try again.")
    }

    if(!Array.isArray(this.userAccount.subscription_items)){
      return this.errors.error("subscription", "No subscription items are associated with this user.  This is probably a legacy account from the v1.0 api.  Attach a subscription, and try again.")
    }




    var items = [

    ];

    // Ok, we need to get the price_id of the plan the user is switching to. 
    // Let's grab our plans
    // db.serializations.find({plans: {$exists:true}}, { plans:1 }).count()
    const availablePlans = await this.database.mongo.findOne({plans: {$exists:true}}, "serializations", { projection: { plans: 1 } });

    //console.log(77, availablePlans);
    let planPriceId;
    let curPlan;
    for(let plan of availablePlans.plans){
      if(Voca.lowerCase(plan.displayName) === Voca.lowerCase(planTo)){
        // We've got a matching plan

        curPlan = plan;
        planPriceId = plan.prices[0]["id"];
        break;
      }
    } 

   // return this.errors.error("subscriptions", `Unable to change plans because of an error: ${err.raw.message}`);
    /* Intended Behavior:
        An update gets charged immediately, a pro-rated amount.
        A downgrade cancels the existing subscription at the end of the billing period
          and charges the customer the lower-tiered price the next billing period



    */

    // This causes any existing subscription items to be deleted.
    for(let item of subscriptionItems){
      items.push({
        id: item.id,
        deleted: true
      })
    }

    // This adds a new plan with pricing
    items.push({
      price: planPriceId,
    })

    try {
    var subscription = await stripe.subscriptions.update(
      stripeSubscriptionId, {items: items, proration_behavior: "always_invoice" } );   
    } catch(err){
      return this.errors.error("subscriptions", `Unable to change plans because of an error: ${err.raw.message}`);
    }    

    this.userAccount.price_id = planPriceId;
    this.userAccount.subscription_items = subscription.items.data;
    this.userAccount.plan = planTo;
    if(typeof this.userAccount.subscriptionChanges === 'undefined'){
      this.userAccount.subscriptionChanges = 0;  
    }
    this.userAccount.subscriptionChanges++;

    this.response.reply(`You are now on the ${curPlan.displayName} Plan`)
  }

}