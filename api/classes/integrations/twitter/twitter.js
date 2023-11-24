/*
	Created Mon Apr 13 by Adam Arthur
	The purpose of this file is to handle the box integration for content bounty
*/

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

module.exports = class TwitterIntegration {

  constructor() {
  	/*
		In order for this to work in production, we need to create an App
		that authenticates / logs in different users, and stores this information
		in the user document
  	*/
  	// this.api_key = process.env.TWITTER_API_KEY
  	// this.api_secret = process.end.TWITTER_TOKEN_SECRET
  	// this.consumer_key = process.env.TWITTER_ACCESS_TOKEN
  	// this.consumer_secret = process.env.TWITTER_TOKEN_SECRET
  }

  /*
		Why Twitter is using this in 2020 is beyond me.  But, they have decided
		to continue to use OAuth 1.0a -- which requires a very complicated
		Authentication header to be constructed.  We build that header here

		var options = {
		  'method': 'POST',
		  'hostname': 'api.twitter.com',
		  'path': '/1.1/statuses/update.json?status=test12345',
		  'headers': {
		    'Authorization': 'OAuth oauth_consumer_key="WErteZFiZbofmGikyxaAMed8b",oauth_token="1195279023074471937-SIkWi7I8r5lsitzjmtuSrAppl8QaNE",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1590133135",oauth_nonce="izFmJougWyl",oauth_version="1.0",oauth_signature="IBcZcq2q3Bomf0XcCneNYHu2n68%3D"',
		    'Cookie': 'personalization_id="v1_kOiHVY/eENbn31NUll5n9Q=="; guest_id=v1%3A159009894405422268; lang=en; _twitter_sess=BAh7CSIKZmxhc2hJQzonQWN0aW9uQ29udHJvbGxlcjo6Rmxhc2g6OkZsYXNo%250ASGFzaHsABjoKQHVzZWR7ADoPY3JlYXRlZF9hdGwrCGv2XDlyAToMY3NyZl9p%250AZCIlZDY2MjVlNTg1MWU4ZWY1NTZhNmM5OWU0MDlkN2JhMjM6B2lkIiUyMDA3%250AMWNlZmVjN2JiMGNhNWFhZTFhZWNhZGY5YjNhZg%253D%253D--96a8190f3c98ba50f6c464f48c535e8276767188'
		  },
		  'maxRedirects': 20
		};
  */

  oAuthAuthenticationHeader(url){

  	var nonce = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 11);
  
  	var httpMethod = 'GET',
    parameters = {
        oauth_consumer_key : this.consumer_key,
        oauth_token : this.api_key,
        oauth_nonce : nonce,
        oauth_timestamp : Date().now,
        oauth_signature_method : 'HMAC-SHA1',
        oauth_version : '1.0'
    },

    consumerSecret = this.consumer_secret,
    tokenSecret = this.api_secret,
    // generates a RFC 3986 encoded, BASE64 encoded HMAC-SHA1 hash
    encodedSignature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret, tokenSecret),
    // generates a BASE64 encode HMAC-SHA1 hash
    signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret, tokenSecret,
        { encodeSignature: false});

  		var header = `Authorization oauth_consumer_key="${this.consumer_key}",
  		oauth_token="${this.consumer_key}",
  		oauth_signature_method="HMAC-SHA1",
  		oauth_timestamp="${Date().now}",
  		oauth_nonce="${nonce}",
  		oauth_version="1.0",
  		oauth_signature="${signature}"`

  	return header;
  }

  tweet(statusUpdate){
  	// Send tweet here
  	var header = this.oAuthAuthenticationHeader("https://api.twitter.com/1.1/statuses/update.json?status=test12345")
  	return header;
  }
}