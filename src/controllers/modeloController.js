var modeloModel = require("../models/modeloModel");

function listarModelos(req, res) {

    var idEmpresa = req.params.idEmpresa;

    if (idEmpresa == undefined) {
        res.status(400).send("O id da empresa está indefinido!");
    } else {

        modeloModel.listarModelos(idEmpresa)
            .then(function (resultado) {
                // affectedRows = 0 quando o código não existe ou a empresa ainda não tem responsável
                if (resultado.affectedRows == 0) {
                    return res.status(404).json("id da empresa não tem modelos");
                }

                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function atualizarModelo(req, res) {

    var idModelo = req.params.idModelo;
    var nome = req.body.nomeServer;
    var status = req.body.statusServer;

    if (idModelo == undefined) {
        res.status(400).send("O id do modelo está indefinido!");
    } else {
        modeloModel.atualizarModelo(nome, idModelo, status)
            .then(function (resultado) {
                // affectedRows = 0 quando o código não existe ou a empresa ainda não tem responsável
                if (resultado.length == 0) {
                    return res.status(404).json("Não teve campos passado para atualização");
                }

                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function cadastrarModelo(req, res) {

    var nome = req.body.nomeServer;
    var id_empresa = req.params.idEmpresa;

    if (id_empresa == undefined) {
        res.status(400).send("O id da empresa está indefinido!");
    }else if (nome == undefined || nome.trim().length <= 0) {
        res.status(400).send("O nome está indefinido")
    } else {
        modeloModel.cadastrarModelo(nome, id_empresa)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function deletarModelo(req, res) {

    var id_modelo = req.params.idModelo;

    if (id_modelo == undefined) {
        res.status(400).send("O id do modelo está indefinido!");
    } else {
        modeloModel.deletarModelo(id_modelo)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

module.exports = {
    listarModelos,
    atualizarModelo,
    cadastrarModelo,
    deletarModelo
}