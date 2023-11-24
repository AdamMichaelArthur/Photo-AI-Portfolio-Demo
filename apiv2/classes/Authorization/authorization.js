import Voca from 'voca'
import Errors from '../Errors/errors.js'
import Response from '../Response/response.js'
import bcrypt from 'bcrypt'
import btoa from 'btoa'
import atob from 'atob'
import crypto from 'crypto';

import {
    MongoClient,
    ObjectId
} from 'mongodb';

import {
  setTimeout,
  setImmediate,
  setInterval,
} from 'timers/promises';

export default class Authorization {

    constructor(sibling = null, route = '', className = '') {
        this.voca = Voca
        this.response = new Response();
        this.disable_parameter_checking = false;
        this.algorithm = 'aes-256-cbc'; 
        this.secretKey = process.env.GOD_PASSWORD;
    }

    async authorizeUser(req, res) {
        this.req = res;
        this.res = res;

        

        // Check and see if we have an authorization cookie
        var authHeader = req.cookies["Authorization"];

        let AuthHeader;
        if (typeof req.headers["Authorization"] !== 'undefined') { AuthHeader = req.headers["Authorization"]}
        if (typeof req.headers["authorization"] !== 'undefined') { AuthHeader = req.headers["authorization"]}

        if (authHeader == null) {
            // If no Authorization cookie is present, check for an API Key. 
            if (typeof AuthHeader !== 'undefined') {
                // There's an authorization header

                if (AuthHeader.indexOf("Bearer") !== -1) {
                    // We've got a bearer token
                    return await this.checkBearerToken(AuthHeader)
                } else {
                    // we also support including an "api_key" in the header 
                    if (typeof req.headers["api_key"] !== 'undefined') {
                        return await this.checkApiKey(req.headers["api_key"])
                    }
                    this.errors.error("authorization", `An 'Authorization' header was supplied in the request, but it was a 'Bearer' token.  To use this strategy you must supply a Bearer token`);
                }
            } else {
                // Checking for query params

                if (typeof req.query["api_key"] !== 'undefined') {
                    const api_key = req.query["api_key"];
                    delete req.query["api_key"]
                    return await this.checkApiKey(api_key)
                }
            }
            return false;
        } else {
            // We have an authentication cookie

        }

        var basicStr = authHeader.substring(0, 5);
        if (basicStr !== 'Basic') {
            return false;
        }

        var base64Str = authHeader.substring(6, authHeader.length + 6);
        var decodedAuthString = atob(base64Str);

        var stringInfo = decodedAuthString.split(":");

        this.user_id = stringInfo[0];
        this.hash = stringInfo[1];

        return await this.checkCredentials(authHeader);

    }

    async changePassword(req, res, next){
        // First, verify that we have a valid session.
        //var userAuthorized = await this.authorizeUser(req, res);

        console.log(84, this.user);

        let plaintextNewPwd = req.body.newPassword;
        let plaintextOldPwd = req.body.oldPassword;
        let hashedPwd = this.user.pwd;

        let result = await this.cmpPwd(plaintextOldPwd, hashedPwd);
        console.log(91, result);

        if(result !== true){
            console.log(91, "Passwords don't match");
            return this.errors.error("password", "Passwords don't match");
        }

        let newPasswordHash = await this.hashPwd(plaintextNewPwd);

        var changeResult = await this.database.db.collection("users").updateOne({ _id: this.user._id }, {$set: { pwd: newPasswordHash } } );
        console.log(101, changeResult);

        if(changeResult.modifiedCount == 1){
            res.status(200);
            res.json( {
                "Result": "Success",
                "Error": 0,
                "ErrorDetails": {
                    "Error": 0,
                    "Description": "The operation was successful"
                },
                "result":"Password Changed"
            });
        } else { return this.errors.error("password", "Unable to change password"); }
    }

    async checkBearerToken(authHeader = '') {
        let token = authHeader.split(' ')[1];
        console.log(131, authHeader, token);
        return this.checkApiKey(token)
    }

