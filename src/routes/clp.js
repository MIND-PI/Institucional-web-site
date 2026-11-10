var express = require("express");
var router = express.Router();
var clpController = require("../controllers/clpController");

router.get("/listarClps/:idEmpresa", function (req, res){
    clpController.listarClps(req, res);
});

//listar clp individualmente pelo id
router.get("/:idClp", function (req, res) {
    clpController.listarClpPorId(req, res)    
})

router.get("/micro-analise/:idClp/:idEmpresa", function (req, res) {
    clpController.microAnalise(req, res)
})

router.get("/listarModelosDisponiveis/:idEmpresa", function (req,res){
    clpController.listarModelosDisponiveis(req, res);
});

router.post("/adicionarClp", function(req, res){
    clpController.adicionarClp(req,res);
})

router.put("/atualizarClp/:idClp", function(req, res){
    clpController.atualizarClp(req,res);
})

router.get("/listarMedicoes/:idClp/:idEmpresa", function (req, res){
    clpController.listarMedicoes(req, res);
});

router.put("/salvarMedicoes/:idClp", function (req, res){
    clpController.salvarMedicoes(req, res);
});

router.get("/listarTiposMedicao", function (req, res) {
    clpController.listarTiposMedicao(req, res);
});

router.delete("/deletarClp/:idClp/:idEmpresa", function (req, res){
    clpController.deletarClp(req, res);
});

router.get("/listarLocalizacoes/:idEmpresa", function (req, res){
    clpController.listarLocalizacoes(req, res);
});

router.post("/adicionarLocalizacao/:idEmpresa", function (req, res){
    clpController.adicionarLocalizacao(req, res);
});

module.exports = router;