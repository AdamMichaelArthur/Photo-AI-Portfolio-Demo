/* Handle Public Routes */
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
import Language from './language.js';
/*
	This class handles all public routes.

	The distinguishing characteristic between public routes and private routes is this:

	Public routes are open to the public and do not require any authentication to use.  They
	do not preload any sensitive data and are considered public.


	`
*/

export default class PublicRoutes extends Base {

    constructor(initializers) {
        super(initializers);
        this.language = new Language();
        this.filenames = [];
    }

    async handlePublicRoutes() {

        this.publicRoutes = await this.getAllFiles("./" + global.version + "/public", [])
        this.publicDirectories = await this.getAllDirectories("./" + global.version + "/public", [])

        for (var file of this.publicRoutes) {
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

            // Dynamically import modules



            import(process.cwd() + "/" + file)


                .then(module => {
                    const instance = module.default
                    var accessCode = `global.${className}Prototype = instance`;
                    try {
                        eval(accessCode);
                    } catch (err) {
                        console.log(376, err);
                    }
                })

            const serviceName = process.env.SERVICE_NAME;
            if (typeof serviceName === 'undefined') {
                console.log(92, "Environment Error: SERVICE_NAME not set");
                process.exit(1);
            }

        this.protectedRoutes = await this.getAllFiles("./" + global.version + "/public", [])
        this.protectedDirectories = await this.getAllDirectories("./" + global.version + "/public", [])

    this.app.use(serviceName + result, async (req, res, next) => {
        const url = new URL(req.originalUrl, `http://${req.headers.host}`);
        const baseUrlComponents = this.getBaseComponents(req);   
        const svcName = this.getServiceName();
        const pathComponents = this.getPathComponents(req, svcName);
        const directories = this.protectedDirectories;
        const filenames = this.protectedRoutes;

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
                console.log(125, "Cintinuing")
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
        }

        let endpoint = urlStr.slice(idx + matchingPath.length + 1, t);

        // Sometimes, an endpoint won't end with a trailing slash, but will have a ? -- indicating there are URL query string parameters
        if(endpoint.indexOf("?") !== -1){
            endpoint = endpoint.slice(0, endpoint.indexOf("?"));
        }

        if(endpoint.length == 0){
            return this.errors.error("request_failed", "This is an invalid endpoint");
        }


        const y = url.pathname.lastIndexOf(endpoint);

        const parameters = url.pathname.slice(y + endpoint.length);

        var className = bestPossiblePath.replaceAll("/", " ");
        className = "Public" + Voca.titleCase(Voca.camelCase(className));
        res.locals.classPrototype = eval(`global.${className}Prototype`);
        res.locals.className = className;
        res.locals.endpoint = endpoint;
        res.locals.pathParameters = parameters;

        let obj;
        //console.log(196, endpoint, `obj = new global.${className}Prototype()`);
        eval(`obj = new global.${className}Prototype()`);

        res.locals.functionName = eval(`obj.${endpoint}`);

        res.locals.obj = obj; 
        obj.req = req;
        obj.res = res;
        obj.errors.res = res;
        obj.database = this.database;
        // Check if the class exists.
        if(typeof obj === 'undefined'){
            return obj.errors.error("invalid_route"); 
        }

        if(typeof res.locals.functionName === 'undefined'){
            return obj.errors.error("invalid_endpoint");     
        }

        console.log(226)
        this.initRequestVariables(req, res);
        this.res = res;
        next();
    });

    this.app.use(serviceName + result, async (req, res, next) => {
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

        //console.log(1111, obj.query, vars, req.body)

        // For protected routes, we're a little bit stricter.  For public routes, we relax a little bit
        // Specifically, I want to support text/plain and the sendBeacon function. 


        const content_type = req.get('Content-Type');

        let body = req.body;

        if(typeof content_type !== 'undefined'){
        if(content_type.includes("text/plain")){
            try {
                body = JSON.parse(body);
            } catch(err){
                // Do nothing...
            }
        } } else {
            body = {}
        }

        var functionParams = this.getFunctionParameters(functionName);
        var parameterStr = this.getParameterStr(body, functionParams);

        res.locals.parameterStr = parameterStr


        obj.body = {
            ... vars,
            ... req.query,
            ... body
        }

        next();
    });


    this.app.use(serviceName + result, (req, res, next) => {

        let classPrototype = res.locals.classPrototype;
        let className = res.locals.className;
        let endpoint = res.locals.endpoint;
        let functionName = res.locals.functionName;
        let obj = res.locals.obj; 
        let parameterStr = res.locals.parameterStr        
        let result;

        if(functionName.constructor.name === 'AsyncFunction'){

            eval(`result = obj.${endpoint}(${parameterStr});`);
            result.catch((err) => {
                console.log(263, err);
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
                //res.status(obj.response.responseStatus);
                //res.json(obj.response.responsePackage);
                this.language.sendPackage(req, res, obj.response.responsePackage)
            });  

        } else {
            
            try {
                eval(`result = obj.${endpoint}(${parameterStr});`);
            } catch(err){
                console.log(287, err);
                return obj.errors.error("request_failed", err.message);
            }

                if(result === false){
                    return obj.errors.error("request_failed", "Request failed, no specific reason provided");
                }
                
                //res.status(obj.response.responseStatus);
                //res.json(obj.response.responsePackage);
                this.language.sendPackage(req, res, obj.response.responsePackage)
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
    });

    this.app.use(serviceName + result + "/", (req, res, next) => {
        console.log(331)
        // let classPrototype = res.locals.classPrototype;
        // let className = res.locals.className;
        // let endpoint = res.locals.endpoint;
        // let functionName = res.locals.functionName;
        // let obj = res.locals.obj; 
        // let parameterStr = res.locals.parameterStr        
        // let result;
        // return obj.errors.error("request_failed", err.message);
        
        });

}


}

    initializeObject(className, next) {
        let obj;
        const code = `obj = new ${className}Prototype()`;

        try {
            eval(code);
        } catch (err) {
            next();
        }
        return obj;
    }

    getObjectWithRequestVariables(obj, req, res) {
        obj.initRequestVariables(req, res);
        obj.body = {};
        obj.errors = res.locals.base.errors;
        obj.req = req;
        return obj;
    }

    getRequiredAndOptionalParameters(defaultParams) {
        const requiredParams = [];
        const optionalParams = [];

        for (const param of defaultParams) {
            const paramName = param.split(" ");
            const defaultValue = paramName[1].split("=")[1];
            let type, optional;

            if (defaultValue === '[]') {
                defaultValue = [];
                type = "array";
            } else {
                type = typeof eval(`${defaultValue}`);
            }

            if (defaultValue[0] === '{') {
                defaultValue = JSON.parse(JSON.stringify(defaultValue));
                type = "object";
                optional = true;
            }

            optional = type === 'object';

            const typeCheck = {
                "name": paramName[0],
                "type": type,
                "optional": optional
            };

            if (optional) {
                optionalParams.push(paramName[0]);
            } else {
                requiredParams.push(paramName[0]);
            }
        }

        return {
            requiredParams,
            optionalParams
        };
    }

    hasRequiredParameters(obj, requiredParams, optionalParams) {
        return obj.requiredParams(requiredParams, optionalParams);
    }


}