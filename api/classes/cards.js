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
var Gmail = require("@classes/gmail.js")

var PizZip = require('pizzip');
var Docxtemplater = require('docxtemplater');
var path = require('path');

function routeDataSource(req, res, next) {
  var action = req.params["cards"];
  action = voca.replace(action, " ", "");

  console.log(req.params);

  req.body = identifyObjectIds(req.body)

  var Card = new Cards(req, res, next);
  var evalCode = "Card." + action + "()";

  console.log(evalCode);

  try {
    eval(evalCode);
  } catch (err) {
    var desc = {
      raw: {
        message: "This method is not defined",
      },
    };
    Card.error(desc);
  }
}

/*
    This class is designed to provide dashboard card info
*/

class Cards {
  constructor(req, res, next) {
    this.className = "actions";
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    this.modelName = "Bounty";

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
    console.log(263, err);
    if (err.raw.message != null) {
      defaultErrorResponse.error = 33000;
      defaultErrorResponse.ErrorDetails.Error = 33000;
      defaultErrorResponse.ErrorDetails.Description = err.raw.message;
    }

    this.res.status(500);
    this.res.json(defaultErrorResponse);
  }

  async a12345() {
    this.output({
      result: "approve"
    });
  }

  async test() {
    this.output({
      result: "approve"
    });
  }


  /*   "Unclaimed" bounties represent bounties that are available to freelancers, but have not yet been claimed
        by anyone.

        This is why in the query we are checking for the "process.0.pipeline" -- because if this bounty has never been
        claimed or started by anyone, process.0.pipeline will equal 'unclaimed'
  */
  async getUnclaimedBounties() {

    var isoDateString = new Date().toISOString()

    var aggregate = [
    { '$match': { owner: this.user.accountId } },
    { '$match': { 'process.0.pipeline': { '$eq': 'unclaimed' } } },
    { '$match': { 'process.0.bStatus': { '$eq': true } } },
    { '$match': { "release_for_bounty" : {$lte:isoDateString }}},
    { '$count': 'bounty' }
  ]

   var bounties = await this.model.aggregate(aggregate);
    this.output({
      result:{
        bounties
      }
    });
  }
  async getUnclaimedBountiesWithSummary() {

    var isoDateString = new Date().toISOString()

    var aggregate = [
      {$facet:{
        "bounties":[{ '$match': { owner: this.user.accountId } },
        { '$match': { 'process.0.pipeline': { '$eq': 'unclaimed' } } },
        { '$match': { 'process.0.bStatus': { '$eq': true } } },
        { '$match': { "release_for_bounty" : {$lte:isoDateString }}},
        { '$count': 'bounty' }],
        "summary":[
          { '$match': { owner: this.user.accountId } },
          { $sort: {_id: -1} },
          { $unwind: "$process"},
    { '$match': { 'process.pipeline': { '$eq': 'unclaimed' } } },
    { '$match': { 'process.bStatus': { '$eq': true } } },
    { '$match': { "release_for_bounty" : {$lte:isoDateString }}},
    { $lookup: {
      from: "users",
      localField: "process.pipeline",
      foreignField: "_id",
      as: "user"
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
        "folderId":1,
        "first_name":"$user.first_name",
        "last_name":"$user.last_name",
        "step":"$process.bStatus",
        "bounty": "$bounty"
  }},
  // { $limit: 5 }
        ]
      }},
  ]

  console.log(110, util.inspect(aggregate, false, null, true /* enable colors */));

    var bounties = await this.model.aggregate(aggregate);
    this.output({
      result:{
        "bounties":bounties[0].bounties,
          "summary":bounties[0].summary
      }
    });
  }

//   async getUnclaimedBounties() {
//     var bounties= await this.model.aggregate([
//       { $match: {"owner": this.user.accountId}},
//       { $unwind: "$process"},
//       { $match: {"process.bStatus": {$ne: false}}},
//       { $match: {"process.pipeline":{$eq:"unclaimed"}}},
//       { $match: {"process.status":{$eq:"incomplete"}}},
//       { $lookup: {
//           from: "users",
//           localField: "process.pipeline",
//           foreignField: "_id",
//           as: "user"
//       }
//     }, { "$project":{
//           "brand_name":1,
//           "content_type":1,
//           "bounty":"$process.bounty",
//           "refDocId":"$process.refDocId",
//           "name":"$process.name",
//           "description":"$process.description",
//           "pipeline":1,
//           "keywords":1,
//           "completion_order":"$process.completion_order",
//           "folderId":1,
//           "in_progress":"$process.bStatus"
// }},{$count:"bounty"}]);
//     this.output({
//       result:{
//         bounties
//       }
//     });
//   }

