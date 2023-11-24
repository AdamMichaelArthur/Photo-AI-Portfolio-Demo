/*
	Created Wed Oct 7 2020

	This file has two purposes: to provide "completion" notifications in real time, for a long-running task
	and to offer progress bar functionality for long-running server-side operations.server-side

	For the long running server side operations, in order for this to work, there needs to be a relationship
	between the long running task and database operations that can be detected using the mongodb change stream

	If it is not possible to know the progress of an operation through the mongodb change stream, then a different
	strategy will be needed to provide real time progress to the client

  The gmail portion of this class is designed to suck up all gmail push notifications.  It does no processing of the data:
  it just pushes it into the database and that's it.  Other parts of the program will be required to use this information
  in a useful way.

*/

var express = require("express");
var router = express.Router();
var Mongo = require("@classes/mongo");
var mongoose = require("mongoose");
var Model = mongoose.model("Stripe");
var helpers = require("@classes/helpers");
var validation = require("@classes/validation");
var voca = require("voca");
var bounties = require("@classes/bounties");
var btoa = require('btoa');
const util = require('util');
const Gmailpush = require('gmailpush');
const {google} = require('googleapis');
var base64 = require('base-64');

// Initialize with OAuth2 config and Pub/Sub topic
const gmailpush = new Gmailpush({
  clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
  clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
  pubsubTopic: process.env.GMAIL_PUBSUBTOPIC,
  prevHistoryIdFilePath: 'gmailpush_history.json'
});

if(process.env.DEV_ENVIRONMENT != "true"){
    setTimeout( async () => {

      await watchAllGmailAccounts()

    }, 20000)

}
    

setInterval( async () => {
      // Once a day, go through all registered gmail addresses and call watch() on them
      //if(process.env.DEV_ENVIRONMENT != "true"){
          

    await watchAllGmailAccounts()
      

      //}

}, 24*60*1000);

async function watchAllGmailAccounts(){

    if(process.env.DEV_ENVIRONMENT =="true"){
      return false;
    }

    //console.log(64, "Watching Accounts")
      var tokens = await mongoose.connection.db
                        .collection("gmails")
                        .find({}, { projection: {token:1, email:1, _id:0 } } ).toArray()

      for(var i = 0; i < tokens.length; i++){
        var token = tokens[i].token
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GMAIL_OAUTH_CLIENT_ID, 
            process.env.GMAIL_OAUTH_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT);
        oAuth2Client.setCredentials(token);
        //console.log(75, "WATCHING", tokens[i])
        try {
          await watchInbox(oAuth2Client)
        } catch(err){
          console.log(86, "Unable to watch");
        }
      }
}

async function watchInbox(auth) {

    const gmail = google.gmail({
        version: 'v1',
        auth
    });

    const res = await gmail.users.watch({
        userId: 'me',
        requestBody: {
            topicName: 'projects/content-bounty/topics/receive-emails'
        }
    });

    //console.log(75, "Watching Inbox", res.status);
}

class Notifications {

