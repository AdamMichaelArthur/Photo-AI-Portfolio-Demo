var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var ctrl = require('@controllers/login.js');

router.post("/login", ctrl.login);
router.post("/privilegedLogin", ctrl.privilegedLogin);
router.post("/recover", ctrl.recover);
router.post("/reset", ctrl.reset);
router.post("/verify", ctrl.verify);
router.get("/logout", ctrl.logout);
router.get("/session", ctrl.getAnonymousSession);
router.get("/session/id/:id", ctrl.getAnonymousSession);
router.get("/confirm/type/:type/code/:code", ctrl.confirm);

module.exports = router
