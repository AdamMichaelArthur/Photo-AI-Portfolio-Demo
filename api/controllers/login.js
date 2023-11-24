	var helpers = require('@classes/helpers')
var mongoose = require('mongoose');
var Authentication = require('@classes/authentication');
var hasPermission = require("@classes/permissions.js");
var moment = require('moment');
var SidebarNav = mongoose.model("SidebarNav");
var AccountNav = mongoose.model("AccountNav");
var DashboardNav = mongoose.model("DashboardNav");
var voca = require("voca");

module.exports.login = async function(req, res)
{

	// If the user gets here, we already know their username and password
	// are valid, because authentication is handled very early on, and if 
	// there is a problem, authentication errors will have been sent
	// and the program execution would never have made it here
	// so, all we need to do here is setup a session and send the sessionId

	var endpoint = helpers.getEndpoint(req);

	var properBody = {
		userId: "String",
		pwd: "String"
	};

	var properResponse = {
		sessionId: "String",
		sessionExpiration: "Object",
		Authorization: "String"
	}

	var jsonBody = helpers.validatePostedData(req, res, properBody);
	if(jsonBody == false)
		return;

    var user = await Authentication.verifyPwd(res, jsonBody.userId, jsonBody.pwd);
    if(!user)
      return;
  	// If the passwords don't match, program flow will stop here
  	// If verifyPwd returns successfully, we have a mongoose user model to work with
 	
 	/* There are two approaches we can take here.  Every login generate a new login key, effectively limiting
 		us to one browser / device per login, or we can verify the password and return an existing login session.
	*/

	// TO-DO: ADD A USER-EDITABLE SETTING GLAD THAT ALLOWS THEM TO TOGGLE MULTIPLE-DEVICE
	// OR LET THIS BE SOMETHING THAT IS CHARGED EXTRA FOR

	/////////////////////////////////////////////////////////////////////////////////////////
	// Use this code if you want to limit logins to one device / browser ////////////////////
	////////////////////////////////////////////////////////////////////////////////////////

/*	
  	var sessionId = await Authentication.genSessionId(jsonBody.pwd);
  	user.sessionId = sessionId;
	user.sessionExpiration = helpers.futureISODateByDays(30);
	await user.save();
*/
	
	/////////////////////////////////////////////////////////////////////////////////////////
	// End //////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////

 		/////////////////////////////////////////////////////////////////////////////////////////
	// Use this code if you want to allow multi device and browser login ////////////////////
	////////////////////////////////////////////////////////////////////////////////////////

	if(process.env.ALLOW_MULTI_LOGIN == "true"){

  	var existingSession = moment(user.sessionExpiration);
  	var bIsSessionExpired = moment().isAfter(existingSession)

  	if(bIsSessionExpired){
		user.sessionExpiration = helpers.futureISODateByDays(30);
		var sessionId = await Authentication.genSessionId(jsonBody.pwd);
		user.sessionId = sessionId;
		await user.save();
	}

	} else {
		var sessionId = await Authentication.genSessionId(jsonBody.pwd);
  		user.sessionId = sessionId;
		user.sessionExpiration = helpers.futureISODateByDays(30);
		user.pastSessions.push({ "sessonId":sessionId, "sessionExpiration": user.sessionExpiration })
		await user.save();	
	}
	/////////////////////////////////////////////////////////////////////////////////////////
	// End //////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////

	var authorizationString = Authentication.genAuthorizationBasicString(user.accountId, user.sessionId, user._id)

	var response = helpers.defaultResponseObject(endpoint);
	response[endpoint].sessionId = user.sessionId;
	response[endpoint].sessionExpiration = user.sessionExpiration;
	response[endpoint].Authorization = authorizationString;

	var jsonBody = helpers.validateResponseData(res, response[endpoint], properResponse);
	if(jsonBody == false)
		return;


	response['sidebar'] = await SidebarNav.findOne({ owner: user.accountId, role: user.role }).select("navigation -_id")
	response['sidebar'] = response['sidebar']['navigation']
	response['account'] = await AccountNav.findOne({ owner: user.accountId, role: user.role }).select("navigation -_id")
	response['account'] = response['account']['navigation']
	response['dashboard'] =  await DashboardNav.findOne({ owner: user.accountId, role: user.role }).select("viewroute -_id");
	response['dashboard'] = response['dashboard']['viewroute']
	response['skills'] = user.skill
	response['accountType'] = voca.capitalize(user.settings.accountType, true);
	response['first_name'] = voca.capitalize(user.settings.first_name, true);
	response['last_name'] = voca.capitalize(user.settings.last_name, true);

	res.cookie("Authorization", "Basic " + authorizationString, {expire : new Date() + 1});
	helpers.success(res, response);
}

