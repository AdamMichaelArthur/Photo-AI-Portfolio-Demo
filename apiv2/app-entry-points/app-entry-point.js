import "module-alias/register.js";

"use strict";

// Load Our Environment Variables
import 'dotenv/config'
//dotenv.config();

/*
	This modles makes it so we can write things like "import vair module = require('@deep/module')"
	or 'import module from '@deep/module' instead of require('../../../../some/very/deep/module')

	Read More:
	https://www.npmjs.com/package/module-alias
*/



/*	We use OOP patterns in this project
 *	So, we have a class called "ExpressServer" which
 *	handles everything related to getting our server up and running
 *	Add new directories in the package.json file under _moduleAliases
*/

import test from '@cd/test.js'

//import expressServer from '@classes/ExpressServer.js'

//import Person from 'test';
//var expressServer = require("@classes/ExpressServer");
//ExpressServer.startServer();

//import Animal from 'path/to/Animal.js';