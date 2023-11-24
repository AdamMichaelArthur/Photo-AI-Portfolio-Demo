/*
      Created 12/16/2018 by Adam Arthur
      Entry point for node/express route definitions and catch-all error handling


    	This file is often called "app.js" but we feel that filenames should be as descriptive
    	as possible regarding the functionality of the file, and the main thing this file does
    	is define and setup new node routes, and setup and configure Express

      The objective with this file is that is rarely, if ever, modified
*/

var mongoose = require('mongoose')
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var helpers = require('@classes/helpers.js')
var app = express();
var base64 = require('base-64');
//app.use(bodyParser({limit: '50mb'}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.text({ limit: '50mb' }));


var cookieParser = require('cookie-parser')
app.use(cookieParser())
var moment = require('moment');
require("@models/userSchema.js")    // Special case where I need this defined now
var Authentication = require("@classes/authentication.js");
var schemas = require("@root/schema_includes.js")(app);
var SchedulingEngine = require("@classes/scheduler/engine.js");
var schedulingEngine = new SchedulingEngine();
var voca = require("voca");
// Load the Database
require('@root/db');


var public_paths = [ 
  "boxredirect",
  "redirect", 
  "track", 
  //"integrations", 
  "login", 
  "privilegedLogin",
  "register", 
  "public", 
  "reset", 
  "verify", 
  "recover", 
  "image", 
  // "email", 
  "session",
  "notifications",
  "lagrowthmachine",
  "ytviewcount",
  "templates",
  "exceltojson",
  "docxtojson",
  "jsontoexcel",
  "slack"
  ]

var header_requirement_exclusion = ["image"]
// On some rare occasions, we might want to exclude our header requirements
// For example, if we want to access a public route from a browser, if we enforce
// our requirements, it won't work in browsers out of the box

// This is called every time a request is made, for each and every path, except login

// app.use("api/integrations/gmail/", function(req, res, next){
  
//   // We have a request to link a gmail account
//   //https://www.contentbounty.com/v1.0/api/integrations/gmail/redirect?code=4/zwHz-HBBNviXfvRMgS7t7yMAnEEKi4tt41WaWdf5fFp2pz0OyVrpprTCuCclTIQ4tRyViGgTEFYqio7Rw4jeoGM&scope=https://mail.google.com/

// });

app.all('*', (req, res, next) => {
    const { method, path, body } = req;
    const requestInfo = {
    method,
    path,
    body
  };
  next();
});


app.use("/api", function(req, res, next){
  return checkPaths(req, res, next)
});

function checkPaths(req, res, next) {

    // There are a few paths that we will allow anonymous 
    var endpoint = helpers.getRoute(req);
    if(public_paths.includes(endpoint))
    {
      res.locals.publicPath = true;
      return next();
    } else {
    }

    // We need to get a cookie or have an authorization header
    // If we have an authorization cookie

    var authHeader = req.cookies["Authorization"];  

    if(authHeader == null) {
    // This is where we will do our preliminary security checks
    authHeader = req.headers.authorization;

    if (authHeader == null)
    {
        res.status(500);
        res.json(
          helpers.defaultErrorResponseObject(
              501, "Malformed Headers.  You MUST include an authorization basic header or have an authorization cookie to access non-public routes"
            )
          );
        return;
    }
    }
    // If we get here, it means that an authorization header has been provided
    // Check the supplied credentials, if valid, call next, if invalid stop here

    //else
      checkCredentials(req, res, authHeader, next);
};

module.exports.checkPaths = function(req, res, next) {

    // There are a few paths that we will allow anonymous 
    var endpoint = helpers.getRoute(req);
    if(public_paths.includes(endpoint))
    {
      res.locals.publicPath = true;
      return next();
    } else {
    }

    // We need to get a cookie or have an authorization header
    // If we have an authorization cookie

    var authHeader = req.cookies["Authorization"];  


    if(authHeader == null) {
    // This is where we will do our preliminary security checks
    authHeader = req.headers.authorization;
    if (authHeader == null)
    {
        res.status(500);
        res.json(
          helpers.defaultErrorResponseObject(
              501, "Malformed Headers.  You MUST include an authorization basic header or have an authorization cookie to access non-public routes"
            )
          );
        return;
    }
    }
    // If we get here, it means that an authorization header has been provided
    // Check the supplied credentials, if valid, call next, if invalid stop here

    else
      checkCredentials(req, res, authHeader, next);
};

