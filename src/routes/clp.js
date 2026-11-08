var express = require("express");
var router = express.Router();
var clpController = require("../controllers/clpController");

router.get("/listarClps/:idEmpresa", function (req, res){
    clpController.listarClps(req, res);
});

router.get("/listarModelosDisponiveis/:idEmpresa", function (req,res){
    clpController.listarModelosDisponiveis(req, res);
});

router.post("/adicionarClp", function(req, res){
    clpController.adicionarClp(req,res);
})

router.put("/atualizarClp/:idClp", function(req, res){
    clpController.atualizarClp(req,res);
})

module.exports = router;