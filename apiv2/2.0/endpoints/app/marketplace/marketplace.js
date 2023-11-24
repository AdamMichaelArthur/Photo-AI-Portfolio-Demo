import { Base, ResponseError } from '@base'
import App from '../app.js'
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';

/*
    async hashPwd(password) {
      const saltRounds = 10;
      const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, function(err, hash) {
          if (err) reject(err)
              resolve(hash)
      });
      })
          return hashedPassword
    }
*/


export default class Marketplace extends App {

  constructor(){
    super();
  }

  /* The offers collection is considered public.  So, we will encrypt any sensitive information that may be put in it */
  async postOffer(){

    if(typeof this.body['website'] !== 'undefined'){
      this.body['website'] = await this.encrypt(this.body['website']);
    }

    if(typeof this.body['page'] !== 'undefined'){
      this.body['page'] = await this.encrypt(this.body['page']);
    }

    if(typeof this.body['domain'] !== 'undefined'){
      this.body['domain'] = await this.encrypt(this.body['domain']);
    }

    this.body['quality_approved'] = false;
    this.body['status'] = 'quality_check';

    /* We add a 20% "rake" to ensure the marketplace always has offers */
    this.body['pointsCost'] = Math.round(this.body['pointsCost'] * 1.20)

    this.database.mongo.collection = "offers";
    await this.database.mongo.insertOne(this.body);

  }

/*
db.offers.aggregate([
  {
    $match: {
      _id: ObjectId("64c508faf87a36d69c8a1099"),
      "proposals.buyer_id": ObjectId("64bbc6243482b4de832f9dec")
    }
  },
  {
    $unwind: "$proposals"
  },
  {
    $match: {
      "proposals.buyer_id": ObjectId("64bbc6243482b4de832f9dec")
    }
  },
  {
    $replaceRoot: { newRoot: "$proposals" }
  }
])
*/

  async getMyProposal(ref_doc_id =''){

    let doc_id = new ObjectId(ref_doc_id);

    var aggregate = [
      {
        "$match": {
          "_id": doc_id,
          "proposals.buyer_id": this.user._id
        }
      },
      {
        "$unwind": "$proposals"
      },
      {
        "$match": { "proposals.buyer_id": this.user._id }
      },
      {
        "$replaceRoot": { "newRoot": "$proposals" }
      }
    ]
    

    // console.log(120, aggregate)
    var collection = this.database.db.collection('offers');
    let result = await collection.aggregate(aggregate).toArray();
    this.response.reply( result );

  }

  async test(str ='', num =0, bVar =false, opt =0){
    this.response.reply("works");
    return true;
  }

  async buyItNow(id ='', created_by ='', price =0){

    if(created_by === this.user._id.toString()){
      try {
        this.errors.error(`purchase_error`, 'You cannot buy your own offer!');
      } catch(err){
        console.log(66, err)
      }
      return false;
    }
  	// Attempt to charge the credit card on file.  If none, return an error.  

  	// Confirm paymen success

 //  	this.stripe = this.integrations.stripe.stripe;

 //  	let card_id = '';
 //  	try { var paymentMethods = await this.stripe.paymentMethods.list({ customer: this.userAccount.stripe_id, type: "card", limit: 100 } ); }
 //          catch(err){ console.log(793, err); this.errors.error("stripe", err.toString()); return false; }

 //    console.log(27, paymentMethods['data'][0]);


 //  	// First, create a payment intent
 //  	const paymentIntent = await this.integrations.stripe.stripe.paymentIntents.create({
	//   amount: 2000,
	//   currency: 'usd',
	//   automatic_payment_methods: {enabled: true},
	//   payment_method: card_id
	// });

 //  	console.log(26, paymentIntent);

 	let collection = this.database.db.collection("offers");
  let update = { _id: new ObjectId(id) };
  let set = { $set: { 'available': 'escrowed', 'state': 'escrowed', 'status': 'waiting_seller', 'type': 'buyitnow',
      'statusText': 'Waiting On Seller', 'seller_id': new ObjectId(created_by), 'buyer_id': new ObjectId(this.user._id) } };

 	// Move the asset into escrow
 	try {
 		var updateResult = await collection.updateOne( update, set );
 	} catch(err){
 		console.log(46, err);
 	}

 	console.log(49, update, set, updateResult);

  	this.response.reply(price);
  }

