var empresaModel = require("../models/empresaModel");

function mensagemErro(erro) {
    if (!erro) return "Erro ao processar a requisição.";
    if (typeof erro === 'string') return erro;
    if (erro.sqlMessage) return erro.sqlMessage;
    if (erro.message) return erro.message;
    return JSON.stringify(erro);
}

function autenticar(req, res) {
    var cnpj = req.body.cnpjServer;
    var codigo_ativacao = req.body.codigo_ativacaoServer;

    if (cnpj == undefined) {
        res.status(400).send("Seu cnpj está undefined!");
    } else if (codigo_ativacao == undefined) {
        res.status(400).send("Seu codigo de ativação está undefined!");
    } else {

        empresaModel.autenticar(codigo_ativacao)
            .then(function (resultadoAutenticar) {

                console.log(`Resultados encontrados: ${resultadoAutenticar.length}`);

                if (resultadoAutenticar.length == 1) {

                    res.json({
                        idEmpresa: resultadoAutenticar[0].idEmpresa,
                        nome_fantasia: resultadoAutenticar[0].nome_fantasia,
                        cnpj: resultadoAutenticar[0].cnpj,
                        codigoativacao: resultadoAutenticar[0].codigo_ativacao
                    });

                } else if (resultadoAutenticar.length == 0) {

                    res.status(403).send("cnpj e/ou codigo de ativação inválido(s)");

                } 

            }).catch(function (erro) {

                console.log(erro);

                res.status(500).json({
                    message: mensagemErro(erro)
                });

            });
    }
}


// src/controllers/usuarioController.js

function cadastrar(req, res) {
    var codigoAtivacaoGerado = "M-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    var nome_fantasia = req.body.nomeFantasiaServer;
    var cnpj = req.body.cnpjServer;
    var razao_social = req.body.razaoSocialServer
    if (nome_fantasia == undefined) {
        res.status(400).send("O nome fantasia está indefinido!");
    } 
    else if(cnpj == undefined){
        res.status(400).send("O cnpj está indefinido!")
    }
    else {

        empresaModel.cadastrar(nome_fantasia,razao_social, cnpj, codigoAtivacaoGerado)
            .then(function (resultado) {
                res.json({
                    codigoAtivacao: codigoAtivacaoGerado,
                    resultado: resultado
                });
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function atualizarPerfil(req, res) {
    let idEmpresa = req.params.idEmpresa;
    let nome_fantasia = req.body.nomeFantasiaServer;
    let razao_social = req.body.razaoSocialServer;
    let cnpj = req.body.cnpjServer;    


        empresaModel.atualizarPerfil(idEmpresa, nome_fantasia, razao_social, cnpj)
            .then(function (resultadoUpdate) {
                res.status(200).json("Perfil atualizado com sucesso!");
            }).catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
}

function buscarEmpresaPeloId(req, res) {
  console.log(req.params.idEmpresa);
  empresaModel.buscarEmpresaPeloId(req.params.idEmpresa)
  .then(resultado => {
    res.json(resultado);
  }).catch(err => {
    res.status(500).send(err);
  });
}



module.exports = {
    autenticar,
    cadastrar,
    atualizarPerfil,
    buscarEmpresaPeloId
};