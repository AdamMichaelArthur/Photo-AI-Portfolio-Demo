import { Base, ResponseError } from '@base'
import { MongoClient, ObjectId } from 'mongodb';
import * as util from "util";

import {
  setTimeout,
  setImmediate,
  setInterval,
} from 'timers/promises';

let exchange_rates = {
  USD: 1,
  AED: 3.6725,
  AFN: 73.771,
  ALL: 98.4037,
  AMD: 402.8752,
  ANG: 1.79,
  AOA: 836.9087,
  ARS: 350.03,
  AUD: 1.5683,
  AWG: 1.79,
  AZN: 1.6996,
  BAM: 1.8291,
  BBD: 2,
  BDT: 110.5417,
  BGN: 1.8295,
  BHD: 0.376,
  BIF: 2830.2678,
  BMD: 1,
  BND: 1.3595,
  BOB: 6.8908,
  BRL: 4.9083,
  BSD: 1,
  BTN: 83.264,
  BWP: 13.618,
  BYN: 3.2757,
  BZD: 2,
  CAD: 1.3804,
  CDF: 2484.6329,
  CHF: 0.9021,
  CLP: 913.7262,
  CNY: 7.2923,
  COP: 4077.8175,
  CRC: 529.0292,
  CUP: 24,
  CVE: 103.1189,
  CZK: 22.9878,
  DJF: 177.721,
  DKK: 6.9748,
  DOP: 56.6211,
  DZD: 135.0147,
  EGP: 30.9099,
  ERN: 15,
  ETB: 55.9111,
  EUR: 0.92,
  FJD: 2.2689,
  FKP: 0.8152,
  FOK: 6.9769,
  GBP: 0.80,
  GEL: 2.6937,
  GGP: 0.8152,
  GHS: 12.0076,
  GIP: 0.8152,
  GMD: 65.4439,
  GNF: 8587.687,
  GTQ: 7.7966,
  GYD: 210.9207,
  HKD: 7.8092,
  HNL: 24.5667,
  HRK: 7.0462,
  HTG: 132.5657,
  HUF: 352.7694,
  IDR: 15698.2408,
  ILS: 3.8595,
  IMP: 0.8152,
  INR: 83.2713,
  IQD: 1308.9012,
  IRR: 41994.2194,
  ISK: 143.5065,
  JEP: 0.8152,
  JMD: 155.8858,
  JOD: 0.709,
  JPY: 151.6632,
  KES: 151.856,
  KGS: 89.3399,
  KHR: 4119.0753,
  KID: 1.5683,
  KMF: 460.0841,
  KRW: 1322.128,
  KWD: 0.3085,
  KYD: 0.8333,
  KZT: 466.1409,
  LAK: 20551.0741,
  LBP: 15000,
  LKR: 325.6472,
  LRD: 189.5145,
  LSL: 18.7155,
  LYD: 4.8688,
  MAD: 10.2113,
  MDL: 17.9527,
  MGA: 4507.1889,
  MKD: 57.5992,
  MMK: 2091.1794,
  MNT: 3473.0529,
  MOP: 8.0432,
  MRU: 39.628,
  MUR: 44.5511,
  MVR: 15.4399,
  MWK: 1682.6192,
  MXN: 17.6463,
  MYR: 4.708,
  MZN: 63.8823,
  NAD: 18.7155,
  NGN: 809.0977,
  NIO: 36.4357,
  NOK: 11.0987,
  NPR: 133.2224,
  NZD: 1.6998,
  OMR: 0.3845,
  PAB: 1,
  PEN: 3.7887,
  PGK: 3.7271,
  PHP: 56.0305,
  PKR: 287.1426,
  PLN: 4.1393,
  PYG: 7355.8738,
  QAR: 3.64,
  RON: 4.6527,
  RSD: 109.5774,
  RUB: 92.062,
  RWF: 1264.2491,
  SAR: 3.75,
  SBD: 8.421,
  SCR: 13.1389,
  SDG: 576.6894,
  SEK: 10.858,
  SGD: 1.3596,
  SHP: 0.8152,
  SLE: 22.6882,
  SLL: 22688.1741,
  SOS: 572.0105,
  SRD: 38.1159,
  SSP: 1055.1364,
  STN: 22.9122,
  SYP: 12873.2536,
  SZL: 18.7155,
  THB: 35.9862,
  TJS: 10.9427,
  TMT: 3.4999,
  TND: 3.1525,
  TOP: 2.3693,
  TRY: 28.69,
  TTD: 6.7289,
  TVD: 1.5683,
  TWD: 32.2981,
  TZS: 2496.8802,
  UAH: 36.1638,
  UGX: 3772.1956,
  UYU: 39.7193,
  UZS: 12313.1346,
  VES: 35.3148,
  VND: 24365.8466,
  VUV: 121.0285,
  WST: 2.7415,
  XAF: 613.4454,
  XCD: 2.7,
  XDR: 0.7599,
  XOF: 613.4454,
  XPF: 111.5983,
  YER: 249.1668,
  ZAR: 18.7163,
  ZMW: 22.8974,
  ZWL: 5760.2261
}

