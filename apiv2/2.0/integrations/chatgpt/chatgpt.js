/*
	This class manages the API calls to the OpenAI API
*/
import puppeteer from 'puppeteer'
import Integrations from '@integrations/integrations.js';
import axios from 'axios';
import Voca from 'voca';
import {
  setTimeout,
  setImmediate,
  setInterval,
} from 'timers/promises';

const auth_token = process.env.chatgpt_auth_token;

var Browser; 

puppeteer.launch({ headless: "new",  timeout: 0 })
  .then((browser) => {
    // Use the browser instance here
    Browser = browser;
  })

export default class ChatGPT extends Integrations {

	bearerToken = `Bearer ${auth_token}`
	contentType = 'application/json'
	endpoont = 'https://api.openai.com/v1/chat/completions'
	method = 'post'

	model = 'gpt-3.5-turbo';
	messages = [];

	payload = { }

	constructor(){
		super();
		this.Browser = Browser;
		this.payload = {
			"model" : this.model,
			"messages": this.messages
		}

		this.config = {
		  method: this.method,
		  maxBodyLength: this.maxBodyLength,
		  url: this.endpoont,
		  headers: { 
		    'Content-Type': this.contentType, 
		    'Authorization': this.bearerToken
		  },
		  data : JSON.stringify(this.payload)			
		}
	}

	constructMessage(content ='', role ='user', data =''){
		var msg = {
			"role": role,
			"content":content + ". " + data
		}
		this.messages.push(msg)
		return msg;
	}

	/**
	 * Estimate the number of tokens in a given prompt.
	 *
	 * @param {string} prompt - The prompt string to estimate the number of tokens for.
	 * @returns {number} The estimated number of tokens in the prompt.
	 */
	estimateNumTokens(prompt) {
	  // Split the prompt into an array of words using whitespace as a delimiter
	  const words = prompt.split(/\s+/);

	  // Count the number of words that do not contain digits or punctuation
	  const numTokens = words.reduce((count, word) => {
	    if (/^[a-zA-Z]+$/.test(word)) {
	      count += 1;
	    }
	    return count;
	  }, 0);

	  return numTokens*2;
	}


	constructPayload(promptsAr =[]){
		this.payload.messages = promptsAr;
		this.config.data = JSON.stringify(this.payload)
	}

	async getSingleResponse(prompt ='', previousFrame =''){

		var msg = this.constructMessage(`Previous Frame Response: ${previousFrame}.` + prompt);
		this.constructPayload([msg]);

		console.log(97, msg);
		
		let response;
		try {
			response = await axios.request(this.config)
		} catch(err){
			console.log(64, err.message);
			return JSON.stringify(err);
		}

		var responses = response.data;

		var responseAsString = '';
		if(Array.isArray(responses.choices)){
		var resAr = responses["choices"];

		 	for(var res of resAr){
		       var msg = res["message"];
				responseAsString += msg["content"];
		 	}
		}

		return responseAsString;
	}

	// Partitions long input into frames, to chunk LLM input
	// Frames are intended to overlap.  
	partitionDataIntoFrames(input =''){

	}

	// This function takes the data object and breaks it up into manageable chunks.
	async getBatchResponse(prompt ='', role ='', data ='', callback, delimiter =','){

		// If our data is a comma separated list, convert it back into an array for easier manipulation
		if(delimiter == ','){
			data = data.split(',');
		}

		// We're limiting our requests to approximately 1,000 words.
		var totalWordCount = 0;
		var chunkCount = 0;

		// We're creating an array of arrays
		var dataChunks = [ Array() ];

		for(var element of data){
			var wordCount = Voca.countWords(element);
			totalWordCount += wordCount;
			if(totalWordCount >= 1000){
				chunkCount++;
				totalWordCount = 0;
				dataChunks.push( Array() );

			}
			dataChunks[chunkCount].push(element)
		}

		// Each array inside the 'dataChunks' array represents the data payload for a distinct openai request.
		// We need to construct an axios request for each element.
		var requests = [];

		for(var request of dataChunks){
			// In our constructor, we define an axios request.  We use that as a template by making a copy of it.
			var payload = { ... this.payload }
			var axiosRequest = { ... this.config }

			// We need
			var message = this.constructMessage(prompt, role, request.toString());
			payload.messages = [ message ];
			axiosRequest.data = JSON.stringify(payload);
			requests.push(axiosRequest);
			
		}
		
		// The rate limits for the openai api are not the most straightforward.  But to keep it simple, for a paid
		// plan we're limited to 20 requests per minute.
		// So, we turn control over to a function whose job it is to send a lot of requests while pausing
		this.rateLimitedBatchRequests(requests, callback);
		return true; 
	}

