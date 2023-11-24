import GoogleOAuth from '../google.js'
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis';
import dayjs from 'dayjs';
import { MongoClient, ObjectId } from 'mongodb';
import DocumentStandard from "@database/Mongo/document-standards.js";

export default class Gmail extends GoogleOAuth {

	constructor(){
		super();

	}

  async getProfile(token){

    var oauth2Client = new OAuth2Client(
      this.credentials.gmail.client_id,
      this.credentials.gmail.client_secret,
      this.credentials.gmail.redirect_uris[0]
    );

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
    var stateInfo = this.req.query["state"];

    try {
    var oauth2Client = new OAuth2Client(
      this.credentials.gmail.client_id,
      this.credentials.gmail.client_secret,
      this.credentials.gmail.redirect_uris[0]
    );
  } catch(err){
    console.log(29, this.credentials);
    return false;

  }

    try {
      var token = await oauth2Client.getToken(code);
    } catch (err) {
      console.log(31, err);
      // Redirect to a failed page
      return false;
    }

    // return;

    try {
      var profile = await this.getProfile(token.tokens);
    } catch(err){
      console.log(62, err);
    }

    let accountCollection = this.database.db.collection('accounts');
    let accountInfo = await accountCollection.findOne( { owner: new ObjectId(stateInfo) } );

    // I'm using integrationsgmails for backwards compatability with Mongoose, which is not used in the 2.0 API
    let gmailIntegrationCollecton = this.database.db.collection("integrationsgmails");
    
    console.log(71, { owner: new ObjectId(stateInfo) }, accountInfo)
    let gmailAccess = {
      ... token.tokens,
      ... profile,
      ... { created_by: new ObjectId(stateInfo), owner: accountInfo["_id"], "createdAt" : dayjs().toISOString(), "modifiedAt" : dayjs().toISOString() }
    };

    //gmailIntegrationCollecton.insertOne(gmailAccess);

    gmailIntegrationCollecton.updateOne(
      { email: profile.email }, 
      { $set: gmailAccess },
      { upsert: true });
    
    
    //this.response.reply(`${process.env.PRIMARY_LINK}/main/user/settings`)
    this.res.redirect(`${process.env.PRIMARY_LINK}/main/user/settings`)

  }

}
