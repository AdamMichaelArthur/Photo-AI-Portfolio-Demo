var express = require("express");
var router = express.Router();
var Mongo = require("@classes/mongo");
var mongoose = require("mongoose");
var Model = mongoose.model("Stripe");
var helpers = require("@classes/helpers");
var validation = require("@classes/validation");
var voca = require("voca");
var bounties = require("@classes/bounties");
var btoa = require('btoa');
const util = require('util');
var Box = require('@classes/integrations/box/box.js');
var fs = require("fs")
var base64 = require('base-64');

var UserModel = mongoose.model("User");
var adminUser = {}

UserModel.findOne({
  "email": "admin@contentbounty.com"
}, function (err, model) {
  adminUser = model;
  //console.log(156, "Admin User:", adminUser.integrations.box.tokenStore)
})

var adminModel = mongoose.model("User");

adminModel.findOne({
  "email": "admin@contentbounty.com"
}, function (err, model) {
  if (err == null) {
    //log(43, "watch_admin.js","creating new token store")
    delete box;
    box = new Box(model, true)
  } else {
    console.log(26, "watch_admin.js", err);
  }
});

const pipeline = [{
  '$match': {
    '$or': [{
      'operationType': 'insert'
    }, {
      'operationType': 'update'
    }],
    'documentKey': {
      _id: mongoose.Types.ObjectId(process.env.ADMIN_MODEL_DOC_ID)
    }
  }
}];

adminModel.watch(pipeline).on('change', data => {
  console.log(data);
  if (data.operationType == 'update') {
    if (typeof data.updateDescription.updatedFields["integrations.box.tokenStore"] != 'undefined') {
      adminModel.findOne({
        "email": "admin@contentbounty.com"
      }, function (err, model) {
        if (err == null) {
          UserModel.findOne({
            "email": "admin@contentbounty.com"
          }, function (err, model) {
            adminUser = model;
          })
        }
      });
    }
  }
});

class BoxIntegration {
  /* HTTP Functions 
     Can use this.req, this.res, this.user
  */


  constructor(req, res, next) {
    this.className = "box";
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    var defaultAcct = true;


   // if (typeof this.user != 'undefined') {
   //   this.box = new Box(this.user, defaultAcct);
   // } else {
      this.box = new Box(adminUser, true)
   // }
  }

  async authorize() {
    var authUrl = await this.box.getAuthorizeUrl()
    this.res.status(200);
    this.res.json({
      "redirect_uri": authUrl
    });
  }
  

  async initBoxObj(){
    var adminModel = mongoose.model("User");
    var adminUser = await adminModel.findOne({
      email: "admin@contentbounty.com",
    });

    this.box = new Box(adminUser);    
    return this.box;
  }

  async authenticated() {
    var code = this.req.query.code;
    var user = this.req.query.state;
    var userModel = mongoose.model("User");
    var user = await userModel.findOne({
      "email": user
    });
    this.user = user;
    this.box = new Box(user);
    user.integrations.box.code = code;
    await user.save();
    await this.token(user);
    this.res.redirect(301, "https://app.contentbounty.com/boxsuccessful");
  }

  async createFolderLocallyIfNotExists(folderName, parent_folder_id, bounty_id, folderId, brand_id, brand_name, owner){
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

    console.log(153, sanitizedFolderName);

    var result = await mongoose.connection.db.collection('folders').updateOne(query, update)
    console.log(2455, query, update, result.result);
      // Now, update the mongodb database record to include the local folder path
      // so we can sync things up from box.
  }

