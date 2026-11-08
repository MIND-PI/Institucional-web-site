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

function adicionarClp(req, res) {
    var nome = req.body.nomeServer;
    var localizacao = req.body.localizacaoServer;
    var status = req.body.statusServer;
    var modeloId = req.body.modeloServer;
    var empresaId = req.body.empresaServer;

    if (!nome || !localizacao || !modeloId || !empresaId || (status != 0 && status != 1)) {
        res.status(400).send("Preencha todos os campos obrigatórios!");
    } else {
        clpModel.adicionarClp(nome, localizacao, status, modeloId, empresaId)
            .then(function (resultado) { res.status(201).json(resultado); })
            .catch(function (erro) { console.log(erro); res.status(500).json(erro.sqlMessage); });
    }
}

module.exports = {                                    
    listarClps,
    listarModelosDisponiveis,
    adicionarClp
};