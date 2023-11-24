var mongoose = require( 'mongoose');
const Schema = mongoose.Schema;

var emailSchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true}
}, { strict: false });

/*
var emailMLSchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	crm_contact_id: {type: String},
	full_display_name_to: {type: String },
	full_display_name_from: {type: String},
	to: { type: String, required: true},
	from: { type: String, required: true},
	reply-to: { type: String, required: true},
	subject: { type: String, required: true},
	body_html: { type: String, required: true},
	body_plain: { type: String, required: true},
	links: [{type: String}],
	attachments: [{ type: String, required: true}],		// Will be base64 encoded
	approval_status: { type: Boolean, default: false },
	composition_insights: {
		subject: {
			rejected_snippets: [],
			accepted_snippet: String,
			triggers: []				// This is the CRM fields that were evaluated which affected this message
		},		
		greeting: {
			rejected_snippets: [],
			accepted_snippet: String,
			triggers: []
		},
		opener: {
			rejected_snippets: [],
			accepted_snippet: String,
			triggers: []
		},
		define_role: {
			rejected_snippets: [],
			accepted_snippet: String,
			triggers: []
		},
		reason: {
			rejected_snippets: [],
			accepted_snippet: String,
			triggers: []
		},
		call_to_action: {
			rejected_snippets: [],
			accepted_snippet: String,
			triggers: []
		},
		sign_off: {
			rejected_snippets: [],
			accepted_snippet: String,
			triggers: []
		},
		signature: {
			rejected_snippets: [],
			accepted_snippet: String,
			triggers: []
		}
	},
	logic_triggers: []		// These are triggers which affected the decision to send this email
							// but don't necessarily have a direct impact on snippet selection	
}, { strict: false });
*/

mongoose.model("Email", emailSchema);
