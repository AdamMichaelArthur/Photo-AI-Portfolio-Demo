/* Handle Public Routes */
import Base from '../Base/base.js'
import express from 'express';
import http from 'http';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import fs from 'fs'
import Voca from 'voca'
import Errors from '../Errors/errors.js'
import DatabaseConnection from '../Database/Mongo/mongo.js'
import Response from '../Response/response.js';
import dayjs from 'dayjs';
import { DateTime } from "luxon";

import {
  setTimeout,
  setImmediate,
  setInterval,
} from 'timers/promises';

var standardScheduledDocument = {
	date: 0,	// This is when the item will be called
	timezone_offset: 0,
	iana_zone: 'Europe/London',
		status: 'incomplete', // waiting || "incomplete" || "pending" || "completed" || "failed" // A status indicator. 
		repeats: false, 
		repeat_frequency: {
			seconds: 0,//(valid values 0 - 60)	
			minutes: 0,//(valid values 0 -60)
			hours: 0,//(valie values 0-23)
			days: 0,//(valid values 0-31)
			weeks: 0,//(valid values 0-4),
			months: 0,//(valid values 0-12)
			years: 0 //(valid values 0-1) (if someone wants to schedule something every other year or something like that, this isn't really intended for that)
		},
		payload: {
			target_url:'',// (the target url of the api we wish to call on a scheduke)
			http_verb:  '',  // the http verb we will use to execute this request
			http_headers: [], // A series of http headers that is presumeably needed to fulfill this request
			http_body:  '', // The body of the http request
		},
		attempts: [
			{
				date: 0,
				status: 0, // the http status code returned by the api
				success: false, // true is 200 returned, false if not
				response: 0, // the response that was received by the attempt
				
			}
		]
};

export default class Scheduler {

	// The trickiest part, as far as I can tell, is going to be timezone harmonization.

	/* All scheduled documents will execute the request at the provided executionDate in the UTC time.  This is intended to be set at the system level.  
		Timezone adjustments must be made prior to calling scheduleFutureApiCall
	*/

	async scheduleRepeatingApiCall(){

	}

	async scheduleFutureApiCall(executionDate =0, target_url ='', options ={}, http_headers =[], http_body ={}, http_verb ='GET'){

		// First, enforce the format of the executionDate
		if(this.isValidFutureUnixTimestamp(executionDate) === false){
			console.error("scheduleFutureApiCall required an executionDate that's in the future");
			return false;
		}

		// if(this.isFullyQualifiedHttpUrl(target_url) === false){
		// 	console.error("scheduleFutureApiCall target_url parameter requires a fully qualified url, starting with http or https");
		// 	return false;
		// }

		if(!Array.isArray(http_headers)){
			console.error("scheduleFutureApiCall http_headers must be an array");
			return false;
		}

		let scheduledDocument = {};
		Object.assign(scheduledDocument, standardScheduledDocument);
		
		scheduledDocument.date = executionDate;
		scheduledDocument.payload.target_url = target_url;
		scheduledDocument.http_verb = http_verb;
		scheduledDocument.payload.http_body = http_body;
		scheduledDocument.payload.http_headers = http_headers;

		let db = global.db;
		let scheduled_events = await db.collection("scheduled_events");

		await scheduled_events.insertOne(scheduledDocument);

	}

	isValidFutureUnixTimestamp(timestamp) {
	  // Check if the timestamp is a number
	  if (typeof timestamp !== 'number') {
	    return false;
	  }

	  // Check if the timestamp is a positive integer
	  if (!Number.isInteger(timestamp) || timestamp < 0) {
	    return false;
	  }

	  // Check if the timestamp is within a reasonable range
	  const currentTimestamp = Date.now();
	  const maxTimestamp = currentTimestamp + (1000 * 60 * 60 * 24 * 365 * 10); // Allow timestamps up to 10 years in the future
	  if (timestamp > maxTimestamp) {
	    return false;
	  }

	  const minTimestamp = currentTimestamp - (1000 * 60 * 5); // Allow timestamps up to 5 minutes in the past
	  if (timestamp < minTimestamp) {
	    return false;
	  }

	  // Otherwise, the timestamp is considered valid
	  return true;
	}

	isFullyQualifiedHttpUrl(url) {
  		const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{2,5})?(\/\S*)?$/i;
  		return urlPattern.test(url);
	}

}

let scheduler = new Scheduler();	 


console.log(134, Date.now());

async function checkTime() {

	await setTimeout(3000);

	let scheduled_events = global.db.collection("scheduled_events");

	scheduled_events.watch(options).on('change', data => {
		//console.log(150, "Update Event");
		if(data.operationType == 'update'){
		  	console.log(16, 'Creating a request', data);	
		  	//createRequest(data.fullDocument);
		  }
	})

	await setTimeout(3000);

	console.log(152, "In 60 seconds look for an event execution");

	scheduler.scheduleFutureApiCall(Date.now()+60000, "/api/test");

	scheduler.scheduleFutureApiCall(Date.now()+120000, "/api/test");

	await setTimeout(3000);


	var pipeline = { "$match" : { "status" : "pending" } };

	var options = { "fullDocument":"updateLookup" }


	let bCheckForScheduledEvents = true;
	while(bCheckForScheduledEvents){
		let ts = Date.now();
		let date_ob = new Date(ts);
		await scheduled_events.updateMany({"date": { "$lte": ts }, "status":"incomplete" }, 
			{ $set: { "status" : "pending"} }, { "upsert": false });
		await setTimeout(1250);
	}

}

async function createRequest(requestDocument){

	console.log(216, requestDocument, "will execute")

}

console.log("Starting my endless loop");

//checkTime()



//         
// let isValid = scheduler.isValidUnixTimestamp(1686915717026);

// console.log(135, isValid);

// const currentTimestamp = Date.now();
// console.log(currentTimestamp);

//let test = DateTime.fromMillis(1542674993410);
//console.log(115, test);















