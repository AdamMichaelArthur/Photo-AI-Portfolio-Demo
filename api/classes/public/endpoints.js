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
var fs = require("fs");

const {google} = require('googleapis');
const TOKEN_PATH = 'api/classes/integrations/google/token.json';

// const {
//   setTimeout,
//   setImmediate,
//   setInterval,
// } = require('node:timers/promises');

const axios = require('axios');

class Public {
  /* HTTP Functions 
     Can use this.req, this.res, this.user
  */

  constructor(req, res, next, email) {
    this.className = "public";
    this.req = req;
    this.res = res;
    this.next = next;
    this.email = email;
    //this.user = res.locals.user;
    var defaultAcct = true;
    console.log(30);


  }

  error(err) {
    var defaultErrorResponse = helpers.defaultErrorResponseObject();
    console.log(33, err);
    if (err.raw.message != null) {
      defaultErrorResponse.error = 33000;
      defaultErrorResponse.ErrorDetails.Error = 33000;
      defaultErrorResponse.ErrorDetails.Description = err.raw.message;
    }

    this.res.status(500);
    this.res.json(defaultErrorResponse);
  }

  async nicheSchools(){
      this.res.status(200);
      this.res.json({"processed":true})

      this.model = mongoose.model("privateschools");
      var db = new Mongo(this.model);
      var bountyModel = await db.mongoCreateMany(this.req.body);

      // All we're doing is taking the JSON response and saving it in a database.
  }

  async video_count(){
    
    var channel = this.req.query["channel"]

    var data = await axios.get("https://www.youtube.com/feeds/videos.xml?limit=100&max-results=50&&maxResults=5&channel_id=" + channel)

    var parseString = require('xml2js').parseString;
    var parseString = require('xml2js').parseString;
    var DOMParser = require('xmldom').DOMParser;
    var xmlString = data.data;
    var xmlStringSerialized = new DOMParser().parseFromString(xmlString, "text/xml");
        parseString(xmlStringSerialized, (err, result) => {
            if (err) {
                console.log(115, err)
            } else {
                var allDone = JSON.parse(JSON.stringify(result));
                var videos = allDone["feed"]["entry"];
                var videoDetails = [];
                for(var i = 0; i < videos.length; i++){
                  var title = videos[i]["media:group"][0]["media:title"][0]
                  title = voca.replaceAll(title, ",", "");
                  var views = videos[i]["media:group"][0]["media:community"][0]["media:statistics"][0]["$"]["views"];
                  var videoStats = {
                    "id":i,
                    "title":title,
                    "views":views
                  }
                  videoDetails.push(videoStats);
                }
                 this.res.locals.response = {"videos":videoDetails}
                 next(this.req, this.res)   
            }
          })  
      }

        async video_count2(){
    
    var channel = this.req.query["channel"]

    var data = await axios.get("https://www.youtube.com/feeds/videos.xml?limit=100&max-results=50&&maxResults=5&channel_id=" + channel)

    var parseString = require('xml2js').parseString;
    var parseString = require('xml2js').parseString;
    var DOMParser = require('xmldom').DOMParser;
    var xmlString = data.data;
    var xmlStringSerialized = new DOMParser().parseFromString(xmlString, "text/xml");
        parseString(xmlStringSerialized, (err, result) => {
            if (err) {
                console.log(115, err)
            } else {
                var allDone = JSON.parse(JSON.stringify(result));
                var videos = allDone["feed"]["entry"];
                var videoDetails = [];
                for(var i = 0; i < videos.length; i++){
                  var title = videos[i]["media:group"][0]["media:title"][0]
                  title = voca.replaceAll(title, ",", "");
                  var views = videos[i]["media:group"][0]["media:community"][0]["media:statistics"][0]["$"]["views"];
                  var videoStats = {
                    "id":i,
                    "title":title,
                    "views":views
                  }
                  videoDetails.push(videoStats);
                }
                  this.res.status(200);
                  this.res.json({videos: videoDetails});
            }
          })  
      }

