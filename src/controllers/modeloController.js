var usuarioModel = require("../models/modeloModel");

function listarModelos(req, res) {

    var idEmpresa = req.params.idEmpresa;

    if (idEmpresa == undefined) {
        res.status(400).send("O id da empresa está indefinido!");
    } else {

        usuarioModel.listarModelos(idEmpresa)
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
        console.log(nome, status, idModelo)
        usuarioModel.atualizarModelo(nome, idModelo, status)
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

module.exports = {
    listarModelos,
    atualizarModelo
}