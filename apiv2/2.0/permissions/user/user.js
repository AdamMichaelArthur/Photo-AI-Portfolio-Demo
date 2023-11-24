import Account from "@permissions/account/account.js"
import Base from "@base"

export default class UserPermissions extends Account {

	constructor(navigationMenuItems =[], user =null){

		super(navigationMenuItems, user)

		if(user !== null){
		if(user.account_type !== "user"){
			return;
		}}
		
		if(navigationMenuItems !== null){
		
		navigationMenuItems.push(
			// {
			// 	title: "My Profile",
			// 	route: "/example",
			// 	permissions: "sysadmin",
			// 	path: "queue",
   // 			 	icon: "description",
   // 			 	collapse: "autobot"
			// },
			// {
			// 	title: "Account",
			// 	route: "/example",
			// 	permissions: "sysadmin",
			// 	path: "queue",
   // 			 	icon: "description",
   // 			 	collapse: "autobot"
			// }
		)}

	}

}