  /*   These should represent bounties that have been claimed, but not yet finished.  We are waiting for the assigned freelancer
       to complete the assignment, upload the work and click on "complete"
  */
  async getInProcessBounties() {

  var bounties=await this.model.aggregate([
    { $match: {"owner": this.user.accountId}},
    { $unwind: "$process"},
    { $match: {"process.pipeline":{$ne:"unclaimed"}}},
    { $match: {"process.status":{$eq:"incomplete"}}},
    { $lookup: {
        from: "users",
        localField: "process.pipeline",
        foreignField: "_id",
        as: "user"
    }},{ "$project":{
        "brand_name":1,
        "content_type":1,
        "bounty":"$process.bounty",
        "refDocId":"$process.refDocId",
        "name":"$process.name",
        "description":"$process.description",
        "pipeline":1,
        "keywords":1,
        "completion_order":"$process.completion_order",
        "folderId":1,
        "first_name":"$user.first_name",
        "last_name":"$user.last_name",
        "in_progress":"$process.bStatus"
}},{$count: "bounty"}])
    this.output({ 
      result:{
        bounties
      }
    });

  }
  async getInProcessBountiesWithSummary() {

    var bounties=await this.model.aggregate([
      {$facet:{
        "bounties":[
          { $match: {"owner": this.user.accountId}},
          { $unwind: "$process"},
          { $match: {"process.pipeline":{$ne:"unclaimed"}}},
          { $match: {"process.status":{$eq:"incomplete"}}},
          { $count: "bounty" }
        ],
        "summary":[
          { $match: {"owner": this.user.accountId}}, 
                  { $sort: {_id: -1} }, // This will need to be updated to date in the future
                  { $unwind: "$process"},
                  { $match: {"process.pipeline":{$ne:"unclaimed"}}},
                  { $match: {"process.status":{$eq:"incomplete"}}},
                  { $lookup: {
                      from: "users",
                      localField: "process.pipeline",
                      foreignField: "_id",
                      as: "user"
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
                        "folderId":1,
                        "first_name":"$user.first_name",
                        "last_name":"$user.last_name",
                        "step":"$process.bStatus",
                        "bounty": "$bounty"
                  }},
                  // { $limit: 5 }
                ]
      }
    }
  ]
    )    
      this.output({ 
        result:{
          "bounties":bounties[0].bounties,
          "summary":bounties[0].summary
        }
      });
  
    }

  /*   These represent bounties that are 100% done.  The last step in the process is completed an no further
       activity will occur for these bounties
  */
  async getCompletedBounties() {

    await this.getCompletedBountiesWithSummary()
    
    // var aggregate = [
    //   { $match: {"owner": this.user.accountId}},
    //   { $match: {"pipeline": "Completed" } },
    //   { $unwind: "$process"},
    //   { $match: {"process.bStatus": {$eq: false}}},
    //   { $match: {"process.status":{$eq:"complete"}}},
    //   { $lookup: {
    //       from: "users",
    //       localField: "process.pipeline",
    //       foreignField: "_id",
    //       as: "user"
    //   }
    //   }, 
    //   { "$project":{
    //         "brand_name":1,
    //         "content_type":1,
    //         "bounty":"$process.bounty",
    //         "refDocId":"$process.refDocId",
    //         "name":"$process.name",
    //         "description":"$process.description",
    //         "pipeline":1,
    //         "keywords":1,
    //         "completion_order":"$process.completion_order",
    //         "folderId":1,
    //         "first_name":"$user.first_name",
    //         "last_name":"$user.last_name",
    //         "step":"$process.bStatus",
    //         "bounty": "$bounty"
    //   }},
    //   { $limit: 5 },
    //   { $facet:
    //         { "bounty" :
    //           [
    //                 { $match: {"owner": this.user.accountId}},
    //                 { $match: {"pipeline": "Completed" } },
    //                 { $unwind: "$process"},
    //                 { $match: {"process.bStatus": {$eq: false}}},
    //                 { $match: {"process.status":{$eq:"complete"}}},
    //                 { $count: "bounty" }
    //           ]            
    //         }
    //   }
    //   // 
    //   ]

      
      // var bounties = await this.model.aggregate(aggregate)
      // this.output({ 
      //   result:{
      //     bounties
      //   }
      // });

  }

