var helpers = require("@classes/helpers");
var mongoose = require("mongoose");
var accountModel = mongoose.model("Account");
var userModel = mongoose.model("User");
var Authentication = require("@classes/authentication.js");
var Communication = require("@classes/communication.js");
var roles = require("@controllers/roles.js");
var routes = require("@controllers/routes.js");
var navigation = require("@controllers/navigation/navigation.js");
var excel = require("@classes/excelimport.js");
var Mongo = require("@classes/mongo.js");
var fs = require("fs");
//var defaults = require("@app_entry_points/defaults.js");


var Stripe = require("@classes/stripe.js");
/*	createAccount
	Created By: Adam Arthur
	Created On: 12/21/2018
	
	Purpose

	pCreateAccount is the entrypoint for a user to our application.  Every record must
	both have an account and a user id associated with it.  This function first creates
	the master user and then an account, and finally it updates the user account to reflect
	that the ownership relationship with the account.

	We use two Mongo Collections here: users and accounts

	Each account MUST have at least one master user associated with it
	And every user MUST have an account
*/

module.exports.createAccount = async function(req, res) {

  var defaults = require("@app_entry_points/defaults.js");

  var endpointDefinition = "account";
  var properBody = {
    email: "String",
    phone: "String",
    pwd: "String",
    first_name: "String",
    last_name: "String",
    account_type: "String",
    skill: "Array"
  };

  var accountResponse = {
    accountCreated: "Boolean",
    accountId: "Object",
    userId: "Object",
    sessionId: "String",
    Authorization: "String"
  };

  var jsonBody = helpers.validatePostedData(req, res, properBody);
  if (jsonBody == false) return;

  //jsonBody["plan"] = "free"; // Updated 5/30/23, for compatability with api v2.0 -- all new accounts are initially created on a "free" plan 
  // First, let's encrypt the password immediately
  var hashedPwd = await Authentication.hashPwd(jsonBody.pwd);
  var sessionPwd = await Authentication.hashPwd(jsonBody.pwd);
  jsonBody.pwd = hashedPwd;

  console.log(66, jsonBody)

  var response = helpers.defaultResponseObject(endpointDefinition);
  var error = {
    error: false,
    message: "There was an error",
    code: 0
  };

  var result = {};

  var user = {};
  var account = {};

  try {
    user = await userModel.create(jsonBody);
    //console.log(72, user);
  } catch (err) {
    //console.log(74, err);
    error = helpers.mongoError(error, err);
    return helpers.error(res, error.code, error.message);
  }

  // If we've gotten here, it means that a new user account has been created.
  // We can now go ahead and create the account

  var userId = user._id;


  // Note from 5/31/23 -- this is very old code, from when I first started writing this in 2019.  
  // The registration / login code has been stable, but I'm moving away from mongoose entirely in future version
  // Mongoose is used here only for legacy compatability purposes.
  // Also I fixed an apparent bug where owner, created_by, modified_by was stored in an array.  Not sure if this 
  // will cause backwards compatability issues with content bounty, but it might for new accounts.  I will need to
  // complete testing to be sure....  

  // Each new account starts on the "free" plan.
  // console.log(94, userId);
  let newAccountDoc = {
            owner: mongoose.Types.ObjectId(userId),
            created_by: mongoose.Types.ObjectId(userId),
            modified_by: mongoose.Types.ObjectId(userId),
            plan: "free",
            user_limit: 5,
            bStatus: true
  }

  try {
    var result = await mongoose.connection.db.collection("accounts").insertOne( newAccountDoc );
    // account = await accountModel.create({
    //   owner: mongoose.Types.ObjectId(userId),
    //   created_by: mongoose.Types.ObjectId(userId),
    //   modified_by: mongoose.Types.ObjectId(userId),
    //   plan: "free"
    // });
  } catch (err) {
    error = helpers.mongoError(error, err);
    return helpers.error(res, error.code, error.message);
  }

  newAccountDoc["_id"] = result.insertedId;

  account = newAccountDoc;

  console.log(108, account);
  // Finally, we must update the newly created user document to reflect
  // the newly created accountId

  var accountId = account._id;

  // Ok, we've got a newly created account.  Now, let's check if we have any 'referer' cookies
  //
  if(typeof req.cookies["referral"] !== 'undefined'){
    var referer = req.cookies["referral"];
    let decodedCookie = atob(referer);
    let cookieParts = decodedCookie.split(":");
    let affiliate_id = cookieParts[0];
    let referring_domain = cookieParts[1];
    if(referring_domain === 'undefined'){
      referring_domain = '';
    }    
    let insert = {
        raw: referer,
        affiliate_id: affiliate_id,
        referring_domain: referring_domain,
        account_id: mongoose.Types.ObjectId(accountId)
      };

     mongoose.connection.db.collection("referrals").insertOne(insert);
  }

  

  if(typeof referer !== 'undefined'){
    // We have a referral cookie.  Let's store it to give our affiliate the credit they deserve
    //
  }

  try {
    user.accountId = accountId;

    // Now, we want to create an initial session for the user to automatically login
    // with
    user.sessionId = sessionPwd;
    user.sessionExpiration = helpers.futureISODateByDays(14);
    user.role = "administrator";
    user.settings = {};
    user.settings.company_settings = {};
    user.settings.first_name = jsonBody.first_name;
    user.settings.last_name = jsonBody.last_name;
    user.settings.account_type = jsonBody.account_type;
    var resp = await user.save();

    //userModel.accountId.updateById(userId, {$set: accountId})
  } catch (err) {
    console.log("Unable to update", err);
  }

  var authorizationHeader = Authentication.genAuthorizationBasicString(
    accountId._id,
    user.sessionId,
    user._id
  );
  response.account.accountCreated = true;
  response.account.accountId = accountId._id;
  response.account.userId = userId;
  response.account.sessionId = user.sessionId;
  response.account.Authorization = authorizationHeader;
  res.cookie("Authorization", "Basic " + authorizationHeader, {
    expire: new Date() + 1
  });
  var jsonBody = helpers.validateResponseData(
    res,
    response.account,
    accountResponse
  );
  if (jsonBody == false) return;

  // Create the initial roles document for this account
  await roles.createDefaultRoles(accountId._id, userId);

  // Set the default permissions for each role

  // Everything in Saas-Product is Dynamic, all menu's, navigation--everything
  // This creates the initial, default "Sidebar" Navigation for the user.

  var sidebarByUserType = [];
  var dashboardByUserType = [];
  var accountNavByUserType = [];

  var menu_defaults = await  mongoose.connection.db.collection("users").findOne({"email":"admin@contentbounty.com"}, {menu_defaults:1})
  menu_defaults = menu_defaults.menu_defaults;
  
  //console.log(161, menu_defaults);

  if(req.body.account_type == "creator"){
    sidebarByUserType = menu_defaults.creator_site_sidebar
    dashboardByUserType = menu_defaults.creator_site_dashboard
    accountNavByUserType = menu_defaults.creator_site_account
  } else {
    sidebarByUserType = menu_defaults.authority_site_sidebar
    dashboardByUserType = menu_defaults.authority_site_dashboard
    accountNavByUserType = menu_defaults.authority_site_account
  }

  console.log(166, sidebarByUserType);

  await navigation.createDefaultSidebarNav(
    accountId._id,
    user,
    "administrator",
    sidebarByUserType,
    req.body.account_type
  );

  // // We need to know which view we want to initially display to the user by default
  // This creates the initial default view
  await navigation.createDefaultDashboardNav(
    accountId._id,
    user,
    "administrator",
    dashboardByUserType,
    req.body.account_type
  );

  await navigation.createDefaultAccountNav(
    accountId._id,
    user,
    "administrator",
    accountNavByUserType,
    req.body.account_type
  );

  // Create the Stipe Customer
  createCustomerWithAccount(user)

  helpers.success(res, response);

  // Create the default Sidebar Navigation
};

  /*  Create Customer
  */
