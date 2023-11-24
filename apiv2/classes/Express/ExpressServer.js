// Created Jul 22 2022 by Adam Arthur

/*	Initializes an Express App Server and listens on the port specified environment variable.

*/
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
import PublicRoutes from './public.js'
import ProtectedRoutes from './protected.js'
import DynamicRoutes from './dynamic-loader.js'
import Scheduler from '../Scheduler/scheduler.js'
import ChatWatcher from '../Watchers/chat.js'
import util from 'util';

//eval(code);
var routeDirectories = [];

global.Prototypes = [];

function getAllFiles(dirPath, arrayOfFiles = [], basePath = ''){
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            const fullPath = path.join(dirPath, file);

            if (fs.statSync(fullPath).isDirectory()) {
              routeDirectories.push(Voca.substring(fullPath, basePath.length-2));
              getAllFiles(fullPath, arrayOfFiles, basePath);
            } else {
              arrayOfFiles.push(fullPath);
            }
          }
        return arrayOfFiles;
};

var files = getAllFiles('./' + process.env.VERSION + '/endpoints/', [], './' + process.env.VERSION + '/endpoints/');

for(const file of files){
           const filename = path.basename(file);
           const className = Voca.titleCase(path.parse(filename).name);

           const classPath = `../../${file}`

          if(path.extname(filename).toLowerCase() !== '.js'){
            continue;
          }

           import(classPath)
                .then(module => {
                const instance = module.default
                var accessCode = `global.${className}Prototype = instance`;

                try {
                    eval(accessCode);
                } catch(err){
                    console.log(376, err);
                }
            })
       }

export default class ExpressServer extends Base {

    app = express();

    constructor(port, timeout, JSON_BODY_POST_SIZE_LIMIT, TEXT_BODY_POST_SIZE_LIMIT) {
        super();
        this.port = port;
        this.timeout = 0; //Number(timeout);
        this.JSON_BODY_POST_SIZE_LIMIT = JSON_BODY_POST_SIZE_LIMIT;
        this.TEXT_BODY_POST_SIZE_LIMIT = TEXT_BODY_POST_SIZE_LIMIT
        this.app.set("port", this.port);
        this.router = express.Router();
        this.base_url = process.env.BASE_URL;
        this.unhandledException();
    }