  constructor(req, res, next) {
    this.className = "notifications";
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    this.oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_OAUTH_CLIENT_ID, 
      process.env.GMAIL_OAUTH_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT);

  }

  /* This function is used to request notification of a long-running server-side action */
  progress(){
  		// Create a progress notification object
  		// We're watching the model
  		// We're waiting on what....update....create?
  		// when we get an update, emit 
  		// model, start, finish
  		this.res.json({"error":err})
  	}

    async getNotificationDetails(message){

      var decoded = JSON.parse(base64.decode(message.message.data))
      this.notification = decoded;
      this.email = this.notification.emailAddress;
      this.token = await mongoose.connection.db
          .collection("gmails")
          .findOne({ email: this.email })

      if(this.token == null){
      console.log(131, "Gmail Push Notification Received")
        //this.res.status(200);
        //this.res.json({"status":"worked"})
        return;
      }

      console.log(145, this.notification)
      console.log(138, this.email)
      console.log(139, this.token);
      var auth = this.oAuth2Client;
      this.oAuth2Client.setCredentials(this.token.token);
      this.gmail = google.gmail({
          version: 'v1',
          auth
        });
    }

    async gmail(){

      console.log(48, "Gmail Push Notification Received")
      this.res.status(200);
      this.res.json({"status":"worked"})

      await this.getNotificationDetails(this.req.body);

      await mongoose.connection.db
          .collection("gnotifications")
          .insert({ notification: this.notification })

      return;
      // Get Email address contained in the push notification
      //const email = gmailpush.getEmailAddress(this.req.body);
      


//     const options = {
//       userId: 'me',
//       startHistoryId: this.notification.historyId
//     };

//     console.log(154, options);

//       const res = await this.gmail.users.history.list(options);

//       console.log(155, res.data);
// console.log(354,  util.inspect(res.data, false, null, true /* enable colors */))

//       var historyId = res.data.historyId;
//       if(Array.isArray(res.data.history)){
//         for(var i = 0; i < res.data.history.length; i++){
//           var message = res.data.history[i];
//           if(typeof message.messages != 'undefined'){
//             for(var x = 0; x < message.messages.length; x++){
//               var messages_id = message.messages.id;
//               var message_id = message.id;

//               console.log(174, "message_id", message_id);

//               try {
//               var msg = await this.gmail.users.messages
//                     .get({
//                       id: '17a3541dd8a21af6',
//                       userId: 'me',
//                     })
//               } catch(err){
//                 console.log(185, err);
//               }

//               try {
//               var msg = await this.gmail.users.messages
//                     .get({
//                       id: messages_id,
//                       userId: 'me',
//                     })
//               } catch(err){
//                 console.log(185, err);
//               }


//               console.log(181, msg);
//             }
//           }
//         }
//       }

//       console.log(48, "Gmail Push Notification Received")
//       this.res.status(200);
//       this.res.json({"status":"worked"})
//       return;


//       if(gmail == null){
//         console.log(126, "get email failed")
//         this.res.status(200);
//         this.res.json({"status":"worked"})
//         return;
//       }

     var token = this.token.token;//gmail.token;
      
      gmailpush
            .getMessages({
              notification: this.req.body,
              token
            })
            .then((messages) => {
              console.log(354,  util.inspect(messages, false, null, true /* enable colors */))
            })
            .catch((err) => {
              console.log(err);
            });

      console.log(48, "Gmail Push Notification Received")
      this.res.status(200);
      this.res.json({"status":"worked"})
    }

    processHaro(messages){

    }

    // End of class
}

/*
adminModel.watch({"email":"admin@contentbounty.com"}, {"integrations.box.tokenStore":1}).on('change', data => {
	if(data.operationType == 'update'){
		if(typeof data.updateDescription.updatedFields["integrations.box.tokenStore"]	 != 'undefined'){
		adminModel.findOne({"email":"admin@contentbounty.com"},function(err, model){
			if(err == null){
				// delete the old box for managing memory?
				model.integrations.tokenStore = data.updateDescription.updatedFields["integrations.box.tokenStore"]
				console.log(52, "watch_bounties.js","Updating the admin model!", model.integrations.box.tokenStore)
				box = new Box(model, true)
			}
		});
	}
	}	
});
*/

function routeDataSource(req, res, next) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    var endofurl = fullUrl.indexOf("?");
    if(endofurl != -1){
      fullUrl = fullUrl.substring(0, endofurl); 
    }

    var action = helpers.getParameter(fullUrl, "notifications");

    if(typeof action == 'undefined'){
      action = helpers.getParameter(fullUrl, "box");
    }

    var Action = new Notifications(req, res, next);
    var evalCode = "Action." + action + "()";

    try {
      eval(evalCode);
    } catch (err){
      var desc = {
        raw: { 
          message: "This method is not defined"
        }
      }
    }
}

var methods = Object.getOwnPropertyNames( Notifications.prototype );
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function(x) { 
  return excludes.indexOf(x) < 0;
});

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router;