  async buyWithPoints(id ='', created_by ='', points =0, link ='', anchor_text =''){

    if(created_by === this.user._id.toString()){
      try {
        this.errors.error(`purchase_error`, 'You cannot buy your own offer!');
      } catch(err){
        console.log(66, err)
      }
      return false;
    }

    var bHasSufficientPoints = false;

    if('undefined' !== typeof this.userAccount.points){
      if(this.userAccount.points < points ){
        bHasSufficientPoints = false;
      } else {
        bHasSufficientPoints = true;
      }
    }

    console.log(88, this.userAccount.points);
    if(false === bHasSufficientPoints){
       this.errors.error(`purchase_insufficient_points`, 'You do not have enought points to claim this offer');
       return false;
    }

    this.userAccount.disableAutomaticSave = false;
    this.user.disableAutomaticSave = false;

    const db = this.database.db;

    // Move the points into escrow
    const client = global.databaseConnection.client
    const session = await client.startSession();

    session.startTransaction();

    //const usersCollection = db.collection("users");
    const acctsCollection = db.collection("accounts");
    const offersCollection = db.collection("offers"); 

    let set = { $set: { 'available': 'escrowed', 'state': 'escrowed', 'status': 'waiting_seller', 'type': 'buywithpoints',
        'statusText': 'Waiting On Seller', 'seller_id': new ObjectId(created_by), 'buyer_id': new ObjectId(this.user._id), escrowed_points: points }, $unset: { proposals: [] } };

    let acctUpdateResult = await  acctsCollection.updateOne( { _id: this.userAccount._id }, { $inc: { points: -points } } );
    let offersUpdateResult = await  offersCollection.updateOne( { _id: new ObjectId(id) }, set );

    //console.log(100, id);

    var r = await session.commitTransaction();

    let offer = await offersCollection.findOne({ _id: new ObjectId(id) })
    console.log(206, offer, { _id: new ObjectId(id) })
    await this.notifySeller(created_by, id, `A user has purchased: ${offer.headline}`);

    await this.notifySeller(this.user._id, id, `You purchased: ${offer.headline}`);
    //this.notifySeller(created_by, id, `A user has purchased one of your offers.`);

    if(offer.category == "Link"){
      let message = `Please link to: ${link}`;
      if(anchor_text.length > 0){
        message += `.  My preferred anchor text: ${anchor_text}`
      }

      await this.message(id, 'messages', { post: message }, offer);
    }

    return true;

    // let collection = this.database.db.collection("offers");
    // let update = { _id: new ObjectId(id) };


    //  // Move the asset into escrow
    //  try {
    //    var updateResult = await collection.updateOne( update, set );
    //  } catch(err){
    //    console.log(46, err);
    //  }

    //  console.log(49, update, set, updateResult);
  }

  /*
    db.notifications.insertOne({ owner: ObjectId("64c19764a7c0f67fb6bb3de1"), user_id: ObjectId("64c19764a7c0f67fb6bb3de0"), created_by: ObjectId("64c19764a7c0f67fb6bb3de0"), modified_by: ObjectId("64c19764a7c0f67fb6bb3de0"), notification: 'This is a test' })
  */

  async notifySeller(created_by, ref_doc_id, msg){
    const notificationsCollection = db.collection("notifications");
    let document = { 
      user_id: new ObjectId(created_by), 
      created_by: new ObjectId(created_by), 
      modified_by: new ObjectId(created_by), 
      notification: msg,
      ref_doc_id: new ObjectId(ref_doc_id),
      path: 'marketplace/offer-details/id/'
    }  

    notificationsCollection.insertOne(document);
  }

