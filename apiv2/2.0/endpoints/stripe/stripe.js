import { Base, ResponseError } from '@base'
import stripePrototype from 'stripe';
import { MongoClient, ObjectId } from 'mongodb';
import Sysadmin from "@plans/sysadmin/sysadmin.js"
import Voca from 'voca'

setTimeout( () => {

  startWatching()

}, 5000)

function startWatching(){

const db = global.db;
const collection = db.collection("stripe_events");
const pipeline = [ { $match: { "fullDocument.type": "customer.subscription.deleted" } } ];

const changeStream = collection.watch();

changeStream.on("change", async (change) => {

  if(process.env.PREVENT_CHANGE_STREAM == "true"){
    return;
  }

  if (change.operationType === "insert") {

      const stripeEvents = await db.collection("stripe_events").findOne({ _id: change.fullDocument._id });
      if(stripeEvents["opPendng"] === true){
        return;
      }

      if(stripeEvents["opCompleted"] === true){
        return;
      }

      console.log(38, "Document insert received");
      // This prevents multiple instances from doing an operation.  We should be using findOneAnyModify, but that doesn't seem to be working
      // and I need to investigate why.
      await db.collection("stripe_events").updateOne({ _id: change.fullDocument._id }, { $set: { opPending: true, opCompleted: false } });
      // Next, we construct a Stripe object... 
      var obj = new Stripe();

      //console.log(27, obj);
      // We attach a user and an account to it
      var user = await db.collection("users").findOne({ _id: change.fullDocument.created_by } );
      var account = await db.collection("accounts").findOne( { _id: change.fullDocument.owner } );

      obj["userAccount"] = account;
      obj["database"] = global.database;
      obj["user"] = user;
      obj["db"] = db;

      console.log(57, obj["userAccount"]["_id"]);

      switch(change.fullDocument.type){

        case "customer.subscription.deleted":
          console.log("cancel");
          obj.subscriptionCancelled();
          break;

        case "invoice.paid":
          console.log(63, "paid");
          obj.invoicePaid();
          break;

        case "charge.succeeded":
          console.log(68, "charge");
          obj.creditAffiliates(change.fullDocument);
          break;
      }
    
      obj.saveUserAndAccount(obj.user, obj.userAccount);

      await db.collection("stripe_events").updateOne({ _id: change.fullDocument._id }, { $set: { opPending: false, opCompleted: true } });
    }

    

});

changeStream.on("error", (error) => {
  console.log("Change stream error:", error);
});

}

export default class Stripe extends Base {

  stripe = stripePrototype(process.env.stripe_key);

  constructor(){
    super();
  }

  async test(){
    this.response.reply("works");
    return true;
  }

  async attachPaymentMethod(paymentMethod ={}){
    const stripe = this.stripe
    paymentMethod = this.body.paymentMethod;
    try { var paymentAssociation = await stripe.paymentMethods.attach(paymentMethod.id, { customer: this.userAccount.stripe_id } ); }
      catch(err){ console.log(793, err); this.errors.error("stripe", err.toString()); return false; }
    this.response.reply({ paymentMethod: paymentMethod } );

    // Newly attached cards get automatically set as the default
    this.setPaymentMethodAsDefault(paymentMethod.id)

    console.log(113, this.userAccount.paymentMethodAttached);
    
    this.userAccount.paymentMethodAttached = true;

    return true;
  }

  async setPaymentMethodAsDefault(paymentMethodId =""){
    const paymentAssociation = await this.stripe.customers.update( this.userAccount.stripe_id, { invoice_settings: { default_payment_method: paymentMethodId } } )
    console.log(84, paymentAssociation)
    /*
          
        String(this.user._id),
        {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        }
      );
    */
  }

