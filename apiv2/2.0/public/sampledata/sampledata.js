import { Base, ResponseError } from '@base'
import { MongoClient, ObjectId } from 'mongodb';

export default class Sampledata extends Base {

	constructor(){
		super();
	}

	async ids(){
		console.log(11, this.body.count)
		let count = this.body.count;
		if(count === undefined){
			count = 50;
		} else {
			delete this.body.count;
		}

			try {
				const objectIds = [];
				for(var i = 0; i < count; i++){
					objectIds.push(new ObjectId().toHexString())
				}
				const objectId1 = new ObjectId();
				const objectId2 = new ObjectId();
				// You can generate more ObjectIds if needed

				return this.response.reply(objectIds);
			} catch (error) {
				// Handle any potential errors here
				throw new ResponseError('Failed to generate ObjectIds', 500);
			}
		}

}