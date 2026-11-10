var clpModel = require("../models/clpModel");
var getS3 = require("../services/getS3")

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

async function microAnalise(req, res) {
    let idEmpresa = req.params.idEmpresa
    let idClp = req.params.idClp

    if (idEmpresa == null) {
        res.status(400).send("O id da empresa está indefinido!");
        return
    }

    if (idClp == null) {
        res.status(400).send("O id do clp está indefinido!");
        return
    }


    let json_object = await getS3.getMostRecentObject(`gold/id-empresa-${idEmpresa}/id-clp-${idClp}/clp-micro/`)

    if (json_object == null) {
        res.status(400).send("Não foi encontrado dados ao buscar arquivos com a data atual")
        return
    }
    console.log(json_object)
    let object = await getS3.getObject(json_object["Key"])
    
    if (object == null) {
        res.status(400).send("Não foi encontrado dados buscando o json específico")
        return
    }
    
    console.log(object)
    res.json(object)
}

module.exports = {
    listarClps,
    listarClpPorId,
    microAnalise
};