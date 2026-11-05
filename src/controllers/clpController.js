var clpModel = require("../models/clpModel");

var idEmpresa = req.params.idEmpresa;

if(idEmpresa == undefined || isNaN(idEmpresa)){
    res.status(400).send("...");
} else{
    clpModel.listarClps(idEmpresa)
    .then(
        function (resultado) {
        res.json(resultado);
    })
    .catch(
        function (erro){
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
    })
}