/*
    This file is the workhorse of our App.  It implements and handles many functions from the frontend.

    The Actions class allows the developer to quickly and easily create new API endpoints.  All of the 
    user data is automatically provided, and database / scoping and permissions is handled in the background
    to ensure that only the data the user is authorized for they have access to.

    Note that there are no restrictions on the developer manually calling database functions, and if they do this
    then the built-in access restrictions are functionally being overwritten. 

    URL Pattern
    ===========

    https://app.contentbounty.com/v1.0/api/actions/datasource/bounties/action/claim

    https://app.contentbounty.com/v1.0/api/ == BASE URL
    /actions/ == express routing
    /datasource/bounties/ == which mongo collection we are accessing in this call
    /action/claim == a URL parameter specifying which function to call

    All the developer needs to do is create a new function at the bottom of the class,
    async claim() { } and they can begin implementing their needed functionality immediately

    No additional work is required -- they can call the new endpoint immediately.            

    TO DO
    =====

    Break up the file into smaller classes primarily for code organization purposes.

*/


const Downloader = require("nodejs-file-downloader");
var express = require("express");
var router = express.Router();
var Mongo = require("@classes/mongo");
var mongoose = require("mongoose");
var Model = mongoose.model("Stripe");
var helpers = require("@classes/helpers");
var validation = require("@classes/validation");
var voca = require("voca");
var bounties = require("@classes/bounties");
var btoa = require("btoa");
const util = require("util");
var Box = require("@classes/integrations/box/box.js");
var moment = require('moment');
var actions = ["box", "claim", "submit", "reject", "redo"];
var Communication = require("@classes/communication.js")
var Financials = require("@classes/financials.js")
var fs = require('fs');
const http = require('http'); // or 'https' for https:// URLs
const https = require('https');
var Gmail = require("@classes/gmail.js")
const axios = require('axios');
var PizZip = require('pizzip');
var Docxtemplater = require('docxtemplater');
var path = require('path');
var drive = require("@classes/integrations/google/drive/drive.js")
//const timers = require('timers-promises');
const timers = require('node:timers/promises');
var templates = require("@classes/templates.js");
var gdrive = require("@classes/integrations/google/drive/drive.js");

function routeDataSource(req, res, next) {
  var action = req.params["action"];
  action = voca.replace(action, " ", "");

  req.body = identifyObjectIds(req.body)

  var Action = new Actions(req, res, next);
  var evalCode = "Action." + action + "()";

  try {
    eval(evalCode);
  } catch (err) {
    var desc = {
      raw: {
        message: "This method is not defined",
      },
    };
    Action.error(desc);
  }
}

class Actions {
  constructor(req, res, next) {
    this.className = "actions";
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    this.modelName = voca.capitalize(req.params.datasource);
    this.model = mongoose.model(this.modelName);
    this.db = new Mongo(this.model, res.locals.user, res);
  }

  output(Obj) {
    var defaultResponse = helpers.defaultResponseObject(this.className);
    defaultResponse[this.className] = Obj;
    this.res.status(200);
    this.res.json(defaultResponse);
  }

  error(err) {
    var defaultErrorResponse = helpers.defaultErrorResponseObject();
    //console.log(263, err);
    if (err.raw.message != null) {
      defaultErrorResponse.Error = 33000;
      defaultErrorResponse.ErrorDetails.Error = 33000;
      defaultErrorResponse.ErrorDetails.Description = err.raw.message;
    }
    if(err.raw.extraInfo != null){
      defaultErrorResponse.ErrorDetails.extraInfo = { ... err.raw.extraInfo }
    }

    this.res.status(500);
    this.res.json(defaultErrorResponse);
  }

  /* Add your custom action functions here */

  // async claim() {
  //   //console.log(69, this.req.params)
  //   this.user.bIsBusy = !this.user.bIsBusy;
  //   await this.user.save();
  //   var busy = "not on a bounty";
  //   if(this.user.bIsBusy)
  //     busy = "working on a bounty";

  //   var msg = `The user is ${busy}`
  //   this.output({message:msg});
  // }

  test905() {
    // Do stuff here, then report the results
    this.output({ message: "Test is working" });
  }

