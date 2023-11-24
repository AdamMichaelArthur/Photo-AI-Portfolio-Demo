/*
		DO		NOT		CHANGE		THIS!!!!!!

		IF YOU CAN'T GET YOUR LOCAL BOX WORKING SLACK ME SO I CAN HELP MAKE
		SURE YOU'VE GOT YOUR ENVIRONMENT VARIABLES SETUP CORRECTLY
*/

var dbURI = "";

var username = process.env.DB_USERNAME
var password = process.env.DB_PASSWORD
var port = process.env.DB_PORT;
var port2 = process.env.DB_PORT2;
var port3 = process.env.DB_PORT3;
var domain = process.env.DB_DOMAIN;
var dbname = process.env.DB_NAME;
var authDB = process.env.DB_AUTHDB;
var replicaSet = process.env.DB_REPLICASET

if(process.env.NODE_ENV == "production"){
	console.log("We are in production mode");
} else {
	
}

//mongodb://localhost:27017,127.0.0.1:27018/?replicaSet=rs0

var dbURI = 'mongodb://'+username+':'+password+'@'+domain+':'+port+'/'+dbname + '?authSource=admin' + '&socketTimeoutMS=3600000&connectTimeoutMS=3600000';// + '&' + 'replicaSet' + '=' + replicaSet;

// 
//var dbURI = 'mongodb://' + domain+ ':'+port+'/'+dbname;// + '&' + 'replicaSet' + '=' + replicaSet;


console.log(dbURI);

require("@app_entry_points/db_connect")(dbURI);
