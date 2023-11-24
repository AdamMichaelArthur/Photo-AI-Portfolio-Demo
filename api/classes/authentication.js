var helpers = require('@classes/helpers.js')
var mongoose = require('mongoose')
var model = mongoose.model("User")

var bcrypt = require('bcryptjs');
var atob = require('atob');
var btoa = require('btoa');
const Schema = mongoose.Schema;
var Communication = require("@classes/communication.js")

exports.verifyPwd = async function(res, userId, password) {

          var userIdObj = "";
          try {
            userIdObj = mongoose.Types.ObjectId(userId);
          } catch (err)
          { userIdObj = mongoose.Types.ObjectId() }


          try {
            var query = { $or: 
              [ { phone: userId }, 
                { email: userId },
                { _id: userIdObj } ] }

            var user = await model.findOne(query);
             } catch (err) {

              res.status(500);
              res.json(
              helpers.defaultErrorResponseObject(
                505, err
              ));
              return false;
            }

            if(!user)
            {
              res.status(500);
              res.json(
              helpers.defaultErrorResponseObject(
                504, "Invalid username or password"
              ));
             return false; 
            }

            var bIsValidPassword = await module.exports.cmpPwd(password, user.pwd);
            if(!bIsValidPassword) {
                res.clearCookie("Authorization");
                // Kill the sessionId as well
                user.sessionId = "";
                user.save()                 // This will be handled asyncronuously, no need to wait here
                res.json(
                helpers.defaultErrorResponseObject(
                  505, "Invalid password"
                ));
               return false;
             }
             // If we get here, we should have a valid user, a valid password
             // and a valid sessionId
             // Let's make sure the sessionId hasn't expired
             // var sessionIdExpiration = user.sessionExpiration;
             // Do the logic here to see if the session has expired or not.  If it has
             // redirect the user to the login page using an http redirect 
            
        return user;
}

exports.verifySession = async function(res, userId, sessionId) {

          try {
            var user = await model.findById(userId);
             } catch (err) {
              res.status(500);
              res.json(
              helpers.defaultErrorResponseObject(
                504, "Invalid username or password"
              ));
              return false;
            }

            if(!user)
            {
              res.status(500);
              res.json(
              helpers.defaultErrorResponseObject(
                504, "Invalid username or password"
              ));
             return false; 
            }

            var bIsValidSession = false;
            if(user.sessionId == sessionId)
              bIsValidSession = true;
            if(!bIsValidSession) {
                res.json(
                helpers.defaultErrorResponseObject(
                  505, "Invalid Session"
                ));
               return false;
             }
             // Check if the valid sessionId has expired.  If so, clear the cookie
             // and return false;
             var expDate = new Date(user.sessionExpiration)
             var curDate = new Date(helpers.ISODateNow())

             if( curDate > expDate)
             {
              // Session is expired
              res.clearCookie("Authorization");
              res.json(
                helpers.defaultErrorResponseObject(
                  506, "Session Has Expired"
                ));
               return false;
             }
             
        return user;
}

exports.verifyBearerToken = async function(res, bearerToken) {
          try {
            var user = await model.findOne({"api_key":bearerToken});
             } catch (err) {
              res.status(500);
              res.json(
              helpers.defaultErrorResponseObject(
                504, "Invalid api key"
              ));
              return false;
            }

            if(!user)
            {
              res.status(500);
              res.json(
              helpers.defaultErrorResponseObject(
                504, "Invalid api key"
              ));
             return false; 
            }

            return user;
}

exports.validateRecoveryCode = async function(userId, recoveryCode)
{
            try {
            var query = { $or: 
              [ { phone: userId }, 
                { email: userId } ] }

            var user = await model.findOne(query);
             } catch (err) {
              return false;
            }

            if(!user)
            {
              res.status(500);
              res.json(
              helpers.defaultErrorResponseObject(
                504, "Invalid username or password"
              ));
             return false; 
            }
            if(user.passwordRecovery.recoveryCode != recoveryCode)
            {
             return false; 
            }
    return user;
}

exports.hashPwd = async function(password) {
  const saltRounds = 10;
  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, function(err, hash) {
      if (err) reject(err)
      resolve(hash)
    });
  })
  return hashedPassword
}

exports.cmpPwd = async function(plaintextPwd, hashedPwd)
{
  const cmpValue = await new Promise((resolve, reject) => {
    bcrypt.compare(plaintextPwd, hashedPwd, function(err, res) {
        if(err) reject(err)
        resolve(res);
    });
  });
  return cmpValue;
}

exports.genAuthorizationBasicString = function(accountId, sessionId, userId)
{
    var combinedStr = accountId + "@%40@" + userId + ":" + sessionId 
    return btoa(combinedStr);
}

exports.genSessionId = async function(password)
{
  const saltRounds = 10;
  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, function(err, hash) {
      if (err) reject(err)
      resolve(hash)
    });
  })
  return hashedPassword
}

