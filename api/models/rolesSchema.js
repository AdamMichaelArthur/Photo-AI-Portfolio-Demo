var mongoose = require( 'mongoose');
const Schema = mongoose.Schema;

var rolesSchema = new mongoose.Schema({
	//created: { type: Date, default: Date.now },
	//modified: { type: Date, default: Date.now, required: true },
	//created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	//modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	//owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true, unique: true},
	accountId: String,
	userId: String,
	role: String,
	allowed: [],
	navigation: [],
	user_options: [],
	panels: []
}, { strict: false });

mongoose.model("Roles", rolesSchema);