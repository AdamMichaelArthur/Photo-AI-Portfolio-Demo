var mongoose = require( 'mongoose');
const Schema = mongoose.Schema;

var newsTriggersSchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true}
}, { strict: false });

var newsSearchHistorySchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	company_id: Number,
	email: String,
	last_search_date: Date,
	last_lookback_date: Date,
	pagination_ref: String
}, { strict: false });


mongoose.model("NewsSearchHistory", newsSearchHistorySchema);
mongoose.model("NewsTriggers", newsTriggersSchema);