    async checkApiKey(api_key = '') {

        var api_key_doc = await this.database.mongo.findOne({
            api_key: api_key
        }, "api_keys", {});
        if (api_key_doc === null) {
            return false;
        }

        var account = await this.database.findOne({
            "_id": api_key_doc["owner"]
        }, 'accounts', { readPreference: 'primary' }) // Read from the primary for strong consistency);

        if (account === null) {
            return false;
        }

        this.userAccount = account;

        var user = await this.database.findOne({
            "_id": api_key_doc["created_by"]
        }, 'users', { readPreference: 'primary' }) // Read from the primary for strong consistency);
        if (user === null) {
            return false;
        }

        this.database.user_id = user["_id"];
        var userId = user["_id"]
        this.userId = userId;
        this.database.login = userId;
        this.database.user = user;
        this.database.accountId = user.accountId;
        this.accountId = user.accountId;

        this.accountId = user["accountId"]


        this.res.locals.userId = user._id
        this.res.locals.accountId = user.accountId;
        this.res.locals.user = user
        this.user = user
        return true;
    }

   adjective = ["Excited", "Anxious", "Demonic", "Jumpy", "Misunderstood", "Squashed", "Gargantuan","Broad", "Crooked", "Curved", "Deep", "Even","Excited", "Anxious", "Overweight", "Demonic", "Jumpy", "Misunderstood", "Squashed", "Gargantuan","Broad", "Crooked", "Curved", "Deep", "Even", "Flat", "Hilly", "Jagged", "Round", "Shallow", "Square", "Steep", "Straight", "Thick", "Thin", "Cooing", "Deafening", "Faint", "Harsh", "High-pitched", "Hissing", "Hushed", "Husky", "Loud", "Melodic", "Moaning", "Mute", "Noisy", "Purring", "Quiet", "Raspy", "Screeching", "Shrill", "Silent", "Soft", "Squeaky", "Squealing", "Thundering", "Voiceless", "Whispering"] 
   object = ["Taco", "Operating System", "Sphere", "Watermelon", "Cheeseburger", "Apple Pie", "Spider", "Dragon", "Remote Control", "Soda", "Barbie Doll", "Watch", "Purple Pen", "Dollar Bill", "Stuffed Animal", "Hair Clip", "Sunglasses", "T-shirt", "Purse", "Towel", "Hat", "Camera", "Hand Sanitizer Bottle", "Photo", "Dog Bone", "Hair Brush", "Birthday Card"]

    name_generator() {
      return this.adjective[Math.floor(Math.random() * this.adjective.length)] + " " + this.object[Math.floor(Math.random() * this.object.length)];
    }

    async register(req, res){
        const result = await this.registerUser(req.body.userId, req.body.pwd, req.body, req, res);
        if(result === true){
            delete req.body["firstName"];
            delete req.body["lastName"];
            delete req.body["confirmPassword"];
            delete req.body["termsAccept"];

            req.body = {
                userId: req.body.userId,
                pwd: req.body.pwd
            }

            let randomName = this.name_generator();
            const usersCollection = db.collection("users");
            console.log(197, randomName);
            debugger;
            try {
                var usersCollUpdateResult = await usersCollection.updateOne( { "email" : req.body.userId }, { $set: { "fullName": randomName, "onboarding": [
                    {
                         onboardingDismissed: false,
                         postedFirstOffer: false,
                         postedFirstRequest: false,
                         gotAutomaticPoints: false,   
                    }
                ] } })
            } catch(err){
                console.log(202, err);
            }
            console.log(204, usersCollUpdateResult);
            debugger;
            
            return await this.authorize(req, res);
        } else {
            // this.regissterUser will send a detailed error message to the client
            return false;
            // Return an error message to the client
        }

    }

