import Free from "@plans/free/free.js"
//import Base from "@base"

export default class Pro extends Free {

	frequencyCosts = {
		"month": 99.00
	}
	
	constructor(navigationMenuItems =[], user =null){

		if(navigationMenuItems !== null){
			// navigationMenuItems.push({
			// 	title: "Pro Plan Exclusive",
			// 	route: "/userstest",
			// 	permissions: "pro",
			// 	path: "",
			// 	icon: "dashboard",
			// 	collapse: "autobot",
   // 			 	priority: 50
			// })
		}
		
		super(navigationMenuItems, user)

		this.icon = 'bi-shield-fill';

		this.features = [
			'Everything in Free',
			'Post Offers',
			'Post Requests',
			'Get Points For Links'
		]
	}
	
	async renewPlan(){
		if(this.userAccount.plan !== 'pro'){
			return super.renewPlan();
		}

		console.log(10, "Pro - plan renew");
	}

}


