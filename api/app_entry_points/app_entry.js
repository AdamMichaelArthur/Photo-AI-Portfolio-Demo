//console.log('\x1Bc');

"use strict";

// Load Our Environment Variables
const dotenv = require("dotenv");
dotenv.config();

if(process.env.DEV_ENVIRONMENT == "true")
  process.env.DEV_ENVIRONMENT = true;
// Load our scheduled tasks

// To-Do Web Concurrency

/**
 * Module dependencies.
 */

require("module-alias/register");
//

var app = require("./route_definitions.js");
app.enable("trust proxy");

const compression = require("compression");
app.use(compression());

var debug = require("debug")("AdamsAPI:server");
var http = require("http");
//var cron = require("node-cron");
var cluster = require("cluster");
const throng = require("throng");

var bRunOnce = false;
//var cron = "0/1 57 0,20 ? * * *";

const WORKERS = 1; //process.env.WEB_CONCURRENCY;

const PORT = process.env.PORT;
const BLITZ_KEY = process.env.BLITZ_KEY;

var bStartOnce = false;

throng(
  {
    workers: WORKERS,
    lifetime: Infinity
  },
  start
);


/**
 * Get port from environment and store in Express.
 */
//an event listener

//var startTime = moment().format("hh:mm");

function start() {
  //   cron.schedule('05 00 * * *', () => {
  //   newsEngine.batchNewsArticles();
  // }, {
  //  scheduled: true,
  //  timezone: "America/Denver"
  // });

  // Start the websocket server
  // To do: think about scaling
  require("./websocket_server.js");

  /*
        This should be re-written to support TLS connections
        only.  Currently, to create a secure connection, you
        must configure a proxy on the server to route secure
        traffic.  This can be done on nginx, please see
        documentation for setting up a secure server.

        In Production, we use nginx as our http server.  Nginx
        is configured to use a local proxy, so the node app
        will always listen locally on port 3000, and nginx 
        will forward traffic.

    */

  process.on("uncaughtException", function(err) {
    console.log(79, "here", "uncaughtException", err.stack);
    // ToDo send notification to remote logging feature
  });

  var port = normalizePort(process.env.PORT);
  app.set("port", port);

  /**
   * Create HTTP server.
   */

  var server = http.createServer(app);
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  /**
   * Listen on provided port, on all network interfaces.
   */

  server.listen(port);
  console.log(113, "Listening on port", port);
  server.timeout = 60000;
  server.on("error", onError);
  server.on("listening", onListening);
  server.on("timeout", onTimeout);

  /**
   * Normalize a port into a number, string, or false.
   */

  function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  }

  /**
   * Event listener for HTTP server "error" event.
   */

  function onTimeout(error) {
    // res.status(500);
    // var defaultErrorResponse = helpers.defaultErrorResponseObject()
    // defaultErrorResponse.error = 22000
    // defaultErrorResponse.ErrorDetails.Error = 22000
    // defaultErrorResponse.ErrorDetails.Description = "The request failed because it took to long to complete the request"
    // res.json(defaultErrorResponse)
  }

  function onError(error) {
    if (error.syscall !== "listen") {
      throw error;
    }

    var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    console.log(153, error);
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  }
}

// Application is bootstrapped

var mongoose = require("mongoose");
var Authentication = require("@classes/authentication.js");
var helpers = require("@classes/helpers");
var roles = require("@controllers/roles.js");
var navigation = require("@controllers/navigation/navigation.js");
var accountModel = mongoose.model("Account");
var defaults = require("./defaults.js");

var userModel = mongoose.model("User");

async function checkDefaultAccount(
  user,
  pass,
  phone,
  sidebar,
  dashboard,
  account
) {
  // ToDo -- only do this in development
  // ~ Remove the default user.
  //var result = await userModel.remove({"email":user})

  var checkForAdmin = userModel.findOne({ email: user }, function(err, doc) {
    if (err == null && doc == null) {
      console.log("Site Admin Account Not Setup...creating", user, pass);
      var result = createAdminAccount(
        user,
        pass,
        phone,
        sidebar,
        dashboard,
        account
      );
    }
  });
}

