

module.exports = class Top40Weekly {
	
	constructor() {
	
	}

	detectIfObject(){
		
	}

	parseTop40WeeklyBounty(excelToJsonData){
		this.sheetData = excelToJsonData
		
		var topAlbums = this.getTopVideos();
		var discography = this.getDiscography();
		var questions = this.getMostSearchedForQuestions();
		var searched = this.getMostSearchedForSongs();

		console.log(17, topAlbums)
		console.log(18, discography)
		console.log(19, questions)
		console.log(20, searched);

		return "working";
	}

	getMostSearchedForSongs() {
		var songs = [];
		for(var i = 0; i < this.sheetData.length; i++){
			var obj = this.sheetData[i]
			var objKeys = Object.keys(obj);
			if(objKeys[0] == "Song Title"){
				if(objKeys[1] == "Spotify"){
					songs.push(obj);
				}
			}
		}
		return songs;
	}

	getMostSearchedForQuestions(){
		var questions = [];
		for(var i = 0; i < this.sheetData.length; i++){
			var obj = this.sheetData[i]
			var objKeys = Object.keys(obj);
			if(objKeys[0] == "Question"){
				if(objKeys[1] == "People Also Ask"){
					questions.push(obj);
				}
			}
		}
		return questions;
	}

	getDiscography(){
		var discography = [];
		for(var i = 0; i < this.sheetData.length; i++){
			var obj = this.sheetData[i]
			var objKeys = Object.keys(obj);
			if(objKeys[0] == "Album Name"){
				if(objKeys[1] == "Release Date"){
					discography.push(obj);
				}
			}
		}
	return discography;		
	}

	getDiscography(){
		var discography = [];
		for(var i = 0; i < this.sheetData.length; i++){
			var obj = this.sheetData[i]
			var objKeys = Object.keys(obj);
			if(objKeys[0] == "Album Name"){
				if(objKeys[1] == "Release Date"){
					discography.push(obj);
				}
			}
		}
	return discography;		
	}

	getTopVideos(){
		var topVideos = [];
		for(var i = 0; i < this.sheetData.length; i++){
			var obj = this.sheetData[i]
			var objKeys = Object.keys(obj);
			if(objKeys[0] == "Songs"){
				if(objKeys[1] == "Views"){
					if(objKeys[2] == "Description"){
						if(objKeys[3] == "Link"){
							// We definitely have a "Top Videos" section
							topVideos.push(obj)
						}
					}
				}
			}
		}
	return topVideos;
	}


	
}

