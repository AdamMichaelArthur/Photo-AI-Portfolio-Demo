
/*
	Created Sat Oct 3 2020
	by Adam Arthur

	The purpose of this file is to automatically notify the client of a currently
	logged in user to any 'notification' events

	We support two kinds of notifications: a progress bar for long-running tasks on the server,
	and notifications

*/

require("./base.js");
var mongoose = require( 'mongoose');
const util = require("util");
var fs = require('fs');
var box; 
var adminModel = mongoose.model("User");
const Schema = mongoose.Schema;

var notificationSchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	bStatus: Boolean
}, { strict: false });

var model = mongoose.model("Notification");

var stack = [];

adminModel.watch({"email":"admin@contentbounty.com"}, {"integrations.box.tokenStore":1}).on('change', data => {
	if(data.operationType == 'update'){
		if(typeof data.updateDescription.updatedFields["integrations.box.tokenStore"]	 != 'undefined'){
		adminModel.findOne({"email":"admin@contentbounty.com"},function(err, model){
			if(err == null){
				// delete the old box for managing memory?
				model.integrations.tokenStore = data.updateDescription.updatedFields["integrations.box.tokenStore"]

				//console.log(58, "watch_bounties.js",util.inspect(data, false, null, true /* enable colors */))
				console.log(52, "watch_bounties.js","Updating the admin model!", model.integrations.box.tokenStore)
				//box = new Box(model, true)
				//log(75, "Process Exiting");
				//process.exit(0)
			}
		});
	}
	}	
});

model.watch().on('change', async data =>
	  {

		stack.push(async function(){

		  	var bounty = data.fullDocument;

		  	if(data.operationType == 'delete'){
		  		// Delete a folder in box
		  		var deleteBounty = data.documentKey._id;
		  		//console.log(59, deleteBounty)
		  		var query = { refDocId: mongoose.Types.ObjectId(deleteBounty) }
		  		//console.log(60, query);
		  		mongoose.connection.db.collection('folders').findOne(query, async function(err, model){
		  			//console.log(62, err, model);
		  			if(model != null){
		  			var folderId  = model.id;
		  			var refDocId = model.refDocId
		  			await box.deleteFolder(folderId);
		  			await mongoose.connection.db.collection('folders').deleteOne({refDocId: mongoose.Types.ObjectId(refDocId)}, function(err,  doc){
		  			var releaseKeywordsQuery = { bounty: mongoose.Types.ObjectId(refDocId) }
		  			var releaseKeywordsUpdate = { $set: { bKeywordDeployed: false, batch: null, bounty_id: null } }
		  			console.log(69, "watch_bounties.js",releaseKeywordsQuery, releaseKeywordsUpdate)
		  			mongoose.connection.db.collection('keywords').updateMany(releaseKeywordsQuery, releaseKeywordsUpdate, { multi:true })
		  			
		  			})
		  			}
		  			console.log(68, "watch_bounties.js","folder  doc removed");
		  		});
		  	}

		  	if(data.operationType == 'insert'){
		  		var folderName = `${bounty.content_type} - ${bounty.release_for_bounty}`
		  		console.log(87, "watch_bounties.js","Start createFolder", folderName, bounty.parent_folder_id,bounty._id)
		  		var folderId = await box.createFolder(folderName, null,           null, null,      null,          null, bounty.parent_folder_id, bounty._id);
		  		
		  		if(typeof folderId.id == 'undefined'){
		  			folderId = { id: folderId }
		  		}

		  		await copyGuidelines(folderId.id, bounty)
		  		await uploadInstructions(bounty.brand_name, bounty.keywords, folderId.id)	
				await createCollaboration(bounty.created_by, folderId.id)
		  		return;	
			}
		})

		if(stack.length == 1){

			async function execStack(){
				if(stack.length > 0){
					await stack[0]()
					stack.shift()
				}
				if(stack.length > 0)
					setTimeout(execStack, 250)
				else 
					console.log(125, "watch_bounties.js", "All done - no more")
			}

			setTimeout(execStack, 250)
		}

	  })