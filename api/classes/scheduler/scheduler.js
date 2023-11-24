/*
	Created 5/20/2020 by Adam Arthur
	This file is designed to create a database driven scheduler
	that is independent of the OS (i.e. not using cron jobs) and
	is also not using Javascript timers.  

	A few goals

	I want to make creating scheduled tasks extremely easy.  Mind numbingly easy
	Here's how this is going to work

	Anytime a document is inserted into the database, we are going to have a 'schedule' object

	"schedule": {
		date: String,	// This is when the item will be called
		timezone_offset: integer,
		status: "incomplete" || "pending" || "completed" || "failed" // A status indicator. 
		repeats: true || false
		repeat_frequency: {
			seconds: integer, (valid values 0 - 60)	
			minutes: integer, (valid values 0 -60)
			hours: integer, (valie values 0-23)
			days: integer, (valid values 0-31)
			weeks: integer, (valid values 0-4),
			months: integer, (valid values 0-12)
			years: integer, (valid values 0-1) (if someone wants to schedule something every other year or something like that, this isn't really intended for that)
		},
		payload: {
			target_url: String, // (the target url of the api we wish to call on a scheduke)
			http_verb: String,  // the http verb we will use to execute this request
			http_headers: [], // A series of http headers that is presumeably needed to fulfill this request
			http_body: String, // The body of the http request,
			http_authorization: Object // Instructions for how to deal with invalid or expired authorization
										// For early versions we will need to use mechanisms that don't expire
		},
		attempts: [
			{
				date: String,
				status: integer, // the http status code returned by the api
				success: boolean, // true is 200 returned, false if not
				response: String, // the response that was received by the attempt
				
			}
		]
	}

	The idea is that you can use this to schedule any API request.  One complication is that 
	authentication credentials can expire.  So we need a robust mechanism to deal with this
	possibility.


*/
const dotenv = require("dotenv");
dotenv.config();

require("module-alias/register");
require('@root/db');

var mongoose = require( 'mongoose');
const Schema = mongoose.Schema;

var scheduleSchema = new mongoose.Schema({
	// created: { type: Date, default: Date.now },
	// modified: { type: Date, default: Date.now, required: true },
	// created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	// modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	// owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	date: { type: Date, default: 0 },	// This is when the item will be called
	timezone_offset: { type: Number, default: 0},
		status: { type: String, default: "incomplete" }, //"incomplete" || "pending" || "completed" || "failed" // A status indicator. 
		repeats: {type: Boolean, default: false }, 
		repeat_frequency: {
			seconds: { type: Number, default: 0 },//(valid values 0 - 60)	
			minutes: { type: Number, default: 0 },//(valid values 0 -60)
			hours: { type: Number, default: 0 },//(valie values 0-23)
			days: { type: Number, default: 0 },//(valid values 0-31)
			weeks: { type: Number, default: 0 },//(valid values 0-4),
			months: { type: Number, default: 0 },//(valid values 0-12)
			years: { type: Number, default: 0 } //(valid values 0-1) (if someone wants to schedule something every other year or something like that, this isn't really intended for that)
		},
		payload: {
			target_url: { type: String, default: "" },// (the target url of the api we wish to call on a scheduke)
			http_verb:  { type: String, default: "GET" },  // the http verb we will use to execute this request
			http_headers: [], // A series of http headers that is presumeably needed to fulfill this request
			http_body:  { type: String, default: "" }, // The body of the http request
		},
		attempts: [
			{
				date: String,
				status: Number, // the http status code returned by the api
				success: { type: Boolean, default: false}, // true is 200 returned, false if not
				response: String, // the response that was received by the attempt
				
			}
		]
}, { strict: false });

mongoose.model("Schedule", scheduleSchema);

var model = mongoose.model("Schedule");

// var now = Date.now();
// model.create(
// 	{ 
// 		"date": now + 72000,
// 		"payload": {
// 			"target_url":"https://www.google.com",
// 			"http_verb":"GET"
// 		}
// 	}
// 	);
// model.create({ "date": now + 10000 });
// model.create({ "date": now + 10000 });
// model.create({ "date": now + 10000 });
// model.create({ "date": now + 10000 });

// model.create({ "date": now + 60000 });
// model.create({ "date": now + 60000 });
// model.create({ "date": now + 60000 });
// model.create({ "date": now + 60000 });
// model.create({ "date": now + 60000 });

//mongoose.connection.db.collection("roles").findOne(

async function checkTime() {

	let ts = Date.now();
	let date_ob = new Date(ts);
	// let date = date_ob.getDate();
	// let month = date_ob.getMonth() + 1;
	// let year = date_ob.getFullYear();
	// let hour = date_ob.getUTCHours();
	// let minute = date_ob.getUTCMinutes();
	// let seconds = date_ob.getUTCSeconds();
	// let milliseconds = date_ob.getUTCMilliseconds();
	//console.log(year + "-" + month + "-" + date + "T" + hour + ":" + minute + ":" + seconds + ":" + milliseconds + "+0");
	//var utcDate = year + "-" + month + "-" + date + "T" + hour + ":" + minute + ":" + seconds + ":" + milliseconds + "+0";

	var results = await model.updateMany({"date": { "$lte": date_ob }, "status":"incomplete" }, 
		{ "status" : "pending"}, { "upsert": false, "multi":true});

	if(results.nModified > 0){
		console.log("We updated some documents!");
	}

	setTimeout(async function(){
		await checkTime()
	}, 100)
}

console.log("Starting my endless loop");

checkTime()
