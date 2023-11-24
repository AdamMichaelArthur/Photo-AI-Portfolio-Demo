var helpers = require("@classes/helpers");
var mongoose = require("mongoose");
var Model = mongoose.model("Routes");

// Auto generated through makeroute
var routes = [
  "login",
  "privilegedLogin",
  "accounts",
  "roles",
  "permissions",
  "routes",
  "products",
  "images",
  "orders",
  "products",
  "customers",
  "brand",
  "collaborator",
  "financials",
  "hugo",
  "navigation",
  "email",
  "sheets",
  "google",
  "logging" //zzRoutezz
];

// Manually created route endpoints
routes.push("user");
routes.push("invite");
routes.push("sidebar");
routes.push("account");
routes.push("dashboard");
routes.push("settings");
routes.push("profile");
routes.push("emailaddress");
routes.push("datasource");
routes.push("integrations");
routes.push("bounties");
routes.push("stripe");
routes.push("actions");
routes.push("box");
routes.push("twitter");
routes.push("navigationv2")
routes.push("notifications")
routes.push("cards")

async function updateRoutes() {
  try {
    var update = await Model.updateOne(
      {},
      { routes: routes },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (err) {}
}
updateRoutes();

module.exports.createRoutes = async function(accountId) {
  var model = {
    owner: accountId,
    routes: routes
  };

  model = await helpers.mongoCreate(res, Model, model);
  if (model == false) return;
  return true;
};

module.exports.updateRoutes = async function(req, res) {};

module.exports.listRoutes = async function(req, res) {};
module.exports.editRoutes = async function(req, res) {};

module.exports.deleteRoutes = async function(req, res) {};
