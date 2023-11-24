/*    This is our Base class, all classes in this project extend this class
 *
 *    Any functionality that needs to be made available to all classes should be implemented here
 *
 */
import Errors from '../Errors/errors.js'
import Response from '../Response/response.js'
import Authorization from '../Authorization/authorization.js'
import Events from "./events.js"
import dayjs from 'dayjs';
import Voca from 'voca'
import base64 from 'base-64';
import fs from 'fs'
import path from 'path';
import { randomUUID } from 'crypto';
import { MongoClient, ObjectId } from 'mongodb';

class ResponseError extends Error {
  constructor(message, statusCode =500) {
    super(message);
    this.name = 'ResponseError';
    this.code = statusCode;
    this.allowEmptyParameters = false;
  }
}

export default class Base extends Events {

    // route = '';
    // class = '';
    timeout = 5000;

    accessLevel = "user";
    // Available options are "user", "account", "system"

    constructor(sibling = null, route ='', className ='') {
        super()
        this.errors = new Errors();
        this.response = new Response();
        this.voca = Voca
        this.base64 = base64;
        this.isPublic = false;

        if (sibling !== null) {
            Object.assign(this, sibling)

            

            if (typeof this.app !== 'undefined') {
                if(route != ''){
                    this.route = route;
                }
                if(className != ''){
                    this.class = className;
                }
            }
        }
    }

    initRequestVariables(req, res){
        this.req = req;
        this.res = res;
        this.errors.res = this.res;
        this.errors.req = this.req;
        this.response.res = this.res;
        this.response.req = this.req;
        this.response.language = 'en';
        this.body = { ... this.req.body };
        this.transform = false;
        this.user_id = this.res.locals.user_id;
        this.amz = res.locals.amz;
        this.method = this.req.method;
        Object.assign(this, res.locals);

        this.fullUrl = this.req.protocol + '://' + this.req.get('host') + this.req.originalUrl;

        var urlParts = this.fullUrl.split("?");
        if(typeof urlParts[1] != 'undefined'){
            this.queryString = urlParts[1];    
        } else {
            this.queryString = "";
        }


        this.domainWithProtocol = this.req.protocol + '://' + this.req.get('host')
        this.domain = this.req.get('host');
        this.path = this.voca.trimRight(req.originalUrl.replace(/\?.*$/, ''), "/");
        this.query = this.req.get('query');

    }

    routeEndpoint() {
        var fullUrl = this.req.protocol + '://' + this.req.get('host') + this.req.originalUrl;

        var endofurl = fullUrl.indexOf("?");
        if (endofurl != -1) {
            fullUrl = fullUrl.substring(0, endofurl);
        }

        console.log(101, this.class);
        var endpoint = this.getEndpoint(fullUrl, this.class);

        if (endpoint == false) {
            this.errors.error("invalid_route");
        }

        var evalCode = "this." + endpoint + "()";

        var result = true;
        try {
            result = eval(evalCode);
        } catch (err) {
            this.errors.error("invalid_route");
        }

        return result;
    }

    getEndpoint(str, parameter) {
        var params = str.split("/");
        for (var i = 0; i < params.length; i++) {
            if (params[i] == parameter)
                if (i + 1 < params.length){
                    console.log(124, parameter, params[i + 1])
                    return params[i + 1];
                }
        }
        return false;
    }

