// module.exports = class Router {

// 	constructor() {

// 	}

// 	routeDataSource(req, res, next) {
// 	    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	    
// 	    var endofurl = fullUrl.indexOf("?");
// 	    if(endofurl != -1){
// 	      fullUrl = fullUrl.substring(0, endofurl); 
// 	    }

// 	    var action = helpers.getParameter(fullUrl, "boxredirect");

// 	    if(typeof action == 'undefined'){
// 	      action = helpers.getParameter(fullUrl, "box");
// 	    }

// 	    var Action = new BoxIntegration(req, res, next);
// 	    var evalCode = "Action." + action + "()";

// 	    try {
// 	      eval(evalCode);
// 	    } catch (err){
// 	      var desc = {
// 	        raw: { 
// 	          message: "This method is not defined"
// 	        }
// 	      }
// 	    }
// 	}

// }