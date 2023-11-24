import Permissions from "@permissions/permissions.js"
import Base from "@base"

export default class Affiliate extends Permissions {

	constructor(navigationMenuItems =[], user =null){

		if(user !== null){
		if(user.account_type !== "affiliate"){
			super(navigationMenuItems, user);
			return;
		}}

		super(null)

		var navigationMenuItems = [
			{
				title: "Affiliate Links",
				route: "/affiliate/cookies",
				permissions: "sysadmin",
				path: "queue",
   			 	icon: "cookie",
   			 	collapse: "autobot", 
   			 	priority: 11
			},
			{
				title: "My Domains",
				route: "/affiliate/domains",
				permissions: "sysadmin",
				path: "queue",
   			 	icon: "domains",
   			 	collapse: "autobot", 
   			 	priority: 12
			},
			{
				title: "Account Signups",
				route: "/affiliate/signups",
				permissions: "sysadmin",
				path: "queue",
   			 	icon: "person_add",
   			 	collapse: "autobot", 
   			 	priority: 12
			},
			{
				title: "Get Paid",
				route: "/affiliate/getpaid",
				permissions: "sysadmin",
				path: "queue",
   			 	icon: "payment",
   			 	collapse: "autobot", 
   			 	priority: 13
			}
		]

		this.navigationMenuItems = navigationMenuItems
		return;
		// When you set this.inheritParentMenus, the navigationMenuItems you define here are the *only* ones
		// the user will see....

		//this.inheritParentMenus = false;

		var navigationMenuItems = [];
		var navigationMenuItems = [
			{
				title: "Dropped Cookies",
				route: "/example",
				permissions: "sysadmin",
				path: "queue",
   			 	icon: "description",
   			 	collapse: "autobot", 
   			 	priority: 11
			},
			{
				title: "Acount Signups",
				route: "/example",
				permissions: "sysadmin",
				path: "queue",
   			 	icon: "description",
   			 	collapse: "autobot", 
   			 	priority: 12
			},
			{
				title: "Subscription Payments",
				route: "/example",
				permissions: "sysadmin",
				path: "queue",
   			 	icon: "description",
   			 	collapse: "autobot", 
   			 	priority: 13
			},
			{
				title: "Accounts in Trial",
				route: "/example",
				permissions: "sysadmin",
				path: "queue",
   			 	icon: "description",
   			 	collapse: "autobot", 
   			 	priority: 14
			}
		]

		this.navigationMenuItems = navigationMenuItems

	}

}