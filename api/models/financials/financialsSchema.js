var mongoose = require( 'mongoose');
const Schema = mongoose.Schema;

var financialsSchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true}
}, { strict: false });

var stripeSchema = mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true, unique: true },
	email: String,
	test_key: String,
	prod_key: String
}, { strict: false });

mongoose.model("Stripe", stripeSchema);
mongoose.model("Financials", financialsSchema);
