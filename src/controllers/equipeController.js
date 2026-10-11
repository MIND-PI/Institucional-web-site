var equipeModel = require("../models/equipeModel");

function mensagemErro(erro) {
    if (!erro) return "Erro ao processar a requisição.";
    if (typeof erro === 'string') return erro;
    if (erro.sqlMessage) return erro.sqlMessage;
    if (erro.message) return erro.message;
    return JSON.stringify(erro);
}

async function listar(req, res) {
    var idUsuario = Number(req.params.idUsuario);
    var busca = req.query.busca || "";

    if (isNaN(idUsuario)) {
        return res.status(400).json({ message: "O id do usuário é inválido!" });
    }

    try {
        var resultado = await equipeModel.listar(idUsuario, busca);
        return res.json(resultado);
    } catch (erro) {
        console.log(erro);
        return res.status(500).json({ message: mensagemErro(erro) });
    }
}

async function buscarCodigo(req, res) {
    var idUsuario = Number(req.params.idUsuario);

    if (isNaN(idUsuario)) {
        return res.status(400).json({ message: "O id do usuário é inválido!" });
    }

    try {
        var resultado = await equipeModel.buscarCodigo(idUsuario);

        if (resultado.length == 0) {
            return res.status(404).json({ message: "Empresa não encontrada para este usuário." });
        }

        return res.json({ codigo: resultado[0].codigo_ativacao });
    } catch (erro) {
        console.log(erro);
        return res.status(500).json({ message: mensagemErro(erro) });
    }
}

async function remover(req, res) {
    var idUsuario = Number(req.params.idUsuario);
    var idMembro = Number(req.params.idMembro);

    if (isNaN(idUsuario) || isNaN(idMembro)) {
        return res.status(400).json({ message: "Os ids informados são inválidos!" });
    }

    if (idUsuario == idMembro) {
        return res.status(400).json({ message: "Você não pode remover a si mesmo." });
    }

    try {
        // quem pede precisa ser administrador
        var logado = await equipeModel.buscarUsuario(idUsuario);

        if (logado.length == 0 || logado[0].cargo != "administrador") {
            return res.status(403).json({ message: "Apenas administradores podem remover membros." });
        }

        // o membro precisa ser da mesma empresa
        var membro = await equipeModel.buscarUsuario(idMembro);

        if (membro.length == 0 || membro[0].empresaId != logado[0].empresaId) {
            return res.status(404).json({ message: "Membro não encontrado na sua equipe." });
        }

        // a conta do responsável da empresa (responsavel NULL) é protegida
        if (membro[0].responsavel == null) {
            return res.status(403).json({ message: "A conta do responsável da empresa não pode ser removida." });
        }

        await equipeModel.remover(idMembro);

        return res.status(200).json({ message: "Membro removido com sucesso!" });
    } catch (erro) {
        console.log(erro);

        if (erro.errno == 1451) {
            return res.status(409).json({
                message: "Não é possível remover este membro porque ele é responsável por outros usuários."
            });
        }

        return res.status(500).json({ message: mensagemErro(erro) });
    }
}

module.exports = {
    listar,
    buscarCodigo,
    remover
};