      async video_count_from_list(){

        //     try {
        //   var credentials = fs.readFileSync('api/classes/integrations/google/credentials.json');
        // } catch(err){
        //   return console.log('Error loading client secret file:', err);
        // }

   // this.credentials = JSON.parse(credentials);
    //var auth = this.authorize(this.credentials);
    //const youtube = google.youtube('v3');

        var video_list = this.req.body.channels;
        if(typeof video_list == 'undefined'){
          this.res.status(400);
          this.res.json({"Error": "Invalid Spreadsheet"});
          return;
        }


        for(var sheet of video_list){
          //sheet.sheetdata = sheet.sheetdata.splice(0, 1);
          for(var video of sheet.sheetdata){

            try {
            var keys = Object.keys(video);
            var values = Object.values(video);
            // video["Title"] = video[keys[0]];
            // video["Link"] = video[keys[1]];
            // delete video[keys[0]];
            // delete video[keys[1]];


            console.log(157, video);

            var key = "";
            var startPos = video["Link"].indexOf("=");
            //console.log(157, startPos);
            var videoId = voca.substr(video["Link"], startPos+1, video["Link"].endOfString);

            var ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=AIzaSyA4FB_q5sFCFvKGF1uYoDkjF7pJjcBpxzE`
            console.log(160, video["Link"], ytUrl);
            var data = await axios.get(ytUrl);

            //await setTimeout(50);
                    video["viewCount"]=data.data.items[0].statistics["viewCount"],
                    video["likeCount"]=data.data.items[0].statistics["likeCount"],
                    video["favoriteCount"]=data.data.items[0].statistics["favoriteCount"],
                    video["commentCount"]=data.data.items[0].statistics["commentCount"]
            

            // console.log(160, video);
          } catch(err){
            //console.log(174, err);
            //console.log(174, err.response.data);
            //process.exit(1);
            continue;
            
          }
          }
        }
        this.res.status(200);
        this.res.json(video_list);
      }

      async video_scrape_from_list(){
        var video_list = this.req.body.channels;
        //video_list = video_list.splice(0, 1);
        
      
      for(var sheet of video_list){
        //console.log(video_list.length, sheet.sheetdata);
        var pos = 0;
        //sheet.sheetdata = sheet.sheetdata.splice(0, 1);
        
          for(var video of sheet.sheetdata){
            //console.log(192, video.Link);

            try {
              var page_data = await axios.get(video.Link);
            } catch(err){
              console.log(201, "rate limits");
              continue;
            }
            //console.log(196, page_data.data);
            var scrapedInfo = this.scrapePageData(page_data.data); //fs.writeFileSync(sheet.sheetname + ".html", page_data.data);
            //await setTimeout(75);
            video = { ... video, ... scrapedInfo }
            sheet.sheetdata[pos] = video;
            console.log(204, "page scraped")
            pos++;
          }
          
      }

      this.res.status(200);
      this.res.json({"workug": video_list })
    }

    scrapePageData(page_data){

      // <meta name="description"
      // <meta name="keywords"
      // "shortDescription"
      var keywords = null;
      var rval = {}

      var keywordsIndex = voca.indexOf(page_data, `<meta name="keywords"`, 0);
      if(keywordsIndex != -1){
        var contentStart = voca.indexOf(page_data, `content=`, keywordsIndex);
        if(contentStart != -1){
          var contentEnd = voca.indexOf(page_data, `">`, contentStart);
          if(contentEnd != -1){
            var contentString = voca.substring(page_data, contentStart+9, contentEnd);//.split(",");
            contentString = voca.replaceAll(contentString, ", ", ",");
            var contentAr = contentString.split(",")
            keywords = contentAr;
            rval["keywords "] = keywords;
            //console.log(223, contentAr, contentStart, contentEnd);
          }
        }
      }

      var descriptionIndex = voca.indexOf(page_data, `"shortDescription":`, 0);
      if(descriptionIndex != -1){
        var descriptionEnd = voca.indexOf(page_data, `","`, descriptionIndex);
        var descriptionString = voca.substring(page_data, descriptionIndex + 20, descriptionEnd);
        rval["description"] = descriptionString;
      }

      return rval;
    }

    // Takes an ahrefs .csv input and outputs a Google Spreadsheet
    filterAhrefsReferringDomains(){

    }

    async howtomakegoogleserps(){

      this.res.status(200);
      this.res.json({"processed":true})

        console.log(this.req.body);

        // var entries = [];
        // for(var entry of this.req.body.response.body.organic_results){
        //         var obj = {
        //                 ... entry,
        //                 "query":this.req.body.url,
        //                 "keywords":this.req.body.response.body.search_information.query_displayed,
        //                 //"ads":this.req.body.response.body.ads,
        //                 //"videos":this.req.body.response.body.videos
        //         }
        // entries.push(obj);
        // }

      this.model = mongoose.model("howtomakegoogleserps");
      var db = new Mongo(this.model);
      var bountyModel = await db.mongoCreateMany(this.req.body);

    }

    async coffeeExplainedKeywordSerps(){

      this.res.status(200);
      this.res.json({"processed":true})

        console.log(this.req.body);

        var entries = [];
        for(var entry of this.req.body.response.body.organic_results){
                var obj = {
                        ... entry,
                        "query":this.req.body.url,
                        "keywords":this.req.body.response.body.search_information.query_displayed,
                        //"ads":this.req.body.response.body.ads,
                        //"videos":this.req.body.response.body.videos
                }
        entries.push(obj);
        }

      this.model = mongoose.model("coffeeexplainedgoogleserps");
      var db = new Mongo(this.model);
      var bountyModel = await db.mongoCreateMany(entries);

  }

  async traveldomainkeywords(){
      this.res.status(200);
      this.res.json({"processed":true})

        var entries = [];
        for(var entry of this.req.body.response.body.organic_results){
                var obj = {
                        ... entry,
                        "query":this.req.body.url,
                        "keywords":this.req.body.response.body.search_information.query_displayed,
                        "ads":this.req.body.response.body.ads,
                        "videos":this.req.body.response.body.videos
                }
        entries.push(obj);
        }

      this.model = mongoose.model("traveldomainkeywords");
      var db = new Mongo(this.model);
      var bountyModel = await db.mongoCreateMany(entries);
  }

    async fooddomainkeywords(){
      this.res.status(200);
      this.res.json({"processed":true})

        var entries = [];
        for(var entry of this.req.body.response.body.organic_results){
                var obj = {
                        ... entry,
                        "query":this.req.body.url,
                        "keywords":this.req.body.response.body.search_information.query_displayed,
                        "ads":this.req.body.response.body.ads,
                        "videos":this.req.body.response.body.videos
                }
        entries.push(obj);
        }

      this.model = mongoose.model("fooddomainkeywords");
      var db = new Mongo(this.model);
      var bountyModel = await db.mongoCreateMany(entries);
  }

  async scrapetraveldomainkeywords(){
      
      this.res.status(200);
      this.res.json({"scraping_started":true});

      var limit = 100;

      // Get a count of the documents
      var count = 1000; //await mongoose.connection.db.collection("testqueries").count({ searched: false })

      var iterations = Math.ceil(parseInt(count) / limit) - 1;

      console.log(333, limit, count, iterations);

      if(limit >= count){
        iterations = 1;
      }

      for(var i = 0; i < iterations; i++){

      //console.log(331, "There are", count - (iterations*i), "documents left");

      var keywords = await mongoose.connection.db
                  .collection("testqueries")
                  .find({ searched: false }, {projection: {_id:1, "Search Query":1}}).limit(limit).toArray();

      var idsToUpdate = [];
      var urls = [];
      for(var keyword of keywords){
        urls.push(keyword["Search Query"])
        idsToUpdate.push({ updateOne: {
          filter: {"_id": mongoose.Types.ObjectId(keyword["_id"])},
          update: { $set : { searched: true } },
          upsert: false
        } })
      }

      var scraperApiUrl = 'https://async.scraperapi.com/batchjobs'

      var scraperApiBody = {
        "apiKey": "46e0fbe0f3b3d3a523747802548aff45",
        "urls": urls,
        "callback": {
            "type": "webhook",
            "url": "https://app.contentbounty.com/v1.0/api/public/action/traveldomainkeywords"
        }
      }


      //var data = await axios.post(scraperApiUrl, scraperApiBody);

      console.log(369, "Iteration", i, "of", iterations);

      var res = await mongoose.connection.db.collection("testqueries").bulkWrite(idsToUpdate);

  }

}

async coupleatsfood(){

      this.res.status(200);
      this.res.json({"processed":true})

        console.log(this.req.body);

        var entries = [];
        for(var entry of this.req.body.response.body.organic_results){
                var obj = {
                        ... entry,
                        "query":this.req.body.url,
                        "keywords":this.req.body.response.body.search_information.query_displayed,
                        //"ads":this.req.body.response.body.ads,
                        //"videos":this.req.body.response.body.videos
                }
        entries.push(obj);
        }

      this.model = mongoose.model("coupleatsfood");
      var db = new Mongo(this.model);
      var bountyModel = await db.mongoCreateMany(entries);
}

async scrape(){

  var helpers = require("@classes/helpers.js")
  var datasource = helpers.getParameter(this.req.params[0], "datasource");

  this.modelName = voca.capitalize(this.req.params.datasource);
  this.model = mongoose.model(this.modelName);
  this.db = new Mongo(this.model);

  this.res.status(200);
  this.res.json({"working":datasource})




}


  }

var howtomakegoogleserps = new mongoose.Schema({
  jsonData: String
}, { strict: false });

mongoose.model("howtomakegoogleserps", howtomakegoogleserps);

var coupleatsfood = new mongoose.Schema({
  jsonData: String
}, { strict: false });

mongoose.model("coupleatsfood", coupleatsfood);

// Mongoose Schemes
var traveldomainkeywords = new mongoose.Schema({
  jsonData: String
}, { strict: false });

mongoose.model("traveldomainkeywords", traveldomainkeywords);

var fooddomainkeywords = new mongoose.Schema({
  jsonData: String
}, { strict: false });

mongoose.model("fooddomainkeywords", fooddomainkeywords);


function next(req, res) {
  console.log(37);
  var defaultResponseObject = helpers.defaultResponseObject("public")
  defaultResponseObject["public"] = res.locals.response;
  res.status(200);
  res.json(defaultResponseObject);
}

function routeDataSource(req, res, next) {

  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  var endofurl = fullUrl.indexOf("?");
  if (endofurl != -1) {
    fullUrl = fullUrl.substring(0, endofurl);
  }

  var action = helpers.getParameter(fullUrl, "action");

  var user = decodeURIComponent(helpers.getParameter(fullUrl, "user"));
  var Action = new Public(req, res, next, user);

  if (typeof user == 'undefined') {
      var desc = {
        raw: {
          message: "user is a requied parameter"
        }
      }
      Action.error(desc);
      return;    
  }

  Action.user = user;
  
  if (typeof action == 'undefined') {
    var desc = {
      raw: {
        message: "This method is not defined"
      }
    }
     return Action.error(desc);
  }

  console.log(fullUrl);


  var evalCode = "Action." + action + "()";
  console.log(64, evalCode);
  try {
    eval(evalCode);

  } catch (err) {
    console.log(71, err);
    var desc = {
      raw: {
        message: "This method is not defined"
      }
    }
     Action.error(desc);
  }
}

// boxredirect is without auth
// box is with auth

var methods = Object.getOwnPropertyNames(Public.prototype);
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

// var routestr = `/test/`;
// router.all(routestr, routeDataSource);

// var authenticated = `/authenticated/`;
// router.all(authenticated, routeDataSource);

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router;