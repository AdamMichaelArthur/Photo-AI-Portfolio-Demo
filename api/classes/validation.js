/*	
	Created on 12/21/2018 by Adam Arthur
*/
var helpers = require('@classes/helpers')

module.exports.checkInput = function(requiredParams)
{	
	return function(req, res, next) {
	var jsonBody = helpers.validatePostedData(req, res, requiredParams);
	if(jsonBody == false)
		return;
	res.locals.jsonBody = jsonBody
	res.locals.route = helpers.getRoute(req);
	
	return next()
	}
}

module.exports.checkOutput = function(requiredParams) {
	return function(req, res, next) {
	var response = helpers.defaultResponseObject(res.locals.route);

	response[res.locals.route] = res.locals.response;
	var jsonBody = helpers.validateResponseData(res, response[res.locals.route], requiredParams);
	if(jsonBody == false)
		return;
	helpers.success(res, response);
	}
}

// class DataValidation {
// 	constructor() {
// 	}
// }

// /*
// 	Checks and sees if the credit card data is valid as per standards
// 	the cc_num is a 14-16 digit number that has to follow certain rules
// 	exp_date is a string in the format MMYY, it must be 4 characters and 
// 	must include a leading zero for MM.  YY is a two digit representation 
// 	of the year, it cannot be less than the current year, and in general, isn't
// 	going to be more than five years into the future.  The MM also cannot be less
// 	than the current month IF the expiration date if the same as the year
// */
// class CreditCardValidation extends DataValidation{

// 	constructor(cc_num, exp_date, ccv_code, billing_zip) {
// 		this.bValidNumber = false;
// 		this.bValidExpDate = false;
// 		this.bValidCCVCode = false;
// 		this.bValidBillingZip = false;
// 		this.bValid = false;
// 		valid_credit_card(cc_num)
// 		valid_exp_date(exp_date)
// 		valid_ccv_code(ccv_code)
// 		valid_billing_zip(billing_zip);
// 	}

// 	valid_exp_date(value) {
		
// 	}

// 	valid_ccv_code(value) {

// 	}

// 	valid_billing_zip(value) {

// 	}

// 	valid_credit_card(value) {
// 		// Copied off the internet.  Search luhn algorithm javascript
// 	  	// accept only digits, dashes or spaces
// 		if (/[^0-9-\s]+/.test(value)) return false;

// 		// The Luhn Algorithm. It's so pretty.
// 		var nCheck = 0, nDigit = 0, bEven = false;
// 		value = value.replace(/\D/g, "");

// 		for (var n = value.length - 1; n >= 0; n--) {
// 			var cDigit = value.charAt(n),
// 				  nDigit = parseInt(cDigit, 10);
// 			console.log(cDigit, "-")
// 			if (bEven) {
// 				if ((nDigit *= 2) > 9) nDigit -= 9;
// 			}

// 			nCheck += nDigit;
// 			bEven = !bEven;
// 	}

// }