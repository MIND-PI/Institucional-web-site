var express = require("express");
var router = express.Router();
var clpController = require("../controllers/clpController");

//listar clps da empresa
router.get("/:idEmpresa", function (req, res){
    clpController.listarClps(req, res);
});

module.exports = router;