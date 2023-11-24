import Base from "@base"

export default class Permissions extends Base {

	navigationMenuItems = [];

	adminMenuItems = [];

	supportMenuItems = [];

	inheritParentMenus = true;

	constructor(navigationMenuItems =[], user =null){

		super(navigationMenuItems, user)

		this.navigationMenuItems = navigationMenuItems;

		return;
		
		if(navigationMenuItems !== null){

		navigationMenuItems.push(
			{
				title: "Permissions Navigation Item Example X",
				route: "/example",
				permissions: "sysadmin",
				path: "queue",
  		 		icon: "description",
  		 		collapse: "autobot", 
   			 	priority: 30
			}
		)

			this.navigationMenuItems = navigationMenuItems;
		}  else {
			console.log(32, navigationMenuItems);

		}


	}

	// Returns the types of accounts that are options
	getAccountType(){

	}

}

