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

    if (cnpj == undefined || cnpj == "") {
        res.status(400).send("Seu cnpj está undefined!");
    } else if (codigo_ativacao == undefined || codigo_ativacao == "") {
        res.status(400).send("Seu codigo de ativação está undefined!");
    } else {

        empresaModel.autenticar(cnpj, codigo_ativacao)
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
    if (nome_fantasia == undefined || nome_fantasia == "") {
        res.status(400).send("O nome fantasia está indefinido!");
    } 
    else if(cnpj == undefined || cnpj == ""){
        res.status(400).send("O cnpj está indefinido!")
    }
    else if(razao_social == undefined || razao_social == ""){
        res.status(400).send("a razão social está undefined")
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
                if (erro.errno == 1062) {
                    res.status(409).send("CNPJ ou Código de ativação já cadastrado no sistema!");
                } else {
                    res.status(500).json(erro.sqlMessage);
                }
            });
    }
}

function atualizarPerfil(req, res) {
    let idEmpresa = req.params.idEmpresa;
    let nome_fantasia = req.body.nomeFantasiaServer;
    let razao_social = req.body.razaoSocialServer;


        empresaModel.atualizarPerfil(idEmpresa, nome_fantasia, razao_social)
            .then(function (resultadoUpdate) {
                if(!resultadoUpdate)
                return res.status(400).send("Nenhum dado válido foi enviado para atualização.")

                 if (resultadoUpdate.affectedRows == 0) {
                return res.status(404).send("Empresa não encontrada para atualização.");
            }  
                res.status(200).json("Perfil atualizado com sucesso!");
            

            }).catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
}

function buscarEmpresaPeloId(req, res) {
let idEmpresa = req.params.idEmpresa;

if (idEmpresa == undefined || isNaN(idEmpresa)) {
        res.status(400).send("O ID da empresa é inválido!");
        return;
    }

  empresaModel.buscarEmpresaPeloId(req.params.idEmpresa)
  .then(resultado => {
    
    if (resultado.length > 0) {
                res.json(resultado);
            } else {
                res.status(404).send("Nenhuma empresa encontrada com este ID.");
            }

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