import { Base, ResponseError } from '@base'
import { MongoClient, ObjectId } from 'mongodb';
import FormData from 'form-data';
import mngo from "@mongo";
import axios from 'axios';

export default class BombBomb extends Base {

  clientSecret = "c19aee0a-0166-c0d4-51c3-8e525e8db600"
  approval_uri = `https://app.bombbomb.com/auth/authorize?client_id=7895844c-a517-9b1f-a33f-b878a3ae94b3&scope=all:manage&redirect_uri=https://app.contentbounty.com/v2.0/api/public/callbacks/bombomb/authorize&response_type=code`
	redirectUri =[
    "https://app.contentbounty.com/v2.0/api/public/callbacks/bombomb/authorize"
  ]
  identifier = "7895844c-a517-9b1f-a33f-b878a3ae94b3"

  apiBase = 'https://api.bombbomb.com/v2';

  constructor(){
		super();
	}

  async authorize(){

    var exchangeEndpoint = `https://app.bombbomb.com/auth/access_token`;
    
    // var token = this.body;
    // var tokenResult = await this.database.mongo.updateOne( {
    //   "client_id": "7895844c-a517-9b1f-a33f-b878a3ae94b3",
    //   "client_secret": "c19aee0a-0166-c0d4-51c3-8e525e8db600" },
    //   { $set: { ...token } }, "access_tokens", { "upsert" : true } );

    // https://app.contentbounty.com/v2.0/api/public/callbacks/bombomb/authorize?code=def502009681883b32bf45d6aa47f48827f0565c0e5b7b0f458656a1131bbb1eff3399c01d504bcf4a14a9d569e3ae71ea425051782da12551d1a5fdd3b1d217a690efb06b0c63747afce6045591c7a74ce5f2686d8c1873182fcc50c18dd6eb89558820efafe02798ae16f4017077ddda4a2b71f296132006b0956c72740c775b803075582fd5f40cf96ebfb1f7916bb564c56a86b43c4c8db31f20884b460399c17adcb11823e59d4101dd1edeb3a75170a4c2c61dbc3dfb1dbfcefc89f39a1c225e5408a224fd0677ae902d23c518478eb42d2d562aa6e34a3e866776d30970fd0c1e7fa40495b97a48c58429283cfb3549244bda90ba3ae47931fef4c24ab898184bc9e7055853b684303b86fe6966f56438d054db7c9359a35a3810e35a660a9c279e7f2fab803057f04e9304616d0434f384488c8812a8c485cea71700488db592fec7865cda46b857bf4c78b0f97524074fccc86b43e756d375800ba51d3c61ee9621388fb05cabd3cd6af92d1213929e283a21c2b10019d764edfa917ad429c0f8ef372d256563647fab6bd0bc4f4699d610df9ae1eca198e25d472289d00557b1815fa7b93732094343b51c2a51e52263ac7f5d0682ccf17c803bd954389e04824aa95e6f584e0627959f2a13d7451117a620d7fa2ca1c262e313476692

    this.response.reply("bombbomb callback works");
  }

  approval(){
    this.response.reply( this.approval_uri )
  }

  async  token(){

    this.response.reply("bombbomb callback works");
  }

  async getToken(){
    var token = await this.database.mongo.findOne( {
      "client_id": "7895844c-a517-9b1f-a33f-b878a3ae94b3",
      "client_secret": "c19aee0a-0166-c0d4-51c3-8e525e8db600" }, "access_tokens", { projection: { _id: 0 } } );
    //console.log(33, token);

    this.response.reply({ token: { ...token } } );

    return token.access_token;
  }

  async saveToken(){
    var token = this.body;
    var tokenResult = await this.database.mongo.updateOne( {
      "client_id": "7895844c-a517-9b1f-a33f-b878a3ae94b3",
      "client_secret": "c19aee0a-0166-c0d4-51c3-8e525e8db600" },
      { $set: { ...token } }, "access_tokens", { "upsert" : true } );
    this.response.reply(tokenResult);
  }

  async getFreshToken(){
    // Get our existing token
    var token = await this.database.mongo.findOne( {
      "client_id": "7895844c-a517-9b1f-a33f-b878a3ae94b3",
      "client_secret": "c19aee0a-0166-c0d4-51c3-8e525e8db600" }, "access_tokens", { projection: { _id: 0 } } );

      const data = JSON.stringify({
        "grant_type": "refresh_token",
        "client_id": "7895844c-a517-9b1f-a33f-b878a3ae94b3",
        "client_secret": "c19aee0a-0166-c0d4-51c3-8e525e8db600",
        "refresh_token": token.refresh_token
      });

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://app.bombbomb.com/auth/access_token',
        headers: { 
          'Content-Type': 'application/json'
        },
        data: data
      };

