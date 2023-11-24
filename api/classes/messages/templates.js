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

class Templates {
  constructor(req, res, next) {
    this.className = "actions";
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    //this.modelName = "Template";

    //this.model = mongoose.model(this.modelName);
    //this.db = new Mongo(this.model, res.locals.user, res);
  }

  introduction(freelancer, publisher){

    var body = `${freelancer.first_name} meet ${publisher.first_name}<br><br>${brand_name} is a site that ${site_info}`



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