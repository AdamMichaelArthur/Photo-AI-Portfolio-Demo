import { Base, ResponseError } from '@base'
import axios from 'axios';
import { MongoClient, ObjectId } from 'mongodb';
import qs from 'qs';
import dayjs from 'dayjs';

export default class Slack extends Base {

  constructor(){
    super();
  }

  async authorized(){
  	this.response.reply("ok");

  	var code = this.req.query["code"];
    var stateInfo = this.req.query["state"];

    let accountCollection = this.database.db.collection('accounts');
    let accountInfo = await accountCollection.findOne( { owner: new ObjectId(stateInfo) } );

    // I'm using integrationsslacks for backwards compatability with Mongoose, which is not used in the 2.0 API.  I've come to really dislike mongoose
    //
    
	let data = qs.stringify({
	  'code': code,
	  'redirect_uri': 'https://app.saas-product.com/v2.0/public/callbacks/slack/authorized',
	  'client_id': '121866172544.3448643611589',
	  'client_secret': '41169d6a78b50a3b80a365d54ef98c2b' 
	});

	let config = {
	  method: 'post',
	  maxBodyLength: Infinity,
	  url: 'https://slack.com/api/oauth.v2.access',
	  headers: { 
	    'Content-Type': 'application/x-www-form-urlencoded'
	  },
	  data : data
	};

	console.log(41, config);

	try {
		var response = await axios.request(config);
	} catch(err){
		this.response.reply("Not bueno");
		return true;
	}

	if(response.data["ok"] === true){
		console.log(51, "We've got a working code.");
		let slackIntegrationCollection = this.database.db.collection("integrationsslacks");
		let insertResult = await slackIntegrationCollection.insertOne( { ... response.data, ... response.data['incoming_webhook'], ... response.data['team'],
		... { created_by: new ObjectId(stateInfo), owner: accountInfo["_id"], "createdAt" : dayjs().toISOString(), "modifiedAt" : dayjs().toISOString() } } );
		console.log(55, insertResult);
	}
    
  }

  async event(){
  	console.log(this.body);
  	if(this.body['type'] == 'url_verification'){
  		this.response.reply( { challenge: this.body.challenge } )
  		return;
  	}
  	
  	let slackIntegrationCollection = this.database.db.collection("slack_events");
	let insertResult = await slackIntegrationCollection.insertOne( this.body );

  }
  
}