let exchange_rounding_factors = {
  "USD": 1,   // U.S. Dollar (No rounding, whole numbers)
  "EUR": 1,   // Euro (No rounding, whole numbers)
  "GBP": 1,   // British Pound Sterling (No rounding, whole numbers)
  "JPY": 1,   // Japanese Yen (No rounding, whole numbers)
  "AUD": 1,   // Australian Dollar (No rounding, whole numbers)
  "CAD": 1,   // Canadian Dollar (No rounding, whole numbers)
  "CHF": 1,   // Swiss Franc (No rounding, whole numbers)
  "CNY": 1,   // Chinese Yuan Renminbi (No rounding, whole numbers)
  "INR": 1,   // Indian Rupee (No rounding, whole numbers)
  "TRY": 10,  // Turkish Lira (Rounded to the nearest 10)
  "BRL": 5,   // Brazilian Real (Rounded to the nearest 5)
  "MXN": 5,   // Mexican Peso (Rounded to the nearest 5)
  "ZAR": 10,  // South African Rand (Rounded to the nearest 10)
  "SGD": 1,   // Singapore Dollar (No rounding, whole numbers)
  "HKD": 1,   // Hong Kong Dollar (No rounding, whole numbers)
  "SEK": 1,   // Swedish Krona (No rounding, whole numbers)
  "NZD": 1,   // New Zealand Dollar (No rounding, whole numbers)
  "AED": 1,   // United Arab Emirates Dirham (No rounding, whole numbers)
  "THB": 1,   // Thai Baht (No rounding, whole numbers)
  "KRW": 1,   // South Korean Won (No rounding, whole numbers)
  "IDR": 1000, // Indonesian Rupiah (Rounded to the nearest 1000)
};

export default class Items extends Base {

	constructor(){
		super();
	}

	async search(GPS =[]){
		const hasRequiredParameters = this.requiredParams(["GPS"], ["prevPage", "nextPage"]);
		if(!hasRequiredParameters){
					return;
		}

		// Let's do some additional type checking
		if(this.body.GPS.length != 2){
			this.errors.error("GPS", "The GPS should be an array with two float elements");
			return;
		}

		if(!Array.isArray(this.body.GPS)){
			this.errors.error("GPS", "The GPS should be an array with two float elements");
			return;
		}

		if ((typeof this.body.GPS[0] !== 'number')||(typeof this.body.GPS[1] !== 'number')) {
			this.errors.error("GPS", "The GPS array elements must be a number type");
			return;
		}

		let listings = this.database.db.collection('items');

		const nextPage = this.body.nextPage;

		let matchCondition = {}; // Initialize an empty match condition

		if (nextPage !== false) {
		  matchCondition = {
		    _id: { $gt: nextPage }
		  };
		}

		const prevPage = this.body.prevPage; // Replace with the actual value

		if (prevPage !== false) {
		  matchCondition = {
		    _id: { $lt: prevPage }
		  };
		}

		// Define the aggregation pipeline
		const pipeline = [
		  {
		    $geoNear: {
		      near: {
		        type: "Point",
		        coordinates: [GPS[1], GPS[0]]
		        //[ 37.32980777, -122.01998172 ]
		      },
		      distanceField: "distance",
		      spherical: true,
		      //maxDistance: 10000, // Set your desired maximum distance in meters
		    }
		  },
		  {
    		$sort: { distance: 1 } // Sorting by distance in ascending order
  		},
		  {
        $group: {
          _id: "$restaurant_id", // Group by restaurant_id
          document: { $first: "$$ROOT" } // Keeps the entire document of the first item in each group
        }
      }
      ,

        {
          $replaceRoot: { newRoot: "$document" }
        },
      		  {
      		    $limit: 100 // Limit the results to the first ten closest items
      		  }
      		];

		let result = await listings.aggregate(pipeline).toArray();

		this.response.reply( { "items": result } );
	}

