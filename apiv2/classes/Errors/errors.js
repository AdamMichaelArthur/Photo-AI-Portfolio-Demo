/*	This is our Base class, all classes in this project extend this class
 *
 *	Any functionality that needs to be made available to all classes should be implemented here
 *
*/

const standardErrors = {

	"default_error": {
			"Result": "Failure",
			"StatusCode": 400,
			"Error": 100,
			"ErrorDetails": {
				"Error": 100,
				"Description": "An Unnamed error has occurred",
			}
	},

	"invalid_password": {
			"Result": "Failure",
			"StatusCode": 401,
			"Error": 1000,
			"ErrorDetails": {
				"Error": 1000,
				"Description": "The password is invalid",
			}
	},

	
	"timeout": {
			"Result": "Failure",
			"StatusCode": 500,
			"Error": 1006,
			"ErrorDetails": {
				"Error": 1000,
				"Description": "The request timed out without returning a response",
			}
	},

	"invalid_user": {
			"Result": "Failure",
			"StatusCode": 401,
			"Error": 1001,
			"ErrorDetails": {
				"Error": 1001,
				"Description": "This user does not exist",
			}
	},

	"malformed_authentication_header": {
			"Result": "Failure",
			"StatusCode": 401,
			"Error": 1003,
			"ErrorDetails": {
				"Error": 1003,
				"Description": "Malformed Authentication Header.  There was a problem with the authorization string, possibly a malformed base64 string or illegal character",
			}
	},// , 

	"invalid_user": {
			"Result": "Failure",
			"StatusCode": 401,
			"Error": 1001,
			"ErrorDetails": {
				"Error": 1001,
				"Description": "This user does not exist",
			}
	},

	"bad_request": {

	},


	"get_requests_cannot_have_body": {
		"Result": "Failure",
			"StatusCode": 413,
			"Error": 1004,
			"ErrorDetails": {
				"Error": 1004,
				"Description": "Get Requests Cannot Have A Body",
				"DeveloperInfo": `It looks like you sent a GET request, but included a body.  according to the HTTP/1.1 specification, GET requests should not include a message body. The HTTP specification defines GET requests as requests to retrieve information only, and not to modify or send data.`
			}	
	},

	// get_requests_cannot_have_body"
	"unsupported-content-type" : {
		"Result": "Failure",
			"StatusCode": 400,
			"Error": 20,
			"ErrorDetails": {
				"Error": 20,
				"Description": "Unsupported Content Type",
				"DeveloperInfo": `Look in ExpressServer.js, Find: "const content_type = req.get('Content-Type');"  If you need to support more content-types, this is where you'll let it pass.`
			}				
	},

	"invalid_route": {
			"Result": "Failure",
			"StatusCode": 404,
			"Error": 101,
			"ErrorDetails": {
				"Error": 101,
				"Description": "This is an invalid route"
			}
	},

	"invalid_endpoint": {
			"Result": "Failure",
			"StatusCode": 404,
			"Error": 1005,
			"ErrorDetails": {
				"Error": 1005,
				"Description": "This is an invalid endpoint"
			}
	},

	"invalid_parameters": {
			"Result": "Failure",
			"StatusCode": 400,
			"Error": 102,
			"ErrorDetails": {
				"Error": 102,
				"Description": "There are missing or extra parameters in the request"
			}	
	},

	"invalid_sql_statement": {
			"Result": "Failure",
			"StatusCode": 400,
			"Error": 103,
			"ErrorDetails": {
				"Error": 103,
				"Description": "The SQL Provided was invalid"
			}	
	},

	"invalid_json": {
			"Result": "Failure",
			"StatusCode": 400,
			"Error": 104,
			"ErrorDetails": {
				"Error": 104,
				"Description": "There is a syntax error in the JSON Body.  Check the posted JSON to make certain its valid"
			}	
	},

	"amazon-initializion": {
			"Result": "Failure",
			"StatusCode": 400,
			"Error": 105,
			"ErrorDetails": {
				"Error": 105,
				"Description": "There was an error initializing the Amazon SP-API Object.  This is likely a result of outdated or incorrect auth tokens.  See integrations/amazon/amazon.js for context"
			}	
	},

	"unauthorized": {
			"Result": "Failure",
			"StatusCode": 401,
			"Error": 99,
			"ErrorDetails": {
				"Error": 99,
				"Description": "You are not authorized to access this resource"
			}	
	},

	"malformed_authorization_cookie" : {
			"Result": "Failure",
			"StatusCode": 400,
			"Error": 98,
			"ErrorDetails": {
				"Error": 98,
				"Description": "Malformed Authorization Cookie"
			}			
	},

	"error-string" : {
			"Result": "Failure",
			"StatusCode": 400,
			"Error": 106,
			"ErrorDetails": {
				"Error": 106,
				"Description": "This is an error I made for demonstration purposes"
			}			
	},

	"plan_restricted" : {
			"Result": "Failure",
			"StatusCode": 403,
			"Error": 1020,
			"ErrorDetails": {
				"Error": 1020,
				"Description": "Your plan does not allow access to this resource."
			}			
	},


	"unsupported_method" : {
			"Result": "Failure",
			"StatusCode": 400,
			"Error": 1031,
			"ErrorDetails": {
				"Error": 1031,
				"Description": "Method not supported for this endpoint"
			}			
	},

	"request_failed" : {
			"Result": "Failure",
			"StatusCode": 500,
			"Error": 1030,
			"ErrorDetails": {
				"Error": 1030,
				"Description": "The request failed due to an internal server error"
			}			
	},

	"framework_error" : {
			"Result": "Failure",
			"StatusCode": 500,
			"Error": 1031,
			"ErrorDetails": {
				"Error": 1031,
				"Description": "The framework does not allow this method"
			}			
	},

	"registration_user_exists": {
			"Result": "Failure",
			"StatusCode": 409,
			"Error": 1232,
			"ErrorDetails": {
				"Error": 1232,
				"Description": "This user already exsits"
			}		
	},

	"purchase_error": {
			"Result": "Failure",
			"StatusCode": 409,
			"Error": 1233,
			"ErrorDetails": {
				"Error": 1233,
				"Description": "You cannot buy your own offer."
			}		
	},

	"purchase_insufficient_points" : {
			"Result": "Failure",
			"StatusCode": 409,
			"Error": 1234,
			"ErrorDetails": {
				"Error": 1234,
				"Description": "You do not have enough points to claim this offer"
			}		
	},

	"purchase_no_longer_available": {
			"Result": "Failure",
			"StatusCode": 409,
			"Error": 1234,
			"ErrorDetails": {
				"Error": 1234,
				"Description": "This offer is no longer available"
			}		
	}	
}

