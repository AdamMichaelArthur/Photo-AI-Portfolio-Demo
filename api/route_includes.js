

module.exports = function(app) {
  // Routes needs to load before roles

  /*

*/

  // API Routes
  // routes Route Definition
  var routes = require("@routes/routes.js");
  app.use("/api", routes);

  // roles Route Definition
  var roles = require("@routes/roles.js");
  app.use("/api", roles);

  // accounts Route Definition
  var accounts = require("@routes/accounts.js");
  app.use("/api", accounts);

  // login Route Definition
  var login = require("@routes/login.js");
  app.use("/api", login);

  // images Route Definition
  var images = require("@routes/images.js");
  app.use("/api", images);

  // orders Route Definition
  var orders = require("@routes/ecommerce/orders.js");
  app.use("/api", orders);

  // products Route Definition
  var products = require("@routes/ecommerce/products.js");
  app.use("/api", products);

  // customers Route Definition
  var customers = require("@routes/ecommerce/customers.js");
  app.use("/api", customers);

  // financials Route Definition
  var financials = require("@routes/financials/financials.js");
  app.use("/api", financials);

  // hugo Route Definition
  //var hugo = require("@routes/hugo/hugo.js");
  //app.use("/api", hugo);

  // navigation Route Definition
  var navigation = require("@routes/navigation/navigation.js");
  app.use("/api", navigation);

  // email Route Definition
  var email = require("@routes/email/email.js");
  app.use("/api", email);

  var settings = require("@routes/settings.js");
  app.use("/api", settings);

  var profile = require("@routes/profile.js");
  app.use("/api", profile);

  var logging = require("@routes/logging/logging.js");
  app.use("/api", logging);

  var datasource = require("@classes/datasource.js");
  app.use("/api/datasource", datasource);

  var bounties = require("@classes/bounties.js");
  app.use("/api/bounties", bounties);

  var stripe = require("@classes/stripe.js");
  app.use("/api/stripe", stripe);

  // var paypal = require("@classes/paypal.js");
  // app.use('/api/paypal', paypal);

  // var dropbox = require("@classes/dropbox.js");
  // app.use('/api/dropbox', dropbox);

  var actions = require("@classes/actions.js");
  app.use("/api/actions", actions);

  var cards = require("@classes/cards.js");
  app.use("/api/cards", cards);

  var navigationv2 = require("@classes/navigationv2.js");
  app.use("/api/navigationv2", navigationv2);

  var box = require("@classes/integrations/box/endpoints.js");
  app.use("/api/box", box);

  app.use("/api/boxredirect", box);

  var lagrowthmachine = require("@classes/integrations/lagrowthmachine/endpoints.js");
  app.use("/api/lagrowthmachine", lagrowthmachine);

  var templates = require("@classes/integrations/templates/endpoints.js");
  app.use("/api/templates", templates);

  var exceltojson = require("@classes/integrations/exceltojson/endpoints.js");
  app.use("/api/exceltojson", exceltojson);

  var jsontoexcel = require("@classes/integrations/jsontoexcel/endpoints.js");
  app.use("/api/jsontoexcel", jsontoexcel);

 var docxtojson = require("@classes/integrations/docxtojson/endpoints.js");
  app.use("/api/docxtojson", docxtojson);

  var public = require("@classes/public/endpoints.js");
  app.use("/api/public", public);

  var twitter = require("@classes/integrations/twitter/endpoints.js");
  app.use("/api/twitter", twitter);

  var notifications = require("@classes/streams/notifications.js");
  app.use("/api/notifications", notifications);

  var sheets = require("@classes/integrations/google/sheets/endpoints.js")
  app.use("/api/google/sheets", sheets);

  var docs = require("@classes/integrations/google/docs/endpoints.js")
  app.use("/api/google/docs", docs);

  var gmail = require("@classes/integrations/google/gmail/endpoints.js")
  app.use("/api/google/gmail", gmail);

  var drive = require("@classes/integrations/google/drive/endpoints.js")
  app.use("/api/google/drive", drive);



  var presentations = require("@classes/integrations/google/presentations/endpoints.js")
  app.use("/api/google/presentations", presentations);

  var youtube = require("@classes/integrations/google/youtube/endpoints.js")
  app.use("/api/google/youtube", youtube);

  var slack = require("@classes/integrations/slack/endpoints.js");
  app.use("/api/slack", slack);

  var watch_admin_bounty = require("@classes/watchers/watch_admin.js")
  // zzendpointzz Route Definition
  //var zzendpointzz = require("@routes/zzendpointzz.js");
  //app.use('/api', zzendpointzz);
};