  async refresh() {

    // Get the folder
    var folderBase64 = helpers.getParameter(this.req.params[0], "directory");

    // Decode It
    var folder = base64.decode(folderBase64)
    var localFolder = folder;
    // Find the bounty associated with this folder
    var query = { "localFolder": folder }
    console.log(172, query);
    var bounty = await mongoose.connection.db.collection('bounties').findOne(query, {"localFolder":1, "bountyFolderId":1} )
    
    // Check and see if we found a valid record
    if(bounty == null){
      // We didn't get a valid record
        this.res.status(200);
        this.res.json({
          "failure": "Unable to find folder"
        });    
      return;
    }

    var fileList = await this.box.list(bounty.bountyFolderId)
    var files = []
    console.log(187, fileList.entries);
    for(var entry in fileList.entries){
      console.log(188, fileList["entries"][entry]);
      if(fileList["entries"][entry]["type"] == "file"){
        var path = localFolder + "/" + fileList["entries"][entry].name.replace(/[^a-z0-9-.]/gi, '_').toLowerCase();
        files.push({ 
            "id": fileList["entries"][entry].id,
            "name":fileList["entries"][entry].name,
            "path":path
            });
      }
    }

    this.res.status(200);
    this.res.json({
      "working": files
    }); 
    
    // If we did, use the box folder id to get a list of files in the directory and download each file
    for(var i = 0; i < files.length; i++){
      try {
        await this.box.downloadFile(files[i].id, files[i].path)
      } catch(err){
        console.log(204, "Unable to download/save file");
      }
    }   
  }

  async callback() {
     this.res.status(200);
    this.res.json({
      "working": true
    });

    var body = this.req.body;

  console.log(139, body);
    var id = body.source.id;
    var query = { "id": body.source.parent.id }
    var projection = { "localFolder" : 1, };
    var bountyProjection = { "folderName":1, "content_type":1, "release_for_bounty":1, "_id": 0, "folderId":1, "parent_folder_id":1, "_id":1, "brand_id":1, "brand_name":1, "owner":1 }

    // folderName, parent_folder_id, bounty_id, folderId, brand_id, brand_name, owner
    var result = await mongoose.connection.db.collection('folders')
      .findOne(query, projection);

      console.log(175, result);

      // this.createFolderLocallyIfNotExists(`${result.content_type} - ${result.release_for_bounty}`,
      //  result.parent_folder_id, 
      //  result.bounty_id, 
      //  result.folderId, 
      //  result.brand_id,
      //   result.brand_name, 
      //   result.owner)

    console.log(140, query);
      // Should do some error checking...
      var localFolder = result.localFolder;
    console.log(141, localFolder)

    var localPath = localFolder + "/" + body.source.name.replace(/[^a-z0-9-.]/gi, '_').toLowerCase();
    console.log(146, localPath);
    console.log(147, id);

    // This ensure that if the file already exists we get the latest version when we download the file
    try {
      fs.unlinkSync(localPath);
    } catch(err){
      // Just checking do nothign
    }
    
    this.box.downloadFile(id, localPath)
  }

  async token(user) {
    var token = await this.box.requestAccessToken(user);
    user.integrations.box.token = token;
    await user.save();
  }

  async endusertoken() {
    console.log(59, this.user)
    this.box = new Box(this.user)
    //this.token = this.token(this.user)
    var token = await this.box.getPersistentClient(this.user)

    this.res.locals.response = {
      "token": token
    }
    return next(this.req, this.res)
    // this.res.status(200);
    // this.res.json({"working":token});
  }

  async folder() {
    var folderInfo = await this.box.createFolder(this.req.body.folderName, null, null, null, null, this, "0");
    this.res.status(200);
    this.res.json({
      "folder": this.req.body.folderName,
      "folderInfo": folderInfo
    });
  }

  async collaboration() {
    var email = this.req.body.email;
    var folderId = this.req.body.folderId;

    var collaboration = await this.box.client.collaborations.createWithUserEmail(email, folderId, this.client.collaborationRoles.EDITOR)
    this.res.status(200);
    this.res.json(collaboration);
  }

  async health() {
    // Check and see of all of the folders have been created...
    // Look at all of the current bounties
    var bountyModel = mongoose.model("Bounty");
    var bountyList = await bountyModel.find({}, {
      "content_type": 1,
      "folderId": 1,
      "parent_folder_id": 1,
      "release_for_bounty": 1
    })
    this.res.status(200);
    this.res.json({
      "health": bountyList
    });
  }

  async link() {
    var description = this.req.body.description; //"description":"A description of the link",
    var name = this.req.body.name; //"name":"The name of the web-link", 
    var url = this.req.body.url; //"url":"https://www.myweblink.com"
    var weblinkResult = await this.box.createWebLink(description, name, url);
    this.res.status(200);
    this.res.json(weblinkResult);
  }

