var microModeloModel = require("../models/microModeloModel");
var getS3 = require("../services/getS3");

var PERIODOS = ["24h", "7d", "30d"];

function nomeDaEmpresa(empresa) {
    if (!empresa) return "—";
    return empresa.nome_fantasia || empresa.nomeFantasia || empresa.razao_social
        || empresa.razaoSocial || empresa.nome || "—";
}

function setorDaEmpresa(empresa) {
    if (!empresa) return "—";
    return empresa.setor || empresa.ramo || empresa.segmento || "—";
}

async function buscarMicroModelo(req, res) {
    var idFornecedor = req.params.idFornecedor;
    var idModelo = req.params.idModelo;
    var periodo = req.params.periodo;

    // valida antes de montar a chave do S3 e o SQL
    if (!/^\d+$/.test(idFornecedor) || !/^\d+$/.test(idModelo) || !PERIODOS.includes(periodo)) {
        return res.status(400).json("Parâmetros inválidos");
    }

    try {
        var chave = `gold/id-empresa-${idFornecedor}/id-modelo-${idModelo}/dashboard-modelo/${periodo}/ultimo-resultado.json`;
        var dados = await getS3.getObject(chave);

        var modelo = await microModeloModel.buscarModelo(idModelo);
        var total = await microModeloModel.contarClps(idModelo);

        if (!dados) {
            // modelo existe, mas a ETL ainda não gerou nada para ele
            return res.status(404).json({
                semDados: true,
                modeloNome: modelo.length ? modelo[0].nome : null,
                totalClps: total[0].total
            });
        }

        var idsClp = dados.ranking.map(function (r) { return r.id_clp; });
        var clps = await microModeloModel.buscarClps(idsClp, idModelo);

        var idsEmpresa = [];
        clps.forEach(function (c) {
            if (idsEmpresa.indexOf(c.empresaId) == -1) idsEmpresa.push(c.empresaId);
        });
        var empresas = await microModeloModel.buscarEmpresas(idsEmpresa);

        dados.ranking = dados.ranking.map(function (r) {
            var clp = clps.find(function (c) { return c.idClp == r.id_clp; });
            var empresa = clp ? empresas.find(function (e) { return e.idEmpresa == clp.empresaId; }) : null;
            return Object.assign({}, r, {
                apelido: clp ? clp.nome : "CLP " + r.id_clp,
                cliente: nomeDaEmpresa(empresa),
                setor: setorDaEmpresa(empresa),
                localizacao: clp ? clp.localizacao : null
            });
        });

        dados.modeloNome = modelo.length ? modelo[0].nome : null;
        dados.totalClps = total[0].total;

        res.json(dados);
    } catch (erro) {
        console.log(erro);
        res.status(500).json(erro.sqlMessage || erro.message);
    }
}

module.exports = {
    buscarMicroModelo
};