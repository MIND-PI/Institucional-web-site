var express = require("express");
var router = express.Router();
var macroClpController = require("../controllers/macroClpController");

// listar modelos do fornecedor
router.get("/macro-clp", function (req, res) {
    macroClpController.obterMacroClp(req, res);
});

module.exports = router;