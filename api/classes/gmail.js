
var nodemailer = require('nodemailer');
const request = require('request');
var btoa = require('btoa');
var mongoose = require('mongoose');
var userModel = mongoose.model("User");
var helpers = require("@classes/helpers.js")

const Gmailpush = require('gmailpush');
const {google} = require('googleapis');


/* Please note this only supports gmail oauth app token */

function decodeEntities(encodedString) {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp":" ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        var num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
}

module.exports.sendGmail = async function(fromFirst, fromLast, emailFrom, emailTo, 
	subject, content, trackingCid ="", bcc ="", accessToken, bounty_id ="", toFirst ='', toLast ='') {

	content = decodeEntities(content);
	
      var tokens = await mongoose.connection.db
                        .collection("gmails")
                        .findOne({"email":emailFrom}, { projection: {token:1, _id:0 } } )

        console.log(22, content)
        var token = tokens.token
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GMAIL_OAUTH_CLIENT_ID, 
            process.env.GMAIL_OAUTH_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT);

        var email = token;
        oAuth2Client.setCredentials(token);

    const gmail = google.gmail({
        version: 'v1',
        auth: oAuth2Client
    });

	var alias = await gmail.users.settings.sendAs.list({
		userId: 'me'
	})

	if(process.env.SEND_LIVE_EMAILS == "false"){
		toFirst = "Adam";
		toLast = "Arthur";
		emailTo = "adamarthursandiego@gmail.com"
	}

	//console.log(39, token, 40, tokens, 50, first, last, emailFrom, emailTo)

	  const Subject = subject;
	  const utf8Subject = `=?utf-8?B?${Buffer.from(Subject).toString('base64')}?=`;
	  const messageParts = [
	    `From: ${fromFirst} ${fromLast} <${emailFrom}>`,
	    `To: ${toFirst} ${toLast} <${emailTo}>`,
	    'Bcc: Adam Arthur <adamarthursandiego@gmail.com>',
	    'Content-Type: text/html; charset=utf-8',
	    'MIME-Version: 1.0',
	    `Subject: ${utf8Subject}`,
	    '',
	    content,
	    alias.data.sendAs[0].signature
	  ];

	  console.log(52, messageParts);

	  const message = messageParts.join('\n');

	  const encodedMessage = Buffer.from(message)
	    .toString('base64')
	    .replace(/\+/g, '-')
	    .replace(/\//g, '_')
	    .replace(/=+$/, '');

	    console.log(71, encodedMessage)

	    // if(process.env.SEND_LIVE_EMAILS == false){
	    // 	return true;
	    // }

		try {
			const res = await gmail.users.messages.send({
				userId: 'me',
				requestBody: {
					raw: encodedMessage
				}
			   });
			   return true;
		  } catch (err) {
			  return false
		  }

        // return { "working" : true }

}

module.exports.sendMail = async function(first, last, emailFrom, emailTo, 
	subject, content, trackingCid ="", bcc ="", accessToken, bounty_id ="") {

	return;
	
  	if(process.env.SEND_LIVE_EMAILS == "false"){
  		return true;
  	}
  	
	var host = "smtp.gmail.com"

	transporterSettings = {
		pool: true,
		port: 465,
		secure: true,
		auth: {
			type: 'OAuth2',
			user: emailFrom,
			clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
			clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
			refreshToken: accessToken.refresh_token,
			accessToken: accessToken.access_token,
			expires: accessToken.expiry_date,
		}
		}

	var fullName = first + " " + last;
	transporterSettings["service"] = "gmail";
	transporterSettings["host"] = host;
	
	var transporter = nodemailer.createTransport(transporterSettings);

	if(process.env.SEND_LIVE_EMAILS == "false"){
		emailTo = "adamarthursandiego@gmail.com"
	}

	var mailOptions = {
		  from: fullName + "<" + emailFrom + ">",
		  to: emailTo,
		  subject: subject,
		  bcc: [bcc],
		  html: content
	};

	const emailSuccessfullySent = await new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, function (err, info) {
		   if(err){
		   	 console.log("Email send error:", err);
		     resolve(false);
		   }
		   else{
		   	 console.log("Email Sent")
		     resolve(true)
		   }
		});
	});

	return true;

}