import { Base, ResponseError } from '@base'
import Administration from '../administration.js'
import Sysadmin from "@plans/sysadmin/sysadmin.js"

/**
 * Plans class that extends Sysadmin.
 * @extends Sysadmin
 *
 *
 * This class defines endpoints that will allow a system administrator to edit plans
 * Ideally, this class is one that will not require customization.  If you need to create
 * a new plan, please see the documentation before 
 *
 * The intention is to allow syadmins to change plan details without having to edit the code
 * for after a deployment goes live.
 *
 * During development, it is expected that default plan details will be hard-coded into the various
 * plans.
 *
 */
export default class Plans extends Sysadmin {

	// Plans are dynamically loaded into this array from the Mongo Database
	plans = [];

	/**
	 * Constructs an instance of the Plans class.
	 * Initializes plans and assigns an instance of Administration.
	 * @constructor
	 */
	constructor(){
	    super();
	    Object.assign(this, new Administration());
		    var x = 0;
		    var plans = [ ... new Set(global.Plans) ];

		    for(var plan of plans){
		    	if(plan.className == "Plans") {
		    		continue;
		    	}
		    	let obj;
		    	eval(`obj = new global.${plan.classRef}`);
		    	if(typeof obj["_id"] === "undefined"){
		    		obj["_id"] = this.createUUID();
		    		delete obj["response"];
		    		delete obj["timeout"];
		    		delete obj["errors"];
		    		delete obj["base64"];
		    	}
		    	for(let menu of obj.navigationMenuItems){
		    		if(typeof menu["_id"] === 'undefined'){
		    			menu["_id"] = this.createUUID();
		    		}
		    	}

		    	this.plans.push(obj);
		    }
		    this.accessLevel = "system"
	}

	/**
	 * Changes a property value of a plan.
	 * @async
	 * @param {string} planId - The ID of the plan.
	 * @param {string} property - The name of the property to change.
	 * @param {any} value - The new value for the property.
	 * @returns {Promise<string>} A Promise that resolves to a success message if the property was changed successfully,
	 * or an error message if the property or the plan was not found.
	 */
	async changePlanProperty(planId ="", property ="", value =""){
	  	let bPropertyChanged = true;
	  	for(let plan of this.plans){
	  		if(plan["_id"] == planId){
	  			if(typeof plan[property] === 'undefined'){
	  				return this.error.errors(`Property ${property} was not found in this plan`);
	  			}
	  			plan[property] = value;
	  			bPropertyChanged = true;
	  		}
	  	}
	  	if(bPropertyChanged == false){
	  		return this.errors.error(`Unable to find a plan with planId ${planId}`)
	  	}
	  	return this.response.reply("Propery Changed");
	}

	/**
	 * Retrieves a plan based on its ID.
	 * @async
	 * @param {string} planId - The ID of the plan to retrieve.
	 * @returns {Promise<object>} A Promise that resolves to an object containing the retrieved plan,
	 * or an error if the plan was not found.
	 */
	async getPlan(planId =""){
	  	for(let plan of this.plans){
	  		if(plan["_id"] == planId){
	  			return this.response.reply({ "plan" : plan } );
	  		}
	  	}
	  	this.errors.error("not_found", `A plan with _id ${planId} was not found`)
	}

	/**
	 * Edits a menu item within a plan's navigation menu.
	 * @async
	 * @param {string} menuId - The ID of the menu item to edit.
	 * @param {string} planId - The ID of the plan containing the menu item.
	 * @param {string} title - The new title for the menu item.
	 * @param {string} route - The new route for the menu item.
	 * @param {string} permissions - The new permissions for the menu item.
	 * @param {string} path - The new path for the menu item.
	 * @param {string} icon - The new icon for the menu item.
	 * @param {string} collapse - The new collapse value for the menu item.
	 * @returns {Promise<object>} A Promise that resolves to an object containing the updated menu item,
	 * or an error if the menu item or plan was not found, or if the request was invalid.
	 */
	editPlanMenu(menuId ="", title ="", route ="", permissions ="", path ="", icon ="", collapse =""){
	  	if(menuId == ""){
	  		return this.errors.error("invalid_request", "menuId cannot be an empty string");
	  	}
	  	var bMenuUpdated = false;
	  	let updatedMenu;
	  	for(let plan of this.plans){
	  		for(let menu of plan.navigationMenuItems){
	  			if(menu["_id"] == menuId){
	  					if (menuId !== "" ) { menu["menuId"] = menuId; }
	  					if (title !== "") { menu["title"] = title; }
	  					if (route !== "" ) { menu["route"] = route; }
	  					if (permissions !== "" ) { menu["permissions"] = permissions }
	  					if (path !== "" ) { menu["path"] = path; }
	  					if (icon !== "" ) { menu["icon"] = icon; }
	  					if (collapse !== "" ) { menu["collapse"] = collapse; }
	  					updatedMenu = menu;
	  					bMenuUpdated = true;
	  			}
	  		}
	  	}
	  	if(!bMenuUpdated){
	  		return this.errors.error("Unable to update menu");
	  	}
	  	return this.response.reply( { "updatedMenu" : updatedMenu })
	}

