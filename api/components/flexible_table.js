/*
	Created 11/21/2019 by Adam Arthur
	flexible_table.js

	Flexible Table is designed to be a tightly integrated API/Angular combo
	The purpose here is to be able to easily configure sophisticated
	API-controlled tables that include advanced features, including
	infinite pagination, search, instant updates, and more

	The idea is to create this in such a way where any Mongo collection
	can be dropped in, and 
*/

module.exports = class FlexibleTable {

	constructor(mongoCollection, req, res) {
		this.mongoCollection = mongoCollection
		this.req = req;
		this.res = res;
	}

	async function listByPage(page, sort){
		
	}

	async function search(searchTerm){

	}

	async function updateOne(_id, key, value){

	}

	async function deleteOne(_id){

	}

	async function rejectOne(_id){

	}

	async function approveOne(_id){

	}

	async function swapDisplayPosition(_id, _id2){

	}

}

