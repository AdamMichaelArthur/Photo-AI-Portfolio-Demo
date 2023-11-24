import Base from '@base'

export default class DatabaseConnection extends Base {

	databaseProvider = process.env.DB;

	constructor(){
		super();
	}


	
}
