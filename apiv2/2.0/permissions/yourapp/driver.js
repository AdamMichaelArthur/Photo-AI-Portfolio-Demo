import Permissions from "@permissions/permissions.js"
import Base from "@base"

/*
driverAvailableOrders, driverActiveOrders, driverCompletedOrders, driverEarnings,
*/

export default class Driver extends Permissions {

	constructor(navigationMenuItems =[], user =null){

		if(user !== null){
		if(user.account_type !== "driver"){
			super(navigationMenuItems, user);
			return;
		}}

		super(null)

		this.inheritParentMenus = false;

		var navigationMenuItems = [
		    {
		        "title": "Available Orders",
		        "route": "/affiliate/cookies",
		        "iosView": "driverAvailableOrders",
		        "menuLoc": "menuLoc0",
		        "menuPos": 0,
		        "permissions": "sysadmin",
		        "path": "queue",
		        "icon": "shopping_cart", // Web Icon
		        "iOSImage": "cart.fill", // iOS Icon
		        "androidImage": "shopping_cart", // Android Icon
		        "collapse": "autobot",
		        "priority": 11
		    },
		    {
		        "title": "Active Orders",
		        "route": "/affiliate/domains",
		        "iosView": "driverActiveOrders",
		        "menuLoc": "menuLoc1",
		        "menuPos": 1,
		        "permissions": "sysadmin",
		        "path": "queue",
		        "icon": "map", // Web Icon
		        "iOSImage": "map.fill", // iOS Icon
		        "androidImage": "map", // Android Icon
		        "collapse": "autobot",
		        "priority": 12
		    },
		    {
		        "title": "Completed Orders",
		        "route": "/affiliate/signups",
		        "iosView": "driverCompletedOrders",
		        "menuLoc": "menuLoc2",
		        "menuPos": 2,
		        "permissions": "sysadmin",
		        "path": "queue",
		        "icon": "history", // Web Icon
		        "iOSImage": "clock.fill", // iOS Icon
		        "androidImage": "history", // Android Icon
		        "collapse": "autobot",
		        "priority": 12
		    },
		    {
		        "title": "Earnings",
		        "route": "/affiliate/getpaid",
		        "iosView": "driverEarnings",
		        "menuLoc": "menuLoc3",
		        "menuPos": 3,
		        "permissions": "sysadmin",
		        "path": "queue",
		        "icon": "dollar_sign", // Web Icon
		        "iOSImage": "dollarsign.circle.fill", // iOS Icon
		        "androidImage": "monetization_on", // Android Icon
		        "collapse": "autobot",
		        "priority": 13
		    },
		    {
		        "title": "Account",
		        "route": "/affiliate/getpaid",
		        "iosView": "Account",
		        "menuLoc": "menuLoc4",
		        "menuPos": 4,
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