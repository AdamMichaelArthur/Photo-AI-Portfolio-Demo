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

const axios = require('axios');

/*
  3 or 4 consequetive numbers (radio station)
  non ASCII characters
  ? or query parameters (indicates search page)
*/

class AHrefs {
  /* HTTP Functions 
     Can use this.req, this.res, this.user
  */

  constructor(req, res, next, email) {
    // this.className = "public";
    // this.req = req;
    // this.res = res;
    // this.next = next;
    // this.email = email;
    // //this.user = res.locals.user;
    // var defaultAcct = true;
    // console.log(30);
  }

}