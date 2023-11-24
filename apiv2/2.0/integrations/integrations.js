import Base from "@base"
import Voca from "voca";

export default class Integrations {

	maxBodyLength = 'Infinity'
	interceptedMethods = [];
	constructor(){
		var methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      		.filter(method => method !== 'constructor' && typeof this[method] === 'function');
      	this.interceptedMethods = this.interceptedMethods.concat(methods)
      	//this.itemsToRemove = ['validateRequiredParameter', 'initializeInterceptors', 'wrapMethodWithInterceptor'];
		//this.interceptedMethods = this.itemsToRemove.filter(item => !this.itemsToRemove.includes(item));	
		this.initializeInterceptors();
		this.disableValidation = false;
		
	}

	validateRequiredParameter(requiredParam ={}, paramType ="string", bAllowEmpty =false){
		return true;
		if(this.disableValidation === true){
			return true;
		}

		console.log(24, requiredParam, paramType, bAllowEmpty);

		if(typeof requiredParam !== paramType){
			if(paramType == "array"){
				if(!Array.isArray(requiredParam)){
					throw new Error("A parameter passed did not pass type check validation");
				}
			} else {
				console.log(27, "here");
				throw new Error("A parameter passed did not pass type check validation");
			}
		}
		if(bAllowEmpty == false){
			if(paramType == "string"){
				if(typeof requiredParam !== "string"){
					console.log(32, "Not a string")
					throw new Error("A parameter passed was empty, when that is not allowed");
				}

				if(requiredParam.length == 0){
					throw new Error("A parameter passed was empty, when that is not allowed");
				}
			}
			if(paramType == "object"){
				if (Object.keys(requiredParam).length === 0) {
					throw new Error("A parameter passed was empty, when that is not allowed");
				}
			}
			if(paramType === "boolean"){
				
				if((requiredParam !== true) && (requiredParam !== false)){
					
					throw new Error("A parameter was passed that was expected to be a boolean, but it was neither true nor false");
				}
			}
			if(paramType === "number"){
				if (typeof requiredParam === 'number' && isFinite(requiredParam)) { return true; } else {
			  		throw new Error("A parameter was passed that was expected to be a number, but it was not a number");
				}
			}
			if(typeof requiredParam === "undefined"){
				throw new Error("A parameter was passed that was undefined");
			}
			if(paramType === "bigint"){
				if (typeof requiredParam === 'bigint') {
 					throw new Error("A parameter was passed that was expected to be a bigint, but it was not.");
				}
			}
			// Not a native type, but we allow it
			if(paramType === "array"){
				if(!Array.isArray(requiredParam)){
					throw new Error("A parameter was passed that was expected to be an array, but it was not.");
				}
			}
			if(typeof requiredParam === null){
				throw new Error("A parameter was passed that was a null value");
			}
			if(typeof requiredParam === "function"){
				throw new Error("A parameter was passed that was a function.  That's not allowed here");
			}
		}
		return true;
	}

	initializeInterceptors() {
    	for (const methodName of this.interceptedMethods) {
      		this.wrapMethodWithInterceptor(methodName);
    	}
  	}

  	wrapMethodWithInterceptor(methodName) {
	       const originalMethod = this[methodName];

	    this[methodName] = function(...args) {	    

		    var functionDeclaration = originalMethod.toString();
		    functionDeclaration = functionDeclaration.split('\n')[0];
		    if(functionDeclaration[functionDeclaration.length] == '}'){
		    	functionDeclaration[functionDeclaration.length] = ''
		    }
		    var functionSignature = Voca.replaceAll(functionDeclaration, "async ", "");
			const parametersString = functionSignature.match(/\((.*?)\)/)[1];

			// Split the parameters by comma and process each parameter
			const parametersArray = parametersString.split(',').map(param => param.trim());

			// Extract the parameter and its argument
			const parameterArgumentPairs = parametersArray.map(param => {
			  const [parameter, argument] = param.split('=').map(part => part.trim());
			  return { parameter, argument };
			});
			var objs = []
			for (const { parameter, argument } of parameterArgumentPairs) {
 			 	var obj = eval(argument);
 			 	if(typeof obj === 'undefined'){
 			 		if(argument == "{}"){
 			 			obj = {};
 			 		}
 			 	}
 			 	var type = typeof obj;
 			 	if(Array.isArray(obj)){
 			 		type = "array";
 			 	}
 			 	objs.push(type);
			}
			for(var arg in args){
				var obj = objs[arg];

				try {
					this.validateRequiredParameter(args[arg], obj, false);
				} catch(err){
					console.log(142, "Invalid Parameter Type", err);
					return false;
				}
			}

	      // Call the original method
	      const result = originalMethod.apply(this, args);
	      return result;
	    };
	}

}






