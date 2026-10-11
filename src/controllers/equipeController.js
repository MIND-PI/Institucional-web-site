var equipeModel = require("../models/equipeModel");
const getUrlS3 = require("../services/getS3");

function mensagemErro(erro) {
    if (!erro) return "Erro ao processar a requisição.";
    if (typeof erro === 'string') return erro;
    if (erro.sqlMessage) return erro.sqlMessage;
    if (erro.message) return erro.message;
    return JSON.stringify(erro);
}

// só administrador acessa a equipe
async function ehAdministrador(idUsuario) {
    var usuario = await equipeModel.buscarUsuario(idUsuario);

    return usuario.length > 0 && usuario[0].cargo == "administrador";
}

// Confere se o usuário logado pode mexer no membro (editar ou remover).
// Devolve null se pode, ou { status, message } com o motivo de não poder.
async function validarGerenciamento(idUsuario, idMembro, acao) {
    var logado = await equipeModel.buscarUsuario(idUsuario);

    // 1) quem pede precisa ser administrador
    if (logado.length == 0 || logado[0].cargo != "administrador") {
        return { status: 403, message: `Apenas administradores podem ${acao} membros.` };
    }

    // 2) o membro precisa ser da mesma empresa
    var membro = await equipeModel.buscarUsuario(idMembro);

    if (membro.length == 0 || membro[0].empresaId != logado[0].empresaId) {
        return { status: 404, message: "Membro não encontrado na sua equipe." };
    }

    // 3) a conta do responsável da empresa (responsavel NULL) é protegida
    if (membro[0].responsavel == null) {
        var texto = acao == "remover" ? "removida" : "editada";
        return { status: 403, message: `A conta do responsável da empresa não pode ser ${texto}.` };
    }

    // 4) administrador comum só mexe em funcionário;
    //    para mexer em outro administrador é preciso ser o responsável da empresa
    var logadoEhResponsavel = logado[0].responsavel == null;

    if (membro[0].cargo == "administrador" && !logadoEhResponsavel) {
        return { status: 403, message: `Apenas o responsável da empresa pode ${acao} outro administrador.` };
    }

    return null;
}

async function listar(req, res) {
    var idUsuario = Number(req.params.idUsuario);
    var busca = req.query.busca || "";

    if (isNaN(idUsuario)) {
        return res.status(400).json({ message: "O id do usuário é inválido!" });
    }

    try {
        if (!(await ehAdministrador(idUsuario))) {
            return res.status(403).json({ message: "Apenas administradores podem acessar a equipe." });
        }

        var resultado = await equipeModel.listar(idUsuario, busca);

        // url_img guarda só o nome do arquivo no bucket: gera a URL de cada foto.
        // Sem foto (ou se der erro ao gerar a URL) imgUrl = null e o front mostra a inicial.
        var membros = await Promise.all(resultado.map(async function (membro) {
            var imgUrl = null;

            if (membro.url_img) {
                try {
                    imgUrl = await getUrlS3(membro.url_img);
                } catch (erro) {
                    console.log(erro);
                }
            }

            var { url_img, ...dados } = membro;
            return { ...dados, imgUrl: imgUrl };
        }));

        return res.json(membros);
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
        if (!(await ehAdministrador(idUsuario))) {
            return res.status(403).json({ message: "Apenas administradores podem acessar a equipe." });
        }

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

async function editar(req, res) {
    var idUsuario = Number(req.params.idUsuario);
    var idMembro = Number(req.params.idMembro);
    var nome = req.body.nomeServer;
    var cargo = req.body.cargoServer;

    if (isNaN(idUsuario) || isNaN(idMembro)) {
        return res.status(400).json({ message: "Os ids informados são inválidos!" });
    }

    if (nome == undefined || nome.trim() == "") {
        return res.status(400).json({ message: "O nome é obrigatório!" });
    }

    if (cargo != "administrador" && cargo != "funcionario") {
        return res.status(400).json({ message: "Cargo inválido!" });
    }

    if (idUsuario == idMembro) {
        return res.status(400).json({ message: "Para editar sua própria conta, use as configurações de usuário." });
    }

    try {
        var bloqueio = await validarGerenciamento(idUsuario, idMembro, "editar");

        if (bloqueio) {
            return res.status(bloqueio.status).json({ message: bloqueio.message });
        }

        await equipeModel.editar(idMembro, nome, cargo);

        return res.status(200).json({ message: "Membro atualizado com sucesso!" });
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
        var bloqueio = await validarGerenciamento(idUsuario, idMembro, "remover");

        if (bloqueio) {
            return res.status(bloqueio.status).json({ message: bloqueio.message });
        }

        await equipeModel.remover(idMembro);

        return res.status(200).json({ message: "Membro removido com sucesso!" });
    } catch (erro) {
        console.log(erro);

        // 1451 = existem outros usuários apontando para este em "responsavel"
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
    editar,
    remover
};