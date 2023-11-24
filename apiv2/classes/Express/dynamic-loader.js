import Base from '@base';
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

/**
 * Dynamically loads modules inside of a directory.
 * @DynamicLoader
 */
export default class DynamicLoader extends Base {

	constructor(initializers){
		super(initializers);
		this.filenames = [];
	}

	async handleDynamicRoutes(directoryPath, reference ="Prototypes"){

		if(typeof global[reference] === 'undefined'){
			global[reference] = [];
		}

        this.dynamicRoutes = await this.getAllFiles(directoryPath, [])
        var dirs = await this.getAllDirectories(directoryPath, [])

        for(var file of this.dynamicRoutes){
        	const str = file;

        	if(path.extname(file).toLowerCase() !== '.js'){
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
			const result = Voca.lowerCase('/' + pathSegments.join('/'));

			// Dynamically import modules

			import(process.cwd() + "/" + file)
                .then(module => {
                	
                const instance = module.default

                // Check if there's a naming conflict...

                // This ensures a unique name, and a consistent pattern to access the integration.
                // Need to access the GoogleDrive integration?
                // integrations.chatgpt.myFunction
                // integrations.google.drive.myFunction 
                // need a new instance?  var myObj = new global.IntegrationsGoogleSheetsPrototype

                var filename = Voca.titleCase(Voca.camelCase(pathSegments.pop()));
                
                for(let pathSegment of pathSegments){
                	pathSegment = Voca.camelCase(pathSegment)
                }

                var camelCaseCorrectedSegments = [];
                for(let segment of pathSegments){
                	// Yourapp is a reserved word -- if we encounter it, it gets removed
                	if(segment == 'yourapp'){
                		continue;
                	}
                	segment = Voca.camelCase(segment);
                	camelCaseCorrectedSegments.push(segment);
                }
                var pathDot = camelCaseCorrectedSegments.join('.');
                var pathName = camelCaseCorrectedSegments.join(' ');
                pathName = Voca.titleCase(Voca.camelCase(pathName));
                
                var accessCode = `global.${pathName}Prototype = instance`;
                
                var classRef = `${pathName}Prototype()`;
                let className = Voca.titleCase(Voca.kebabCase(filename));
                
                let lastElement = Voca.titleCase(Voca.camelCase(camelCaseCorrectedSegments[camelCaseCorrectedSegments.length - 1]));
                if(filename != lastElement){
                	accessCode = `global.${pathName}${filename}Prototype = instance`;
                	classRef = `${pathName}${filename}Prototype()`;
                	pathDot = pathDot + "." + Voca.lowerCase(Voca.snakeCase(filename));
                }

                // Extract the name of the super class in string form

                try {
                    eval(accessCode);
                } catch(err){
                    console.log(376, err);
                }

                let str = instance.toString(); let superClass = '';
                
	            const match = str.match(/extends\s+(\w+)/);
	            if (match && match.length >= 2) {
	              superClass = match[1];
	            }

                global[reference].push({
                	"prototype":accessCode,
                	"pathReference":pathDot,
                	"classRef": classRef,
                	"parentClass":superClass,
                	"className": className
                })

             })

   //              console.log(133, result);

			// this.app.use(result, (req, res, next) => {

				

			// 	const url = new URL(req.originalUrl, `http://${req.headers.host}`);
	  //           const baseUrl = process.env.BASE_URL;

	  //           var baseUrlComponents = baseUrl.split('/');
	  //           if(baseUrl.length == 0){
	  //               baseUrlComponents = [];
	  //           }

	  //           var pathComponents = url.pathname.split('/');
	  //           var parameters = [];
	  //           pathComponents = pathComponents.filter(str => str !== '');
	  //           baseUrlComponents = baseUrlComponents.filter(str => str !== '');

	  //           const combinedArray = baseUrlComponents.concat(pathComponents);
	  //           const uniqueArray = Array.from(new Set(combinedArray));
	  //           const resultArray = combinedArray.filter((item) => combinedArray.indexOf(item) === combinedArray.lastIndexOf(item));

	  //           var className = resultArray[0];
	  //           var functionName = '';
	  //           var endpoint = resultArray[1];

	  //           let obj;
	  //           let code;

	  //           for(const tmpFileName of this.filenames){
	  //           	var className = pathComponents.lastIndexOf(tmpFileName);
	  //           	parameters = pathComponents.slice(className + 2);
	  //           	if(className != -1){
	  //           		functionName = pathComponents[className + 1]

	  //           		className = pathComponents[className];
	  //           		const predictedClassName = `${Voca.titleCase(Voca.camelCase(className))}`;
	  //           		code = `obj = new ${predictedClassName}Prototype()`;
	  //           	}
	  //           }
	  //           try {
	  //               eval(code);
	  //           } catch(err){
	  //               res.status(500);
			// 		res.json({"works":false})
	  //           }

	  //           var base = new Base();
	  //           res.locals.base = base;
	  //           res.locals.base.response = new Response();
	  //           res.locals.base.initRequestVariables(req, res);

	  //           res.locals.base.errors.req = req;
	  //           res.locals.base.errors.res = res;
	  //           res.locals.base.response = new Response();
	  //           res.locals.base.initRequestVariables(req, res);

	  //           obj.response = res.locals.base.response;
	  //           var vars = {}
			// 	for (let i = 0; i < parameters.length; i += 2) {
				  
			// 	  if(typeof parameters[i+1] !== 'undefined'){
			// 	  		obj[parameters[i]] = parameters[i+1]
			// 	  		vars[parameters[i]] = parameters[i+1]
			// 	   }
			// 	}

			// 	obj.parameters = vars;

	  //           let result;
	  //           try {
	  //               eval(`result = obj.${functionName}();`);
	  //           } catch(err){
	  //               return res.locals.base.errors.error("invalid_endpoint");
	  //           }
	            
	  //           if (!res.headersSent) {
	  //               if( (typeof result == 'undefined') || (result == true)){
	  //                   return res.locals.base.response.reply("Success");
	  //               }

	  //               if(result == false){
	  //                   return res.locals.base.errors.error('default', `${endpoint}() returned false`);
	  //               }

	  //               return res.locals.base.errors.warn('default', `${endpoint}() returned ${JSON.stringify(result)}`);
	  //           }

			// });

        }

        global.Prototypes = [ ... new Set(global.Prototypes)]
	}	
}