export default class Errors {

	constructor(){
		
	}

	error(error_desc ="default", context =null){

		if (this.res.headersSent) {
			return;
		}

		var err = standardErrors[error_desc]

		console.log(175, error_desc, context);
		
		if(typeof standardErrors[error_desc] !== 'undefined'){
			if(context != null){
				err = { ... err, "Context": context }
			}
			this.res.status( err["StatusCode"] );
			this.res.json( err ) ;
		} else {

			err = standardErrors["default_error"]
			try {
				this.res.status( 400 );
			} catch(err){
				// We're probably outside an express route function call
			}

			if(context != null){
				err["Context"] = context;
			}
			try {
				console.log(255, err)
				this.res.json( err ) ;
			} catch(err){
				// We're probably outside an express route function call
			}
		}
		return false;
	}

	warn(error_desc ="default", context =null){
		var err = standardErrors[error_desc]

		if(typeof standardErrors[error_desc] !== 'undefined'){
			if(context != null){
				err = { ... err, "Context": context }
			}

			this.res.status( 200 );
			this.res.json( err ) ;
		} else {

			err = standardErrors["default_error"]

			err["Result"] = "Success";
			err["Warning"] = "The endpoint returned unexpected data, and did not produce a response to the client."
			err["StatusCode"] = 200;
			err["Error"] = 0;
			err["ErrorDetails"]["Error"] = 0;
			err["ErrorDetails"]["Description"] = 'An unhandled operation occured.  Not an error, but is bad form and should be corrected';

			try {
				this.res.status( 200 );
			} catch(err){
				// We're probably outside an express route function call
			}

			if(context != null){
				err["context"] = context;
			}
			try {
				this.res.json( err ) ;
			} catch(err){
				// We're probably outside an express route function call
			}
		}
		return false;
	}

	_error(error_desc, context){
		console.log(99, error_desc);
		//this.res.status( 400 );
		this.res.json( error_desc ) ;
	return false;		
	}

	_formatError(error_desc, context =null, statusCode =400, ErrorNum =100){
		var err = standardErrors[error_desc]
		if(typeof standardErrors[error_desc] !== 'undefined'){
			if(context != null){
				err = { ... err, "Context": context }
			}
		} else {
			err = standardErrors["default_error"]
			err["StatusCode"] = statusCode;
			err["Error"] = ErrorNum;
			if(context != null){
				err["context"] = context;
			}
			err["ErrorDetails"]["Description"] = error_desc
		}
		return err;		
	}

	throw(error_desc ="default", context =null){
		var er = new Error();
		er.Errors = this;
		er.err = this._formatError(error_desc, context);
		throw er;
		return false;
	}

}