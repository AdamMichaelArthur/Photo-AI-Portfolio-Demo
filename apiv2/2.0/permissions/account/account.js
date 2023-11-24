import Affiliate from "@permissions/affiliate/affiliate.js"

export default class Account extends Affiliate {

	constructor(navigationMenuItems =[], user =null){

		super(navigationMenuItems, user);

		if(user !== null){
			if(user.account_type !== "account"){
					return;
				}
		}



		if(navigationMenuItems !== null){


		// if(this.user.account_type !== "account"){
		// 	return;
		// }

		navigationMenuItems.push(
			{
				title: "Account Menu",
				route: "/example",
				permissions: "sysadmin",
				path: "queue",
  		 			 icon: "description",
  		 			 collapse: "autobot",
  		 			 "priority": 10
			}
		)

			
		}

		//
	}

	async getAccountUsers(){

	}

	async getAccountCollaborators(){
		
	}
}