async function checkCredentials(req, res, authHeader, next)
{

    // Update 5/21/2020
    // I'm adding the ability to use an API key to have api to api calls be
    // handled using all of our great authentication
    // We'll create a custom auth header using a Bearer token


    // The first characters of the Basic authentication should be 'Basic '
    var basicStr = authHeader.substring(0, 6);

    if(basicStr == "Bearer"){
      
      // We've got an API Key auth
      // This will be linked to an individual user 
      var api_key = authHeader.substring(7, authHeader.length+7);
      var user = await Authentication.verifyBearerToken(res, api_key);
    
      if(user == false){
        res.status(500);
        res.json(
          helpers.defaultErrorResponseObject(
              502, "Malformed Authentication Header.  Invalid API Key"
            )
          );
        return;
      }

      // If we get here, everything is good!
      res.locals.sessionId = api_key
      res.locals.api_key = api_key
      res.locals.userId = user._id
      res.locals.accountId = user.accountId;
      res.locals.user = user
      res.locals.response = {}
      res.locals.baseURL = "https://" + process.env.BASE_URL;  // Should pull from environment variable
      next()
      return
    }

    if(basicStr != "Basic ") {
      res.status(500);
        res.json(
          helpers.defaultErrorResponseObject(
              502, "Malformed Authentication Header.  We use Basic authorization.  We're expecting an 'Authorization: Basic {{base64String}}"
            )
          );
        return; 
    }

    // Extract the base64 string from the header
    var base64Str = authHeader.substring(6, authHeader.length+6);
    var decodedAuthString = base64.decode(base64Str);

    // Split the user_id and sessionId
    var credentialsAr = decodedAuthString.split(":");
    var userId = credentialsAr[0];
    var sessionId = credentialsAr[1];

    var creds = userId.split("@%40@");

    userId = creds[1];
    accountId = creds[0]

    if((userId == null)||(sessionId == null)||
      (sessionId.length == 0)||(userId.length == 0))
    {

      res.status(500);
        res.json(
          helpers.defaultErrorResponseObject(
              503, "Malformed Authentication Header.  There was a problem with the authorization string, possibly a malformed base64 string or illegal character"
            )
          );
        return; 
    }

    // If we get here, we should have a valid string for both user_id and password
    // We will ultimately test this against the database, but for now, we'll user
    // "adam:dino" as valid.  Anything else is invalid
    // What this code WILL do is check the username and password against a database

    var user = await Authentication.verifySession(res, userId, sessionId);
    if(user == false)
      return;

    // If we get here, everything is good!
    res.locals.sessionId = user.sessionId
    res.locals.userId = user._id
    res.locals.accountId = user.accountId;
    res.locals.user = user                    // We get the user object often
                                              // Why not just get it once?

    res.locals.response = {}
    // Update this with the actual hapiKey for the user

    var route = helpers.getRoute(req);

    res.locals.baseURL = "https://" + process.env.BASE_URL;  // Should pull from environment variable

    // Finally, most routes will have an associated model with them
    // For example, if we create an "order" route, we expect to have an "orders" collection
    // We can save ourselves a lot of code by loading it here, and making it available
    // without having to write read/write code every time.  Let's do that
    // var endpoint = helpers.getRoute(req);
    // var schema = endpoint.charAt(0).toUpperCase() + endpoint.slice(1);
    // try{
    //   var model = mongoose.model(schema)
    //   var data = await model.find({
    //   created_by: user._id,
    //   owner: user.accountId
    // }).limit(10)
    // } catch(err){
    //   return next()
    // }
    // if(data.length > 1)
    //   res.locals[endpoint] = data;
    // else
    //   res.locals[endpoint] = data[0];
      
    // Data will equal all records that match.  If there are more than 10 records
    // then this will need to be handled elsewhere
    next()
}

