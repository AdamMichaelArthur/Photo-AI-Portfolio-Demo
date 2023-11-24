var mongoose = require("mongoose");
var mongooseIntlPhoneNumber = require("mongoose-intl-phone-number");
const Schema = mongoose.Schema;

var validateEmail = function(email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

var userSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now },
    accountId: Schema.Types.ObjectId,
    role: String,
    first_name: String,
    last_name: String,
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: "Email address is required",
      validate: [validateEmail, "Please fill a valid email address"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address"
      ]
    },
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
    pastSessions: Array,
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
    },
    skill: Array,
    defaultPaymentMethod: String
  },
  { strict: false }
);

mongoose.model("User", userSchema);

var anonymousUserSchema = new mongoose.Schema(
  {
    sessionId: String,
    sessionExpiration: Date
  },
  { strict: false }
);

mongoose.model("AnonymousUser", anonymousUserSchema);