  async lookupfolder(){
      var adminModel = mongoose.model("User");
      var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});
      //console.log(90, "actions.js")
      box = new Box(adminUser)
      return this.output( { result: await box.lookupFolderIdIfNotExistsCreate(this.req.body.folderName,  this.req.body.parent)})

      var box = new Box()
      var lookupResultId = await box.lookupFolderId(this.req.body.folderName, false, this.req.body.parent)

      //console.log(92, lookupResultId)
      if(lookupResultId != null){
        return this.output( { result: lookupResultId } )
      }


      var folderName = this.req.body.folderName;
      var folderExists = await box.checkIfFolderExists(this.req.body.folderName, this.req.parent);

      if(folderExists != false){
        var folderData = await box.client.folders.get(folderExists)
        var upsert = await box.findAndUpsertFolder(folderName, folderData)
        return this.output( {result: folderData })
      }

      //console.log(111, folderExists)
      // Check if the parent folder exists
      var parentFolderExists = await box.checkIfFolderExists(this.req.body.folderName, this.req.body.parent, true);

      if(parentFolderExists == false){
        return this.output( { result: "Parent Folder Does Not Exist - we end here" } ) 
      }

      // Make sure the parent folder info is in our database for faster access to this data
      if(parentFolderExists.id != '0')
        await box.findAndUpsertFolder(parentFolderExists.name, parentFolderExists)

      // The parent folder exists, but the folder itself doesn't exist in box.  Let's created it.
      try {
        var folderInfo = await box.client.folders.create(this.req.body.parent, folderName);
      } catch(err){
        return this.output( { result: err} )
      }

      if(parentFolderExists.id != '0')
        await box.findAndUpsertFolder(folderName, folderInfo)

      //await box.findAndUpsertFolder(folderName, folderInfo)

      return this.output( { result: folderInfo } ) 
  }

  budget() {
    // Do budget stuff here, then report the results
    this.output({ message: "Budget is working" });
  }

  suspend() {
    // You would do whatever you want in the backend
    // And you would send wahtever you want to the frontend
    this.output({ message: "Suspend is sending data back to the frontend" });
  }

  test() {
    this.output({ message: "Test is working" });
  }

  test1() {
    this.output({ message: "Test1 is working" });
  }

  change() {
    this.output({ message: "Do something and send data back" });
  }

  keywords() {
    var response = {
      brand_name: "Too Cute For Me",
      message: "Keywords is working",
    };

    this.output({
      message: "Keywords is working",
      brand_name: this.req.body.brand_name,
      brand_id: this.req.params["id"]
    });
  }

  products() {
    this.output({
      message: "Products is working",
      brand_name: this.req.body.brand_name,
    });
  }

  links() {
    this.output({
      message: "Links is working",
      brand_name: this.req.body.brand_name,
    });
  }

  prompts() {
    var response = {
      brand_name: "Too Cute For Me",
      message: "Keywords is working",
    };

    this.output({
      message: "Keywords is working",
      brand_name: this.req.body.brand_name,
    });
  }

  titles() {
    var response = {
      brand_name: "Too Cute For Me",
      message: "Keywords is working",
    };

    this.output({
      message: "Keywords is working",
      brand_name: this.req.body.brand_name,
    });
  }

  testbutton() {
    this.output({"test": "new test"});
  }

  async email() {

    // Let's get the associated emails
    var query = {
      owner: this.user.accountId
    }

    var emailsObj = await mongoose.connection.db
        .collection("gmails")
        .find(query, { "projection": {email:1, _id:0} }).toArray()

    //console.log(238, emailsObj);

    this.output({ message: "Email is working", user: this.user, "emails":emailsObj });

  }

  text() {
    this.output({ message: "I just changed this", user: this.user });
  }

  async edit(){
    try {
      var existing = this.user.temporary_storage.test;
    } catch (err) {
      this.user["temporary_storage"] = { test: 0 };
      await this.user.save();
      this.output({ message: this.user.temporary_storage, user: this.user });
      return;
    }
    var t = this.user.temporary_storage["test"];
    t = t + 5;

    this.user.temporary_storage["test"] = t;
    this.user.markModified("temporary_storage");
    await this.user.save();

    this.output({
      message: this.user.temporary_storage["test"],
      user: this.user,
      content_type: this.req.body.content_type,
      bounty: this.req.body,
    });
  }
  async add() {

    try {
      var existing = this.user.temporary_storage.test;
    } catch (err) {
      this.user["temporary_storage"] = { test: 0 };
      await this.user.save();
      this.output({ message: this.user.temporary_storage, user: this.user });
      return;
    }
    var t = this.user.temporary_storage["test"];
    t = t + 5;

    this.user.temporary_storage["test"] = t;
    this.user.markModified("temporary_storage");
    await this.user.save();

    this.output({
      message: this.user.temporary_storage["test"],
      user: this.user,
      content_type: this.req.body.content_type,
      bounty: this.req.body,
    });
  }

  async startover() {
    //console.log(69, this.req.params);
    this.user.temporary_storage["test"] = 0;
    this.user.markModified("temporary_storage");
    await this.user.save();
    this.output({ message: 0 });
  }

  async bountiesfromkeywords(){

    var Bounty = new bounties(this.req.body, this.db);

    //console.log(267, this.req.body);

    var titles = Bounty.createFromUnusedKeywords(
      this.user, 
      this.req.body.brand_name, 
      this.req.body.frequency, 
      this.req.body.starting_day,
      this.req.body.process,
      this.req.body.content_type,
      (brand_id) => {
        this.keywordtofile(brand_id)  
      }
      
      );

    this.res.status(200);
    this.res.json({"working":titles});


  }

  async singlebounty(){

    // var Bounty = new bounties(this.req.body, this.db);

    // //console.log(267, this.req.body);

    // var titles = Bounty.createFromUnusedKeywords(
    //   this.user, 
    //   this.req.body.brand_name, 
    //   "once", 
    //   this.req.body.starting_day,
    //   this.req.body.process);

    var model = mongoose.model("Bounty");
    var db = new Mongo(model, this.user);
    var Bounty = new bounties(this.req.body, db, this.user);

       var brand_name = this.req.body.brand_name;
    var brand_id = this.req.body.brand_id;

    var result = await Bounty.createSingleUseBounty(this.req.body.content_type, this.req.body.brand_name, this.req.body.process, this.req.body.brand_id)

    this.res.status(200);
    this.res.json(result);

  }

  async linksfromselectedkeywords(){

    var Bounty = new bounties(this.req.body, this.db);

    ////console.log(267, this.req.body);

    var titles = Bounty.createLinkCampaignFromSelectedKeywords(
      this.user, 
      this.req.body.brand_name, 
      this.req.body.frequency, 
      this.req.body.starting_day,
      this.req.body.process,
      this.req.body.content_type);

    this.res.status(200);
    this.res.json({"working":true});


  }

  async linksfromselectedpages(){

    var Bounty = new bounties(this.req.body, this.db);

    ////console.log(267, this.req.body);

    var titles = Bounty.createLinkCampaignFromSelectedPages(
      this.user, 
      this.req.body.brand_name, 
      this.req.body.frequency, 
      this.req.body.starting_day,
      this.req.body.process,
      this.req.body.content_type);

    this.res.status(200);
    this.res.json({"working":true});


  }
  // async createbounties() {
  //   var Bounty = new bounties(this.req.body, this.db);
  //   await Bounty.createBounties(this.user);
  //   var batch = Bounty.batch;
  //   var result = {
  //     batch: batch,
  //     url:
  //       "/api/datasource/bounty/max_records/10/filter/" +
  //       btoa(JSON.stringify({ batch: batch })),
  //   };
  //   // //console.log(158, "Create bounties here");
  //   // //console.log(160, this.req.body);
  //   this.output(result);
  // }

  // Experimental code to increase how long it takes to make bounties, as well as implement a few other changes.
  // See code commented out above to restore original
  async createbounties() {
    await this.createbountiesfast()
  }

  async createimpromptubounty(){
    await this.createbountiesfast(true)
  }

  async createbountiesfast(impromptu =false) {


    var Bounty = new bounties(this.req.body, this.db);
    var bounty = await Bounty.createBountiesFast(this.user, impromptu);
    var batch = Bounty.batch;
    var result = {
      batch: batch,
      bounties: bounty,
      url:
        "/api/datasource/bounty/max_records/10/filter/" +
        btoa(JSON.stringify({ batch: batch })),
        error: 0
    };

    if(bounty == false){
      result = {
        error:1,
        "msg":"Unable to create bounties. If you're in development mode made sure box is enabled"
      }
    }
    // //console.log(158, "Create bounties here");
    // //console.log(160, this.req.body);
    this.output(result);
  }

  async createtestbounty(){

    var Bounty = new bounties(this.req.body, this.db);
    var res = Bounty.createTestBounty(this.req.body.brand_name)
    this.output(res);
  }

  async getBrandEmails(){

    var search = { process: { $elemMatch: { refDocId: this.req.body.refDocId} } };

    var brand_id = await mongoose.connection.db
        .collection("bounties")
        .findOne(search, {_id:1,created_by:1,owner:1,modified_by:1});

    //console.log(445, brand_id, search);

    if(brand_id == null){
      //return [];
    }

    var emailsObj = await mongoose.connection.db
        .collection("users")
        .find({ $or: [{owner:mongoose.Types.ObjectId(brand_id.owner)}, { accountId:mongoose.Types.ObjectId(brand_id.owner)}]}, {projection: {"email":1,_id:0}}).toArray()
    
    var emails = []
    for(var i = 0; i < emailsObj.length; i++){
      emails.push(emailsObj[i].email)
    }
    return emails;
  }

  async undocomplete() {
    // This reverts a bounty to "unclaimed" status
    this.output({"result":"worked"})
  }


  async claim() {

    //console.log(199, "Claim Called", this.req.body);

    //this.req.body.completion_order

    var bounty_id = this.req.params["id"];

    var bounty = await mongoose.connection.db
        .collection("bounties")
        .findOne({_id: mongoose.Types.ObjectId(bounty_id)}, {projection: {"bountyFolderSharedLink":1, _id:0, "process":1, "brand_name":1, "brand_id":1, "localFolder":1 } });


    // 
    //console.log(460, bounty)

    var brand_name = bounty["brand_name"];
    var bounty_folder_shared_link = bounty["bountyFolderSharedLink"];

    // Take a look at this users pending bounties
    var pendingBounties = this.user.pendingBounties;
    var maxBountiesCount = this.user.maxBountiesCount;

    // if(this.user.pendingBountiesCount > maxBountiesCount){
    //     this.output({"result":maxBountiesCount, "msg":`You cannot claim more than ${maxBountiesCount} Bounties at a time.  Bounties are designed to be claimed and worked on when you are ready to sit down and complete the work.  Email adam@contentbounty.com to request an increase`})
    //     return;
    // }

    var attachmentsToSend = await this.buildTemplatesAndEmail(this.req.params["id"]);

    var refDocId = this.req.body.refDocId;

    var maxPendingBountiesValue = this.user.maxPendingBountiesValue;
    var valueOfThisBounty = parseFloat(
      voca.replace(this.req.body.bounty, "$", "")
    );
    if(Number.isNaN(valueOfThisBounty)){
      valueOfThisBounty = 35
    }

    var emails = await this.getBrandEmails();


    var tmpFileName = await this.exportExcel({
      "bounty_id": mongoose.Types.ObjectId(bounty_id)
    }, "Keyword", "keywords")


    this.user.pendingBountiesCount++;
    this.user.pendingBounties += valueOfThisBounty;
    await this.user.save();

    if(typeof refDocId == 'undefined'){
      // There was a problem updating or creating this bounty.
      // This really shouldn't happen .... let's return an error code. 
      //console.log(341, "no refDocId -- big error");
    }

    var query = {
      "process.refDocId":refDocId
    };

    var update = {
      $set: {
        "pipeline":`${this.req.body.name} - in progress`,
        "process.$[elem].bStatus": false,
        "process.$[elem].pipeline": this.user._id,
        "process.$[elem].bounty": valueOfThisBounty
      },
    };

    var filters = {
      multi: false,
      arrayFilters: [
        { "elem.completion_order": { $eq: this.req.body.completion_order } },
      ],
    };

    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update, filters);
    } catch (err) {
    }

    // I'm know this is bad codeing...but I just need it to work
      var update = {
        $set: {
          "process.$[elem].friendlyFirstName": this.user.first_name,
          "process.$[elem].friendlyLastName": this.user.last_name,
          "process.$[elem].claimedTimestamp": moment.now()
        },
      };

      var filters = {
        multi: false,
        arrayFilters: [
          { "elem.completion_order": { $eq: this.req.body.completion_order } },
        ],
      };

      try {
        var result = await mongoose.connection.db
          .collection(this.model.collection.collectionName)
          .updateOne(query, update, filters);
      } catch (err) {
      }


   ////console.log(553,  util.inspect(query, false, null, true /* enable colors */))
     //util.inspect(update, false, null, true /* enable colors */), 
     //util.inspect(filters, false, null, true /* enable colors */), result)
    // Share this folder with this user

    // Find all keyword and related data
    var keywordQuery = { "bounty_id": mongoose.Types.ObjectId(bounty_id) }
    var keywords = await mongoose.connection.db
      .collection("keywords")
      .find(keywordQuery).toArray();

      //console.log(601, keywords);
      var keywordsAr = [];
      for(var keyword of keywords){
        keywordsAr.push(keyword.Keyword);
      }

      var localDir = voca.indexOf(bounty.localFolder, "/var/www/");
      var localUrl = "https://www.contentbounty.com/" + voca.substr(bounty.localFolder, localDir+9) + "/";

      //console.log(616, this.req.body.completion_order);
      if(this.req.body.completion_order == 1){

        // var msg = {
        //     "blocks": [
        //       {
        //         "type": "section",
        //         "text": {
        //           "type": "plain_text",
        //           "text": `${bounty.brand_name}: A bounty has been claimed for the ${this.req.body.name} step for keywords: ${keywordsAr.toString()}`,
        //           "emoji": true
        //         }
        //       },
        //       {
        //         "type": "section",
        //         "text": {
        //           "type": "mrkdwn",
        //           "text": "If you have images you want used for this bounty, you should upload them now."
        //         },
        //         "accessory": {
        //           "type": "button",
        //           "text": {
        //             "type": "plain_text",
        //             "text": "Upload Images",
        //             "emoji": true
        //           },
        //           "value": "images-123",
        //           "url": localUrl,
        //           "action_id": "button-action"
        //         }
        //       }
        //     ]
        //   }
        var msg = `${bounty.brand_name}: A bounty has been claimed for the ${this.req.body.name} step for keywords: ${keywordsAr.toString()}`
          this.notifySlack(bounty.brand_id, msg)
      } else {
         this.notifySlack(bounty.brand_id, `${bounty.brand_name}: A bounty has been claimed for the ${this.req.body.name} step for keywords: ${keywordsAr.toString()}`)        
      }
    

    this.output({ result: true });

    var emailTo = this.user.email;
    var subject = `${brand_name}: You have claimed a $${valueOfThisBounty} '${this.req.body.name}' Bounty` ;
    //var body = ``

    var body = `If you have any questions, please email the Publisher directly:<br><h1>You can do a 'reply all' to this email, or send an email to ${emails.toString()}</h1>`

    body += `<br><br><p>You can access all files here ${bounty_folder_shared_link}</p>`

    // for(var i = 0; i < emails.length; i++){
    //   if(i == 0){
    //     questions += "<br"
    //   }

    //   questions = questions + " " + emails[i] + "<br>"
    // }

    //console.log(582, body);

    emails.push("admin@contentbounty.com")

    var filePath = tmpFileName;
    var fileCid = 'keywords'
    var fileName = 'keywords.xlsx'
    var attachment = [filePath, fileCid, fileName]

    await this.shareFolder(bounty_id, emailTo);

    if(tmpFileName == false)
      attachment = null
    try {
      await Communication.sendSupportEmail(emailTo, subject, body, emails, attachment)  
    } catch(err){
      //console.log(390, "Unable to send support email")
    }
    
  }

  async automaticSlackNotification(){
    
  }

  /* This is for the mobile app where the only piece of information we have is the folder id */
  async notifySlackUsingFolderId(){
    var folderId = this.req.body["remoteFolderId"];
    //console.log(folderId);

    var msg = this.req.body.msg;
    var brand_id = await mongoose.connection.db
          .collection("bounties")
          .findOne({folderId: folderId} );
          //console.log(brand_id, folderId, msg);
          //this.res.status(200);
          //this.res.json(this.req.body);

      try {
        await this.notifyClientSlack(brand_id.brand_id, msg);
      } catch(err){
        console.log(755, "Unable to notify slack");
      }

      this.res.status(200);
      this.res.json(this.req.body);
  }

  async notifySlack(brand_id =null, msg =null){
    if(process.env.LOCAL == "true"){
      //return;
    }

    if(brand_id == null){
      brand_id = this.req.body.brand_id;
    }

    if(msg == null){
      msg = this.req.body.msg;
    }
    
    // https://hooks.zapier.com/hooks/catch/11365366/b8hvy7r/
    
    var cb_zapier_webhook = process.env.CB_ZAPIER

    var zapier_url = await mongoose.connection.db
          .collection("brands")
          .findOne({_id: mongoose.Types.ObjectId(brand_id)}, {projection: {"zapier_webhook_url":1, "notify_all_events" : 1 } });



    var userFirstName = this.user.first_name;
    var userLastName = this.user.last_name;
    // zapier_url.zapier_webhook_url

    //console.log(722, zapier_url);

    var payload = {}
    if(typeof msg == 'object'){
      payload = msg;
    } else {
       payload = { "text": msg + ` by ${userFirstName} ${userLastName}` }
    }

    //console.log(729, payload);

    var data = await axios.post(cb_zapier_webhook, payload);

    try {
    if(zapier_url.notify_all_events == true){
      this.notifyClientSlack(brand_id, msg)
    }} catch(err){
      
    }

  }

  async notifyClientSlack(brand_id, msg){
    // if(process.env.LOCAL == "true"){
    //   return;
    // }
    // https://hooks.zapier.com/hooks/catch/11365366/b8hvy7r/
    
    var cb_zapier_webhook = await mongoose.connection.db
          .collection("brands")
          .findOne({_id: mongoose.Types.ObjectId(brand_id)}, {projection: {"zapier_webhook_url":1 } });

    // .findOne returns null if no match is found
    if(cb_zapier_webhook == null){
      return;
    }

    var userFirstName = this.user.first_name;
    var userLastName = this.user.last_name;
    // zapier_url.zapier_webhook_url

    //console.log(8101, msg);

    var payload = {}
    if(typeof msg == 'object'){
      payload = msg;
    } else {
       payload = { "text": msg + ` by ${userFirstName} ${userLastName}` }
    }

    ////console.log(810,  { "text": msg + ` by ${userFirstName} ${userLastName}` })

    var data = await axios.post(cb_zapier_webhook.zapier_webhook_url, payload);

   
  }

  generateRandomFilename(extension =""){
    const uuidv4 = require('uuid/v4')
    var tmpFileName = process.cwd() + "/" + uuidv4() + extension
    return tmpFileName
  }

  async testtemplate(){

    var filename = "./Info Content [Article Template].docx"
    var tmpFileName = this.generateRandomFilename() + "." + "Info Content [Article Template].docx"
    var content = fs.readFileSync(filename, 'binary');
    var zip = new PizZip(content);
    var doc;
      try {
          doc = new Docxtemplater(zip);
      } catch(error) {
          //console.log(516, error);
          return;
      }

      // var keywordData = await mongoose.connection.db
      //   .collection("keywords")
      //   .find({ bounty_id: mongoose.Types.ObjectId(bounty_id) }, {_id:0 }).toArray();

      var keywordData = [
        {
          "Keyword": "Keyword 1",
          "Nested": [
            {
              "Data":"Test 1"
            },
             {
               "Data":"Test 2"
             }
          ]
        },
        {
          "Keyword": "Keyword 2",
          "Nested": [
            {
              "Data":"Test 1"
            },
             {
               "Data":"Test 2"
             }
          ]
        },
        {
          "Keyword": "Keyword 3",
          "Nested": [
            {
              "Data":"Test 1"
            },
             {
               "Data":"Test 2"
             }
          ]
        },
        {
          "Keyword": "Keyword 4",
          "Nested": [
            {
              "Data":"Test 1"
            },
             {
               "Data":"Test 2"
             }
          ]
        }
      ]

      doc.setData({ "list" : keywordData, "word_count":1250 });

      try {
           doc.render()
      } catch (error) {
              //console.log(506, error);
          }

      var buf = doc.getZip().generate({type: 'nodebuffer'});
      fs.writeFileSync(tmpFileName, buf);

      this.output({"result":"worked"})
  }

  async buildTemplatesAndEmail(bounty_id =null){

    //if(process.env.DISABLE_BOX == "true")
    //  return true;

    // First, get all of the files in the bounties template folder
    if(bounty_id == null){
      bounty_id = this.req.params["id"];
    }

    await this.initBoxObj();

    var bounty = await mongoose.connection.db
      .collection("bounties")
      .findOne({ _id: mongoose.Types.ObjectId(bounty_id) });

    var bountyTemplateFolderId = bounty.templateFolderId;
    var bountyFolderId = bounty.folderId;

    try {
      var templateFolderItemsX = await this.box.list(bountyTemplateFolderId)
    } catch(err){
      console.log(505, err);
      this.output({ "error" : 1 });
      return [];
    }

    var entries = [];
    if(typeof templateFolderItemsX.entries != 'undefined' ){
      if(templateFolderItemsX.entries.length > 0){
        for(var entry of templateFolderItemsX.entries){
          console.log(1445, entry.name);
            if(voca.indexOf(entry.name, ".docx") != -1){
              entries.push(entry)
            }
          }
      } else {
        return [];
      }
    }
    
    var templateFolderItems = { "entries" : entries }

    var googleScriptId = bounty["bountyScript"];
    
	console.log(5000, templateFolderItems);

    var originalFileNames = []
    for(var i = 0; i < templateFolderItems.entries.length; i++){
      var entry = templateFolderItems.entries[i]
      var fileId = entry.id;
      originalFileNames.push(entry.name)
      var tmpFileName = bounty.localFolder + "/" + entry.name;

      var localFolder = bounty.localFolder;
      if(process.env.LOCAL == "true"){
        //tmpFileName = uuidv4() + "." + entry.name;

        const uuidv4 = require('uuid/v4')
        tmpFileName = process.cwd() + "/" + uuidv4() + "." + entry.name;
        localFolder = process.cwd();
      }

      console.log(809, tmpFileName);

      if(voca.indexOf(tmpFileName, ".docx") == -1){
            // We don't have a .docx file...  
            continue;
      }



      await this.box.downloadFile(fileId, tmpFileName)
      originalFileNames.push(tmpFileName);

      setTimeout( async (tmpFileName, fileId, fileName) => {

          //Load the docx file as a binary

	  
      console.log(5001, "Reading File", tmpFileName);
          var content = fs.readFileSync(tmpFileName, 'binary');

          var zip = new PizZip(content);

          var doc;

          try {
              doc = new Docxtemplater(zip, { paragraphLoop: true });
          } catch(error) {
              // Catch compilation errors (errors caused by the compilation of the template : misplaced tags)
              //errorHandler(error);
              console.log(516, error);
              return;
          }

          //set the templateVariables
              var keywordData = await mongoose.connection.db
                  .collection("keywords")
                  .find({ bounty_id: mongoose.Types.ObjectId(bounty_id) }, {_id:0 }).toArray();


          var transformedData = keywordData[0];
          if(typeof transformedData == 'undefined'){
            transformedData = {}
          }

          //var Keyword = transformedData.Keyword;    


          try {
            delete transformedData._id
            delete transformedData.brand_id;
            delete transformedData.created_by;
            delete transformedData.modified_by;
            delete transformedData.owner;
            delete transformedData.modifiedAt;
            delete transformedData.selected;
            delete transformedData.bKeywordDeployed;
            delete transformedData.bounty_id;
            delete transformedData.batch;
          } catch(err){
            // No keyword object exists here...
          }

          var bountyKeywords = null, bountyTitles = null, bountyPrompts =null;

         if(typeof transformedData["Keyword"] == 'undefined'){
           transformedData["Keyword"] = [];
         }

         if(typeof transformedData["Prompt"] == 'undefined'){
           transformedData["Prompt"] = [];
         }

         if(typeof transformedData["Title"] == 'undefined'){
           transformedData["Title"] = [];
         }

         if(bounty["keywords"].length > 0){
           if(Array.isArray(bounty["Keyword"])){
             console.log(1057);
             transformedData["Keyword"] = transformedData["keywords"].concat(bounty["keywords"]);
           }
           else{
             console.log(1061);
             transformedData["Keyword"] = bounty["keywords"];
             //transformedData["Keyword"].push(bounty["keywords"]);

           }
         }

         if(bounty["titles"].length > 0){
           if(Array.isArray(bounty["Title"]))
             transformedData["Title"] = transformedData["Title"].concat(bounty["titles"]);
           else{
             transformedData["Title"] = [];
             transformedData["Title"].push(bounty["titles"]);
           }
         }

         if(bounty["prompts"].length > 0){
           if(Array.isArray(bounty["Prompt"]))
             transformedData["Prompt"] = transformedData["Prompt"].concat(bounty["prompts"]);
           else{
             transformedData["Prompt"] = [];
             transformedData["Prompt"].push(bounty["prompts"]);
           }
         }

          var keys = Object.keys(transformedData);

          // console.log(957, keys);
          // console.log(961, transformedData);
          // var obj = {}
          // obj["Keyword"] = []
          // var pos = 0;
          // console.log(962, transformedData[keys[pos]]);
          // for(var p in transformedData[keys[pos]]){

          //   obj["Keyword"][p] = {}
          //   console.log(965, obj);
          //   for(var key of keys){
          //     console.log(966, obj)
          //     console.log(967, key);
          //     console.log(p)
          //     obj["Keyword"][p][key] = transformedData[key][p]
          //   }
          //   pos++;
          // }

          console.log(976, transformedData);

          doc.setData(transformedData);

          try {
              // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
              doc.render()
          }
          catch (error) {
              // Catch rendering errors (errors relating to the rendering of the template : angularParser throws an error)
              //errorHandler(error);
              // there was an error
              console.log(539, error);
          }

          var buf = doc.getZip()
                 .generate({type: 'nodebuffer'});


          var postProcessing = new templates();

          // This is intended for scripts from excel files.  Formats the script in a nice way...
          console.log(849, "Doing post processing", fileName);

          var textFilePath = await postProcessing.postProcessing(buf, entry.name, localFolder);

          fs.writeFileSync(tmpFileName, buf);

              //await box.downloadFile(scriptDocId, tmpScriptName);
                
          // if(textFilePath != null){
          //   setTimeout( async (bountyFolderId, txtFilePath, fileName) => {
          //     var newFileName = fileName;
          //     console.log(1142, txtFilePath, newFileName);
          //     var stream = fs.createReadStream(txtFilePath);
          //     try {
          //       var uploadResult = await this.box.uploadFile(bountyFolderId, newFileName, stream)
          //     } catch(err){
          //       console.log(935, err, uploadResult)
          //     }
          //   }, 2000, bountyFolderId, textFilePath, fileName)
          // }

          // var gdrive = new drive()
          // var uploadedFiles = await gdrive.syncLocalDocumentsWithDrive(localFolder)
          // await this.updateBountyWithGoogleFiles(bounty._id, uploadedFiles);

          setTimeout( async (tmpFileName, fileId, fileName, bountyFolderId, txtFilePath) => {

            var newFileName = "READ ME - " + voca.replaceAll(fileName, "Template", "")

              //var uploadResult = await this.box.uploadFileVersion(fileId, tmpFileName)
              var stream = fs.createReadStream(tmpFileName);
              try {
                var uploadResult = await this.box.uploadFile(bountyFolderId, newFileName, stream)
              } catch(err){
                
              }

              var txtFileName = voca.replaceAll(fileName, "Template", "");
              txtFileName = voca.replaceAll(txtFileName, ".docx", ".txt");

              console.log(924)
              console.log(923, txtFilePath)

              if(txtFilePath != null){
              var stream2 = fs.createReadStream(txtFilePath);
              try {
                var uploadResult = await this.box.uploadFile(bountyFolderId, txtFileName, stream2);
                console.log(930, uploadResult);
              } catch(err){
                  console.log(931, err, "Trying to update file");
                  try {
                    uploadResult = await this.box.uploadFileVersion(bountyFolderId, txtFileName, stream2);
                  } catch(err2){
                    console.log(1184, err, err2);
                  }
                  console.log(1186, uploadResult)
              }
              }

                console.log(5229, entry.name);
                if(entry.name == "script.docx"){
                                console.log(5226, entry.name);
                                console.log(5227, tmpFileName);
                              await timers.setTimeout(2000)
                              var buffer = fs.readFileSync(tmpFileName);
                              var drive = new gdrive();
                                console.log(5228, googleScriptId, tmpFileName, buffer);
                                
                              var res = await drive.updateSmallFile(googleScriptId, buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                        }


              //this.output({ "keywords" : keywordData, "word_count":1250 });
          }, 2000, tmpFileName, fileId, fileName, bountyFolderId, textFilePath)

      }, 2000, tmpFileName, fileId, entry.name)
    }
    
    // Download the template file(s) from box
    // generate a random filename for us to use

    return originalFileNames;

  }

  async shareFolder(bounty_id, email) {
    var adminModel = mongoose.model("User");
    var adminUser = await adminModel.findOne({
      email: "admin@contentbounty.com",
    });

    var box = new Box(adminUser);

    // get folderId
    var folderId = await mongoose.connection.db
      .collection("bounties")
      .findOne({ _id: mongoose.Types.ObjectId(bounty_id) });


      //console.log(1219, "Share Folder Called", folderId, bounty_id);
    ////console.log(278, folderId);
    ////console.log(310, adminUser.email, util.inspect(adminUser.integrations, false, null, true /* enable colors */));
    //console.log(274, email, folderId.folderId);
    ////console.log(310, adminUser.email, util.inspect(box, false, null, true /* enable colors */));
    try {
	var result = await box.createCollaboration(email, folderId.folderId);
    if(result == true){
      //console.log(1226, "Folder shared with", email);
    }} catch(err) { console.log("Already a collaborator") }
  }

  async createFolder(folderName) {
    //console.log(292, "Creating Folder")
    var adminModel = mongoose.model("User");
    var adminUser = await adminModel.findOne({
      email: "admin@contentbounty.com",
    });
    //console.log(450, "actions.js")
    var box = new Box(adminUser);

    try {
    var folderInfo = await box.createFolder(folderName)
    } catch (err){
      //console.log(302, err);
      return null
    }
    return folderInfo
    ////console.log(299, folderInfo);
  }

  // async shareFolder(bounty_id, email, folderId =0) {
  //   var adminModel = mongoose.model("User");
  //   var adminUser = await adminModel.findOne({
  //     email: "admin@contentbounty.com",
  //   });

  //   var box = new Box(adminUser);

  //   // get folderId
  //   if(folderId == 0){
  //   folderId = await mongoose.connection.db
  //     .collection("bounties")
  //     .findOne({ _id: mongoose.Types.ObjectId(bounty_id) });
  //   }

  //   try {
  //     await box.createCollaboration(email, folderId.folderId);
  //   } catch (err) {
  //     //console.log(278, err);
  //   }

  //   //console.log(274, email, folderId.folderId);
  // }

  async chargebountytest(){
    this.output({ test: this.user.financials.balance });
  }

  /*  July 17th 2022 Code Review
   *  by Adam Arthur
   *
   *  Wow this function is fugly, difficult to follow along to.  
   *  It's one of the most important functions in the entire solution
   *  Consider rewriting this for readability and organization.
  */

  async complete(publishing =false) {

    //console.log(875, this.req.body);

    function testForSituationWhereTheCompleteButtonShouldNotHaveBeenClicked(bounty_step){

      if(publishing == true)
        return true;

      //console.log(877, bounty_step);


      if(bounty_step.name == "Publication"){
        return false;
      }

      if(voca.indexOf(bounty_step.name, "Publish") != -1) {
        return false;
      }

      return true;
      
      /// Sometimes, there will be a "publication" option along with a complete option
      /// If the bounty should be published, we don't want the "complete" action taken

     ///     if(!testForRequiredFiles(requiredFiles, fileList)){
     // return 
     

   }

     /*  4/24/22
      *  This function was originally created to enforce the uploading of files, so a step could not be completed
      *  without the required files being uploaded.
      *
      *  This is still potentially useful, but with a shift towards using Google Spreadsheet and Docs, enforcing this
      *  at this stage is problematic, so I am temporarily returning true here.  In the future, I may use other methods
      *  of enforcing compliance, such as checking the file for titles, word count, etc.  But for where we are at right
      *  now we're better of disabling this.  I am not ready to delete the code just yet...
     */
    function testForRequiredFiles(requiredFiles, fileList){
    
      return true;

      if(requiredFiles.length == 0){
        return true;
      }

      //console.log(989, requiredFiles);
      //console.log(872, fileList);

      if(typeof requiredFiles[0] == 'undefined'){
        return true;
      }

      if(typeof requiredFiles != 'undefined')            {
        if(Array.isArray(requiredFiles))            {
          if(fileList.length != 0)        {
            var f = requiredFiles.filter(element => {
             // //console.log(8, element)
              var fileNameParts = element.split(".");
              ////console.log(10, fileNameParts)
              if(fileNameParts.length > 0){
                //console.log(10, fileNameParts)
                var fileName = fileNameParts[0];
                var fileExtension = fileNameParts[1];
              
              // Check if the 
              var result = fileList.some( checkFileName => {
                //console.log(18, checkFileName)
                //console.log(890, fileName)
                //console.log(891, fileExtension)
                if(checkFileName.indexOf(fileName) != -1){
                  if(checkFileName.indexOf(fileExtension) != -1){
                    //console.log(20, "Match Found")
                    return true
                  }
                }
                
                ////console.log(15, fileName, fileExtension, checkFileName)
              } )
              //console.log(27, result)
              return result
              }
            });
            //console.log(35, f)
            if(f.length > 0){
            return true;
            } else {
            return false
            }
            return false;
          } else { return false }
        } else { return false }
      } else { return false }
      return false;
      }

    var bounty_id = this.req.params["id"];

    var refDocId = this.req.body.refDocId;
    // Take a look at this users pending bounties
    var pendingBounties = this.user.pendingBounties;
    var maxBountiesCount = this.user.maxBountiesCount;
    var maxPendingBountiesValue = this.user.maxPendingBountiesValue;
    var valueOfThisBounty = parseInt(
      voca.replace(this.req.body.bounty, "$", "")
    );

    var completion_order = this.req.body.completion_order;

    // SECURITY_FLAG
    // Change getting the brand_name by name to _id of the brand document

    /*
       chargeBrand() is one of the most important financial functions we have
       this is where a brand gets charged real money for a bounty being completed

       chargeBrand will
         1. Create a static transaction record
         2. Deduct the pending_balance by the amount of the bounty,
         3.   If the pending_balance goes negative, it will attempt to recharge the brand account
              if auto-refills are allowed.  If not, it will make all unclaimed bounties inactive
         4. It will return the amount that was deducated from the brand
    */
    // financials.chargeBrand()

    /*
        transferFunds will take the amount that was charged to 
    */


    var search = { process: { $elemMatch: { refDocId: this.req.body.refDocId} } };

    // var brand_id = await mongoose.connection.db
    //     .collection("brands")
    //     .findOne({"brand_name":this.req.body.brand_name}, {_id:1,created_by:1,owner:1,modified_by:1});

    var brand_id = await mongoose.connection.db
        .collection("bounties")
        .findOne(search, {_id:1,created_by:1,owner:1,modified_by:1});

        //console.log(1084, brand_id);
        
    var brand_name = brand_id["brand_name"];
    ////console.log(503, brand_id, {"brand_name":this.req.body.brand_name}, {_id:1,created_by:1,owner:1,modified_by:1})
    
    var bounty_id = this.req.params["id"];

    var bountyLink = await mongoose.connection.db
        .collection("bounties")
        .findOne({_id: mongoose.Types.ObjectId(bounty_id)}, {projection: {"bountyFolderSharedLink":1, "bountyFolderId":1, "process":1, "published_link":1, _id:0 } });

        //console.log(812, bounty_id, bountyLink);
        
    var bounty_process = bountyLink.process;

    var bounty_folder = bountyLink.bountyFolderId

    var adminModel = mongoose.model("User");
    var adminUser = await adminModel.findOne({
      email: "admin@contentbounty.com",
    });

    if(process.env.DISABLE_BOX != "true")
    {
    var box = new Box(adminUser); 
    var listOfFiles = await box.list(bounty_folder);
    // Check that the file we expect is in the folder -- if not, return an error
    //console.log(808, bounty_folder, listOfFiles.entries);
    var fileList = [];
    for(var i = 0; i < listOfFiles.entries.length; i++){
      fileList.push(voca.lowerCase(listOfFiles.entries[i].name))
    }
    // look at the process, see if this step requires a specific file.  If so, check that this file is in the folder
    var requiredFile = bounty_process[this.req.body.completion_order-1].files;
    var requiredFiles = [];
    if(!Array.isArray(requiredFile)){
      requiredFiles.push(requiredFile);
    }
    //console.log(811, requiredFiles)

    if(!testForRequiredFiles(requiredFiles, fileList)){
      return this.output({ result: false, message: `You are required to upload a file or files has ${requiredFiles.toString()} in the name and same extension` }); 
    }

    }

    if(!testForSituationWhereTheCompleteButtonShouldNotHaveBeenClicked(bounty_process[this.req.body.completion_order-1])){
      return this.output({ result: false, message: `This Bounty needs to be 'Published' and not 'Completed'  Please use the 'Publish' button for this bounty` }); 
    }

  //console.log(1992, bounty_process[this.req.body.completion_order-1].name);
       if(bounty_process[this.req.body.completion_order-1].name == "Filming"){
      //await this.initBoxObj();

      var missingFiles = await this.checkForAllRequiredVideoFiles(bounty_id);

  if(missingFiles.length > 0){
      //if(bAllRequiredFilesUploaded == false){

      if(this.req.body.forceComplete == true){

      } else {
        return this.output({ result: false, message: `All required video files have not been uploaded.  You cannot complete this step until all files are uploaded.  Missing Files: ${missingFiles.toString()}` }); 
      }
      

      }
      // Check and see if all iles are present
     // 
      
    }

    var emailsObj = await mongoose.connection.db
        .collection("users")
        .find({ $or: [{owner:mongoose.Types.ObjectId(brand_id.owner)}, { accountId:mongoose.Types.ObjectId(brand_id.owner)}]}, {projection: {"email":1,_id:0}}).toArray()
    
    var emails = []
    for(var i = 0; i < emailsObj.length; i++){
      emails.push(emailsObj[i].email)
    }

    var emailOnCompletion = emails;

    this.user.financials.balance += valueOfThisBounty;
    this.user.pendingBounties -= valueOfThisBounty;
    this.user.pendingBountiesCount -= 1;
    await this.user.save();

    var query = {
      //_id: mongoose.Types.ObjectId(bounty_id),
      "process.refDocId":refDocId
    };

    var update = {
      $set: { "process.$[elem].status": "complete" },
    };

    var filters = {
      multi: false,
      arrayFilters: [{ "elem.pipeline": { $eq: this.user._id } }],
    };

    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update, filters);
    } catch (err) {
      //console.log(243, err);
    }

    var update = {
        $set: {
          "process.$[elem].completedTimestamp": moment.now()
        },
      };

    var filters = {
      multi: false,
      arrayFilters: [{ "elem.pipeline": { $eq: this.user._id } }],
    };

      try {
        var result = await mongoose.connection.db
          .collection(this.model.collection.collectionName)
          .updateOne(query, update, filters);
      } catch (err) {
      }

      //var nextPipeline = 


    // After we 'complete' a step, we need to make the next step in the process available for claiming

    var bounty = this.req.body;



    try {
      var curProcess = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .findOne({"_id": mongoose.Types.ObjectId(bounty_id)}, {projection: {"process":1} });
    } catch (err) {
      //console.log(256, err);
    }

    //console.log(1200, curProcess);
    var currentStep = 1;
    var processName = "";
    var previousStep = "";
    for(var step of curProcess.process){
      
      if(step.status != "complete"){
        currentStep = step.completion_order;
        processName = step.name
        break;
      } else {
        previousStep = step.name;
      }
    }

    update = {
      $set: { "process.$[elem].bStatus": true, "pipeline": processName }
    };

    filters = {
      multi: false,
      arrayFilters: [
        {
          "elem.completion_order": { $eq: currentStep },
        },
      ],
    };

    const stepName = processName;

    if(previousStep == "Filming"){
      await this.initBoxObj();
      // Purposely not using await here -- this can run in the background we don't need the results
      this.box.normalizeFilenames(bounty_folder);
    }

    //console.log(1501, previousStep, stepName);

    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update, filters);
    } catch (err) {
      //console.log(256, err);
    }

    ////console.log(862, query, update, filters, result);

    if(this.checkIfBountyCompleted){
      this.output({ result: true, bountyCompleted: true });  
    } else {
      this.output({ result: true, bountyCompleted: false });  
    }
    
    //console.log(1027, bounty_process, bounty_process[completion_order-1])
    var emailTo = this.user.email;
    var subject = `\uD83D\uDE00 ${brand_id["brand_name"]}: You have completed a $${bounty_process[completion_order-1]["bounty"]} Bounty for ${bounty_process[completion_order-1]["name"]}`
    var body = `You will now be paid for your work.<p>Reminder: if your content does not meet the editorial guidelines, it can be kicked back to you for editing and revision.  You will be required to complete any kicked-back content before we will issue any payouts.`


    emails.push("admin@contentbounty.com");

    try {
      Communication.sendSupportEmail(emailTo, subject, body, emails)
    } catch(err){
      //console.log(573, "Unable to send support email")
    }
    
    // Check if the entire bounty is completed
    var bountyIsFinished = this.checkIfBountyCompleted(completion_order, bounty_process)

    //console.log(1043, bountyLink)

    if(bountyIsFinished){
              var update = {
        $set: {
          "pipeline":"Completed",
          }
        };

        var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update);

          var emailTo = emailOnCompletion[0];
          if(emailOnCompletion.length>1){
            emailOnCompletion.splice(0, 1);
          }
          
          var subject = `\uD83D\uDE00 ${brand_id["brand_name"]}: A Bounty has been completed`;
          var body = `<p>The last step in the process was  ${bounty_process[completion_order-1]["name"]}<br><br>If you selected automatic uploads, the published work is <a href="${bountyLink.published_link}">here</a><br><br>You can access all of files <a href="${bountyLink.bountyFolderSharedLink}">here</a>`
          try {
            Communication.sendSupportEmail(emailTo, subject, body, emailOnCompletion)
          } catch(err){
            //console.log(573, "Unable to send support email")
          }
    }

    if(!bountyIsFinished){
      var nextStep = this.req.body.completion_order + 1;

      //console.log(913, bounty_process, completion_order + 1);
      //console.log(912, bounty_process[completion_order].skills)

      //this.notifyEligibleContractors(bounty_process[completion_order].skills, bounty_process, completion_order, brand_name)

    }

    this.chargebounty(bounty_id, completion_order, bounty_process)

    // Find all keyword and related data
    var keywordQuery = { "bounty_id": mongoose.Types.ObjectId(bounty_id) }
    var keywords = await mongoose.connection.db
      .collection("keywords")
      .find(keywordQuery).toArray();

      //console.log(1338, keywords);
      var keywordsAr = [];
      for(var keyword of keywords){
        keywordsAr.push(keyword.Keyword);
    }

    this.notifySlack(bounty.brand_id, `${bounty.brand_name}: A bounty has been COMPLETED for the ${this.req.body.name} step for keywords: ${keywordsAr.toString()}`)

  }

  /* Charge the brand for the completed bounty */
  chargebounty(bounty_id, completed_step, bounty_process){
    // Create permanent records for billing purposes
    // Create an unpaid invoice for the brand
    // Create an unpaid invoice for the contractor
  }

  checkIfBountyCompleted(completion_order, bounty_process){

    var process_length = bounty_process.length;
    //console.log(905, process_length, bounty_process.length)
    if(process_length == completion_order){
      // This bounty is 100% done -- let's notify the people involced
      return true;
    }
    return false;
  }

  /* This code needs to be audited because it manages a users balance */
  async payout(){
       var payoutAmount = this.user.financials.balance;
       this.user.financials.balance = 0;
       this.user.save();
       var settledAmount = this.user.financials.balance;

       var d = new Date()
       var payout = {
         prevBalance:payoutAmount,
         amt: payoutAmount,
         settledAmount: settledAmount,
         "created" : d,
         "modified": d,
         "owner" : mongoose.Types.ObjectId(this.user._id),
         "created_by":mongoose.Types.ObjectId(this.user._id),
         "modified_by":mongoose.Types.ObjectId(this.user._id)
       }

      var result = await mongoose.connection.db
             .collection('payouts')
             .insert(payout);

      this.output({ balance: this.user.financials.balance });

      var emailTo = this.user.email;
      var subject = "You have Requested A Payout";
      var body = `You have requested a payout in the amount of $${payoutAmount}. Transactions are currently processed manually, and this Payout will be processed shortly.  Automatic payouts are currently in development.`

      var emails = [];
      emails.push("admin@contentbounty.com");
      emails.push("adamarthursandiego@gmail.com");

      try {
        Communication.sendSupportEmail(emailTo, subject, body, emails)
      } catch(err){
        //console.log(573, "Unable to send support email")
      }
  }

  async box() {
    var _box = require("@classes/integrations/box/box.js");
    var Box = new _box();
    var authUrl = await Box.getAuthorizeUrl();
    //console.log(277, authUrl);
    this.res.status(200);
    this.res.send({ authUrl: authUrl });
  }

  balance() {
    var balance = this.user.financials.balance;
    this.output({ balance: balance });
  }

  async updatebounty() {
    var bounty_id = this.req.params["id"];

    ////console.log(1256, this.req.body);

    var query = {
      _id: mongoose.Types.ObjectId(bounty_id),
    };

    for(var i = 0; i < this.req.body.length; i++){
      if(this.req.body[i].inhouse != false){
          this.req.body[i].inhouse = mongoose.Types.ObjectId(this.req.body[i].inhouse)
      }
      if(this.req.body[i].checkin != false){
          this.req.body[i].checkin = mongoose.Types.ObjectId(this.req.body[i].checkin)
      }
    }

    var update = {
      $set: { process: this.req.body },
    };

    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update);
    } catch (err) {
      //console.log(243, err);
    }

    this.output({ working: this.req.body });
  }

  async siteinfo() {
     
     var brand_id = this.req.params["id"];

     var query = {
       "created_by":this.user._id,
       _id:mongoose.Types.ObjectId(brand_id)
     }

     //console.log(552, query)

     var brandModel = mongoose.model("Brand");
     var brandInfo = await brandModel.findOne(query).lean()

     // For the slack integration
     var required_scopes = ['incoming-webhook','commands','chat:write','channels:history','groups:history','im:history','mpim:history','incoming-webhook'];
     var scopeRequestUrl = `https://slack.com/oauth/v2/authorize?scope=${required_scopes.toString()}&client_id=${process.env.SLACK_APP_CLIENT_ID}&redirect_uri=https://app.contentbounty.com/v1.0/api/slack/callback&state=${brandInfo._id}`;
     brandInfo["slack_url"] = scopeRequestUrl;

     this.output(brandInfo);
    // var brandsInfo = {
    //    created_by: mongoose.Types.ObjectId(this.user._id)
    // }
  }


  async getlatestboxaccesstoken(){
    await this.initBoxObj();
    await this.box.list();
    var adminModel = mongoose.model("User");
    var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});
    return this.output( { accessToken: adminUser.integrations.box.tokenStore.accessToken } )
  }


  async initBoxObj(){
    var adminModel = mongoose.model("User");
    var adminUser = await adminModel.findOne({
      email: "admin@contentbounty.com",
    });

    this.box = new Box(adminUser);    
    return this.box;
  }

  /* Bronze status as for this critical function working */

  /*  This function is used to create a new brand identity.
   *
   *  It is accessed in the UI from "authority" accounts by clicking on the navigation
   *  menu "Brand Management" and clickin the "Add Brand" button.
   *
   *  
  */
  async createbrand(){

    //console.log(1158, "createbrand called");

    var adminModel = mongoose.model("User");
    var adminUser = await adminModel.findOne({
      email: "admin@contentbounty.com",
    });

    var box = new Box(adminUser); 
    this.box = box;

    var brand_name = this.req.body.brand_name;
    var folderName = brand_name;

    /// This function creates local file directories on the server where bounty files reside
    this.createbrandlocally(this.user.accountId, brand_name);

    var brandsFolderId = await box.lookupFolderIdIfNotExistsCreate("brands",  '0')
    if(brandsFolderId == false){
      this.output({ result: 700 });
      //console.log(1174, 'returning false')
      return false;
    }

    //console.log(1178, brandsFolderId);

    var accountFolderId = await box.lookupFolderIdIfNotExistsCreate(this.user.accountId, brandsFolderId);
    if(accountFolderId == false){
       this.output({ result: 701 });
       //console.log(1181, 'returning false')
       return false;
    }

    //console.log(1185, brand_name, accountFolderId);

    var brandFolderId = await box.lookupFolderIdIfNotExistsCreate(brand_name, accountFolderId);
    if(!brandFolderId){
       this.output({ result: 699 });
       //console.log(1188, 'returning false')
       return false;
    }

    var brandTemplateFolderId = false;

    var templateFolderExists = await box.checkIfFolderExists("templates", accountFolderId);
    if(templateFolderExists == false){
       var rootTemplateId = await box.lookupFolderIdIfNotExistsCreate("templates", "0");
       if(rootTemplateId == false){
         this.output({ result: 702 });
         //console.log(1199, 'returning false')
         return false;
       }
         var accountTemplateInfo = await box.copyFolder(rootTemplateId, accountFolderId);
         if(!accountTemplateInfo){
           this.output({ result: 703 });
           //console.log(1205, 'returning false')
           return false;
         }
         var accountTemplateFolderId = accountTemplateInfo.id;
         var brandTemplateFolderInfo = await box.copyFolder(accountTemplateFolderId, brandFolderId, {name: `templates-${brand_name}`})
         if(!brandTemplateFolderInfo){
           this.output({ result: 704 });
           //console.log(1212, 'returning false')
           return false;
         }
         brandTemplateFolderId = brandTemplateFolderInfo.id;
    } else {
        var accountTemplateFolderId = await box.lookupFolderIdIfNotExistsCreate("templates", accountFolderId);
        if(!accountTemplateFolderId){
           this.output({ result: 705 });
           //console.log(1220, 'returning false')
           return false;
        }
        var brandTemplateFolderInfo = await box.copyFolder(accountTemplateFolderId, brandFolderId, {name: `templates-${brand_name}`})
        if(!brandTemplateFolderInfo){
           this.output({ result: 706 });
           //console.log(1226, 'returning false')
           return false;
        }
        brandTemplateFolderId = brandTemplateFolderInfo.id;
    }

    var brandFolderSharedLink = await box.createSharedFolderAndUpdateDatabase(brandFolderId);
    if(!brandFolderSharedLink){
           this.output({ result: 707 });
           //console.log(1235, 'returning false')
           return false;      
    }

    var brandTemplateFolderSharedLink = await box.createSharedFolderAndUpdateDatabase(brandTemplateFolderInfo.id)
    if(!brandTemplateFolderSharedLink){
           this.output({ result: 708 });
           //console.log(1242, 'returning false')
           return false;      
    }
    
    //console.log(1929, accountTemplateFolderId);
    

    var update = {
      $set: {
        "brandTemplateFolderId":brandTemplateFolderId,
        "brandFolderId":brandFolderId,
        "brandFolderSharedLink":brandFolderSharedLink.shared_link.url,
        "brandTemplateFolderSharedLink":brandTemplateFolderSharedLink.shared_link.url
      }
    }

        //var brandTemplateFolderId = brandTemplateFolderInfo.id;
    await box.createCollaboration(this.user.email, brandTemplateFolderId);
    await box.createCollaboration(this.user.email, brandFolderId);
    
    var doc = await mongoose.connection.db.collection("brands").update(
      {"brand_name":brand_name, "owner":mongoose.Types.ObjectId(this.user.accountId)},
      update)

    var fs = require('fs');
    var dir = `${process.env.BASE_DIR}/brands/${this.user.accountId}/${voca.replaceAll(voca.lowerCase(brand_name), " ", "_")}`;
    //console.log(1403, dir);
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    try {
      if(doc.result.nModified == 1){
        this.output({ result: {
        "brandTemplateFolderId":brandTemplateFolderId,
        "brandFolderId":brandFolderId,
        "brandFolderSharedLink":brandFolderSharedLink.shared_link.url,
        "brandTemplateFolderSharedLink":brandTemplateFolderSharedLink.shared_link.url
      }});  

        //console.log(1276, "Setting Timeout")

        setTimeout( () => {
          //console.log(1277, "Creating New Site Map")
          this.createSiteMapBounty(brand_name)
        }, 2*60*1000)
        return; 
      } else {
        this.output({ result: 709 });
        return;
      }
    } catch(err){
      //console.log(815, err);
    }

    //console.log(821);
    this.output({ result: 709 });

  }

  /*
      The purpose of 'track' is to create a database record whose primary
      purpose is to track time as associated with any other distinct 
      document.
  */

  isEven(n) {
   return n % 2 == 0;
}

