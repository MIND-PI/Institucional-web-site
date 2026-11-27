var express = require("express");
var router = express.Router();
var jiraConfigController = require("../controllers/jiraConfigController");

// cadastrar a configuração de integração Jira de uma empresa
router.post("/cadastrar/:idEmpresa", function (req, res) {
    jiraConfigController.cadastrar(req, res);
});

router.get("/buscarJiras/:idEmpresa", function (req, res) {
    jiraConfigController.buscarJiras(req, res);
});

module.exports = router;
