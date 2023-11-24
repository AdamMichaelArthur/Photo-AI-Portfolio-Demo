
/*
	Created Mon June 1 2020
	by Adam Arthur

	The purpose of this file is to automatically manage the creation of Box folders
	There is a 1-1 relationship between a bounty document and a box folder -- every
	bounty will have one box folder.  This file watches the database for changes
	to the bounty collecion and syncronizes the creation and deletion of Box folders
	accordingly

*/
require("./base.js");
var Box = require('@classes/integrations/box/box.js');
var mongoose = require( 'mongoose');
var Bounties = require('./bounties.js')
const util = require("util");
var fs = require('fs');
var box; 
var adminModel = mongoose.model("User");
var Communication = require("@classes/communication.js");
var moment = require('moment');
var path = require('path');
var filename = path.basename(__filename);
var voca = require("voca");

function log(lineNum, msg, json ={}){
  var d = new Date();
  var n = d.toString();
    fs.appendFileSync('logs.txt', n + " " + filename + " - " + "line: " + lineNum + " - " + msg + " - " + JSON.stringify(json) + '\n')   
    console.log(lineNum, msg, util.inspect(json, false, null, true /* enable colors */))

  }

adminModel.findOne({"email":"admin@contentbounty.com"},function(err, model){
	if(err == null){
		delete box;
		box = new Box(model, true)
	} else {
		console.log(26, "watch_bounties.js",err);
	}
});

const Schema = mongoose.Schema;

var bountySchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	bStatus: Boolean
}, { strict: false });

var bRunOnce = false;

var model = mongoose.model("Bounty");

var stack = [];

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
		if(typeof data.updateDescription.updatedFields["integrations.box.tokenStore"] != 'undefined'){
		adminModel.findOne({"email":"admin@contentbounty.com"},function(err, model){
			if(err == null){
				log(64, "watch_bounties.js integrations.box.tokenStore changed", model)
				// delete the old box for managing memory?

				model.integrations.tokenStore = data.updateDescription.updatedFields["integrations.box.tokenStore"]

				log(58, "watch_bounties.js",util.inspect(data, false, null, true /* enable colors */))
				log(52, "watch_bounties.js","Updating the admin model!", model.integrations.box.tokenStore)

				box = new Box(model, true)

				// this is a hack to try and track down what the problem is.problem
				var sendData = ""
				try {
					sendData = JSON.stringify(data)
				} catch(err){
					console.log(92, "Unable to stringify json data")
				}
				
			}
		});
	}
	}	
});

var duplicates = 1;

