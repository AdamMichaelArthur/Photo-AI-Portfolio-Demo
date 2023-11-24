import Base from '@base';
import ChatGPTIntegration from '@chatgpt';
import Frames from '@integrations/chatgpt/frames.js';

import Scraper from '@scraper'
import axios from 'axios'
import puppeteer from 'puppeteer'
import Voca from 'voca'

var Browser; 

// puppeteer.launch({ headless: "new",  timeout: 0 })
//   .then((browser) => {
//     // Use the browser instance here
//     Browser = browser;
//   })

export default class Chatgpt extends Base {

	constructor(){
		super();
		this.Browser =  Browser;
		try {
			this.chatGPT = new ChatGPTIntegration();
			this.frames = new Frames();
			Object.assign(this.frames, this);
		} catch(err){
			console.log(1, err);
		}
	}

	async processBulkRequest(prompt ='', dataAr =[]){
		var data = `data: ${dataAr.toString()}`;

		this.timeout = 0;

		try {
			await this.integrations.chatgpt.getBatchResponse(prompt, 'assistant', data, (resultsAr) => {
			var resultVal = [];
			for(var result of resultsAr){
				console.log(44, result);
				let arr = result.split(".");	
				console.log(45, arr);	
				arr = arr.map(str => str.trimStart());
				resultVal = resultVal.concat(arr);
			}
			this.response.reply(resultVal);
			}, "\\n");

		} catch(err){
			console.log(53, err);
		}
	}


	async promptChain(promptsAr =[]){
		try {
			var response = await this.authorship.promptChain(promptsAr, (resultsAr) => {
				this.response.reply(resultsAr);
			})
		} catch(err){
			console.log(21, err);
		}
	}

	async getSingleResponse(promptsAr =[]){
		try {
			var response = await this.integrations.chatgpt.getSingleResponse(promptsAr);
		} catch(err){
			console.log(21, err);
			return '';
		}
		return response;
	}

	async scrape(){
		this.response.reply(this.integrations.chatgpt.seo.setTest());
	}

	// async getRenderedHTML(input){

	// 	let bSuccessfulScrape = false;
	// 	let maxScapeAttempts = 5;
	// 	let scrapeAttempts = 0;
	// 	var targetPage;
	// 	while(!bSuccessfulScrape){

	// 	if(this.isValidHttpUrl(input)){
	// 				try {
	// 					targetPage = await this.getRenderedHTML(input);
	// 					bSuccessfulScrape = true;
	// 				} catch(err){

	// 				}
	// 	}
	// 		scrapeAttempts++;
	// 		if(scrapeAttempts > maxScapeAttempts){
	// 			break;
	// 		}
	// 	}

	// 	if(bSuccessfulScrape){
	// 		return targetPage;
	// 	} else {
	// 		return false;
	// 	}
	// }

	async executeGptFunction(functionName ='', input1 ='', input2 =''){
		// Step 1 -- pull the function from the database
		console.log(144, functionName, input1, input2);

		let collection = this.database.mongo.db.collection('gptfunctions');
		let gptFunction = await collection.findOne({ "functionName" : functionName } );
		//this.response.reply(gptFunction);
		await this.promptExplorer(input1, gptFunction.prompt, gptFunction.output, gptFunction.analysisTarget, input2, gptFunction.model, gptFunction.layer, gptFunction.firstInputLabel,
		 gptFunction.secondInputLabel, gptFunction.validation, gptFunction.functionName, gptFunction.functionId);
	}

	async simpleWebpageInput(input ='', prompt ='', output =''){

		this.timeout = 0;

		//this.response.reply( { summary: "response "} );

		console.log(124, input);

		if(!input.includes("https://")){
			if(!input.includes("http://")){
				input = "http://" + input;
			}
		}

		console.log(132, "Input length", input.length);

		if(this.isValidHttpUrl(input)){
			var targetPage = await this.getRenderedHTML(input);
			//console.log(targetPage);
			if(targetPage === false){
				console.log(138);
					return false;			
			}
		} else {
				console.log(142);
				return false;
			}

		let inputData = targetPage;

		var endInput = "[end input data].  ";

		var final_prompt =  `${inputData}${endInput}Instructions: ${prompt}`;

		//console.log(139, final_prompt);

		try {
			var response = await this.getSingleResponse(final_prompt);
		} catch(err){
			console.log(157, err);
			return false;
		}

		console.log(161, response);

		this.response.reply( { summary: response } );

	}