  /* This indicates that a seller has completed their obligations */
  async completeSeller(){

    const db = this.database.db;

    this.user.disableAutomaticSave = false;
    this.userAccount.disableAutomaticSave = false;

    // Move the points from  escrow
    const client = global.databaseConnection.client
    const session = await client.startSession();

    session.startTransaction();

    let id = this.body._id;
    let collection = this.database.db.collection("offers");
    let update = { _id: new ObjectId(id) };

    let set = { $set: { 'available': 'escrowed', 'state': 'escrowed', 'status': 'waiting_buyer',
        'statusText': 'Waiting On Buyer' } };

     // If it's a 'buy it now' we call 'completeBuyer' to close out the transaction. 

     const { escrowed_points } = await this.getPointsInDocument(id);

     // Move the asset into escrow
     try {
       var updateResult = await collection.updateOne( update, set );
     } catch(err){
       console.log(46, err);
     }

     if(this.body.type == 'buyitnow'){
       await this.completeBuyer();
     }

     if(this.body.type == 'buywithpoints'){
       await this.completeWithPoints(id, escrowed_points);
     }

     //console.log(77, updateResult);

  }

  async getPointsInDocument(id){
    let collection = this.database.db.collection("offers");
    var points = await collection.findOne( { _id: new ObjectId(id) }, { "projection": { escrowed_points: 1, _id: 0 } } );
    return points;
  }

  async getSellerId(id){
    let collection = this.database.db.collection("offers");
    var points = await collection.findOne( { _id: new ObjectId(id) }, { "projection": { seller_id: 1, _id: 0 } } );
    return points;
  }

  async creditPoints(user_id, points){
    // Get Account ID from User ID
    let userColl = this.database.db.collection("users");
    let { accountId } = await userColl.findOne( { _id: new ObjectId(user_id ) } );

    let collection = this.database.db.collection("accounts");
    let update = { _id: accountId };
    let set = { '$inc': { 'points': points } };
    var updateResult = await collection.updateMany( update, set );
  }

  async completeWithPoints(id, escrowed_points){

    const { seller_id } = await this.getSellerId(id);
    await this.creditPoints(seller_id, 10);

    let collection = this.database.db.collection("offers");
    let update = { _id: new ObjectId(id) };
    let set = { $set: { 'available': 'complete', 'state': 'complete', 'status': 'complete', 'statusText': 'Exchange Complete', escrowed_points: 0 } };

     try {
       var updateResult = await collection.updateOne( update, set );
     } catch(err){
       console.log(46, err);
     }    
  }

  /* This indicates that a seller has completed their obligations */
  async completeBuyer(){
    let id = this.body._id;
    let collection = this.database.db.collection("offers");
    let update = { _id: new ObjectId(id) };
    let set = { $set: { 'available': 'complete', 'state': 'complete', 'status': 'complete',
        'statusText': 'Exchange Complete' } };

     // Move the asset into escrow
     try {
       var updateResult = await collection.updateOne( update, set );
     } catch(err){
       console.log(46, err);
     }

     console.log(77, updateResult);

  }

