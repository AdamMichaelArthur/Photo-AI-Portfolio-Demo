import Sysadmin from '@plans/sysadmin/sysadmin.js'
import { Base, ResponseError } from '@base'
import axios from 'axios'

import {
  setTimeout,
  setImmediate,
  setInterval,
} from 'timers/promises';

export default class SysAdmin extends Sysadmin {

	constructor(){
		super();
		//this.classLimits = 100;
		//this.functionLimits = 50;
	}

	async test(){

		console.log(19, this.database);
		
		this.response.reply("works");
	}

	accounts(){
		this.response.reply("works");
	}

	async subscriptions(){
		this.response.reply("works");
	}

	async subscription(){
		this.response.reply("works");
	}

	async keys(){
		this.response.reply("works");
	}

	async key(){
		this.response.reply("works");
	}

	async plans(){
		//console.log(41, this.plans.lifetime);
		//console.log(41, this.plans);

		this.response.reply("works");
	}

	async reports(){
		this.response.reply("works");
	}

	async transactions(){
		this.response.reply("works");
	}

	async reset(){

		this.timeout = 0;

		// Danger Will Rogers.  If this is called in production it will destroy a lot of hard work.  I hope you're smart enough to have regular DB backups
		let db = this.database.db;
		db.collection("serializations").deleteMany({})
		db.collection("access_records").deleteMany({})
		db.collection("class_access_records").deleteMany({})
		db.collection("users").deleteMany({});
		await db.collection("affiliateClaimedDomains").deleteMany({});
		await db.collection("stripe_events").deleteMany({});
		await db.collection("accounts").deleteMany({});

		var data = JSON.stringify({
		  "userId": "sysadmin@saas-product.com",
		  "pwd": "dino",
		  "plan": "sysadmin",
		  "adminPassword": "12345",
		  "account_type": "user",
		  "firstName": "Adam",
		  "lastName": "Arthur"
		});

		/* Hard Coding in the url's here is intentional: if you try to run this function on the server,
			it won't work -- you can only run this on your localhost for it to work.  

			This code should probably be deleted after development work is finished.  
		*/

		let config = {
		  method: 'post',
		  maxBodyLength: Infinity,
		  url: 'http://localhost:4201/api/register',
		  headers: { 
		    'Content-Type': 'application/json', 
		    'Accept': 'application/json'		  },
		  data : data
		};

		var result = await axios.request(config);

		var headers = result.headers['set-cookie'];

		//console.log(96, cookies);

		config = {
		  method: 'get',
		  maxBodyLength: Infinity,
		  url: 'http://localhost:4201/api/administration/plans/getPlans',
		  headers: { 
		    'Cookie': headers[0]
		  }
		};

		result = await axios.request(config);
		headers = result.headers['set-cookie'];

		await setTimeout(7500);
		
		console.log(115);
		
		data = JSON.stringify({
		  "userId": "affiliate@saas-product.com",
		  "pwd": "dino",
		  "plan": "free",
		  "account_type": "affiliate",
		  "firstName":"Affiliate",
		  "lastName":"Account"
		});

		config = {
		  method: 'post',
		  maxBodyLength: Infinity,
		  url: 'http://localhost:4201/api/register',
		  headers: { 
		    'Content-Type': 'application/json', 
		    'Accept': 'application/json'		  },
		  data : data
		};

		console.log(124);

		try { result = await axios.request(config); } catch(err) { console.log(err); }

		console.log(140);
		//console.log(134, result.body['redirect-override']);

		headers = result.headers['set-cookie'];


		data = JSON.stringify({ "domain": "watchmebark.com" });

		config = {
		  method: 'post',
		  maxBodyLength: Infinity,
		  url: 'http://localhost:4201/api/affiliates/addDomain',
		  headers: { 
		    'Content-Type': 'application/json', 
		    'Cookie': headers[0]
		},
		  data : data
		};

		console.log(154)
		try { result = await axios.request(config); } catch(err) { console.log(err); }

		config.data = JSON.stringify({ "domain": "coffee-explained.com" });

		console.log(159)
		try { result = await axios.request(config); } catch(err) { console.log(err); }

		await setTimeout(1500);

		data = JSON.stringify({
		  "userId": "watchmebark@saas-product.com",
		  "pwd": "dino",
		  "plan": "free",
		  "firstName":"Watch Me",
		  "lastName":"Bark"
		});

		config = {
		  method: 'post',
		  maxBodyLength: Infinity,
		  url: 'http://localhost:4201/api/register',
		  headers: { 
		    'Content-Type': 'application/json', 
		    'Accept': 'application/json',
		    'Cookie': 'affiliate-referral=watchmebark.com; Domain=.saas-product.com; Path=/'		  
		},
		  data : data
		};

		console.log(184)
		try { result = await axios.request(config); } catch(err) { console.log(err); }

		data = JSON.stringify({
		  "userId": "coffee-explained@saas-product.com",
		  "pwd": "dino",
		  "plan": "free",
		  "firstName":"Coffee",
		  "lastName":"Explained"
		});

		config = {
		  method: 'post',
		  maxBodyLength: Infinity,
		  url: 'http://localhost:4201/api/register',
		  headers: { 
		    'Content-Type': 'application/json', 
		    'Accept': 'application/json',		
		    'Cookie': 'affiliate-referral=coffee-explained.com; Domain=.saas-product.com; Path=/'  
		},
		  data : data
		};

		console.log(207)
		result = await axios.request(config);


// 		config.data = JSON.stringify({
// 		  "userId": "watchmebark@saas-product.com",
// 		  "pwd": "dino",
// 		  "plan": "free",
// 		  "first_name": "Watch Me",
// 		  "last_name": "Bark"
// 		});

// 		await axios.request(config)

		//this.response.reply({result: "Test Database Reset.  Be sure to call getPlans to reset Stripe...  You'll need to recreate your accounts and log back in..."});
	}


}
