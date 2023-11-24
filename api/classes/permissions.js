
var helpers = require("@classes/helpers.js")
module.exports.To = function(Do, res){
	if(!res.locals.permissions.includes(Do))
	{
		helpers.error(res, "7226", "You do not have permission to " + Do);
		return false;
	}
	return true;
}

module.exports.permission = function(permission) {
	return function(req, res, next) {
	if(!module.exports.To(permission, res))
		return;
	return next();
	}
}