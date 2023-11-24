var express = require("express");
var router = express.Router();
var validation = require("@classes/validation.js");
var ctrl = require("@controllers/settings.js");

router.post(
  "/settings",
  ctrl.saveSetting,
  validation.checkInput({
    key: "String",
    value: "String"
  }),
  validation.checkOutput({
    setting: "Object"
  })
);

router.post("/settings/advanced", ctrl.saveAdvancedSetting);

router.post(
  "/settings/array",
  ctrl.saveSetting,
  validation.checkInput({
    key: "String",
    value: "Object"
  }),
  validation.checkOutput({
    setting: "Object"
  })
);

router.get(
  "/settings/key/:key",
  ctrl.getSetting,
  validation.checkInput({}),
  validation.checkOutput({
    setting: "Object"
  })
);

router.get(
  "/settings",
  ctrl.getSettings,
  validation.checkInput({}),
  validation.checkOutput({
    settings: "string"
  })
);

module.exports = router;
