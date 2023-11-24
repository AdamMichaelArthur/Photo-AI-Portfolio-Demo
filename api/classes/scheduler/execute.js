require("./base.js");
var https = require('http');

var mongoose = require( 'mongoose');
var model = mongoose.model("Schedule");

var pipeline = {
	 	"$match" : { "status" : "pending" }
	};

var options = {
		"fullDocument":"updateLookup"
	}

model.watch(options).on('change', data =>
	  {

	  	if(data.operationType == 'update'){
	  		console.log(16, 'Creating a request');	
	  		createRequest(data.fullDocument);
	  	}
	  })

function createRequest(payloadDocument){

	var url = payloadDocument.payload.target_url;

	//console.log(28, payloadDocument);

	const data = JSON.stringify(payloadDocument.payload.http_body)

	var headers = {
		... payloadDocument.payload.http_headers,
		'Content-Type': 'application/json',
    	'Content-Length': data.length
  }

	var options = {
		headers: headers,
		method: payloadDocument.payload.http_verb
	}

	const req = https.request(url, options, (res) => {
	  console.log(`STATUS: ${res.statusCode}`);
	  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
	  res.setEncoding('utf8');

	  res.on('data', (chunk) => {
	    console.log(`BODY: ${chunk}`);
	  });

	  res.on('end', () => {
	    console.log('No more data in response.');
	  })
	});

	req.on('error', (e) => {
  		console.error(`problem with request: ${e.message}`);
	});

	req.write(data)

	req.end()

	/*
	 {
    _id: 5ec59b439a916a105a155415,
    repeat_frequency: {
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      weeks: 0,
      months: 0,
      years: 0
    },
    payload: { target_url: '', http_verb: '', http_headers: [], http_body: '' },
    date: 2020-05-20T21:05:03.857Z,
    timezone_offset: 0,
    status: 'pending',
    repeats: false,
    attempts: [],
    __v: 0
  }
  */

}