	/**
	 * Prompt Explorer is a utility that allows a user to experiment with different prompts, using text or web pages as input.
	 * @param {string} [input=''] - The input parameter.  This can be text or a URL
	 * @param {string} [prompt=''] - The prompt parameter.  This is a text prompt, similar to what you'd use for ChatGPT
	 * @param {string} [output=''] - The output parameter.  This is a description of how GPT should output the result
	 * @param {string} [analysisTarget=''] - The analysis target parameter.  This is the HTML element we're analyzing
	 * @param {string} [comparisonTarget=''] - The comparison target parameter.  THis is a url of a page we're comparing against
	 * @param {string} [model=''] - The model parameter.  The GPT model
	 * @param {string} [layer='innerText'] - The layer parameter.  What should be extracted from the html element
	 * @returns {Promise} A Promise that resolves with the result of the exploration and analysis.
	 */
	async promptExplorer(input ='', prompt ='', output ='', analysisTarget ='', comparisonTarget ='', model ='', layer ='innerText', firstInputLabel ='', 
		secondInputLabel ='', validation ={}, functionName ='', functionId ='', chunkSize =0, functionTemperature =1){

		console.log(134, chunkSize);

		// If a webpage is used as the input, we assume this is a complex prompt type that requires, well, more complex handling.
		if(this.isValidHttpUrl(input)){
			return await this.frames.complexPrompt(input, prompt, output, analysisTarget, comparisonTarget, model, layer, firstInputLabel, secondInputLabel, validation, functionName, functionId, chunkSize);
		}

		let inputData = '';

		if(input != ''){
			if(this.isValidHttpUrl(input)){
				var targetPage = await this.getRenderedHTML(input);
				if(targetPage === false){
					this.errors.error("prompt_error", "Unable to get first rendered page");
					return false;			
				}
			} else {
				inputData += `${firstInputLabel}: ${input}. `;
			}
		}

		if(comparisonTarget != ''){
			if(this.isValidHttpUrl(comparisonTarget)){
				var comparisonTargetPage = await this.getRenderedHTML(comparisonTarget);
				if(comparisonTargetPage === false){
					this.errors.error("prompt_error", "Unable to get second rendered page");
					return false;			
				}
			} else {
				inputData += ` ${secondInputLabel}: ${comparisonTarget}. `;
			}
		}

		// We need to assume that our inputs are long.  In this scenario, we will actually have two sets of requests to deal with:
		// the first input and the second input. 
		console.log(198, analysisTarget, layer);

		if(typeof targetPage !== 'undefined'){try {
		    var targetElementContent = await targetPage.evaluate((analysisTarget, layer) => {
			    	// The <head> tag will often contain script and style tags, which aren't useful for our analysis.  So we remove them when the <head> is requested
			    	//if(analysisTarget == 'head'){
			    		
			    	//if((analysisTarget == 'innerHTML')||(analysisTarget == 'outerHTML')){
					    // const head = document.querySelector(analysisTarget);
					    const scripts = document.querySelectorAll('script');
					    const styles = document.querySelectorAll('style');
					    const links = document.querySelectorAll('nav');
					    const iframes = document.querySelectorAll('iframe');
					    scripts.forEach((script) => {
					      script.remove();
					    });
					    styles.forEach((style) => {
		      				style.remove();
		    			});
		    			links.forEach((link) => {
		    				link.remove();
		    			});
		    			iframes.forEach((iframe) => {
		    				iframe.remove();
		    			});
		    		//}

		    		
		    			
					    //return head;
					//}


			       return document[analysisTarget][layer];
			    }, analysisTarget, layer);} 
		    	catch(err){
		    			console.log(215, err);
		    		}
		    console.log(227, targetElementContent)
		    inputData += `This is your input, labeled: ${firstInputLabel}: ${targetElementContent}`
		}

		// output = { "prompt": inputData }
		// this.response.reply( { response: output } );
		// return;

		if(typeof comparisonElementContent !== 'undefined'){
			var comparisonElementContent = await comparisonTargetPage.evaluate((analysisTarget, layer) => {
		    	if(analysisTarget == 'head'){
		    		
				    const head = document.querySelector('head');
				    const scripts = head.querySelectorAll('script');
				    const styles = head.querySelectorAll('style');
				    const links = head.querySelectorAll('link');
				    scripts.forEach((script) => {
				      script.remove();
				    });
				    styles.forEach((style) => {
	      				style.remove();
	    			});
	    			
	    			links.forEach((link) => {
	    				link.remove();
	    			});
	    			
				    return head.innerHTML;
				}


		       return document[analysisTarget][layer];
		    }, analysisTarget, layer);
		     inputData += `This is your second input, labeled: ${secondInputLabel}: ${comparisonElementContent}`
		}
		
		

		//`You have been given the document.${layer} <${analysisTarget}> ElementRef(s) from two html documents: labeled ${firstInputLabel} and ${secondInputLabel}.  `
		var endInput = "[end input data].  ";
		if(inputData.length < 5){
			endInput = '';
		}

		prompt =  `${inputData}${endInput}Instructions: ${prompt}\n\nOutput Format: ${output}`;

		//console.log(253, inputData, endInput, prompt, output)
		//output = { "prompt": prompt }
		//this.response.reply( { response: output } );
		let response = await this.getSingleResponse(prompt);
		var output = "";
			let sanitizedResponse = Voca.replaceAll(response, `\n`, "");
			sanitizedResponse = Voca.replaceAll(sanitizedResponse, `\\"`, `"`);
			sanitizedResponse = Voca.replaceAll(sanitizedResponse, `'`, `"`);
			console.log(211, sanitizedResponse);
		try {

			output = JSON.parse(sanitizedResponse)
		} catch(err){
			console.log(124, "Unablet to parse JSON");
			output = { "unable_to_parse_json": sanitizedResponse }
		}
		
		// Input can be a URL.  If so, we fetch the html from it and use that as input.
		this.response.reply( { response: output } );

	}

