import Mongo from '../mongo.js'
import DocumentStandard from "../document-standards.js";

export default class Authenticated extends Mongo {

	collection = null;

	constructor(){
		super();
	}

	insertOne(obj){
		//var standardDocument = new DocumentStandard(this.user);
		console.log(14, obj);
		super.insertOne(obj);
		//console.log(12, obj, standardDocument.getStandardDocument());
	}
}