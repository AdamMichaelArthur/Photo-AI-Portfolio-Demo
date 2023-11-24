	/*
	Intended to handle emails, texts, etc
*/

var nodemailer = require('nodemailer');
const request = require('request');
var btoa = require('btoa');
var mongoose = require('mongoose');
var userModel = mongoose.model("User");
var helpers = require("@classes/helpers.js")

/*
	This is a quick and dirty implementation
	This needs unit testing, etc.
*/

module.exports.sendMail = async function(user, pass, emailTo, 
	subject, content, trackingCid ="", bcc ="", host ="") {
	console.log(20, "sendEmail Called");

	//helpers.log(user, `sendEmail called for user ${user.email}`, false, "sendMail", "communication.js");
  
  	return;

    if(process.env.SEND_LIVE_EMAILS == "false"){
  		return true;
  	}

	var host = "smtp.gmail.com"

	//If using gmail app password
	var transporterSettings = {
			 pool: true,
			 port: 465,
			 secure: true,
			 auth: {
			        user: user,
			        pass: pass
			    }
		}

	var User = await userModel.findOne({"settings.company_settings.gmail_email":user});

	// If using gmail OAuth
	if(pass == "oauth"){
		transporterSettings = {
					 pool: true,
					 port: 465,
					 secure: true,
					 auth: {
					        type: 'OAuth2',
							user: user,
							clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
							clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
							refreshToken: User.settings.gmail.refresh_token,
							accessToken: User.settings.gmail.access_token,
							expires: User.settings.gmail.expiry_date
					    }
				}
	}
	
	//helpers.log(user, `The gmail transporter settings are ${transporterSettings}`, false, "sendMail", "communication.js");
  
	var fullName = User.settings.first_name + " " + User.settings.last_name;
	transporterSettings["service"] = "gmail";
	transporterSettings["host"] = host;
	
	var transporter = nodemailer.createTransport(transporterSettings);

		const mailOptions = {
		  from: fullName + "<" + user + ">", 			// sender address
		  to: emailTo, 			// list of receivers // gmail_email
		  subject: subject, 	// Subject line
		  bcc: [bcc],
		  html: content			// plain text body,
		  	// attachments: [{
	   		//      filename: 'image.png',
	   		//      cid: trackingCid
	  		//  }]
	};

	//console.log(57, mailOptions)

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





return true;// emailSuccessfullySent

}

module.exports.sendText = async function(sendNumber, message)
{

    // var AccountSid = process.env.ACCOUNT_SID;
    // var AuthToken = process.env.AUTH_TOKEN;

    var AccountSid = "ACe6bf9e30ffcf693ea100ff32af274c9f";
    var AuthToken = "e6f7d17f49c9e193e2e559aa7fcd0bbb";

    var encodedAuth = btoa(AccountSid+":"+AuthToken)

    var uri = "https://api.twilio.com/2010-04-01/Accounts/"+AccountSid+"/Messages.json"

    var postBody = "To="+"+1"+sendNumber+"&"+"From=+18582120528&"+"&Body="+message

         var options = {
              url: uri,
              timeout: 5000,
              method: "POST",
              headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "Authorization":"Basic " + encodedAuth
              },
              body: postBody
            };

      request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
        			//console.log(101, "Send Text Worked", response)
                  return true;
        } else {
        	      //console.log(101, "Send Text Failed", error, response, body)
                  return false
        }
      });
}

function wrapBodyIntoPrettyFormat(body){
	  var supportEmail = `<head>
              <link href="https://fonts.googleapis.com/css?family=Abril+Fatface" rel="stylesheet" type="text/css"/>
              <link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet" type="text/css"/>
              <style>
                  *{box-sizing: border-box;}
              </style>
      </head>
      <body class="clean-body" style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: #f5f5f5;">
          <!--[if IE]><div class="ie-browser"><![endif]-->
          <table bgcolor="#f9e5dd" cellpadding="0" cellspacing="0" class="nl-container" role="presentation"
              style="table-layout: fixed; vertical-align: top; min-width: 320px; Margin: 0 auto; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f5f5f5; width: 100%;"
              valign="top" width="100%">
              <tbody>
                  <tr style="vertical-align: top;" valign="top">
                      <td style="text-align: center; word-break: break-word; vertical-align: top;" valign="top">
                          <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color:#f9e5dd"><![endif]-->
                          <div style="display: inline-block; background: #ffffff; width: 100%; max-width: 620px; margin: 30px auto; border-radius: 4px; font-family:Nunito, Arial, Helvetica Neue, Helvetica, sans-serif;line-height:1.2;">
                              <div style="padding:40px; float: left;">
                                  <h3 style="font-size: 24px; color: #00d6d9; margin-top: 0;">Content Bounty</h3>
                                  <h4 style="text-align: left; font-size: 16px; color: #222222; margin-bottom: 10px;">${body}</h4>
                                  </div>
                          </div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </body>`
      return supportEmail
}

module.exports.sendSupportEmail = async function(emailTo, subject, content, cc =[], attachments =null, bcc =null) {
	//console.log(20, "sendSupportEmail Called");
	//console.log(20, "sendEmail Called");

	return;
	//helpers.log(user, `sendEmail called for user ${user.email}`, false, "sendMail", "communication.js");
  
  	if(process.env.SEND_LIVE_EMAILS == "false"){
  		return true;
  	}

	var host = "smtp.gmail.com"

	//If using gmail app password
	var transporterSettings = { }

	var user = await userModel.findOne({"email":"support@contentbounty.com"});

	transporterSettings = {
					 pool: true,
					 port: 465,
					 secure: true,
					 auth: {
					        type: 'OAuth2',
							user: process.env.SUPPORT_EMAIL,
							clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
							clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
							refreshToken: process.env.SUPPORT_REFRESH_TOKEN,
							accessToken: process.env.SUPPORT_ACCESS_TOKEN,
							expires: process.env.SUPPORT_TOKEN_EXP
					    }
				}
  
	var fullName = process.env.SUPPORT_FIRSTNAME + " " + process.env.SUPPORT_LASTNAME;
	transporterSettings["service"] = "gmail";
	transporterSettings["host"] = host;
	
	var transporter = nodemailer.createTransport(transporterSettings);

		const mailOptions = {
		  from: fullName + "<" + process.env.SUPPORT_EMAIL + ">", 		// sender address
		  to: emailTo, 								// list of receivers // gmail_email
		  subject: subject, 						// Subject line
		  html: wrapBodyIntoPrettyFormat(content)								// plain text body,
	};

	if(cc.length > 0){
		if(Array.isArray(cc))
			mailOptions["cc"] = cc
	}

	if(bcc != null){
		if(Array.isArray(bcc))
			mailOptions["bcc"] = bcc
	}

	if(attachments != null){
	  if(Array.isArray(attachments)){
          var filePath = attachments[0];
          var fileCid = attachments[1]
          var fileName = attachments[2]
      }

      mailOptions['attachments'] = [{
        filename: `${fileName}`,
        path: `${filePath}`,
        cid: `${fileCid}`
    }]

	}

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

return true;// emailSuccessfullySent

}

/* Instead of specifying an email address, you provide the _id of the user and we sent an email to them */
module.exports.emailUserById = async function(user_id, subject, content, cc =[], attachments =null, bcc =null) {

}
