var express = require("express");
var router = express.Router();
var microModeloController = require("../controllers/microModeloController");

router.get("/:idFornecedor/:idModelo/:periodo", function (req, res) {
    microModeloController.buscarMicroModelo(req, res);
});

module.exports = router;