      try {
          var response = await axios.request(config);
      } catch(err){
          console.log(err);
          return this.errors.error(err);
      }

      console.log(78, "fresh token", response.data);
      await this.database.mongo.updateOne( {
        "client_id": "7895844c-a517-9b1f-a33f-b878a3ae94b3",
        "client_secret": "c19aee0a-0166-c0d4-51c3-8e525e8db600" },
        { $set: { ...response.data } }, "access_tokens", { "upsert" : true } );

      this.response.reply ( response.data );

      return response.data.access_token;
  }

  async getRequest(endpoint){
    let token = await this.getToken();

    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.bombbomb.com/v2/${endpoint}/`,
        headers: { 
          'Authorization': `Bearer ${token}`
        }
    };

    try {
      var result = await axios.request(config);
    } catch(err){
      // See if we need to get a new token...
      console.log(err.response.status);
      if(err.response.status == 401){
        await this.getFreshToken();
        return await this.getRequest(endpoint);
      } else {
        return this.errors.error("failed")
      }
    }
    return result.data;
  }

  async postRequest(endpoint, data, contentType ='application/json'){ // multipart/form-data
    let token = await this.getToken();

    if(contentType == "application/json"){
      data = JSON.stringify(data);
    }

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://api.bombbomb.com/v2/${endpoint}/`,
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        data: data
    };

    try {
      var result = await axios.request(config);
      const statusCode = result.status;
    } catch(err){
      console.log(config, err);
      if(err.response.status == 401){
              await this.getFreshToken();
              return await this.postRequest(endpoint, data);
            } else {
              return this.errors.error("failed")
            }
    }
    return result.data;
  }

  async getLists(){
    var lists = await this.getRequest("lists")
    this.response.reply(lists);
  }

  async getVideo(){
    var videoId = this.body.videoId;
    var videoDetails = await this.getRequest("videos/" + videoId);
    this.response.reply(videoDetails);
  }

  async getWebhooks(){
    var webhooks = await this.getRequest("webhook");
    this.response.reply(webhooks);    
  }

  async addWebhook(){
    console.log(this.body);
    let data = new FormData();    
    data.append('hookUrl', this.body.hookUrl);
    var webhooks = await this.postRequest("webhook", data);
    this.response.reply(webhooks);    
  }

  async listener(){

    // Dump the event into the data store
    //     {
    //   eventName: 'VideoReady',
    //   eventTimestamp: 16849590948024.58,
    //   payload: {
    //     videoId: '29b1afff-c94f-912f-e69b-bd6f369197ec',
    //     videoName: 'Our Lady of the Lake School',
    //     videoSharingUrl: null,
    //     trackingUrl: 'http://app.bombbomb.com/app/?module=videos&page=engagement&id=29b1afff-c94f-912f-e69b-bd6f369197ec'
    //   }
    // }

        //return true;
    var event = this.body;
    if(event.eventName == 'VideoReady'){
      // An uploaded video is ready.  Let's pull all of the info we have about this video and dump it into our datastore.
      // Then, since this part of the automation is finished, dump that data into Instantly.

      // In theory, this will automatically acquire a new token for us to use
      var videoData = await this.getRequest( "videos/" + event.payload.videoId );
      var update = {$set: { ... videoData } }
      try { var res = await this.database.mongo.updateOne( { "videoId": event.payload.videoId }, update, "yourfullschools", { "upsert" : true } ); } 
        catch(err) { console.log(198, err); return; }

      var dbRecord = await this.database.mongo.findOne({ "videoId": event.payload.videoId }, "yourfullschools", {});

      function flattenObject(obj, prefix = '') {
        let flattened = {};
        for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
            let propKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              flattened = { ...flattened, ...flattenObject(obj[key], propKey) };
            } else {
              flattened[propKey] = String(obj[key]);
            }
          }
        }
        return flattened;
      }

      dbRecord = flattenObject(dbRecord);

        //console.log(499, dbRecord);
      this.addLeadToInstantly(dbRecord);
    }
  }

  async addLeadToInstantly(dbRecord ={}){
    var requestBody = {
        "api_key": "g349z3gpe3mcqqnn3tfpresfkwfc'",
        "campaign_id": "cd768d05-9809-4d0f-bb30-e77b25d907e8",
        "skip_if_in_workspace": true,
        "leads": []
    }

        console.log(44, dbRecord);
    // Harmonize our keys with Instantly's keys
    var instantlyDefaults = ["email", "first_name", "last_name", "company_name", "personalization", "phone", "website", "custom_variables"];

    let lead = {}
    for(let defaultKey of instantlyDefaults){
      if(typeof dbRecord[defaultKey] !== 'updefined'){
        lead[defaultKey] = dbRecord[defaultKey];
        delete dbRecord[defaultKey]
      }
    }
    lead["custom_variables"] = { ... dbRecord }
    requestBody.leads.push(lead);

    console.log(225, requestBody)
    let data = JSON.stringify(requestBody);

        console.log(226, data);
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.instantly.ai/api/v1/lead/add',
      headers: {
        'Content-Type': 'application/json'
      },
      data : data
    };

        console.log(540);
    try {
      var result = await axios.request(config);
        console.log(541)
    } catch(err){
      // Was a problem
        console.log(555, err);
    }

                console.log(556, result.data);

    // Put a note in our database that the record was uploaded to instantly

    /*
    {
        "api_key": "{{instantly_api_key}}",
        "campaign_id": "{{instantly_campaign}}",
        "skip_if_in_workspace": true,
        "leads": [
            {
                "email": "john@abc.com",
                "first_name": "John",
                "last_name": "Doe",
                "company_name": "Instantly",
                "personalization": "Loved your latest post",
                "phone": "123456789",
                "website": "instantly.ai",
                "custom_variables": {
                    "favorite_restaurant": "Mi Cancun",
                    "language": "English"
                }
            }
        ]
    }
    */

  }

  async videos(){

    // 
    // let data = new FormData();    
    // data.append('file', fs.createReadStream('/Users/adamarthur/Documents/Software Projects/contentbounty/api/tools/automation/646107c9f8c634bf832242ab.mov'));
    // data.append('name', 'My Test Upload');
    // data.append('description', 'My Test Description');
    // this.postRequest("videos", data)
    // let config = {
    //   method: 'post',
    //   maxBodyLength: Infinity,
    //   url: 'https://api.bombbomb.com/v2/videos/',
    //   headers: { 
    //     'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjEwOTljNmZlNTFlZTI5ZmZjYWE1MzhiOTEzMWM2Njg1MzE1NzEyNTdlM2NjM2JmYzVmMThlNjI0NDIxNjMxMjBhZWQ3MTU1NDA2ODg3ZjFmIn0.eyJhdWQiOiI3ODk1ODQ0Yy1hNTE3LTliMWYtYTMzZi1iODc4YTNhZTk0YjMiLCJqdGkiOiIxMDk5YzZmZTUxZWUyOWZmY2FhNTM4YjkxMzFjNjY4NTMxNTcxMjU3ZTNjYzNiZmM1ZjE4ZTYyNDQyMTYzMTIwYWVkNzE1NTQwNjg4N2YxZiIsImlhdCI6MTY4NDkwOTYxMC4wNDc2NzYsIm5iZiI6MTY4NDkwOTYxMC4wNDc2NzYsImV4cCI6MTY4NDkxMzIxMC4wMjQ2NDMsInN1YiI6ImYyYmJlNzM2LTRiOWYtOTc5NC1jZDAyLWU5MDNkZjU3NGU0YSIsInNjb3BlcyI6WyJhbGw6bWFuYWdlIl0sImJiY2lkIjoiYmUwMDZkODYtOTU3Yy1kOTU1LThiMWEtZjhhOGY1NGFhNDRlIn0.F-XMo97NBmm_yHw-sVYC2a9EPQ56aKFOpdbtqr2qUi0C2ebUj42GKFFcrL2jpogVfkm6vR7-EI1-shC1LzTF3ET9V-fhhKpUoB8SlB-X9seuB361xym3av6XaKV2_V64IkYSCliXEYcQRXXvHupFnmVMSvOYAFmxnixrQsZRYqA', 
    //     ...data.getHeaders()
    //   },
    //   data : data
    // };    
    //return this.response.reply( await this.postRequest );
  }

}

var tokenRefresh = new BombBomb();
var database = new mngo();
tokenRefresh.database = database;
setInterval( () => {
  tokenRefresh.getFreshToken();
}, 3500000);