    requiredParams(requiredKeys =[], optionalKeys =[], body =null, query =null) {

        if(query == null){
            query = this.req.query;
        }

        if(body == null){
            body = this.req.body;
        }

        if(!Array.isArray(requiredKeys)){
            console.error("requiredParams:requiredKeys must be an array.");
            return false;
        }

        if(!Array.isArray(optionalKeys)){
            console.error("requiredParams:requiredKeys must be an array.");
            return false;
        }
        
  try {
         

            var keysInBody = Object.keys(body);

 
            var missingKeys = [];

            // Check for any missing keys
            for (var key of requiredKeys) {
                if (keysInBody.indexOf(key) == -1) {
                    missingKeys.push(key)
                }
            }

            var extraKeys = [];
            // Check for extra keys
            for (var key of keysInBody) {
                if (requiredKeys.indexOf(key) == -1) {
                    extraKeys.push(key);
                }
            }

            // let's check for query parameters.query
            missingKeysTmp = [ ... missingKeys ];

            for(var missingKey of missingKeys){
               var keys = Object.keys(query);
               console.log(keys, missingKey);
               for(var key of keys){                   
                   if(key == missingKey){
                       this.body[key] = query[key];
                       var indexOfKey = missingKeysTmp.indexOf(key);
                       missingKeysTmp.splice(indexOfKey, 1)
                   }
               }   
            }

            missingKeys = missingKeysTmp;

            // The default value for any optional keys is false
            for(var optionalKey of optionalKeys){
                function isValidJSONObject(obj) {
                  try {
                    JSON.parse(JSON.stringify(obj));
                    return true;
                  } catch (e) {
                    return false;
                  }
                }

                if(!isValidJSONObject(this.body[optionalKey])){
                    this.body[optionalKey] = false;
                }
            }

            for(var optionalKey of optionalKeys){
               var keys = Object.keys(query);

               for(var key of keys){                      
                   if(key == optionalKey){  
                    this.body[optionalKey] = query[optionalKey];
                    if(this.body[optionalKey] == "true"){
                        this.body[optionalKey] = true;
                    if(this.body[optionalKey] == "false"){
                        console.log(204, optionalKey, this.body[optionalKey])
                        this.body[optionalKey] = false;
                    }
                }}
                }

            }

            for(var optionalKey of optionalKeys){
               var keys = Object.keys(body);

               for(var key of keys){                      
                   if(key == optionalKey){  
                    this.body[optionalKey] = body[key];
                    if(this.body[optionalKey] == "true"){
                        this.body[optionalKey] = true;
                    if(this.body[optionalKey] == "false"){
                        this.body[optionalKey] = false;
                    }
                }}
                }
            }           

           for(var optionalKey of optionalKeys){
             var pos = 0;
             for(var extraKey of extraKeys){
                 if(extraKey == optionalKey){
                     extraKeys.splice(pos, 1);
                 }
                 pos++;
             }
           }

            if ((missingKeys.length == 0) && (extraKeys.length == 0)) {
                return true;
            }

            // Check and see if we have them in the URL and not the body
            var missingKeysTmp = missingKeys;

            for(var missingKey of missingKeys){
                var param = this.getParameter(missingKey);
                if(param != false){
                    this.body[missingKey] = param;
                    var indexOfKey = missingKeysTmp.indexOf(missingKey);
                    missingKeysTmp.splice(indexOfKey, 1)
                }
            }

            if ((missingKeysTmp.length == 0) && (extraKeys.length == 0)) {
                return true;
            }

            if(typeof this.body.fields != 'undefined'){
                // The user is requesting that only certain fields be returned;
                this.fields = this.body.fields;
                this.transform = true;
            }

            if ((missingKeysTmp.length == 0) && (extraKeys.length == 0)) {
                return true;
            }

            this.errors.error("invalid_parameters", {
                extraParameters: extraKeys,
                missingParameters: missingKeys
            })
        } catch (err) {
            console.log(268, err)
            return false;
        }

 
        return false;
    }

