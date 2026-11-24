var express = require("express");
var router = express.Router();

var jiraController = require("../controllers/jiraController");

router.get("/", jiraController.listarChamados);
router.get("/listar-alertas-clp/:nomeClp/:mac/:periodo", function (req, res) {
    jiraController.listasAlertasClp(req, res)
});

module.exports = router;
