import Integrations from '../integrations.js';

export default class ScraperApi extends Integrations {

	endpoint = '';

	constructor(){
		super();
		this.config = {
		  method: "get",
		  url: this.endpoont		
		}
		this.api_key = process.env.scraper_api_key;
	}

	async request(config =null){
		if(config == null){
			config = this.config;
		}

		let response;
		try {
			response = await axios.request(config);
		} catch(err){
			return JSON.stringify(err);
		}

		var searchResults = response.data;
	}

	async getGoogleSerpResults(searchTerm){
		this.endpoint = `https://api.scraperapi.com/structured/google/search?&query=${encodeURIComponent(searchTerm)}&api_key=${this.api_key}`
		console.log(32, this.config)
		//return await this.request()
	}
}