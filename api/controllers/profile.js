var helpers = require("@classes/helpers");
var mongoose = require("mongoose");

module.exports.getProfile = async function(req, res, next) {

  var user = res.locals.user;
  var profile = user.profile;
  if (!profile.name) {
    profile.name = user.settings.first_name + " " + user.settings.last_name;
  }
  if (!profile.profile_img_link) {
    profile.profile_img_link = user.settings.profile_img_link;
  }
  res.locals.response = { profile: profile };
  return next();

  // console.log("getting the profile array");

  // var user = res.locals.user;
  // var profile = user.profile;
  // try {
  //   console.log(12, typeof user);
  //   //"profile": {
  //   //  "designation"
  // } catch (err) {
  //   console.log(16, err);
  //   res.status(500);
  //   var defaultErrorResponse = helpers.defaultErrorResponseObject();
  //   defaultErrorResponse.error = 22000;
  //   defaultErrorResponse.ErrorDetails.Error = 22000;
  //   defaultErrorResponse.ErrorDetails.Description =
  //     "The request failed " + err.message;
  //   res.json(defaultErrorResponse);
  //   return;
  // }
  // res.locals.response = { profile: user.profile };
  // return next();
};

module.exports.saveProfile = async function(req, res, next) {
  var user = res.locals.user;
  var profile = {};
  profile[req.body.key] = req.body.value;

  // const util = require('util')
  // console.log(util.inspect(setting, false, null, true /* enable colors */))

  if (user.profile == undefined) {
    user.profile = {};
  }

  var newProfile = Object.assign(user.profile, profile);

  user.profile = {};
  await user.save();
  user.profile = newProfile;
  try {
    var saveResult = await user.save();
  } catch (err) {}
  res.locals.response = { profile: profile };
  return next();
};