    async authorize(req, res) {

        const hasRequiredParameters = this.requiredParams(["userId", "pwd"], []);
        if (!hasRequiredParameters) {
            return false;
        }

        this.user_id = this.body.userId;
        this.pwd = this.body.pwd;

        this.errors.req = req;
        this.errors.res = res;

        this.res = res;
        this.req = req;

        this.response.res = res;
        this.response.req = req;

        var bPasswordValid = await this.verifyPwd(this.user_id, this.pwd);

        if (!bPasswordValid) {
            return this.errors.error("invalid_password");
        }

        this.setAuthorizationCookie(this.user_id);

        var account = await this.database.findOne({
            "_id": this.accountId
        }, 'accounts', {});
        this.plan = account["plan"];
        if (typeof this.plan === 'undefined') {
            this.plan = "free";
        }

        // var user = await this.database.findOne({
        //     "_id": this.account.owner
        // }, 'users', {});

        // Now that we have the plan, we can fetch the menus appropriate for that plan.
        let obj = [];

        //var storeSessionResult = await this.database.updateOne(
        //    { _id: this.database.user._id }, { $set: { sessionId: this.sessionId } }, "users" )

        for (var plan of global.Plans) {
            if (Voca.titleCase(Voca.camelCase(this.plan)) == plan.className) {
                // Create an instance of the class
                var code = `obj = new global.${plan.classRef}`
                code = Voca.replaceAll(code, "()", `([], this.database.user)`)

                try {
                    eval(code);
                }
                 catch(err){
                     console.log(187, err);
                 }
            }
        }

        // Next, we need to derive the "account" type

        // Set a default value in case its not defined
        if (typeof this.database.user.account_type === 'undefined') {
            this.database.user.account_type = "user"
        }

        // Derive the account type
        // "account" and "user" accounts are our default accounts, but you can define as many as you'd like, each with custom permissions and navigation
        if (this.database.user.account_type !== "account" && this.database.user.account_type !== "user") {
            let acct;
            var accountTypeClass = `acct = new global.Permissions${Voca.titleCase(Voca.camelCase(this.database.user.account_type))}Prototype()`;
            eval(accountTypeClass)
           
            if (acct.inheritParentMenus) {
                obj.navigationMenuItems = obj.navigationMenuItems.concat(acct.navigationMenuItems);
            } else {
                obj.navigationMenuItems = acct.navigationMenuItems;
            }
        }

        //const sessionId = await this.genSessionId(this.pwd)
        //var authorizationString = this.genAuthorizationBasicString(this.database.user.accountId, this.database.user.sessionId, this.database.user._id)

        //res.cookie("Authorization", "Basic " + authorizationString, {expire : new Date() + 1});

        let onboardingRedirect = { }
        if(res.locals.onboardingRedirect == true){
            ;//onboardingRedirect["redirect-override"] = res.locals.onboardingPath        
        }

        console.log(279, account['paymentMethodAttached'], account);

        var paymentMethodAttached = false;
        try {
            if(account['paymentMethodAttached'] === true){
                console.log(284)
                paymentMethodAttached = true;
                //res.locals.userAccount.paymentMethodAttached = true
            } else {
                console.log(287)
                //res.locals.userAccount.paymentMethodAttached = false
            }
        } catch(err) {
            console.log(288, err)
            res.locals.userAccount.paymentMethodAttached = false;
        }

        console.log(293, paymentMethodAttached)



        this.response.reply({
            "menus": obj.navigationMenuItems,
            "fName": this.database.user.first_name,
            "lName": this.database.user.last_name,
            "home": this.database.user.homeRoute,
            "message": "You are now logged in",
            "sessionId": this.sessionId,
            "plan": account['plan'],
            ... onboardingRedirect
            //"authString": authorizationString
        });


        this.response.responsePackage["paymentMethodAttached"] = paymentMethodAttached;

        return true;
    }

