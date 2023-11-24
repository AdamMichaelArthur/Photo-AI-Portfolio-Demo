

console.log(3, "base.js loaded");

const dotenv = require("dotenv");
dotenv.config();

require("module-alias/register");
require('@root/db');

console.log(process.env)

process.exit(1);

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
			http_verb:  { type: String, default: "" },  // the http verb we will use to execute this request
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