exports.getUser = async function(userId) {

    var userIdObj = "";
    try {
      userIdObj = mongoose.Types.ObjectId(userId);
    } catch (err)
    { userIdObj = mongoose.Types.ObjectId() }

    // Gets a user
    try {
          var query = { $or: 
            [ { phone: userId }, 
              { email: userId },
              { _id: userIdObj } ] }

            var user = await model.findOne(query);
            
            } catch (err) {
              console.log(207, err)
               return false;
            }
            if(!user)
            {

             return false; 
            }
    return user;
}

exports.sendVerificationCodeByEmail = async function(userId, subject, message){

  console.log(244)
  // Find User
  var user = await module.exports.getUser(userId);
  if(user == false)
    return;

  // Generate Random Code
  var randomCode = Math.random().toString(6).replace('0.', '').substr(0, 6);
  
  // Save Code to user profile
  user.passwordRecovery.recoveryCode = randomCode;

  // Also update the expiration time of the code
  user.passwordRecovery.recoveryExpiration = helpers.futureISODateByDays(14);
  await user.save();

  // Send Code to user by email
  var emailSent = await Communication.sendSupportEmail(userId, subject, message + randomCode)

  const textSuccessfullySent = await new Promise((resolve, reject) => {
    resolve(user)
  });

  return user;
}

exports.sendVerificationCodeByText = async function(userId, message){
  // We'll use some email sender
  // Find User


  var user = await module.exports.getUser(userId);
  if(user == false)
    return;

  // Generate Random Code
  var randomCode = Math.random().toString(6).replace('0.', '').substr(0, 6);
  
  // Save Code to user profile
  user.passwordRecovery.recoveryCode = randomCode;

  // Also update the expiration time of the code
  user.passwordRecovery.recoveryExpiration = helpers.futureISODateByMinutes(5);
  await user.save();

  // Send Code to user by email

  var textSent = await Communication.sendText(user.phone, message + randomCode)

  const textSuccessfullySent = await new Promise((resolve, reject) => {
    resolve(user)
  });

  return user;

}

exports.sendRecoveryCodeByText = async function(userId, message) {




    var user = await module.exports.getUser(userId);
  if(user == false)
    return;

  // Generate Random Code
  var randomCode = Math.random().toString(6).replace('0.', '').substr(0, 6);
  
  // Save Code to user profile
  user.passwordRecovery.recoveryCode = randomCode;

  // Also update the expiration time of the code
  user.passwordRecovery.recoveryExpiration = helpers.futureISODateByMinutes(5);
  await user.save();

  // Send Code to user by email

  var textSent = await Communication.sendText(user.phone, message + randomCode)

  const textSuccessfullySent = await new Promise((resolve, reject) => {
    resolve(user)
  });

  return user;

}


exports.sendRecoveryCodeByEmail = async function(userId, message) {
 
      console.log(309);

    // Find User
  var user = await module.exports.getUser(userId);
  if(user == false){
    console.log(314);
    return;
  }

  // Generate Random Code
  var randomCode = Math.random().toString(6).replace('0.', '').substr(0, 6);
  
  // Save Code to user profile
  user.passwordRecovery.recoveryCode = randomCode;


  // Also update the expiration time of the code
  user.passwordRecovery.recoveryExpiration = helpers.futureISODateByDays(14);

  console.log(327);
  await user.save();

  var recovery_code = randomCode;
  
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
                                  <h3 style="font-size: 24px; color: #00d6d9; margin-top: 0;">Password Reset</h3>
                                  <p style="text-align: left; font-size: 16px; color: #222222;">Someone has requested to change the password on your Content Bounty account. If this wasn't you, please ignore this message.</p>
                                  <h4 style="text-align: left; font-size: 16px; color: #222222; margin-bottom: 10px;">Your Account Recovery Code Is Below</h4>
                                  <h1 style="text-align: left; font-size: 20px; color: #222222; margin: 0;">${recovery_code}</h1>
                                  <a style="width: 100%;
                                      height: auto;
                                      float: left;
                                      position: relative;
                                      padding: 10px;
                                      text-decoration: none;
                                      background: #00d6d9;
                                      color: #ffffff;
                                      font-size: 14px;
                                      margin-top: 25px;
                                      border-radius: 4px;
                                      cursor: pointer;
                                      outline: none;" href="https://app.contentbounty.com/recovery?email=${userId}"&accessCode=${recovery_code} target="_blink">Click Here To Rest Password</a>
                              </div>
                          </div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </body>`

  // Send Code to user by email
  // module.exports.sendMail = async function(user, pass, from, emailTo, subject, content, trackingCid, bcc) {
  var from = process.env.SUPPORT_EMAIL;
  var emailTo = userId;
  var emailUser = process.env.SUPPORT_USER;
  var pass = process.env.SUPPORT_PASS;
  var subject = "Account Recovery";
  var host = process.env.SUPPORT_HOST;

  var emailSent = await Communication.sendSupportEmail(emailTo, subject, supportEmail)

  const textSuccessfullySent = await new Promise((resolve, reject) => {
    resolve(user)
  });

  return user;

}