    typeCheck(parameter, type, elementType =null){
        if(type == "array"){
            if(!Array.isArray(parameter)){
                return this.errors.error("type-check-failure", `Parameter ${elementType} must be an ${type}`);
            }

            if(parameter.length == 0){
                if(!this.allowEmptyParameters)
                return this.errors.error("type-check-failure", `Parameter ${elementType} must not be empty`);
            }

            if(elementType != null){
            for(var element of parameter){
                if(typeof element !== typeof parameter[0]){
                    return this.errors.error("type-check-failure", `Array Element '${element}' must be a ${typeof parameter[0]}.  It is a ${typeof element}.  The first element in an array defines the required type for all subsequent elements.  If you have an intentionally mixed-type array, make the definition optional.  i.e. ={}`);
                }    
            }}
        }

        if(type == "string"){
            if(typeof parameter !== 'string'){
                return this.errors.error("type-check-failure", `Parameter '${elementType}' with value '${parameter}' must be an ${type}.  It is a ${typeof parameter}`);
            }

            if(parameter.length == 0){
                if(!this.allowEmptyParameters)
                return this.errors.error("type-check-failure", `Parameter '${elementType}' must not be an empty string.  It is a ${typeof parameter}`);
            }
        }

        if(type == "boolean"){
            if(typeof parameter !== 'boolean'){
                return this.errors.error("type-check-failure", `Parameter '${elementType}' with value '${parameter}' must be an ${type}.  It is a ${typeof parameter}`);
            }
        }

        if(type == "number"){
                    if(typeof parameter !== 'number'){
                        return this.errors.error("type-check-failure", `Parameter '${elementType}' with value '${parameter}' must be an ${type}.  It is a ${typeof parameter}`);
                    }
                }

        if(type == "integer"){
            if(!Number.isInteger(parameter)){
                return this.errors.error("type-check-failure", `Parameter '${elementType}' with value '${parameter}' must be an ${type}.  It is a ${typeof parameter}`);
            }
        }

        // It's very common that a number needs to be passed as a string, for example "12345"
        if(type == "numberstring"){
            if (typeof parameter != "string") return this.errors.error("type-check-failure", `Parameter '${elementType}' with value '${parameter}' must be an ${type}.  It is a ${typeof parameter}`);
            if(isNaN(parameter)){
                if (isNaN(parseFloat(parameter))){
                    return this.errors.error("type-check-failure", `Parameter '${elementType}' with value '${parameter}' must be an ${type}.  It is a ${typeof parameter}`);
                }
            }
        }
        
        return true;
    }

    /*    URL Parameters are typically supplied in one of two basic patterns:
     *    1) A URI Parameter /url/data/id/124345
     *    
     *    Where we might want to get the value for /id/, 12345
     *
     *    The next way that is common is query parameters:
     *    2) A Query Parameter /url/data?id=12345
     *
     *    getParameter will first search for a URI Parameter, and if found, return that first.  
     *    If it doesn't find a matching value, it will look for a matching query parameter.
     *
     *    If you already know your value is a query parameter, then set queryParam to true.  The
     *    only value here is in the event there are duplicate URI and query parameters, such as /url/data/id/12345?id=678920
     *
     *    The "Express" way of getting these values doesn't quite work well for this project structure, hence these functions
    */
    getParameter(parameter, queryParam =false){

        var parameter = extractParameterFromString(this.path, parameter, 0, this.voca);

        return parameter;
        
        function extractParameterFromString(source, parameter, instance, voca){
            const instances = voca.countSubstrings(source, parameter);
            var instanceIndices = [voca.indexOf(source, parameter)];
            var slashIndices = [voca.indexOf(source, "/", instanceIndices[0])]

            var values = [];
            for(var i = 1; i < instances; i++){
                var prevIndex = i-1;
                instanceIndices.push( voca.indexOf(source, parameter, instanceIndices[prevIndex] + parameter.length) )
                slashIndices.push( voca.indexOf(source, "/", instanceIndices[instanceIndices.length-1]) );
            }

            for(var i = 0; i < instanceIndices.length; i++){
                var currentParameter = voca.substring( source, instanceIndices[i] - 1, instanceIndices[i] + parameter.length + 1)

                if((currentParameter[0] != '/') || (currentParameter[currentParameter.length-1] != '/')){
                    continue;
                }

                currentParameter = voca.substring( source, instanceIndices[i], instanceIndices[i] + parameter.length)

                if(typeof slashIndices[i+1] != "undefined"){
                    if(currentParameter == parameter){
                        var value = voca.substring( source, instanceIndices[i] + parameter.length + 1, voca.indexOf(source, "/", instanceIndices[i] + parameter.length + 1) )
                        values.push(value);
                    }
                } else {
                    if(currentParameter == parameter){
                        var nextSlash = voca.indexOf(source, "/", instanceIndices[i] + parameter.length + 1);
                        if(nextSlash == -1){
                            nextSlash = source.length
                        }
                        values.push(voca.substring( source, instanceIndices[i] + parameter.length + 1, nextSlash ))
                    }
                }
            }

            if(values.length == 0){
                return false;
            }

            if(values.length == 1){
                return values[0];
            }

            return values;

        }
    }

