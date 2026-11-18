var jiraService = require("../services/jiraService");

async function listarChamados(req, res) {
    try {
        var chamados = await jiraService.consultarJira();
        res.status(200).json(chamados);
    } catch (erro) {
        console.error("Erro ao consultar Jira:", erro.message);
        res.status(500).json({
            erro: "Não foi possível consultar os chamados do Jira."
        });
    }
}

async function listasAlertasClp(req, res) {
    let nome_clp = req.params.nomeClp
    let mac = req.params.mac
    let periodo = req.params.periodo

    try {
        var chamados = await jiraService.consultarAlertasClp(periodo, nome_clp, mac);
        console.log(chamados)
        res.status(200).json(chamados);
    } catch (erro) {
        console.error("Erro ao consultar Jira:", erro.message);
        res.status(500).json({
            erro: "Não foi possível consultar os chamados do Jira."
        });
    }
}

module.exports = {
    listarChamados,
    listasAlertasClp
};
