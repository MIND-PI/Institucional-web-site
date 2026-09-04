var usuarioModel = require("../models/usuarioModel");

function mensagemErro(erro) {
    if (!erro) return "Erro ao processar a requisição.";
    if (typeof erro === 'string') return erro;
    if (erro.sqlMessage) return erro.sqlMessage;
    if (erro.message) return erro.message;
    return JSON.stringify(erro);
}

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    } else {

        usuarioModel.autenticar(email, senha)
            .then(function (resultadoAutenticar) {

                console.log(`Resultados encontrados: ${resultadoAutenticar.length}`);

                if (resultadoAutenticar.length == 1) {

                    res.json({
                        id: resultadoAutenticar[0].id,
                        nome: resultadoAutenticar[0].nome,
                        email: resultadoAutenticar[0].email,
                        nivel: resultadoAutenticar[0].nivel,
                        codigoativacao: resultadoAutenticar[0].codigoativacao
                    });

                } else if (resultadoAutenticar.length == 0) {

                    res.status(403).send("Email e/ou senha inválido(s)");

                } else {

                    res.status(403).send("Mais de um usuário com o mesmo login e senha!");

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
   
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
    var codigoAtivacao = req.body.codigoServer; 

    if (codigoAtivacao == undefined) {
        res.status(400).send("O código de ativação está indefinido!");
    } else {

        usuarioModel.cadastrar(nome, email, senha, codigoAtivacao)
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
    autenticar,
    cadastrar
};