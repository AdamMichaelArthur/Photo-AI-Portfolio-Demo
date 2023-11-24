import { Base, ResponseError } from '@base'
import User from '../user.js'



export default class Profile extends User {

	//# Profile
	fullName = "";
	about = "";
	company = "";
	job = "";
	country = "";
	address = "";
	phone = "";
	email = "";

	//# Notifications
	accountChanges = true;
	newProducts = true;
	marketingAndPromos = true;
	securityAlerts = true;

  constructor(){
    super();
  }

  async test(str ='', num =0, bVar =false, opt =0){
    this.response.reply("works");
    return true;
  }

  async saveSettings(	
	  	accountChanges =true,
		newProducts =true,
		marketingAndPromos =true,
		securityAlerts =true
  	){
  	//console.log(39, accountChanges, this.body);
  	this.accountChanges = accountChanges;
  	this.newProducts = newProducts;
  	this.marketingAndPromos = marketingAndPromos;
  	this.securityAlerts = securityAlerts;
  }

  async getSettings(){
  	this.response.reply({ "settings": {
  		accountChanges: this.accountChanges,
		newProducts: this.newProducts,
		marketingAndPromos: this.marketingAndPromos,
		securityAlerts: this.securityAlerts
  	}})
  }

  async save(
  	fullName = "",
	about = "",
	company = "",
	job = "",
	country = "",
	address = "",
	phone = "",
	email = ""){

  	this.fullName = fullName;
  	this.about = about;
  	this.company = company;
  	this.job = job;
  	this.country = country;
  	this.address = address;
  	this.phone = phone;
  	this.email = email;
  }

  async getProfile(){

  	this.response.reply( { "profile": {
	  	"fullName": this.fullName,
	  	"about": this.about,
	  	"company":  this.company,
	  	"job": this.job,
	  	"country": this.country,
	  	"address": this.address,
	  	"phone": this.phone,
	  	"email":  this.email
	  }
  	} );

  }

}