var mongoose = require( 'mongoose');
const Schema = mongoose.Schema;

var productsSchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true}
}, { strict: true });

mongoose.model("Products", productsSchema);
