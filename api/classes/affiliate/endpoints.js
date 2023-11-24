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
const axios = require('axios');
const uuidv4 = require('uuid/v4')

class AffiliateTracking {
  /* HTTP Functions 
     Can use this.req, this.res, this.user
  */

  constructor(req, res, next, email) {
    this.className = "affiliatetracking";
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
    console.log(33, err);
    if (err.raw.message != null) {
      defaultErrorResponse.error = 33000;
      defaultErrorResponse.ErrorDetails.Error = 33000;
      defaultErrorResponse.ErrorDetails.Description = err.raw.message;
    }

    this.res.status(500);
    this.res.json(defaultErrorResponse);
  }

  /*

      We use Content Bounty to manage all of our outreach requests

      We have a very generous affiliate program.  Check it out here.

      What best describes you?

      -  I am the owner and operator of my own site

      -  I am an agency working on behalf of a client

      -  My company has a portfolio of sites

      -  I am a salesperson doing outreach for a product or service



      Page Views
      Cookies Installed
      Signups
      Form Submissions
      Page Referrals
      Subscriptions
      Money Spent
  */

  // This is a unique key that is associated with the logged in user.  It is used for tracking
  // people who visit the site.
  // Since it's important that this doesn't change, if a key has already been previously generated
  // it will return the previously generated key
  gen_key(){
      var cookie_key = uuidv4()
      
  }

  // Generates and retrieves a cookie, associated it with a user, and installs it
  // 
  install(){
    // What does our cookie need to contain?
    // User
    // Page

    // We don't want to expose user-specific data, aka an email address or login, so we need to anonymize this somehow
    /*
        {
            user: adam@contentbounty.com,
            referring_page: /my/page
        }
    */
  }

}

function next(req, res) {
  console.log(37);
  var defaultResponseObject = helpers.defaultResponseObject("affiliatetracking")
  defaultResponseObject["affiliatetracking"] = res.locals.response;
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
  var Action = new AffiliateTracking(req, res, next, user);

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

var methods = Object.getOwnPropertyNames(AffiliateTracking.prototype);
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

// var routestr = `/test/`;
// router.all(routestr, routeDataSource);

// var authenticated = `/authenticated/`;
// router.all(authenticated, routeDataSource);

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router;