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
var drive = require("@classes/integrations/google/drive/drive.js")

router.post("/uploadSmallFile", upload.any(), routeDataSource);
router.post("/updateSmallFile", upload.any(), routeDataSource);

class Drive {

  constructor(req, res, next) {
    this.className = "drive";
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    this.drive = new drive()

	}

  async updatePermissions(){
    await this.drive.updatePermissions(this.req.body.fileId);
    this.output({ "works":true })
  }

  async uploadSmallFile(){

    var files = []
    //console.log(46, this.req)

    for(var i = 0; i < this.req.files.length; i++){
      files.push(this.req.files[i]);
    }

    for(var file of files){
      try {
        console.log(52, file)
        var res = await this.drive.uploadSmallFile(file.buffer, file.originalname, file.mimetype);
      } catch(err){
        console.log(54, "Unable to upload file", file.originalname, err);
        this.output({"works": false })
      }
    }

    this.output({"fileId": res.data.id })
  }

  async updateSmallFile(){

    var files = [];

    for(var i = 0; i < this.req.files.length; i++){
      files.push(this.req.files[i]);
    }

    for(var file of files){
      try {

        var res = await this.drive.updateSmallFile(this.req.body.fileId, file.buffer, file.mimetype);
      } catch(err){
        console.log(54, "Unable to upload file", file.originalname, err);
        this.output({"works": false })
      }
    }

    this.output({"fileId": this.req.body.fileId })
  }

  /*  Takes the path provided in the requqest body and uploads and .docx or .xlsx files to Google Drive
   *
   *
  */
  async syncLocalDocumentsWithDrive(){
    var files = await this.drive.syncLocalDocumentsWithDrive(this.req.body.path);
    this.output({"uploaded": files })
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
	  	var drive = await this.drive.createSpreadsheet()
	  	this.output(drive);
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
  var defaultResponseObject = helpers.defaultResponseObject("drive")
  defaultResponseObject["drive"] = res.locals.response;
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

  var action = helpers.getParameter(fullUrl, "drive");

  if (typeof action == 'undefined') {
    action = helpers.getParameter(fullUrl, "drive");
  }

  var Action = new Drive(req, res, next);
  var evalCode = "Action." + action + "()";

  console.log(162, evalCode);

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

var methods = Object.getOwnPropertyNames(Drive.prototype);
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router