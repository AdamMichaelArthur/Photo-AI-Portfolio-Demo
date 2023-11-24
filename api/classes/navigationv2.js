/*
	Created 12/20-2019 by Adam Arthur
*/

var express = require('express');
var router = express.Router();
var request = require('request-promise');
var moment = require('moment');
var mongoose = require('mongoose');
var Mongo = require('@classes/mongo.js');
var Voca = require("voca");
var voca = require("voca");
var v = require("voca");
const uuidv4 = require('uuid/v4')
var Box = require('@classes/integrations/box/box.js');
var fs = require('fs');
const util = require('util');
var Communication = require("@classes/communication.js")
var helpers = require("@classes/helpers");
var fs = require('fs');

var menudefaults = JSON.parse(fs.readFileSync( process.cwd() +"/menudefaults.json"))

function routeDataSource(req, res, next){
	var navigationv2 = new Navigation(req, res, next)
	navigation2.routeRequest()
}

function routeDataSource(req, res, next) {
  var action = req.params["action"];
  action = voca.replace(action, " ", "");
  var navigation = new Navigation(req, res, next);
  var evalCode = "navigation." + v.lowerCase(action) + "()";

  console.log(27, evalCode);
  try {
    eval(evalCode);
  } catch (err) {
    var desc = {
      raw: {
        message: "This method is not defined",
      },
    };
    navigation.error(desc);
  }
}

class Navigation{

  constructor(req, res, next) {
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    this.roles = new Mongo("Role", res.locals.user, res);
    this.accountnavs = new Mongo(mongoose.model("AccountNav"), res.locals.user, res);
    this.dashboardnavs = new Mongo(mongoose.model("DashboardNav"), res.locals.user, res);
    this.sidebarnavs = new Mongo(mongoose.model("SidebarNav"), res.locals.user, res);
    this.className = "Navigationv2"
  }

  /*
		Content Bounty uses "role" based authentication.  In theory, you can define any role you want,
		at the global level and for individual accounts.

		We currently use several main role types:

		admin - a site administrator.  
		administrator - an administrator for an account
		user - a sub-user of an account

		When an account is created, it's menus are copied from defaults.  This allows for individual 
		menus to be controlled on a per-user basis, but complicates things when you want to add a new
		menu on a global basis.

		There are two main menu items we define: the sidebar and the user menu


  */

  	/*  This creates a new sidebar menu item, updates the defaults for new users and updates existing users 
		This affects all users / account types, except the admin
	*/


	output(Obj) {
	    var defaultResponse = helpers.defaultResponseObject(this.className);
	    defaultResponse[this.className] = Obj;
	    this.res.status(200);
	    this.res.json(defaultResponse);
	}

	async error(err){
		this.res.json(err)
	}

  	async addsidebar(){

  		/* This function is intended to affect all accounts, current and new.  So we need to update the defaults
  		as well.  Currently this is hardcoded but needs to be transitioned to the database */

  		var query = { "role" : "administrator" }
  		if(this.req.body.role == "all"){
  			query = { }
  		}

  		var update = { $push: {"navigation" : { 
  			"path":this.req.body.route,
  			"title":this.req.body.title,
  			"icon":this.req.body.icon,
  			"collapse":"autobot"
  		} } }

  		var res = await this.sidebarnavs.model.update(query, update, {multi:true})

  		console.log(113, res);

  		this.output({ "result": res })
  	}

  	async removesidebar(role ="all", title ="untitled menu", route ="#"){
  		/* This function is intended to affect all accounts, current and new.  So we need to update the defaults
  		as well.  Currently this is hardcoded but needs to be transitioned to the database */

  		var query = { "role" : "administrator" }
  		if(this.req.body.role == "all"){
  			query = { }
  		}

  		var update = { $pull: {
  			"navigation" : { 
  			"title": { $eq: this.req.body.title }
  		} } }

  		console.log(128, update)
  		var res = await this.sidebarnavs.model.update(query, update, {multi:true})

  		console.log(113, res);

  		this.output({ "result": res })
  	}

  	/* This function isn't especially concerned with speed or effeciency -- it's intended to be used infrequently,
  	when new features are released, and should be used by a qualified site admin only who knows what she or he is doing */

