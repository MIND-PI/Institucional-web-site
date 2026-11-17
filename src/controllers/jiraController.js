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

module.exports = {
    listarChamados
};