  /*
      var description = this.req.body.description;//"description":"A description of the link",
      var name = this.req.body.name;//"name":"The name of the web-link", 
      var url = this.req.body.url;//"url":"https://www.myweblink.com"
      var folderList = await this.box.list()
      this.res.status(200);
      this.res.json(folderList);
  */

  async list() {
    await this.initBoxObj()
    var folderList = null;
    var id = helpers.getParameter(this.req.params[0], "id");
    console.log(190, id);
    if (typeof (id) == 'undefined') {
      folderList = await this.box.list()
    } else {
      folderList = await this.box.list(id)
    }

    this.res.locals.response = folderList
    next(this.req, this.res)
  }

  generateRandomFilename(extension =""){
    const uuidv4 = require('uuid/v4')
    var tmpFileName = process.cwd() + "/" + uuidv4() + extension
    return tmpFileName
  }

  async download(){

    await this.initBoxObj()
    var folderList = null;
    var id = helpers.getParameter(this.req.params[0], "id");

      var tmpFileName = this.generateRandomFilename() + ".tmp";
      
      var file = await this.box.downloadFile(id, tmpFileName)
      setTimeout( () => {

      try {
      var fileContent = fs.readFileSync(file, {encoding:'utf8', flag:'r'});
        console.log(228, fileContent)
      } catch(err){
        console.log(err);
      }
      
      this.res.locals.response = fileContent
      next(this.req, this.res)

      }, 1000)


  
  }

  async copyfolder() {
    var folderId = this.req.body.folderId;
    var parentId = this.req.body.parentId;
    var copyfolderResult = await this.box.copyFolder(folderId, parentId);
    this.res.status(200);
    this.res.json(copyfolderResult);
  }

  async listwebhooks() {
    var webhooks = await this.box.listWebhooks();
    this.res.status(200);
    this.res.json(webhooks);
  }

  async createwebhook() {
    var webhooks = await this.box.createWebhook(this.req.body.folderId);
    this.res.status(200);
    this.res.json(webhooks);
  }

  async getwebhook() {
    var webhooks = await this.box.getWebhook(this.req.body.webhookId);
    this.res.status(200);
    this.res.json(webhooks); 
  }

  async delwebhook() {
    var webhooks = await this.box.getWebhook(this.req.body.webhookId);
    this.res.status(200);
    this.res.json(webhooks); 
  }

  async createweblink(){

  }

  async normalizeFilenames(){

      var folderId = this.req.body.folderId;
      var filenames = await this.box.normalizeFilenames(folderId);

      //   var filenames = [];
      // for(var fileObj of allFiles.entries){
      //   //console.log(file);
      //   var file = fileObj.name;
      //   var firstUnderscore = voca.indexOf(file, "_");
      //   var lastUnderscore = voca.indexOf(file, "_");
      //   var cameraSubstrPos = voca.indexOf(file, "camera-");
      //   if(cameraSubstrPos == -1){
      //           continue;
      //   }

      //   var partSubstringPos = voca.indexOf(file, "part-");
      //   if(partSubstringPos == -1){
      //           continue;
      //   }

      //   var dateStart = voca.indexOf(file, "-", partSubstringPos);
      //   var filenameComponent = voca.substring(file, cameraSubstrPos, partSubstringPos + 6);

      //   if(filenames.indexOf(filenameComponent + "-Take 1") == -1){
      //           filenameComponent += "-Take 1";
      //   } else {
      //           var instances = 1;
      //           for(var tmp of filenames){
      //                   if(voca.indexOf(tmp, filenameComponent) != -1){
      //                           instances++;
      //                   }
      //           }
      //           filenameComponent += "-Take " + String(instances);
      //   }

      //   filenames.push(filenameComponent);

      //   await this.box.renameFile(fileObj.id, filenameComponent)
      // }

      this.res.status(200);
      this.res.json(filenames);
  }

  async removecollaboration() {
    // Removed the collaboration
    // var email = this.req.body.email;
    // var folderId = this.req.body.folderId;

    // var collaboration = await this.client.collaborations.createWithUserEmail(email, folderId, this.client.collaborationRoles.EDITOR)
    // this.res.status(200);
    // this.res.json(collaboration);
  }