    setAuthorizationCookie(user_id) {
        var authorizationHeader = this.generateAuthorizationBasicString(user_id);
        this.res.cookie("Authorization", "Basic " + authorizationHeader, {
            expire: new Date() + 365
        });
    }

    generateAuthorizationBasicString(userId) {
        this.sessionId = this.generateSessionId(userId);

        this.database.updateOne({
            "_id": this.database.user._id
        }, {
            "$set": {
                "sessionId": this.sessionId
            }
        }, "users");
        //var combinedStr = userId + ":" + this.sessionId;
        var combinedStr = this.accountId.toString() + "@%40@" + this.database.user_id.toString() + ":" + this.sessionId

        return btoa(combinedStr);
    }

    generateSessionId(user_id) {
        const salt = bcrypt.genSaltSync(1);
        // Hash goes in database
        const hash = bcrypt.hashSync(user_id, salt);
        return hash;
    }

    typeCheck(parameter, type, elementType = null) {
        if (type == "array") {
            if (!Array.isArray(parameter)) {
                return this.errors.error("type-check-failure", `Parameter ${parameter} must be an ${type}`);
            }

            if (parameter.length == 0) {
                return this.errors.error("type-check-failure", `Parameter ${parameter} must not be empty`);
            }

            if (elementType != null) {
                for (var element of parameter) {
                    if (typeof element !== elementType) {
                        return this.errors.error("type-check-failure", `Array Element '${element}' must be a ${elementType}`);
                    }
                }
            }
        }

        if (type == "string") {
            if (typeof parameter !== 'string') {
                return this.errors.error("type-check-failure", `Parameter '${elementType}' with value '${parameter}' must be an ${type}`);
            }

            if (parameter.length == 0) {
                return this.errors.error("type-check-failure", `Parameter '${elementType}' must not be an empty string`);
            }
        }
        return true;
    }

    async checkCredentials(authHeader) {

        // The first characters of the Basic authentication should be 'Basic '
        var basicStr = authHeader.substring(0, 6);

        if (basicStr == "Bearer") {
            // We've got an API Key auth
        }

        if (basicStr != "Basic ") {
            return this.errors.error("invalid_authorization_string");
        }

        // Extract the base64 string from the header
        var base64Str = authHeader.substring(6, authHeader.length + 6);
        var decodedAuthString = this.base64.decode(base64Str);

        // Split the user_id and sessionId
        var credentialsAr = decodedAuthString.split(":");
        var userId = credentialsAr[0];
        var sessionId = credentialsAr[1];

        var creds = userId.split("@%40@");

        userId = creds[1];
        var accountId = creds[0]

        if ((userId == null) || (sessionId == null) ||
            (sessionId.length == 0) || (userId.length == 0)) {
            //return this.errors.error("malformed_authentication_header")
        }

        // If we get here, we should have a valid string for both user_id and password
        // We will ultimately test this against the database, but for now, we'll user
        // "adam:dino" as valid.  Anything else is invalid
        // What this code WILL do is check the username and password against a database

        var user = await this.verifySession(userId, sessionId);

        if (user == false)
            return;

        if(user === null){
            return this.errors.error("authentication", `This is an invalid user`);    
        }
        
        // "accountId" : ObjectId("5f02e916088543053e9f2ee7")
        // Load the account info
        var account = await this.database.findOne({
            "_id": user["accountId"]
        }, 'accounts', {});

        this.userAccount = account;

        // If we get here, everything is good!
        this.res.locals.sessionId = user.sessionId
        this.res.locals.userId = user._id

        this.res.locals.accountId = user.accountId;
        this.res.locals.user = user // We get the user object often
        this.user = user


        // this.res.locals.response = {}
        // Update this with the actual hapiKey for the user

        //var route = helpers.getRoute(req);

        //res.locals.baseURL = "https://" + process.env.BASE_URL;  // Should pull from environment variable

        // Finally, most routes will have an associated model with them
        // For example, if we create an "order" route, we expect to have an "orders" collection
        // We can save ourselves a lot of code by loading it here, and making it available
        // without having to write read/write code every time.  Let's do that
        // var endpoint = helpers.getRoute(req);
        // var schema = endpoint.charAt(0).toUpperCase() + endpoint.slice(1);
        // try{
        //   var model = mongoose.model(schema)
        //   var data = await model.find({
        //   created_by: user._id,
        //   owner: user.accountId
        // }).limit(10)
        // } catch(err){
        //   return next()
        // }
        // if(data.length > 1)
        //   res.locals[endpoint] = data;
        // else
        //   res.locals[endpoint] = data[0];

        // Data will equal all records that match.  If there are more than 10 records
        // then this will need to be handled elsewhere

        return true;
    }

