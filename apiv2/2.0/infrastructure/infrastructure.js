/*

*/

// import Axios from 'axios';

// export default class Infrastructure {

// 	constructor(){
// 		this.axios = new Axios();
// 	}

// 	bulkRequest(){

// 	}

// 	batchRequest(){

// 	}

// 	async request(){
		
// 	}

// }

/*

	async axiosRequest(arrayOfAsins, refreshToken, callback){

		var data = JSON.stringify({
		  "refreshToken": refreshToken,
		  "arrayOfAsins": arrayOfAsins
		});

		var config = {
		  method: 'post',
		  url: 'https://faas-ams3-2a2df116.doserverless.co/api/v1/web/fn-33fbdf36-d45b-4e61-ba91-8405f97a9ae0/ProductPricing/getItemOffersBulk',
		  headers: { 
		    'Content-Type': 'application/json'
		  },
		  data : data
		};

		console.log(456, config.data.length);

		// try {
		// 	var amz = new AmazonWrapper({region: 'na', refresh_token: refreshToken } )
		// } catch(err){
		// 	console.error("Unable to initialize the Amazon SP-API Wrapper Service", err);
		// }


		try {
			var response = await axios(config);
		} catch(err){
			console.log(425, err);
			await this.database.tables.amazonTokens.returnToken(refreshToken);
			callback([])
			return err;
		}

		//this.testResponse.push(response.data);
		//if(this.testResponse.length == 4){
			//callback(this.testResponse);

		//}

		//console.log(438, this.testResponse.length);

		await this.database.tables.amazonTokens.returnToken(refreshToken)

		callback(response.data);
		//console.log(429, response.data);
		//return response.data;

	}

	batchRequest(arraysOfAsins, token =null, callback){
		console.log(318, arraysOfAsins);
		for(var requestNum = 0; requestNum < arraysOfAsins.length;  requestNum++){
			setTimeout( (asinAr) => { 

				this.results[requestNum] = this._getItemOffersBatch(asinAr[0]);
				this.results[requestNum].catch(() => {}).then((re) => {
				this.finalResults.push(re);
				
				this.promisesReturned++;
				console.log(209, "Result returned!", this.promisesReturned, "of", this.requestsNeeded);
				if(this.promisesReturned == this.requestsNeeded){
					callback(this.finalResults);
				}
				});
			}, 1000*requestNum, arraysOfAsins[requestNum])
			}
		}

	async _getItemOffersBatch(asinsAr =[], onlyPrice =false){


		if(this.amazon == null){
			return this.errors.throw("We have an invalid Amazon object");
		}

		if(asinsAr.length == 0){
			return this.errors.error("amazon-sp-api", "The ASIN Supplied cannot be an empty array");
		}

		if(asinsAr.length > 20){
			return this.errors.error("amazon-sp-api", "getItemOffersBatch can only process 20 asins at a time.  Call getItemOffersBulk for unlimited ASINS");
		}

		// We need to de-dup our asinsAr
		asinsAr = [ ... new Set(asinsAr) ];

		var requests = [];

		for(var request of asinsAr){
			var itemOfferRequest = {
				'uri': `/products/pricing/v0/items/${request}/offers`,
				'method':'GET',
				'MarketplaceId': this.marketplaceId,
				'ItemCondition': 'New'
			}
			requests.push(itemOfferRequest)
		}

		var getItemOffersBatchRequestBody = {
			requests: requests
		}

		var body = {
			getItemOffersBatchRequestBody : getItemOffersBatchRequestBody
		}

		try {
			const res = await this.amazon.callAPI({
			  operation:'productPricing.getItemOffersBatch',
			  body: getItemOffersBatchRequestBody
			});
			return this._postprocessgetItemOffersBatch(res, onlyPrice);
		} catch(err){
			if(this.disableErrorResponses){
				return this.errors.error("amazon-sp-api", err);
			}
			else { return false; }
		}
	}	

		async getItemOffersBulk(asinsAr, callback =null){

		console.log(250);
		asinsAr = [ ... new Set(asinsAr )];

		// The rate limit for this call is 500ms
		var rateLimit = 500; 
		var burst = 1;
		
		if(this.amazon == null){
			return this.errors.throw("We have an invalid Amazon object");
		}

		if(asinsAr.length == 0){
			return this.errors.error("amazon-sp-api", "The ASIN Supplied cannot be an empty array");
		}

		if(asinsAr.length < 20){
			return this.errors.error("amazon-sp-api", "getItemOffersBatch should only be used for more than 20 asins");
		}

		// Remove duplicates from our asinsAr array
		asinsAr = [ ... new Set(asinsAr) ];


		// Calculate how many requests we're going to need
		var requestsNeeded = Math.ceil(asinsAr.length / 20)

		// The overhead of trying to split the requests between multiple tokens has diminishing returns with
		// Lower numbers of asins.  In this case, we're better off just doing it sync.
		if(requestsNeeded < 6){
			console.log(279);
			return await this.getItemOffersBulkSync(asinsAr);
		}

		// Also, if a callback is not supplied, we do it sync
		if(callback == null){
			console.log(284);
			return await this.getItemOffersBulkSync(asinsAr);	
		}
		// Get an Array that contains Arrays of up to 20 ASINS
		var arraysOfAsins = this.utilGetArraysOfAsins(requestsNeeded, asinsAr)
		
		// Create an Array To Store Our Results
		var results = Array(requestsNeeded)

		var promisesReturned = 0;
		var finalResults = Array();

		console.log(294)
		// Take the number of requests we have and divide them into the number of tokens we have
		var refreshTokensAr = await this.database.tables.amazonTokens.checkoutTokens(4);

		console.log(298, refreshTokensAr);


		const numberOfTokens = refreshTokensAr.length;
		const threadsNeeded = Math.ceil( requestsNeeded / numberOfTokens )

		// Decide how many asins each thread will get, except for the last thread
		//const asinsPerThread = Math.floor( asinsAr.length / threadsNeeded )
		//console.log(221,asinsPerThread);

		// Determine which tokens will get which requests arrayOfAsins
		//for(var arrayofAsins of arraysOfAsins){

		var tmpAr = [];
		for(var i = 0; i < numberOfTokens; i++){
			tmpAr.push([]);
		}

		while(arraysOfAsins.length > 0){
			for(var y = 0; y < numberOfTokens; y++){
				if(arraysOfAsins.length == 0)
					continue;
				var firstArray = arraysOfAsins.splice(0, 1);
				tmpAr[y].push(firstArray)
				}				
		}

		//return callback(tmpAr);

		// Each array inside of the tmpAr is intended to be the request body of a call to the serverless function
		console.log(398, "There are", numberOfTokens, "tokens available");

		var testResponse = [];
		console.log(412, testResponse.length);

		for(var i = 0; i < numberOfTokens; i++){
			//console.log(400, "Calling axios", i+1, "times");
			setTimeout( (arrayOfAsins, refreshToken, callback) => {
				//console.log(412, "The first ASIN is", arrayOfAsins[0][0]);

				//console.dir(arrayOfAsins, {'maxArrayLength': null})

				this.axiosRequest(arrayOfAsins, refreshToken, callback);

			}, 1250*i, tmpAr[i], refreshTokensAr[i]["refreshToken"], (resp) => {
				testResponse.push(resp);
				//console.log(406, "axios returned", numberOfTokens);
				if(testResponse.length == numberOfTokens){
					//callback(testResponse)
					console.log()
					postProcessResponseData(testResponse, (results) => {
						//console.dir(results, {'maxArrayLength': null})
						callback(results);
					});
				}
			})
		}

		function postProcessResponseData(responseData, callback){

			var tmp = [];

			var results = responseData;

			var asinsT = [];
			for(var result of results){

				for(var response of result){

					for(var requests of response.responses){
						//console.log(requests.request.Asin);	
						var asinData = { "ASIN" : requests.request.Asin, "isValidAsin": true }

						if(requests.status.statusCode > 399){
							asinData["isValidAsin"] = false;
							asinData["errors"] = requests.body.errors[0]
						} else {
							var lowestLandedPrice = "unavailable";
							if(typeof requests.body.payload.Summary.LowestPrices != 'undefined'){
								lowestLandedPrice = requests.body.payload.Summary.LowestPrices[0]["LandedPrice"].Amount;
							}
							delete requests.body.payload.Offers;
							delete requests.body.payload.Summary;
							delete requests.body.payload.Identifier;
							asinData = { ... requests.body.payload, isValidAsin: true, lowestLandedPrice: lowestLandedPrice }
						}

						asinsT.push(asinData)
					}
					

				}

			}

			console.log(452, "We got", asinsT.length, "requests returned");

			return callback(asinsT);

		}
		

	}