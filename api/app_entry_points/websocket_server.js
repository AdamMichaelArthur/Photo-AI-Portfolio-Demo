/*
	Entry Point For Starting Websocket Servers
	We use socket.io for this purpose
*/

/* Start the Websocket Server for the Content Bounty Angular Web App */
// import 'dotenv/config'

// var app = require("express")();
// var server = require("http").Server(app);
// var io = require("socket.io")(server);

// server.listen(process.env.WEBSOCKET_1);

// require("@classes/streams/bounties.js")(io);


// /* Start the Websocket Server for the Content Bounty Simultaneous iOS App */

// if(process.env.NODE_ENV != "development"){

// 	var iosApp = require("express")();
// 	var iosServer = require("http").Server(iosApp);
// 	var iosIo = require("socket.io")(iosServer);

// 	iosServer.listen(process.env.WEBSOCKET_2);

// 	require("@classes/streams/simultaneous_record.js")(iosIo);

// }

