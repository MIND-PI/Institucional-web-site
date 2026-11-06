var clpModel = require("../models/clpModel");

function listarClps(req, res) {

    var idEmpresa = req.params.idEmpresa;

    if (idEmpresa == undefined || isNaN(idEmpresa)) {
        res.status(400).send("O id da empresa está indefinido ou inválido!");
    } else {
        clpModel.listarClps(idEmpresa)
            .then(function (resultado) { res.json(resultado); })
            .catch(function (erro) { console.log(erro); res.status(500).json(erro.sqlMessage); });
    }
}

function listarModelosDisponiveis(req, res) {

    var idEmpresa = req.params.idEmpresa;

    if (idEmpresa == undefined || isNaN(idEmpresa)) {
        res.status(400).send("O id da empresa está indefinido ou inválido!");
    } else {
        clpModel.listarModelosDisponiveis(idEmpresa)
            .then(function (resultado) { res.json(resultado); })
            .catch(function (erro) { console.log(erro); res.status(500).json(erro.sqlMessage); });
    }
}

module.exports = {                                    
    listarClps,
    listarModelosDisponiveis
};