model.watch().on('change', async data =>
	  {

		stack.push(async function(){

		  	var bounty = data.fullDocument;

		  	console.log(108, bounty);
		  	if(typeof bounty == 'undefined'){
		  		console.log(110, data);

		  	}
		  	
		  	if(data.operationType == 'delete'){
		  		// Delete a folder in box
		  		var deleteBounty = data.documentKey._id;
		  		//console.log(59, deleteBounty)
		  		var query = { bounty_id: mongoose.Types.ObjectId(deleteBounty) }
		  		//console.log(60, query);
		  		mongoose.connection.db.collection('folders').findOne(query, async function(err, model){
                                        console.log(121, model);
                                        var folder_id = model["id"];
                                        await box.deleteFolder(folder_id);
                                        deleteFolderIfEmpty(model["parent"]["id"]);
		  		});
		  			//console.log(62, err, model);
		  		//	if(model != null){
		  		//	var folderId  = model.id;
		  		//	var refDocId = model.refDocId
		  			//await box.deleteFolder(bounty.bountyFolderId);

		  		//	await mongoose.connection.db.collection('folders').deleteOne({refDocId: mongoose.Types.ObjectId(refDocId)}, function(err,  doc){
		  			var releaseKeywordsQuery = { bounty_id: mongoose.Types.ObjectId(deleteBounty) }
		  			var releaseKeywordsUpdate = { $set: { bKeywordDeployed: false, batch: null, bounty_id: null } }
		  			console.log(69, "watch_bounties.js",releaseKeywordsQuery, releaseKeywordsUpdate)
		  			mongoose.connection.db.collection('keywords').updateMany(releaseKeywordsQuery, releaseKeywordsUpdate, { multi:true })
		  			
		  		//	})
		  		//	}
		  			console.log(68, "watch_bounties.js","folder  doc removed");
		  		//});
		  	}

		  	
		  	if(data.operationType == 'insert'){
		  		var folderName = `${bounty.content_type} - ${bounty.release_for_bounty}`

		  		async function createFolderCallback(folderName, parent_folder_id, bounty_id, brand_name, keywords, created_by){
		  			console.log(143, folderName, parent_folder_id, bounty_id, brand_name, keywords, created_by)
		  			var folderId = true;
		  			try {
		  				var  folderId = await box.createFolderFromWatchBounties(folderName, parent_folder_id, bounty_id)
		  				await createFolderLocally(folderName, parent_folder_id, bounty_id, folderId, bounty.brand_id, bounty.brand_name, bounty.owner)
		  			} catch(err){
		  				console.log(136, err);
		  				return;
		  			}

		  			if(folderId == false){
		  				folderName = folderName + "." + String(duplicates);
		  				console.log(148, folderName, parent_folder_id, bounty_id)
		  				folderId = await box.createFolderFromWatchBounties(folderName, parent_folder_id, bounty_id)
		  				createFolderLocally(folderName, parent_folder_id, bounty_id, folderId, bounty.brand_id, bounty.brand_name, bounty.owner)
		  				duplicates++;
		  			}

		  			if(folderId != false){
		  				console.log(154, "create folder worked")
		  			} else {
		  				console.log(156, "create folder failed")
		  				return;
		  			}

		  			console.log(160, folderId.id, bounty);
		  			
		  			var copyResult = await copyGuidelines(folderId.id, bounty)

		  			await copyGuidelinesLocal(folderName, parent_folder_id, bounty_id, brand_name, keywords, created_by, bounty)

		  			await uploadInstructions(bounty.brand_name, bounty.keywords, folderId.id, bounty);
		  		}

		  		console.log(165, bounty.parent_folder_id)
		  		await createFolderCallback(folderName, bounty.parent_folder_id, bounty._id, bounty.brand_name, bounty.keywords, bounty.created_by)

		  		/*	4/24/22
		  		 *
		  		 *	We now require every bounty to have an associated Google Spreadsheet and Google Document.  This code creates this
		  		 *	at the bounty-creation process.
		  		 *	
		  		 *	The roadmap is to gradually replace our dependency on Box.  
		  		*/
		        // We don't have a bounty document -- let's create one
		        var d = require("@classes/integrations/google/docs/docs.js");
		        var docs = new d();

		        // Check and see if if have a valid keyword array
		        var documentTitle = "untitled"
		        if(Array.isArray(bounty.keywords)){
		        	if(bounty.keywords.length > 0){
		        		documentTitle = bounty.keywords[0];
		        	}
		        }

		        var documentId = await docs.createDocument(documentTitle);

		        // Putf a brake on to comply with rate limits
		        if(typeof bounty["bountyDocument"] == 'undefined'){
			        try {
			        await mongoose.connection.db
			          .collection("bounties")
			          .updateOne({_id: mongoose.Types.ObjectId( bounty._id ) }, {$set: { "bountyDocument": documentId } } );
			        } catch(err){
			          console.log(1935, "Error Creating Spreadsheet");
			        }
		        }
		        
 				await new Promise(resolve => setTimeout(resolve, 1500));
		        
		        if(typeof bounty["bountySpreadsheet"] == 'undefined'){
			        var s = require("@classes/integrations/google/sheets/sheets.js");
			        var sheets = new s()
			        var spreadsheetId = await sheets.createSpreadsheet(documentTitle);
			        try {
			        await mongoose.connection.db
			          .collection("bounties")
			          .updateOne({_id: mongoose.Types.ObjectId( bounty._id ) }, {$set: { "bountySpreadsheet": spreadsheetId.spreadsheetId } } );
			        } catch(err){
			          console.log(1935, "Error Creating Spreadsheet");
			        }
		        }

		        // If we have a "Filming" Step -- create a script for it.
		        for(var step of bounty.process){

		        	// Check and see if we have a Filming Step
		        	if(voca.indexOf(step.name, "Filming") != -1){
		        		// If yes, create a script document for it.
		        		var scriptId = await docs.createDocument("Script - " + documentTitle);
		        		 try {
					        await mongoose.connection.db
					          .collection("bounties")
					          .updateOne({_id: mongoose.Types.ObjectId( bounty._id ) }, {$set: { "bountyScript": scriptId } } );
					        } catch(err){
					          console.log(1935, "Error Creating Bounty Script");
					        }

					    // Merge any "keyword" fields with the script
		        	}

		        }
		  		//console.log(141, folderName, "here")
		  		//if(typeof folderId.id == 'undefined'){rand_
		  		//	folderId = { id: folderId }
		  		//}

		  		//await copyGuidelines(folderId.id, bounty)
		  		//
				//await createCollaboration(bounty.created_by, folderId.id)
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
					setTimeout(execStack, 750)
				else{
					//console.log(125, "watch_bounties.js", "All done - no more")
					// The last bounty has been created.  Send a slack message?
					duplicates = 1;
				} 
					
			}

			setTimeout(execStack, 750)
		}

	  })

async function sleep(ms) {
  return new Promise((resolve) => {
    
  });
}  

async function deleteFolderIfEmpty(folderId){
        // await box.deleteFolder(folder_id);
        var origFiles = await box.list(folderId);
        console.log(21, folderId, origFiles);

        if(origFiles["total_count"] == 0){
                box.deleteFolder(folderId);
        }
}

async function createFolderLocally(folderName, parent_folder_id, bounty_id, folderId, brand_id, brand_name, owner){
	var fs = require('fs');

	//console.log(220, folderName, parent_folder_id, bounty_id, folderId, brand_id, brand_name, owner);

	//console.log(222, folderId);

	brand_name = brand_name.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
	var parentFolderName = folderId.parent.name.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
	folderName = folderName.replace(/[^a-z0-9-]/gi, '_').toLowerCase();

	var base_dir = process.env.BASE_DIR;
	var folder = `${base_dir}/brands/${owner}/${brand_name}/${parentFolderName}/${folderName}`

	var sanitizedFolderName = folder;

	console.log(229, sanitizedFolderName);

    if (!fs.existsSync(folder)){
        var res = fs.mkdirSync(sanitizedFolderName, { recursive: true });
    }

    // Note the use of "id" here and not "_id" here is intentional -- the "id" is the folderId
    var query = { "id": folderId.id }
	var update = { "$set": { "localFolder" : sanitizedFolderName} }
	var result = await mongoose.connection.db.collection('folders').updateOne(query, update)

	query = {"_id": mongoose.Types.ObjectId(bounty_id) }
	result = await mongoose.connection.db.collection('bounties').updateOne(query, update)
	// We also need to update the bounty

	console.log(2455, query, update, result.result);
    // Now, update the mongodb database record to include the local folder path
    // so we can sync things up from box.
}

function copyGuidelinesLocal(folderName, parent_folder_id, bounty_id, brand_name, keywords, created_by, bounty){

	return;

	brand_name = brand_name.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
	var parentFolderName = folderId.parent.name.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
	folderName = folderName.replace(/[^a-z0-9-]/gi, '_').toLowerCase();

	var base_dir = process.env.BASE_DIR;

	var folder = `${base_dir}/brands/${owner}/${brand_name}/${parentFolderName}/${folderName}`
	var guidelinesFolder = `${base_dir}/brands/${owner}/${brand_name}/templates-${brand_name}`
	var targetFolder = `${base_dir}/brands/${owner}/${brand_name}/${parentFolderName}/${folderName}/Editorial Guidelines - ${bounty.queued_content}`
	
}

async function createCollaboration(bountyCreatedBy, folderId){
	var query = { _id: mongoose.Types.ObjectId(bountyCreatedBy) }
	var User = await mongoose.connection.db.collection('users').findOne(query)
	var userEmail = User.email
	console.log(177, "created by", userEmail, folderId)
	await box.createCollaboration(userEmail, folderId);
}

/*	This function copies the editorial guidelines for this bounty into the target directory */
async function copyGuidelines(folderId, bounty){
		//console.log(209, "copyGuidelines Called")

		console.log(231, "templateFolder", folderId, bounty.guidelines_folder_id, `Editorial Guidelines - ${bounty.queued_content}`);
		
		var templateFolder = await box.lookupFolderInfo(`Editorial Guidelines - ${bounty.queued_content}`, bounty.guidelines_folder_id)

		console.log(2123, templateFolder.id, `Editorial Guidelines - ${bounty.queued_content}`, bounty.guidelines_folder_id);
	  	var bountyId = bounty._id;

		try {
			var copyResults = await box.copyFolder(templateFolder.id, folderId);
		} catch(err){
			console.log(237, "Unable to copy", templateFolder.id, folderId)
			return false;
		}

		if(copyResults == false){
			console.log(240, "copyFolder Failed")
			return false;

		}

		var guidelinesFolderId = bounty.guidelines_folder_id;

		try {
			var templateSharedLink = await box.createSharedFolderAndUpdateDatabase(copyResults.id)
		} catch(err){
			console.log(248, "Unable to create shared link for the template")
			return;
		}

		try {
			var bountyFolderSharedLink = await box.createSharedFolderAndUpdateDatabase(folderId);
		} catch(err){
			console.log(248, "Unable to create shared link for the the bounty folder")
			return;
		}

	  	var query = { _id: mongoose.Types.ObjectId(bountyId) }

		var update = { $set: { "folderId" : folderId, 
			"templateFolderSharedLink": templateSharedLink.shared_link.url, 
			"bountyFolderSharedLink":bountyFolderSharedLink.shared_link.url,
			"templateFolderId":copyResults.id,
			"bountyFolderId":folderId
		} }

		try {
			var res = await mongoose.connection.db.collection('bounties').updateOne(query, update);
		} catch(err){
			console.log(261, "Unable to update database")
		}

		keywordToFile(bountyId, bounty.brand_id)

		return true;
}

async function copyGuidelinesLocally(){

	// brands/[owner]/[brand_name as url friendly string]/templates

}

async function getKeywordsData(keywords){
	/* Get Kewords Data */
	var pipeline = 
		 			[
		 				{ 
		 					$match:  
		 						{ "Keyword": { $in: keywords } }

						},
		 				{ 
		 					$project: 
		 						{_id:0,created_by:0,modified_by:0,owner:0,__v:0,"Difficulty":0,"Type":0,"Volume":0,"brand_name":0,"deploy":0} 
		 				}
		 			]
	var result = await mongoose.connection.db.collection('keywords').aggregate(pipeline).toArray();
	return result;
}

async function uploadInstructions(brand_name, keywords, bountyFolderId, bountyDocument){
		query = { "brand_name":brand_name}
		var Brand = await mongoose.connection.db.collection('brands').findOne(query)
		var brandDocument = Bounties.getUploadInstructions(Brand, bountyDocument);
		var keywordsData = await getKeywordsData(keywords);
		var keywordSupplementalData = Bounties.documentsToTextFile(keywordsData)
		
		const data = fs.readFileSync('upload_instructions.txt', {encoding:'utf8', flag:'r'}); 

		// Display the file data 
		var stream = data + keywordSupplementalData 

		try {
			await box.uploadFile(bountyFolderId, "publish_instructions.txt", stream, "watch_bounties.js")
		} catch (err){
			
		}
}

  function generateRandomFilename(extension =""){
    const uuidv4 = require('uuid/v4')
    var tmpFileName = process.cwd() + "/" + uuidv4() + extension
    return tmpFileName
  }

async function keywordToFile(bounty_id, brand_id){

	console.log(379, bounty_id, brand_id);

	 var targetKey = "script";

	 var searchObj = {}
     searchObj[targetKey] = { "$exists" : true }
     
     var aggregate = []
     aggregate.push({ $match: { brand_id: mongoose.Types.ObjectId(brand_id), "script": {$exists: true } } })
     aggregate.push({ $lookup: { from: "bounties", localField: "bounty_id", foreignField: "_id", as: "bounty" } })
     aggregate.push({ $match: { "bounty._id": mongoose.Types.ObjectId(bounty_id) } })
     aggregate.push({ $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$bounty", 0 ] }, "$$ROOT" ] } } })
     aggregate.push({ $project: { bountyFolderId: 1, script:1, "Keyword": 1 } })

     //console.log(3420, aggregate);

     console.log(3420, util.inspect(aggregate, false, null, true /* enable colors */))

     var matchingDocuments = await mongoose.connection.db
        .collection("keywords")
        .aggregate(aggregate).toArray()

     console.log(3507, matchingDocuments)

     //var matchingDocuments = await this.model.aggregate(aggregate)

     //await this.initBoxObj();

     if(matchingDocuments.length > 0){

       for(var i = 0; i < matchingDocuments.length; i++){
         var doc = matchingDocuments[i];
         var bountyFolderId = doc["bountyFolderId"];
         var script = doc["script"];
         var keyword = doc["Keyword"];
         var tmpFileName = generateRandomFilename() + "-script.txt";
         console.log(tmpFileName, script);
         fs.writeFileSync(tmpFileName, script); 
         var stream = fs.createReadStream(tmpFileName);
              try {
                console.log(3439, bountyFolderId, "script.txt")
                var uploadResult = await box.uploadFile(bountyFolderId, `${keyword}-script.txt`, stream)
              } catch(err){
                console.log(3441, err);
              }
              console.log(3443, uploadResult);
        }
       
       

       // Ok I should have a bountyFolderId and a script.
        
     }
}
