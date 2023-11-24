/* Handle Protected Routes */
import Base from '../Base/base.js'
import express from 'express';
import http from 'http';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import fs from 'fs'
import Voca from 'voca'
import Errors from '../Errors/errors.js'
import DatabaseConnection from '../Database/Mongo/mongo.js'
import Response from '../Response/response.js';
import Language from './language.js'

/*
	This class handles all protected routes.

	The distinguishing characteristic between public routes and private routes is this:

	Public routes are open to the public and do not require any authentication to use.  They
	do not preload any sensitive data and are considered public.


*/

const date = new Date(2023, 8, 15);
const paywallStart = date.toISOString();

export default class ProtectedRoutes extends Base {

    constructor(initializers) {
        super(initializers);
        this.filenames = [];
        this.language = new Language();
    }

    async handleProtectedRoutes() {

        this.protectedRoutes = await this.getAllFiles("./" + global.version + "/endpoints", [])
        this.protectedDirectories = await this.getAllDirectories("./" + global.version + "/endpoints", [])

        for (var file of this.protectedRoutes) {

            const str = file;

            //const jsFiles = files.filter(file => path.extname(file).toLowerCase() === '.js');
            if (path.extname(file).toLowerCase() !== '.js') {
                continue;
            }

            // Extract the filename without the extension
            const filenameWithoutExtension = path.basename(file, path.extname(file));

            this.filenames.push(filenameWithoutExtension);

            // Derive the anticipated class name
            const className = Voca.titleCase(Voca.camelCase(filenameWithoutExtension));

            // Split the string into an array of path segments
            const pathSegments = str.split('/');

            // Remove the first path segment, which is empty
            pathSegments.shift();

            // Remove the file extension from the last path segment
            const lastSegment = pathSegments[pathSegments.length - 1];
            pathSegments[pathSegments.length - 1] = lastSegment.replace(/\.[^/.]+$/, "");

            if (pathSegments[pathSegments.length - 1] == pathSegments[pathSegments.length - 2]) {
                pathSegments.pop();
            }

            // Join the path segments back into a string
            const result = Voca.lowerCase('/' + pathSegments.join('/'));

            const serviceName = process.env.SERVICE_NAME;
            if (typeof serviceName === 'undefined') {
                console.log(92, "Environment Error: SERVICE_NAME not set");
                process.exit(1);
            }

            

            var finalEndpoint = serviceName + result;
            finalEndpoint = finalEndpoint.replace("/endpoints", '');

    // This middleware function is responsible for deriving the class and function
    this.app.use(finalEndpoint, async (req, res, next) => {
        const url = new URL(req.originalUrl, `http://${req.headers.host}`);
        const baseUrlComponents = this.getBaseComponents(req);   
        const svcName = this.getServiceName();
        const pathComponents = this.getPathComponents(req, svcName);
        const directories = this.protectedDirectories;
        const filenames = this.protectedRoutes;

        // The problem we're solving: 
        /*
            We've got a URL, it may look like this:
            public/callbacks/transfers/demo/opt/hello/test/working/

            /sysadmin/accounts/id/abcdef

            We need to derive the name of the class.  In this particular example

            sysadmin -> is a folder
            accounts -> is a function
            id -> is a parameter definition
            abcdef -> is the value for id

            A folder will have files, which contain a class.  A folder can have multiple files, and will often
            have a filename thats the same name as the directory.

            
            directory:
                directory.js    /directory/
                another.js      /directory/another/

            This is working in code below, but it's pretty messy and unreliable.  The goal here is to rewrite it more
            cleanly.

        */

        var classnames = { }
        var winner = { }

        for(let file of filenames){
            const filePathComponents = path.parse(file);
            const name = filePathComponents.name;
            const dir = filePathComponents.dir;

            // Split the dir directory into its components
            let dirComponents = dir.split("/");

            // I remove the first two elements of the array -- which will be 1.0 and endpoints
            dirComponents.splice(0, 2);

            // If the directory is empty, we're move on -- nothing to do here.
            if(dirComponents.length == 0){
                continue;
            }

            const lastPathComponent = dirComponents[dirComponents.length - 1];

            // We only want to deal with .js files.  filenames returns ALL filenames
            if(filePathComponents.ext !== '.js'){
                continue;
            }

            for(let i = pathComponents.length - 1; i >= 0; i--){
                let pathComponent = pathComponents[i];
                    if(pathComponent == name){
                        if(typeof winner[file] === 'undefined'){
                            winner[file] = { }
                            winner[file]["points"] = 0;
                        }

                        winner[file]["points"]++
                    }    
            }
        }

        
        var matchingPaths = [];
        Object.keys(winner).forEach(function(key) {
          const filePathComponents = path.parse(key);
          const dir = key;
          let dirComponents = dir.split("/");
          dirComponents.splice(0, 2);
          for(var a in dirComponents){
              if(dirComponents[a] == filePathComponents.base){
                  dirComponents[a] = filePathComponents.name
              }
          }
          dirComponents = [ ... new Set(dirComponents) ]
          var filePath = dirComponents.join("/");
          matchingPaths.push(filePath);
        });

        // Sort the paths that matched from longest to shortest
        matchingPaths.sort(function(a, b) {
          return b.length - a.length;
        });

        const urlStr = url.toString();
        var bestPossiblePath = '';
        for(var matchingPath of matchingPaths){
            var idx = urlStr.indexOf(matchingPath);
            if(idx != -1){
                bestPossiblePath = matchingPath;
                break;
            }
        }

        const route = urlStr.slice(0, idx + matchingPath.length);
        var t = urlStr.indexOf("/", idx+matchingPath.length+1);
        if(t == -1){
            t = urlStr.length
            var q = urlStr.indexOf("?", idx+matchingPath.length+1);
            if(q !== -1){
              t = q;
            }
        }

        const endpoint = urlStr.slice(idx + matchingPath.length + 1, t);

        const y = url.pathname.lastIndexOf(endpoint);

        const parameters = url.pathname.slice(y + endpoint.length);

        var className = bestPossiblePath.replaceAll("/", " ");
        className = "Endpoints" + Voca.titleCase(Voca.camelCase(className));
        res.locals.classPrototype = eval(`global.${className}Prototype`);
        res.locals.className = className;
        res.locals.endpoint = endpoint;
        res.locals.pathParameters = parameters;

        let obj;
       // console.log(214, `obj = new global.${className}Prototype()`, global);

       try {
        eval(`obj = new global.${className}Prototype()`);
      } catch(err){
        console.log(219, err)
      }

        res.locals.functionName = eval(`obj.${endpoint}`);
        res.locals.obj = obj; 

        // Check if the class exists.
        if(typeof obj === 'undefined'){
            return res.locals.base.errors.error("invalid_route"); 
        }

        if(typeof res.locals.functionName === 'undefined'){
            return res.locals.base.errors.error("invalid_endpoint");     
        }

        next();
    });

    // Derive the parameters, their values, query parameters and merge into our class object
    this.app.use(finalEndpoint, async (req, res, next) => {
        let classPrototype = res.locals.classPrototype;
        let className = res.locals.className;
        let endpoint = res.locals.endpoint;
        let functionName = res.locals.functionName;
        let obj = res.locals.obj; 
        let parameters = res.locals.pathParameters.split("/");
        parameters = parameters.filter(function(element) {
          return element !== '';
        });

        var vars = {}
        for (let i = 0; i < parameters.length; i += 2) {

            if (typeof parameters[i + 1] !== 'undefined') {
                obj[parameters[i]] = parameters[i + 1]
                vars[parameters[i]] = parameters[i + 1]
                }
        }

        obj.query = req.query;

        obj.body = {
            ... vars,
            ... req.query,
            ... req.body
        }

        next();
    });

    // Analyze if this is a plan-restricted endpoint and if the user has subscribed to the plan
    this.app.use(finalEndpoint, async (req, res, next) => {
        let classPrototype = res.locals.classPrototype;
        let className = res.locals.className;
        let endpoint = res.locals.endpoint;
        let functionName = res.locals.functionName;
        let obj = res.locals.obj; 

            let planRestricted = '';
            // Extract the name of the super class in string form
            let str; let superClass = '';

            if(res.locals.isPublic !== true){

            str = classPrototype.toString();

            const match = str.match(/extends\s+(\w+)/);
            if (match && match.length >= 2) {
              superClass = match[1];
            }

            // Parse our plans
            var planNames = []
            for(var plan of global.Plans){
              let plansAr = plan.pathReference.split(".");
              if(plansAr.length > 1){
                let planName = Voca.titleCase(Voca.kebabCase(plansAr[1]));
                planNames.push(Voca.titleCase(Voca.kebabCase(planName)));
                if(planName == superClass){
                  planRestricted = planName;
                }
              }
            }
                obj.userAccount = res.locals.userAccount;
            }

            if(planRestricted != ''){
            // If we get here, it means the endpoint is plan restricted.
            // We'll check the account to verify that it is subscribed to the appropriate plan
              if(typeof obj.userAccount["plan"] == 'undefined'){
                obj.userAccount["plan"] = 'sysadmin'
              }

              // We need to identify all of the subclasses of this object prototype.  the reason is our intended functionality
              // is that every plan should allow functionality from lower plans.

              const usersPlan = Voca.titleCase(Voca.kebabCase(obj.userAccount["plan"]));

              if(typeof usersPlan === 'undefined'){
                  usersPlan = "Free";
              }

              // Identify all of the plans that are under this plan
              var subPlans = [];
              var planHeirarchy = {}

              var x = 0;
              var circuitBreak = 0;
              var topLevel = "Plan"
                top:
                while(true){
                  circuitBreak++;
                  if(circuitBreak >= 100){
                    return res.locals.base.errors.error('code_error', `The code that handles Plan Authentication is broken.  {protected.js:321}`); 
                    break;
                  }
              for(var plan of global.Plans){
                if(plan.parentClass == topLevel){
                  planHeirarchy[x] = plan;
                  x++;
                  topLevel = plan.className
                  continue top;
                }
              }
                if(x >= global.Plans.length-4)
                        break;
                }

              var planPos = 0;
              var evalCode = "";
              for(var r = 0; r < Object.keys(planHeirarchy).length; r++){
                if(planHeirarchy[r].className == usersPlan){
                  planPos = r
                }
              }

              var x = planRestricted;

              for(var t = 0; t <= planPos; t++){
                evalCode = evalCode + `x === "${planHeirarchy[t].className}" || `;

              }
              
              evalCode = evalCode.slice(0, -3);
              evalCode = "bPasses = " + evalCode + "? true : false;"

              let bPasses = false;
              eval(evalCode);

              if(!bPasses){
               return res.locals.base.errors.error('plan_restricted', `This endpoint requires the ${planRestricted} plan and you are on the ${Voca.titleCase(usersPlan)} plan`) 
              }

            }

            next();
    });

    // Check and make sure that required parameters are present in the request, and that we don't have extra
    // This guarantees that we have the variables we expect to have
    this.app.use(finalEndpoint, async (req, res, next) => {
        let classPrototype = res.locals.classPrototype;
        let className = res.locals.className;
        let endpoint = res.locals.endpoint;
        let functionName = res.locals.functionName;
        let obj = res.locals.obj; 

        let functionSource
            try {
              functionSource = functionName.toString();
            } catch(err){
              let methodPrefix = Voca.lowerCase(req.method)
              
              try {
                 var callCounts = await this.res.locals.base.loadCallCounts(className, endpoint, obj);
                eval(`curFunction = obj.${methodPrefix}${Voca.titleCase(endpoint)}`)

              } catch(err){
                return obj.errors.error('invalid_endpoint', `${endpoint} is an invalid endpoint`)
              }
            }

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

            obj.errors = res.locals.base.errors;
            obj.req = req;
            let t;
            eval(`t = obj.${endpoint}`);
            if(obj.body.disable_parameter_checking == true){
              delete obj.body.disable_parameter_checking;
              return next();
            }

              const hasRequiredParameters = obj.requiredParams(requiredParams, optionalParams, obj.body);
              if(!hasRequiredParameters){
                  return false;
              }

              next();
    });

    // Here, we do type checking -- making sure that our types are correct...
    this.app.use(finalEndpoint, async (req, res, next) => {
        let classPrototype = res.locals.classPrototype;
        let className = res.locals.className;
        let endpoint = res.locals.endpoint;
        let functionName = res.locals.functionName;
        let obj = res.locals.obj; 

        let typeCheck;
        var paramTypes = {};
        let paramStr = '';
        let myParams;
        var functionParams = this.getFunctionParameters(functionName);

        try {
            myParams = this.requiredAndOptionalParams(functionName.toString());
        } catch (err) {
            return obj.errors.error("invalid_endpoint");
        }

                for (var key of Object.keys(obj.body)) {
                    var value = obj.body[key];
                    var type = typeof obj.body[key];
                    if (Array.isArray(obj.body[key])) {
                        type = "array"
                    }

                    var t = {}
                    t['name'] = key;
                    t['type'] = type;

                    for (var p of functionParams) {
                        if (p.name == key) {
                            obj.allowEmptyParameters = true;
                            var invalidTypeDetected = obj.typeCheck(value, p.type, key)
                            if (!invalidTypeDetected) {
                                return;
                            }
                        }
                    };
                }

        var parameterStr = this.getParameterStr(obj.body, functionParams);

        console.log(522, "here");
        res.locals.parameterStr = parameterStr
        next();
    });

    this.app.use("/getNavigationMenus", async (req, res, next) => {
        let curplan = res.locals.userAccount.plan;
        let obj = [];
        for (var plan of global.Plans) {
            if (Voca.titleCase(Voca.camelCase(curplan)) == plan.className) {
                var code = `obj = new global.${plan.classRef}`
                code = Voca.replaceAll(code, "()", `([], res.locals.user)`)
                try {
                    eval(code);
                } catch(err){ }
            }
        }
      
        obj.response.responsePackage.menus = obj.navigationMenuItems;
        obj.response.responsePackage.userInfo = res.locals.user
        obj.response.responsePackage.userInfo['balance'] = res.locals.userAccount.balance;
        obj.response.responsePackage.userInfo['points'] = res.locals.userAccount.points;


        this.language.sendPackage(req, res, obj.response.responsePackage)
        
    })

    /*  The notifications and messages endpoints are special-case endpoints.  They are intended to be polled
        in regular intervals by the UI, and return the last 4 documents.  

        We do not have dedicated classes to handle this, so we create our response manually
    */
    this.app.use("/notifications", async (req, res, next) => {
        let user = res.locals.user;
        let userAccount = res.locals.userAccount;
        let database = global.database;
        let responsePackage = new Response();
        
        let query = { created_by: user._id }
        let limit = 4;

        

        const notifications = await database.mongo.db.collection("notifications").find( query ).limit(limit).sort({ _id: -1 } ).toArray();
        const count = await database.mongo.db.collection("notifications").countDocuments(query);

        responsePackage.responsePackage.notifications = notifications;
        responsePackage.responsePackage['plan'] = userAccount.plan;

        if(typeof userAccount['paymentMethodAttached'] !== 'undefined'){
          responsePackage.responsePackage['paymentMethodAttached'] = userAccount['paymentMethodAttached'];
        } else {
          responsePackage.responsePackage['paymentMethodAttached'] = false;
        }
        
        responsePackage.responsePackage['paywallStartDate'] = paywallStart;

        responsePackage.responsePackage.count = count;
        
        this.language.sendPackage(req, res, obj.response.responsePackage)
    });

    this.app.use("/messages", async (req, res, next) => {
        let user = res.locals.user;
        let userAccount = res.locals.userAccount;
        let database = global.database;
        let responsePackage = new Response();
        
        let query = { created_by: user._id }
        let limit = 4;

        const notifications = await database.mongo.db.collection("messages").find( query ).limit(limit).sort({ _id: -1 } ).toArray();
        const count = await database.mongo.db.collection("messages").countDocuments(query);

        responsePackage.responsePackage.messages = notifications;
        responsePackage.responsePackage.count = count;
        
        this.language.sendPackage(req, res, obj.response.responsePackage)
    });    

    this.app.use("/events", async (req, res, next) => {
        let user = res.locals.user;
        let userAccount = res.locals.userAccount;
        let database = global.database;
        let responsePackage = new Response();
        
        responsePackage.responsePackage.events = [ { "test":true } ];
        
        this.language.sendPackage(req, res, obj.response.responsePackage)
    });  

    // By the time we get here, some plans may restrict how often a class or endpoint can be called
    this.app.use(finalEndpoint, async (req, res, next) => {
        let classPrototype = res.locals.classPrototype;
        let className = res.locals.className;
        let endpoint = res.locals.endpoint;
        let functionName = res.locals.functionName;
        let obj = res.locals.obj; 
        let parameterStr = res.locals.parameterStr

        obj.database = this.database;
        obj.database.mongo.user = res.locals.user;
        obj.database.mongo.account = res.locals.userAccount;

        obj.user = res.locals.user;
        obj.userAccount = res.locals.userAccount;

        // This uses an array, initialized at initial runtime, that is a list of every class inside of the "Mongo" directory
        // It uses this to construct objects that can be accessed inside protected routes.  So that this.database.COLLECTION_NAME is defined
        // Also, order is important here -- we MUST set obj.user and obj.userAccount before calling loadCollectionClasses
        obj.loadCollectionClasses();


           var callCounts = await obj.loadCallCounts(className, endpoint, obj);

            let result, rest, functionTimeout, bIsPromise=false, method;
            try {

              eval(`obj.${endpoint}.lifetime = ${ callCounts.access_count_lifetime }`);
              eval(`obj.${endpoint}.billing_period = ${ callCounts.access_count_current_billing_period }`);
              eval(`obj.${endpoint}.remaining = ${ callCounts.remaining }`);
              eval(`obj.${endpoint}.class_lifetime = ${ callCounts.classCallCounts.access_count_lifetime }`);
              eval(`obj.${endpoint}.class_billing_period = ${ callCounts.classCallCounts.access_count_current_billing_period }`);
              eval(`obj.${endpoint}.class_remaining = ${ callCounts.classCallCounts.remaining }`);


              if(obj[endpoint]["remaining"] <= 1){
                return res.locals.base.errors.error("method_limits_exceeded", `This user has exceeded plan limits for this endpoint: ${endpoint}`);  
              }

              if(obj[endpoint]["class_remaining"] <= 1){
                return res.locals.base.errors.error("method_limits_exceeded", `This user has exceeded plan limits for this class: ${className}`);  
              }

              callCounts["access_count_lifetime"]++;
              callCounts["access_count_current_billing_period"]++;
              callCounts["remaining"]--;
              callCounts["classCallCounts"]["remaining"]--;
              callCounts["classCallCounts"]["access_count_current_billing_period"]++;
              callCounts["classCallCounts"]["access_count_lifetime"]++;

              callCounts[className] = callCounts["classCallCounts"];
              delete callCounts["classCallCounts"];
              obj.callCounts = callCounts;
          } catch(err){

          }


        next();
    });

    // By convention, we allow class definitions to restrict the httpVerb.  THe default behavior is to accept connections from any
    this.app.use(finalEndpoint, async (req, res, next) => {
        let classPrototype = res.locals.classPrototype;
        let className = res.locals.className;
        let endpoint = res.locals.endpoint;
        let functionName = res.locals.functionName;
        let obj = res.locals.obj; 
        let parameterStr = res.locals.parameterStr        

        let method;
        eval(`method = obj.${endpoint}.httpVerb`);    

        obj.method = req.method;
        if(typeof method !== 'undefined'){
            if(method != req.method){
            return obj.errors.error("unsupported_method", `${req.method} is not supported for this endpoint`);  
            }
        }
        next();    

    });

    this.app.use(finalEndpoint, async (req, res, next) => {
        let classPrototype = res.locals.classPrototype;
        let className = res.locals.className;
        let endpoint = res.locals.endpoint;
        let functionName = res.locals.functionName;
        let obj = res.locals.obj; 
        let parameterStr = res.locals.parameterStr   

        next();

    });

    // Sometimes you want to control the timeout.  The default timeout is 5 seconds, and is defined in base.js  0 means it runs forever.
    // this.app.use(finalEndpoint, async (req, res, next) => {
    //     let classPrototype = res.locals.classPrototype;
    //     let className = res.locals.className;
    //     let endpoint = res.locals.endpoint;
    //     let functionName = res.locals.functionName;
    //     let obj = res.locals.obj; 
    //     let parameterStr = res.locals.parameterStr      

    //     // If the timeout has a limit, we set a timeout and check to see if response headers were sent.  If not, we send a timeout message
    //     if(obj.timeout != 0){
    //         setTimeout( () => {
    //           if (!res.headersSent) {
    //             return obj.errors.error('timeout', `This endpoint timed out`);
    //           }
    //         }, obj.timeout)
    //     }
    // });

    // This is where the magic happens that allows us to call anything, anywhere
    this.app.use(finalEndpoint, async (req, res, next) => {
      let obj = res.locals.obj; 
      obj.initRequestVariables(req, res);
      next();
    })

    // Now we're ready to actually execute the function.  But, it comes in two flavors: async and not async.  So we need
    // to detect and then handle it for both cases.
    this.app.use(finalEndpoint, async (req, res, next) => {

        let classPrototype = res.locals.classPrototype;
        let className = res.locals.className;
        let endpoint = res.locals.endpoint;
        let functionName = res.locals.functionName;
        let obj = res.locals.obj; 
        let parameterStr = res.locals.parameterStr        

        let result;

          var parametersAr = parameterStr.split(",");
          var parameterObjAr = [];
          for(let i = 0; i < parametersAr.length; i++){
            parameterObjAr.push(null);
            var parameter = parametersAr[i];
            if(parameter.indexOf("json=") !== -1){
              parameter = Voca.substring(parameter, 6, parameter.length-1);
              console.log(741, parameter);
              var parameterObj = JSON.parse(decodeURIComponent(parameter));
              parameter = "parameterObj"
              parametersAr[i] = ` parameterObjAr[${i}]`;
              parameterObjAr[i] = parameterObj;
            }
          }

          parameterStr = parametersAr.toString(",");

        if(functionName.constructor.name === 'AsyncFunction'){

            console.log(753, `result = obj.${endpoint}(${parameterStr});`);
            eval(`result = obj.${endpoint}(${parameterStr});`);
            result.catch((err) => {
                if (typeof err.code !== 'undefined') {
                    return obj.errors.error("request_failed", err.message);
                } else {
                    // check and see if we have any of our magic endpoint requests: POST, PUT, PATCH, GET and Delete
                    //var methodPrefix = Voca.lowerCase(obj.method);
                    return obj.errors.error("invalid_endpoint");
                }
            }).then((result) => {
                if (typeof result === 'undefined') {
                    result = true;
                }
                if (result === false) {
                    return obj.errors.error("request_failed");
                }
                obj.response.responsePackage.planLimit = obj.callCounts;
                res.status(obj.response.responseStatus);
                res.json(obj.response.responsePackage);
                obj.documentSuccessfulCall(className, endpoint, obj);
            });  

        } else {
            
            try {
                eval(`result = obj.${endpoint}(${parameterStr});`);
            } catch(err){
                return obj.errors.error("request_failed", err.message);
            }


                if(result === false){
                    return obj.errors.error("request_failed", "Request failed, no specific reason provided");
                }
                

                obj.response.responsePackage.planLimit = obj.callCounts;
                res.status(obj.response.responseStatus);
                res.json(obj.response.responsePackage);
                obj.documentSuccessfulCall(className, endpoint, obj);
        };

        if(typeof functionName.timeout !== 'undefined'){
            
        } else {
            functionName.timeout = obj.timeout;
        }
            if(functionName.timeout != 0){
                setTimeout( () => {
                  if (!res.headersSent) {
                    return obj.errors.error('timeout', `This endpoint timed out`);
                  }
                }, functionName.timeout)
            }
        next();
    });

    // We've reached the end
    this.app.use(finalEndpoint, async (req, res, next) => {
        let obj = res.locals.obj; 
        obj.onDestroy();
    });

  }}

    }