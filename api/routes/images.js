var express = require('express');
var router = express.Router();
var has = require("../classes/permissions.js");

var ctrl = require('../controllers/images.js');

var multer = require('multer');
var storage = multer.memoryStorage()

var upload = multer({ storage: storage })

router.post('/images/upload', upload.any(), ctrl.uploadImage);
router.get("/image/id/:id", ctrl.getImage);											// Returns a single image by ID

router.get("/images", has.permission("read"), ctrl.listImages); 					// Returns a paginated list of images
router.get("/images/page/:page/id/:id", has.permission("read"), ctrl.listImages); 	// Returns a paginated list of images

module.exports = router
