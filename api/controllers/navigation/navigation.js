var helpers = require("@classes/helpers");
var mongoose = require("mongoose");
var hasPermission = require("@classes/permissions.js");
var Authentication = require("@classes/authentication.js");
var Pagination = require("@classes/pagination.js");
var Communication = require("@classes/communication.js");
var Mongo = require("@classes/mongo.js");
var SidebarNav = mongoose.model("SidebarNav");
var AccountNav = mongoose.model("AccountNav");
var DashboardNav = mongoose.model("DashboardNav");
const {google} = require('googleapis');

//var menudefaults = JSON.parse(fs.readFileSync( process.cwd() +"/api/menudefaults.json"))
/*	Required Body Params
	
*/

// this defalut sidebar nav for initail view

var default_sidebar = [
  {
    path: "search_bounties",
    title: "Bounties",
    icon: "receipt",
    collapse: "autobot"
  },
  {
    path: "in_progress",
    title: "In Progress",
    icon: "receipt",
    collapse: "autobot"
  },
  {
    path: "completed",
    title: "Completed",
    icon: "receipt",
    collapse: "autobot"
  }
  // {
  //      path: 'home',
  //      title: 'Home',
  //      icon: 'assignment_ind',
  //      collapse: "autobot"
  //    },
  //    {
  //      path: 'management',
  //      title: 'Brand Management',
  //      icon: 'assignment_ind',
  //      collapse: "autobot"
  //    },
  //    {
  //      path: 'queue',
  //      title: 'Content Queue',
  //      icon: 'local_airport',
  //      collapse: "missioncontrol"
  //  	},
  // },
  // {
  //   path: 'outreach',
  //   title: 'Outreach',
  //   icon: 'settings'
  // }

  //,
  // {
  //   path: 'creators',
  //   title: 'Content Creators',
  //   icon: 'work'
  // }
];
// Default Navigation Format Needs to be Thought Oout
var default_navigation = [{}];

var default_accountnav = [
  {
    desc: "Settings",
    path: "settings",
    viewroute: "settings",
    title: "Settings"
  },
  {
    desc: "Reports",
    viewroute: "reports",
    path: "reports",
    title: "Reports"
  },
  {
    desc: "Link Gmail",
    viewroute: "linkgmail",
    title: "Link Gmail"
  }
];

var default_dashboard = "brandsummary";

module.exports.createNavigation = async function(req, res, next) {
  var endpoint = res.locals.route;
  var user = res.locals.user;
  var jsonBody = res.locals.jsonBody;

  var model = {
    owner: user.accountId,
    created_by: user._id,
    modified_by: user._id
  };

  asymodel = await helpers.mongoCreate(res, Model, model);
  if (model == false) return;

  res.locals.response = {};

  return next();
};

// GET /dashboard
module.exports.sidebar = async function(req, res, next) {
  // The sidebar is intended to be 100% dynamic, and may change
  // depending on the Role that the user is configured for

  var user = res.locals.user;
  try {
    var sidebarNavigationArray = await SidebarNav.find({
      role: user.role,
      accountId: user.accountId
    });

    res.locals.response = sidebarNavigationArray;
  } catch (err) {}

  return next();
};

// PUT /dashboard
module.exports.editSidebar = async function(req, res, next) {
  var endpoint = res.locals.route;
  var user = res.locals.user;
  var jsonBody = res.locals.jsonBody;

  // We need to get a list of Roles, to validate that the supplied Role
  // is defined
  try {
    var rolesModel = mongoose.model("Roles");
    var rolesArrayOfObjects = await rolesModel
      .find({ accountId: user.accountId })
      .select("role -_id");
    var rolesAr = [];
    //  rolesAr is an array and looks like this:
    /*
				[{role:"administrator"}, {role:"user"}]
		*/
    for (var roleStr of rolesArrayOfObjects) {
      rolesAr.push(roleStr.role);
    }
  } catch (err) {}

  if (!rolesAr.includes(jsonBody.role)) {
    return res.send(
      "This role " +
        jsonBody.role +
        " does not exist.  To get a list of defined roles, call GET /roles first.  To define a role, call POST /roles."
    );
  }

  var model = {
    owner: user.accountId,
    created_by: user._id,
    modified_by: user._id,
    navigation: jsonBody.sidebar,
    role: jsonBody.role
  };

  var mongoDB = new Mongo(SidebarNav, user, res);

  model = await mongoDB.mongoCreateOnDuplicateKeyUpdate(
    { owner: user.accountId, role: jsonBody.role },
    model
  );
  if (model == false) return;

  res.locals.response = {};

  return next();
};

