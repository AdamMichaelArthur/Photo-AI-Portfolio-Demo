import { MongoClient } from "mongodb";

global.isDatabaseConnected = false;

export default class DatabaseConnection {

	database = 'mongodb';
	username = process.env.DB_USERNAME
	password = process.env.DB_PASSWORD
	port = process.env.DB_PORT;
	domain = process.env.DB_DOMAIN;
	dbname = process.env.DB_NAME;
	authDB = process.env.DB_AUTHDB;
	replicaSet = process.env.DB_REPLICASET
	authSource = process.env.authSource
	socketTimeout = process.env.socketTimeoutMS
	connectionTimeout = process.env.connectTimeoutMS
	directConnection = process.env.directConnection
	callback = null;
	

	constructor(callback, altCallback =() => { }){
		if(global.isDatabaseConnected == false){
			this.callback = callback;
			this.connection_uri = 'mongodb://'+this.username+':'+ this.password+'@'+ this.domain+':'+ this.port+'/'+ this.dbname + '?authSource=admin' + '&socketTimeoutMS=' + 
			this.socketTimeout + '&connectTimeoutMS=' + this.connectionTimeout + 'replicaSet=rs0' + '&directConnection=' + this.directConnection;
			console.log(this.connection_uri);
			this.client = new MongoClient(this.connection_uri, { useNewUrlParser: true, useUnifiedTopology: true });
			this.websocketCallback = altCallback
			this.connect();
		} else {
			this.callback = callback;
			this.connection_uri = global.databaseConnection.connection_uri;
			this.socketTimeout = global.databaseConnection.socketTimeout;
			this.client = global.databaseConnection.client;
			this.activeConnection = global.databaseConnection.activeConnection;
			this.db = global.databaseConnection.db;
			this.bDatabaseReady = true;
			//this.callback.connected();
		}
	}

	async connect() {
		try {
		    this.activeConnection = await this.client.connect();
		    this.db = this.activeConnection.db();
		    this.callback.connected();
		    console.log("Connected successfully to MongoDB");
		    global.isDatabaseConnected = true;
		    global.databaseConnection = this;
		    this.websocketCallback(this.db);
		} catch (error) {
		    this.handleException(error);
		}
	}

	handleException(error) {
    	console.error("An exception occurred:", error);
  	}

	// Handle Database Events

	// Disconnected from the database.  Reconnect!
	eventDisconnected(){
		this.activeConnection.on("close", () => {
			console.warn("MongoDB connection closed, attempting to reconnect");
		});
	}

	// Connected to the database.
	async eventConnected(){

	}

	// The database was reconnected
	async eventReconnected(){

	}

	// Timeout event
	async eventTimeout(){

	}

	// A document was inserted
	async insertEvent(){

	}

	// A document was updated
	async updateEvent(){
		// Change the 'updatedAt' and 'updatedBy' field
	}

	// A document was deleted
	async deleteEvent(){

	}

	// An index was created
	async indexEvent(){

	}

	// Some enterprise organizations require advanced tracking of who accesses and manipulates data, and when.and
	


	
}