  async publish() {

  }

  async share() {

  }

  /* These functions are intended to support the iOS app */

  // The first step is to create an upload session
  async createUploadSession(){
    // file name
    // file size
    // folder id
    
    // /files/upload_sessions

  }

  async partcompleted() {


    // We have an uploaded part that's been completed
    console.log("Write code to update the array of the associated id")
    console.log(129, this.req.body)
    this.res.locals.response = {
      "body": this.req.body
    }
    var query = {
      _id: mongoose.Types.ObjectId(this.req.body._id),
      'parts.chunkOffset': this.req.body.part.offset
    }
    var update = {
      $set: {
        'parts.$.partId': this.req.body.part.partId,
        'parts.$.uploaded': true,
        'parts.$.sha1': this.req.body.part.sha1,
        'parts.$.size': this.req.body.part.size
      }
    }
    var filters = {
      multi: false
    }
    console.log(130, query, update, filters)
    var result = await mongoose.connection.db.collection('uploads')
      .update(query, update, filters);
    console.log(131, result);
    this.res.status(200)
    this.res.json(this.req.body);

  }

  async removePendingUploadRecord(){

    var query = {
      filename: this.req.body.filename
    }

    var result = await mongoose.connection.db.collection('uploads')
      .remove(query, {multi: true});


    this.res.status(200)
    this.res.json(query);
    
  }

  async committed() {
    this.res.locals.response = {
      "body": this.req.body
    }
    var query = {
      _id: mongoose.Types.ObjectId(this.req.body._id)
    }
    var update = {
      $set: {
        'committed': true
      }
    }
    var filters = {
      multi: false
    }
    console.log(130, query, update, filters)
    var result = await mongoose.connection.db.collection('uploads')
      .update(query, update, filters);
    console.log(131, result);
    this.res.status(200)
    this.res.json(this.req.body);
    
  }

  // next(req, res){
  //   var defaultResponseObject = helpers.defaultResponseObject(res.locals.datasource)
  //   defaultResponseObject[res.locals.datasource] = res.locals.response;
  //   defaultResponseObject["box"] = res.locals.response
  //   res.status(200);
  //   res.json(defaultResponseObject);
  // }
  async iterate(){
    var folderList = null;
    var id = helpers.getParameter(this.req.params[0], "id");
    //console.log(id);
   if(typeof(id) == 'undefined'){
      folderList = await this.box.list()
    } else {
    folderList = await this.box.list(id)
   }
   if(!folderList.entries){
     this.res.status()
     this.res.json({error:"no folders"});
     return
   }
   
   var arr={total:0,folders:[]}
   for(let l of folderList.entries){
     var a=await this.box.iterate(l.id)
     arr.folders.push({parent:l,child:a[0]});
     
   }
   var cnt=0
   arr.folders.forEach(element => {
     cnt+=element.child.total_count+1
     
   });
   arr.total=cnt;
    this.res.status(200);

    this.res.json(arr);
    //this.res.json({"test":true})
  }
}

function next(req, res) {
  var defaultResponseObject = helpers.defaultResponseObject("box")
  defaultResponseObject["box"] = res.locals.response;
  //defaultResponseObject["datasource"] = res.locals.datasource
  res.status(200);
  res.json(defaultResponseObject);
}

function routeDataSource(req, res, next) {

  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  var endofurl = fullUrl.indexOf("?");
  if (endofurl != -1) {
    fullUrl = fullUrl.substring(0, endofurl);
  }

  var action = helpers.getParameter(fullUrl, "boxredirect");

  if (typeof action == 'undefined') {
    action = helpers.getParameter(fullUrl, "box");
  }

  var Action = new BoxIntegration(req, res, next);
  var evalCode = "Action." + action + "()";

  try {
    eval(evalCode);
  } catch (err) {
    var desc = {
      raw: {
        message: "This method is not defined"
      }
    }
  }
}

// boxredirect is without auth
// box is with auth

var methods = Object.getOwnPropertyNames(BoxIntegration.prototype);
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

var routestr = `/authorize/`;
router.all(routestr, routeDataSource);

var authenticated = `/authenticated/`;
router.all(authenticated, routeDataSource);

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router;