// GET /sidebar
module.exports.sidebar = async function(req, res, next) {
  // The dashboard that is displayed will change
  // depending on who is logged in.
  // For example, a Collaborator will get the Collaborator dashboard
  // While a brand owner will get a different dashboard
  var user = res.locals.user;

  try {
    var sidebarNav = await SidebarNav.findOne({
      owner: user.accountId,
      role: user.role
    })
      .select("navigation -_id")
      .lean();
  } catch (err) {

  }

  if (sidebarNav == null) {
    return helpers.error(
      res,
      1500,
      "A Sidebar Nav hasn't been registered for this account.  Call PUT /sidebar to create a navigation"
    );
  }

  res.locals.response = { navigation: sidebarNav.navigation };

  return next();
};

module.exports.account = async function(req, res, next) {
  var user = res.locals.user;

  console.log(220);

  try {
    var accountNav = await AccountNav.findOne({
      owner: user.accountId,
      role: user.role
    })
      .select("navigation -_id")
      .lean();
  } catch (err) {}
  if (accountNav == null) {
    return helpers.error(
      res,
      1500,
      "An Account Nav hasn't been registered for this account.  Call PUT /account to create a navigation"
    );
  }
  res.locals.response = { navigation: accountNav.navigation };

  console.log(239, accountNav );
  
  return next();
};

module.exports.editAccount = async function(req, res, next) {
  var endpoint = res.locals.route;
  var user = res.locals.user;
  var jsonBody = res.locals.jsonBody;

  try {
    var rolesModel = mongoose.model("Roles");
    var rolesArrayOfObjects = await rolesModel
      .find({ accountId: user.accountId })
      .select("role -_id");
    var rolesAr = [];

    for (var roleStr of rolesArrayOfObjects) {
      rolesAr.push(roleStr.role);
    }
  } catch (err) {}

  if (!rolesAr.includes(jsonBody.role)) {
    return res.send(
      "This role " +
        jsonBody.role +
        " does not exist.  To get a list of defined roles, call GET /roles first.  To define a role, call POST /roles."
    );
  }

  var model = {
    owner: user.accountId,
    created_by: user._id,
    modified_by: user._id,
    navigation: jsonBody.sidebar,
    role: jsonBody.role
  };

  var mongoDB = new Mongo(AccountNav, user, res);

  model = await mongoDB.mongoCreateOnDuplicateKeyUpdate(
    { owner: user.accountId, role: jsonBody.role },
    model
  );
  if (model == false) return;

  res.locals.response = {};

  return next();
};

module.exports.editDashboard = async function(req, res, next) {
  var endpoint = res.locals.route;
  var user = res.locals.user;
  var jsonBody = res.locals.jsonBody;

  try {
    var rolesModel = mongoose.model("Roles");
    var rolesArrayOfObjects = await rolesModel
      .find({ accountId: user.accountId })
      .select("role -_id");
    var rolesAr = [];

    for (var roleStr of rolesArrayOfObjects) {
      rolesAr.push(roleStr.role);
    }
  } catch (err) {}

  if (!rolesAr.includes(jsonBody.role)) {
    return res.send(
      "This role " +
        jsonBody.role +
        " does not exist.  To get a list of defined roles, call GET /roles first.  To define a role, call POST /roles."
    );
  }

  var model = {
    owner: user.accountId,
    created_by: user._id,
    modified_by: user._id,
    viewroute: jsonBody.viewroute,
    role: jsonBody.role
  };

  var mongoDB = new Mongo(DashboardNav, user, res);

  model = await mongoDB.mongoCreateOnDuplicateKeyUpdate(
    { owner: user.accountId, role: jsonBody.role },
    model
  );
  if (model == false) return;

  res.locals.response = {};

  return next();
};

// GET /dashboard
module.exports.dashboard = async function(req, res, next) {
  var user = res.locals.user;

  try {
    var dashboardNav = await DashboardNav.findOne({
      owner: user.accountId,
      role: user.role
    }).select("viewroute -_id");
  } catch (err) {}

  if (dashboardNav == null) {
    return helpers.error(
      res,
      1500,
      "A Dashboard hasn't been registered for this account.  Call PUT /sidebar to create a navigation"
    );
  }

  res.locals.response = { viewroute: dashboardNav.viewroute };

  return next();
};

