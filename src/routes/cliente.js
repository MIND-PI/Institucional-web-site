var express = require("express");
var router = express.Router();
var clienteController = require("../controllers/clienteController");

// listar clientes
router.get("/:idEmpresa", function (req, res) {
    clienteController.listarCliente(req, res);
});

router.put("/atualizar/:idEmpresa/:idCliente", function (req, res) {
    clienteController.atualizarCliente(req, res);
});

router.post("/cadastrar/:idEmpresa", function (req, res) {
    clienteController.cadastrarCliente(req, res);
});

router.put("/inativar/:idEmpresa/:idCliente", function (req, res) {
    clienteController.inativarCliente(req, res);
});



module.exports = router;