    getURIParameter(parameter){

    }

    getQueryParameter(parameter){

    }

    async getAllFiles(dirPath, arrayOfFiles = []){
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            const fullPath = path.join(dirPath, file);

            if (fs.statSync(fullPath).isDirectory()) {
              this.getAllFiles(fullPath, arrayOfFiles);
            } else {
              arrayOfFiles.push(fullPath);
            }
          }
        return arrayOfFiles;
    };

    async getAllDirectories(dirPath, arrayOfFiles = []){
              const files = fs.readdirSync(dirPath);
              for (const file of files) {
                const fullPath = path.join(dirPath, file);
                if (fs.statSync(fullPath).isDirectory()) {
                  arrayOfFiles.push(fullPath);
                  this.getAllDirectories(fullPath, arrayOfFiles);
                } else {
                  
                }
              }
            return arrayOfFiles;
        };

    getFunctionParameters(curFunction) {
       // console.log(functionSource, functionSource.toString());
            let typeCheck;
            var paramTypes = {};
            var rVal = [];

            try {
              var functionSource = curFunction.toString();
            } catch(err){
              return false;
            }

            const defaultParamsRegex = /\(([^()]*)\)/; // Matches everything inside the parentheses, even if empty
            var defaultParamsMatch = defaultParamsRegex.exec(functionSource);

            //console.log(439, Function, )
            if (defaultParamsMatch && defaultParamsMatch[1].trim() == ''){
                defaultParamsMatch = false;
            }

            if (defaultParamsMatch) {
              const defaultParams = defaultParamsMatch[1].split(',').map(param => param.trim());

              var requiredParams = [];
              var optionalParams = [];
              
              for(var param of defaultParams){
                  var paramName = param.split(" ");
                  try {
                      var defaultValue = paramName[1].split("=");
                  } catch(err){
                        console.log(493, this.className, this.endpoint)
                        let errors = new Errors();
                        errors.res = this.res;
                        errors.req = this.req;
                      return errors.error('default', `The function that implements ${this.className}.${this.endpoint} is not compliant with coding patterns.  Every function parameter requires a default parameter in its declaration.`);
                  }

                  defaultValue = defaultValue[1];

                  let type;
                  if(defaultValue == '[]'){
                      defaultValue = [];
                      type = "array";
                  } else {
                      type = typeof eval(`${defaultValue}`);
                  }
                  if(defaultValue[0] == '{'){
                      defaultValue = JSON.parse(JSON.stringify(defaultValue));
                      type = "object";
                      optional = true;
                  }

                  var optional = false;

                  if(type == 'object'){
                    optional = true;
                  }

                  typeCheck = {
                      "name": paramName[0],
                      "type": type,
                      "optional": optional
                  }

                  if(optional == true){
                      optionalParams.push(paramName[0])
                  } else {
                      requiredParams.push(paramName[0]);
                  }

                  paramTypes[typeCheck["name"]] = typeCheck;
                  rVal.push(typeCheck)
                  }
              }

              return rVal;

    }

    getParameterStr(body, functionParams){

        var paramStr = '';
        for(let param of functionParams){
            // { name: 'test', type: 'string', optional: false },
            let bPlacedVariable = false;
            for(let key of Object.keys(body)){
                let value = body[key];
                let type = typeof body[key];

                if(key != param.name){
                    continue;
                }
                bPlacedVariable = true;
                // Set a default... 
                // if(type === 'undefined'){
                //     type = "string",
                //     value = '';
                // }

                if(Array.isArray(body[key])){
                      type = "array"
                  }

                  if(type == "boolean"){
                      paramStr += `${value},`
                  }

                  if(type == "string"){
                      // If value has any quotes, it'll be a big problem.  So we replace them
                      value = Voca.replaceAll(value, `"`, `\\"`);
                      //value = Voca.replaceAll(value, `'`, `\'`);
                      // value = Voca.replaceAll(value, `}`, "%7D");
                      // value = Voca.replaceAll(value, `{`, "%7B");
                      value = Voca.replaceAll(value, "\r\n", `\n`);
                      value = Voca.replaceAll(value, "\n", `\\n`);
                      //value = Voca.replaceAll(value, `,`, "%2C");

                      paramStr += `"${value}",`
                  }

                  if(type == "array"){
                      paramStr += `${JSON.stringify(value)},`
                  }

                  if(type == "number"){
                      paramStr += `${value},`;
                  }

                  if(type == "object"){
                      if(value !== false){
                          if(value !== true){
                              console.log(589, value);
                              paramStr += `"json=${encodeURIComponent(JSON.stringify(value))}",`
                          }
                      }
                  }

            }
            if(!bPlacedVariable){
                paramStr += `"",`
            }    
        }
        paramStr = paramStr.slice(0, paramStr.length - 1)

        // for(var key of Object.keys(body)){
        //           var value = body[key];
        //           var type = typeof body[key];
        //           if(Array.isArray(body[key])){
        //               type = "array"
        //           }

        //           if(type == "string"){
        //               paramStr += `"${value}",`
        //           }

        //           if(type == "array"){
        //               paramStr += `${JSON.stringify(value)},`
        //           }

        //           if(type == "number"){
        //               paramStr += `${value},`;
        //           }


        //       }
              return paramStr;
    }

    validateParameterTypes(body){
        var paramTypes = {}
        for(var key of Object.keys(body)){
                  var value = body[key];
                  var type = typeof body[key];
                  if(Array.isArray(body[key])){
                      type = "array"
                  }
                  console.log(535, key,value,type)

                  var typeCheck = {
                      "name": key,
                      "type": type
                  }


                  paramTypes[typeCheck["name"]] = typeCheck;
                  // var t = {}
                  // t['name'] = key;
                  // t['type'] = type;

                  // var invalidTypeDetected = this.typeCheck(value, paramTypes[key]["type"], key)
                  // if(!invalidTypeDetected){
                  //   return;
                  // }
              }
              return paramTypes;
    }

    requiredAndOptionalParams(functionSource){
            
            const defaultParamsRegex = /\(([^()]*)\)/; // Matches everything inside the parentheses, even if empty
            var defaultParamsMatch = defaultParamsRegex.exec(functionSource);

            if (defaultParamsMatch && defaultParamsMatch[1].trim() == ''){
                defaultParamsMatch = false;
            }

            let typeCheck;
            var paramTypes = {};

        if (defaultParamsMatch) {
              const defaultParams = defaultParamsMatch[1].split(',').map(param => param.trim());

              var requiredParams = [];
              var optionalParams = [];
              
              for(var param of defaultParams){
                  var paramName = param.split(" ");
                  try {
                      var defaultValue = paramName[1].split("=");
                  } catch(err){
                      return res.locals.base.errors.error('default', `The function that implements ${className}.${endpoint} is not compliant with coding patterns.  Every function parameter requires a default parameter in its declaration.`);
                  }

                  defaultValue = defaultValue[1];

                  let type;
                  if(defaultValue == '[]'){
                      defaultValue = [];
                      type = "array";
                  } else {
                      type = typeof eval(`${defaultValue}`);
                  }
                  if(defaultValue[0] == '{'){
                      defaultValue = JSON.parse(JSON.stringify(defaultValue));
                      type = "object";
                      optional = true;
                  }

                  var optional = false;

                  if(type == 'object'){
                    optional = true;
                  }

                  typeCheck = {
                      "name": paramName[0],
                      "type": type,
                      "optional": optional
                  }

                  if(optional == true){
                      optionalParams.push(paramName[0])
                  } else {
                      requiredParams.push(paramName[0]);
                  }

                  paramTypes[typeCheck["name"]] = typeCheck;
                  }
              }

              return {
                  "requiredParams": requiredParams,
                  "optionalParams":optionalParams
              }
    }

    // Normally I don't encourage directly accessing the database.  But this is a special case
    // Here, we track the number of times a user and an account successfully call both a function
    // and a class.
    async documentSuccessfulCall(className, endpoint, obj ={}){
        const userAccount = this.userAccount;

        this.database.mongo.user_id = this.user._id;
        let functionLimitsDefault = 9999999; let classLimitsDefault = 9999999
        if(typeof obj.functionLimits !== 'undefined'){
            functionLimitsDefault = obj.functionLimits;
        }

        if(typeof obj.classLimits !== 'undefined'){
            classLimitsDefault = obj.classLimits;
        }

        let resetQuotas = {
            functionReset: functionLimitsDefault,
            classReset: classLimitsDefault
        }

        let query = {
            user_id: this.user._id,
            account_id: userAccount._id,
            className: className,
            endpoint: endpoint
        }

        let classQuery = {
            user_id: this.user._id,
            account_id: userAccount._id,
            className: className         
        }

        let options = {
            upsert: true
        }

        var collection = 'access_records';

        const update = [
          {
            $setOnInsert: {
              remaining: functionLimitsDefault,
              reset: functionLimitsDefault
            }
          },
          {
            $inc: { "access_count_current_billing_period": 1, "access_count_lifetime": 1 },
            $set: { "updated_at": new Date() }
          },
          {
            $inc: { "remaining": -1 }
          },
          {
            $setOnInsert: {
              remaining: classLimitsDefault,
              reset: classLimitsDefault
            }
        },
        {
            $inc: { "access_count_current_billing_period": 1, "access_count_lifetime": 1 },
            $set: { "updated_at": new Date() }
        }
        ];

        const dbResult = await this.database.mongo.db.collection(collection).bulkWrite([
            
            { updateOne: { filter: query, update: update[0], upsert: true } },
            { updateOne: { filter: query, update: update[1] } },
            { updateOne: { filter: query, update: update[2] } }
        ]);

        var fr = await this.database.mongo.db.collection("class_access_records").bulkWrite([
            { updateOne: { filter: classQuery, update: update[3], upsert: true } },
            { updateOne: { filter: classQuery, update: update[4] } },
            { updateOne: { filter: classQuery, update: update[2] } }
        ]);

        function safeStringify(obj) {
          const cache = new Set();

          return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (cache.has(value)) {
                // Circular reference found, handle it or replace with a placeholder
                return '[Circular]';
              }
              cache.add(value);
            }
            return value;
          });
        }

        var pObj = { ... obj };

        pObj = this.removeObjects(pObj);

        delete query["endpoint"];

        if(this.accessLevel == "account"){
            delete pObj["user_id"];
            delete classQuery["user_id"];

        }

        if(this.accessLevel === "system"){
            delete pObj["user_id"];
            delete pObj["account_id"];
            delete classQuery["user_id"];
            delete classQuery["account_id"]            
        }

        pObj = { ... pObj, ... classQuery }
        obj.pObj = { ... pObj }
        obj.classQuery = { ... classQuery }
        this.serializeObj(classQuery, pObj, this.database);

        // We also automatically serialize the user and userAccount object
        await this.saveUserAndAccount(this.user, this.userAccount);
    }

    removeObjects(obj) {

        for (let key in obj) {
              if(!Array.isArray(obj[key])){
                  if(typeof obj[key] === "object"){
                      //console.log(781, obj[key].constructor);

                      delete obj[key];
                  } else {
                          try {
                          if(obj[key].constructor.name == "Function"){
                              delete pObj[key];
                          }
                      } catch(err){

                      }
                  }
              }
          }
          return obj;
        }

    async saveUserAndAccount(user, acct){

        const userId = user._id;
        const accountId = acct._id;

        delete user._id; delete user.created_by; delete user.owner;
        delete acct._id; delete acct.created_by; delete acct.owner;
        user.modifiedAt = dayjs().toISOString();
        acct.modifiedAt = dayjs().toISOString();

        user.modifiedBy = userId;
        acct.modifiedBy = userId;

        const client = global.databaseConnection.client
        const session = await client.startSession();

        session.startTransaction({
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority', wtimeout: 5000 }
        });

        try {

        if(user.disableAutomaticSave !== false){
            const userResult = await this.database.mongo.db.collection("users").updateOne( { _id: userId }, { $set: user }, { writeConcern: { w: "majority", wtimeout: 5000 } } );
        }

        if(acct.disableAutomaticSave !== false){
            const acctResult = await this.database.mongo.db.collection("accounts").updateOne( { _id: accountId }, { $set: acct }, { writeConcern: { w: "majority", wtimeout: 5000 } } );
        }

        await session.commitTransaction();

        } catch(err){
            console.log(903, err);
        }

    }

    async serializeObj(query, obj, database){
        const update = { $set: obj }
        const dbResult = await database.mongo.db.collection("serializations").replaceOne(query, obj, { upsert: true });
    }

    async loadSerializedData(className, obj){
        let query = {
            user_id: this.user._id,
            account_id: this.userAccount._id,
            className: className
        }

        var classSerializationObj = await this.database.mongo.findOne(query, "serializations", { });
        if(classSerializationObj == null){
            delete query["user_id"];
        }
        classSerializationObj = await this.database.mongo.findOne(query, "serializations", { });
        if(classSerializationObj == null){
            delete query["account_id"];
        }
        classSerializationObj = await this.database.mongo.findOne(query, "serializations", { });
        if(classSerializationObj !== null){
            Object.assign(obj, classSerializationObj);
        }
       // 
    }

    async loadCallCounts(className, endpoint, obj){

        await this.loadSerializedData(className, obj);

        this.database.mongo.user_id = this.user._id;

        const userAccount = this.userAccount;

        let functionLimitsDefault = 9999999; let classLimitsDefault = 9999999

        if(typeof obj.functionLimits !== 'undefined'){
            functionLimitsDefault = obj.functionLimits;
        }

        if(typeof obj.classLimits !== 'undefined'){
            classLimitsDefault = obj.functionLimits;
        }

        let query = {
            user_id: this.user._id,
            account_id: userAccount._id,
            className: className,
            endpoint: endpoint
        }

        let collection = 'access_records';

        var projection = {

        }

        var callCounts = await this.database.mongo.findOne(query, collection, projection);

        delete query.endpoint;
        var classCallCounts = await this.database.mongo.findOne(query, "class_access_records", projection);

        if(callCounts !== null){
            delete callCounts["_id"]
            delete callCounts["account_id"]
            delete callCounts["className"]
            delete callCounts["endpoint"]
            delete callCounts["user_id"]
        } else {
            callCounts = {}
            callCounts["access_count_current_billing_period"] = 0, 
            callCounts["access_count_lifetime"] = 0,
            callCounts["updated_at"] = new Date(),
            callCounts["remaining"] = functionLimitsDefault
        }

        if(classCallCounts !== null){
            delete classCallCounts["_id"]
            delete classCallCounts["account_id"]
            delete classCallCounts["className"]
            delete classCallCounts["endpoint"]
            delete classCallCounts["user_id"]
        } else {
            classCallCounts = {}
            classCallCounts["access_count_current_billing_period"] = 0, 
            classCallCounts["access_count_lifetime"] = 0,
            classCallCounts["updated_at"] = new Date(),
            classCallCounts["remaining"] = classLimitsDefault          
        }

        return { ... callCounts, "classCallCounts": classCallCounts } ;

    }

    getBaseComponents(req){
        baseUrlComponents = [];
        const baseUrl = process.env.BASE_URL;
        var baseUrlComponents = baseUrl.split('/');
        if (baseUrl.length == 0) {
            baseUrlComponents = [];
        }
        return baseUrlComponents
    }

    getServiceName(){
        var svcName = process.env.SERVICE_NAME;
        if (svcName.endsWith('/')) {
            svcName = svcName.slice(0, -1);
        }

        if (svcName.startsWith('/')) {
            svcName = svcName.slice(1);
        }
        return svcName;
    }

    getPathComponents(req, svcName){
        const url = new URL(req.originalUrl, `http://${req.headers.host}`);
        var pathComponents = url.pathname.split('/');
        const index = pathComponents.indexOf(svcName);
        if (index !== -1) {
            pathComponents.splice(index, 1);
        }

        var parameters = [];

       pathComponents = pathComponents.filter(str => str !== '');
       return pathComponents;
    }

    static getClassName() {
        return this.name;
    }

    createUUID(){
        return randomUUID();
    }

    verifyObjectMatch(unknownObj, planDefaultDefinition) {
      for (let key in planDefaultDefinition) {
        if (planDefaultDefinition.hasOwnProperty(key)) {
          if(Array.isArray(planDefaultDefinition[key])){
              if(Array.isArray(unknownObj[key])){
                  continue;
              }
          }
          if(typeof planDefaultDefinition[key] === "object"){
              if(typeof unknownObj[key] === "object"){
                  continue;
              }
          }
          if (!(key in unknownObj)) {

            return `The request body is missing a required parameter: ${key}`;
          }
        }
    }
    return true;
    }

    // The object is about to cease to exist
    onDestroy(){

    }

    // There are two major problems with public callbacks, or webhooks
    // 1 - Verifying the identity of the caller 
    // 2 - Tying any data sent with the appropriate account 
    /*
        My strategy to resolve this issue is to create an endpoint to generate callback urls which include authentication
        in the url 

        So, for example, let's say we're getting a notification from stripe.  It's conceivable that we may have multiple 
        user with multiple stripe accounts registering for and getting data.  We need a way to ensure, 100% of the time,
        that the received data is corretly assigned to the account that owns it.  To do that, we generate an API Key, 
        embed that as a url parameter, and return a custom callback url
    */

    /* Lists all of the services created under the 'public/callbacks' folder */
    listPublicCallbacks(){

    }

    /* Lists all of the endpoints available in a service */
    listServiceCallbacks(serviceFolder =''){

    }

    /* Loads MongoDB Collection Classes into the database */
    loadCollectionClasses(){
        //console.log(1015, this.database.Prototypes)
        for(var prototype of this.database.Prototypes){
            let obj;
            try {
            obj = new prototype.prototype.default
            } catch(err){
                continue;
            }
            obj.user = this.user;
            obj.account = this.userAccount;
            obj = Object.assign(obj, this.database.connection);

            if(typeof this.database[Voca.camelCase(prototype.className)] === 'undefined'){
                this.database[Voca.camelCase(prototype.className)] = obj;    
            }
        }
    }

    /* Loads MongoDB Collection Classes into the database, but first retrieves user and account info from an api key
        This is used for public, authenticated callbacks
    */
    async loadCollectionClassesFromApiKey(api_key =null){
        
        // This is using a raw query to access the database.  
        if(api_key !== null){
            var api_key = await this.database.mongo.findOne({ api_key: api_key}, "api_keys", {});
            if(api_key === null){
                return false;
            }
        var user = await this.database.mongo.findOne( { _id: new ObjectId(api_key["created_by"])}, "users", { projection: { pastSessions: 0} } );
        var account = await this.database.mongo.findOne( { _id: new ObjectId(api_key["owner"])}, "accounts", {});
        this.user = user;
        this.account = account;
        this.database.mongo.user = user;
        this.database.mongo.account = account;
        }

 
        for(var prototype of this.database.Prototypes){
            let obj;
            try {
            obj = new prototype.prototype.default
            } catch(err){
                continue;
            }

            if(api_key !== null){
                obj.user = user;
                obj.account = account;
            }

            obj = Object.assign(obj, this.database.connection);

            if(typeof this.database[Voca.camelCase(prototype.className)] === 'undefined'){
                this.database[Voca.camelCase(prototype.className)] = obj;    
            }
        }

        return true;
    }    

    generateApiKey(){
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
        let apiKey = '';
        for (let i = 0; i < 54; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            apiKey += characters.charAt(randomIndex);
        }
        return apiKey;
    }        
    

    generateCallbackUrl(){
        // function generateApiKey(length) {
        //   const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
        //   let apiKey = '';

        //   for (let i = 0; i < length; i++) {
        //     const randomIndex = Math.floor(Math.random() * characters.length);
        //     apiKey += characters.charAt(randomIndex);
        //   }

        //   return apiKey;
        // }


        var api_key = this.generateApiKey(54);

        // Generate a callback
        // Derive the info from the .env file
        // Return a callback
        return api_key;
    }

}

const Optional = Symbol('optional');

export { ResponseError as ResponseError, Base as Base, Optional as Optional };

