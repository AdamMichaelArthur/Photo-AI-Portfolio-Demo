/*    This is our Events class, all classes in this project extend this class
 *
 *    
 *
 */

import Authorization from '../Authorization/authorization.js'
import Voca from 'voca'
import base64 from 'base-64';
import fs from 'fs'
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

/*
	Events are triggered when one of 3 things happens.

	1) Time has passed a trigger point in time
		or
	2) A database record is updated
		or
	3) We received a notification from a webhook

	A child class can listen for events by calling the "listen" function, which
	notifies its parent which events it wants to get notified for

	The valid events are: insert, delete, update, webhook, datetime

	insert, delete and update are events that happen on the database, and we use Mongo Watchers to get notified of these
	webhook is when we receive an http request from a third party api
	and a datetime waits for a point in time to happen, and when it does, that event is triggered

	When an event is triggered, we need to load up the handler class, make sure it's initialized with
	all of the proper details, so it can be treated as if it was received through an authenticated http request



*/

export default class Events extends Authorization {

	static listen(collection =null,  ... args ){
		for(let arg of args){

		}
	}

}