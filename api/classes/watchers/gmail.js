require("./base.js");
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var voca = require("voca");
var btoa = require('btoa');
const util = require('util');
const Gmailpush = require('gmailpush');
const {google} = require('googleapis');
var base64 = require('base-64');
var moment = require('moment')

var fs = require("fs")

setTimeout( () => {
mongoose.connection.db
    .collection("gnotifications")
    .watch().on('change', async data =>
	  {
	  	var gmailMessages = new GmailMessages(data.fullDocument.notification)
	  	gmailMessages.getMessages()
	  })

}, 5000)

class GmailMessages {
  constructor(notification) {
  	this.notification = notification
  	this.email = notification.emailAddress;
  	this.historyId = notification.historyId;
    this.oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_OAUTH_CLIENT_ID, 
      process.env.GMAIL_OAUTH_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT);
  }

  async initGmailApi(){
  	this.token = await mongoose.connection.db
          .collection("gmails")
          .findOne({ email: this.email })

    var searchobj = { "notification.emailAddress": this.email, "notification.historyId": {"$lt": this.historyId } }

    var prevHistory = await mongoose.connection.db
          .collection("gnotifications")
          .findOne(searchobj, { "sort" : { "notification.historyId": -1 } } )

     this.prevHistoryId = prevHistory.notification.historyId;

    try {
    	this.oAuth2Client.setCredentials(this.token.token);
	}
    catch(err){
    	console.log(76, err)
    }

    var auth = this.oAuth2Client

  	this.gmail = google.gmail({
          version: 'v1',
          auth
        });  	

  }

  async getHistory(){

	const options = {
	      userId: 'me',
	      startHistoryId: String(this.prevHistoryId)
	    };

	try {
		const history = await this.gmail.users.history.list(options);

		if(typeof history.data.history != 'undefined'){
			this.history = history.data.history;
			return true;
		}
	} catch(err){
		console.log(105,err)
		return false;
	}
  }

  async getMessages(){

  	await this.initGmailApi()

  	try{
  		await this.getHistory();
  	} catch(err){
  		console.log(117, err);
  	}

  	if(Array.isArray(this.history)){
  		// We've got an array -- let's parse it
  		for(var i = 0; i < this.history.length; i++){

  			var message = this.history[i];

  			if(typeof message.messagesAdded != 'undefined'){

  			if(Array.isArray(message.messagesAdded)){

  				for(var x = 0; x < message.messagesAdded.length; x++){
  					var newMessage = message.messagesAdded[x];

					try {  					
  					var messageRaw = await this.gmail.users.messages
				      .get({
				        id: newMessage.message.id,
				        userId: 'me',
				      })
				  } catch(err){
				  	continue;
				  }

				    if(typeof messageRaw.data.payload.headers == 'undefined'){

				    	continue;
				    }

				  	var subject ='',body ='',from ='',to ='',cc ='',date ='', name ='', firstName ='', lastName ='', firstNameTo ='', lastNameTo ='';
				  	 for(var t = 0; t < messageRaw.data.payload.headers.length; t++){
				  		var header = messageRaw.data.payload.headers[t];
				  		if(header.name == "From"){
				  			from = header.value
				  			if(from.indexOf("<") != -1){
				  				var startPos = from.indexOf("<");
				  				var endPos = from.indexOf(">");
				  				var email = from.substring(startPos+1, endPos);
				  				var name = from.substring(0, startPos-1)
				  				firstName = from.substring(0, name.indexOf(" "));
				  				lastName = from.substring(name.indexOf(" ") + 1, name.length)
				  				from = email;
				  			}
				  		}
				  		if(header.name == "Date"){
				  			date = header.value
				  		}
				  		if(header.name == "Cc"){
				  			cc = header.value
				  		}
				  		if(header.name == "To"){
				  			to = header.value
				  			if(to.indexOf("<") != -1){
				  				var startPos = to.indexOf("<");
				  				var endPos = to.indexOf(">");
				  				var email = to.substring(startPos+1, endPos);
				  				var name = to.substring(0, startPos-1)
				  				firstNameTo = to.substring(0, name.indexOf(" "));
				  				lastNameTo = to.substring(name.indexOf(" ") + 1, name.length)
				  				to = email;
				  			}
				  		}
				  		if(header.name == "Subject"){
				  			subject = header.value
				  		}
				  	}
				  	
				  	//console.log(131, subject, from, to, cc, date);

				  	var bodyEntites = []
				  	if(Array.isArray(messageRaw.data.payload.parts)){

				  		for(var e = 0; e < messageRaw.data.payload.parts.length; e++){
				  			var bodyPart = messageRaw.data.payload.parts[e]

				  			if(typeof bodyPart.body.data != 'undefined'){
				  				try {
					  			let data = bodyPart.body.data;
								let buff = new Buffer(data, 'base64');
								let text = buff.toString('ascii');

				  				bodyEntites.push({ "mimeType": bodyPart.mimeType, "body": text } )
				  				} catch(err){

				  				}
				  			} else {
				  				if(bodyPart.mimeType == "multipart/alternative"){
				  						if(typeof bodyPart.parts != 'undefined'){
				  							if(Array.isArray(bodyPart.parts)){
				  								for(var w = 0; w < bodyPart.parts.length; w++){
				  									var part = bodyPart.parts[w];

				  									let data = part.body.data;
													let buff = new Buffer(data, 'base64');
													let text = buff.toString('ascii');
				  									
				  									bodyEntites.push({ "mimeType": part.mimeType, "body": text } )
				  								}
				  							}
				  						}
				  					}
				  			}
				  		}
				  	} else {

				  		try {
				  			let data = messageRaw.data.payload.body.data;
							let buff = new Buffer(data, 'base64');
							let text = buff.toString('ascii');
				  			bodyEntites.push({ "mimeType": messageRaw.data.payload.mimeType, "body": text } )
				  		} catch(err){

				  		}
				  		// what to do here?
				  	}

				   var msg = {
				   	"subject":subject,
				   	"body":bodyEntites,
				   	"from":from,
				   	"name":name,
				   	"firstName":firstName,
				   	"lastName":lastName,
				   	"firstNameTo":firstNameTo,
				   	"lastNameTo":lastNameTo,
				   	"to":to,
				   	"cc":cc,
				   	"date":date,
				   	"reviewed":false,
				   	"reviewed_date": false,
				   	"response_count": 0
				   }

			        if(from == "haro@helpareporter.com"){
			        	if(to == "haro.inbound@gmail.com"){

			        		processInboundHaro(bodyEntites[0].body)
			        	}
			        } else {
						var result = await mongoose.connection.db
				          .collection("messages")
				          .insert( msg )
			        }

  				}

  			}

  		}

  		}

  	}

  }

}