sanitizeString(stringToSanitize){
  return stringToSanitize.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
}

async createbrandlocally(owner_id, brand_name){

  //console.log(1453, owner_id, brand_name);

      const path = require("path")
      var copyRecursiveSync = function(src, dest) {
      var exists = fs.existsSync(src);
      var stats = exists && fs.statSync(src);
      var isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        try {
          fs.mkdirSync(dest);
        } catch(err) { /* Directory Probably already exists */ }

        fs.readdirSync(src).forEach(function(childItemName) {
          copyRecursiveSync(path.join(src, childItemName),
                            path.join(dest, childItemName));
        });
      } else {
        //console.log(1467, src, dest)
        try {
          fs.copyFileSync(src, dest);
        } catch (err) { console.log(1473, err) }
      }
    };

      var base_dir = process.env.BASE_DIR + `/brands/${owner_id}`
      var brand_nameSanitized = this.sanitizeString(brand_name)
    // brands/[owner_id]/[brand_nameUrlSanitized]
    // brands/[owner_id]/[brand_nameUrlSanitized]/templates-[brand_nameUrlSanitized]
    // var folder = `~/var/www/static/brands/${owner}/${brand_name}/${folderId.parent.name}/${folderName}`

    // Since we will create the folders recursively, I only need to specify the deepest folder we need
    var folder = this.sanitizeString(`${base_dir}/${brand_nameSanitized}/templates-${brand_nameSanitized}`);

    var fs = require('fs');
        if (!fs.existsSync(folder)){
        var res = fs.mkdirSync(folder, { recursive: true });
    }

    var rootTemplateFolder = `${process.env.BASE_DIR}/templates`
    var ownerTemplateFolder = `${base_dir}/templates`
    var brandTemplateFolder = `${base_dir}/${brand_nameSanitized}/templates-${brand_nameSanitized}`

    if (!fs.existsSync(brandTemplateFolder)){
        var res = fs.mkdirSync(brandTemplateFolder, { recursive: true });
    }

    //console.log(1486, rootTemplateFolder);
    //console.log(1487, ownerTemplateFolder);
    //console.log(1488, brandTemplateFolder);

    if(fs.existsSync(ownerTemplateFolder)){
      // copy the files from ownerTemplateFolder to brandTemplateFolder
      copyRecursiveSync(ownerTemplateFolder, brandTemplateFolder)
    }
    // Next, we check the parent directory to see if it contains a template directory
    // We recursively check each parent directory until we get a templates directory, and
    // then we copy it into the folder that was just created created.

}

