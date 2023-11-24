var communication = require("@classes/communication.js")

module.exports.sendSupportEmail = async function(req, res, next){

	communication.sendSupportEmail("adamarthursandiego@gmail.com", "Recovery Code", "Your recovery code is 12345");
	res.locals.response = { "status" : "" }
	return next();
}

module.exports.sendMail = async function(req, res, next){

	var user = res.locals.user;
	 communication.sendMail(user.email, "oauth", req.body.emailTo,
	   req.body.subject, req.body.msg);

	res.locals.response = { "status" : "" }
	return next();
}

module.exports.sendScheduleEmail = async function(req, res, next){

	communication.sendMail('gugly2009@gmail.com', 
		"Interview shedule Email", 
		"This is test");
	res.locals.response = { "status" : "" }
	return next();
}	