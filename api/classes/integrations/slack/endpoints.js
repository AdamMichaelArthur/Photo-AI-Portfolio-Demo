var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var helpers = require("@classes/helpers.js")
var voca = require("voca");
const fs = require('fs');
var mongo = require("@classes/mongo.js");
var Pagination = require("@classes/pagination.js");
var Paginationv2 = require("@classes/paginationv2.js");
var excel = require("@classes/excelimport.js");
var multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
var base64 = require('base-64');
var pluralize = require('pluralize')
var moment = require('moment');
const util = require('util');
var bounties = require("@classes/bounties");
var mongoose = require("mongoose");
var slack = require("@classes/integrations/slack/slack.js");
const FormData = require('form-data');
const axios = require("axios");

class Slack {
  constructor(req, res, next) {
    this.className = "slack";
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    this.slack = new slack()

  }

  post(){
    this.res.status(200);
    this.res.json({"working":true});
  }

  output(Obj) {
    var defaultResponse = helpers.defaultResponseObject(this.className);
    defaultResponse[this.className] = Obj;
    this.res.status(200);
    this.res.json(defaultResponse);
  }

  error(err) {
    var defaultErrorResponse = helpers.defaultErrorResponseObject();
    if (err.raw.message != null) {
      defaultErrorResponse.Error = 33000;
      defaultErrorResponse.ErrorDetails.Error = 33000;
      defaultErrorResponse.ErrorDetails.Description = err.raw.message;
    }
    if(err.raw.extraInfo != null){
      defaultErrorResponse.ErrorDetails.extraInfo = { ... err.raw.extraInfo }
    }

    this.res.status(500);
    this.res.json(defaultErrorResponse);
  }

 async callback(){

    var code = this.req.query.code
    var brand_id = this.req.query.state;

    const form = new FormData();
    form.append('client_id', process.env.SLACK_APP_CLIENT_ID);
    form.append('client_secret', process.env.SLACK_APP_CLIENT_SECRET);
    form.append('code', code);

    var response = await axios.post("https://slack.com/api/oauth.v2.access", form, { headers: form.getHeaders() })

    if(response.data.ok == true){
        var query = {
          "_id":mongoose.Types.ObjectId(brand_id)
        }
        var update = {
          "$set": { "slack": response.data, "zapier_webhook_url": response.data.incoming_webhook.url }
        }

      var brandUpdateResult = await mongoose.connection.db
        .collection("brands")
        .update(query, update);

    } else {
      // Display an error
      this.res.status(200);
      this.res.json({"Working":false, "Msg": response.data })
      return;
    }

    this.res.redirect("https://app.contentbounty.com");

  }


  requiredParams(requiredKeys, optionalKeys){
    var keysInBody = Object.keys(this.req.body);

       var missingKeys = [];

       // Check for any missing keys
       for(var key of requiredKeys){
         if(keysInBody.indexOf(key) == -1){
           missingKeys.push(key)
         }
       }

       var extraKeys = [];
       // Check for extra keys
       for(var key of keysInBody){
         if(requiredKeys.indexOf(key) == -1){
           extraKeys.push(key);
         }
       }

       for(var optionalKey of optionalKeys){
         for(var extraKey of extraKeys){
           var pos = 0;
           if(extraKey === optionalKey){
             extraKey.splice(pos, 1);
             pos++;
           }
         }
       }

       if((missingKeys.length == 0)&&(extraKeys.length == 0)){
         return true;
       }

       this.error( {
              raw: { 
                error: 104,
                extraInfo: {
                  extraParameters: extraKeys,
                  missingParameters: missingKeys
                },
                message: "You have extra or missing parameters in your POST request"
              }});

       return false;
     }

   // End of Class
}

function next(req, res) {
  var defaultResponseObject = helpers.defaultResponseObject("slack")
  defaultResponseObject["slack"] = res.locals.response;
  res.status(200);
  res.json(defaultResponseObject);
}

function routeDataSource(req, res, next) {

	console.log(46)
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  var endofurl = fullUrl.indexOf("?");
  if (endofurl != -1) {
    fullUrl = fullUrl.substring(0, endofurl);
  }

  var action = helpers.getParameter(fullUrl, "slack");

  if (typeof action == 'undefined') {
    action = helpers.getParameter(fullUrl, "slack");
  }

  var Action = new Slack(req, res, next);
  var evalCode = "Action." + action + "()";

  Action.fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  console.log(evalCode);

  try {
    eval(evalCode);
  } catch (err) {
    var desc = {
      raw: {
        message: "This method is not defined"
      }
    }
    Action.error(desc);
  }
}

var methods = Object.getOwnPropertyNames(Slack.prototype);
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router