module.exports.recover = async function(req, res)
{
	// These are the paths for when a customer forgets a username or password
	var endpoint = helpers.getEndpoint(req);

	var properBody = {
		userId: "String",		// Can be a phone number or an email
		recoveryType: "String"	// Can be either "email" or "phone"
	};

	var properResponse = {
		recoveryExpiration: "Object"
	}

	var jsonBody = helpers.validatePostedData(req, res, properBody);
	if(jsonBody == false)
		return;

	// Do some additional validation on the recoveryType
	if((jsonBody.recoveryType != "email")&&(jsonBody.recoveryType != "phone")){
		helpers.error(res, 700, "recoveryType must be either \"phone\" or \"email\"");
		return;
	}

	var response = helpers.defaultResponseObject(endpoint);

	// If phone, send a text message with a code that allows them to enter the code
	// and do a password reset
	// We will generate a 6 digit code that expires in 5 minutes.  If they type in the 
	// code correctly, they can reset their password.
	var user = false;
	//if(jsonBody.recoveryType == "phone")
	//	user = await Authentication.sendRecoveryCodeByText(jsonBody.userId)		// This function will send
	//else if (jsonBody.recoveryType == "email"){					// a text message to the phone
	
	user = await Authentication.sendRecoveryCodeByEmail(jsonBody.userId, "Recover Account")		// on file
	//}
	if(!user)
		helpers.error(res, 701, "Unable to send recover text/email. Invalid Email");
	else
	{
		response[endpoint].recoveryExpiration = user.passwordRecovery.recoveryExpiration
		
		var jsonBody = helpers.validateResponseData(res, response[endpoint], properResponse);
		if(jsonBody == false)
			return;

		helpers.success(res, response);
	}
}

module.exports.reset = async function(req, res)
{
	var endpoint = helpers.getEndpoint(req);

	var properBody = {
		userId: "String",		// Can be a phone number or an email
		recoveryCode: "String",	// Can be either "email" or "phone"
		newPwd: "String"
	};

	var properResponse = {
		sessionId: "String",
		sessionExpiration: "Object",
		Authorization: "String"
	}

	var jsonBody = helpers.validatePostedData(req, res, properBody);
	if(jsonBody == false)
		return;

	var user = await Authentication.validateRecoveryCode(jsonBody.userId, jsonBody.recoveryCode)
	if(!user)
	{
		helpers.error(res, "599", "The Recovery Code does not match");
		return;
	}

	bIsSamePassword = false;
	bIsSamePassword = await Authentication.cmpPwd(jsonBody.newPwd, user.pwd);

	if(bIsSamePassword != false){
		// Passwords match
		helpers.error(res, "600", "The password needs to be different than the last password");
		return
	}
	// var user = await Authentication.verifyPwd(res, jsonBody.userId, jsonBody.pwd);
 //    if(!user)
 //      return;

	var hashedPwd = await Authentication.hashPwd(jsonBody.newPwd);
	var sessionId = await Authentication.hashPwd(jsonBody.newPwd);
	user.sessionExpiration = helpers.futureISODateByDays(14)			// Set a new date
	user.pwd = hashedPwd;
	user.sessionId = sessionId
	user.save();
	
		var authorizationString = Authentication.genAuthorizationBasicString(user.accountId, user.sessionId, user._id)

	var response = helpers.defaultResponseObject(endpoint);
	response[endpoint].sessionId = user.sessionId;
	response[endpoint].sessionExpiration = user.sessionExpiration;
	response[endpoint].Authorization = authorizationString;

	var jsonBody = helpers.validateResponseData(res, response[endpoint], properResponse);
	if(jsonBody == false)
		return;
	res.cookie("Authorization", "Basic " + authorizationString, {expire : new Date() + 1});
	helpers.success(res, response);

}

