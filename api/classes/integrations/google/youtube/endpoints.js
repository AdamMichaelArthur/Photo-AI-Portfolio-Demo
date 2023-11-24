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

function defaultError(req, res, error){

  var defaultErrorResponse = helpers.defaultErrorResponseObject();
  defaultErrorResponse.error = error.err_no;
  defaultErrorResponse.ErrorDetails.Error = error.err_no;
  defaultErrorResponse.ErrorDetails.Description = error.error_desc;
  res.json(defaultErrorResponse);

	return false;
}

function next(req, res){
	var defaultResponseObject = helpers.defaultResponseObject("youtube")
	defaultResponseObject["youtube"] = res.locals.response;
	res.status(200);
	res.json(defaultResponseObject);
}

module.exports = router