var clienteModel = require("../models/clienteModel");

function listarCliente(req, res) {

    var idEmpresa = req.params.idEmpresa;

    if (idEmpresa == undefined) {
        res.status(400).send("O id da empresa está indefinido!");
    } else {

        clienteModel.listarCliente(idEmpresa)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function atualizarCliente(req, res) {

    var idEmpresa = req.params.idEmpresa;
    var idCliente = req.params.idCliente;
    var nome_fantasia = req.body.nome_fantasia;
    var status = req.body.status;
    var setor = req.body.setor;
    var temNome = nome_fantasia != undefined && nome_fantasia.trim().length > 0;
    var temSetor = setor != undefined && setor.trim().length > 0;
    var temStatus = status !== undefined && status !== "" && [0, 1].includes(Number(status));

    if (idEmpresa == undefined || idCliente == undefined) {
        res.status(400).send("O id está indefinido!");
    } 
    else if(!temNome && !temSetor && !temStatus){
        res.status(400).send("Nenhum campo foi passado para atualização");
    }
    else {
        clienteModel.atualizarCliente(nome_fantasia, setor , status, idCliente, idEmpresa )
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function cnpjValido(cnpj) {
    if (typeof cnpj !== "string" || cnpj.length !== 14) {
        return false;
    }

    for (var i = 0; i < cnpj.length; i++) {
        if (cnpj[i] < "0" || cnpj[i] > "9") {
            return false;
        }
    }

    return true;
}

function cadastrarCliente(req, res) {

    var nome_fantasia = req.body.nome_fantasia;
    var idEmpresa = req.params.idEmpresa;
    var setor = req.body.setor;
    var cnpj = req.body.cnpj;

    if (idEmpresa == undefined) {
        res.status(400).send("O id da empresa está indefinido!");
    }
    else if (nome_fantasia == undefined || nome_fantasia.trim().length <= 0) {
        res.status(400).send("O nome está indefinido")
    }
    else if(setor == undefined || setor.trim().length <= 0){
        res.status(400).send("O setor está indefinido")
    }
    
    else if(!cnpjValido(cnpj)){
        res.status(400).send("O CNPJ precisa ter 14 números");
    }
    else {
        clienteModel.cadastrarCliente(nome_fantasia, setor, cnpj, idEmpresa)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                if (erro.code == "ER_DUP_ENTRY") {
                    
                return res.status(409).json("Esse cliente já está cadastrado");
                }
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function inativarCliente(req, res) {

    var idEmpresa = req.params.idEmpresa;
    var idCliente = req.params.idCliente;
    
    if (idEmpresa == undefined || idCliente == undefined) {
        res.status(400).send("O id do cliente está indefinido!");
    } else {
        clienteModel.inativarCliente(idEmpresa, idCliente)
            .then(function (resultado) {
                if (resultado.affectedRows == 0) {
                return res.status(404).json("Cliente não encontrado para este fornecedor");
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
    listarCliente,
    atualizarCliente,
    cadastrarCliente,
    inativarCliente
}