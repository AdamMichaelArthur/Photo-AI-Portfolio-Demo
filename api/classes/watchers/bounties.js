
var fs = require('fs');
var Voca = require("voca");

module.exports.documentsToTextFile = function(results){

	if(results.length ==0)
		return "";

	var headers = Object.keys(results[0]);
	var txtFile = '';
	var data = []
	for(var i = 0; i < headers.length; i++){
		var header = headers[i];
		for(var y = 0; y < results.length; y++){
			var documentKeys = Object.keys(results[y])
			var arr = []
			for(var t = 0; t < documentKeys.length; t++){
				var documentKey = documentKeys[t]
				if(header == documentKey){
					arr.push({
						"key": header,
						"value": results[y][header]
					})
				}
			}
			data.push(arr)
		}
	}
		
	var mergedDocument = {}

		for(var i = 0; i < data.length; i++){
			for(var y = 0; y < data[i].length; y++){
				var obj = data[i][y];
				mergedDocument[obj['key']] = []
			}
		}

		for(var i = 0; i < data.length; i++){
			var arr = [];
			for(var y = 0; y < data[i].length; y++){

					var obj = data[i][y];
					arr.push(obj['value']);
					mergedDocument[obj['key']].push(obj['value'])
			}
		}

		for(var i = 0; i < headers.length; i++){
			mergedDocument[headers[i]] =[... new Set(mergedDocument[headers[i]])]
		}

		for(var i = 0; i < headers.length; i++){
			txtFile += Voca.capitalize(headers[i]) + '\n'
			for(var y = 0; y < headers[i].length; y++){
				txtFile += '='
			}
			txtFile += '\n\n'
			for(var y = 0; y < mergedDocument[headers[i]].length; y++){
				txtFile += mergedDocument[headers[i]][y]
				txtFile += '\n'
			}
			txtFile += '\n\n'
		}

		return txtFile;

	}

module.exports.getUploadInstructions = function(brandDocument, bountyDocument){
		var uploadInstructions = 
`BRAND
=====

${brandDocument.brand_name}


WEBSITE URL
===========

${brandDocument.website_url}

BOUTNY_KEYWORDS
===============
${bountyDocument.keywords}

BOUTNY_PROMPTS
==============
${bountyDocument.prompts}

BOUTNY_TITLES
===============
${bountyDocument.titles}


UPLOAD URL
==========

${brandDocument.new_post_url}


NEW POST USERNAME
=================

${brandDocument.new_post_login}


NEW POST PASSWORD
=================

${brandDocument.new_post_pw}


` ////////////////////////

console.log(105, brandDocument);

if(typeof brandDocument.facebook_cookie != 'undefined'){
	uploadInstructions += `

FACEBOOK COOKIE
=================

${brandDocument.facebook_cookie}

`
}

if(typeof brandDocument.instagram_cookie != 'undefined'){
	uploadInstructions += `

INSTAGRAM COOKIE
=================

${brandDocument.instagram_cookie}

`
}

if(typeof brandDocument.linkedin_cookie != 'undefined'){
	uploadInstructions += `

LINKED IN COOKIE
=================

${brandDocument.linkedin_cookie}

`
}

if(typeof brandDocument.youtube_cookie != 'undefined'){
	uploadInstructions += `

YOUTUBE COOKIE
=================

${brandDocument.youtube_cookie}

`
}

if(typeof brandDocument.twitter_cookie != 'undefined'){
	uploadInstructions += `

TWITTER COOKIE
=================

${brandDocument.twitter_cookie}

`
}

if(typeof brandDocument.google_photos_cookie != 'undefined'){
	uploadInstructions += `

GOOGLE PHOTOS COOKIE
=================

${brandDocument.google_photos_cookie}

`
}

	try {
		fs.writeFileSync('upload_instructions.txt', uploadInstructions);
	} catch (err){
		// the file probably already exists
	console.log(349, err);
	}
	return uploadInstructions;

}