  	async getAccountsByType(account_type){
  		var users = mongoose.model("User");
  		
  		try {
  			var accountsByType = await users.find({"account_type" : account_type}, {_id:1, accountId:1}).lean()
  		} catch(err){
  			console.log(150, err);
  		}

  		return accountsByType		
  	}

  	async updateaccounts(account_type){
  		/* Get a list of all accounts that are of the "account_type" type */
  		var users = mongoose.model("User");
  		
  		var query = await this.getAccountsByType(account_type)

  		var newMenuItem = { "navigation" : { 
		  			"path":this.req.body.route,
		  			"title":this.req.body.title,
		  			"icon":this.req.body.icon,
		  			"collapse":"autobot"
		  		} 
		}

  	    const bulkData = query.map(item => (
        {
            updateOne: {
                filter: {
                    owner: mongoose.Types.ObjectId(item["accountId"])
                },
                update: { $push: newMenuItem }
            }
        }
    	));

    	var accountsupdate = await this.sidebarnavs.model.bulkWrite(bulkData);

    	this.updateDefaults(newMenuItem, account_type);

    	return accountsupdate;
  	}

  	async removeaccounts(account_type, title){
  		var accounts = await this.getAccountsByType(account_type);

  		var update = { $pull: {
  			"navigation" : { 
  			"title": { $eq: title }
  		} } }

  	    const bulkData = accounts.map(item => (
        {
            updateOne: {
                filter: {
                    owner: mongoose.Types.ObjectId(item["accountId"])
                },
                update: update
            }
        }
    	));

  	    var accountsupdate = await this.sidebarnavs.model.bulkWrite(bulkData);

        this.updateDefaults({ title: title }, "authority", "remove")
  	    return accountsupdate
  	}

  	async updateauthorityaccounts(){
   		var sidebarupdate = await this.updateaccounts("authority")
  		this.output({ "result": sidebarupdate })
  	}

  	async updatecreatoraccounts(){
   		var sidebarupdate = await this.updateaccounts("creator")
  		this.output({ "result": sidebarupdate })
  	}

  	async updateadminaccounts(){
   		var sidebarupdate = await this.updateaccounts("admin")
  		this.output({ "result": sidebarupdate })
  	}

  	async updateDefaults(newMenuItem, accountType ="all", action ="add"){

      if(accountType == "authority"){
        if(action == "add"){
          menudefaults.authority_site_sidebar.push(newMenuItem.navigation);

      var admin = await mongoose.connection.db
       .collection("users")
       .updateOne({"email":"admin@contentbounty.com"}, {$push: {"menu_defaults.authority_site_sidebar":newMenuItem.navigation }});

        }
        if(action == "remove"){
          while(true){
          top:
          for(var i = 0; i < menudefaults.authority_site_sidebar.length; i++){
            if(menudefaults.authority_site_sidebar[i].title == newMenuItem.title){
              menudefaults.authority_site_sidebar.splice(i, 1);
              continue top;
            }
          
          }
          break;
        }
        }
      }

      if(accountType == "creator"){
        if(action == "add"){
          menudefaults.creator_site_sidebar.push(newMenuItem.navigation);
          var admin = await mongoose.connection.db
            .collection("users")
            .updateOne({"email":"admin@contentbounty.com"}, {$push: {"menu_defaults.creator_site_sidebar":newMenuItem.navigation }});
        }
        if(action == "remove"){
          while(true){
          top:
          for(var i = 0; i < menudefaults.authority_site_sidebar.length; i++){
            if(menudefaults.creator_site_sidebar[i].title == newMenuItem.title){
              menudefaults.creator_site_sidebar.splice(i, 1);
              continue top;
            }
          
          }
          break;
        }
        }
      }

      fs.writeFileSync(process.cwd() +"/api/menudefaults.json", JSON.stringify(menudefaults));
  	}

  	async remove(){
  		var bulkwriteresult = await this.removeaccounts(this.req.body.account_type, this.req.body.title)
  		this.output({ "result": bulkwriteresult })
  	}

}

var methods = Object.getOwnPropertyNames(Navigation.prototype);
var excludes = ["constructor", "output", "error"];

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

var routestr = `/action/:action`;
router.all(routestr, routeDataSource);

routestr = `/*/navigationv2/action/remove`;
router.all(routestr, routeDataSource); 	

module.exports = router;