// Catch all for all handling scheduled API Calls
app.use('/api/schedule/:schedule', function(req, res) {

  var headers = { "Authorization": "Bearer " + res.locals.user.toObject().api_key };
  //headers.push("Authorization: Bearer " + res.locals.user.api_key)
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;


  var strToSlice = "/schedule/" + req.params.schedule;
  var startPos = voca.indexOf(fullUrl, "/schedule");
  var target_url = voca.splice(fullUrl, startPos, strToSlice.length); 
  // scheduleFutureApiCall(executionDate, target_url, http_verb, http_headers, http_body){
  schedulingEngine.scheduleFutureApiCall(req.params.schedule, target_url, req.method, headers, req.body);

  // This is the centerpiece of my scheduling component
  // Any time you want an action to occur at a future date, you can take
  // any valid API call and turn it into a /api/schedule and instead of 
  // immediately calling the function, it will schedule this to occur at
  // a future date and time
  res.status(200);
  res.json({ "scheduled":req.params.schedule});

});

// If we get here, it means that the user has requested a non-public
// route, and has been authenticated.  Now let's check and make sure the
// user has access to the requested resource

  app.use("/api", checkRoles);

  function checkRoles(req, res, next)
  {
    
    if(res.locals.publicPath == true)
      return next();

    var route = helpers.getRoute(req);

    mongoose.connection.db.collection("roles").findOne(
      { accountId: mongoose.Types.ObjectId(res.locals.accountId)}, 
      function(err, results){

        if(results.allowedv2 == "**"){
          return next();
        }

        if(err != null) {
          return helpers.error(res, 6172, "There is a problem with the roles configuration.  No roles were found for this account")
        }

        if(results == null){
          return helpers.error(res, 6173, "There is a problem with the roles configuration.  No roles were found for this account");
        }

        for(var p of results.allowed)
        {
          if(p.route == route){
            res.locals.permissions = p.permissions
            return next();
          }
        }
        return helpers.error(res, 8437, "Disallowed.  This user does not have permission to access this route")
      })

    // if(availableRoles == false)
    //   return helpers.error(res, "515", "Unable to load roles for user" + res.locals.user.email)
    
  }

  // This is called for any request that has the /api path
  app.use('/api', function(req, res, next) {

    // If you get here, then there is a problem

    // What's supposed to happen

    //   Any time a request comes in that is /api, it enforces rules and routes everything
    //   to the api handlers.  The expectation is that the client will receive a json response
    //   and as such, MUST send the accept: application/json header to be considered a valid
    //   request.  Since browsers won't send this by default, it will prevent the api from being
    //   casually accessed from a web-browser.

    //   If a request is sent to any other endpoint besides api, the project will return HTML
    //   In general, it is assumed that the /client directory will contain all of the code
    //   for a javascript-based application, and the /public directory will contain any static
    //   html
 

  var acceptType = req.headers.accept;
  if(acceptType == "application/json")
  {
   } else 
  {
    // TEMPORARY PLEASE DELETE
    return next();
    var route = helpers.getRoute(req);
    if((header_requirement_exclusion.includes(route))&&(req.method == "GET"))
      return next();
    res.status(500);
      res.json(
        helpers.defaultErrorResponseObject(
            501, "Malformed Headers.  You MUST include an accept: application/json header for all api requests"
          )
        );
      
      return;    
  }

    next();  

 });

var routes = require("@root/route_includes.js")(app);

// Catch all for all unhandled routes
app.use('/api', function(req, res) {
 res.status(500);
      res.json(
        helpers.defaultErrorResponseObject(
            505, "Invalid Route.  This route does not exist"
          )
        );
});


app.use('/test', express.static('public/test/'));

app.use('/', express.static('client/Angular/dist/Angular'));



module.exports = app;