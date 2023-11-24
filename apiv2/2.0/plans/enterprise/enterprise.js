import Pro from "@plans/pro/pro.js"
import Base from "@base"

export default class Enterprise extends Pro {

	frequencyCosts = {
		"month": 99.00
	}

	constructor(navigationMenuItems =[], user =null){
		
		if(navigationMenuItems !== null){
			// navigationMenuItems.push({
			// 		title: "Enterprise Plan Exclusive",
			// 		route: "/userstest",
			// 		permissions: "pro",
			// 		path: "",
			// 		icon: "dashboard",
			// 		collapse: "autobot",
	  //  			 	priority: 50
			// 	})
		}

		super(navigationMenuItems, user);

		this.icon = 'bi-building';

		this.features = [
			'Everything in Free & Pro',
			'Priority Access',
			'Video Chat Support',
			'Access To Founders Table'
		]
	}


	async renewPlan(){
		if(this.userAccount.plan !== 'enterprise'){
			return super.renewPlan();
		}
		
		console.log(10, this.userAccount.plan, "Enterprise - plan renew");
		//super.planRenew();
	}
}


