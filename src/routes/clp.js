var express = require("express");
var router = express.Router();
var clpController = require("../controllers/clpController");

//listar clps da empresa
router.get("/listarClps/:idEmpresa", function (req, res){
    clpController.listarClps(req, res);
});

//listar modelos disponíveis
router.get("/listarModelosDisponiveis/:idEmpresa", function (req,res){
    clpController.listarModelosDisponiveis(req, res);
});

//adicionar clp
router.post("/adicionarClps", function(req, res){
    clpController.adicionarClp(req,res);
})

module.exports = router;