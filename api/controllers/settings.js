var helpers = require("@classes/helpers");
var mongoose = require("mongoose");

module.exports.saveSetting = async function(req, res, next) {
  var user = res.locals.user;
  var setting = {};
  setting[req.body.key] = req.body.value;

  // const util = require('util')
  // console.log(util.inspect(setting, false, null, true /* enable colors */))

  if (user.settings == undefined) {
    user.settings = {};
  }

  var newSettings = Object.assign(user.settings, setting);

  user.settings = {};
  await user.save();
  user.settings = newSettings;

  if(req.body.key == "first_name") {
    user.first_name = req.body.value
  }

  if(req.body.key == "last_name") {
    user.last_name = req.body.value
  }

  try {
    var saveResult = await user.save();
    // console.log(32, saveResult)
  } catch (err) {}
  res.locals.response = { setting: setting };
  return next();
};

// Code written by Noor Jahan: Tue, 11 Feb, 2020
// module.exports.saveProfile = async function(req, res, next) {
//   var user = res.locals.user;
//   var profile = {};
//   setting[req.body.key] = req.body.value;

//   // const util = require('util')
//   // console.log(util.inspect(setting, false, null, true /* enable colors */))

//   if (user.profile == undefined) {
//     user.profile = {};
//   }

//   var newProfile = Object.assign(user.profile, profile);

//   user.profile = {};
//   await user.save();
//   user.profile = newProfile;
//   try {
//     var saveResult = await user.save();
//   } catch (err) {}
//   res.locals.response = { profile: profile };
//   return next();
// };
// Code written by Noor Jahan: Tue, 11 Feb, 2020

module.exports.saveAdvancedSetting = async function(req, res) {
  var object = req.body.object;
  var branch = req.body.branch;

  var key = req.body.key;
  var value = req.body.value;
  var setting = {};
  setting[key] = value;

  var settingObject = {};
  settingObject[object] = {};
  settingObject[object][branch] = {};
  settingObject[object][branch] = setting;

  var user = res.locals.user;

  if (typeof user[object] == "undefined") user[object] = {};

  if (typeof user[object][branch] == "undefined") user[object][branch] = {};

  if (typeof user[object][branch][key] == "undefined")
    user[object][branch][key] = {};

  // user["settings"]["company_settings"]["company_website_link"]
  user[object][branch][key] = value;
  user.markModified(object);
  await user.save();
  res.status(200);
  res.json(user[object]);

  // if(user.settings == undefined){
  // 	user.settings = {};
  // }
  // var settings = {}
  // var newSettings = Object.assign(user.settings, settings);

  // if(user.settings[object] == undefined)
  // 	user.settings[object] = {};

  // if(user.settings[object][branch] == undefined)
  // 	user.settings[object][branch] = {}
  // var test  = Object.assign(user.settings[object][branch], settingObject[object][branch])

  // //newSettings = Object.assign(newSettings, test)

  // user.settings = {};
  // await user.save();
  // user.settings = newSettings;
  // try{
  // var saveResult = await user.save();
  // } catch(err){
  // 	saveResult = {}
  // }

  // res.status(200);
  // res.json(saveResult.settings);
};

module.exports.getSetting = async function(req, res, next) {
  var user = res.locals.user;
  var settings = user.settings;
  var setting = {};
  setting[req.params.key] = settings[req.params.key];
  res.locals.response = { setting: setting };
  return next();
};

module.exports.getSettings = async function(req, res, next) {

  var user = res.locals.user;
  var settings = user.settings;
  res.locals.response = { settings: settings };
  return next();
};