    async startServer() {
        this.server = http.createServer(this.app);
        this.server.listen(this.port, '0.0.0.0');
        this.server.timeout = this.timeout;  

        console.log(`Server Listening on port ${this.port} and 0.0.0.0`);

        this.app.use((req, res, next) => {
          var unifiedJS = []
          for(var classPrototype of global.Prototypes){
            let pathReference = classPrototype.pathReference;
            let objRefs = pathReference.split(".");
            let endBrackers = ''
            for(let i = 0; i <= objRefs.length; i++){
              endBrackers += '}'
            }

            var js = JSON.parse(`{ "${objRefs.join('": {\"')}": {${endBrackers}`);
            unifiedJS.push(js);
            //break;
        }

        var initialized = [];
        function deepIterate(obj, parent, res) {
          let test;
          try {
            eval(`test = ${parent}`);
          } catch(err){

          }
          if(typeof(test) === 'undefined'){
            eval(`${parent} = {}`)
          }

          for (let prop in obj) {
            if (typeof obj[prop] === 'object') {
              
              var propName = Object.keys(obj[prop])[0];
              
              if(typeof propName == 'undefined'){
                continue;
              }
              let classObj;
              var cmd = "classObj = new global." + Voca.replaceAll(Voca.titleCase(Voca.camelCase(`${parent}.${propName}Prototype`)) + "()", "ResLocals", "");
              try {
                eval(cmd)
              } catch(err){
                console.log(130, err);
              }

              //eval(`${parent}.${propName} = ppp`)
             
              if(!initialized.includes(`${parent}.${propName}`)){
                eval(`${parent}.${propName} = classObj`)
              }
               initialized.push(`${parent}.${propName}`);
              deepIterate(obj[prop], `${parent}.${propName}`, res);
            } else {
            }
          }
        }

        deepIterate(unifiedJS, 'res.locals', res)
        next();
      });

        this.app.use((req, res, next) => {

            if(req.method == "GET"){
              const contentLength = parseInt(req.headers['content-length']);
              this.errors.res = res;
              this.errors.req = req;
                  if (!isNaN(contentLength)) {
                    console.log(96, contentLength, (isNaN(contentLength)));
                    // send a 413 Payload Too Large response
                    return this.errors.error("get_requests_cannot_have_body", "GET requests cannot have a body.  Payload is too large for a GET request");
                  }
            }

            bodyParser.json({ limit: this.JSON_BODY_POST_SIZE_LIMIT })(req, res, err => {
                if (err) {
                    console.log(84, err)
                    this.errors.req = req;
                    this.errors.res = res;
                    return this.errors.error("invalid_json");
                }
                next();
            });
        });

        this.app.use(bodyParser.text({
            limit: '50mb'
        }));

        this.app.use(bodyParser.raw( {
            limit: '50mb'
        }));

        this.app.use(cookieParser()); 

        await this.loadClasses();
        /* Public routes is handled distinctly because of security and other concerns */
        
        var dynamicRoutes = new DynamicRoutes(this);
        await dynamicRoutes.handleDynamicRoutes("./" + global.version + "/integrations");
        
        await dynamicRoutes.handleDynamicRoutes("./" + global.version + "/plans", "Plans");

        await dynamicRoutes.handleDynamicRoutes("./" + global.version + "/permissions", "Permissions");

        await dynamicRoutes.handleDynamicRoutes("./" + global.version + "/public", "Public");

        await dynamicRoutes.handleDynamicRoutes("./" + global.version + "/endpoints", "Endpoints");

        var publicRoutes = new PublicRoutes(this);
        await publicRoutes.handlePublicRoutes();

        let serviceName = process.env.SERVICE_NAME;
        if(serviceName.length > 0){
          serviceName = serviceName + "/";
        } else {
          serviceName = "/";
        }

        this.app.use(serviceName + "public", (req, res, next) => {
                          console.log(582, req.body);
            res.locals.isPublic = true;
            next();
            // var base = new Base();
            // res.locals.base = base;
            // res.locals.base.response = new Response();
            // res.locals.base.initRequestVariables(req, res);
            // return res.locals.base.errors.error("invalid_endpoint", `This is not a valid endpoint`);
        })

        this.app.use(serviceName, (req, res, next) => {
            var base = new Base();
            res.locals.base = base;
            next();
        });

        this.app.use(serviceName, (req, res, next) => {

            res.locals.base.errors.req = req;
            res.locals.base.errors.res = res;
            res.locals.base.response = new Response();

            res.locals.base.initRequestVariables(req, res);

            // Check for supported content-types
            const content_type = req.get('Content-Type');

            const requestType = req.method;

            res.locals.base.database = this.database;
            res.locals.base.response.res = res;
            res.locals.base.response.req = req;

            if (requestType == "GET") {
                return next();
            }

            if (requestType === "POST" || requestType === "PUT" || requestType === "PATCH") {
              // Check and ensure that the 
            }

            // For now, we only support application/json

            if(content_type == 'application/x-www-form-urlencoded'){
              // Convery this into a JSON object
            }



            if ((content_type != "application/json")) {
                return res.locals.base.errors.error("unsupported-content-type");
            }

            return next();
        });

        this.app.use(serviceName + "register", async (req, res, next) => {
            try {
              var createAccountResult = await res.locals.base.register(req, res);
            } catch(err){
              console.log(265, err);
              createAccountResult = false;
            }
            if(createAccountResult === true){
              res.status(200);
              res.json(res.locals.base.response.responsePackage)
            }
            // if(createAccountResult === true){
            //   res.status(200);
            //   res.json({"account_created":true})
            // } else {
            //   res.status(400);
            //   res.json({"account_created":false})
            // }
        });

        this.app.use(serviceName + "authorize", async (req, res, next) => {
            console.log(292, serviceName)
            const authorizationResult = await res.locals.base.authorize(req, res);
            if(authorizationResult === true){
              res.status(200);
              res.json(res.locals.base.response.responsePackage)
            }
        });

        /* Authorization code goes here */
        this.app.use(serviceName, async (req, res, next) => {
            // Check if this is a "public" route. If so, we allow the request to proceed without loading any User Specific Resources
            const path = this._getFirstPath(req.originalUrl);
            if (path === 'public' || path === 'authorize') {
                this.user_id = null;
                return next();
            }

            /*  When a web-browser calls our endpoint "/authenticate", an authorization cookie is dropped that contains an authorization cookie.
                the authorizeUser checks that cookie and makes sure its still valid. 

                We can also authenticate using an API_KEY                
            */

            // Check the user's authorization status
            if (!await res.locals.base.authorizeUser(req, res)) {
                return res.locals.base.errors.error("unauthorized");
            } else {
                res.locals.base.user_id = res.locals.base.authorize.user_id;
                res.locals.base.account = res.locals.base.authorize.account;
                res.locals.account = res.locals.base.account;
            }

            res.locals.userAccount = res.locals.base.userAccount

            // If we get here, the request passed one of our authentication mechanisms

            /* URL Patterns
                /datasource/{collection}/action/{function}
            */
            // res.locals.user

            res.locals.user = res.locals.base.user;

            // This puts every endpoint inside of a try/catch block, enabling us to "throw" an error anytime we want
            try {
                next();
            } catch (err) {
                return res.locals.base.errors._error(res, "unhandled_exception", err);
            }
        });

        this.app.use(serviceName, (req, res, next) => {
            res.locals.base.locals = res;
            res.locals.base.res = res;
            res.locals.base.next = next;
            res.locals.base.response.req = req;
            res.locals.base.response.res = res;
            next();
        });

        /* This is a special case.  We do not call next here */
        this.app.use(serviceName + "changePassword", async (req, res, next) => {
          var changePasswordResult = await res.locals.base.changePassword(req, res, next);
          return;
        });

        var protectedRoutes = new ProtectedRoutes(this);
        await protectedRoutes.handleProtectedRoutes();

        this.app.use(serviceName, (req, res, next) => {
            return res.locals.base.errors.error("invalid_route");
        });

    }

