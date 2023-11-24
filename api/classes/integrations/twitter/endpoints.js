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
var Twitter = require('@classes/integrations/twitter/twitter.js');

class TwitterIntegration {
    /* HTTP Functions 
     Can use this.req, this.res, this.user
  */

  constructor(req, res, next) {
    this.className = "twitter";
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    this.twitter = new Twitter();
  }

  test(){
  	this.res.status(200);
  	this.res.json({"working":true})
  }

  token(){
  	
  }

  tweet(){
    var header = this.twitter.tweet("This is a test")
    this.res.status(200)
    this.res.send(header);
  }
}

function routeDataSource(req, res, next) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    var endofurl = fullUrl.indexOf("?");
    if(endofurl != -1){
      fullUrl = fullUrl.substring(0, endofurl); 
    }

    var action = helpers.getParameter(fullUrl, "twitter");

    if(typeof action == 'undefined'){
      action = helpers.getParameter(fullUrl, "box");
    }

    var Action = new TwitterIntegration(req, res, next);
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

var methods = Object.getOwnPropertyNames( TwitterIntegration.prototype );
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function(x) { 
  return excludes.indexOf(x) < 0;
});

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router;