	async itemsByRestaurant(restaurant_id =""){

		restaurant_id = this.body.restaurant_id;

		let items = this.database.db.collection('items');

		let restaurant_items = await items.find( { restaurant_id: new ObjectId(restaurant_id) } ).toArray();

		this.response.reply( { "nearby_items": restaurant_items } );

	}

	async restaurantById(restaurant_id =""){
		restaurant_id = this.body.restaurant_id;

		let restaurants = this.database.db.collection('restaurants');

		let restaurant = await restaurants.find( { _id: new ObjectId(restaurant_id) } ).toArray();

		this.response.reply( { "restaurant": restaurant } );		
	}

	async cartTotalInLocalCurrency(preferredCurrency =0, priceInPreferredCurrency =0, restaurantCurrency =0){

		// This is a sub-optimal way of doing this.  If I throw this project into production, refactor this code.
		// For now, i just need it to work.

		// Convert to USD.
		var priceInUsd = 0;
		if(priceInPreferredCurrency == "USD"){
			priceInUsd = priceInPreferredCurrency;
		} else {
			let exchangeRate = exchange_rates[preferredCurrency];
			priceInUsd = priceInPreferredCurrency / exchangeRate;
		}

		// Convert from USD to restaurantCurrency
		let exchangeRate = exchange_rates[restaurantCurrency];
		var priceInRestaurantCurrency = priceInUsd * exchangeRate;

		var price_rounding_factor = 1;
    if(typeof exchange_rounding_factors[restaurantCurrency] !== 'undefined'){
    	price_rounding_factor =  exchange_rounding_factors[restaurantCurrency]
    }

    let roundedPriceInRestaurantCurrency = Math.round(priceInRestaurantCurrency / price_rounding_factor) * price_rounding_factor;

    // price is a reserved word

    this.response.reply( { "convertedFrom":preferredCurrency, "prceInUsd":priceInUsd, "prceInRestaurantCurrency": roundedPriceInRestaurantCurrency } );
                            
	}