	/**
	 * Edits a plan based on its ID.
	 * @async
	 * @param {string} planId - The ID of the plan to edit.
	 * @returns {Promise<object>} A Promise that resolves to an object containing the updated plan,
	 * or an error if the plan was not found.
	 */
	editPlan(_id =""){
		const planId = _id;
	  	var updatedPlan = {};
	  	for(let plan of this.plans){
	  		if(plan["_id"] === planId){
	  			//console.log(149, planId)
	  			for (let key of Object.keys(this.body)) {
	  				//console.log(151, key);
	  				if(key === "prices"){
	  					console.log(154, key, plan[key]);
	  				}
	  				if(plan[key] !== 'undefined'){
	  					plan[key] = this.body[key];
	  				}
				}
				updatedPlan = plan;
	  		}
	  	}
	  	return this.response.reply( { "updatedPlan" : updatedPlan })
	}

	/**
	 * Retrieves all possible navigation menu items across all plans, removing duplicates based on route.
	 * @async
	 * @returns {Promise<object>} A Promise that resolves to an object containing an array of unique navigation menu items,
	 * or an error if an error occurs during the retrieval.
	 */
	getAllPossibleNavigationMenuItems(){
	  	var navItems = [];
	  	for(let plan of this.plans){
	  		navItems = plan.navigationMenuItems.concat(navItems)
	  	}
	  	const uniqueNavigationItems = navItems.filter((item, index, self) => {
	  		return index === self.findIndex((i) => i.route === item.route);
		});

	  	return this.response.reply( { "allNavigationItems" : uniqueNavigationItems } );
	}

	/**
	 * Retrieves all plans.
	 * @async
	 * @returns {Promise<object>} A Promise that resolves to an object containing an array of all plans,
	 * or an error if an error occurs during the retrieval.
	 */
	getPlans(){
	  	return this.response.reply({ "plans" : this.plans });
	}

	planDefaultDefinition = {
        "accessLevel": "user",
        "isPublic": false,
        "navigationMenuItems": [
            {
                "title": "",
                "route": "",
                "permissions": "",
                "path": "",
                "icon": "",
                "collapse": ""
            }
        ],
        "adminMenuItems": [],
        "supportMenuItems": [],
        "isEnabled": true,
        "users": 0,
        "frequency": "monthly",
        "allowedFrequencies": [
            "monthly",
            "annual",
            "weekly",
            "daily",
            "quarterly"
        ],
        "frequencyCosts": {
            "daily": 0,
            "weekly": 0,
            "monthly": 0,
            "quarterly": 0,
            "annually": 0
        },
        "annualDiscount": 0,
        "freeTrialDays": 7,
        "paymentReminders": true,
        "gracePeriod": 3,
        "subscriptionValidity": "",
        "dbOverrides": true,
        "displayName": ""
    }

	createPlan(){
		this.disable_parameter_checking = true;
		var plan = { }
		var checkResult = this.verifyObjectMatch(this.body, this.planDefaultDefinition);
		if(checkResult !== true){
			return this.errors.error("invalid", checkResult);
		}
		this.body["_id"] = this.createUUID();
		this.plans.push(this.body);
		return this.response.reply( { "plan": this.body } );
	}

	deletePlan(planId =""){
		var removedPlan = {}
		for(var plan in this.plans){
			if(this.plans[plan]._id == planId){
				removedPlan = this.plans.splice(plan, 1);
				return this.response.reply( { "removed": removedPlan[0] } )
			}
		}
		return this.errors.error("invalid", `Unable to find a plan that matches ${planId}`);
	}

	// After we modify a plan, we need to syncronize our changes with Stripe
	onDestroy(){
		super.onDestroy();
		this.integrations.stripe.syncPlans(this["_id"], this);
	}

	async test(hello =""){

	}
}