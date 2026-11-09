var express = require("express");
var router = express.Router();
var clpController = require("../controllers/clpController");

//listar clps da empresa
router.get("/:idEmpresa", function (req, res){
    clpController.listarClps(req, res);
});

//listar clp individualmente pelo id
router.get("/id-individual/:idClp", function (req, res) {
    clpController.listarClpPorId(req, res)    
})

router.get("/micro-analise/:idClp/:idEmpresa", function (req, res) {
    clpController.microAnalise(req, res)
})

module.exports = router;