  /* Accept Proposal
     This indicates that a proposal has been accepted.  
  */
  async acceptProposal(){
    console.log(142, this.body);
    let id = this.body._id;
    let collection = this.database.db.collection("offers");
    let update = { _id: new ObjectId(id) };
    let proposal = this.body;
    delete proposal.status;
    proposal.buyer_id = new ObjectId(proposal.buyer_id);
    proposal.seller_id = new ObjectId(proposal.seller_id);
    delete proposal._id;
    delete proposal.created_by;
    delete proposal.owner;
    delete proposal.requested_by;
    delete proposal.disable_parameter_checking;

    let set = { $set: { 'available': 'escrowed', 'state': 'escrowed', 'status': 'waiting_seller', 'type':'exchange', accepted_proposal: proposal,
      'statusText': 'Waiting On Seller', 'seller_id': new ObjectId(this.user._id), 'buyer_id': new ObjectId(this.body.buyer_id), messages: [{
        from: 'sysadmin',
        date: new Date().toISOString(),
        message: 'The Seller has accepted this proposal.  In general, the Buyer goes first in terms of fulfilling their end of the bargain.  However, both parties are free to agree to different terms which should be documented here.'
      }] } };

   // // Move the asset into escrow
   try {
     var updateResult = await collection.updateOne( update, set );
   } catch(err){
     console.log(46, err);
   }

   console.log(375, updateResult)

  }


  /* Accept Proposal
     This indicates that a proposal has been accepted.  
  */
  async rejectOffer(){

    let buyer_id = new ObjectId(this.body.buyer_id);

    let collection = this.database.db.collection("offers");

    const query = { _id: new ObjectId(this.body._id), "proposals.buyer_id": buyer_id };

    console.log(389, query)

    const update = { $set: { "proposals.$.status": "rejected" } };

     try {
       var updateResult = await collection.updateOne( query, update );
     } catch(err){
       console.log(46, err);
     }

  }

  async withdrawBuyer(){

    let buyer_id = new ObjectId(this.body.buyer_id);

    let collection = this.database.db.collection("offers");

    const query = { _id: new ObjectId(this.body._id) };

    const update = { $pull: { "proposals": {buyer_id: buyer_id } } };

    console.log(408, this.body);

     try {
       var updateResult = await collection.updateOne( query, update );
     } catch(err){
       console.log(46, err);
     }

     console.log(414, updateResult);

  }

  /* Add a link to a users links */
  async addLink(link =''){
    console.log(385, link);
  }

  async message(id ='', key ='', value ={}, offer ={}){
    let _id = new ObjectId(id);
    let collection = this.database.db.collection('offers');

    const filter = { _id: _id };
    const update = { $push: { } };
    
    let bPosterIsSeller = false;

    if(this.user._id.toString() == offer.created_by.toString()){
      bPosterIsSeller = true;
    }

    console.log(396, this.user._id.toString(), offer.created_by.toString())

    if(bPosterIsSeller){
      value['poster'] = 'seller'
    } else {
      value['poster'] = 'buyer'
    }

    value["created_at"] = new Date();

    console.log(426, value);

    update['$push'][key] = value;

    const result = await collection.updateOne(filter, update);
    
  }

  async question(id ='', key ='', value ={}, offer ={}){
    let _id = new ObjectId(id);
    let collection = this.database.db.collection('offers');

    const filter = { _id: _id };
    const update = { $push: { } };
    
    let bPosterIsSeller = false;

    if(this.user._id.toString() == offer.created_by.toString()){
      bPosterIsSeller = true;
    }

    if(bPosterIsSeller){
      value['poster'] = 'seller'
    } else {
      value['poster'] = 'buyer'
    }

    value["created_at"] = new Date();

    console.log(426, value);

    update['$push'][key] = value;

    const result = await collection.updateOne(filter, update);
    
  }

  async approve(id =''){
    console.log(505, id) // status: 'quality_check'

    let _id = new ObjectId(id);
    let collection = this.database.db.collection('offers');

    const filter = { _id: _id };
    const update = { $set: { 'status': 'waiting_seller', 'quality_approved': true } };

    const result = await collection.updateOne(filter, update);

  }

  async reject(id =''){
    console.log(505, id) // status: 'quality_check'

    let _id = new ObjectId(id);
    let collection = this.database.db.collection('offers');

    const filter = { _id: _id };
    const update = { $set: { 'state': 'rejected', 'quality_approved': false, 'status': 'rejected' } };

    const result = await collection.updateOne(filter, update);

  }

}