  async getCompletedBountiesWithSummary(){

    var isoDateString = new Date().toISOString()

  var aggregate = 
    [
     { 
        $facet: 
         { 
           "bounties": [ 
              { $match: {"owner": this.user.accountId}},
              { $match: {"pipeline": "Completed" } },
              { $count: "bounty" }
           ],
           "summary" : [
                    { $match: {"owner": this.user.accountId}}, 
                    { $match: {"pipeline": "Completed" } },
                    { $sort: {_id: -1} }, // This will need to be updated to date in the future

                    { "$project":{
                          "brand_name":1,
                          "content_type":1,
                          "refDocId":"$process.refDocId",
                          "name":"$process.name",
                          "description":"$process.description",
                          "pipeline":1,
                          "keywords":1,
                          "completion_order":"$process.completion_order",
                          "completion_date":1,
                          "folderId":1,
                          "first_name":"$user.first_name",
                          "last_name":"$user.last_name",
                          "step":"$process.bStatus",
                          "bounty": { "$sum": "$process.bounty" },
                          "published_link":1,
                          "bountyFolderSharedLink":1,
                          "completion_date":1
                    }},
                    // { $limit: 5 }
           ] 
         }
     }

  ]

  var bounties = await this.model.aggregate(aggregate)

  var summaryTextAr = [];
  for(var i = 0; i < bounties[0].summary.length; i++){
    var summary = bounties[0].summary[i];
    var keywords = '';
    if(summary.keywords.length > 0){
      keywords = `for keywords '${summary.keywords.toString("and")}' `
      if(keywords == "for keywords '' "){
        keywords = '';
      }
    }
    var completed = '';

    if(typeof summary.completion_date != 'undefined'){
      completed = ` on ${moment(summary.completion_date).format('dddd')}`
    }

    var summaryText = `${summary.brand_name}: A ${summary.content_type} ${keywords}was completed${completed}.` 
    summaryTextAr.push(summaryText)
  }

      this.output({ 
        result:{
          "bounties":bounties[0].bounties,
          "summary":[],
          "summaryText":summaryTextAr
        }
      });

  }

  async getArchivedBounties() {

  }

  async getUnusedKeywords() {

  }

  async getDeployedKeywords() {

  }

  async getBountiesGoingLiveToday() {

  }

  async getUnreleasedBounties(){
    var bounties= await this.model.aggregate([
      { $match: {"owner": this.user.accountId}},
      { $match: { "release_for_bounty" : {$gte: moment.format()}}},
      { $lookup: {
          from: "users",
          localField: "process.pipeline",
          foreignField: "_id",
          as: "user"
      }
    }, { "$project":{
          "brand_name":1,
          "content_type":1,
          "keywords":1,
          "release_for_bounty":1,
          "titles":1,
          "prompts":1
}},{
  $count: "pipeline"
}])
    this.output({ 
      result:{
        bounties
      }
    });
  }


  async getUnreleasedBountiesWithSummary(){

    console.log(491)
    var bounties=await this.model.aggregate([
      {$facet:{ 
      "bounties":[
        { $match: {"owner": this.user.accountId}},
      { $match: { "release_for_bounty" : {$gte: moment().format()}}},
      {$count: "pipeline"}
      ],
      "summary":[
        
          { $match: {"owner": this.user.accountId}}, 
          { $match: { "release_for_bounty" : {$gte: moment().format() }} },
          { $sort: { release_for_bounty: 1 } },
          { "$project":{
            "brand_name":1,
            "content_type":1,
            "keywords":1,
            "release_for_bounty":1,
            "titles":1,
            "prompts":1,
            "bounty": { "$sum": "$process.bounty" },
          }},
          // { $limit: 5 }
      ]
    }}]
    )

    var summaryText = [];

    for(var i = 0; i < bounties[0].summary.length; i++){
      var bounty = bounties[0].summary[i];
      console.log(5246, bounty);
      //summaryText.push("This is an unreleased bounty")
      var text = `${bounty.brand_name}: A $${bounty.bounty} ${bounty.content_type} for keywords '${bounty.keywords.toString("and")}' will release on ${moment(bounty.release_for_bounty).format('LLLL')}`
      summaryText.push(text);
    }

    console.log(528, summaryText.length)

    this.output({ 
      result:{
        "bounties":bounties[0].bounties,
        "summary":[],
        "summaryText":summaryText
      }
    });
  }




