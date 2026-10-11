var express = require("express");
var router = express.Router();
var equipeController = require("../controllers/equipeController");

// Código de ativação da empresa do usuário logado
router.get("/codigo/:idUsuario", function (req, res) {
    equipeController.buscarCodigo(req, res);
});

// Lista os membros da empresa do usuário logado (aceita ?busca=nome)
router.get("/:idUsuario", function (req, res) {
    equipeController.listar(req, res);
});

// Remove um membro (idUsuario = quem está logado, idMembro = quem será removido)
router.delete("/:idUsuario/:idMembro", function (req, res) {
    equipeController.remover(req, res);
});

module.exports = router;