function processInboundHaro(haroQueries){

	fs.appendFileSync("harolog.txt", `${moment().format()}\tInbound Haro Received\r\n`)
	var queriesStart = voca.indexOf(haroQueries, "****************************")

	var curIndex = queriesStart;

	var stop = 0;

	var bCont = true;

		var queryStart = curIndex
		if(curIndex == -1)
			bCont = false;

		var safeGuard = 0;
		var loopPos = 0;

		var queryCount = voca.countSubstrings(haroQueries, "-----------------------------");

		queryCount = parseInt(queryCount / 2);

		// This will get everything except the last query.  Which is currently better than the duplicates it sucks
		// into the database.
		for(var i = 0; i < queryCount; i++){

				if(queryStart == -1){
					queryStart = curIndex
				}

				var queryEnd = haroQueries.indexOf("-----------------------------", queryStart+35)
				var query = voca.substring(haroQueries, queryStart+35, queryEnd)
				
				if(queryEnd != -1){
					fs.appendFileSync("harolog.txt", `${moment().format()}\tProcessing Individual Query\r\n`)

					processHaroQuery(query);
				}

				queryStart = haroQueries.indexOf("-----------------------------", queryEnd+35)
		}

}

async function processHaroQuery(query){
	var splitStr = voca.split(query, "\r\n");

	var headers = [];
	var queryAr = [];
	for(var i = 0; i < splitStr.length; i++){
		var line = splitStr[i];
		if(line == "Query:"){

			queryAr = splitStr.slice(i, splitStr.length);

			break;
		}
		if(line.length > 0)
			headers.push(line);
	}

	headers.push(queryAr.join('\r\n'))

	var queryObj = {
		"createdAt": moment().format(),
		"modifiedAt": moment().format()
	}

	for(var i = 0; i < headers.length; i++){
		var splitHeader = headers[i].split(":");

		var key = voca.trim(splitHeader[0])
		var value = voca.trim(splitHeader[1])

		if(key == "Query"){
			headers.splice(0, i)
			value = headers.join(" ")
			//splitHeader = headers[i].split("Query:");
			
			value = value.substring(10)

		}
			

		if(i == 0){

			var parenthesisPos = splitHeader[0].indexOf(")");
			if(parenthesisPos != -1){
				splitHeader[0] = voca.substring(splitHeader[0], parenthesisPos+2)
			}

			key = splitHeader[0]
		}

		if(key == "Deadline"){
			splitHeader.shift();
			value = voca.trim(splitHeader.join(":"))
			var dateStr = value.split(" - ");
			var hour = dateStr[0];
			var date = dateStr[1]
			var combinedStr = date + " " + hour;
			var mmtTime = moment(combinedStr, "DD MMMM hh:mm a EST")

			value = mmtTime.format()
		}
		queryObj[key] = value;
	}

	var vals = Object.values(queryObj)

	fs.appendFileSync("harolog.txt", `${moment().format()}\tInserting Into Database\t${vals[1]}\r\n`)

	//console.log(392, queryObj);

	var result = await mongoose.connection.db
		.collection("haros")
		.insert( queryObj )

}
