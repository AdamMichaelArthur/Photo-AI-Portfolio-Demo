// Load Our Environment Variables

import 'dotenv/config'

global.version = process.env.VERSION;

// Before we begin, enforce our Node Version.
var nodeVersions = process.versions.node.split(".");

for(var n of nodeVersions){
	n = parseInt(n);
}

if(nodeVersions[0] < 20){
	console.error(nodeVersions, "This project requires Node Version 20 or greater");
	//process.exit(1);
}

// Do some basic checking on minimum settings inside our environment variable
if(typeof process.env.PORT === "undefined"){
	console.log("Error: PORT .env Environment Variable Not Set.  ");
	process.exit(0);
}

if(typeof process.env.DEFAULT_TIMEOUT === "undefined"){
	console.log("Error: DEFAULT_TIMEOUT .env Environment Variable Not Set.");
	process.exit(0);
}

// Set some defaults in case these are missing in our environment variable
if(typeof process.env.JSON_BODY_POST_SIZE_LIMIT === "undefined"){
	//process.env.JSON_BODY_POST_SIZE_LIMIT = '50mb';

}

if(typeof process.env.TEXT_BODY_POST_SIZE_LIMIT === "undefined"){
	//process.env.TEXT_BODY_POST_SIZE_LIMIT = '50mb';
}

/*	We use OOP patterns in this project
 *	So, we have a class called "ExpressServer" which
 *	handles everything related to getting our Express server up and running
*/

import ExpressServer from "./classes/Express/ExpressServer.js"
const expressServer = new ExpressServer(process.env.PORT, process.env.DEFAULT_TIMEOUT, process.env.JSON_BODY_POST_SIZE_LIMIT, process.env.TEXT_BODY_POST_SIZE_LIMIT);
expressServer.startServer();
