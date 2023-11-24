// Plans are the most common method SaaS Products use to monetize
/*
	A plan typically has one or more of the following characteristics:

	A set of features available to it and its lessor plans
	API Call Limits -- a set number of times you can call a specific API endpoint
	Database Record Limits -- a limit to how many records can be accessed
	User Limits -- a limit to how many sub users are allowed to use the account


*/

//import Base from "@base"
import UserPermissions from "@permissions/user/user.js"
import Voca from "voca"
import { MongoClient, ObjectId } from 'mongodb';

export default class Plans extends UserPermissions {

	icon = 'bi-gem';

	features = [];

	isEnabled = true;
	
	isPublic = true;
	// Zero represents an unlimited number of users
	users = 0;

	currency = "usd";	// Check supported currencies https://stripe.com/docs/currencies

	// Frequency options are "monthly", "weekly", "daily", "annually"
	frequency = 'month' 
	interval_count = 1;
	// The two most common payment installments


	// allowedFrequencies = ["month", "year", "week", "day"]; -- in case you want to have complex frequencies
	allowedFrequencies = ["month"];

	// The cost per subscription period.  Set one for reach allowedFrequency. 
	// frequencyCosts = {
	// 	"day": 0.00,
	// 	"week": 0.00,
	// 	"month": 0.00,
	// 	"year": 0.00
	// }
	frequencyCosts = {
		"month": 0
	}

	// Annual discounts are common.  This is a percent, expressed as a double
	annualDiscount = 0.00

	// The number of days for a free trial, before billing begins.  We define a default trial period of 7 days
	freeTrialDays = 7;

	// Payment Reminders.  If true, a payment reminder will be sent via email 24 hours before being charged
	paymentReminders = true;

	// Grace period, in days, that a subscription remains active after a failed payment attempt
	gracePeriod = 3;

	// The date that a subscription remains valid.  This parameter is loaded dymanically from the DB
	// We need to receive a notification from stripe in order for this date to update.
	subscriptionValidity = ""

	// If set to true, subscription variables can be overridden by the database.
	dbOverrides = true;

	constructor(navigationMenuItems =[], user =null){

		console.log(2)

		super(navigationMenuItems, user);
		
		if (this.constructor === Plans) {
		      // Only initialize the variables if the constructor belongs to Plans,
		      // i.e., it is not a subclass constructor
		      // When isPublic and isEnabled == true, the plan will be displayed as options to the user
		      // The roadmap is to allow these to be initially defined in code, but overriden by database entries
		      this.isPublic = false;
		      this.isEnabled = false;
		}

		this.displayName = Voca.titleCase(Voca.replaceAll(Voca.kebabCase(this.constructor.name), "-", " "));


	}


	/*
		Using the Stripe API Key provided in the environment variable, we connect using the Stripe integration
		First, we pull existing subscription plans.

		Then, we compare those plans to what's been defined inside the plans directory, according to our protocols

		Finally, if there's a discrepency, we ADD the corresponding plan.  Under no circumstances are plans removed
	*/
	async syncPlans(){

	}

