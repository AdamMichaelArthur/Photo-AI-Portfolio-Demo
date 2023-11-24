/*
	Created 8/15/19 by Adam Arthur
	Purpose of this class is to abstract 
	away the creation of an Autobound "campaign"

	Currently, we have a complicated and messy
	piece of code that is used to "approve" articles
	This process completes all of the necessary 
	steps to take an approved article and create
	an Autobound campaign for it.  Unfortunately
	the code to do this works, but is not maintainable,
	thus the reason for creating this class
*/

var request = require('request-promise');
var moment = require('moment');
var mongoose = require('mongoose');
var Mongo = require('@classes/mongo.js');
var Voca = require("voca");


module.exports = class Campaign {


	constructor() {

	}

	async createCampaign(){
		// Create the suggestedCampaign object
	}

	async loadContactsIntoCampaign(){

	}

	async filterContactsByContactOwner(){

	}

	async getContactsByPersona(){

	}

	async getCompaniesAssociatedWithCampaign(){

	}

	async getContactsAssociatedWithCampaign(){

	}

	
}
