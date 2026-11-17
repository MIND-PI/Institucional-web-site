var express = require("express");
var router = express.Router();

var jiraController = require("../controllers/jiraController");

router.get("/", jiraController.listarChamados);

module.exports = router;
