/*
	Long input is not currently supported.  While I expect this to change in the future, making this code
	irrelevant, it's needed now.  

	Essentially, we break down the input into smaller, more managable chunks.
*/

 import ChatGPT from './chatgpt.js';
import axios from 'axios';
import Voca from 'voca';
import {
  setTimeout,
  setImmediate,
  setInterval,
} from 'timers/promises';

const auth_token = process.env.chatgpt_auth_token;

export default class Frames extends ChatGPT {

	maxInput = 1000;

	constructor(){
		super();	
	}

	// Takes long input and chunks it into manageable levels.  
	// datatype is an enum that can be text, csv, html
	// returns an array of arrays
	chunkData(longInput ='', datatype ='text'){

		if(datatype == 'csv'){
			return this.chunkCsv(longInput)
		}

		if(datatype == 'text'){
			return this.chunkText(longInput)
		}

		if(datatype == 'html'){
			return this.chunkHtml(longInput);
		}

		return false;
	}

	chunkCsv(longInput){
		let data = longInput;
		let maxInput = this.maxInput;

		let delimiter = ',';

		data = data.split(',');

		// We're limiting our requests to approximately 1,000 words.
		var totalWordCount = 0;
		var chunkCount = 0;

		// We're creating an array of arrays
		var dataChunks = [ Array() ];

		for(var element of data){
			var wordCount = Voca.countWords(element);
			totalWordCount += wordCount;
			if(totalWordCount >= maxInput){
				chunkCount++;
				totalWordCount = 0;
				dataChunks.push( Array() );

			}
			dataChunks[chunkCount].push(element)
		}
		return dataChunks;
	}

	chunkText(longInput){
		let maxInput = this.maxInput;
		let data = Voca.words(longInput);

		let wordCount = Voca.countWords(longInput);

		if(wordCount <= maxInput){
			return [ data.join(" ") ];
		}


		var dataChunks = Array();
		// Determine the number of frames
		let frameCount = Math.ceil( wordCount / maxInput )

		//console.log(86, wordCount, frameCount, maxInput)

		for(let i = 0; i < frameCount; i++){
			let frame = data.splice(0, maxInput).join(" ");
			dataChunks.push(frame);
		}

		return dataChunks;
	}

	/* A more sophisticated implementation is planned for the future */
	chunkHtml(longInput){
		return this.chunkText(longInput);
	}

	/* there are basically two strategies: async and sequential.  Sequential is used when the output result from a previous response
		is essential as an input to analyze the next frame.  It's far more complicated, so we'll do it, but first we'll just do the async
		analysis
	*/

	prepareRequests(dataChunks =[], inputLabel ='', prompt ='', output =''){

		let requests = [];

		for(var i = 0; i < dataChunks.length; i++){
			let dataChunk = dataChunks[i];
			let firstInput = `We are doing a chunked analysis of data.  This is frame ${i+1} of ${dataChunks.length}.  ${inputLabel}: ${dataChunk}`;
			var request = `${firstInput}.  [End Input].  Instructions: ${prompt}. Output: ${output} `;
			requests.push(request);
		}
		return requests;
	}

	async getContent(possibleUrl ='', analysisTarget, layer){
		if(this.isValidHttpUrl(possibleUrl)){
			var targetPage = await this.getRenderedHTML(possibleUrl);
				if(targetPage === false){
					this.errors.error("prompt_error", "Unable to get first rendered page");
						return false;			
				}
			var targetElementContent = await targetPage.evaluate((analysisTarget, layer) => {
			    	return document[analysisTarget][layer];
			    }, analysisTarget, layer);
			return targetElementContent;
		} else {
			return possibleUrl;
		}		
	}

	async getResponses(requestsAr){

		let responses = [];
		let index = 0;
		for(let request of requestsAr){
			let previousFrame = '';
			if(index > 0){
				previousFrame = responses.join(" ");
			}
			let response = await this.getSingleResponse(request, previousFrame)
			responses.push(response);
			index++;
		}	
		return responses[responses.length-1];	
	}

	async complexPrompt(input ='', prompt ='', output ='', analysisTarget ='', comparisonTarget ='', model ='', layer ='innerText', firstInputLabel ='', secondInputLabel ='', validation ={}, functionName ='', functionId ='', chunkSize =1000){

		this.maxInput = chunkSize;
		let inputData = '';
		//console.log(136, input, this.isValidHttpUrl);

		let firstInputContent = await this.getContent(input, analysisTarget, layer);
		let firstInputChunks = this.chunkData(firstInputContent);
		let firstInputRequests = this.prepareRequests(firstInputChunks, firstInputLabel, prompt, output);	

		let secondInputContent = await this.getContent(comparisonTarget, analysisTarget, layer);
		let secondInputChunks = this.chunkData(secondInputContent, 'csv');
		let secondInputRequests = this.prepareRequests(secondInputChunks, secondInputLabel, prompt, output);

		// let totalRequests = firstInputRequests.length + secondInputRequests.length

		// let responses = [];
		// let index = 0;
		// for(let request of firstInputRequests){
		// 	let previousFrame = '';
		// 	if(index > 0){
		// 		previousFrame = responses.join(" ");
		// 	}
		// 	let response = await this.getSingleResponse(request, previousFrame)
		// 	responses.push(response);
		// 	index++;
		// }

		let responsesAsString = await this.getResponses(firstInputRequests);
		//let finalFirstResponse = responses[responses.length-1];


		// let consolidatedResponse = await this.getSingleResponse(`This is a series of summarizations you did, chunked into frames for which you did not have proper context.  Combine these responses into a single response.  ${responsesAsString}`);
		//console.log(150, targetPage)

		// let secondInputContent = comparisonTarget;
		// if(comparisonTarget != ''){
		// 	if(this.isValidHttpUrl(comparisonTarget)){
		// 		var comparisonTargetPage = await this.getRenderedHTML(comparisonTarget);
		// 		if(comparisonTargetPage === false){
		// 			this.errors.error("prompt_error", "Unable to get second rendered page");
		// 			return false;			
		// 		}
		// 	} else {
		// 		secondInputContent = comparisonTargetPage;
		// 	}
		// }

		// let firstInputChunks = this.chunkData(firstInputContent);
		// let secondInputChunks = this.chunkData(secondInputContent);

		return this.response.reply( { response:  responsesAsString } );
		


	}


}