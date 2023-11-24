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

var mammoth = require("mammoth");

router.post("/upload", upload.any(), docxtojson);

async function docxtojson(req, res){

	var files = []
	for(var i = 0; i < req.files.length; i++){
		files.push(req.files[i]);
	}

	// Check and make sure we've got at least one file
	if(files.length == 0){
		return defaultError(req, res, { "err_no":10542, "error_desc": "No files were attached" });
	}

	var rVal = { files: [] }

	for(var file of files){

		try {
			var fileText = await mammoth.extractRawText({buffer: file.buffer})
		} catch(err){

		}

		try {
			var fileHtml = await mammoth.convertToHtml({buffer: file.buffer})
		} catch(err){

		}

		try {
			var fileMarkdown = await mammoth.convertToMarkdown({buffer: file.buffer})
		} catch(err){

		}

		var fileObj = { fileName: file.originalname, text: fileText.value, html: fileHtml.value, markdown: fileMarkdown.value }
		rVal.files.push(fileObj)
	}



	//var fileText = awai
	
    // .then(function(result){
    //     var text = result.value; // The raw text
    //     console.log(41, text)
    //     var messages = result.messages;
    // })
    // .done();


	res.locals.response = { ... rVal }
	next(res, res);

}

function defaultError(req, res, error){

  var defaultErrorResponse = helpers.defaultErrorResponseObject();
  defaultErrorResponse.error = error.err_no;
  defaultErrorResponse.ErrorDetails.Error = error.err_no;
  defaultErrorResponse.ErrorDetails.Description = error.error_desc;
  res.json(defaultErrorResponse);

	return false;
}

function next(req, res){
	var defaultResponseObject = helpers.defaultResponseObject("docx")
	defaultResponseObject["docx"] = res.locals.response;
	res.status(200);
	res.json(defaultResponseObject);
}

module.exports = router