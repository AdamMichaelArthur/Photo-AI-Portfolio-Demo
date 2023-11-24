import { Base, ResponseError } from '@base'
import axios from 'axios';
import { MongoClient, ObjectId } from 'mongodb';

export default class Analytics extends Base {

	constructor(){
		super();
	}

	click(action ='', msg =''){

		this.notifySlack(msg);

		return true;
	}

	async notifySlack(msg, ts =null){

	  	let payload = {
		    "channel":"C05P9RYBZ6K",
		    "text":msg
	  	}

	  	if(ts !== null){
	  		payload['thread_ts'] = ts;
	  	}

	  	let chat = global.db.collection("chats");

		let config = {
		  method: 'post',
		  url: 'https://slack.com/api/chat.postMessage',
		  headers: { 
		    'Authorization': 'Bearer xoxb-121866172544-3451545358562-S5kVx1OlE5s5PgSi9LEnCepq', 
		    'Content-Type': 'application/json'
		  },
		  data: JSON.stringify(payload)
		};

		try {
	  		var data = await axios.request(config);
	  		console.log(42, data)
	  	} catch(err){
	  		console.log(76, err);
	  	}


	}

	async getTotalRegisteredUsers(){

		let usersColl = await global.db.collection('users');
		let totalUsers = await usersColl.countDocuments();
		this.response.reply({
			"result": totalUsers,
			"available": 40
		});
		return true;
	}

	async getTotalRegisteredApplications(){

		let applicationsColl = await global.db.collection('applications');
		let applicationsApproved = await applicationsColl.countDocuments( { "approved": true } );

		this.response.reply({
			"result": 97-applicationsApproved
		});

		return true;
	}

	async spreadsheetHitCount(){

		let query = { 'spreadsheet_id': '1PXCApAhrMhlcfgalyI1CJfJGsQh6pILzY4-UON-DqGo' }; // Replace with your query condition
		let update = { $inc: { 'hits': 1 } }; // Replace with your update operation
		let options = { upsert: true, returnOriginal: false };

		let coll = await global.db.collection('spreadsheet_hits');
//		let result = await coll.updateOne(query, update, options);

		let result = await coll.findOneAndUpdate(query, update, options);

		let updatedHitCount = result.value.hits; // The updated hit count
		console.log('Updated hit count:', updatedHitCount);

		this.response.reply({
			"result": updatedHitCount
		});

		return true;
	}

	async incrementApplicationPageHitCount(){

		let query = { 'spreadsheet_id': 'application_page' }; // Replace with your query condition
		let update = { $inc: { 'hits': 1 } }; // Replace with your update operation
		let options = { upsert: true, returnOriginal: false };

		let coll = await global.db.collection('spreadsheet_hits');
		let result = await coll.findOneAndUpdate(query, update, options);


		let updatedHitCount = result.value.hits; // The updated hit count

		this.response.reply({
			"result": updatedHitCount
		});

		return true;
	}

	async trackPageHitSource(){
		let coll = await global.db.collection('landing_page_hits');
		this.body.inserted = new Date();
		let result = await coll.insertOne(this.body);
		return true;		
	}

	async updateTimeOnSite(){

		const newLastActivity = new Date();

		let query = { visitorName: this.body.visitorName }; // Replace with your query condition
		let update = { $set: { 'lastActivity': newLastActivity } }; // Replace with your update operation
		let options = { upsert: false, returnOriginal: false };

		let coll = await global.db.collection('landing_page_hits');

		let result = await coll.findOneAndUpdate(query, update, options);		

		// Calculate totalTimeOnSite
		if (result.value && result.value.inserted) {
		  const totalTimeOnSite = newLastActivity.getTime() - result.value.inserted.getTime();
		  
		  // Convert to seconds and minutes
		  const seconds = Math.floor(totalTimeOnSite / 1000);
		  const minutes = Math.floor(seconds / 60);
		  const remainingSeconds = seconds % 60;

		  // Update the document to set totalTimeOnSite
		  await coll.updateOne(
		    query,
		    { $set: { 'totalTimeOnSite': `${minutes}:${String(remainingSeconds).padStart(2, '0')}` } }
		  );
		}
	}

	async applicationPageHitCount(){
		let query = { 'spreadsheet_id': 'application_page' }; // Replace with your query condition
		let coll = await global.db.collection('spreadsheet_hits');
		let result = await coll.findOne(query);
		this.response.reply({
			"result": result.hits
		});
		return true;
	}

	async submitApplication(){
		//let query = { }
		let coll = await global.db.collection('applications');
		this.body['approved'] = false;
		let result = await coll.insertOne( this.body )
		console.log(126, result);
	}

	async updateOrderTracking() {
		let coll = await global.db.collection('motorcycle_conversions');
		
		let query = { uuid: this.body._id }; 
		let update = { $set: { 'quoteRef': this.body.quote_ref } }; 
		let options = { upsert: false, returnOriginal: false };

		console.log(200, query, update, options);

		let result = await coll.findOneAndUpdate(query, update, options);	
	}

	async getOrderTracking() {
		
		if(this.voca.lowerCase(this.req.method) == "options"){
			return true;
		}

		// Create a database record if it exists, otherwise return existing tracking data.

		let coll = await global.db.collection('motorcycle_conversions');

		if(this.body["_id"] == null){
			console.log(183,  "Is Null!");

			if((typeof this.body["quote_ref"] === 'undefined') && (typeof this.body["quote_id"] === 'undefined')){
				console.log("Creating new record");
				
				let result = await coll.insertOne( this.body )
				this.response.reply( { "cookie": { "_id": result['insertedId'], ... this.body } } );
				return;
			}

			// We have a quote_ref or a quite_id, but not a _id
			if((typeof this.body["quote_ref"] !== 'undefined') || (typeof this.body["quote_id"] !== 'undefined')){
				
				let query = { quote_ref: this.body['quote_ref'] };

				let result = await coll.findOne(query);
				this.response.reply({
					"cookie": result
				});

				return;
			}			
		}

		let trackingData = await this.createOrderTracking();
		this.response.reply( { "cookie": trackingData } );
	}

	async getOrderByReference(quote_ref){

		let coll = await global.db.collection('motorcycle_conversions');

		let query = { quote_ref: quote_ref }; 

		let result = await coll.findOne(query);

		return result;		
	}

	async createOrderTracking() {

		let coll = await global.db.collection('motorcycle_conversions');

		let query = { _id: new ObjectId(this.body._id) }; 

		if((this.body._id == null) || (this.body._id === 'undefined')){
			query = {}
		}

		if(typeof this.body.quote_ref !== 'undefined'){
			if((this.body._id == null) || (typeof this.body._id === "undefined")){
			
			
			query = { quote_ref: this.body.quote_ref }
		}}		

		if(typeof this.body.order_id !== 'undefined'){
			//query = { quote_ref: this.body.order_id }
		}

		delete this.body["_id"];

		let update = { $set: { ... this.body } }; 

		let options = { upsert: true, returnDocument: 'after' };

		console.log(204, query, update, options);

		let result = await coll.findOneAndUpdate(query, update, options);	

		console.log(205, result);
		return result["value"];
	}


}
 
