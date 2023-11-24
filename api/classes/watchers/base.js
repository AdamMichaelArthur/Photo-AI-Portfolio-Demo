

const dotenv = require("dotenv");
dotenv.config();

require("module-alias/register");
require('@root/db');

var mongoose = require( 'mongoose');
const Schema = mongoose.Schema;

var bountySchema = new mongoose.Schema({
	created: { type: Date, default: Date.now },
	modified: { type: Date, default: Date.now, required: true },
	created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	modified_by: { type: Schema.Types.ObjectId, ref: 'User', default: null, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Account', required: true},
	bStatus: Boolean
}, { strict: false });

mongoose.model("Bounty", bountySchema);

var userSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now },
    accountId: Schema.Types.ObjectId,
    role: String,
    first_name: String,
    last_name: String,
    email: String,
    phone: { type: String, unique: false, required: false },
    address_1: String,
    address_2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    cc_token: { type: String, default: "" },
    pwd: String,
    sessionId: String,
    sessionExpiration: Date,
    hapiKey: String,
    refreshToken: String,
    accessToken: String,
    bPhoneVerified: { type: Boolean, default: false },
    bEmailVerified: { type: Boolean, default: false },
    passwordRecovery: {
      // This is used in the event a password reset is requested
      recoveryExpiration: Date,
      recoveryCode: String
    },
    settings: {},
    profile: {},
    paymentMethods: [],
    bIsBusy: { type: Boolean, default: false },
    account_type: { type: String, default: 'admin'},
    temporary_storage: {},
    integrations: {
      box: {
        "code":String,
        "tokenStore":Object
      }
    },
    pendingBounties: { type: Number, default: 0 },
    pendingBountiesCount: { type: Number, default: 0 },
    maxBountiesCount: { type: Number, default: 4 },
    maxPendingBountiesValue: { type: Number, default: 50 },
    financials: {
      balance: { type: Number, default: 0.00 }
    }
  },
  { strict: false }
);

mongoose.model("User", userSchema);