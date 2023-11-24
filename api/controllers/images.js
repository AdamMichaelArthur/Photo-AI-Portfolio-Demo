var helpers = require('@classes/helpers')
var mongoose = require('mongoose');
var Model = mongoose.model('Images');
var hasPermission = require("@classes/permissions.js");
var Authentication = require('@classes/authentication.js');
var Pagination = require("@classes/pagination.js");

// ToDo: Add validation checking
module.exports.uploadImage = async function(req, res){
		
	var endpoint = helpers.getRoute(req);
	var response = helpers.defaultResponseObject(endpoint);
	var user = res.locals.user	
	var model = res.locals[endpoint]
	var fs = require('fs');

	var properResponse = {
	}

	var img = { }
	 img.created_by = user._id;
	 img.modified_by = user._id;
	 img.owner = user.accountId;
	 img.img = req.files[0].buffer
	 img.contentType = req.files[0].mimetype
	 img.imgName = req.files[0].originalname
	 img.encoding = req.files[0].encoding;
	
	try{
		image = await helpers.mongoCreate(res, Model, img)
	} catch (error){
		res.send(error);
	}
	response[endpoint] = "File Uploaded"
	response.id = image._id;
	res.json(helpers.success(res, response));
}

module.exports.getImage = async function(req, res)
{
	var id = req.params.id;
	if(!id)
	{
		helpers.error(res, 741, "An ID is required");
		return;
	}

	try{
		var image = await Model.findById(id)
	} catch (err) {
		res.status(404)
		return res.send("Not found");
	}
	
	if( image == null)	// If a valid ID is passed, but it's not in the system, it won't throw an error, jsut return a null
	{
		res.status(404)
		return res.send("Not found");		
	}

	res.type(image.contentType);
	res.send(image.img);
}

module.exports.listImages = async function(req, res)
{
	var user = res.locals.user
	var owner = user.accountId;
	
	try {
		var images = await Pagination.listByPage(req, res, Model);
	} catch (err)
	{
	}
}