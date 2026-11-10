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

function listarTiposMedicao(req, res) {
    clpModel.listarTiposMedicao()
        .then(function (resultado) { res.json(resultado); })
        .catch(function (erro) { console.log(erro); res.status(500).json(erro.sqlMessage); });
}

function adicionarClp(req, res) {
    var nome = req.body.nomeServer;
    var localizacaoId = req.body.localizacaoServer;
    var status = req.body.statusServer;
    var modeloId = req.body.modeloServer;
    var empresaId = req.body.empresaServer;
    var medicoes = req.body.medicoesServer;

    if (!nome || !localizacao || !modeloId || !empresaId || (status != 0 && status != 1)) {
        res.status(400).send("Preencha todos os campos obrigatórios!");
        return;
    }

    if (!Array.isArray(medicoes) || medicoes.length == 0) {
        res.status(400).send("Escolha o que o CLP vai monitorar!");
        return;
    }

    // tudo que entra no SQL precisa ser número
    var invalida = medicoes.some(function (m) {
        return isNaN(m.tipoMedicaoId) || m.parametro === null || m.parametro === "" || isNaN(m.parametro);
    });
    if (invalida) {
        res.status(400).send("Medição com dados inválidos!");
        return;
    }

    // CPU (1), RAM (2) e Scan Time (5) são obrigatórias
    var ids = medicoes.map(function (m) { return Number(m.tipoMedicaoId); });
    if (![1, 2, 5].every(function (id) { return ids.includes(id); })) {
        res.status(400).send("CPU, RAM e Scan Time são obrigatórios!");
        return;
    }

    clpModel.adicionarClp(nome, localizacao, status, modeloId, empresaId, medicoes)
        .then(function (resultado) { res.status(201).json(resultado); })
        .catch(function (erro) { console.log(erro); res.status(500).json(erro.sqlMessage); });
}

function atualizarClp(req, res) {
    var idClp = req.params.idClp;
    var nome = req.body.nomeServer;
    var localizacaoId = req.body.localizacaoServer;
    var status = req.body.statusServer;
    var modeloId = req.body.modeloServer;
    var empresaId = req.body.empresaServer;

    if (idClp == undefined || isNaN(idClp)) {
        res.status(400).send("O id do CLP está indefinido ou inválido!");
    } else if (!nome || !localizacao || !modeloId || !empresaId || (status != 0 && status != 1)) {
        res.status(400).send("Preencha todos os campos obrigatórios!");
    } else {
        clpModel.atualizarClp(idClp, nome, localizacao, status, modeloId, empresaId)
            .then(function (resultado) { res.status(200).json(resultado); })
            .catch(function (erro) { console.log(erro); res.status(500).json(erro.sqlMessage); });
    }
}

function listarMedicoes(req, res) {
    var idClp = req.params.idClp;
    var idEmpresa = req.params.idEmpresa;

    if (isNaN(idClp) || isNaN(idEmpresa)) {
        res.status(400).send("Id do CLP ou da empresa inválido!");
    } else {
        clpModel.listarMedicoes(idClp, idEmpresa)
            .then(function (resultado) { res.json(resultado); })
            .catch(function (erro) { console.log(erro); res.status(500).json(erro.sqlMessage); });
    }
}

function salvarMedicoes(req, res) {
    var idClp = req.params.idClp;
    var empresaId = req.body.empresaServer;
    var medicoes = req.body.medicoesServer;

    if (isNaN(idClp) || isNaN(empresaId) || !Array.isArray(medicoes) || medicoes.length == 0) {
        res.status(400).send("Dados inválidos!");
        return;
    }

    // garantimos que tudo que entra é número, porque o sql é montado com texto
    var invalida = medicoes.some(function (m) {
        return isNaN(m.tipoMedicaoId) || isNaN(m.parametro) || (m.status != 0 && m.status != 1);
    });
    if (invalida) {
        res.status(400).send("Medição com dados inválidos!");
        return;
    }

    clpModel.clpPertenceEmpresa(idClp, empresaId)
        .then(function (resultado) {
            if (resultado.length == 0) {
                res.status(403).send("Esse CLP não pertence à sua empresa!");
                return;
            }

            return Promise.all(medicoes.map(function (m) {
                return clpModel.salvarMedicao(idClp, m.tipoMedicaoId, m.status, m.parametro);
            })).then(function () { res.status(200).send("Medições salvas!"); });
        })
        .catch(function (erro) { console.log(erro); res.status(500).json(erro.sqlMessage); });
}

function deletarClp(req, res) {
    var idClp = req.params.idClp;
    var empresaId = req.params.idEmpresa;

    if (idClp == undefined || isNaN(idClp) || empresaId == undefined || isNaN(empresaId)) {
        res.status(400).send("Id do CLP ou da empresa inválido!");
    } else {
        clpModel.deletarClp(idClp, empresaId)
            .then(function (resultado) { res.status(200).json(resultado); })
            .catch(function (erro) { console.log(erro); res.status(500).json(erro.sqlMessage); });
    }
}

function listarLocalizacoes(req, res){
    var idEmpresa = req.params.idEmpresa;

    if(idEmpresa == undefined || isNaN(idEmpresa)){
        res.status(400).send("Id da empresa está inválido ou indefinido")
    } else {
        clpModel.listarLocalizacoes(idEmpresa)
        .then(function (resultado){
            res.json(resultado);
        })
        .catch(function (erro){
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
    }
}

function adicionarLocalizacao(req, res){
    var idEmpresa = req.params.idEmpresa;
    var nome = (req.body.nomeServer || "").trim().replace(/\s+/g, " ");

    if(!nome || idEmpresa == undefined || isNaN(idEmpresa)){
        res.status(400).send("Informe o nome da localização");
        return;
    }

    clpModel.adicionarLocalizacao(nome, idEmpresa)
    .then(function (resultado){
        res.status(201).json(resultado);
    })
    .catch(function (erro){
        console.log(erro);
        // 1062 é chave duplicada (viola o UNIQUE da tabela localização)
        if(erro.errno == 1062){
            res.status(409).send("Essa localização já existe!");
        }
        else {
            res.status(500).json(erro.sqlMessage);
        }
    });
    
}



module.exports = {                                    
    listarClps,
    listarModelosDisponiveis,
    adicionarClp,
    atualizarClp,
    listarMedicoes,
    salvarMedicoes,
    listarTiposMedicao,
    deletarClp,
    adicionarLocalizacao,
    listarLocalizacoes
};