async function createAdminAccount(
  user,
  pwd,
  phone,
  sidebar,
  dashboard,
  account
) {
  // First, let's encrypt the password immediately
  var hashedPwd = await Authentication.hashPwd(pwd);

  var jsonBody = {
    email: user,
    pwd: hashedPwd,
    phone: phone
  };

  var user = {};

  try {
    user = await userModel.create(jsonBody);
  } catch (err) {
    console.log(212, err);
    return;
  }

  // If we've gotten here, it means that a new user account has been created.
  // We can now go ahead and create the account

  var userId = user._id;

  try {
    var res = await accountModel.create({
      owner: userId,
      created_by: userId,
      modified_by: userId
    });
  } catch (err) {
    console.log(229, err);
    return;
  }

  var accountId = res._id;

  try {
    user.accountId = accountId;

    // Now, we want to create an initial session for the user to automatically login
    // with
    user.role = "administrator";
    user.settings = {
      first_name: "System",
      last_name: "Account",
      accountType: "SysAdmin"
    };
    var resp = await user.save();
  } catch (err) {
    console.log(252, err);
    return;
  }

  // Create the initial roles document for this account
  await roles.createDefaultRoles(accountId._id, userId);
  await navigation.createDefaultSidebarNav(
    accountId._id,
    user,
    "administrator",
    sidebar
  );
  await navigation.createDefaultDashboardNav(
    accountId._id,
    user,
    "administrator",
    dashboard
  );
  await navigation.createDefaultAccountNav(
    accountId._id,
    user,
    "administrator",
    account
  );

  // Create the Stipe Customer
  createCustomerWithAccount(user);
  // Any other development accounts should be put here....
}

/*  Create Customer
 */
function createCustomerWithAccount(user) {
  console.log(362, "creatingCustomer");
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  stripe.customers.create(
    {
      email: user.email,
      name: user.settings.first_name + user.settings.last_name,
      id: String(user._id)
    },
    function(err, stripeCustomer) {
      console.log(373, stripeCustomer);
    }
  );
}

// userModel.remove({}, function(err, model) {
//   checkDefaultAccount(
//     process.env.SITE_ADMIN,
//     process.env.SITE_ADMIN_PASS,
//     process.env.SITE_ADMIN_PHONE,
//     defaults.site_admin_sidebar,
//     defaults.site_admin_dashboard,
//     defaults.site_admin_account
//   );

//   checkDefaultAccount(
//     process.env.AUTHORITY_SITE,
//     process.env.AUTHORITY_SITE_PASS,
//     process.env.AUTHORITY_SITE_PHONE,
//     defaults.authority_site_sidebar,
//     defaults.authority_site_dashboard,
//     defaults.authority_site_account
//   );

//   checkDefaultAccount(
//     process.env.CREATOR_SITE,
//     process.env.CREATOR_SITE_PASS,
//     process.env.CREATOR_SITE_PHONE,
//     defaults.creator_site_sidebar,
//     defaults.creator_site_dashboard,
//     defaults.creator_site_account
//   );

//   checkDefaultAccount(
//     process.env.SUPPORT,
//     process.env.SUPPORT_PASS,
//     process.env.SUPPORT_PHONE,
//     defaults.site_admin_sidebar,
//     defaults.site_admin_dashboard,
//     defaults.site_admin_account
//   );
// });

var stepsModel = mongoose.model("Step");
var processesModel = mongoose.model("Process");
var brandsModel = mongoose.model("Brand");

//setTimeout(setupDatabase, 5000);

async function setupDatabase() {
  var user = await userModel.find({ email: "authority@contentbounty.com" });

  stepsModel.remove({}, function(err, model, user) {
    // Add the steps...
    post(defaults.steps);
  });

  processesModel.remove({}, function(err, model, user) {
    // Add the processes
    post(defaults.processes);
  });

  brandsModel.remove({}, function(err, model, user) {
    post(defaults.brands);
  });
}

var mongo = require("@classes/mongo.js");

async function post(body, model, user) {
  // Create a new record with the json body

  var jsonBody = body;
  if (Array.isArray(jsonBody)) {
    console.log("We have an array");
    for (var i = 0; i < jsonBody.length; i++) {
      var payload = jsonBody[i];
      var db = new mongo(model, user);
      await db.mongoCreate(payload);
      console.log(263, "Adding Payload", payload);
      return;
    }
  } else {
    var db = new mongo(model, user);
  }

  await db.mongoCreate(jsonBody);
}