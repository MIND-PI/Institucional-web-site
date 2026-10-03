var usuarioModel = require("../models/usuarioModel");
var uploadS3 = require("../services/uploadS3")
const getUrlS3 = require("../services/getS3");

function mensagemErro(erro) {
    if (!erro) return "Erro ao processar a requisição.";
    if (typeof erro === 'string') return erro;
    if (erro.sqlMessage) return erro.sqlMessage;
    if (erro.message) return erro.message;
    return JSON.stringify(erro);
}

async function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {
        return res.status(400).send("Seu email está undefined!");
    }

    if (senha == undefined) {
        return res.status(400).send("Sua senha está undefined!");
    }

    try {
        var resultado = await usuarioModel.autenticar(email, senha);

        if (resultado.length == 1) {

            let url_img = null;

            if (resultado[0].url_img) {
                url_img = await getUrlS3(resultado[0].url_img);
            }

            return res.json({
                id: resultado[0].idUsuario,
                nome: resultado[0].nome,
                email: resultado[0].email,
                imgUrl: url_img,
                codigoativacao: resultado[0].codigoativacao
            });

        } else if (resultado.length == 0) {

            return res.status(403).send("Email e/ou senha inválido(s)");

        } else {

            return res.status(403).send(
                "Mais de um usuário com o mesmo login e senha!"
            );
        }

    } catch (erro) {

        console.log(erro);

        return res.status(500).json({
            message: mensagemErro(erro)
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

async function atualizarPerfil(req, res) {
    let id = req.params.id;
    let nome = req.body.nomeServer;
    let senha = req.body.senhaServer;
    let imgFile = req.file;
    let imgName = null
    console.log("ESSE é o ID:" + id)

    if (imgFile) {
        imgName = await uploadS3(imgFile)
    }


    usuarioModel.atualizarPerfil(id, nome, senha, imgName)
        .then(function (resultadoUpdate) {
            res.status(200).json("Perfil atualizado com sucesso!");
        }).catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });

}

async function buscarUsuarioPeloId(req, res) {
    try {
        let resultado = await usuarioModel.buscarUsuarioPeloId(req.params.id)

        let usuario = resultado[0]

        let imgUrl = null

        if (usuario.url_img) {
            imgUrl = await getUrlS3(usuario.url_img)
        }

        res.json([{
            idUsuario: usuario.idUsuario,
            nome: usuario.nome,
            email: usuario.email,
            empresaId: usuario.empresaId,
            cargo: usuario.cargo,
            responsavel: usuario.responsavel,
            imgUrl: imgUrl
        }]);

    } catch (err) {

        console.log(err);
        res.status(500).send(err);

    }
}

// function buscarUsuarioPeloId(req, res) {
//   usuarioModel.buscarUsuarioPeloId(req.params.id)

//   .then(resultado => {
//     let imgUrl = null
//     let usuario = 
//     if (resultado.url_img) {
//         console.log("ENTREI")
//         imgUrl = getUrlS3(resultado.url_img)
//     }
//     console.log("IMAGEM:" + imgUrl)
//     res.json(
//         resultado.idUsuario,
//         resultado.nome,
//         resultado.email,
//         resultado.empresaId,
//         resultado.cargo,
//         resultado.responsavel,
//         imgUrl
//     );
//   }).catch(err => {
//     res.status(500).send(err);
//   });
// }



module.exports = {
    autenticar,
    cadastrar,
    atualizarPerfil,
    buscarUsuarioPeloId
};