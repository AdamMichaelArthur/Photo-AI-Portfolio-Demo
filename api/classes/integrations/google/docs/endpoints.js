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
var docs = require("@classes/integrations/google/docs/docs.js")

class Docs {
  constructor(req, res, next) {
    this.className = "docs";
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    this.docs = new docs()

	}

  async createDocument(){
    this.docs.createDocument();
    this.output({ "works":true })
  }

	output(Obj) {
    var defaultResponse = helpers.defaultResponseObject(this.className);
    defaultResponse[this.className] = Obj;
    this.res.status(200);
    this.res.json(defaultResponse);
  }

  error(err) {
    var defaultErrorResponse = helpers.defaultErrorResponseObject();
    console.log(263, err);
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

  	/*	Creates a new Google Spreadsheet and Returns the Spreadsheet id
     *
     *
     *
     *
    */
	  async createSpreadsheet(){
	  	var docs = await this.docs.createSpreadsheet()
	  	this.output(docs);
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
  var defaultResponseObject = helpers.defaultResponseObject("docs")
  defaultResponseObject["docs"] = res.locals.response;
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

  var action = helpers.getParameter(fullUrl, "docs");

  if (typeof action == 'undefined') {
    action = helpers.getParameter(fullUrl, "docs");
  }

  var Action = new Docs(req, res, next);
  var evalCode = "Action." + action + "()";

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

var methods = Object.getOwnPropertyNames(Docs.prototype);
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router