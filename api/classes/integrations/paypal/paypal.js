// Sandbox account
// sb-7fnep5787439@business.example.com

//Client ID
//AaeX9NWdWMpZLQG3FpHpOTOHfjhjYUPQx9N-ohFLzSi3EAmrYaLulSop1MSfO54ekNPYfz1-hlxounX_

//Secret
//EAqTUOhLJ8zVvkNYLpKDSHMKVhSXhV-7VR9oVcaKuxxyC8irMzhjmxyQTeiFSdB4AjCdERWxwR5FUkYM

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
const payoutsNodeJssdk = require('@paypal/payouts-sdk');

function client() {
    return new payoutsNodeJssdk.core.PayPalHttpClient(environment());
}

function environment() {
    let clientId = process.env.PAYPAL_CLIENT_ID;
    let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (process.env.NODE_ENV === 'production') {
        return new payoutsNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
    }
        return new payoutsNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

module.exports = class PayPalIntegration {



}