// Defaults for Account Creation
module.exports.createDefaultSidebarNav = async function(
  accountId,
  User,
  role,
  sidebar,
  accountType =""
) {
  if (sidebar == null) var sidebar = default_sidebar;

  var model = {
    owner: accountId,
    created_by: User._id,
    modified_by: User._id,
    navigation: sidebar,
    role: role,
    account_type: accountType
  };

  var mongoDB = new Mongo(SidebarNav, User);

  model = await mongoDB.mongoCreateOnDuplicateKeyUpdate(
    { owner: User.accountId, role: role },
    model
  );
  if (model == false) return;
};

module.exports.createDefaultDashboardNav = async function(
  accountId,
  User,
  role,
  dashboard,
  accountType =""
) {
  if (dashboard == null) var dashboard = default_dashboard;

  var model = {
    owner: accountId,
    created_by: User._id,
    modified_by: User._id,
    viewroute: dashboard,
    role: role,
    account_type: accountType
  };

  var mongoDB = new Mongo(DashboardNav, User);

  model = await mongoDB.mongoCreateOnDuplicateKeyUpdate(
    { owner: User.accountId, role: role },
    model
  );
  if (model == false) return;
};

module.exports.createDefaultAccountNav = async function(
  accountId,
  User,
  role,
  accountnav,
  accountType =""
) {
  if (accountnav == null) var accountnav = default_accountnav;

  var model = {
    owner: accountId,
    created_by: User._id,
    modified_by: User._id,
    navigation: accountnav,
    role: role,
    account_type: accountType
  };

  var mongoDB = new Mongo(AccountNav, User);

  model = await mongoDB.mongoCreateOnDuplicateKeyUpdate(
    { owner: User.accountId, role: role },
    model
  );
  if (model == false) return;
};

var googleAuth = require("google-auth-library");

// We need to supply a scope
var scope = "https://mail.google.com/";

// To-Do Replace with envior
var credentials = {
  gmail: {
    client_id: process.env.GMAIL_OAUTH_CLIENT_ID,
    project_id: process.env.GMAIL_PROJECT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_secret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
    redirect_uris: [process.env.GMAIL_REDIRECT]
  }
};

var request = require("request-promise");
var moment = require("moment");
var mongoose = require("mongoose");
var Mongo = require("@classes/mongo.js");
var Voca = require("voca");

// http://localhost/?code=4/rQEgl2C1ob4VxkbNjO1VKv1HnYU-5tQTQvnOXMaMYT2JnE5RxbOX_0M-p07iLXM9PtWMrCRPnRsRpxt1AwT86hM&scope=https://mail.google.com/

module.exports.getAuthorizationUrl = async function(req, res, next) {
  const oauth2Client = new googleAuth.OAuth2Client(
    credentials.gmail.client_id,
    credentials.gmail.client_secret,
    credentials.gmail.redirect_uris[0]
  );

  console.log(req.body.first, req.body.last, req.body.email)
  var stateInformation = req.body

  console.log(472, req.body);
  
  const authUrl = await oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scope,
    prompt: "consent",
    state: JSON.stringify(stateInformation)
  });

  res.locals.response = {};
  res.locals.response["authURL"] = authUrl;

  return next();
};

module.exports.redirectGmail = async function(req, res, next) {
  var user = res.locals.user;
  var code = req.query.code;

  // code is a single use token that is used to retrieve our access token
  const oauth2Client = new googleAuth.OAuth2Client(
    credentials.gmail.client_id,
    credentials.gmail.client_secret,
    credentials.gmail.redirect_uris[0],   
  );

  try {
    var token = await oauth2Client.getToken(code);
  } catch (err) {
    //res.redirect(301, res.locals.baseURL + "/#gmail_error");
    res.status(200);
    res.json({ gmail: false });
    return;
  }

  var stateInfo = JSON.parse(req.query["state"]);

  var mongoConn = await mongoose.connection.db.collection("gmails").insert({
    "created_by" : user._id,
    "modified_by" : user._id,
    "brand_id":mongoose.Types.ObjectId(stateInfo.brand_id),
    "owner" : user.accountId,
    "email":stateInfo.email,
    "first":stateInfo.first,
    "last":stateInfo.last,
    "token":token.tokens
  })

  const oAuth2Client = new google.auth.OAuth2(
            process.env.GMAIL_OAUTH_CLIENT_ID, 
            process.env.GMAIL_OAUTH_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT);
  oAuth2Client.setCredentials(token.tokens);
  watchInbox(oAuth2Client)

  res.redirect(301, res.locals.baseURL + "/#gmail_linked");
};

async function watchInbox(auth) {

    const gmail = google.gmail({
        version: 'v1',
        auth
    });

    gmail.users.watch({
        userId: 'me',
        requestBody: {
            topicName: 'projects/content-bounty/topics/receive-emails'
        }
    });

}