	/* Returns a JSON object representing all of the available plans, with their corresponding plan id */
	async getPlans(){

		let aggregate = [

            { $match: { accessLevel: 'system', className: 'EndpointsAdministrationPlans' } },
            { $unwind: '$plans' },
            { $unwind: '$plans.prices' },
            { $addFields: {
              'id': '$plans._id',
              'icon': '$plans.icon',
              'features': '$plans.features',
              'theProductId': '$plans.productId.id',
              'productId.metadata': '$plans.productId.metadata',
              'productId.name': '$plans.productId.name',
              currency: '$plans.currency',
              frequency: '$plans.frequency',
              annualDiscount: '$plans.annualDiscount',
              freeTrialDays: '$plans.freeTrialDays',
              gracePeriod: '$plans.gracePeriod',
              priceId: '$plans.prices.id',
              'pricesProduct': '$plans.prices.product',
              'pricesType': '$plans.prices.type',
              'pricesUnit_amount': '$plans.prices.unit_amount',
              'pricesUnit_amount_decimal': '$plans.prices.unit_amount_decimal',
              'planId': '$plans._id'
            }},
            { $project: {
              _id: '$id',
              icon: 1,
              features: 1,
              theProductId: 1,
              displayName: '$productId.name',
              currency: 1,
              planId: 1,
              frequency: 1,
              annualDiscount: 1,
              freeTrialDays: 1,
              gracePeriod: 1,
              pricesProduct:1,
              pricesType:1,
              displayCost: { $round: [ { $divide: ['$pricesUnit_amount', 100] }, 2 ] },
              pricesUnit_amount: { $round: [ { $divide: ['$pricesUnit_amount', 100] }, 2 ] },
              pricesUnit_amount_decimal:1,
              priceId: 1,
              prices: 1
            }},
            { $match: { displayName: { $ne: 'Sysadmin' } } }
		]

		let plans = await this.database.mongo.db.collection("serializations").aggregate(aggregate).toArray();

		return plans;

		return [
			{
				"displayName": "Free",
				"useCase": "Individual",
				"displayCost": "$8",
				"featuresAr":[
					"Feature 1",
					"Feature 2",
					"Feature 3",
					"Feature 4"
				],
				"readMoreLink": "main/plans/free"
			},
			{
				"displayName": "Pro",
				"useCase": "Individual",
				"displayCost": "$39",
				"featuresAr":[
					"Everything in Free",
					"Feature 1",
					"Feature 2",
					"Feature 3"
				],
				"readMoreLink": "main/plans/pro"
			},
			{
				"displayName": "Enterprise",
				"useCase": "Individual",
				"displayCost": "$99",
				"featuresAr":[
					"Everything in Pro",
					"Feature 1",
					"Feature 2",
					"Feature 3"
				],
				"readMoreLink": "main/plans/enterprise"	
			}
		]
		// Step 1: See if the plan has been overridden by a database entry
		// Step 2: Return the database entry if present
		// Step 3: If not present, insert into the database, based on the class defaults

		// Remove the "Plan" and "Sysadmin" plans
		// var plansAr = [];
		// for(var plan of global.Plans){
		// 	if(plan.className == 'Sysadmin'){
		// 		continue;
		// 	}
		// 	if(plan.className == 'Plans'){
		// 		continue;
		// 	}

		// 	let obj;
		// 	eval(`obj = new global.${plan.classRef}`);
		// 	obj = JSON.parse(JSON.stringify(obj));
		// 	delete obj.navigationMenuItems;
		// 	delete obj.adminMenuItems;
		// 	delete obj.supportMenuItems;
		// 	delete obj.response;
		// 	delete obj.route;
		// 	delete obj.class;
		// 	delete obj.timeout;
		// 	delete obj.errors;
		// 	delete obj.base64;
		// 	delete obj.dbOverrides;
		// 	plansAr.push(obj)
		// }
		// return plansAr;
	}

	// When a subscription renews successfully, we want to reset any plan limitations
	async renewPlan(){
	  // {
	  //   _id: ObjectId("64751f36958399d5660a7544"),
	  //   account_id: ObjectId("6359d15775f0676bae1af71a"),
	  //   className: 'EndpointsSysadmin',
	  //   endpoint: 'accounts',
	  //   user_id: ObjectId("6359d15775f0676bae1af719"),
	  //   remaining: 1,
	  //   reset: 5,
	  //   access_count_current_billing_period: 4,
	  //   access_count_lifetime: 4,
	  //   updated_at: ISODate("2023-05-29T21:55:49.761Z")
	  // }

	  // Reset function and class action resources
	  
	  // console.log(142, this);
	  // let accountId = this.userAccount._id;
	  

	  // let query = { "account_id": new ObjectId(accountId)  };
	  // //let update = [ { $addFields: { remaining: "$reset" } }, { $unset: "reset" } ]
	  // let update = [ { $addFields: { remaining: "$reset" } } ];

	  // console.log(145, query);

	  // var resultA = await this.database.mongo.db.collection("access_records").updateMany(query, update);
	  // var resultB = await this.database.mongo.db.collection("class_access_records").updateMany(query, update);

	  // // Update the renewal date
	  // //var resultC = this.database.mongo.db.collection("access_records").updateMany(query, update);

	  // console.log(150, resultA, resultB);

	  

	}

}

