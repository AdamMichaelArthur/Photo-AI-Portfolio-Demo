import Google from '../google.js'
import axios from 'axios';
import Voca from 'voca';

import {
  setTimeout,
  setImmediate,
  setInterval,
} from 'timers/promises';

const auth_token = process.env.GOOGLE_TRANSLATE_KEY;

export default class Drive extends Google {

	constructor(initializers =null){
		try {
			super(initializers, "/integrations/google/translate/", "translate");
		} catch(err){
			console.error("Unable to initialize", err);
		}


	}

	async translateValue(fromLang, toLang, value)
	{

		let valuesAr = [];
		for(var item of value){
			valuesAr.push(item.value)
		}

		// Convert the array to a comma-separated string
		const commaSeparatedString = valuesAr.join('\r');

		// Make the string URL query-safe
		const querySafeString = commaSeparatedString;

		let body = {
		  "q": querySafeString,
		  "source": fromLang,
		  "target": toLang
		}

		//console.log(46, body);

		let data = JSON.stringify(body);

		let config = {
		  method: 'post',
		  maxBodyLength: Infinity,
		  url: 'http://localhost:5002/translate/',
		  headers: { 
		    'Content-Type': 'application/json'
		  },
		  data : data
		};

		try {
			var result = await axios.request(config)
		} catch(err){
			console.log(53, err);
			return "";
		}

		console.log(66, data.data)

		try {
			const translatedArray = result.data.data.translations[0].translatedText.split('\n');
			var decodedArray = translatedArray.map(element => decodeURIComponent(element));

			for(var pos in value){
				let item = value[pos];
				item.value = translatedArray[pos];

				let legacyItem = valuesAr[pos];

				//console.log(73, item, item.key, item.value, valuesAr[pos]);
				if(isDate(legacyItem) || isNumber(legacyItem) || isNumber(legacyItem)){
					
					item.value = legacyItem;
					value[pos].value = legacyItem

				}
			}

		} catch(err){

		}

		//console.log(85, value);
	

		return value;

        // Function to check if a string looks like a URL
        function isURL(str) {
            // Regular expression pattern for detecting URLs
            var urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,6})(\/[^\s]*)?$/;

            // Use the test() method to check if the string matches the URL pattern
            return urlPattern.test(str);
        }


        function isDate(str) {
            // Regular expression patterns for detecting date and time formats
            const datePatterns = [
                /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/, // ISO 8601
                /^\d{4}\/\d{2}\/\d{2}( \d{2}:\d{2}(:\d{2})?)?$/, // YYYY/MM/DD and optional HH:MM[:SS]
                /^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2}(:\d{2})?)?$/, // MM/DD/YYYY and optional HH:MM[:SS]
                /^\d{2}\.\d{2}\.\d{4}( \d{2}:\d{2}(:\d{2})?)?$/, // DD.MM.YYYY and optional HH:MM[:SS]
                /^\d{2}-\d{2}-\d{4}( \d{2}:\d{2}(:\d{2})?)?$/, // DD-MM-YYYY and optional HH:MM[:SS]
                // Add more patterns as needed to cover additional date and time formats
            ];

            // Check if the string matches any of the date patterns
            for (const pattern of datePatterns) {
                if (pattern.test(str)) {
                    return true;
                }
            }

            return false;
        }


        // Function to check if a string looks like a number
        function isNumber(str) {
            // Regular expression pattern for detecting numbers
            var numberPattern = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/;

            // Use the test() method to check if the string matches the number pattern
            return numberPattern.test(str);
        }

	}






}