function createCustomerWithAccount(user){
    console.log(362, "creatingCustomer");
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    stripe.customers.create(
      {
        email: user.email,
        name: (user.settings.first_name + user.settings.last_name)
      }, async function(err, stripeCustomer){
        console.log(373, user, stripeCustomer)  

        const freePriceId = process.env.FREE_PRICE;

        
          const subscription = await stripe.subscriptions.create({
            customer: stripeCustomer.id,
            items: [
              { price: freePriceId },
            ],
        });

        console.log(299, subscription.items.data )
        // For compatability with api v2.0, all newly created accounts must have a "stripe_id" associated with them, which is the customer_id
          try {

            var result = await mongoose.connection.db
              .collection("accounts")
              .updateOne( { _id: mongoose.Types.ObjectId(user.accountId) }, { $set: { "stripe_id": stripeCustomer.id, price_id: freePriceId, subscription_id: subscription.id , subscription_items: subscription.items.data } } );
              console.log(231, result.result, stripeCustomer.id);
          } catch (err) {
            console.log(232, err)
          }

          // 5/31/23 - for apiv2, all newly created accounts automatically get registered with stripe, and are automatically
          // assigned to the free monthly plan, which does not require a payment method to be attached.  API v1.0 doesn't 
          // have a sufficiently developed stripe integration to handle subscriptions dynamically, so we use environment variables
          // to set the price.  At the time of writing, it's price_1NDlT6GzpSbuU0iyBGKdJkjn

          // In the nearish future, I plan to pull the default freePriceId from the database.  This should not be a hardcoded
          // value 
          

      });
}