    /*  This code allows us to throw an exception from the errors class anywhere inside an endpoint, without necessarily having to use try / catch blocks every
    	single time.
    */
    unhandledException() {
        process.on('uncaughtException', function(err) {
            if (typeof err.Errors !== 'undefined') {
                return err.Errors._error(err.err);
            }
            console.error('An uncaught error occurred!', err);
            console.error(err.stack);
        });
    }

    async loadClasses() {

      function hasDuplicates(array) {
        const uniqueSet = new Set(array);
        return uniqueSet.size !== array.length;
      }

       // This loads the MongoDB class and establishes a connection to the database
       this.database = new DatabaseConnection();
       this.database.Prototypes = [];

       const files = await this.getAllFiles('./' + 'classes' +  '/Database/' + 'Mongo');
       const test = [];
       for(let file of files){
         let parsed = path.parse(file);
         if(parsed.ext === '.js'){
           test.push(parsed.name + parsed.ext);
         }
       }

       if(hasDuplicates(test)){
         console.error("By framework convention, duplicate filenames are not allowed inside the classes/Database folder.  Ensure each file has a unique name and restart the process.");
         process.exit(1);
       }

       // By convention, we are going to disallow duplicate filenames.
       for(const file of files){
           const filename = path.basename(file);
           const parsed = path.parse(file);
           const resolvedFile = path.resolve(file);
           if(parsed.ext !== '.js'){
             continue;
           }

           const className = this.voca.titleCase(this.voca.camelCase(path.parse(filename).name));

           const dynamicImport = await this.importModule(resolvedFile);
           if(dynamicImport !== false){
              this.database.Prototypes.push({
                className: className,
                origFile: resolvedFile,
                prototype: dynamicImport
              });
           } else {
             console.error("Unable to import", resolvedFile);
             continue;
           }
          }
    }

    async importModule(resolvedFile) {
      try {
        const module = await import(resolvedFile);
        return module;
      } catch (err) {
        return false;
      }
      return false;
    }

    _getFirstPath(fullUrl) {
        var path = fullUrl;

        if (path[0] == '/') {
            path = this.voca.splice(path, 0, 1);
        }

        var firstForwardSlash = this.voca.indexOf(path, `/`, 0);
        var firstPath = this.voca.substring(path, 0, firstForwardSlash);

        return firstPath
    }
}




