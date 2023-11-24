/*
  Created Mon Apr 13 by Adam Arthur
  The purpose of this file is to handle the box integration for content bounty
*/

var express = require("express");
var router = express.Router();
var Mongo = require("@classes/mongo");
var mongoose = require("mongoose");
var helpers = require("@classes/helpers");
var validation = require("@classes/validation");
var voca = require("voca");
var bounties = require("@classes/bounties");
var btoa = require('btoa');
const util = require('util');
var BoxSDK = require('box-node-sdk');
var adminModel = mongoose.model("User");
var Communication = require("@classes/communication.js");

var UserModel = mongoose.model("User");
var adminUser = {}
var fs = require("fs")

var path = require('path');
var filename = path.basename(__filename);

var createCount = 0;
function log(lineNum, msg, json ={}){
  var d = new Date();
  var n = d.toString();
   // fs.appendFileSync('logs.txt', n + " " + filename + " - " + "line: " + lineNum + " - " + msg + " - " + JSON.stringify(json) + '\n')   
    console.log(lineNum, msg);
    console.log(util.inspect(json, false, null, true /* enable colors */));
  }

  var disableBox = false;
  if(process.env.DISABLE_BOX == "true"){
    disableBox = true;
  }

if(!disableBox){

UserModel.findOne({"email":"admin@contentbounty.com"}, function(err, model){
  adminUser =  model;
})

var adminModel = mongoose.model("User");

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
    if(typeof data.updateDescription.updatedFields["integrations.box.tokenStore"]   != 'undefined'){

    adminModel.findOne({"email":"admin@contentbounty.com"},function(err, model){
      if(err == null){
          UserModel = mongoose.model("User");
          UserModel.findOne({"email":"admin@contentbounty.com"}, function(err, model){
            adminUser =  model;
          })
      }
    });
  }
  }  
});

}

function TokenStore(user, bWaitOnInvalidToken =false) {

  this.user = user;
}

TokenStore.prototype.read = function(callback) {
  if(disableBox)
    return;

  mongoose.connection.db.collection("users").findOne({_id:mongoose.Types.ObjectId(process.env.ADMIN_MODEL_DOC_ID)}, {}, function(err, user){
    console.log(82, 'attemping to get user', user.integrations.box.tokenStore)
    callback(null, user.integrations.box.tokenStore);
  })
};

TokenStore.prototype.write = async function(tokenInfo, callback) {
  if(disableBox)
      return;
    
  this.user.integrations.box.tokenStorePrev = this.user.integrations.box.tokenStore;
  this.user.integrations.box.tokenStore = tokenInfo;
  try {
    await this.user.save()
    adminUser = await UserModel.findOne({"email":"admin@contentbounty.com"});
    callback()
  } catch (err){
    callback(err)  
  }
  
};

TokenStore.prototype.clear = async function(callback) {

if(!disableBox)
    return;
  
    try {
      log(96, "Refreshing Admin Model");
      adminUser = await UserModel.findOne({"email":"admin@contentbounty.com"});
       callback();
    } catch (err){
      callback(null)
    }

    return;
  };

