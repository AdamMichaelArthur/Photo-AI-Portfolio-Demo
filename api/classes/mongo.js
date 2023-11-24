var mongoose = require('mongoose');
var moment = require('moment');
const util = require("util");
var voca = require("voca");
/*
	This is a helper class for Saas-Product specific MongoDB tasks.
	As an example, every record has an "owner", "created_by", etc.
	And by using these functions, we ensure everything is inserted 
	into the DB correctly.

	It's basically a mini ORD that's project specific, and it does make
	certain tasks much easier, in certain contexts.  

	I regret using Mongoose at this stage.  I find myself needing or wantig
	to fall back to the Node drivers provided by Mongo far too often

	It would be a big project to remove mongoose at this point, and the payoff
	isn't worth it at this time.  But maybe someday...
*/

module.exports = class Mongo {

	constructor(Model, User, res) {
		this.model = Model;
		this.user = User;
		this.res = res;
	}

	async mongoCreate(model, id =null, update =true) {

		var user = this.user;

		var obj = {
			owner: this.user.accountId,
			created_by: this.user._id,
			modified_by: this.user._id,
			createdAt: moment().format(),
      		modifiedAt: moment().format(),
			selected:false
		}

		let merged = {...obj, ...model} 

		if(id != null){
			merged["_id"] = id;
		}

		//console.log(61, merged);
		
		try {
			if(update  == false){
				try  {
				console.log(44, merged);
				model = await this.model.create(merged)
				return model;
			} catch (err){
				console.log(46, err);
				return false;	
			}
			}
			
			model = await this.model.updateOne(merged, merged, { upsert: true })

			if(model.nModified == 0){
				if(model.ok == 0)
					return false
			}
			if(typeof model.upserted != 'undefined'){
			return {
				_id: model.upserted[0]._id,
				... merged
			};

		}

		} catch(err) {
			console.log(45, "mongo.js", err);
			//var error = module.exports.mongoError(null, err)
			//module.exports.error(res, error.code, error.message);
			return false;
		}
		return merged;

	}

	async mongoCreateMany(models, _filter =null) {

		console.log(87, models);
		
		var user = this.user;

		var tmpmodels = [];
		if(typeof this.user != 'undefined'){
		for(var i = 0; i < models.length; i++){


			var model = models[i]
			var obj = {
			owner: this.user.accountId,
			created_by: this.user._id,
			modified_by: this.user._id,
			createdAt: moment().format(),
      		modifiedAt: moment().format(),
			selected:false
		}

		if(_filter != null){
			obj = { ... obj, ... _filter }
		}

		let merged = {...obj, ...model }

			tmpmodels.push(merged)
		} } else {
			tmpmodels = models;
		}

		try {
			var result = await this.model.insertMany(tmpmodels)
		} catch(err) {
			console.log(96, err);
			return false;
		}
		return result;
	}

	async mongoCreateManyOnDuplicateKeyUpdate(models, _filter =null, primary_key =null, secondary_key =null, exclude_search =null, exclude_update =null) {

		// For this to work as intended, I need to use bulkWrite

		const bulkData = [];  

		// models.map(model => (
	 //        {
	 //            updateOne: {
	 //                filter: {},
	 //                update: model,
	 //                upsert: true
	 //            }
	 //        }
	 //    ));

		for(var i = 0; i < models.length; i++){
			var model = models[i]

			var keys = Object.keys(model)
			var values = Object.values(model)
			if(keys.length == 0){
				continue;
			}
			var filter = { 
				owner: this.user.accountId,
				created_by: this.user._id,
				modified_by: this.user._id
			}

			if(_filter != null){
				filter = { ... filter, ... _filter }
			}

			var obj = {
				owner: this.user.accountId,
				created_by: this.user._id,
				modified_by: this.user._id,
	      		modifiedAt: moment().format(),
				selected:false
			}

			let merged = {...obj, ...model } 

			if(primary_key == null)
				filter[keys[0]] = values[0]
			else{
				for(var f = 0; f < values.length; f++){
					if(keys[f] == primary_key)
						filter[primary_key] = values[f]
				}
			}

			if(secondary_key != null)
			{
				for(var f = 0; f < values.length; f++){
					if(keys[f] == secondary_key)
						filter[secondary_key] = values[f]
				}
			}



			var filterCpy = { ... filter }

			if(exclude_search != null){
				if(Array.isArray(exclude_search)){
					//console.log(192)
					for(var x = 0; x < exclude_search.length; x++){
						//console.log(194, 'deleting', filter, exclude_search[x])
						delete filter[exclude_search[x]]
					}
				} else {
					//console.log(198, 'deleting', filter[exclude_search])
					delete filter[exclude_search]
				}
			}

			var updateObj = {
				updateOne: {
					filter: filter,
					update: { $set : { ... merged, ... filterCpy } },
					upsert: true
				}
			}

			for (const [key, value] of Object.entries(updateObj["updateOne"]["update"]["$set"])) {
				//console.log(214, key, value, updateObj["updateOne"]["update"]["$set"]);
	  			if(voca.includes(key, "_id")){
	  				//console.log(216, key)
	  				try {
	  					updateObj["updateOne"]["update"]["$set"][key] = mongoose.Types.ObjectId(value)
	  				} catch(err){
	  					console.warn("Tried to convert", value, "to an object_id, but it failed");
	  				}
	  			}
	  			//console.log(223, value, typeof value, isNumber(value))
			}

			bulkData.push(updateObj)
		}

		//console.log(345, util.inspect(bulkData, false, null, true /* enable colors */));
	    var result = await this.model.bulkWrite(bulkData, {ordered : false });

	    return result.result;


				console.log(2248, value, isNumber(value));
				function isNumber(str) {
				  // Use the parseFloat function to check if the string can be parsed into a number
				  // If it can be parsed, it's a valid number
				  return !isNaN(parseFloat(str)) && isFinite(str);
				}

				function convertToNumber(str) {
				  // Use parseFloat to convert the string to a number
				  return parseFloat(str);
				}

				if (isNumber(value)) {
					obj[key] = convertToNumber(value);
				  //const numberValue = 
				  console.log(2262, "The string is a number:", numberValue);
				} else {
				  console.log("The string is not a valid number.");
				}
	}
	
async mongoCreateNoWait(model, id =null) {


		var user = this.user;

		var obj = {
			owner: this.user.accountId,
			created_by: this.user._id,
			modified_by: this.user._id,
			createdAt: moment().format(),
      		modifiedAt: moment().format(),
			selected:false
		}

		let merged = {...obj, ...model} 

		if(id != null){
			if(id.length == 24)
				merged["_id"] = id;
		}

		console.log(68, merged);
		// 5e2ddfb51b4b306035555fe
		// 5e047b6de1b28b023fe51dba

		try {
			model = await this.model.create(merged, function(err, res){
				if(err != null)
					console.log(err)
			})
			return model;
		} catch(err) {
			console.log(79, "here", err);
			//var error = module.exports.mongoError(null, err)
			//module.exports.error(res, error.code, error.message);
			return false;
		}
}

		async mongoDelete(id) {
		try {
			var model = await Model.findByIdAndRemove(id)
			return model
		} catch (err) {
			console.log(err);
			var error = module.exports.mongoError(null, err)
			module.exports.error(res, error.code, error.message);
			return false;
		}
		}

		async deleteAll() {
		console.log(this.user._id)
		try {
			var results = await this.model.remove({
				created_by: this.user._id
			});
			return results;
		} catch(err){
			return false;
		}
	}

	async findAll() {
		try {
			var results = await this.model.find({
				created_by: this.user._id
			});
			return results;
		} catch(err){
			return false;
		}
	}

	async mongoFindAll() {
		//console.log(this.user._id);
		try {
			var results = await this.model.find({
				created_by: this.user._id
			});
			return results;
		} catch(err){
			return false;
		}
	}

	async countRecords() {
		try {
			var results = await this.model.countDocuments({
				created_by: mongoose.Types.ObjectId(this.user._id)
			});
			return results;
		} catch(err){
			return false;
		}
	}

	async mongoFindAllByUser() {

	}

	async mongoFindAllByAccount() {
		
	}

 	async mongoCreateOnDuplicateKeyUpdate(key, data){
 		var obj = {
 			created: new Date(),
 			modified: new Date(),
			owner: this.user.accountId,
			created_by: this.user._id,
			modified_by: this.user._id,
			createdAt: moment().format(),
      		modifiedAt: moment().format(),
			selected:false
		}

		let merged = {...obj, ...data} 

		try {
			var d = await this.model.findOneAndUpdate(key, merged, {upsert: true, new: true, runValidators: true})
			return d;
		} catch (err) {
			console.log(150, "err", err);
			return false;
		}
		return d;
}


	async create() {

	}

	async find() {

	}

	async readOneById(id) {

	}

	async listAll() {

	}

	async listByPage(page) {

	}

	async searchByKeyValuePair(key, value) {

	}

	async searchByValue(value) {

	}

	async editKeyValuePair(_id, key, value) {
		//console.log(_id, key, value);
		try {
			var result = await this.model.findById(_id);
			//console.log(result);
			result[key] = value;
			var res = await result.save();
			//console.log("result: ", res);

			return result;
		} catch (err) {
			console.log("err", err);
			return false;
		}
	}

	async replaceEntireDocument(document) {

	}

	async deleteOneById(id) {

	}

	async update()
	{

	}

	async updateMany(){

	}

	async deleteMany(){

	}

	async swapDisplayPositions(){

	}

	
}