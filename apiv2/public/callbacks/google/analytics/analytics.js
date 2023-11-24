import { Base, ResponseError } from '@base'
import Google from '../google.js'

import GoogleOAuth from '../google.js'
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis';
import dayjs from 'dayjs';
import { MongoClient, ObjectId } from 'mongodb';
import DocumentStandard from "@database/Mongo/document-standards.js";


export default class Analytics extends Google {

  constructor(){
    super();
  }

  async getProfile(token){

    var oauth2Client = this.getOAuthClient("https://app.saas-product.com/v2.0/public/callbacks/google/analytics/authorized");

    oauth2Client.setCredentials(token);

    const oauth2 = await google.oauth2({
        auth: oauth2Client,
        version: 'v2'
      });

    try {
      var profile = await oauth2.userinfo.get();
    } catch(err){
      console.log(32, err);
      return false;
    }
    return profile.data;

  }

  async authorized(){

    var code = this.req.query["code"];
    var user_id = this.req.query["state"];

    var oauth2Client = this.getOAuthClient("https://app.saas-product.com/v2.0/public/callbacks/google/analytics/authorized");
    
    if(oauth2Client === false){
    	// Problem
      this.response.reply("failure - oauth2Client false");
    	return;
    }

    let token = await this.getToken(code, oauth2Client);
    if(token === false){
    	// Problem
      this.response.reply("failure - token false");
    	return;
    }

    let accountInfo = await this.getAccountInfo(user_id);
    if(accountInfo === false){
    	// Problem
    	return false;
    }

    let analyticsIntegrationCollecton = this.database.db.collection("integrationsanalytics");

    let profile = await this.getProfile(token.tokens);

    let document = {
      ... token.tokens,
      ... profile,
      ... { created_by: new ObjectId(user_id), owner: accountInfo["_id"], "createdAt" : dayjs().toISOString(), "modifiedAt" : dayjs().toISOString() }
    };

    //gmailIntegrationCollecton.insertOne(gmailAccess);

    analyticsIntegrationCollecton.updateOne(
      { email: profile.email }, 
      { $set: document },
      { upsert: true });
    
    this.res.redirect(`${process.env.PRIMARY_LINK}/main/user/settings`)

  }

}