module.exports = class BoxIntegration {

  folders = [];
  createFolderCount = 0;
  foldersInfo = null;
  constructor(user, bWatchBounties =false) {

    if(disableBox)
      return;
  
    this.user = user;
    var User = user;
    this.sdk = new BoxSDK({
      clientID: 'h01wk6cv752nv39togtvivfxojq8zvfa',
      clientSecret: 'SRHx5dqjoDqyTqUd63vxts0AQo5m0pFw'
    })

    if(bWatchBounties == false){
      UserModel = mongoose.model("User");
      User = adminUser;
      this.user = User;
      // UserModel.findOne({"email":"admin@contentbounty.com"}, function(model){
      //   User = model
      //   console.log(135, User);
      // });
      
    }

    if(!bWatchBounties)
      this.tokenStore = new TokenStore(adminUser);
    else
      this.tokenStore = new TokenStore(user);
    
    //log(114, bWatchBounties, this.tokenStore)
    try {
      //console.log(143, "Creating new client", bWatchBounties, user, User.integrations.box.tokenStore, createCount)
      createCount++
      this.client = this.sdk.getPersistentClient(User.integrations.box.tokenStore, this.tokenStore);

    } catch (err){
      console.log(147, "box.js error", err)
    }


  }

  async getPersistentClient(user){
    if(disableBox)
    return;
  
    this.user = user;
    this.tokenStore = new TokenStore(user);
   try {
      console.log(153, "getPersistentClient " + user.email);
      this.client = await this.sdk.getPersistentClient(this.user.integrations.box.tokenStore, this.tokenStore);
    } catch (err){
      console.log(156, "getPersistentClient error" + user.email, err);

    } 

    console.log(184);
    //console.log(this.user.integrations.box.tokenStore.accessToken)
    return this.user.integrations.box.tokenStore.accessToken
  }

  async exchangeToken(folderId){
    if(disableBox)
    return;
  

    try {
      var tokenInfo = await this.client.exchangeToken('item_upload item_preview base_explorer', 'https://api.box.com/2.0/folders/' + folderId)
    } catch(err){
      
      if(err.response.body.error == 'invalid_resource'){
        return -1;
      }
      console.log(169, 'exchange token', err.response.body.error)
    }
    return tokenInfo.accessToken;
  }

  async getAuthorizeUrl(){

    if(disableBox)
    return;
  
    console.log(209);
    
    var user = this.user.email;

    try {
      this.authorize_url = await this.sdk.getAuthorizeURL({ 
        response_type: 'code',
        redirect_uri: `https://app.contentbounty.com/v1.0/api/boxredirect/authenticated/&state=${user}`
      });
    } catch (err){
      console.log(166, "getAuthorizeUrl Error" + user.email, err);
    }
    return decodeURIComponent(this.authorize_url)
  }

  async createFolderFromWatchBounties(folderName, parent_folder_id, bounty_id){
    if(disableBox)
    return;
  
    console.log(223, folderName, parent_folder_id, bounty_id);
    

    var folderInfo;
    //console.log(181, parent_folder_id, folderName)
    try {

      //var folderInfo = await this.client.folders.create(parent_folder_id, folderName);
      var folderInfo =  await this.createBoxFolder(parent_folder_id, folderName);
    } catch (err){
      console.log(186, "createFolderFromWatchBounties failed")
      //process.exit(1)
      return false;
    }

    try {
      var folderDoc = {
        ... folderInfo,
        ... { 'refDocId': '0' },
        ... { 'bounty_id': bounty_id }
      }

      await mongoose.connection.db.collection("folders").insertOne(folderDoc);
    } catch(err){
      console.log(196, "box.js", err);
      return false;
    } 
    
    //console.log(198, folderInfo.id);

    return folderInfo;
  }

  async createFolder(folderName, callback =null, data, box =null, curUser =null, self, parentId ='0', refDocId =0, process ="app_entry.js"){
    
    if(disableBox)
    return;
  
    console.log(183, "parentId", parentId, folderName);
    
    var folderId = await this.lookupFolderId(folderName)

    console.log(187, folderId);

    if(callback != null)
        return callback(folderId, data, box, curUser, self);

    if((folderId != '0')&&(folderId != null)){
        return folderId;
    }

    //log(152, "box.js Folder Not Found To Already Exist")

    //console.log(util.inspect(this.user, false, null, true /* enable colors */))

    var bCont = true;
    var count = 1;
    var _folderName = folderName;
    //while(bCont){
    try {
      //log(159, "box.js", "Calling create folder", parentId, _folderName)
      //var folderInfo = await this.client.folders.create(parentId, _folderName);
      var folderInfo = await this.createBoxFolder(parentId, folderName)
      bCont = false;
    } catch (err){

      //console.log(206, err.body)
      //Communication.sendSupportEmail("adamarthursandiego@gmail.com", process, JSON.parse(err.response.body))

      log(192, "box.js", 'Unable to create folder', err.statusCode);
      log(193, "box.js", 'Unable to create folder', err.response.body.code);
      if(err.response.body.code == 'item_name_in_use'){
        log("Item Name In Use -- Do a Lookup")
        var folderInfo = await this.lookupFolderId(folderName)
      } else {
        _folderName = "";
        _folderName = folderName + " ~ " + String(count);
        //log(169, parentId, _folderName);
        console.log(294, err.body)
        return false;
      }
    }

    //log(205, "folder created " + _folderName);
    // Store the folderInfo in the local database
    try {

      var folderDoc = {
        ... folderInfo,
        ... { 'refDocId': refDocId }
      }

    mongoose.connection.db.collection("folders").insertOne(folderDoc);
    } catch(err){
      log(262, "box.js", err);
    } 

    if(callback != null)
      return callback(folderInfo, data, box, curUser, self);

    return folderInfo;
  }

  async createCollaboration(email, folderId, process ="app_entry.js", callback =null){
    if(disableBox)
    return;
  
    try {
      if(callback == null){
        var collaboration = await this.client.collaborations.createWithUserEmail(email, folderId, this.client.collaborationRoles.EDITOR)        
      } else {
        this.client.collaborations.createWithUserEmail(email, folderId, this.client.collaborationRoles.EDITOR, callback) 
        return true;       
      }
    } catch(err){
      console.log(343, err);
      if(err.response.body.code == 'user_already_collaborator'){
        return true;
      }
      return null;
    }
    return collaboration;
  }

  async cancelCollaboration(email, folderId){

  }

  shareFolder(folderId, email){

  }

  unshareFolder(folderId, email){

  }

  addFilesToFolder(folderId, filesAr){

  }

  async list(parent_folder_id ='0'){

    //console.log(369, disableBox);
    if(disableBox)
      return;


  try {
        var foldersInfo = await this.client.folders.getItems(parent_folder_id)
      } catch (err){
        // Handle the error
        console.log(174, err);
        return [];
      }

     return foldersInfo;
  }

  async listAll(parent_folder_id ='0'){
    var entries = [];
    var bHasMorePages = true;
    var offset = 0;
    var limit = 100;
    var bBreaker = 0;
    while(bHasMorePages){

      // This shouldn't happen -- but just in case something goes wonky
      bBreaker++;
      if(bBreaker > 10){
        bHasMorePages = false;
      }
    try {
        //console.log(398, offset, limit);
        var foldersInfo = await this.client.folders.getItems(parent_folder_id, {offset: offset, limit: limit });
      } catch (err){
        // Handle the error
        console.log(174, err);
        return [];
      }
      for(var i = 0; i < foldersInfo.entries.length; i++)
        entries.push(foldersInfo.entries[i])

      if(entries.length >= foldersInfo.total_count){
        bHasMorePages = false;
      }
      offset += limit;
    }
    return entries;

  }

  async iterate(startDirectory = '0') {
    var arr=[];
    var curDirectory = await this.list(startDirectory)
    arr.push(curDirectory)
    for (var i = 0; i < curDirectory.length; i++) {
      var folderItem = curDirectory[i]
      if (folderItem.type == "folder") {
        //arr.push(folderItem)
        await this.iterate(folderItem.id)
      }
    }
    return arr
    
  }
  async storeRootFolders(){

    if(disableBox)
      return;
  
    try {
      this.foldersInfo = await this.client.folders.getItems('0')
    } catch (err){
      // Handle the error
      log(288, err);
    }
  }

  async findAndUpsertFolder(folderName, folderData){
    

    if(disableBox)
      return;
  
    var folderInfo = folderData;
    var updatedFolderInfo = await this.createSharedFolderAndUpdateDatabase(folderData.id)
    if(updatedFolderInfo != false){
      folderInfo = updatedFolderInfo
    }

    var results = await mongoose.connection.db.collection("folders").update({
      "name":folderName
    }, folderInfo, { "upsert":true })
  }

  // Checks to see if a folderName / parent combo exists in box
  async checkIfFolderExists(folderName, parent ='0', getParent =false){


    if(disableBox)
      return;
  
      try {
        var parentFolderData = await this.client.folders.get(parent)
      } catch(err){
        // If the parent doesn't exist, this folder doesn't exist either
        //console.log(354, err);  
        return false;
      }

      // We may need to iterate here...
      console.log(431, parentFolderData);


      if(getParent == true){
        return parentFolderData;
      }

      var item_collection = parentFolderData.item_collection;
      var entries = item_collection.entries;
      var entry;
      for (entry of entries){
        if(entry.name == folderName)
          return entry.id;
      }
      return false;
  }

  async lookupFolderIdIfNotExistsCreate(folderName,  parent = '0'){

    console.log(427, disableBox)

    if(disableBox)
      return false;
  
      var lookupResultId = await this.lookupFolderId(folderName, false, parent)

      // If the folder exists in our database, return the folderId
      //console.log(92, lookupResultId)
      if(lookupResultId != null){
        return lookupResultId;
      }

      var folderName = folderName;
      var folderExists = await this.checkIfFolderExists(folderName, parent);

      if(folderExists != false){
        var folderData = await this.client.folders.get(folderExists)
        var upsert = await this.findAndUpsertFolder(folderName, folderData)
        return folderData.id
      }

      // If we get here, our folder does not exist in the database.  It may still exist -- we just
      // might not have a record of it in our database.  So we need to check. 

      var parentFolderExists = await box.checkIfFolderExists(folderName, parent, true);

      if(parentFolderExists == false){
        // The parent folder doesn't exist ... so we can't create this folder
        console.log(397, folderName, parent)
        return false;
      }

      // Make sure the parent folder info is in our database for faster access to this data
      if(parent != '0')
        await box.findAndUpsertFolder(parentFolderExists.name, parentFolderExists)

      // The parent folder exists, but the folder itself doesn't exist in box.  Let's create it.
      try {
        var folderInfo = await this.createBoxFolder(parent, folderName)
      } catch(err){
        // The function failed
        console.log(409, err)
        return false
      }

      await box.findAndUpsertFolder(folderName, folderInfo)

      return folderInfo.id;
  }


  async createBoxFolder(parent, folderName){
    //console.log(516, "createboxfolder", parent, folderName)
    var result;
    try {
      result = await this.client.folders.create(parent, folderName);
    } catch(err){
  return false;
    }

    // This enables us to received a notification everytime we get a file uploaded into box
    // This will allow us to then download the file to our service and keep things in sync.
    //var webhook = this.createWebhook(result.id)
    
    //result["webhook"] = webhook;
    
    return result;
  }

  async lookupFolderId(folderName, bNoLookup =false, parent = '0'){

    console.log(507, "Lookup Folder Id Called", folderName, parent);

    if(disableBox)
      return;
  
    var searchObj = {
      "name":folderName,
      "parent.id": parent
    }

    //console.log(338, searchObj);

    var results = await mongoose.connection.db.collection("folders").findOne(searchObj, {"name":1, "_id":0});

    if(results != null){
      console.log(522, "Folder found in database, returning ", results)
      return results.id;
    }
    else {

      var offset = 0;
      top:
      while(true){
        //console.log(535);
         var options = {
           offset: offset
         }
         //console.log(538, options, parent)





         try {
         console.log(542)

         this.client.folders.get('0')
          .then(folder => {
            console.log(546, folder);
          })

         var foldersItems = await this.client.folders.getItems(parent);
         console.log(543)
         } catch(err){
           console.log(542, err);

         }
         //console.log(540, foldersItems);
         for(var i = 0; i < foldersItems.entries.length; i++){
          var entry = foldersItems.entries[i];

          if(entry.name == folderName){
            console.log(566, "match found, returning", entry.id)
            return entry.id;
          }
        }
         console.log(5342,  offset, foldersItems.limit, foldersItems.entries.length);
         if(foldersItems.total_count > offset + foldersItems.limit){
           offset = foldersItems.offset + foldersItems.limit
           continue top;
         }
        break;
      }
      console.log(526, "Folder not found in database -- searching online", "parent", parent)
      // let's see if the folder exists in box but we just don't have a record of it.
      try {
        var foldersItems = await this.client.folders.getItems(parent);
        console.log(530, "There are", foldersItems.entries.length, "items in the parent folder")
        for(var i = 0; i < foldersItems.entries.length; i++){
          var entry = foldersItems.entries[i];

          if(entry.name == folderName){
            console.log(586, "match found, returning", entry.id)
            return entry.id;
          }
        }
      } catch(err){
        console.log(539, err);
        return null;
      }
    }
    
    console.log(542, "but none matched folderName")

    return null;
    
    // Check to see if the parent folder exists
      var parentFolderInfo = null;
      if(parent != '0')
        parentFolderInfo = await mongoose.connection.db.collection("folders").findOne({id: parent}, {"name":1, "_id":0});

        if((parentFolderInfo == null) && parent != '0'){

        }

    if(results == null){  
        try {
          var parentFolderData = await this.client.folders.get(String(parent))
        } catch(err){
          var parentFolderData = null; 
        }
        
        // if(parentFolderData.id != '0'){
        //   this.findAndUpsertFolder(parentFolderData.name, parentFolderData)
        // } else {
        //   folderData = await this.client.folders.get()
        // }

        if(parentFolderData != null){
          console.log(330, parentFolderData)
          //this.findAndUpsertFolder(folderName, folderData)
        }
    }

    if(results != null)
      return results.id;
    else
      return results;
    
    // If we got here, it means we didn't have a matching database record for the folderName
    // Our fallback is to lookup folder names in our root directory
    // if(this.foldersInfo == null){
    //   try {
    //       var foldersInfo = await this.client.folders.getItems('0')
    //     } catch (err){
    //       // Handle the error
    //       log(174, err);
    //     }
    //   } else {
    //     var foldersInfo = this.foldersInfo;
    // }

    if(this.foldersInfo == null){
      await this.storeRootFolders();
    }
    
    var foldersInfo = this.foldersInfo;

    // If we get here, we should store this information in the local database, so as to 
    // reduce the need to make an API call later
    for(var i = 0; i < foldersInfo.entries.length; i++){
      var folderInfo = foldersInfo.entries[i]
      if(folderInfo.type == 'folder')
        if(folderInfo.name == folderName){
          // Store the folderInfo in the local database
          try {
            // This should be an upsert not an insert
            //mongoose.connection.db.collection("folders").insert(folderInfo);
          } catch(err){
            log(189, err);
          }
          return folderInfo.id
        }
    }

    return '0';

  }

  async lookupFolderInfo(folderName, parentFolderId ='0'){

    if(disableBox)
      return;
  
    try {
      var foldersInfo = await this.client.folders.getItems(parentFolderId)
    } catch (err){
      // Handle the error
      console.log(174, err.request);
      return false;
    }

    // If we get here, we should store this information in the local database, so as to 
    // reduce the need to make an API call later
    for(var i = 0; i < foldersInfo.entries.length; i++){
      var folderInfo = foldersInfo.entries[i]
      if(folderInfo.type == 'folder')
        if(folderInfo.name == folderName){
          return folderInfo
        }
    }

    return false;
  }

  // async createWebLink(description, name, url){

  //   if(disableBox)
  //     return;
  
  //   var weblinkResults = await this.client.weblinks.create(
  //     url,
  //     '0',
  //     {
  //       name: name,
  //       description: description
  //     })
  //   return weblinkResults;
  // }

  async copyFolder(folderId, parentId, newName =null, callback =null){


    if(disableBox)
      return;
  

    try {
      if(callback == null){
        var copyFolderResults = await this.client.folders.copy(folderId, parentId, newName);
      }
      else {
        await this.client.folders.copy(folderId, parentId, newName, callback);
      }
            
    } catch (err){
      console.log(549, folderId, parentId, newName, err.response.body.code)
      if(err.response.body.code == 'item_name_in_use'){
        return false;
      }

      return false;
    }
    return copyFolderResults
  }

  async deleteFolder(folderId){


    if(disableBox)
      return;
  
    try {
    var copyFolderResults = await this.client.folders.delete(folderId, {recursive: true} );
    } catch (err){
      
    }
    return copyFolderResults
  }

  async deleteFile(fileId){


    if(disableBox)
      return;
  
    try {
    var copyFolderResults = await this.client.files.delete(fileId)
    } catch (err){
      
    }
    return copyFolderResults
  }

  async resolveInvalidToken(user){
    
  }

  async requestAccessToken(user){


    if(disableBox)
      return;
  
    log(378, user)
    this.sdk.getTokensAuthorizationCodeGrant(user.integrations.box.code, null, async function(err, tokenInfo) {
        if (err) {
          console.log(384, err);
        }
        var tokenStore = new TokenStore(user);
        await tokenStore.write(tokenInfo, function(storeErr) {
            if (storeErr) {
            }
        });
    });
  }

  async uploadFile(folderId ='0', fileName, buffer, process ="app_entry.js"){


    if(disableBox)
      return;
  
    var uploadedFile = await this.client.files.uploadFile(folderId, fileName, buffer)
    return uploadedFile
  }

  async uploadPublicationInstructions(brand_name){
    
  }

  async createSharedFolderAndUpdateDatabase(folderId){

    if(disableBox)
      return;
  
    var folderInfo = false;
    try {
      folderInfo = await this.client.folders.update(folderId, 
        {
          shared_link: {
            access: "open",
            permissions: {
              can_download: true
            }
          }
        })
    } catch(err){
      return false;
    }

    return folderInfo;
  }

  async downloadFile(fileId, outputFile){

    console.log(870, fileId);
    if(disableBox)
      return;
  
    fileId = fileId; // Static file for testing
    var stream;

    console.log(874, "Trying to Download");

    var fs = require('fs');
    try {
      stream = await this.client.files.getReadStream(fileId, null)
    } catch(err){
      // unable to download file;
      console.log("Unable to download", err)
      return false;
    }

    var output = fs.createWriteStream(outputFile);
    stream.pipe(output); 
    this.user["lastDownloadedFile"] = output;
    await this.user.save();
    return outputFile;
  }

  async renameFile(fileId, newFileName){
    var fs = require('fs');
    try {
      await this.client.files.update(fileId, { name : newFileName, fields: 'name' });
    } catch(err){
      // unable to download file;
      console.log("Unable to download", err)
      return false;
    }   
  }

  async renameFolder(folderId, newFolderName){
    console.log(908, "Renaming Folder", folderId, newFolderName)
    try {
      await this.client.folders.update(folderId, { name : newFolderName });
    } catch(err){
      // unable to download file;
      console.log("Unable to download", err)
      return false;
    }   
  }

  async uploadFileVersion(fileId, tmpFileName){

    
    //if(disableBox)
    //  return;
  
    //var stream = null;
    console.log(925, fileId, tmpFileName)
    //if(readStream == null){
   //   console.log(927, tmpFileName)
      var stream = await fs.createReadStream(tmpFileName);
    //  console.log(929)
    //}
    //else {
    //  console.log(932)
    //  stream = readStream;
    //}

    try {
      console.log(937)
      var upload = await this.client.files.uploadNewFileVersion(fileId, stream)
    } catch(err){
      console.log(940, err)
      return false;
    }
    console.log(943)
    return upload;
  }

  async listWebhooks(){

    //var nextMarker = ;
    //while(nextMarker != null){
    var webhooks;
    try {
      webhooks = await this.client.webhooks.getAll()
    } catch(err){
      console.log(876, err);
      return false;
    }
    
    if(typeof webhooks["next_marker"] != 'undefined'){
      var nextMarker = webhooks["next_marker"]

      while(nextMarker != null){

          try {
      var nextResults = await this.client.webhooks.getAll({limit: 1000, usemarker: true, marker: nextMarker })
    } catch(err){
      console.log(876, err);
      return false;
    }
      webhooks.entries = webhooks.entries.concat(nextResults.entries);
      if(typeof nextResults["next_marker"] != 'undefined'){
        nextMarker = nextResults["next_marker"]
      } else {
        nextMarker = null;
      }
    }

    }

    // {limit: 1000 usemarker: true, marker: "eyJ0eXBlIjoid2ViaG9va19hdXhfbG9va3VwX2lkIiwiZGlyIjoibmV4dCIsInRhaWwiOiI2MTM0OTU0MTEifQ"}

    //if(webhooks)

    return webhooks;
  }

  async getWebhook(webhookId){
    console.log(883, webhookId);
    var webhook;
    try {
      webhook = await this.client.webhooks.get(webhookId)
    } catch(err){
      console.log(999, err)
      return false;
    }
    return webhook;
  }

  /*
          UPLOADED: WebhookTriggerType.FILE_UPLOADED,
        PREVIEWED: WebhookTriggerType.FILE_PREVIEWED,
        DOWNLOADED: WebhookTriggerType.FILE_DOWNLOADED,
        TRASHED: WebhookTriggerType.FILE_TRASHED,
        DELETED: WebhookTriggerType.FILE_DELETED,
        RESTORED: WebhookTriggerType.FILE_RESTORED,
        COPIED: WebhookTriggerType.FILE_COPIED,
        MOVED: WebhookTriggerType.FILE_MOVED,
        LOCKED: WebhookTriggerType.FILE_LOCKED,
        UNLOCKED: WebhookTriggerType.FILE_UNLOCKED,
        RENAMED: WebhookTriggerType.FILE_RENAMED,
    },
    COMMENT: {
        CREATED: WebhookTriggerType.COMMENT_CREATED,
        UPDATED: WebhookTriggerType.COMMENT_UPDATED,
        DELETED: WebhookTriggerType.COMMENT_DELETED,
    },
    TASK_ASSIGNMENT: {
        CREATED: WebhookTriggerType.TASK_ASSIGNMENT_CREATED,
        UPDATED: WebhookTriggerType.TASK_ASSIGNMENT_UPDATED,
    },
    METADATA_INSTANCE: {
        CREATED: WebhookTriggerType.METADATA_INSTANCE_CREATED,
        UPDATED: WebhookTriggerType.METADATA_INSTANCE_UPDATED,
        DELETED: WebhookTriggerType.METADATA_INSTANCE_DELETED,
    },
    FOLDER: {
        CREATED: WebhookTriggerType.FOLDER_CREATED,
        DOWNLOADED: WebhookTriggerType.FOLDER_DOWNLOADED,
        RESTORED: WebhookTriggerType.FOLDER_RESTORED,
        DELETED: WebhookTriggerType.FOLDER_DELETED,
        COPIED: WebhookTriggerType.FOLDER_COPIED,
        MOVED: WebhookTriggerType.FOLDER_MOVED,
        TRASHED: WebhookTriggerType.FOLDER_TRASHED,
        RENAMED: WebhookTriggerType.FOLDER_RENAMED,
    },
    */
  async createWebhook(boxObjectIdentifier){
    console.log(892, boxObjectIdentifier)
    var webhook;
    try {
      webhook = await this.client.webhooks.create(boxObjectIdentifier, this.client.itemTypes.FOLDER, 'https://app.contentbounty.com/v1.0/api/boxredirect/callback',
        [
            this.client.webhooks.triggerTypes.FILE.UPLOADED,
            this.client.webhooks.triggerTypes.FILE.TRASHED,
            this.client.webhooks.triggerTypes.FILE.DELETED,
            this.client.webhooks.triggerTypes.FILE.MOVED,
            this.client.webhooks.triggerTypes.FILE.RENAMED,
            this.client.webhooks.triggerTypes.FOLDER.CREATED,
            this.client.webhooks.triggerTypes.FOLDER.DOWNLOADED,
            this.client.webhooks.triggerTypes.FOLDER.COPIED,
            this.client.webhooks.triggerTypes.FOLDER.MOVED,
            this.client.webhooks.triggerTypes.FOLDER.TRASHED,

        ])
    } catch(err){
      //console.log(904, err);
      return false;
    }
    console.log(906, webhook);
    return webhook
  }

  async updateWebhook(){

  }

  async removeWebhook(webhookId){
    var webhook;
    try {
      webhook = await this.client.webhooks.delete(webhookId)
    } catch(err){
      console.log(999, err)
      return false;
    }
    return webhook;
  }

  async createWeblink(url, description, name, parent ="0"){
    var res = await this.client.weblinks.create(url, parent, { "name": name, "description":description })
  }

  async removeWeblink(weblinkId){

  }

  async updateWeblink(weblinkId){

  }

  async getWeblink(weblinkId){

  }

  async syncBoxAndLocal(local_folder_path, box_folder){

    // First let's check out paths
    console.log(1023, local_folder_path, box_folder);

    var fullLocalPath = process.env.BASE_DIR + local_folder_path + "/";

    console.log(1027, fullLocalPath);

    //First, check and see if the local_folder_path exists on this device
    var bLocalPathExists = fs.existsSync(fullLocalPath);

    if(bLocalPathExists == false){
      // We need to create the local directory.  This is mostly for local testing -- it should already exist on the server
      var res = fs.mkdirSync(fullLocalPath, { recursive: true });
      console.log(1033, "Creating", fullLocalPath);
    }

    //  var localPath = localFolder + "/" + body.source.name.replace(/[^a-z0-9-.]/gi, '_').toLowerCase();
    // Get all of the files in the directory
    var allFiles = await this.listAll(box_folder);
    //console.log(1041, allFiles);

    for(const file of allFiles){
      var urlFriendlyFilename = file.name.replace(/[^a-z0-9-.]/gi, '_').toLowerCase();
      var fullLocalFilePath = fullLocalPath + urlFriendlyFilename;
      console.log(1046, fullLocalFilePath);
      if(!fs.existsSync(fullLocalFilePath)){
        console.log('The files', fullLocalFilePath, 'does not exist on this device');
        console.log("Downloading...", file.id)
        await this.downloadFile(file.id, fullLocalFilePath)
        console.log("Download Complete");
      }
    }

  }

getFilenamesAr(allFiles){
    var filenames = [];
    for (var fileObj of allFiles.entries) {
        if (voca.indexOf(fileObj.name, "-Take ") != -1) {
          //if(voca.indexOf(fileObj.name), ".mp4" != -1){

            filenames.push(fileObj.name);
          //}
        }
    }  
    return filenames;
}

async renameFiles(allFiles, filenames){
    var modifiedFiles = [];
    for (var fileObj of allFiles.entries) {
        var file = fileObj.name;
        var firstUnderscore = voca.indexOf(file, "_");
        var secondUnderscore = voca.indexOf(file, "_", firstUnderscore + 1);
        var thirdUnderscore = voca.indexOf(file, "_", secondUnderscore + 1)

        var lastUnderscore = voca.indexOf(file, "_");
        var cameraSubstrPos = voca.indexOf(file, "camera-");
        if (cameraSubstrPos == -1) {
            continue;
        }
        var partSubstringPos = voca.indexOf(file, "part-");
        if (partSubstringPos == -1) {
            continue;
        }

        if (voca.indexOf(file, "-Take ") != -1) {
            continue;
        }

        var fileDescription = voca.substring(file, firstUnderscore + 1, secondUnderscore);
        var dateStart = voca.indexOf(file, "-", partSubstringPos);
        var filenameComponent = voca.substring(file, cameraSubstrPos, partSubstringPos + 6);

        var firstDash = voca.indexOf(file, "-");
        var secondDash = voca.indexOf(file, "-", firstDash+1);
        var thirdDash = voca.indexOf(file, "-", secondDash+1);
        var fourthDash = voca.indexOf(file, "-", thirdDash+1);

        var camera = voca.substring(file, secondUnderscore+1, secondDash);
        var part = voca.substring(file, secondDash+1, fourthDash);

        var take = "";
        if (filenames.indexOf(filenameComponent + "-Take 1") == -1) {
            filenameComponent += "-Take 1";
            take = "Take 1";
        } else {
            var instances = 1;
            for (var tmp of filenames) {
                if (voca.indexOf(tmp, filenameComponent) != -1) {
                    instances++;
                }
            }
            take = "Take " + String(instances);
            filenameComponent += "-Take " + String(instances);
        }
        if (filenames.indexOf(filenameComponent) == -1) {
            filenames.push(filenameComponent)

            var newName = voca.titleCase(voca.replaceAll(fileDescription, "%20", " "))
            newName = voca.replaceAll(newName, "%", "");
            modifiedFiles.push({
                "originalFilename": fileObj.name,
                "newFilename": newName,
                "id": fileObj.id,
                "description": fileDescription,
                "camera":camera,
                "part":part//,
                //"take":take
            });
            await this.renameFile(fileObj.id, filenameComponent + ".mp4");
        }
    }  
    return modifiedFiles;
}

createTakeDirectories(filenames){
    var assetDirectories = [];
    for (var file of filenames) {
        
        var takes = voca.indexOf(file, "Take ");
        var eof = file.length;
        console.log(1187, takes, eof, file);
        var take = voca.substring(file, takes, eof);
        assetDirectories.push(take);
    }
    assetDirectories = [...new Set(assetDirectories)];
    return assetDirectories;
}

createCameraAr(renamedFiles){
  var cameras = [];
  for(var modifiedFile of renamedFiles){
    cameras.push(modifiedFile.camera);
  }
  cameras = [ ... new Set(cameras) ];
  return cameras;
}

async createCameraDirectories(assetDirectories, cameraDirectories, folderId){
    var cameraDirs = [];

    for(var assetDir of assetDirectories){
      var assets = await this.createBoxFolder(folderId, assetDir);
      for(var cameraDir of cameraDirectories){
        var cameraDirId = await this.createBoxFolder(assets.id, cameraDir);
        cameraDirs.push({ "parentFolderName": assets.name, "parentFolderId": assets.id, "folderName":cameraDir, "folderId":cameraDirId.id })
      }
    }
    return cameraDirs;
}

getOriginalFilesSorted(allFiles){
    var filenames = [];
    for (var fileObj of allFiles.entries) {
      //console.log(1224, fileObj.name);
        if (voca.indexOf(fileObj.name, ".mp4") != -1) {
            filenames.push(fileObj);
        }
    }  

    filenames.sort(function(a, b) {
      var textA = a.name.toUpperCase();
      var textB = b.name.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    return { entries: filenames } ;
}

async normalizeFilenames(folderId) {

    var origFiles = await this.list(folderId);
    var allFiles = this.getOriginalFilesSorted(origFiles)
    var filenames = this.getFilenamesAr(allFiles)

    var footageFolderName = "Footage";
    var footageFolderCount = 0;

    for(var entry of origFiles.entries){
      if(entry.type == "folder"){
        if(voca.indexOf(entry.name, "Footage") != -1){
          footageFolderCount++;
          footageFolderName = `Footage - Shoot ${footageFolderCount}`
        }
      }
    }


    var renamedFiles = await this.renameFiles(allFiles, filenames);

    // Each unique description corresponds to a unique take
    var uniqDescription = [];
    for(const file of renamedFiles){
      uniqDescription.push(file.description)
    }

    uniqDescription = [ ... new Set(uniqDescription) ]

    var tmp = {}
    for(const description of uniqDescription){
      tmp[description] = []
    }

    var tmpKeys = Object.keys(tmp);

    for(const file of renamedFiles){
      
      for(const key of tmpKeys){
        if(file.description == key){
          tmp[key].push(file);
        }
      }
    }

    for(const val of tmpKeys){
     // var 
     var take = tmp[val];

      var uniqueCameras = [];
      for(const file of take){
        uniqueCameras.push(file.camera)
      }
      uniqueCameras = [ ... new Set(uniqueCameras)]

      var uniqtake = {}
      for(const camera of uniqueCameras){
        uniqtake[camera] = [];
      }

      //console.log(1281, uniqtake)

      tmp[val] = uniqtake
    }

    for(const file of renamedFiles){
      tmp[ file.description ] [ file.camera ].push(file)
    }

    for(const file of renamedFiles){
      tmp[ file.description ] [ file.camera ].sort(function(a, b) {
      var textA = Number(voca.replaceAll(a.part, "part-", ""));
      var textB = Number(voca.replaceAll(b.part, "part-", ""));
      //console.log(1299, textA, textB);
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    }

    var takes = Object.keys(tmp);
    //var cameras = Object.keys(tmp[takes]);


    var finalAr = [];
    var takesCount = 0;

    var renamedFiles = []

    var footageFolder = await this.createBoxFolder(folderId, footageFolderName);

    folderId = footageFolder.id;
    var assetDirectories = []

    for(var take of takes){
      console.log(1311, take);
      takesCount++;
      var takeDirectory = await this.createBoxFolder(folderId, `Take ${takesCount}`);
      var cameras = Object.keys(tmp[take])
      var cameraDirectories = 0;
      var description = "";
      for(var camera of cameras){
        cameraDirectories++;
        var cameraDirectory = await this.createBoxFolder(takeDirectory.id, `camera-${cameraDirectories}`)
        //console.log(1315, camera);
        
var filenamesAr = [];
        for(var file of tmp[take][camera]){
          file["Take"] = "take-" + takesCount;
          file["directory"] = cameraDirectory.id;
          file["parent-directory"] = takeDirectory.id
          console.log(1361, file.newFilename)
          var updatedFilename = voca.titleCase(file.newFilename) + " " + file.part + ".mp4";
          await this.moveFileAndRename(file.id, cameraDirectory.id, voca.titleCase(file.newFilename) + " " + file.part + ".mp4");
          description = file.newFilename;
          filenamesAr.push(`file '${updatedFilename}'`);
        }

        console.log(1362, filenamesAr);

        const outputFile = 'input_list.txt';
        const arrAsString = filenamesAr.join('\n')

        console.log(1363, arrAsString);
        // Write the array to the output file

        //fs.writeFileSync(outputFile, arrAsString);
        //fs.writeFileSync('concat.sh', `ffmpeg -f concat -safe 0 -i input_list.txt -c copy ${file.newFilename}-${cameraDirectories}.mp4`);
        //var stream = fs.createReadStream(outputFile);
        //var shScript = fs.createReadStream('concat.sh');

        //console.log(1402, "Attemping to upload", arrAsString);

        //await this.uploadFile(cameraDirectory.id, outputFile, stream);
        //await this.uploadFile(cameraDirectory.id, outputFile, shScript);

        await this.renameFolder(takeDirectory.id, voca.titleCase(description))

        console.log(1418, takeDirectory.id, voca.titleCase(description))
      }
      
    //   takesCount++;
    //   console.log(1312, `take-${takesCount}`);
    //   for(var camera of cameras){
    //     for(var file of camera){
    //       console.log(1315, file);
    //       //file["Take"] = `take-${takesCount}`;
    //     }
    //   }
    }

    return tmp;

    //console.log(1289, tmp, uniqtake);

    // return renamedFiles;

    // renamedFiles.sort(function(a, b) {
    //   var textA = a.description.toUpperCase();
    //   var textB = b.description.toUpperCase();
    //   return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    // });


    // // renamedFiles.sort(function(a, b) {
    // //   var textA = a.camera.toUpperCase();
    // //   var textB = b.camera.toUpperCase();
    // //   return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    // // });


    // // renamedFiles.sort(function(a, b) {
    // //   var textA = a.part.toUpperCase();
    // //   var textB = b.part.toUpperCase();
    // //   return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    // // });

    var cameraAr = this.createCameraAr(renamedFiles);

    //return [renamedFiles];

    var cameraDirs = await this.createCameraDirectories(assetDirectories, cameraAr, folderId);

    for(var renamedFile of renamedFiles){
      //console.log(renamedFile)
      for(var cameraDir of cameraDirs){
        //irsf(renamedFile.take == cameraDir.take){
           //console.log(1236, renamedFile, cameraDir);  
          if(renamedFile.camera == cameraDir.folderName){

            if(renamedFile.take == cameraDir.parentFolderName){
              console.log(1238, renamedFile, cameraDir);    
              var renameResult = await this.moveFileAndRename(renamedFile.id, cameraDir.folderId, voca.titleCase(renamedFile.description) + " " + renamedFile.part + ".mp4");
            }
          //  var parentFolder = cameraDir.folderId;
          //  console.log(1236, renamedFile);
          }
        }
      }
    //}

    return { "cameraDirs":cameraDirs, "filenames":renamedFiles } ;

}

  async moveFileAndRename(fileId, newFileDirectory, newName){

    // Check if file exists
    var filesInDir = await this.list(newFileDirectory);
    var take = 1;

    for(var file of filesInDir.entries){
      take++;
       if(file.name == newName){
         var nameParts = newName.split(".mp4");
         newName = nameParts[0] + ` - Take ${take}` + ".mp4";
       } 
    }

    var fs = require('fs');
    try {
      console.log(1255, newName);
      await this.client.files.update(fileId, { parent : { id: newFileDirectory }, name: newName });
    } catch(err){
      // unable to download file;
      console.log("Unable to move file", err)
      return false;
    }
    return true;
  }

  async moveFile(fileId, newFileDirectory){
    var fs = require('fs');
    try {
      await this.client.files.update(fileId, { parent : { id: newFileDirectory } });
    } catch(err){
      // unable to download file;
      console.log("Unable to move file", err);
      return false;
    }   
  }

}

