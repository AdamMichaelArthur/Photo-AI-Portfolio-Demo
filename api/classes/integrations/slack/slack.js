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

var required_scopes = ['incoming-webhook','commands','chat:write','channels:history','groups:history','im:history','mpim:history','incoming-webhook'];

module.exports = class Slack {

	scopeRequestUrl = `https://slack.com/oauth/v2/authorize?scope=${required_scopes.toString()}&client_id=${process.env.SLACK_APP_CLIENT_ID}`;

	// example: https://slack.com/oauth/v2/authorize?scope=incoming-webhook,commands&client_id=121866172544.3448643611589&redirect_uri=https://app.contentbounty.com/v1.0/api/slack/callback&state=12345
	constructor(){
		
	}

}

	