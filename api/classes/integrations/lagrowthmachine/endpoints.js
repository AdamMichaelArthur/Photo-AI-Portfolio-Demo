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
var Box = require('@classes/integrations/box/box.js');
var fs = require("fs")

class LaGrowthMachine {
  /* HTTP Functions 
     Can use this.req, this.res, this.user
  */


  constructor(req, res, next, email) {
    this.className = "lagrowthmachine";
    this.req = req;
    this.res = res;
    this.next = next;
    this.email = email;
    //this.user = res.locals.user;
    var defaultAcct = true;
    console.log(30);
  }

  error(err) {
    var defaultErrorResponse = helpers.defaultErrorResponseObject();
    console.log(263, err);
    if (err.raw.message != null) {
      defaultErrorResponse.error = 33000;
      defaultErrorResponse.ErrorDetails.Error = 33000;
      defaultErrorResponse.ErrorDetails.Description = err.raw.message;
    }

    this.res.status(500);
    this.res.json(defaultErrorResponse);
  }

  async test(){
    this.res.locals.response = {"OK":true}
    this.res.locals.response.user = this.email;
    next(this.req, this.res)
  }
}

function next(req, res) {
  console.log(37);
  var defaultResponseObject = helpers.defaultResponseObject("lagrowthmachine")
  defaultResponseObject["lagrowthmachine"] = res.locals.response;
  res.status(200);
  res.json(defaultResponseObject);
}

function routeDataSource(req, res, next) {

  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  var endofurl = fullUrl.indexOf("?");
  if (endofurl != -1) {
    fullUrl = fullUrl.substring(0, endofurl);
  }

  var action = helpers.getParameter(fullUrl, "action");

  var user = decodeURIComponent(helpers.getParameter(fullUrl, "user"));
  var Action = new LaGrowthMachine(req, res, next, user);

  if (typeof user == 'undefined') {
      var desc = {
        raw: {
          message: "user is a requied parameter"
        }
      }
      Action.error(desc);
      return;    
  }

  Action.user = user;
  
  if (typeof action == 'undefined') {
    var desc = {
      raw: {
        message: "This method is not defined"
      }
    }
     return Action.error(desc);
  }

  console.log(fullUrl);


  var evalCode = "Action." + action + "()";
  console.log(64, evalCode);
  try {
    eval(evalCode);

  } catch (err) {
    console.log(71, err);
    var desc = {
      raw: {
        message: "This method is not defined"
      }
    }
     Action.error(desc);
  }
}

// boxredirect is without auth
// box is with auth

var methods = Object.getOwnPropertyNames(LaGrowthMachine.prototype);
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

var routestr = `/test/`;
router.all(routestr, routeDataSource);

// var authenticated = `/authenticated/`;
// router.all(authenticated, routeDataSource);

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router;