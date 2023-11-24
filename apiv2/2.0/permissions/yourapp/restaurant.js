import Permissions from "@permissions/permissions.js"
import Base from "@base"

// restaurantStatus, restaurantOpenOrders, restaurantManagement, restaurantMenuItems

export default class Restaurant extends Permissions {

	constructor(navigationMenuItems =[], user =null){

		if(user !== null){
		if(user.account_type !== "restaurant"){
			super(navigationMenuItems, user);
			return;
		}}

		super(null)

		this.inheritParentMenus = false;

		var navigationMenuItems = [
		    {
		        "title": "Status",
		        "iOSView": "restaurantStatus",
		        "route": "/affiliate/cookies",
		        "permissions": "sysadmin",
		        "path": "queue",
		        "icon": "shopping_cart", // Web Icon
		        "iOSImage": "cart.fill", // iOS Icon
		        "androidImage": "shopping_cart", // Android Icon
		        "collapse": "autobot",
		        "priority": 11
		    },
		    {
		        "title": "Orders",
		        "iOSView": "restaurantOpenOrders",
		        "route": "/affiliate/domains",
		        "permissions": "sysadmin",
		        "path": "queue",
		        "icon": "map", // Web Icon
		        "iOSImage": "map.fill", // iOS Icon
		        "androidImage": "map", // Android Icon
		        "collapse": "autobot",
		        "priority": 12
		    },
		    {
		        "title": "Restaurants",
		        "iOSVIew": "restaurantManagement",
		        "route": "/affiliate/signups",
		        "permissions": "sysadmin",
		        "path": "queue",
		        "icon": "history", // Web Icon
		        "iOSImage": "clock.fill", // iOS Icon
		        "androidImage": "history", // Android Icon
		        "collapse": "autobot",
		        "priority": 12
		    },
		    {
		        "title": "Menus",
		        "iOSView": "restaurantMenuItems",
		        "route": "/affiliate/getpaid",
		        "permissions": "sysadmin",
		        "path": "queue",
		        "icon": "dollar_sign", // Web Icon
		        "iOSImage": "dollarsign.circle.fill", // iOS Icon
		        "androidImage": "monetization_on", // Android Icon
		        "collapse": "autobot",
		        "priority": 13
		    }
		]


		this.navigationMenuItems = navigationMenuItems
		return;
	}
}