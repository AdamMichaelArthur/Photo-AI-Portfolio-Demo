
import Database from '../database.js'
import Connection from './connection.js'
import { MongoClient, ObjectId } from 'mongodb';
import DocumentStandard from "./document-standards.js";

export default class Mongo extends Database {

	bDatabaseReady = false;

	// Creates a record
	create(){

	}

	// Creates a record, but if it exists, it updates it
	createOnDuplicateKeyUpdate(){
		
	}

	// Creates a record, returns without waiting for the result of the database operation
	createWithoutWaiting(){

	}

	// Creates many records at the same time
	createMany(){

	}

	// Uses bulkWrite to create many records, and if there are any duplicates, it updates them
	mongoCreateManyOnDuplicateKeyUpdate(){

	}

	// Deletes a record
	delete(){

	}

	// Deletes every record
	deleteAll(){

	}

	// Finds a single record
	// findOne(){

	// }

	// Finds every record
	findAll(){

	}

	// Returns a count of records
	count(){

	}

	editKeyValuePair(){

	}

	constructor(altCallback =() => { } ){
		super();
		this.connection = new Connection(this, altCallback );
	}

	connected(){
		console.log("Database Ready");
		this.bDatabaseReady = true;
		this.mongo = this;
		this.db = this.connection.db;
		global.db = this.connection.db;
		global.database = this;
	}

	checkReadiess(){
		if(!this.bDatabaseReady){
			console.warn("The database in not ready");
			return false;
		}
		return true;
	}

	error(err){
		// Do something with the error
		return false;
	}

	async findOne(query ={}, coll ='', projection = { projection: { "_id": 1} }){




		try {
			var result = await this.db.collection(coll).findOne(query, projection);
		} catch(err){
			console.log(40, result);
			return this.error(err);
		}
		return result;
	}

	async insertOne(obj){
		
		var doc = new DocumentStandard(this.user, obj).getStandardDocument();
		console.log(106, this.user);
		console.log(107, obj);

		console.log(111, this.collection, result)
		try {
			var result = await this.db.collection(this.collection).insertOne(doc);
			
		} catch(err){
			console.log(113, err)
			return false;
		}
		return result;
	}

	async updateOne(query ={}, update = {}, coll ='', options ={}){
		if(!this.checkReadiess()){
			return false; 
		}

		// query = {
		// 	... { _id: this.user_id }
		// }

		//console.log(57, query, update, coll, options);
		try {
			var result = await this.db.collection(coll).updateOne(query, update, options )
		} catch(err){
			console.log(59, err);
		}

		return result;
		//console.log(55, result);
	}

	async insertMany(){
		if(!this.checkReadiess()){
			return false; 
		}
	}

	async bulkWrite(){
		if(!this.checkReadiess()){
			return false; 
		}
		
	}

	async updateBulk(){
		if(!this.checkReadiess()){
			return false;
		}
	}
}

// const sampleData = [];

// setTimeout( () => {

// 	let collection = global.db.collection('forums');
// 	collection.insertMany(sampleData);
// }, 5000)
