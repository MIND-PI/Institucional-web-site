var express = require("express");
var router = express.Router();
var comparativoModelosController = require("../controllers/comparativoModelosController");

// Opções dos dropdowns de setor e empresa (idUsuario = fornecedor logado)
router.get("/filtros/:idUsuario", function (req, res) {
    comparativoModelosController.filtros(req, res);
});

// Resultado do comparativo (aceita ?periodo=24h|7d|30d&filtro=todos|setor-xxx|empresa-N)
router.get("/:idUsuario", function (req, res) {
    comparativoModelosController.comparativo(req, res);
});

module.exports = router;