  async bounty_step_is_waiting_on_approval_in_checkin(){
    var isoDateString = new Date().toISOString()

    var bounties=await this.model.aggregate([
      { $match: {"owner": this.user.accountId}},
      { $match: { "release_for_bounty" : {$lte: isoDateString }}},
      { $unwind: "$process"},
      { $match: {"process.checkin":{$ne:false}}},
      { $lookup: {
          from: "users",
          localField: "process.pipeline",
          foreignField: "_id",
          as: "user"
      }},{ "$project":{
          "brand_name":1,
          "content_type":1,
          "bounty":"$process.bounty",
          "refDocId":"$process.refDocId",
          "name":"$process.name",
          "description":"$process.description",
          "pipeline":1,
          "keywords":1,
          "completion_order":"$process.completion_order",
          "folderId":1,
          "first_name":"$user.first_name",
          "last_name":"$user.last_name",
          "in_progress":"$process.bStatus"
}},{
  $count: "bounty"
}])
  this.output({ 
    result:{
      bounties
    }
  });
  }


  async bounty_step_is_waiting_on_approval_in_checkinWithSummary(){
    var isoDateString = new Date().toISOString()

    var bounties=await this.model.aggregate([{$facet:{
      "bounties":[
        { $match: {"owner": this.user.accountId}},
        { $match: { "release_for_bounty" : {$lte: isoDateString }}},
        { $unwind: "$process"},
        { $match: {"process.checkin":{$ne:false}}},
        {$count:"bounty"}
      ],
      "summary":[
      { $match: {"owner": this.user.accountId}},
    { $match: { "release_for_bounty" : {$lte: isoDateString }}},
    { $sort: {_id: -1} },
    { $unwind: "$process"},
    { $match: {"process.checkin":{$ne:false}}},
        { $lookup: {
            from: "users",
            localField: "process.pipeline",
            foreignField: "_id",
            as: "user"
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
              "folderId":1,
              "first_name":"$user.first_name",
              "last_name":"$user.last_name",
              "step":"$process.bStatus",
              "bounty": "$bounty"
        }},
        // { $limit: 5 }

      ]}}])
      this.output({ 
        result:{
          "bounties":bounties[0].bounties,
          "summary":bounties[0].summary
        }
      });
  }


  /* This gets the result for how many "in house" bounties are waiting for THIS user */
  async bounty_step_is_waiting_on_being_completed_in_house(){

    // var aggregate = [
    //     { $match: {"owner": this.user.accountId}},
    //     { "$match" : { "release_for_bounty": { "$lte": "2021-08-18T22:24:38.942Z" } } },
    //     { $project:{
    //         brand_name:1,
    //         content_type:1,
    //         pipeline:1,
    //         keywords:1,
    //         titles:1,
    //         prompts:1,
    //         process:1
    //     }},
    //     {"$unwind":"$process"},
    //     {"$match":
    //       { "$and":
    //         [  
    //           {"process.bStatus": true},
    //           {"process.pipeline":"unclaimed"},
    //           {"process.inhouse": {$ne: false } },
    //         ]
    //       }
    //     },
    //     { $project:{
    //         brand_name:1,  
    //         content_type:1,
    //         bounty:"$process.bounty",
    //         refDocId:"$process.refDocId",
    //         name:"$process.name",
    //         description:"$process.description",
    //         pipeline:1,
    //         keywords:1,
    //         titles:1,
    //         prompts:1,
    //         completion_order:"$process.completion_order"
    //     }},
    //     { 
    //       $replaceRoot: 
    //         { 
    //             newRoot: 
    //               { 
    //                 $mergeObjects: 
    //                   [ 
    //                     { 
    //                       _id: "$_id", 
    //                       brand_name: "$brand_name", 
    //                       content_type:"$content_type",
    //                       pipeline:"$pipeline",
    //                       keywords:"$keywords",
    //                       titles:"$titles",
    //                       prompts:"$prompts",
    //                       bounty:"$bounty",
    //                       name:"$name",
    //                       description:"$description",
    //                       completion_order:"$completion_order",
    //                       refDocId:"$refDocId"
    //                     } 
    //                   ] 
    //               } 
    //         }
    //     },
    //     {
    //       $count: "bounty"
    //     }
    // ]

        var isoDateString = new Date().toISOString()

    var aggregate = [
        { $match: {"owner": this.user.accountId}},
        { $match: { "release_for_bounty" : {$lte: isoDateString }}},
        {"$unwind":"$process"},
        {"$match":
          { "$and":
            [  
              {"process.bStatus": true},
              {"process.pipeline":"unclaimed"},
              {"process.inhouse": this.user._id },
            ]
          }
        },
        {
          $count: "bounty"
        }
    ]

     console.log(391, util.inspect(aggregate, false, null, true /* enable colors */));

    var bounties=await this.model.aggregate(aggregate)
      this.output({ 
        result:{
          bounties
        }
      });
  }


