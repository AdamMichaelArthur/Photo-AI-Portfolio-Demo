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

const { v4: uuidv4 } = require('uuid');

var Box = require('@classes/integrations/box/box.js');
var fs = require('fs');
const util = require('util');
var Communication = require("@classes/communication.js")
router.all("/test", routeDataSource);

function routeDataSource(req, res, next){
	var bounties = new Bounties(req, res, next)
	bounties.routeRequest()
}

const BountyTemplate = {
				batch: "",
				dropboxLink: [],
				promptLists: [],
				additional_instruction: '',
				keywords: [],
				titles: [],
				prompts: [],
				content_type: "",
				content_queue: "",
				process: [],
				spend: 0,
				bounty: {
			      content_type: "",
			      short_description: '',
			      suggested_bounty: '',
			      frequency: '',
			      starting_day: '',
			      brand_name: ''
			    }
	}



module.exports = class Bounties{

	bAllBountiesMade = false;
	bAllFoldersMade = false;
	bUpdatedBounties = false;

	constructor(bounties, db, user =null) {
		this.bounties = bounties
		this.db = db;
		this.user = user;
	}

	testint = 0;
	
	async createFromUnusedKeywords(user, brand_name, frequency, starting_date, process, content_type ="Long Form Article", callback =null){


		var _Process = [ ... process ]

		//var content_type = process[0].content_type;

		this.user = user;

		var adminModel = mongoose.model("User");
		var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});

		//console.log(92, "bounties.js")
		var box = new Box(adminUser)
		this.box = box;

		var brand_id = await mongoose.connection.db
        .collection("brands")
        .findOne({"brand_name":brand_name}, {_id:1,created_by:1,owner:1,modified_by:1});

		var keywordsModel = mongoose.model("Keywords");

		var searchObj = {
			"brand_id":brand_id._id,
			"bKeywordDeployed": {"$ne": true }
		}
	
		//var titles = await keywordsModel.find(searchObj, {"Title":1, "Type":1,"brand_name":1, _id:0}).distinct("Title");
		var bounties = [];

		var batch = uuidv4()
		this.batch = batch;
		
		var dayMultiplier = 1;
		switch(frequency){
				case '2xDay':
					dayMultiplier = 0.5;
					break;
				case '3xDay':
					dayMultiplier = 0.3;
					break;
				case '4xDay':
					dayMultiplier = 0.25;
					break;
				case 'daily':
					dayMultiplier = 1;
					break;

			    case '2xWeek':
			    	dayMultiplier = 2;
			    	break;

			    case '3xWeek':
			    	dayMultiplier = 3;
			    	break;

			    case '4xWeek':
			    	dayMultiplier = 4;
			    	break;

			    case '5xWeek':
			    	dayMultiplier = 5;
			    	break;

			    case '6xWeek':
			    	dayMultiplier = 6;
			    	break;

			    case '1xWeek':
			    	dayMultiplier = 7;
			    	break;

			    case '2xMonth':
			    	dayMultiplier = 14;
			    	break;

			    case '1xMonth':
			    	dayMultiplier = 30;
			    	break;
		}

		var titles = await keywordsModel.find(searchObj).lean();

		var guidelinesFolderName = `templates-${brand_name}`;
		// This can be made MUCH more effecient!!!

		var brandsFolderId = await box.lookupFolderIdIfNotExistsCreate("brands",  '0')
		if(brandsFolderId == false){
			console.log(149)
			return false;
		}
		var accountFolderId = await box.lookupFolderIdIfNotExistsCreate(this.user.accountId, brandsFolderId);
		if(accountFolderId == false){
			console.log(153)
			return false;
		}

		var brandFolderId = await box.lookupFolderIdIfNotExistsCreate(brand_name, accountFolderId);

		var batch = uuidv4()
		this.batch = batch;

		// This function guarantees that a folder has been created for our bounties
		var parentFolderInfo = await this.createParentFolder(brand_name, user, batch);
		var parentFolderId = parentFolderInfo.id;

		var guidelinesFolderId = await this.box.lookupFolderId(guidelinesFolderName, false, brandFolderId)
		// Well I might be able to improve this here...


		var bountiesAr = [];

		var testAr = [];

		console.log(173, titles.length, titles, searchObj);

		for(var i = 0; i < titles.length; i++){

			if(typeof titles[i]["Content Type"] != 'undefined')
				content_type = titles[i]["Content Type"]
			else {
				//content_type = "Long Form Article"; // Long Form Article is our default content type
			}

			console.log(187, content_type)
			var tmpProcess = [ ... _Process ]
			tmpProcess[0].testint = this.testint;
			this.testint++;

			var promptsAr = [];
			var titlesAr = [];

			if(typeof titles[i].Prompt != 'undefined'){
				if(Array.isArray(titles[i].Prompt))
					promptsAr = titles[i].Prompt
				else
					promptsAr.push(titles[i].Prompt)
			}

			var bAddGoogleDoc = false;
			var bAddGoogleSpreadsheet = false;

			if(typeof titles[i]["bountyDocument"] != 'undefined'){
				bAddGoogleDoc = true;
			}

			if(typeof titles[i]["bountySpreadsheet"] != 'undefined'){
				bAddGoogleSpreadsheet = true;
			}

			console.log(168168, promptsAr)
			if(typeof titles[i].Title != 'undefined'){
				if(Array.isArray(titles[i].Title))
					titlesAr = titles[i].Title
				else 
					titlesAr.push(titles[i].Title)
			}

			var bountyTemplate = Object.assign({
				batch: batch,
				dropboxLink: [],
				promptLists: [],
				additional_instruction: '',
				keywords: [titles[i].Keyword],
				titles: titlesAr,
				prompts: promptsAr,
				//titles: [titles[i]],
				content_type: content_type,
				content_queue: content_type,
				brand_id: brand_id._id,
				process: process,
				bounty: {
			      content_type: content_type,
			      short_description: '',
			      suggested_bounty: '$0.00',
			      frequency: frequency,
			      starting_day: starting_date,
			      brand_name: brand_name,
			      brand_id:brand_id._id
			    }
			})

			let now = moment(starting_date);

			// This is causing a bug.  Don't know why it's here.  Keeping code for
			// now in case there was a good reason for this...
			// if(i < 1){
			// 	i = 1;
			// }

			var nextBounty = now.add(i*dayMultiplier, 'days').format();
			var tPos = Voca.indexOf(nextBounty, 'T');
			var simplifiedBountyDate = Voca.substring(nextBounty, 0, tPos);

			var bounty = { "process" : [ ... bountyTemplate.process ] }
			var bounty = this.createBountyByKeyword(
				simplifiedBountyDate, bountyTemplate, batch, brandsFolderId, parentFolderId, brandFolderId, guidelinesFolderId, guidelinesFolderName, parentFolderInfo.name, brand_id)

			if(bAddGoogleDoc){
				bounty["bountyDocument"] = titles[i]["bountyDocument"];
			}
			if(bAddGoogleSpreadsheet){
				bounty["bountySpreadsheet"] = titles[i]["bountySpreadsheet"];
			}


			// There is some kind of reference problem here.  This is a hack and I don't like it...but it works
			bountiesAr.push(JSON.parse(JSON.stringify(bounty)))

			
		}

		var mainBrandId = "";
		for(var i = 0; i < bountiesAr.length; i++){
			bountiesAr[i].brand_id = mongoose.Types.ObjectId(bountiesAr[i].brand_id)
			mainBrandId = bountiesAr[i].brand_id
		}

		console.log(228, util.inspect(bountiesAr, false, null, true /* enable colors */));
		var bountyModel = await this.db.mongoCreateMany(bountiesAr);

		//console.log(201, bountiesAr);

		var searchObj = {
			"brand_id":brand_id._id,
			"bKeywordDeployed": {"$ne": true }
		}
	
		var bountiesIds = await this.db.model.find({ "batch" : batch}, {_id:1, brand_id:1, keywords:1 }).lean()

		
		var result = await keywordsModel.updateMany(searchObj, { "bKeywordDeployed": true });

		console.log(268, result);

		const bulkData = bountiesIds.map(bounty => (
		    {
		        updateOne: {
		            filter: {
		                "brand_id" : mongoose.Types.ObjectId(bounty.brand_id),
		                "Keyword": bounty.keywords[0]
		            },
		            update: { $set: {"bounty_id": mongoose.Types.ObjectId(bounty._id)} }
		        }
		    }
		));

		//console.log(228, bulkData)
		var keywordsModel = mongoose.model("Keyword")

		console.log(228, util.inspect(bulkData, false, null, true /* enable colors */));
		var bulkWriteResults = await keywordsModel.bulkWrite(bulkData);

		if(callback != null){
			callback(mainBrandId)
		}
		//setTimeout(this.updateBounties, 1500, batch, this);
		//console.log(232, bulkWriteResults);

		//console.log(195, result);
		// Update the keywords to mark them as deployed
	}

	createBountyByKeyword(release_for_bounty, bountyTemplate, batch, brandsFolderId, parentFolderId, brandFolderId, guidelinesFolderId, guidelinesFolderName, parentFolderName, brand_id =''){ //content_type, keywords){


		var brand_name = bountyTemplate.bounty.brand_name;
		//var folderName = `${bountyTemplate.bounty.brand_name} -- ${bountyTemplate.content_type} -- ${release_for_bounty}`
		var folderName = `${bountyTemplate.content_type} -- ${release_for_bounty}`

		//console.log(763, release_for_bounty, bountyTemplate, batch, brandsFolderId, parentFolderId, brandFolderId, guidelinesFolderId, guidelinesFolderName, parentFolderName)

		if(bountyTemplate.keywords == null)
			bountyTemplate.keywords =[]
		if(bountyTemplate.titles == null)
			bountyTemplate.titles = [];

		var trackerModel = mongoose.model("Track");
		
		// 		const bulkData = movers.movers.map(item => (
		//     {
		//         replaceOne: {
		//             upsert: true,
		//             filter: {
		//                 "key.symbol" : item.key.symbol
		//             },
		//             replacement: item
		//         }
		//     }
		// ));
		// this.losers.bulkWrite(bulkData);

		var updates = [];

		var Process = bountyTemplate.process
		// This can be done as an insert many...
		for(var i = 0; i < Process.length; i++){
			var refDocId = uuidv4()
			Process[i]['refDocId'] = refDocId
			var msg = { refDocId: refDocId, trackingState: false, timestamps: [] }
      		trackerModel.update({ refDocId: refDocId },
       		msg, { upsert: true });

      		updates.push({
      			"updateOne": {
      			upsert: true,
      			filter: { refDocId: refDocId },
      			replacement: msg
      			}
      		})
		}

		console.log(277, mongoose.Types.ObjectId(brand_id._id))

		var bounty = {
			"brand_name":bountyTemplate.bounty.brand_name,
			"brand_id": mongoose.Types.ObjectId(brand_id._id),
			"guidelines_folder":guidelinesFolderName,
			"guidelines_folder_id":guidelinesFolderId,
			"parent_folder":parentFolderName,
			"parent_folder_id":parentFolderId,
			"release_for_bounty":release_for_bounty,
			"dependent_on":"",
			"queued_content":bountyTemplate.content_type,
			"m_b":0,
			"spend":0,
			"c_b":0,
			"creator":"",
			"creators":[], // { _id, step}
			"content_type":bountyTemplate.content_type,
			"pipeline":"unclaimed",	// unclaimed, in progress, published
			"published":false,
			"keywords":bountyTemplate.keywords,
			"titles":bountyTemplate.titles,
			"prompts":bountyTemplate.prompts,
			"stages":[],
			"files":[],
			"process": [ ... Process ],
			"batch":batch,
			"title":"",
			"folderId":0
		}

		console.log(372, bounty)

		return bounty;
	}

	getStartingDay(starting_day){
			var dowNum = 0;
			switch(starting_day){
				case "Sunday":
					dowNum = 0;
					break;
				case "Monday":
					dowNum = 1;
					break;
				case "Tuesday":
					dowNum = 2;
					break;
				case "Wednesday":
					dowNum = 3;
					break;
				case "Thursday":
					dowNum = 4;
					break;
				case "Friday":
					dowNum = 5;
					break;
				case "Saturday":
					dowNum = 6;
					break;
			}

			let now = moment();
			var day = moment().day(starting_day);
			const dayINeed = dowNum; // for Thursday
			const today = moment().isoWeekday();
			var nextDay;
			// if we haven't yet passed the day of the week that I need:
			if (today <= dayINeed) { 
			  // then just give me this week's instance of that day
			  nextDay = moment().isoWeekday(dayINeed);
			} else {
			  // otherwise, give me *next week's* instance of that same day
			  nextDay = moment().add(1, 'weeks').isoWeekday(dayINeed);
			}
			return nextDay;
		}

	async createBountiesFast(user, now =false){

		console.log(423, "createBountiesFast")

		var adminModel = mongoose.model("User");
		var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});
		this.user = user;

		try {
			var box = new Box(adminUser)
		} catch(err){
			console.log(417)
			return false;
		}
		
		this.box = box;

		var brandsFolderId = await box.lookupFolderIdIfNotExistsCreate("brands",  '0')
		if(brandsFolderId == false){
			console.log(425)
			//return false;
		}

		var accountFolderId = await box.lookupFolderIdIfNotExistsCreate(this.user.accountId, brandsFolderId);
		if(accountFolderId == false){
			console.log(431)
			//return false;
		}

		var bountyTemplate = this.bounties[0]
		console.log(433, bountyTemplate)
		// Iterate through here to get them all?

		var brandNameFolderId = await box.lookupFolderIdIfNotExistsCreate(bountyTemplate.bounty.brand_name, accountFolderId);
		//await this.box.storeRootFolders();

		var batch = uuidv4()
		this.batch = batch;

		// This function guarantees that a folder has been created for our bounties
		var parentFolderInfo = await this.createParentFolder(bountyTemplate.bounty.brand_name, user, batch);

		var futureBounties = []

		//this.box.createFolderCount = this.bounties.length;		

		var repeatAr = this.getRepeatFrequency(this.bounties)

		console.log(466, repeatAr)

		var repeatCount = repeatAr[0]
		var interval = repeatAr[1];

		for(var i = 0; i < this.bounties.length; i++){
		
		var bountyTemplate = this.bounties[i]

		var testBackdating = 0;
		console.log(268, process.env.DEV_ENVIRONMENT)

		//if(process.env.DEV_ENVIRONMENT == "true")
		//	testBackdating = 37;

		console.log(273, testBackdating)

		var starting_day = bountyTemplate.bounty.starting_day;

		if(now == true){
			starting_day = moment().format('dddd');
		}

		const today = this.getStartingDay(starting_day).subtract(testBackdating, 'days');

		console.log(276, today.format())

		var futureBounties = await this.createFutureBountyFast(today, repeatCount, interval, batch, parentFolderInfo.id, 
		 	parentFolderInfo.name, bountyTemplate);

		// mongoCreateMany will return the documents that were inserted into the DB
		var insertedDocuments = await this.db.mongoCreateMany(futureBounties)

		for(var i = 0; i < insertedDocuments.length; i++){
					futureBounties[i]["_id"] = insertedDocuments[i]["_id"];
					console.log(497, futureBounties[i]["_id"])
				}

		}

		

		return futureBounties;
	}

	async createFutureBountyFast(startDay, repeatCount, interval, batch, parentFolderId, parentFolderName, bountyTemplate){
		var futureBounties = []

		var guidelinesFolderName = `templates-${bountyTemplate.bounty.brand_name}`;

		// This can be made MUCH more effecient!!!
		var brandsFolderId = await this.box.lookupFolderId("brands")
		var accountFolderId = await this.box.lookupFolderId(this.user.accountId, false, brandsFolderId)
		var brandFolderId = await this.box.lookupFolderId(bountyTemplate.bounty.brand_name, false, accountFolderId)
		var guidelinesFolderId = await this.box.lookupFolderId(guidelinesFolderName, false, brandFolderId)
		//var guidelinesFolderId = await this.box.lookupFolderId(`Editorial Guidelines - ${bountyTemplate.bounty.content_type}`, false, guidelinesParentFolderId)

		//console.log(282, guidelinesFolderName, guidelinesParentFolderId);

		console.log(507, repeatCount)


		let beginDay = moment(startDay).format();

		for(var i = 0; i < repeatCount; i++){

			var nextBounty = startDay.add(parseInt(interval*i), 'days').format();
			startDay = moment(beginDay)
			console.log(513, nextBounty, interval, i, parseInt(interval*i), startDay.format(), beginDay);

			var tPos = Voca.indexOf(nextBounty, 'T');
			var simplifiedBountyDate = Voca.substring(nextBounty, 0, tPos);

			var newTemplate = JSON.parse(JSON.stringify(bountyTemplate));
			var bounty = await this.createBountyFast(simplifiedBountyDate, newTemplate, batch, parentFolderId, guidelinesFolderId, guidelinesFolderName)
			futureBounties.push(bounty)
		}

		return futureBounties
	}

	async createBountyFast(release_for_bounty, bountyTemplate, batch, parentFolderId, guidelinesFolderId, guidelinesFolderName){ //content_type, keywords){


		var brand_name = bountyTemplate.bounty.brand_name;
		//var folderName = `${bountyTemplate.bounty.brand_name} -- ${bountyTemplate.content_type} -- ${release_for_bounty}`
		var folderName = `${bountyTemplate.content_type} -- ${release_for_bounty}`

		//var parentFolderId = await this.box.lookupFolderId(brand_name, true);

		//var bountyFolderId = await this.box.lookupFolderId(folderName, true);

		if(bountyTemplate.keywords == null)
			bountyTemplate.keywords =[]
		if(bountyTemplate.titles == null)
			bountyTemplate.titles = [];

		// For  each process, we need to make a time tracker document
		var trackerModel = mongoose.model("Track");
		
		for(var i = 0; i < bountyTemplate.process.length; i++){
			var refDocId = uuidv4()
			bountyTemplate.process[i]['refDocId'] = refDocId
			var msg = { refDocId: refDocId, trackingState: false, timestamps: [] }
      		trackerModel.update({ refDocId: refDocId },
       		msg, { upsert: true }, function(){
       			
       		});
       		
       		if(bountyTemplate.process[i]["inhouse"] != false){
       			console.log(333, mongoose.Types.ObjectId(bountyTemplate.process[i]["inhouse"]))
       			bountyTemplate.process[i]["inhouse"] = mongoose.Types.ObjectId(bountyTemplate.process[i]["inhouse"])
       		}
		}

		var bounty = {
			"brand_name":bountyTemplate.bounty.brand_name,
			"brand_id":mongoose.Types.ObjectId(bountyTemplate.bounty.brand_id),
			"guidelines_folder":guidelinesFolderName,
			"guidelines_folder_id":guidelinesFolderId,
			"parent_folder":brand_name,
			"parent_folder_id":parentFolderId,
			"release_for_bounty":release_for_bounty,
			"dependent_on":"",
			"queued_content":bountyTemplate.content_type,
			"m_b":0,
			"spend":0,
			"c_b":0,
			"creator":"",
			"creators":[], // { _id, step}
			"content_type":bountyTemplate.content_type,
			"pipeline":"unclaimed",	// unclaimed, in progress, published
			"published":false,
			"keywords":bountyTemplate.keywords,
			"titles":bountyTemplate.titles,
			"prompts":[],
			"stages":[],
			"files":[],
			"process":bountyTemplate.process,
			"batch":batch,
			"title":"",
			"folderId":-1
		}
		return bounty;
	}

	getRepeatFrequency(bounties){

		var repeatCount = 1;
		var interval = 1;
		for(var i = 0; i < bounties.length; i++){

			var bountyTemplate = this.bounties[i]
			var frequency = bountyTemplate.bounty.frequency;

			console.log(602, frequency);

			// Valid Frequencies are "Daily", "3x Per Week", "Weekly", "2x Per Month", "Monthly"

			switch(frequency){
				case "2x Per Day":
					interval = 0.5;
					repeatCount = 60;
					break;
				case '3x Per Day':
					interval = 0.3;
					repeatCount = 90;
					break;
				case '4x Per Day':
					interval = 0.25;
					repeatCount = 120;
					break;
				case 'daily':
					dayMultiplier = 1;
					break;
				case "Daily":
					repeatCount = 30;
					interval = 1;
					break;
				case "3x Per Week":
					repeatCount = 12;
					interval = 3;
					break;
				case "Weekly":
					repeatCount = 4;
					interval = 7;
					break;
				case "2x Per Month":
					repeatCount = 2;
					interval = 15;
					break;
				case "Monthly":
					repeatCount = 1;
					interval = 30;
					break;
			}

		}

		return [repeatCount, interval]
	}

	async createBounties(user){
		this.user = user;
		
		var adminModel = mongoose.model("User");
		var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});

		console.log(397, "bounties.js")
		var box = new Box(adminUser)
		this.box = box;
		await this.box.storeRootFolders();

		console.log(234, this.box.foldersInfo)

		var batch = uuidv4()
		this.batch = batch;
		this.box.createFolderCount = this.bounties.length;
		for(var i = 0; i < this.bounties.length; i++){

			var bountyTemplate = this.bounties[i]
			var frequency = bountyTemplate.bounty.frequency;
			// Valid Frequencies are "Daily", "3x Per Week", "Weekly", "2x Per Month", "Monthly"
			var repeatCount = 1;
			var interval = 1;
			switch(frequency){
				case "Daily":
					repeatCount = 30;
					interval = 1;
					break;
				case "3x Per Week":
					repeatCount = 12;
					interval = 3;
					break;
				case "Weekly":
					repeatCount = 4;
					interval = 7;
					break;
				case "2x Per Month":
					repeatCount = 2;
					interval = 15;
				case "Monthly":
					repeatCount = 1;
					interval = 30;
			}

			var dowNum = 0;
			switch(bountyTemplate.bounty.starting_day){
				case "Sunday":
					dowNum = 0;
					break;
				case "Monday":
					dowNum = 1;
					break;
				case "Tuesday":
					dowNum = 2;
					break;
				case "Wednesday":
					dowNum = 3;
					break;
				case "Thursday":
					dowNum = 4;
					break;
				case "Friday":
					dowNum = 5;
					break;
				case "Saturday":
					dowNum = 6;
					break;
			}

			// The first thing we need to do is figure out what today is
			// Then, we need to figure out when the next "bountyTemplate.bounty.starting_day" is

			let now = moment();
			var day = moment().day(bountyTemplate.bounty.starting_day);
			const dayINeed = dowNum; // for Thursday
			const today = moment().isoWeekday();
			var nextDay;
			// if we haven't yet passed the day of the week that I need:
			if (today <= dayINeed) { 
			  // then just give me this week's instance of that day
			  nextDay = moment().isoWeekday(dayINeed);
			} else {
			  // otherwise, give me *next week's* instance of that same day
			  nextDay = moment().add(1, 'weeks').isoWeekday(dayINeed);
			}
			await this.createFutureBounty(bountyTemplate, nextDay, repeatCount, interval, batch);
			// nextDay is the starting point
		}

		// All bounties have been made...
		this.bAllBountiesMade = true;
		// I need to set a timer....we're waiting for both
		// this.allBountiesMade = true and this.allFoldersCreated = true;
		setTimeout(this.updateBounties, 1500, batch, this);
	}

	async getBountyCount(batch){
		// var result = await mongoose.connection.db.collection('bounties')
	 //      													.find(query, update, filters );
	 	var bounty = mongoose.model("Bounty")
	 	var bountyCount = await bounty.find({"batch":batch}).count()
	 	return bountyCount
	}

	async updateBounties(batch, self){
		// if((self.bAllBountiesMade == false) && (self.bAllFoldersMade == false)){
		// 	setTimeout(self.updateBounties, 1500, batch, self);	
		// } else {
		// 	if(self.bUpdatedBounties == false){
		// 		self.bUpdatedBounties = true;
		// 		// find all bounties that match the 'batch'
		// 		var bounty = mongoose.model("Bounty");
		// 		var newBounties = await bounty.find({"batch":batch});
		// 		for(var i = 0; i < newBounties.length; i++){
					
  //     				var folderId = self.box.folders[i].folderInfo.id
  //     				var query = { _id : mongoose.Types.ObjectId(newBounties[i]._id) }
  //     				var update = { $set : { folderId: folderId } }
  //     				var filters = { }	
  //     				//var result = await mongoose.connection.db.collection('bounties')
  //     				//									.updateOne(query, update, filters );
		// 		}
				
		// 	}
		// }
	}

	async createFutureBounty(bountyTemplate, startDay, repeatCount, interval, batch){
		for(var i = 0; i < repeatCount; i++){
			var nextBounty = startDay.add(interval, 'days').format();
			var tPos = Voca.indexOf(nextBounty, 'T');
			var simplifiedBountyDate = Voca.substring(nextBounty, 0, tPos);
			var bounty = await this.createBounty(simplifiedBountyDate, bountyTemplate, batch)

			await this.db.mongoCreate(bounty)
		}
	}

