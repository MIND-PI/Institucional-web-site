var express = require("express");
var router = express.Router();
var modeloController = require("../controllers/modeloController");

// listar modelos do fornecedor
router.get("/:idEmpresa", function (req, res) {
    modeloController.listarModelos(req, res);
});

router.put("/atualizar/:idModelo", function (req, res) {
    modeloController.atualizarModelo(req, res);
});

router.post("/cadastrar/:idEmpresa", function (req, res) {
    modeloController.cadastrarModelo(req, res);
});

router.delete("/deletar/:idModelo", function (req, res) {
    modeloController.deletarModelo(req, res);
});

module.exports = router;