module.exports.verify = async function(req, res)
{
	// These are the paths for when a customer forgets a username or password
	var endpoint = helpers.getEndpoint(req);

	var properBody = {
		verificationType: "String"	// Can be either "email" or "phone"
	};

	var jsonBody = helpers.validatePostedData(req, res, properBody);
	if(jsonBody == false)
		return;

	// Do some additional validation on the recoveryType
	if((jsonBody.verificationType != "email")&&(jsonBody.verificationType != "phone")){
		helpers.error(res, 700, "verificationType must be either \"phone\" or \"email\"");
		return;
	}

	var response = helpers.defaultResponseObject(endpoint);

	var user = false;
	//if(jsonBody.verificationType == "phone")
	//	user = await Authentication.sendVerificationCodeByText(res.locals.userId)		// This function will send
	//else if (jsonBody.verificationType == "email"){					// a text message to the phone
		user = await Authentication.sendVerificationCodeByEmail(res.locals.userId)		// on file
	//}
	if(!user)
		helpers.error(res, 701, "Unable to send verification text/email");
	else
	{
		response[endpoint] = "Verifification Text Sent"
		helpers.success(res, response);
	}
}

module.exports.logout = async function(req, res)
{
	var user = res.locals.userId
	user.sessionId = "";
	user.sessionExpiration = "";
	user.save();
	// Take the user and kill it
	res.clearCookie("Authorization");
	helpers.success(res, {})
}

module.exports.confirm = function(req, res) {
	var user = res.locals.user
	var endpoint = helpers.getEndpoint(req);
	
	var type = req.params.type;
	if(type == null)
		return helpers.error(res, 702, "1. You must supply a type/email or type/phone in the URL");
	else if((type != "email")&&(type != "phone"))
		helpers.error(res, 701, type + "2. You must supply a type/email or type/phone in the URL");

	var confirmationCode = req.params.code;
	if(confirmationCode == null)
		return helpers.error(res, 703, "You must supply a code/:code in the URL");

	var response = helpers.defaultResponseObject(endpoint);

	var correctConfirmationCode = user.passwordRecovery.recoveryCode;
	if (confirmationCode == correctConfirmationCode)
	{
		if(type == "email")
			user.bEmailVerified = true;
		else if (type == "phone")
			user.bPhoneVerified = true;
		user.save();
		response[endpoint] = "Correct Confirmation Code Sent";
		helpers.success(res, response);
		return;
	}
	return helpers.error(res, 703, "Incorrect Confirmation Code");
}

// This is designed to support multi-device login.  
// I may add additional security here in the future
module.exports.privilegedLogin = async function(req, res){

	// Search past sessions for the user
	// Verify the submitted password is correct
	// If correct, return the last sessionId cookie
	var endpoint = helpers.getEndpoint(req);

	var properBody = {
		userId: "String",
		pwd: "String"
	};

	var properResponse = {
		sessionId: "String",
		sessionExpiration: "Object",
		Authorization: "String"
	}

	var jsonBody = helpers.validatePostedData(req, res, properBody);
	if(jsonBody == false)
		return;
	
    var user = await Authentication.verifyPwd(res, jsonBody.userId, jsonBody.pwd);
    
    // Password is invalid -- return
    if(!user)
      return;

	var authorizationString = Authentication.genAuthorizationBasicString(user.accountId, user.sessionId, user._id)

	var response = helpers.defaultResponseObject(endpoint);
	response[endpoint].sessionId = user.sessionId;
	response[endpoint].sessionExpiration = user.sessionExpiration;
	response[endpoint].Authorization = authorizationString;

	var jsonBody = helpers.validateResponseData(res, response[endpoint], properResponse);
	if(jsonBody == false)
		return;

		res.cookie("Authorization", "Basic " + authorizationString, {expire : new Date() + 1});
	helpers.success(res, response);
}

module.exports.health = function(req, res){
	// Checks that the account is working as expected
	
}

module.exports.getAnonymousSession = function(req, res) 
{
	// If there's an 
}