/*
		Hard coded folder ids
		This will not work in production...but it works for now
		Editorial Guidelines - Alternatives: 110620015163
		Editorial Guidelines - How To Post: 110619842347
		Editorial Guidelines - Industry Roundup: 110621229738
		Editorial Guidelines - Info Content: 110620675826
		Editorial Guidelines - Link Share Post: 110621020450
		Editorial Guidelines - Long Form Article: 110622531130
		Editorial Guidelines - Question Post: 110620178835
		Editorial Guidelines - Roundup Review: 110622603248
		Editorial Guidelines - Single Review: 110622442928
		Editorial Guidelines - This vs. That: 110620910548
		Editorial Guidelines - Video - Animated Explainer: 110620893493
		Editorial Guidelines - Video - On Screen Persona: 110622199368
		Editorial Guidelines - Podcast: 110619983509
*/

	async createTestBounty(brand_name){

		var adminModel = mongoose.model("User");
		var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});

		console.log(552, "bounties.js")
		var box = new Box(adminUser)
		this.box = box;

			let now = moment().format();
			var starting_date = now;
			var frequency = "Monthly"
			var content_type = "Question Post"
			var keywords = ["keyword 1", "keyword 2"]
			var titles = [];
			var batch = now;

			var process = [
            {
                "completion_order": 1,
                "name": "Rough Draft",
                "description": "Write the Rough Draft in compliance with our editorial guidelines",
                "inhouse": false,
                "checkin": false,
                "skills": [
                    "writing"
                ],
                "bounty": 35,
                "pipeline": "unclaimed",
                "status": "incomplete",
                "bStatus": true
            },
            {
                "completion_order": 2,
                "name": "Editing",
                "description": "Edit the content",
                "inhouse": false,
                "checkin": false,
                "skills": [
                    "editing"
                ],
                "bounty": 15,
                "pipeline": "unclaimed",
                "status": "incomplete",
                "bStatus": false
            },
            {
                "completion_order": 3,
                "name": "Beautification",
                "description": "Format and Beautify the Post for Publication",
                "inhouse": false,
                "checkin": false,
                "skills": [
                    "markdown,photoshop,design"
                ],
                "bounty": 10,
                "pipeline": "unclaimed",
                "status": "incomplete",
                "bStatus": false
            }
        ]

			var bountyTemplate = {
				content_type: "Question Post",
				batch: batch,
				dropboxLink: [],
				promptLists: [],
				additional_instruction: '',
				keywords: keywords,
				titles: [],
				process: process,
				bounty: {
			      content_type: "Question Post",
			      short_description: '',
			      suggested_bounty: '$0.00',
			      frequency: frequency,
			      starting_day: starting_date,
			      brand_name: brand_name
			    }
			}

			now = Voca.replaceAll(now, ":", "")
			now = Voca.replaceAll(now, "+", "")

			//console.log(398, moment().subtract((Math.random() * 60) + 1, "day").format("YYYY-MM-DD"))

			var bounty = await this.createBounty(moment().subtract((Math.random() * 60) + 1, "day").format("YYYY-MM-DD"), bountyTemplate, now)
			this.db.mongoCreate(bounty)
			return bounty;
	}

	async verifyBountiesHaveBoxFolders(){
		
	}

	async createBounty(release_for_bounty, bountyTemplate, batch){ //content_type, keywords){


		var brand_name = bountyTemplate.bounty.brand_name;
		//var folderName = `${bountyTemplate.bounty.brand_name} -- ${bountyTemplate.content_type} -- ${release_for_bounty}`
		var folderName = `${bountyTemplate.content_type} -- ${release_for_bounty}`
		var guidelinesFolderName = `Editorial Guidelines - ${bountyTemplate.content_type}`;

		var guidelinesFolderId = await this.box.lookupFolderId(guidelinesFolderName)
		
		var parentFolderId = await this.box.lookupFolderId(brand_name, true);

		var bountyFolderId = await this.box.lookupFolderId(folderName, true);

		// if(bountyFolderId == '0'){
		// 	var folderInfo = this.box.createFolder(folderName, async function(folderInfo, 
		// 	guidelinesFolderId, box, curUser, self){

		// 	box.folders.push({
		// 		folderInfo: folderInfo,
		// 		guidelinesFolderId: guidelinesFolderId,
		// 		batch: batch
		// 	});

		// 		if(box.createFolderCount == box.folders.length){
		// 		// Copy all of the infor from these folders.release_for_bounty
		// 		for(var t = 0; t < box.folders.length; t++){
		// 			var folderInfo = box.folders[t].folderInfo;
		// 			var guidelinesFolderId = box.folders[t].guidelinesFolderId
		// 			try {
		// 				//console.log(376, guidelinesFolderId, folderInfo.id)
		// 				box.copyFolder(guidelinesFolderId, folderInfo.id);
		// 			} catch(err){
		// 				//console.log(379, err);
		// 			}
		// 			var userEmail = curUser.email;
		// 			var brandModel = mongoose.model("Brand");
		// 			var brandDocument = await brandModel.findOne({"brand_name":brand_name}).lean();
					
		// 			var pipeline = 
		// 			[
		// 				{ 
		// 					$match:  
		// 						{ "Keyword": { $in: bountyTemplate.keywords } }

		// 				},
		// 				{ 
		// 					$project: 
		// 						{_id:0,created_by:0,modified_by:0,owner:0,__v:0,"Difficulty":0,"Type":0,"Volume":0,"brand_name":0,"deploy":0} 
		// 				}
		// 			]
		// 			var result = await mongoose.connection.db.collection('keywords')
	 //       					.aggregate(pipeline).toArray();

	 //       			var supplementalInfo = self.documentsToTextFile(result);
	 //       			// We want to write out the optional data points here... 
	 //       			var keys = Object.keys(result);
	 //       			var values = Object.values(result);

		// 			var uploadInstructions = self.getUploadInstructions(brandDocument);
		// 			//var stream = fs.createReadStream('upload_instructions.txt');
		// 			const data = fs.readFileSync('upload_instructions.txt', 
		// 			            {encoding:'utf8', flag:'r'}); 
					  
		// 			// Display the file data 
		// 			var stream = data + supplementalInfo
		// 			try {
		// 				await box.uploadFile(folderInfo.id, "publish_instructions.txt", stream)
		// 			} catch (err){
						
		// 			}
		// 			// This let's the creator of the folders have access to them
		// 			// in their box account.
		// 			await box.createCollaboration(userEmail, folderInfo.id);

		// 			self.bAllFoldersMade = true;
		// 			// We also need to update all of these newly created bounties with
		// 			// their respective bounty
		// 			setTimeout(self.updateBounties, 1500, batch, self, brand_name);

		// 		}
		// 	}
		// }, guidelinesFolderId, this.box, this.user, this, parentFolderId);
		// } else {
		// 	// The folder was already created...
		// 	this.box.copyFolder(guidelinesFolderId,  bountyFolderId);
		// }


		if(bountyTemplate.keywords == null)
			bountyTemplate.keywords =[]
		if(bountyTemplate.titles == null)
			bountyTemplate.titles = [];

		// For  each process, we need to make a time tracker document
		var trackerModel = mongoose.model("Track");
		
		for(var i = 0; i < bountyTemplate.process.length; i++){
			var refDocId = uuidv4()
			bountyTemplate.process[i]['refDocId'] = refDocId
			var msg = { refDocId: refDocId, trackingState: false, timestamps: [] }
      		await trackerModel.update({ refDocId: refDocId },
       		msg, { upsert: true });

		}

		var bounty = {
			"brand_name":bountyTemplate.bounty.brand_name,
			"guidelines_folder":guidelinesFolderName,
			"guidelines_folder_id":guidelinesFolderId,
			"parent_folder":brand_name,
			"parent_folder_id":parentFolderId,
			"release_for_bounty":release_for_bounty,
			"dependent_on":"",
			"queued_content":bountyTemplate.content_type,
			"m_b":0,
			"spend":0,
			"c_b":0,
			"creator":"",
			"creators":[], // { _id, step}
			"content_type":bountyTemplate.content_type,
			"pipeline":"unclaimed",	// unclaimed, in progress, published
			"published":false,
			"keywords":bountyTemplate.keywords,
			"titles":bountyTemplate.titles,
			"prompts":[],
			"stages":[],
			"files":[],
			"process":bountyTemplate.process,
			"batch":batch,
			"title":"",
			"folderId":bountyFolderId
		}
		return bounty;
	}

	async startTrackingBounty(refDocId){
		var trackModel = mongoose.model("Track");
		try {
			var tracker = await trackModel.findOne({"refDocId":refDocId}).lean()
		} catch (err){
			console.log(510, err);
		}
		//console.log(512, tracker)
		if(tracker.timestamps == 0){
			tracker.timestamps.push({
				refDocId: refDocId,
				timestamp: new Date(),
				trackingState: true
			})
			tracker.trackingState = true
    	}
    	//console.log(520, tracker)
    	await trackModel.update(
    		{ refDocId: refDocId },
       		tracker, 
       { upsert: true })

    	return tracker.timestamps[0].timestamp;
	}

	async stopTrackingFirstBountyView(refDocId){
		var trackModel = mongoose.model("Track");
		var tracker = await trackModel.find({"refDocId":refDocId})
		if(tracker.timestamps == 1){
			tracker.timestamps.push({
				refDocId: refDocId,
				timestamp: new Date(),
				trackingState: false
			})
    	}
    	await tracker.save()
    	return tracker.timestamps[1].timestamp;
	}

	getUnclaimedBounties(filters){
		
	}

	getUpcomingBounties(){

	}

	claimBounty(){

	}

	completeBounty(){

	}


	send(){
		// this.res.locals.response = {}
		// this.res.send(this.res.locals.response);
	}

	/*
		This function takes a mongodb aggregation result and transforms it into
		a human readable text document.
	*/
	documentsToTextFile(results){

		var headers = Object.keys(results[0]);
		var txtFile = '';
		var data = []
		for(var i = 0; i < headers.length; i++){
			var header = headers[i];
			
			for(var y = 0; y < results.length; y++){
				var documentKeys = Object.keys(results[y])
				var arr = []
				for(var t = 0; t < documentKeys.length; t++){
					var documentKey = documentKeys[t]
					if(header == documentKey){
						arr.push({
							"key": header,
							"value": results[y][header]
						})
					}
				}
				data.push(arr)
			}
		}
		
		var mergedDocument = {}

		for(var i = 0; i < data.length; i++){
			for(var y = 0; y < data[i].length; y++){
				var obj = data[i][y];
				mergedDocument[obj['key']] = []
			}
		}

		for(var i = 0; i < data.length; i++){
			var arr = [];
			for(var y = 0; y < data[i].length; y++){

					var obj = data[i][y];
					arr.push(obj['value']);
					mergedDocument[obj['key']].push(obj['value'])
			}
		}

		for(var i = 0; i < headers.length; i++){
			mergedDocument[headers[i]] =[... new Set(mergedDocument[headers[i]])]
		}

		for(var i = 0; i < headers.length; i++){
			txtFile += Voca.capitalize(headers[i]) + '\n'
			for(var y = 0; y < headers[i].length; y++){
				txtFile += '='
			}
			txtFile += '\n\n'
			for(var y = 0; y < mergedDocument[headers[i]].length; y++){
				txtFile += mergedDocument[headers[i]][y]
				txtFile += '\n'
			}
			txtFile += '\n\n'
		}

		return txtFile;

	}

	async getUploadInstructions(brandDocument){
		var uploadInstructions = 
`BRAND
=====
${brandDocument.brand_name}


WEBSITE URL
===========
${brandDocument.website_url}


UPLOAD URL
==========
${brandDocument.new_post_url}


NEW POST USERNAME
=================
${brandDocument.new_post_login}


NEW POST PASSWORD
=================
${brandDocument.new_post_pw}


`
				try {
					fs.writeFileSync('upload_instructions.txt', uploadInstructions);
				} catch (err){
					// the file probably already exists
					console.log(349, err);
				}
				var stream = fs.createReadStream('upload_instructions.txt');
			}

	async createParentFolder(brand_name, user, batch){

			var brandsFolderId = await box.lookupFolderIdIfNotExistsCreate("brands", '0')
			var accountFolderId = await box.lookupFolderIdIfNotExistsCreate(this.user.accountId, brandsFolderId)

			console.log(1178, brand_name, accountFolderId)

			var folderId = await box.lookupFolderIdIfNotExistsCreate(brand_name, accountFolderId)

			console.log(1168, brandsFolderId, accountFolderId, folderId);

			const bountyFolderName = `${brand_name} - ${moment().format('DD-MM-YY h_mm_ss A')}`;

			console.log(1172, bountyFolderName)
			
			try {
				//var bountyFolderInfo = await this.box.createFolder(bountyFolderName, null, null, null, null, this, accountFolderId)
			      var bountyFolderInfo = await this.box.client.folders.create(folderId, bountyFolderName);
			} catch(err){
				console.log(954, "Unable to create", folderId, bountyFolderName, err)
				return false;
			}

			try {
				var folderDoc = {
	        		... folderInfo,
	        		... { 'refDocId': 0 }
	        	}
	         await mongoose.connection.db.collection("folders").update({"name":bountyFolderInfo.name, "id":bountyFolderInfo.id}, folderDoc, {upsert:false} );

	        } catch(err){

	        	}

	        return bountyFolderInfo;
	}


	async notifyBountyIsAvailable(bounty_id){

		// Figure out what the next step is
		// Figure out what skills are required for that step
		// Get a list of all the users who have these skills
		// Send them an email

		// Figure out what the next step is

		// Get the bounty document
		var result = await mongoose.connection.db.collection('bounties').findOne({ "_id": mongoose.Types.ObjectId(bounty_id)});

		// Iterate through the "process" array
		var process_step = null;
		var checkin = false, inhouse = false;
		for(var i = 0; i < result.process.length; i++){
			process_step = result.process[i]
			checkin = process_step.checkin
			inhouse = process_step.inhouse
			if(process_step.bStatus == true){
				if(process_step.pipeline == "unclaimed"){
					if(process_step.checkin == false){
						if(process_step.inhouse == false){
							break;
						}
					}
				}
			}
		}
		
		if(process_step == null){
			// No Steps are ready....  figure this out later
			return -1;
		}

		var required_skills = process_step.skills;

		/*
		Tested In Mongo Shell
		db.users.aggregate([
				{ 
					$match: { "skill": { $in: [ "writing", "editing" ] } } 
				},
				{ $project: { _id:0,email:1,skill:1 } }
			])
		*/

		var pipeline = 
			[
				{ 
					$match: { "skill": { $in: [ required_skills ] } } 
				},
				{ $project: { _id:0,email:1 } }
			]

		var eligibleEmails = await mongoose.connection.db.collection('users').aggregate(pipeline).toArray();

		var emails = []
		for(var i = 0; i < eligibleEmails.length; i++){
			var email = eligibleEmails[i].email;
			emails.push(email);
		}

		// By this point we should have a list of emails.  This isn't scalable, but this will work
		// for now.  
		console.log(1065, emails)

		var emailBody = ``;

		try {
	        Communication.sendSupportEmail("admin@contentbounty.com", "A Bounty has become available", emailBody, null, null, emails)
	    } catch(err){
	    	console.log(573, "Unable to send support email")
	    }

	}

	linkBuildingProcess = 
	[
		{
			"step" : "Gather Prospect URL's",
			"stage" : "Link Building",
			"suggested_bounty" : 20,
			"bounty" : 0,
			"display_pos" : 0,
			"skills" : [
				"link_building"
			],
			"types" : [],
		    "files": ["prospect_urls.xlsx"],
			"step_description" : "Build a list of prospect URL's based on the target keyword.  Minimum of 200 prospect URL's",
			"editorial_guidelines" : [ ]
		},
		{
			"step" : "Gather Prospect Emails",
			"stage" : "Link Building",
			"suggested_bounty" : 20,
			"bounty" : 0,
			"display_pos" : 0,
		    "checklist":[
		        {
		            "label":"Scrub the list against previously used prospects",
		            "task":"scrub_list"
		        },
		        {
		            "label":"Upload List",
		            "task":"Upload the list into Content Bounty and associate it with a piece of content or bounty"
		        }
		    ],
			"skills" : ["link_building" ],  
		    "files": ["prospect_emails.xlsx"],
			"types" : [],
			"step_description" : "Upload the list into Content Bounty and associate it with the correct Bounty",
			"editorial_guidelines" : [ ]
		},
		{
			"step" : "Build Email Template Spreadsheet",
			"stage" : "Link Building",
			"suggested_bounty" : 20,
			"bounty" : 0,
			"display_pos" : 0,
		    "checklist":[],
			"skills" : ["link_building" ],  
		    "files": ["prospect_templates.xlsx"],
			"types" : [],
			"step_description" : "Write original outreach templates based on customized factors",
			"editorial_guidelines" : [ ]
		},
		{
			"step" : "Build Email Templates",
			"stage" : "Link Building",
			"suggested_bounty" : 20,
			"bounty" : 0,
			"display_pos" : 0,
		    "checklist":[],
			"skills" : ["link_building" ],  
		    "files": ["prospect_templates.docx"],
			"types" : [],
			"step_description" : "Write original outreach templates based on ",
			"editorial_guidelines" : [ ]
		}
	]

	createLinkBuildingBounties(bounty_id){
		
	}

	/*  This creates a single, individual bounty -- available immediately -- with all steps
		turned on by default.

		This is going to be useful for bouties that require things to be done that don't fit 
		neatly into writing new content.

		var trackerModel = mongoose.model("Track");
		
		// 		const bulkData = movers.movers.map(item => (
		//     {
		//         replaceOne: {
		//             upsert: true,
		//             filter: {
		//                 "key.symbol" : item.key.symbol
		//             },
		//             replacement: item
		//         }
		//     }
		// ));
		// this.losers.bulkWrite(bulkData);

		var updates = [];

		var Process = bountyTemplate.process
		// This can be done as an insert many...
		for(var i = 0; i < Process.length; i++){
			var refDocId = uuidv4()
			Process[i]['refDocId'] = refDocId
			var msg = { refDocId: refDocId, trackingState: false, timestamps: [] }
      		trackerModel.update({ refDocId: refDocId },
       		msg, { upsert: true });

      		updates.push({
      			"updateOne": {
      			upsert: true,
      			filter: { refDocId: refDocId },
      			replacement: msg
      			}
      		})
		}

	*/

	async createSingleUseBounty(content_type, brand_name, suppliedProcess =null, brand_id =null){

		var adminModel = mongoose.model("User");
		var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});

		var box = new Box(adminUser)
		this.box = box;

		var trackerModel = mongoose.model("Track");

		var content_type_process = await mongoose.connection.db
        .collection("steps")
        .find({"content_type":content_type}, {projection: {_id:0,__v:0,created_by:0,owner:0,modified_by:0}}).toArray();

        console.log(1410, content_type_process)

		var bounty_process = await mongoose.connection.db
        .collection("processes")
        .find({"content_type":content_type}, {projection: {_id:0,__v:0,created_by:0,owner:0,modified_by:0}}).toArray();

        console.log(1416, bounty_process)

        for(var i = 0; i < content_type_process.length; i++){
        	content_type_process[i]["pipeline"] = "unclaimed"
        	content_type_process[i]["completion_order"] = i+1;
        	content_type_process[i]["status"] = "incomplete";
        	content_type_process[i]["checkin"] = false;
        	content_type_process[i]["description"] = content_type_process[i]["step_description"]
        	delete content_type_process[i]["step_description"]
        	if(i == 0){
        		content_type_process[i]["bStatus"] = true;
        	}
        		else {
        			content_type_process[i]["bStatus"] = false;
        		}
        	content_type_process[i]["refDocId"] = uuidv4();
        	var msg = { refDocId: content_type_process[i]["refDocId"], trackingState: false, timestamps: [] }
        	await trackerModel.update({ refDocId: content_type_process[i]["refDocId"] },
       			msg, { upsert: true });
        }

        if(suppliedProcess != null){

        	for(var procStep of suppliedProcess){
        		procStep["refDocId"] = uuidv4();	
        		var msg = { refDocId: procStep["refDocId"], trackingState: false, timestamps: [] }
        		await trackerModel.update({ refDocId: procStep["refDocId"] },
       				msg, { upsert: true });
        	}
        	        	console.log(1507, suppliedProcess)
        	console.log(1508, content_type_process)
        	content_type_process = suppliedProcess
        }
        
        var bountyTemplate = Object.assign(BountyTemplate);
        bountyTemplate["content_type"] = content_type;
        bountyTemplate["queued_content"] = content_type;
        bountyTemplate["batch"] = uuidv4();
        bountyTemplate["process"] = content_type_process
        bountyTemplate["pipeline"] = "unclaimed"
        bountyTemplate["description"]

        console.log(1441, bountyTemplate)

        var user = this.user;
        var batch = bountyTemplate["batch"]
		//console.log(228, util.inspect(bountyTemplate, false, null, true /* enable colors */));

		var guidelinesFolderName = `templates-${brand_name}`;
		// This can be made MUCH more effecient!!!

		var brandsFolderId = await box.lookupFolderIdIfNotExistsCreate("brands",  '0')
		if(brandsFolderId == false){
			return false;
		}
		var accountFolderId = await box.lookupFolderIdIfNotExistsCreate(this.user.accountId, brandsFolderId);
		if(accountFolderId == false){
			return false;
		}

		var brandFolderId = await box.lookupFolderIdIfNotExistsCreate(brand_name, accountFolderId);

		console.log(1437, brandFolderId);

		var guidelinesFolderName = `templates-${brand_name}`;

		// This function guarantees that a folder has been created for our bounties
		//console.log(1444, brand_name, user, batch);

		var parentFolderInfo = await this.createParentFolder(brand_name, user, batch);

			//console.log(1446, parentFolderInfo);

		var parentFolderId = parentFolderInfo.id;

		var guidelinesFolderId = await this.box.lookupFolderId(guidelinesFolderName, false, brandFolderId)

		    let now = moment();
        	var nextBounty = now.subtract(1, 'days').format();
			var tPos = Voca.indexOf(nextBounty, 'T');
			var simplifiedBountyDate = Voca.substring(nextBounty, 0, tPos);

		// This can be made MUCH more effecient!!!
		var brandsFolderId = await this.box.lookupFolderId("brands")
		var accountFolderId = await this.box.lookupFolderId(this.user.accountId, false, brandsFolderId)
		var brandFolderId = await this.box.lookupFolderId(brand_name, false, accountFolderId)
		var guidelinesFolderId = await this.box.lookupFolderId(guidelinesFolderName, false, brandFolderId)

		bountyTemplate["bounty"]["content_type"] = content_type;
		bountyTemplate["bounty"]["starting_day"] =  simplifiedBountyDate;
		bountyTemplate["bounty"]["brand_name"] = brand_name;
		bountyTemplate["release_for_bounty"] = simplifiedBountyDate;
		bountyTemplate["brand_name"] = brand_name;
        bountyTemplate["guidelines_folder"] = guidelinesFolderName
        bountyTemplate["guidelines_folder_id"] = guidelinesFolderId
        bountyTemplate["parent_folder"] = parentFolderInfo.name
        bountyTemplate["parent_folder_id"] = parentFolderId
        bountyTemplate["folderId"] = -1
        bountyTemplate["bountyFolderId"] = 0
        bountyTemplate["bountyFolderSharedLink"] = 0
        bountyTemplate["templateFolderId"] = ""
        bountyTemplate["templateFolderSharedLink"] = "";

        console.log("bounties.js", 1588, brand_id);

        if(brand_id != null){
        	bountyTemplate["brand_id"] = mongoose.Types.ObjectId(brand_id)
    	}
        
		var res = await this.db.mongoCreate(bountyTemplate)

		return res;

		//console.log(1502, util.inspect(res, false, null, true /* enable colors */));
			//var bounty = await this.createBounty(simplifiedBountyDate, bountyTemplate, batch)

		//console.log(1462, res)
	}

	getFrequency(frequency){
		var dayMultiplier = 30;
		switch(frequency){
				case '2xDay':
					dayMultiplier = 0.5;
					break;
				case '3xDay':
					dayMultiplier = 0.3;
					break;
				case '4xDay':
					dayMultiplier = 0.25;
					break;
				case 'daily':
					dayMultiplier = 1;
					break;

			    case '2xWeek':
			    	dayMultiplier = 2;
			    	break;

			    case '3xWeek':
			    	dayMultiplier = 3;
			    	break;

			    case '4xWeek':
			    	dayMultiplier = 4;
			    	break;

			    case '5xWeek':
			    	dayMultiplier = 5;
			    	break;

			    case '6xWeek':
			    	dayMultiplier = 6;
			    	break;

			    case '1xWeek':
			    	dayMultiplier = 7;
			    	break;

			    case '2xMonth':
			    	dayMultiplier = 14;
			    	break;

			    case '1xMonth':
			    	dayMultiplier = 30;
			    	break;
		}	

		return dayMultiplier;	
	}

	async initBox(user){
		this.user = user;
		var adminModel = mongoose.model("User");
		var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});
		var box = new Box(adminUser)
		this.box = box;
	}

	async getBrandId(brand_name){
		//console.log(1565, brand_name)
		var brand_id = await mongoose.connection.db
        .collection("brands")
        .findOne({"brand_name":brand_name, owner: this.user.accountId}, {_id:1,created_by:1,owner:1,modified_by:1});

        return brand_id._id;		
	}

	async getSelectedKeywords(brand_id){
		
		var keywordsModel = mongoose.model("Keywords");
		var searchObj = {
			"brand_id":mongoose.Types.ObjectId(brand_id),
			"bKeywordDeployed": {"$eq": true },
			"linkcampaign_id": { "$exists": false },
			"selected": true
		}		

		var keywords = await keywordsModel.find(searchObj).lean();

		return keywords;
	}

	async getSelectedPages(brand_id){
		
		var bountiesModel = mongoose.model("Bounty");
		var searchObj = {
			"brand_id":mongoose.Types.ObjectId(brand_id),
			"published_link": { "$exists": true },
			"linkcampaign_id": { "$exists": false },
			"selected": true
		}		

		var bounties = await bountiesModel.find(searchObj, { process:0 }).lean();

		return bounties;
	}

	async getSelectedEmails(brand_id, bounty_id){
		
		var searchObj = {
			"brand_id":mongoose.Types.ObjectId(brand_id),
			"bounty_id":mongoose.Types.ObjectId(bounty_id),
			"Email": { "$exists": true },
			"selected": true
		}		

		console.log(1597, searchObj);

		var emails = await  mongoose.connection.db
        	.collection("outreach_emails")
        	.find(searchObj).toArray();

		return emails;
	}

	async getBountiesAr(titles, content_type, bounty_process, batch, brand_name, brand_id, frequency, dayMultiplier, starting_date,
		brandsFolderId, parentFolderId, brandFolderId, guidelinesFolderId, guidelinesFolderName, parentFolderInfo
		){

		var bountiesAr = [];

		//var bounty_process = _Process		
		for(var i = 0; i < titles.length; i++){

			var content_type = content_type;

			var tmpProcess = [ ... bounty_process ]
			tmpProcess[0].testint = this.testint;
			this.testint++;

			var promptsAr = [];
			var titlesAr = [];

			if(typeof titles[i].Prompt != 'undefined'){
				if(Array.isArray(titles[i].Prompt))
					promptsAr = titles[i].Prompt
				else
					promptsAr.push(titles[i].Prompt)
			}

			if(typeof titles[i].Title != 'undefined'){
				if(Array.isArray(titles[i].Title))
					titlesAr = titles[i].Title
				else 
					titlesAr.push(titles[i].Title)
			}

			var bountyTemplate = Object.assign({
				batch: batch,
				dropboxLink: [],
				promptLists: [],
				additional_instruction: '',
				keywords: titles[i].keywords,
				titles: titlesAr,
				prompts: promptsAr,
				//titles: [titles[i]],
				content_type: content_type,
				content_queue: content_type,
				brand_id: brand_id._id,
				process: bounty_process,
				bounty: {
			      content_type: content_type,
			      short_description: '',
			      suggested_bounty: '$0.00',
			      frequency: frequency,
			      starting_day: starting_date,
			      brand_name: brand_name,
			      brand_id:brand_id
			    }
			})

			let now = moment(starting_date);
			
			bountyTemplate["keywords_ids"] = [ titles[i]._id ]

			if(process.env.DEV_ENVIRONMENT == "true")
				now.subtract(30, 'days');

			var nextBounty = now.add(i*dayMultiplier, 'days').format();

			var tPos = Voca.indexOf(nextBounty, 'T');
			var simplifiedBountyDate = Voca.substring(nextBounty, 0, tPos);

			var bounty = { "process" : [ ... bountyTemplate.process ] }

			console.log(1794, parentFolderInfo);

			console.log(
				simplifiedBountyDate, bountyTemplate, batch, brandsFolderId, parentFolderId, brandFolderId, guidelinesFolderId, guidelinesFolderName, parentFolderInfo.name, brand_id)

			var bounty = this.createBountyByKeyword(
				simplifiedBountyDate, bountyTemplate, batch, brandsFolderId, parentFolderId, brandFolderId, guidelinesFolderId, guidelinesFolderName, parentFolderInfo.name, brand_id)
			
			bountiesAr.push(JSON.parse(JSON.stringify(bounty)))
		}
		for(var i = 0; i < bountiesAr.length; i++){
			bountiesAr[i].brand_id = mongoose.Types.ObjectId(bountiesAr[i].brand_id)
		}
		return bountiesAr;
	}

	async insertBountiesIntoDatabase(bountiesAr, brand_id, batch){

		console.log(1688, bountiesAr, brand_id, batch);

		var keywordsModel = mongoose.model("Keyword")

		var bountyModel = await this.db.mongoCreateMany(bountiesAr);

		var searchObj = {
			"brand_id":brand_id,
			"bKeywordDeployed": {"$eq": true },
			"bLinkCampaign": { "$exists": false },
			"selected":true/*,
			"published_link": { "$exists": true }*/
		}
	
		var bountiesIds = await this.db.model.find({ "batch" : batch}, {_id:1, brand_id:1, keywords:1 }).lean()

		var result = await keywordsModel.updateMany(searchObj, { "bLinkCampaign": true, selected: false });

		const bulkData = bountiesIds.map(bounty => (
		    {
		        updateOne: {
		            filter: {
		                "brand_id" : mongoose.Types.ObjectId(bounty.brand_id),
		                "Keyword": bounty.keywords[0]
		            },
		            update: { $set: {"linkcampaign_id": mongoose.Types.ObjectId(bounty._id)} }
		        }
		    }
		));

		console.log(1716, bulkData);
		
		var bulkWriteResults = await keywordsModel.bulkWrite(bulkData);

		console.log(1719, bulkWriteResults)

	}

	_Process; bounties; batch; brand_id; keywords; dayMultiplier; 
	guidelinesFolderName; brandsFolderId; accountFolderId; brandFolderId; parentFolderInfo; parentFolderId;
	guidlinesFolderId;

	async initBountyVariables(user, brand_name, frequency, starting_date, process, content_type){
		await this.initBox(user)
		this._Process = [ ... process ]
		this.user = user;
		this.brand_name = brand_name;
		this.frequency = frequency;
		this.starting_date = starting_date;
		this.content_type = content_type;
		this.bounties = [];
		this.batch = uuidv4();
		this.brand_id = await this.getBrandId(brand_name);
		this.keywords = await this.getSelectedKeywords(this.brand_id)
		this.pages = await this.getSelectedPages(this.brand_id)
		this.dayMultiplier = this.getFrequency(this.frequency)
		this.guidelinesFolderName = `templates-${this.brand_name}`;
		this.brandsFolderId = await box.lookupFolderIdIfNotExistsCreate("brands",  '0')

 		if(this.brandsFolderId == false){
			return false;
		}

		this.accountFolderId = await box.lookupFolderIdIfNotExistsCreate(this.user.accountId, this.brandsFolderId);

		if(this.accountFolderId == false){
			return false;
		}

		this.brandFolderId = await box.lookupFolderIdIfNotExistsCreate(this.brand_name, this.accountFolderId);

		this.parentFolderInfo = await this.createParentFolder(this.brand_name, this.user, this.batch);
		this.parentFolderId = this.parentFolderInfo.id;
		this.guidelinesFolderId = await this.box.lookupFolderId(this.guidelinesFolderName, false, this.brandFolderId)

	}

	async createLinkCampaignFromSelectedKeywords(user, brand_name, frequency, starting_date, process, content_type){


		await this.initBountyVariables(user, brand_name, frequency, starting_date, process, content_type)

		var bountiesAr = await this.getBountiesAr(this.keywords, this.content_type, this._Process, this.batch, this.brand_name, this.brand_id, 
			this.frequency, this.dayMultiplier, this.starting_date,
			this.brandsFolderId, this.parentFolderId, this.brandFolderId, this.guidelinesFolderId, this.guidelinesFolderName, this.parentFolderInfo);

		console.log(1725, util.inspect(bountiesAr, false, null, true /* enable colors */));
		await this.insertBountiesIntoDatabase(bountiesAr, this.brand_id, this.batch)

	}

	async createLinkCampaignFromSelectedPages(user, brand_name, frequency, starting_date, process, content_type){

		console.log(1899, brand_name, frequency, starting_date, process, content_type)

		try {
		await this.initBountyVariables(user, brand_name, frequency, starting_date, process, content_type)
		} catch(err){
			console.log(1908, err);
		}
		try {
		var bountiesAr = await this.getBountiesAr(this.pages, this.content_type, this._Process, this.batch, this.brand_name, this.brand_id, 
			this.frequency, this.dayMultiplier, this.starting_date,
			this.brandsFolderId, this.parentFolderId, this.brandFolderId, this.guidelinesFolderId, this.guidelinesFolderName, this.parentFolderInfo);
	} catch(err){
		console.log(1906, err);
	}

		console.log(1725, util.inspect(bountiesAr, false, null, true /* enable colors */));
		await this.insertBountiesIntoDatabase(bountiesAr, this.brand_id, this.batch)

	}

	async createSniperBountiesFromSelectedEmails(user, brand_id, bounty_id){

		console.log(1774, brand_id, bounty_id);

		//await this.initBountyVariables(user, brand_name, frequency, starting_date, process, content_type)
		var outreach_emails = await this.getSelectedEmails(brand_id, bounty_id)

		console.log(1773, outreach_emails);

		// var bountiesAr = await this.getBountiesAr(this.keywords, this.content_type, this._Process, this.batch, this.brand_name, this.brand_id, 
		// 	this.frequency, this.dayMultiplier, this.starting_date,
		// 	this.brandsFolderId, this.parentFolderId, this.brandFolderId, this.guidelinesFolderId, this.guidelinesFolderName, this.parentFolderInfo);

		// await this.insertBountiesIntoDatabase(bountiesAr, this.brand_id, this.batch)

	}

	async searchForBountyIfNotExistsCreateWithLink(brand_id, link, keyword){
		var bounty = await mongoose.connection.db
	        .collection("bounties")
	        .findOne({"published_link":link, "brand_id":mongoose.Types.ObjectId(brand_id) });

	    var bounty_id = "";

	    console.log(1814, bounty, brand_id, link, keyword);

	    var linkBounty = null;

	   	if(bounty == null){
	   		var linkBounty = {
	   			"keywords": [ keyword ],
	   			"content_type":"Link Building Upload",
	   			"brand_id": mongoose.Types.ObjectId(brand_id),
	   			"published_link": link,
	   			"visible":false
	   		}
	   		var createResult = await this.db.mongoCreate(linkBounty);
	   		console.log(182, createResult);
	   		bounty_id = createResult._id;

	   	} else {
	   		bounty_id = bounty._id;
	   		// The link is found...let's push the keyword into the keywords array
			await mongoose.connection.db
				    .collection("bounties")
				    .updateOne({ _id: bounty._id }, { $push: { "keywords": keyword } } );	   		
	   	}

	    return bounty_id;
	}

	// This function will search for a templates folder elsewhere when it does
	// not exist where we expect it to.
	async repairBrokenTemplatesFolder(folderName){

	}

	async createOneOffBounty(process, content_type, brand_name, date, keyword, body){

		//
		console.log(1917, process, content_type, brand_name, date, keyword, body)
		//return false;

		var adminModel = mongoose.model("User");
		var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});

		var box = new Box(adminUser)
		this.box = box;

		var trackerModel = mongoose.model("Track");

        for(var i = 0; i < process.length; i++){
        	
        	process[i]["refDocId"] = uuidv4();
        	if(process[i].inhouse.length == 24){
        		process[i].inhouse = mongoose.Types.ObjectId(process[i].inhouse)	
        	}
        	
        	if(process[i].checkin.length == 24){
        		process[i].checkin = mongoose.Types.ObjectId(process[i].checkin)	
        	}

        	var msg = { refDocId: process[i]["refDocId"], trackingState: false, timestamps: [] }

        	await trackerModel.update({ refDocId: process[i]["refDocId"] },
       			msg, { upsert: true });
        }
        
        var bountyTemplate = { };
        
        bountyTemplate["queued_content"] = content_type;
        bountyTemplate["batch"] = uuidv4();
        bountyTemplate["process"] = process
        bountyTemplate["pipeline"] = "unclaimed"
        //bountyTemplate["description"]
        bountyTemplate["spend"] = 0;
        
        bountyTemplate["prompts"] = [body.prompt]
        bountyTemplate["titles"] = [body.title]

        console.log(1441, bountyTemplate)

        var user = this.user;
        var batch = bountyTemplate["batch"]

		var guidelinesFolderName = `templates-${brand_name}`;

		var brandsFolderId = await box.lookupFolderIdIfNotExistsCreate("brands",  '0')

		if(brandsFolderId == false){
			console.log(1926, brandsFolderId)
			return false;
		}

		var accountFolderId = await box.lookupFolderIdIfNotExistsCreate(this.user.accountId, brandsFolderId);
		if(accountFolderId == false){
			console.log(1931, baccountFolderId)
			return false;
		}

		var brandFolderId = await box.lookupFolderIdIfNotExistsCreate(brand_name, accountFolderId);

		var guidelinesFolderName = `templates-${brand_name}`;

		var parentFolderInfo = await this.createParentFolder(brand_name, user, batch);

		var parentFolderId = parentFolderInfo.id;

		console.log(1953, guidelinesFolderName, brandFolderId)

		var guidelinesFolderId = await this.box.lookupFolderId(guidelinesFolderName, false, brandFolderId)

		console.log(1957, guidelinesFolderId, brandFolderId)

		    let now = moment();
			var simplifiedBountyDate = now.format();

		// This can be made MUCH more effecient!!!
		var brandsFolderId = await this.box.lookupFolderId("brands")
		var accountFolderId = await this.box.lookupFolderId(this.user.accountId, false, brandsFolderId)
		//var brandFolderId = await this.box.lookupFolderId(brand_name, false, accountFolderId)
		//var guidelinesFolderId = await this.box.lookupFolderId(guidelinesFolderName, false, brandFolderId)

		console.log(1937, guidelinesFolderName, guidelinesFolderId);

		var brand_id = await mongoose.connection.db
        .collection("brands")
        .findOne({"brand_name":brand_name}, {_id:1,created_by:1,owner:1,modified_by:1});

		//bountyTemplate["bounty"]["content_type"] = content_type;
		//bountyTemplate["bounty"]["starting_day"] =  simplifiedBountyDate;
		//bountyTemplate["bounty"]["brand_name"] = brand_name;
		console.log(1944, date);

		bountyTemplate["release_for_bounty"] = moment(date).format();
		bountyTemplate["brand_name"] = brand_name;
		bountyTemplate["brand_id"] = brand_id._id;
        bountyTemplate["guidelines_folder"] = guidelinesFolderName
        bountyTemplate["guidelines_folder_id"] = guidelinesFolderId
        bountyTemplate["parent_folder"] = parentFolderInfo.name
        bountyTemplate["parent_folder_id"] = parentFolderId
        bountyTemplate["folderId"] = -1
        bountyTemplate["keywords"] = [keyword]
        bountyTemplate["bountyFolderId"] = 0
        bountyTemplate["bountyFolderSharedLink"] = 0
        bountyTemplate["templateFolderId"] = ""
        bountyTemplate["content_type"] = content_type
        bountyTemplate["templateFolderSharedLink"] = ""

        var res = await this.db.mongoCreate(bountyTemplate)
        console.log(1964, res);
        return res;
        //console.log(1962, util.inspect(res, false, null, true /* enable colors */));
		//console.log(1963, util.inspect(bountyTemplate, false, null, true /* enable colors */));

	}
}

