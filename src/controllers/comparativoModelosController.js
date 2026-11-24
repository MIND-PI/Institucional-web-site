var comparativoModelosModel = require("../models/comparativoModelosModel");
const { getJsonS3 } = require("../services/getS3");

var PERIODOS_VALIDOS = ["24h", "7d", "30d"];

// todos | setor-{slug} | empresa-{id}  (o mesmo formato que o ETL grava no bucket)
var FILTRO_VALIDO = /^(todos|setor-[a-z0-9-]+|empresa-\d+)$/;

function mensagemErro(erro) {
    if (!erro) return "Erro ao processar a requisição.";
    if (typeof erro === 'string') return erro;
    if (erro.sqlMessage) return erro.sqlMessage;
    if (erro.message) return erro.message;
    return JSON.stringify(erro);
}

// Descobre a empresa pelo usuário logado (nunca confia em um id de empresa vindo do front)
// e confere se ela é fornecedora. Devolve { idEmpresa } ou { erro: { status, message } }.
async function buscarEmpresaFornecedor(idUsuario) {
    var usuario = await comparativoModelosModel.buscarUsuarioEmpresa(idUsuario);

    if (usuario.length == 0) {
        return { erro: { status: 404, message: "Usuário não encontrado." } };
    }

    if (String(usuario[0].tipo).toLowerCase() != "fornecedor") {
        return { erro: { status: 403, message: "Apenas fornecedores podem acessar o comparativo de modelos." } };
    }

    return { idEmpresa: usuario[0].empresaId };
}

// O JSON do ETL vem com "nome": null nos modelos. Aqui o nome é preenchido com o do banco.
function aplicarNomes(dados, modelos) {
    var nomes = {};

    modelos.forEach(function (modelo) {
        nomes[modelo.idModelo] = modelo.nome;
    });

    function nomeDe(idModelo) {
        return nomes[idModelo] || ("Modelo " + idModelo);
    }

    (dados.ranking || []).forEach(function (item) {
        item.nome = nomeDe(item.id_modelo);
    });

    var linhas = (dados.mapa_problemas && dados.mapa_problemas.linhas) || [];
    linhas.forEach(function (item) {
        item.nome = nomeDe(item.id_modelo);
    });

    (dados.variacao || []).forEach(function (item) {
        item.nome = nomeDe(item.id_modelo);
    });

    return dados;
}

// Opções dos filtros de setor e empresa (arquivo filtros.json gerado pelo ETL)
async function filtros(req, res) {
    var idUsuario = Number(req.params.idUsuario);

    if (!Number.isInteger(idUsuario)) {
        return res.status(400).json({ message: "O id do usuário é inválido!" });
    }

    try {
        var empresa = await buscarEmpresaFornecedor(idUsuario);

        if (empresa.erro) {
            return res.status(empresa.erro.status).json({ message: empresa.erro.message });
        }

        var chave = `gold/id-empresa-${empresa.idEmpresa}/comparativo-modelos/filtros.json`;
        var dados = await getJsonS3(chave);

        if (dados == null) {
            return res.status(404).json({ message: "Ainda não há dados de comparativo para esta empresa." });
        }

        return res.json(dados);
    } catch (erro) {
        console.log(erro);
        return res.status(500).json({ message: mensagemErro(erro) });
    }
}

// Resultado do comparativo para um período e um filtro (?periodo=24h&filtro=todos)
async function comparativo(req, res) {
    var idUsuario = Number(req.params.idUsuario);
    var periodo = req.query.periodo || "24h";
    var filtro = req.query.filtro || "todos";

    if (!Number.isInteger(idUsuario)) {
        return res.status(400).json({ message: "O id do usuário é inválido!" });
    }

    if (!PERIODOS_VALIDOS.includes(periodo)) {
        return res.status(400).json({ message: "Período inválido! Use 24h, 7d ou 30d." });
    }

    // o filtro entra na chave do S3, então só aceita o formato exato que o ETL grava
    if (!FILTRO_VALIDO.test(filtro)) {
        return res.status(400).json({ message: "Filtro inválido!" });
    }

    try {
        var empresa = await buscarEmpresaFornecedor(idUsuario);

        if (empresa.erro) {
            return res.status(empresa.erro.status).json({ message: empresa.erro.message });
        }

        var chave = `gold/id-empresa-${empresa.idEmpresa}/comparativo-modelos/${periodo}/${filtro}/ultimo-resultado.json`;
        var dados = await getJsonS3(chave);

        if (dados == null) {
            return res.status(404).json({ message: "Ainda não há dados para este período e filtro." });
        }

        var modelos = await comparativoModelosModel.listarModelos(empresa.idEmpresa);

        return res.json(aplicarNomes(dados, modelos));
    } catch (erro) {
        console.log(erro);
        return res.status(500).json({ message: mensagemErro(erro) });
    }
}

module.exports = {
    filtros,
    comparativo
};