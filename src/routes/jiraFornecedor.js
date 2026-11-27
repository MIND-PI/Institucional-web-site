var express = require("express");
var router = express.Router();

var jiraFornecedorController = require("../controllers/jiraFornecedorController");

// Chamados do Jira de todos os clientes ativos do fornecedor
router.get("/chamados/:idEmpresa", function (req, res) {
    jiraFornecedorController.listarChamadosClientes(req, res);
});

module.exports = router;
