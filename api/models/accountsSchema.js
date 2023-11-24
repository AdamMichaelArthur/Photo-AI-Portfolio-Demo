var mongoose = require( 'mongoose');
const Schema = mongoose.Schema;

var accountsSchema = new mongoose.Schema({
	date: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now },
	created_by: [{ type: Schema.Types.ObjectId, ref: 'User', default: null }],
	modified_by: [{ type: Schema.Types.ObjectId, ref: 'User', default: null }],
	owner: [{ type: Schema.Types.ObjectId, ref: 'Account', required: true, unique: true }],
	bStatus: {type: Boolean, default: true},		// True means active, false means inactive
	user_limit: {type: Number, default: 5}
}, { strict: true });

mongoose.model("Account", accountsSchema);

var logSchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	msg: String
}, { strict: false });

mongoose.model("Logs", logSchema);

var privateSchools = new mongoose.Schema({
	jsonData: String
}, { strict: false });

mongoose.model("privateschools", privateSchools);

var coffeeexplainedkeywordserps = new mongoose.Schema({
	jsonData: String
}, { strict: false });

mongoose.model("coffeeexplainedkeywordserps", coffeeexplainedkeywordserps);

var coffeeexplainedgoogleserps = new mongoose.Schema({
	jsonData: String
}, { strict: false });

mongoose.model("coffeeexplainedgoogleserps", coffeeexplainedgoogleserps);

var watchmebarkkeywordserps = new mongoose.Schema({
	jsonData: String
}, { strict: false });

mongoose.model("watchmebarkkeywordserps", watchmebarkkeywordserps);
