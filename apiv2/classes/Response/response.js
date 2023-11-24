export default class Response{

	successResponse = {
	    "Result": "Success",
	    "Error": 0,
	    "ErrorDetails": {
	        "Error": 0,
	        "Description": "The operation was successful"
	    }
	}

	constructor(){
		this.responseStatus = 200;
		this.responsePackage = this.successResponse
		this.language = 'en'
	}

	reply(data ='', status =200){

		if(typeof data == "string"){
			data = { result: data }
		}

		if(typeof data == "number"){
			data = { result: data }
		}

		if(Array.isArray(data)){
			data = { result: data }
		}

		var response = {
			... this.successResponse,
			... data,
			... { language: this.language }
		}
		
		//console.log(3551, this.res.locals.user, this.res.locals.userAccount);

		//response['plan'] = this.res.locals.userAccount.plan;

		response['paymentMethodAttached'] = false;

		try {
			if(this.res.locals.userAccount.paymentMethodAttached === true){
				response['paymentMethodAttached'] = true;
			}
		} catch(err){ }

		this.responsePackage = response;
		this.responseStatus = status;

	}

	redirect(path){
		this.res.redirect(path);
	}

}