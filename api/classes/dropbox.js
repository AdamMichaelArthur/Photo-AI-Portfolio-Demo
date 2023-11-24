/*
	Created 2/5/2020 by Adam Arthur
	This class is intended as a wrapper / utility class
	to handle a dropbox integration with the Content Bounty
	project
*/

var express = require("express");
var router = express.Router();
var Mongo = require("@classes/mongo");
var mongoose = require("mongoose");
var Model = mongoose.model("Stripe");
var helpers = require("@classes/helpers");
var validation = require("@classes/validation");
var voca = require("voca");

// router.get(
//   "/createPaymentIntent",
//   validation.checkInput({
//     amount: "Number",
//     currency: { type: "String", optional: true }
//   }),
//   async function(req, res, next) {
//     var stripe = new Stripe(req, res, next);
//     var currency = "usd";
//     var amount = req.body.amount;
//     if (req.body.currency != null) {
//       currency = req.body.currency;
//     }
//     await stripe.createPaymentIntent(amount, currency);
//   },
//   validation.checkOutput({})
// );

class Dropbox {
  constructor(req, res, next) {
    //if(typeof req != 'undefined'){
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    //}
    //const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    //this.stripe = stripe;
  }

  output(Obj) {
    var defaultResponse = helpers.defaultResponseObject("dropbox");
    defaultResponse["dropbox"] = Obj;
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
}

module.exports = router;