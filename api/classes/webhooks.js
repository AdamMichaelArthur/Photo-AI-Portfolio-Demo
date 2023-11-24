/*
	Created 12/20-2019 by Adam Arthur
*/

var express = require('express');
var router = express.Router();
var request = require('request-promise');
var moment = require('moment');
var mongoose = require('mongoose');
var Mongo = require('@classes/mongo.js');
var Voca = require("voca");

router.all("/test", routeDataSource);

function routeDataSource(req, res, next){
	var bounties = new Bounties(req, res, next)
	bounties.routeRequest()
}

class Stripe {

	constructor(req, res, next) {
		this.req = req
		this.res = res
		this.next = next
		super()
	}

}