  async detachPaymentMethod(paymentMethodId =""){
    try { var stripeDetachedPaymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId ); }
      catch (err) { return this.errors.error("stripe", err.toString()); return false; }
    this.response.reply( {paymentMethodDetached: true } )
  }

  async getPaymentMethods(){
    try { var paymentMethods = await this.stripe.paymentMethods.list({ customer: this.userAccount.stripe_id, type: "card", limit: 100 } ); }
          catch(err){ console.log(793, err); this.errors.error("stripe", err.toString()); return false; }
    this.response.reply( {paymentMethods: paymentMethods } );

    if(paymentMethods.data.length == 0){
      this.userAccount.paymentMethodAttached = false;
    }
    
    return true;
  }

  async subscriptionCancelled(){
    // A subscription has been cancelled, downgrade the user to the "Free" plan


     
     const stripe_id = this.userAccount.stripe_id;
     const accountId = this.userAccount._id;

    console.log(147, "userAccountId", this.userAccount._id);

    console.log(149, "subscription cancelled");

    this.userAccount.plan = "free";

    this.renewPlan();

    console.log(155, "userAccountId", this.userAccount._id);
    // When a paid subscription is cancelled, we put the account into the "Free" plan

    // Figure out what the "free" plan is 
    const availablePlans = await this.database.mongo.findOne({plans: {$exists:true}}, "serializations", { projection: { plans: 1 } });

    //console.log(77, availablePlans);
    let planPriceId;
    let curPlan;
    for(let plan of availablePlans.plans){
      if(Voca.lowerCase(plan.displayName) === Voca.lowerCase("free")){
        // We've got a matching plan

        curPlan = plan;
        planPriceId = plan.prices[0]["id"];
        break;
      }
    } 

    const freePriceId = planPriceId;

    console.log(174, "userAccountId", this.userAccount._id);


     console.log(172, accountId);

     // This is done during testing only, because you can't make subscription changes during time clock advances.
         
     if(process.env.bUseStripeTestClocks == "true"){
         setTimeout( async (stripe_id, freePriceId, accountId) => { 
           
           console.log(175, stripe_id, freePriceId, accountId);

           try {
             var downgradeResult = await this.stripe.subscriptions.create({
              customer: stripe_id,
                items: [ { price: freePriceId } ],
             });

             console.log(181, downgradeResult);

             let subscriptionItems = downgradeResult['items']
             let subscriptionId = downgradeResult['id'];

             console.log(201, subscriptionItems, subscriptionId);

             // The automatic save won't work in the context of a detached timer like this, so we perform the update operation manually.
             let updateResult = await this.database.mongo.db.collection('accounts').updateOne( { _id: accountId }, { $set: { subscription_id: subscriptionId, subscription_items: subscriptionItems['data'] } } );

             console.log(205, { _id: accountId }, { $set: { subscription_id: subscriptionId, subscription_items: subscriptionItems['data'] } } );
             console.log(206, updateResult);

           } catch(err){
             console.log(105, err);
           }

       }, 45000, stripe_id, freePriceId, accountId)
      } else {
        // Perform the operation immediately if we're not using test clocks
        try {
             await this.stripe.subscriptions.create({
              customer: stripe_id,
                items: [ { price: freePriceId } ],
             });
           } catch(err){
             console.log(105, err);
        }

           //this.database.mongo.db.collection('accounts').updateOne( { _id: accountId }, { $set: { subscription_id: "12345", subscription_items: [] } } );
      }

    //this.response.reply("Cancellation Successfull");
    return true;
  }

  /* A plan is renewed! Reset resource restrictions here */
  async renewPlan(){

    
    this.userAccount.subscriptionChanges = 0;
    this.userAccount.subscriptionStatus = '';
    let accountId = this.userAccount._id;
    
    console.log(190, "Plan Renewed", accountId);
    let query = { "account_id": new ObjectId(accountId)  };
    let update = [ { $addFields: { remaining: "$reset" } } ]

    var resultA = await this.database.mongo.db.collection("access_records").updateMany(query, update);
    var resultB = await this.database.mongo.db.collection("class_access_records").updateMany(query, update);

  }

  async invoicePaid(){
    // A subscription has been renewed
    console.log(85, "Renew subscription", this.userAccount._id);
    this.renewPlan();
    this.response.reply("Subscription Renewed");
    return true;
  }

  /* https://stripe.com/docs/connect/charges-transfers

     We use Stripe Connect to track and pay our affiliates.  When we receive a successful payment, a portion of that
     may go to an affiliate partner. 

    created_by: new ObjectId("6486d1d9012ff6f4abc7b0b5"),
    modified_by: new ObjectId("6486d1d9012ff6f4abc7b0b5"),
    owner: new ObjectId("6486d1d9012ff6f4abc7b0b6"),

  */

  async creditAffiliates(chargeSucceededDocument){


    let db = this.db;
    const usersCollection = db.collection("users");
    const acctsCollection = db.collection("accounts");
    const affiliateClaimedDomains = db.collection("affiliateClaimedDomains");
    const stripeEvents = db.collection("stripe_events");



    // First, there is a low, but statistically significant, possibility this function will be called multiple times.  
    // We need to ensure that there are no pending creditAffiliates operations going on.  To accomplish this, we will
    // an optimistic locking approach.  Also, if multiple instances of the service are running, this would cause a racing scenario
    // so to account for this, we perform an initial findAnyModify
    try {
      var chargeDocument = await stripeEvents.findOne( { "_id": chargeSucceededDocument["_id"] });
    } catch(err){
      console.log(198, err);
    }

    // First, there is a low, but statistically significant, possibility this function will be called multiple times.  
    // We need to ensure that there are no pending creditAffiliates operations going on.  To accomplish this, we will
    // an optimistic locking approach.  

    // We have a pending credit operation underway.  Reject this duplicate attempt.
    if(chargeDocument["pending_credit_operation"] === true){
      return false;
    }

    // If this is true, we've already given credit to the affiliate.  
    if(chargeDocument['affiliate_credited'] === true){
      return false;
    }

    // "pending_credit_operation" : true, "affiliate_credited": false should only happen 
    await stripeEvents.updateOne( { "_id": chargeSucceededDocument["_id"] }, { $set: { "pending_credit_operation" : true, "affiliate_credited": false } } );

    // Step 1 -- determine if this transaction is associated with an affiliate account.  
    try {
      var accountDoc = await acctsCollection.findOne({ _id: chargeSucceededDocument.owner } )
    } catch(err){
      console.log(186, "Unable to retrieve a document", err);
      //return false;
    }

    // Step 2 -- determine if this account was created with an affiliate referral
    if(accountDoc['affiliate-referral'] === 'undefined'){
      // This account is not associated with an affiliates domain.  We return and do nothing
      await stripeEvents.updateOne( { "_id": chargeSucceededDocument["_id"] }, { $set: { "pending_credit_operation" : false, "affiliate_credited": false, "failure_reason": "This account does not have an affiliate referral associated with it." } } );
      return false;
    }

    // Step 3 -- determine the affiliate account associated with this domain 
    try {
      var claimedDomains = await affiliateClaimedDomains.find({ domain: accountDoc["affiliate-referral"] } ).toArray();
    } catch(err){
      await stripeEvents.updateOne( { "_id": chargeSucceededDocument["_id"] }, { $set: { "pending_credit_operation" : false, "affiliate_credited": false, "failure_reason": "No claimed domains were found that match a registered domain and affiliate." } } );
      console.log(205, "Unable to find claimed domains for this affiliate", err);
      return false;
    }

    if(claimedDomains.length == 0){
      console.log(210, "No Claimed Domains");
      await stripeEvents.updateOne( { "_id": chargeSucceededDocument["_id"] }, { $set: { "pending_credit_operation" : false, "affiliate_credited": false, "failure_reason": "No claimed domains were found" } } );
      return false;
    }

    // Step 4 -- Determine the account of the claimed domain
    try {
      var destinationAccount = await acctsCollection.findOne({ _id: claimedDomains[0]["owner"] } ); 
    } catch(err){
      console.log(218, "Unable to retrieve an account for the claimed domain.  Really shouldn't get here unless DB records have been deleted");
      await stripeEvents.updateOne( { "_id": chargeSucceededDocument["_id"] }, { $set: { "pending_credit_operation" : false, "affiliate_credited": false, "failure_reason": "Unable to retrieve an account for the claimed domain." } } );
      return false;
    }

    // Step 5 -- Get the Stripe destination account number
    let stripeConnectedAccount = destinationAccount["stripeConnectedAccount"]["id"];
    if(typeof stripeConnectedAccount === 'undefined'){
      console.log(225, "Unable to retrieve a connected account id");
      await stripeEvents.updateOne( { "_id": chargeSucceededDocument["_id"] }, { $set: { "pending_credit_operation" : false, "affiliate_credited": false, "failure_reason": "Unable to retrieve a connected account id." } } );
      return false;
    }

    // Step 6 -- Verify the connected account is properly setup....
    // Skipping for now. 

    // Step 7 -- Identify our source transaction.
    const source_transaction = chargeSucceededDocument["data"]["object"]["id"];

    // Step 8 -- Determine the commission ammount

    // Step 9 -- Make the transfer
    const stripe = this.stripe;

    try {
      var transfer = await stripe.transfers.create({
        amount: 1000,
        currency: 'usd',
        source_transaction: source_transaction,
        destination: stripeConnectedAccount,
      });
    } catch(err){
      console.log(191, "We received a successful charge, and we tried to credit the affiliate but it failed")
      await stripeEvents.updateOne( { "_id": chargeSucceededDocument["_id"] }, { $set: { "pending_credit_operation" : false, "affiliate_credited": false, "failure_reason": "An error was encountered when we tried to credit the affiliates Stripe Connect account." } } );
      console.log(192, err);
      return false;
    }

    console.log(253, "Successfully credited affiliate");

    // "unlock" the document
    await stripeEvents.updateOne( { "_id": chargeSucceededDocument["_id"] }, { $set: { "pending_credit_operation" : false, "affiliate_credited": true } } );

    // Post a notification to the affiliate account owner
    //notifications

    // destinationAccount
    const notifications = db.collection("notifications");
    console.log(324, this.db, notifications)
    let insertResult = await notifications.insertOne({
      owner: destinationAccount.owner,
      created_by: destinationAccount.owner,
      message: 'This is a test'
    });

    console.log(323, notifications);

    return true;
  }


  // When a new account is created, we simultaneously create a customer in stripe.  This customer id is the id that we use to
  // tie stripe events with accounts.  We consider the "account" to be the "customer", which is distinct from the user.  Many, 
  // if not most, accounts will only ever have one account and one user.
  async createCustomer(email ="", firstName ="", lastName =""){
    try {
      await this.stripe.customers.create({
          name: `${firstName} ${lastName}`,
          email: email,
          metadata: {
            account_id: this.user.accountId
          }
        });
    } catch(err){
      return false;
    }
    return true;
  }

  // customer.subscription.deleted
  subscriptionPermanentlyCancelled(){

    // Mpve the user to the 'Free' plan

  }

  // The user has renewed their subscription
  subscriptionRenewed(){
    // Initiate a plan renewal
  }

  async events(){

  	switch(this.event){

  		case "event1":
  			break;

  		case "event2":
  			break;
  	}
  }

  addCard(){

    this.response.reply({
      notice: "This endpoint is intended to be used during development / testing only.  In order to add a payment method, we use Stripe Elements, which ensures our solution is PCI Compliant.  But, you have to use a browser interface to add this.  The URL endpoint will open up a static and locally servied html file.  From here, we can enter a test card.  We will be notified of successful card adds through webhooks",
      url: "http://localhost:4200/assets/stripe/test.html"
    })

    return true;
  }

  async createPaymentIntent(){

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: 0,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        }
      });
      this.response.reply({ "payment_intent" : paymentIntent } );
      return true;
  }

  /*   This is intended to be used during testing.  In production, we don't want credit card numbers going through our solution,
       to minimize our exposure to sensitive information.
  */
  
async getDefaultPaymentMethods(){
  const customerInfo = await this.stripe.customers.retrieve(this.userAccount.stripe_id);
  console.log(214, "customerInfo");
  this.response.reply(customerInfo)
  return true;      
}

async getActiveSubscriptions(){
  const customerSubscriptions = await this.stripe.subscriptions.list( { customer: this.userAccount.stripe_id });
  this.response.reply( customerSubscriptions.data );
  return true;      
}

  async addPaymentMethod(){

  }

}

Stripe.listen("insert", "delete", "update", "webhook", "datetime");

/*

These are the scenarios we need to handle:

customer.subscription.deleted: Occurs whenever a customer’s subscription ends.

subscription_schedule.aborted: Occurs whenever a subscription schedule is canceled due to the underlying subscription being canceled because of delinquency.


invoice.upcoming

customer.subscription.trial_will_end

invoice.paid

customer.subscription.deleted

customer.subscription.created

customer.subscription.paused

customer.subscription.trial_will_end

customer.subscription.updated

payment_intent.created

customer.updated

charge.succeeded

payment_intent.succeeded

invoice.finalized


*/