	async request(config){

		let response;
		try {
			response = await axios.request(config);
		} catch(err){
			console.log(64, err.message);
			return JSON.stringify(err);
		}

		var responses = response.data;

		var responseAsString = '';
		if(Array.isArray(responses.choices)){
		var resAr = responses["choices"];

		 	for(var res of resAr){
		       var msg = res["message"];
				responseAsString += msg["content"];
		 	}
		}
		return responseAsString;		
	}

	async rateLimitedBatchRequests(requestsAr =[], callback){
		// First, calculate how many loops we're going to need
		var maxRequestsPerBatch = 20;
		var numIterations = Math.ceil( requestsAr.length / maxRequestsPerBatch );
		var rateLimitInMilliseconds = 10000;
		var position = 0;

		var resultsAr = [];
		var rVal = [];
		var promisesReturned = 0;
		var promisesExpected = requestsAr.length;
		var requestNum = 0;

		for(var iteration = 0; iteration < numIterations; iteration++){
			for(var request = 0; request < maxRequestsPerBatch; request++){
				if(position >= requestsAr.length){
					request = maxRequestsPerBatch;
					iteration = numIterations;
					break;
				}
				var req = requestsAr[position];
				console.log(225, position);
				var result = this.request(req);

				result.catch(() => {}).then((re) => {
					promisesReturned++;
					console.log(231, promisesReturned, "Response Received");
					resultsAr.push(re);
					// Store our results in an array
					
				});
				requestNum++;
				position++;
			}
			if(position < requestsAr.length){
				console.log(212, "New Batch -- wait");
				await setTimeout(10500, 'test')
			}
		}

		while(true){
			await setTimeout(2000);
			console.log(221, promisesReturned, promisesExpected);
			if(promisesReturned == promisesExpected){
				console.log(221, "all promises returned");
				callback(resultsAr);
				break;
			}
		}

		return true
	}

	/**
	 * Asynchronously runs a chain of prompts in sequence and invokes a callback function
	 * with the final result.  The result from a link in the chain is used as input for the
	 * next prompt.
	 *
	 * @async
	 * @function
	 * @param {Array} promptsAr - An array of prompts to run in sequence.
	 * @param {Function} callback - The function to call with the final result.
	 * @returns {Promise} A Promise that resolves with the final result of the prompt chain.
	 *
	*/
	async promptChain(promptsAr =[], callback){
		console.log(270, 'promptChain', promptsAr, callback)
		var result = '';
		var responsesAr = [];
		for(var prompt of promptsAr){
			console.log(273, prompt);

			result = await this.getSingleResponse(prompt, 'user', result);
			responsesAr.push(result);
			
		}
		console.log(280, responsesAr)
		callback(responsesAr);
		console.log(270, 'promptChain')
	}

	isValidHttpUrl(string) {
	    let url;
	  
	    try {
	        url = new URL(string);
	    } catch (err) {
	        return false;  
	    }
	  
	   return true;
	}

	async getRenderedHTML(url) {
	    var page = await Browser.newPage();
	    await page.goto(url, { waitUntil: 'domcontentloaded' });
	    return page;
	}

}
