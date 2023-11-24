// Created by Noor: Tue, 11 Feb, 2020

var express = require("express");
var router = express.Router();
var validation = require("@classes/validation.js");
var ctrl = require("@controllers/profile.js");

router.get(
  "/profile",
  ctrl.getProfile,
  validation.checkInput({}),
  validation.checkOutput({
    profile: "Object"
  })
);

router.post(
  "/profile",
  ctrl.saveProfile,
  validation.checkInput({
    key: "String",
    value: "String"
  }),
  validation.checkOutput({
    profile: "Object"
  })
);

module.exports = router;