  async itemsByCuisine(GPS =[], restaurant_id ="", item_cuisine =""){

      let itemCourseMatchStage = {};

      if(item_cuisine != ""){
        itemCourseMatchStage["item_cuisine"] = item_cuisine
      }

      if(restaurant_id != ""){
        itemCourseMatchStage["restaurant_id"] = new ObjectId(restaurant_id)
      }

      const hasRequiredParameters = this.requiredParams(["GPS", "item_cuisine"], ["prevPage", "nextPage", "restaurant_id"]);
      if(!hasRequiredParameters){
            return;
      }

      // Let's do some additional type checking
      if(this.body.GPS.length != 2){
        this.errors.error("GPS", "The GPS should be an array with two float elements");
        return;
      }

      if(!Array.isArray(this.body.GPS)){
        this.errors.error("GPS", "The GPS should be an array with two float elements");
        return;
      }

      if ((typeof this.body.GPS[0] !== 'number')||(typeof this.body.GPS[1] !== 'number')) {
        this.errors.error("GPS", "The GPS array elements must be a number type");
        return;
      }

      let listings = this.database.db.collection('items');

      const nextPage = this.body.nextPage;

      let matchCondition = {}; // Initialize an empty match condition

      if (nextPage !== false) {
        matchCondition = {
          _id: { $gt: nextPage }
        };
      }

      const prevPage = this.body.prevPage; // Replace with the actual value

      if (prevPage !== false) {
        matchCondition = {
          _id: { $lt: prevPage }
        };
      }

      // Define the aggregation pipeline
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [GPS[1], GPS[0]]
              //[ 37.32980777, -122.01998172 ]
            },
            distanceField: "distance",
            spherical: true,
            //maxDistance: 10000, // Set your desired maximum distance in meters
          }
        },
        {
          $match: { ... itemCourseMatchStage }
        },
        {
          $sort: { distance: 1 } // Sorting by distance in ascending order
        },
        {
          $group: {
            _id: "$restaurant_id", // Group by restaurant_id
            document: { $first: "$$ROOT" } // Keeps the entire document of the first item in each group
          }
        },
        {
            $replaceRoot: { newRoot: "$document" }
        },
        {
          $limit: 100 // Limit the results to the first ten closest items
        }
      ];

      let result = await listings.aggregate(pipeline).toArray();

      console.log(426, itemCourseMatchStage, pipeline)

      this.response.reply( { "items": result } );
  
  
  }

  async itemsByCourse(GPS =[], restaurant_id ="", item_course =""){

      let itemCourseMatchStage = {};

      if(item_course != ""){
        itemCourseMatchStage["item_course"] = item_course
      }

      if(restaurant_id != ""){
        itemCourseMatchStage["restaurant_id"] = new ObjectId(restaurant_id)
      }

      const hasRequiredParameters = this.requiredParams(["GPS", "item_course"], ["prevPage", "nextPage", "restaurant_id"]);
      if(!hasRequiredParameters){
            return;
      }

      // Let's do some additional type checking
      if(this.body.GPS.length != 2){
        this.errors.error("GPS", "The GPS should be an array with two float elements");
        return;
      }

      if(!Array.isArray(this.body.GPS)){
        this.errors.error("GPS", "The GPS should be an array with two float elements");
        return;
      }

      if ((typeof this.body.GPS[0] !== 'number')||(typeof this.body.GPS[1] !== 'number')) {
        this.errors.error("GPS", "The GPS array elements must be a number type");
        return;
      }

      let listings = this.database.db.collection('items');

      const nextPage = this.body.nextPage;

      let matchCondition = {}; // Initialize an empty match condition

      if (nextPage !== false) {
        matchCondition = {
          _id: { $gt: nextPage }
        };
      }

      const prevPage = this.body.prevPage; // Replace with the actual value

      if (prevPage !== false) {
        matchCondition = {
          _id: { $lt: prevPage }
        };
      }

      // Define the aggregation pipeline
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [GPS[1], GPS[0]]
              //[ 37.32980777, -122.01998172 ]
            },
            distanceField: "distance",
            spherical: true,
            //maxDistance: 10000, // Set your desired maximum distance in meters
          }
        },
        {
          $match: { ... itemCourseMatchStage }
        },
        {
          $sort: { distance: 1 } // Sorting by distance in ascending order
        },
        {
          $group: {
            _id: "$restaurant_id", // Group by restaurant_id
            document: { $first: "$$ROOT" } // Keeps the entire document of the first item in each group
          }
        },
        {
            $replaceRoot: { newRoot: "$document" }
        },
        {
          $limit: 100 // Limit the results to the first ten closest items
        }
      ];

      let result = await listings.aggregate(pipeline).toArray();

      console.log(426, itemCourseMatchStage, pipeline)

      this.response.reply( { "items": result } );
  
  }

  async itemsByCategory(restaurant_id ="", GPS =[], item_category =""){


      let itemCourseMatchStage = {};

      if(item_category != ""){
        itemCourseMatchStage["item_category"] = item_category
      }

      if(restaurant_id != ""){
        itemCourseMatchStage["restaurant_id"] = new ObjectId(restaurant_id)
      }

      const hasRequiredParameters = this.requiredParams(["GPS", "item_category"], ["prevPage", "nextPage", "restaurant_id"]);
      if(!hasRequiredParameters){
            return;
      }

      // Let's do some additional type checking
      if(this.body.GPS.length != 2){
        this.errors.error("GPS", "The GPS should be an array with two float elements");
        return;
      }

      if(!Array.isArray(this.body.GPS)){
        this.errors.error("GPS", "The GPS should be an array with two float elements");
        return;
      }

      if ((typeof this.body.GPS[0] !== 'number')||(typeof this.body.GPS[1] !== 'number')) {
        this.errors.error("GPS", "The GPS array elements must be a number type");
        return;
      }

      let listings = this.database.db.collection('items');

      const nextPage = this.body.nextPage;

      let matchCondition = {}; // Initialize an empty match condition

      if (nextPage !== false) {
        matchCondition = {
          _id: { $gt: nextPage }
        };
      }

      const prevPage = this.body.prevPage; // Replace with the actual value

      if (prevPage !== false) {
        matchCondition = {
          _id: { $lt: prevPage }
        };
      }

      // Define the aggregation pipeline
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [GPS[1], GPS[0]]
              //[ 37.32980777, -122.01998172 ]
            },
            distanceField: "distance",
            spherical: true,
            //maxDistance: 10000, // Set your desired maximum distance in meters
          }
        },
        {
          $match: { ... itemCourseMatchStage }
        },
        {
          $sort: { distance: 1 } // Sorting by distance in ascending order
        },
        {
          $group: {
            _id: "$restaurant_id", // Group by restaurant_id
            document: { $first: "$$ROOT" } // Keeps the entire document of the first item in each group
          }
        },
        {
            $replaceRoot: { newRoot: "$document" }
        },
        {
          $limit: 100 // Limit the results to the first ten closest items
        }
      ];

      let result = await listings.aggregate(pipeline).toArray();

      console.log(426, itemCourseMatchStage, pipeline)

      this.response.reply( { "items": result } );
  
  }

  async itemsByLikes(restaurant_id =""){

  }

  async itemsByPrice(restaurant_id =""){

  }

} 