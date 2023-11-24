
/*
	Created Mon June 1 2020
	by Adam Arthur

	The purpose of this file is to automatically manage the creation of Box folders
	There is a 1-1 relationship between a bounty document and a box folder -- every
	bounty will have one box folder.  This file watches the database for changes
	to the bounty collecion and syncronizes the creation and deletion of Box folders
	accordingly

*/

var Box = require('@classes/integrations/box/box.js');
var mongoose = require( 'mongoose');
var Bounties = require('./bounties.js')
const util = require("util");
var fs = require('fs');
var box; 
var adminModel = mongoose.model("User");

var path = require('path');
var filename = path.basename(__filename);

function log(lineNum, msg, json ={}){
  var d = new Date();
  var n = d.toString();
    fs.appendFileSync('logs.txt', n + " " + filename + " - " + "line: " + lineNum + " - " + msg + " - " + JSON.stringify(json) + '\n')   
    //console.log(lineNum, "watch_admin", msg);
    //console.log(lineNum, msg, util.inspect(json, false, null, true /* enable colors */))
  }

adminModel.findOne({"email":"admin@contentbounty.com"},function(err, model){
	if(err == null){
		//log(43, "watch_admin.js","creating new token store")
		delete box;

		box = new Box(model, true)
	} else {
		console.log(26, "watch_admin.js",err);
	}
});

//console.log(43,"watch_admin.js","Initializing MongoDB Watch");

const pipeline = [
        {
          '$match': {
            '$or': [{ 'operationType': 'insert' },{ 'operationType': 'update' }],
            'documentKey': { _id: mongoose.Types.ObjectId(process.env.ADMIN_MODEL_DOC_ID) }
          }
        }
];

adminModel.watch(pipeline).on('change', data => {
	if(data.operationType == 'update'){
		if(typeof data.updateDescription.updatedFields["integrations.box.tokenStore"]	 != 'undefined'){
		adminModel.findOne({"email":"admin@contentbounty.com"},function(err, model){
			if(err == null){
				log(49, "watch_adminjs integrations.box.tokenStore changed", model)
				// delete the old box for managing memory?
				model.integrations.tokenStore = data.updateDescription.updatedFields["integrations.box.tokenStore"]

				log(53, "watch_admin.js",util.inspect(data, false, null, true /* enable colors */))
				log(54, "watch_admin.js","Updating the admin model!", model.integrations.box.tokenStore)
				box = new Box(model, true)
			}
		});
	}
	}	
});