isOdd(n) {
   return Math.abs(n % 2) == 1;
}

  async getTracker(){
    var msg = await this.model.findOne({ refDocId: this.req.body.refDocId }).lean()
    var elapsed = 0;//moment(msg.timestamps[msg.timestamps.length]).format('X');

    if(msg == null){

      msg = { refDocId: this.req.body.refDocId, trackingState: false, timestamps: [] }
      await this.model.update({ refDocId: this.req.body.refDocId },
       msg, { upsert: true });
       
    }
    ////console.log(530, msg);
    var totalElapsed = 0;
    if(msg.timestamps.length % 2 != 0){
      var now = {
      "refDocId" : this.req.body.refDocId,
      "timestamp" : moment().toISOString(),
      "trackingState" : true
      }
      msg.timestamps.push(now)
    }

    // Even numbers are start times, odd numbers are end times.  
    for(var i = msg.timestamps.length-1; i >= 0; i--){
      ////console.log(532, moment(msg.timestamps[i].timestamp).format('X'))
      if(i % 2 == 0){
        // i is even
        if(i != 0){
          var x = new moment(msg.timestamps[i+1].timestamp)
          var y = new moment(msg.timestamps[i].timestamp)
          var duration = moment.duration(x.diff(y))
          elapsed -= moment(msg.timestamps[i].timestamp).format('X')
          totalElapsed += duration.asSeconds()
          elapsed = 0
        }
      } else {
        // i is odd
        elapsed += moment(msg.timestamps[i].timestamp).format('X')
        //msg.trackingState = true;
        //
      }
    }
    var duration2 = moment.duration(totalElapsed, 'seconds')
    this.output({ trackingDoc: msg, totalElapsed: totalElapsed, iso8601: duration2.toJSON() });
  }

  async deploykeyword(){
    // I will have the keyword and the bounty_id
    // from this I can get the brand_name and the created by
    // from which I can update the bDeployedKeyword variable
    console.log(906, this.req.body, this.req.params["id"]);

   var bounty_id = this.req.params["id"];


   console.log("A", bounty_id, mongoose.Types.ObjectId(bounty_id));
   var brand_id = await mongoose.connection.db
        .collection("bounties")
        .findOne({_id: mongoose.Types.ObjectId(bounty_id)});

    console.log("B", brand_id);


    var query = {
      created_by: mongoose.Types.ObjectId(this.user._id),
      Keyword: this.req.body.keyword,
      brand_id: mongoose.Types.ObjectId(brand_id["brand_id"])
    }



    var update = {}
    update["bounty_id"] = mongoose.Types.ObjectId(this.req.params["id"])
    update["bKeywordDeployed"] = true;
        update["owner"] = brand_id["owner"];

    console.log(1076, query, update);

    var results = await this.model.update(query, update, { multi:true, upsert: true });
    console.log(1046, query, results);
    //var results = await this.model.find(query);

    this.output({ result: this.req.body });

    setTimeout( async (keyword, bounty_folder_id, parent_folder_id) => {

      var drive = new gdrive();
      var res = await drive.updateTitle(brand_id["bountyScript"], `Script - ${voca.titleCase(this.req.body.keyword)}`); 
      res = await drive.updateTitle(brand_id["bountySpreadsheet"], `Spreadsheet - ${voca.titleCase(this.req.body.keyword)}`); 
      res = await drive.updateTitle(brand_id["bountyDocument"], `Document - ${voca.titleCase(this.req.body.keyword)}`); 

      var adminModel = mongoose.model("User");
      var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});
      box = new Box(adminUser)
      try {
        var folderInfo = await box.renameFolder(bounty_folder_id, voca.titleCase(keyword));
      } catch(err){
        console.log(2212, "Unable to rename box folder");
      }

      try {
        var folderInfo = await box.renameFolder(parent_folder_id, voca.titleCase(keyword));
      } catch(err){
        console.log(2212, "Unable to rename box folder");
      }

    }, 15000, this.req.body.keyword, brand_id["bountyFolderId"], brand_id["parent_folder_id"]);

    // Update google doc title

  }

  async releasekeyword(){
    //console.log(906, this.req.body, this.req.params["id"]);

    var query = {
      Keyword: this.req.body.keyword,
      bounty_id: mongoose.Types.ObjectId(this.req.body["bounty_id"])
    }

    var update = {}
    update["bounty_id"] = 0
    update["bKeywordDeployed"] = false;

    //console.log(1257, query, update);

    var results = await this.model.update(query, update, {multi:true});
    //console.log(1260, query, results);
    //var results = await this.model.find(query);

    this.output({ result: this.req.body });    
  }

  async releasekeywords(){

// db.collection.bulkWrite( [
//    { updateMany :
//       {
//          "filter" : <document>,
//          "update" : <document or pipeline>,          // Changed in MongoDB 4.2
//          "upsert" : <boolean>,
//          "collation": <document>,                    // Available starting in 3.4
//          "arrayFilters": [ <filterdocument1>, ... ], // Available starting in 3.6
//          "hint": <document|string>                   // Available starting in 4.2.1
//       }
//    }
// ] )

    const bulkData = this.req.body.map(item => (
        {
            updateOne: {
                filter: {
                    "Keyword" : item.keyword,
                    bounty_id: mongoose.Types.ObjectId(item["bounty_id"])
                },
                update: {
                    bounty_id: 0,
                    bKeywordDeployed: false
                }
            }
        }
    ));

    await this.model.bulkWrite(bulkData);

  }

  async templates(){
    var brandId = this.req.params["id"]
    //console.log(913, brandId);
    var brand = await this.model.findOne({_id: mongoose.Types.ObjectId(brandId)}, {"brandFolderSharedLink":1,"brandTemplateFolderSharedLink":1,_id:0}).lean()
    //console.log(915, brand);
    if(brand == null){
      this.output({ result: 0 });
    } else {
      this.output({ result: brand });
    }
  }

  async details(){

    var bountyId, bounty;

    if(this.modelName == "Keywords"){
      //console.log(1710, this.req.body)
      var keywordId = this.req.params["id"]
      var keyword = await this.model.findOne({_id: mongoose.Types.ObjectId(keywordId)}).lean()     
      //console.log(1713, keyword)
      bountyId = keyword.bounty_id;
      this.model = mongoose.model("Bounty")
      bounty = await this.model.findOne({_id: mongoose.Types.ObjectId(bountyId)}).lean()
      //console.log(1717, bounty)
    } else {
      bountyId = this.req.params["id"]
      bounty = await this.model.findOne({_id: mongoose.Types.ObjectId(bountyId)}).lean()      
    }

    this.output( { 
        "_id": bountyId,
        "bounty":bounty
      })
  }
  
  async files(){


    var bountyId = this.req.params["id"]
    var bounty = await this.model.findOne({_id: mongoose.Types.ObjectId(bountyId)}).lean()

    var bountyFolderSharedLink = bounty.bountyFolderSharedLink;

    if(this.modelName == "Keywords"){
      bountyId = bounty.bounty_id;
      this.model = mongoose.model("Bounty")
      bounty = await this.model.findOne({_id: mongoose.Types.ObjectId(bountyId)}).lean()
      if(bounty != null){
      if(typeof bounty.bountyFolderSharedLink != 'undefined'){
        bountyFolderSharedLink = bounty.bountyFolderSharedLink;
      }
    }}

    if(bounty.folderId == -1){
      // There was a critical error when this bounty was completed.
      //console.log(1366, "Critical Bounty Error");

    }

    //console.log(2020, bountyId, bounty);

    //var brand = await this.mongoose.

    var bHasCodeGenerator = false;
    var bHasSpreadsheets = false;
    var spreadsheets = [];
    var code_generator_url = '';

    var brand = await mongoose.connection.db
        .collection("brands")
        .findOne({_id: mongoose.Types.ObjectId( bounty.brand_id ) });

    if(brand != null){
    //console.log(2033, bounty.brand_id, brand)
      if(typeof brand.code_generator_url != 'undefined'){
        bHasCodeGenerator = true;
        code_generator_url = brand.code_generator_url;
      }

      if(typeof brand.spreadsheets != 'undefined'){
        bHasSpreadsheets = true;
        spreadsheets = brand.spreadsheets
      }
    }
    ////console.log(1776, brand);

      var adminModel = mongoose.model("User");
      var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});

      box = new Box(adminUser)
      await box.storeRootFolders();

      var accessToken = await box.exchangeToken(bounty.bountyFolderId)

      if(accessToken == -1){
        // There is a problem with the folder.  We need to try and repair it.
        bounty.bountyFolderId = await this.repairInvalidFolder(bounty);
      }

      var localDir = voca.indexOf(bounty.localFolder, "/var/www/");
      var localUrl = "https://www.contentbounty.com/" + voca.substr(bounty.localFolder, localDir+9) + "/";

      // Strip out our base directory
      var localPath = voca.replaceAll(bounty.localFolder, process.env.BASE_DIR, "");

      //console.log(1924, brand);
      var brandSpreadsheets = [];
      if(brand != null){
      if(typeof brand.spreadsheets != 'undefined'){
        if(brand.spreadsheets.length > 0){
          brandSpreadsheets = brand.spreadsheets
        }
      }
      }

      var bountySpreadsheet = "";
      var bountyDocument = "";

      if(typeof bounty.bountyDocument == 'undefined'){
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
        bountyDocument = documentId;
        try {
        await mongoose.connection.db
          .collection("bounties")
          .updateOne({_id: mongoose.Types.ObjectId( bountyId ) }, {$set: { "bountyDocument": bountyDocument } } );
        } catch(err){
          //console.log(1935, "Error Creating Spreadsheet");
        }

      } else {
        bountyDocument = bounty.bountyDocument;
      }

      if(typeof bounty.bountySpreadsheet == 'undefined'){
        // We don't have a bounty spreadsheet -- let's create one
        //console.log(1925, "Bounty Spreadsheet doesn't exist");
        var s = require("@classes/integrations/google/sheets/sheets.js");
        var sheets = new s()
        var spreadsheetId = await sheets.createSpreadsheet();
        bountySpreadsheet = spreadsheetId.spreadsheetId;
        try {
        await mongoose.connection.db
          .collection("bounties")
          .updateOne({_id: mongoose.Types.ObjectId( bountyId ) }, {$set: { "bountySpreadsheet": bountySpreadsheet } } );
        } catch(err){
          //console.log(1935, "Error Creating Spreadsheet");
        }
      } else {
        bountySpreadsheet = bounty.bountySpreadsheet
      }

      var docs = [];
      if(typeof bounty.docs != 'undefined'){
        docs = bounty.docs;
      }

      //console.log(1968, bounty)

      var newPostUrl = "";
      if(brand != null){
        if(typeof brand.new_post_url != 'undefined'){
          newPostUrl = brand.new_post_url;
        }
      }

      var output = {
        "accessToken":accessToken,
        "_id": bountyId,
        "bountyFolderSharedLink": bounty.bountyFolderSharedLink,
        "localFolder":localUrl,
        "localPath": localPath,
        "templateFolderSharedLink": bounty.templateFolderSharedLink,
        "folderId":bounty.bountyFolderId,
        "templateFolderId":bounty.templateFolderId,
        "bountySpreadsheet": bountySpreadsheet,
        "bountyDocument":bountyDocument,
        "brandSpreadsheets":brandSpreadsheets,
        "keywords":bounty.keywords,
        "docs":docs,
        "new_page_link":newPostUrl       
      }
      
      if(bounty.bountyScript != 'undefined'){
        output["bountyScript"] = bounty.bountyScript;
      }

      if(bHasCodeGenerator == true){
        output["code_generator_url"] = code_generator_url;
        output["bHasCodeGenerator"] = bHasCodeGenerator;
      }

      if(bHasSpreadsheets == true){
        output["spreadsheets"] = spreadsheets;
      }

      this.output(output)

      // Intentionally not using await here
      this.refreshlocaldirectory(localPath, bounty.bountyFolderId, false);
  }

  async repairInvalidFolder(bounty){

      // We should copy the other folders over...but one step at a time
      var adminModel = mongoose.model("User");
      var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});
      box = new Box(adminUser)
      const uuidv4 = require('uuid/v4')
      var folderName = `${bounty.queued_content} - ${bounty.release_for_bounty} ${uuidv4()}`;
      var folderInfo = await box.client.folders.create(bounty.parent_folder_id, folderName)
      var bountyRes = await this.model.updateOne({_id: mongoose.Types.ObjectId(bounty._id)}, { $set: { "bountyFolderId":folderInfo.id } });

      // copy guidelines folder
      // "guidelines_folder_id" : "141932809855"
      // generate bounty documents
      //  async copyFolder(folderId, parentId, newName =null, callback =null){
      return folderInfo.id;
  }

  async template(){
    var bountyId = this.req.params["id"]
    var bounty = await this.model.findOne({_id: mongoose.Types.ObjectId(bountyId)}).lean()
    var bountyFolderSharedLink = bounty.bountyFolderSharedLink;

      var adminModel = mongoose.model("User");
      var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});
      box = new Box(adminUser)
      await box.storeRootFolders();

      //var accessToken = await box.getPersistentClient(adminUser);
      var accessToken = await box.exchangeToken(bounty.templateFolderId)

      //console.log(1272, bounty);
      
    this.output( { 
      "accessToken":accessToken,
      "_id": bountyId,
      "bountyFolderSharedLink": bounty.bountyFolderSharedLink,
      "templateFolderSharedLink": bounty.templateFolderSharedLink,
      "folderId":bounty.templateFolderId,
      "templateFolderId":bounty.templateFolderId    
    })
  }

  track(){
    var trackingDocument = {
      refDocId: this.req.body.refDocId,
      timestamp: new Date(),
      trackingState: this.req.body.trackingState
    }

    this.model.update({ refDocId: this.req.body.refDocId },
       {   refDocId: this.req.body.refDocId,
           trackingState: this.req.body.trackingState,
           $push: { timestamps: trackingDocument } }, 
       { upsert: true }, function(err, result){
            //console.log(527, err, result);
       })

    //console.log(520, "tracking works", trackingDocument)
    this.output({ result: true });
  }

  async updatebountyboxfoldername(){
    var result = await this.model.findOne({_id: this.req.body._id}, {queued_content:1, folderId:1}).limit(1).lean();
    var newFolderName = `${result.queued_content} - ${this.req.body.newFolderName}`

    var adminModel = mongoose.model("User");
    var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});
    box = new Box(adminUser)
    try {
      await box.client.folders.update(result.folderId, {name: newFolderName});
    } catch(err){
      //console.log(1983, "Box SDK Error", result.folderId, newFolderName)
    }
    this.output({ result: true });
  }

  async trackBounty(){
    var Bounty = new bounties(this.req.body, this.db);
    var firstViewDate = await Bounty.startTrackingBounty(this.req.body.refDocId)

    var x = new moment()
    var y = new moment(firstViewDate)
    //console.log(609, x.toISOString(), y.toISOString())
    var duration = moment.duration(x.diff(y))
    //console.log(611, duration.as('minutes'))
    this.output({ firstViewDate: duration.as('minutes') });
  }

  async deleteallbounties(){
    var query = { }
    var result = false;
    if(process.env.DEV_ENVIRONMENT == "true")
      result = await this.model.deleteMany(query); 
    this.output({ result: result });
  }

  async removetestaccounts(){
    var users = mongoose.model("User");
    users.deleteMany({email: { $regex: "email.ghostinspector.com"}})
  }

  async deletetestbounties(){
    var query = { created_by: mongoose.Types.ObjectId("608d8bf7594b290a80351609") }
    var result = await this.model.deleteMany(query); 
    this.output({ result: result });
  }

  async getInprogressBounties(){

      if(typeof this.user.skill == 'undefined'){
        this.user.skill = [];
        await this.user.save()
      }

      var inStr = JSON.stringify(this.user.skill)

      if(typeof this.req.body.brand_name != 'undefined'){

      }

      var aggregateStr = `[
      { "$project":{
          "brand_name":1,
          "content_type":1,
          "pipeline":1,
          "keywords":1,
          "process":1,
          "folderId":1
      }},
      {"$unwind":"$process"},
    {"$match":
      { "$and":
        [  
          {"process.bStatus": false},
          {"process.pipeline":"${mongoose.Types.ObjectId(this.user._id)}"},
          {"process.status":"incomplete"}
        ]
      }
    },
      { "$project":{

          "brand_name":1,  
          "content_type":1,
          "bounty":"$process.bounty",
          "refDocId":"$process.refDocId",
          "name":"$process.name",
          "description":"$process.description",
          "pipeline":1,
          "keywords":1,
          "completion_order":"$process.completion_order",
          "folderId":1
      }},
      { 
        "$replaceRoot": 
          { 
              "newRoot": 
                { 
                  "$mergeObjects": 
                    [ 
                      { 
                        "_id": "$_id", 
                        "brand_name": "$brand_name", 
                        "content_type":"$content_type",
                        "pipeline":"$pipeline",
                        "keywords":"$keywords",
                        "bounty":"$bounty",
                        "name":"$name",
                        "description":"$description",
                        "completion_order":"$completion_order",
                        "refDocId":"$refDocId",
                        "folderId":"$folderId"
                      } 
                    ] 
                } 
          }
      }
  ]`

  var aggro = JSON.parse(aggregateStr)
  aggro[2]["$match"]["$and"][1]["process.pipeline"] = mongoose.Types.ObjectId(this.user._id)

  var result = await this.model.aggregate(aggro)
  this.output({ result: result });

}

  async getEligibleBounties(){

      if(typeof this.user.skill == 'undefined'){
        this.user.skill = [];
        await this.user.save()
      }

      var inStr = '["video_creator"]'; //JSON.stringify(this.user.skill)

      ////console.log(1748, this.user.skill);
      var quotedAndCommaSeparated = '["' + this.user.skill.join('","') + '"]';

      var isoDateString = new Date().toISOString()
      var aggregateStr = `[
      { "$match" : { "release_for_bounty": { "$lte": "${isoDateString}" } } },
      { "$project":{
          "brand_name":1,
          "content_type":1,
          "pipeline":1,
          "keywords":1,
          "process":1,
          "folderId":1
      }},
      {"$unwind":"$process"},
      {"$match":
        { "$and":
          [  
            {"process.bStatus": true},
            {"process.pipeline":"unclaimed"},
            {"process.skills":
              { "$in": ${quotedAndCommaSeparated} }
            }
          ]
        }
      },
      { "$project":{

          "brand_name":1,  
          "content_type":1,
          "bounty":"$process.bounty",
          "refDocId":"$process.refDocId",
          "name":"$process.name",
          "description":"$process.description",
          "pipeline":1,
          "keywords":1,
          "completion_order":"$process.completion_order",
          "folderId":1
      }},
      { 
        "$replaceRoot": 
          { 
              "newRoot": 
                { 
                  "$mergeObjects": 
                    [ 
                      { 
                        "_id": "$_id", 
                        "brand_name": "$brand_name", 
                        "content_type":"$content_type",
                        "pipeline":"$pipeline",
                        "keywords":"$keywords",
                        "bounty":"$bounty",
                        "name":"$name",
                        "description":"$description",
                        "completion_order":"$completion_order",
                        "refDocId":"$refDocId",
                        "folderId":"$folderId"
                      } 
                    ] 
                } 
          }
      }
  ]`

  //console.log(1726, aggregateStr);

      //var model = mongoose.model(modelName);
  var result = await this.model.aggregate(JSON.parse(aggregateStr))
    // try {
    //   var result = await mongoose.connection.db
    //     .collection(this.model.collection.collectionName)
    //     .aggregate(JSON.parse(aggregateStr))
    // } catch (err) {
    //   //console.log(256, err);
    // }

    this.output({ result: result });

  }

  /*  When a bounty get's 'kickbacked' it means there is some aspect that doesn't meet the editorial guidelines and the
      person who did the work needs to revisit what they turned in.

      This pauses the bounty, and creates a new "kickback" record that must be resolved before the bounty can continue
  */

  async unclaim() {
    // This reverts a bounty to "unclaimed" status

    //console.log(1652, "Unclaim called")

    var refDocId = this.req.body.refDocId;

    var arrayOrder = this.req.body.completion_order-1;

    // Take a look at this users pending bounties
    var pendingBounties = this.user.pendingBounties;
    var maxBountiesCount = this.user.maxBountiesCount;
    var maxPendingBountiesValue = this.user.maxPendingBountiesValue;
    var valueOfThisBounty = parseFloat(
      voca.replace(this.req.body.bounty, "$", "")
    );

    if(Number.isNaN(valueOfThisBounty)){
      valueOfThisBounty = 35
    }

    this.user.pendingBountiesCount--;
    this.user.pendingBounties -= valueOfThisBounty;
    await this.user.save();

    var bounty_id = this.req.params["id"];

    var bounty = await mongoose.connection.db
        .collection("bounties")
        .findOne({_id: mongoose.Types.ObjectId(bounty_id)});

    if(typeof refDocId == 'undefined'){
      // There was a problem updating or creating this bounty.
      // This really shouldn't happen .... let's return an error code. 
      //console.log(341, "no refDocId -- big error");
    }

    var query = {
      "process.refDocId":refDocId
    };

    //console.log(arrayOrder, bounty.process);

    var prevPipeline = bounty.process[arrayOrder].name;

    var update = {
      $set: {
        "pipeline":prevPipeline,
        "process.$[elem].bStatus": false,
        "process.$[elem].status": 'incomplete',
        "process.$[elem].pipeline": "unclaimed"
      },
    };

    var filters = {
      multi: false,
      arrayFilters: [
        { "elem.completion_order": { $eq: this.req.body.completion_order } }
      ],
    };

    var prevRefDocId = bounty.process[arrayOrder].refDocId;
    //console.log(1693, prevRefDocId);

    //First, "unclaim" this bounty for the user kicking it back
    // try {
    //   var result = await mongoose.connection.db
    //     .collection(this.model.collection.collectionName)
    //     .updateOne(query, update, filters);
    // } catch (err) {
    //   //console.log(1701, err)
    // }

    // Now, "kickback" the bounty
    update["$set"]["pipeline"] = prevPipeline,
    update["$set"]["process.$[elem].status"] = "incomplete"
    update["$set"]["process.$[elem].bStatus"] = true
     update["$set"]["process.$[elem].pipeline"] = "unclaimed"
     update["$set"]["process.$[elem].friendlyFirstName"] = "unclaimed"
     update["$set"]["process.$[elem].friendlyLastName"] = ""

    filters["arrayFilters"][0] = { "elem.completion_order": { $eq: this.req.body.completion_order } }

    query["process.refDocId"] = prevRefDocId
    
    //console.log(1691, util.inspect(query, false, null, true));
    //console.log(1692, util.inspect(update, false, null, true));
    //console.log(1693, util.inspect(filters, false, null, true));
    //console.log(1694, util.inspect(bounty, false, null, true));
    
    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update, filters);
    } catch (err) {
      //console.log(1713, err)
    }

   // //console.log(354,  util.inspect(query, false, null, true /* enable colors */),
   //   util.inspect(update, false, null, true /* enable colors */), 
   //   util.inspect(filters, false, null, true /* enable colors */))

  
    this.output({ result: result });    

  }


  /* This kickback scheme allows us to kickback to an earlier state other than the previous one, and remove the previous
    freelancer */
  async kickbackOriginal(){

  }

  async kickbacktostep(){

    var query = {
      "_id": mongoose.Types.ObjectId(this.req.body.bounty_id)
    };

//    //console.log(2399, this.req.body);

    /*  We don't want to allow kickbacks to "future" steps that haven't been completed yet.
     *
     *
    */

    var kickbackStepName = this.req.body.kickbackStep;

    /*  Inside the "process" array, bStatus = true is intended to be active in only one array element at a time
     *  It's this flag that let's us know that this is the current step that needs to be claimed by a contractor
     *  Here, first, we reset all bStatus to false.  If left unchanged, this effectively makes the bounty invisible 
     *  to potential contractors.
    */
    var resetAllStepsUpdate = {
      $set: {
        "process.$[].bStatus": false,
      }
    }

    try {
        var resetResult = await mongoose.connection.db.collection("bounties").update(query, resetAllStepsUpdate)
    } catch(err){
      // Handle the update error
      //console.log(2330, query, resetAllStepsUpdate)
      //console.log(2331, err);
    }

   

    //console.log(2328, util.inspect(resetResult.result, false, null, true));

    /*  By now, all array elements in the process array should have bStatus set to zero.  Now, we want to set the array
     *  Element that needs to be redone.
     *  We're adding a special "kickbackStatus" here because special handling will need to be performed in the "complete" step,
     *  And this flag will let us know to do this.
    */

    var update = {
      $set: {
        "pipeline": `${kickbackStepName} - kickback`,
        "process.$[elem].status": 'incomplete',
        "process.$[elem].pipeline": "unclaimed",
        "process.$[elem].bStatus": true,
        "process.$[elem].friendlyFirstName":"",
        "process.$[elem].friendlyLastName":"",
        "process.$[elem].completedTimestamp": 0,
        "process.$[elem].claimedTimestamp": 0,
        "process.$[elem].kickbackStatus": true
      }
    };

    var filters = {
      multi: false,
      arrayFilters: [
        { "elem.name": { $eq: this.req.body.kickbackStep } }
      ],
    };

    try {
      var updateResult = await mongoose.connection.db.collection("bounties").update(query, update, filters);
    } catch(err){
      
      //console.log(2368, err);
    }

    //console.log(2367, query, update, filters);

    var test = `db.bounties.update({"_id":ObjectId("${this.req.body.bounty_id}")}, ${JSON.stringify(update)}, ${JSON.stringify(filters)})`;
    //console.log(2359, util.inspect(updateResult.result, false, null, true));

    /*  Finally, we have to "unclaim" the step for the user to initiated the kickback
     *
     *
     *
    */

    update = {
      $set: {
        "process.$[elem].status": 'incomplete',
        "process.$[elem].pipeline": "unclaimed",
        "process.$[elem].bStatus": false,
        "process.$[elem].friendlyFirstName":"",
        "process.$[elem].friendlyLastName":"",
        "process.$[elem].completedTimestamp": 0,
        "process.$[elem].claimedTimestamp": 0
      }
    };

    filters = {
      multi: false,
      arrayFilters: [
        { "elem.refDocId": { $eq: this.req.body.refDocId } }
      ],
    };

    //console.log(2359, util.inspect(filters, false, null, true));

    try {
      var updateResult = await mongoose.connection.db.collection("bounties").update(query, update, filters);
    } catch(err){
      
      //console.log(2368, err);
    }

    this.output({ result: "working" });    
  }

  async kickback(){

    var bounty_id = this.req.params["id"];

    var bounty = await mongoose.connection.db
        .collection("bounties")
        .findOne({_id: mongoose.Types.ObjectId(bounty_id)});

    var processSteps = [];
    var currentStep = "";
    for(var proc of bounty.process){
      //console.log(2518, proc)
      if(proc.bStatus == true){
        break;
      }
      if(proc.status == "incomplete"){
        if(proc.bStatus == false){
          break;
        }
      }
      processSteps.push(proc.name)
    }

    this.output({ result: result,
      "bounty":{
        "bounty_id":bounty_id,
        "prevSteps":processSteps,
        "currentStep": currentStep,
        "refDocId": this.req.body.refDocId
      }
    });   

    return;

    var refDocId = this.req.body.refDocId;

    // Take a look at this users pending bounties
    var pendingBounties = this.user.pendingBounties;
    var maxBountiesCount = this.user.maxBountiesCount;
    var maxPendingBountiesValue = this.user.maxPendingBountiesValue;
    var valueOfThisBounty = parseFloat(
      voca.replace(this.req.body.bounty, "$", "")
    );

    if(Number.isNaN(valueOfThisBounty)){
      valueOfThisBounty = 35
    }

    var bounty_id = this.req.params["id"];

    var bounty = await mongoose.connection.db
        .collection("bounties")
        .findOne({_id: mongoose.Types.ObjectId(bounty_id)});

    if(typeof refDocId == 'undefined'){
      // There was a problem updating or creating this bounty.
      // This really shouldn't happen .... let's return an error code. 
      //console.log(341, "no refDocId -- big error");
    }

    var query = {
      "process.refDocId":refDocId
    };

    var update = {
      $set: {
        "pipeline":"Kickback",
        "process.$[elem].bStatus": false,
        "process.$[elem].status": 'incomplete',
        "process.$[elem].pipeline": "unclaimed"
      },
    };

    var filters = {
      multi: false,
      arrayFilters: [
        { "elem.completion_order": { $eq: this.req.body.completion_order } }
      ],
    };

    var arrayOrder = this.req.body.completion_order-1;
    if(arrayOrder == 0){
      this.output({
        error: 1631,
        result: "You cannot kick back a bounty that has not had at least one step completed." });
      return;     
    }

    var prevRefDocId = bounty.process[arrayOrder-1].refDocId;
    //console.log(1693, prevRefDocId);

    //First, "unclaim" this bounty for the user kicking it back
    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update, filters);
    } catch (err) {
      //console.log(1701, err)
    }

    // Now, "kickback" the bounty

    update["$set"]["process.$[elem].kickback"] = true;
    update["$set"]["process.$[elem].status"] = "incomplete"
    update["$set"]["process.$[elem].bStatus"] = false

    delete update["$set"]["process.$[elem].pipeline"]

    filters["arrayFilters"][0] = { "elem.completion_order": { $eq: this.req.body.completion_order -1 } }

    query["process.refDocId"] = prevRefDocId
    
    // //console.log(1691, util.inspect(query, false, null, true));
    // //console.log(1692, util.inspect(update, false, null, true));
    // //console.log(1693, util.inspect(filters, false, null, true));
    // //console.log(1694, util.inspect(bounty, false, null, true));
    
    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update, filters);
    } catch (err) {
      //console.log(1713, err)
    }

   // //console.log(354,  util.inspect(query, false, null, true /* enable colors */),
   //   util.inspect(update, false, null, true /* enable colors */), 
   //   util.inspect(filters, false, null, true /* enable colors */))

    
    this.output({ result: result,
      "bounty":{
        "bounty_id":bounty_id,
        "refDocId":prevRefDocId
      }
    });    
  }

  async kickbackreason(){
    // Store and notify the user why the kickback occured

    var bountyId = this.req.body.bountyId;
    var refDocId = this.req.body.refDocId;

    var query = {
      "_id":mongoose.Types.ObjectId(bountyId)
    };

    var query = {
      "process.refDocId":refDocId
    };

    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .findOne(query);
    } catch (err) {
      //console.log(1863, err)
    }

    var process = result.process;

    //console.log(1866, process)

    var process_step = {}

    for(var i = 0; i < process.length; i++){
      if(process[i].refDocId == refDocId){
        process_step = process[i]
      }
    }

    // Get the email address of the person who it got kicked back to
   var kickbackUser = await mongoose.connection.db.collection("users").findOne({ _id: mongoose.Types.ObjectId(process_step.pipeline ) } )
   var kickbackUserEmail = kickbackUser.email;
   
   ////console.log(1893, kickbackUserEmail, kickbackUser);

   //await Communication.sendSupportEmail(kickbackUserEmail, "A Bounty has been Kicked Back To You", this.req.body.kickback_reason) 

   this.output({ result: result });    

  }

  async approve(){

    var refDocId = this.req.body.refDocId;

    var emails = await this.getBrandEmails();

    var bounty_id = this.req.params["id"];

    //console.log(1176, bounty_id);



    if(typeof refDocId == 'undefined'){
      //console.log(341, "no refDocId -- big error");
    }

    var query = {
      //_id: mongoose.Types.ObjectId(bounty_id),
      "process.refDocId":refDocId
    };

    var update = {
      $set: {
        "process.$[elem].bStatus": true,
        "process.$[elem].checkin":false
      }
    };

    var filters = {
      multi: false,
      arrayFilters: [
        { "elem.completion_order": { $eq: this.req.body.completion_order } },
      ],
    };

    ////console.log(1198, query, update, filters);
    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update, filters);
    } catch (err) {
      //console.log(1205, err);
      return false;
    }


    ////console.log(result)
    // Share this folder with this user

    this.output({ result: "approve" });    
  }
  
  async completeinhouse(){

    var bounty_id = this.req.params["id"];

    var bountyLink = await mongoose.connection.db
        .collection("bounties")
        .findOne({_id: mongoose.Types.ObjectId(bounty_id)}, {projection: {"bountyFolderSharedLink":1, "bountyFolderId":1, "process":1, "published_link":1, _id:0 } });

    var bounty_process = bountyLink.process;

    var refDocId = this.req.body.refDocId;

    var query = {
      //_id: mongoose.Types.ObjectId(bounty_id),
      "process.refDocId":refDocId
    };

    var update = {
      $set: { 
              "process.$[elem].status": "complete",
              "process.$[elem].bStatus": false,
              "process.$[elem].pipeline": this.user._id 
            }
    };

    var filters = {
      multi: false,
      arrayFilters: [{ "elem.pipeline": { $eq: "unclaimed" }, "elem.refDocId": {$eq: refDocId } }],
    };

    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update, filters);
    } catch (err) {
      //console.log(243, err);
    }
    // After we 'complete' a step, we need to make the next step in the process available for claiming

    //console.log(1253, util.inspect(result.result, false, null, true /* enable colors */));

    //console.log(1255, query, update, util.inspect(filters, false, null, true /* enable colors */));
    //util.inspect(filters, false, null, true /* enable colors */));
    // var bounty = this.req.body;

    var query = {
      _id: mongoose.Types.ObjectId(bounty_id),
    };

    update = {
      $set: { 
              "process.$[elem].bStatus": true
            }
    };

    filters = {
      multi: false,
      arrayFilters: [
        {
          "elem.completion_order": { $eq: this.req.body.completion_order + 1 },
        },
      ],
    };

    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update, filters);
    } catch (err) {
      //console.log(256, err);
    }

    //console.log(1283, result.result);

    this.output({ result: true });

    var completion_order = this.req.body.completion_order

    var nextStep = this.req.body.completion_order + 1;

    this.notifyEligibleContractors(bounty_process[completion_order].skills, bounty_process, completion_order, brand_name)

  }

  async changerole(){
    //console.log(1292, this.req.params);

    var roles = await this.model.find({ accountId: this.user.accountId }, { "role":1,_id:0 }).distinct("role")
    this.output( 
      {
        roles: roles,
        user_id: this.req.params["id"]
    } )
  }

  async exportExcel(searchQuery ={}, modelName ="", datasource =""){

    const uuidv4 = require('uuid/v4')
    var tmpFileName = process.cwd() + "/" + uuidv4() + ".xlsx" 

  var datasource = modelName;
  var model = mongoose.model(modelName);

  var exclude = "-_id -created_by -modified_by -owner -__v -created -modified -bounty_id"

  var data = await model.find(searchQuery).lean().select(exclude).sort({_id:1});

  if(data == null)
    return false;

  if(data.length == 0){
    // Nothing to export
    return false;
  }

  var headers = [];
  var keys = Object.keys(data[0])
  for(var i = 0; i < keys.length; i++){
    headers.push({
      header: keys[i],
      key: keys[i]
    })
  }

  const Excel = require('exceljs');
  var workbook = new Excel.Workbook();

  var sheet = workbook.addWorksheet(datasource);
  sheet.columns = headers;

  for(var i = 0; i < data.length; i++){
    var dbRow = data[i];
    var row = {}
    row['id'] = i;
    for(var y = 0; y < keys.length; y++){
      var value = dbRow[keys[y]];
      if(typeof value != "object"){
        row[keys[y]] = dbRow[keys[y]]
      }
      else
      {
        if(Array.isArray(value)){
          row[keys[y]] = voca.replaceAll(value.toString(), ",", ", ");
        }
      }
    }
    sheet.addRow(row);
  }

  await workbook.xlsx.writeFile(tmpFileName);

  return tmpFileName;

}

  // Toggles the selection status of a document
  async selection(){
    
    var query = {
      _id: this.req.params["id"]
    }

    var document = await this.model.findOne(query, {"selected":true, _id:0 }).lean()

    var isSelected = document.selected;

    var update = await this.model.updateOne(query, {selected: !isSelected})

    this.output({result: !isSelected })

  }

  async deleteselected(){
    var query = {"selected":true}
    

    var document = await this.model.deleteMany(query)

    //console.log(1848, document);

    this.output({result: document })

  }

  async publish(){
    //console.log(1657, this.req.body)
    
    var bounty = await mongoose.connection.db
        .collection("bounties")
        .findOne({_id: mongoose.Types.ObjectId(this.req.params["id"])});

        //console.log(2516, bounty);

    if(bounty.published == false){
      this.output(
        {
          result: false,
          msg: "You must post the link to the published content by clicking on the Link Button"
        })  
      return;
    }
  
    await this.notifySlack(bounty.brand_id, `${bounty.brand_name}: An article has been **PUBLISHED** at the link: ${bounty.published_link}`);
    await this.notifyClientSlack(bounty.brand_id, `${bounty.brand_name}: An article has been **PUBLISHED** at the link: ${bounty.published_link}`);

    await this.complete(true)
    
  }

  async deploy(){
    const shell = require('shelljs');
    shell.exec('/mnt/volume_sfo2_01/development/deploy_dev.sh');
  }

  async link(){
    this.output({result: true })
  }

  async campaign(){

    var available_emails = {
      "readyToSend":1200,
      "needUpdating":926
    }

    this.output({result: true, "available_emails": available_emails })
  }

  async postlink(){

    //console.log(1682, this.req.body)

    //console.log(1684, this.req.params)

    var query = {_id: mongoose.Types.ObjectId(this.req.body["_id"])}
    var bountyRes = await mongoose.connection.db
        .collection("bounties")
        .updateOne(query,
          { $set: {
            "published":true,
            "published_link":this.req.body.link,
            "phase":"Link Building"
          }});

    //console.log(1695, query, this.req.body.link, bountyRes.result)
    //this.output({result: true, origbody: this.req.body, origid: this.params["id"] })
    this.output({result: true, link: this.req.body.link })

  }

  async getdownscopedtoken(folder_id){

      var adminModel = mongoose.model("User");
      var adminUser = await adminModel.findOne({"email":"admin@contentbounty.com"});
      //console.log(90, "actions.js")
      box = new Box(adminUser)
      var result = await box.exchangeToken(folder_id);
      this.output({result: result})
  }

  async notifyEligibleContractors(skills, process_step, bounty_step_pos, brand_name){
   
    var pipeline = 
      [
        { 
          $match: { "skill": { $in: skills } } 
        },
        { $project: { _id:0,email:1 } }
      ]

  ////console.log(345, util.inspect(pipeline, false, null, true /* enable colors */));      

    var eligibleEmails = await mongoose.connection.db.collection('users').aggregate(pipeline).toArray();

    var emails = []
    for(var i = 0; i < eligibleEmails.length; i++){
      var email = eligibleEmails[i].email;
      if(email.indexOf("email.ghostinspector.com") == -1)
        emails.push(email);
    }

    //console.log(1871, emails, skills, process_step, bounty_step_pos);

    var step_desc = `${brand_name}: A new $${process_step[bounty_step_pos]["bounty"]} ${process_step[bounty_step_pos]["name"]} Bounty has become available`

    //console.log(2400, step_desc)

    emails = [];

    if(process.env.DEV_ENVIRONMENT != "true"){
      try {                                // emailTo, subject, content, cc =[], attachments =null, bcc =null)
            Communication.sendSupportEmail("admin@contentbounty.com", step_desc, "Log into content bounty and check.", [], null, emails)
        } catch(err){
          //console.log(573, "Unable to send support email")
        }
    }

  }

  async createSiteMapBounty(brand_name){


    var model = mongoose.model("Bounty");
    var db = new Mongo(model, this.user);

        var Bounty = new bounties(this.req.body, db, this.user);
        var result = await Bounty.createSingleUseBounty("New Site Research", brand_name)
        //console.log(result);
  }

  async getbrandfrombounty(){
    //this.res.json({"brand_id":"12345"});
    var bounty_id = this.req.body.bounty_id;
    var bountyModel = mongoose.model("Bounty");
    var bounty = await bountyModel.findOne({_id: bounty_id }).lean()
    var brandModel = mongoose.model("Brand");
    var brand = await brandModel.findOne({"_id": mongoose.Types.ObjectId(bounty.brand_id)}).lean()
    this.res.json({"brand":brand,"bounty":bounty});
  }

  async getbrandgmailaccounts(){

    var brand_id = this.req.body.brand_id;

    //console.log(2293, brand_id);

    var gmails = await mongoose.connection.db
        .collection("gmails")
        .find({ "brand_id": mongoose.Types.ObjectId(brand_id) }, { projection: { email:1, first:1, last:1 } }).toArray();

    this.res.json({ "gmails":gmails });
  
  }

  async selectallkeywords(){

      var jsonBody = this.req.body;

      for (const [key, value] of Object.entries(jsonBody)) {
        if(voca.includes(key, "_id")){
          if(typeof value == "string")
            jsonBody[key] = mongoose.Types.ObjectId(value)
        }
      }
      
      var key = jsonBody.key;
      delete jsonBody.key

   var updateResult = await mongoose.connection.db
        .collection(key)
        .update(jsonBody, {$set: {"selected" : true} }, {multi:true})


    this.res.json({ "working":true });
  }

  async getsnipereligibleemails(){
    /*
    db.outreach_emails.aggregate([
    {$lookup:{
        from:"keywords",
        localField:"brand_id",
        foreignField:"brand_id",
        as:"keyword"
    }},
    {$unwind:"$keyword"}
]).pretty()
    */
  }

  async startsnipercampaign(){

     var brand = await  mongoose.connection.db
          .collection("brands")
          .findOne({ "_id":mongoose.Types.ObjectId(this.req.body.brand_id) } );

    var campaign = {
      campaign_name: this.req.body.campaign_name,
      brand_name: brand.brand_name,
      brand_id: brand._id,
      created_by: brand.created_by,
      modified_by: this.user._id,
      owner: brand.owner,
      createdAt: moment().format(),
      modifiedAt: moment().format()
    }

    var result = await mongoose.connection.db
          .collection("campaigns")
          .insert(campaign)

    var campaign_id = result["ops"][0]["_id"]

    // Update keywords with our campaign_id
    var keywords = await mongoose.connection.db
          .collection("keywords")
          .updateMany( { "bounty_id" : mongoose.Types.ObjectId(this.req.body.bounty_id) }, { "$set": { "campaign_id" : mongoose.Types.ObjectId(campaign_id) } } )

    var searchObj = {
      "brand_id":mongoose.Types.ObjectId(this.req.body.brand_id),
      "bounty_id":mongoose.Types.ObjectId(this.req.body.bounty_id),
      "Email": { "$exists": true },
      "campaigns": { "$exists": false },
      "selected": true
    }    

/*

Your Campaign has started!
"subject": "Template ", "body": "Hello!", "campaing_name": "Next Campaign", "sending_name": "Adam", "sending_email": "adamarthursandiego@gmail.com" }

*/

    var update = {
      "$set" : {
        "From":this.req.body.sending_email,
        "Body":this.req.body.body,
        "Subject":this.req.body.subject,
        "selected":false,
        "strategy":"sniper",
        "campaigns": [ { campaign_id: mongoose.Types.ObjectId(campaign_id) } ],
        "temporary_hold":moment().subtract(2, 'hours').format(),
        "emails": {
          "outbound": [],
          "inbound": [],
          "stats": {
            "opens": 0,
            "clicks": 0,
            "replies": 0,
            "sends": 0
          }
        },
        "available":true
      }
    }

    var emails = await mongoose.connection.db
          .collection("outreach_emails")
          .updateMany(searchObj, update)

    this.res.json({ "campaign": true });
  }

  // updateTemplateEmailsWithReplacements(searchObj){
  //   var emails = await mongoose.connection.db
  //         .collection("outreach_emails")
  //         .find(searchObj).toArray();

  //   var bulkWrite = [];

  //   for(var i = 0; i < emails.length; i++){

  //   }

  //   const bulkData = this.req.body.map(item => (
  //       {
  //           updateOne: {
  //               filter: {
  //                   "Keyword" : item.keyword,
  //                   bounty_id: mongoose.Types.ObjectId(item["bounty_id"])
  //               },
  //               update: {
  //                   bounty_id: 0,
  //                   bKeywordDeployed: false
  //               }
  //           }
  //       }
  //   ));

  // } 

  async sendsniperemail(){

    var outreach_email_search = { "_id": mongoose.Types.ObjectId(this.req.body.outreach_email_id) }

      var gmail = await mongoose.connection.db
        .collection("gmails")
        .findOne( { "brand_id": mongoose.Types.ObjectId(this.req.body.brand_id) });

      var msg = {
        "To":this.req.body.to,
        "From":this.req.body.from,
        "Subject":this.req.body.subject,
        "Message":this.req.body.body,
        "Date":moment().format(),
      }

      var update = {
        "$inc": { "emails.stats.sends": 1},
        "$push" : { "emails.outbound" : msg },
      }

      //console.log(2460, outreach_email_search )
      // //console.log(2442, msg);

     

      //var emailTo = "adam@inbrain.space";

      //console.log(2571, msg);

      var emailTo = msg.To

      //console.log(emailTo)

      try {
        // await Gmail.sendGmail(gmail.first, gmail.last, gmail.email, emailTo, 
        //   msg.Subject, msg.Message, "", "", gmail.token, gmail.brand_id, msg.toFirst, msg.toLast)
        var testEmail = await Gmail.sendGmail(gmail.first, gmail.last, gmail.email, emailTo, 
          msg.Subject, msg.Message, "", "", gmail.token, gmail.brand_id, msg.toFirst, msg.toLast)

        //console.log(2565, testEmail)
        

        if(process.env.SEND_LIVE_EMAILS != "false"){
           var updates = await mongoose.connection.db
           .collection("outreach_emails")
           .update( outreach_email_search, update, { "upsert":false } );    
           //console.log(2612, updates.result);
         }

         //console.log(2612, updates.result);


          this.res.json({ "campaign": true });
      } catch (err) {
        this.res.status(500);
        this.res.json(
          helpers.defaultErrorResponseObject(
              501, "Something went wrong! Could not send email!"
            )
          );
      }
      
    
      
      ////console.log(2460, update, updates.result, outreach_email_search )

    //  this.res.json({ "campaign": true });       
  }

  async downloadreferringpages(){

    //console.log(2514, this.req.body);

    var base64 = require('base-64');

    var bulkWrite = []

    ////console.log(2508, this.req.query["filter"]);

    var filter = identifyObjectIds(JSON.parse(base64.decode(this.req.query["filter"])));

    //console.log(2551, filter);

    var data = await mongoose.connection.db
        .collection("referring_domains")
        .find( { ... filter, "downloads": {$eq: 0} }, { projection: { domain:1, "Domain Rating":1, _id:0 } }).toArray()

        //console.log(2557, data);
    // const uuidv4 = require('uuid/v4')
    // var download_id = uuidv4()

    var download_id = String(filter.bounty_id) + String(filter.brand_id)

    if(data.length == 0){
        data = await mongoose.connection.db
         .collection("referring_domains")
          .find( { ... filter, ... { "downloads": {"$gt": 0 }, "download_id":download_id } }, { projection: { domain:1,_id:0 } }).toArray()      
    }

    //console.log(2607, data);

    //return this.res.json({"status":"working?"});

    //    //console.log(2521, filter, data);

   //var exclude = "-_id -created_by -modified_by -owner -__v -created -modified"
   // var data = await model.find(this.req.body).lean().select(exclude).sort({_id:1});

    if((data == null)||(data.length == 0)){
      this.res.json({ "download": "unable to find data" });    
        return;
    }

    var headers = [];
    var keys = Object.keys(data[0])
    for(var i = 0; i < keys.length; i++){
      headers.push({
        header: keys[i],
        key: keys[i]
      })
    }

    const Excel = require('exceljs');
    var workbook = new Excel.Workbook();

    var sheet = workbook.addWorksheet("domains");
    sheet.columns = headers;    


    for(var i = 0; i < data.length; i++){
      var dbRow = data[i];
      var row = {}
      row['id'] = i;
      for(var y = 0; y < keys.length; y++){
        var value = dbRow[keys[y]];
        if(typeof value != "object"){
          row[keys[y]] = dbRow[keys[y]]
        }
        else
        {
          if(Array.isArray(value)){
            row[keys[y]] = voca.replaceAll(value.toString(), ",", ", ");
          }
        }
      }
      sheet.addRow(row);
      var search = { ... filter, domain: row["domain"] }
      delete search["bounty_id"]

      var updateObj = {
        updateOne: {
          filter: search,

          update: { $inc : { "downloads" : 1 }, $set: { "download_id": download_id } },

          upsert: false
        }
      }
      bulkWrite.push(updateObj);
    }

    var results = await mongoose.connection.db
        .collection("referring_domains")
        .bulkWrite(bulkWrite);

    workbook.xlsx.writeBuffer()
      .then((buffer) => {
         //fs.writeFileSync(__dirname + "domains.xlsx", buffer);
        //this.res.sendFile('/Users/adamarthur/Documents/Software Projects/contentbounty/domains.xlsx')
        // done
        this.res.header('content-type','application/vnd.ms-excel');
        this.res.header('content-disposition', `attachment; filename=domains-${moment().format()}.xlsx`);
        this.res.status(200);
        this.res.send(buffer);
        // this.res.json({"status":"working?"})
      });
  }

  // This causes all bounties for this brand to stop being offered
  async pause(){
     var brand_id = this.req.params["id"];

     var query = {
       brand_id:mongoose.Types.ObjectId(brand_id)
     }

     var update = {
       "$set": {
         "pause":true
       }
     }

     var resetProcessResult = await mongoose.connection.db
        .collection("bounties")
        .updateMany(query, update);

    //console.log(2756, query, update, resetProcessResult);

    this.output({ "success":true, "error": 0, "result":"All Bounties Paused" });

  }

  async resume(){
     var brand_id = this.req.params["id"];

     var query = {
       brand_id:mongoose.Types.ObjectId(brand_id)
     }

     var update = {
       "$set": {
         "pause":false
       }
     }

     var resetProcessResult = await mongoose.connection.db
        .collection("bounties")
        .updateMany(query, update);

    //console.log(2756, query, update, resetProcessResult);

    this.output({ "success":true, "error": 0, "result":"All Bounties Resumed" });

  }

  async socialcookies(){

     var brand_id = this.req.params["id"];

     var query = {
       "created_by":this.user._id,
       _id:mongoose.Types.ObjectId(brand_id)
     }

     //console.log(552, query)

     /*

     var socialModel = await mongoose.connection.db
        .collection("bounties")
        .find(query).toArray();
        
     */

     var socialModel = mongoose.model("Brand");
     var socialInfo = await socialModel.findOne(query).lean()

     if(socialInfo == null){
       socialInfo = [];
     }
     
     this.output(socialInfo);

  }

  async resetprocessteps(){
    var content_type = this.req.body["content_type"];
    
    var query = {
       content_type: content_type
     }

     //console.log(query);

    var resetProcessResult = await mongoose.connection.db
        .collection("steps")
        .deleteMany(query);

    //console.log(2735, resetProcessResult)

    this.output({ "success":true, "error": 0, "result":"process steps deleted" });

  }

  async getUnusedKeywords(){
    //     var searchObj = {
    //   "brand_id":brand_id._id,
    //   "bKeywordDeployed": {"$ne": true }
    // }
  
  }

  async singleusetemplate(){
    var content_type = this.req.body.content_type;
    var brand_name = this.req.body.brand_name;
    var brand_id = this.req.body.brand_id;
    var Bounty = new bounties(this.req.body, this.db, this.user);

    //console.log(3653, brand_id);

    Bounty.createSingleUseBounty(content_type, brand_name, null, brand_id)
    this.res.json({"working":true});

  }

  async singleusebounty(){
    //console.log(2796, this.req.body)
    var content_type = this.req.body.content_type;
    var brand_name = this.req.body.brand_name;
    var Bounty = new bounties(this.req.body, this.db, this.user);
    var bounty = await Bounty.createOneOffBounty(this.req.body.process, content_type, brand_name,this.req.body.release_for_bounty, this.req.body.unused_keyword, this.req.body)
    //console.log(2803, bounty);
    this.res.json({"bounty":bounty});
  }

  // Take a keyword and mark it as deployed.  If it doesn't exist, create it and mark it as deployed
  async deploykeywordkfnotexistscreate(){
    var keywordTemplate = {
    "created_by" : this.user._id,
    "modified_by" : this.user._id,
    "owner" : this.user.accountId,
    "brand_id" : mongoose.Types.ObjectId(this.req.body.brand_id),
    "bKeywordDeployed" : true,
    "bounty_id" :  mongoose.Types.ObjectId(this.req.body.bounty_id)
    }

    //console.log(2898, this.req.body)
      for(var i = 0; i < this.req.body.keywords.length; i++){

        var keyword = this.req.body.keywords[i]
        var Keyword = Object.assign(keywordTemplate)
        Keyword["Keyword"] = keyword;

        var query = {
          "Keyword" : keyword,
          "brand_id" : mongoose.Types.ObjectId(this.req.body.brand_id),
        }

        var result = await this.model.update(query, Keyword, { upsert: true });
        this.res.json({"deploy_keywords":result});
    }
  }

  async updatedeployedcontent(){
        this.res.json({"deploy_keywords":this.req.body} );

        var query = {
          "_id" : mongoose.Types.ObjectId(this.req.body.content_plan_id),
        }

        var result = await this.model.update(query, { $set: { "deployed" : true } });

        //console.log(2843, query, result);

        //this.res.json({"deploy_plan":result});
    }

    async getnextunclaimedscriptbounty(minId ="61f978d69c507e6abd5dc9ef"){

      var brand_name = this.req.body.brand_name;

      //console.log(3037, minId)

      var today = new Date().toISOString()

      var aggregate = [
            { "$project":{
                "brand_name":1,
                "content_type":1,
                "pipeline":1,
                "keywords":1,
                "process":1,
                "folderId":1,
                "refDocId":1,
                "release_for_bounty":1
            }},
            {"$unwind":"$process"},
          {"$match":
            { "$and":
              [  
                {"release_for_bounty":{"$lte":today}},
                {"brand_name":brand_name},
                {"_id" : { "$gt": mongoose.Types.ObjectId(minId) } },
                {"process.name":"Filming"},
                {"process.pipeline": "unclaimed"},
                {"process.bStatus":true},
                {"process.status":"incomplete"}
              ]
            }
        },

          {"$limit": 1}
        ]

        var result = await this.model.aggregate(aggregate)
        //console.log(3066, result)
        if(result.length == 0) {
        return this.error( 
          { 
            raw: 
            { error:1,
              "message":"There are no more scripts for this brand"
            }
          });
        }

        //await this.initBoxObj();

        var output = result[0];
        var bFoundScript = true;

        // try {
        //   //console.log(result[0]["folderId"])
        //   var folderItems = await this.box.list(result[0]["folderId"])
        //   //console.log(3019, folderItems);
          
        //   for(let entry in folderItems["entries"]){
            
        //     var fileName = folderItems["entries"][entry]["name"]
        //     //console.log(2998, fileName)
        //     if(fileName.indexOf("script") != -1){
        //       //console.log(3084, fileName,fileName.indexOf("script"))
        //       var script_id = folderItems["entries"][entry].id;
        //       bFoundScript = true;
        //       output["script_file_id"] = script_id;
        //     }
        //   }
        //   //output["folderItems"] = folderItems;
        // } catch(err){
        //   //console.log(505, err);
        //   this.output({ "error" : 1 });
        //   return;
        // }

        //console.log(3096, bFoundScript);

        if(!bFoundScript){
          //console.log(3109, result[0]["_id"]);
          return this.getnextunclaimedscriptbounty(result[0]["_id"])
          //return this.error( 
          //{ 
          //  raw: 
          //  { error:1,
          //    "message":"We expected a script file but there was none..."
          //   }
          // });
        }

        this.output(output)
      /*
        db.bounties.aggregate([{ "$project":{
                "brand_name":1,
                "content_type":1,
                "pipeline":1,
                "keywords":1,
                "process":1,
                "folderId":1
            }},
            {"$unwind":"$process"},
          {"$match":
            { "$and":
              [  
                {"pipeline":"Write the script"},
                {"process.bStatus": false},
                {"process.completion_order":2},
                {"process.status":"incomplete"}
              ]
            }
        }])
    */


    }

    async getnextinprogressfilmingbounty(minId ="61f978d69c507e6abd5dc9ef"){

      var brand_name = this.req.body.brand_name;
      var minId = this.req.body.minId;
      var output = {}
      const uuidv4 = require('uuid/v4')
      var uuid = uuidv4();

      if(minId == "0"){
        minId = "61f978d69c507e6abd5dc9ef"
      }

      var today = new Date().toISOString()

      var aggregate = [
            { "$project":{
                "brand_name":1,
                "content_type":1,
                "pipeline":1,
                "keywords":1,
                "process":1,
                "folderId":1,
                "refDocId":1,
                "release_for_bounty":1,
                "bountyDocument":1,
                "bountyScript":1
            }},
            {"$unwind":"$process"},
          {"$match":
            { "$and":
              [  
                {"pipeline" : "Filming - in progress"},
                {"release_for_bounty":{"$lte":today}},
                {"brand_name":brand_name},
                {"_id" : { "$gte": mongoose.Types.ObjectId(minId) } },
                //{"bountyScript" : { "$exists": true } }
                {"process.name":"Filming"},
                {"status" : { "$ne" : "complete" } },
                {"process.pipeline": { "$ne": "unclaimed"} }
              ]
            }
        },

          {"$limit": 2}
        ]


        var result = await this.model.aggregate(aggregate)
        //console.log(3066, result);
        if(typeof result[1] != 'undefined'){
          output["next_bounty"] = result[1]["_id"];
        }

        output["script_document"] = result[0]["bountyScript"];

        output["bounty_id"] = result[0]["_id"];
        result = result[0];
        
        if(typeof result["next_bounty"] == 'undefined'){
          result["next_bounty"] = 0;
          minId = "0"
        }

        if(result.length == 0) {
        return this.error( 
          { 
            raw: 
            { error:1,
              "message":"There are no more scripts for this brand"
            }
          });
        }

        var uuid = uuidv4();

        if(typeof result.bountyScript != 'undefined'){
        var downloadUrl = `https://docs.google.com/document/d/${result.bountyScript}/export?format=txt`
        var openUrl = `https://docs.google.com/document/d/${result.bountyScript}/edit`

        var tmpFileName = process.cwd() + "/" + uuid + ".txt"
        //console.log(99, downloadUrl);
        try {
            await this.downloadFile(downloadUrl, tmpFileName, process.cwd(), uuid + ".txt");
          } catch(err){
            //console.log("Unable to download", downloadUrl);
          }

        var fileText = fs.readFileSync(tmpFileName, 'utf8');

        output["script_text"] = fileText;

        fs.unlinkSync(tmpFileName);
      }

      // We don't have a script
      if(fileText.length < 5){
        buildTemplates = await this.buildTemplatesAndEmail(minId);
        var scriptDocId = ""

        var folderId = result[0].folderId;
    
          var files = await this.box.listAll(folderId);
          var fileId = "";
          var bFoundScript = false;
          for(var file of files){
           if(file.name == "READ ME - script.docx"){
              scriptDocId = file.id;
              bFoundScript = true; 
            }
          }

          if(!bFoundScript){
            buildTemplates = await this.buildTemplatesAndEmail(minId);
            var files = await this.box.listAll(folderId);
          
            for(var file of files){
            if(file.name == "READ ME - script.docx"){
              scriptDocId = file.id;
              bFoundScript = true; 
            }
          }
          }
      }

      output["openUrl"] = openUrl;

        return this.output(output);



    }

    async getscriptid(){
        await this.initBoxObj();

        const uuidv4 = require('uuid/v4')

        var output = {}

        var bFoundScript = false;

        const bounty_id = this.req.body.bounty_id;
        var bounty = await mongoose.connection.db.collection("bounties").findOne({ "_id":bounty_id } );

        var googleDocId = bounty.bountyDocument;
        var googleScriptId = bounty.bountyScript;

        //console.log(googleScriptId);
        var uuid = uuidv4();

        if(typeof googleScriptId != 'undefined'){
        var downloadUrl = `https://docs.google.com/document/d/${googleScriptId}/export?format=txt`

        var tmpFileName = process.cwd() + "/" + uuid + ".txt"
        var tmpScriptName =  process.cwd() + "/" + uuidv4() + ".docx"

        //console.log(990001, downloadUrl);
        try {
            await this.downloadFile(downloadUrl, tmpFileName, process.cwd(), uuid + ".txt");
          } catch(err){
            //console.log("Unable to download", downloadUrl);
          }

        var fileText = fs.readFileSync(tmpFileName, 'utf8');
        var scriptDocId = ""

	//console.log(990004, fileText, tmpFileName, fileText.length, fileText);
        if(fileText.length < 5){
	  fs.unlinkSync(tmpFileName);
          // We didn't have a script in the Google Document
          // During the box phase out period, we'll check if we have it in box...
          var folderId = bounty.folderId;
	  //console.log(990002, folderId);
          var files = await this.box.listAll(folderId);
          var fileId = "";
          for(var file of files){
		//console.log(990003, file);
            if(file.name == "script.txt"){
              fileId = file.id;
            }

            if(file.name == "READ ME - script.docx"){
              scriptDocId = file.id;
            }
          }

          //tmpFileName = process.cwd() + "/" + uuidv4() + ".txt"
          ////console.log(990004, fileId, tmpFileName);
          try {
		        //console.log(990004, fileId, tmpFileName);
            await box.downloadFile(fileId, tmpFileName);


            //const timers = require('timers-promises')
	} catch(err){
		//console.log(900011);
	}
		await timers.setTimeout(5000)

    if(scriptDocId != ""){
              await box.downloadFile(scriptDocId, tmpScriptName);
              await timers.setTimeout(2000)
              var buffer = fs.readFileSync(tmpScriptName);
              var drive = new gdrive();
              var res = await drive.updateSmallFile(googleScriptId, buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"); 
                        
            }


		//console.log(990010, tmpFileName);
	//	 fileText = fs.readFileSync(tmpFileName, 'utf8');
	//	setTimeout( () => { 
			fileText = fs.readFileSync(tmpFileName, 'utf8');
			//console.log(990009, tmpFileName, fileText);
	//	}, 2500);
         // } catch(err){
         //   //console.log(90007, "Unable to download", downloadUrl);
         // }
	  
	 //console.log(90005, fileText);

        output["script_text"] = fileText;

	try {
        //fs.unlinkSync(tmpFileName);
	} catch(err){ }      

        }

        output["script_text"] = fileText;

        //fs.unlinkSync(tmpFileName);

        return this.output(output);

        try {
            await this.downloadFile(downloadUrl, "tmp.txt");
          } catch(err){
            //console.log("Unable to download", downloadUrl);
        }
        }

        try {
          //console.log(this.req.body.folderId)
          var folderItems = await this.box.list(this.req.body.folderId)
          //console.log(3019, folderItems);
          
          for(let entry in folderItems["entries"]){
            
            var fileName = folderItems["entries"][entry]["name"]
            //console.log(2998, fileName)
            if(fileName.indexOf("script") != -1){
              //console.log(3084, fileName,fileName.indexOf("script"))
              var script_id = folderItems["entries"][entry].id;
              bFoundScript = true;
              output["script_file_id"] = script_id;
            }
          }
          //output["folderItems"] = folderItems;
        } catch(err){

          ////console.log(505, err);
          this.output({ "error" : 1 });
          return;
        }  

         if(bFoundScript == false){

          var bounty = await mongoose.connection.db.collection("bounties").findOne({ "_id":bounty_id } );
                //console.log(10, bounty_id);
                //console.log(11, bounty);
        var googleDocId = bounty.bountyDocument;
          var downloadUrl = `https://docs.google.com/document/d/${googleDocId}/export?format=txt`
          try {
            fs.unlinkSync("tmp.txt");
          } catch(err){

          }

          try {
            await this.downloadFile(downloadUrl, "tmp.txt");
          } catch(err){
            //console.log("Unable to download", downloadUrl);
          }
          //console.log(99001, bounty);
        //console.log(99002, downloadUrl);


              var stream2 = fs.createReadStream("tmp.txt");
              try {
                  var bountyFolderId = bounty.bountyFolderId;
                        ////console.log(102, bounty.bountyFolderId, googleDocId);
                  var file = await this.box.uploadFile(bountyFolderId, "script.txt", stream2);
                        //console.log(87, file);
                        output["script_file_id"] = file.entries[0].id

                       
                } catch(err) 
                { 
                  //console.log(101, err) 
                }

                this.output(output);
                return;

        }

        this.output(output)    
    }

    async getscriptid1(){
        await this.initBoxObj();

        const uuidv4 = require('uuid/v4')

        var output = {}

        var bFoundScript = false;

        const bounty_id = this.req.body.bounty_id;
        var bounty = await mongoose.connection.db.collection("bounties").findOne({ "_id":bounty_id } );

        var googleDocId = bounty.bountyDocument;
        var googleScriptId = bounty.bountyScript;

        //console.log(googleScriptId);
        var uuid = uuidv4();

        if(typeof googleScriptId != 'undefined'){
        var downloadUrl = `https://docs.google.com/document/d/${googleScriptId}/export?format=txt`

        var tmpFileName = process.cwd() + "/" + uuid + ".txt"
        //console.log(99, downloadUrl);
        try {
            await this.downloadFile(downloadUrl, tmpFileName, process.cwd(), uuid + ".txt");
          } catch(err){
            //console.log("Unable to download", downloadUrl);
          }

        var fileText = fs.readFileSync(tmpFileName, 'utf8');

        output["script_text"] = fileText;

        fs.unlinkSync(tmpFileName);

        return this.output(output);

        try {
            await this.downloadFile(downloadUrl, "tmp.txt");
          } catch(err){
            //console.log("Unable to download", downloadUrl);
        }
        }

        try {
          //console.log(this.req.body.folderId)
          var folderItems = await this.box.list(this.req.body.folderId)
          //console.log(3019, folderItems);
          
          for(let entry in folderItems["entries"]){
            
            var fileName = folderItems["entries"][entry]["name"]
            //console.log(2998, fileName)
            if(fileName.indexOf("script") != -1){
              //console.log(3084, fileName,fileName.indexOf("script"))
              var script_id = folderItems["entries"][entry].id;
              bFoundScript = true;
              output["script_file_id"] = script_id;
            }
          }
          //output["folderItems"] = folderItems;
        } catch(err){

          ////console.log(505, err);
          this.output({ "error" : 1 });
          return;
        }  

         if(bFoundScript == false){

          var bounty = await mongoose.connection.db.collection("bounties").findOne({ "_id":bounty_id } );
                //console.log(10, bounty_id);
                //console.log(11, bounty);
        var googleDocId = bounty.bountyDocument;
          var downloadUrl = `https://docs.google.com/document/d/${googleDocId}/export?format=txt`
          try {
            fs.unlinkSync("tmp.txt");
          } catch(err){

          }

          try {
            await this.downloadFile(downloadUrl, "tmp.txt");
          } catch(err){
            //console.log("Unable to download", downloadUrl);
          }
          //console.log(99, bounty);
        //console.log(98, downloadUrl);


              var stream2 = fs.createReadStream("tmp.txt");
              try {
                  var bountyFolderId = bounty.bountyFolderId;
                        ////console.log(102, bounty.bountyFolderId, googleDocId);
                  var file = await this.box.uploadFile(bountyFolderId, "script.txt", stream2);
                        //console.log(87, file);
                        output["script_file_id"] = file.entries[0].id

                       
                } catch(err) 
                { 
                  //console.log(101, err) 
                }

                this.output(output);
                return;

        }

        this.output(output)    
    }

    async dltest(){
      try {
        var result = await this.downloadFile(`https://docs.google.com/document/d/1ygTW10ARxb_HLgQoeIT30w1BwqdRB4XXw1dAbFmfPf0/export?format=txt`, 'tmp.txt');
      } catch(err){
        //console.log(4084, err);
      }
      this.output(result);
    }

    async downloadFile(url, targetFile, directory, filename) {  
      ////console.log(4228, directory,filename)
      const downloader = new Downloader({
          url: url, //If the file name already exists, a new file with the name 200MB1.zip is created.
          directory: directory, //This folder will be created, if it doesn't exist.
          fileName: filename
        });
        try {
          const {filePath,downloadStatus} = await downloader.download(); //Downloader.download() resolves with some useful properties.

          //console.log("All done");
        } catch (error) {
          //IMPORTANT: Handle a possible error. An error is thrown in case of network errors, or status codes of 400 and above.
          //Note that if the maxAttempts is set to higher than 1, the error is thrown only if all attempts fail.
          //console.log("Download failed", error);
        }

    }

    async createbountyvideowithscript(){

    var bountyTemplate = [
      {
          "content_type": "On Screen Persona",
          "dropboxLink": [],
          "promptLists": [],
          "additional_instruction": "",
          "process": [
              {
                  "completion_order": 1,
                  "name": "Writing",
                  "description": "Write the script",
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
                  "name": "Filming",
                  "description": "Record The Video",
                  "inhouse": false,
                  "checkin": false,
                  "skills": [
                      "video_creator"
                  ],
                  "bounty": 35,
                  "pipeline": "unclaimed",
                  "status": "incomplete",
                  "bStatus": false
              },
              {
                  "completion_order": 3,
                  "name": "Editing",
                  "description": "Edit the video",
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
                  "completion_order": 4,
                  "name": "Uploading",
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
          ],
          "bounty": {
              "content_type": "On Screen Persona",
              "short_description": "Repost an image related to these keywords",
              "suggested_bounty": "$25",
              "frequency": "Once",
              "starting_day": "Monday",
              "brand_name": this.req.body.brand_name
          }
        }
    ]
        this.req.body = bountyTemplate
        this.createbountiesfast(true)

    }

    async createimpromptubountyvideo(){

    var bountyTemplate = [
      {
          "content_type": "On Screen Persona",
          "dropboxLink": [],
          "promptLists": [],
          "brand_id": mongoose.Types.ObjectId(this.req.body.brand_id),
          "additional_instruction": "",
          "process": [
              {
                  "completion_order": 1,
                  "name": "Filming",
                  "description": "Record The Video",
                  "inhouse": false,
                  "checkin": false,
                  "skills": [
                      "video_creator"
                  ],
                  "bounty": 35,
                  "pipeline": "unclaimed",
                  "status": "incomplete",
                  "bStatus": true
              },
              {
                  "completion_order": 2,
                  "name": "Editing",
                  "description": "Edit the video",
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
                  "name": "Uploading",
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
          ],
          "bounty": {
              "content_type": "On Screen Persona",
              "short_description": "Repost an image related to these keywords",
              "suggested_bounty": "$25",
              "frequency": "Once",
              "starting_day": "Monday",
              "brand_name": this.req.body.brand_name,
              "brand_id": mongoose.Types.ObjectId(this.req.body.brand_id)
          }
        }
    ]
        this.req.body = bountyTemplate
        this.createbountiesfast(true)

    }

    /* This is a special function for use by the iOS app.  The idea is we only want to display
    bounties that already have a script ready to go.
    */

    async getScriptBounties(){

      if(typeof this.user.skill == 'undefined'){
        this.user.skill = [];
        await this.user.save()
      }

      var quotedAndCommaSeparated = '["' + this.user.skill.join('","') + '"]';

      var isoDateString = new Date().toISOString()
      var aggregateStr = `[
      { "$match" : { "release_for_bounty": { "$lte": "${isoDateString}" } } },
      { "$project":{
          "brand_name":1,
          "content_type":1,
          "pipeline":1,
          "keywords":1,
          "process":1,
          "folderId":1
      }},
      {"$unwind":"$process"},
      {"$match":
        { "$and":
          [  
            {"process.bStatus": true},
            {"process.pipeline":"unclaimed"},
            {"process.name":"Filming"},
            {"process.skills":
              { "$in": ${quotedAndCommaSeparated} }
            }
          ]
        }
      },
      { "$project":{

          "brand_name":1,  
          "content_type":1,
          "bounty":"$process.bounty",
          "refDocId":"$process.refDocId",
          "name":"$process.name",
          "description":"$process.description",
          "pipeline":1,
          "keywords":1,
          "completion_order":"$process.completion_order",
          "folderId":1
      }},
      { 
        "$replaceRoot": 
          { 
              "newRoot": 
                { 
                  "$mergeObjects": 
                    [ 
                      { 
                        "_id": "$_id", 
                        "brand_name": "$brand_name", 
                        "content_type":"$content_type",
                        "pipeline":"$pipeline",
                        "keywords":"$keywords",
                        "bounty":"$bounty",
                        "name":"$name",
                        "description":"$description",
                        "completion_order":"$completion_order",
                        "refDocId":"$refDocId",
                        "folderId":"$folderId"
                      } 
                    ] 
                } 
          }
      }
  ]`

      //var model = mongoose.model(modelName);
  var result = await this.model.aggregate(JSON.parse(aggregateStr))
    // try {
    //   var result = await mongoose.connection.db
    //     .collection(this.model.collection.collectionName)
    //     .aggregate(JSON.parse(aggregateStr))
    // } catch (err) {
    //   //console.log(256, err);
    // }

    this.output({ result: result });

  }

  /* This endpoint is called by an integration with Box.with
    Here's what happens:
          Anytime a folder is created using the Box integration (integrations/box/box.js), a webhook is created
          for that folder which calls https://app.contentbounty.com/v1.0/api/actions/datasource/bounty/action/folderupdate
          anytime a file is added, updated, moved or deleted from that folder.  This allows us to then download the file
          on our end to "sync" it with our server.  This is part of a longer-term plan to discontinue using Box.

          Part of the short-term goal for this is to enable automatic uploading of video files to YouTube.
  */
  async folderupdate(){
      this.output({ result: true });
  }

  /* 
    This function takes keywords and converts a field into a file which is then uploaded
    as a file into box.  This is useful so we can upload a spreadsheet with a bunch of 
    scripts included on a line item and convert them into individual bounties.


  */
  async keywordtofile(brand_id, targetKey ="script"){

    return;
    //var targetKey = this.req.body.target_key;

    //if(req.body.target)

   //  db.keywords.aggregate([
   //    { $match: { brand_id: ObjectId("61f7c89d569a3b998f01b97c") } },
   //    { $lookup: { from: "bounties", localField: "bounty_id", foreignField: "_id", as: "bounty" } },
   //    {
   //    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$bounty", 0 ] }, "$$ROOT" ] } }
   // },
   // { $project: { bountyFolderId: 1, script:1 } }
   //  ])

     var searchObj = {}
     searchObj[targetKey] = { "$exists" : true }
     
     var aggregate = []
     aggregate.push({ $match: { brand_id: mongoose.Types.ObjectId(brand_id), "script": {$exists: true } } })
     aggregate.push({ $lookup: { from: "bounties", localField: "bounty_id", foreignField: "_id", as: "bounty" } })
     aggregate.push({ $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$bounty", 0 ] }, "$$ROOT" ] } } })
     aggregate.push({ $project: { bountyFolderId: 1, script:1 } })

     //console.log(3420, aggregate);

     var matchingDocuments = await mongoose.connection.db
        .collection("keywords")
        .aggregate(aggregate).toArray()

     //console.log(3507, matchingDocuments)

     //var matchingDocuments = await this.model.aggregate(aggregate)

     await this.initBoxObj();

     if(matchingDocuments.length > 0){

       for(var i = 0; i < matchingDocuments.length; i++){
         var doc = matchingDocuments[i];
         var bountyFolderId = doc["bountyFolderId"];
         var script = doc["script"];

         var tmpFileName = this.generateRandomFilename() + "-script.txt";
         //console.log(tmpFileName, script);
         fs.writeFileSync(tmpFileName, script); 
         var stream = fs.createReadStream(tmpFileName);
              try {
                //console.log(3439, bountyFolderId, "script.txt")
                var uploadResult = await this.box.uploadFile(bountyFolderId, "script.txt", stream)
              } catch(err){
                //console.log(3441, err);
              }
              //console.log(3443, uploadResult);
        }
       
       

       // Ok I should have a bountyFolderId and a script.
        
     }

    //this.output( {searchObj: matchingDocuments });
  }

  async generatePageFromSpreadsheetTemplate(){
    // We take a spreadsheet and generate an HTML output for it
    
  }

  async watchAndSyncExistingBounties(){

    var count = 1;
    var bounties = await mongoose.connection.db
        .collection("bounties")
        .find({"brand_name":this.req.body.brand_name}, { "projection": {bountyFolderId:1, parent_folder_id:1, parent_folder:1, brand_name:1, brand_id:1, owner:1, _id:1, content_type:1, release_for_bounty:1} }).toArray()

        //console.log(3555, bounties.length)
        await this.initBoxObj();
        var folders = await this.box.listAll(bounties[0].parent_folder_id);
        for(var i = 0; i < folders.length; i++){
          for(var x = 0; x < bounties.length; x++){
            var bounty = bounties[x];
            if(folders[i].id == bounties[x].bountyFolderId){
              //console.log(3560, "create", folders[i].name);
              var folderName = folders[i].name;
              await createFolderLocally(folderName, bounty.parent_folder_id, bounty._id, bounty.parent_folder, bounty.brand_id, bounty.brand_name, bounty.owner, folders[i].id, this.box)
            }
          }
        }
        // for(var i = 0; i < bounties.length; i++){
        //     var bounty = bounties[i];
        //     var folderName = `${bounty.content_type} - ${bounty.release_for_bounty}`
        //     var folderId = {
        //       "parent" : { "name" : bounty.parent_folder_name },
        //     }
        //    // //console.log(3560, typeof bounty.parent_folder)


        //     if(typeof bounty.parent_folder != "undefined")
        //       createFolderLocally(folderName, bounty.parent_folder_id, bounty._id, bounty.parent_folder, bounty.brand_id, bounty.brand_name, bounty.owner)
        // }

          async function createFolderLocally(folderName, parent_folder_id, bounty_id, parent_folder_name, brand_id, brand_name, owner, folderId, box){
            var fs = require('fs');
            ////console.log(3566, folderName, parent_folder_id, bounty_id, parent_folder_name, brand_id, brand_name, owner)
            brand_name = brand_name.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
            var parentFolderName = parent_folder_name.replace(/[^a-z0-9-.]/gi, '_').toLowerCase();
            folderName = folderName.replace(/[^a-z0-9-.]/gi, '_').toLowerCase();

            var base_dir = process.env.BASE_DIR;
            var folder = `${base_dir}/brands/${owner}/${brand_name}/${parentFolderName}/${folderName}`

            var sanitizedFolderName = folder;

            var bExists = true;
            var pos = 1;
            var tempName = sanitizedFolderName
            
              bExists = fs.existsSync(tempName)
              if (!bExists){
                //console.log(3576, tempName);
                  var res = fs.mkdirSync(tempName, { recursive: true });
              } else {
                  // folder already exists
              }

              // Note the use of "id" here and not "_id" here is intentional -- the "id" is the folderId
              await box.createWebhook(folderId)
            var query = { "bountyFolderId": folderId }
            var update = { "$set": { "localFolder" : tempName} }
            var result = await mongoose.connection.db.collection('bounties').updateOne(query, update)
          }

        this.output(folders);
  }

  // This function returns a list of keywords for a particular brand.
  // keyword data is considered public and may be shared among any freelancers
  async getbrandkeywords(){

    var brand_id = this.req.body.brand_id

      var isoDateString = new Date().toISOString()
      //var aggregateStr = `[ { "$match" : { "brand_id": ObjectId("${brand_id}") } } ]`
      var aggregate = [ { "$match" : { "brand_id": mongoose.Types.ObjectId(brand_id) } } ]
      //var aggregate = JSON.parse(aggregateStr);


      //console.log(3220, aggregate);

      var result = await this.model.aggregate(aggregate)
      this.output({ result: result });
  }

  async exceltojson(req, res){

    //var data = this.req.files[0].buffer

    //console.log(this.req.headers)
    //console.log(this.req.body)
    //console.log(this.req.files)
    ////console.log(this.req);

   // var ExcelImport = new excel(data);
   // var importData = await ExcelImport.loadWorkbook();
    var importData = {}

    this.res.status(200);
    this.res.json( {"Working": importData } )
  }

  async bulkedit(){
    var brand_id = this.req.body.brand_id;
    var content_type = this.req.body.content_type;
    this.res.status(200);
    this.res.json( {"Working": true,  brand_id, content_type} ) 
  }

  async refreshlocaldirectory(local =null, remote =null, response =false){

    //console.log(4379, "refreshlocaldirectory called");

    var local_folder_path = local;
    if(local == null){
      this.req.body.local_folder;
    }

    var box_folder = remote;
    if(remote == null){
      this.req.body.box_folder;
    }
    
    await this.initBoxObj();
    
    await this.box.syncBoxAndLocal(local_folder_path, box_folder);

    var gdrive = new drive()
    var uploadedFiles = await gdrive.syncLocalDocumentsWithDrive(local_folder_path)
    await this.updateBountyWithGoogleFiles(bounty._id, uploadedFiles);

    if(response == true){
      this.res.status(200);
      this.res.json( {"directoy_sync": "requested" } ); 
    }
  }

  // This is for a situation where we have existing bounties and we want to remove a step
  // from one or more already deployed bounties
  async removeStepFromExistingBounties(){
    var step_name = this.req.body.step_name;
    var brand_name = this.req.body.brand_name;
    // Although slower, we will iterate through each matched bounty one by one and make the change, one by one
    // The reason for this is because it is not guaranteed that all bounties will be the same, so we
    // need to do this one by one to account for potential variation in each bounty
    // It's possible to write a bulk query that could accomplish this, but I'm worried about edge cases
    // And since this is something that will be done very infrequently, performance is not a top concern here.

    // db.bounties.find({"brand_name":"Top 40 Weekly", "process": { "$elemMatch": {name: "Find Memorabilia", "pipeline":"unclaimed" } } }).pretty().limit(10)
    // db.bounties.find({"brand_name":"Top 40 Weekly", "process": { "$elemMatch": {name: "Find Memorabilia" } } }).pretty().limit(1)

    // First, let's find our existing bounties
    var elemMatch = {}
    elemMatch = { "$elemMatch": { "name" : step_name, "pipeline":"unclaimed", "bStatus": false } } /// We're selecting for unclaimed only
    var query = { "brand_name" : brand_name, process: elemMatch }
    var existingBounties = await mongoose.connection.db
        .collection("bounties")
        .find(query).toArray()

    for(var bounty of existingBounties){
      var bIncrementCompletionOrder = false;
      var indexToRemove = -1;
      for(var processStep in bounty.process){
        if(bounty.process[processStep].name == step_name){
          indexToRemove = processStep;
          bIncrementCompletionOrder = true;
          continue;
        }
        if(bIncrementCompletionOrder){
          bounty.process[processStep].completion_order--;
        }
      }
      if(indexToRemove != -1){
        bounty.process.splice(indexToRemove, 1)
      }

      var updateQuery = {}
      updateQuery["_id"] = mongoose.Types.ObjectId(bounty["_id"]);  // This ensure's we only update the intended document
      await mongoose.connection.db.collection("bounties").update(updateQuery, { "$set": { process: bounty.process } } );
    }

        this.res.status(200);
    this.res.json( {"directoy_sync": "requested" } ); 

  }

  async removeStepFromOneExistingBounty(){
    var refDocId = this.req.body.refDocId;
    
    var elemMatch = {}
    elemMatch = { "$elemMatch": { "refDocId" : refDocId } }
    var query = { process: elemMatch }

    var existingBounties = await mongoose.connection.db
        .collection("bounties")
        .findOne(query)

    var bounty = existingBounties;

      var bIncrementCompletionOrder = false;
      var indexToRemove = -1;
      for(var processStep in bounty.process){
        if(bounty.process[processStep].refDocId == refDocId){
          indexToRemove = processStep;
          bIncrementCompletionOrder = true;
          continue;
        }
        if(bIncrementCompletionOrder){
          bounty.process[processStep].completion_order--;
        }
      }

      if(indexToRemove != -1){
        bounty.process.splice(indexToRemove, 1)
      }

      for(var processStep of bounty.process){
        processStep["bStatus"] = false;
      }

      for(var processStep of bounty.process){

        // If these conditions are met, it means a step is currently in progress.  
        if(processStep["pipeline"] != "unclaimed"){
          if(processStep["status"] == "incomplete"){
            processStep["bStatus"] = false;
            break;
          }
        }

        if(processStep["pipeline"] == "unclaimed"){
          if(processStep["status"] == "incomplete"){
            processStep["bStatus"] = true;
            break;
          }
        }
      }

      var updateQuery = {}
      updateQuery["_id"] = mongoose.Types.ObjectId(bounty["_id"]);  
      ////console.log(4370, updateQuery, { "$set": { process: bounty.process } } );

      //console.log(553,  util.inspect({ "$set": { process: bounty.process } }, false, null, true /* enable colors */))
      var res = await mongoose.connection.db.collection("bounties").update(updateQuery, { "$set": { process: bounty.process } } );
      //console.log(4398, res.result);

    this.res.status(200);
    this.res.json( {"directoy_sync": "requested" } ); 

  }

  async addStepToExistingBounty(){
    var bounty_id = this.req.body.bounty_id;
    var step = this.req.body.step;
    //console.log(4408, bounty_id, step);

    var refDocId = this.req.body.refDocId;
    
    //var elemMatch = {}
    //elemMatch = { "$elemMatch": { "refDocId" : refDocId } }
    var query = { _id: mongoose.Types.ObjectId(bounty_id) }

    var existingBounty = await mongoose.connection.db
        .collection("bounties")
        .findOne(query)


    existingBounty["process"].splice(step.completion_order-1, 0, step)

    

    // Reset the whole thing
    var completion_order = 1;
    for(step of existingBounty["process"]){
      step["completion_order"] = completion_order;
      completion_order++;
      step["bStatus"] = false;
    }

    for(var processStep of existingBounty["process"]){

        // If these conditions are met, it means a step is currently in progress.  
        if(processStep["pipeline"] != "unclaimed"){
          if(processStep["status"] == "incomplete"){
            processStep["bStatus"] = false;
            break;
          }
        }

        if(processStep["pipeline"] == "unclaimed"){
          if(processStep["status"] == "incomplete"){
            processStep["bStatus"] = true;
            break;
          }
        }
    }

    //console.log(4423, existingBounty["process"]);
    
    var updateQuery = {}
      updateQuery["_id"] = mongoose.Types.ObjectId(bounty_id);  
      ////console.log(4370, updateQuery, { "$set": { process: bounty.process } } );

      ////console.log(553,  util.inspect({ "$set": { process: bounty.process } }, false, null, true /* enable colors */))
      var res = await mongoose.connection.db.collection("bounties").update(updateQuery, { "$set": { process: existingBounty["process"] } } );


    this.res.status(200);
    this.res.json( {"directoy_sync": "requested" } ); 

  }

  /*  We're switching to Google Documents and Google Sheets for anytime a bounty 
   *  has an associated spreadsheet or document.  Virtually all bounties will 
   *  have at least one.  This is a one-time function that will iterate through
   *  existing bounties, create an appropriate document, and update the bounty mongodb
   *  document as needed
  */

  async addGoogleFilesToExistingBounties(){
    var query = {
      owner: this.user.accountId, localFolder: {"$exists":true}, docs: {"$exists":true}
    }

        var d = require("@classes/integrations/google/drive/drive.js");
        var drive = new d();

    var existingBounties = await mongoose.connection.db
        .collection("bounties")
        .find(query, {"projection":{ "process": 0} } ).toArray()


        for(var bounty of existingBounties){

          var docs = bounty.docs
          //console.log(4110, docs);

          for(var doc of docs){
            
            try {
              var res = await drive.updatePermissions(doc.id);
            } catch(err){
              //console.log(4167, err);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

          }

          try {
                  //await this.updateBountyWithGoogleFiles(bounty._id, uploadedFiles);
          } catch(err){
                  //console.log(444, err);
          }

        //await new Promise(resolve => setTimeout(resolve, 1500));
    }

    //   if(typeof bounty.bountySpreadsheet == 'undefined'){
    //     // Make bounty spreadsheet
    //     await this.createBountySpreadsheet(bounty._id);
    //     // Wait one second to comply with Google Rate Limits.
    //     await new Promise(resolve => setTimeout(resolve, 2500));
    //   }
    //   if(typeof bounty.bountyDocument == 'undefined'){
    //     // Make bounty spreadsheet
    //     await new Promise(resolve => setTimeout(resolve, 2500));
    //     await this.createBountyDocument(bounty._id);
    //   }
    // }

    this.output({ "existingBounties": true });
  }

  async updateBountyWithGoogleFiles(bountyId, files){
        try {
        await mongoose.connection.db
          .collection("bounties")
          .updateOne({_id: mongoose.Types.ObjectId( bountyId ) }, {$set: { "docs": files } } );
        } catch(err){
          //console.log(1935, "Error Creating Spreadsheet");
        }
  }

  // async addGoogleFilesToExistingBounties(){
  //   var query = {
  //     owner: this.user.accountId
  //   }

  //       var d = require("@classes/integrations/google/drive/drive.js");
  //       var drive = new d();

  //   var existingBounties = await mongoose.connection.db
  //       .collection("bounties")
  //       .find(query, {"projection":{ "process": 0} } ).toArray()

  //   for(var bounty of existingBounties){
  //     var localFolder = bounty.localFolder;
  //     //console.log(localFolder);
  //     var uploadedFiles = await drive.syncLocalDocumentsWithDrive(localFolder);
  //     //console.log(4161, uploadedFiles);
  //   }

  // async updateBountyWithGoogleFiles(bountyId, files){
  //       try {
  //       await mongoose.connection.db
  //         .collection("bounties")
  //         .updateOne({_id: mongoose.Types.ObjectId( bountyId ) }, {$set: { "docs": files } } );
  //       } catch(err){
  //         //console.log(1935, "Error Creating Spreadsheet");
  //       }
  // }

  async createBountyDocument(bountyId){
        // We don't have a bounty document -- let's create one
        var d = require("@classes/integrations/google/docs/docs.js");
        var docs = new d();
        var documentId = await docs.createDocument();
        var bountyDocument = documentId;
        try {
        await mongoose.connection.db
          .collection("bounties")
          .updateOne({_id: mongoose.Types.ObjectId( bountyId ) }, {$set: { "bountyDocument": bountyDocument } } );
        } catch(err){
          //console.log(1935, "Error Creating Spreadsheet");
        }
  }

  async createBountySpreadsheet(bountyId){
           //console.log(1925, bountyId, "Bounty Spreadsheet doesn't exist");
        var s = require("@classes/integrations/google/sheets/sheets.js");
        var sheets = new s()
        var spreadsheetId = await sheets.createSpreadsheet();
        var bountySpreadsheet = spreadsheetId.spreadsheetId;
        try {
        await mongoose.connection.db
          .collection("bounties")
          .updateOne({_id: mongoose.Types.ObjectId( bountyId ) }, {$set: { "bountySpreadsheet": bountySpreadsheet } } );
        } catch(err){
          //console.log(1935, "Error Creating Spreadsheet");
        }
  }

  /* This was created to add updates to all process steps of existing bounties.  Intended as a one-time script to run
      and can be used in the future if we need to edit existing bounties with new data */

  async harmonizeExistingBounties(){
    var query = {
      owner: this.user.accountId
    }

    //console.log(3856, "harmonizeExistingBounties");

    var existingBounties = await mongoose.connection.db
        .collection("bounties")
        .find(query).limit(10).toArray()

      var existingUsers = [];
      async function lookupExistingUsers(user_id){
        for(var user in existingUsers){
          if(user._id == user_id){
            return user;
          }
        }

        var lookupQuery = { "_id": mongoose.Types.ObjectId(user_id) }
        var userF = await mongoose.connection.db.collection("users").findOne(lookupQuery, { "projection": { "first_name":1, "last_name":1 } })
        existingUsers.push(userF)
        return userF
      }

      async function updateBountyStep(bounty_id, process_step, user){

      }

    for(var bounty of existingBounties){
      
      var processSteps = bounty.process;
      try {
      for(var processStep of processSteps){
        if(processStep.pipeline != 'unclaimed'){
            const user = await lookupExistingUsers(processStep.pipeline)
            var updateQuery = { "refDocId" : processStep.refDocId }

              var objToMatch = {}
              objToMatch[`process.refDocId`] = processStep.refDocId;
              objToMatch[`process.status`] = "complete"
              objToMatch["_id"] = mongoose.Types.ObjectId(bounty._id)

                var objToUpdate = { "$set": { "process.$.completedTimestamp":moment.now() } } 
              var result = await this.model.update(
                  objToMatch,
                  objToUpdate,
                  { multi: true }
              );

              //console.log(3904, result);
        } 
      }
    }  catch (err) { console.log(3903, "problem with this one") } 
    }
   
    this.output({});
  }

 /*
     Required
     --------
     @param     string   release_for_bounty    ISODate      The new date that the user wants the bounties to be released on 
     @param     string   before                ISODate      All bounties before this date and after the 'after' date will be affected
     @param     string   after                 ISODate      All bounties after this date and before the 'before' date will be affected
     @param     string   brand_name            ISODate      The brand_name of the bounties to be affected.

     Optional
     ---------
     @param     string   limit                  Integer


     This function changes the release date for a set of bounties
 */
 async changeReleaseDate(){
   if(!this.requiredParams(["release_for_bounty", "before", "after", "brand_name"])){
     return;
   }

   /* Sample Query: db.bounties.update({"brand_name":"Top 40 Weekly", "release_for_bounty": { "$gte": "2022-04-18T00:00:00.0" } }, 
   { "$set" : { "release_for_bounty" : "2022-04-25T07:00:48.565Z"}}, {multi:true})
   */

   var brand_name = this.req.body.brand_name;
   var release_for_bounty = this.req.body.release_for_bounty;
   var before = this.req.body.before;
   var after = this.req.body.after;

   var searchQuery = {
     brand_name: brand_name,
     release_for_bounty: { "$gte" : after, "$lte": before }
   }

   var update = {
     "$set": { "release_for_bounty": release_for_bounty }
   }

   var multi = { multi: true }

   try {
     var updateResult = await mongoose.connection.db
          .collection("bounties")
          .update(searchQuery, update, multi);
   } catch(err){
     return this.error();
   }


   this.output({"update":updateResult});

 }

 /*  
      Required
      --------
      @param     string   release_for_bounty    ISODate
      
      Optional
      --------
      @param     string   brand_name            Text

      This function changes the "selected" boolean to indicate that all of these bounties
      are "selected" for this particular date.  
 */

 async selectAllOnParticularDate(){
   if(!this.requiredParams(["release_for_bounty"], ["brand_name"])){
     return;
   }
 }

 /*
      Required
      --------
      @param    string    refDocId              Text

      This function "fires" a contractor -- it removes them from the claimed bounty, bans them from claiming it again,
      and releases releases the bounty to new contractors
 */

 async firecontractor(){
   if(!this.requiredParams(["refDocId"])){
     return;
   }

    var query = {
      "process.refDocId":this.req.body.refDocId
    };

    var update = {
      $set: {
        "process.$[elem].bStatus": false,
        "process.$[elem].status": 'incomplete',
        "process.$[elem].pipeline": "unclaimed",
        "process.$[elem].friendlyFirstName": "unclaimed",
        "process.$[elem].friendlyLastName":""
      },
    };

    var setbStatusFalse = {
      $set: {
        "process.$[].bStatus": false
      }
    };

    var filters = {
      multi: false,
      arrayFilters: [
        { "elem.refDocId": { $eq: this.req.body.refDocId } },
      ],
    };

    try {
      var setStatusFalseResult = await mongoose.connection.db
          .collection("bounties")
          .update(query, setbStatusFalse);
    } catch(err){
      //console.log(4505, err)
    }

    //console.log(4508, query, setStatusFalseResult.result)

    try {
      var updateResult = await mongoose.connection.db
          .collection("bounties")
          .update(query, update, filters);
    } catch(err){
      //console.log(4513, err);
    }

    this.setFirstIncompleteStepActive();

    this.output({"update":updateResult});
 }

 async setFirstIncompleteStepActive(){

    var query = {
      "process.refDocId":this.req.body.refDocId
    };

    //console.log(4519, query);

    var result = await mongoose.connection
        .collection("bounties")
        .findOne(query);

    if(result == null){
      return false;
    }

    var refDocId = null;
    var name = "";
    for(var p of result.process){
      //console.log(4542, p)
      if(p["pipeline"] == "unclaimed"){
        if(p["status"] == "incomplete"){
          refDocId = p["refDocId"];
          name = p["name"];
          //console.log(4545, refDocId);
          break;
        }
      }
    }

    //console.log(4551, refDocId)

    query = {
      "process.refDocId": refDocId
    };

    var update = {
      $set: {
        "pipeline": name,
        "process.$[elem].bStatus": true
      }
    }    

    var filters = {
      multi: false,
      arrayFilters: [
        { "elem.refDocId": { $eq: refDocId } },
      ],
    };

    var setStatus = await mongoose.connection.db
      .collection("bounties")
      .update(query, update, filters);

    //console.log(4525, query, update, filters.arrayFilters);

    //this.output({"update":""});

 }

 async forcecomplete(){
   if(!this.requiredParams(["refDocId"])){
     return;
   }

    var query = {
      "process.refDocId":this.req.body.refDocId
    };

    var update = {
      $set: {
        "process.$[elem].bStatus": false,
        "process.$[elem].status": 'complete',
        "process.$[elem].pipeline": mongoose.Types.ObjectId(this.user.id),
        "process.$[elem].friendlyFirstName": this.user.first_name,
        "process.$[elem].friendlyLastName": this.user.last_name
      },
    };

    var filters = {
      multi: false,
      arrayFilters: [
        { "elem.refDocId": { $eq: this.req.body.refDocId } },
      ],
    };

    var updateResult = await mongoose.connection.db
        .collection("bounties")
        .update(query, update, filters);

    this.setFirstIncompleteStepActive();

    this.output({"update":updateResult});
 }

 async forcecompleteeverything(){
   if(!this.requiredParams(["bounty_id"])){
     return;
   }

    var query = {
      _id:this.req.body.bounty_id
    };

    var update = {
      $set: {
        "pipeline":"Completed"
        // "process.$[].bStatus": false,
        // "process.$[].status": 'complete',
        // "process.$[].pipeline": mongoose.Types.ObjectId(this.user.id),
        // "process.$[].friendlyFirstName": this.user.first_name,
        // "process.$[].friendlyLastName": this.user.last_name
      }
    };

    var updateResult = await mongoose.connection.db
        .collection("bounties")
        .updateOne(query, update);


    this.output({"update":updateResult});
 }

 async attachGoogleSpreadsheetToBounty(){

 }

 async attachGoogleDocToBounty(){
   
 }

 // Resets the speed of ALL bounties for a brand to a particule speed
 async setDefaultTeleprompterSpeedAllBounties(){

   var query = {
     brand_id: mongoose.Types.ObjectId(this.req.body.brand_id)
   }

   var update = {
     $set: { "teleprompter_speed": this.req.body.teleprompter_speed}
   }

   var multi = {
     multi: true
   }

   var updateResult = await mongoose.connection.db
    .collection("bounties")
    .update(query, update, multi);

    this.output( { "update": updateResult } );



 }

 // Resets the speed of ALL bounties for a brand to a particule font size
 async setDefaultTeleprompterSizeAllBounties(){

   var query = {
     brand_id: mongoose.Types.ObjectId(this.req.body.brand_id)
   }

   var update = {
     $set: { "teleprompter_size": this.req.body.teleprompter_size}
   }

   var multi = {
     multi: true
   }

   var updateResult = await mongoose.connection.db
    .collection("bounties")
    .update(query, update, multi);

    this.output( { "update": updateResult } );

 }

 // Locks the teleprompter only.  Useful for when practicing script
 async lockTeleprompter(){

   // First, find a teleprompter associated with this user
   var query = {
     owner: mongoose.Types.ObjectId(this.req.body.owner_id),
     device_type: "teleprompter"
   }

   var lockGroup = "79417"
   var unlockGroup = "32488"


   var findResult = await mongoose.connection.db
     .collection("devices")
     .find(query).toArray();

    var response = findResult;

    let config = {
  headers: {
      "Authorization": "Basic bFI3emhZdFNLRlhIM2FKZXpmajRGNXNXMzdRNDRCeFZnQ3pzV2c2VFNyV20ycUpJSzJQYjhSaEZ0b3pzMEN2VTo="
    }
  }

  var bUnlocked = false;
   if(findResult.length == 0){
     response = "No Teleprompters Found"
   } else {
     for(var device of findResult){
       //console.log(5755, device);
       var device_id = device.device_id;
       let api_url = "https://a.simplemdm.com/api/v1/device_groups/" + lockGroup + "/devices/" + device_id
       //console.log(5756, api_url);
       try {
        response = await axios.post(api_url, null, config);
        bUnlocked = true;
       } catch(err){
         //console.log(5760, err.response.data);
       }
       //console.log(5757, response);
       // NetworkRequestController.basicAuthorization = 
       // httpVerb = "POST"
     }
   }

   this.output( { "lock_teleprompter": bUnlocked });

 }

 // Unlocks the teleprompter
 async unlockTeleprompter(){
   // First, find a teleprompter associated with this user
   var query = {
     owner: mongoose.Types.ObjectId(this.req.body.owner_id),
     device_type: "teleprompter"
   }

   var lockGroup = "79417"
   var unlockGroup = "32488"


   var findResult = await mongoose.connection.db
     .collection("devices")
     .find(query).toArray();

    var response = findResult;

    let config = {
  headers: {
      "Authorization": "Basic bFI3emhZdFNLRlhIM2FKZXpmajRGNXNXMzdRNDRCeFZnQ3pzV2c2VFNyV20ycUpJSzJQYjhSaEZ0b3pzMEN2VTo="
    }
  }

  var bUnlocked = false;
   if(findResult.length == 0){
     response = "No Teleprompters Found"
   } else {
     for(var device of findResult){
       //console.log(5755, device);
       var device_id = device.device_id;
       let api_url = "https://a.simplemdm.com/api/v1/device_groups/" + unlockGroup + "/devices/" + device_id
       //console.log(5756, api_url);
       try {
        response = await axios.post(api_url, null, config);
        bUnlocked = true;
       } catch(err){
         //console.log(5760, err.response.data);
       }
       //console.log(5757, response);
       // NetworkRequestController.basicAuthorization = 
       // httpVerb = "POST"
     }
   }

   this.output( { "unlock_teleprompter": bUnlocked });

 }

 requiredParams(requiredKeys, optionalKeys){
   var keysInBody = Object.keys(this.req.body);

   var missingKeys = [];

   // Check for any missing keys
   for(var key of requiredKeys){
     if(keysInBody.indexOf(key) == -1){
       missingKeys.push(key)
     }
   }

   var extraKeys = [];
   // Check for extra keys
   for(var key of keysInBody){
     if(requiredKeys.indexOf(key) == -1){
       extraKeys.push(key);
     }
   }

   if((missingKeys.length == 0)&&(extraKeys.length == 0)){
     return true;
   }

   this.error( {
          raw: { 
            error: 104,
            extraInfo: {
              extraParameters: extraKeys,
              missingParameters: missingKeys
            },
            message: "You have extra or missing parameters in your POST request"
          }});

   return false;
 }

 async summarizeRecentlyCompletedBounties(){
   // var query = {
   //   "process":
   //     { "$elemMatch":
   //       {"status":"complete", "completedTimestamp": 
   //         {"$gte": (Date.now() - 24*60*60*1000) }}}
   //  } 
   //  var projection = {"process": { "$elemMatch": { "completedTimestamp": {"$gte": Date.now() - 24*60*60*1000 }}}, "keywords":1, brand_id: 1 }

   //  var result = await mongoose.connection.db
   //      .collection("bounties")
   //      .find(query, { "projection": projection }).toArray();

    // db.bounties.aggregate(
    var query = [ 
      {"$unwind": "$process"}, 
      {"$match": { "process.completedTimestamp": { "$gte": Date.now() - 24*60*60*1000*30 }}}, 
      {"$project": {"process": 1, "keywords":1, "brand_id":1}} 
    ]
    
    var result = await mongoose.connection.db
        .collection("bounties")
        .aggregate(query).toArray()

    var brand_id = result[0]["brand_id"];
    ////console.log(4842, result);

    //console.log(553,  util.inspect(result, false, null, true /* enable colors */))

    var contractors = {};

    var descriptions = `In the last 7 days:`;

    for(var completedBounties of result){
      var p = completedBounties["process"];
      var start = moment(p.claimedTimestamp);
      var end = moment(p.completedTimestamp);
      
      var duration = moment.duration(end.diff(start));

      ////console.log(p.claimedTimestamp, p.completedTimestamp, duration.asMinutes(), duration.asHours())

      var minutes = duration.asMinutes();

      var descriptor = "minutes";
      var interval = parseInt(minutes);

      if(minutes > 59){
        var hours = duration.asHours();
        descriptor = "hours";
        interval = parseInt(hours);
      }
      
      var contractorName = `${p.friendlyFirstName} ${p.friendlyLastName}`
      if(typeof contractors[contractorName] == 'undefined'){
         contractors[contractorName] = {};
         contractors[contractorName]["completedBounties"] = 1
      } else {
        contractors[contractorName]["completedBounties"]++;
        //if(p.friendlyFirstName == "Salma")
          //console.log(5360, p.name, moment(p.completedTimestamp).format())
      }

      var description = `${p.friendlyFirstName} ${p.friendlyLastName} completed the "${p.name}" step for keywords ${voca.titleCase(completedBounties["keywords"][0])} in ${interval} ${descriptor}`
     // //console.log(4847, description);

      //descriptions += description + "\n";
    }

    for(var key of Object.keys(contractors)){
      var summary = `${key} completed ${contractors[key]["completedBounties"]} bounties`;
      ////console.log(summary);
      descriptions += summary + "\n";
    }

    ////console.log(contractors);

    //this.notifySlack(brand_id, descriptions);

    this.output(descriptions);
 }

 async analyzeCommonKeywords(){

   var keywordsAr = [];
   var content_type = this.req.headers['content-type'];
   if(content_type == "text/plain"){
     keywordsAr = voca.split(this.req.body, "\n");
   } else {
     keywordsAr = this.req.body.keywords;
   }

   //console.log(5098, keywordsAr);
   

   var maxWords = 0;
   var averageWords = 0;
   var distinctWordCount = 0;
   var allWordsAr = []
   for(var keyword of keywordsAr){
     if(voca.countWords(keyword) > maxWords){
       maxWords = voca.countWords(keyword)
     }
     var words = voca.words(keyword)
     allWordsAr = allWordsAr.concat(words)
   }

   
   var distinctWordsAr = [ ... new Set(allWordsAr)];
   var distinctWords = distinctWordsAr.length;

   // We're also interested in word pairs and word triplets
   //console.log(5276, distinctWordsAR)

   var distinctWordAnalysis = {}

   for(var distinctWord of distinctWordsAr){
     for(keyword of keywordsAr){
       var words = voca.words(keyword)
         for(var word of words){

           if(word == distinctWord){
             if(typeof distinctWordAnalysis[word] == 'undefined'){
               distinctWordAnalysis[word] = {};
               distinctWordAnalysis[word]["count"] = 0;
               distinctWordAnalysis[word]["keywords"] = []
             }
             distinctWordAnalysis[word]["count"]++;
             distinctWordAnalysis[word]["keywords"].push(keyword);
           }
       }
     }
   }



   this.res.status(200);
   this.res.json({"working":distinctWordAnalysis})
 }

 async determineLucrativeKeywords(){

   var siteName = this.req.body.site;

   var keywords = this.req.body.spreadsheet[0].sheetdata;

   // var keywords = await mongoose.connection.db
   //      .collection("keywords")
   //      .find({}).toArray()

   var not_ranking = [];
   var csv = ``
   var rankedKeywords = 0;
   var unrankedKeywords = 0;
   for(var keyword of keywords){
     
     var bRanks = false;
     if(Array.isArray(keyword["URL"])){
     for(var site of keyword["URL"]){
         ////console.log(site);
         if(voca.indexOf(site, siteName) != -1){
           ////console.log(5071, "Site Ranks For", keyword["Keyword"]);
           ////console.log(5072, keyword)
           bRanks = true;
         }
       }
     }
     if(bRanks){
       rankedKeywords++;
     } else {
       unrankedKeywords++;
       not_ranking.push(`${keyword["Keyword"]}\t${keyword["Volume"][0]}\t${keyword["Difficulty"][0]}`)
       csv += `${keyword["Keyword"]},${keyword["Volume"][0]},${keyword["Difficulty"][0]}\n`
     }

   }

     //console.log(5084, siteName, "Ranks for", rankedKeywords)
     //console.log(5084, siteName, "Does Not Rank for", unrankedKeywords)

   this.res.status(200);
   this.res.send(csv);

 }

 async checkForAllRequiredVideoFiles(bounty_id){
       var bountyVideoFiles= await mongoose.connection.db
        .collection("bounties")
        .findOne({_id: mongoose.Types.ObjectId(bounty_id)}, {projection: { "expected_video_files":1, bountyFolderId:1, _id:0 } });

        //console.log(5355, bountyVideoFiles.expected_video_files);

  if(typeof bountyVideoFiles.expected_video_files == 'undefined'){
    // No video files are expected -- return true;
    return [];
  }

  var bountyFolderId = bountyVideoFiles.bountyFolderId;
  await this.initBoxObj();
  var files = await this.box.listAll(bountyFolderId);
  //console.log(5320, files);
  var fileNames = [];
  if(Array.isArray(files)){
    for(var item of files){
      fileNames.push(item.name);
    }
  }

  //console.log(5360, fileNames);
  var missingFiles = [];
  for(var neededFile of bountyVideoFiles.expected_video_files){
    var bFilePresent = false;
    neededFile = neededFile + "-compressed.mp4";
    for(var uploadedFile of fileNames){
      //console.log(5361, uploadedFile, neededFile);
      if(uploadedFile == neededFile){
        bFilePresent = true;
      }
    }
    //console.log(5359, neededFile);
    if(bFilePresent == false){
      missingFiles.push(neededFile);
      //console.log(5358, neededFile, "not present");
      //return false;
    }
  }

  return missingFiles;

 }

 async verifyBackupFolderFileUploaded(){

   var firstU = voca.indexOf(this.req.body.filename, "_");
   var filename = this.req.body.filename
   var bountyFolderId = voca.substring(filename, 0, firstU);


  var backupFilename = this.req.body.filename + "-compressed.mp4"
  await this.initBoxObj();
  var files = await this.box.listAll(bountyFolderId);
  
  var fileNames = [];
  if(Array.isArray(files)){
    for(var item of files){
      fileNames.push(item.name);
      if(item.name == backupFilename){
        return this.output({ "fileUploaded": true, "origfilename": this.req.body.filename, "filename": item.name})
      }
    }
  }

 return this.output({ "fileUploaded": false, "origfilename": this.req.body.filename, "filename": backupFilename});

 }

 // This is used in resetting a file in the case of a failed upload
 async deletePartialMatches(){

  var filename = this.req.body.filename;

  await this.initBoxObj();
  var files = await this.box.listAll(this.req.body.bountyFolder);   

  var dashPositions = [];
  var pos = 0;
  for(var character of filename){
    if(character == '-'){
      dashPositions.push(pos);
    }
    pos++;
  }

  

  // 180154078014_test_camera-1-part-1-2%20Nov%202022%208_31-485D20B6-38A3-4891-B9BF-B5E385EF55AE.mov-compressed

  var partialMatch = voca.substring(filename, 0, dashPositions[3]);

  await this.initBoxObj();
  var files = await this.box.listAll(this.req.body.bountyFolder);

  for(var file of files){
    if(voca.indexOf(file.name, partialMatch) != -1){
      await this.box.deleteFile(file.id)
      //console.log(5626, "will delete", file.id)
    }
  }

  return this.output({ "partialMatch":partialMatch})

 }

 async deletePartials(filename, bountyFolder){
   var files = await this.box.listAll(bountyFolder);   

  var dashPositions = [];
  var pos = 0;
  for(var character of filename){
    if(character == '-'){
      dashPositions.push(pos);
    }
    pos++;
  }

  var partialMatch = voca.substring(filename, 0, dashPositions[3]);

  await this.initBoxObj();
  var files = await this.box.listAll(this.req.body.bountyFolder);

  for(var file of files){
    if(voca.indexOf(file.name, partialMatch) != -1){
      await this.box.deleteFile(file.id)
      //console.log(5626, "will delete", file.id)
    }
  }

 }

 async resetFile(){

   var filename = this.req.body.filename;
   var firstU = voca.indexOf(filename, "_");
   var folderId = voca.substring(filename, 0, firstU);

  var res = await mongoose.connection.db
        .collection("uploads")
        .remove({filename: filename});

  await this.deletePartials(filename, folderId);


 }

 async deleteUploadRecord(){

      var res = await mongoose.connection.db
        .collection("uploads")
        .remove({filename: this.req.body.filename});

      return this.output({ "deleteResult": res })
 
 }

 async deleteLargeFileUpload(){

 }

 async getselecteddocs(){

    var selectedBounties = await mongoose.connection.db
        .collection("bounties")
        .find({created_by: mongoose.Types.ObjectId(this.user._id), selected: true }, {projection: { bountyDocument: 1, _id:0 }}).toArray();

    var bountyDocs = []
    for(var item of selectedBounties){
      bountyDocs.push(item.bountyDocument)
    }

    this.output({ bounty_documents: bountyDocs });

 }

 async updatebountyscript(){
   console.log(this.req.body.script_link);
   var bountyId = this.req.params["id"];

   var query = {
      "_id":mongoose.Types.ObjectId(bountyId)
    };

    var documentIdFromLink = this.extractDocumentIdFromUrl(this.req.body.script_link);

    var update = {
      $set: { "bountyScript": documentIdFromLink },
    };

    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update);
    } catch (err) {
      console.log(6225, err);
    }

    console.log(6260, bountyId, documentIdFromLink);

    this.output({"script_id":documentIdFromLink});


 }

  async updatebountydocument(){
   console.log(this.req.body.script_link);
   var bountyId = this.req.params["id"];

   var query = {
      "_id":mongoose.Types.ObjectId(bountyId)
    };

    var documentIdFromLink = this.extractDocumentIdFromUrl(this.req.body.script_link);

    var update = {
      $set: { "bountyDocument": documentIdFromLink },
    };

    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update);
    } catch (err) {
      console.log(6225, err);
    }

    console.log(6260, bountyId, documentIdFromLink);

    this.output({"script_id":documentIdFromLink});


 }

  async updatebountyspreadsheet(){
   console.log(this.req.body.script_link);
   var bountyId = this.req.params["id"];

   var query = {
      "_id":mongoose.Types.ObjectId(bountyId)
    };

    var documentIdFromLink = this.extractDocumentIdFromUrl(this.req.body.script_link);

    var update = {
      $set: { "bountySpreadsheet": documentIdFromLink },
    };

    try {
      var result = await mongoose.connection.db
        .collection(this.model.collection.collectionName)
        .updateOne(query, update);
    } catch (err) {
      console.log(6225, err);
    }

    console.log(6260, bountyId, documentIdFromLink);

    this.output({"script_id":documentIdFromLink});


 }

 extractDocumentIdFromUrl(url) {
  const regex = /\/d\/(.+?)(?:\/|$)/;
  const match = regex.exec(url);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}


 async getselectedsheets(){

    var selectedBounties = await mongoose.connection.db
        .collection("bounties")
        .find({created_by: mongoose.Types.ObjectId(this.user._id), selected: true }, {projection: { bountySpreadsheet: 1, _id:0 }}).toArray();

    var bountyDocs = []
    for(var item of selectedBounties){
      bountyDocs.push(item.bountyDocument)
    }

    this.output({ bounty_spreadsheets: bountyDocs });

 }

 async transferBrand(){

   // User     "created_by" : ObjectId("5f02e916088543053e9f2ee6")
   // Account  "owner" : ObjectId("5f02e916088543053e9f2ee7")

   var account_from = this.req.body.account_from;
   var account_to = this.req.body.account_to;

   var user_from = this.req.body.user_from;
   var user_to = this.req.body.user_to;

   var brand_id = this.req.body.brand_id;

   // var bountyUpdateResult = await mongoose.connection.db
   //      .collection("bounties")
   //      .update(
   //        { brand_id: mongoose.Types.ObjectId(brand_id), created_by: mongoose.Types.ObjectId(user_from), owner: mongoose.Types.ObjectId(account_from) },
   //        { $set: { owner: mongoose.Types.ObjectId(account_to), created_by: mongoose.Types.ObjectId(user_to), modified_by: mongoose.Types.ObjectId(user_to), owner: mongoose.Types.ObjectId(account_to) } }, {multi:true} )

await mongoose.connection.db.collection("bounties").update( 
{  "brand_id": mongoose.Types.ObjectId(brand_id),
  "created_by": mongoose.Types.ObjectId(user_from),
  "owner": mongoose.Types.ObjectId(account_from)
},
{
  $set: {
    "owner": mongoose.Types.ObjectId(account_to),
     "created_by": mongoose.Types.ObjectId(user_to),
     "modified_by": mongoose.Types.ObjectId(user_to)
  }
},
{
  multi:true
});

   var brandUpdateResult = await mongoose.connection.db
        .collection("brands")
        .update(
          { _id: mongoose.Types.ObjectId(brand_id), created_by: mongoose.Types.ObjectId(user_from), owner: mongoose.Types.ObjectId(account_from) },
          { $set: { owner: mongoose.Types.ObjectId(account_to), created_by: mongoose.Types.ObjectId(user_to), modified_by: mongoose.Types.ObjectId(user_to), owner: mongoose.Types.ObjectId(account_to) } }, {multi:true} )


    this.output( { "update": true } );
   /*

  Brands

   "created_by" : ObjectId("5f02e916088543053e9f2ee6"),
  "modifiedAt" : "2022-11-16T13:04:00+00:00",
  "modified_by" : ObjectId("5f02e916088543053e9f2ee6"),
  "monthly_budget" : 0,
  "new_post_login" : "",
  "new_post_pw" : "",
  "new_post_url" : "",
  "owner" : ObjectId("5f02e916088543053e9f2ee7")
   */

   /*

  Bounties

"created_by" : ObjectId("5f02e916088543053e9f2ee6"),
  "modified_by" : ObjectId("5f02e916088543053e9f2ee6"),
  "owner" : ObjectId("5f02e916088543053e9f2ee7"),
  "createdAt" : "2022-11-16T13:11:32+00:00",
  "modifiedAt" : "2022-11-16T13:11:32+00:00",
  "selected" : false,
  "brand_name" : "Delete Next",
  "brand_id" : ObjectId("6374e184328daef892cb5bda")

   */

 }

 // async getunfinishedfilmingbounties(){

 //  var selectedBounties = await mongoose.connection.db
 //        .collection("bounties")
 //        .find({created_by: mongoose.Types.ObjectId(this.user._id), selected: true }, {projection: { bountySpreadsheet: 1, _id:0 }}).toArray();

 // }


   async breakLongInputIntoPrompts(){

     // var prompt = `This is a transcript of an audio file created by Whisper.  I want you to rewrite the text for a teleprompter, accounting for and automatically correcting any possible mistakes in the transcription.  Do no rewrite or change words, it should be as accurate a transcript as possible.  Add punctuation if needed.  Break apart into paragraphs as appropriate.  Max paragraph size should be 8-10 sentences. Transcript: `

     var prompt = `This is a transcript of an audio file created by Whisper.  I need you to add punctuation and paragraphs, but otherwise do not change any of the words.  Break apart into paragraphs as appropriate.  Max paragraph size should be 8-10 sentences.  Transcript: `

     var longInput = this.req.body.input;

     var longInput = this.req.body.longInput;
     var words = longInput.split(" ");
     var outputAr= [];
     var output = "";
     var characterCount = 0;

      for (var i = 0; i < words.length; i++) {
        characterCount += words[i].length;
        output += words[i] + " "
      if (characterCount >= 2000) {
        // Do something
        outputAr.push(prompt + " " + output);
        output = "";
        characterCount = 0;
      } else {
        // Do something else
      }

      }

      this.output({ outputAr });

   }

  // End of Class
}

function identifyObjectIds(obj){
  var jsonBody = obj;

  if(jsonBody != null){
  for (const [key, value] of Object.entries(jsonBody)) {
    if(voca.includes(key, "_id")){
      try {
        jsonBody[key] = mongoose.Types.ObjectId(value)
      } catch(err){
        // maybe it's not an object id
        jsonBody[key] = value;
      }
    }
  }
  }
  return jsonBody
}

var methods = Object.getOwnPropertyNames(Actions.prototype); 
var excludes = ["constructor", "output", "error"];

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

var routestr = `/*/:datasource/action/:action/id/:id`;
router.all(routestr, routeDataSource);

routestr = `/*/:datasource/action/:action`;
router.all(routestr, routeDataSource);

module.exports = router;