	async fetchHtml(url) {
	    try {
	        const response = await axios.get(url);
	        return response.data;
	    } catch (error) {
	        console.error(`Failed to fetch HTML from ${url}:`, error);
	        throw error; // re-throw the error unchanged
	    }
	}

	async getRenderedHTML(url) {
	    //const browser = await puppeteer.launch( { headless: "new" } );
	   console.log(237);
	    const page = await this.Browser.newPage();
	    await page.goto(url, { waitUntil: 'networkidle2' }); // wait until all resources are loaded
	    try {
        	await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 }); // wait until all resources are loaded or 5 seconds have passed
    	} catch (error) {
        	console.error(342, error); // logs an error if the timeout occurs
        	// You can handle the timeout error here as needed
        	//return null;
    	}

	    const content = await page.content(); // get the rendered HTML

		console.log(144, content);

	    const textContent = await page.evaluate(() => {
	        return document.body.innerText;
	    });

	    

	    return textContent;
	}

	isValidHttpUrl(string) {
	    let url;
	  
	    try {
	        url = new URL(string);
	    } catch (_) {
	        return false;  
	    }
	  
	   return true;
	}

	testLongInputChunk(longInput ='', prompt ='', output =''){

		var wordCount = Voca.countWords(longInput);
		console.log(305, "We have", wordCount);
		let chunks = this.frames.chunkData(longInput, 'text')

		let requests = this.frames.prepareRequests(chunks, 'gibberish', prompt, output)
	
		console.log(311, requests.length);

		this.response.reply( { "chunks": requests } );
		return true;
	}

  async test(str ='', num =0, bVar =false, opt =0){
    this.response.reply("works");
    return true;
  }

}