var mongoose = require( 'mongoose');
const Schema = mongoose.Schema;

var dashboardSchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	role: String,
	viewroute: String,
}, { strict: false });

dashboardSchema.index({role: 1, viewroute: 1, owner: 1}, {unique: true});
mongoose.model("DashboardNav", dashboardSchema);

var sidebarNavSchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	role: String,
	navigation: [{}]
}, { strict: false });

sidebarNavSchema.index({role: 1, owner: 1}, {unique: true});
mongoose.model("SidebarNav", sidebarNavSchema);

var accountNavSchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	role: String,	
	navigation: [{}]
})

accountNavSchema.index({role: 1, owner: 1}, {unique: true});
mongoose.model("AccountNav", accountNavSchema);