  async bounty_step_is_waiting_on_being_completed_in_houseWithSummary(){
    var isoDateString = new Date().toISOString()
    var bounties=await this.model.aggregate([
      {$facet:{
        "bounties":[
          { $match: {"owner": this.user.accountId}},
        { $match: { "release_for_bounty" : {$lte: isoDateString }}},
        {"$unwind":"$process"},
        {"$match":
          { "$and":
            [  
              {"process.bStatus": true},
              {"process.pipeline":"unclaimed"},
              {"process.inhouse": this.user._id },
            ]
          }
        },
        {
          $count: "bounty"
        }

        ],
        "summary":[
          { $match: {"owner": this.user.accountId}},
        { $match: { "release_for_bounty" : {$lte: isoDateString }}},
        { $sort: {_id: -1} },
        {"$unwind":"$process"},
        {"$match":
          { "$and":
            [  
              {"process.bStatus": true},
              {"process.pipeline":"unclaimed"},
              {"process.inhouse": this.user._id },
            ]
          }
        },
        { $lookup: {
          from: "users",
          localField: "process.pipeline",
          foreignField: "_id",
          as: "user"
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
            "folderId":1,
            "first_name":"$user.first_name",
            "last_name":"$user.last_name",
            "step":"$process.bStatus",
            "bounty": "$bounty"
      }},
      // { $limit: 5 }
        ]

      }}
    ])
    this.output({ 
      result:{
        "bounties":bounties[0].bounties,
        "summary":bounties[0].summary
      }
    });
  }

  /*   This tells you how many bounties are pending for users OTHER than the currently logged in user -- i.e. 
       other team members who haven't completed it yet
  */

  async getAllPendingInhouseBounties(){

        var isoDateString = new Date().toISOString()

    var aggregate = [
        { $match: {"owner": this.user.accountId}},
        { $match: { "release_for_bounty" : {$lte: isoDateString }}},
        {"$unwind":"$process"},
        {"$match":
          { "$and":
            [  
              {"process.bStatus": true},
              {"process.pipeline":"unclaimed"},
              {"process.inhouse": {$ne: false } },
              {"process.inhouse": {$ne: this.user._id } },
            ]
          }
        },
        {
          $count: "bounty"
        }
    ]

     console.log(452, util.inspect(aggregate, false, null, true /* enable colors */));

    var bounties=await this.model.aggregate(aggregate)
      this.output({ 
        result:{
          bounties
        }
      });
  }

  async contents_where_every_Step_Completed()
  {
    var bounties=await this.model.aggregate([
      { $match: {"owner": this.user.accountId}},
      { $match: {"pipeline":{$eq:"Completed"}}},
      { $lookup: {
          from: "users",
          localField: "process.pipeline",
          foreignField: "_id",
          as: "user"
      }
    }, { "$project":{
          "brand_name":1,
          "content_type":1,
          "name":"$process.name",
          "description":"$process.description",
          "pipeline":1,
          "keywords":1,
          "folderId":1,
          "first_name":"$user.first_name",
          "last_name":"$user.last_name",
          "published_link":1
}},{$count:"pipeline"}])
this.output({ 
  result:{
    bounties
  }
});
  }

  async getbountiesHistory() {
    // this.output({
    //   result: "salma works"
    // });
    var today=new Date();
    var yesterday=new Date();
    yesterday.setDate(today.getDate()-20)
    var query = {
      "owner": this.user.accountId
    }
    console.log(today.toISOString(),yesterday.toISOString())
    //var bounties=await this.model.find({"createdAt":{"$lte":today.toDateString(),"$gte":yesterday.toISOString()}}).limit(5);
    var bounties=this.model.find({"pipeline":"Completed"}).sort({_id:-1})

    this.output({
      result: bounties
    });
  }
  async getBounty() {
    var _id=this.req.body._id;
    console.log(_id)
    var query = {
      "owner": this.user.accountId
    }

    var bounty=await this.model.findOne({_id:_id})

    this.output({
      result: bounty
    });
  }

  // End of Class
}

function identifyObjectIds(obj) {
  var jsonBody = obj;

  if (jsonBody != null) {
    for (const [key, value] of Object.entries(jsonBody)) {
      if (voca.includes(key, "_id")) {
        try {
          jsonBody[key] = mongoose.Types.ObjectId(value)
        } catch (err) {
          // maybe it's not an object id
          jsonBody[key] = value;
        }
      }
    }
  }
  return jsonBody
}

var methods = Object.getOwnPropertyNames(Cards.prototype);
var excludes = ["constructor", "output", "error"];

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});





var routestr = `/:cards/id/:id`;
router.all(routestr, routeDataSource);

routestr = `/:cards/`;
router.all(routestr, routeDataSource);


module.exports = router;