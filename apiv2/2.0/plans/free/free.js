import Plan from "@plans/plans.js"

export default class Free extends Plan {

	constructor(navigationMenuItems =[], user =null){

		if(navigationMenuItems !== null){
		navigationMenuItems.push(
			{
				title: "Marketplace",
				route: "/marketplace",
				permissions: "free",
				path: "queue",
   			 	icon: "shopping_cart",
   			 	collapse: "autobot"
			},
			{
				title: "Vote",
				route: "/vote",
				permissions: "free",
				path: "queue",
   			 	icon: "how_to_vote",
   			 	collapse: "autobot"
			},
			{
				title: "FAQ",
				route: "/faq",
				permissions: "free",
				path: "queue",
   			 	icon: "help_outline",
   			 	collapse: "autobot"
			},
			{
				title: "How To Use",
				route: "/howtouse",
				permissions: "sysadmin",
				path: "queue",
   			 	icon: "description",
   			 	collapse: "autobot"
			},
			{
				title: "Link Requirements",
				route: "/help/link-guidelines",
				permissions: "sysadmin",
				path: "queue",
   			 	icon: "description",
   			 	collapse: "autobot"
			}
			// {
			// 	title: "Forum",
			// 	route: "/forum",
			// 	permissions: "user",
			// 	path: "queue",
   // 			 	icon: "description",
   // 			 	collapse: "autobot"
			// }
		)}
		
		super(navigationMenuItems, user)

		this.features = [
			'Browse Available Offers',
			'Post in the Community Forum',
			'Ask Questions About Assets',
			'Chat With Support'
		]
		
	}

	async renewPlan(){
		console.log(10, "Free - plan renew");
	}
}