    async verifySession(userId, sessionId) {

        var result = await this.database.findOne({
            "_id": new ObjectId(userId),
            "sessionId": sessionId
        }, 'users', {
            projection: {
                pastSessions: 0
            }
        });
        return result;
    }

    async verifyPwd(userId, password) {

        var userIdObj = "";
        try {
            var query = {
                $or: [{
                        phone: userId
                    },
                    {
                        email: userId
                    },
                    {
                        _id: userIdObj
                    }
                ]
            }

            var user = await this.database.findOne(query, "users", {
                accountId: 1
            });

        } catch (err) {
            console.log(142, err);
            return false;
        }

        if (!user) {
            return this.errors.error("invalid_user");
        }

        this.database.user_id = user["_id"];
        this.userId = userId;
        this.database.login = userId;
        this.database.user = user;
        this.database.accountId = user.accountId;
        this.accountId = user.accountId;

        this.accountId = user["accountId"]

        var bIsValidPassword = await this.cmpPwd(password, user.pwd);

        if (!bIsValidPassword) {
            //this.res.clearCookie("Authorization");
            // Kill the sessionId as well
            //user.sessionId = "";
            //user.save()                 // This will be handled asyncronuously, no need to wait here
            return false;
        }

        return true;
    }

    async hashPwd(password) {
      const saltRounds = 10;
      const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, function(err, hash) {
          if (err) reject(err)
              resolve(hash)
      });
      })
          return hashedPassword
    }

    async cmpPwd(plaintextPwd, hashedPwd) {
        const cmpValue = await new Promise((resolve, reject) => {
            bcrypt.compare(plaintextPwd, hashedPwd, function(err, res) {
                if (err) reject(err)
                resolve(res);
            });
        });
        return cmpValue;
    }

    genAuthorizationBasicString(accountId, sessionId, userId) {
        var combinedStr = accountId + "@%40@" + userId + ":" + sessionId 
        return btoa(combinedStr);
    }

    async genSessionId(password) {
      const saltRounds = 10;
      const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, function(err, hash) {
      
      if (err) reject(err)
          resolve(hash)
      }); 
        })
          return hashedPassword
    }


    async registerUser(userId, pwd, body, req, res){

        console.log(509, "Attemping to create account", userId);
        let bAutoCreateStripeCustomer = true;
        let bCreateStripeExpressAccount = false;

        let plan = body.plan;
        if(plan === "sysadmin"){
            // This is a super priviledged thing to do.  We need to do some additional checking
            const godPassword = process.env.GOD_PASSWORD;
            if(godPassword !== body.adminPassword){
                return false;
            }
            bAutoCreateStripeCustomer = false;
        }

        // Get our free price plan id
        let availablePlans = await this.database.mongo.findOne({plans: {$exists:true}}, "serializations", { projection: { plans: 1 } });

        if(bAutoCreateStripeCustomer) {
        if(availablePlans == null){
            if(plan !== "sysadmin"){
                console.error("Stripe plans have not been initialized properly, or the database is corrupted.");
                return false;
            } else {
                availablePlans = { plans: [] };
                bAutoCreateStripeCustomer = false;
            }
        }}

        let planPriceId;
        let curPlan;

        if(bAutoCreateStripeCustomer){
        for(let plan of availablePlans.plans){
          if(Voca.lowerCase(plan.displayName) === Voca.lowerCase("free")){
            curPlan = plan;
            planPriceId = plan.prices[0]["id"];
            break;
          }
        }} 

        const freePriceId = planPriceId;

        if(typeof plan === 'undefined'){
            plan = "free";
        }

        const client = global.databaseConnection.client
        const session = await client.startSession();

        session.startTransaction();

        const usersCollection = db.collection("users");
        const acctsCollection = db.collection("accounts");
        const rolesCollection = db.collection("roles");

        let userInsertedId;
        let acctInsertedId;

        let accountType = "user";
        if(typeof body["account_type"] !== 'undefined'){
            accountType = body["account_type"];
        }

        const hashedPwd = await this.hashPwd(pwd);

        let defaultRoute = "main/user/home";

        if(accountType === "affiliate"){
            defaultRoute = "main/affiliate/home"
            bCreateStripeExpressAccount = true;
        }

        bCreateStripeExpressAccount = true;
        defaultRoute = "main/marketplace"

        if(accountType === "sysadmin"){
            defaultRoute = "main/sysadmin/home"
        }

        try {

            let usersResult = await usersCollection.insertOne( { 
                "email" : userId,
                "account_type": accountType,
                "pwd": hashedPwd,
                "created_at": new Date().toISOString(),
                "role":"administrator",
                "first_name": body.firstName,
                "last_name":body.lastName,
                "selected": false,
                "homeRoute": defaultRoute
            }, { session });

            let acct = {
                "owner": usersResult.insertedId,
                "created_by": usersResult.insertedId,
                "modified_by": usersResult.insertedId,
                "created_at": new Date().toISOString(),
                "plan": plan,
                "bStatus": true,
                "selected": false
            }

            let acctsResult = await acctsCollection.insertOne( acct, { session });

            if(bAutoCreateStripeCustomer){
                try {
                    let customerInfo = { name: `${body.firstName} ${body.lastName}`, email: userId }
                    
                    if(process.env.bUseStripeTestClocks == "true"){
                        // Create a new test clock
                        const currentTimestamp = Math.floor(Date.now() / 1000);
                        let testClock = await this.integrations.stripe.stripe.testHelpers.testClocks.create({ name: `${body.firstName} ${body.lastName}`, frozen_time: currentTimestamp });
                        //let testClock = { test_clock: process.env.currentTestClock }
                        Object.assign(customerInfo, { test_clock: testClock["id"] });
                    }
                    
                    var stripeCustomer = await this.integrations.stripe.stripe.customers.create(customerInfo);
                } catch(err){
                    console.log(616, err)
                    this.errors.error("stripe", `Unable to attach this account to a stripe.  This is likely a configuration issue.`);
                    return;
                }
                try {
                    var subscription = await this.integrations.stripe.stripe.subscriptions.create( { customer: stripeCustomer.id,items: [ { price: freePriceId } ] } );     
                } catch(er){
                    this.errors.error("stripe", `Unable to attach a free subscription.  Make sure the 'free' plan exists and has a price of 0.00`);
                    return;
                }
            }

            var r = await session.commitTransaction();

            userInsertedId = usersResult.insertedId;
            acctInsertedId = acctsResult.insertedId;

        } catch(err){
            await session.abortTransaction();

            if(err.code == 11000){
                this.errors.error("registration_user_exists", `Unable to register this user`);
            }
            /* Send an error message to the client.

            */

            return false;
        }

        // affiliate-referral
        var referringDomain = '';
        let affiliateReferralUpdate = {};
        let affiliateReferral = {};
        for(let key of Object.keys(this.req.cookies)){
            if(key.indexOf("affiliate-referral") !== -1){
                // We've got an affiliate referral cookie
                affiliateReferralUpdate = { 'affiliate-referral': this.req.cookies[key] } 
            }
        }

        //const affiliateReferral = this.req.cookies['affiliate-referral'] || false;
        
        if(affiliateReferral !== false){
            // Store this referral
                        
        }

        // This is an important update -- the user document must have a valid accountId
        const usersCollUpdateResult = await usersCollection.updateOne( { "email" : userId }, { $set: { "accountId": acctInsertedId } } )
        if(bAutoCreateStripeCustomer){
            const acctsCollUpdateResult = await acctsCollection.updateOne( { _id: acctInsertedId }, 
                { $set: { "stripe_id": stripeCustomer.id, price_id: freePriceId, subscription_id: subscription.id , subscription_items: subscription.items.data, ... affiliateReferralUpdate } } );
        }

            /*  Roles are included here for legacy support / access to api v1.  We've gone a very different direction in 2.0 with access control.  The API v1 approach is fine --
                But it allows for a more detailed level of access control on a per user basis, the complexity of which isn't really justified in consideration of our most common
                use cases.  In essence, "roles" allow an administrator to control access to individual routes / paths, and to deny access otherwise.  We introduce a new wildcard role
                that allows access to everything.
            */
            let roles = {
                accountId: acctInsertedId,
                role: 'user',
                allowedv2: "**"
            }

            try {
                var rolesInsertResult = await rolesCollection.insertOne( roles );
            } catch(err){
                console.log(681, err)
            }
            console.log(683, rolesInsertResult)

        /* Stripe Express accounts are used for automatic payouts.  
            
        */

        if(bCreateStripeExpressAccount) {
        
            let stripe = this.integrations.stripe.stripe;
            // Create the Express Account
            console.log(this.stripe);
            const account = await this.integrations.stripe.stripe.accounts.create({ type: 'express' });

            // Update the our account document with Stripe's account document
            const acctsCollUpdateResult = await acctsCollection.updateOne( { _id: acctInsertedId }, 
                { $set: { "stripeConnectedAccount": { ... account } } } );

            const accountLink = await stripe.accountLinks.create({
              account: account['id'],
              refresh_url: 'https://app.saas-product.com/main/affiliate/connected',
              return_url: 'https://app.saas-product.com/main/affiliate/home',
              type: 'account_onboarding',
            });

            console.log(690, accountLink.url);

            res.locals.onboardingRedirect = true;
            res.locals.onboardingPath = accountLink.url;

        }



        return true;

    }

      async encrypt(text) {

        const iv = crypto.randomBytes(16); // Initialization Vector (IV) for AES
        const key = Buffer.from(process.env.SECRET_KEY, 'hex');
        console.log(key, key.length, this.algorithm);

        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
      }

    async decrypt(text) {
        let textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = Buffer.from(process.env.SECRET_KEY, 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

  async getSensitiveInfo(ref_doc_id ='', key ='', coll =''){

    // Retrieve the document, ensuring that only the registered and logged in user can retrieve the document
    var query = { created_by: this.user._id, _id: new ObjectId(ref_doc_id) }
    var projection = { "projection": { _id: 0 } }; projection['projection'][key] = 1;
    console.log(47, query, projection);
    var collection = this.database.db.collection(coll);
    let result = await collection.findOne(query, projection);

        console.log(815, result);
    // They don't have access to this record or it doesn't exist.
    if(result == null){
      return false;
    }

    let decryptedValue = await this.decrypt(result[key]);

    this.response.reply( decryptedValue );
  }

}



/*
async function createDocuments(documents) {
  const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const session = client.startSession();

    session.startTransaction();

    const collection = client.db('yourDatabaseName').collection('yourCollectionName');

    try {
      await collection.insertMany(documents, { session });
      await session.commitTransaction();
    } catch (error) {
      console.error('Error inserting documents:', error);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    client.close();
  }
}

// Usage
const documents = [
  { name: 'Document 1' },
  { name: 'Document 2' },
  { name: 'Document 3' }
];

createDocuments(documents);
*/