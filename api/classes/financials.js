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

class Financials {

  constructor() {
  }

  /* Charges a brand money */
  async chargeBrand(brand_id, amount){
    //var BrandModel = mongoose.model("Brand")

    await mongoose.connection.db
        .collection("brands")
        .update({_id:mongoose.Types.ObjectId(brand_id)}, {} );
  }

  /* Transfers money from a transaction_id to a user */
  transferFunds(transaction_id, user_id){

  }

  /* Rollback undos a transaction */
  rollback(transaction_id){

  }

}