import { Base, ResponseError } from '@base'
import Marketplace from '../marketplace.js'



export default class Bankaccount extends Marketplace {

  constructor(){
    super();
  }

  async test(str ='', num =0, bVar =false, opt =0){
    this.response.reply("works");
    return true;
  }

  async addPointsForLink(points =0, siteDR =0, siteTraffic =0, pageTraffic =0, newContent =false, humanWriten =false, url =""){

    console.log(19, this.userAccount.points)
  	// In the initial state, it's not defined in the database
  	if (typeof this.userAccount.points !== 'number' || isNaN(this.userAccount.points)) {
  		this.userAccount.points = 0;
	  }

  	// Give the user their points
  	this.userAccount.points = this.userAccount.points + points;

    console.log(27, this.userAccount.points)

  }

}