import Enterprise from "@enterprise"
//import Base from "@base"

export default class Sysadmin extends Enterprise {

	frequencyCosts = {
		"month": 0
	}

	userSelectable = false;

	constructor(navigationMenuItems =[]){

		navigationMenuItems.push(
			{
				title: "Users",
				route: "/sysadmin/users",
				permissions: "sysadmin",
				path: "",
				icon: "people",
				collapse: "autobot", 
   			 	priority: 11,
				limit: 9999999
			},
			{
				title: "Accounts",
				route: "/sysadmin/accounts",
				permissions: "sysadmin",
				path: "",
				icon: "account_box",
				collapse: "autobot", 
   			 	priority: 11,
				limit: 9999999
			},
			{
				title: "Subscriptions",
				route: "/sysadmin/subscriptions",
				permissions: "sysadmin",
				path: "",
				icon: "subscriptions",
				collapse: "autobot", 
   			 	priority: 11,
				limit: 9999999
			},
			{
				title: "API Keys",
				route: "/sysadmin/apikeys",
				permissions: "sysadmin",
				path: "",
				icon: "vpn_key",
				collapse: "autobot", 
   			 	priority: 11,
				limit: 9999999
			},  
			{
				title: "Plan Management",
				route: "/sysadmin/planmanagement",
				permissions: "sysadmin",
				path: "",
				icon: "list_alt",
				collapse: "autobot", 
   			 	priority: 11,
				limit: 9999999
			},
			{
				title: "Prompts",
				route: "/sysadmin/prompts",
				permissions: "sysadmin",
				path: "",
				icon: "list_alt",
				collapse: "autobot", 
   			 	priority: 11,
				limit: 9999999
			},
			{
				title: "Quality Check",
				route: "/sysadmin/quality",
				permissions: "sysadmin",
				path: "",
				icon: "list_alt",
				collapse: "autobot", 
   			 	priority: 11,
				limit: 9999999
			}
			//,
			// {
			// 	title: "Reports",
			// 	route: "/sysadmin/reports",
			// 	permissions: "sysadmin",
			// 	path: "",
			// 	icon: "bar_chart",
			// 	collapse: "autobot", 
   // 			 	priority: 11,
			// 	limit: 9999999
			// },
			// {
			// 	title: "Transactions",
			// 	route: "/sysadmin/transactions",
			// 	permissions: "sysadmin",
			// 	path: "",
			// 	icon: "attach_money",
			// 	collapse: "autobot", 
   // 			 	priority: 11,
			// 	limit: 9999999
			// }
		);
		
		// We don't necessarily want the plans under the sysadmin to have their navigation shown
		// So we won't do the super call here...
		//super(navigationMenuItems);		
		super(null);
		this.navigationMenuItems = navigationMenuItems;
		//this.isPublic = false;
		
	}



}
