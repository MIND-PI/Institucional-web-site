// Controller dos chamados do Jira dos clientes de um fornecedor.

var jiraFornecedorService = require("../services/jiraServiceFornecedor");

function idEmpresaValido(idEmpresa) {
    var numero = Number(idEmpresa);
    return Number.isInteger(numero) && numero > 0;
}

async function listarChamadosClientes(req, res) {
    var idEmpresa = req.params.idEmpresa;

    if (!idEmpresaValido(idEmpresa)) {
        return res.status(400).send("O id da empresa está inválido!");
    }

    try {
        var resposta = await jiraFornecedorService.consultarJiraFornecedor(Number(idEmpresa));
        return res.status(200).json(resposta);
    } catch (erro) {
        console.error("Erro ao consultar os Jiras dos clientes:", erro.message);
        return res.status(500).json({
            erro: "Não foi possível consultar os chamados do Jira dos clientes."
        });
    }
}

module.exports = {
    listarChamadosClientes
};
