/*
	Document Standards enforces mandatory fields for every document that is inserted into the database
	Modify this if you want to customize fields that get automatically inserted into every document
*/

import dayjs from 'dayjs';

// const now = new dayjs();
// console.log(9, now.format('YYYY-MM-DD'));

export default class DocumentStandards {

	target = {}

	constructor(user =null, target =null) {
		if(user !== null){
			this.user = user;
			this.userInfo["created_by"] = user._id;
			this.userInfo["modified_by"] = user._id;
			this.userInfo["created_at"] = new Date().toISOString(),
			this.userInfo["owner"] = user.accountId;
		}
		if(target !== null){
			Object.assign(this.target, target);
		}
	}

	getStandardDocument(){
		return {
			... this.userInfo,
			... this.securityConcerns,
			... this.timeStamps,
			... this.statusInfo,
			... this.target
		}
	}

	// standardDocument = {

	// }

	// We use four different security standards
	// private, account, admin, system, public
	/*
		Private
		-------

		Data marked private is our highest level of privacy offered, and can only be viewed at the user 
		account level.  Other accounts under the same organization, admins, and sysadmins cannot view
		this data.  

		Account
		-------

		Account data is accessible by users from any account in the same organization.

		Admin
		-----

		Admin records are only visible to registered admins for the organization.  

		SysAdmins
		---------

		This data is only visible to system admins

		Public
		------

		This data is accessible to the public.

		The default security flag is 'account'

		Sensitive
		---------

		Sensitive data is a special flag that will cause a record to be generated any time data is 
		accessed, updated or deleted.
	*/

	securityConcerns = {
		"accessLevel": "account",
		"sensitive":false
	}

	timeStamps = {
		"createdAt" : dayjs().toISOString(),
		"modifiedAt" : dayjs().toISOString()
	}

	userInfo = {
		"created_by" : null,
		"modified_by" : null,
		"owner" : null,
	}

	statusInfo = {
		"status":true,
		"deletedAt": false,
		"sensitive":false,
		"selected":false,
		"selectedFilter":false
	}

	events = {
		"triggerAt": null,		// A date, in the future, at the time of insertion of this record
		"triggerOn": null,		// insert, update or delete events inside of mongo
		"triggerWatch": null,	// search criteria, such as { "_id": USER_ID }
		"triggerColl": null,	// The collection to watch, if we're triggering events based on database changes
		"eventName": null,
		"retries": 4,
		"success": false,
		"next_retry": false,
	}



}