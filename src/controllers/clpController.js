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

function listarClpPorId(req, res) {

    var idClp = req.params.idClp;

    if (idClp == undefined) {
        res.status(400).send("O id do clp está indefinido!");
    } else {
        clpModel.listarClpPorId(idClp)
            .then(function (resultado) {

                if (resultado.length == 0) {
                    return res.status(404).json("O id não é valido para um clp");
                }

                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

module.exports = {                                    
    listarClps,
    listarClpPorId
};