/*	Creates new user accounts for access

*/

module.exports.createUser = async function(req, res) {
  console.log("Create User Called");
  var endpoint = helpers.getRoute(req);
  var user = res.locals.user;

  var properBody = {
    email: "String",
    first_name: "String",
    last_name: "String",
    role: "String",
    pwd: "String",
    change_password: "Boolean",
    skill:"String"
  };

  var properResponse = {};

  var jsonBody = helpers.validatePostedData(req, res, properBody);
  if (jsonBody == false) return;

  var hashedPwd = await Authentication.hashPwd(jsonBody.pwd);
  jsonBody.pwd = hashedPwd;

  var model = {
    owner: user.accountId,
    created_by: user._id,
    modified_by: user._id,
    created: new Date(),
    modified: new Date(),
    accountId: res.locals.accountId,
    settings: { 
      "first_name":jsonBody.first_name,
      "last_name":jsonBody.last_name,
        company_settings: { 
      } 
  }
  };

  let merged = { ...model, ...jsonBody };

  // Content Bounty specific
  var skills = jsonBody.skill;
  console.log(jsonBody)
  var skillsAr = skills.split(",")
  console.log(257, skillsAr);
  merged.skill = skillsAr;
  // I'm intentionally skipping validation here
  // I'm also intentionally not using mongoose to do this insert
  try {
    var result = await mongoose.connection.db
      .collection("users")
      .insert(merged);
  } catch (err) {
    return handleCreateUserError(res, err)
  }

  var insertResult = result["ops"][0];
  //, async function(err, results){

  console.log(result);

  var accountId = res.locals.accountId;
  var userId = user._id;


  // Create the initial roles document for this account
  await roles.createDefaultRoles(accountId, userId);

  // Set the default permissions for each role

  // Everything in Saas-Product is Dynamic, all menu's, navigation--everything
  // This creates the initial, default "Sidebar" Navigation for the user.
  await navigation.createDefaultSidebarNav(accountId, user, "user");

  // We need to know which view we want to initially display to the user by default
  // This creates the initial default view
  await navigation.createDefaultDashboardNav(accountId, user, "user");

  await navigation.createDefaultAccountNav(accountId, user, "user");

  var response = helpers.defaultResponseObject(endpoint);

  var jsonBody = helpers.validateResponseData(
    res,
    response[endpoint],
    properResponse
  );
  if (jsonBody == false) return;

  response["user"] = insertResult;
  helpers.success(res, response);

  //})
};

function handleCreateUserError(res, err){

  // Common errors:
  // email already exists

    var defaultErrorResponse = helpers.defaultErrorResponseObject();
    if(err.code == 11000){
      // User already exists
      defaultErrorResponse["Result"] = "Failure"
      defaultErrorResponse.Error = 11000;
      defaultErrorResponse.ErrorDetails.Error = 11000;
      defaultErrorResponse.ErrorDetails.Description = "This user already exists"
    } else {
      defaultErrorResponse["Result"] = "Failure"
      defaultErrorResponse.Error = 12000;
      defaultErrorResponse.ErrorDetails.Error = 12000;
      defaultErrorResponse.ErrorDetails.Description = "There was an unhandled exception"
      defaultErrorResponse.ErrorDetails.Exception = err;
    }

    res.status(200);
    res.json(defaultErrorResponse)
    return;
}
    // Return an error
// This is used to invite a person by e-mail to create an account
// I've written Express Middleware that automatically implements a lot of
// the boilerplate code above, so that it doesn't have to be re-written or copied
// for each function.  Makes the guts of the API call more readable, but also
// abstracts a little bit of whats going on behind the scene.

/*	Required Body Params
		email: String

	Response Object
		email_sent: Boolean
*/

module.exports.invite = async function(req, res, next) {
  var user = res.locals.user;
  var jsonBody = res.locals.jsonBody;

  var emailBody = `Hi.  ${user.first_name} ${user.last_name} has invited you to collaborate on their 
	account.  Click this link to accept and setup your account.  http://localhost:3000/api/accept
	`;
  mailSent = await Communication.sendSupportEmail(
    jsonBody.email,
    "Create an API Account",
    emailBody
  );

  if (mailSent == true) {
    res.locals.response = { email_sent: true };
  } else {
    res.locals.response = { email_sent: false };
  }

  return next();
};
