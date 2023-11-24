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

var UserModel = mongoose.model("User");
var adminUser = {}

UserModel.findOne({"email":"admin@contentbounty.com"}, function(err, model){
  adminUser =  model;
  //console.log(156, "Admin User:", adminUser.integrations.box.tokenStore)
})

var adminModel = mongoose.model("User");

adminModel.findOne({"email":"admin@contentbounty.com"},function(err, model){
  if(err == null){
    //log(43, "watch_admin.js","creating new token store")
    delete box;
    box = new Box(model, true)
  } else {
    console.log(26, "watch_admin.js",err);
  }
});

class PayPalIntegration {
    /* HTTP Functions 
     Can use this.req, this.res, this.user
  */

  	getToken() {

  	}

  	
}

var methods = Object.getOwnPropertyNames( PayPalIntegration.prototype );
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function(x) { 
  return excludes.indexOf(x) < 0;
});

var routestr = `/authorize/`;
router.all(routestr, routeDataSource);

var authenticated = `/authenticated/`;
router.all(authenticated, routeDataSource);

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router;
