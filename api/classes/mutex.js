/*
	mutex.js
	Written 11/30/2019 by Adam Arthur

	Purpose: to define datasources that are shared
	by all users across the solution.

	As an example: let's say I want to have a drop-down
	menu item of "Content Types"

	I might want to add or remove Content Types, and when 
	I do, I want these content types to apply for everyone.

	Struggled with the name, but decided to use 'mutex' because
	it suggests sharing resources.  
*/

var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var helpers = require("@classes/helpers.js")
var voca = require("Voca");
const fs = require('fs');
var mongo = require("@classes/mongo.js");
var Pagination = require("@classes/pagination.js");
var excel = require("@classes/excelimport.js");
var multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })

class Mutex(){

	constructor(){

	}

	createMutex(name){
		// Creates or loads a mutex item
	}
}